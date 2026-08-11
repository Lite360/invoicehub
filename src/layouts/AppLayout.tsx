import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import PWAInstallBanner from '@/components/pwa/PWAInstallBanner';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const NAV_ITEMS = [
  { to: '/app/dashboard',   icon: '▦',  label: 'Dashboard' },
  { to: '/app/invoices',    icon: '🧾', label: 'Invoices' },
  { to: '/app/quotations',  icon: '📋', label: 'Quotations' },
  { to: '/app/receipts',    icon: '🧮', label: 'Receipts' },
  { to: '/app/letters',     icon: '✉️',  label: 'Letters' },
  { to: '/app/customers',   icon: '👥', label: 'Customers' },
  { to: '/app/payments',    icon: '💳', label: 'Payments' },
  { to: '/app/history',     icon: '📁', label: 'History' },
];

const BOTTOM_ITEMS = [
  { to: '/app/settings',   icon: '⚙️',  label: 'Settings' },
];

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isInstallable, isIOS, isInstalled, dismissed, install } = usePWAInstall();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} flex-shrink-0 bg-slate-900 text-white flex flex-col transition-all duration-300 ease-in-out`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-sm flex-shrink-0">IH</div>
          {sidebarOpen && (
            <div>
              <p className="font-bold text-sm leading-tight">InvoiceHub</p>
              <p className="text-slate-400 text-xs">Create. Send. Get Paid.</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Nav */}
        <div className="px-3 py-4 border-t border-slate-700 space-y-1">
          {BOTTOM_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}

          {/* Sign Out */}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
          >
            <span className="text-base flex-shrink-0">🚪</span>
            {sidebarOpen && <span>Sign Out</span>}
          </button>

          {/* PWA Install button (when installable and not installed) */}
          {!isInstalled && !dismissed && (isInstallable || isIOS) && sidebarOpen && (
            <button
              onClick={isInstallable ? install : undefined}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-300 hover:bg-blue-600 hover:text-white transition-colors"
            >
              <span className="text-base flex-shrink-0">📲</span>
              <span>Install App</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                {user?.email?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-700 leading-tight">
                  {user?.user_metadata?.full_name ?? 'User'}
                </p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* PWA Install Banner */}
      <PWAInstallBanner />
    </div>
  );
}
