import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initAnalytics, trackPageView } from '@/lib/analytics';
import { usePageTracking, useScrollDepth } from '@/hooks/useAnalytics';
import { Analytics } from '@vercel/analytics/react';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    binotel?: any;
    dataLayer?: any[];
  }
}

export default function AnalyticsProvider() {
  const location = useLocation();
  
  // Initialize all analytics services
  useEffect(() => {
    initAnalytics();
    
    // Binotel (existing integration)
    const binotelId = import.meta.env.VITE_BINOTEL_ID;
    if (binotelId) {
      const script = document.createElement('script');
      script.textContent = `
        (function(d, w, s) {
          var widgetId = '${binotelId}';
          var script = d.createElement(s);
          script.type = 'text/javascript';
          script.async = true;
          script.src = '//cdn.binotel.com/widget/' + widgetId + '.js';
          var ss = d.getElementsByTagName(s)[0];
          ss.parentNode.insertBefore(script, ss);
        })(document, window, 'script');
      `;
      document.body.appendChild(script);
    }
  }, []);
  
  // Track page views on route changes
  usePageTracking();
  
  // Track scroll depth
  useScrollDepth();
  
  // Google Search Console verification
  useEffect(() => {
    const gscVerification = import.meta.env.VITE_GSC_VERIFICATION;
    if (gscVerification) {
      const meta = document.createElement('meta');
      meta.name = 'google-site-verification';
      meta.content = gscVerification;
      document.head.appendChild(meta);
    }
  }, []);
  
  return <Analytics />;
}