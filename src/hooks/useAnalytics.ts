

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import * as analytics from '../lib/analytics/dispatcher';
import type { AnalyticsProduct } from '../lib/analytics/types';


export function usePageTracking(): void {
  const location = useLocation();
  
  useEffect(() => {
    analytics.trackPageView(location.pathname, document.title);
  }, [location.pathname]);
}


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


export function useBannerImpression(
  bannerId: string,
  bannerName: string,
  bannerType: 'hero' | 'category' | 'promo' | 'discount',
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;
    
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            analytics.trackBannerImpression(bannerId, bannerName, bannerType);
            observer.disconnect(); 
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


export function useAnalytics() {
  return {
    
    trackPageView: analytics.trackPageView,
    
    
    trackViewItem: analytics.trackViewItem,
    trackViewItemList: analytics.trackViewItemList,
    trackSelectItem: analytics.trackSelectItem,
    
    
    trackAddToCart: analytics.trackAddToCart,
    trackRemoveFromCart: analytics.trackRemoveFromCart,
    trackViewCart: analytics.trackViewCart,
    
    
    trackBeginCheckout: analytics.trackBeginCheckout,
    trackAddPaymentInfo: analytics.trackAddPaymentInfo,
    trackAddShippingInfo: analytics.trackAddShippingInfo,
    trackPurchase: analytics.trackPurchase,
    
    
    trackSearch: analytics.trackSearch,
    
    
    trackUIInteraction: analytics.trackUIInteraction,
    trackFilter: analytics.trackFilter,
    trackPagination: analytics.trackPagination,
    trackFavorite: analytics.trackFavorite,
    trackBannerClick: analytics.trackBannerClick,
    
    
    trackViewPromotion: analytics.trackViewPromotion,
    trackSelectPromotion: analytics.trackSelectPromotion,
    
    
    dispatch: analytics.dispatch,
  };
}


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



