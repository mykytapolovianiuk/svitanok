/**
 * Rate Limiting middleware для API endpoints
 * Використовує in-memory store (для production використовуйте Redis)
 */

// In-memory store для rate limiting
const rateLimitStore = new Map();

// Конфігурація для різних типів endpoints
const RATE_LIMIT_CONFIG = {
  capi: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 хвилин
  },
  payment: {
    maxRequests: 50,
    windowMs: 15 * 60 * 1000,
  },
  feed: {
    maxRequests: 200,
    windowMs: 15 * 60 * 1000,
  },
  default: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000,
  },
};

/**
 * Отримати IP адресу з запиту
 */
function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Очистити застарілі записи (викликати періодично)
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.expiresAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Очищаємо застарілі записи кожні 5 хвилин
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}

/**
 * Rate limiting check
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {string} type - Тип endpoint ('capi', 'payment', 'feed', 'default')
 * @returns {boolean} true if rate limit not exceeded, false otherwise
 */
export function checkRateLimit(req, res, type = 'default') {
  const config = RATE_LIMIT_CONFIG[type] || RATE_LIMIT_CONFIG.default;
  const clientIP = getClientIP(req);
  const key = `${type}:${clientIP}`;
  const now = Date.now();

  // Отримати або створити запис
  let record = rateLimitStore.get(key);

  if (!record || record.expiresAt < now) {
    // Створити новий запис
    record = {
      count: 0,
      resetAt: now + config.windowMs,
      expiresAt: now + config.windowMs + 60000, // Додаткова хвилина для cleanup
    };
    rateLimitStore.set(key, record);
  }

  // Збільшити лічильник
  record.count++;

  // Встановити headers
  const remaining = Math.max(0, config.maxRequests - record.count);
  const resetTime = Math.ceil((record.resetAt - now) / 1000);

  res.setHeader('X-RateLimit-Limit', config.maxRequests);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', resetTime);

  // Перевірити ліміт
  if (record.count > config.maxRequests) {
    // Логувати перевищення
    // Rate limit warning in production
    
    res.status(429).json({
      error: 'Too many requests',
      message: `Rate limit exceeded. Maximum ${config.maxRequests} requests per ${config.windowMs / 1000 / 60} minutes.`,
      retryAfter: resetTime,
    });
    
    return false;
  }

  return true;
}

/**
 * Express-style middleware wrapper для Vercel serverless functions
 */
export function withRateLimit(type = 'default') {
  const middleware = rateLimit(type);
  
  return (handler) => {
    return async (req, res) => {
      // Виконати rate limiting
      let shouldContinue = true;
      
      middleware(req, res, () => {
        shouldContinue = true;
      });
      
      // Якщо rate limit не перевищено, виконати handler
      if (shouldContinue && res.statusCode !== 429) {
        return handler(req, res);
      }
      
      // Якщо rate limit перевищено, response вже відправлено
      return;
    };
  };
}

