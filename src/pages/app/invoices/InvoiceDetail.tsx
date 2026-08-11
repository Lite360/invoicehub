import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import InvoicePreview from '@/components/invoices/InvoicePreview';
import { useGeneratePDF } from '@/hooks/useGeneratePDF';

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  draft:     'bg-gray-100 text-gray-600',
  sent:      'bg-blue-100 text-blue-700',
  paid:      'bg-green-100 text-green-700',
  overdue:   'bg-red-100 text-red-700',
  cancelled: 'bg-zinc-100 text-zinc-500',
};

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { generateAndUpload, isGenerating } = useGeneratePDF();
  const [sendingEmail, setSendingEmail] = useState(false);

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
      navigate('/app/invoices');
    },
  });

  const markPaid = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ status: 'paid', paidAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoice', id] }),
  });

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
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handlePrint = () => window.print();

  const handleSendEmail = async () => {
    if (!invoice?.clientEmail) {
      alert('This customer does not have an email address associated with the invoice.');
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
      alert('Invoice sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Invoice not found.</p>
        <Link to="/app/invoices" className="text-blue-600 hover:underline mt-4 block">← Back to invoices</Link>
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
            <Button
              variant="outline"
              className="text-green-700 border-green-300 hover:bg-green-50"
              onClick={() => markPaid.mutate()}
              disabled={markPaid.isPending}
            >
              ✓ Mark as Paid
            </Button>
          )}
          <Button
            variant="outline"
            className="text-blue-700 border-blue-300 hover:bg-blue-50"
            onClick={handleSendEmail}
            disabled={sendingEmail}
          >
            {sendingEmail ? '⏳ Sending...' : '✉️ Send Email'}
          </Button>
          <Button variant="outline" onClick={handlePrint}>🖨️ Print</Button>
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={isGenerating}
          >
            {isGenerating ? '⏳ Generating...' : '📥 Download PDF'}
          </Button>
          {invoice.pdfUrl && (
            <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                🔗 View Last PDF
              </Button>
            </a>
          )}
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

      {/* Invoice Preview — id needed for html2pdf targeting */}
      <div id="invoice-preview">
        <InvoicePreview invoice={invoice} />
      </div>
    </div>
  );
}
