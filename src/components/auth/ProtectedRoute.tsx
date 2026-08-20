import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  requireBusiness?: boolean;
}

export default function ProtectedRoute({ requireBusiness = true }: Props) {
  const { session, loading, business, businessLoading } = useAuth();

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

  // Authenticated but no business yet → setup wizard
  // (only enforce this for app/* routes, not for the setup route itself)
  if (requireBusiness && !business) {
    return <Navigate to="/setup" replace />;
  }

  return <Outlet />;
}
