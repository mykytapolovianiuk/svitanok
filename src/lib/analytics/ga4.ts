/**
 * Google Analytics 4 Integration
 * Реалізація всіх рекомендованих e-commerce подій
 */

import type {
  GA4ViewItemParams,
  GA4ViewItemListParams,
  GA4AddToCartParams,
  GA4RemoveFromCartParams,
  GA4ViewCartParams,
  GA4BeginCheckoutParams,
  GA4AddPaymentInfoParams,
  GA4AddShippingInfoParams,
  GA4PurchaseParams,
  GA4SearchParams,
  GA4SelectItemParams,
  GA4SelectPromotionParams,
  GA4ViewPromotionParams,
  AnalyticsProduct,
} from './types';
import { pushEvent } from './gtm';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Initialize GA4
 */
export function initGA4(): void {
  if (typeof window === 'undefined') return;
  
  const gaId = import.meta.env.VITE_GA_ID;
  if (!gaId) {
    if (import.meta.env.DEV) {
      // Production logging removed
    }
    return;
  }
  
  // Initialize dataLayer if not exists
  window.dataLayer = window.dataLayer || [];
  
  // Initialize gtag function
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;
  
  // Load GA4 script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);
  
  // Configure GA4
  gtag('js', new Date());
  gtag('config', gaId, {
    send_page_view: false, // We'll send page views manually
  });
  
  if (import.meta.env.DEV) {
    // Production logging removed
  }
}

/**
 * Track page view
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  if (!window.gtag) return;
  
  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: pageTitle || document.title,
    page_location: window.location.href,
  });
  
  // Also push to GTM
  pushEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle || document.title,
  });
}

/**
 * Track view_item - when user views a product
 */
export function trackViewItem(params: GA4ViewItemParams): void {
  if (!window.gtag) return;
  
  window.gtag('event', 'view_item', {
    currency: params.currency,
    value: params.value,
    items: params.items,
  });
  
  pushEvent('view_item', {
    currency: params.currency,
    value: params.value,
    items: params.items,
  });
}

/**
 * Track view_item_list - when user views a list of products
 */
export function trackViewItemList(params: GA4ViewItemListParams): void {
  if (!window.gtag) return;
  
  window.gtag('event', 'view_item_list', {
    item_list_id: params.item_list_id,
    item_list_name: params.item_list_name,
    items: params.items,
  });
  
  pushEvent('view_item_list', {
    item_list_id: params.item_list_id,
    item_list_name: params.item_list_name,
    items: params.items,
  });
}

/**
 * Track add_to_cart - when user adds item to cart
 */
export function trackAddToCart(params: GA4AddToCartParams): void {
  if (!window.gtag) return;
  
  window.gtag('event', 'add_to_cart', {
    currency: params.currency,
    value: params.value,
    items: params.items,
  });
  
  pushEvent('add_to_cart', {
    currency: params.currency,
    value: params.value,
    items: params.items,
  });
}

/**
 * Track remove_from_cart - when user removes item from cart
 */
export function trackRemoveFromCart(params: GA4RemoveFromCartParams): void {
  if (!window.gtag) return;
  
  window.gtag('event', 'remove_from_cart', {
    currency: params.currency,
    value: params.value,
    items: params.items,
  });
  
  pushEvent('remove_from_cart', {
    currency: params.currency,
    value: params.value,
    items: params.items,
  });
}

/**
 * Track view_cart - when user views cart
 */
export function trackViewCart(params: GA4ViewCartParams): void {
  if (!window.gtag) return;
  
  window.gtag('event', 'view_cart', {
    currency: params.currency,
    value: params.value,
    items: params.items,
  });
  
  pushEvent('view_cart', {
    currency: params.currency,
    value: params.value,
    items: params.items,
  });
}

/**
 * Track begin_checkout - when user starts checkout
 */
export function trackBeginCheckout(params: GA4BeginCheckoutParams): void {
  if (!window.gtag) return;
  
  window.gtag('event', 'begin_checkout', {
    currency: params.currency,
    value: params.value,
    items: params.items,
    coupon: params.coupon,
  });
  
  pushEvent('begin_checkout', {
    currency: params.currency,
    value: params.value,
    items: params.items,
    coupon: params.coupon,
  });
}

/**
 * Track add_payment_info - when user adds payment info
 */
export function trackAddPaymentInfo(params: GA4AddPaymentInfoParams): void {
  if (!window.gtag) return;
  
  window.gtag('event', 'add_payment_info', {
    currency: params.currency,
    value: params.value,
    payment_type: params.payment_type,
    items: params.items,
  });
  
  pushEvent('add_payment_info', {
    currency: params.currency,
    value: params.value,
    payment_type: params.payment_type,
    items: params.items,
  });
}

/**
 * Track add_shipping_info - when user adds shipping info
 */
export function trackAddShippingInfo(params: GA4AddShippingInfoParams): void {
  if (!window.gtag) return;
  
  window.gtag('event', 'add_shipping_info', {
    currency: params.currency,
    value: params.value,
    shipping_tier: params.shipping_tier,
    items: params.items,
  });
  
  pushEvent('add_shipping_info', {
    currency: params.currency,
    value: params.value,
    shipping_tier: params.shipping_tier,
    items: params.items,
  });
}

/**
 * Track purchase - when user completes purchase
 */
export function trackPurchase(params: GA4PurchaseParams): void {
  if (!window.gtag) return;
  
  window.gtag('event', 'purchase', {
    transaction_id: params.transaction_id,
    value: params.value,
    currency: params.currency,
    tax: params.tax,
    shipping: params.shipping,
    items: params.items,
    coupon: params.coupon,
  });
  
  pushEvent('purchase', {
    transaction_id: params.transaction_id,
    value: params.value,
    currency: params.currency,
    tax: params.tax,
    shipping: params.shipping,
    items: params.items,
    coupon: params.coupon,
  });
}

/**
 * Track search - when user searches
 */
export function trackSearch(params: GA4SearchParams): void {
  if (!window.gtag) return;
  
  window.gtag('event', 'search', {
    search_term: params.search_term,
  });
  
  pushEvent('search', {
    search_term: params.search_term,
  });
}

/**
 * Track select_item - when user selects an item from list
 */
export function trackSelectItem(params: GA4SelectItemParams): void {
  if (!window.gtag) return;
  
  window.gtag('event', 'select_item', {
    item_list_id: params.item_list_id,
    item_list_name: params.item_list_name,
    items: params.items,
  });
  
  pushEvent('select_item', {
    item_list_id: params.item_list_id,
    item_list_name: params.item_list_name,
    items: params.items,
  });
}

/**
 * Track select_promotion - when user selects a promotion
 */
export function trackSelectPromotion(params: GA4SelectPromotionParams): void {
  if (!window.gtag) return;
  
  window.gtag('event', 'select_promotion', {
    promotion_id: params.promotion_id,
    promotion_name: params.promotion_name,
    creative_name: params.creative_name,
    creative_slot: params.creative_slot,
    location_id: params.location_id,
    items: params.items,
  });
  
  pushEvent('select_promotion', {
    promotion_id: params.promotion_id,
    promotion_name: params.promotion_name,
    creative_name: params.creative_name,
    creative_slot: params.creative_slot,
    location_id: params.location_id,
    items: params.items,
  });
}

/**
 * Track view_promotion - when user views a promotion
 */
export function trackViewPromotion(params: GA4ViewPromotionParams): void {
  if (!window.gtag) return;
  
  window.gtag('event', 'view_promotion', {
    promotion_id: params.promotion_id,
    promotion_name: params.promotion_name,
    creative_name: params.creative_name,
    creative_slot: params.creative_slot,
    location_id: params.location_id,
    items: params.items,
  });
  
  pushEvent('view_promotion', {
    promotion_id: params.promotion_id,
    promotion_name: params.promotion_name,
    creative_name: params.creative_name,
    creative_slot: params.creative_slot,
    location_id: params.location_id,
    items: params.items,
  });
}

/**
 * Helper: Convert product to GA4 format
 */
export function formatProductForGA4(product: {
  id: number | string;
  name: string;
  price: number;
  category?: string;
  brand?: string;
  quantity?: number;
  variant?: string;
  listId?: string;
  listName?: string;
  index?: number;
}): AnalyticsProduct {
  return {
    item_id: String(product.id),
    item_name: product.name,
    item_category: product.category,
    item_brand: product.brand,
    price: product.price,
    quantity: product.quantity || 1,
    currency: 'UAH',
    item_variant: product.variant,
    item_list_id: product.listId,
    item_list_name: product.listName,
    index: product.index,
  };
}

