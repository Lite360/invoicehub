import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

type HistoryType = 'all' | 'invoice' | 'quotation' | 'receipt' | 'letter' | 'payment';

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  invoice:   { icon: '🧾', label: 'Invoice',   color: 'bg-blue-100 text-blue-700'    },
  quotation: { icon: '📋', label: 'Quotation', color: 'bg-indigo-100 text-indigo-700' },
  receipt:   { icon: '💵', label: 'Receipt',   color: 'bg-emerald-100 text-emerald-700' },
  letter:    { icon: '✉️', label: 'Letter',    color: 'bg-gray-100 text-gray-700'    },
  payment:   { icon: '💰', label: 'Payment',   color: 'bg-violet-100 text-violet-700' },
};

const STATUS_COLOR: Record<string, string> = {
  draft:      'bg-gray-100 text-gray-500',
  sent:       'bg-blue-100 text-blue-700',
  paid:       'bg-green-100 text-green-700',
  overdue:    'bg-red-100 text-red-700',
  cancelled:  'bg-zinc-100 text-zinc-500',
  accepted:   'bg-green-100 text-green-700',
  rejected:   'bg-red-100 text-red-700',
  expired:    'bg-orange-100 text-orange-700',
  issued:     'bg-emerald-100 text-emerald-700',
  completed:  'bg-green-100 text-green-700',
  pending:    'bg-yellow-100 text-yellow-700',
  failed:     'bg-red-100 text-red-700',
  refunded:   'bg-gray-100 text-gray-600',
};

const TABS: { key: HistoryType; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'invoice',   label: 'Invoices' },
  { key: 'quotation', label: 'Quotations' },
  { key: 'receipt',   label: 'Receipts' },
  { key: 'letter',    label: 'Letters' },
  { key: 'payment',   label: 'Payments' },
];

export default function HistoryPage() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<HistoryType>('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: async () => {
      const res = await fetch('/api/history', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Failed to load history');
      return res.json();
    },
    enabled: !!session,
  });

  const filtered = history.filter((item: any) => {
    const matchType = activeTab === 'all' || item.type === activeTab;
    const matchSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.client?.toLowerCase().includes(search.toLowerCase());
    const itemDate = new Date(item.date);
    const matchFrom = !dateFrom || itemDate >= new Date(dateFrom);
    const matchTo   = !dateTo   || itemDate <= new Date(dateTo);
    return matchType && matchSearch && matchFrom && matchTo;
  });

  // Group by date (day)
  const grouped: Record<string, typeof filtered> = {};
  for (const item of filtered) {
    const day = new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(item);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">History</h1>
        <p className="text-sm text-gray-500 mt-0.5">A unified timeline of all your business activity.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by title or client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="text-sm text-gray-400 hover:text-gray-600 px-2"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Type Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-gray-100 rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm text-center">
          <div className="text-6xl mb-4 opacity-20">📁</div>
          <p className="text-gray-500 font-medium">No activity found</p>
          <p className="text-sm text-gray-400 mt-1">
            {search || dateFrom || dateTo
              ? 'Try adjusting your filters'
              : 'Your document history will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day}>
              {/* Day divider */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{day}</span>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Items */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                {items.map((item: any) => {
                  const cfg = TYPE_CONFIG[item.type] ?? { icon: '📄', label: item.type, color: 'bg-gray-100 text-gray-600' };
                  return (
                    <Link
                      key={item.id}
                      to={item.link}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                    >
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${cfg.color}`}>
                        {cfg.icon}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.title}</p>
                        <p className="text-sm text-gray-500 truncate">{item.client}</p>
                      </div>

                      {/* Type badge */}
                      <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                        {cfg.label}
                      </span>

                      {/* Status badge */}
                      {item.status && (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLOR[item.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {item.status}
                        </span>
                      )}

                      {/* Time */}
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(item.date).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
