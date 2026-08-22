import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import InvoicePreview from '@/components/invoices/InvoicePreview';
import { useGeneratePDF } from '@/hooks/useGeneratePDF';

type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

const STATUS_STYLES: Record<QuotationStatus, string> = {
  draft:     'bg-gray-100 text-gray-600',
  sent:      'bg-emerald-100 text-emerald-700',
  accepted:  'bg-green-100 text-green-700',
  rejected:  'bg-red-100 text-red-700',
  expired:   'bg-zinc-100 text-zinc-500',
};

export default function QuotationDetail() {
  const { id } = useParams<{ id: string }>();
  const { session, business, branding } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { generateAndUpload, isGenerating } = useGeneratePDF();
  const [sendingEmail, setSendingEmail] = useState(false);

  const { data: quotation, isLoading } = useQuery({
    queryKey: ['quotation', id],
    queryFn: async () => {
      const res = await fetch(`/api/quotations/${id}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Not found');
      return res.json();
    },
    enabled: !!session && !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      success('Quotation deleted');
      navigate('/app/quotations');
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/quotations/${id}`, {
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
    onSuccess: () => {
      success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
    },
  });

  const convertToInvoice = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ action: 'convert' }),
      });
      if (!res.ok) throw new Error('Conversion failed');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      success('Converted to invoice successfully');
      navigate(`/app/invoices/${data.invoiceId}`);
    },
  });

  const handleDownloadPDF = async () => {
    try {
      const url = await generateAndUpload({
        elementId: 'quotation-preview',
        docId: id!,
        docType: 'quotation',
        filename: `${quotation.quotationNumber}.pdf`,
      });
      window.open(url, '_blank');
    } catch {
      toastError('Failed to generate PDF. Please try again.');
    }
  };

  const handlePrint = () => window.print();

  const handleSendEmail = async () => {
    if (!quotation?.clientEmail) {
      toastError('This customer does not have an email address associated with the quotation.');
      return;
    }
    setSendingEmail(true);
    try {
      const res = await fetch('/api/quotations/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ quotationId: id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send email');
      }
      success('Quotation sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Quotation not found.</p>
        <Link to="/app/quotations" className="text-emerald-600 hover:underline mt-4 block">← Back to quotations</Link>
      </div>
    );
  }

  // Map quotation to invoice format for the preview component
  const previewData = {
    ...quotation,
    invoiceNumber: quotation.quotationNumber,
    dueDate: quotation.validUntil,
    paymentTerms: quotation.terms,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link to="/app/quotations" className="text-gray-500 hover:text-gray-700 text-sm">
            ← Quotations
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-mono font-medium">{quotation.quotationNumber}</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[quotation.status as QuotationStatus]}`}>
            {quotation.status}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quotation.status !== 'accepted' && (
            <>
              <Button
                variant="outline"
                className="text-green-700 border-green-300 hover:bg-green-50"
                onClick={() => updateStatus.mutate('accepted')}
                disabled={updateStatus.isPending}
              >
                ✓ Accept
              </Button>
              <Button
                variant="outline"
                className="text-red-700 border-red-300 hover:bg-red-50"
                onClick={() => updateStatus.mutate('rejected')}
                disabled={updateStatus.isPending}
              >
                ✗ Reject
              </Button>
            </>
          )}
          {quotation.status === 'accepted' && !quotation.convertedToInvoiceId && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => { if(confirm('Convert to Invoice?')) convertToInvoice.mutate(); }}
              disabled={convertToInvoice.isPending}
            >
              🔄 Convert to Invoice
            </Button>
          )}
          {quotation.convertedToInvoiceId && (
            <Link to={`/app/invoices/${quotation.convertedToInvoiceId}`}>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                View Invoice
              </Button>
            </Link>
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
          {quotation.pdfUrl && (
            <a href={quotation.pdfUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                🔗 View Last PDF
              </Button>
            </a>
          )}
          <Link to={`/app/quotations/${id}/edit`}>
            <Button variant="outline">✏️ Edit</Button>
          </Link>
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => { if (confirm('Delete this quotation?')) deleteMutation.mutate(); }}
            disabled={deleteMutation.isPending}
          >
            🗑️ Delete
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div id="quotation-preview" className="shadow-2xl rounded-2xl overflow-hidden border border-gray-100 bg-white">
               <InvoicePreview
          invoice={previewData}
          documentType="QUOTATION"
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
