// api/admin/generate-social-image.js
// Krok 1: Nano Banana 2 (Replicate) → Segmind Nano Banana 2 (fallback)
//         fotorealistyczny "zamiennik" zdjęcia użytkownika (tylko płeć + wiek).
// Krok 2: /api/transform — styl + productType + prompt jak na stronie produktu
//         (public/customify.js: PRODUCT_FIELD_CONFIGS + getProductTypeFromStyle).
// Nie używamy prawdziwych zdjęć klientów.
//
// Zakres social (wasze produkty): serie kobieta / mężczyzna / ślub — bez „dodaj osobę”.

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

/** Nieobsługiwane w panelu social — multi-upload, inny pipeline niż serie k/m/ślub */
const SOCIAL_EXCLUDED_PRODUCT_HANDLE = 'dodaj-osobe-do-zdjecia-naturalny-efekt-obraz-plakat-wydruk';

const getBlobToken = () => {
  const token = process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('Missing BLOB_READ_WRITE_TOKEN');
  return token;
};

// Krok 1 (fotoreal): płeć z handle + fallback z opisu (handle czesto ma formę „kierowcy” a nie „kierowca”).
// Wiek tylko z rocznica (liczba).
function detectPhotorealSubject(productHandle, rocznica, opis) {
  let gender = 'woman';
  const h = productHandle || '';
  if (/para|slubna|mlodej-pary|diamentowe-gody|wesola-para|podroznikow|rocznice-slubu|zakochana|staruszkow/i.test(h)) {
    gender = 'couple';
  } else if (
    /dla-mezczyzny|dla-faceta|dla-niego|dla-taty|dla-chlopaka|dla-dziadka|rolnik[^a]|kulturysta|wedkarz|pilkarz|policjant[^k]|szef[^o]|strazak|lekarz[^k]|kierowc|budowlanc|meza|mezczyzny|chlopaka|taty|dziadka/i.test(
      h
    )
  ) {
    // kierowc → „kierowca”, „kierowcy”, „kierowcow” w slugach
    gender = 'man';
  }

  if (gender !== 'couple' && opis && String(opis).trim()) {
    const t = String(opis).toLowerCase();
    if (
      /\b(kierowc|kierowca|kierowcy|ciężarów|ciezarow|tira\b|ciągnik|ciezarowka|ciężarówka|naczep|trasa\s|trucker|truck)\b/i.test(
        t
      ) ||
      /\b(mężczyzn|mezczyzn|facet|tata\b|dziadek|chlopak|chłopak|syna?\b|mąż|mez|dziad\b|pan\b)\b/i.test(t)
    ) {
      gender = 'man';
    }
    if (/\b(kobiet|pani\b|mama\b|babc|żona|zona|lekark|pielęgniark|kuchark)\b/i.test(t)) {
      gender = 'woman';
    }
  }

  let age = 40;
  if (rocznica != null && /^\d+$/.test(String(rocznica).trim())) {
    const n = parseInt(String(rocznica).trim(), 10);
    age = Math.min(95, Math.max(18, n));
  }

  return { gender, age };
}

/** Deterministyczny hash — ten sam wpis (id + pola) ≈ ta sama „postać”; różne wpisy = różne losowanie z puli. */
function variationSeedFromEntry(entryId, productHandle, rocznica, imie, opis) {
  const s = `${entryId}|${productHandle || ''}|${rocznica ?? ''}|${imie ?? ''}|${opis ?? ''}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickVariant(seed, index, list) {
  const x = Math.imul(seed + index * 2654435761, 1103515245) >>> 0;
  return list[x % list.length];
}

const VARIANT_WOMAN_HAIR = [
  'shoulder-length dark brown hair',
  'short blonde pixie cut',
  'long wavy black hair',
  'medium-length straight auburn hair',
  'natural curly brown hair',
  'silver-gray hair in a neat bob',
  'dark hair in a low ponytail',
  'fine light-brown hair tucked behind ears'
];

const VARIANT_MAN_HAIR = [
  'short dark hair, clean-shaven',
  'buzz cut, light stubble',
  'receding hairline, neat trim',
  'thick wavy hair, short beard',
  'salt-and-pepper short hair, no beard',
  'black hair, neatly trimmed mustache',
  'blond short crop, jawline stubble',
  'medium-length hair tied back, light beard'
];

const VARIANT_FACE = [
  'distinct oval face shape, memorable features',
  'softer round face, warm expression',
  'angular jaw, prominent cheekbones',
  'narrow face, slightly asymmetric smile',
  'wide-set eyes, subtle laugh lines',
  'strong brow, straight nose, individual look',
  'gentle features, slightly fuller face',
  'high cheekbones, defined chin — not a generic model face'
];

const VARIANT_COUPLE_A = [
  'two clearly different individuals, different face shapes',
  'husband and wife with distinct features — not matching faces',
  'visibly different bone structure between the two people'
];

function buildPhotorealisticPrompt({ gender, age, seed }) {
  const diversity =
    'IMPORTANT: this must be a UNIQUE anonymous person — not a generic stock photo or influencer look; avoid the same face as typical AI headshots. Individual bone structure and proportions. ';

  if (gender === 'couple') {
    const coupleNote = pickVariant(seed, 4, VARIANT_COUPLE_A);
    const hairA = pickVariant(seed, 1, VARIANT_MAN_HAIR);
    const hairB = pickVariant(seed, 2, VARIANT_WOMAN_HAIR);
    return (
      `Photorealistic professional portrait photograph of a natural-looking ${age}-year-old married couple, ` +
      `husband and wife side by side, genuine subtle smiles, looking at the camera. ` +
      `He: ${hairA}. She: ${hairB}. ${coupleNote}. ` +
      diversity +
      `soft diffused studio lighting, neutral blurred background, ` +
      `sharp focus on faces, full-frame DSLR quality, natural skin texture and pores, realistic hair, ` +
      `NOT a cartoon, NOT an illustration, NOT a caricature, NOT CGI, NOT plastic skin, NOT anime.`
    );
  }
  const w = gender === 'woman' ? 'woman' : 'man';
  const hairPool = gender === 'woman' ? VARIANT_WOMAN_HAIR : VARIANT_MAN_HAIR;
  const hair = pickVariant(seed, 1, hairPool);
  const face = pickVariant(seed, 3, VARIANT_FACE);
  return (
    `Photorealistic professional headshot portrait of a natural-looking ${age}-year-old ${w}, ` +
    `${hair}; ${face}. ` +
    diversity +
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
  if ((productHandle || '') === SOCIAL_EXCLUDED_PRODUCT_HANDLE) {
    return res.status(400).json({
      error:
        'Produkt „dodaj osobę” nie jest używany w socialu — tylko serie kobieta / mężczyzna / ślub.'
    });
  }

  const entry = { productHandle, rocznica, opis, imie };

  console.log(`🎨 [SOCIAL] Start entry ${entryId} (${productHandle})`);

  try {
    // ── Krok 1: fotorealistyczny „zamiennik” zdjęcia użytkownika
    const subject = detectPhotorealSubject(productHandle || '', rocznica, opis);
    const vSeed = variationSeedFromEntry(entryId, productHandle, rocznica, imie, opis);
    const prompt1 = buildPhotorealisticPrompt({ ...subject, seed: vSeed });
    console.log(
      `👤 [SOCIAL] Krok 1: gender=${subject.gender}, age=${subject.age}, variationSeed=${vSeed} (nano-banana — różne wpisy = różne cechy twarzy/włosów)`
    );
    console.log(`📝 [SOCIAL] Prompt1: ${prompt1.substring(0, 200)}...`);

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
