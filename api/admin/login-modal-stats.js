// api/admin/login-modal-stats.js
/**
 * API endpoint do zbierania i wyświetlania statystyk modala logowania
 * Zapisuje eventy do Vercel Blob Storage jako JSON
 */

const { put, head, list, del } = require('@vercel/blob');
const { checkRateLimit, getClientIP } = require('../../utils/vercelRateLimiter');

const STATS_FILE_PATH = 'customify/stats/login-modal-stats.json'; // legacy - do odczytu
const STATS_NEW_PREFIX = 'customify/temp/admin-stats/';
const MAX_STATS_VERSIONS = 5;

const getBlobToken = () => {
  const token = process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('Missing customify_READ_WRITE_TOKEN (Vercel Blob auth)');
  }
  return token;
};

const createEmptyStats = () => ({
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
});

const loadStatsFile = async (blobToken) => {
  let stats = createEmptyStats();
  let sourcePath = null;
  let versions = [];

  try {
    const versionList = await list({
      prefix: STATS_NEW_PREFIX,
      limit: 100,
      token: blobToken
    });
    versions = versionList?.blobs || [];
    
    if (versions.length > 0) {
      versions.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
      const latest = versions[versions.length - 1];
      const response = await fetch(latest.url);
      if (response.ok) {
        stats = await response.json();
        sourcePath = latest.pathname || latest.path || null;
      }
    }
  } catch (error) {
    console.log('📊 [LOGIN-MODAL-STATS] No versions in new prefix yet');
  }

  if (!sourcePath) {
    try {
      const legacyBlob = await head(STATS_FILE_PATH, { token: blobToken }).catch(() => null);
      if (legacyBlob?.url) {
        const response = await fetch(legacyBlob.url);
        if (response.ok) {
          stats = await response.json();
          sourcePath = STATS_FILE_PATH;
        }
      }
    } catch (error) {
      console.log('📊 [LOGIN-MODAL-STATS] No legacy stats file');
    }
  }

  return { stats, sourcePath, versions };
};

const cleanupOldVersions = async (blobToken, versions) => {
  if (!versions || versions.length <= MAX_STATS_VERSIONS) {
    return;
  }
  const sorted = [...versions].sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
  const toRemove = sorted.slice(0, Math.max(0, sorted.length - MAX_STATS_VERSIONS));
  for (const blob of toRemove) {
    const path = blob.pathname || blob.path;
    if (!path) continue;
    try {
      await del(path, { token: blobToken });
      console.log(`🧹 [LOGIN-MODAL-STATS] Usuń stary plik statystyk: ${path}`);
    } catch (error) {
      console.warn(`⚠️ [LOGIN-MODAL-STATS] Nie udało się usunąć ${path}:`, error?.message || error);
    }
  }
};

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

      const blobToken = getBlobToken();
      let statsData;
      try {
        statsData = await loadStatsFile(blobToken);
      } catch (error) {
        console.log('📊 [LOGIN-MODAL-STATS] Creating new stats file');
        statsData = { stats: createEmptyStats(), sourcePath: null, versions: [] };
      }
      let stats = statsData.stats || createEmptyStats();

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

      const newStatsPath = `${STATS_NEW_PREFIX}stats-${Date.now()}.json`;
      
      const blob = await put(newStatsPath, JSON.stringify(stats, null, 2), {
        access: 'public',
        token: blobToken,
        contentType: 'application/json',
        allowOverwrite: true
      });
      const storedPath = blob.pathname || newStatsPath;

      if (statsData.sourcePath === STATS_FILE_PATH) {
        try {
          await del(STATS_FILE_PATH, { token: blobToken });
          console.log('🧹 [LOGIN-MODAL-STATS] Usunięto legacy plik statystyk');
        } catch (cleanupError) {
          console.warn('⚠️ [LOGIN-MODAL-STATS] Nie udało się usunąć legacy pliku:', cleanupError?.message || cleanupError);
        }
      }

      await cleanupOldVersions(blobToken, [...(statsData.versions || []), { pathname: storedPath, uploadedAt: new Date().toISOString() }]);

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

      let stats = createEmptyStats();
      try {
        const blobToken = getBlobToken();
        const { stats: loadedStats } = await loadStatsFile(blobToken);
        stats = loadedStats || createEmptyStats();
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

