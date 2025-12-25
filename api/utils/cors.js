

function getCorsHeaders(origin) {
  const allowedOrigins = [
    'https://svitanok.com',
    'https://www.svitanok.com',
    ...(process.env.NODE_ENV === 'development'
      ? ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174', 'http://127.0.0.1:5173']
      : [])
  ];

  
  const isAllowed = origin && allowedOrigins.includes(origin);
  const allowedOrigin = isAllowed ? origin : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

function logCorsAttempt(origin, allowedOrigins) {
  if (process.env.NODE_ENV === 'development') {
    if (origin && !allowedOrigins.includes(origin)) {
      
    }
  }
}

export { getCorsHeaders, logCorsAttempt };

