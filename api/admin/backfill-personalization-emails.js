// api/admin/backfill-personalization-emails.js
// Uzupełnia brakujące emaile w personalization-log na podstawie customerId (Shopify API)

const { put, head } = require('@vercel/blob');

const BLOB_KEY = 'customify/system/stats/personalization-log.json';
const ADMIN_TOKEN = process.env.ADMIN_STATS_TOKEN;

async function withTimeout(promise, timeoutMs, op) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout: ${op} after ${timeoutMs}ms`)), timeoutMs))
  ]);
}

function getBlobToken() {
  const token = process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('Missing BLOB_READ_WRITE_TOKEN');
  return token;
}

async function readLog() {
  const blobToken = getBlobToken();
  const meta = await withTimeout(
    head(BLOB_KEY, { token: blobToken }).catch(() => null),
    10000,
    'head personalization log'
  );
  if (!meta || !meta.url) return [];
  const res = await withTimeout(fetch(meta.url), 10000, 'fetch personalization log');
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function writeLog(entries) {
  const blobToken = getBlobToken();
  await withTimeout(
    put(BLOB_KEY, JSON.stringify(entries), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
      token: blobToken
    }),
    15000,
    'put personalization log'
  );
}

async function fetchCustomerEmailsByIds(customerIds) {
  if (!customerIds.length) return {};
  const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  if (!accessToken) throw new Error('SHOPIFY_ACCESS_TOKEN not configured');

  const chunks = [];
  const chunkSize = 40;
  for (let i = 0; i < customerIds.length; i += chunkSize) {
    chunks.push(customerIds.slice(i, i + chunkSize));
  }

  const idToEmail = {};
  for (const idsChunk of chunks) {
    const query = `
      query($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Customer {
            id
            email
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
      'shopify nodes query'
    );

    const data = await resp.json();
    if (!resp.ok || data.errors) {
      throw new Error(`Shopify GraphQL error: ${JSON.stringify(data.errors || data).slice(0, 500)}`);
    }

    const nodes = data?.data?.nodes || [];
    for (const node of nodes) {
      if (!node || !node.id) continue;
      const plainId = String(node.id).replace('gid://shopify/Customer/', '');
      if (node.email) {
        idToEmail[plainId] = String(node.email).toLowerCase().trim();
      }
    }
  }

  return idToEmail;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  if (ADMIN_TOKEN && token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const entries = await readLog();
    if (!entries.length) {
      return res.status(200).json({ success: true, totalEntries: 0, updatedEntries: 0 });
    }

    const missing = entries.filter((e) => e && e.customerId && !e.email);
    const uniqueIds = Array.from(new Set(missing.map((e) => String(e.customerId))));
    const idToEmail = await fetchCustomerEmailsByIds(uniqueIds);

    let updatedEntries = 0;
    const updated = entries.map((entry) => {
      if (!entry || !entry.customerId || entry.email) return entry;
      const key = String(entry.customerId);
      const email = idToEmail[key];
      if (!email) return entry;
      updatedEntries++;
      return { ...entry, email };
    });

    if (updatedEntries > 0) {
      await writeLog(updated);
    }

    return res.status(200).json({
      success: true,
      totalEntries: entries.length,
      missingEmailEntries: missing.length,
      resolvedCustomers: Object.keys(idToEmail).length,
      updatedEntries
    });
  } catch (error) {
    console.error('[BACKFILL-PERSONALIZATION-EMAILS] Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
