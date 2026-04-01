// api/admin/generate-social-image.js
// Krok 1: Nano Banana 2 (Replicate) → Segmind Nano Banana 2 (fallback)
//         fotorealistyczny "zamiennik" zdjęcia użytkownika (tylko płeć + wiek).
// Krok 2: /api/transform — styl + productType + prompt jak na stronie produktu
//         (public/customify.js: PRODUCT_FIELD_CONFIGS + getProductTypeFromStyle).
// Nie używamy prawdziwych zdjęć klientów.

const { put, list } = require('@vercel/blob');
const Replicate = require('replicate');
const {
  buildProductFieldPromptForHandle,
  autoSelectedStyleFromHandle
} = require('../../utils/buildProductFieldPromptServer');
const { getProductTypeFromPseudoUrl } = require('../../utils/getProductTypeFromPseudoUrl');

const ADMIN_TOKEN = process.env.ADMIN_STATS_TOKEN;
const SEGMIND_API_KEY = process.env.SEGMIND_API_KEY;
const BLOB_KEY_LOG = 'customify/system/stats/personalization-log.json';
const TRANSFORM_URL = 'https://customify-s56o.vercel.app/api/transform';

const getBlobToken = () => {
  const token = process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('Missing BLOB_READ_WRITE_TOKEN');
  return token;
};

// Tylko płeć (handle) + wiek wyłącznie z pola rocznica (liczba). Bez opisu/imienia.
function detectPhotorealSubject(productHandle, rocznica) {
  let gender = 'woman';
  if (/para|slubna|mlodej-pary|diamentowe-gody|wesola-para|podroznikow|rocznice-slubu|zakochana|staruszkow/i.test(productHandle || '')) {
    gender = 'couple';
  } else if (/dla-mezczyzny|dla-faceta|rolnik[^a]|kulturysta|wedkarz|pilkarz|policjant[^k]|szef[^o]|strazak|lekarz[^k]|kierowca|taty|dziadka|chlopaka|dla-niego/i.test(productHandle || '')) {
    gender = 'man';
  }

  let age = 40;
  if (rocznica != null && /^\d+$/.test(String(rocznica).trim())) {
    const n = parseInt(String(rocznica).trim(), 10);
    age = Math.min(95, Math.max(18, n));
  }

  return { gender, age };
}

function buildPhotorealisticPrompt({ gender, age }) {
  if (gender === 'couple') {
    return (
      `Photorealistic professional portrait photograph of a natural-looking ${age}-year-old married couple, ` +
      `husband and wife side by side, genuine subtle smiles, looking at the camera, ` +
      `soft diffused studio lighting, neutral blurred background, ` +
      `sharp focus on faces, full-frame DSLR quality, natural skin texture and pores, realistic hair, ` +
      `NOT a cartoon, NOT an illustration, NOT a caricature, NOT CGI, NOT plastic skin, NOT anime.`
    );
  }
  const w = gender === 'woman' ? 'woman' : 'man';
  return (
    `Photorealistic professional headshot portrait of a natural-looking ${age}-year-old ${w}, ` +
    `looking at the camera, shoulders and face visible, ` +
    `soft diffused studio lighting, neutral blurred background, ` +
    `sharp focus on eyes, full-frame DSLR quality, natural skin texture, realistic hair, ` +
    `NOT a cartoon, NOT an illustration, NOT a caricature, NOT CGI, NOT plastic skin, NOT anime.`
  );
}

const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label}: timeout ${ms / 1000}s`)), ms)
    )
  ]);

async function callReplicateNanoBanana2(prompt) {
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!REPLICATE_API_TOKEN) throw new Error('Missing REPLICATE_API_TOKEN');

  const replicate = new Replicate({ auth: REPLICATE_API_TOKEN });

  console.log('🍌 [SOCIAL] Krok 1: Replicate nano-banana-2 (fotoreal, bez obrazka wejściowego)...');
  const output = await withTimeout(
    replicate.run('google/nano-banana-2', {
      input: {
        prompt,
        image_input: [],
        aspect_ratio: '2:3',
        resolution: '1K',
        output_format: 'jpg'
      }
    }),
    180000,
    'Replicate nano-banana-2'
  );

  if (!output) throw new Error('Replicate nano-banana-2: no output');
  const imageUrl = typeof output === 'string' ? output : (Array.isArray(output) ? output[0] : null);
  if (!imageUrl) throw new Error('Replicate nano-banana-2: unexpected output format');
  return imageUrl;
}

async function callSegmindNanoBanana2(prompt) {
  if (!SEGMIND_API_KEY) throw new Error('Missing SEGMIND_API_KEY');

  console.log('🍌 [SOCIAL] Krok 1: Segmind nano-banana-2 (fallback)...');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  let response;
  try {
    response = await fetch('https://api.segmind.com/v1/nano-banana-2', {
      method: 'POST',
      headers: {
        'x-api-key': SEGMIND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        image_urls: [],
        aspect_ratio: '2:3',
        output_format: 'jpg',
        output_resolution: '1K',
        safety_tolerance: 6,
        thinking_level: 'minimal'
      }),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Segmind nano-banana-2: ${response.status} - ${errorText.substring(0, 300)}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const imageBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(imageBuffer).toString('base64');
  const mime = contentType.includes('png') ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${base64}`;
}

async function urlOrDataToBase64(imageSource) {
  if (imageSource.startsWith('data:')) {
    return imageSource.split(',')[1];
  }
  const imgRes = await fetch(imageSource);
  if (!imgRes.ok) throw new Error(`Failed to fetch step-1 image: ${imgRes.status}`);
  return Buffer.from(await imgRes.arrayBuffer()).toString('base64');
}

async function readLog() {
  try {
    const blobToken = getBlobToken();
    const result = await list({ prefix: 'customify/system/stats/personalization-log', token: blobToken });
    if (!result.blobs || result.blobs.length === 0) return [];
    const latest = result.blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
    const res = await fetch(latest.url);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function writeLog(entries) {
  const blobToken = getBlobToken();
  await put(BLOB_KEY_LOG, JSON.stringify(entries), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    token: blobToken
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { entryId, productHandle, rocznica, opis, imie, style: styleFromLog, token: bodyToken } = req.body || {};
  const token = req.query.token || req.headers['authorization']?.replace('Bearer ', '') || bodyToken;
  if (ADMIN_TOKEN && token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!entryId) return res.status(400).json({ error: 'Missing entryId' });

  const entry = { productHandle, rocznica, opis, imie };

  console.log(`🎨 [SOCIAL] Start entry ${entryId} (${productHandle})`);

  try {
    // ── Krok 1: fotorealistyczny „zamiennik” zdjęcia użytkownika
    const subject = detectPhotorealSubject(productHandle || '', rocznica);
    const prompt1 = buildPhotorealisticPrompt(subject);
    console.log(`👤 [SOCIAL] Krok 1: gender=${subject.gender}, age=${subject.age} (tylko z rocznica + handle)`);
    console.log(`📝 [SOCIAL] Prompt1: ${prompt1.substring(0, 160)}...`);

    let step1Source;
    try {
      step1Source = await callReplicateNanoBanana2(prompt1);
    } catch (e1) {
      console.warn(`⚠️ [SOCIAL] Replicate krok 1: ${e1.message} — Segmind`);
      step1Source = await callSegmindNanoBanana2(prompt1);
    }

    const imageDataBase64 = await urlOrDataToBase64(step1Source);

    // ── Krok 2: jak przeglądarka — auto-styl (ukryte UI) albo style z wpisu logu
    const autoStyle = autoSelectedStyleFromHandle(productHandle || '');
    const style =
      autoStyle || (styleFromLog && String(styleFromLog).trim()) || null;
    if (!style) {
      return res.status(400).json({
        error:
          'Brak stylu: dla tego produktu na sklepie trzeba wybrać styl (miniaturka). Wpis w logu nie ma pola `style` — wygeneruj najpierw z konta testowego albo dodaj styl ręcznie.'
      });
    }

    const productType = getProductTypeFromPseudoUrl(productHandle || '', style);
    const { prompt: storefrontPrompt, replaceBasePrompt } = buildProductFieldPromptForHandle(
      productHandle || '',
      entry
    );

    const personalizationFields = {};
    if (imie) personalizationFields.imiona = imie;
    if (rocznica) personalizationFields.rocznica = rocznica;
    if (opis) personalizationFields.opis_charakteru = opis;

    console.log(
      `🔄 [SOCIAL] Krok 2: transform style=${style} productType=${productType} customPrompt=${storefrontPrompt ? `${storefrontPrompt.length}ch` : '—'}`
    );

    const transformBody = {
      imageData: imageDataBase64,
      style,
      productType,
      productHandle: productHandle || null
    };
    if (storefrontPrompt) {
      transformBody.promptAddition = storefrontPrompt;
      transformBody.replaceBasePrompt = replaceBasePrompt;
    }
    if (Object.keys(personalizationFields).length > 0) {
      transformBody.personalizationFields = personalizationFields;
    }

    const tfRes = await fetch(TRANSFORM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Customify-Social-Internal': process.env.ADMIN_STATS_TOKEN || ''
      },
      body: JSON.stringify(transformBody)
    });

    const tfJson = await tfRes.json().catch(() => ({}));
    if (!tfRes.ok) {
      console.error('❌ [SOCIAL] transform failed:', tfRes.status, tfJson);
      return res.status(502).json({
        error: tfJson.error || tfJson.message || `Transform HTTP ${tfRes.status}`
      });
    }

    const socialImageUrl = tfJson.transformedImage || tfJson.vercelBlobUrl || tfJson.permanentImageUrl;
    if (!socialImageUrl) {
      return res.status(500).json({ error: 'Transform succeeded but no image URL in response' });
    }

    console.log(`✅ [SOCIAL] Final URL: ${socialImageUrl.substring(0, 80)}...`);

    try {
      const entries = await readLog();
      const idx = entries.findIndex(e => String(e.id) === String(entryId));
      if (idx !== -1) {
        entries[idx].socialImageUrl = socialImageUrl;
        await writeLog(entries);
      }
    } catch (logErr) {
      console.warn(`⚠️ [SOCIAL] Log update: ${logErr.message}`);
    }

    return res.status(200).json({ ok: true, socialImageUrl });
  } catch (err) {
    console.error('❌ [SOCIAL]', err.message);
    return res.status(500).json({ error: err.message });
  }
};
