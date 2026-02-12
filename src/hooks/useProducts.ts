import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '../lib/supabase';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  old_price: number | null;
  images: string[] | null;
  attributes: Record<string, any>;
  description: string;
  in_stock: boolean;
  category_id?: string;
  brand_id?: number;
}

interface UseProductsParams {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  problems?: string[]; // This will be used for categories
  sortBy?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  problemTags?: string[];
  ingredients?: string[]; // For ingredient filtering
  skinTypes?: string[]; // For skin type filtering
  cosmeticClasses?: string[]; // For cosmetic class filtering
}

// Category slug to database value mapping
const CATEGORY_MAP: Record<string, string> = {
  'serums': 'Сироватки',
  'creams': 'Креми',
  'sunscreen': 'Сонцезахист',
  'cleansing': 'Очищення',
  'acids': 'Кислоти',
  'masks': 'Маски'
};

interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  totalPages: number;
}

export function useProducts(params: UseProductsParams = {}): UseProductsResult {
  const {
    category,
    minPrice,
    maxPrice,
    brands = [],
    problems = [], // Categories
    sortBy = 'newest',
    page = 1,
    pageSize = 12,
    searchQuery,
    problemTags = [],
    ingredients = [],
    skinTypes = [],
    cosmeticClasses = [],
  } = params;

  // Create query key dependencies
  // We sort arrays to ensure ['a', 'b'] and ['b', 'a'] produce the same cache key
  const queryKey = useMemo(() => [
    'products',
    {
      category,
      minPrice,
      maxPrice,
      brands: brands.sort().join(','),
      problems: problems.sort().join(','),
      sortBy,
      page,
      pageSize,
      searchQuery,
      problemTags: problemTags.sort().join(','),
      ingredients: ingredients.sort().join(','),
      skinTypes: skinTypes.sort().join(','),
      cosmeticClasses: cosmeticClasses.sort().join(',')
    }
  ], [
    category, minPrice, maxPrice, brands, problems, sortBy, page, pageSize,
    searchQuery, problemTags, ingredients, skinTypes, cosmeticClasses
  ]);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      // Build query
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' });

      // Category filter
      if (category) {
        // First check if it's a mapped slug
        const mappedCategory = CATEGORY_MAP[category];
        if (mappedCategory) {
          // Use JSONB containment for mapped categories
          query = query.or(`attributes.cs.{"Препарати":"${mappedCategory}"}`);
        } else {
          // Fallback to direct category matching (check categories table)
          const { data: categoryData } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', category)
            .single();

          if (categoryData) {
            query = query.eq('category_id', categoryData.id);
          } else {
            // Last resort: ensure we handle decoding if needed or partial match
            const decodedCategory = decodeURIComponent(category);
            query = query.or(`attributes->>Назва_групи.ilike.%${decodedCategory}%,attributes->>Category.ilike.%${decodedCategory}%`);
          }
        }
      }

      // Price range filters
      if (minPrice !== undefined && minPrice > 0) {
        query = query.gte('price', minPrice);
      }
      if (maxPrice !== undefined && maxPrice > 0) {
        query = query.lte('price', maxPrice);
      }

      // Brand filter
      if (brands.length > 0) {
        const brandIds = brands
          .map(id => parseInt(id, 10))
          .filter(id => !isNaN(id));

        if (brandIds.length > 0) {
          query = query.in('brand_id', brandIds);
        }
      }

      // Categories filter (mapped from problems in Catalog.tsx)
      if (problems.length > 0) {
        const { data: categoryIds } = await supabase
          .from('categories')
          .select('id')
          .in('name', problems);

        if (categoryIds && categoryIds.length > 0) {
          const ids = categoryIds.map(cat => cat.id);
          query = query.in('category_id', ids);
        }
      }

      // Problems filter (Problem Tags)
      if (problemTags.length > 0) {
        const conditions = problemTags.map(problem => {
          const jsonFilter = JSON.stringify({ "Проблема шкіри": [problem] });
          return `attributes.cs.${jsonFilter}`;
        }).join(',');
        query = query.or(conditions);
      }

      // Ingredients filter
      if (ingredients.length > 0) {
        const ingredientConditions = ingredients.map(ingredient =>
          `attributes->>Інгредієнти.ilike.%${ingredient}%,attributes->>Ingredient.ilike.%${ingredient}%,attributes->>Ingredients.ilike.%${ingredient}%,attributes->>Ключові_інгредієнти.ilike.%${ingredient}%`
        ).join(',');
        query = query.or(ingredientConditions);
      }

      // Skin Types filter
      if (skinTypes.length > 0) {
        const skinTypeConditions = skinTypes.map(skinType => {
          const jsonFilter = JSON.stringify({ "Тип шкіри": [skinType] });
          return `attributes.cs.${jsonFilter}`;
        }).join(',');
        query = query.or(skinTypeConditions);
      }

      // Cosmetic Classes filter
      if (cosmeticClasses.length > 0) {
        const classConditions = cosmeticClasses.map(cosmeticClass => {
          const jsonFilter = JSON.stringify({ "Клас косметики": [cosmeticClass] });
          return `attributes.cs.${jsonFilter}`;
        }).join(',');
        query = query.or(classConditions);
      }

      // Search query filter
      if (searchQuery) {
        if (!searchQuery.includes(' ')) {
          query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,attributes->>Інгредієнти.ilike.%${searchQuery}%,attributes->>Ingredient.ilike.%${searchQuery}%`);
        } else {
          query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }
      }

      // Sorting
      switch (sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Execute query
      const result = await query;

      if (result.error) throw result.error;

      return {
        products: (result.data || []) as Product[],
        totalCount: result.count || 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
  });

  const products = data?.products || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    products,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    totalCount,
    totalPages,
  };
}