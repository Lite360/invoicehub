import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PaymentForm() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [reference, setReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('completed');
  const [notes, setNotes] = useState('');
  const [invoiceId, setInvoiceId] = useState('');

  // Fetch invoices for the dropdown
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await fetch('/api/invoices', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!session,
  });

  // When an invoice is selected, auto-fill client and amount
  useEffect(() => {
    if (invoiceId) {
      const inv = invoices.find((i: any) => i.id === invoiceId);
      if (inv) {
        setClientName(inv.clientName);
        setAmount(String(inv.balanceDue || inv.total));
        setCurrency(inv.currency);
      }
    }
  }, [invoiceId, invoices]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          clientName, amount, currency, paymentMethod, reference,
          paymentDate, status, notes,
          invoiceId: invoiceId || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to record payment');
      navigate('/app/payments');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const unpaidInvoices = invoices.filter((i: any) => i.status !== 'paid' && i.status !== 'cancelled');

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Record Payment</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
            {saving ? 'Saving...' : 'Record Payment'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
        {/* Link to Invoice (optional) */}
        <div className="space-y-2">
          <Label>Link to Invoice (Optional)</Label>
          <select
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">— No invoice linked —</option>
            {unpaidInvoices.map((inv: any) => (
              <option key={inv.id} value={inv.id}>
                {inv.invoiceNumber} — {inv.clientName} ({inv.currency} {Number(inv.balanceDue || inv.total).toLocaleString()})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400">Linking will auto-update the invoice balance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Client Name *</Label>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Amount *</Label>
            <div className="flex gap-2">
              <Input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-20"
              />
              <Input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Payment Date *</Label>
            <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="cash">Cash</option>
              <option value="transfer">Bank Transfer</option>
              <option value="card">Credit Card</option>
              <option value="cheque">Cheque</option>
              <option value="paystack">Paystack</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Reference / Transaction ID</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. TXN-123456" />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Additional payment details..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>
    </div>
  );
}
