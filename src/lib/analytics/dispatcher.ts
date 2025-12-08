/**
 * Unified Analytics Dispatcher
 * Центральний диспетчер для всіх подій аналітики
 * Автоматично відправляє події до GA4, Pixel, GTM та CAPI
 */

import * as gtm from './gtm';
import * as ga4 from './ga4';
import * as pixel from './pixel';
import * as capi from './capi';
import { isTestMode, logTestEvent } from './test-mode';
import type {
  AnalyticsEvent,
  AnalyticsProduct,
  GA4ViewItemParams,
  GA4AddToCartParams,
  GA4PurchaseParams,
  GA4BeginCheckoutParams,
  PixelViewContentParams,
  PixelAddToCartParams,
  PixelPurchaseParams,
  PixelInitiateCheckoutParams,
  CAPIParams,
} from './types';

/**
 * Initialize all analytics services
 */
export function initAnalytics(): void {
  if (typeof window === 'undefined') return;
  
  if (import.meta.env.DEV) {
    // Production logging removed
    // Production logging removed
    // Production logging removed
    // Production logging removed
  }
  
  gtm.initGTM();
  ga4.initGA4();
  pixel.initPixel();
  
  if (import.meta.env.DEV) {
    // Production logging removed
  }
}

/**
 * Dispatch event to all analytics services
 * @param eventName - Event name
 * @param payload - Event payload
 */
export function dispatch(eventName: string, payload: Record<string, any> = {}): void {
  // Always push to GTM first (central hub)
  gtm.pushEvent(eventName, payload);
  
  // Log in test/dev mode
  if (isTestMode()) {
    logTestEvent(eventName, payload);
  } else if (import.meta.env.DEV) {
    // Production logging removed
  }
}

/**
 * Track page view across all platforms
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  ga4.trackPageView(pagePath, pageTitle);
  pixel.trackPageView();
  gtm.trackPageView(pagePath, pageTitle);
  
  // Send to CAPI
  capi.sendCAPIEvent('pageView', {
    event_name: 'PageView',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_url: typeof window !== 'undefined' ? window.location.href : '',
  });
}

/**
 * Track product view
 */
export function trackViewItem(product: {
  id: number | string;
  name: string;
  price: number;
  category?: string;
  brand?: string;
}): void {
  const ga4Product = ga4.formatProductForGA4(product);
  const pixelProduct = pixel.formatProductForPixel(product);
  
  // GA4
  const ga4Params: GA4ViewItemParams = {
    currency: 'UAH',
    value: product.price,
    items: [ga4Product],
  };
  ga4.trackViewItem(ga4Params);
  
  // Pixel
  const pixelParams: PixelViewContentParams = {
    content_name: product.name,
    content_category: product.category,
    content_ids: [String(product.id)],
    contents: [pixelProduct],
    value: product.price,
    currency: 'UAH',
  };
  pixel.trackViewContent(pixelParams);
  
  // GTM
  dispatch('view_item', {
    product_id: String(product.id),
    product_name: product.name,
    product_category: product.category,
    price: product.price,
    currency: 'UAH',
  });
  
  // CAPI
  capi.sendCAPIEvent('viewContent', {
    event_name: 'ViewContent',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    user_data: {
      fbp: capi.getFBP() || undefined,
      fbc: capi.getFBC() || undefined,
    },
    custom_data: {
      content_name: product.name,
      content_category: product.category,
      content_ids: [String(product.id)],
      contents: [pixelProduct],
      value: product.price,
      currency: 'UAH',
    },
  });
}

/**
 * Track add to cart
 */
export function trackAddToCart(product: {
  id: number | string;
  name: string;
  price: number;
  quantity?: number;
  category?: string;
  brand?: string;
}): void {
  const quantity = product.quantity || 1;
  const value = product.price * quantity;
  
  const ga4Product = ga4.formatProductForGA4({ ...product, quantity });
  const pixelProduct = pixel.formatProductForPixel({ ...product, quantity });
  
  // GA4
  const ga4Params: GA4AddToCartParams = {
    currency: 'UAH',
    value: value,
    items: [ga4Product],
  };
  ga4.trackAddToCart(ga4Params);
  
  // Pixel
  const pixelParams: PixelAddToCartParams = {
    content_name: product.name,
    content_category: product.category,
    content_ids: [String(product.id)],
    contents: [pixelProduct],
    value: value,
    currency: 'UAH',
  };
  pixel.trackAddToCart(pixelParams);
  
  // GTM
  dispatch('add_to_cart', {
    product_id: String(product.id),
    product_name: product.name,
    price: product.price,
    quantity: quantity,
    value: value,
    currency: 'UAH',
  });
  
  // CAPI
  capi.sendCAPIEvent('addToCart', {
    event_name: 'AddToCart',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    user_data: {
      fbp: capi.getFBP() || undefined,
      fbc: capi.getFBC() || undefined,
    },
    custom_data: {
      content_name: product.name,
      content_category: product.category,
      content_ids: [String(product.id)],
      contents: [pixelProduct],
      value: value,
      currency: 'UAH',
    },
  });
}

/**
 * Track remove from cart
 */
export function trackRemoveFromCart(product: {
  id: number | string;
  name: string;
  price: number;
  quantity?: number;
}): void {
  const quantity = product.quantity || 1;
  const value = product.price * quantity;
  
  const ga4Product = ga4.formatProductForGA4({ ...product, quantity });
  
  ga4.trackRemoveFromCart({
    currency: 'UAH',
    value: value,
    items: [ga4Product],
  });
  
  dispatch('remove_from_cart', {
    product_id: String(product.id),
    product_name: product.name,
    price: product.price,
    quantity: quantity,
    value: value,
  });
}

/**
 * Track view cart
 */
export function trackViewCart(items: AnalyticsProduct[], totalValue: number): void {
  ga4.trackViewCart({
    currency: 'UAH',
    value: totalValue,
    items: items,
  });
  
  dispatch('view_cart', {
    items: items,
    value: totalValue,
    currency: 'UAH',
  });
}

/**
 * Track begin checkout
 */
export function trackBeginCheckout(items: AnalyticsProduct[], totalValue: number, coupon?: string): void {
  ga4.trackBeginCheckout({
    currency: 'UAH',
    value: totalValue,
    items: items,
    coupon: coupon,
  });
  
  const pixelItems = items.map(item => pixel.formatProductForPixel({
    id: item.item_id,
    price: item.price,
    quantity: item.quantity || 1,
  }));
  
  pixel.trackInitiateCheckout({
    content_ids: items.map(item => item.item_id),
    contents: pixelItems,
    value: totalValue,
    currency: 'UAH',
    num_items: items.length,
  });
  
  dispatch('begin_checkout', {
    items: items,
    value: totalValue,
    currency: 'UAH',
    coupon: coupon,
  });
  
  // CAPI
  capi.sendCAPIEvent('initiateCheckout', {
    event_name: 'InitiateCheckout',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    user_data: {
      fbp: capi.getFBP() || undefined,
      fbc: capi.getFBC() || undefined,
    },
    custom_data: {
      content_ids: items.map(item => item.item_id),
      contents: pixelItems,
      value: totalValue,
      currency: 'UAH',
      num_items: items.length,
    },
  });
}

/**
 * Track add payment info
 */
export function trackAddPaymentInfo(items: AnalyticsProduct[], totalValue: number, paymentType?: string): void {
  ga4.trackAddPaymentInfo({
    currency: 'UAH',
    value: totalValue,
    payment_type: paymentType,
    items: items,
  });
  
  pixel.trackAddPaymentInfo({
    content_ids: items.map(item => item.item_id),
    value: totalValue,
    currency: 'UAH',
    num_items: items.length,
  });
  
  dispatch('add_payment_info', {
    payment_type: paymentType,
    value: totalValue,
    currency: 'UAH',
  });
}

/**
 * Track add shipping info
 */
export function trackAddShippingInfo(items: AnalyticsProduct[], totalValue: number, shippingTier?: string): void {
  ga4.trackAddShippingInfo({
    currency: 'UAH',
    value: totalValue,
    shipping_tier: shippingTier,
    items: items,
  });
  
  pixel.trackAddShippingInfo({
    content_ids: items.map(item => item.item_id),
    value: totalValue,
    currency: 'UAH',
    num_items: items.length,
  });
  
  dispatch('add_shipping_info', {
    shipping_tier: shippingTier,
    value: totalValue,
    currency: 'UAH',
  });
}

/**
 * Track purchase
 */
export function trackPurchase(
  transactionId: string,
  items: AnalyticsProduct[],
  totalValue: number,
  tax?: number,
  shipping?: number,
  coupon?: string
): void {
  // GA4
  ga4.trackPurchase({
    transaction_id: transactionId,
    value: totalValue,
    currency: 'UAH',
    tax: tax,
    shipping: shipping,
    items: items,
    coupon: coupon,
  });
  
  // Pixel
  const pixelItems = items.map(item => pixel.formatProductForPixel({
    id: item.item_id,
    price: item.price,
    quantity: item.quantity || 1,
  }));
  
  pixel.trackPurchase({
    content_ids: items.map(item => item.item_id),
    contents: pixelItems,
    value: totalValue,
    currency: 'UAH',
    num_items: items.length,
  });
  
  // GTM
  dispatch('purchase', {
    transaction_id: transactionId,
    value: totalValue,
    currency: 'UAH',
    tax: tax,
    shipping: shipping,
    items: items,
    coupon: coupon,
  });
  
  // CAPI
  capi.sendCAPIEvent('purchase', {
    event_name: 'Purchase',
    event_time: Math.floor(Date.now() / 1000),
    event_id: transactionId,
    action_source: 'website',
    user_data: {
      fbp: capi.getFBP() || undefined,
      fbc: capi.getFBC() || undefined,
    },
    custom_data: {
      content_ids: items.map(item => item.item_id),
      contents: pixelItems,
      value: totalValue,
      currency: 'UAH',
      num_items: items.length,
      order_id: transactionId,
    },
  });
}

/**
 * Track search
 */
export function trackSearch(searchTerm: string): void {
  ga4.trackSearch({ search_term: searchTerm });
  pixel.trackSearch({ search_string: searchTerm });
  dispatch('search', { search_term: searchTerm });
}

/**
 * Track view item list
 */
export function trackViewItemList(items: AnalyticsProduct[], listId?: string, listName?: string): void {
  ga4.trackViewItemList({
    item_list_id: listId,
    item_list_name: listName,
    items: items,
  });
  
  dispatch('view_item_list', {
    item_list_id: listId,
    item_list_name: listName,
    items: items,
  });
}

/**
 * Track select item
 */
export function trackSelectItem(product: AnalyticsProduct, listId?: string, listName?: string): void {
  ga4.trackSelectItem({
    item_list_id: listId,
    item_list_name: listName,
    items: [product],
  });
  
  dispatch('select_item', {
    item_list_id: listId,
    item_list_name: listName,
    product: product,
  });
}

/**
 * Track UI interactions
 */
export function trackUIInteraction(
  category: string,
  action: string,
  label?: string,
  value?: number
): void {
  gtm.pushCustomEvent(category, action, label, value);
  dispatch('ui_interaction', {
    category,
    action,
    label,
    value,
  });
}

/**
 * Track filter usage
 */
export function trackFilter(filterType: string, filterValue: string | string[]): void {
  dispatch('filter', {
    filter_type: filterType,
    filter_value: filterValue,
  });
}

/**
 * Track pagination
 */
export function trackPagination(pageNumber: number, pageSize: number, totalPages: number): void {
  dispatch('pagination', {
    page_number: pageNumber,
    page_size: pageSize,
    total_pages: totalPages,
  });
}

/**
 * Track favorite add/remove
 */
export function trackFavorite(action: 'add' | 'remove', productId: number | string): void {
  dispatch('favorite', {
    action: action,
    product_id: String(productId),
  });
}

/**
 * Track banner impression
 */
export function trackBannerImpression(bannerId: string, bannerName: string, bannerType: string): void {
  dispatch('banner_impression', {
    banner_id: bannerId,
    banner_name: bannerName,
    banner_type: bannerType,
  });
}

/**
 * Track banner click
 */
export function trackBannerClick(
  bannerId: string,
  bannerName: string,
  bannerType: string,
  clickUrl?: string
): void {
  dispatch('banner_click', {
    banner_id: bannerId,
    banner_name: bannerName,
    banner_type: bannerType,
    click_url: clickUrl,
  });
}

/**
 * Track scroll depth
 */
export function trackScrollDepth(depth: '25%' | '50%' | '75%' | '100%'): void {
  dispatch('scroll_depth', {
    depth: depth,
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
  });
}

/**
 * Track promotion view
 */
export function trackViewPromotion(params: {
  promotion_id?: string;
  promotion_name?: string;
  creative_name?: string;
  creative_slot?: string;
  location_id?: string;
  items?: AnalyticsProduct[];
}): void {
  ga4.trackViewPromotion(params);
  gtm.pushEvent('view_promotion', params);
}

/**
 * Track promotion selection
 */
export function trackSelectPromotion(params: {
  promotion_id?: string;
  promotion_name?: string;
  creative_name?: string;
  creative_slot?: string;
  location_id?: string;
  items?: AnalyticsProduct[];
}): void {
  ga4.trackSelectPromotion(params);
  gtm.pushEvent('select_promotion', params);
}

