import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { OrderWithItems } from '@/types';


export const useOrders = (status?: string) => {
  return useQuery<OrderWithItems[], Error>({
    queryKey: ['orders', status], 
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(*, products(*))
        `)
        .order('created_at', { ascending: false });

      
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    
    staleTime: 1000 * 60,
    
    gcTime: 1000 * 60 * 5,
  });
};