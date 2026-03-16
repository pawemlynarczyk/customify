// api/admin/personalization-log.js
// GET: zwraca log wpisów personalizacji (z opcjonalnym filtrem)
// POST: dodaje nowy wpis (wywoływane z transform.js)

const { put, list } = require('@vercel/blob');

const BLOB_KEY = 'customify/system/stats/personalization-log.json';
const MAX_ENTRIES = 2000;
const ADMIN_TOKEN = process.env.ADMIN_STATS_TOKEN;

const getBlobToken = () => {
  const token = process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('Missing BLOB_READ_WRITE_TOKEN');
  return token;
};

async function readLog() {
  try {
    const blobToken = getBlobToken();
    const { blobs } = await list({ prefix: 'customify/system/stats/personalization-log', token: blobToken });
    if (!blobs || blobs.length === 0) return [];
    const latest = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
    const res = await fetch(latest.url);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function writeLog(entries) {
  const blobToken = getBlobToken();
  await put(BLOB_KEY, JSON.stringify(entries), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    token: blobToken
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // POST: zapis nowego wpisu (bez auth — wywoływane tylko z transform.js wewnętrznie)
  if (req.method === 'POST') {
    const { timestamp, customerId, deviceToken, productHandle, fields, style, ip } = req.body || {};
    if (!fields || !productHandle) return res.status(400).json({ error: 'Missing fields' });

    try {
      const entries = await readLog();
      const newEntry = {
        id: Date.now(),
        timestamp: timestamp || new Date().toISOString(),
        productHandle,
        style: style || null,
        customerId: customerId || null,
        deviceToken: deviceToken ? deviceToken.substring(0, 8) + '...' : null,
        ip: ip || null,
        imie: fields.imiona || null,
        rocznica: fields.rocznica || null,
        opis: fields.opis_charakteru || null
      };
      entries.unshift(newEntry);
      // Ogranicz do MAX_ENTRIES
      if (entries.length > MAX_ENTRIES) entries.splice(MAX_ENTRIES);
      await writeLog(entries);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[PERSONALIZATION-LOG] Write error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // GET: odczyt logu (wymaga tokena admina)
  if (req.method === 'GET') {
    const token = req.query.token || req.headers['authorization']?.replace('Bearer ', '');
    if (ADMIN_TOKEN && token !== ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const entries = await readLog();

      // Filtry
      let filtered = entries;
      if (req.query.product) {
        filtered = filtered.filter(e => e.productHandle === req.query.product);
      }
      if (req.query.search) {
        const q = req.query.search.toLowerCase();
        filtered = filtered.filter(e =>
          (e.imie || '').toLowerCase().includes(q) ||
          (e.opis || '').toLowerCase().includes(q) ||
          (e.rocznica || '').toLowerCase().includes(q)
        );
      }
      if (req.query.dateFrom) {
        filtered = filtered.filter(e => e.timestamp >= req.query.dateFrom);
      }
      if (req.query.dateTo) {
        filtered = filtered.filter(e => e.timestamp <= req.query.dateTo + 'T23:59:59');
      }

      // Statystyki
      const productCounts = {};
      entries.forEach(e => {
        productCounts[e.productHandle] = (productCounts[e.productHandle] || 0) + 1;
      });

      // Top słowa z pola "opis"
      const wordFreq = {};
      entries.forEach(e => {
        if (e.opis) {
          e.opis.toLowerCase().split(/[\s,;.]+/).forEach(w => {
            if (w.length > 3) wordFreq[w] = (wordFreq[w] || 0) + 1;
          });
        }
      });
      const topWords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .map(([word, count]) => ({ word, count }));

      return res.status(200).json({
        total: entries.length,
        filtered: filtered.length,
        entries: filtered.slice(0, parseInt(req.query.limit) || 200),
        stats: { productCounts, topWords }
      });
    } catch (err) {
      console.error('[PERSONALIZATION-LOG] Read error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
