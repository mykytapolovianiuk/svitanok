import { useState, useEffect, useMemo } from 'react';
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
  const [products, setProducts] = useState<ProductFilterData[]>([]);
  const [brands, setBrands] = useState<FilterOption[]>([]);
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all filter data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch products with brand_id, category_id, attributes, and price
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('brand_id, category_id, attributes, price')
          .gt('price', 0) // Only products with valid prices
          .limit(10000); // Reasonable limit for performance

        if (productError) throw productError;

        // Fetch brands
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select('id, name')
          .order('name');

        if (brandError) throw brandError;

        // Fetch categories
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id, name')
          .order('name');

        if (categoryError) throw categoryError;

        setProducts(productData || []);
        setBrands(brandData?.map(b => ({ id: b.id.toString(), name: b.name })) || []);
        setCategories(categoryData?.map(c => ({ id: c.id, name: c.name })) || []);

      } catch (error) {
        console.error('Error fetching filter data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Extract unique attribute values from all products
  const extractAttributeValues = useMemo(() => {
    return (attributeKey: string): string[] => {
      const uniqueValues = new Set<string>();

      products.forEach(product => {
        const value = product.attributes?.[attributeKey];

        if (value) {
          if (Array.isArray(value)) {
            // Handle array values
            value.forEach(item => {
              if (item && typeof item === 'string' && item.trim()) {
                uniqueValues.add(item.trim());
              }
            });
          } else if (typeof value === 'string') {
            // Handle string values (including pipe-separated)
            if (value.includes('|')) {
              value.split('|').forEach(part => {
                if (part.trim()) uniqueValues.add(part.trim());
              });
            } else {
              uniqueValues.add(value.trim());
            }
          }
        }
      });

      return Array.from(uniqueValues).sort();
    };
  }, [products]);

  // Get available categories based on selected brands
  const getAvailableCategories = useMemo(() => {
    return (selectedBrandIds: number[]): FilterOption[] => {
      if (selectedBrandIds.length === 0) {
        return categories;
      }

      const availableCategoryIds = new Set<string>();

      products.forEach(product => {
        if (selectedBrandIds.includes(product.brand_id)) {
          availableCategoryIds.add(product.category_id);
        }
      });

      return categories.filter(cat => availableCategoryIds.has(cat.id));
    };
  }, [products, categories]);

  // Get available brands based on selected categories
  const getAvailableBrands = useMemo(() => {
    return (selectedCategoryIds: string[]): FilterOption[] => {
      if (selectedCategoryIds.length === 0) {
        return brands;
      }

      const availableBrandIds = new Set<number>();

      products.forEach(product => {
        if (selectedCategoryIds.includes(product.category_id)) {
          availableBrandIds.add(product.brand_id);
        }
      });

      return brands.filter(brand => availableBrandIds.has(Number(brand.id)));
    };
  }, [products, brands]);

  // Memoized available options
  const availableBrands = useMemo(() => brands, [brands]);
  const availableCategories = useMemo(() => categories, [categories]);
  const skinTypes = useMemo(() => extractAttributeValues('Тип шкіри'), [extractAttributeValues]);

  return {
    availableBrands,
    availableCategories,
    skinTypes,
    loading,
    getAvailableCategories,
    getAvailableBrands,
    getAllAttributeValues: extractAttributeValues
  };
}