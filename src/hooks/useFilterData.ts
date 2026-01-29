import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

interface FilterOption {
  id: string;
  name: string;
}

interface ProductMeta {
  id: number;
  brand_id: number;
  category_id: string;
  attributes: Record<string, any>;
  price: number;
}

interface UseFilterDataReturn {
  availableBrands: FilterOption[];
  availableCategories: FilterOption[];
  skinTypes: string[];
  loading: boolean;
  getAvailableCategories: (selectedBrandIds: string[]) => FilterOption[];
  getAvailableBrands: (selectedCategoryIds: string[]) => FilterOption[];
}

export function useFilterData(
  selectedBrandIdsStr: string[] = [],
  selectedCategoryIds: string[] = []
): UseFilterDataReturn {
  const [products, setProducts] = useState<ProductMeta[]>([]);
  const [allBrands, setAllBrands] = useState<FilterOption[]>([]);
  const [allCategories, setAllCategories] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch Brands
        const { data: brandsData } = await supabase
          .from('brands')
          .select('id, name')
          .order('name');

        // Fetch Categories
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('id, name')
          .order('name');

        // Fetch ALL Active Products (Lightweight payload)
        // We need this entire dataset to map relations client-side efficiently
        const { data: productData, error } = await supabase
          .from('products')
          .select('id, brand_id, category_id, attributes, price')
          .eq('in_stock', true); // Optional: only show filters for in-stock items

        if (error) throw error;

        setAllBrands(brandsData?.map(b => ({ id: b.id.toString(), name: b.name })) || []);
        setAllCategories(categoriesData?.map(c => ({ id: c.id, name: c.name })) || []);
        setProducts(productData || []);
      } catch (err) {
        console.error('Filter data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2. Helper: Extract attribute values (e.g. Skin Types)
  const skinTypes = useMemo(() => {
    const unique = new Set<string>();
    products.forEach(p => {
      const val = p.attributes?.['Тип шкіри'];
      if (val) {
        if (Array.isArray(val)) val.forEach(v => unique.add(v));
        else unique.add(val as string);
      }
    });
    return Array.from(unique).sort();
  }, [products]);

  // 3. Logic: Filter Brands based on selected Categories
  const availableBrands = useMemo(() => {
    // If no categories selected, show all brands
    if (selectedCategoryIds.length === 0) return allBrands;

    // Find products that match ANY of the selected categories
    const matchingBrandIds = new Set<number>();
    products.forEach(p => {
      if (selectedCategoryIds.includes(p.category_id)) {
        matchingBrandIds.add(p.brand_id);
      }
    });

    // Return only brands that have products in those categories
    return allBrands.filter(b => matchingBrandIds.has(Number(b.id)));
  }, [selectedCategoryIds, allBrands, products]);

  // 4. Logic: Filter Categories based on selected Brands
  const availableCategories = useMemo(() => {
    // If no brands selected, show all categories
    if (selectedBrandIdsStr.length === 0) return allCategories;

    const selectedBrandIdsNum = selectedBrandIdsStr.map(Number);
    const matchingCategoryIds = new Set<string>();

    products.forEach(p => {
      if (selectedBrandIdsNum.includes(p.brand_id)) {
        matchingCategoryIds.add(p.category_id);
      }
    });

    return allCategories.filter(c => matchingCategoryIds.has(c.id));
  }, [selectedBrandIdsStr, allCategories, products]);

  // Compatibility helpers (in case component uses them directly, though useMemo above handles it automatically)
  const getAvailableCategories = (brandIds: string[]) => {
    if (brandIds.length === 0) return allCategories;
    const nums = brandIds.map(Number);
    const ids = new Set(products.filter(p => nums.includes(p.brand_id)).map(p => p.category_id));
    return allCategories.filter(c => ids.has(c.id));
  };

  const getAvailableBrands = (catIds: string[]) => {
    if (catIds.length === 0) return allBrands;
    const ids = new Set(products.filter(p => catIds.includes(p.category_id)).map(p => p.brand_id));
    return allBrands.filter(b => ids.has(Number(b.id)));
  };

  return {
    availableBrands,
    availableCategories,
    skinTypes,
    loading,
    getAvailableCategories,
    getAvailableBrands
  };
}