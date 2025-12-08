import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '../lib/supabase';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  old_price: number | null;
  images: string[];
  attributes: Record<string, any>;
  description: string;
  in_stock: boolean;
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
}

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
  } = params;

  // Стабілізуємо масиви для queryKey (щоб уникнути зайвих ререндерів)
  const brandsKey = useMemo(() => [...brands].sort().join(','), [brands]);
  const problemsKey = useMemo(() => [...problems].sort().join(','), [problems]);
  const problemTagsKey = useMemo(() => [...problemTags].sort().join(','), [problemTags]);
  const ingredientsKey = useMemo(() => [...ingredients].sort().join(','), [ingredients]);

  // Стабілізуємо масиви для використання в queryFn
  const stableBrands = useMemo(() => brands, [brandsKey]);
  const stableProblems = useMemo(() => problems, [problemsKey]);
  const stableProblemTags = useMemo(() => problemTags, [problemTagsKey]);
  const stableIngredients = useMemo(() => ingredients, [ingredientsKey]);

  // Використовуємо React Query для кешування та дедуплікації запитів
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', category, minPrice, maxPrice, brandsKey, problemsKey, sortBy, page, pageSize, searchQuery, problemTagsKey, ingredientsKey],
    queryFn: async () => {
      // Build query
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' });

      // Search query filter - handled below with or() for better ingredient matching

      // Category filter (if provided)
      if (category) {
        query = query.eq('category', category);
      }

      // Price range filters
      if (minPrice !== undefined && minPrice > 0) {
        query = query.gte('price', minPrice);
      }
      if (maxPrice !== undefined && maxPrice > 0) {
        query = query.lte('price', maxPrice);
      }

      // Database-level filtering for JSONB attributes
      // Brand filter - check multiple keys
      if (stableBrands.length > 0) {
        const brandConditions = stableBrands.map(brand => 
          `attributes->>Виробник.ilike.%${brand}%,attributes->>Brand.ilike.%${brand}%`
        ).join(',');
        query = query.or(brandConditions);
      }

      // Categories filter (mapped from problems in Catalog.tsx) - check multiple keys
      if (stableProblems.length > 0) {
        const categoryConditions = stableProblems.map(problem => 
          `attributes->>Назва_групи.ilike.%${problem}%,attributes->>Category.ilike.%${problem}%`
        ).join(',');
        query = query.or(categoryConditions);
      }

      // Problems filter - check multiple keys with ilike for pipe-separated values
      if (stableProblemTags.length > 0) {
        const problemConditions = stableProblemTags.map(problem => 
          `attributes->>Проблема шкіри.ilike.%${problem}%,attributes->>Значення_Проблеми.ilike.%${problem}%,attributes->>Назва_Проблеми.ilike.%${problem}%,attributes->>Призначення.ilike.%${problem}%`
        ).join(',');
        query = query.or(problemConditions);
      }

      // Ingredients filter - check ingredients array or string fields
      if (stableIngredients.length > 0) {
        const ingredientConditions = stableIngredients.map(ingredient => 
          `attributes->>Інгредієнти.ilike.%${ingredient}%,attributes->>Ingredient.ilike.%${ingredient}%,attributes->>Ingredients.ilike.%${ingredient}%,attributes->>Ключові_інгредієнти.ilike.%${ingredient}%`
        ).join(',');
        query = query.or(ingredientConditions);
      }
      
      // Search query filter - search in name, description, and ingredients
      if (searchQuery) {
        if (!searchQuery.includes(' ')) {
          // Single word search - might be ingredient
          query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,attributes->>Інгредієнти.ilike.%${searchQuery}%,attributes->>Ingredient.ilike.%${searchQuery}%`);
        } else {
          // Multi-word search - search in name and description
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
    staleTime: 5 * 60 * 1000, // Дані вважаються свіжими 5 хвилин
    gcTime: 10 * 60 * 1000, // Кеш зберігається 10 хвилин
    // Повертаємо порожні дані поки завантажується
    placeholderData: { products: [], totalCount: 0 },
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