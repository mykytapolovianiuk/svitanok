/**
 * Google Tag Manager Integration
 * Центральний хаб для всіх подій аналітики
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Initialize GTM dataLayer
 */
export function initGTM(): void {
  if (typeof window === 'undefined') return;
  
  window.dataLayer = window.dataLayer || [];
  
  // Initialize GTM if GTM_ID is provided
  const gtmId = import.meta.env.VITE_GTM_ID;
  if (gtmId) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
    document.head.appendChild(script);
    
    // Add noscript fallback
    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    document.body.insertBefore(noscript, document.body.firstChild);
    
    if (import.meta.env.DEV) {
      // Production logging removed
    }
  } else if (import.meta.env.DEV) {
    // Production logging removed
  }
}

/**
 * Push event to GTM dataLayer
 * @param eventName - Name of the event
 * @param eventData - Event data object
 */
export function pushEvent(eventName: string, eventData: Record<string, any> = {}): void {
  if (typeof window === 'undefined') return;
  
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
  
  const event = {
    event: eventName,
    ...eventData,
    timestamp: new Date().toISOString(),
  };
  
  window.dataLayer.push(event);
  
  // Log in development
  if (import.meta.env.DEV) {
    // Production logging removed
  }
}

/**
 * Push custom event with category, action, label
 * @param category - Event category
 * @param action - Event action
 * @param label - Event label (optional)
 * @param value - Event value (optional)
 */
export function pushCustomEvent(
  category: string,
  action: string,
  label?: string,
  value?: number
): void {
  pushEvent('custom_event', {
    event_category: category,
    event_action: action,
    event_label: label,
    value: value,
  });
}

/**
 * Set user properties in GTM
 * @param userId - User ID
 * @param userProperties - Additional user properties
 */
export function setUserProperties(userId: string | null, userProperties: Record<string, any> = {}): void {
  if (typeof window === 'undefined') return;
  
  pushEvent('user_properties', {
    user_id: userId,
    ...userProperties,
  });
}

/**
 * Track page view
 * @param pagePath - Page path
 * @param pageTitle - Page title
 * @param additionalData - Additional page data
 */
export function trackPageView(
  pagePath: string,
  pageTitle?: string,
  additionalData: Record<string, any> = {}
): void {
  pushEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle || document.title,
    page_location: window.location.href,
    ...additionalData,
  });
}

/**
 * Track e-commerce event
 * @param eventName - E-commerce event name
 * @param ecommerceData - E-commerce data
 */
export function trackEcommerce(eventName: string, ecommerceData: Record<string, any>): void {
  pushEvent(eventName, {
    ecommerce: ecommerceData,
  });
}

