


const rateLimitStore = new Map();


const RATE_LIMIT_CONFIG = {
  capi: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, 
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


function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}


function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.expiresAt < now) {
      rateLimitStore.delete(key);
    }
  }
}


if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}


export function checkRateLimit(req, res, type = 'default') {
  const config = RATE_LIMIT_CONFIG[type] || RATE_LIMIT_CONFIG.default;
  const clientIP = getClientIP(req);
  const key = `${type}:${clientIP}`;
  const now = Date.now();

  
  let record = rateLimitStore.get(key);

  if (!record || record.expiresAt < now) {
    
    record = {
      count: 0,
      resetAt: now + config.windowMs,
      expiresAt: now + config.windowMs + 60000, 
    };
    rateLimitStore.set(key, record);
  }

  
  record.count++;

  
  const remaining = Math.max(0, config.maxRequests - record.count);
  const resetTime = Math.ceil((record.resetAt - now) / 1000);

  res.setHeader('X-RateLimit-Limit', config.maxRequests);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', resetTime);

  
  if (record.count > config.maxRequests) {
    
    
    
    res.status(429).json({
      error: 'Too many requests',
      message: `Rate limit exceeded. Maximum ${config.maxRequests} requests per ${config.windowMs / 1000 / 60} minutes.`,
      retryAfter: resetTime,
    });
    
    return false;
  }

  return true;
}


export function withRateLimit(type = 'default') {
  const middleware = rateLimit(type);
  
  return (handler) => {
    return async (req, res) => {
      
      let shouldContinue = true;
      
      middleware(req, res, () => {
        shouldContinue = true;
      });
      
      
      if (shouldContinue && res.statusCode !== 429) {
        return handler(req, res);
      }
      
      
      return;
    };
  };
}

