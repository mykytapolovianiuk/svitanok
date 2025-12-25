

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}


export function initGTM(): void {
  if (typeof window === 'undefined') return;
  
  window.dataLayer = window.dataLayer || [];
  
  
  const gtmId = import.meta.env.VITE_GTM_ID;
  if (gtmId) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
    document.head.appendChild(script);
    
    
    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    document.body.insertBefore(noscript, document.body.firstChild);
    
    if (import.meta.env.DEV) {
      
    }
  } else if (import.meta.env.DEV) {
    
  }
}


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
  
  
  if (import.meta.env.DEV) {
    
  }
}


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


export function setUserProperties(userId: string | null, userProperties: Record<string, any> = {}): void {
  if (typeof window === 'undefined') return;
  
  pushEvent('user_properties', {
    user_id: userId,
    ...userProperties,
  });
}


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


export function trackEcommerce(eventName: string, ecommerceData: Record<string, any>): void {
  pushEvent(eventName, {
    ecommerce: ecommerceData,
  });
}

