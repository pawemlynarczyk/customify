const fs = require('fs/promises');
const path = require('path');
const { put, head } = require('@vercel/blob');

/**
 * Admin endpoint do zarządzania stylami (odczyt/upsert/toggle/single-style).
 * Zakres początkowy: 3 karykatury, 1 królowa (Segmind), 1 para królewska (Nano Banana).
 */

const CONFIG_PATH = path.join(process.cwd(), 'config', 'styles.json');
const BLOB_PATH = 'config/styles.json';
const BLOB_TOKEN = process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
// CORS – upraszczamy do "*", żeby uniknąć błędów fetch przy różnych hostach panelu
const ALLOWED_ORIGINS = ['*'];
const ALLOWED_API_TYPES = ['nano-banana', 'segmind-faceswap', 'segmind-caricature', 'openai-caricature'];
const ALLOWED_MODELS = [
  'google/nano-banana',
  'segmind/faceswap-v4',
  'segmind/caricature-style',
  'gpt-image-1'
];

const sendCors = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
};

const authGuard = (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token || token !== process.env.ADMIN_STATS_TOKEN) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
};

const readConfig = async () => {
  // 1) Spróbuj Vercel Blob (trwałe w chmurze)
  if (BLOB_TOKEN) {
    try {
      const blob = await head(BLOB_PATH, { token: BLOB_TOKEN }).catch(() => null);
      if (blob?.url) {
        const res = await fetch(blob.url);
        if (res.ok) {
          const data = await res.json();
          return data;
        }
      }
    } catch (err) {
      console.error('❌ [ADMIN-STYLES] Blob read failed, fallback to local:', err.message);
    }
  }
  // 2) Fallback: lokalny plik (repo)
  const raw = await fs.readFile(CONFIG_PATH, 'utf8');
  return JSON.parse(raw);
};

const writeConfig = async (data) => {
  const payload = { ...data, updatedAt: new Date().toISOString() };
  // Zapisz do Blob (trwale między wywołaniami)
  if (!BLOB_TOKEN) {
    throw new Error('Brak tokenu do Blob (customify_READ_WRITE_TOKEN lub BLOB_READ_WRITE_TOKEN)');
  }
  await put(BLOB_PATH, JSON.stringify(payload, null, 2), {
    token: BLOB_TOKEN,
    contentType: 'application/json',
    access: 'public',
    allowOverwrite: true
  });
  // Lokalnie nie zapisujemy (serwerless jest efemeryczny); sync do repo robimy ręcznie
  return payload;
};

const validateStyle = (style, config) => {
  if (!style || typeof style.slug !== 'string' || !style.slug.trim()) {
    return 'Brak lub pusty slug';
  }
  if (!style.productType || !config.productTypes?.[style.productType]) {
    return 'Nieobsługiwany productType';
  }
  if (!ALLOWED_API_TYPES.includes(style.apiType)) {
    return 'Nieobsługiwany apiType';
  }
  if (!ALLOWED_MODELS.includes(style.model)) {
    return 'Nieobsługiwany model';
  }
  // products opcjonalne (test bez przypisania); mogą być stringami lub obiektami {handle, thumbnail?, targetImage?}
  if (!Array.isArray(style.products)) {
    style.products = [];
  } else {
    style.products = style.products.map((p) => {
      if (typeof p === 'string') return p;
      if (p && typeof p === 'object') {
        return {
          handle: p.handle || '',
          thumbnail: p.thumbnail || null,
          targetImage: p.targetImage || null
        };
      }
      return null;
    }).filter(Boolean);
  }
  return null;
};

module.exports = async (req, res) => {
  sendCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!authGuard(req, res)) return;

  if (req.method === 'GET') {
    try {
      const cfg = await readConfig();
      return res.json({ success: true, config: cfg });
    } catch (err) {
      console.error('❌ [ADMIN-STYLES] Read error:', err);
      return res.status(500).json({ error: 'Failed to read config', message: err.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, style, slug, active, singleStyle } = req.body || {};

  try {
    const cfg = await readConfig();

    if (action === 'upsertStyle') {
      const errMsg = validateStyle(style, cfg);
      if (errMsg) {
        return res.status(400).json({ error: 'Validation failed', message: errMsg });
      }

      const existingIdx = cfg.styles.findIndex((s) => s.slug === style.slug);
      if (existingIdx >= 0) {
        cfg.styles[existingIdx] = { ...cfg.styles[existingIdx], ...style };
      } else {
        cfg.styles.push(style);
      }
      const saved = await writeConfig(cfg);
      return res.json({ success: true, config: saved });
    }

    if (action === 'toggleStyle') {
      if (!slug) {
        return res.status(400).json({ error: 'Validation failed', message: 'Brak slug' });
      }
      const idx = cfg.styles.findIndex((s) => s.slug === slug);
      if (idx === -1) {
        return res.status(404).json({ error: 'Not found', message: 'Styl nie istnieje' });
      }
      cfg.styles[idx].active = typeof active === 'boolean' ? active : !cfg.styles[idx].active;
      const saved = await writeConfig(cfg);
      return res.json({ success: true, config: saved });
    }

    if (action === 'deleteStyle') {
      if (!slug) {
        return res.status(400).json({ error: 'Validation failed', message: 'Brak slug' });
      }
      const idx = cfg.styles.findIndex((s) => s.slug === slug);
      if (idx === -1) {
        return res.status(404).json({ error: 'Not found', message: 'Styl nie istnieje' });
      }
      cfg.styles.splice(idx, 1);
      const saved = await writeConfig(cfg);
      return res.json({ success: true, config: saved });
    }

    if (action === 'setSingleStyle') {
      // singleStyle: { productHandle, productType, defaultStyleSlug, enabled }
      if (!singleStyle || !singleStyle.productHandle || !singleStyle.defaultStyleSlug || !singleStyle.productType) {
        return res.status(400).json({ error: 'Validation failed', message: 'Brak wymaganych pól singleStyle' });
      }
      const allowedHandles = cfg.productTypes[singleStyle.productType]?.handles || [];
      if (!allowedHandles.includes(singleStyle.productHandle)) {
        return res.status(400).json({ error: 'Validation failed', message: 'Produkt nieobsługiwany dla tego productType' });
      }
      const targetStyle = cfg.styles.find((s) => s.slug === singleStyle.defaultStyleSlug);
      if (!targetStyle) {
        return res.status(404).json({ error: 'Not found', message: 'Styl nie istnieje' });
      }
      if (targetStyle.productType !== singleStyle.productType) {
        return res.status(400).json({ error: 'Validation failed', message: 'Styl nie pasuje do productType' });
      }
      if (!targetStyle.active) {
        return res.status(400).json({ error: 'Validation failed', message: 'Styl jest nieaktywny' });
      }

      const map = cfg.singleStyle || {};
      if (singleStyle.enabled === false) {
        delete map[singleStyle.productHandle];
      } else {
        map[singleStyle.productHandle] = {
          defaultStyleSlug: singleStyle.defaultStyleSlug,
          productType: singleStyle.productType
        };
      }
      cfg.singleStyle = map;
      const saved = await writeConfig(cfg);
      return res.json({ success: true, config: saved });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('❌ [ADMIN-STYLES] Error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
};
