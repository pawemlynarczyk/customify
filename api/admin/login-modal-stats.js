// api/admin/login-modal-stats.js
/**
 * API endpoint do zbierania i wyświetlania statystyk modala logowania
 * Zapisuje eventy do Vercel Blob Storage jako JSON
 */

const { put, head } = require('@vercel/blob');
const { checkRateLimit, getClientIP } = require('../../utils/vercelRateLimiter');

const STATS_FILE_PATH = 'customify/stats/login-modal-stats.json';

module.exports = async (req, res) => {
  console.log(`📊 [LOGIN-MODAL-STATS] API called - Method: ${req.method}`);
  
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
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST - zapisz event
  if (req.method === 'POST') {
    try {
      const ip = getClientIP(req);
      
      // Rate limiting - 100 requestów/15min
      if (!checkRateLimit(ip, 100, 15 * 60 * 1000)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const { eventType, usedCount, limit, productUrl, timestamp } = req.body;

      if (!eventType) {
        return res.status(400).json({ error: 'Missing eventType' });
      }

      // Pobierz istniejące statystyki
      let stats = {
        events: [],
        summary: {
          totalShown: 0,
          totalRegisterClicks: 0,
          totalLoginClicks: 0,
          totalCancelClicks: 0,
          totalAutoRedirects: 0
        },
        byProduct: {},
        byDate: {},
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      try {
        const blobToken = process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
        if (!blobToken) {
          throw new Error('Missing customify_READ_WRITE_TOKEN (Vercel Blob auth)');
        }
        
        const existingBlob = await head(STATS_FILE_PATH, {
          token: blobToken
        }).catch(() => null);
        
        if (existingBlob && existingBlob.url) {
          const existingResponse = await fetch(existingBlob.url);
          if (existingResponse.ok) {
            stats = await existingResponse.json();
          }
        }
      } catch (error) {
        console.log('📊 [LOGIN-MODAL-STATS] Creating new stats file');
      }

      // Dodaj nowy event
      const newEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        eventType,
        usedCount: usedCount || null,
        limit: limit || null,
        productUrl: productUrl || null,
        ip: ip,
        timestamp: timestamp || new Date().toISOString()
      };

      stats.events.push(newEvent);
      
      // Aktualizuj summary
      if (eventType === 'login_modal_shown') stats.summary.totalShown++;
      if (eventType === 'login_modal_register_click') stats.summary.totalRegisterClicks++;
      if (eventType === 'login_modal_login_click') stats.summary.totalLoginClicks++;
      if (eventType === 'login_modal_cancel_click') stats.summary.totalCancelClicks++;
      if (eventType === 'login_modal_auto_redirect') stats.summary.totalAutoRedirects++;

      // Aktualizuj statystyki per produkt
      if (productUrl) {
        const productKey = productUrl.split('/products/')[1] || 'unknown';
        if (!stats.byProduct[productKey]) {
          stats.byProduct[productKey] = {
            shown: 0,
            registerClicks: 0,
            loginClicks: 0,
            cancelClicks: 0,
            autoRedirects: 0
          };
        }
        if (eventType === 'login_modal_shown') stats.byProduct[productKey].shown++;
        if (eventType === 'login_modal_register_click') stats.byProduct[productKey].registerClicks++;
        if (eventType === 'login_modal_login_click') stats.byProduct[productKey].loginClicks++;
        if (eventType === 'login_modal_cancel_click') stats.byProduct[productKey].cancelClicks++;
        if (eventType === 'login_modal_auto_redirect') stats.byProduct[productKey].autoRedirects++;
      }

      // Aktualizuj statystyki per data
      const dateKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      if (!stats.byDate[dateKey]) {
        stats.byDate[dateKey] = {
          shown: 0,
          registerClicks: 0,
          loginClicks: 0,
          cancelClicks: 0,
          autoRedirects: 0
        };
      }
      if (eventType === 'login_modal_shown') stats.byDate[dateKey].shown++;
      if (eventType === 'login_modal_register_click') stats.byDate[dateKey].registerClicks++;
      if (eventType === 'login_modal_login_click') stats.byDate[dateKey].loginClicks++;
      if (eventType === 'login_modal_cancel_click') stats.byDate[dateKey].cancelClicks++;
      if (eventType === 'login_modal_auto_redirect') stats.byDate[dateKey].autoRedirects++;

      // Zachowaj tylko ostatnie 1000 eventów
      if (stats.events.length > 1000) {
        stats.events = stats.events.slice(-1000);
      }

      stats.lastUpdated = new Date().toISOString();

      // Zapisz do Vercel Blob
      const blobToken = process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
      if (!blobToken) {
        throw new Error('Missing customify_READ_WRITE_TOKEN (Vercel Blob auth)');
      }
      
      const blob = await put(STATS_FILE_PATH, JSON.stringify(stats, null, 2), {
        access: 'public',
        token: blobToken,
        contentType: 'application/json'
      });

      console.log('✅ [LOGIN-MODAL-STATS] Event saved:', eventType);

      return res.json({
        success: true,
        message: 'Event saved',
        eventId: newEvent.id
      });

    } catch (error) {
      console.error('❌ [LOGIN-MODAL-STATS] Error saving event:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  // GET - pobierz statystyki
  if (req.method === 'GET') {
    try {
      // Prosta autoryzacja - sprawdź czy request pochodzi z Vercel
      // W produkcji możesz dodać bardziej zaawansowaną autoryzację
      const authHeader = req.headers.authorization;
      const expectedToken = process.env.ADMIN_STATS_TOKEN || 'customify-admin-2024';
      const expectedAuth = `Bearer ${expectedToken}`;
      
      console.log('📊 [LOGIN-MODAL-STATS] GET request received');
      console.log('📊 [LOGIN-MODAL-STATS] Auth header:', authHeader ? 'present' : 'missing');
      console.log('📊 [LOGIN-MODAL-STATS] Expected:', expectedAuth.substring(0, 20) + '...');
      console.log('📊 [LOGIN-MODAL-STATS] Token from env:', process.env.ADMIN_STATS_TOKEN ? 'SET' : 'NOT SET');
      
      if (!authHeader || authHeader !== expectedAuth) {
        console.log('❌ [LOGIN-MODAL-STATS] Authorization failed');
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Invalid or missing authorization token',
          hint: 'Check if ADMIN_STATS_TOKEN is set in Vercel and matches the token in the request'
        });
      }
      
      console.log('✅ [LOGIN-MODAL-STATS] Authorization successful');

      let stats = {
        events: [],
        summary: {
          totalShown: 0,
          totalRegisterClicks: 0,
          totalLoginClicks: 0,
          totalCancelClicks: 0,
          totalAutoRedirects: 0
        },
        byProduct: {},
        byDate: {},
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      try {
        const blobToken = process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
        if (!blobToken) {
          throw new Error('Missing customify_READ_WRITE_TOKEN (Vercel Blob auth)');
        }
        
        const existingBlob = await head(STATS_FILE_PATH, {
          token: blobToken
        }).catch(() => null);
        
        if (existingBlob && existingBlob.url) {
          const existingResponse = await fetch(existingBlob.url);
          if (existingResponse.ok) {
            stats = await existingResponse.json();
          }
        }
      } catch (error) {
        console.log('📊 [LOGIN-MODAL-STATS] No existing stats file');
      }

      // Oblicz dodatkowe statystyki
      const conversionRate = stats.summary.totalShown > 0 
        ? ((stats.summary.totalRegisterClicks + stats.summary.totalLoginClicks) / stats.summary.totalShown * 100).toFixed(2)
        : 0;

      return res.json({
        success: true,
        stats: {
          ...stats,
          calculated: {
            conversionRate: `${conversionRate}%`,
            totalInteractions: stats.summary.totalRegisterClicks + stats.summary.totalLoginClicks + stats.summary.totalCancelClicks + stats.summary.totalAutoRedirects
          }
        }
      });

    } catch (error) {
      console.error('❌ [LOGIN-MODAL-STATS] Error fetching stats:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

