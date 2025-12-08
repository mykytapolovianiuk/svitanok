import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

// Custom hook to fetch user profile with caching
export const useProfile = (userId: string) => {
  return useQuery<Profile, Error>({
    queryKey: ['profile', userId], // Unique key based on user ID
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
    // Keep data fresh for 5 minutes
    staleTime: 1000 * 60 * 5,
    // Cache query results for 10 minutes
    gcTime: 1000 * 60 * 10,
    // Only fetch if we have a user ID
    enabled: !!userId,
  });
};