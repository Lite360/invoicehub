import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

const STATUS_STYLES: Record<QuotationStatus, string> = {
  draft:     'bg-gray-100 text-gray-600',
  sent:      'bg-blue-100 text-blue-700',
  accepted:  'bg-green-100 text-green-700',
  rejected:   'bg-red-100 text-red-700',
  expired: 'bg-zinc-100 text-zinc-500',
};

async function fetchQuotations(token: string) {
  const res = await fetch('/api/quotations', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch quotations');
  return res.json();
}

export default function QuotationList() {
  const { session } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: quotations = [], isLoading, isError } = useQuery({
    queryKey: ['quotations'],
    queryFn: () => fetchQuotations(session?.access_token ?? ''),
    enabled: !!session,
  });

  const filtered = quotations.filter((quo: any) => {
    const matchSearch =
      quo.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      quo.quotationNumber?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || quo.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
          <p className="text-sm text-gray-500 mt-0.5">{quotations.length} total quotation{quotations.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          to="/app/quotations/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          + New Quotation
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by client or quotation #..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="py-20 text-center text-red-500">Failed to load quotations.</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4 opacity-20">📋</div>
            <p className="text-gray-500 font-medium">No quotations found</p>
            <p className="text-sm text-gray-400 mt-1">Create your first quotation to get started</p>
            <Link
              to="/app/quotations/new"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + New Quotation
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Quotation #</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Client</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Issue Date</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Valid Until</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Amount</th>
                  <th className="text-center px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((quo: any) => (
                  <tr key={quo.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-indigo-600">
                      <Link to={`/app/quotations/${quo.id}`} className="hover:underline">
                        {quo.quotationNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-800">{quo.clientName}</td>
                    <td className="px-6 py-4 text-gray-500">{quo.issueDate}</td>
                    <td className="px-6 py-4 text-gray-500">{quo.validUntil ?? '—'}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-800">
                      {quo.currency} {Number(quo.total).toLocaleString('en', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[quo.status as QuotationStatus] || STATUS_STYLES.draft}`}>
                        {quo.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/app/quotations/${quo.id}/edit`}
                          className="px-3 py-1.5 text-xs border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          Edit
                        </Link>
                        <Link
                          to={`/app/quotations/${quo.id}`}
                          className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
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
