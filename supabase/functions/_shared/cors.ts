/**
 * CORS utility для Supabase Edge Functions
 * Дозволяє тільки дозволені домени
 */

function getAllowedOrigins(): string[] {
  const baseOrigins = [
    'https://svitanok.com',
    'https://www.svitanok.com',
  ];
  
  // Development origins
  const isDev = Deno.env.get('ENVIRONMENT') === 'development' || 
                Deno.env.get('NODE_ENV') === 'development';
  
  if (isDev) {
    return [
      ...baseOrigins,
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5174',
      'http://127.0.0.1:5173'
    ];
  }
  
  return baseOrigins;
}

const ALLOWED_ORIGINS = getAllowedOrigins();

export function getCorsHeaders(origin: string | null): Record<string, string> {
  // Якщо origin не вказано або не дозволений, використовуємо перший дозволений
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);
  const allowedOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function logCorsAttempt(origin: string | null): void {
  if (Deno.env.get('ENVIRONMENT') === 'development' || Deno.env.get('NODE_ENV') === 'development') {
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
    }
  }
}

