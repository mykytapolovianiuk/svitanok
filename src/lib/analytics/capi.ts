/**
 * Meta Conversions API (CAPI) Client-side helper
 * Відправляє події на сервер для обробки через CAPI
 */

import type { CAPIParams } from './types';

/**
 * Send event to CAPI endpoint
 * @param endpoint - CAPI endpoint name (pageView, viewContent, addToCart, etc.)
 * @param params - Event parameters
 */
export async function sendCAPIEvent(
  endpoint: 'pageView' | 'viewContent' | 'addToCart' | 'initiateCheckout' | 'purchase',
  params: Partial<CAPIParams>
): Promise<void> {
  if (typeof window === 'undefined') return;
  
  // Use Supabase Functions URL if available, otherwise fallback to VITE_API_URL
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const apiUrl = supabaseUrl 
    ? `${supabaseUrl}/functions/v1` 
    : (import.meta.env.VITE_API_URL || '');
  
  if (!apiUrl) {
    if (import.meta.env.DEV) {
      // Production logging removed
    }
    return;
  }
  
  // Check if in test mode
  const isTestMode = import.meta.env.META_CAPI_ACCESS_TOKEN === 'TEST_TOKEN' || 
                     import.meta.env.DEV;
  
  if (isTestMode && import.meta.env.DEV) {
    // Production logging removed
  }
  
  try {
    // Map endpoint names to Supabase function names
    const functionNameMap: Record<string, string> = {
      'pageView': 'capi-pageview',
      'viewContent': 'capi-viewcontent',
      'addToCart': 'capi-addtocart',
      'initiateCheckout': 'capi-initiatecheckout',
      'purchase': 'capi-purchase',
    };
    
    const functionName = functionNameMap[endpoint] || endpoint;
    const url = supabaseUrl 
      ? `${apiUrl}/${functionName}`
      : `${apiUrl}/api/capi/${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add Supabase anon key if using Supabase Functions
    if (supabaseUrl) {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (anonKey) {
        headers['apikey'] = anonKey;
        headers['Authorization'] = `Bearer ${anonKey}`;
      }
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...params,
        event_source_url: window.location.href,
        client_user_agent: navigator.userAgent,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CAPI] ${endpoint} request failed:`, response.status, errorText);
      throw new Error(`CAPI request failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (import.meta.env.DEV) {
      if (result.test_mode) {
        // Production logging removed
      } else {
        // Production logging removed
      }
    }
  } catch (error) {
    // Don't throw - CAPI failures shouldn't break the app
    console.error(`[CAPI] Failed to send ${endpoint} event:`, error);
  }
}

/**
 * Get Facebook browser ID (fbp) from cookie
 */
export function getFBP(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === '_fbp') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Get Facebook click ID (fbc) from URL or cookie
 */
export function getFBC(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Check URL parameter first
  const urlParams = new URLSearchParams(window.location.search);
  const fbclid = urlParams.get('fbclid');
  if (fbclid) {
    return `fb.1.${Date.now()}.${fbclid}`;
  }
  
  // Check cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === '_fbc') {
      return decodeURIComponent(value);
    }
  }
  
  return null;
}

