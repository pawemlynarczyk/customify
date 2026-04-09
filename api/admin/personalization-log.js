// api/admin/personalization-log.js
// GET: zwraca log wpisów personalizacji (z opcjonalnym filtrem)
// POST: dodaje nowy wpis (wywoływane z transform.js)

const { put, head } = require('@vercel/blob');

const BLOB_KEY = 'customify/system/stats/personalization-log.json';
const MAX_ENTRIES = 2000;
/** Ten sam user + ten sam produkt + te same pola — w tym oknie: jeden wpis (aktualizacja zamiast duplikatu) */
const DEDUP_WINDOW_MS = 45 * 60 * 1000;

// ⏰ Helper: operacje Blob z timeoutem
async function withTimeout(promise, timeoutMs, op) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout: ${op} after ${timeoutMs}ms`)), timeoutMs))
  ]);
}
const ADMIN_TOKEN = process.env.ADMIN_STATS_TOKEN;

const getBlobToken = () => {
  const token = process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('Missing BLOB_READ_WRITE_TOKEN');
  return token;
};

async function readLog() {
  try {
    const blobToken = getBlobToken();
    // ZAWSZE kanoniczny plik — nie list()+„najnowszy”: inny blob pod tym prefiksem mógł
    // nadpisać log przy zapisie i skasować setki socialImageUrl z JSON.
    const meta = await withTimeout(
      head(BLOB_KEY, { token: blobToken }).catch(() => null),
      8000,
      'head log'
    );
    if (!meta || !meta.url) return [];
    const res = await withTimeout(fetch(meta.url), 10000, 'fetch log');
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeLog(entries) {
  const blobToken = getBlobToken();
  await withTimeout(put(BLOB_KEY, JSON.stringify(entries), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    token: blobToken
  }), 15000, 'put log');
}

function normSig(v) {
  return String(v || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function deviceTokenPrefixFromBody(dt) {
  if (!dt) return '';
  const s = String(dt);
  return s.length >= 8 ? s.substring(0, 8) : s;
}

/** Zapisane w logu: "a1b2c3d4..." — wyciągnij 8 znaków do porównania z body */
function deviceTokenPrefixFromStored(stored) {
  if (!stored || typeof stored !== 'string') return '';
  return stored.replace(/\.\.\.$/, '').substring(0, 8);
}

function personalizationSignature({
  email,
  customerId,
  deviceTokenBody,
  deviceTokenStored,
  productHandle,
  imie,
  rocznica,
  opis,
  style
}) {
  const em = normSig(email);
  const cid = customerId != null ? String(customerId).trim() : '';
  const dev =
    deviceTokenBody != null
      ? deviceTokenPrefixFromBody(deviceTokenBody)
      : deviceTokenPrefixFromStored(deviceTokenStored);
  const userKey = em || (cid ? `cid:${cid}` : '') || (dev ? `dev:${dev}` : '') || 'unknown';
  return [
    userKey,
    normSig(productHandle),
    normSig(imie),
    normSig(opis),
    normSig(rocznica),
    normSig(style)
  ].join('\t');
}

function parseEntryTimeMs(iso) {
  const t = new Date(iso || 0).getTime();
  return Number.isNaN(t) ? 0 : t;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // POST: zapis nowego wpisu (bez auth — wywoływane tylko z transform.js wewnętrznie)
  if (req.method === 'POST') {
    const { timestamp, customerId, email, deviceToken, productHandle, fields, style, ip, imageUrl } = req.body || {};
    if (!fields || !productHandle) return res.status(400).json({ error: 'Missing fields' });

    try {
      const entries = await readLog();
      const newEntry = {
        id: Date.now(),
        timestamp: timestamp || new Date().toISOString(),
        productHandle,
        style: style || null,
        customerId: customerId || null,
        email: email ? String(email).toLowerCase().trim() : null,
        deviceToken: deviceToken ? deviceToken.substring(0, 8) + '...' : null,
        ip: ip || null,
        imie: fields.imiona || null,
        rocznica: fields.rocznica || null,
        opis: fields.opis_charakteru || null,
        imageUrl: imageUrl || null
      };

      const newSig = personalizationSignature({
        email: newEntry.email,
        customerId: newEntry.customerId,
        deviceTokenBody: deviceToken,
        productHandle: newEntry.productHandle,
        imie: newEntry.imie,
        rocznica: newEntry.rocznica,
        opis: newEntry.opis,
        style: newEntry.style
      });
      const nowMs = Date.now();

      const dupIdx = entries.findIndex(e => {
        const es = personalizationSignature({
          email: e.email,
          customerId: e.customerId,
          deviceTokenStored: e.deviceToken,
          productHandle: e.productHandle,
          imie: e.imie,
          rocznica: e.rocznica,
          opis: e.opis,
          style: e.style
        });
        if (es !== newSig) return false;
        return nowMs - parseEntryTimeMs(e.timestamp) < DEDUP_WINDOW_MS;
      });

      let savedEntryId;
      if (dupIdx !== -1) {
        const prev = entries[dupIdx];
        savedEntryId = prev.id;
        entries[dupIdx] = {
          ...prev,
          timestamp: newEntry.timestamp,
          imageUrl: newEntry.imageUrl,
          style: newEntry.style,
          ip: newEntry.ip ?? prev.ip,
          deviceToken: newEntry.deviceToken ?? prev.deviceToken
        };
        if (dupIdx > 0) {
          const [updated] = entries.splice(dupIdx, 1);
          entries.unshift(updated);
        }
        console.log('[PERSONALIZATION-LOG] Dedup: zaktualizowano wpis', prev.id, 'zamiast duplikatu');
      } else {
        entries.unshift(newEntry);
        savedEntryId = newEntry.id;
      }

      // Ogranicz do MAX_ENTRIES
      if (entries.length > MAX_ENTRIES) entries.splice(MAX_ENTRIES);
      await writeLog(entries);
      return res.status(200).json({ ok: true, deduped: dupIdx !== -1, id: savedEntryId });
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
          (e.rocznica || '').toLowerCase().includes(q) ||
          (e.email || '').toLowerCase().includes(q) ||
          String(e.customerId || '').toLowerCase().includes(q)
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

  // PATCH: ustaw socialImageUrl (generate-social-image) albo wyczyść (panel — ponowna generacja)
  if (req.method === 'PATCH') {
    const body = req.body || {};
    const token =
      req.query.token ||
      req.headers['authorization']?.replace('Bearer ', '') ||
      body.token;
    if (ADMIN_TOKEN && token !== ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const entries = await readLog();

      // Masowe czyszczenie: { clearSocialForIds: [id1, id2, ...] }
      const ids = body.clearSocialForIds;
      if (Array.isArray(ids) && ids.length > 0) {
        const set = new Set(ids.map(String));
        let n = 0;
        entries.forEach(e => {
          if (set.has(String(e.id)) && e.socialImageUrl) {
            delete e.socialImageUrl;
            n += 1;
          }
        });
        await writeLog(entries);
        return res.status(200).json({ ok: true, cleared: n });
      }

      const { id, socialImageUrl, clearSocial } = body;
      if (!id) return res.status(400).json({ error: 'Missing id' });

      const idx = entries.findIndex(e => String(e.id) === String(id));
      if (idx === -1) return res.status(404).json({ error: 'Entry not found' });

      if (clearSocial === true || socialImageUrl === null) {
        delete entries[idx].socialImageUrl;
        await writeLog(entries);
        return res.status(200).json({ ok: true, cleared: true });
      }
      if (typeof socialImageUrl === 'string' && socialImageUrl.trim()) {
        entries[idx].socialImageUrl = socialImageUrl.trim();
        await writeLog(entries);
        return res.status(200).json({ ok: true });
      }
      return res.status(400).json({ error: 'Podaj socialImageUrl (URL) albo clearSocial: true / socialImageUrl: null' });
    } catch (err) {
      console.error('[PERSONALIZATION-LOG] PATCH error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
