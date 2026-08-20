import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import InvoicePreview from '@/components/invoices/InvoicePreview';
import { useGeneratePDF } from '@/hooks/useGeneratePDF';

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  draft:     'bg-gray-100 text-gray-600',
  sent:      'bg-emerald-100 text-emerald-700',
  paid:      'bg-green-100 text-green-700',
  overdue:   'bg-red-100 text-red-700',
  cancelled: 'bg-zinc-100 text-zinc-500',
};

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { generateAndUpload, isGenerating } = useGeneratePDF();
  
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const res = await fetch(`/api/invoices/${id}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Not found');
      return res.json();
    },
    enabled: !!session && !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      success('Invoice deleted');
      navigate('/app/invoices');
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to record payment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      success('Payment recorded successfully');
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentReference('');
    },
    onError: (err: Error) => toastError(err.message),
  });

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toastError('Please enter a valid amount');
      return;
    }
    if (Number(paymentAmount) > Number(invoice?.balanceDue)) {
      toastError('Payment amount cannot exceed balance due');
      return;
    }
    recordPaymentMutation.mutate({
      invoiceId: id,
      customerId: invoice?.customerId,
      clientName: invoice?.clientName,
      amount: paymentAmount,
      currency: invoice?.currency,
      paymentMethod,
      reference: paymentReference,
      paymentDate,
      status: 'completed',
    });
  };

  const handleDownloadPDF = async () => {
    try {
      const url = await generateAndUpload({
        elementId: 'invoice-preview',
        docId: id!,
        docType: 'invoice',
        filename: `${invoice.invoiceNumber}.pdf`,
      });
      window.open(url, '_blank');
    } catch {
      toastError('Failed to generate PDF. Please try again.');
    }
  };

  const handlePrint = () => window.print();

  const handleSendEmail = async () => {
    if (!invoice?.clientEmail) {
      toastError('This customer does not have an email address associated with the invoice.');
      return;
    }
    setSendingEmail(true);
    try {
      const res = await fetch('/api/invoices/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ invoiceId: id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send email');
      }
      success('Invoice sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const copyPaymentLink = () => {
    const link = `${window.location.origin}/pay/${id}`;
    navigator.clipboard.writeText(link);
    success('Payment link copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Invoice not found.</p>
        <Link to="/app/invoices" className="text-emerald-600 hover:underline mt-4 block">← Back to invoices</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link to="/app/invoices" className="text-gray-500 hover:text-gray-700 text-sm">
            ← Invoices
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-mono font-medium">{invoice.invoiceNumber}</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[invoice.status as InvoiceStatus]}`}>
            {invoice.status}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {invoice.status !== 'paid' && (
            <>
              <Button variant="outline" className="text-emerald-700 border-emerald-300 hover:bg-emerald-50" onClick={() => {
                setPaymentAmount(invoice.balanceDue);
                setShowPaymentModal(true);
              }}>
                💵 Record Payment
              </Button>
              <Button variant="outline" onClick={copyPaymentLink}>
                🔗 Copy Link
              </Button>
            </>
          )}
          <Button
            variant="outline"
            className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
            onClick={handleSendEmail}
            disabled={sendingEmail}
          >
            {sendingEmail ? '⏳ Sending...' : '✉️ Send'}
          </Button>
          <Button variant="outline" onClick={handlePrint}>🖨️ Print</Button>
          <Button variant="outline" onClick={handleDownloadPDF} disabled={isGenerating}>
            {isGenerating ? '⏳...' : '📥 PDF'}
          </Button>
          <Link to={`/app/invoices/${id}/edit`}>
            <Button variant="outline">✏️ Edit</Button>
          </Link>
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => { if (confirm('Delete this invoice?')) deleteMutation.mutate(); }}
            disabled={deleteMutation.isPending}
          >
            🗑️ Delete
          </Button>
        </div>
      </div>

      {/* Invoice Preview */}
      <div id="invoice-preview" className="shadow-2xl rounded-2xl overflow-hidden border border-gray-100 bg-white">
        <InvoicePreview invoice={invoice} />
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">Record Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount Paid ({invoice.currency})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-slate-500 mt-1">Balance due: {invoice.currency} {Number(invoice.balanceDue).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="card">Card (External)</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reference (Optional)</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={e => setPaymentReference(e.target.value)}
                  placeholder="e.g. Transaction ID or Cheque No."
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={recordPaymentMutation.isPending}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm disabled:opacity-60">
                  {recordPaymentMutation.isPending ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
