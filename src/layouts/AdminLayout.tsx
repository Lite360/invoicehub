import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function AdminLayout() {
  const { session, signOut } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { name: 'Users', href: '/admin/users', icon: '👥' },
    { name: 'Businesses', href: '/admin/businesses', icon: '🏢' },
    { name: 'Plans', href: '/admin/plans', icon: '💳' },
    { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 z-10">
        <div className="p-6">
          <Link to="/admin/dashboard" className="text-xl font-bold flex items-center gap-2">
            <span className="text-blue-500">🛡️</span> Admin Panel
          </Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white font-medium' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="text-sm text-slate-400 mb-4 px-2 overflow-hidden text-ellipsis">
            Logged in as<br/>
            <strong className="text-white truncate block" title={session?.user.email}>
              {session?.user.email}
            </strong>
          </div>
          <Button 
            variant="outline" 
            className="w-full bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={() => signOut()}
          >
            Sign Out
          </Button>
          <Link to="/app/dashboard" className="block mt-4 text-center text-xs text-slate-500 hover:text-slate-300">
            ← Back to User App
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 ml-64 p-8">
        <Outlet />
      </div>
    </div>
  );
}
