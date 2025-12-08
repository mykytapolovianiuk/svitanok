import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { OrderWithItems } from '@/types';

// Custom hook to fetch orders with caching
export const useOrders = (status?: string) => {
  return useQuery<OrderWithItems[], Error>({
    queryKey: ['orders', status], // Unique key based on status filter
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(*, products(*))
        `)
        .order('created_at', { ascending: false });

      // Apply status filter if provided
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    // Keep data fresh for 1 minute (orders can change frequently)
    staleTime: 1000 * 60,
    // Cache query results for 5 minutes
    gcTime: 1000 * 60 * 5,
  });
};