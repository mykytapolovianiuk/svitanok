import { createClient } from '@supabase/supabase-js'


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}


const isProduction = import.meta.env.PROD;
const siteUrl = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';



export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    
    ...(isProduction && siteUrl ? {
      cookieOptions: {
        name: 'sb-auth-token',
        lifetime: 60 * 60 * 24 * 7, 
        domain: siteUrl.replace('https://', '').replace('http://', '').split('/')[0],
        sameSite: 'Lax',
        secure: siteUrl.startsWith('https'),
      }
    } : {})
  },
  global: {
    headers: {
      'x-application-name': 'svitanok-app'
    }
  }
})