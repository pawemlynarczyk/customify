// api/admin/login-modal-stats.js
/**
 * API endpoint do zbierania i wyświetlania statystyk modala logowania
 * Zapisuje eventy do Vercel Blob Storage jako JSON
 */

const { put, head, list, del } = require('@vercel/blob');
const { checkRateLimit, getClientIP } = require('../../utils/vercelRateLimiter');

const STATS_FILE_PATH = 'customify/stats/login-modal-stats.json'; // legacy - do odczytu
const STATS_NEW_PREFIX = 'customify/statystyki/';
const STATS_LEGACY_PREFIX = 'customify/temp/admin-stats/';
const MAX_STATS_VERSIONS = 5;

const defaultSummary = () => ({
  totalEntries: 0,
  totalGenerations: 0,
  totalShown: 0,
  totalRegisterClicks: 0,
  totalLoginClicks: 0,
  totalCancelClicks: 0,
  totalAutoRedirects: 0,
  totalRegisterSuccess: 0,
  totalLoginSuccess: 0
});

const defaultBreakdown = () => ({
  entries: 0,
  generations: 0,
  shown: 0,
  registerClicks: 0,
  loginClicks: 0,
  cancelClicks: 0,
  autoRedirects: 0,
  registerSuccess: 0,
  loginSuccess: 0
});

const ensureStatsStructure = (stats) => {
  if (!stats.summary) {
    stats.summary = defaultSummary();
  } else {
    stats.summary = { ...defaultSummary(), ...stats.summary };
  }
  if (!stats.byProduct) {
    stats.byProduct = {};
  }
  if (!stats.byDate) {
    stats.byDate = {};
  }
  Object.keys(stats.byProduct).forEach((key) => {
    stats.byProduct[key] = { ...defaultBreakdown(), ...stats.byProduct[key] };
  });
  Object.keys(stats.byDate).forEach((key) => {
    stats.byDate[key] = { ...defaultBreakdown(), ...stats.byDate[key] };
  });
  return stats;
};

const cloneDeep = (obj) => JSON.parse(JSON.stringify(obj));

const normalizeProductKey = (rawKey) => {
  if (!rawKey || typeof rawKey !== 'string') return 'unknown';
  const withoutHash = rawKey.split('#')[0];
  const withoutQuery = withoutHash.split('?')[0];
  return withoutQuery.replace(/\/+$/, '') || 'unknown';
};

const getProductKeyFromUrl = (productUrl) => {
  if (!productUrl || typeof productUrl !== 'string') return 'unknown';
  const parts = productUrl.split('/products/');
  const candidate = parts[1] || parts[0];
  return normalizeProductKey(candidate);
};

const mergeBreakdownTotals = (target, source) => {
  const base = { ...defaultBreakdown(), ...(target || {}) };
  Object.keys(source || {}).forEach((metric) => {
    const val = source[metric];
    if (typeof val === 'number' && !Number.isNaN(val)) {
      base[metric] = (base[metric] || 0) + val;
    }
  });
  return base;
};

const normalizeByProductStats = (byProduct = {}) => {
  const normalized = {};
  Object.entries(byProduct).forEach(([key, breakdown]) => {
    const normalizedKey = normalizeProductKey(key);
    normalized[normalizedKey] = mergeBreakdownTotals(normalized[normalizedKey], breakdown);
  });
  return normalized;
};

const mergeStatsData = (baseStats, additionalStats) => {
  if (!additionalStats) {
    return ensureStatsStructure(cloneDeep(baseStats));
  }

  const base = ensureStatsStructure(cloneDeep(baseStats));
  const extra = ensureStatsStructure(cloneDeep(additionalStats));

  const existingIds = new Set((base.events || []).map(event => event?.id).filter(Boolean));
  extra.events.forEach(event => {
    if (event && event.id && !existingIds.has(event.id)) {
      base.events.push(event);
      existingIds.add(event.id);
    }
  });
  if (base.events.length > 1000) {
    base.events = base.events.slice(-1000);
  }

  Object.keys(extra.summary).forEach(key => {
    const value = extra.summary[key];
    if (typeof value === 'number' && !Number.isNaN(value)) {
      base.summary[key] = (base.summary[key] || 0) + value;
    }
  });

  const mergeBreakdown = (target, source) => {
    Object.keys(source || {}).forEach(key => {
      if (!target[key]) {
        target[key] = defaultBreakdown();
      } else {
        target[key] = { ...defaultBreakdown(), ...target[key] };
      }
      Object.keys(source[key] || {}).forEach(metric => {
        const val = source[key][metric];
        if (typeof val === 'number' && !Number.isNaN(val)) {
          target[key][metric] = (target[key][metric] || 0) + val;
        }
      });
    });
  };

  mergeBreakdown(base.byProduct, extra.byProduct);
  mergeBreakdown(base.byDate, extra.byDate);

  const createdDates = [base.createdAt, extra.createdAt].filter(Boolean).map(date => new Date(date));
  if (createdDates.length > 0) {
    const earliest = createdDates.reduce((min, date) => (date < min ? date : min), createdDates[0]);
    base.createdAt = earliest.toISOString();
  }

  const updatedDates = [base.lastUpdated, extra.lastUpdated].filter(Boolean).map(date => new Date(date));
  if (updatedDates.length > 0) {
    const latest = updatedDates.reduce((max, date) => (date > max ? date : max), updatedDates[0]);
    base.lastUpdated = latest.toISOString();
  }

  return ensureStatsStructure(base);
};

const getBlobToken = () => {
  const token = process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('Missing customify_READ_WRITE_TOKEN (Vercel Blob auth)');
  }
  return token;
};

/** Granice "dziś" w strefie Europe/Warsaw (żeby zgadzało się z Presty / sklepem). */
function getTodayBoundsWarsawUTC() {
  const now = new Date();
  const warsawDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Warsaw' }); // YYYY-MM-DD
  const [y, m, d] = warsawDateStr.split('-').map(Number);
  const noon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Warsaw',
    timeZoneName: 'shortOffset'
  }).formatToParts(noon);
  const tzPart = parts.find((p) => p.type === 'timeZoneName');
  let offsetHours = 1;
  if (tzPart && tzPart.value) {
    const m = tzPart.value.match(/GMT([+-])(\d+)/);
    if (m) {
      const sign = m[1] === '+' ? 1 : -1;
      offsetHours = sign * parseInt(m[2], 10) || 1;
    }
  }
  const fromUTC = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - offsetHours * 60 * 60 * 1000);
  const toUTC = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0) - offsetHours * 60 * 60 * 1000);
  return {
    from: fromUTC.toISOString(),
    to: toUTC.toISOString()
  };
}

/** Liczba nowych klientów w Shopify z dzisiejszego dnia (dzień w strefie Europe/Warsaw – spójne z Presty). */
const getShopifyNewCustomersToday = async () => {
  const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  if (!accessToken) return null;
  const { from, to } = getTodayBoundsWarsawUTC();
  const query = `query { customersCount(query: "created_at:>=${from} AND created_at:<${to}") { count } }`;
  try {
    const res = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
      body: JSON.stringify({ query })
    });
    if (!res.ok) {
      console.warn('📊 [LOGIN-MODAL-STATS] Shopify customers count HTTP:', res.status);
      return null;
    }
    const json = await res.json();
    if (json.errors) {
      console.warn('📊 [LOGIN-MODAL-STATS] Shopify GraphQL errors:', json.errors);
      return null;
    }
    const count = json?.data?.customersCount?.count;
    return typeof count === 'number' ? count : null;
  } catch (e) {
    console.warn('📊 [LOGIN-MODAL-STATS] Shopify customers count failed:', e?.message || e);
    return null;
  }
};

const loadLatestFromPrefix = async (prefix, blobToken) => {
  if (!prefix) return null;
  try {
    const versionList = await list({
      prefix,
      limit: 100,
      token: blobToken
    });
    const blobs = versionList?.blobs || [];
    if (!blobs.length) {
      return null;
    }
    const sorted = [...blobs].sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
    const latest = sorted[sorted.length - 1];
    const response = await fetch(latest.url);
    if (!response.ok) {
      return null;
    }
    const stats = await response.json();
    return {
      stats,
      sourcePath: latest.pathname || latest.path || null,
      versions: sorted
    };
  } catch (error) {
    console.log(`📊 [LOGIN-MODAL-STATS] No data for prefix ${prefix}:`, error?.message || error);
    return null;
  }
};

const loadLegacyData = async (blobToken) => {
  const legacyPrefixData = await loadLatestFromPrefix(STATS_LEGACY_PREFIX, blobToken);
  if (legacyPrefixData?.stats) {
    return { ...legacyPrefixData, fromLegacyPrefix: true };
  }

  try {
    const legacyBlob = await head(STATS_FILE_PATH, { token: blobToken }).catch(() => null);
    if (legacyBlob?.url) {
      const response = await fetch(legacyBlob.url);
      if (response.ok) {
        const stats = await response.json();
        return {
          stats,
          sourcePath: STATS_FILE_PATH,
          versions: [],
          fromLegacyFile: true
        };
      }
    }
  } catch (error) {
    console.log('📊 [LOGIN-MODAL-STATS] No legacy stats file');
  }

  return null;
};

const createEmptyStats = () => ensureStatsStructure({
  events: [],
  summary: defaultSummary(),
  byProduct: {},
  byDate: {},
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString()
});

const loadStatsFile = async (blobToken, options = {}) => {
  const { includeLegacy = true } = options;

  let stats = createEmptyStats();
  let sourcePath = null;
  let versions = [];

  const latestNewData = await loadLatestFromPrefix(STATS_NEW_PREFIX, blobToken);
  if (latestNewData?.stats) {
    stats = ensureStatsStructure(latestNewData.stats);
    sourcePath = latestNewData.sourcePath;
    versions = latestNewData.versions || [];
  }

  let legacyData = null;
  if (includeLegacy) {
    legacyData = await loadLegacyData(blobToken);
  }

  if (!latestNewData?.stats && legacyData?.stats) {
    stats = ensureStatsStructure(legacyData.stats);
    sourcePath = legacyData.sourcePath || sourcePath;
    versions = legacyData.versions || versions;
  } else if (legacyData?.stats && !stats.migratedFromLegacy) {
    stats = mergeStatsData(stats, legacyData.stats);
    stats.migratedFromLegacy = true;
  }

  return {
    stats: ensureStatsStructure(stats),
    sourcePath,
    versions,
    legacyMerged: Boolean(legacyData?.stats),
    legacySourcePath: legacyData?.sourcePath || null
  };
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
    const ip = getClientIP(req);

    // Rate limiting - 100 requestów/15min
    if (!checkRateLimit(ip, 100, 15 * 60 * 1000)) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    const { eventType, usedCount, limit, productUrl, timestamp } = req.body || {};

    if (!eventType) {
      return res.status(400).json({ error: 'Missing eventType' });
    }

    // ✅ ZWRÓĆ 200 NATYCHMIAST - nie czekaj na wolne operacje Blob
    // Zapobiega 504 timeoutom gdy Blob Storage jest wolny pod obciążeniem
    const eventId = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    res.json({ success: true, message: 'Event received', eventId });

    // Przetwarzaj w tle (po wysłaniu odpowiedzi do klienta)
    setImmediate(async () => {
      try {
        const blobToken = getBlobToken();
        let statsData;
        try {
          statsData = await loadStatsFile(blobToken, { includeLegacy: false });
        } catch (error) {
          statsData = { stats: createEmptyStats(), sourcePath: null, versions: [] };
        }
        let stats = ensureStatsStructure(statsData.stats || createEmptyStats());

        const newEvent = {
          id: eventId,
          eventType,
          usedCount: usedCount || null,
          limit: limit || null,
          productUrl: productUrl || null,
          ip,
          timestamp: timestamp || new Date().toISOString()
        };

        stats.events.push(newEvent);

        if (eventType === 'login_modal_page_entry') stats.summary.totalEntries++;
        if (eventType === 'ai_generation_success') stats.summary.totalGenerations++;
        if (eventType === 'login_modal_shown') stats.summary.totalShown++;
        if (eventType === 'login_modal_register_click') stats.summary.totalRegisterClicks++;
        if (eventType === 'login_modal_login_click') stats.summary.totalLoginClicks++;
        if (eventType === 'login_modal_cancel_click') stats.summary.totalCancelClicks++;
        if (eventType === 'login_modal_auto_redirect') stats.summary.totalAutoRedirects++;
        if (eventType === 'login_modal_register_success') stats.summary.totalRegisterSuccess++;
        if (eventType === 'login_modal_login_success') stats.summary.totalLoginSuccess++;

        if (productUrl) {
          const productKey = getProductKeyFromUrl(productUrl);
          if (!stats.byProduct[productKey]) {
            stats.byProduct[productKey] = defaultBreakdown();
          } else {
            stats.byProduct[productKey] = { ...defaultBreakdown(), ...stats.byProduct[productKey] };
          }
          if (eventType === 'login_modal_page_entry') stats.byProduct[productKey].entries++;
          if (eventType === 'ai_generation_success') stats.byProduct[productKey].generations++;
          if (eventType === 'login_modal_shown') stats.byProduct[productKey].shown++;
          if (eventType === 'login_modal_register_click') stats.byProduct[productKey].registerClicks++;
          if (eventType === 'login_modal_login_click') stats.byProduct[productKey].loginClicks++;
          if (eventType === 'login_modal_cancel_click') stats.byProduct[productKey].cancelClicks++;
          if (eventType === 'login_modal_auto_redirect') stats.byProduct[productKey].autoRedirects++;
          if (eventType === 'login_modal_register_success') stats.byProduct[productKey].registerSuccess++;
          if (eventType === 'login_modal_login_success') stats.byProduct[productKey].loginSuccess++;
        }

        const dateKey = new Date().toISOString().split('T')[0];
        if (!stats.byDate[dateKey]) {
          stats.byDate[dateKey] = defaultBreakdown();
        } else {
          stats.byDate[dateKey] = { ...defaultBreakdown(), ...stats.byDate[dateKey] };
        }
        if (eventType === 'login_modal_page_entry') stats.byDate[dateKey].entries++;
        if (eventType === 'ai_generation_success') stats.byDate[dateKey].generations++;
        if (eventType === 'login_modal_shown') stats.byDate[dateKey].shown++;
        if (eventType === 'login_modal_register_click') stats.byDate[dateKey].registerClicks++;
        if (eventType === 'login_modal_login_click') stats.byDate[dateKey].loginClicks++;
        if (eventType === 'login_modal_cancel_click') stats.byDate[dateKey].cancelClicks++;
        if (eventType === 'login_modal_auto_redirect') stats.byDate[dateKey].autoRedirects++;
        if (eventType === 'login_modal_register_success') stats.byDate[dateKey].registerSuccess++;
        if (eventType === 'login_modal_login_success') stats.byDate[dateKey].loginSuccess++;

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
          del(STATS_FILE_PATH, { token: blobToken }).catch(() => {});
        }
        await cleanupOldVersions(blobToken, [...(statsData.versions || []), { pathname: storedPath, uploadedAt: new Date().toISOString() }]);
        console.log('✅ [LOGIN-MODAL-STATS] Background write OK:', eventType);
      } catch (bgError) {
        console.error('❌ [LOGIN-MODAL-STATS] Background write failed:', bgError?.message || bgError);
      }
    });

    return;
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
        stats = ensureStatsStructure(loadedStats || createEmptyStats());
      } catch (error) {
        console.log('📊 [LOGIN-MODAL-STATS] No existing stats file');
      }

      // Oblicz dodatkowe statystyki
      const conversionRate = stats.summary.totalShown > 0 
        ? ((stats.summary.totalRegisterClicks + stats.summary.totalLoginClicks) / stats.summary.totalShown * 100).toFixed(2)
        : 0;
      const actualConversionRate = stats.summary.totalShown > 0
        ? ((stats.summary.totalRegisterSuccess + stats.summary.totalLoginSuccess) / stats.summary.totalShown * 100).toFixed(2)
        : 0;
      // Stosunek wejść do wyświetleń modala
      const entries = stats.summary.totalEntries || 0;
      const modalShown = stats.summary.totalShown || 0;
      const entriesPerModal = modalShown > 0 ? (entries / modalShown).toFixed(1) : '-';
      const modalPercentOfEntries = entries > 0 ? ((modalShown / entries) * 100).toFixed(2) : 0;

      const normalizedByProduct = normalizeByProductStats(stats.byProduct);

      // Źródło prawdy dla rejestracji: max(eventy z modala, nowi klienci dziś z Shopify) – tylko do wyświetlania
      let shopifyNewCustomersToday = null;
      try {
        shopifyNewCustomersToday = await getShopifyNewCustomersToday();
      } catch (e) {
        console.warn('📊 [LOGIN-MODAL-STATS] getShopifyNewCustomersToday error:', e?.message || e);
      }

      return res.json({
        success: true,
        stats: {
          ...stats,
          byProduct: normalizedByProduct,
          calculated: {
            conversionRate: `${conversionRate}%`,
            actualConversionRate: `${actualConversionRate}%`,
            entriesPerModal,
            modalPercentOfEntries: `${modalPercentOfEntries}%`,
            totalInteractions: stats.summary.totalRegisterClicks + stats.summary.totalLoginClicks + stats.summary.totalCancelClicks + stats.summary.totalAutoRedirects,
            totalSuccess: stats.summary.totalRegisterSuccess + stats.summary.totalLoginSuccess
          }
        },
        shopifyNewCustomersToday: shopifyNewCustomersToday
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

