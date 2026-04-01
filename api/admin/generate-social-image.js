// api/admin/generate-social-image.js
// Generuje obrazek social media dla wpisu z logu personalizacji.
// Używa Nano Banana (Replicate) → fallback Segmind Nano Banana 2.
// NIE używa prawdziwych zdjęć klientów — tylko prompt tekstowy z danych customizacji.

const { put, list } = require('@vercel/blob');
const Replicate = require('replicate');

const ADMIN_TOKEN = process.env.ADMIN_STATS_TOKEN;
const SEGMIND_API_KEY = process.env.SEGMIND_API_KEY;
const BLOB_KEY_LOG = 'customify/system/stats/personalization-log.json';

const getBlobToken = () => {
  const token = process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('Missing BLOB_READ_WRITE_TOKEN');
  return token;
};

// ─── Wykrywanie osoby z productHandle + pola rocznica ───────────────────────

function detectPerson(productHandle, rocznica) {
  let gender = 'woman';
  let age = 40;
  let occupation = '';

  // Płeć
  if (/para|slubna|mlodej-pary|diamentowe-gody|wesola-para|podroznikow|rocznice-slubu|zakochana|staruszkow/i.test(productHandle)) {
    gender = 'couple';
  } else if (/dla-mezczyzny|dla-faceta|rolnik[^a]|kulturysta|wedkarz|pilkarz|policjant[^k]|szef[^o]|strazak|lekarz[^k]|kierowca|taty|dziadka|chlopaka|dla-niego/i.test(productHandle)) {
    gender = 'man';
  }
  // Domyślnie kobieta (większość produktów to "dla niej")

  // Wiek — priorytet: pole rocznica (bezpośredni wiek), potem keyword z handle
  if (rocznica && /^\d+$/.test(String(rocznica).trim())) {
    age = parseInt(String(rocznica).trim(), 10);
  } else {
    const ageFromHandle = productHandle.match(/(\d+)-(?:urodzin|lat)/);
    if (ageFromHandle) {
      age = parseInt(ageFromHandle[1], 10);
    } else if (/60-rocznica|diamentowe-gody/i.test(productHandle)) {
      age = 80;
    } else if (/50-roczni|50-lecie/i.test(productHandle)) {
      age = 70;
    } else if (/40-roczni|40-lecie/i.test(productHandle)) {
      age = 60;
    } else if (/30-roczni|30-lecie/i.test(productHandle)) {
      age = 50;
    } else if (/25-roczni|25-lecie/i.test(productHandle)) {
      age = 45;
    } else if (/wesola-para|staruszkow/i.test(productHandle)) {
      age = 75;
    }
  }

  // Zawód / kontekst
  if (/lekark|lekarza/.test(productHandle)) occupation = 'doctor';
  else if (/policjantk/.test(productHandle)) occupation = 'police officer woman';
  else if (/policjant/.test(productHandle)) occupation = 'police officer';
  else if (/rolniczka/.test(productHandle)) occupation = 'farmer woman';
  else if (/rolnik/.test(productHandle)) occupation = 'farmer';
  else if (/kuchark/.test(productHandle)) occupation = 'chef, cook';
  else if (/fitness/.test(productHandle)) occupation = 'fitness trainer, athlete';
  else if (/szefow/.test(productHandle)) occupation = 'businesswoman, boss';
  else if (/szef/.test(productHandle)) occupation = 'businessman, boss';
  else if (/podrozniczk/.test(productHandle)) occupation = 'female traveler';
  else if (/podrozni/.test(productHandle)) occupation = 'traveler';
  else if (/wedkarz/.test(productHandle)) occupation = 'fisherman';
  else if (/pilkarz/.test(productHandle)) occupation = 'football player';
  else if (/strazak/.test(productHandle)) occupation = 'firefighter';
  else if (/kulturysta/.test(productHandle)) occupation = 'bodybuilder';
  else if (/psycholog/.test(productHandle)) occupation = 'psychologist';
  else if (/nauczyciel/.test(productHandle)) occupation = 'teacher';
  else if (/spa|manicure/.test(productHandle)) occupation = 'spa lover, beauty';
  else if (/aktywna|active/.test(productHandle)) occupation = 'active, sporty';

  return { gender, age, occupation };
}

// ─── Budowanie promptu dla Nano Banana ──────────────────────────────────────

function buildPrompt(person, opisPersony) {
  const { gender, age, occupation } = person;

  let subject;
  if (gender === 'couple') {
    const coupleDesc = age >= 70 ? `elderly ${age}-year-old` : age >= 50 ? `middle-aged ${age}-year-old` : `${age}-year-old`;
    subject = `a ${coupleDesc} happy married couple`;
  } else {
    const genderWord = gender === 'woman' ? 'woman' : 'man';
    subject = `a ${age}-year-old ${genderWord}`;
    if (occupation) subject += `, ${occupation}`;
  }

  const customTheme = opisPersony
    ? `. Theme and context: ${opisPersony}`
    : '';

  return (
    `Create a colorful caricature figurine illustration of ${subject}${customTheme}. ` +
    `The character should be fun, cartoon-like but expressive. ` +
    `Place the character standing on a small decorative podium. ` +
    `White or very light clean background. High quality, vibrant colors, clear composition. ` +
    `No text, no watermarks.`
  );
}

// ─── Nano Banana via Replicate ───────────────────────────────────────────────

async function callReplicateNanaBanana(prompt) {
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!REPLICATE_API_TOKEN) throw new Error('Missing REPLICATE_API_TOKEN');

  const replicate = new Replicate({ auth: REPLICATE_API_TOKEN });

  console.log('🍌 [SOCIAL] Calling Replicate nano-banana...');
  const output = await replicate.run('google/nano-banana', {
    input: {
      prompt,
      image_input: [],
      aspect_ratio: '2:3',
      output_format: 'jpg',
      guidance: 3.5
    }
  });

  if (!output) throw new Error('Replicate nano-banana: no output');
  // output jest URL-em
  const imageUrl = typeof output === 'string' ? output : (Array.isArray(output) ? output[0] : null);
  if (!imageUrl) throw new Error('Replicate nano-banana: unexpected output format');
  return imageUrl;
}

// ─── Nano Banana 2 via Segmind (fallback) ───────────────────────────────────

async function callSegmindNanaBanana2(prompt) {
  if (!SEGMIND_API_KEY) throw new Error('Missing SEGMIND_API_KEY');

  console.log('🍌 [SOCIAL] Calling Segmind nano-banana-2 (fallback)...');
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

// ─── Upload do Vercel Blob ───────────────────────────────────────────────────

async function uploadToBlob(imageSourceOrUrl, entryId) {
  const blobToken = getBlobToken();
  const blobPath = `customify/social-images/${entryId}.jpg`;

  let imageBuffer;
  if (imageSourceOrUrl.startsWith('data:')) {
    // base64 (z Segmind)
    const base64Data = imageSourceOrUrl.split(',')[1];
    imageBuffer = Buffer.from(base64Data, 'base64');
  } else {
    // URL (z Replicate)
    const imgRes = await fetch(imageSourceOrUrl);
    if (!imgRes.ok) throw new Error(`Failed to fetch image from Replicate: ${imgRes.status}`);
    imageBuffer = Buffer.from(await imgRes.arrayBuffer());
  }

  const { url } = await put(blobPath, imageBuffer, {
    access: 'public',
    contentType: 'image/jpeg',
    addRandomSuffix: false,
    allowOverwrite: true,
    token: blobToken
  });

  return url;
}

// ─── Odczyt/zapis logu ──────────────────────────────────────────────────────

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

// ─── Główny handler ──────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { entryId, productHandle, rocznica, opis, imie, token: bodyToken } = req.body || {};
  const token = req.query.token || req.headers['authorization']?.replace('Bearer ', '') || bodyToken;
  if (ADMIN_TOKEN && token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!entryId) return res.status(400).json({ error: 'Missing entryId' });

  console.log(`🎨 [SOCIAL] Generating social image for entry ${entryId} (${productHandle})`);

  try {
    // 1. Wykryj osobę
    const person = detectPerson(productHandle || '', rocznica || '');
    console.log(`👤 [SOCIAL] Detected person: gender=${person.gender}, age=${person.age}, occupation=${person.occupation}`);

    // 2. Zbuduj prompt
    const opisPersony = [opis, imie].filter(Boolean).join(', ');
    const prompt = buildPrompt(person, opisPersony);
    console.log(`📝 [SOCIAL] Prompt: ${prompt.substring(0, 200)}...`);

    // 3. Generuj obraz — Nano Banana (Replicate) → fallback Segmind
    let imageSource;
    try {
      imageSource = await callReplicateNanaBanana(prompt);
      console.log('✅ [SOCIAL] Replicate nano-banana succeeded');
    } catch (replicateErr) {
      console.warn(`⚠️ [SOCIAL] Replicate failed: ${replicateErr.message} — trying Segmind fallback`);
      imageSource = await callSegmindNanaBanana2(prompt);
      console.log('✅ [SOCIAL] Segmind nano-banana-2 fallback succeeded');
    }

    // 4. Uploaduj na Vercel Blob
    const socialImageUrl = await uploadToBlob(imageSource, entryId);
    console.log(`✅ [SOCIAL] Saved to Blob: ${socialImageUrl}`);

    // 5. Zaktualizuj wpis w logu (bezpośrednio przez Blob, żeby uniknąć self-call HTTP)
    try {
      const entries = await readLog();
      const idx = entries.findIndex(e => String(e.id) === String(entryId));
      if (idx !== -1) {
        entries[idx].socialImageUrl = socialImageUrl;
        await writeLog(entries);
        console.log(`✅ [SOCIAL] Log entry updated with socialImageUrl`);
      }
    } catch (logErr) {
      console.warn(`⚠️ [SOCIAL] Failed to update log entry: ${logErr.message}`);
    }

    return res.status(200).json({ ok: true, socialImageUrl });

  } catch (err) {
    console.error('❌ [SOCIAL] Generation failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
