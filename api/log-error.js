// api/log-error.js
/**
 * Endpoint do logowania błędów z frontendu
 * Zapisuje błędy do Vercel KV dla późniejszej analizy
 */

const { kv } = require('@vercel/kv');
const { checkRateLimit, getClientIP } = require('../utils/vercelRateLimiter');

module.exports = async (req, res) => {
  // CORS headers
  const allowedOrigins = [
    'https://lumly.pl',
    'https://customify-s56o.vercel.app',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    const ip = getClientIP(req);
    if (!checkRateLimit(ip, 100, 15 * 60 * 1000)) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many error logs from this IP'
      });
    }

    const {
      errorType,      // 'transform_failed', 'cart_add_failed', 'upload_failed', etc.
      errorMessage,   // Tekst błędu
      errorStack,     // Stack trace (opcjonalnie)
      context,        // { style, size, productType, customerId, email, etc. }
      url,            // URL strony gdzie wystąpił błąd
      userAgent       // User agent przeglądarki
    } = req.body;

    if (!errorType || !errorMessage) {
      return res.status(400).json({ 
        error: 'Missing required fields: errorType, errorMessage' 
      });
    }

    // Sprawdź czy Vercel KV jest skonfigurowany
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.error('❌ [LOG-ERROR] Vercel KV not configured');
      // Zwróć success nawet jeśli KV nie działa (nie blokuj użytkownika)
      return res.json({ 
        success: true, 
        message: 'Error logged (KV not configured)' 
      });
    }

    const timestamp = new Date().toISOString();
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Przygotuj dane błędu
    const errorData = {
      id: errorId,
      timestamp,
      errorType,
      errorMessage,
      errorStack: errorStack || null,
      context: context || {},
      url: url || null,
      userAgent: userAgent || req.headers['user-agent'] || null,
      ip: ip || null
    };

    // Zapisz do Vercel KV
    try {
      // Klucz: error:{timestamp}:{errorId} - dla łatwego sortowania
      const key = `error:${Date.now()}:${errorId}`;
      
      // Zapisz błąd (TTL: 30 dni - automatyczne usunięcie starych błędów)
      await kv.set(key, errorData, { ex: 30 * 24 * 60 * 60 }); // 30 dni

      // Dodaj do listy wszystkich błędów (dla szybkiego dostępu)
      const errorsListKey = 'errors:list';
      await kv.lpush(errorsListKey, errorId);
      await kv.expire(errorsListKey, 30 * 24 * 60 * 60); // 30 dni

      // Licznik błędów per typ (dla statystyk)
      const errorTypeCountKey = `errors:count:${errorType}`;
      await kv.incr(errorTypeCountKey);
      await kv.expire(errorTypeCountKey, 30 * 24 * 60 * 60); // 30 dni

      console.log(`✅ [LOG-ERROR] Error logged: ${errorType} - ${errorMessage.substring(0, 50)}`);

      return res.json({
        success: true,
        errorId,
        message: 'Error logged successfully'
      });

    } catch (kvError) {
      console.error('❌ [LOG-ERROR] KV error:', kvError);
      // Zwróć success nawet jeśli KV nie działa (nie blokuj użytkownika)
      return res.json({ 
        success: true, 
        message: 'Error logged (KV error, but logged to console)',
        errorId: null
      });
    }

  } catch (error) {
    console.error('❌ [LOG-ERROR] Error:', error);
    // Zwróć success nawet jeśli wystąpił błąd (nie blokuj użytkownika)
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    });
  }
};

