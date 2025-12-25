import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Category {
  name: string;
  slug: string;
  count?: number;
}

export function useCategories() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('attributes');

      if (productsError) throw productsError;

      
      const categoriesMap = new Map<string, number>();

      products?.forEach((product) => {
        const categoryName = 
          product.attributes?.Назва_групи || 
          product.attributes?.Category ||
          product.attributes?.category;
        
        if (categoryName) {
          const count = categoriesMap.get(categoryName) || 0;
          categoriesMap.set(categoryName, count + 1);
        }
      });

      
      const categories: Category[] = Array.from(categoriesMap.entries())
        .map(([name, count]) => ({
          name,
          slug: name.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, ''),
          count,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'uk'));

      return categories;
    },
    staleTime: 5 * 60 * 1000, 
    gcTime: 10 * 60 * 1000, 
  });

  return {
    categories: data || [],
    isLoading,
    error,
  };
}

