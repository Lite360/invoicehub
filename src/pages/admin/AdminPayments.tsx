import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminPayments() {
  const { session } = useAuth();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', page],
    queryFn: async () => {
      const res = await fetch(`/api/admin/payments?page=${page}&limit=50`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!session,
  });

  const fmt = (n: string | number) => Number(n).toLocaleString('en', { minimumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Payments</h1>
          <p className="text-slate-500 text-sm mt-1">Transaction log across all businesses</p>
        </div>
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
                  <th className="text-left px-5 py-3 font-medium text-slate-500">Date</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500">Business</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500">Client / Ref</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-500">Amount</th>
                  <th className="text-center px-5 py-3 font-medium text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(data?.payments ?? []).length === 0 ? (
                  <tr><td colSpan={5} className="py-16 text-center text-slate-400">No payments found</td></tr>
                ) : (data?.payments ?? []).map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString()}<br/>
                      <span className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleTimeString()}</span>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {p.businessName || '—'}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-700">{p.clientName || '—'}</p>
                      <p className="text-xs font-mono text-slate-400">{p.reference || 'manual'}</p>
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-slate-900">
                      {p.currency} {fmt(p.amount)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                        p.status === 'completed' ? 'bg-green-100 text-green-700' :
                        p.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {p.status}
                      </span>
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
            disabled={(data?.payments?.length ?? 0) < 50}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
