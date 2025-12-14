import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/features/auth/useUserStore';

// Function to fetch user profile
const fetchUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const setSession = useUserStore.getState().setSession;
  const setIsLoading = useUserStore.getState().setIsLoading;

  // Sync auth state on route changes
  useEffect(() => {
    const syncAuthState = async () => {
      try {
        setIsLoading(true);
        
        // Get current session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Fetch user profile
          const profile = await fetchUserProfile(session.user.id);
          
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
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    syncAuthState();
  }, [location.pathname]); // Re-run on route changes

  return <>{children}</>;
}