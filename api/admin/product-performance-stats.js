// api/admin/product-performance-stats.js
/**
 * Zbiera statystyki produktowe: wejścia, kliknięcia generuj, użycia API.
 * GET: panel admin (z filtrem dat) + zakupy z Shopify Orders API
 * POST: zapis eventów z frontu (bez auth, z rate limit)
 */

const { put, list, del } = require('@vercel/blob');
const { checkRateLimit, getClientIP } = require('../../utils/vercelRateLimiter');

const STATS_PREFIX = 'customify/stats/product-performance/';
const MAX_STATS_VERSIONS = 5;

const defaultSummary = () => ({
  totalViews: 0,
  totalGenerateClicks: 0,
  totalApiSuccess: 0,
  totalApiError: 0,
  totalValidationErrors: 0
});

const defaultBreakdown = () => ({
  views: 0,
  generateClicks: 0,
  apiSuccess: 0,
  apiError: 0,
  validationErrors: 0
});

const ensureStatsStructure = (stats) => {
  const normalized = stats || {};
  normalized.summary = { ...defaultSummary(), ...(normalized.summary || {}) };
  normalized.byProduct = normalized.byProduct || {};
  normalized.byDate = normalized.byDate || {};
  normalized.byProductDate = normalized.byProductDate || {};
  normalized.validationByProductDateMessage = normalized.validationByProductDateMessage || {};
  normalized.productsMeta = normalized.productsMeta || {};

  Object.keys(normalized.byProduct).forEach((key) => {
    normalized.byProduct[key] = { ...defaultBreakdown(), ...normalized.byProduct[key] };
  });
  Object.keys(normalized.byDate).forEach((key) => {
    normalized.byDate[key] = { ...defaultBreakdown(), ...normalized.byDate[key] };
  });
  Object.keys(normalized.byProductDate).forEach((productId) => {
    const perDate = normalized.byProductDate[productId] || {};
    Object.keys(perDate).forEach((dateKey) => {
      perDate[dateKey] = { ...defaultBreakdown(), ...perDate[dateKey] };
    });
  });
  Object.keys(normalized.validationByProductDateMessage).forEach((productId) => {
    normalized.validationByProductDateMessage[productId] = normalized.validationByProductDateMessage[productId] || {};
  });

  return normalized;
};

const cloneDeep = (obj) => JSON.parse(JSON.stringify(obj));

const getBlobToken = () => {
  const token = process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('Missing customify_READ_WRITE_TOKEN (Vercel Blob auth)');
  }
  return token;
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
    console.log(`📦 [PRODUCT-STATS] No data for prefix ${prefix}:`, error?.message || error);
    return null;
  }
};

const createEmptyStats = () => ensureStatsStructure({
  summary: defaultSummary(),
  byProduct: {},
  byDate: {},
  byProductDate: {},
  validationByProductDateMessage: {},
  productsMeta: {},
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString()
});

const loadStatsFile = async (blobToken) => {
  const latestData = await loadLatestFromPrefix(STATS_PREFIX, blobToken);
  if (latestData?.stats) {
    return {
      stats: ensureStatsStructure(latestData.stats),
      sourcePath: latestData.sourcePath,
      versions: latestData.versions || []
    };
  }
  return {
    stats: createEmptyStats(),
    sourcePath: null,
    versions: []
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
      // cleanup przy każdym evencie gdy >5 wersji - nie loguj (zaśmieca logi)
    } catch (error) {
      console.warn(`⚠️ [PRODUCT-STATS] Nie udało się usunąć ${path}:`, error?.message || error);
    }
  }
};

const parseDateParam = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return trimmed;
};

const toDateRange = (startParam, endParam) => {
  const now = new Date();
  let start = parseDateParam(startParam);
  let end = parseDateParam(endParam);
  let usedDefaultRange = false;

  if (!start || !end) {
    const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const startDate = new Date(endDate.getTime() - 29 * 24 * 60 * 60 * 1000);
    start = startDate.toISOString().slice(0, 10);
    end = endDate.toISOString().slice(0, 10);
    usedDefaultRange = true;
  }

  const startIso = `${start}T00:00:00.000Z`;
  const endIso = `${end}T23:59:59.999Z`;

  return { start, end, startIso, endIso, usedDefaultRange };
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

const aggregateByProductForRange = (stats, start, end) => {
  const aggregated = {};
  const byProductDate = stats.byProductDate || {};
  Object.keys(byProductDate).forEach((productId) => {
    const perDate = byProductDate[productId] || {};
    Object.keys(perDate).forEach((dateKey) => {
      if (dateKey < start || dateKey > end) return;
      aggregated[productId] = mergeBreakdownTotals(aggregated[productId], perDate[dateKey]);
    });
  });
  return aggregated;
};

const aggregateByDateForRange = (stats, start, end) => {
  const aggregated = {};
  Object.keys(stats.byDate || {}).forEach((dateKey) => {
    if (dateKey < start || dateKey > end) return;
    aggregated[dateKey] = { ...defaultBreakdown(), ...(stats.byDate[dateKey] || {}) };
  });
  return aggregated;
};

const aggregateValidationMessagesForRange = (stats, start, end) => {
  const aggregated = {};
  const byProductDateMessage = stats.validationByProductDateMessage || {};
  Object.keys(byProductDateMessage).forEach((productId) => {
    const perDate = byProductDateMessage[productId] || {};
    Object.keys(perDate).forEach((dateKey) => {
      if (dateKey < start || dateKey > end) return;
      const messages = perDate[dateKey] || {};
      if (!aggregated[productId]) aggregated[productId] = {};
      Object.keys(messages).forEach((message) => {
        const count = Number(messages[message] || 0);
        if (!Number.isFinite(count) || count <= 0) return;
        aggregated[productId][message] = (aggregated[productId][message] || 0) + count;
      });
    });
  });
  return aggregated;
};

const parseLinkHeader = (header) => {
  if (!header) return {};
  const links = {};
  const parts = header.split(',');
  parts.forEach((part) => {
    const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (match) {
      links[match[2]] = match[1];
    }
  });
  return links;
};

const extractOriginalProductId = (lineItem) => {
  const props = Array.isArray(lineItem?.properties) ? lineItem.properties : [];
  const prop = props.find((entry) => {
    const name = entry?.name || entry?.key;
    return name === '_Original Product ID' || name === 'Original Product ID' || name === '_Original_Product_ID';
  });
  const rawValue = prop?.value;
  if (!rawValue) return null;
  const trimmed = String(rawValue).trim();
  if (!trimmed) return null;
  const numericMatch = trimmed.match(/\d+/);
  return numericMatch ? numericMatch[0] : null;
};

const isGeneratedTitle = (value) => {
  if (!value || typeof value !== 'string') return false;
  const lower = value.toLowerCase();
  return lower.includes('rozmiar') || lower.includes('produkt cyfrowy');
};

const fetchOrdersBetween = async (shopDomain, accessToken, startIso, endIso) => {
  const purchasesByProduct = {};
  const ordersByProduct = {};
  const allowedFinancialStatus = new Set(['paid', 'partially_paid']);

  let nextUrl = `https://${shopDomain}/admin/api/2024-01/orders.json?status=any&limit=250&created_at_min=${encodeURIComponent(startIso)}&created_at_max=${encodeURIComponent(endIso)}&fields=id,created_at,financial_status,cancelled_at,line_items`;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        'X-Shopify-Access-Token': accessToken
      }
    });

    if (!response.ok) {
      throw new Error(`Shopify Orders API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const orders = data.orders || [];

    orders.forEach((order) => {
      if (order.cancelled_at) return;
      if (!allowedFinancialStatus.has(order.financial_status)) return;
      const orderId = order.id;
      (order.line_items || []).forEach((item) => {
        const originalProductId = extractOriginalProductId(item);
        const productId = originalProductId || (item.product_id ? String(item.product_id) : null);
        if (!productId) return;
        const qty = Number(item.quantity || 0);
        if (!Number.isFinite(qty) || qty <= 0) return;
        purchasesByProduct[productId] = (purchasesByProduct[productId] || 0) + qty;
        if (!ordersByProduct[productId]) {
          ordersByProduct[productId] = new Set();
        }
        ordersByProduct[productId].add(orderId);
      });
    });

    const linkHeader = response.headers.get('link');
    const links = parseLinkHeader(linkHeader);
    nextUrl = links.next || null;
  }

  const ordersCountByProduct = {};
  Object.keys(ordersByProduct).forEach((productId) => {
    ordersCountByProduct[productId] = ordersByProduct[productId].size;
  });

  return { purchasesByProduct, ordersCountByProduct };
};

const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const fetchProductsByIds = async (shopDomain, accessToken, productIds) => {
  const results = {};
  const gids = productIds.map((id) => `gid://shopify/Product/${id}`);

  for (const chunk of chunkArray(gids, 50)) {
    const query = `
      query ProductNodes($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Product {
            id
            title
            handle
            onlineStoreUrl
            featuredImage {
              url
            }
          }
        }
      }
    `;
    const response = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({ query, variables: { ids: chunk } })
    });

    if (!response.ok) {
      throw new Error(`Shopify GraphQL error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const nodes = data?.data?.nodes || [];
    nodes.forEach((node) => {
      if (!node || !node.id) return;
      const numericId = node.id.split('/').pop();
      results[String(numericId)] = {
        id: String(numericId),
        title: node.title || null,
        handle: node.handle || null,
        productUrl: node.onlineStoreUrl || null,
        imageUrl: node.featuredImage?.url || null
      };
    });
  }

  return results;
};

module.exports = async (req, res) => {
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

  if (req.method === 'POST') {
    try {
      const ip = getClientIP(req);
      if (!checkRateLimit(ip, 200, 15 * 60 * 1000)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const {
        eventType,
        productId,
        productHandle,
        productTitle,
        productUrl,
        imageUrl,
        timestamp
      } = req.body || {};

      if (!eventType || !productId) {
        return res.status(400).json({ error: 'Missing eventType or productId' });
      }

      const blobToken = getBlobToken();
      const statsData = await loadStatsFile(blobToken);
      const stats = ensureStatsStructure(cloneDeep(statsData.stats || createEmptyStats()));

      const productKey = String(productId);
      const dateKey = new Date(timestamp || Date.now()).toISOString().split('T')[0];

      if (!stats.byProduct[productKey]) {
        stats.byProduct[productKey] = defaultBreakdown();
      }
      if (!stats.byDate[dateKey]) {
        stats.byDate[dateKey] = defaultBreakdown();
      }
      if (!stats.byProductDate[productKey]) {
        stats.byProductDate[productKey] = {};
      }
      if (!stats.byProductDate[productKey][dateKey]) {
        stats.byProductDate[productKey][dateKey] = defaultBreakdown();
      }

      if (eventType === 'product_view') {
        stats.summary.totalViews++;
        stats.byProduct[productKey].views++;
        stats.byDate[dateKey].views++;
        stats.byProductDate[productKey][dateKey].views++;
      }
      if (eventType === 'generate_click') {
        stats.summary.totalGenerateClicks++;
        stats.byProduct[productKey].generateClicks++;
        stats.byDate[dateKey].generateClicks++;
        stats.byProductDate[productKey][dateKey].generateClicks++;
      }
      if (eventType === 'api_success') {
        stats.summary.totalApiSuccess++;
        stats.byProduct[productKey].apiSuccess++;
        stats.byDate[dateKey].apiSuccess++;
        stats.byProductDate[productKey][dateKey].apiSuccess++;
      }
      if (eventType === 'api_error') {
        stats.summary.totalApiError++;
        stats.byProduct[productKey].apiError++;
        stats.byDate[dateKey].apiError++;
        stats.byProductDate[productKey][dateKey].apiError++;
      }
      if (eventType === 'validation_error') {
        stats.summary.totalValidationErrors++;
        stats.byProduct[productKey].validationErrors++;
        stats.byDate[dateKey].validationErrors++;
        stats.byProductDate[productKey][dateKey].validationErrors++;

        const message = req.body?.message ? String(req.body.message).trim().slice(0, 120) : 'unknown';
        if (!stats.validationByProductDateMessage[productKey]) {
          stats.validationByProductDateMessage[productKey] = {};
        }
        if (!stats.validationByProductDateMessage[productKey][dateKey]) {
          stats.validationByProductDateMessage[productKey][dateKey] = {};
        }
        const messagesMap = stats.validationByProductDateMessage[productKey][dateKey];
        messagesMap[message] = (messagesMap[message] || 0) + 1;
      }

      stats.productsMeta[productKey] = {
        id: productKey,
        handle: productHandle || stats.productsMeta[productKey]?.handle || null,
        title: productTitle || stats.productsMeta[productKey]?.title || null,
        productUrl: productUrl || stats.productsMeta[productKey]?.productUrl || null,
        imageUrl: imageUrl || stats.productsMeta[productKey]?.imageUrl || null,
        lastSeenAt: new Date().toISOString()
      };

      stats.lastUpdated = new Date().toISOString();

      const newStatsPath = `${STATS_PREFIX}stats-${Date.now()}.json`;
      const blob = await put(newStatsPath, JSON.stringify(stats, null, 2), {
        access: 'public',
        token: blobToken,
        contentType: 'application/json',
        allowOverwrite: true
      });

      const storedPath = blob.pathname || newStatsPath;
      await cleanupOldVersions(blobToken, [...(statsData.versions || []), { pathname: storedPath, uploadedAt: new Date().toISOString() }]);

      return res.json({ success: true });
    } catch (error) {
      console.error('❌ [PRODUCT-STATS] Error saving event:', error);
      return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const authHeader = req.headers.authorization;
      const expectedToken = process.env.ADMIN_STATS_TOKEN;
      if (!expectedToken) {
        return res.status(500).json({ error: 'ADMIN_STATS_TOKEN not set' });
      }
      const expectedAuth = `Bearer ${expectedToken}`;
      if (!authHeader || authHeader !== expectedAuth) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or missing authorization token'
        });
      }

      const blobToken = getBlobToken();
      const { stats: loadedStats } = await loadStatsFile(blobToken);
      const stats = ensureStatsStructure(loadedStats || createEmptyStats());

      const { start, end, startIso, endIso, usedDefaultRange } = toDateRange(req.query.startDate, req.query.endDate);

      const aggregatedByProduct = aggregateByProductForRange(stats, start, end);
      const aggregatedByDate = aggregateByDateForRange(stats, start, end);
      const aggregatedValidationMessages = aggregateValidationMessagesForRange(stats, start, end);

      const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
      const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
      if (!accessToken) {
        return res.status(500).json({ error: 'Missing SHOPIFY_ACCESS_TOKEN' });
      }

      const { purchasesByProduct, ordersCountByProduct } = await fetchOrdersBetween(
        shopDomain,
        accessToken,
        startIso,
        endIso
      );

      const productIdsSet = new Set([
        ...Object.keys(aggregatedByProduct || {}),
        ...Object.keys(purchasesByProduct || {})
      ]);
      const productIds = Array.from(productIdsSet);

      const fetchedMeta = await fetchProductsByIds(shopDomain, accessToken, productIds);

      const products = productIds.map((productId) => {
        const metaFromStats = stats.productsMeta?.[productId] || {};
        const metaFromShopify = fetchedMeta?.[productId] || {};
        const breakdown = aggregatedByProduct?.[productId] || defaultBreakdown();
        const purchasesQty = purchasesByProduct?.[productId] || 0;
        const ordersCount = ordersCountByProduct?.[productId] || 0;

        const views = breakdown.views || 0;
        const generateClicks = breakdown.generateClicks || 0;
        const apiSuccess = breakdown.apiSuccess || 0;
        const apiError = breakdown.apiError || 0;
        const validationErrors = breakdown.validationErrors || 0;
        const validationMessages = aggregatedValidationMessages?.[productId] || {};

        const conversionFromViews = views > 0 ? (purchasesQty / views) * 100 : 0;
        const conversionFromGenerates = generateClicks > 0 ? (purchasesQty / generateClicks) * 100 : 0;
        const apiSuccessRate = (apiSuccess + apiError) > 0 ? (apiSuccess / (apiSuccess + apiError)) * 100 : 0;

        return {
          productId,
          title: metaFromStats.title || metaFromShopify.title || null,
          handle: metaFromStats.handle || metaFromShopify.handle || null,
          productUrl: metaFromStats.productUrl || metaFromShopify.productUrl || null,
          imageUrl: metaFromStats.imageUrl || metaFromShopify.imageUrl || null,
          views,
          generateClicks,
          apiSuccess,
          apiError,
          validationErrors,
          purchasesQty,
          ordersCount,
          conversionFromViews,
          conversionFromGenerates,
          apiSuccessRate,
          validationMessages
        };
      });

      const filteredProducts = products.filter((product) => {
        const title = product.title || '';
        const handle = product.handle || '';
        return !isGeneratedTitle(title) && !isGeneratedTitle(handle);
      });

      const summary = filteredProducts.reduce((acc, item) => {
        acc.totalViews += item.views;
        acc.totalGenerateClicks += item.generateClicks;
        acc.totalApiSuccess += item.apiSuccess;
        acc.totalApiError += item.apiError;
        acc.totalValidationErrors += item.validationErrors || 0;
        acc.totalPurchasesQty += item.purchasesQty;
        acc.totalOrdersCount += item.ordersCount;
        return acc;
      }, {
        totalViews: 0,
        totalGenerateClicks: 0,
        totalApiSuccess: 0,
        totalApiError: 0,
        totalValidationErrors: 0,
        totalPurchasesQty: 0,
        totalOrdersCount: 0
      });

      return res.json({
        success: true,
        range: { start, end, usedDefaultRange },
        summary,
        products: filteredProducts.sort((a, b) => b.purchasesQty - a.purchasesQty),
        byDate: aggregatedByDate
      });
    } catch (error) {
      console.error('❌ [PRODUCT-STATS] Error fetching stats:', error);
      return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
