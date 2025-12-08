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
      // Отримуємо всі продукти для витягування унікальних категорій
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('attributes');

      if (productsError) throw productsError;

      // Витягуємо унікальні категорії з attributes
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

      // Конвертуємо в масив та створюємо slug
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
    staleTime: 5 * 60 * 1000, // 5 хвилин
    gcTime: 10 * 60 * 1000, // 10 хвилин (gcTime замість cacheTime в React Query v5)
  });

  return {
    categories: data || [],
    isLoading,
    error,
  };
}

