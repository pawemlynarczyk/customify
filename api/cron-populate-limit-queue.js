/**
 * Cron endpoint (GET): uzupełnia kolejkę limit-reached:* w Vercel KV
 * dla klientów, którzy mają usage_count >= 4, a nie mają wpisu w KV.
 *
 * Cel: nawet jeśli enqueue w /api/transform nie zadziałał (stare deploye / błędy),
 * cron sam "dowiezie" brakujące wpisy bez ręcznego odpalania endpointów.
 */

const { kv } = require('@vercel/kv');

function parseUsageCount(metafield) {
  if (!metafield) return { usageCount: 0, usageType: 'none' };
  const { value, type } = metafield;

  try {
    if (type === 'json') {
      const parsed = JSON.parse(value || '{}');
      return { usageCount: parsed?.total || 0, usageType: 'json' };
    }
    if (type === 'number_integer') {
      return { usageCount: parseInt(value || '0', 10) || 0, usageType: 'number_integer' };
    }
  } catch {
    // fallthrough
  }

  // Fallback – traktuj jak liczbę
  return { usageCount: parseInt(value || '0', 10) || 0, usageType: type || 'unknown' };
}

module.exports = async (req, res) => {
  // CORS (cron nie potrzebuje, ale niech będzie spójnie z resztą)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Admin API działa tylko na domenie myshopify.com – nie na domenie sklepu (np. lumly.pl)
  const envDomain = process.env.SHOPIFY_STORE_DOMAIN || process.env.SHOP_DOMAIN || '';
  const shopDomain = (envDomain && envDomain.includes('myshopify.com')) ? envDomain : 'customify-ok.myshopify.com';
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  if (!accessToken) return res.status(500).json({ error: 'SHOPIFY_ACCESS_TOKEN not configured' });

  const totalLimit = 4;
  const ttlSeconds = 60 * 60 * 48; // 48h

  let pageCount = 0;
  const maxPages = 3; // tylko 3 strony × 100 = 300 klientów (wystarczy do uzupełnienia kolejki)
  let cursor = null;
  let hasNextPage = true;

  let scanned = 0;
  let eligible = 0;
  let added = 0;
  let alreadyQueued = 0;
  let skippedNoMetafield = 0;
  const errors = [];

  console.log('🔄 [CRON-POPULATE-QUEUE] Start backfill kolejki limit-reached:* (usage_count>=4)');

  while (hasNextPage && pageCount < maxPages) {
    pageCount += 1;

    const query = `
      query getCustomersUsage($first: Int!, $after: String) {
        customers(first: $first, after: $after) {
          pageInfo { hasNextPage endCursor }
          edges {
            node {
              id
              metafield(namespace: "customify", key: "usage_count") {
                value
                type
              }
            }
          }
        }
      }
    `;

    const variables = { first: 100, after: cursor };

    const doFetch = () => fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({ query, variables })
    });

    const maxRetries = 3;
    const retryDelayMs = 5000;
    let response;
    let lastErr;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      response = await doFetch();
      if (response.ok) break;
      // 503, 502, 429 = tymczasowe – ponów po chwili
      if ((response.status === 503 || response.status === 502 || response.status === 429) && attempt < maxRetries) {
        console.warn(`⚠️ [CRON-POPULATE-QUEUE] Shopify ${response.status}, retry ${attempt}/${maxRetries} za ${retryDelayMs}ms...`);
        await new Promise((r) => setTimeout(r, retryDelayMs));
        lastErr = null;
        continue;
      }
      lastErr = response;
      break;
    }

    if (lastErr) response = lastErr;

    try {
      // ✅ Sprawdź status odpowiedzi przed parsowaniem JSON
      if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        let errorBody = '';
        
        if (contentType.includes('application/json')) {
          const errorData = await response.json();
          errorBody = JSON.stringify(errorData);
        } else {
          errorBody = await response.text();
          errorBody = errorBody.substring(0, 500);
        }
        
        console.error(`❌ [CRON-POPULATE-QUEUE] HTTP ${response.status} ${response.statusText}`);
        console.error(`❌ [CRON-POPULATE-QUEUE] Response body:`, errorBody);
        
        throw new Error(`Shopify API error: ${response.status} ${response.statusText} - ${errorBody.substring(0, 200)}`);
      }

      // ✅ Sprawdź Content-Type przed parsowaniem JSON
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const textBody = await response.text();
        console.error(`❌ [CRON-POPULATE-QUEUE] Expected JSON but got ${contentType}`);
        console.error(`❌ [CRON-POPULATE-QUEUE] Response body:`, textBody.substring(0, 500));
        throw new Error(`Expected JSON but got ${contentType}. Response: ${textBody.substring(0, 200)}`);
      }

      const data = await response.json();
      if (data.errors) {
        console.error('❌ [CRON-POPULATE-QUEUE] GraphQL errors:', data.errors);
        return res.status(500).json({ error: 'GraphQL error', details: data.errors });
      }

      const customers = data?.data?.customers;
      const edges = customers?.edges || [];
      scanned += edges.length;

      for (const edge of edges) {
        const node = edge?.node;
        const metafield = node?.metafield;
        if (!metafield) {
          skippedNoMetafield += 1;
          continue;
        }

        const { usageCount } = parseUsageCount(metafield);
        if (usageCount < totalLimit) continue;

        eligible += 1;

        const customerId = String(node.id || '').replace('gid://shopify/Customer/', '');
        if (!customerId) continue;

        // Kredyty można dodać tylko raz – pomijaj jeśli już były doładowane
        const alreadyRefilled = await kv.get(`credits-refilled:${customerId}`);
        if (alreadyRefilled) continue;

        const key = `limit-reached:${customerId}`;

        // ✅ nie nadpisuj istniejącego wpisu (ważne dla cooldown 1h)
        const existing = await kv.get(key);
        if (existing) {
          alreadyQueued += 1;
          continue;
        }

        const payload = {
          timestamp: new Date().toISOString(),
          totalUsed: usageCount,
          totalLimit,
          addedBy: 'cron-populate-limit-queue'
        };

        await kv.set(key, JSON.stringify(payload), { ex: ttlSeconds });
        added += 1;
      }

      hasNextPage = customers?.pageInfo?.hasNextPage || false;
      cursor = customers?.pageInfo?.endCursor || null;
    } catch (err) {
      console.error('❌ [CRON-POPULATE-QUEUE] Błąd strony:', err);
      errors.push({ page: pageCount, error: err.message });
      break;
    }
  }

  console.log('✅ [CRON-POPULATE-QUEUE] Done:', { scanned, eligible, added, alreadyQueued, skippedNoMetafield, pageCount });

  return res.status(200).json({
    success: true,
    summary: { scanned, eligible, added, alreadyQueued, skippedNoMetafield, pageCount, maxPages },
    info: added > 0
      ? `Dodano ${added} brakujących wpisów do kolejki. Reset + mail wykona /api/check-and-reset-limits po cooldown 1h.`
      : 'Brak brakujących wpisów do dodania.',
    errors
  });
};


