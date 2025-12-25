import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface SiteSetting {
  key: string;
  value: string;
  label: string;
}

interface SiteSettingsState {
  settings: Record<string, string>;
  loading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
}

export const useSiteSettings = create<SiteSettingsState>((set, get) => ({
  settings: {},
  loading: false,
  error: null,
  
  fetchSettings: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');
        
      if (error) throw error;
      
      const settings: Record<string, string> = {};
      data?.forEach((setting: SiteSetting) => {
        settings[setting.key] = setting.value;
      });
      
      set({ settings, loading: false });
    } catch (error: any) {
      console.error('Error fetching site settings:', error);
      set({ error: error.message, loading: false });
    }
  },
  
  updateSetting: async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ value })
        .eq('key', key);
        
      if (error) throw error;
      
      
      set((state) => ({
        settings: {
          ...state.settings,
          [key]: value
        }
      }));
    } catch (error: any) {
      console.error('Error updating site setting:', error);
      set({ error: error.message });
      throw error;
    }
  }
}));


export const useSiteSetting = (key: string, defaultValue: string = '') => {
  const { settings } = useSiteSettings();
  return settings[key] || defaultValue;
};