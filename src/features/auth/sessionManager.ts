import { supabase } from '../../lib/supabase';
import { useUserStore } from './useUserStore';
import type { UserSession } from '../../types/index';


export const fetchUserProfile = async (userId: string) => {
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


export const handleLogin = async (email: string, password: string) => {
  const setSession = useUserStore.getState().setSession;
  
  try {
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    if (data.session) {
      
      const profile = await fetchUserProfile(data.session.user.id);
      
      
      const userSession: UserSession = {
        user: {
          id: data.session.user.id,
          email: data.session.user.email || '',
        },
        profile,
      };
      
      
      setSession(userSession);
      
      return { success: true, error: null };
    }
    
    return { success: false, error: 'No session returned' };
  } catch (error: any) {
    console.error('Login error:', error);
    setSession(null);
    return { success: false, error: error.message || 'Login failed' };
  }
};


export const handleLogout = async () => {
  const clearSession = useUserStore.getState().clearSession;
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    
    
    clearSession();
    
    
    const { useCartStore } = await import('../../store/cartStore');
    useCartStore.getState().clearCart();
    
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Logout error:', error);
    return { success: false, error: error.message || 'Logout failed' };
  }
};