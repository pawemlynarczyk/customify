// api/admin/limit-wall-users.js
// Lista użytkowników, którzy dostali doładowanie kredytów i ponownie doszli do limitu.

const { kv } = require('@vercel/kv');
const { head } = require('@vercel/blob');

const ADMIN_TOKEN = process.env.ADMIN_STATS_TOKEN;

async function withTimeout(promise, timeoutMs, op) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout: ${op} after ${timeoutMs}ms`)), timeoutMs))
  ]);
}

function parseUsageValue(rawValue) {
  try {
    const parsed = JSON.parse(rawValue || '{}');
    if (parsed && typeof parsed === 'object') {
      return Number(parsed.total || 0);
    }
  } catch (_) {
    // old number_integer format
  }
  return parseInt(rawValue || '0', 10) || 0;
}

function parseDateSafe(value) {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

async function inferWallReachedAtFromGenerations(customerId, refillAnchorDate) {
  const blobToken = process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) return null;
  const anchorMs = refillAnchorDate ? Date.parse(refillAnchorDate) : null;

  const path = `customify/system/stats/generations/customer-${customerId}.json`;
  try {
    const blob = await withTimeout(head(path, { token: blobToken }), 10000, 'head customer generation blob');
    if (!blob?.url) return null;
    const resp = await withTimeout(fetch(blob.url), 12000, 'fetch customer generation blob');
    if (!resp.ok) return null;
    const data = await resp.json();
    const generations = Array.isArray(data?.generations) ? data.generations : [];
    const normalized = generations
      .map((g) => parseDateSafe(g?.date || g?.timestamp))
      .filter(Boolean)
      .sort((a, b) => Date.parse(a) - Date.parse(b));

    // Główny przypadek: znamy datę doładowania i liczymy 4. generację po refill.
    if (anchorMs && !Number.isNaN(anchorMs)) {
      const afterRefill = normalized.filter((iso) => Date.parse(iso) >= anchorMs);
      if (afterRefill.length >= 4) return afterRefill[3];
    }

    // Fallback legacy: brak daty refill -> przyjmij "4. najnowszą generację"
    // jako moment dojścia do 4/4 (dla użytkowników, którzy teraz mają usage=4).
    const desc = [...normalized].sort((a, b) => Date.parse(b) - Date.parse(a));
    if (desc.length >= 4) return desc[3];
    return null;
  } catch (_) {
    return null;
  }
}

async function fetchCustomersUsage(customerIds) {
  const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  if (!accessToken) throw new Error('SHOPIFY_ACCESS_TOKEN not configured');
  if (!customerIds.length) return {};

  const chunks = [];
  const chunkSize = 40;
  for (let i = 0; i < customerIds.length; i += chunkSize) {
    chunks.push(customerIds.slice(i, i + chunkSize));
  }

  const result = {};
  for (const idsChunk of chunks) {
    const query = `
      query($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Customer {
            id
            email
            metafield(namespace: "customify", key: "usage_count") {
              value
              type
            }
          }
        }
      }
    `;
    const variables = {
      ids: idsChunk.map((id) => `gid://shopify/Customer/${id}`)
    };
    const resp = await withTimeout(
      fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        },
        body: JSON.stringify({ query, variables })
      }),
      15000,
      'shopify nodes usage query'
    );
    const data = await resp.json();
    if (!resp.ok || data.errors) {
      throw new Error(`Shopify GraphQL error: ${JSON.stringify(data.errors || data).slice(0, 500)}`);
    }

    const nodes = data?.data?.nodes || [];
    for (const node of nodes) {
      if (!node || !node.id) continue;
      const customerId = String(node.id).replace('gid://shopify/Customer/', '');
      result[customerId] = {
        email: node.email ? String(node.email).toLowerCase().trim() : null,
        usageCount: parseUsageValue(node.metafield?.value || '0'),
        usageType: node.metafield?.type || null
      };
    }
  }

  return result;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  if (ADMIN_TOKEN && token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const refillKeys = await kv.keys('credits-refilled:*');
    const customerIds = refillKeys.map((k) => k.replace('credits-refilled:', '')).filter(Boolean);
    const usageByCustomer = await fetchCustomersUsage(customerIds);

    const rows = [];
    for (const customerId of customerIds) {
      const usage = usageByCustomer[customerId] || { email: null, usageCount: 0, usageType: null };
      const emailData = await kv.get(`credit-email-sent:${customerId}`).catch(() => null);
      const emailPayload = typeof emailData === 'string' ? JSON.parse(emailData) : emailData;
      const emailSentAt = emailPayload?.sentAt || null;
      const refillMetaRaw = await kv.get(`credits-refilled-meta:${customerId}`).catch(() => null);
      const refillMeta = typeof refillMetaRaw === 'string' ? JSON.parse(refillMetaRaw) : refillMetaRaw;
      const refilledAt = parseDateSafe(refillMeta?.refilledAt) || parseDateSafe(emailSentAt);

      const wallRaw = await kv.get(`wall-after-refill:${customerId}`).catch(() => null);
      const wallPayload = typeof wallRaw === 'string' ? JSON.parse(wallRaw) : wallRaw;
      let wallReachedAt = parseDateSafe(wallPayload?.reachedAt) || null;

      // Fallback historyczny: jeśli user ma 4/4 po refill, spróbuj wyliczyć datę z pliku generacji.
      if (!wallReachedAt && usage.usageCount >= 4 && refilledAt) {
        wallReachedAt = await inferWallReachedAtFromGenerations(customerId, refilledAt);
      }

      rows.push({
        customerId,
        email: usage.email || emailPayload?.email || null,
        usageCount: usage.usageCount,
        usageType: usage.usageType,
        reachedWallAgain: usage.usageCount >= 4,
        refillMarker: true,
        refilledAt,
        wallReachedAt,
        creditEmailSentAt: emailSentAt,
        creditEmailId: emailPayload?.emailId || null
      });
    }

    rows.sort((a, b) => {
      if ((b.usageCount || 0) !== (a.usageCount || 0)) return (b.usageCount || 0) - (a.usageCount || 0);
      return String(a.email || '').localeCompare(String(b.email || ''), 'pl');
    });

    const reachedWallAgain = rows.filter((r) => r.reachedWallAgain);
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 500, 5000));

    return res.status(200).json({
      success: true,
      totalRefilledUsers: rows.length,
      reachedWallAgainCount: reachedWallAgain.length,
      users: rows.slice(0, limit),
      wallUsers: reachedWallAgain.slice(0, limit)
    });
  } catch (error) {
    console.error('[LIMIT-WALL-USERS] Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
