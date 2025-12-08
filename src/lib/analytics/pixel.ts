/**
 * Meta Pixel (Facebook Pixel) Integration
 * Реалізація всіх рекомендованих Pixel подій
 */

import type {
  PixelViewContentParams,
  PixelAddToCartParams,
  PixelInitiateCheckoutParams,
  PixelPurchaseParams,
  PixelSearchParams,
} from './types';
import { pushEvent } from './gtm';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

/**
 * Initialize Meta Pixel
 */
export function initPixel(): void {
  if (typeof window === 'undefined') return;
  
  const pixelId = import.meta.env.VITE_FB_PIXEL_ID;
  if (!pixelId) {
    if (import.meta.env.DEV) {
      // Production logging removed
    }
    return;
  }
  
  // Initialize fbq function
  window.fbq = window.fbq || function(...args: any[]) {
    (window.fbq as any).q = (window.fbq as any).q || [];
    (window.fbq as any).q.push(args);
  };
  
  // Load Pixel script
  const script = document.createElement('script');
  script.textContent = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);
  
  // Initialize noscript fallback
  const noscript = document.createElement('noscript');
  noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>`;
  document.body.appendChild(noscript);
  
  if (import.meta.env.DEV) {
    // Production logging removed
  }
}

/**
 * Track PageView
 */
export function trackPageView(): void {
  if (!window.fbq) return;
  
  window.fbq('track', 'PageView');
  
  pushEvent('PageView', {
    page_path: window.location.pathname,
  });
}

/**
 * Track ViewContent - when user views a product
 */
export function trackViewContent(params: PixelViewContentParams): void {
  if (!window.fbq) return;
  
  window.fbq('track', 'ViewContent', {
    content_name: params.content_name,
    content_category: params.content_category,
    content_ids: params.content_ids,
    contents: params.contents,
    content_type: params.content_type,
    value: params.value,
    currency: params.currency || 'UAH',
  });
  
  pushEvent('ViewContent', params);
}

/**
 * Track Search
 */
export function trackSearch(params: PixelSearchParams): void {
  if (!window.fbq) return;
  
  window.fbq('track', 'Search', {
    search_string: params.search_string,
    content_category: params.content_category,
    content_ids: params.content_ids,
    contents: params.contents,
  });
  
  pushEvent('Search', params);
}

/**
 * Track AddToCart
 */
export function trackAddToCart(params: PixelAddToCartParams): void {
  if (!window.fbq) return;
  
  window.fbq('track', 'AddToCart', {
    content_name: params.content_name,
    content_category: params.content_category,
    content_ids: params.content_ids,
    contents: params.contents,
    value: params.value,
    currency: params.currency || 'UAH',
  });
  
  pushEvent('AddToCart', params);
}

/**
 * Track InitiateCheckout
 */
export function trackInitiateCheckout(params: PixelInitiateCheckoutParams): void {
  if (!window.fbq) return;
  
  window.fbq('track', 'InitiateCheckout', {
    content_name: params.content_name,
    content_category: params.content_category,
    content_ids: params.content_ids,
    contents: params.contents,
    value: params.value,
    currency: params.currency || 'UAH',
    num_items: params.num_items,
  });
  
  pushEvent('InitiateCheckout', params);
}

/**
 * Track AddPaymentInfo
 */
export function trackAddPaymentInfo(params: PixelInitiateCheckoutParams): void {
  if (!window.fbq) return;
  
  window.fbq('track', 'AddPaymentInfo', {
    content_name: params.content_name,
    content_category: params.content_category,
    content_ids: params.content_ids,
    contents: params.contents,
    value: params.value,
    currency: params.currency || 'UAH',
    num_items: params.num_items,
  });
  
  pushEvent('AddPaymentInfo', params);
}

/**
 * Track AddShippingInfo
 */
export function trackAddShippingInfo(params: PixelInitiateCheckoutParams): void {
  if (!window.fbq) return;
  
  window.fbq('track', 'AddShippingInfo', {
    content_name: params.content_name,
    content_category: params.content_category,
    content_ids: params.content_ids,
    contents: params.contents,
    value: params.value,
    currency: params.currency || 'UAH',
    num_items: params.num_items,
  });
  
  pushEvent('AddShippingInfo', params);
}

/**
 * Track Purchase
 */
export function trackPurchase(params: PixelPurchaseParams): void {
  if (!window.fbq) return;
  
  window.fbq('track', 'Purchase', {
    content_name: params.content_name,
    content_ids: params.content_ids,
    contents: params.contents,
    value: params.value,
    currency: params.currency || 'UAH',
    num_items: params.num_items,
  });
  
  pushEvent('Purchase', params);
}

/**
 * Helper: Convert product to Pixel format
 */
export function formatProductForPixel(product: {
  id: number | string;
  name?: string;
  price?: number;
  quantity?: number;
}): {
  id: string;
  quantity: number;
  item_price?: number;
} {
  return {
    id: String(product.id),
    quantity: product.quantity || 1,
    item_price: product.price,
  };
}

