/**
 * Analytics Types
 * Типи для всієї системи аналітики
 */

// Base event structure
export interface BaseEvent {
  event: string;
  [key: string]: any;
}

// Product item structure (GA4 & Pixel compatible)
export interface AnalyticsProduct {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_category2?: string;
  item_category3?: string;
  item_brand?: string;
  price: number;
  quantity?: number;
  currency?: string;
  item_variant?: string;
  item_list_id?: string;
  item_list_name?: string;
  index?: number;
}

// GA4 E-commerce Events
export interface GA4ViewItemParams {
  currency: string;
  value: number;
  items: AnalyticsProduct[];
}

export interface GA4ViewItemListParams {
  item_list_id?: string;
  item_list_name?: string;
  items: AnalyticsProduct[];
}

export interface GA4AddToCartParams {
  currency: string;
  value: number;
  items: AnalyticsProduct[];
}

export interface GA4RemoveFromCartParams {
  currency: string;
  value: number;
  items: AnalyticsProduct[];
}

export interface GA4ViewCartParams {
  currency: string;
  value: number;
  items: AnalyticsProduct[];
}

export interface GA4BeginCheckoutParams {
  currency: string;
  value: number;
  items: AnalyticsProduct[];
  coupon?: string;
}

export interface GA4AddPaymentInfoParams {
  currency: string;
  value: number;
  payment_type?: string;
  items?: AnalyticsProduct[];
}

export interface GA4AddShippingInfoParams {
  currency: string;
  value: number;
  shipping_tier?: string;
  items?: AnalyticsProduct[];
}

export interface GA4PurchaseParams {
  transaction_id: string;
  value: number;
  currency: string;
  tax?: number;
  shipping?: number;
  items: AnalyticsProduct[];
  coupon?: string;
  send_to?: string;
}

export interface GA4SearchParams {
  search_term: string;
}

export interface GA4SelectItemParams {
  item_list_id?: string;
  item_list_name?: string;
  items: AnalyticsProduct[];
}

export interface GA4SelectPromotionParams {
  promotion_id?: string;
  promotion_name?: string;
  creative_name?: string;
  creative_slot?: string;
  location_id?: string;
  items?: AnalyticsProduct[];
}

export interface GA4ViewPromotionParams {
  promotion_id?: string;
  promotion_name?: string;
  creative_name?: string;
  creative_slot?: string;
  location_id?: string;
  items?: AnalyticsProduct[];
}

// Meta Pixel Events
export interface PixelViewContentParams {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  contents?: Array<{
    id: string;
    quantity: number;
    item_price?: number;
  }>;
  content_type?: string;
  value?: number;
  currency?: string;
}

export interface PixelAddToCartParams {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  contents?: Array<{
    id: string;
    quantity: number;
    item_price?: number;
  }>;
  value?: number;
  currency?: string;
}

export interface PixelInitiateCheckoutParams {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  contents?: Array<{
    id: string;
    quantity: number;
    item_price?: number;
  }>;
  value?: number;
  currency?: string;
  num_items?: number;
}

export interface PixelPurchaseParams {
  content_name?: string;
  content_ids?: string[];
  contents?: Array<{
    id: string;
    quantity: number;
    item_price?: number;
  }>;
  value: number;
  currency: string;
  num_items?: number;
}

export interface PixelSearchParams {
  search_string?: string;
  content_category?: string;
  content_ids?: string[];
  contents?: Array<{
    id: string;
    quantity: number;
  }>;
}

// Meta CAPI Server Events
export interface CAPIParams {
  event_name: string;
  event_time: number;
  event_id?: string;
  event_source_url?: string;
  action_source: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
  user_data?: {
    em?: string[]; // email (hashed)
    ph?: string[]; // phone (hashed)
    client_ip_address?: string;
    client_user_agent?: string;
    fbp?: string; // Facebook browser ID
    fbc?: string; // Facebook click ID
  };
  custom_data?: {
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    contents?: Array<{
      id: string;
      quantity: number;
      item_price?: number;
    }>;
    value?: number;
    currency?: string;
    num_items?: number;
    order_id?: string;
  };
}

// UI Interaction Events
export interface FilterEvent {
  filter_type: 'brand' | 'category' | 'price' | 'problem' | 'sort';
  filter_value: string | string[];
  filter_name?: string;
}

export interface PaginationEvent {
  page_number: number;
  page_size: number;
  total_pages: number;
}

export interface ScrollDepthEvent {
  depth: '25%' | '50%' | '75%' | '100%';
  page_path: string;
}

export interface BannerImpressionEvent {
  banner_id: string;
  banner_name: string;
  banner_position: string;
  banner_type: 'hero' | 'category' | 'promo' | 'discount';
}

export interface BannerClickEvent extends BannerImpressionEvent {
  click_text?: string;
  click_url?: string;
}

// Unified Event Payload
export interface AnalyticsEvent {
  name: string;
  category?: string;
  label?: string;
  value?: number;
  products?: AnalyticsProduct[];
  [key: string]: any;
}



