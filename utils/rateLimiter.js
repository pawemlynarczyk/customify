// utils/rateLimiter.js
const rateLimit = require('express-rate-limit');

/**
 * Rate limiter dla endpointów API
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100, // Max 100 requestów na 15 minut
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Bardziej restrykcyjny limiter dla operacji kosztownych (AI, upload)
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 20, // Max 20 requestów na 15 minut
  message: {
    error: 'Too many requests',
    message: 'This operation is rate-limited. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limiter dla upload'ów
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 godzina
  max: 50, // Max 50 upload'ów na godzinę
  message: {
    error: 'Upload limit exceeded',
    message: 'Too many uploads. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  strictLimiter,
  uploadLimiter
};
