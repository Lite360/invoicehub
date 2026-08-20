import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-lg`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { session } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch admin stats');
      return res.json();
    },
    enabled: !!session,
  });

  const fmt = (n: number) => n?.toLocaleString('en', { minimumFractionDigits: 0 });
  const fmtMoney = (n: number) => `₦${Number(n || 0).toLocaleString('en', { minimumFractionDigits: 0 })}`;

  const STAT_CARDS = [
    { label: 'Total Users', value: fmt(stats?.totalUsers), icon: '👥', color: 'bg-emerald-50' },
    { label: 'Total Businesses', value: fmt(stats?.totalBusinesses), icon: '🏢', color: 'bg-purple-50' },
    { label: 'Active Subscriptions', value: fmt(stats?.activeSubscriptions), icon: '✅', color: 'bg-green-50' },
    { label: 'Trial Users', value: fmt(stats?.trialUsers), icon: '⏱️', color: 'bg-yellow-50' },
    { label: 'Monthly Revenue', value: fmtMoney(stats?.monthlyRevenue), icon: '💰', color: 'bg-emerald-50' },
    { label: 'Total Revenue', value: fmtMoney(stats?.totalRevenue), icon: '📈', color: 'bg-emerald-50' },
    { label: 'Total Documents', value: fmt(stats?.totalDocuments), icon: '📄', color: 'bg-orange-50' },
    { label: 'Successful Payments', value: fmt(stats?.successfulPayments), icon: '💳', color: 'bg-teal-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Platform Overview</h1>
        <p className="text-slate-500 mt-1">Real-time metrics across all businesses and users.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-slate-100 animate-pulse rounded-xl h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STAT_CARDS.map(card => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      )}

      {/* Document breakdown */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Document Breakdown</h2>
            <div className="space-y-4">
              {[
                { label: 'Invoices', value: stats?.totalInvoices, icon: '🧾', color: 'bg-emerald-100' },
                { label: 'Quotations', value: stats?.totalQuotations, icon: '📋', color: 'bg-purple-100' },
                { label: 'Receipts', value: stats?.totalReceipts, icon: '🧮', color: 'bg-green-100' },
              ].map(d => (
                <div key={d.label} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg ${d.color} flex items-center justify-center text-lg`}>{d.icon}</div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{d.label}</span>
                      <span className="text-sm font-bold text-slate-900">{d.value?.toLocaleString() || 0}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, ((d.value || 0) / (stats?.totalDocuments || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Links</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Manage Users', href: '/admin/users', icon: '👥' },
                { label: 'Businesses', href: '/admin/businesses', icon: '🏢' },
                { label: 'Plans', href: '/admin/plans', icon: '💎' },
                { label: 'Payments', href: '/admin/payments', icon: '💳' },
                { label: 'Subscriptions', href: '/admin/subscriptions', icon: '🔄' },
                { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
              ].map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors group"
                >
                  <span className="text-xl">{link.icon}</span>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{link.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
