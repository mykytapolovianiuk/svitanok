import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/features/auth/useUserStore';
import { fetchUserProfile } from '@/features/auth/sessionManager';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const setSession = useUserStore.getState().setSession;
  const setIsLoading = useUserStore.getState().setIsLoading;

  // Sync auth state on route changes
  useEffect(() => {
    let isMounted = true;
    
    const syncAuthState = async () => {
      try {
        if (!isMounted) return;
        
        setIsLoading(true);
        
        // Get current session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (session) {
          // Fetch user profile
          const profile = await fetchUserProfile(session.user.id);
          
          if (!isMounted) return;
          
          // Update Zustand store
          setSession({
            user: {
              id: session.user.id,
              email: session.user.email || '',
            },
            profile,
          });
        } else {
          // Clear session in store
          setSession(null);
        }
      } catch (error) {
        console.error('Error syncing auth state:', error);
        if (isMounted) {
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    syncAuthState();
    
    return () => {
      isMounted = false;
    };
  }, [location.pathname]); // Re-run on route changes

  return <>{children}</>;
}