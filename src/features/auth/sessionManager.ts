import { supabase } from '../../lib/supabase';
import { useUserStore } from './useUserStore';
import type { UserSession } from '../../types/index';

// Function to fetch user profile
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

// Function to handle login
export const handleLogin = async (email: string, password: string) => {
  const setSession = useUserStore.getState().setSession;
  
  try {
    // Sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    if (data.session) {
      // Fetch user profile
      const profile = await fetchUserProfile(data.session.user.id);
      
      // Create user session object
      const userSession: UserSession = {
        user: {
          id: data.session.user.id,
          email: data.session.user.email || '',
        },
        profile,
      };
      
      // Set session in store
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

// Function to handle logout
export const handleLogout = async () => {
  const clearSession = useUserStore.getState().clearSession;
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    
    // Clear session in store
    clearSession();
    
    // Clear cart when user logs out
    const { useCartStore } = await import('../../store/cartStore');
    useCartStore.getState().clearCart();
    
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Logout error:', error);
    return { success: false, error: error.message || 'Logout failed' };
  }
};
