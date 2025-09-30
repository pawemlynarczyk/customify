// utils/vercelRateLimiter.js
/**
 * Vercel-compatible rate limiter
 * Używa Map do przechowywania requestów w pamięci
 * Dla produkcji rozważ Redis lub inny external store
 */

const requestCounts = new Map();

/**
 * Sprawdza rate limit dla danego IP
 * @param {string} ip - IP address
 * @param {number} limit - Maksymalna liczba requestów
 * @param {number} windowMs - Okno czasowe w milisekundach
 * @returns {boolean} - true jeśli OK, false jeśli limit exceeded
 */
function checkRateLimit(ip, limit = 20, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const userRequests = requestCounts.get(ip) || [];
  
  // Usuń stare requesty (starsze niż windowMs)
  const recentRequests = userRequests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= limit) {
    return false; // Rate limit exceeded
  }
  
  // Dodaj nowy request
  recentRequests.push(now);
  requestCounts.set(ip, recentRequests);
  
  return true; // OK
}

/**
 * Pobiera IP address z requestu (Vercel-compatible)
 * @param {Object} req - Request object
 * @returns {string} - IP address
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         'unknown';
}

/**
 * Middleware function dla Vercel
 * @param {Object} options - Opcje rate limitera
 * @returns {Function} - Middleware function
 */
function createRateLimiter(options = {}) {
  const {
    limit = 20,
    windowMs = 15 * 60 * 1000,
    message = 'Too many requests, please try again later'
  } = options;

  return (req, res, next) => {
    const ip = getClientIP(req);
    
    if (!checkRateLimit(ip, limit, windowMs)) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    if (next) next();
  };
}

/**
 * Predefined rate limiters
 */
const rateLimiters = {
  // Ogólny API limiter
  api: createRateLimiter({
    limit: 100,
    windowMs: 15 * 60 * 1000, // 15 minut
    message: 'Too many API requests, please try again later'
  }),
  
  // Strict limiter dla kosztownych operacji (AI)
  strict: createRateLimiter({
    limit: 20,
    windowMs: 15 * 60 * 1000, // 15 minut
    message: 'Too many AI requests, please try again in 15 minutes'
  }),
  
  // Upload limiter
  upload: createRateLimiter({
    limit: 50,
    windowMs: 60 * 60 * 1000, // 1 godzina
    message: 'Too many uploads, please try again in 1 hour'
  }),
  
  // Webhook limiter (mniej restrykcyjny)
  webhook: createRateLimiter({
    limit: 200,
    windowMs: 15 * 60 * 1000, // 15 minut
    message: 'Too many webhook requests'
  })
};

module.exports = {
  checkRateLimit,
  getClientIP,
  createRateLimiter,
  rateLimiters
};
