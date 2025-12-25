import { create } from 'zustand';
import type { UserSession } from '../../types';
import { supabase } from '../../lib/supabase';

interface UserStore {
  session: UserSession | null;
  isLoading: boolean;
  isInitialized: boolean; 
  setSession: (session: UserSession | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsInitialized: (initialized: boolean) => void; 
  isAdmin: () => boolean;
  isAuthenticated: () => boolean;
  clearSession: () => void;
  refreshProfile: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  session: null,
  isLoading: true,
  isInitialized: false, 

  setSession: (session) => {
    set({ session, isLoading: false, isInitialized: true }); 
  },

  setIsLoading: (loading) => {
    set({ isLoading: loading });
  },

  setIsInitialized: (initialized) => { 
    set({ isInitialized: initialized });
  },

  isAdmin: () => {
    const session = get().session;
    return session?.profile?.role === 'admin';
  },

  isAuthenticated: () => {
    const session = get().session;
    return !!session;
  },

  clearSession: () => {
    set({ session: null, isInitialized: true }); 
  },

  
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