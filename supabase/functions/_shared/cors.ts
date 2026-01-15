
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin || '*';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, PUT, DELETE',
    'Access-Control-Allow-Headers': '*', // Allow ALL headers to fix CORS issues
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function logCorsAttempt(origin: string | null) { console.log(`CORS request from: ${origin}`); }

