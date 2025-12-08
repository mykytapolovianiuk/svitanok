import { create } from 'zustand';
import type { UserSession } from '../../types';
import { supabase } from '../../lib/supabase';

interface UserStore {
  session: UserSession | null;
  isLoading: boolean;
  setSession: (session: UserSession | null) => void;
  setIsLoading: (loading: boolean) => void;
  isAdmin: () => boolean;
  clearSession: () => void;
  refreshProfile: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  session: null,
  isLoading: true,

  setSession: (session) => {
    set({ session, isLoading: false });
  },

  setIsLoading: (loading) => {
    set({ isLoading: loading });
  },

  isAdmin: () => {
    const session = get().session;
    return session?.profile?.role === 'admin';
  },

  clearSession: () => {
    set({ session: null });
  },

  // Метод для оновлення профілю
  refreshProfile: async () => {
    const currentSession = get().session;
    if (currentSession?.user?.id) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          set({
            session: {
              ...currentSession,
              profile: data
            }
          });
        }
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    }
  }
}));