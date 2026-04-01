/**
 * Buduje prompt personalizacji jak collectCustomFieldsPrompt() w public/customify.js,
 * ale z wartości z logu (imie / rocznica / opis) zamiast DOM.
 * Konfiguracja PRODUCT_FIELD_CONFIGS wczytywana z public/customify.js (VM) — jedno źródło szablonów.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let _ctx;
function getProductFieldCtx() {
  if (_ctx) return _ctx;
  const fullPath = path.join(__dirname, '../public/customify.js');
  const src = fs.readFileSync(fullPath, 'utf8');
  const endMarker = '\n\n// 🏷️ Rozbudowane nazwy rodzajów wydruku';
  const endIdx = src.indexOf(endMarker);
  if (endIdx === -1) throw new Error('customify.js: brak markera końca bloku PRODUCT_FIELD_CONFIGS');
  const startIdx = src.indexOf('const PRODUCT_FIELD_CONFIGS');
  if (startIdx === -1) throw new Error('customify.js: brak PRODUCT_FIELD_CONFIGS');
  const prelude = src.slice(startIdx, endIdx);
  const wrapped = `(function () {\n${prelude}\nreturn {\n  PRODUCT_FIELD_CONFIGS,\n  DLA_NIEJ_WITH_YEARS,\n  COUPLE_ANNIVERSARY_FIELD_HANDLES,\n  DIAMENTOWE_GODY_PRODUCT_HANDLE,\n  COUPLE_CUSTOM_YEAR_FIELD_HANDLES,\n  COUPLE_DEFAULT_40_YEAR_FIELD_HANDLES,\n  COUPLE_DEFAULT_50_YEAR_FIELD_HANDLES,\n  COUPLE_NO_DEFAULT_YEAR_FIELD_HANDLES,\n  PERSONALIZATION_PREPEND_BASE_HANDLES,\n  DEFAULT_PERSONALIZATION_PER_PRODUCT,\n  WIESELI_STARUSZKOWIE_PRODUCT_HANDLE,\n  PODROZNICY_PARA_PRODUCT_HANDLE,\n  MLODA_PARA_SLUB_PRODUCT_HANDLE,\n  ROCZNICA_SLUBU_PARA_PRODUCT_HANDLE,\n  ROCZNICA_50_SLUBU_PRODUCT_HANDLE,\n  ROCZNICA_40_SLUBU_PRODUCT_HANDLE\n};\n})()`;
  const script = new vm.Script(wrapped, { filename: 'productFieldConfigSlice.js' });
  _ctx = script.runInNewContext(Object.freeze({}));
  return _ctx;
}

/** Mapowanie wpisu z personalization-log → wartości pól jak w formularzu (field.id) */
function mapLogToFieldValues(handle, log, config, ctx) {
  const imie = (log.imie || '').trim();
  const rocznica = log.rocznica != null ? String(log.rocznica).trim() : '';
  const opis = (log.opis || '').trim();
  const values = {};
  for (const field of config.fields || []) {
    const pk = field.promptKey || '';
    let value = '';
    if (pk === 'personalization' || pk === 'CHARACTER_DESC') value = opis;
    else if (pk === 'SCENE_DESC') value = opis;
    else if (pk === 'YEARS') value = rocznica;
    else if (pk === 'SCENE_TYPE') value = rocznica;
    else if (pk === 'name' || pk === 'NAMES' || pk === 'NAMES_FIRST' || pk === 'NAMES_SECOND') value = imie;
    else if (pk === 'DEDICATION') value = imie;
    else if (pk === 'BANNER_TEXT' || pk === 'GTA_TEXT') value = imie;
    else if (field.id === 'imiona' || field.id === 'imie') value = imie;
    else if (field.id === 'rocznica') value = rocznica;
    else if (field.id === 'opis_charakteru') value = opis;
    values[field.id] = value;
  }
  return values;
}

/**
 * Ten sam łańcuch co w customify.js collectCustomFieldsPrompt (gałąź promptTemplate).
 * handle = product handle; valuesByFieldId = wartości per field.id
 */
function buildPromptFromTemplate(handle, config, valuesByFieldId, ctx) {
  const h = handle || '';
  const {
    DLA_NIEJ_WITH_YEARS,
    COUPLE_ANNIVERSARY_FIELD_HANDLES,
    DIAMENTOWE_GODY_PRODUCT_HANDLE,
    COUPLE_CUSTOM_YEAR_FIELD_HANDLES,
    COUPLE_DEFAULT_40_YEAR_FIELD_HANDLES,
    COUPLE_DEFAULT_50_YEAR_FIELD_HANDLES,
    COUPLE_NO_DEFAULT_YEAR_FIELD_HANDLES,
    PERSONALIZATION_PREPEND_BASE_HANDLES,
    DEFAULT_PERSONALIZATION_PER_PRODUCT
  } = ctx;

  const replacements = {};
  (config.fields || []).forEach(field => {
    if (!field.promptKey) return;
    let value = valuesByFieldId[field.id] != null ? String(valuesByFieldId[field.id]).trim() : '';
    if (field.promptKey === 'SCENE_TYPE' && !value) value = 'anniversary';
    if (field.promptKey === 'CHARACTER_DESC' && !value) value = 'Elegant, romantic, celebratory mood.';
    if (field.promptKey === 'personalization') {
      if (h && PERSONALIZATION_PREPEND_BASE_HANDLES.has(h)) {
        const base =
          DEFAULT_PERSONALIZATION_PER_PRODUCT[h] ||
          (h === DIAMENTOWE_GODY_PRODUCT_HANDLE
            ? 'Elegancka grafika napisem \u201eDiamentowe Gody\u201d'
            : 'Weseli staruszkowie');
        value = value ? `${base}, ${value}` : base;
      } else if (!value) {
        value = (h && DEFAULT_PERSONALIZATION_PER_PRODUCT[h]) || 'elegant, versatile person';
      }
    }
    replacements[field.promptKey] = value;
  });

  const tmpl = config.promptTemplate;
  if (tmpl.includes('{DIAMENTOWE_CUSTOMIZATION_SECTION}')) {
    if (h === DIAMENTOWE_GODY_PRODUCT_HANDLE) {
      const raw = (replacements.personalization || '').trim();
      const userLine = raw
        ? `OPTIONAL BUYER HINTS (accents ONLY — do NOT change genre or replace „Diamentowe Gody”):\n"${raw}"\nInterpret loosely: extra props, ribbon color, warmth of lighting, metallic balance. Example: if they write „złoto” or „gold”, add richer gold highlights, frames, or warm rim light while keeping platinum/silver diamond-jubilee base and mandatory „Diamentowe Gody” headline. Never turn the image into a different theme.`
        : 'No extra buyer hints — use rich default diamond-jubilee („Diamentowe Gody”) atmosphere.';
      replacements.DIAMENTOWE_CUSTOMIZATION_SECTION = `THEME ANCHOR (highest priority after likeness + headline):\nPolish diamond wedding anniversary — „Diamentowe Gody”, jubileusz diamentowy, 60 lat małżeństwa. Visual language: elegant, ceremonial, silver/platinum/crystal, subtle diamond sparkle, champagne celebration.\n\n${userLine}`;
    } else {
      replacements.DIAMENTOWE_CUSTOMIZATION_SECTION = '';
    }
  }

  if (tmpl.includes('{NAMES_SECTION}')) {
    const namesVal = replacements.NAMES || '';
    replacements.NAMES_SECTION = namesVal.trim()
      ? `Render this EXACT text on a golden plaque at the base:\n"${namesVal.trim()}"\nCRITICAL for names: use exact Polish characters — ą, ć, ę, ł, ń, ó, ś, ź, ż (uppercase: Ą, Ć, Ę, Ł, Ń, Ó, Ś, Ź, Ż). Do NOT replace with a, c, e, l, n, o, s, z. Copy every letter exactly as provided. Do NOT show reflections of the text on any surface. Text appears only on the plaque.`
      : 'Do NOT add any text, plaque, inscription, or written text to the image. No names, no letters, no words. The image must be completely free of any text.';
  }

  if (tmpl.includes('{YEARS_SECTION}')) {
    const isDlaNiejWithYears = h && DLA_NIEJ_WITH_YEARS.includes(h);
    const isSzefProduct = h === 'obraz-ze-zdjecia-karykatura-szefa';
    const isCoupleAnniversary = h && COUPLE_ANNIVERSARY_FIELD_HANDLES.includes(h);
    const isCoupleCustomYear = h && COUPLE_CUSTOM_YEAR_FIELD_HANDLES.includes(h);
    const isCoupleDefault40Year = h && COUPLE_DEFAULT_40_YEAR_FIELD_HANDLES.includes(h);
    const isCoupleDefault50Year = h && COUPLE_DEFAULT_50_YEAR_FIELD_HANDLES.includes(h);
    const isCoupleNoDefaultYear = h && COUPLE_NO_DEFAULT_YEAR_FIELD_HANDLES.includes(h);
    const rawYearsVal = (replacements.YEARS || '').trim();
    const yearsVal = isCoupleAnniversary
      ? '60'
      : isCoupleCustomYear
        ? rawYearsVal || (isCoupleNoDefaultYear ? '' : isCoupleDefault50Year ? '50' : isCoupleDefault40Year ? '40' : '60')
        : rawYearsVal;
    if (isSzefProduct) {
      replacements.YEARS_SECTION = yearsVal.trim()
        ? `The character is sitting on or near a large elegant 3D number "${yearsVal.trim()}" placed ON THE DESK — elegant glass-gold style, glossy, luxury finish. The number is a solid freestanding 3D sculpture object standing on the desk surface.`
        : '';
    } else if (yearsVal.trim()) {
      if (isCoupleAnniversary) {
        replacements.YEARS_SECTION =
          `The couple is posed with a large, elegant 3D metallic anniversary numeral "60" (sixty — Diamentowe Gody) integrated into the „Diamentowe Gody” composition — platinum, silver, subtle diamond sparkle; materials must feel luxe and ceremonial (not generic birthday). The numeral must read as 60, never a different anniversary number.`;
      } else if (isCoupleCustomYear) {
        const y = yearsVal.trim();
        const defaultYearText = isCoupleNoDefaultYear
          ? 'no default number when the field is empty'
          : `default "${isCoupleDefault50Year ? '50' : isCoupleDefault40Year ? '40' : '60'}"`;
        replacements.YEARS_SECTION =
          `ANNIVERSARY NUMERAL (buyer-controlled):\n• Show a large, elegant 3D celebratory numeral that reads exactly: "${y}".\n• The couple is posed with or integrated with this numeral; style, materials and colors must harmonize with CUSTOMIZATION.\n• CRITICAL: if the buyer enters a number in the form, use that exact value. If the field is empty, ${defaultYearText}. Never invent a different jubilee number.`;
      } else {
        replacements.YEARS_SECTION = isDlaNiejWithYears
          ? `The character is sitting/standing on or near a large 3D number "${yearsVal.trim()}" — the number's style, color and materials must match the character's profession/hobby theme (e.g. medical blue for nurse, police colors for officer, warm tones for chef). Do NOT use generic metallic gold — adapt to the scene.`
          : `The woman is sitting on a large metallic gold 3D number "${yearsVal.trim()}" on a business party podium.`;
      }
    } else if (isCoupleAnniversary) {
      replacements.YEARS_SECTION =
        'The couple is posed with a large elegant metallic "60" as specified for Diamentowe Gody (this branch should not occur — 60 is fixed).';
    } else if (isCoupleCustomYear) {
      replacements.YEARS_SECTION = isCoupleNoDefaultYear
        ? 'Do not show any large anniversary numeral when the number field is empty. Keep the couple on a themed podium without a standalone year number.'
        : `Show a large elegant metallic "${isCoupleDefault50Year ? '50' : isCoupleDefault40Year ? '40' : '60'}" as the default jubilee numeral when the number field is empty.`;
    } else {
      replacements.YEARS_SECTION = isDlaNiejWithYears
        ? 'The character stands on a podium.'
        : 'The woman is sitting elegantly on a business party podium.';
    }
  }

  if (tmpl.includes('{NAME_SECTION}')) {
    const nameVal = replacements.name || '';
    const isSuperheroBoy = h === 'portret-ze-zdjecia-superbohater-prezent-dla-chlopca';
    const isDiamentoweGodyPara = h === DIAMENTOWE_GODY_PRODUCT_HANDLE;
    const isSzefProduct = h === 'obraz-ze-zdjecia-karykatura-szefa';
    replacements.NAME_SECTION = nameVal.trim()
      ? isSuperheroBoy
        ? `Add large bold cinematic title text at the bottom of the image, in the style of superhero movie posters (dramatic, heroic font, bold outlines, high contrast). The text must read exactly: "${nameVal.trim()}". CRITICAL: use exact Polish characters — ą, ć, ę, ł, ń, ó, ś, ź, ż (uppercase: Ą, Ć, Ę, Ł, Ń, Ó, Ś, Ź, Ż). Do NOT replace letters. The text should feel like a movie title from a superhero film.`
        : isDiamentoweGodyPara
          ? `Additionally (below or under the main „Diamentowe Gody" headline), render this EXACT text on a slim elegant silver or gold plaque or subtitle line:\n"${nameVal.trim()}"\nCRITICAL: use exact Polish characters — ą, ć, ę, ł, ń, ó, ś, ź, ż (uppercase: Ą, Ć, Ę, Ł, Ń, Ó, Ś, Ź, Ż). Do NOT replace letters. Do NOT remove or replace the „Diamentowe Gody" headline.`
          : isSzefProduct
            ? `Render EXACTLY this text on a small plaque ON THE DESK (among papers, next to phone):\n"${nameVal.trim()}"\nCRITICAL: Use a CLEAN, SIMPLE, readable font. Copy each letter exactly — ą, ć, ę, ł, ń, ó, ś, ź, ż (Ą, Ć, Ę, Ł, Ń, Ó, Ś, Ź, Ż). Do NOT use decorative fonts. Do NOT add or change any letters.`
            : `Render this EXACT text on a plaque at the base:\n"${nameVal.trim()}"\nCRITICAL for names: use exact Polish characters — ą, ć, ę, ł, ń, ó, ś, ź, ż (uppercase: Ą, Ć, Ę, Ł, Ń, Ó, Ś, Ź, Ż). Do NOT replace letters.`
      : isDiamentoweGodyPara
        ? 'Do NOT add any name plaque or extra written line beyond the mandatory „Diamentowe Gody" headline (and optional year styling from POSE). No other text.'
        : 'Do NOT add any text, plaque, inscription, or written text to the image. No names, no letters, no words. The image must be completely free of any text.';
  }

  if (tmpl.includes('{SCENE_DESC_SECTION}')) {
    const sceneVal = replacements.SCENE_DESC || '';
    replacements.SCENE_DESC_SECTION = sceneVal.trim()
      ? `SCENE CONTEXT: The setting and mood of the photo should reflect: ${sceneVal.trim()}. Adapt the environment, clothing style, lighting and background to match this context naturally.`
      : 'SCENE CONTEXT: Warm, cozy family-style portrait. The mood should feel like a cherished family photo meant to hang on a wall — intimate, heartfelt, with soft warm lighting and a natural, homey background.';
  }

  if (tmpl.includes('{DEDICATION_SECTION}')) {
    const dedVal = replacements.DEDICATION || '';
    replacements.DEDICATION_SECTION = dedVal.trim()
      ? `TEXT / DEDICATION:\nAt the bottom of the image, add a beautiful, decorative text inscription that fits the overall composition and color palette. The text reads:\n"${dedVal.trim()}"\nThe font style should be elegant and harmonious with the scene. CRITICAL: use exact Polish characters — ą, ć, ę, ł, ń, ó, ś, ź, ż (uppercase: Ą, Ć, Ę, Ł, Ń, Ó, Ś, Ź, Ż). Do NOT replace with a, c, e, l, n, o, s, z. Copy every letter exactly as provided.`
      : 'Do NOT add any text, inscription, caption, watermark, or written words to the image. The image must be completely free of any text.';
  }

  if (tmpl.includes('{BANNER_SECTION}')) {
    const bannerVal = replacements.BANNER_TEXT || '';
    const isRoyalLove = h === 'portret-zakochana-para-krolewska-prezent-na-walentynki-personalizowany';
    const bannerPlace = isRoyalLove ? 'placed at the bottom of the composition' : 'placed at the top of the composition';
    replacements.BANNER_SECTION = bannerVal.trim()
      ? `Add a classic ribbon/ornamental banner that says "${bannerVal.trim()}" ${bannerPlace}. CRITICAL for the banner text: use exact Polish characters — ą, ć, ę, ł, ń, ó, ś, ź, ż (uppercase: Ą, Ć, Ę, Ł, Ń, Ó, Ś, Ź, Ż). Do NOT replace with a, c, e, l, n, o, s, z. Copy every letter exactly as provided.`
      : 'Do NOT add any banner, ribbon, text, inscription, or written words to the image. No banner, no text at all. The image must be completely free of any banner or written text.';
  }

  if (tmpl.includes('{GTA_TEXT_SECTION}')) {
    const gtaVal = replacements.GTA_TEXT || '';
    replacements.GTA_TEXT_SECTION = gtaVal.trim()
      ? `At the bottom of the image, add the following text in bold GTA-style comic-book font, matching the vibrant game cover aesthetic with thick outlines and high contrast: "${gtaVal.trim()}". CRITICAL: use exact Polish characters — ą, ć, ę, ł, ń, ó, ś, ź, ż (uppercase: Ą, Ć, Ę, Ł, Ń, Ó, Ś, Ź, Ż). Do NOT replace with a, c, e, l, n, o, s, z. Copy every letter exactly as provided. Keep the GTA visual style throughout.`
      : 'Do NOT add any text, caption, or written words to the image. No text at all. The image must be completely free of any text.';
  }

  let prompt = tmpl;
  Object.keys(replacements).forEach(key => {
    prompt = prompt.replaceAll(`{${key}}`, replacements[key]);
  });
  return prompt.trim() || null;
}

function buildPhrasePrompt(config, valuesByFieldId) {
  const phrases = [];
  (config.fields || []).forEach(field => {
    const value = valuesByFieldId[field.id] != null ? String(valuesByFieldId[field.id]).trim() : '';
    if (value && field.promptPhrase) {
      phrases.push(field.promptPhrase.replaceAll('{{value}}', value));
    }
  });
  if (phrases.length === 0) return null;
  return phrases.join(' ');
}

/**
 * Zwraca { prompt, replaceBasePrompt } albo { prompt: null } gdy brak konfiguracji jak na stronie produktu.
 */
function buildProductFieldPromptForHandle(productHandle, log) {
  const ctx = getProductFieldCtx();
  const handle = productHandle || '';
  const config = ctx.PRODUCT_FIELD_CONFIGS[handle];
  if (!config || !config.fields || config.fields.length === 0) {
    return { prompt: null, replaceBasePrompt: false };
  }
  const valuesByFieldId = mapLogToFieldValues(handle, log, config, ctx);
  if (config.promptTemplate) {
    const prompt = buildPromptFromTemplate(handle, config, valuesByFieldId, ctx);
    return { prompt, replaceBasePrompt: true };
  }
  const phrasePrompt = buildPhrasePrompt(config, valuesByFieldId);
  return { prompt: phrasePrompt, replaceBasePrompt: !!phrasePrompt };
}

function hasProductFieldConfig(productHandle) {
  const ctx = getProductFieldCtx();
  const c = ctx.PRODUCT_FIELD_CONFIGS[productHandle || ''];
  return !!(c && c.fields && c.fields.length);
}

/** Auto-styl jak showStyles() przy pierwszym uploadzie (ukryte style) */
function autoSelectedStyleFromHandle(productHandle) {
  const h = productHandle || '';
  if (h === 'dodaj-osobe-do-zdjecia-naturalny-efekt-obraz-plakat-wydruk') return 'dodaj-osobe';
  const ctx = getProductFieldCtx();
  const isDlaNiej = (() => {
    const {
      DIAMENTOWE_GODY_PRODUCT_HANDLE,
      WIESELI_STARUSZKOWIE_PRODUCT_HANDLE,
      PODROZNICY_PARA_PRODUCT_HANDLE,
      MLODA_PARA_SLUB_PRODUCT_HANDLE,
      ROCZNICA_SLUBU_PARA_PRODUCT_HANDLE,
      ROCZNICA_50_SLUBU_PRODUCT_HANDLE,
      ROCZNICA_40_SLUBU_PRODUCT_HANDLE
    } = ctx;
    return (
      h === 'obraz-ze-zdjecia-karykatura-dla-niej-zainteresowania' ||
      h === 'obraz-ze-zdjecia-karykatura-dla-niej-policjantka' ||
      h === 'obraz-ze-zdjecia-karykatura-dla-niej-rolniczka' ||
      h === 'obraz-ze-zdjecia-karykatura-dla-niej-lekarka' ||
      h === 'obraz-ze-zdjecia-karykatura-dla-niej-podrozniczka' ||
      h === 'obraz-ze-zdjecia-karykatura-dla-niej-psycholog' ||
      h === 'obraz-ze-zdjecia-karykatura-dla-niej-kucharka' ||
      h === 'obraz-ze-zdjecia-karykatura-dla-niej-fitness' ||
      h === 'obraz-ze-zdjecia-karykatura-dla-niej-szefowa' ||
      h === 'karykatura-rolnik-ze-zdjecia-personalizowany-prezent-dla-mezczyzny' ||
      h === 'kulturysta-karykatura-ze-zdjecia-prezent-dla-mezczyzny' ||
      h === 'karykatura-wedkarz-portret-ze-zdjecia-personalizowany-prezent-dla-faceta' ||
      h === 'karykatura-pilkarza-ze-zdjecia-personalizowany-obraz-dla-chlopaka-dziadka-taty' ||
      h === 'obraz-ze-zdjecia-karykatura-policjant-prezent-dla-faceta' ||
      h === 'obraz-ze-zdjecia-karykatura-szefa' ||
      h === DIAMENTOWE_GODY_PRODUCT_HANDLE ||
      h === WIESELI_STARUSZKOWIE_PRODUCT_HANDLE ||
      h === PODROZNICY_PARA_PRODUCT_HANDLE ||
      h === MLODA_PARA_SLUB_PRODUCT_HANDLE ||
      h === ROCZNICA_SLUBU_PARA_PRODUCT_HANDLE ||
      h === ROCZNICA_50_SLUBU_PRODUCT_HANDLE ||
      h === ROCZNICA_40_SLUBU_PRODUCT_HANDLE ||
      h === 'fotoobraz-strazaka-ze-zdjecia-prezent-na-35-urodziny-dla-meza' ||
      h === 'portret-ze-zdjecia-dla-lekarza-personalizowany-plakat-na-urodziny-dla-chlopaka' ||
      h === 'prezent-ze-zdjecia-dla-budowlanca-personalizowany-obraz-dla-taty' ||
      h === 'prezent-z-wlasnym-zdjeciem-dla-kierowcy-tira-personalizowany-obraz' ||
      h === 'obraz-ze-zdjecia-prezent-dla-chlopca-pilkarz' ||
      h === 'active-woman-portret-ze-zdjecia-na-rocznice-dla-kolezanki-kobiety-druk-na-szkle' ||
      h === 'active-woman-portret-ze-zdjecia-na-18-urodziny-dla-dziewczyny-druk-na-szkle-copy' ||
      h === 'portret-ze-zdjecia-prezent-na-urodziny-dla-kolezanki-szefowej-salon-spa' ||
      h === 'portret-na-18-urodziny-dla-dziewczyny-magic-z-wlasnego-zdjecia-druk-na-szkle' ||
      h === 'obraz-ze-zdjecia-prezent-na-40-urodziny-dla-kobiety-czerwony-dywan' ||
      h === 'portret-ze-zdjecia-na-30-rocznice-dla-nauczycielki-karykatura-na-prezent' ||
      h === 'obraz-ze-zdjecia-biznes-woman-personalizowany-prezent' ||
      h === 'obraz-ze-zdjecia-prezent-na-30-urodziny-dla-kobiety-biznes-woman' ||
      h === 'obraz-ze-zdjecia-prezent-na-50-urodziny-dla-kobiety-biznes-woman' ||
      h === 'wydruk-na-szkle-biznes-woman-prezent-na-urodziny-dla-kobiety'
    );
  })();
  if (isDlaNiej) return 'caricature-new';
  if (h === 'portret-ze-zdjecia-superbohater-prezent-dla-chlopca') return 'superhero_boy';
  if (h === 'prezent-na-walentynki-obraz-na-plotnie-z-twojego-zdjecia') return 'love-rose';
  if (h === 'portret-zakochana-para-krolewska-prezent-na-walentynki-personalizowany') return 'royal-love';
  if (h === 'portret-w-stylu-gta-obraz-na-plotnie-z-twojego-zdjecia-super-prezent') return 'gta';
  if (h === 'portret-w-stylu-hip-hop-obraz-na-plotnie-z-twojego-zdjecia' || h === 'portret-ze-zdjecia-hip-hop-personalizowany-obraz-na-plotnie') return 'hiphop';
  if (h === 'prezent-dla-dziadkow-retusz-starych-zdjec') return 'retusz-starych-zdjec';
  if (h === 'szkic-ze-zdjecia-obraz-na-plotnie-plakat-ramka') return 'szkic-olowek';
  return null;
}

module.exports = {
  getProductFieldCtx,
  buildProductFieldPromptForHandle,
  hasProductFieldConfig,
  autoSelectedStyleFromHandle
};
