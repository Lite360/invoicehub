import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminBusinesses() {
  const { session } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-businesses', page],
    queryFn: async () => {
      const res = await fetch(`/api/admin/businesses?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!session,
  });

  const businesses = (data?.businesses ?? []).filter((b: any) =>
    !search ||
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
    b.ownerEmail?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Businesses</h1>
          <p className="text-slate-500 text-sm mt-1">Manage tenant businesses and their subscriptions</p>
        </div>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search business names, owners..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 max-w-md px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 font-medium text-slate-500">Business</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500">Owner</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500">Plan</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500">Joined</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {businesses.length === 0 ? (
                  <tr><td colSpan={5} className="py-16 text-center text-slate-400">No businesses found</td></tr>
                ) : businesses.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {b.name?.[0]?.toUpperCase() ?? 'B'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{b.name}</p>
                          <p className="text-xs text-slate-400 capitalize">{b.type || 'Standard'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">{b.ownerName || '—'}</p>
                      <p className="text-xs text-slate-500">{b.ownerEmail}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                        b.subscriptionStatus === 'active' ? 'bg-green-100 text-green-700' :
                        b.subscriptionStatus === 'trial' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {b.planName || 'No Plan'} ({b.subscriptionStatus || 'none'})
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Page {page}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            ← Previous
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={(data?.businesses?.length ?? 0) < 20}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
