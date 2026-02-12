import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  count?: number;
}

export function useCategories() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      // Fetch categories directly from the table
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Note: If you absolutely need product counts per category, you can:
      // 1. Create a database view or RPC function
      // 2. Fetch product counts in a separate lightweight query
      // 3. Keep the old heavy logic (not recommended)

      // For now, we return categories without dynamic counts to prioritize speed.
      // Most e-commerce sites don't show dynamic counts in the main menu to perform better.

      return categoriesData?.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        image: cat.image,
        count: 0 // Placeholder
      })) as Category[];
    },
    staleTime: 60 * 60 * 1000, // 1 hour - categories rarely change
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });

  return {
    categories: data || [],
    isLoading,
    error,
  };
}
