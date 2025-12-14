import { createClient } from '@supabase/supabase-js'

// Validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

// Custom fetch with timeout
const customFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  return fetch(input, {
    ...init,
    signal: controller.signal
  }).finally(() => {
    clearTimeout(timeoutId);
  });
};

// Determine cookie settings based on environment
const isProduction = import.meta.env.PROD;
const siteUrl = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';

// Create a single, shared instance of the Supabase client
// This ensures we have exactly one client across the entire application
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Configure cookie settings for production
    ...(isProduction && siteUrl ? {
      cookieOptions: {
        name: 'sb-auth-token',
        lifetime: 60 * 60 * 24 * 365, // 1 year
        domain: siteUrl.replace('https://', '').replace('http://', '').split('/')[0],
        sameSite: 'Lax',
        secure: siteUrl.startsWith('https'),
      }
    } : {})
  },
  global: {
    headers: {
      'x-application-name': 'svitanok-app'
    },
    fetch: customFetch
  }
})