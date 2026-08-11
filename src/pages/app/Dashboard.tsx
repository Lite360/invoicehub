import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

const QUICK_ACTIONS = [
  { label: 'New Invoice', to: '/app/invoices/new', icon: '🧾', color: 'bg-blue-600 hover:bg-blue-700' },
  { label: 'New Quotation', to: '/app/quotations/new', icon: '📋', color: 'bg-indigo-600 hover:bg-indigo-700' },
  { label: 'New Receipt', to: '/app/receipts/new', icon: '🧮', color: 'bg-emerald-600 hover:bg-emerald-700' },
  { label: 'Add Customer', to: '/app/customers/new', icon: '👥', color: 'bg-orange-600 hover:bg-orange-700' },
];

export default function Dashboard() {
  const { user, session } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const { data, isLoading } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Failed to load dashboard data');
      return res.json();
    },
    enabled: !!session,
  });

  const STATS = [
    { label: 'Total Invoices', value: data?.stats?.totalInvoices ?? 0, icon: '🧾', color: 'bg-blue-50 text-blue-700' },
    { label: 'Paid Invoices', value: data?.stats?.paidCount ?? 0, icon: '✅', color: 'bg-green-50 text-green-700' },
    { 
      label: 'Pending Payments', 
      value: `${data?.stats?.currency ?? 'NGN'} ${(data?.stats?.pendingPayments ?? 0).toLocaleString('en', { minimumFractionDigits: 2 })}`, 
      icon: '⏳', 
      color: 'bg-yellow-50 text-yellow-700' 
    },
    { label: 'Total Customers', value: data?.stats?.totalCustomers ?? 0, icon: '👥', color: 'bg-purple-50 text-purple-700' },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-2xl p-8 text-white flex items-center justify-between">
        <div>
          <p className="text-blue-200 text-sm mb-1">{greeting} 👋</p>
          <h1 className="text-3xl font-bold mb-2">{firstName}!</h1>
          <p className="text-blue-200 text-sm">Here's an overview of your business activity.</p>
        </div>
        <div className="hidden md:block text-7xl opacity-20 select-none">📊</div>
      </div>

      {/* Stats Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                {isLoading ? (
                  <div className="h-8 w-20 bg-gray-200 animate-pulse rounded mb-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                )}
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl text-white font-medium transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 ${action.color}`}
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm text-center">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
             <div className="flex items-center justify-center py-16">
               <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
             </div>
          ) : data?.recentActivity?.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {data.recentActivity.map((activity: any) => (
                <Link 
                  key={activity.id} 
                  to={activity.link}
                  className="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg flex-shrink-0">
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.subtitle}</p>
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(activity.date).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-6xl mb-4 opacity-20">📄</div>
              <p className="text-gray-500 font-medium">No activity yet</p>
              <p className="text-sm text-gray-400 mt-1">Create your first invoice to get started!</p>
              <Link
                to="/app/invoices/new"
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                🧾 Create Invoice
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
