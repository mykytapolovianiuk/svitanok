import { AnalyticsProduct } from './types';

/**
 * Format Supabase product data for GA4 analytics
 * Maps nested brand/category objects to flat GA4 item structure
 */
export const formatProductForGA = (product: any): AnalyticsProduct => {
  return {
    item_id: String(product.id),
    item_name: product.name,
    // Safely access nested brand/category names
    item_brand: product.brands?.name || product.attributes?.Виробник || product.attributes?.Brand || 'Unknown Brand',
    item_category: product.categories?.name || product.attributes?.Назва_групи || product.attributes?.Category || 'General',
    price: product.price,
    quantity: 1,
    currency: 'UAH'
  };
};

/**
 * Format product for cart operations (add_to_cart, remove_from_cart)
 */
export const formatProductForCart = (product: any, quantity: number = 1): AnalyticsProduct => {
  return {
    item_id: String(product.id),
    item_name: product.name,
    item_brand: product.brands?.name || product.attributes?.Виробник || product.attributes?.Brand || 'Unknown Brand',
    item_category: product.categories?.name || product.attributes?.Назва_групи || product.attributes?.Category || 'General',
    price: product.price,
    quantity: quantity,
    currency: 'UAH'
  };
};

/**
 * Format multiple products for cart/view operations
 */
export const formatProductsForGA = (products: any[]): AnalyticsProduct[] => {
  return products.map(product => formatProductForGA(product));
};