import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import InvoicePreview from '@/components/invoices/InvoicePreview';
import { useGeneratePDF } from '@/hooks/useGeneratePDF';

type ReceiptStatus = 'issued' | 'cancelled';

const STATUS_STYLES: Record<ReceiptStatus, string> = {
  issued:     'bg-green-100 text-green-700',
  cancelled:  'bg-zinc-100 text-zinc-500',
};

export default function ReceiptDetail() {
  const { id } = useParams<{ id: string }>();
  const { session, business, branding } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { generateAndUpload, isGenerating } = useGeneratePDF();

  const { data: receipt, isLoading } = useQuery({
    queryKey: ['receipt', id],
    queryFn: async () => {
      const res = await fetch(`/api/receipts/${id}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Not found');
      return res.json();
    },
    enabled: !!session && !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/receipts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      navigate('/app/receipts');
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/receipts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['receipt', id] }),
  });

  const handleDownloadPDF = async () => {
    try {
      const url = await generateAndUpload({
        elementId: 'receipt-preview',
        docId: id!,
        docType: 'receipt',
        filename: `${receipt.receiptNumber}.pdf`,
      });
      window.open(url, '_blank');
    } catch {
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Receipt not found.</p>
        <Link to="/app/receipts" className="text-emerald-600 hover:underline mt-4 block">← Back to receipts</Link>
      </div>
    );
  }

  // Map receipt to invoice format for the preview component
  const previewData = {
    ...receipt,
    invoiceNumber: receipt.receiptNumber,
    amountPaid: receipt.total,
    balanceDue: 0,
    paymentTerms: `Payment Method: ${receipt.paymentMethod.toUpperCase()}`,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link to="/app/receipts" className="text-gray-500 hover:text-gray-700 text-sm">
            ← Receipts
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-mono font-medium">{receipt.receiptNumber}</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[receipt.status as ReceiptStatus]}`}>
            {receipt.status}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {receipt.status !== 'cancelled' && (
            <Button
              variant="outline"
              className="text-red-700 border-red-300 hover:bg-red-50"
              onClick={() => { if(confirm('Cancel this receipt?')) updateStatus.mutate('cancelled'); }}
              disabled={updateStatus.isPending}
            >
              ✗ Cancel Receipt
            </Button>
          )}

          <Button variant="outline" onClick={handlePrint}>🖨️ Print</Button>
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={isGenerating}
          >
            {isGenerating ? '⏳ Generating...' : '📥 Download PDF'}
          </Button>
          {receipt.pdfUrl && (
            <a href={receipt.pdfUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                🔗 View Last PDF
              </Button>
            </a>
          )}
          <Link to={`/app/receipts/${id}/edit`}>
            <Button variant="outline">✏️ Edit</Button>
          </Link>
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => { if (confirm('Delete this receipt?')) deleteMutation.mutate(); }}
            disabled={deleteMutation.isPending}
          >
            🗑️ Delete
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div id="receipt-preview">
               <InvoicePreview
          invoice={previewData}
          documentType="RECEIPT"
          branding={{
            primaryColor: branding?.primaryColor,
            accentColor: branding?.accentColor,
            backgroundColor: branding?.backgroundColor,
            textColor: branding?.textColor,
            logoUrl: branding?.logoUrl ?? undefined,
            businessName: business?.name,
            businessAddress: business?.address ?? undefined,
            businessEmail: business?.email ?? undefined,
            businessPhone: business?.phone ?? undefined,
            bankName: business?.bankName ?? undefined,
            bankAccountName: business?.bankAccountName ?? undefined,
            bankAccountNumber: business?.bankAccountNumber ?? undefined,
          }}
        />
      </div>
    </div>
  );
}
