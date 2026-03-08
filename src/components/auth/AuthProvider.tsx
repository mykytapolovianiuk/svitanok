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
    let mounted = true;

    async function initializeAuth() {
      try {
        // 1. Get initial session immediately
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        await handleSessionUpdate(session);
      } catch (err) {
        console.error('Error getting initial session:', err);
        if (mounted) setSession(null);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    }

    async function handleSessionUpdate(session: any) {
      if (!session) {
        if (mounted) setSession(null);
        return;
      }

      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (mounted) {
          setSession({
            user: {
              id: session.user.id,
              email: session.user.email || '',
              phone: session.user.phone || '',
            },
            profile: profileData || null,
          });
        }
      } catch (err) {
        console.error('Error fetching profile on auth state change:', err);
        if (mounted) {
          setSession({
            user: {
              id: session.user.id,
              email: session.user.email || '',
              phone: session.user.phone || '',
            },
            profile: null,
          });
        }
      }
    }

    // Run initialization
    initializeAuth();

    // 2. Listen for future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Ignore initial event to prevent double firing, or handle dynamically
      if (event === 'INITIAL_SESSION') return;

      if (event === 'PASSWORD_RECOVERY') {
        navigate('/update-password');
      }

      if (event === 'SIGNED_OUT') {
        if (mounted) setSession(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        handleSessionUpdate(session);
      }
    });

    // 3. Tab visibility check
    const handleFocus = async () => {
      if (document.visibilityState === 'visible') {
        await supabase.auth.refreshSession();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []); // Run only once on mount

  return <>{children}</>;
}