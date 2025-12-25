import { Navigate } from 'react-router-dom';
import { useUserStore } from '../../features/auth/useUserStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { session, isLoading, isInitialized } = useUserStore();
  
  
  
  if (!isInitialized || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  
  
  if (requireAdmin && session.profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}