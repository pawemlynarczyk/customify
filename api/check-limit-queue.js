/**
 * Endpoint do sprawdzania kolejki limit-reached:* w Vercel KV
 * URL: /api/check-limit-queue
 */

const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 [CHECK-QUEUE] Sprawdzam kolejkę limit-reached...');
    
    // Pobierz wszystkie klucze limit-reached:*
    const keys = await kv.keys('limit-reached:*');
    
    console.log(`📋 [CHECK-QUEUE] Znaleziono ${keys.length} wpisów`);
    
    const now = Date.now();
    const cooldownMs = 60 * 60 * 1000; // 1h
    const results = [];
    
    for (const key of keys) {
      const customerId = key.replace('limit-reached:', '');
      const data = await kv.get(key);
      
      let payload;
      try {
        payload = typeof data === 'string' ? JSON.parse(data) : data;
      } catch {
        payload = data;
      }
      
      const timestamp = payload?.timestamp;
      const totalUsed = payload?.totalUsed;
      const totalLimit = payload?.totalLimit;
      
      // Oblicz ile czasu minęło
      const createdAt = timestamp ? Date.parse(timestamp) : null;
      const elapsed = createdAt ? now - createdAt : null;
      const elapsedMinutes = elapsed ? Math.floor(elapsed / (1000 * 60)) : null;
      const elapsedHours = elapsed ? (elapsed / (1000 * 60 * 60)).toFixed(2) : null;
      
      // Sprawdź czy minęła już 1h
      const readyForReset = elapsed >= cooldownMs;
      
      results.push({
        key,
        customerId,
        timestamp,
        totalUsed,
        totalLimit,
        elapsedMs: elapsed,
        elapsedMinutes,
        elapsedHours,
        readyForReset,
        status: readyForReset ? 'GOTOWY DO RESETU (≥1h)' : 'CZEKA (< 1h)'
      });
    }
    
    // Podsumowanie
    const readyCount = results.filter(r => r.readyForReset).length;
    
    return res.status(200).json({
      success: true,
      queueLength: keys.length,
      readyForReset: readyCount,
      waitingCount: keys.length - readyCount,
      results,
      cronJob: {
        schedule: 'co 20 minut',
        endpoint: '/api/check-and-reset-limits',
        cooldown: '1 godzina od zapisu'
      },
      info: keys.length === 0 
        ? 'Kolejka pusta - nikt nie wyczerpał limitu' 
        : `${readyCount} użytkowników gotowych do resetu, ${keys.length - readyCount} czeka`
    });
    
  } catch (error) {
    console.error('❌ [CHECK-QUEUE] Błąd:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
};
