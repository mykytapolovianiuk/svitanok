import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/features/auth/useUserStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setSession = useUserStore.getState().setSession;
  const setIsLoading = useUserStore.getState().setIsLoading;
  const setIsInitialized = useUserStore.getState().setIsInitialized;

  // Set up persistent auth state listener
  useEffect(() => {
    // Set initial loading state
    setIsLoading(true);
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
              setSession({
                user: {
                  id: session.user.id,
                  email: session.user.email || '',
                },
                profile: data || null,
              });
            } catch (profileError) {
              console.error('Error fetching user profile:', profileError);
              // Update Zustand store with user only
              setSession({
                user: {
                  id: session.user.id,
                  email: session.user.email || '',
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
    };
  }, []); // Run only once on mount

  return <>{children}</>;
}