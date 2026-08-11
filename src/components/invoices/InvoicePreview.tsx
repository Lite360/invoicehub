// Branded, print-ready invoice preview component

interface LineItem {
  id?: string;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  amount: number | string;
}

interface Invoice {
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate?: string;
  currency: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  subtotal: number | string;
  taxRate?: number | string;
  taxAmount?: number | string;
  discountType?: string;
  discountAmount?: number | string;
  total: number | string;
  amountPaid?: number | string;
  balanceDue?: number | string;
  notes?: string;
  paymentTerms?: string;
  items: LineItem[];
}

interface InvoicePreviewProps {
  invoice: Invoice;
  branding?: {
    primaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
    logoUrl?: string;
    businessName?: string;
    businessAddress?: string;
    businessEmail?: string;
    businessPhone?: string;
  };
  documentType?: string;
}

export default function InvoicePreview({ invoice, branding, documentType = 'INVOICE' }: InvoicePreviewProps) {
  const primary = branding?.primaryColor ?? '#0f172a';
  const accent  = branding?.accentColor  ?? '#3b82f6';
  const bg      = branding?.backgroundColor ?? '#ffffff';
  const text    = branding?.textColor ?? '#020617';

  const fmt = (n: number | string) =>
    Number(n).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const STATUS_COLOR: Record<string, string> = {
    draft: '#94a3b8',
    sent: '#3b82f6',
    paid: '#16a34a',
    overdue: '#dc2626',
    cancelled: '#6b7280',
  };

  return (
    <div
      id="invoice-preview"
      className="w-full rounded-xl overflow-hidden shadow-lg print:shadow-none print:rounded-none"
      style={{ backgroundColor: bg, color: text, fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Header Band */}
      <div className="px-10 py-8 flex justify-between items-start" style={{ borderBottom: `3px solid ${primary}` }}>
        <div>
          {branding?.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo" className="h-12 object-contain mb-2" />
          ) : (
            <div className="text-2xl font-bold" style={{ color: primary }}>
              {branding?.businessName ?? 'Your Business'}
            </div>
          )}
          <div className="text-sm mt-1 space-y-0.5" style={{ color: text + 'aa' }}>
            {branding?.businessAddress && <p>{branding.businessAddress}</p>}
            {branding?.businessEmail && <p>{branding.businessEmail}</p>}
            {branding?.businessPhone && <p>{branding.businessPhone}</p>}
          </div>
        </div>

        <div className="text-right">
          <div className="text-4xl font-extrabold uppercase tracking-widest" style={{ color: primary, letterSpacing: '0.15em' }}>
            {documentType}
          </div>
          <div className="mt-2 text-lg font-mono font-semibold" style={{ color: accent }}>
            {invoice.invoiceNumber}
          </div>
          <span
            className="mt-1 inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: STATUS_COLOR[invoice.status] ?? '#94a3b8' }}
          >
            {invoice.status}
          </span>
        </div>
      </div>

      {/* Bill To + Dates */}
      <div className="px-10 py-6 grid grid-cols-2 gap-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: primary }}>
            Bill To
          </p>
          <p className="font-semibold text-base">{invoice.clientName}</p>
          {invoice.clientAddress && <p className="text-sm mt-0.5 opacity-70">{invoice.clientAddress}</p>}
          {invoice.clientEmail && <p className="text-sm opacity-70">{invoice.clientEmail}</p>}
          {invoice.clientPhone && <p className="text-sm opacity-70">{invoice.clientPhone}</p>}
        </div>
        <div className="text-right space-y-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: primary }}>Issue Date</p>
            <p className="text-sm">{invoice.issueDate}</p>
          </div>
          {invoice.dueDate && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: primary }}>Due Date</p>
              <p className="text-sm">{invoice.dueDate}</p>
            </div>
          )}
        </div>
      </div>

      {/* Line Items Table */}
      <div className="px-10 pb-6">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: primary, color: '#fff' }}>
              <th className="py-3 px-4 text-left font-semibold rounded-l-lg">Description</th>
              <th className="py-3 px-4 text-right font-semibold">Qty</th>
              <th className="py-3 px-4 text-right font-semibold">Unit Price</th>
              <th className="py-3 px-4 text-right font-semibold rounded-r-lg">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-transparent' : ''} style={{ backgroundColor: i % 2 !== 0 ? primary + '08' : 'transparent' }}>
                <td className="py-3 px-4">{item.description}</td>
                <td className="py-3 px-4 text-right opacity-80">{item.quantity}</td>
                <td className="py-3 px-4 text-right opacity-80">{invoice.currency} {fmt(item.unitPrice)}</td>
                <td className="py-3 px-4 text-right font-medium">{invoice.currency} {fmt(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="px-10 pb-8 flex justify-end">
        <div className="w-72 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="opacity-70">Subtotal</span>
            <span>{invoice.currency} {fmt(invoice.subtotal)}</span>
          </div>
          {Number(invoice.taxAmount) > 0 && (
            <div className="flex justify-between">
              <span className="opacity-70">Tax ({invoice.taxRate}%)</span>
              <span>{invoice.currency} {fmt(invoice.taxAmount!)}</span>
            </div>
          )}
          {Number(invoice.discountAmount) > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Discount</span>
              <span>- {invoice.currency} {fmt(invoice.discountAmount!)}</span>
            </div>
          )}
          <div
            className="flex justify-between font-bold text-base pt-2 mt-2 border-t"
            style={{ borderColor: primary + '33' }}
          >
            <span>Total</span>
            <span style={{ color: accent }}>{invoice.currency} {fmt(invoice.total)}</span>
          </div>
          {Number(invoice.amountPaid) > 0 && (
            <>
              <div className="flex justify-between text-green-600">
                <span>Amount Paid</span>
                <span>- {invoice.currency} {fmt(invoice.amountPaid!)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t" style={{ borderColor: primary + '33' }}>
                <span>Balance Due</span>
                <span>{invoice.currency} {fmt(invoice.balanceDue!)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notes & Terms */}
      {(invoice.notes || invoice.paymentTerms) && (
        <div className="px-10 py-6 grid grid-cols-2 gap-8 border-t text-sm" style={{ borderColor: primary + '22' }}>
          {invoice.notes && (
            <div>
              <p className="font-semibold uppercase tracking-wider text-xs mb-2" style={{ color: primary }}>Notes</p>
              <p className="opacity-70 whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}
          {invoice.paymentTerms && (
            <div>
              <p className="font-semibold uppercase tracking-wider text-xs mb-2" style={{ color: primary }}>Payment Terms</p>
              <p className="opacity-70 whitespace-pre-line">{invoice.paymentTerms}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        className="px-10 py-4 text-center text-xs"
        style={{ backgroundColor: primary, color: '#fff' + 'cc' }}
      >
        {branding?.businessName ?? 'InvoiceHub'} — Thank you for your business!
      </div>
    </div>
  );
}
