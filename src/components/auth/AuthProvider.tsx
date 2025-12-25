import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/features/auth/useUserStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setSession = useUserStore.getState().setSession;
  const setIsLoading = useUserStore.getState().setIsLoading;
  const setIsInitialized = useUserStore.getState().setIsInitialized;

  
  useEffect(() => {
    
    setIsLoading(true);
    
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session) {
            
            try {
              const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (error) throw error;
              
              
              
              setSession({
                user: {
                  id: session.user.id,
                  email: session.user.email || '',
                  phone: session.user.phone || '', 
                },
                profile: data || null,
              });
            } catch (profileError) {
              console.error('Error fetching user profile:', profileError);
              
              
              setSession({
                user: {
                  id: session.user.id,
                  email: session.user.email || '',
                  phone: session.user.phone || '', 
                },
                profile: null,
              });
            }
          } else {
            
            setSession(null);
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
          setSession(null);
        } finally {
          
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    );

    
    return () => {
      subscription.unsubscribe();
    };
  }, []); 

  return <>{children}</>;
}