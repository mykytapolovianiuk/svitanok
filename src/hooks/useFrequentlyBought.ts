import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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

interface UseFrequentlyBoughtResult {
  products: Product[];
  loading: boolean;
  error: string | null;
}


export function useFrequentlyBought(productId: number): UseFrequentlyBoughtResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    fetchFrequentlyBought();
  }, [productId]);

  const fetchFrequentlyBought = async () => {
    try {
      setLoading(true);
      setError(null);

      
      const { data: ordersWithProduct, error: ordersError } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('product_id', productId);

      if (ordersError) throw ordersError;

      if (!ordersWithProduct || ordersWithProduct.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const orderIds = ordersWithProduct.map((item: any) => item.order_id);

      
      const { data: otherItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, order_id')
        .in('order_id', orderIds)
        .neq('product_id', productId);

      if (itemsError) throw itemsError;

      if (!otherItems || otherItems.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      
      const productFrequency = new Map<number, number>();
      otherItems.forEach((item: any) => {
        const count = productFrequency.get(item.product_id) || 0;
        productFrequency.set(item.product_id, count + 1);
      });

      
      const sortedProducts = Array.from(productFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([productId]) => productId);

      if (sortedProducts.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', sortedProducts)
        .eq('in_stock', true);

      if (productsError) throw productsError;

      
      const orderedProducts = sortedProducts
        .map((id) => productsData?.find((p: any) => p.id === id))
        .filter(Boolean) as Product[];

      setProducts(orderedProducts);
    } catch (err: any) {
      console.error('Error fetching frequently bought products:', err);
      setError(err.message || 'Failed to load frequently bought products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, error };
}



