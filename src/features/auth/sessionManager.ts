import { supabase } from '../../lib/supabase';

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
// Removes manual Zustand mutations so AuthProvider handles it via onAuthStateChange
export const handleLogin = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.session) {
      return { success: true, error: null };
    }

    return { success: false, error: 'No session returned' };
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, error: error.message || 'Login failed' };
  }
};

// Function to handle logout
// Removes manual Zustand mutations so AuthProvider handles it via onAuthStateChange
export const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    // Clear cart when user logs out
    const { useCartStore } = await import('../../store/cartStore');
    useCartStore.getState().clearCart();

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Logout error:', error);
    return { success: false, error: error.message || 'Logout failed' };
  }
};