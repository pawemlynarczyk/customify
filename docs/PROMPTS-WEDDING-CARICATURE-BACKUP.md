# Karykatury ślubne — archiwum promptów (rollback)

**Cel:** Przy powrocie do `openai/gpt-image-1.5` (lub odtworzeniu starego zachowania) użyj poniższych `promptTemplate` w `public/customify.js` (i zsynchronizuj `shopify-theme/customify-theme/assets/customify.js`).

**Aktualny model (produkcja):** `openai/gpt-image-2` (Replicate) + pełne prompty z sekcjami: STYLE satyna/mat, FACE LIGHTING anti-glare, FACE BEAUTY, FABRICS (po OUTFIT). Zobacz `customify.js` — wpisy `PRODUCT_FIELD_CONFIGS` dla 4 handle’i ślubnych.

**Data wprowadzenia v2 promptów:** 2026-04-22 (commit w repo: szukaj `PROMPTS-WEDDING` / wedding GPT Image 2).

---

## 1) `karykatura-slubna-ze-zdjecia-prezent-dla-mlodej-pary` (gpt-image-1.5 era)

```
Create a caricature figurine based on the provided photo.

STYLE
• Premium resin statue.
• Soft cinematic studio lighting.
• Glossy surfaces, high-end product render.
• Warm elegant color grading.
• Slight caricature exaggeration (bigger head, stylish proportions).

FACE — CRITICAL
• Strongly preserve the identity from the reference photo.
• Keep facial structure, eyes, nose, mouth, beard/hairline.
• Natural skin tones.
• Friendly expressive smile.

CUSTOMIZATION
The character represents this profession / hobby / personality:
"{personalization}"

CRITICAL: The overall character should be cohesive — outfit, props, scene, background, podium and decorations must all reference and match the same theme. The podium on which the figurine stands must be styled to fit the profession or hobby. Everything should harmonize and create a unified, coherent whole.

Add visual elements, clothing, props and small scene details related to it.
Examples:
• young wedding couple → elegant wedding styling, romantic atmosphere, tasteful ceremony accents
• business person → suit, laptop, phone
• musician / gamer / chef etc.

POSE
• Depict the couple from the photo as a stylish, joyful young wedding couple („młoda para ślub”), warm and elegant.
• Character(s) sitting or standing confidently on a podium styled to match the theme from CUSTOMIZATION above.
• The podium design, shape, materials and decorations should reflect and harmonize with the overall theme.
• Relaxed, charismatic pose.

OUTFIT
• Outfit matching the profession or interest.
• Stylish, slightly exaggerated caricature look.

SCENE
Mini decorative environment connected with the interest or job.
Fun but elegant.

BACKGROUND
• Colors and style of the background must be related to the person's profession or hobby.
• The backdrop should visually connect with the character's theme, not generic studio.
• Soft bokeh lights.
• Subtle themed decorations.

TEXT
{NAME_SECTION}

RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.
```

---

## 2) `karykatura-na-rocznice-slubu-prezent-na-25-30-40-50-lecie` (gpt-image-1.5 era)

```
Create a caricature figurine based on the provided photo.

STYLE
• Premium resin statue.
• Soft cinematic studio lighting.
• Glossy surfaces, high-end product render.
• Warm elegant color grading.
• Slight caricature exaggeration (bigger head, stylish proportions).

FACE — CRITICAL
• Strongly preserve the identity from the reference photo.
• Keep facial structure, eyes, nose, mouth, beard/hairline.
• Natural skin tones.
• Friendly expressive smile.

CUSTOMIZATION
The character represents this profession / hobby / personality:
"{personalization}"

MANDATORY BASE THEME (non-negotiable): this is always a wedding-anniversary couple ("para na rocznicę ślubu"). Keep wedding-anniversary identity as the core of the image.
If buyer adds extra description in CUSTOMIZATION, treat it only as secondary accents (colors, props, mood, background details) and never replace the anniversary-couple base theme.
CRITICAL: The overall character should be cohesive — outfit, props, scene, background, podium and decorations must all reference and match the same theme. Everything should harmonize and create a unified, coherent whole.

POSE
{YEARS_SECTION}
• Depict the couple from the photo as elegant, joyful wedding-anniversary partners ("para na rocznicę ślubu"), warm and celebratory.
• Character(s) sitting or standing confidently on a podium styled to match the anniversary theme from CUSTOMIZATION above.
• The podium design, shape, materials and decorations should reflect and harmonize with the overall theme.
• Relaxed, charismatic pose.

OUTFIT
• When CUSTOMIZATION is empty: elegant wedding-anniversary attire — man in a dark suit or tuxedo, woman in an elegant long dress. Formal and festive.
• When CUSTOMIZATION specifies different clothing — follow that instead.
• Stylish, slightly exaggerated caricature look.

SCENE
Mini decorative environment connected with the interest or job.
Fun but elegant.

BACKGROUND
• Colors and style of the background must be related to the person's profession or hobby.
• The backdrop should visually connect with the character's theme, not generic studio.
• Soft bokeh lights.
• Subtle themed decorations.

TEXT
{NAME_SECTION}

RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.
```

---

## 3) `karykatura-na-50-rocznice-slubu-prezent-na-50-lecie` (gpt-image-1.5 era)

Identyczny jak sekcja **2** — ten sam `promptTemplate` w repo (tylko inne pole `rocznica` w labelach).

---

## 4) `karykatura-na-40-rocznice-slubu-obraz-ze-zdjecia-na-40-lecie` (gpt-image-1.5 era)

Identyczny jak sekcja **2** — ten sam `promptTemplate` w repo (placeholder rocznicy 20/30/40 w formularzu).

---

## Rollback: model API + prompty

1. W `api/transform.js` ustaw z powrotem `model: "openai/gpt-image-1.5"` i `input_fidelity: "high"` tylko dla stylów karykaturowych, **albo** użyj `git log` / `git revert` na odpowiednich commitach.
2. Skopiuj prompty z tego pliku do `public/customify.js` → `promptTemplate` dla 4 handle’i.
3. Zsynchronizuj kopię w `shopify-theme/customify-theme/assets/customify.js` (jeśli używacie tego pliku w deployu motywu).
4. Wdróż motyw + backend.

**Uwaga:** `utils/buildProductFieldPromptServer.js` ładuje `PRODUCT_FIELD_CONFIGS` z wycinka `public/customify.js` — serwer (social image, logi) musi mieć ten sam tekst.
