import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  requireBusiness?: boolean;
}

export default function ProtectedRoute({ requireBusiness = true }: Props) {
  const { session, loading, business, businessLoading, role } = useAuth();
  const location = useLocation();

  // Show spinner while loading auth state
  if (loading || (session && businessLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → login
  if (!session) return <Navigate to="/login" replace />;

  const isAdmin = role === 'super_admin' || role === 'finance_admin';
  const isAdminRoute = location.pathname.startsWith('/admin');

  // If trying to access admin route but not an admin → redirect to app dashboard
  if (isAdminRoute && !isAdmin) {
    return <Navigate to="/app/dashboard" replace />;
  }

  // Authenticated but no business yet → setup wizard
  // (only enforce this for app/* routes, not for the setup route itself)
  if (requireBusiness && !business) {
    if (isAdmin) {
      // Admins without a business shouldn't go to setup, they should go to their admin panel
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/setup" replace />;
  }

  // If they already have a business and try to access /setup, redirect to dashboard
  if (!requireBusiness && business && location.pathname === '/setup') {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
}
