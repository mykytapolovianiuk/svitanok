import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/features/auth/useUserStore';
import { useNavigate } from 'react-router-dom';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setSession = useUserStore.getState().setSession;
  const setIsLoading = useUserStore.getState().setIsLoading;
  const setIsInitialized = useUserStore.getState().setIsInitialized;
  const navigate = useNavigate();

  // Set up persistent auth state listener
  useEffect(() => {
    // Set initial loading state
    setIsLoading(true);

    // Event Listener for Tab Focus (Fixes background throttling timeout issue)
    const handleFocus = async () => {
      if (document.visibilityState === 'visible') {
        const { data: { session } } = await supabase.auth.getSession();
        // The getSession() call forces Supabase to check/refresh token if needed.
        // It triggers onAuthStateChange with TOKEN_REFRESHED if refreshed.
        // So we might not need to manually setSession here if the listener catches it,
        // but setting it strictly doesn't hurt.
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          navigate('/update-password');
        }

        // Handle Token Refresh explicitly to ensure UI stays in sync
        if (event === 'TOKEN_REFRESHED') {
          // just let it fall through to update session
        }

        try {
          if (session) {
            // Fetch user profile
            try {
              const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (error) throw error;

              // Update Zustand store with user and profile
              // CRITICAL FIX: Get phone from Auth, not just Profile
              setSession({
                user: {
                  id: session.user.id,
                  email: session.user.email || '',
                  phone: session.user.phone || '', // <-- CRITICAL FIX: Get phone from Auth
                },
                profile: data || null,
              });
            } catch (profileError) {
              console.error('Error fetching user profile:', profileError);
              // Update Zustand store with user only
              // CRITICAL FIX: Get phone from Auth, not just Profile
              setSession({
                user: {
                  id: session.user.id,
                  email: session.user.email || '',
                  phone: session.user.phone || '', // <-- CRITICAL FIX: Get phone from Auth
                },
                profile: null,
              });
            }
          } else {
            // Clear session in store
            setSession(null);
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
          setSession(null);
        } finally {
          // ALWAYS unblock the UI
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    );

    // Clean up listener on unmount
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []); // Run only once on mount

  return <>{children}</>;
}