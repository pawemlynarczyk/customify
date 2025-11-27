// api/get-errors.js
/**
 * Endpoint do pobierania błędów (dla dashboardu admin)
 * Wymaga ADMIN_STATS_TOKEN dla bezpieczeństwa
 */

const { kv } = require('@vercel/kv');
const { checkRateLimit, getClientIP } = require('../utils/vercelRateLimiter');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Sprawdź autoryzację
    const authToken = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    const adminToken = process.env.ADMIN_STATS_TOKEN;

    if (!adminToken || authToken !== adminToken) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid or missing admin token' 
      });
    }

    // Rate limiting
    const ip = getClientIP(req);
    if (!checkRateLimit(ip, 50, 15 * 60 * 1000)) {
      return res.status(429).json({
        error: 'Rate limit exceeded'
      });
    }

    // Sprawdź czy Vercel KV jest skonfigurowany
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return res.status(500).json({
        error: 'Vercel KV not configured'
      });
    }

    const limit = parseInt(req.query.limit || '50', 10); // Domyślnie 50 błędów
    const errorType = req.query.errorType || null; // Filtrowanie po typie

    try {
      // Pobierz listę ID błędów
      const errorsListKey = 'errors:list';
      const errorIds = await kv.lrange(errorsListKey, 0, limit - 1) || [];

      // Pobierz szczegóły błędów
      const errors = [];
      const errorKeys = await kv.keys('error:*');
      
      // Sortuj klucze po timestamp (najnowsze pierwsze)
      const sortedKeys = errorKeys
        .map(key => {
          const parts = key.split(':');
          const timestamp = parseInt(parts[1] || '0', 10);
          return { key, timestamp };
        })
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit)
        .map(item => item.key);

      // Pobierz dane błędów
      for (const key of sortedKeys) {
        const errorData = await kv.get(key);
        if (errorData) {
          // Filtruj po typie jeśli podano
          if (!errorType || errorData.errorType === errorType) {
            errors.push(errorData);
          }
        }
      }

      // Pobierz statystyki (liczniki per typ)
      const stats = {};
      if (!errorType) {
        const errorTypeKeys = await kv.keys('errors:count:*');
        for (const key of errorTypeKeys) {
          const type = key.replace('errors:count:', '');
          const count = await kv.get(key) || 0;
          stats[type] = count;
        }
      }

      return res.json({
        success: true,
        total: errors.length,
        errors: errors,
        stats: stats,
        limit: limit
      });

    } catch (kvError) {
      console.error('❌ [GET-ERRORS] KV error:', kvError);
      return res.status(500).json({
        error: 'Failed to fetch errors',
        message: kvError.message
      });
    }

  } catch (error) {
    console.error('❌ [GET-ERRORS] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

