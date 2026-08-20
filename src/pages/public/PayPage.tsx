import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

interface PayInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  status: string;
  currency: string;
  issueDate: string;
  dueDate?: string;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  total: string;
  amountPaid: string;
  balanceDue: string;
  notes?: string;
  items: Array<{ description: string; quantity: string; unitPrice: string; amount: string }>;
}

interface PayBusiness {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface PayBranding {
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

export default function PayPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get('status');

  const [invoice, setInvoice] = useState<PayInvoice | null>(null);
  const [business, setBusiness] = useState<PayBusiness | null>(null);
  const [branding, setBranding] = useState<PayBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [initiating, setInitiating] = useState(false);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/pay/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Invoice not found');
        return r.json();
      })
      .then(data => {
        setInvoice(data.invoice);
        setBusiness(data.business);
        setBranding(data.branding);
        if (data.invoice?.clientEmail) setEmail(data.invoice.clientEmail);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const fmt = (n: string | number) =>
    Number(n).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handlePay = async () => {
    if (!email) { setPayError('Please enter your email address to proceed.'); return; }
    setInitiating(true);
    setPayError('');
    try {
      const res = await fetch('/api/pay/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: id, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initiate payment');
      // Redirect to Paystack checkout
      window.location.href = data.authorizationUrl;
    } catch (err: any) {
      setPayError(err.message);
      setInitiating(false);
    }
  };

  const primary = branding?.primaryColor || '#1e3a5f';
  const accent = branding?.accentColor || '#3b82f6';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
          <p className="text-gray-500">{error || 'This invoice link may have expired or is invalid.'}</p>
        </div>
      </div>
    );
  }

  const isPaid = invoice.status === 'paid';
  const balanceDue = Number(invoice.balanceDue);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Business header */}
        <div className="flex items-center gap-4 mb-8">
          {branding?.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
          ) : (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: primary }}>
              {business?.name?.[0] ?? 'B'}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-gray-900">{business?.name}</h2>
            {business?.email && <p className="text-sm text-gray-500">{business.email}</p>}
          </div>
        </div>

        {/* Success message after payment */}
        {paymentStatus === 'success' && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-xl p-5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-semibold">Payment Submitted!</p>
              <p className="text-sm mt-0.5">Your payment is being verified. You will receive a receipt by email once confirmed.</p>
            </div>
          </div>
        )}

        {/* Invoice card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Invoice header */}
          <div className="px-8 py-6 border-b border-gray-100" style={{ borderTopColor: accent, borderTopWidth: 4 }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Invoice</p>
                <p className="text-2xl font-bold text-gray-900 font-mono">{invoice.invoiceNumber}</p>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                isPaid ? 'bg-green-100 text-green-700' :
                invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {isPaid ? 'Paid' : invoice.status === 'overdue' ? 'Overdue' : 'Due'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs">Bill To</p>
                <p className="font-semibold text-gray-900 mt-0.5">{invoice.clientName}</p>
              </div>
              <div className="text-right">
                {invoice.dueDate && (
                  <>
                    <p className="text-gray-400 text-xs">Due Date</p>
                    <p className={`font-semibold mt-0.5 ${new Date(invoice.dueDate) < new Date() && !isPaid ? 'text-red-600' : 'text-gray-900'}`}>
                      {invoice.dueDate}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="px-8 py-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-gray-400 text-xs font-semibold pb-3">Description</th>
                  <th className="text-right text-gray-400 text-xs font-semibold pb-3">Qty</th>
                  <th className="text-right text-gray-400 text-xs font-semibold pb-3">Price</th>
                  <th className="text-right text-gray-400 text-xs font-semibold pb-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoice.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-3 text-gray-800">{item.description}</td>
                    <td className="py-3 text-right text-gray-600">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-600">{invoice.currency} {fmt(item.unitPrice)}</td>
                    <td className="py-3 text-right font-medium text-gray-900">{invoice.currency} {fmt(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-6 border-t border-gray-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{invoice.currency} {fmt(invoice.subtotal)}</span>
              </div>
              {Number(invoice.taxAmount) > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>{invoice.currency} {fmt(invoice.taxAmount)}</span>
                </div>
              )}
              {Number(invoice.discountAmount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>− {invoice.currency} {fmt(invoice.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900 border-t pt-3">
                <span>Total</span>
                <span>{invoice.currency} {fmt(invoice.total)}</span>
              </div>
              {Number(invoice.amountPaid) > 0 && (
                <div className="flex justify-between text-green-600 text-sm">
                  <span>Amount Paid</span>
                  <span>− {invoice.currency} {fmt(invoice.amountPaid)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-extrabold border-t pt-3" style={{ color: accent }}>
                <span>Balance Due</span>
                <span>{invoice.currency} {fmt(balanceDue)}</span>
              </div>
            </div>
          </div>

          {/* Pay section */}
          {!isPaid && balanceDue > 0 && paymentStatus !== 'success' && (
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Pay Now</h3>
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1.5">Your Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors"
                  style={{ focusRingColor: accent } as any}
                />
              </div>
              {payError && (
                <p className="text-red-600 text-sm mb-4">{payError}</p>
              )}
              <button
                onClick={handlePay}
                disabled={initiating}
                className="w-full py-4 px-6 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: accent }}
              >
                {initiating ? 'Redirecting to Paystack...' : `Pay ${invoice.currency} ${fmt(balanceDue)}`}
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">
                🔒 Secured by Paystack. Your payment information is encrypted.
              </p>
            </div>
          )}

          {isPaid && (
            <div className="px-8 py-6 bg-green-50 border-t border-green-100 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-bold text-green-700">This invoice has been fully paid.</p>
              <p className="text-sm text-green-600 mt-1">Thank you for your payment!</p>
            </div>
          )}
        </div>

        {invoice.notes && (
          <div className="mt-6 bg-emerald-50 border border-emerald-100 rounded-xl p-5">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-sm text-gray-700">{invoice.notes}</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          Powered by <strong>InvoiceHub</strong> · Create. Send. Get Paid.
        </p>
      </div>
    </div>
  );
}
