/**
 * useAnalytics Hook
 * Головний hook для відстеження подій аналітики
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import * as analytics from '../lib/analytics/dispatcher';
import type { AnalyticsProduct } from '../lib/analytics/types';

/**
 * Hook for tracking page views automatically
 */
export function usePageTracking(): void {
  const location = useLocation();
  
  useEffect(() => {
    analytics.trackPageView(location.pathname, document.title);
  }, [location.pathname]);
}

/**
 * Hook for tracking scroll depth
 */
export function useScrollDepth(): void {
  useEffect(() => {
    let tracked25 = false;
    let tracked50 = false;
    let tracked75 = false;
    let tracked100 = false;
    
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollPercent = (scrollTop + windowHeight) / documentHeight;
      
      if (scrollPercent >= 0.25 && !tracked25) {
        analytics.trackScrollDepth('25%');
        tracked25 = true;
      }
      if (scrollPercent >= 0.5 && !tracked50) {
        analytics.trackScrollDepth('50%');
        tracked50 = true;
      }
      if (scrollPercent >= 0.75 && !tracked75) {
        analytics.trackScrollDepth('75%');
        tracked75 = true;
      }
      if (scrollPercent >= 1 && !tracked100) {
        analytics.trackScrollDepth('100%');
        tracked100 = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
}

/**
 * Hook for tracking banner impressions
 */
export function useBannerImpression(
  bannerId: string,
  bannerName: string,
  bannerType: 'hero' | 'category' | 'promo' | 'discount',
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;
    
    // Use Intersection Observer to track when banner is visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            analytics.trackBannerImpression(bannerId, bannerName, bannerType);
            observer.disconnect(); // Track only once
          }
        });
      },
      { threshold: 0.5 }
    );
    
    const element = document.getElementById(bannerId);
    if (element) {
      observer.observe(element);
    }
    
    return () => {
      observer.disconnect();
    };
  }, [bannerId, bannerName, bannerType, enabled]);
}

/**
 * Main analytics hook
 * Provides all tracking functions
 */
export function useAnalytics() {
  return {
    // Page tracking
    trackPageView: analytics.trackPageView,
    
    // Product tracking
    trackViewItem: analytics.trackViewItem,
    trackViewItemList: analytics.trackViewItemList,
    trackSelectItem: analytics.trackSelectItem,
    
    // Cart tracking
    trackAddToCart: analytics.trackAddToCart,
    trackRemoveFromCart: analytics.trackRemoveFromCart,
    trackViewCart: analytics.trackViewCart,
    
    // Checkout tracking
    trackBeginCheckout: analytics.trackBeginCheckout,
    trackAddPaymentInfo: analytics.trackAddPaymentInfo,
    trackAddShippingInfo: analytics.trackAddShippingInfo,
    trackPurchase: analytics.trackPurchase,
    
    // Search tracking
    trackSearch: analytics.trackSearch,
    
    // UI tracking
    trackUIInteraction: analytics.trackUIInteraction,
    trackFilter: analytics.trackFilter,
    trackPagination: analytics.trackPagination,
    trackFavorite: analytics.trackFavorite,
    trackBannerClick: analytics.trackBannerClick,
    
    // Promotions
    trackViewPromotion: analytics.trackViewPromotion,
    trackSelectPromotion: analytics.trackSelectPromotion,
    
    // Custom events
    dispatch: analytics.dispatch,
  };
}

/**
 * Helper: Convert cart items to analytics products
 */
export function formatCartItemsForAnalytics(items: Array<{
  product: {
    id: number;
    name: string;
    price: number;
    attributes?: Record<string, any>;
  };
  quantity: number;
}>): AnalyticsProduct[] {
  return items.map((item, index) => ({
    item_id: String(item.product.id),
    item_name: item.product.name,
    item_category: item.product.attributes?.Назва_групи || 
                   item.product.attributes?.Category || 
                   'Косметика',
    item_brand: item.product.attributes?.Виробник || 
                item.product.attributes?.Brand || 
                'Svitanok',
    price: item.product.price,
    quantity: item.quantity,
    currency: 'UAH',
    index: index + 1,
  }));
}



