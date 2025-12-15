import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/features/auth/useUserStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const setSession = useUserStore.getState().setSession;
  const setIsLoading = useUserStore.getState().setIsLoading;
  const setIsInitialized = useUserStore.getState().setIsInitialized; // Added for race condition fix

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
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (error) throw error;
            
            if (!isMounted) return;
            
            // Update Zustand store
            setSession({
              user: {
                id: session.user.id,
                email: session.user.email || '',
              },
              profile: data || null,
            });
          } catch (profileError) {
            console.error('Error fetching user profile:', profileError);
            if (isMounted) {
              setSession({
                user: {
                  id: session.user.id,
                  email: session.user.email || '',
                },
                profile: null,
              });
            }
          }
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
          setIsInitialized(true); // Added for race condition fix
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