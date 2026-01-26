const { put, head } = require('@vercel/blob');

/**
 * Admin endpoint do zarządzania konfiguracją filtrów zdjęć (glfx.js)
 * GET - odczyt konfiguracji
 * POST - zapis konfiguracji
 */

const BLOB_PATH = 'config/filter-config.json';
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || process.env.customify_READ_WRITE_TOKEN;

// Domyślna konfiguracja (fallback)
const DEFAULT_CONFIG = {
  brighten: {
    brightness: 0.15,
    contrast: 0.1
  },
  vivid: {
    hue: 0,
    saturation: 0.2,
    vibrance: 0.2
  },
  sharpen: {
    radius: 50,
    strength: 1.5
  },
  warm: {
    hue: 0.05,
    saturation: 0.1,
    brightness: 0.05,
    contrast: 0.05
  },
  cool: {
    hue: -0.05,
    saturation: 0,
    brightness: 0,
    contrast: 0.1
  },
  bw: {
    saturation: -1,
    brightness: 0.05,
    contrast: 0.15
  },
  vintage: {
    sepia: 0.3,
    vignetteSize: 0.3,
    vignetteAmount: 0.7,
    brightness: -0.05,
    contrast: 0.1
  },
  dramatic: {
    brightness: -0.1,
    contrast: 0.4,
    vignetteSize: 0.4,
    vignetteAmount: 0.6
  }
};

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
      console.error('❌ [FILTER-CONFIG] Błąd odczytu z Blob:', err);
    }
  }
  return DEFAULT_CONFIG;
};

const writeConfig = async (config) => {
  if (!BLOB_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN nie jest ustawiony');
  }
  
  const json = JSON.stringify(config, null, 2);
  await put(BLOB_PATH, json, {
    token: BLOB_TOKEN,
    contentType: 'application/json',
    addRandomSuffix: false
  });
};

export default async function handler(req, res) {
  sendCors(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    // GET - odczyt konfiguracji (bez autoryzacji - publiczne)
    try {
      const config = await readConfig();
      return res.status(200).json(config);
    } catch (err) {
      console.error('❌ [FILTER-CONFIG] Błąd odczytu:', err);
      return res.status(500).json({ error: 'Błąd odczytu konfiguracji', fallback: DEFAULT_CONFIG });
    }
  }
  
  if (req.method === 'POST') {
    // POST - zapis konfiguracji (wymaga autoryzacji)
    if (!authGuard(req, res)) {
      return;
    }
    
    try {
      const newConfig = req.body;
      
      // Walidacja struktury
      if (!newConfig || typeof newConfig !== 'object') {
        return res.status(400).json({ error: 'Nieprawidłowa struktura konfiguracji' });
      }
      
      // Zapis
      await writeConfig(newConfig);
      
      console.log('✅ [FILTER-CONFIG] Konfiguracja zapisana');
      return res.status(200).json({ success: true, message: 'Konfiguracja zapisana' });
    } catch (err) {
      console.error('❌ [FILTER-CONFIG] Błąd zapisu:', err);
      return res.status(500).json({ error: 'Błąd zapisu konfiguracji' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
