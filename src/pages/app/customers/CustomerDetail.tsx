import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-emerald-100 text-emerald-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-zinc-100 text-zinc-500',
  accepted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  issued: 'bg-green-100 text-green-700',
};

type Tab = 'invoices' | 'quotations' | 'receipts' | 'payments';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('invoices');

  const { data, isLoading } = useQuery({
    queryKey: ['customer-detail', id],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${id}?include=full`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Customer not found');
      return res.json();
    },
    enabled: !!session && !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      success('Customer deleted');
      navigate('/app/customers');
    },
    onError: () => toastError('Failed to delete customer'),
  });

  const fmt = (n: string | number) =>
    Number(n).toLocaleString('en', { minimumFractionDigits: 2 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!data?.customer) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Customer not found.</p>
        <Link to="/app/customers" className="text-emerald-600 hover:underline mt-4 block">← Back to customers</Link>
      </div>
    );
  }

  const { customer, invoices = [], quotations = [], receipts = [], payments = [], stats } = data;

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'invoices', label: 'Invoices', count: invoices.length },
    { key: 'quotations', label: 'Quotations', count: quotations.length },
    { key: 'receipts', label: 'Receipts', count: receipts.length },
    { key: 'payments', label: 'Payments', count: payments.length },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/app/customers" className="text-gray-400 hover:text-gray-600 text-sm">← Customers</Link>
          <span className="text-gray-200">/</span>
          <span className="text-sm font-medium text-gray-700">{customer.name}</span>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/app/customers/${id}/edit`}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ✏️ Edit
          </Link>
          <button
            onClick={() => {
              if (confirm(`Delete ${customer.name}? This cannot be undone.`)) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
              {customer.email && <div><span className="text-gray-400 block text-xs">Email</span>{customer.email}</div>}
              {customer.phone && <div><span className="text-gray-400 block text-xs">Phone</span>{customer.phone}</div>}
              {customer.address && <div className="md:col-span-2"><span className="text-gray-400 block text-xs">Address</span>{customer.address}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Invoiced', value: fmt(stats?.totalInvoiced ?? 0), color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Total Paid', value: fmt(stats?.totalPaid ?? 0), color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Outstanding', value: fmt(stats?.outstanding ?? 0), color: 'text-orange-700', bg: 'bg-orange-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-5`}>
            <p className={`text-2xl font-bold ${s.color}`}>NGN {s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick action buttons */}
      <div className="flex flex-wrap gap-3">
        <Link
          to={`/app/invoices/new?customerId=${id}&customerName=${encodeURIComponent(customer.name)}&customerEmail=${encodeURIComponent(customer.email || '')}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          🧾 New Invoice
        </Link>
        <Link
          to={`/app/quotations/new?customerId=${id}&customerName=${encodeURIComponent(customer.name)}`}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          📋 New Quotation
        </Link>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${tab === t.key ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-1">
          {tab === 'invoices' && (
            <InvoiceTable invoices={invoices} fmt={fmt} />
          )}
          {tab === 'quotations' && (
            <QuotationTable quotations={quotations} fmt={fmt} />
          )}
          {tab === 'receipts' && (
            <SimpleTable
              items={receipts}
              columns={['receiptNumber', 'issueDate', 'total', 'status']}
              labels={['Receipt #', 'Date', 'Amount', 'Status']}
              linkBase="/app/receipts"
              fmt={fmt}
            />
          )}
          {tab === 'payments' && (
            <PaymentTable payments={payments} fmt={fmt} />
          )}
        </div>
      </div>
    </div>
  );
}

function InvoiceTable({ invoices, fmt }: { invoices: any[]; fmt: (n: any) => string }) {
  if (!invoices.length) return <EmptyState icon="🧾" label="No invoices" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-gray-100 bg-gray-50">
          <th className="text-left px-5 py-3 text-gray-500 font-medium">Invoice #</th>
          <th className="text-left px-5 py-3 text-gray-500 font-medium">Issue Date</th>
          <th className="text-left px-5 py-3 text-gray-500 font-medium">Due Date</th>
          <th className="text-right px-5 py-3 text-gray-500 font-medium">Total</th>
          <th className="text-right px-5 py-3 text-gray-500 font-medium">Balance</th>
          <th className="text-center px-5 py-3 text-gray-500 font-medium">Status</th>
        </tr></thead>
        <tbody className="divide-y divide-gray-50">
          {invoices.map((inv: any) => (
            <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3 font-mono text-emerald-600">
                <Link to={`/app/invoices/${inv.id}`} className="hover:underline">{inv.invoiceNumber}</Link>
              </td>
              <td className="px-5 py-3 text-gray-500">{inv.issueDate}</td>
              <td className="px-5 py-3 text-gray-500">{inv.dueDate ?? '—'}</td>
              <td className="px-5 py-3 text-right font-medium">{inv.currency} {fmt(inv.total)}</td>
              <td className="px-5 py-3 text-right text-orange-600 font-medium">{inv.currency} {fmt(inv.balanceDue)}</td>
              <td className="px-5 py-3 text-center">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[inv.status] || 'bg-gray-100 text-gray-600'}`}>{inv.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuotationTable({ quotations, fmt }: { quotations: any[]; fmt: (n: any) => string }) {
  if (!quotations.length) return <EmptyState icon="📋" label="No quotations" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-gray-100 bg-gray-50">
          <th className="text-left px-5 py-3 text-gray-500 font-medium">Quote #</th>
          <th className="text-left px-5 py-3 text-gray-500 font-medium">Date</th>
          <th className="text-left px-5 py-3 text-gray-500 font-medium">Valid Until</th>
          <th className="text-right px-5 py-3 text-gray-500 font-medium">Total</th>
          <th className="text-center px-5 py-3 text-gray-500 font-medium">Status</th>
        </tr></thead>
        <tbody className="divide-y divide-gray-50">
          {quotations.map((q: any) => (
            <tr key={q.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3 font-mono text-emerald-600">
                <Link to={`/app/quotations/${q.id}`} className="hover:underline">{q.quotationNumber}</Link>
              </td>
              <td className="px-5 py-3 text-gray-500">{q.issueDate}</td>
              <td className="px-5 py-3 text-gray-500">{q.validUntil ?? '—'}</td>
              <td className="px-5 py-3 text-right font-medium">{q.currency} {fmt(q.total)}</td>
              <td className="px-5 py-3 text-center">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[q.status] || 'bg-gray-100 text-gray-600'}`}>{q.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SimpleTable({ items, columns, labels, linkBase, fmt }: any) {
  if (!items.length) return <EmptyState icon="📄" label="No records" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-gray-100 bg-gray-50">
          {labels.map((l: string) => <th key={l} className="text-left px-5 py-3 text-gray-500 font-medium">{l}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-gray-50">
          {items.map((item: any) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
              {columns.map((col: string, i: number) => (
                <td key={col} className="px-5 py-3">
                  {i === 0 ? (
                    <Link to={`${linkBase}/${item.id}`} className="text-emerald-600 font-mono hover:underline">{item[col]}</Link>
                  ) : col === 'status' ? (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[item[col]] || 'bg-gray-100'}`}>{item[col]}</span>
                  ) : typeof item[col] === 'number' || (typeof item[col] === 'string' && !isNaN(Number(item[col]))) ? (
                    <span className="text-right block">{fmt(item[col])}</span>
                  ) : (
                    <span className="text-gray-500">{item[col] ?? '—'}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaymentTable({ payments, fmt }: { payments: any[]; fmt: (n: any) => string }) {
  if (!payments.length) return <EmptyState icon="💳" label="No payments recorded" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-gray-100 bg-gray-50">
          <th className="text-left px-5 py-3 text-gray-500 font-medium">Date</th>
          <th className="text-left px-5 py-3 text-gray-500 font-medium">Method</th>
          <th className="text-left px-5 py-3 text-gray-500 font-medium">Reference</th>
          <th className="text-right px-5 py-3 text-gray-500 font-medium">Amount</th>
          <th className="text-center px-5 py-3 text-gray-500 font-medium">Status</th>
        </tr></thead>
        <tbody className="divide-y divide-gray-50">
          {payments.map((p: any) => (
            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3 text-gray-500">{p.paymentDate}</td>
              <td className="px-5 py-3 capitalize text-gray-700">{p.paymentMethod}</td>
              <td className="px-5 py-3 font-mono text-xs text-gray-500">{p.reference ?? '—'}</td>
              <td className="px-5 py-3 text-right font-semibold text-gray-900">{p.currency} {fmt(p.amount)}</td>
              <td className="px-5 py-3 text-center">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[p.status] || 'bg-gray-100'}`}>{p.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="py-16 text-center">
      <div className="text-5xl mb-3 opacity-20">{icon}</div>
      <p className="text-gray-400 text-sm">{label}</p>
    </div>
  );
}
