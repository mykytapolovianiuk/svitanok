/**
 * CORS utility для безпечної обробки Cross-Origin запитів
 * Дозволяє тільки дозволені домени
 */

export function getCorsHeaders(origin: string | undefined): Record<string, string> {
  const allowedOrigins = [
    'https://svitanok.com',
    'https://www.svitanok.com',
    ...(process.env.NODE_ENV === 'development' || import.meta.env.DEV
      ? ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174', 'http://127.0.0.1:5173']
      : [])
  ];

  // Якщо origin не вказано або не дозволений, використовуємо перший дозволений
  const isAllowed = origin && allowedOrigins.includes(origin);
  const allowedOrigin = isAllowed ? origin : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Логування спроб недозволених запитів (тільки в development)
 */
export function logCorsAttempt(origin: string | undefined, allowedOrigins: string[]): void {
  if (process.env.NODE_ENV === 'development' || import.meta.env.DEV) {
    if (origin && !allowedOrigins.includes(origin)) {
      console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
    }
  }
}



