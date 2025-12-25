import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';


export const useProfile = (userId: string) => {
  return useQuery<Profile, Error>({
    queryKey: ['profile', userId], 
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    
    staleTime: 1000 * 60 * 5,
    
    gcTime: 1000 * 60 * 10,
    
    enabled: !!userId,
  });
};