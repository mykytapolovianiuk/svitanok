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
  problems?: string[]; 
  sortBy?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  problemTags?: string[];
  ingredients?: string[]; 
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
    problems = [], 
    sortBy = 'newest',
    page = 1,
    pageSize = 12,
    searchQuery,
    problemTags = [],
    ingredients = [],
  } = params;

  
  const brandsKey = useMemo(() => [...brands].sort().join(','), [brands]);
  const problemsKey = useMemo(() => [...problems].sort().join(','), [problems]);
  const problemTagsKey = useMemo(() => [...problemTags].sort().join(','), [problemTags]);
  const ingredientsKey = useMemo(() => [...ingredients].sort().join(','), [ingredients]);

  
  const stableBrands = useMemo(() => brands, [brandsKey]);
  const stableProblems = useMemo(() => problems, [problemsKey]);
  const stableProblemTags = useMemo(() => problemTags, [problemTagsKey]);
  const stableIngredients = useMemo(() => ingredients, [ingredientsKey]);

  
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', category, minPrice, maxPrice, brandsKey, problemsKey, sortBy, page, pageSize, searchQuery, problemTagsKey, ingredientsKey],
    queryFn: async () => {
      
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' });

      

      
      if (category) {
        
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', category)
          .single();

        if (categoryData) {
          query = query.eq('category_id', categoryData.id);
        } else {
          
          query = query.eq('category', category);
        }
      }

      
      if (minPrice !== undefined && minPrice > 0) {
        query = query.gte('price', minPrice);
      }
      if (maxPrice !== undefined && maxPrice > 0) {
        query = query.lte('price', maxPrice);
      }

      
      
      if (stableBrands.length > 0) {
        
        const brandConditions = stableBrands.map(brand => 
          `attributes->>Виробник.eq.${brand},attributes->>Brand.eq.${brand}`
        ).join(',');
        query = query.or(brandConditions);
      }

      
      if (stableProblems.length > 0) {
        
        const { data: categoryIds } = await supabase
          .from('categories')
          .select('id')
          .in('name', stableProblems);

        if (categoryIds && categoryIds.length > 0) {
          const ids = categoryIds.map(cat => cat.id);
          query = query.in('category_id', ids);
        } else {
          
          const categoryConditions = stableProblems.map(problem => 
            `attributes->>Назва_групи.ilike.%${problem}%,attributes->>Category.ilike.%${problem}%`
          ).join(',');
          query = query.or(categoryConditions);
        }
      }

      
      if (stableProblemTags.length > 0) {
        const problemConditions = stableProblemTags.map(problem => 
          `attributes->>Проблема шкіри.ilike.%${problem}%,attributes->>Значення_Проблеми.ilike.%${problem}%,attributes->>Назва_Проблеми.ilike.%${problem}%,attributes->>Призначення.ilike.%${problem}%`
        ).join(',');
        query = query.or(problemConditions);
      }

      
      if (stableIngredients.length > 0) {
        const ingredientConditions = stableIngredients.map(ingredient => 
          `attributes->>Інгредієнти.ilike.%${ingredient}%,attributes->>Ingredient.ilike.%${ingredient}%,attributes->>Ingredients.ilike.%${ingredient}%,attributes->>Ключові_інгредієнти.ilike.%${ingredient}%`
        ).join(',');
        query = query.or(ingredientConditions);
      }
      
      
      if (searchQuery) {
        if (!searchQuery.includes(' ')) {
          
          query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,attributes->>Інгредієнти.ilike.%${searchQuery}%,attributes->>Ingredient.ilike.%${searchQuery}%`);
        } else {
          
          query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }
      }

      
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

      
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      
      const result = await query;

      if (result.error) throw result.error;

      return {
        products: (result.data || []) as Product[],
        totalCount: result.count || 0,
      };
    },
    staleTime: 5 * 60 * 1000, 
    gcTime: 10 * 60 * 1000, 
    
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