import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

const EMPTY_ITEM: LineItem = { description: '', quantity: 1, unitPrice: 0, amount: 0 };

function genReceiptNumber() {
  return `REC-${Date.now().toString().slice(-6)}`;
}

export default function ReceiptForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { session } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [receiptNumber, setReceiptNumber] = useState(genReceiptNumber());
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [currency, setCurrency] = useState('NGN');
  const [taxRate, setTaxRate] = useState(0);
  const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'fixed'>('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ ...EMPTY_ITEM }]);

  useEffect(() => {
    if (isEdit && session) {
      setLoading(true);
      fetch(`/api/receipts/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
        .then(r => r.json())
        .then(data => {
          setReceiptNumber(data.receiptNumber ?? '');
          setClientName(data.clientName ?? '');
          setClientEmail(data.clientEmail ?? '');
          setClientPhone(data.clientPhone ?? '');
          setClientAddress(data.clientAddress ?? '');
          setIssueDate(data.issueDate ?? '');
          setPaymentMethod(data.paymentMethod ?? 'cash');
          setCurrency(data.currency ?? 'NGN');
          setTaxRate(Number(data.taxRate ?? 0));
          setDiscountType(data.discountType ?? 'none');
          setDiscountValue(Number(data.discountValue ?? 0));
          setNotes(data.notes ?? '');
          setItems(data.items?.length ? data.items.map((i: any) => ({
            description: i.description,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
            amount: Number(i.amount),
          })) : [{ ...EMPTY_ITEM }]);
        })
        .finally(() => setLoading(false));
    }
  }, [isEdit, id, session]);

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    // Recalculate amount
    const qty = field === 'quantity' ? Number(value) : Number(updated[index].quantity);
    const price = field === 'unitPrice' ? Number(value) : Number(updated[index].unitPrice);
    updated[index].amount = qty * price;
    setItems(updated);
  };

  const addItem = () => setItems([...items, { ...EMPTY_ITEM }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  // Computed totals
  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const discountAmount = discountType === 'percentage'
    ? subtotal * (discountValue / 100)
    : discountType === 'fixed' ? discountValue : 0;
  const total = subtotal + taxAmount - discountAmount;

  const handleSave = async (status = 'issued') => {
    setSaving(true);
    const payload = {
      receiptNumber, clientName, clientEmail, clientPhone, clientAddress,
      issueDate, paymentMethod, currency, taxRate, taxAmount,
      discountType, discountValue, discountAmount,
      subtotal, total, notes, status,
      items: items.map(i => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        amount: i.amount,
      })),
    };

    try {
      const url = isEdit ? `/api/receipts/${id}` : '/api/receipts';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save receipt');
      const saved = await res.json();
      navigate(`/app/receipts/${saved.id}`);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  const fmt = (n: number) => n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Receipt' : 'New Receipt'}</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button onClick={() => handleSave('issued')} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? 'Saving...' : 'Save Receipt'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-8">
        {/* Receipt Meta */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label>Receipt Number</Label>
            <Input value={receiptNumber} onChange={e => setReceiptNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Payment Date</Label>
            <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="cash">Cash</option>
              <option value="transfer">Bank Transfer</option>
              <option value="card">Credit Card</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Input value={currency} onChange={e => setCurrency(e.target.value)} placeholder="NGN" />
          </div>
        </div>

        {/* Client Info */}
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-4 pb-2 border-b">Client Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client Name *</Label>
              <Input value={clientName} onChange={e => setClientName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Client Email</Label>
              <Input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Client Phone</Label>
              <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Client Address</Label>
              <Input value={clientAddress} onChange={e => setClientAddress(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-4 pb-2 border-b">Payment Details</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-2">
              <div className="col-span-5">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-3 text-right">Unit Price</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <Input
                    placeholder="Item description"
                    value={item.description}
                    onChange={e => updateItem(i, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number" min="0"
                    value={item.quantity}
                    onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                    className="text-right"
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="number" min="0"
                    value={item.unitPrice}
                    onChange={e => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="text-right"
                  />
                </div>
                <div className="col-span-1 text-right text-sm font-medium text-gray-700 px-2">
                  {fmt(item.amount)}
                </div>
                <div className="col-span-1 flex justify-end">
                  {items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                  )}
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" className="mt-2 text-sm" onClick={addItem}>
              + Add Item
            </Button>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full max-w-sm space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium">{currency} {fmt(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm text-gray-600">
              <span>Tax (%)</span>
              <Input
                type="number" min="0" max="100"
                value={taxRate}
                onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-20 text-right h-8 text-sm"
              />
              <span className="font-medium w-28 text-right">{currency} {fmt(taxAmount)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm text-gray-600">
              <select
                value={discountType}
                onChange={e => setDiscountType(e.target.value as any)}
                className="text-sm border border-gray-200 rounded px-2 py-1 bg-white"
              >
                <option value="none">No Discount</option>
                <option value="percentage">Discount (%)</option>
                <option value="fixed">Discount (Fixed)</option>
              </select>
              {discountType !== 'none' && (
                <Input
                  type="number" min="0"
                  value={discountValue}
                  onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                  className="w-20 text-right h-8 text-sm"
                />
              )}
              <span className="font-medium w-28 text-right text-red-500">
                {discountAmount > 0 ? `- ${currency} ${fmt(discountAmount)}` : ''}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-emerald-700 border-t pt-3">
              <span>Amount Received</span>
              <span>{currency} {fmt(total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Notes</Label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Payment received with thanks."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
