import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query'; // Check/Install @tanstack/react-query
import { supabase } from '@/lib/supabase';

interface ProductFilterData {
  brand_id: number;
  category_id: string;
  attributes: Record<string, any>;
  price: number;
}

interface FilterOption {
  id: string;
  name: string;
}

interface UseFilterDataReturn {
  // Available options based on selections
  availableBrands: FilterOption[];
  availableCategories: FilterOption[];
  skinTypes: string[];

  // Loading state
  loading: boolean;

  // Helper functions
  getAvailableCategories: (selectedBrandIds: number[]) => FilterOption[];
  getAvailableBrands: (selectedCategoryIds: string[]) => FilterOption[];
  getAllAttributeValues: (attributeKey: string) => string[];
}

export function useFilterData(): UseFilterDataReturn {
  // Fetch all necessary data in parallel using React Query
  const { data, isLoading } = useQuery({
    queryKey: ['filter-data'],
    queryFn: async () => {
      // Execute all requests in parallel
      const [productsResponse, brandsResponse, categoriesResponse] = await Promise.all([
        supabase
          .from('products')
          .select('brand_id, category_id, attributes, price')
          .gt('price', 0)
          .limit(10000), // Reasonable limit for filter calculation
        supabase
          .from('brands')
          .select('id, name')
          .order('name'),
        supabase
          .from('categories')
          .select('id, name')
          .order('name')
      ]);

      if (productsResponse.error) throw productsResponse.error;
      if (brandsResponse.error) throw brandsResponse.error;
      if (categoriesResponse.error) throw categoriesResponse.error;

      return {
        products: (productsResponse.data || []) as ProductFilterData[],
        brands: (brandsResponse.data?.map(b => ({ id: b.id.toString(), name: b.name })) || []) as FilterOption[],
        categories: (categoriesResponse.data?.map(c => ({ id: c.id, name: c.name })) || []) as FilterOption[]
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - filters rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const products = data?.products || [];
  const brands = data?.brands || [];
  const categories = data?.categories || [];

  // Extract unique attribute values from all products
  // Memoized function creation to keep stable reference
  const extractAttributeValues = useMemo(() => {
    return (attributeKey: string): string[] => {
      if (!products.length) return [];

      const uniqueValues = new Set<string>();

      for (const product of products) {
        const value = product.attributes?.[attributeKey];

        if (value) {
          if (Array.isArray(value)) {
            // Handle array values
            for (const item of value) {
              if (item && typeof item === 'string' && item.trim()) {
                uniqueValues.add(item.trim());
              }
            }
          } else if (typeof value === 'string') {
            // Handle string values (including pipe-separated)
            if (value.includes('|')) {
              const parts = value.split('|');
              for (const part of parts) {
                if (part.trim()) uniqueValues.add(part.trim());
              }
            } else {
              uniqueValues.add(value.trim());
            }
          }
        }
      }

      return Array.from(uniqueValues).sort();
    };
  }, [products]);

  // Get available categories based on selected brands
  const getAvailableCategories = useMemo(() => {
    return (selectedBrandIds: number[]): FilterOption[] => {
      if (!categories.length) return [];
      if (selectedBrandIds.length === 0) {
        return categories;
      }

      const availableCategoryIds = new Set<string>();

      for (const product of products) {
        if (selectedBrandIds.includes(product.brand_id)) {
          availableCategoryIds.add(product.category_id);
        }
      }

      return categories.filter(cat => availableCategoryIds.has(cat.id));
    };
  }, [products, categories]);

  // Get available brands based on selected categories
  const getAvailableBrands = useMemo(() => {
    return (selectedCategoryIds: string[]): FilterOption[] => {
      if (!brands.length) return [];
      if (selectedCategoryIds.length === 0) {
        return brands;
      }

      const availableBrandIds = new Set<number>();

      for (const product of products) {
        if (selectedCategoryIds.includes(product.category_id)) {
          availableBrandIds.add(product.brand_id);
        }
      }

      return brands.filter(brand => availableBrandIds.has(Number(brand.id)));
    };
  }, [products, brands]);

  // Memoized available options
  const availableBrands = brands;
  const availableCategories = categories;
  const skinTypes = useMemo(() => extractAttributeValues('Тип шкіри'), [extractAttributeValues]);

  return {
    availableBrands,
    availableCategories,
    skinTypes,
    loading: isLoading,
    getAvailableCategories,
    getAvailableBrands,
    getAllAttributeValues: extractAttributeValues
  };
}