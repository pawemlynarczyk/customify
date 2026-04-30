# Karykatury — archiwum promptów (rollback 1.5 ↔ 2.0)

**Cel:** Mapowanie wersji promptów do modelu API. Jeśli wracamy do `gpt-image-1.5` → używamy STARYCH promptów z tego pliku. Jeśli zostajemy na `gpt-image-2` → używamy NOWYCH (aktualnie wdrożonych w repo).

## Mapa wersji ↔ model

| Wersja promptów | Model API | Cechy |
|---|---|---|
| **STARA** (archiwum tutaj — sekcje 1-4 i blok „Stary" niżej) | `openai/gpt-image-1.5` + `input_fidelity: "high"` | Glossy, brak anti-glare / anti-shine, brak beauty. |
| **NOWA** (aktualnie w `public/customify.js`) | `openai/gpt-image-2` (Replicate, fallback OpenAI) | SATIN/SEMI-MATTE, FACE LIGHTING (anti-glare), FACE BEAUTY — SUBTLE, FABRICS (anti-shine), RESULT z matte finish. |

**Data wdrożenia NOWEJ wersji:**
- Karykatury ślubne (4 produkty): 2026-04-22 (pierwsza faza — sekcje 1-4 niżej)
- Grupy 1-4 Typu A (32 produkty): 2026-04-22 (druga faza — patrz „Anti-glare / beauty / fabrics — GRUPY 1-4" na dole)

## Aktualizacje operacyjne (gpt-image-2)

### 2026-04-23 — limit promptu dla `replaceBasePrompt`
- **Dla `gpt-image-2`**: zwiększony limit `promptAddition` przy `replaceBasePrompt=true` do `20000` (praktycznie bez cięcia szablonów produktowych).
- **Dla `gpt-image-1.5` (rollback)**: pozostaje dotychczasowy limit `3500`.
- **Powód**: przy limicie `3500` wypadały końcowe sekcje `TEXT` / `RESULT` w długich promptach, co powodowało m.in. niechciane napisy.

### 2026-04-23 — reguły tekstu dla pola `personalization`
- Pole `personalization` służy wyłącznie do opisu sceny/postaci (zawód, hobby, klimat), nie jako tekst dedykacji.
- Frazy z `personalization` **nie mogą** być renderowane jako napis na `podium/base/plaque/sign/banner`.
- Jeśli nie ma imienia/dedykacji, `podium/base/plaque/sign/banner` ma pozostać bez tekstu.
- Dopuszczalne są inne naturalne teksty w scenie (np. elementy otoczenia), o ile nie są dedykacją z pola `personalization`.

### 2026-04-30 — doprecyzowanie tekstów kontekstowych dla produktów zawód/hobby
- Zakres: tylko pojedyncze produkty postaciowe z listy `DLA_NIEJ_WITH_YEARS` (np. strażak, wędkarz, lekarka, policjantka, rolnik, lifestyle kobiety). Produkty ślubne i rocznicowe nie są zmieniane.
- Pole `imiona` / dedykacja pozostaje jedynym tekstem kopiowanym dokładnie 1:1 na główną tabliczkę/podium/banner.
- Pole `personalization` może inspirować krótkie teksty kontekstowe w scenie (np. tytuł książki, etykieta, menu, odznaka, szyld), ale nie może być kopiowane dosłownie ani jako pełne frazy/zdania użytkownika.
- Jeśli trzeba cofnąć tę poprawkę, usuń `PERSONALIZATION_CONTEXT_TEXT_POLICY_HANDLES` i przywróć poprzedni pojedynczy blok `TEXT RENDERING RULES` w `public/customify.js`, `shopify-theme/customify-theme/assets/customify.js` oraz `utils/buildProductFieldPromptServer.js`.

**Zasada synchronizacji:** każda zmiana promptów musi być powielona w `public/customify.js` **i** `shopify-theme/customify-theme/assets/customify.js`.

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

---

# Anti-glare / beauty / fabrics — GRUPY 1-4 (rollback)

**Data wdrożenia:** 2026-04-22
**Zakres:** 32 produkty z grup „DLA NIEJ", „DLA NIEGO", „Lifestyle kobiety" i „Pary nie-ślubne" (Typ A — kanoniczny caricature figurine) + 1 edge case (piłkarz).
**Nie dotyczy:** biznes-woman (inny szablon „luxury 3D business") oraz karykatur ślubnych (już zmienionych wcześniej — sekcje 1-4 na górze tego pliku).

## Wersje promptów ↔ model API

| Wersja promptu | Powiązany model API (`api/transform.js`) | Charakterystyka |
|---|---|---|
| **STARA** (bloki „Stary (przed zmianą)" poniżej) | `openai/gpt-image-1.5` + `input_fidelity: "high"` | Glossy, bez anti-glare, bez FABRICS, bez FACE BEAUTY. Dopasowana do słabszego odwzorowania twarzy modelu 1.5. |
| **NOWA** (bloki „Nowy (po zmianie)" poniżej) | `openai/gpt-image-2` (Replicate, fallback OpenAI) | SATIN/SEMI-MATTE, FACE LIGHTING (anti-glare), FACE BEAUTY — SUBTLE, FABRICS (anti-shine), RESULT z matte finish. Dopasowana do ostrego odwzorowania twarzy modelu 2.0 (maskuje odblaski/odbicia i delikatnie wygładza skórę). |

> **Zasada:** jeśli `api/transform.js` dla danego stylu wraca do `gpt-image-1.5` → użyj STAREJ wersji promptów. Jeśli zostaje na `gpt-image-2` → użyj NOWEJ.

## Jak cofnąć

W plikach `public/customify.js` i `shopify-theme/customify-theme/assets/customify.js` zamień **nowe** bloki (po prawej) z powrotem na **stare** (po lewej). Poniżej wszystkie 4 zmiany 1:1 — wystarczy `replace_all`.

### 1) Blok STYLE

**Stary (przed zmianą):**

```
STYLE
• Premium resin statue.
• Soft cinematic studio lighting.
• Glossy surfaces, high-end product render.
• Warm elegant color grading.
• Slight caricature exaggeration (bigger head, stylish proportions).
```

**Nowy (po zmianie):**

```
STYLE
• Premium resin-statue collectible with a SATIN / SEMI-MATTE surface — NOT mirror gloss, NOT wet plastic, NOT glassy skin.
• High-end product render, but with controlled speculars: only soft, small edge highlights; avoid blown white hotspots and "greasy" shine.
• Ultra-soft diffused studio lighting (large softbox look) — even, flattering, low-contrast on faces.
• Warm elegant color grading. Natural, believable skin — not orange, not yellow, not overexposed.
• Slight caricature exaggeration (bigger head, stylish proportions).
```

### 2) Po bloku FACE — CRITICAL

**Stare (przed zmianą — nic nie było po `• Friendly expressive smile.`, od razu pusty wiersz i `CUSTOMIZATION`):**

```
• Friendly expressive smile.

CUSTOMIZATION
```

**Nowe (po zmianie — dodane dwa bloki anti-glare/beauty przed `CUSTOMIZATION`):**

```
• Friendly expressive smile.

FACE LIGHTING & SKIN (anti-glare)
• Faces must look softly lit and mostly MATTE: diffuse light, smooth shadows, no streaky specular highlights across cheeks, nose bridge, or forehead.
• No wet-skin sheen, no oily shine, no dewy spotlight glare, no mirror-like facial highlights.
• If any highlight appears, keep it tiny, soft, and on the high points only — never a large bright patch on the face.

FACE BEAUTY — SUBTLE
• Gently reduce visible skin blemishes, uneven redness, and harsh texture while keeping natural skin (not plastic, not wax).
• Slightly reduce under-eye darkness; do not erase real character lines.
• Slight, natural catchlight in the eyes only (no "laser" eye reflections).

CUSTOMIZATION
```

### 3) Blok OUTFIT

**Stary (przed zmianą):**

```
OUTFIT
• Outfit matching the profession or interest.
• Stylish, slightly exaggerated caricature look.
```

**Nowy (po zmianie — dopisany blok FABRICS pod OUTFIT):**

```
OUTFIT
• Outfit matching the profession or interest.
• Stylish, slightly exaggerated caricature look.

FABRICS & MATERIALS (anti-shine — clothing)
• Clothing must read as MATTE fabrics: matte wool, matte cotton, matte crepe, matte suit cloth — NOT shiny silk, NOT glossy satin, NOT latex, NOT vinyl, NOT patent leather shoes with mirror shine.
• Avoid sequins, glitter, metallic foil, rhinestones, heavy jewelry reflections unless the buyer explicitly asks for them in CUSTOMIZATION.
• Soft diffuse highlights only on folds, no broad bright streaks across chest, shoulders, or lapels.
• Shoes and accessories: prefer matte leather or satin-matte finish — no mirror-shine dress shoes.
```

### 4) Blok RESULT

**Stary (przed zmianą):**

```
RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.
```

**Nowy (po zmianie):**

```
RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render — satin/semi-matte finish, minimal glare, flattering faces, strong likeness.
```

## Szybki rollback przez git

Najszybciej: `git log --oneline | grep -i "anti-glare groups 1-4"` → znajdź commit → `git revert <sha>` → push.

---

# Anti-glare Typ B — luxury 3D (biznes-woman + rocznica pary) — rollback

**Data wdrożenia:** 2026-04-22
**Model API:** `openai/gpt-image-2`
**Zakres:** 6 produktów (4× biznes-woman, 2× rocznica pary na 50-tą)

### Produkty

1. `obraz-ze-zdjecia-biznes-woman-personalizowany-prezent`
2. `wydruk-na-szkle-biznes-woman-prezent-na-urodziny-dla-kobiety`
3. `obraz-ze-zdjecia-prezent-na-50-urodziny-dla-kobiety-biznes-woman`
4. `obraz-ze-zdjecia-prezent-na-30-urodziny-dla-kobiety-biznes-woman`
5. `obraz-ze-zdjecia-pary-na-50-ta-rocznice-wydruk-na-szkle`
6. `obraz-ze-zdjecia-karykatura-na-50-ta-rocznice`

### Zmiana 1: STYLE — „Glossy" → „Satin"

**Stare (gpt-image-1.5):**
```
• Glossy surfaces, premium finish.
```

**Nowe (gpt-image-2):**
```
• Satin / semi-matte premium finish — soft controlled highlights, NOT wet gloss, NOT mirror shine.
```

### Zmiana 2: FACE — dopisek anti-glare skóry

**Stare (gpt-image-1.5) — po „Expressive, joyful smiles." nic nie było:**
```
• Expressive, joyful smiles.

POSE:
```

**Nowe (gpt-image-2) — 2 linie dopisane:**
```
• Expressive, joyful smiles.
• Skin must look softly lit and mostly MATTE — no oily sheen, no wet-skin glare, no large bright patches on forehead, cheeks, or nose.
• Keep beautification natural — not plastic, not wax.

POSE:
```

### Zmiana 3: OUTFITS — dopisek anti-shine ubrań

**Stare (gpt-image-1.5) — po „Elegant black and gold styling." nic nie było:**
```
• Elegant black and gold styling.

SCENE TYPE:
```

**Nowe (gpt-image-2) — 2 linie dopisane:**
```
• Elegant black and gold styling.
• Fabrics should read as elegant MATTE or satin-matte — NOT wet-look, NOT glossy vinyl, NOT shiny latex.
• Gold accents: soft warm glow only, no large mirror-like reflections or blown-out bright streaks.

SCENE TYPE:
```

### Rollback

`git revert <sha>` na odpowiednim commicie, albo ręcznie zamień 3 bloki Nowe → Stare (`replace_all` w obu plikach `customify.js`).
