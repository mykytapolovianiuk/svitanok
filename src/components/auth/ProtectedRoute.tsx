import { Navigate } from 'react-router-dom';
import { useUserStore } from '../../features/auth/useUserStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { session, isLoading, isInitialized } = useUserStore();
  
  // Show loading spinner while checking auth state
  // Wait for initialization to complete before checking user status
  if (!isInitialized || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  // Redirect to auth if not logged in
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  
  // Redirect to home if admin access required but user is not admin
  if (requireAdmin && session.profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}