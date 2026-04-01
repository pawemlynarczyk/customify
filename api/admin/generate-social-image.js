// api/admin/generate-social-image.js
// Krok 1: Nano Banana 2 (Replicate) → Segmind Nano Banana 2 (fallback)
//         fotorealistyczny "zamiennik" zdjęcia użytkownika (tylko płeć + wiek).
// Krok 2: /api/transform z konfiguracją wyliczaną z productHandle
//         (styl/model/prompt przez handle, nie przez sam label style=caricature-new).
// Nie używamy prawdziwych zdjęć klientów.

const { put, list } = require('@vercel/blob');
const Replicate = require('replicate');

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

function detectRoleFromHandle(productHandle = '') {
  const h = productHandle.toLowerCase();
  if (h.includes('kucharka')) return 'chef';
  if (h.includes('lekarka') || h.includes('lekarza')) return 'doctor';
  if (h.includes('policjantka') || h.includes('policjant')) return 'police officer';
  if (h.includes('rolniczka') || h.includes('rolnik')) return 'farmer';
  if (h.includes('fitness')) return 'fitness trainer';
  if (h.includes('szefowa') || h.includes('szefa')) return 'business owner';
  if (h.includes('podrozniczka') || h.includes('podroznik')) return 'traveler';
  if (h.includes('kulturysta')) return 'bodybuilder';
  if (h.includes('wedkarz')) return 'fisherman';
  if (h.includes('pilkarz')) return 'football player';
  if (h.includes('strazak')) return 'firefighter';
  if (h.includes('nauczyciel')) return 'teacher';
  return 'person';
}

function resolvePipelineFromProductHandle(productHandle = '', styleFromLog = null) {
  const h = String(productHandle || '').toLowerCase();

  // Trzymaj się ustawień API wynikających z handle (nie tylko z style label)
  if (h.includes('dodaj-osobe')) {
    return { style: 'dodaj-osobe', productType: 'dodaj_osobe', useHandlePrompt: false };
  }
  if (h.includes('gta')) {
    return { style: 'gta', productType: 'gta', useHandlePrompt: false };
  }

  // Produkty custom-fields (dla niej/dla faceta/rocznice) jadą na caricature-new,
  // ale prompt jest budowany z handle + pól (jak konfiguracja produktowa).
  if (
    h.includes('karykatura') ||
    h.includes('rocznice') ||
    h.includes('urodziny') ||
    h.includes('dla-niej') ||
    h.includes('dla-mezczyzny') ||
    h.includes('dla-faceta') ||
    h.includes('biznes-woman') ||
    h.includes('slub')
  ) {
    return { style: 'caricature-new', productType: 'caricature-new', useHandlePrompt: true };
  }

  // Fallback: użyj stylu z logu jeśli jest, inaczej caricature-new
  return {
    style: (styleFromLog && String(styleFromLog).trim()) || 'caricature-new',
    productType: 'caricature-new',
    useHandlePrompt: false
  };
}

function buildHandleBasedPrompt(productHandle, { imie, rocznica, opis }) {
  const h = String(productHandle || '').toLowerCase();
  const isCouple =
    h.includes('para') ||
    h.includes('slub') ||
    h.includes('rocznice') ||
    h.includes('diamentowe-gody') ||
    h.includes('wesola-para');
  const gender =
    h.includes('dla-mezczyzny') || h.includes('dla-faceta') || h.includes('chlopaka')
      ? 'man'
      : 'woman';
  const role = detectRoleFromHandle(h);
  const yearsText = rocznica ? `Years / anniversary number to include: "${rocznica}".` : '';
  const nameText = imie ? `Exact text (dedication / name): "${imie}".` : '';
  const themeText = opis ? `Theme details from buyer: ${opis}` : '';

  if (isCouple) {
    return [
      'Create a premium caricature figurine scene based on the provided photo.',
      'Keep both persons clearly recognizable and flattering.',
      'MANDATORY BASE: wedding-anniversary couple theme, elegant celebratory mood.',
      yearsText,
      nameText,
      themeText,
      'Show expressive big heads with smaller bodies (pleasant caricature proportions).',
      'Add coherent podium/props matching the theme.',
      'If no text is provided, do not invent names.',
      'High quality, clean composition.'
    ]
      .filter(Boolean)
      .join('\n');
  }

  const who = gender === 'man' ? 'a man' : 'a woman';
  return [
    'Create a premium caricature figurine scene based on the provided photo.',
    `Character: ${who} in profession/theme: ${role}.`,
    'Keep facial identity recognizable and flattering.',
    yearsText,
    nameText,
    themeText,
    'Show expressive big head with smaller body (pleasant caricature proportions).',
    'Add coherent podium/props matching the profession/theme.',
    'If no text is provided, do not invent names.',
    'High quality, clean composition.'
  ]
    .filter(Boolean)
    .join('\n');
}

async function callReplicateNanoBanana2(prompt) {
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!REPLICATE_API_TOKEN) throw new Error('Missing REPLICATE_API_TOKEN');

  const replicate = new Replicate({ auth: REPLICATE_API_TOKEN });

  console.log('🍌 [SOCIAL] Krok 1: Replicate nano-banana-2 (fotoreal, bez obrazka wejściowego)...');
  const output = await replicate.run('google/nano-banana-2', {
    input: {
      prompt,
      image_input: [],
      aspect_ratio: '2:3',
      resolution: '1K',
      output_format: 'jpg'
    }
  });

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

  // Domyślnie WYŁĄCZONE — każda generacja = 2× kosztowne API (Nano Banana + transform). Włącz świadomie w Vercel.
  if (process.env.ENABLE_SOCIAL_GENERATE !== 'true') {
    return res.status(403).json({
      error: 'Generacja social wyłączona. Ustaw ENABLE_SOCIAL_GENERATE=true w Vercel (świadomie — kosztuje Replicate/Segmind + transform).'
    });
  }

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

    // ── Krok 2: ten sam pipeline co u klienta
    const { style, productType, useHandlePrompt } = resolvePipelineFromProductHandle(productHandle, styleFromLog);
    const handlePrompt = buildHandleBasedPrompt(productHandle, entry);
    const personalizationFields = {};
    if (imie) personalizationFields.imiona = imie;
    if (rocznica) personalizationFields.rocznica = rocznica;
    if (opis) personalizationFields.opis_charakteru = opis;

    console.log(`🔄 [SOCIAL] Krok 2: transform style=${style} productType=${productType}`);

    const transformBody = {
      imageData: imageDataBase64,
      style,
      productType,
      productHandle: productHandle || null
    };
    if (useHandlePrompt) {
      // Dla produktów custom-fields: prompt wynikający z productHandle (nie z samego style label)
      transformBody.promptAddition = handlePrompt;
      transformBody.replaceBasePrompt = true;
    } else if (handlePrompt) {
      // Dla pozostałych: doklej kontekst z handle
      transformBody.promptAddition = handlePrompt;
      transformBody.replaceBasePrompt = false;
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
