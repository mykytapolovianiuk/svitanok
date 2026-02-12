import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { OrderWithItems } from '@/types';
import { useUserStore } from '@/features/auth/useUserStore';

// Custom hook to fetch orders with caching
export const useOrders = (status?: string) => {
  const { session } = useUserStore();
  const userId = session?.user?.id;

  return useQuery<OrderWithItems[], Error>({
    queryKey: ['orders', userId, status], // Include userId in key to prevent leaking data if user switches
    queryFn: async () => {
      // Must have user
      if (!userId) return [];

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(*, products(*))
        `)
        .eq('user_id', userId) // Security: Ensure we only fetch current user's orders
        .order('created_at', { ascending: false });

      // Apply status filter if provided
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // Transform data if needed, but for now we expect it to match OrderWithItems
      return (data || []) as unknown as OrderWithItems[];
    },
    // Only fetch if we have a user
    enabled: !!userId,
    // Keep data fresh for 1 minute (orders can change via background processes/admin)
    staleTime: 1000 * 60,
    // Cache query results for 5 minutes
    gcTime: 1000 * 60 * 5,
  });
};