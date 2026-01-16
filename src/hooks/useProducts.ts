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
    skinTypes = [], // New parameter
    cosmeticClasses = [], // New parameter
  } = params;

  // Стабілізуємо масиви для queryKey (щоб уникнути зайвих ререндерів)
  const brandsKey = useMemo(() => [...brands].sort().join(','), [brands]);
  const problemsKey = useMemo(() => [...problems].sort().join(','), [problems]);
  const problemTagsKey = useMemo(() => [...problemTags].sort().join(','), [problemTags]);
  const ingredientsKey = useMemo(() => [...ingredients].sort().join(','), [ingredients]);
  const skinTypesKey = useMemo(() => [...skinTypes].sort().join(','), [skinTypes]); // New key
  const cosmeticClassesKey = useMemo(() => [...cosmeticClasses].sort().join(','), [cosmeticClasses]); // New key

  // Стабілізуємо масиви для використання в queryFn
  const stableBrands = useMemo(() => brands, [brandsKey]);
  const stableProblems = useMemo(() => problems, [problemsKey]);
  const stableProblemTags = useMemo(() => problemTags, [problemTagsKey]);
  const stableIngredients = useMemo(() => ingredients, [ingredientsKey]);
  const stableSkinTypes = useMemo(() => skinTypes, [skinTypesKey]); // New stable array
  const stableCosmeticClasses = useMemo(() => cosmeticClasses, [cosmeticClassesKey]); // New stable array

  // Використовуємо React Query для кешування та дедуплікації запитів
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', category, minPrice, maxPrice, brandsKey, problemsKey, sortBy, page, pageSize, searchQuery, problemTagsKey, ingredientsKey, skinTypesKey, cosmeticClassesKey],
    queryFn: async () => {
      // Build query
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' });

      // Search query filter - handled below with or() for better ingredient matching

      // Category filter (if provided) - now using category_id
      if (category) {
        // First get category ID from slug
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', category)
          .single();

        if (categoryData) {
          query = query.eq('category_id', categoryData.id);
        } else {
          // Fallback to old method if category not found
          query = query.eq('category', category);
        }
      }

      // Price range filters
      if (minPrice !== undefined && minPrice > 0) {
        query = query.gte('price', minPrice);
      }
      if (maxPrice !== undefined && maxPrice > 0) {
        query = query.lte('price', maxPrice);
      }

      // Database-level filtering for JSONB attributes
      // Brand filter - convert string IDs to numbers and use foreign key
      if (stableBrands.length > 0) {
        // Convert string brand IDs to numbers
        const brandIds = stableBrands
          .map(id => parseInt(id, 10))
          .filter(id => !isNaN(id));
        
        if (brandIds.length > 0) {
          query = query.in('brand_id', brandIds);
        }
      }

      // Categories filter (mapped from problems in Catalog.tsx) - now using foreign key
      if (stableProblems.length > 0) {
        // First try to match with category table
        const { data: categoryIds } = await supabase
          .from('categories')
          .select('id')
          .in('name', stableProblems);

        if (categoryIds && categoryIds.length > 0) {
          const ids = categoryIds.map(cat => cat.id);
          query = query.in('category_id', ids);
        }
        // Note: Removed fallback to old method since we're using foreign keys now
      }

      // Problems filter - check multiple keys with JSONB contains for arrays
      if (stableProblemTags.length > 0) {
        // Use JSON containment operator on root object for robust filtering
        // Format: attributes.cs.{"Проблема шкіри": ["Value"]}
        const conditions = stableProblemTags.map(problem => {
          const jsonFilter = JSON.stringify({ "Проблема шкіри": [problem] });
          return `attributes.cs.${jsonFilter}`;
        }).join(',');
        query = query.or(conditions);
      }

      // Ingredients filter - check ingredients array or string fields
      if (stableIngredients.length > 0) {
        const ingredientConditions = stableIngredients.map(ingredient => 
          `attributes->>Інгредієнти.ilike.%${ingredient}%,attributes->>Ingredient.ilike.%${ingredient}%,attributes->>Ingredients.ilike.%${ingredient}%,attributes->>Ключові_інгредієнти.ilike.%${ingredient}%`
        ).join(',');
        query = query.or(ingredientConditions);
      }
      
      // Skin Types filter - check skin type attributes with JSON containment
      if (stableSkinTypes.length > 0) {
        // Use JSON containment operator on root object for robust filtering
        const skinTypeConditions = stableSkinTypes.map(skinType => {
          const jsonFilter = JSON.stringify({ "Тип шкіри": [skinType] });
          return `attributes.cs.${jsonFilter}`;
        }).join(',');
        query = query.or(skinTypeConditions);
      }
      
      // Cosmetic Classes filter - check cosmetic class attributes with JSON containment
      if (stableCosmeticClasses.length > 0) {
        // Use JSON containment operator on root object for robust filtering
        const classConditions = stableCosmeticClasses.map(cosmeticClass => {
          const jsonFilter = JSON.stringify({ "Клас косметики": [cosmeticClass] });
          return `attributes.cs.${jsonFilter}`;
        }).join(',');
        query = query.or(classConditions);
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