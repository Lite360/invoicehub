import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

type ReceiptStatus = 'issued' | 'cancelled';

const STATUS_STYLES: Record<ReceiptStatus, string> = {
  issued:     'bg-green-100 text-green-700',
  cancelled: 'bg-zinc-100 text-zinc-500',
};

async function fetchReceipts(token: string) {
  const res = await fetch('/api/receipts', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch receipts');
  return res.json();
}

export default function ReceiptList() {
  const { session } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: receipts = [], isLoading, isError } = useQuery({
    queryKey: ['receipts'],
    queryFn: () => fetchReceipts(session?.access_token ?? ''),
    enabled: !!session,
  });

  const filtered = receipts.filter((rec: any) => {
    const matchSearch =
      rec.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      rec.receiptNumber?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || rec.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receipts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{receipts.length} total receipt{receipts.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          to="/app/receipts/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          + New Receipt
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by client or receipt #..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Statuses</option>
          <option value="issued">Issued</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="py-20 text-center text-red-500">Failed to load receipts.</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4 opacity-20">💵</div>
            <p className="text-gray-500 font-medium">No receipts found</p>
            <p className="text-sm text-gray-400 mt-1">Create your first receipt to get started</p>
            <Link
              to="/app/receipts/new"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + New Receipt
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Receipt #</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Client</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Method</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Amount Received</th>
                  <th className="text-center px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((rec: any) => (
                  <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-emerald-600">
                      <Link to={`/app/receipts/${rec.id}`} className="hover:underline">
                        {rec.receiptNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-800">{rec.clientName}</td>
                    <td className="px-6 py-4 text-gray-500">{rec.issueDate}</td>
                    <td className="px-6 py-4 text-gray-500 capitalize">{rec.paymentMethod}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-800">
                      {rec.currency} {Number(rec.total).toLocaleString('en', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[rec.status as ReceiptStatus] || STATUS_STYLES.issued}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/app/receipts/${rec.id}/edit`}
                          className="px-3 py-1.5 text-xs border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          Edit
                        </Link>
                        <Link
                          to={`/app/receipts/${rec.id}`}
                          className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
