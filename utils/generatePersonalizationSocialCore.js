// Wspólna logika social (Flux → transform) dla panelu admin i automatycznego uruchomienia po generacji użytkownika.
// Nie używamy prawdziwych zdjęć klientów — krok 1 to syntetyczny portret.

const Replicate = require('replicate');
const { put, head } = require('@vercel/blob');
const {
  buildProductFieldPromptForHandle,
  autoSelectedStyleFromHandle
} = require('./buildProductFieldPromptServer');
const { getProductTypeFromPseudoUrl } = require('./getProductTypeFromPseudoUrl');
const { inferPhotorealGenderFromImie } = require('./detectGenderFromImieDedykacja');

const BLOB_KEY_LOG = 'customify/system/stats/personalization-log.json';
const TRANSFORM_URL = 'https://customify-s56o.vercel.app/api/transform';
const FLUX_2_PRO_MODEL = 'black-forest-labs/flux-2-pro';

/** Ten sam handle co w api/admin/generate-social-image.js */
const SOCIAL_EXCLUDED_PRODUCT_HANDLE = 'dodaj-osobe-do-zdjecia-naturalny-efekt-obraz-plakat-wydruk';

let replicateClient = null;
function getReplicate() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token || token === 'leave_empty_for_now') return null;
  if (!replicateClient) {
    replicateClient = new Replicate({ auth: token });
  }
  return replicateClient;
}

const getBlobToken = () => {
  const token = process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('Missing BLOB_READ_WRITE_TOKEN');
  return token;
};

function ageFromRocznica(rocznica) {
  let age = 40;
  if (rocznica != null && /^\d+$/.test(String(rocznica).trim())) {
    const n = parseInt(String(rocznica).trim(), 10);
    age = Math.min(95, Math.max(18, n));
  }
  return age;
}

function detectPhotorealSubject(productHandle, rocznica, opis, imie) {
  const age = ageFromRocznica(rocznica);
  const fromImie = inferPhotorealGenderFromImie(imie);
  if (fromImie) {
    return { gender: fromImie, age, genderSource: 'imie' };
  }

  let gender = 'woman';
  const h = productHandle || '';
  if (/para|slubna|mlodej-pary|diamentowe-gody|wesola-para|podroznikow|rocznice-slubu|zakochana|staruszkow/i.test(h)) {
    gender = 'couple';
  } else if (
    /dla-mezczyzny|dla-faceta|dla-niego|dla-taty|dla-chlopaka|dla-dziadka|rolnik[^a]|kulturysta|wedkarz|pilkarz|policjant[^k]|szef[^o]|strazak|lekarz[^k]|kierowc|budowlanc|meza|mezczyzny|chlopaka|taty|dziadka/i.test(
      h
    )
  ) {
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

  return { gender, age, genderSource: 'handle_opis' };
}

function buildSocialStep1FluxPrompt({ gender, age }) {
  const suffix =
    'Photorealistic photo, neutral background, facing camera. Not cartoon, illustration, caricature, CGI, or anime.';

  if (gender === 'couple') {
    return `social media portrait of an east european married couple, man and woman, natural-looking adults about ${age} years old, average, ${suffix}`;
  }
  const role = gender === 'woman' ? 'woman' : 'man';
  return `social media portrait of a ${age}-year-old east european ${role} average, ${suffix}`;
}

async function callReplicateFlux2ProStep1(prompt) {
  const replicate = getReplicate();
  if (!replicate) {
    throw new Error('Missing REPLICATE_API_TOKEN — wymagany do kroku 1 (flux-2-pro)');
  }

  const seed = Math.floor(Math.random() * 2147483646) + 1;
  const input = {
    prompt,
    input_images: [],
    aspect_ratio: '2:3',
    resolution: '1 MP',
    output_format: 'jpg',
    output_quality: 80,
    safety_tolerance: 2,
    seed
  };

  console.log(`⚡ [SOCIAL-CORE] Krok 1: Replicate ${FLUX_2_PRO_MODEL} aspect=2:3 res=1MP seed=${seed}`);

  const timeoutMs = 240000;
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Replicate flux-2-pro timeout (240s)')), timeoutMs);
  });

  const runPromise = replicate.run(FLUX_2_PRO_MODEL, { input });
  const output = await Promise.race([runPromise, timeoutPromise]);

  let imageUrl;
  if (Array.isArray(output)) {
    imageUrl = output[0];
  } else if (typeof output === 'string') {
    imageUrl = output;
  } else if (output && output.url) {
    imageUrl = typeof output.url === 'function' ? output.url() : output.url;
  }
  if (!imageUrl || typeof imageUrl !== 'string') {
    throw new Error(`Replicate flux-2-pro: nieoczekiwany format output: ${typeof output}`);
  }

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Replicate flux-2-pro: pobranie obrazu ${imgRes.status}`);
  const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
  const base64 = Buffer.from(await imgRes.arrayBuffer()).toString('base64');
  let mime = 'image/jpeg';
  if (contentType.includes('png')) mime = 'image/png';
  else if (contentType.includes('webp')) mime = 'image/webp';
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
    const meta = await head(BLOB_KEY_LOG, { token: blobToken }).catch(() => null);
    if (!meta || !meta.url) return [];
    const res = await fetch(meta.url);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
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

function isPersonalizationSocialExcludedProductHandle(handle) {
  return (handle || '') === SOCIAL_EXCLUDED_PRODUCT_HANDLE;
}

/**
 * Pełny pipeline social + zapis socialImageUrl w personalization-log.json.
 * @returns {Promise<string>} URL obrazka social (Vercel Blob)
 */
async function generatePersonalizationSocialCore({
  entryId,
  productHandle,
  rocznica,
  opis,
  imie,
  style: styleFromLog
}) {
  if (!entryId) throw new Error('Missing entryId');
  if (isPersonalizationSocialExcludedProductHandle(productHandle)) {
    throw new Error('Produkt wyłączony z socialu (dodaj osobę)');
  }

  const entry = { productHandle, rocznica, opis, imie };

  console.log(`🎨 [SOCIAL-CORE] Start entry ${entryId} (${productHandle})`);

  const subject = detectPhotorealSubject(productHandle || '', rocznica, opis, imie);
  const prompt1 = buildSocialStep1FluxPrompt(subject);
  console.log(
    `👤 [SOCIAL-CORE] Krok 1 (flux-2-pro): gender=${subject.gender}, age=${subject.age}, źródło=${subject.genderSource}`
  );

  const step1Source = await callReplicateFlux2ProStep1(prompt1);
  const imageDataBase64 = await urlOrDataToBase64(step1Source);

  const autoStyle = autoSelectedStyleFromHandle(productHandle || '');
  const style = autoStyle || (styleFromLog && String(styleFromLog).trim()) || null;
  if (!style) {
    throw new Error(
      'Brak stylu dla socialu: produkt wymaga stylu (miniaturka) — wpis bez `style` i brak auto-stylu z handle.'
    );
  }

  const productType = getProductTypeFromPseudoUrl(productHandle || '', style);
  const { prompt: storefrontPrompt, replaceBasePrompt } = buildProductFieldPromptForHandle(productHandle || '', entry);

  const personalizationFields = {};
  if (imie) personalizationFields.imiona = imie;
  if (rocznica) personalizationFields.rocznica = rocznica;
  if (opis) personalizationFields.opis_charakteru = opis;

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
    console.error('❌ [SOCIAL-CORE] transform failed:', tfRes.status, tfJson);
    throw new Error(tfJson.error || tfJson.message || `Transform HTTP ${tfRes.status}`);
  }

  const socialImageUrl = tfJson.transformedImage || tfJson.vercelBlobUrl || tfJson.permanentImageUrl;
  if (!socialImageUrl) {
    throw new Error('Transform succeeded but no image URL in response');
  }

  console.log(`✅ [SOCIAL-CORE] Final URL: ${socialImageUrl.substring(0, 80)}...`);

  const entries = await readLog();
  const idx = entries.findIndex(e => String(e.id) === String(entryId));
  if (idx !== -1) {
    entries[idx].socialImageUrl = socialImageUrl;
    await writeLog(entries);
  } else {
    console.warn(`⚠️ [SOCIAL-CORE] Brak wpisu ${entryId} w logu — URL nie zapisany w JSON`);
  }

  return socialImageUrl;
}

module.exports = {
  generatePersonalizationSocialCore,
  isPersonalizationSocialExcludedProductHandle,
  SOCIAL_EXCLUDED_PRODUCT_HANDLE
};
