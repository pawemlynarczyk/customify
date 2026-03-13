/**
 * CUSTOMIFY AI PHOTO CUSTOMIZATION
 * Clean JavaScript implementation for Shopify theme integration
 */

// ============================================================
// PRODUCT CUSTOM FIELDS CONFIG
// Klucz = product handle z URL.
// ============================================================
const PRODUCT_FIELD_CONFIGS = {
  'obraz-ze-zdjecia-karykatura-dla-niej-zainteresowania': {
    title: 'Personalizacja',
    promptTemplate: `Create a caricature figurine based on the provided photo.

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
• nurse → medical uniform, stethoscope
• fisherman → fishing rod, fish, outdoor vibe
• business person → suit, laptop, phone
• farmer → straw hat, tractor elements
• gamer, chef, traveler, musician etc.

POSE
{YEARS_SECTION}
• Character sitting or standing confidently on a podium.
• The podium must be styled to match the profession or hobby — e.g. medical podium for nurse, boat deck for fisherman, office desk for business person, sports field for athlete. The podium design, shape, materials and decorations should reflect and harmonize with the overall theme.
• Relaxed, charismatic pose.

OUTFIT
• Outfit matching the profession or interest.
• Stylish, slightly exaggerated caricature look.

SCENE
Mini decorative environment connected with the interest or job.
Fun but elegant.

BACKGROUND
• Colors and style of the background must be related to the person's profession or hobby — e.g. soft blues for nurse/medical, warm earth tones for farmer, fresh greens for outdoor/travel, sporty colors for athlete.
• The backdrop should visually connect with the character's theme, not generic studio.
• Soft bokeh lights.
• Subtle themed decorations.

TEXT
{NAME_SECTION}

RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.`,
    fields: [
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Anna', required: false, promptKey: 'name' },
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'opis_charakteru', label: 'Opisz osobę, jej zawód, hobby', type: 'text', placeholder: 'np. pielęgniarka, podróże | nauczycielka, sport', required: false, promptKey: 'personalization' }
    ]
  },
  'obraz-ze-zdjecia-karykatura-dla-niej-policjantka': {
    title: 'Personalizacja',
    promptTemplate: `Create a caricature figurine based on the provided photo.

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
• nurse → medical uniform, stethoscope
• fisherman → fishing rod, fish, outdoor vibe
• business person → suit, laptop, phone
• farmer → straw hat, tractor elements
• gamer, chef, traveler, musician etc.

POSE
{YEARS_SECTION}
• Character sitting or standing confidently on a podium.
• The podium must be styled to match the profession or hobby — e.g. medical podium for nurse, boat deck for fisherman, office desk for business person, sports field for athlete. The podium design, shape, materials and decorations should reflect and harmonize with the overall theme.
• Relaxed, charismatic pose.

OUTFIT
• Outfit matching the profession or interest.
• Stylish, slightly exaggerated caricature look.

SCENE
Mini decorative environment connected with the interest or job.
Fun but elegant.

BACKGROUND
• Colors and style of the background must be related to the person's profession or hobby — e.g. soft blues for nurse/medical, warm earth tones for farmer, fresh greens for outdoor/travel, sporty colors for athlete.
• The backdrop should visually connect with the character's theme, not generic studio.
• Soft bokeh lights.
• Subtle themed decorations.

TEXT
{NAME_SECTION}

RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.`,
    fields: [
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Anna', required: false, promptKey: 'name' },
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'opis_charakteru', label: 'Opisz osobę, jej zawód, hobby', type: 'text', placeholder: 'np. pielęgniarka, podróże | nauczycielka, sport', required: false, promptKey: 'personalization' }
    ]
  },
  'obraz-ze-zdjecia-karykatura-dla-niej-rolniczka': {
    title: 'Personalizacja',
    promptTemplate: `Create a caricature figurine based on the provided photo.

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
• nurse → medical uniform, stethoscope
• fisherman → fishing rod, fish, outdoor vibe
• business person → suit, laptop, phone
• farmer → straw hat, tractor elements
• gamer, chef, traveler, musician etc.

POSE
{YEARS_SECTION}
• Character sitting or standing confidently on a podium.
• The podium must be styled to match the profession or hobby — e.g. medical podium for nurse, boat deck for fisherman, office desk for business person, sports field for athlete. The podium design, shape, materials and decorations should reflect and harmonize with the overall theme.
• Relaxed, charismatic pose.

OUTFIT
• Outfit matching the profession or interest.
• Stylish, slightly exaggerated caricature look.

SCENE
Mini decorative environment connected with the interest or job.
Fun but elegant.

BACKGROUND
• Colors and style of the background must be related to the person's profession or hobby — e.g. soft blues for nurse/medical, warm earth tones for farmer, fresh greens for outdoor/travel, sporty colors for athlete.
• The backdrop should visually connect with the character's theme, not generic studio.
• Soft bokeh lights.
• Subtle themed decorations.

TEXT
{NAME_SECTION}

RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.`,
    fields: [
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Anna', required: false, promptKey: 'name' },
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'opis_charakteru', label: 'Opisz osobę, jej zawód, hobby', type: 'text', placeholder: 'np. pielęgniarka, podróże | nauczycielka, sport', required: false, promptKey: 'personalization' }
    ]
  },
  'obraz-ze-zdjecia-karykatura-dla-niej-lekarka': {
    title: 'Personalizacja',
    promptTemplate: `Create a caricature figurine based on the provided photo.

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
• nurse → medical uniform, stethoscope
• fisherman → fishing rod, fish, outdoor vibe
• business person → suit, laptop, phone
• farmer → straw hat, tractor elements
• gamer, chef, traveler, musician etc.

POSE
{YEARS_SECTION}
• Character sitting or standing confidently on a podium.
• The podium must be styled to match the profession or hobby — e.g. medical podium for nurse, boat deck for fisherman, office desk for business person, sports field for athlete. The podium design, shape, materials and decorations should reflect and harmonize with the overall theme.
• Relaxed, charismatic pose.

OUTFIT
• Outfit matching the profession or interest.
• Stylish, slightly exaggerated caricature look.

SCENE
Mini decorative environment connected with the interest or job.
Fun but elegant.

BACKGROUND
• Colors and style of the background must be related to the person's profession or hobby — e.g. soft blues for nurse/medical, warm earth tones for farmer, fresh greens for outdoor/travel, sporty colors for athlete.
• The backdrop should visually connect with the character's theme, not generic studio.
• Soft bokeh lights.
• Subtle themed decorations.

TEXT
{NAME_SECTION}

RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.`,
    fields: [
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Anna', required: false, promptKey: 'name' },
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'opis_charakteru', label: 'Opisz osobę, jej zawód, hobby', type: 'text', placeholder: 'np. pielęgniarka, podróże | nauczycielka, sport', required: false, promptKey: 'personalization' }
    ]
  },
  'obraz-ze-zdjecia-karykatura-dla-niej-podrozniczka': {
    title: 'Personalizacja',
    promptTemplate: `Create a caricature figurine based on the provided photo.

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
• nurse → medical uniform, stethoscope
• fisherman → fishing rod, fish, outdoor vibe
• business person → suit, laptop, phone
• farmer → straw hat, tractor elements
• gamer, chef, traveler, musician etc.

POSE
{YEARS_SECTION}
• Character sitting or standing confidently on a podium.
• The podium must be styled to match the profession or hobby — e.g. medical podium for nurse, boat deck for fisherman, office desk for business person, sports field for athlete. The podium design, shape, materials and decorations should reflect and harmonize with the overall theme.
• Relaxed, charismatic pose.

OUTFIT
• Outfit matching the profession or interest.
• Stylish, slightly exaggerated caricature look.

SCENE
Mini decorative environment connected with the interest or job.
Fun but elegant.

BACKGROUND
• Colors and style of the background must be related to the person's profession or hobby — e.g. soft blues for nurse/medical, warm earth tones for farmer, fresh greens for outdoor/travel, sporty colors for athlete.
• The backdrop should visually connect with the character's theme, not generic studio.
• Soft bokeh lights.
• Subtle themed decorations.

TEXT
{NAME_SECTION}

RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.`,
    fields: [
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Anna', required: false, promptKey: 'name' },
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'opis_charakteru', label: 'Opisz osobę, jej zawód, hobby', type: 'text', placeholder: 'np. pielęgniarka, podróże | nauczycielka, sport', required: false, promptKey: 'personalization' }
    ]
  },
  'obraz-ze-zdjecia-karykatura-dla-niej-psycholog': {
    title: 'Personalizacja',
    promptTemplate: `Create a caricature figurine based on the provided photo.

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
• nurse → medical uniform, stethoscope
• fisherman → fishing rod, fish, outdoor vibe
• business person → suit, laptop, phone
• farmer → straw hat, tractor elements
• gamer, chef, traveler, musician etc.

POSE
{YEARS_SECTION}
• Character sitting or standing confidently on a podium.
• The podium must be styled to match the profession or hobby — e.g. medical podium for nurse, boat deck for fisherman, office desk for business person, sports field for athlete. The podium design, shape, materials and decorations should reflect and harmonize with the overall theme.
• Relaxed, charismatic pose.

OUTFIT
• Outfit matching the profession or interest.
• Stylish, slightly exaggerated caricature look.

SCENE
Mini decorative environment connected with the interest or job.
Fun but elegant.

BACKGROUND
• Colors and style of the background must be related to the person's profession or hobby — e.g. soft blues for nurse/medical, warm earth tones for farmer, fresh greens for outdoor/travel, sporty colors for athlete.
• The backdrop should visually connect with the character's theme, not generic studio.
• Soft bokeh lights.
• Subtle themed decorations.

TEXT
{NAME_SECTION}

RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.`,
    fields: [
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Anna', required: false, promptKey: 'name' },
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'opis_charakteru', label: 'Opisz osobę, jej zawód, hobby', type: 'text', placeholder: 'np. pielęgniarka, podróże | nauczycielka, sport', required: false, promptKey: 'personalization' }
    ]
  },
  'obraz-ze-zdjecia-karykatura-dla-niej-kucharka': {
    title: 'Personalizacja',
    promptTemplate: `Create a caricature figurine based on the provided photo.

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
• nurse → medical uniform, stethoscope
• fisherman → fishing rod, fish, outdoor vibe
• business person → suit, laptop, phone
• farmer → straw hat, tractor elements
• gamer, chef, traveler, musician etc.

POSE
{YEARS_SECTION}
• Character sitting or standing confidently on a podium.
• The podium must be styled to match the profession or hobby — e.g. medical podium for nurse, boat deck for fisherman, office desk for business person, sports field for athlete. The podium design, shape, materials and decorations should reflect and harmonize with the overall theme.
• Relaxed, charismatic pose.

OUTFIT
• Outfit matching the profession or interest.
• Stylish, slightly exaggerated caricature look.

SCENE
Mini decorative environment connected with the interest or job.
Fun but elegant.

BACKGROUND
• Colors and style of the background must be related to the person's profession or hobby — e.g. soft blues for nurse/medical, warm earth tones for farmer, fresh greens for outdoor/travel, sporty colors for athlete.
• The backdrop should visually connect with the character's theme, not generic studio.
• Soft bokeh lights.
• Subtle themed decorations.

TEXT
{NAME_SECTION}

RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.`,
    fields: [
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Anna', required: false, promptKey: 'name' },
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'opis_charakteru', label: 'Opisz osobę, jej zawód, hobby', type: 'text', placeholder: 'np. pielęgniarka, podróże | nauczycielka, sport', required: false, promptKey: 'personalization' }
    ]
  },
  'obraz-ze-zdjecia-karykatura-dla-niej-fitness': {
    title: 'Personalizacja',
    promptTemplate: `Create a caricature figurine based on the provided photo.

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
• nurse → medical uniform, stethoscope
• fisherman → fishing rod, fish, outdoor vibe
• business person → suit, laptop, phone
• farmer → straw hat, tractor elements
• gamer, chef, traveler, musician etc.

POSE
{YEARS_SECTION}
• Character sitting or standing confidently on a podium.
• The podium must be styled to match the profession or hobby — e.g. medical podium for nurse, boat deck for fisherman, office desk for business person, sports field for athlete. The podium design, shape, materials and decorations should reflect and harmonize with the overall theme.
• Relaxed, charismatic pose.

OUTFIT
• Outfit matching the profession or interest.
• Stylish, slightly exaggerated caricature look.

SCENE
Mini decorative environment connected with the interest or job.
Fun but elegant.

BACKGROUND
• Colors and style of the background must be related to the person's profession or hobby — e.g. soft blues for nurse/medical, warm earth tones for farmer, fresh greens for outdoor/travel, sporty colors for athlete.
• The backdrop should visually connect with the character's theme, not generic studio.
• Soft bokeh lights.
• Subtle themed decorations.

TEXT
{NAME_SECTION}

RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.`,
    fields: [
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Anna', required: false, promptKey: 'name' },
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'opis_charakteru', label: 'Opisz osobę, jej zawód, hobby', type: 'text', placeholder: 'np. pielęgniarka, podróże | nauczycielka, sport', required: false, promptKey: 'personalization' }
    ]
  },
  'obraz-ze-zdjecia-karykatura-dla-niej-szefowa': {
    title: 'Personalizacja',
    promptTemplate: `Create a caricature figurine based on the provided photo.

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
• grocery store manager → apron, shelves with products, shopping cart, fresh produce
• business person → suit, laptop, phone
• farmer → straw hat, tractor elements
• gamer, chef, traveler, musician etc.

POSE
{YEARS_SECTION}
• Character sitting or standing confidently on a podium.
• The podium must be styled to match the profession or hobby — e.g. grocery store counter, shelves with colorful products, fresh fruits and vegetables display. The podium design, shape, materials and decorations should reflect and harmonize with the overall theme.
• Relaxed, charismatic pose.

OUTFIT
• Outfit matching the profession or interest.
• Stylish, slightly exaggerated caricature look.

SCENE
Mini decorative environment connected with the interest or job.
Fun but elegant.

BACKGROUND
• Colors and style of the background must be related to the person's profession or hobby — e.g. warm inviting grocery store colors, shelves with products, fresh produce displays.
• The backdrop should visually connect with the character's theme, not generic studio.
• Soft bokeh lights.
• Subtle themed decorations.

TEXT
{NAME_SECTION}

RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.`,
    fields: [
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Anna', required: false, promptKey: 'name' },
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'opis_charakteru', label: 'Opisz osobę, jej zawód, hobby', type: 'text', placeholder: 'np. szefowa sklepu, produkty spożywcze', required: false, promptKey: 'personalization' }
    ]
  },
  'karykatura-rolnik-ze-zdjecia-personalizowany-prezent-dla-mezczyzny': {
    title: 'Personalizacja',
    promptTemplate: `Create a caricature figurine based on the provided photo.

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
• nurse → medical uniform, stethoscope
• fisherman → fishing rod, fish, outdoor vibe
• business person → suit, laptop, phone
• farmer → straw hat, tractor elements
• gamer, chef, traveler, musician etc.

POSE
{YEARS_SECTION}
• Character sitting or standing confidently on a podium.
• The podium must be styled to match the profession or hobby — e.g. medical podium for nurse, boat deck for fisherman, office desk for business person, sports field for athlete. The podium design, shape, materials and decorations should reflect and harmonize with the overall theme.
• Relaxed, charismatic pose.

OUTFIT
• Outfit matching the profession or interest.
• Stylish, slightly exaggerated caricature look.

SCENE
Mini decorative environment connected with the interest or job.
Fun but elegant.

BACKGROUND
• Colors and style of the background must be related to the person's profession or hobby — e.g. soft blues for nurse/medical, warm earth tones for farmer, fresh greens for outdoor/travel, sporty colors for athlete.
• The backdrop should visually connect with the character's theme, not generic studio.
• Soft bokeh lights.
• Subtle themed decorations.

TEXT
{NAME_SECTION}

RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.`,
    fields: [
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Jan', required: false, promptKey: 'name' },
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'opis_charakteru', label: 'Opisz osobę, jej zawód, hobby', type: 'text', placeholder: 'np. rolnik, wędkarz, sport', required: false, promptKey: 'personalization' }
    ]
  },
  'obraz-ze-zdjecia-prezent-dla-chlopca-pilkarz': {
    title: 'Personalizacja',
    promptTemplate: `Create a caricature figurine based on the provided photo.

STYLE
• Premium resin statue.
• Soft cinematic studio lighting.
• Glossy surfaces, high-end product render.
• Warm elegant color grading.
• Slight caricature exaggeration (bigger head, athletic proportions).

FACE — CRITICAL
• Strongly preserve the identity from the reference photo.
• Keep facial structure, eyes, nose, mouth, beard/hairline.
• Natural skin tones.
• Confident, winning smile.

CUSTOMIZATION
The character represents this profession / hobby / personality:
"{personalization}"

CRITICAL: The overall character should be cohesive — outfit, props, scene, background, podium and decorations must all reference and match the same theme (football / soccer champion). Everything should harmonize and create a unified, coherent whole.

Add visual elements, clothing, props and small scene details:
• Football / soccer player → full football kit (jersey, shorts, socks, boots), football ball, trophy or championship cup
• Champion / winner → gold medal, winner's podium, confetti, spotlight

POSE
{YEARS_SECTION}
• Character standing confidently on a winner's podium, holding a football or trophy.
• Heroic, triumphant champion pose — arms raised in victory or ball under the arm.
• The podium styled as a championship podium with a football motif.

OUTFIT
• Full football kit — jersey with number, shorts, cleats/boots.
• Stylish, slightly exaggerated caricature look.
• Team colors: green and white, or gold accents for champion feel.

SCENE
Mini stadium or pitch environment — grass pitch, goal post in background, stadium lights.
Fun but epic.

BACKGROUND
• Stadium atmosphere — deep greens of a pitch, bright stadium floodlights.
• Confetti, gold stars, champion banner.
• Soft bokeh crowd lights in the background.

TEXT
{NAME_SECTION}

RESULT
Premium collectible caricature statue of a football champion — highly detailed, playful but luxurious, product-photo quality render.`,
    fields: [
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Kacper', required: false, promptKey: 'name' },
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'opis_charakteru', label: 'Opisz osobę, jej zawód, hobby', type: 'text', placeholder: 'np. piłkarz, zwycięzca, sport', required: false, promptKey: 'personalization' }
    ]
  },
  'portret-ze-zdjecia-dla-lekarza-personalizowany-plakat-na-urodziny-dla-chlopaka': {
    title: 'Personalizacja',
    promptTemplate: `Create a caricature figurine based on the provided photo.

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

CRITICAL: The overall character should be cohesive — outfit, props, scene, background, podium and decorations must all reference and match the same theme. The podium on which the figurine stands must be styled to fit the doctor / medical profession. Everything should harmonize and create a unified, coherent whole.

Add visual elements, clothing, props and small scene details related to it.
Examples:
• doctor → white coat, stethoscope, clipboard, medical chart
• surgeon → scrubs, surgical mask around neck, gloves
• general practitioner → white lab coat, stethoscope, medical bag

POSE
{YEARS_SECTION}
• Character standing confidently on a podium styled to match the medical / doctor theme.
• Professional, confident pose — top doctor vibe.
• The podium design should reference medicine — e.g. red cross motif, caduceus symbol, hospital white tones.

OUTFIT
• Classic doctor outfit — white lab coat, stethoscope around neck, name badge.
• Stylish, slightly exaggerated caricature look.

SCENE
Mini decorative environment — hospital corridor, examination room, medical equipment, health charts.
Fun but professional.

BACKGROUND
• Colors related to medicine — clean whites, hospital greens, soft blues.
• Subtle themed decorations — caduceus, stethoscope, medical cross, pill bottles.
• Soft bokeh lights.

TEXT
{NAME_SECTION}

RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.`,
    fields: [
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Piotr', required: false, promptKey: 'name' },
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'opis_charakteru', label: 'Opisz osobę, jej zawód, hobby', type: 'text', placeholder: 'np. lekarz, chirurg, pediatra', required: false, promptKey: 'personalization' }
    ]
  },
  'prezent-ze-zdjecia-dla-budowlanca-personalizowany-obraz-dla-taty': {
    title: 'Personalizacja',
    promptTemplate: `Create a caricature figurine based on the provided photo.

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

CRITICAL: The overall character should be cohesive — outfit, props, scene, background, podium and decorations must all reference and match the same theme. The podium on which the figurine stands must be styled to fit the construction worker profession. Everything should harmonize and create a unified, coherent whole.

Add visual elements, clothing, props and small scene details related to it.
Examples:
• construction worker → hard hat, tool belt, hammer, blueprints, scaffolding
• builder → orange safety vest, drill, brick wall background, crane silhouette
• handyman → wrench, toolbox, measuring tape, work gloves

POSE
{YEARS_SECTION}
• Character standing confidently on a podium styled to match the construction / building theme.
• Strong, proud pose — master builder vibe.
• The podium design should reference construction — e.g. concrete platform, brick pattern, tools arranged around the base.

OUTFIT
• Classic construction worker outfit — hard hat (yellow or orange), safety vest, work boots, tool belt.
• Stylish, slightly exaggerated caricature look.

SCENE
Mini decorative environment — construction site, scaffolding, bricks, blueprints, tools scattered around.
Fun but professional.

BACKGROUND
• Colors related to construction — warm oranges, yellows, brick reds, concrete grays.
• Subtle themed decorations — crane silhouette, blueprint rolls, ladder elements.
• Soft bokeh lights.

TEXT
{NAME_SECTION}

RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.`,
    fields: [
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Marek', required: false, promptKey: 'name' },
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'opis_charakteru', label: 'Opisz osobę, jej zawód, hobby', type: 'text', placeholder: 'np. budowlaniec, murarz, majster', required: false, promptKey: 'personalization' }
    ]
  },
  'prezent-z-wlasnym-zdjeciem-dla-kierowcy-tira-personalizowany-obraz': {
    title: 'Personalizacja',
    promptTemplate: `Create a caricature figurine based on the provided photo.

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

CRITICAL: The overall character should be cohesive — outfit, props, scene, background, podium and decorations must all reference and match the same theme. The podium on which the figurine stands must be styled to fit the truck driver profession. Everything should harmonize and create a unified, coherent whole.

Add visual elements, clothing, props and small scene details related to it.
Examples:
• truck driver → flannel shirt, cap, big rig truck, steering wheel, road map
• long-haul driver → sunglasses, road, highway, semi-truck cabin, fuel cans
• trucker → travel mug, CB radio, truck keys, highway scenery

POSE
{YEARS_SECTION}
• Character standing confidently on a podium styled to match the trucker / road-life theme.
• Proud, relaxed pose — king of the road vibe.
• The podium design should reference trucking — e.g. truck cab silhouette, road lines, dashboard details.

OUTFIT
• Classic trucker outfit — flannel shirt or jacket, cap, jeans, work boots.
• Stylish, slightly exaggerated caricature look.

SCENE
Mini decorative environment — open road, highway, semi-truck cab, rest stop atmosphere.
Fun but professional.

BACKGROUND
• Colors related to road life — warm sunset highway, asphalt grays, golden horizon.
• Subtle themed decorations — truck silhouettes, road signs, map elements.
• Soft bokeh lights.

TEXT
{NAME_SECTION}

RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.`,
    fields: [
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Tomek', required: false, promptKey: 'name' },
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'opis_charakteru', label: 'Opisz osobę, jej zawód, hobby', type: 'text', placeholder: 'np. kierowca tira, trasa, podróże', required: false, promptKey: 'personalization' }
    ]
  },
  'obraz-ze-zdjecia-karykatura-policjant-prezent-dla-faceta': {
    title: 'Personalizacja',
    promptTemplate: `Create a caricature figurine based on the provided photo.

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
• police officer → police uniform, badge, handcuffs, police car or precinct background
• detective → trench coat, magnifying glass, notepad
• security guard → uniform, radio, badge

POSE
{YEARS_SECTION}
• Character standing confidently on a podium styled to match the police/law enforcement theme.
• Heroic, confident pose — like a proud officer of the law.
• The podium design should reference law enforcement — e.g. police shield motif, black and blue colors.

OUTFIT
• Full police uniform — jacket, badge, cap.
• Stylish, slightly exaggerated caricature look.

SCENE
Mini decorative environment — police precinct, patrol car, law enforcement atmosphere.
Fun but professional.

BACKGROUND
• Colors related to law enforcement — deep blues, dark navy, police badge gold accents.
• Subtle themed decorations — sirens, badge motifs, city silhouette.
• Soft bokeh lights.

TEXT
{NAME_SECTION}

RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.`,
    fields: [
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Marek', required: false, promptKey: 'name' },
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'opis_charakteru', label: 'Opisz osobę, jej zawód, hobby', type: 'text', placeholder: 'np. policjant, detektyw, straż', required: false, promptKey: 'personalization' }
    ]
  },
  'karykatura-wedkarz-portret-ze-zdjecia-personalizowany-prezent-dla-faceta': {
    title: 'Personalizacja',
    promptTemplate: `Create a caricature figurine based on the provided photo.

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
• fisherman → fishing rod, fish, lake/river setting, outdoor vibe, waders or fishing vest
• nurse → medical uniform, stethoscope
• business person → suit, laptop, phone
• farmer → straw hat, tractor elements
• gamer, chef, traveler, musician etc.

POSE
{YEARS_SECTION}
• Character sitting or standing confidently on a podium.
• The podium must be styled to match the profession or hobby — e.g. boat deck or lakeside dock for fisherman, medical podium for nurse, office desk for business person. The podium design, shape, materials and decorations should reflect and harmonize with the overall theme.
• Relaxed, charismatic pose.

OUTFIT
• Outfit matching the profession or interest.
• Stylish, slightly exaggerated caricature look.

SCENE
Mini decorative environment connected with the interest or job.
Fun but elegant.

BACKGROUND
• Colors and style of the background must be related to the person's profession or hobby — e.g. fresh blues and greens for fisherman/water, soft blues for nurse/medical, warm earth tones for farmer.
• The backdrop should visually connect with the character's theme, not generic studio.
• Soft bokeh lights.
• Subtle themed decorations.

TEXT
{NAME_SECTION}

RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.`,
    fields: [
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Jan', required: false, promptKey: 'name' },
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'opis_charakteru', label: 'Opisz osobę, jej zawód, hobby', type: 'text', placeholder: 'np. wędkarz, ryby, jezioro', required: false, promptKey: 'personalization' }
    ]
  },
  'kulturysta-karykatura-ze-zdjecia-prezent-dla-mezczyzny': {
    title: 'Personalizacja',
    promptTemplate: `Create a caricature figurine based on the provided photo.

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
• nurse → medical uniform, stethoscope
• fisherman → fishing rod, fish, outdoor vibe
• business person → suit, laptop, phone
• farmer → straw hat, tractor elements
• gamer, chef, traveler, musician etc.

POSE
{YEARS_SECTION}
• Character sitting or standing confidently on a podium.
• The podium must be styled to match the profession or hobby — e.g. medical podium for nurse, boat deck for fisherman, office desk for business person, sports field for athlete. The podium design, shape, materials and decorations should reflect and harmonize with the overall theme.
• Relaxed, charismatic pose.

OUTFIT
• Outfit matching the profession or interest.
• Stylish, slightly exaggerated caricature look.

SCENE
Mini decorative environment connected with the interest or job.
Fun but elegant.

BACKGROUND
• Colors and style of the background must be related to the person's profession or hobby — e.g. soft blues for nurse/medical, warm earth tones for farmer, fresh greens for outdoor/travel, sporty colors for athlete.
• The backdrop should visually connect with the character's theme, not generic studio.
• Soft bokeh lights.
• Subtle themed decorations.

TEXT
{NAME_SECTION}

RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.`,
    fields: [
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Jan', required: false, promptKey: 'name' },
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'opis_charakteru', label: 'Opisz osobę, jej zawód, hobby', type: 'text', placeholder: 'np. kulturysta, siłownia, sport', required: false, promptKey: 'personalization' }
    ]
  },
  'active-woman-portret-ze-zdjecia-na-rocznice-dla-kolezanki-kobiety-druk-na-szkle': {
    title: 'Personalizacja',
    promptTemplate: `Create a caricature figurine based on the provided photo.

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
• nurse → medical uniform, stethoscope
• fisherman → fishing rod, fish, outdoor vibe
• business person → suit, laptop, phone
• farmer → straw hat, tractor elements
• gamer, chef, traveler, musician etc.

POSE
{YEARS_SECTION}
• Character sitting or standing confidently on a podium.
• The podium must be styled to match the profession or hobby — e.g. medical podium for nurse, boat deck for fisherman, office desk for business person, sports field for athlete. The podium design, shape, materials and decorations should reflect and harmonize with the overall theme.
• Relaxed, charismatic pose.

OUTFIT
• Outfit matching the profession or interest.
• Stylish, slightly exaggerated caricature look.

SCENE
Mini decorative environment connected with the interest or job.
Fun but elegant.

BACKGROUND
• Colors and style of the background must be related to the person's profession or hobby — e.g. soft blues for nurse/medical, warm earth tones for farmer, fresh greens for outdoor/travel, sporty colors for athlete.
• The backdrop should visually connect with the character's theme, not generic studio.
• Soft bokeh lights.
• Subtle themed decorations.

TEXT
{NAME_SECTION}

RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.`,
    fields: [
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Anna', required: false, promptKey: 'name' },
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'opis_charakteru', label: 'Opisz osobę, jej zawód, hobby', type: 'text', placeholder: 'np. fitness, sport, siłownia', required: false, promptKey: 'personalization' }
    ]
  },
  'active-woman-portret-ze-zdjecia-na-18-urodziny-dla-dziewczyny-druk-na-szkle-copy': {
    title: 'Personalizacja',
    promptTemplate: `Create a caricature figurine based on the provided photo.

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
• nurse → medical uniform, stethoscope
• fisherman → fishing rod, fish, outdoor vibe
• business person → suit, laptop, phone
• farmer → straw hat, tractor elements
• gamer, chef, traveler, musician etc.

POSE
{YEARS_SECTION}
• Character sitting or standing confidently on a podium.
• The podium must be styled to match the profession or hobby — e.g. medical podium for nurse, boat deck for fisherman, office desk for business person, sports field for athlete. The podium design, shape, materials and decorations should reflect and harmonize with the overall theme.
• Relaxed, charismatic pose.

OUTFIT
• Outfit matching the profession or interest.
• Stylish, slightly exaggerated caricature look.

SCENE
Mini decorative environment connected with the interest or job.
Fun but elegant.

BACKGROUND
• Colors and style of the background must be related to the person's profession or hobby — e.g. soft blues for nurse/medical, warm earth tones for farmer, fresh greens for outdoor/travel, sporty colors for athlete.
• The backdrop should visually connect with the character's theme, not generic studio.
• Soft bokeh lights.
• Subtle themed decorations.

TEXT
{NAME_SECTION}

RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.`,
    fields: [
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Anna', required: false, promptKey: 'name' },
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'opis_charakteru', label: 'Opisz osobę, jej zawód, hobby', type: 'text', placeholder: 'np. fitness, sport, siłownia', required: false, promptKey: 'personalization' }
    ]
  },
  'portret-ze-zdjecia-prezent-na-urodziny-dla-kolezanki-szefowej-salon-spa': {
    title: 'Personalizacja',
    promptTemplate: `Create a caricature figurine based on the provided photo.

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
• nurse → medical uniform, stethoscope
• fisherman → fishing rod, fish, outdoor vibe
• business person → suit, laptop, phone
• farmer → straw hat, tractor elements
• salon/spa → manicure, nails, eyelashes, beauty aesthetic

POSE
{YEARS_SECTION}
• Character sitting or standing confidently on a podium.
• The podium must be styled to match the profession or hobby.
• Relaxed, charismatic pose.

OUTFIT
• Outfit matching the profession or interest.
• Stylish, slightly exaggerated caricature look.

SCENE
Mini decorative environment connected with the interest or job.
Fun but elegant.

BACKGROUND
• Colors and style of the background must be related to the person's profession or hobby.
• Soft bokeh lights.
• Subtle themed decorations.

TEXT
{NAME_SECTION}

RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.`,
    fields: [
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Anna', required: false, promptKey: 'name' },
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'opis_charakteru', label: 'Opisz osobę, jej zawód, hobby', type: 'text', placeholder: 'np. salon manicure, tipsy, rzęsy', required: false, promptKey: 'personalization' }
    ]
  },
  'portret-ze-zdjecia-superbohater-prezent-dla-chlopca': {
    title: 'Personalizacja',
    promptTemplate: `Create a cinematic young superhero poster based on the provided photo

CRITICAL IDENTITY PRESERVATION
- Strongly preserve the identity of the person from the reference photo.
- Keep the same face shape, eyes, nose, mouth, smile, skin tone, hairstyle, and overall facial proportions.
- The superhero must clearly look like the same person from the uploaded photo, not a generic child.
- Do not beautify, age up, age down, or significantly alter facial features.
- Preserve the natural likeness as accurately as possible.

SUBJECT
- Superboy flying high above a modern city skyline.
- Dynamic classic superhero pose, front view, one fist extended forward.
- Body angled slightly toward the viewer, as if soaring through the air.
- Joyful, confident, energetic expression.

OUTFIT
- A sleek blue superhero suit with subtle red accents.
- A large gold star emblem on the chest.
- A flowing red cape moving naturally in the wind.
- Costume should look premium, cinematic, realistic, and slightly textured.

COMPOSITION
- Vertical superhero movie poster composition.
- The person is centered and dominant in the frame.
- Aerial city view below with skyscrapers, long streets, and distant water in the background.
- Strong sense of height and motion.

LIGHTING & STYLE
- Golden hour / sunset lighting.
- Warm cinematic glow, soft highlights on the face and costume.
- Atmospheric haze over the city.
- Ultra-detailed, realistic, epic cinematic look.
- Sharp focus on the face.
- Premium movie-poster quality.

TEXT
{NAME_SECTION}`,
    fields: [
      { id: 'imiona', label: 'Wpisz imię (pojawią się na plakacie w stylu filmów o superbohaterach)', type: 'text', placeholder: 'np. Kuba, Wojtek', required: false, promptKey: 'name' }
    ]
  },
  'obraz-ze-zdjecia-prezent-na-40-urodziny-dla-kobiety-czerwony-dywan': {
    title: 'Personalizacja',
    promptTemplate: `Create a caricature figurine based on the provided photo.

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
• nurse → medical uniform, stethoscope
• fisherman → fishing rod, fish, outdoor vibe
• business person → suit, laptop, phone
• farmer → straw hat, tractor elements
• gamer, chef, traveler, musician etc.

POSE
{YEARS_SECTION}
• Character standing confidently on a red carpet podium.
• The podium must be styled to match the profession or hobby. The podium design, shape, materials and decorations should reflect and harmonize with the overall theme.
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
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.`,
    fields: [
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Ania', required: false, promptKey: 'name' },
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 40', required: false, promptKey: 'YEARS' },
      { id: 'opis_charakteru', label: 'Opisz osobę, jej zawód, hobby', type: 'text', placeholder: 'np. fitness, podróże, moda', required: false, promptKey: 'personalization' }
    ]
  },
  'portret-na-18-urodziny-dla-dziewczyny-magic-z-wlasnego-zdjecia-druk-na-szkle': {
    title: 'Personalizacja',
    promptTemplate: `Create a caricature figurine based on the provided photo.

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
• nurse → medical uniform, stethoscope
• fisherman → fishing rod, fish, outdoor vibe
• business person → suit, laptop, phone
• farmer → straw hat, tractor elements
• gamer, chef, traveler, musician etc.

POSE
{YEARS_SECTION}
• Character sitting or standing confidently on a podium.
• The podium must be styled to match the profession or hobby — e.g. medical podium for nurse, boat deck for fisherman, office desk for business person, sports field for athlete. The podium design, shape, materials and decorations should reflect and harmonize with the overall theme.
• Relaxed, charismatic pose.

OUTFIT
• Outfit matching the profession or interest.
• Stylish, slightly exaggerated caricature look.

SCENE
Mini decorative environment connected with the interest or job.
Fun but elegant.

BACKGROUND
• Colors and style of the background must be related to the person's profession or hobby — e.g. soft blues for nurse/medical, warm earth tones for farmer, fresh greens for outdoor/travel, sporty colors for athlete.
• The backdrop should visually connect with the character's theme, not generic studio.
• Soft bokeh lights.
• Subtle themed decorations.

TEXT
{NAME_SECTION}

RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.`,
    fields: [
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Anna', required: false, promptKey: 'name' },
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 18, 25, 30', required: false, promptKey: 'YEARS' },
      { id: 'opis_charakteru', label: 'Opisz osobę, jej zawód, hobby', type: 'text', placeholder: 'np. glamour, Hollywood, czerwony dywan', required: false, promptKey: 'personalization' }
    ]
  },
  'portret-ze-zdjecia-na-30-rocznice-dla-nauczycielki-karykatura-na-prezent': {
    title: 'Personalizacja',
    promptTemplate: `Create a caricature figurine based on the provided photo.

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
• nurse → medical uniform, stethoscope
• fisherman → fishing rod, fish, outdoor vibe
• business person → suit, laptop, phone
• farmer → straw hat, tractor elements
• gamer, chef, traveler, musician etc.

POSE
{YEARS_SECTION}
• Character sitting or standing confidently on a podium.
• The podium must be styled to match the profession or hobby — e.g. medical podium for nurse, boat deck for fisherman, office desk for business person, sports field for athlete. The podium design, shape, materials and decorations should reflect and harmonize with the overall theme.
• Relaxed, charismatic pose.

OUTFIT
• Outfit matching the profession or interest.
• Stylish, slightly exaggerated caricature look.

SCENE
Mini decorative environment connected with the interest or job.
Fun but elegant.

BACKGROUND
• Colors and style of the background must be related to the person's profession or hobby — e.g. soft blues for nurse/medical, warm earth tones for farmer, fresh greens for outdoor/travel, sporty colors for athlete.
• The backdrop should visually connect with the character's theme, not generic studio.
• Soft bokeh lights.
• Subtle themed decorations.

TEXT
{NAME_SECTION}

RESULT
Premium collectible caricature statue, highly detailed, playful but luxurious, product-photo quality render.`,
    fields: [
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Anna', required: false, promptKey: 'name' },
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 30', required: false, promptKey: 'YEARS' },
      { id: 'opis_charakteru', label: 'Opisz osobę, jej zawód, hobby', type: 'text', placeholder: 'np. nauczycielka, szkoła, książki', required: false, promptKey: 'personalization' }
    ]
  },
  'obraz-ze-zdjecia-biznes-woman-personalizowany-prezent': {
    title: 'Personalizacja',
    promptTemplate: `Create a luxury 3D business caricature figurine.

STYLE:
• High-end 3D resin sculpture.
• Soft cinematic studio lighting.
• Glossy surfaces, premium finish.
• Warm golden color grading.
• Slight caricature exaggeration (larger heads, elegant proportions).
• Slender, graceful body proportions — elegant and refined, NOT bulky or distorted.

FACE:
• Preserve facial identity and structure.
• Natural skin tones.
• Slight beautification (smooth skin, refined details).
• Expressive, joyful smiles.

POSE:
• {YEARS_SECTION}
• Romantic, elegant body language.
• Hands elegantly on lap.

OUTFITS:
• Glamorous evening look.
• Elegant black and gold styling.

SCENE TYPE:
The occasion is business anniversary celebration.

BACKGROUND:
• Warm golden studio backdrop.
• Metallic gold and black decoration.
• Elegant business bag and other business woman attributes.
• Soft bokeh lights.

TEXT:
{NAMES_SECTION}

RESULT:
A premium 3D anniversary caricature statue, slender elegant figure, luxurious, celebratory, highly polished, photorealistic 3D render.`,
    fields: [
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Anna', required: false, promptKey: 'NAMES' }
    ]
  },
  'wydruk-na-szkle-biznes-woman-prezent-na-urodziny-dla-kobiety': {
    title: 'Personalizacja',
    promptTemplate: `Create a luxury 3D business caricature figurine.

STYLE:
• High-end 3D resin sculpture.
• Soft cinematic studio lighting.
• Glossy surfaces, premium finish.
• Warm golden color grading.
• Slight caricature exaggeration (larger heads, elegant proportions).
• Slender, graceful body proportions — elegant and refined, NOT bulky or distorted.

FACE:
• Preserve facial identity and structure.
• Natural skin tones.
• Slight beautification (smooth skin, refined details).
• Expressive, joyful smiles.

POSE:
• {YEARS_SECTION}
• Romantic, elegant body language.
• Hands elegantly on lap.

OUTFITS:
• Glamorous evening look.
• Elegant black and gold styling.

SCENE TYPE:
The occasion is business anniversary celebration.

BACKGROUND:
• Warm golden studio backdrop.
• Metallic gold and black decoration.
• Elegant business bag and other business woman attributes.
• Soft bokeh lights.

TEXT:
{NAMES_SECTION}

RESULT:
A premium 3D anniversary caricature statue, slender elegant figure, luxurious, celebratory, highly polished, photorealistic 3D render.`,
    fields: [
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Anna', required: false, promptKey: 'NAMES' }
    ]
  },
  'obraz-ze-zdjecia-prezent-na-50-urodziny-dla-kobiety-biznes-woman': {
    title: 'Personalizacja',
    promptTemplate: `Create a luxury 3D business caricature figurine.

STYLE:
• High-end 3D resin sculpture.
• Soft cinematic studio lighting.
• Glossy surfaces, premium finish.
• Warm golden color grading.
• Slight caricature exaggeration (larger heads, elegant proportions).
• Slender, graceful body proportions — elegant and refined, NOT bulky or distorted.

FACE:
• Preserve facial identity and structure.
• Natural skin tones.
• Slight beautification (smooth skin, refined details).
• Expressive, joyful smiles.

POSE:
• {YEARS_SECTION}
• Romantic, elegant body language.
• Hands elegantly on lap.

OUTFITS:
• Glamorous evening look.
• Elegant black and gold styling.

SCENE TYPE:
The occasion is business anniversary celebration.

BACKGROUND:
• Warm golden studio backdrop.
• Metallic gold and black decoration.
• Elegant business bag and other business woman attributes.
• Soft bokeh lights.

TEXT:
{NAMES_SECTION}

RESULT:
A premium 3D anniversary caricature statue, slender elegant figure, luxurious, celebratory, highly polished, photorealistic 3D render.`,
    fields: [
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Anna', required: false, promptKey: 'NAMES' }
    ]
  },
  'obraz-ze-zdjecia-prezent-na-30-urodziny-dla-kobiety-biznes-woman': {
    title: 'Personalizacja',
    promptTemplate: `Create a luxury 3D business caricature figurine.

STYLE:
• High-end 3D resin sculpture.
• Soft cinematic studio lighting.
• Glossy surfaces, premium finish.
• Warm golden color grading.
• Slight caricature exaggeration (larger heads, elegant proportions).
• Slender, graceful body proportions — elegant and refined, NOT bulky or distorted.

FACE:
• Preserve facial identity and structure.
• Natural skin tones.
• Slight beautification (smooth skin, refined details).
• Expressive, joyful smiles.

POSE:
• {YEARS_SECTION}
• Romantic, elegant body language.
• Hands elegantly on lap.

OUTFITS:
• Glamorous evening look.
• Elegant black and gold styling.

SCENE TYPE:
The occasion is business anniversary celebration.

BACKGROUND:
• Warm golden studio backdrop.
• Metallic gold and black decoration.
• Elegant business bag and other business woman attributes.
• Soft bokeh lights.

TEXT:
{NAMES_SECTION}

RESULT:
A premium 3D anniversary caricature statue, slender elegant figure, luxurious, celebratory, highly polished, photorealistic 3D render.`,
    fields: [
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Anna', required: false, promptKey: 'NAMES' }
    ]
  },
  'obraz-ze-zdjecia-pary-na-50-ta-rocznice-wydruk-na-szkle': {
    title: 'Personalizacja',
    promptTemplate: `Create a luxury 3D anniversary caricature figurine.

CRITICAL: Use ONLY the person(s) visible in the uploaded photo. Do NOT add any extra people. If the photo shows 1 person, show only 1 person. If the photo shows 2 people, show both. Never invent a second person.

STYLE:
• High-end 3D resin sculpture.
• Soft cinematic studio lighting.
• Glossy surfaces, premium finish.
• Warm golden color grading.
• Slight caricature exaggeration (larger heads, elegant proportions).

FACE:
• Preserve facial identity and structure.
• Natural skin tones.
• Slight beautification (smooth skin, refined details).
• Expressive, joyful smiles.

POSE:
• The person(s) from the photo sitting on a large metallic gold 3D number "{YEARS}".
• Romantic, elegant body language.
• Holding champagne glasses (one per person).

OUTFITS:
• Glamorous evening look.
• Elegant black and gold styling.

SCENE TYPE:
The occasion is anniversary. The decorations, props and mood: romantic lighting, subtle hearts, elegant decor.

BACKGROUND:
• Warm golden studio backdrop.
• Metallic gold and black balloons.
• Elegant gift boxes with gold ribbons.
• Soft bokeh lights.

TEXT:
{NAMES_SECTION}

RESULT:
A premium 3D anniversary caricature statue, luxurious, celebratory, highly polished, photorealistic 3D render.`,
    fields: [
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Anna i Marek', required: false, promptKey: 'NAMES' }
    ]
  },
  'obraz-ze-zdjecia-karykatura-na-50-ta-rocznice': {
    title: 'Personalizacja',
    promptTemplate: `Create a luxury 3D anniversary caricature figurine.

CRITICAL: Use ONLY the person(s) visible in the uploaded photo. Do NOT add any extra people. If the photo shows 1 person, show only 1 person. If the photo shows 2 people, show both. Never invent a second person.

STYLE:
• High-end 3D resin sculpture.
• Soft cinematic studio lighting.
• Glossy surfaces, premium finish.
• Warm golden color grading.
• Slight caricature exaggeration (larger heads, elegant proportions).

FACE:
• Preserve facial identity and structure.
• Natural skin tones.
• Slight beautification (smooth skin, refined details).
• Expressive, joyful smiles.

POSE:
• The person(s) from the photo sitting on a large metallic gold 3D number "{YEARS}".
• Romantic, elegant body language.
• Holding champagne glasses (one per person).

OUTFITS:
• Glamorous evening look.
• Elegant black and gold styling.

SCENE TYPE:
The occasion is anniversary. The decorations, props and mood: romantic lighting, subtle hearts, elegant decor.

BACKGROUND:
• Warm golden studio backdrop.
• Metallic gold and black balloons.
• Elegant gift boxes with gold ribbons.
• Soft bokeh lights.

TEXT:
{NAMES_SECTION}

RESULT:
A premium 3D anniversary caricature statue, luxurious, celebratory, highly polished, photorealistic 3D render.`,
    fields: [
      { id: 'rocznica', label: 'Rocznica / liczba lat', type: 'text', placeholder: 'np. 10, 25, 50', required: false, promptKey: 'YEARS' },
      { id: 'imiona', label: 'Wpisz Imię, dedykację', type: 'text', placeholder: 'np. Anna i Marek', required: false, promptKey: 'NAMES' }
    ]
  },
  'dodaj-osobe-do-zdjecia-naturalny-efekt-obraz-plakat-wydruk': {
    title: 'Personalizacja',
    multiUpload: true,
    maxImages: 4,
    promptTemplate: `Combine all the people from the provided reference photos into a single, cohesive, natural-looking photograph. The result must look like a real, candid photo — not an illustration, not a painting, not AI-generated. Use natural lighting, realistic skin tones, authentic clothing textures, and a believable environment. Preserve the EXACT facial features, hair color, hairstyle, and likeness of every person. Place all people together in one natural scene as if they were photographed together in real life. Match lighting, color grading, and perspective across all people. High resolution, sharp details, photorealistic quality. Frame as landscape-oriented (horizontal) photo. All people visible from at least waist up, faces clearly visible and large in the frame.

{SCENE_DESC_SECTION}

{DEDICATION_SECTION}

OUTPUT: A single photorealistic image that looks like a genuine group photograph.`,
    fields: [
      { id: 'scena', label: 'Opisz scenę / klimat zdjęcia', type: 'text', placeholder: 'np. rodzinny obiad, spotkanie biznesowe, piknik w parku', required: false, promptKey: 'SCENE_DESC' },
      { id: 'dedykacja', label: 'Dodaj napis / dedykację', type: 'text', placeholder: 'np. Kochana Mamo, Wesołych Świąt!', required: false, promptKey: 'DEDICATION' }
    ]
  },
  'prezent-na-walentynki-obraz-na-plotnie-z-twojego-zdjecia': {
    title: 'Personalizacja',
    promptTemplate: `Transform this photo of a couple into a romantic, semi-realistic digital painting illustration. The couple is elegantly dressed, posed in a close, intimate embrace, full of love and passion, but both faces are turned forward, looking toward the viewer instead of at each other. The woman wears a flowing, glamorous red gown, the man in a stylish dark suit. Surround them with large, detailed red roses and soft decorative floral elements. Add a vintage romantic poster aesthetic with a soft cream background.
{BANNER_SECTION}
Warm, soft lighting, smooth painterly skin, cinematic shading, ultra-detailed, elegant, dreamy, Valentine's Day illustration, romance novel cover art style, symmetrical composition, highly polished digital art. masterpiece, ultra detailed, soft glow, romantic fantasy, luxury illustration, glossy finish, art nouveau influence, poster design, decorative frame.`,
    fields: [
      { id: 'napis_banner', label: 'Dodaj napis, pojawi się na wstędze na obrazku', type: 'text', placeholder: 'np. Anna i Marek, zawsze razem', required: false, promptKey: 'BANNER_TEXT' }
    ]
  },
  'portret-zakochana-para-krolewska-prezent-na-walentynki-personalizowany': {
    title: 'Personalizacja',
    promptTemplate: `Transform this photo of a couple into a majestic royal fantasy illustration. The couple is portrayed as a king and queen in a passionate, elegant embrace, both clearly wearing royal crowns. The woman wears a luxurious, flowing crimson royal gown with gold embroidery and an ornate queen's crown. The man wears an ornate dark royal suit or ceremonial uniform with gold details, medals, a regal cape, and a distinguished king's crown. Surround them with rich red roses and subtle royal decorative elements. Add a grand palace-inspired background with soft glowing light, marble textures, and a romantic, fairytale atmosphere.
{BANNER_SECTION}
Cinematic lighting, soft glow, ultra-detailed, painterly, semi-realistic digital art, fantasy romance novel cover, symmetrical composition, highly polished, luxurious and dramatic.`,
    fields: [
      { id: 'napis_banner', label: 'Dodaj napis, pojawi się na wstędze na obrazku', type: 'text', placeholder: 'np. Królowie Miłości już 15 lat razem', required: false, promptKey: 'BANNER_TEXT' }
    ]
  },
  'portret-w-stylu-gta-obraz-na-plotnie-z-twojego-zdjecia-super-prezent': {
    title: 'Personalizacja',
    promptTemplate: `Transform this photo into a GTA-style cover scene with thick outlines, vibrant colors, and high-contrast shadows. Place characters close to the camera with clearly visible faces in dramatic poses wearing sunglasses, hats, or chains, surrounded by city streets, neon lights, speeding cars, palm trees, flying money, and subtle explosions, in a semi-realistic comic-book style with slightly exaggerated proportions and cinematic lighting.
{GTA_TEXT_SECTION}`,
    fields: [
      { id: 'napis_gta', label: 'Możesz dodać napis, pojawi się na dole obrazka', type: 'text', placeholder: 'np. Power Couple', required: false, promptKey: 'GTA_TEXT' }
    ]
  }
};

/** Produkty "dla niej" z polem rocznica — używają innej logiki YEARS_SECTION (character zamiast woman, explicit "no numbers" gdy puste). */
const DLA_NIEJ_WITH_YEARS = ['obraz-ze-zdjecia-karykatura-dla-niej-zainteresowania', 'obraz-ze-zdjecia-karykatura-dla-niej-policjantka', 'obraz-ze-zdjecia-karykatura-dla-niej-rolniczka', 'obraz-ze-zdjecia-karykatura-dla-niej-lekarka', 'obraz-ze-zdjecia-karykatura-dla-niej-podrozniczka', 'obraz-ze-zdjecia-karykatura-dla-niej-psycholog', 'obraz-ze-zdjecia-karykatura-dla-niej-kucharka', 'obraz-ze-zdjecia-karykatura-dla-niej-fitness', 'obraz-ze-zdjecia-karykatura-dla-niej-szefowa', 'karykatura-rolnik-ze-zdjecia-personalizowany-prezent-dla-mezczyzny', 'kulturysta-karykatura-ze-zdjecia-prezent-dla-mezczyzny', 'karykatura-wedkarz-portret-ze-zdjecia-personalizowany-prezent-dla-faceta', 'obraz-ze-zdjecia-karykatura-policjant-prezent-dla-faceta', 'portret-ze-zdjecia-dla-lekarza-personalizowany-plakat-na-urodziny-dla-chlopaka', 'prezent-ze-zdjecia-dla-budowlanca-personalizowany-obraz-dla-taty', 'prezent-z-wlasnym-zdjeciem-dla-kierowcy-tira-personalizowany-obraz', 'obraz-ze-zdjecia-prezent-dla-chlopca-pilkarz', 'active-woman-portret-ze-zdjecia-na-rocznice-dla-kolezanki-kobiety-druk-na-szkle', 'active-woman-portret-ze-zdjecia-na-18-urodziny-dla-dziewczyny-druk-na-szkle-copy', 'portret-ze-zdjecia-prezent-na-urodziny-dla-kolezanki-szefowej-salon-spa', 'portret-na-18-urodziny-dla-dziewczyny-magic-z-wlasnego-zdjecia-druk-na-szkle', 'obraz-ze-zdjecia-prezent-na-40-urodziny-dla-kobiety-czerwony-dywan', 'portret-ze-zdjecia-na-30-rocznice-dla-nauczycielki-karykatura-na-prezent'];

/** Domyślne wartości "Opis osoby" per produkt — na stałe, niezależne od tytułu. Gdy pole puste, używamy tej wartości. */
const DEFAULT_PERSONALIZATION_PER_PRODUCT = {
  'obraz-ze-zdjecia-karykatura-dla-niej-lekarka': 'lekarka, szpital, medycyna, stetoskop',
  'obraz-ze-zdjecia-karykatura-dla-niej-policjantka': 'policjantka, policja, mundur',
  'obraz-ze-zdjecia-karykatura-dla-niej-rolniczka': 'rolniczka, farmerka, wieś, rolnictwo',
  'obraz-ze-zdjecia-karykatura-dla-niej-podrozniczka': 'podróżniczka, podróże, walizka',
  'obraz-ze-zdjecia-karykatura-dla-niej-psycholog': 'psycholog, gabinet',
  'obraz-ze-zdjecia-karykatura-dla-niej-kucharka': 'kucharka, gotowanie, kuchnia',
  'obraz-ze-zdjecia-karykatura-dla-niej-fitness': 'fitness, sport, aktywność',
  'obraz-ze-zdjecia-karykatura-dla-niej-szefowa': 'szefowa sklepu spożywczego, produkty, zarządzanie',
  'active-woman-portret-ze-zdjecia-na-rocznice-dla-kolezanki-kobiety-druk-na-szkle': 'fitness, sport, aktywność fizyczna',
  'active-woman-portret-ze-zdjecia-na-18-urodziny-dla-dziewczyny-druk-na-szkle-copy': 'fitness, sport, aktywność fizyczna',
  'portret-ze-zdjecia-prezent-na-urodziny-dla-kolezanki-szefowej-salon-spa': 'salon manicure, tipsy, rzęsy',
  'portret-na-18-urodziny-dla-dziewczyny-magic-z-wlasnego-zdjecia-druk-na-szkle': 'glamorous woman, sequin dress, Hollywood red carpet, paparazzi, spotlights, champagne, black and gold luxury',
  'obraz-ze-zdjecia-prezent-na-40-urodziny-dla-kobiety-czerwony-dywan': 'glamorous woman, red carpet, elegant dress, Hollywood spotlight, birthday celebration, 40th birthday',
  'portret-ze-zdjecia-na-30-rocznice-dla-nauczycielki-karykatura-na-prezent': 'teacher, smart blazer, blackboard with chalk drawings, warm classroom, bookshelves, cozy academic atmosphere',
  'obraz-ze-zdjecia-karykatura-dla-niej-zainteresowania': 'elegant, versatile person',
  'karykatura-rolnik-ze-zdjecia-personalizowany-prezent-dla-mezczyzny': 'rolnik, farmer, wieś, rolnictwo',
  'kulturysta-karykatura-ze-zdjecia-prezent-dla-mezczyzny': 'kulturysta, bodybuilding, siłownia, mięśnie',
  'karykatura-wedkarz-portret-ze-zdjecia-personalizowany-prezent-dla-faceta': 'wędkarz, wędkarstwo, ryby, jezioro',
  'obraz-ze-zdjecia-karykatura-policjant-prezent-dla-faceta': 'policjant, policja, mundur, odznaka',
  'portret-ze-zdjecia-dla-lekarza-personalizowany-plakat-na-urodziny-dla-chlopaka': 'lekarz, biały fartuch, stetoskop, medycyna',
  'prezent-ze-zdjecia-dla-budowlanca-personalizowany-obraz-dla-taty': 'budowlaniec, murarz, majster, kask, narzędzia',
  'prezent-z-wlasnym-zdjeciem-dla-kierowcy-tira-personalizowany-obraz': 'kierowca tira, ciężarówka, droga, podróże',
  'obraz-ze-zdjecia-prezent-dla-chlopca-pilkarz': 'piłkarz, zwycięzca, football, trofeum'
};

// 🏷️ Rozbudowane nazwy rodzajów wydruku (koszyk, zamówienie) – jedno źródło prawdy
const PRODUCT_TYPE_LABELS = {
  plakat: 'Plakat – wydruk na papierze fotograficznym',
  canvas: 'Obraz na płótnie (canvas)',
  szklo: 'Wydruk na szkle',
  digital: 'Plik cyfrowy do pobrania',
  spotify_frame: 'Ramka Spotify ze zdjęciem',
  etui: 'Etui na telefon z Twoim zdjęciem'
};

class CustomifyEmbed {
  constructor() {
    this.uploadArea = document.getElementById('uploadArea');
    this.fileInput = document.getElementById('fileInput');
    this.previewArea = document.getElementById('previewArea');
    this.previewImage = document.getElementById('previewImage');
    this.stylesArea = document.getElementById('stylesArea');
    this.sizeArea = document.getElementById('sizeArea');
    this.productTypeArea = document.getElementById('productTypeArea');
    this.actionsArea = document.getElementById('actionsArea');
    this.loadingArea = document.getElementById('loadingArea');
    this.resultArea = document.getElementById('resultArea');
    this.resultImage = document.getElementById('resultImage');
    this.errorMessage = document.getElementById('errorMessage');
    this.errorMessageBottom = document.getElementById('errorMessageBottom');
    this.errorMessageTransform = document.getElementById('errorMessageTransform');
    this.successMessage = document.getElementById('successMessage');

    // 🆕 Tekst na obrazie (pilotaż)
    this.textOverlayPanel = document.getElementById('textOverlayPanel');
    this.textOverlayInput = document.getElementById('textOverlayInput');
    this.textOverlayCounter = document.getElementById('textOverlayCounter');
    this.textOverlaySaveBtn = document.getElementById('textOverlaySaveBtn');
    this.textOverlayHint = document.getElementById('textOverlayHint');
    this.textOverlayColorSelect = document.getElementById('textOverlayColorSelect');
    this.textOverlayFontSelect = document.getElementById('textOverlayFontSelect');
    this.textOverlaySizeSelect = document.getElementById('textOverlaySizeSelect');
    this.textOverlayToggleBtn = document.getElementById('textOverlayToggleBtn');
    this.textOverlayEnabled = this.isTextOverlayProduct();
    this.textOverlayState = {
      text: '',
      preset: 'classic',
      color: null,
      font: null,
      size: null,
      applied: false,
      previewUrl: null
    };
    this.textOverlayBaseImage = null; // Oryginał bez tekstu (URL z Blob)
    this.textOverlayWatermarkedUrl = null;
    this.textOverlayOriginalWatermarked = null;
    this.textOverlayDebounceTimer = null; // Timer dla debounce preview

    // 🎵 Spotify frame fields
    this.spotifyFieldsPanel = document.getElementById('spotifyFieldsPanel');
    this.spotifyTitleInput = document.getElementById('spotifyTitle');
    this.spotifyArtistInput = document.getElementById('spotifyArtist');
    this.spotifyCropModal = document.getElementById('spotifyCropModal');
    this.spotifyCropImage = document.getElementById('spotifyCropImage');
    this.spotifyCropConfirmBtn = document.getElementById('spotifyCropConfirmBtn');
    this.spotifyCropCancelBtn = document.getElementById('spotifyCropCancelBtn');
    this.spotifyCropper = null;
    this.spotifyCropSourceUrl = null;
    this.spotifyCropConfirmed = false;
    
    // 📱 Telefon - cropper
    this.phoneCropModal = document.getElementById('phoneCropModal');
    this.phoneCropImage = document.getElementById('phoneCropImage');
    this.phoneCropConfirmBtn = document.getElementById('phoneCropConfirmBtn');
    this.phoneCropCancelBtn = document.getElementById('phoneCropCancelBtn');
    this.phoneCropper = null;
    this.phoneCropSourceUrl = null;
    this.phoneCropConfirmed = false;
    this.phoneCropDataUrl = null;
    this.originalPhoneFile = null;
    
    // 📱 Telefon (etui) - osobny cropper
    this.phonePhotoCropModal = document.getElementById('phonePhotoCropModal');
    this.phonePhotoCropImage = document.getElementById('phonePhotoCropImage');
    this.phonePhotoCropConfirmBtn = document.getElementById('phonePhotoCropConfirmBtn');
    this.phonePhotoCropCancelBtn = document.getElementById('phonePhotoCropCancelBtn');
    this.phonePhotoCropper = null;
    this.phonePhotoCropSourceUrl = null;
    this.phonePhotoCropConfirmed = false;
    this.phonePhotoCropDataUrl = null;
    this.phonePhotoCropSourceIsWatermarked = false;
    this.originalPhonePhotoFile = null;
    this.selectedPhoneBrand = null;
    this.selectedPhoneModel = null;
    this.phoneModelsData = null;

    this.uploadedFile = null;
    this.selectedStyle = null;
    this.selectedSize = null;
    this.selectedProductType = 'plakat'; // Domyślny wybór: Plakat
    this.transformedImage = null;

    // 📸 Multi-upload (dodaj-osobe)
    this.multiUploadFiles = [null, null, null, null];
    this.multiUploadPreviews = [null, null, null, null];
    
    // 🎨 GLFX Filters
    this.glfxInitialized = false;
    this.originalCroppedImage = null; // Oryginał przed filtrami
    this.filterConfig = null; // Konfiguracja filtrów z API
    this.filterConfigLoading = false; // Flaga ładowania
    
    // ✅ PENDING WATERMARK UPLOAD: Dane do wysłania jeśli użytkownik zmieni stronę
    this.pendingWatermarkUpload = null; // { generationId, watermarkedImage, customerId, email }
    this.watermarkUploadInProgress = false;
    this.sizePricing = {
      plakat: {
        a4: 0,   // Domyślny rozmiar - bez dopłaty
        a3: 9,
        a2: 30,
        a0: 45,  // Nowy rozmiar 50×75 cm
        a1: 60
      },
      canvas: {
        a4: 49,
        a3: 99,
        a2: 149,
        a0: 170,  // Nowy rozmiar 50×75 cm
        a1: 199
      },
      szklo: {               // 🆕 NOWY TYP: Nadruk na szkle
        a5: 0,               // Domyślny rozmiar - bez dopłaty (A5 = ~15×21 cm)
        a4: 30               // A4 dodaje 30 zł
      },
      spotify_frame: {
        a4: 0,   // Domyślny rozmiar - bez dopłaty
        a3: 9,
        a2: 30,
        a0: 45,
        a1: 60
      },
      etui: { etui: 0 }  // 📱 Etui - jeden rozmiar, cena z produktu
    };
    
    // Ceny ramek w zależności od rozmiaru (tylko dla plakatu)
    this.framePricing = {
      a4: 29,
      a3: 45,
      a2: 65,
      a0: 75,  // Nowy rozmiar 50×75 cm
      a1: 85
    };
    
    // 🆕 Ceny podstawek (tylko dla szkła) - jedna cena dla wszystkich rozmiarów
    this.standPricing = {
      none: 0,             // Brak podstawki
      wood: 29,            // Podstawka drewniana/metalowa
      led: 44.90           // Podstawka z LED
    };
    
    this.init();

    // Udostępnij instancję globalnie do aktualizacji ceny z zewnątrz (np. wybór ramki)
    window.__customify = this;
    
    // ✅ PAGE UNLOAD PROTECTION: Obsługa zmiany/zamknięcia strony podczas upload watermarku
    this.setupPageUnloadProtection();
  }

  setupPageUnloadProtection() {
    // ✅ pagehide event - bardziej niezawodny niż beforeunload
    window.addEventListener('pagehide', (event) => {
      if (this.pendingWatermarkUpload && this.watermarkUploadInProgress) {
        console.warn('⚠️ [WATERMARK] Strona się zamyka - próbuję wysłać watermark przed zamknięciem...');
        
        // Spróbuj wysłać przez fetch z keepalive: true (kontynuuje request po zamknięciu strony)
        // ⚠️ LIMIT: keepalive ma limit ~64KB, ale spróbujemy (watermark może być większy)
        const payload = JSON.stringify({
          generationId: this.pendingWatermarkUpload.generationId,
          watermarkedImage: this.pendingWatermarkUpload.watermarkedImage,
          customerId: this.pendingWatermarkUpload.customerId,
          email: this.pendingWatermarkUpload.email
        });
        
        // Tylko jeśli payload jest mniejszy niż ~50KB (bezpieczny limit)
        if (payload.length < 50000) {
          try {
            navigator.sendBeacon(
              'https://customify-s56o.vercel.app/api/update-generation-watermark',
              new Blob([payload], { type: 'application/json' })
            );
            console.log('✅ [WATERMARK] Watermark wysłany przez sendBeacon przed zamknięciem strony');
          } catch (beaconError) {
            console.warn('⚠️ [WATERMARK] sendBeacon failed, próbuję fetch z keepalive...', beaconError);
            // Fallback: fetch z keepalive (może działać dla większych payloads)
            fetch('https://customify-s56o.vercel.app/api/update-generation-watermark', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: payload,
              keepalive: true // Kontynuuj request po zamknięciu strony
            }).catch(err => {
              console.warn('⚠️ [WATERMARK] Fetch z keepalive też nie zadziałał:', err);
            });
          }
        } else {
          console.warn('⚠️ [WATERMARK] Payload za duży dla sendBeacon/fetch keepalive (~' + Math.round(payload.length/1024) + 'KB) - watermark może nie zostać zapisany');
        }
      }
    });
  }

  /**
   * Sprawdza czy funkcja napisów jest dostępna (pilotaż na jednym produkcie)
   */
  isTextOverlayProduct() {
    return true; // włączone globalnie na wszystkich produktach
  }

  isSpotifyProduct() {
    const currentUrl = window.location.pathname.toLowerCase();
    return currentUrl.includes('ramka-spotify') || currentUrl.includes('zdjecie-na-szkle-ramka-spotify');
  }

  // ============================================================
  // CUSTOM FIELDS – pola personalizacji per produkt
  // ============================================================

  /** Zwraca handle produktu z URL (np. "obraz-ze-zdjecia-karykatura-na-50-ta-rocznice") */
  getProductHandle() {
    const parts = window.location.pathname.toLowerCase().split('/');
    const idx = parts.indexOf('products');
    return (idx !== -1 && parts[idx + 1]) ? parts[idx + 1].split('?')[0] : null;
  }

  /** Zwraca config pól dla bieżącego produktu lub null */
  getCustomFieldConfig() {
    const handle = this.getProductHandle();
    return handle ? (PRODUCT_FIELD_CONFIGS[handle] || null) : null;
  }

  /** Renderuje sekcję z polami personalizacji – wstawia przed actionsArea */
  renderCustomFields() {
    const config = this.getCustomFieldConfig();
    if (!config || !config.fields || config.fields.length === 0) return;
    if (document.getElementById('customFieldsArea')) return; // już wyrenderowane

    const actionsArea = document.getElementById('actionsArea');
    if (!actionsArea) return;

    const container = document.createElement('div');
    container.id = 'customFieldsArea';
    container.style.cssText = [
      'padding: 12px 16px',
      'margin: 8px 0 0 0',
      'border-top: 1px solid #e5e5e5',
      'border-bottom: 1px solid #e5e5e5',
      'background: #fafafa',
      'border-radius: 4px'
    ].join(';');

    // Placeholder bledszy — wstrzykuj styl (gwarantowane działanie)
    if (!document.getElementById('customify-placeholder-style')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'customify-placeholder-style';
      styleEl.textContent = '.customify-personalization-input::placeholder { color: #999 !important; opacity: 0.95 !important; }';
      document.head.appendChild(styleEl);
    }

    const title = document.createElement('h4');
    title.textContent = config.title || 'Personalizacja';
    title.style.cssText = 'margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #222;';
    container.appendChild(title);

    config.fields.forEach(field => {
      const group = document.createElement('div');
      group.style.cssText = 'margin-bottom: 10px;';

      const label = document.createElement('label');
      label.htmlFor = `customField_${field.id}`;
      label.textContent = field.label + (field.required ? ' *' : '');
      label.style.cssText = 'display: block; font-size: 13px; font-weight: 500; margin-bottom: 4px; color: #444;';
      group.appendChild(label);

      let input;
      if (field.type === 'select') {
        input = document.createElement('select');
        input.style.cssText = 'width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; background: white; cursor: pointer;';
        if (!field.required) {
          const placeholder = document.createElement('option');
          placeholder.value = '';
          placeholder.textContent = '-- wybierz --';
          input.appendChild(placeholder);
        }
        field.options.forEach(opt => {
          const option = document.createElement('option');
          option.value = opt;
          option.textContent = opt;
          if (field.defaultValue && opt === field.defaultValue) option.selected = true;
          input.appendChild(option);
        });
      } else {
        input = document.createElement('input');
        input.type = 'text';
        const ph = field.placeholder || '';
        input.placeholder = ph;
        input.dataset.placeholder = ph;
        input.className = 'customify-personalization-input';
        input.style.cssText = 'width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; box-sizing: border-box;';
        if (field.defaultValue) input.value = field.defaultValue;
        // Placeholder znika od razu przy focus (kliknięciu), wraca przy blur gdy puste
        input.addEventListener('focus', () => { input.placeholder = ''; });
        input.addEventListener('blur', () => { if (!input.value.trim()) input.placeholder = input.dataset.placeholder || ph; });
      }
      input.id = `customField_${field.id}`;
      input.dataset.fieldId = field.id;
      if (field.required) input.dataset.required = 'true';

      group.appendChild(input);
      container.appendChild(group);
    });

    actionsArea.parentNode.insertBefore(container, actionsArea);
    console.log('🎛️ [CUSTOM-FIELDS] Wyrenderowano pola personalizacji dla:', this.getProductHandle());
  }

  /**
   * Zbiera wartości pól i buduje promptAddition.
   * Rzuca Error jeśli wymagane pole jest puste.
   * Zwraca null jeśli nie ma konfiguracji dla bieżącego produktu.
   */
  collectCustomFieldsPrompt() {
    const config = this.getCustomFieldConfig();
    if (!config) return null;

    const missingLabels = [];
    config.fields.forEach(field => {
      const el = document.getElementById(`customField_${field.id}`);
      const value = el ? el.value.trim() : '';
      if (field.required && !value) missingLabels.push(field.label);
    });
    if (missingLabels.length > 0) {
      throw new Error(`Uzupełnij wymagane pola: ${missingLabels.join(', ')}`);
    }

    // Tryb szablonu: jeden prompt z placeholderami {YEARS}, {NAMES}, {SCENE_TYPE}, {NAMES_SECTION}
    if (config.promptTemplate) {
      const replacements = {};
      config.fields.forEach(field => {
        if (!field.promptKey) return;
        const el = document.getElementById(`customField_${field.id}`);
        let value = el ? el.value.trim() : '';
        if (field.promptKey === 'SCENE_TYPE' && !value) value = 'anniversary';
        if (field.promptKey === 'CHARACTER_DESC' && !value) value = 'Elegant, romantic, celebratory mood.';
        if (field.promptKey === 'personalization' && !value) {
          const handle = this.getProductHandle();
          value = (handle && DEFAULT_PERSONALIZATION_PER_PRODUCT[handle]) || 'elegant, versatile person';
        }
        replacements[field.promptKey] = value;
      });
      // {NAMES_SECTION} — warunkowy blok: gdy NAMES puste = ZERO tekstu na obrazku, gdy wypełnione = tabliczka
      if (config.promptTemplate.includes('{NAMES_SECTION}')) {
        const namesVal = replacements['NAMES'] || '';
        replacements['NAMES_SECTION'] = namesVal.trim()
          ? `Render this EXACT text on a golden plaque at the base:\n"${namesVal.trim()}"\nCRITICAL for names: use exact Polish characters — ą, ć, ę, ł, ń, ó, ś, ź, ż (uppercase: Ą, Ć, Ę, Ł, Ń, Ó, Ś, Ź, Ż). Do NOT replace with a, c, e, l, n, o, s, z. Copy every letter exactly as provided. Do NOT show reflections of the text on any surface. Text appears only on the plaque.`
          : 'Do NOT add any text, plaque, inscription, or written text to the image. No names, no letters, no words. The image must be completely free of any text.';
      }
      // {YEARS_SECTION} — warunkowy blok: gdy YEARS puste = brak liczby, gdy wypełnione = postać na dużej złotej cyfrze
      if (config.promptTemplate.includes('{YEARS_SECTION}')) {
        const yearsVal = replacements['YEARS'] || '';
        const handle = this.getProductHandle();
        const isDlaNiejWithYears = handle && DLA_NIEJ_WITH_YEARS.includes(handle);
        if (yearsVal.trim()) {
          replacements['YEARS_SECTION'] = isDlaNiejWithYears
            ? `The character is sitting/standing on or near a large 3D number "${yearsVal.trim()}" — the number's style, color and materials must match the character's profession/hobby theme (e.g. medical blue for nurse, police colors for officer, warm tones for chef). Do NOT use generic metallic gold — adapt to the scene.`
            : `The woman is sitting on a large metallic gold 3D number "${yearsVal.trim()}" on a business party podium.`;
        } else {
          // Gdy puste: NIE dodajemy instrukcji o 3D number — model nie doda losowej liczby. Nie zakazujemy liczb w ogóle (mogą być w imieniu/dedykacji).
          replacements['YEARS_SECTION'] = isDlaNiejWithYears
            ? 'The character stands on a podium.'
            : 'The woman is sitting elegantly on a business party podium.';
        }
      }
      // {NAME_SECTION} — warunkowy blok dla pola "name": gdy puste = ZERO tekstu na obrazku, gdy wypełnione = tabliczka lub napis w stylu superbohatera
      if (config.promptTemplate.includes('{NAME_SECTION}')) {
        const nameVal = replacements['name'] || '';
        const handle = this.getProductHandle();
        const isSuperheroBoy = handle === 'portret-ze-zdjecia-superbohater-prezent-dla-chlopca';
        replacements['NAME_SECTION'] = nameVal.trim()
          ? (isSuperheroBoy
              ? `Add large bold cinematic title text at the bottom of the image, in the style of superhero movie posters (dramatic, heroic font, bold outlines, high contrast). The text must read exactly: "${nameVal.trim()}". CRITICAL: use exact Polish characters — ą, ć, ę, ł, ń, ó, ś, ź, ż (uppercase: Ą, Ć, Ę, Ł, Ń, Ó, Ś, Ź, Ż). Do NOT replace letters. The text should feel like a movie title from a superhero film.`
              : `Render this EXACT text on a plaque at the base:\n"${nameVal.trim()}"\nCRITICAL for names: use exact Polish characters — ą, ć, ę, ł, ń, ó, ś, ź, ż (uppercase: Ą, Ć, Ę, Ł, Ń, Ó, Ś, Ź, Ż). Do NOT replace letters.`)
          : 'Do NOT add any text, plaque, inscription, or written text to the image. No names, no letters, no words. The image must be completely free of any text.';
      }
      // {SCENE_DESC_SECTION} — warunkowy blok dla opisu sceny: gdy puste = brak instrukcji, gdy wypełnione = opis kontekstu
      if (config.promptTemplate.includes('{SCENE_DESC_SECTION}')) {
        const sceneVal = replacements['SCENE_DESC'] || '';
        replacements['SCENE_DESC_SECTION'] = sceneVal.trim()
          ? `SCENE CONTEXT: The setting and mood of the photo should reflect: ${sceneVal.trim()}. Adapt the environment, clothing style, lighting and background to match this context naturally.`
          : 'SCENE CONTEXT: Warm, cozy family-style portrait. The mood should feel like a cherished family photo meant to hang on a wall — intimate, heartfelt, with soft warm lighting and a natural, homey background.';
      }
      // {DEDICATION_SECTION} — warunkowy blok dla dedykacji: gdy puste = ZERO tekstu, gdy wypełnione = ozdobny napis
      if (config.promptTemplate.includes('{DEDICATION_SECTION}')) {
        const dedVal = replacements['DEDICATION'] || '';
        replacements['DEDICATION_SECTION'] = dedVal.trim()
          ? `TEXT / DEDICATION:\nAt the bottom of the image, add a beautiful, decorative text inscription that fits the overall composition and color palette. The text reads:\n"${dedVal.trim()}"\nThe font style should be elegant and harmonious with the scene. CRITICAL: use exact Polish characters — ą, ć, ę, ł, ń, ó, ś, ź, ż (uppercase: Ą, Ć, Ę, Ł, Ń, Ó, Ś, Ź, Ż). Do NOT replace with a, c, e, l, n, o, s, z. Copy every letter exactly as provided.`
          : 'Do NOT add any text, inscription, caption, watermark, or written words to the image. The image must be completely free of any text.';
      }
      // {BANNER_SECTION} — Love Rose / Royal Love: gdy puste = brak wstęgi/napisu, gdy wypełnione = wstęga z tekstem
      // Royal Love: napis na DOLE (więcej tekstu się zmieści), Love Rose: na górze
      if (config.promptTemplate.includes('{BANNER_SECTION}')) {
        const bannerVal = replacements['BANNER_TEXT'] || '';
        const bannerPlace = this.isRoyalLoveProduct() ? 'placed at the bottom of the composition' : 'placed at the top of the composition';
        replacements['BANNER_SECTION'] = bannerVal.trim()
          ? `Add a classic ribbon/ornamental banner that says "${bannerVal.trim()}" ${bannerPlace}. CRITICAL for the banner text: use exact Polish characters — ą, ć, ę, ł, ń, ó, ś, ź, ż (uppercase: Ą, Ć, Ę, Ł, Ń, Ó, Ś, Ź, Ż). Do NOT replace with a, c, e, l, n, o, s, z. Copy every letter exactly as provided.`
          : 'Do NOT add any banner, ribbon, text, inscription, or written words to the image. No banner, no text at all. The image must be completely free of any banner or written text.';
      }
      // {GTA_TEXT_SECTION} — GTA: gdy puste = brak napisu, gdy wypełnione = napis na dole w stylu GTA
      if (config.promptTemplate.includes('{GTA_TEXT_SECTION}')) {
        const gtaVal = replacements['GTA_TEXT'] || '';
        replacements['GTA_TEXT_SECTION'] = gtaVal.trim()
          ? `At the bottom of the image, add the following text in bold GTA-style comic-book font, matching the vibrant game cover aesthetic with thick outlines and high contrast: "${gtaVal.trim()}". CRITICAL: use exact Polish characters — ą, ć, ę, ł, ń, ó, ś, ź, ż (uppercase: Ą, Ć, Ę, Ł, Ń, Ó, Ś, Ź, Ż). Do NOT replace with a, c, e, l, n, o, s, z. Copy every letter exactly as provided. Keep the GTA visual style throughout.`
          : 'Do NOT add any text, caption, or written words to the image. No text at all. The image must be completely free of any text.';
      }
      let prompt = config.promptTemplate;
      Object.keys(replacements).forEach(key => {
        prompt = prompt.replaceAll(`{${key}}`, replacements[key]);
      });
      return prompt.trim() || null;
    }

    // Tryb fraz: każdy pole dokleja promptPhrase z {{value}}
    const phrases = [];
    config.fields.forEach(field => {
      const el = document.getElementById(`customField_${field.id}`);
      const value = el ? el.value.trim() : '';
      if (value && field.promptPhrase) {
        phrases.push(field.promptPhrase.replaceAll('{{value}}', value));
      }
    });
    if (phrases.length === 0) return null;
    return phrases.join(' ');
  }

  isCropperProduct() {
    return this.isSpotifyProduct() || this.isPhoneCaseProduct() || this.isPhonePhotoCaseProduct();
  }

  // 🎵 Produkt Spotify BEZ generacji AI - od razu do koszyka po kadrowanie
  isSpotifyNoAIProduct() {
    const currentUrl = window.location.pathname.toLowerCase();
    return currentUrl.includes('zdjecie-na-szkle-ramka-spotify');
  }

  // 📱 Produkt telefon
  isPhoneCaseProduct() {
    const currentUrl = window.location.pathname.toLowerCase();
    const isPhone = currentUrl.includes('personalizowane-etui-na-telefon-z-twoim-zdjeciem-karykatura');
    console.log('📱 [DEBUG] isPhoneCaseProduct:', { currentUrl, isPhone });
    return isPhone;
  }
  
  // 📱 Produkt etui (zdjęcie) - osobny cropper
  isPhonePhotoCaseProduct() {
    const currentUrl = window.location.pathname.toLowerCase();
    return currentUrl.includes('personalizowane-etui-na-telefon-z-twoim-zdjeciem') &&
      !currentUrl.includes('personalizowane-etui-na-telefon-z-twoim-zdjeciem-karykatura');
  }

  // 📸 Produkt multi-upload (dodaj osobę do zdjęcia)
  isMultiUploadProduct() {
    const h = this.getProductHandle();
    return h === 'dodaj-osobe-do-zdjecia-naturalny-efekt-obraz-plakat-wydruk';
  }

  setupMultiUpload() {
    if (!this.isMultiUploadProduct()) return;
    const grid = document.querySelector('.multi-upload-grid');
    if (!grid) return;
    grid.querySelectorAll('.multi-upload-slot').forEach((slot, idx) => {
      const input = slot.querySelector('.multi-slot-input');
      const placeholder = slot.querySelector('.multi-slot-placeholder');
      const removeBtn = slot.querySelector('.multi-slot-remove');
      if (placeholder) {
        placeholder.addEventListener('click', () => input && input.click());
      }
      if (input) {
        input.addEventListener('change', (e) => {
          if (e.target.files && e.target.files[0]) {
            this.handleMultiFileSelect(e.target.files[0], idx);
          }
        });
      }
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removeMultiFile(idx);
        });
      }
    });
    console.log('📸 [MULTI-UPLOAD] Setup complete, 4 slots ready');
  }

  handleMultiFileSelect(file, slotIndex) {
    if (!file || !file.type.startsWith('image/')) {
      this.showError('Wybierz plik graficzny (JPG, PNG)', 'upload');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.showError('Plik jest za duży (max 10MB)', 'upload');
      return;
    }
    this.multiUploadFiles[slotIndex] = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.multiUploadPreviews[slotIndex] = e.target.result;
      const slot = document.querySelectorAll('.multi-upload-slot')[slotIndex];
      if (slot) {
        const preview = slot.querySelector('.multi-slot-preview');
        const placeholder = slot.querySelector('.multi-slot-placeholder');
        const removeBtn = slot.querySelector('.multi-slot-remove');
        if (preview) {
          preview.style.backgroundImage = `url(${e.target.result})`;
          preview.style.display = 'block';
        }
        if (placeholder) placeholder.style.display = 'none';
        if (removeBtn) removeBtn.style.display = 'flex';
      }
      this.updateMultiUploadCounter();
      if (!this.uploadedFile) {
        this.uploadedFile = file;
      }
    };
    reader.readAsDataURL(file);
  }

  removeMultiFile(slotIndex) {
    this.multiUploadFiles[slotIndex] = null;
    this.multiUploadPreviews[slotIndex] = null;
    const slot = document.querySelectorAll('.multi-upload-slot')[slotIndex];
    if (slot) {
      const preview = slot.querySelector('.multi-slot-preview');
      const placeholder = slot.querySelector('.multi-slot-placeholder');
      const removeBtn = slot.querySelector('.multi-slot-remove');
      const input = slot.querySelector('.multi-slot-input');
      if (preview) { preview.style.backgroundImage = ''; preview.style.display = 'none'; }
      if (placeholder) placeholder.style.display = 'flex';
      if (removeBtn) removeBtn.style.display = 'none';
      if (input) input.value = '';
    }
    this.updateMultiUploadCounter();
    const remaining = this.getMultiUploadFiles();
    if (remaining.length === 0) this.uploadedFile = null;
    else this.uploadedFile = remaining[0];
  }

  updateMultiUploadCounter() {
    const counter = document.getElementById('multiUploadCount');
    if (counter) {
      const count = this.multiUploadFiles.filter(f => f !== null).length;
      counter.textContent = count;
    }
  }

  getMultiUploadFiles() {
    return this.multiUploadFiles.filter(f => f !== null);
  }

  // 💝 Produkty "dla niej" + Biznes Woman — jeden styl (caricature-new), bez wyboru, generacja bez klikania w miniaturkę
  isDlaNiejProduct() {
    const h = this.getProductHandle();
    return h === 'obraz-ze-zdjecia-karykatura-dla-niej-zainteresowania' || h === 'obraz-ze-zdjecia-karykatura-dla-niej-policjantka' || h === 'obraz-ze-zdjecia-karykatura-dla-niej-rolniczka' || h === 'obraz-ze-zdjecia-karykatura-dla-niej-lekarka' || h === 'obraz-ze-zdjecia-karykatura-dla-niej-podrozniczka' || h === 'obraz-ze-zdjecia-karykatura-dla-niej-psycholog' || h === 'obraz-ze-zdjecia-karykatura-dla-niej-kucharka' || h === 'obraz-ze-zdjecia-karykatura-dla-niej-fitness' || h === 'obraz-ze-zdjecia-karykatura-dla-niej-szefowa' || h === 'karykatura-rolnik-ze-zdjecia-personalizowany-prezent-dla-mezczyzny' || h === 'kulturysta-karykatura-ze-zdjecia-prezent-dla-mezczyzny' || h === 'karykatura-wedkarz-portret-ze-zdjecia-personalizowany-prezent-dla-faceta' || h === 'obraz-ze-zdjecia-karykatura-policjant-prezent-dla-faceta' || h === 'portret-ze-zdjecia-dla-lekarza-personalizowany-plakat-na-urodziny-dla-chlopaka' || h === 'prezent-ze-zdjecia-dla-budowlanca-personalizowany-obraz-dla-taty' || h === 'prezent-z-wlasnym-zdjeciem-dla-kierowcy-tira-personalizowany-obraz' || h === 'obraz-ze-zdjecia-prezent-dla-chlopca-pilkarz' || h === 'active-woman-portret-ze-zdjecia-na-rocznice-dla-kolezanki-kobiety-druk-na-szkle' || h === 'active-woman-portret-ze-zdjecia-na-18-urodziny-dla-dziewczyny-druk-na-szkle-copy' || h === 'portret-ze-zdjecia-prezent-na-urodziny-dla-kolezanki-szefowej-salon-spa' || h === 'portret-na-18-urodziny-dla-dziewczyny-magic-z-wlasnego-zdjecia-druk-na-szkle' || h === 'obraz-ze-zdjecia-prezent-na-40-urodziny-dla-kobiety-czerwony-dywan' || h === 'portret-ze-zdjecia-na-30-rocznice-dla-nauczycielki-karykatura-na-prezent' || h === 'obraz-ze-zdjecia-biznes-woman-personalizowany-prezent' || h === 'obraz-ze-zdjecia-prezent-na-30-urodziny-dla-kobiety-biznes-woman' || h === 'obraz-ze-zdjecia-prezent-na-50-urodziny-dla-kobiety-biznes-woman' || h === 'wydruk-na-szkle-biznes-woman-prezent-na-urodziny-dla-kobiety';
  }

  // 🦸 Produkt Superbohater dla chłopca — Nano Banana, ukryty wybór, pole imienia
  isSuperheroBoyProduct() {
    return this.getProductHandle() === 'portret-ze-zdjecia-superbohater-prezent-dla-chlopca';
  }

  // 🌹 Produkt Love Rose — jeden styl (love-rose), ukryty wybór, pole na napis zastępujący LOVE
  isLoveRoseProduct() {
    return this.getProductHandle() === 'prezent-na-walentynki-obraz-na-plotnie-z-twojego-zdjecia';
  }

  // 💕 Produkt Royal Love — jeden styl (royal-love), ukryty wybór, pole na napis zastępujący Neverending Love
  isRoyalLoveProduct() {
    return this.getProductHandle() === 'portret-zakochana-para-krolewska-prezent-na-walentynki-personalizowany';
  }

  // 🎮 Produkt GTA — jeden styl (gta), ukryty wybór, pole na napis na dole obrazka
  isGTAProduct() {
    return this.getProductHandle() === 'portret-w-stylu-gta-obraz-na-plotnie-z-twojego-zdjecia-super-prezent';
  }

  // 📷 Produkt Retusz starych zdjęć (prezent dla dziadków) — FLUX Kontext Restore
  isRetuszStarychZdjecProduct() {
    return this.getProductHandle() === 'prezent-dla-dziadkow-retusz-starych-zdjec';
  }

  getCropConfig() {
    return { aspectRatio: 1, width: 1024, height: 1024, filePrefix: 'spotify-crop' };
  }

  getPhoneCropConfig() {
    return { aspectRatio: 2 / 1, width: 2048, height: 1024, filePrefix: 'phone-crop' };
  }
  
  getPhonePhotoCropConfig() {
    return { aspectRatio: 1 / 2, width: 1000, height: 2000, filePrefix: 'phone-photo-crop' };
  }

  /** 📱 TYLKO etui: Inicjalizacja selektorów marka/model */
  async setupPhoneSelectors() {
    const slot = document.getElementById('phone-selectors-slot');
    if (!slot || !this.isPhonePhotoCaseProduct()) return;

    this.selectedPhoneBrand = null;
    this.selectedPhoneModel = null;
    this.phoneModelsData = null;

    try {
      const res = await fetch('https://customify-s56o.vercel.app/api/phone-models');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      this.phoneModelsData = await res.json();
    } catch (err) {
      console.error('❌ [PHONE] Nie można załadować listy modeli:', err);
      slot.innerHTML = '<p class="customify-error">Nie można załadować listy modeli. Odśwież stronę.</p>';
      return;
    }

    const brands = this.phoneModelsData.brands || [];
    const modelsByBrand = this.phoneModelsData.models || {};
    if (brands.length === 0) {
      slot.innerHTML = '<p class="customify-error">Brak listy marek.</p>';
      return;
    }

    const wrap = document.createElement('div');
    wrap.className = 'phone-selectors-wrap';

    const brandField = document.createElement('div');
    brandField.className = 'phone-selector-field';
    const brandLabel = document.createElement('label');
    brandLabel.htmlFor = 'phoneBrandSelect';
    brandLabel.textContent = 'Wybierz markę telefonu';
    brandField.appendChild(brandLabel);
    const brandSelect = document.createElement('select');
    brandSelect.id = 'phoneBrandSelect';
    brandSelect.className = 'phone-selector-select';
    const brandOpt0 = document.createElement('option');
    brandOpt0.value = '';
    brandOpt0.textContent = 'Wybierz markę';
    brandSelect.appendChild(brandOpt0);
    brands.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.name;
      brandSelect.appendChild(opt);
    });
    brandField.appendChild(brandSelect);
    wrap.appendChild(brandField);

    const modelField = document.createElement('div');
    modelField.className = 'phone-selector-field';
    const modelLabel = document.createElement('label');
    modelLabel.htmlFor = 'phoneModelSelect';
    modelLabel.textContent = 'Wybierz model telefonu';
    modelField.appendChild(modelLabel);
    const modelSelect = document.createElement('select');
    modelSelect.id = 'phoneModelSelect';
    modelSelect.className = 'phone-selector-select';
    modelSelect.disabled = true;
    const modelOpt0 = document.createElement('option');
    modelOpt0.value = '';
    modelOpt0.textContent = 'Najpierw wybierz markę';
    modelSelect.appendChild(modelOpt0);
    modelField.appendChild(modelSelect);
    wrap.appendChild(modelField);

    const populateModels = (brandId) => {
      modelSelect.innerHTML = '';
      const models = modelsByBrand[brandId] || [];
      if (!brandId || models.length === 0) {
        const ph = document.createElement('option');
        ph.value = '';
        ph.textContent = 'Najpierw wybierz markę';
        modelSelect.appendChild(ph);
        modelSelect.disabled = true;
        this.selectedPhoneModel = null;
        return;
      }
      const def = document.createElement('option');
      def.value = '';
      def.textContent = 'Wybierz model';
      modelSelect.appendChild(def);
      models.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name;
        modelSelect.appendChild(opt);
      });
      modelSelect.disabled = false;
    };

    brandSelect.addEventListener('change', () => {
      this.selectedPhoneBrand = brandSelect.value || null;
      this.selectedPhoneModel = null;
      populateModels(this.selectedPhoneBrand);
      this.hideError();
    });

    modelSelect.addEventListener('change', () => {
      this.selectedPhoneModel = modelSelect.value || null;
      if (this.selectedPhoneModel) this.hideError();
    });

    populateModels(null);
    slot.innerHTML = '';
    slot.appendChild(wrap);
    console.log('📱 [PHONE] Selektory marka/model zainicjalizowane');
  }

  getPhoneBrandLabel() {
    if (!this.selectedPhoneBrand || !this.phoneModelsData?.brands) return null;
    const b = this.phoneModelsData.brands.find(x => x.id === this.selectedPhoneBrand);
    return b ? b.name : this.selectedPhoneBrand;
  }

  getPhoneModelLabel() {
    if (!this.selectedPhoneBrand || !this.selectedPhoneModel || !this.phoneModelsData?.models) return null;
    const models = this.phoneModelsData.models[this.selectedPhoneBrand] || [];
    const m = models.find(x => x.id === this.selectedPhoneModel);
    return m ? m.name : this.selectedPhoneModel;
  }

  init() {
    if (!document.getElementById('uploadArea')) {
      return; // Jeśli nie ma elementów, nie rób nic
    }
    
    // ✅ STATS: Wyświetlenie strony produktu (każda odsłona = 1)
    try {
      const productPath = window.location.pathname || '';
      fetch('https://customify-s56o.vercel.app/api/admin/login-modal-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'login_modal_page_entry',
          productUrl: productPath,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {});
    } catch (_) {}
    
    this.setupEventListeners();
    this.setupMultiUpload(); // 📸 Multi-upload slots (jeśli produkt je obsługuje)
    this.positionApp();
    this.showStyles(); // Pokaż style od razu
    this.renderCustomFields(); // Pola personalizacji (jeśli produkt je obsługuje)
    // filterStylesForProduct() USUNIĘTE - logika przeniesiona na server-side (Shopify Liquid)
    
    // Setup expandable description USUNIĘTE - opisy produktów są teraz pełne
    
    // Setup accordion for product details - BEZ setTimeout!
    this.setupAccordion();
    
    // ✅ USAGE LIMITS: Pokaż licznik użyć
    console.log('🔍 [INIT] Calling showUsageCounter()...');
    this.showUsageCounter().catch(error => {
      console.error('❌ [INIT] Error in showUsageCounter:', error);
    });
    
    // 🎨 GALERIA: Załaduj galerię przy starcie (jeśli są zapisane generacje)
    console.log('🎨 [GALLERY] Calling updateGallery from init()');
    this.updateGallery().catch(error => {
      console.error('❌ [GALLERY] Error updating gallery on init:', error);
    });
    
    // 💰 CENA: Ustaw domyślny rozmiar i aktualizuj cenę
    this.initializeDefaultPrice();

    // 🎯 SYNC: Zsynchronizuj początkowy typ produktu i rozmiar z aktywnymi przyciskami w DOM
    try {
      // ✅ Dla WSZYSTKICH produktów: użyj domyślnego z HTML (Plakat)
      const activeTypeBtn = document.querySelector('.customify-product-type-btn.active');
      if (activeTypeBtn && activeTypeBtn.dataset.productType) {
        this.selectedProductType = activeTypeBtn.dataset.productType;
        console.log('🔄 [INIT] Synced selectedProductType from DOM:', this.selectedProductType);
      }
      const activeSizeBtn = document.querySelector('.customify-size-btn.active');
      if (activeSizeBtn && activeSizeBtn.dataset.size) {
        this.selectedSize = activeSizeBtn.dataset.size;
        console.log('🔄 [INIT] Synced selectedSize from DOM:', this.selectedSize);
      }
    } catch(e) {
      console.warn('⚠️ [INIT] Failed to sync initial selections from DOM:', e);
    }

    if (this.isSpotifyProduct()) {
      const szkloBtn = document.querySelector('.customify-product-type-btn[data-product-type="szklo"]');
      if (szkloBtn) {
        this.productTypeArea?.querySelectorAll('.customify-product-type-btn').forEach(btn => btn.classList.remove('active'));
        szkloBtn.classList.add('active');
        this.selectedProductType = 'szklo';
        console.log('🎵 [SPOTIFY] Ustawiam selectedProductType = szklo');
      }
      // 🎵 Ustaw domyślny rozmiar A5 (najtańszy) dla produktów Spotify
      const a5Btn = document.querySelector('.customify-size-btn[data-size="a5"]');
      if (a5Btn) {
        this.sizeArea?.querySelectorAll('.customify-size-btn').forEach(btn => btn.classList.remove('active'));
        a5Btn.classList.add('active');
        this.selectedSize = 'a5';
        console.log('🎵 [SPOTIFY] Ustawiam domyślny rozmiar = a5 (15×21)');
      }
    }
    // 🎯 Rocznica 50-ta / Dla niej: domyślnie wydruk na szkle + rozmiar A5
    if (this.getProductHandle() === 'obraz-ze-zdjecia-pary-na-50-ta-rocznice-wydruk-na-szkle' || this.getProductHandle() === 'obraz-ze-zdjecia-karykatura-na-50-ta-rocznice' || this.getProductHandle() === 'obraz-ze-zdjecia-karykatura-dla-niej-zainteresowania' || this.getProductHandle() === 'obraz-ze-zdjecia-karykatura-dla-niej-policjantka' || this.getProductHandle() === 'obraz-ze-zdjecia-karykatura-dla-niej-rolniczka' || this.getProductHandle() === 'obraz-ze-zdjecia-karykatura-dla-niej-lekarka' || this.getProductHandle() === 'obraz-ze-zdjecia-karykatura-dla-niej-podrozniczka' || this.getProductHandle() === 'obraz-ze-zdjecia-karykatura-dla-niej-psycholog' || this.getProductHandle() === 'obraz-ze-zdjecia-karykatura-dla-niej-kucharka' || this.getProductHandle() === 'obraz-ze-zdjecia-karykatura-dla-niej-fitness' || this.getProductHandle() === 'obraz-ze-zdjecia-karykatura-dla-niej-szefowa' || this.getProductHandle() === 'karykatura-rolnik-ze-zdjecia-personalizowany-prezent-dla-mezczyzny' || this.getProductHandle() === 'kulturysta-karykatura-ze-zdjecia-prezent-dla-mezczyzny' || this.getProductHandle() === 'karykatura-wedkarz-portret-ze-zdjecia-personalizowany-prezent-dla-faceta' || this.getProductHandle() === 'obraz-ze-zdjecia-karykatura-policjant-prezent-dla-faceta' || this.getProductHandle() === 'portret-ze-zdjecia-dla-lekarza-personalizowany-plakat-na-urodziny-dla-chlopaka' || this.getProductHandle() === 'prezent-ze-zdjecia-dla-budowlanca-personalizowany-obraz-dla-taty' || this.getProductHandle() === 'prezent-z-wlasnym-zdjeciem-dla-kierowcy-tira-personalizowany-obraz' || this.getProductHandle() === 'obraz-ze-zdjecia-prezent-dla-chlopca-pilkarz' || this.getProductHandle() === 'active-woman-portret-ze-zdjecia-na-rocznice-dla-kolezanki-kobiety-druk-na-szkle' || this.getProductHandle() === 'active-woman-portret-ze-zdjecia-na-18-urodziny-dla-dziewczyny-druk-na-szkle-copy' || this.getProductHandle() === 'portret-ze-zdjecia-prezent-na-urodziny-dla-kolezanki-szefowej-salon-spa' || this.getProductHandle() === 'portret-na-18-urodziny-dla-dziewczyny-magic-z-wlasnego-zdjecia-druk-na-szkle' || this.getProductHandle() === 'obraz-ze-zdjecia-prezent-na-40-urodziny-dla-kobiety-czerwony-dywan' || this.getProductHandle() === 'portret-ze-zdjecia-na-30-rocznice-dla-nauczycielki-karykatura-na-prezent' || this.getProductHandle() === 'obraz-ze-zdjecia-prezent-na-50-urodziny-dla-kobiety-biznes-woman' || this.getProductHandle() === 'wydruk-na-szkle-biznes-woman-prezent-na-urodziny-dla-kobiety') {
      const szkloBtn = document.querySelector('.customify-product-type-btn[data-product-type="szklo"]');
      if (szkloBtn) {
        this.productTypeArea?.querySelectorAll('.customify-product-type-btn').forEach(btn => btn.classList.remove('active'));
        szkloBtn.classList.add('active');
        this.selectedProductType = 'szklo';
      }
      const a5Btn = document.querySelector('.customify-size-btn[data-size="a5"]');
      if (a5Btn) {
        this.sizeArea?.querySelectorAll('.customify-size-btn').forEach(btn => btn.classList.remove('active'));
        a5Btn.classList.add('active');
        this.selectedSize = 'a5';
        console.log('🎯 [ROCZnica] Domyślnie: wydruk na szkle, rozmiar A5');
      }
    }
    this.updateSpotifyFrameScale();
    window.addEventListener('resize', () => this.updateSpotifyFrameScale());

    // Zaktualizuj dostępność rozmiarów po początkowej synchronizacji
    this.updateSizeAvailability();

    // Po synchronizacji wymuś przeliczenie cen (uwzględnia ramkę, jeśli plakat)
    this.updateProductPrice();
    this.updateCartPrice();

    // 📱 Phone case: Hide main cart price (phone case has its own price display)
    if (this.isPhonePhotoCaseProduct && this.isPhonePhotoCaseProduct()) {
      const cartPriceDisplay = document.getElementById('cartPriceDisplay');
      if (cartPriceDisplay) cartPriceDisplay.style.display = 'none';
      const phoneCaseCartPriceDisplay = document.getElementById('phoneCaseCartPriceDisplay');
      if (phoneCaseCartPriceDisplay) phoneCaseCartPriceDisplay.style.setProperty('display','none','important');
      const phoneCaseCartActions = document.getElementById('phoneCaseCartActions');
      if (phoneCaseCartActions) phoneCaseCartActions.style.setProperty('display','none','important');
      this.setupPhoneSelectors().catch(err => console.error('❌ [PHONE] setupPhoneSelectors error:', err));
    }

    // 🆕 Inicjalizacja napisów (pilotaż)
    this.setupTextOverlayUI();
  }
  

  // ===== USAGE LIMITS FUNCTIONS =====
  
  /**
   * Pobiera informacje o zalogowanym użytkowniku Shopify
   * @returns {Object|null} {customerId, email, customerAccessToken} lub null jeśli niezalogowany
   */
  getCustomerInfo() {
    // ⚠️ KRYTYCZNE: Jeśli Shopify Liquid mówi że użytkownik NIE jest zalogowany,
    // to NIE sprawdzaj fallbacków - po prostu zwróć null
    // Sprawdź czy window.ShopifyCustomer istnieje i ma wartość (nie null, nie undefined, nie false)
    if (!window.ShopifyCustomer || window.ShopifyCustomer === null) {
      console.log('👤 [CUSTOMER DETECT] Shopify Customer is null/undefined/falsy - user not logged in, returning null');
      console.log('👤 [CUSTOMER DETECT] window.ShopifyCustomer value:', window.ShopifyCustomer);
      return null;
    }
    
    if (!window.__customifyCustomerDebugLogged) {
      try {
        console.log('🔍 [CUSTOMER DETECT] Debug sources:', {
          ShopifyCustomer: window.ShopifyCustomer || null,
          ShopifyAnalytics: window.ShopifyAnalytics?.meta || null,
          meta: window.meta || null,
          __st: window.__st || null,
          localStorageId: (() => {
            try {
              return localStorage.getItem('customify_last_customer_id');
            } catch (e) {
              return 'unavailable';
            }
          })(),
          cookies: document.cookie
        });
      } catch (e) {
        console.warn('⚠️ [CUSTOMER DETECT] Debug logging failed:', e);
      }
      window.__customifyCustomerDebugLogged = true;
    }
    
    const sanitizeId = (value) => {
      if (value === null || value === undefined) {
        return null;
      }
      if (typeof value === 'object' && value.id) {
        return sanitizeId(value.id);
      }
      const idStr = String(value).trim();
      if (!idStr || idStr.toLowerCase() === 'null' || idStr.toLowerCase() === 'undefined') {
        return null;
      }
      return idStr;
    };
    
    const sanitizeEmail = (value) => {
      if (!value) {
        return null;
      }
      const emailStr = String(value).trim();
      if (!emailStr || emailStr.toLowerCase() === 'null' || emailStr.toLowerCase() === 'undefined') {
        return null;
      }
      return emailStr;
    };
    
    const getStoredValue = (key) => {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    };
    
    const persistCustomerContext = (info, source) => {
      if (!info || !info.customerId) {
        return null;
      }
      try {
        localStorage.setItem('customify_last_customer_id', info.customerId);
        if (info.email) {
          localStorage.setItem('customify_last_customer_email', info.email);
        }
      } catch (e) {
        // Ignore storage errors (Safari private mode etc.)
      }
      if (source) {
        // ⚠️ DEBUG: Sprawdź czy window.ShopifyCustomer jest null przed logowaniem
        if (window.ShopifyCustomer === null) {
          console.warn(`⚠️ [CUSTOMER DETECT] BŁĄD: Próba użycia ${source} gdy window.ShopifyCustomer === null!`);
          console.warn(`⚠️ [CUSTOMER DETECT] window.ShopifyCustomer:`, window.ShopifyCustomer);
          console.warn(`⚠️ [CUSTOMER DETECT] Zwracam null zamiast info z ${source}`);
          return null; // ⚠️ ZWRÓĆ NULL jeśli window.ShopifyCustomer jest null!
        }
        console.log(`✅ [CUSTOMER DETECT] Zidentyfikowano klienta (${source}):`, info.customerId);
      }
      return info;
    };
    const buildCustomerInfo = (idCandidate, emailCandidate, source) => {
      // ⚠️ KRYTYCZNE: Jeśli window.ShopifyCustomer jest null, NIE buduj customerInfo z fallbacków
      if (window.ShopifyCustomer === null || window.ShopifyCustomer === undefined) {
        console.warn(`⚠️ [CUSTOMER DETECT] buildCustomerInfo zablokowane - window.ShopifyCustomer jest null/undefined (source: ${source})`);
        return null;
      }
      
      const customerId = sanitizeId(idCandidate);
      if (!customerId) {
        return null;
      }
      const fallbackEmail = sanitizeEmail(emailCandidate) ||
        sanitizeEmail(getStoredValue('customify_last_customer_email')) ||
        'no-email@shopify.com';
      return persistCustomerContext({
        customerId,
        email: fallbackEmail,
        firstName: window.ShopifyCustomer?.firstName || '',
        lastName: window.ShopifyCustomer?.lastName || '',
        customerAccessToken: 'oauth_session'
      }, source);
    };
    const getShopifyCustomerField = (field) => {
      if (!window.ShopifyCustomer) {
        return null;
      }
      if (field in window.ShopifyCustomer) {
        return window.ShopifyCustomer[field];
      }
      const lowerField = field.toLowerCase();
      for (const key of Object.keys(window.ShopifyCustomer)) {
        if (key.toLowerCase() === lowerField) {
          return window.ShopifyCustomer[key];
        }
      }
      return null;
    };
    
    // METODA 1: NOWY SYSTEM - window.ShopifyCustomer (z Liquid w theme.liquid)
    // ⚠️ Sprawdź czy window.ShopifyCustomer istnieje i NIE jest null/undefined
    if (window.ShopifyCustomer && window.ShopifyCustomer !== null && (getShopifyCustomerField('id') || getShopifyCustomerField('customerId'))) {
      const shopifyId = getShopifyCustomerField('id') || getShopifyCustomerField('customerId');
      const shopifyEmail = getShopifyCustomerField('email') || null;
      return buildCustomerInfo(shopifyId, shopifyEmail, 'ShopifyCustomer');
    }
    
    // METODA 1B: Shopify Analytics (fallback)
    // ⚠️ UŻYWAJ TYLKO jeśli window.ShopifyCustomer istnieje (nie null)
    if (window.ShopifyCustomer !== null && window.ShopifyAnalytics && window.ShopifyAnalytics.meta) {
      const analyticsMeta = window.ShopifyAnalytics.meta;
      const analyticsId =
        analyticsMeta.page?.customerId ??
        analyticsMeta.customerId ??
        analyticsMeta.page?.customer_id ??
        analyticsMeta.customer_id ??
        null;
      const analyticsEmail =
        analyticsMeta.page?.customerEmail ??
        analyticsMeta.customerEmail ??
        analyticsMeta.page?.customer_email ??
        analyticsMeta.customer_email ??
        null;
      
      const analyticsInfo = buildCustomerInfo(analyticsId, analyticsEmail, 'ShopifyAnalytics.meta');
      if (analyticsInfo) {
        return analyticsInfo;
      }
    }
    
    // METODA 1C: window.meta (Shopify storefront meta object)
    // ⚠️ UŻYWAJ TYLKO jeśli window.ShopifyCustomer istnieje (nie null)
    if (window.ShopifyCustomer !== null && window.meta) {
      const metaId = window.meta.page?.customerId ?? window.meta.customerId ?? null;
      const metaEmail = window.meta.page?.customerEmail ?? window.meta.customerEmail ?? null;
      
      const metaInfo = buildCustomerInfo(metaId, metaEmail, 'window.meta');
      if (metaInfo) {
        return metaInfo;
      }
    }
    
    // METODA 1D: Shopify tracking object (__st)
    // ⚠️ UŻYWAJ TYLKO jeśli window.ShopifyCustomer istnieje (nie null)
    if (window.ShopifyCustomer !== null) {
      const shopifyTrackingId = window.__st ? window.__st.cid : null;
      if (shopifyTrackingId) {
        const trackingInfo = buildCustomerInfo(shopifyTrackingId, getStoredValue('customify_last_customer_email'), '__st.cid');
        if (trackingInfo) {
          return trackingInfo;
        }
      }
    }
    
    // METODA 2: FALLBACK - Sprawdź cookie Shopify (customer_id)
    // ⚠️ UŻYWAJ TYLKO jeśli window.ShopifyCustomer istnieje (nie null)
    if (window.ShopifyCustomer !== null) {
      const cookies = document.cookie.split(';').map(c => c.trim());
      if (cookies.length > 0) {
        const customerIdCookie = cookies.find(c => c.startsWith('customer_id='));
        if (customerIdCookie) {
          const cookieId = sanitizeId(customerIdCookie.split('=')[1]);
          const cookieInfo = buildCustomerInfo(cookieId, getStoredValue('customify_last_customer_email') || window.ShopifyCustomer?.email, 'customer_id cookie');
          if (cookieInfo) {
            return cookieInfo;
          }
        }
      }
    }
    
    // METODA 3: Pamięć lokalna (ostatni znany zalogowany użytkownik)
    // ⚠️ UŻYWAJ TYLKO jeśli window.ShopifyCustomer istnieje (nawet jeśli nie ma ID)
    // Jeśli window.ShopifyCustomer jest null = użytkownik NIE jest zalogowany w Shopify
    if (window.ShopifyCustomer !== null && window.ShopifyCustomer !== undefined) {
      const storedId = sanitizeId(getStoredValue('customify_last_customer_id'));
      if (storedId) {
        return buildCustomerInfo(storedId, getStoredValue('customify_last_customer_email'), 'localStorage');
      }
    }
    
    // METODA 4: STARY SYSTEM - window.Shopify.customerEmail (Classic Customer Accounts)
    if (window.Shopify && window.Shopify.customerEmail) {
      const legacyId = sanitizeId(window.meta?.customer?.id || window.ShopifyCustomer?.id || getStoredValue('customify_last_customer_id'));
      const legacyEmail = sanitizeEmail(window.Shopify.customerEmail) || getStoredValue('customify_last_customer_email');
      const legacyToken = getStoredValue('shopify_customer_access_token') || 'oauth_session';
      
      if (legacyId) {
        return persistCustomerContext({
          customerId: legacyId,
          email: legacyEmail || 'legacy-user@shopify.com',
          customerAccessToken: legacyToken
        }, 'Shopify.customerEmail');
      }
    }
    
    // No customer detected
    return null;
  }

  /**
   * Sprawdza liczbę użyć z localStorage (dla niezalogowanych)
   * @returns {number} Liczba użyć
   */
  /**
   * Określa productType na podstawie STRONY (URL) - to jest najważniejsze!
   * Strona = Produkt = Cena (król ma inną cenę niż boho)
   */
  getProductTypeFromStyle(style) {
    // 🎯 PRIORYTET 1: Sprawdź URL strony (NAJWAŻNIEJSZE - określa cenę!)
    const currentUrl = window.location.pathname.toLowerCase();
    
    console.log('🔍 [PRODUCT-TYPE] Sprawdzam URL:', currentUrl);
    
    // Mapuj URL → productType (określa który produkt Shopify = jaka cena)
    if (currentUrl.includes('krol-portret') || currentUrl.includes('krol-personalizowany') || currentUrl.includes('portret-krola-polski')) {
      console.log('👑 [PRODUCT-TYPE] URL = Król → productType: king');
      return 'king';
    }
    if (currentUrl.includes('koty-krolewskie') || currentUrl.includes('krolewskie-portrety-kotow')) {
      console.log('🐱 [PRODUCT-TYPE] URL = Koty → productType: cats');
      return 'cats';
    }
    if (currentUrl.includes('obraz-w-stylu-pop-art-z-twojego-zdjecia-personalizowany-na-prezent')) {
      console.log('🎨 [PRODUCT-TYPE] URL = Pop Art → productType: pop_art');
      return 'pop_art';
    }

    if (currentUrl.includes('personalizowany-obraz-3d-cartoon-ilustracja-z-twojego-zdjecia')) {
      console.log('🎨 [PRODUCT-TYPE] URL = 3D Cartoon → productType: 3d_cartoon');
      return '3d_cartoon';
    }

    if (currentUrl.includes('portret-z-efektem-farb-olejnych-z-twojego-zdjecia-na-prezent')) {
      console.log('🎨 [PRODUCT-TYPE] URL = Farby Olejne → productType: oil_paints');
      return 'oil_paints';
    }

    if (currentUrl.includes('obraz-olejny-portret-na-plotnie-z-twojego-zdjecia')) {
      console.log('🎨 [PRODUCT-TYPE] URL = Obraz Olejny → productType: oil_painting');
      return 'oil_painting';
    }

    if (currentUrl.includes('obraz-ze-zdjecia-personalizowany-prezent-dla-niej-akwarela')) {
      console.log('🎨 [PRODUCT-TYPE] URL = Prezent dla Niej (Farby Olejne) → productType: oil_paints');
      return 'oil_paints';
    }
    if (currentUrl.includes('personalizowany-portret-w-stylu-boho')) {
      console.log('🎨 [PRODUCT-TYPE] URL = Boho → productType: boho');
      return 'boho';
    }
    if (currentUrl.includes('superbohater') || currentUrl.includes('portret-ze-zdjecia-superbohater-prezent-dla-chlopca')) {
      console.log('🦸 [PRODUCT-TYPE] URL = Superbohater → productType: superhero');
      return 'superhero';
    }
    if (currentUrl.includes('plakat-ze-zdjecia-w-stylu-komiks')) {
      console.log('🖍️ [PRODUCT-TYPE] URL = Komiks (test) → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-pary-na-50-ta-rocznice-wydruk-na-szkle')) {
      console.log('💑 [PRODUCT-TYPE] URL = Para rocznica wydruk na szkle → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-karykatura-na-50-ta-rocznice')) {
      console.log('🎂 [PRODUCT-TYPE] URL = Karykatura 50-ta rocznica → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-biznes-woman-personalizowany-prezent')) {
      console.log('👩‍💼 [PRODUCT-TYPE] URL = Biznes Woman → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('wydruk-na-szkle-biznes-woman-prezent-na-urodziny-dla-kobiety')) {
      console.log('👩‍💼 [PRODUCT-TYPE] URL = Wydruk na szkle Biznes Woman → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-prezent-na-50-urodziny-dla-kobiety-biznes-woman')) {
      console.log('👩‍💼 [PRODUCT-TYPE] URL = Biznes Woman 50 urodziny → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-prezent-na-30-urodziny-dla-kobiety-biznes-woman')) {
      console.log('👩‍💼 [PRODUCT-TYPE] URL = Prezent 30 urodziny Biznes Woman → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-karykatura-dla-niej-zainteresowania')) {
      console.log('💝 [PRODUCT-TYPE] URL = Karykatura dla niej → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-karykatura-dla-niej-policjantka')) {
      console.log('👮 [PRODUCT-TYPE] URL = Karykatura dla niej policjantka → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-karykatura-dla-niej-rolniczka')) {
      console.log('🌾 [PRODUCT-TYPE] URL = Karykatura dla niej rolniczka → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-karykatura-dla-niej-lekarka')) {
      console.log('🩺 [PRODUCT-TYPE] URL = Karykatura dla niej lekarka → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-karykatura-dla-niej-podrozniczka')) {
      console.log('✈️ [PRODUCT-TYPE] URL = Karykatura dla niej podróżniczka → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-karykatura-dla-niej-psycholog')) {
      console.log('🧠 [PRODUCT-TYPE] URL = Karykatura dla niej psycholog → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-karykatura-dla-niej-kucharka')) {
      console.log('👩‍🍳 [PRODUCT-TYPE] URL = Karykatura dla niej kucharka → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-karykatura-dla-niej-fitness')) {
      console.log('💪 [PRODUCT-TYPE] URL = Karykatura dla niej fitness → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-karykatura-dla-niej-szefowa')) {
      console.log('🛒 [PRODUCT-TYPE] URL = Karykatura dla niej szefowa → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('karykatura-rolnik-ze-zdjecia-personalizowany-prezent-dla-mezczyzny')) {
      console.log('🎣 [PRODUCT-TYPE] URL = Karykatura rolnik dla mężczyzny → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-prezent-dla-chlopca-pilkarz')) {
      console.log('⚽ [PRODUCT-TYPE] URL = Piłkarz chłopiec → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('portret-ze-zdjecia-dla-lekarza-personalizowany-plakat-na-urodziny-dla-chlopaka')) {
      console.log('🩺 [PRODUCT-TYPE] URL = Lekarz → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('prezent-ze-zdjecia-dla-budowlanca-personalizowany-obraz-dla-taty')) {
      console.log('🏗️ [PRODUCT-TYPE] URL = Budowlaniec → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('prezent-z-wlasnym-zdjeciem-dla-kierowcy-tira-personalizowany-obraz')) {
      console.log('🚛 [PRODUCT-TYPE] URL = Kierowca tira → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-karykatura-policjant-prezent-dla-faceta')) {
      console.log('👮 [PRODUCT-TYPE] URL = Karykatura policjant → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('karykatura-wedkarz-portret-ze-zdjecia-personalizowany-prezent-dla-faceta')) {
      console.log('🎣 [PRODUCT-TYPE] URL = Karykatura wędkarz → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('kulturysta-karykatura-ze-zdjecia-prezent-dla-mezczyzny')) {
      console.log('💪 [PRODUCT-TYPE] URL = Karykatura kulturysta dla mężczyzny → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('active-woman-portret-ze-zdjecia-na-rocznice-dla-kolezanki-kobiety-druk-na-szkle')) {
      console.log('🏋️ [PRODUCT-TYPE] URL = Active woman fitness → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('active-woman-portret-ze-zdjecia-na-18-urodziny-dla-dziewczyny-druk-na-szkle-copy')) {
      console.log('🎂 [PRODUCT-TYPE] URL = Active woman 18 urodziny → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('portret-ze-zdjecia-prezent-na-urodziny-dla-kolezanki-szefowej-salon-spa')) {
      console.log('💅 [PRODUCT-TYPE] URL = Szefowa salon spa → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-prezent-na-40-urodziny-dla-kobiety-czerwony-dywan')) {
      console.log('🎀 [PRODUCT-TYPE] URL = 40 urodziny czerwony dywan → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('portret-na-18-urodziny-dla-dziewczyny-magic-z-wlasnego-zdjecia-druk-na-szkle')) {
      console.log('✨ [PRODUCT-TYPE] URL = Magic 18 urodziny → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('portret-ze-zdjecia-na-30-rocznice-dla-nauczycielki-karykatura-na-prezent')) {
      console.log('📚 [PRODUCT-TYPE] URL = Nauczycielka 30 rocznica → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('portret-pary-z-okazji-rocznicy-z-twojego-zdjecia')) {
      console.log('🤴👸 [PRODUCT-TYPE] URL = Para królewska → productType: para_krolewska');
      return 'para_krolewska';
    }
    if (currentUrl.includes('portret-pary-w-stylu-anime-obraz-ze-zdjecia')) {
      console.log('🎌 [PRODUCT-TYPE] URL = Anime → productType: anime');
      return 'anime';
    }
    if (currentUrl.includes('ramka-spotify') || currentUrl.includes('zdjecie-na-szkle-ramka-spotify')) {
      console.log('🎵 [PRODUCT-TYPE] URL = Ramka Spotify → productType: spotify_frame');
      return 'spotify_frame';
    }
    if (currentUrl.includes('personalizowane-etui-na-telefon-z-twoim-zdjeciem') && !currentUrl.includes('-karykatura')) {
      console.log('📱 [PRODUCT-TYPE] URL = Etui na telefon → productType: etui');
      return 'etui';
    }
    if (currentUrl.includes('portret-z-twojego-zdjecia-neon-lights-dla-dziewczyny-prezent')) {
      console.log('💡 [PRODUCT-TYPE] URL = Neon Lights → productType: neo');
      return 'neo';
    }
    if (currentUrl.includes('personalizowany-obraz-z-twojego-zdjecia-dla-mezczyzny-w-stylu-western-wanted')) {
      console.log('🤠 [PRODUCT-TYPE] URL = Western Wanted → productType: wanted');
      return 'wanted';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-dla-kobiety-w-stylu-western-wanted-poszukiwana')) {
      console.log('🤠 [PRODUCT-TYPE] URL = Western Wanted (kobieta) → productType: wanted_k');
      return 'wanted_k';
    }
    if (currentUrl.includes('portret-superbohater-obraz-na-plotnie-z-twojego-zdjecia-superman')) {
      console.log('🦸 [PRODUCT-TYPE] URL = Superman → productType: superman');
      return 'superman';
    }
    if (currentUrl.includes('portret-dziecka-w-stroju-jednorozca') || currentUrl.includes('jednorozec')) {
      console.log('🦄 [PRODUCT-TYPE] URL = Jednorożec → productType: unicorn');
      return 'unicorn';
    }
    if (currentUrl.includes('portret-dziecka-w-stroju-misia') || currentUrl.includes('mis')) {
      console.log('🧸 [PRODUCT-TYPE] URL = Miś → productType: teddy_bear');
      return 'teddy_bear';
    }
    if (currentUrl.includes('portret-ze-zdjecia-dla-dziewczynki-zimowa-ksiezniczka') || currentUrl.includes('zimowa-ksiezniczka')) {
      console.log('❄️ [PRODUCT-TYPE] URL = Zimowa Księżniczka → productType: winter_princess');
      return 'winter_princess';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-krolowa-sniegu') || currentUrl.includes('krolowa-sniegu')) {
      console.log('❄️👑 [PRODUCT-TYPE] URL = Królowa Śniegu → productType: snow_queen');
      return 'snow_queen';
    }
    if (currentUrl.includes('portret-krolowej-obraz-ze-zdjecia-prezent-dla-niej')) {
      console.log('👑 [PRODUCT-TYPE] URL = Portret królowej prezent → productType: queen_prezent');
      return 'queen_prezent';
    }
    if (currentUrl.includes('prezent-na-walentynki-obraz-na-plotnie-z-twojego-zdjecia')) {
      console.log('🌹 [PRODUCT-TYPE] URL = Love Rose → productType: love_rose');
      return 'love_rose';
    }
    if (currentUrl.includes('portret-zakochana-para-krolewska-prezent-na-walentynki-personalizowany')) {
      console.log('💕 [PRODUCT-TYPE] URL = Royal Love → productType: royal_love');
      return 'royal_love';
    }
    if (currentUrl.includes('prezent-na-walentynki-superpara-obraz-na-plotnie-z-twojego-zdjecia')) {
      console.log('🦸 [PRODUCT-TYPE] URL = Superpara → productType: superpara');
      return 'superpara';
    }
    if (currentUrl.includes('portret-w-stylu-gta-obraz-na-plotnie-z-twojego-zdjecia-super-prezent') || currentUrl.includes('portret-w-stylu-gta')) {
      console.log('🎮 [PRODUCT-TYPE] URL = GTA → productType: gta');
      return 'gta';
    }
    if (currentUrl.includes('dodaj-osobe-do-zdjecia-naturalny-efekt')) {
      console.log('📸 [PRODUCT-TYPE] URL = Dodaj osobę → productType: dodaj_osobe');
      return 'dodaj_osobe';
    }
    if (currentUrl.includes('prezent-dla-dziadkow-retusz-starych-zdjec')) {
      console.log('📷 [PRODUCT-TYPE] URL = Retusz starych zdjęć → productType: retusz_starych_zdjec');
      return 'retusz_starych_zdjec';
    }

    // 🔄 PRIORYTET 2: Fallback - sprawdź styl (tylko dla starych generacji bez URL)
    console.log('⚠️ [PRODUCT-TYPE] Nie rozpoznano URL, sprawdzam styl:', style);
    
    const styleToProductType = {
      'pop-art': 'pop_art',
      '3d-cartoon': '3d_cartoon',
      'oil-paints': 'oil_paints',
      'oil-painting': 'oil_painting',
      'minimalistyczny': 'boho',
      'realistyczny': 'boho',
      'krol-krolewski': 'king',
      'krol-majestatyczny': 'king',
      'krol-triumfalny': 'king',
      'krol-imponujacy': 'king',
      'krol-polski': 'king',
      'krol-polski-krolewski': 'king',
      'krolowa-styl-1': 'queen',
      'krolowa-styl-2': 'queen',
      'krolowa-styl-3': 'queen',
      'krolowa-styl-4': 'queen',
      'krolowa-prezent-1': 'queen_prezent',
      'krolowa-prezent-2': 'queen_prezent',
      'krolewski': 'cats',
      'na-tronie': 'cats',
      'wojenny': 'cats',
      'wiktorianski': 'cats',
      'renesansowy': 'cats',
      'zamkowy': 'para_krolewska',
      'krolewski-para': 'para_krolewska',
      'superhero_kid': 'superhero',
      'superhero_boy': 'superhero',
      'karykatura': 'caricature',
      'caricature-new': 'caricature-new',
      'karykatura-olowek': 'caricature-new',
      'watercolor_ok': 'caricature-new',
      'swieta': 'caricature-new',
      'swieta_2': 'caricature-new',
      'akwarela': 'watercolor',
      'openai-art': 'openai-art', // OpenAI GPT-Image-1 style
      'love-rose': 'love_rose', // Love Rose - OpenAI GPT-Image-1.5 via Replicate
      'royal-love': 'royal_love', // Royal Love - OpenAI GPT-Image-1.5 via Replicate
      'gta': 'gta', // GTA - OpenAI GPT-Image-1.5 via Replicate
      'szkic-love': 'szkic_love', // Szkic Love - OpenAI GPT-Image-1.5 via Replicate
      'jak-z-bajki': 'jak_z_bajki', // Jak z bajki - OpenAI GPT-Image-1.5 via Replicate
      'superpara': 'superpara', // Superpara - OpenAI GPT-Image-1.5 via Replicate
      'jednorozec': 'unicorn',
      'mis': 'teddy_bear',
      'zimowa-ksiezniczka': 'winter_princess',
      'krolowa-sniegu': 'snow_queen',
      'neo': 'neo',
      'wanted': 'wanted',
      'wanted_k': 'wanted_k',
      'anime': 'anime',
      'superman': 'superman',
      'dodaj-osobe': 'dodaj_osobe',
      'retusz-starych-zdjec': 'retusz_starych_zdjec'
    };

    const productType = styleToProductType[style] || 'other';
    console.log('🔄 [PRODUCT-TYPE] Styl:', style, '→ productType:', productType);
    
    return productType;
  }

  getLocalUsageCount(productType) {
    if (!productType) {
      // Fallback: suma wszystkich typów (backward compatibility)
      const allTypes = ['boho', 'king', 'cats', 'caricature', 'watercolor', 'other'];
      const total = allTypes.reduce((sum, type) => {
        const count = parseInt(localStorage.getItem(`customify_usage_${type}`) || '0', 10);
        if (count > 0) {
          console.log(`📊 [LOCAL-STORAGE] ${type}: ${count}`);
        }
        return sum + count;
      }, 0);
      console.log(`📊 [LOCAL-STORAGE] Total (bez productType): ${total}`);
      return total;
    }
    const key = `customify_usage_${productType}`;
    const count = parseInt(localStorage.getItem(key) || '0', 10);
    console.log(`📊 [LOCAL-STORAGE] ${productType}: ${count} (key: ${key})`);
    return count;
  }

  /**
   * Inkrementuje licznik w localStorage (dla niezalogowanych) - PER PRODUCTTYPE
   */
  incrementLocalUsage(productType) {
    if (!productType) {
      productType = 'other'; // Fallback
    }
    const key = `customify_usage_${productType}`;
    const currentCount = this.getLocalUsageCount(productType);
    const newCount = currentCount + 1;
    localStorage.setItem(key, newCount.toString());
    // Usage count incremented per productType
    this.showUsageCounter(); // Odśwież licznik w UI
  }

  /**
   * Zapisuje generację AI w localStorage
   */
  async saveAIGeneration(originalImage, transformedImage, style, size, productType = null, watermarkedImageUrl = null, watermarkedImageBase64 = null) {
    console.log('💾 [CACHE] Saving AI generation to localStorage...');
    
    // ⚠️ NIE zapisuj ponownie do Vercel Blob - już jest zapisane w transform.js jako generation-{timestamp}.jpg
    // Używamy URL z API response (generation-{timestamp}.jpg) zamiast duplikować jako ai-{timestamp}.jpg.jpg
    let transformedImageUrl = transformedImage; // Użyj URL z API (generation-{timestamp}.jpg lub base64)
    
    console.log('✅ [CACHE] Using existing URL from transform.js (no duplicate upload):', transformedImageUrl?.substring(0, 50));

    // ✅ DODAJ productType jeśli nie został przekazany (fallback dla starych generacji)
    if (!productType && style) {
      productType = this.getProductTypeFromStyle(style);
      console.log('🔄 [CACHE] ProductType wywnioskowany z stylu:', productType);
    }

    const generation = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      originalImage: originalImage, // base64 lub URL (zachowaj)
      transformedImage: transformedImageUrl, // ZAWSZE URL (nie base64)
      watermarkedImageUrl: watermarkedImageUrl || null, // ✅ ZAPISZ watermarkedImageUrl (Vercel Blob z watermarkiem) - używany tylko w wyświetlaniu
      watermarkedImageBase64: watermarkedImageBase64 || null, // ✅ NOWE: Base64 watermarku (dla /api/products - BEZ PONOWNEGO DOWNLOADU)
      style: style,
      size: size,
      productType: productType, // ✅ DODAJ productType (boho, king, cats, etc) - dla skalowalności
      thumbnail: transformedImageUrl // ✅ ZAWSZE transformedImageUrl (zachowaj oryginalną logikę)
    };

    // Pobierz istniejące generacje
    const existingGenerations = this.getAIGenerations();
    
    // Dodaj nową generację na początku
    existingGenerations.unshift(generation);
    
    // Zachowaj ostatnie 8 generacji (URL są małe, ~100 znaków zamiast 2-5MB base64)
    const limitedGenerations = existingGenerations.slice(0, 8);
    
    // Zapisz z powrotem do localStorage
    localStorage.setItem('customify_ai_generations', JSON.stringify(limitedGenerations));
    
    console.log('🎨 [GALLERY] Saved AI generation:', generation.id, style, size);
    
    // Odśwież galerię
    this.updateGallery().catch(error => {
      console.error('❌ [GALLERY] Error updating gallery after save:', error);
    });
  }

  /**
   * Pobiera zapisane generacje AI
   */
  getAIGenerations() {
    try {
      const stored = localStorage.getItem('customify_ai_generations');
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      console.log('🎨 [GALLERY] Loaded generations from localStorage:', parsed.length);
      
      // TYMCZASOWO: zwróć wszystkie generacje bez filtrowania
      return parsed;
    } catch (error) {
      console.error('❌ [GALLERY] Error loading generations:', error);
      return [];
    }
  }

  /**
   * Aktualizuje galerię ostatnich generacji
   */
  async updateGallery() {
    console.log('🎨 [GALLERY] updateGallery called');
    
    // 🧹 CLEANUP: Usuń niedziałające generacje
    const generations = await this.cleanupBrokenGenerations();
    console.log('🎨 [GALLERY] After cleanup, generations:', generations.length);
    
    if (generations.length === 0) {
      // Ukryj galerię jeśli brak generacji
      const gallery = document.getElementById('aiGallery');
      if (gallery) {
        gallery.style.display = 'none';
      }
      console.log('🎨 [GALLERY] No generations, hiding gallery');
      return;
    }

    // Znajdź lub stwórz kontener galerii
    let gallery = document.getElementById('aiGallery');
    if (!gallery) {
      gallery = this.createGalleryContainer();
    }

    // Wyczyść poprzednie elementy
    gallery.innerHTML = '';

    // Dodaj nagłówek
    const header = document.createElement('h4');
    header.textContent = 'Twoje obrazy - wybierz najlepszy';
    header.style.cssText = `
      margin: 0 0 15px 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
      text-align: center;
    `;
    gallery.appendChild(header);

    // Stwórz grid z generacjami
    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    `;

    generations.forEach(generation => {
      const item = this.createGalleryItem(generation);
      grid.appendChild(item);
    });

    gallery.appendChild(grid);
    gallery.style.display = 'block';
  }

  /**
   * Tworzy kontener galerii
   */
  createGalleryContainer() {
    const gallery = document.createElement('div');
    gallery.id = 'aiGallery';
    gallery.style.cssText = `
      margin: 20px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    `;

    // Wstaw galerię przed accordion
    const accordion = document.querySelector('.product-details-accordion');
    console.log('🎨 [GALLERY] Looking for accordion:', accordion);
    if (accordion) {
      accordion.parentNode.insertBefore(gallery, accordion);
      console.log('🎨 [GALLERY] Gallery inserted before accordion');
    } else {
      // Fallback - wstaw w kontener aplikacji
      const appContainer = document.getElementById('customify-app-container');
      if (appContainer) {
        appContainer.appendChild(gallery);
        console.log('🎨 [GALLERY] Gallery inserted in app container');
      } else {
        // Ostatni fallback - wstaw na końcu body
        document.body.appendChild(gallery);
        console.log('🎨 [GALLERY] Gallery inserted at end of body (fallback)');
      }
    }

    return gallery;
  }

  /**
   * Tworzy element galerii dla pojedynczej generacji
   */
  createGalleryItem(generation) {
    const item = document.createElement('div');
    item.style.cssText = `
      position: relative;
      cursor: pointer;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s ease;
    `;

    // ✅ PRIORYTET: watermarkedImageUrl (Vercel Blob z watermarkiem) > thumbnail > transformedImage
    const imageUrl = generation.watermarkedImageUrl || generation.thumbnail || generation.transformedImage;
    if (generation.watermarkedImageUrl) {
      console.log('✅ [GALLERY] Using watermarkedImageUrl from Vercel Blob:', generation.watermarkedImageUrl.substring(0, 50));
    } else if (generation.thumbnail) {
      console.log('✅ [GALLERY] Using thumbnail:', generation.thumbnail.substring(0, 50));
    } else {
      console.log('✅ [GALLERY] Using transformedImage:', generation.transformedImage?.substring(0, 50));
    }

    // Obraz
    const img = document.createElement('img');
    img.src = imageUrl;
    img.loading = 'lazy'; // ✅ Lazy loading - nie preloaduj wszystkich obrazków na raz
    img.style.cssText = `
      width: 100%;
      height: 120px;
      object-fit: cover;
      display: block;
    `;
    img.alt = `${generation.style} - ${generation.size}`;
    
    // Obsługa błędów ładowania obrazu
    img.onerror = function() {
      console.error('❌ [GALLERY] Image failed to load:', imageUrl?.substring(0, 50));
      console.log('🔄 [GALLERY] Generation data:', generation);
      // Ukryj uszkodzony obraz, ale zachowaj element
      img.style.display = 'none';
      // Pokaż placeholder
      const placeholder = document.createElement('div');
      placeholder.textContent = 'Brak obrazu';
      placeholder.style.cssText = 'width: 100%; height: 120px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999;';
      img.parentNode.insertBefore(placeholder, img);
    };
    
    img.onload = function() {
      console.log('✅ [GALLERY] Image loaded successfully:', imageUrl?.substring(0, 50));
    };

    // Overlay z informacjami
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0,0,0,0.8));
      color: white;
      padding: 8px;
      font-size: 0.8rem;
    `;
    overlay.innerHTML = `
      <div style="font-weight: 600;">${generation.style}</div>
      <div style="opacity: 0.8;">${generation.size}</div>
    `;

    // Hover effect
    item.addEventListener('mouseenter', () => {
      item.style.transform = 'translateY(-4px)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.transform = 'translateY(0)';
    });

    // Kliknięcie - użyj ponownie
    item.addEventListener('click', () => {
      this.reuseGeneration(generation);
    });

    item.appendChild(img);
    item.appendChild(overlay);

    return item;
  }

  /**
   * Zwraca URL bezpieczny dla canvas (proxy dla Vercel Blob - CORS)
   * Używane w text overlay i innych miejscach gdzie ładujemy obraz do canvas
   */
  getCanvasSafeImageUrl(url) {
    if (!url || typeof url !== 'string') return url;
    if (url.startsWith('data:')) return url;
    if (url.includes('blob.vercel-storage.com')) {
      return `https://customify-s56o.vercel.app/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
    return url;
  }

  /**
   * Konwertuje URL na File object
   * Dla Vercel Blob używa proxy (CORS blokuje bezpośredni fetch)
   */
  urlToFile(url, filename) {
    const fetchUrl = (url && url.includes('blob.vercel-storage.com'))
      ? `https://customify-s56o.vercel.app/api/proxy-image?url=${encodeURIComponent(url)}`
      : url;
    return new Promise((resolve, reject) => {
      fetch(fetchUrl)
        .then(response => {
          if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
          return response.blob();
        })
        .then(blob => {
          const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
          resolve(file);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Konwertuje URL na base64 string
   */
  async urlToBase64(url) {
    try {
      console.log('🔄 [CACHE] Converting URL to base64:', url);
      const response = await fetch(url);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          console.log('✅ [CACHE] URL converted to base64 successfully');
          resolve(reader.result);
        };
        reader.onerror = () => {
          console.error('❌ [CACHE] Error reading blob to base64');
          reject(new Error('Failed to convert blob to base64'));
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('❌ [CACHE] Error converting URL to base64:', error);
      throw error;
    }
  }

  /**
   * Kompresuje obraz base64 do małego thumbnail (150x150px)
   * Zwraca kompresowany base64 string (~50-100KB zamiast 2-5MB)
   */
  async compressBase64Thumbnail(base64String, maxWidth = 150, maxHeight = 150, quality = 0.6) {
    return new Promise((resolve, reject) => {
      try {
        console.log('🗜️ [COMPRESS] Compressing thumbnail to', maxWidth, 'x', maxHeight, 'px');
        
        const img = new Image();
        img.onload = () => {
          // Oblicz nowe wymiary zachowując proporcje
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          
          // Stwórz canvas i narysuj skompresowany obraz
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Konwertuj do base64 z kompresją
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          
          const originalSize = Math.round(base64String.length / 1024); // KB
          const compressedSize = Math.round(compressedBase64.length / 1024); // KB
          const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);
          
          console.log(`✅ [COMPRESS] Compressed: ${originalSize}KB → ${compressedSize}KB (${compressionRatio}% reduction)`);
          
          resolve(compressedBase64);
        };
        
        img.onerror = () => {
          console.error('❌ [COMPRESS] Failed to load image for compression');
          reject(new Error('Failed to compress image'));
        };
        
        img.src = base64String;
      } catch (error) {
        console.error('❌ [COMPRESS] Error compressing thumbnail:', error);
        reject(error);
      }
    });
  }

  /**
   * Zapisuje obraz base64 do Vercel Blob Storage i zwraca URL
   */
  async saveToVercelBlob(base64String, filename) {
    try {
      console.log('📤 [VERCEL-BLOB] Uploading to Vercel Blob Storage...');
      
      const response = await fetch('https://customify-s56o.vercel.app/api/upload-temp-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: base64String,
          filename: filename,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to upload: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.url) {
        console.log('✅ [VERCEL-BLOB] Uploaded successfully:', result.url);
        return result.url;
      } else {
        throw new Error('No URL in response');
      }
    } catch (error) {
      console.error('❌ [VERCEL-BLOB] Error uploading:', error);
      throw error;
    }
  }

  /**
   * Nakłada napis na obraz i zapisuje na Vercel Blob (pilotaż)
   */
  async previewTextOverlay() {
    if (!this.textOverlayEnabled) return;
    if (!this.transformedImage) {
      this.showError('Brak obrazu do podglądu napisu', 'cart');
      return;
    }

    const text = (this.textOverlayInput?.value || '').trim();
    this.textOverlayState = { ...this.textOverlayState, text };

    // Jeśli tekst pusty – wróć do oryginału (z proxy dla Vercel Blob – jak w showResult)
    if (!text) {
      this.textOverlayState = { ...this.textOverlayState, text: '', previewUrl: null };
      this.updateTextOverlayHint('Pole jest puste');
      if (this.resultImage && this.watermarkedImageUrl) {
        const url = this.getCanvasSafeImageUrl(this.watermarkedImageUrl);
        if (this.isPhonePhotoCaseProduct()) {
          const photoBg = document.getElementById('phoneCasePhotoBg');
          const resultBg = document.getElementById('phoneCaseResultBg');
          if (photoBg) photoBg.style.backgroundImage = `url(${url})`;
          if (resultBg) resultBg.style.backgroundImage = `url(${url})`;
        }
        this.resultImage.src = url;
      }
      return;
    }

    const options = {
      preset: this.textOverlayState.preset || 'classic',
      color: this.textOverlayState.color || 'white',
      font: this.textOverlayState.font || 'sans',
      size: this.textOverlayState.size || 'medium'
    };

    // ✅ PREVIEW: Dla etui z cropem – baza = wykadrowany obraz (nie pełny przed cropem)
    let baseUrl;
    if (this.isPhonePhotoCaseProduct() && this.phonePhotoCropConfirmed && this.phonePhotoCropDataUrl) {
      baseUrl = this.phonePhotoCropDataUrl;
    } else {
      baseUrl = this.watermarkedImageBase64
        ? `data:image/jpeg;base64,${this.watermarkedImageBase64}`
        : (this.watermarkedImageUrl || this.textOverlayBaseImage || this.transformedImage);
    }
    baseUrl = this.getCanvasSafeImageUrl(baseUrl);
    const base64WithText = await this.renderTextOverlayPreview(baseUrl, text, options);

    // ✅ PREVIEW: ZAWSZE z watermarkem - user nie może widzieć obrazu bez watermarku
    let toDisplay = base64WithText;
    try {
      toDisplay = await this.addWatermark(base64WithText);
    } catch (e) {
      console.warn('⚠️ [TEXT-OVERLAY] addWatermark preview failed:', e);
    }
    this.textOverlayState = { ...this.textOverlayState, previewUrl: base64WithText };

    if (this.resultImage) {
      // 📱 Phone case: aktualizuj oba (preview + result) - podgląd napisu Z watermarkem
      if (this.isPhonePhotoCaseProduct() && toDisplay) {
        const photoBg = document.getElementById('phoneCasePhotoBg');
        const resultBg = document.getElementById('phoneCaseResultBg');
        if (photoBg) photoBg.style.backgroundImage = `url(${toDisplay})`;
        if (resultBg) resultBg.style.backgroundImage = `url(${toDisplay})`;
      }
      this.resultImage.src = toDisplay;
    }
  }

  /**
   * Zapisuje napis na Vercel Blob (po zatwierdzeniu)
   */
  async saveTextOverlay() {
    if (!this.textOverlayEnabled) return;
    if (!this.transformedImage) {
      this.showError('Brak obrazu do zapisania napisu', 'cart');
      return;
    }

    const text = (this.textOverlayInput?.value || '').trim();
    this.textOverlayState = { ...this.textOverlayState, text };

    if (!text) {
      this.showError('Wpisz tekst przed zapisem', 'cart');
      return;
    }

    const options = {
      preset: this.textOverlayState.preset || 'classic',
      color: this.textOverlayState.color || 'white',
      font: this.textOverlayState.font || 'sans',
      size: this.textOverlayState.size || 'medium'
    };

    // 📱 Etui: baza = wykadrowany obraz (phonePhotoCropDataUrl), nie pełny przed cropem
    let baseUrl = (this.isPhonePhotoCaseProduct() && this.phonePhotoCropConfirmed && this.phonePhotoCropDataUrl)
      ? this.phonePhotoCropDataUrl
      : (this.textOverlayBaseImage || this.transformedImage);
    baseUrl = this.getCanvasSafeImageUrl(baseUrl);
    console.log('📝 [TEXT-OVERLAY] Rozpoczynam renderowanie napisu na obrazie:', baseUrl.substring(0, 100) + '...');
    const base64WithText = await this.renderTextOverlay(baseUrl, text, options);
    console.log('✅ [TEXT-OVERLAY] Napis wyrenderowany pomyślnie (base64 length:', base64WithText.length, ')');

    // Upload wersji z napisem
    const filename = `text-overlay-${Date.now()}.jpg`;
    console.log('📤 [TEXT-OVERLAY] Wysyłam wersję z napisem do Vercel Blob...');
    const overlayUrl = await this.saveToVercelBlob(base64WithText, filename);
    console.log('✅ [TEXT-OVERLAY] Wersja z napisem zapisana:', overlayUrl);

    // Watermark na wersji z tekstem
    console.log('🎨 [TEXT-OVERLAY] Nakładam watermark na wersję z napisem...');
    const watermarkedBase64 = await this.addWatermark(base64WithText);
    console.log('✅ [TEXT-OVERLAY] Watermark nałożony (base64 length:', watermarkedBase64.length, ')');
    
    console.log('📤 [TEXT-OVERLAY] Wysyłam wersję z watermarkiem do Vercel Blob...');
    const watermarkedUrl = await this.saveToVercelBlob(watermarkedBase64, `text-overlay-watermarked-${Date.now()}.jpg`);
    console.log('✅ [TEXT-OVERLAY] Wersja z watermarkiem zapisana:', watermarkedUrl);

    // Aktualizuj stan (dopiero po zapisie)
    this.transformedImage = overlayUrl;
    this.watermarkedImageUrl = watermarkedUrl;
    this.watermarkedImageBase64 = watermarkedBase64;
    this.textOverlayWatermarkedUrl = watermarkedUrl;
    this.textOverlayState = { ...this.textOverlayState, text, applied: true, previewUrl: null };
    this.updateTextOverlayHint('Napis zapisany – dodasz go do zamówienia');

    // Zamknij panel po zapisie
    const toggleBtn = this.textOverlayToggleBtn;
    if (this.textOverlayPanel && toggleBtn) {
      this.textOverlayPanel.style.display = 'none';
      toggleBtn.setAttribute('data-overlay-open', 'false');
    }

    if (this.resultImage) {
      // 📱 Phone case: aktualizuj oba (preview + result) - po zapisie napisu (proxy dla Vercel Blob)
      const imageUrl = this.getCanvasSafeImageUrl(watermarkedUrl || overlayUrl);
      if (this.isPhonePhotoCaseProduct()) {
        const photoBg = document.getElementById('phoneCasePhotoBg');
        const resultBg = document.getElementById('phoneCaseResultBg');
        if (photoBg && imageUrl) photoBg.style.backgroundImage = `url(${imageUrl})`;
        if (resultBg && imageUrl) resultBg.style.backgroundImage = `url(${imageUrl})`;
      }
      this.resultImage.src = imageUrl;
    }

    // Zaktualizuj najnowszą generację w localStorage
    try {
      const generations = this.getAIGenerations();
      if (generations.length > 0) {
        generations[0] = {
          ...generations[0],
          transformedImage: overlayUrl,
          watermarkedImageUrl: watermarkedUrl,
          watermarkedImageBase64: watermarkedBase64,
          textOverlay: {
            text,
            ...options
          }
        };
        localStorage.setItem('customify_ai_generations', JSON.stringify(generations.slice(0, 8)));
        console.log('✅ [TEXT-OVERLAY] Zapisano overlay w localStorage');
      }
    } catch (err) {
      console.warn('⚠️ [TEXT-OVERLAY] Nie udało się zaktualizować localStorage:', err);
    }
  }

  /**
   * Szybki preview tekstu overlay (bez czekania na fonty, bez watermarku)
   * Używany TYLKO podczas wpisywania tekstu - finalny render używa renderTextOverlay()
   */
  async renderTextOverlayPreview(imageUrl, text, options) {
    return new Promise(async (resolve, reject) => {
      try {
        // ✅ PREVIEW: NIE CZEKAJ na fonty - użyj system font stack natychmiast
        const img = new Image();
        if (imageUrl && !imageUrl.startsWith('data:')) {
          img.crossOrigin = 'anonymous';
        }
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const padding = canvas.width * 0.06;
            const areaHeight = canvas.height * 0.22;
            const baseY = canvas.height - areaHeight * 0.35;
            const maxWidth = canvas.width - padding * 2;

            const sizeMap = { small: 0.05, medium: 0.075, large: 0.11 };
            const fontSize = Math.max(32, canvas.height * (sizeMap[options.size] || sizeMap.medium));

            // ✅ PREVIEW: Te same czcionki co w renderTextOverlay(), ale bez czekania na fonty
    const fontMapPreview = {
      serif: `700 ${fontSize}px "Times New Roman", "Georgia", serif`,
      sans: `700 ${fontSize}px "Montserrat", "Poppins", "Inter", Arial, sans-serif`,
      script: `700 ${fontSize}px "Dancing Script", "Pacifico", cursive`,
      script2: `700 ${fontSize}px "Pacifico", "Dancing Script", cursive`,
      script3: `700 ${fontSize}px "Satisfy", "Dancing Script", cursive`,
      script4: `700 ${fontSize}px "Great Vibes", "Satisfy", cursive`,
      script5: `700 ${fontSize}px "Indie Flower", "Pacifico", cursive`,
      western_1: `700 ${fontSize}px "Rye", "Times New Roman", serif`,
      western_2: `700 ${fontSize}px "Creepster", "Rye", "Times New Roman", serif`,
      hiphop: `400 ${fontSize}px "Rubik Wet Paint", "Creepster", "Rye", "Times New Roman", serif`
    };
            const font = fontMapPreview[options.font] || fontMapPreview.sans;

            const colorMap = {
              white: '#ffffff',
              black: '#111111',
              gold: '#d6b36a',
              red: '#dc2626',
              green: '#16a34a',
              blue: '#2563eb',
              yellow: '#eab308',
              brown: '#92400e'
            };
            const fillColor = colorMap[options.color] || '#ffffff';

            ctx.font = font;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const words = text.split(' ');
            const lines = [];
            let current = '';
            words.forEach(word => {
              const testLine = current ? `${current} ${word}` : word;
              const { width } = ctx.measureText(testLine);
              if (width > maxWidth && current) {
                lines.push(current);
                current = word;
              } else {
                current = testLine;
              }
            });
            if (current) lines.push(current);
            const limitedLines = lines.slice(0, 2);

            // 🛟 Safety: nie pozwól spaść niżej niż 10% od dołu
            const lineYs = limitedLines.map((_, idx) =>
              baseY + (idx - (limitedLines.length - 1) / 2) * (fontSize * 1.2)
            );
            const maxAllowedY = canvas.height * 0.90;
            const shiftY = Math.max(0, Math.max(...lineYs) - maxAllowedY);

            // Skorygowane pozycje linii
            const correctedLineYs = lineYs.map(y => y - shiftY);

            if (options.preset === 'banner') {
              const topLineY = Math.min(...correctedLineYs);
              const bottomLineY = Math.max(...correctedLineYs);
              const bannerPadding = fontSize * 0.5;
              const bannerTop = topLineY - fontSize * 0.6 - bannerPadding;
              const bannerBottom = bottomLineY + fontSize * 0.6 + bannerPadding;
              const bannerHeight = bannerBottom - bannerTop;
              const bannerBg = options.color === 'black' ? 'rgba(255,255,255,0.4)' :
                               options.color === 'gold' ? 'rgba(40,25,15,0.45)' :
                               options.color === 'red' ? 'rgba(255,255,255,0.4)' :
                               options.color === 'green' ? 'rgba(255,255,255,0.4)' :
                               options.color === 'blue' ? 'rgba(255,255,255,0.4)' :
                               options.color === 'yellow' ? 'rgba(0,0,0,0.4)' :
                               options.color === 'brown' ? 'rgba(255,255,255,0.4)' :
                               'rgba(0,0,0,0.4)';
              ctx.fillStyle = bannerBg;
              ctx.fillRect(padding * 0.9, bannerTop, canvas.width - padding * 1.8, bannerHeight);
            }

            limitedLines.forEach((line, idx) => {
              const lineY = correctedLineYs[idx];

              if (options.preset === '3d') {
                const shadowColor =
                  options.color === 'white' ? 'rgba(0,0,0,0.45)' :
                  options.color === 'black' ? 'rgba(255,255,255,0.45)' :
                  options.color === 'gold' ? 'rgba(95, 70, 30, 0.55)' :
                  options.color === 'red' ? 'rgba(0,0,0,0.4)' :
                  options.color === 'green' ? 'rgba(0,0,0,0.4)' :
                  options.color === 'blue' ? 'rgba(0,0,0,0.4)' :
                  options.color === 'yellow' ? 'rgba(0,0,0,0.4)' :
                  options.color === 'brown' ? 'rgba(0,0,0,0.4)' :
                  'rgba(0,0,0,0.45)';
                ctx.fillStyle = shadowColor;
                ctx.fillText(line, canvas.width / 2 + Math.max(2, fontSize * 0.04), lineY + Math.max(2, fontSize * 0.04));
              }

              const strokeColor =
                options.color === 'white' ? 'rgba(0,0,0,0.65)' :
                options.color === 'black' ? 'rgba(255,255,255,0.65)' :
                options.color === 'gold' ? 'rgba(95, 70, 30, 0.75)' :
                options.color === 'red' ? 'rgba(0,0,0,0.5)' :
                options.color === 'green' ? 'rgba(0,0,0,0.5)' :
                options.color === 'blue' ? 'rgba(0,0,0,0.5)' :
                options.color === 'yellow' ? 'rgba(0,0,0,0.5)' :
                options.color === 'brown' ? 'rgba(255,255,255,0.5)' :
                'rgba(0,0,0,0.65)';
              ctx.strokeStyle = strokeColor;
              ctx.lineWidth = Math.max(2.5, fontSize * 0.09);
              ctx.strokeText(line, canvas.width / 2, lineY);

              ctx.fillStyle = fillColor;
              ctx.fillText(line, canvas.width / 2, lineY);
            });

            const result = canvas.toDataURL('image/jpeg', 0.92);
            resolve(result);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = (err) => reject(err);
        img.src = imageUrl;
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Renderuje napis na kanwie
   */
  async renderTextOverlay(imageUrl, text, options) {
    return new Promise(async (resolve, reject) => {
      try {
        // ✅ CZEKAJ NA ZAŁADOWANIE CZCIONEK (Google Fonts)
        if (document.fonts && document.fonts.status !== 'loaded') {
          console.log('🔤 [TEXT-OVERLAY] Czekam na document.fonts.ready...');
          await document.fonts.ready;
          console.log('✅ [TEXT-OVERLAY] Fonty załadowane!');
        }

        const img = new Image();
        if (imageUrl && !imageUrl.startsWith('data:')) {
          img.crossOrigin = 'anonymous';
        }
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const padding = canvas.width * 0.06;
            const areaHeight = canvas.height * 0.22;
            const baseY = canvas.height - areaHeight * 0.35;
            const maxWidth = canvas.width - padding * 2;

    const sizeMap = { small: 0.05, medium: 0.075, large: 0.11 };
    const fontSize = Math.max(32, canvas.height * (sizeMap[options.size] || sizeMap.medium));

    // Mapowanie nazw czcionek do nazw Google Fonts
    const fontNameMap = {
      serif: 'Times New Roman', // Systemowa
      sans: 'Montserrat',
      script: 'Dancing Script',
      script2: 'Pacifico',
      script3: 'Satisfy',
      script4: 'Great Vibes',
      script5: 'Indie Flower',
      western_1: 'Rye',
      western_2: 'Creepster',
      hiphop: 'Rubik Wet Paint'
    };
    
    const fontName = fontNameMap[options.font] || fontNameMap.sans;
    const fontWeight = options.font === 'hiphop' ? '400' : '700';
    
    // ✅ SPRAWDŹ CZY KONKRETNA CZCIONKA JEST ZAŁADOWANA (przed użyciem w canvas)
    if (document.fonts && fontName !== 'Times New Roman') {
      const fontSpec = `${fontWeight} ${fontSize}px "${fontName}"`;
      try {
        const isLoaded = document.fonts.check(fontSpec);
        if (!isLoaded) {
          console.log(`🔤 [TEXT-OVERLAY] Czekam na czcionkę "${fontName}"...`);
          // Czekaj maksymalnie 3 sekundy na załadowanie konkretnej czcionki
          let attempts = 0;
          while (!document.fonts.check(fontSpec) && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
          if (document.fonts.check(fontSpec)) {
            console.log(`✅ [TEXT-OVERLAY] Czcionka "${fontName}" załadowana!`);
          } else {
            console.warn(`⚠️ [TEXT-OVERLAY] Czcionka "${fontName}" nie załadowała się w czasie, używam fallback`);
          }
        }
      } catch (e) {
        console.warn('⚠️ [TEXT-OVERLAY] Błąd podczas sprawdzania czcionki:', e);
      }
    }

    const fontMap = {
      serif: `700 ${fontSize}px "Times New Roman", "Georgia", serif`,
      sans: `700 ${fontSize}px "Montserrat", "Poppins", "Inter", Arial, sans-serif`,
      script: `700 ${fontSize}px "Dancing Script", "Pacifico", cursive`,
      script2: `700 ${fontSize}px "Pacifico", "Dancing Script", cursive`,
      script3: `700 ${fontSize}px "Satisfy", "Dancing Script", cursive`,
      script4: `700 ${fontSize}px "Great Vibes", "Satisfy", cursive`,
      script5: `700 ${fontSize}px "Indie Flower", "Pacifico", cursive`,
      western_1: `700 ${fontSize}px "Rye", "Times New Roman", serif`,
      western_2: `700 ${fontSize}px "Creepster", "Rye", "Times New Roman", serif`,
      hiphop: `400 ${fontSize}px "Rubik Wet Paint", "Creepster", "Rye", "Times New Roman", serif`
    };
            const font = fontMap[options.font] || fontMap.sans;

    const colorMap = {
      white: '#ffffff',
      black: '#111111',
      gold: '#d6b36a',
      red: '#dc2626',      // Czerwony
      green: '#16a34a',    // Zielony
      blue: '#2563eb',     // Niebieski
      yellow: '#eab308',   // Żółty
      brown: '#92400e'     // Brązowy
    };
    const fillColor = colorMap[options.color] || '#ffffff';

            ctx.font = font;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const words = text.split(' ');
            const lines = [];
            let current = '';
            words.forEach(word => {
              const testLine = current ? `${current} ${word}` : word;
              const { width } = ctx.measureText(testLine);
              if (width > maxWidth && current) {
                lines.push(current);
                current = word;
              } else {
                current = testLine;
              }
            });
            if (current) lines.push(current);
            const limitedLines = lines.slice(0, 2);

            // 🛟 Safety: nie pozwól spaść niżej niż 10% od dołu
            const lineYs = limitedLines.map((_, idx) =>
              baseY + (idx - (limitedLines.length - 1) / 2) * (fontSize * 1.2)
            );
            const maxAllowedY = canvas.height * 0.90;
            const shiftY = Math.max(0, Math.max(...lineYs) - maxAllowedY);

            // Skorygowane pozycje linii
            const correctedLineYs = lineYs.map(y => y - shiftY);

            if (options.preset === 'banner') {
              // Oblicz banner na podstawie faktycznych pozycji linii
              const topLineY = Math.min(...correctedLineYs);
              const bottomLineY = Math.max(...correctedLineYs);
              const bannerPadding = fontSize * 0.5;
              const bannerTop = topLineY - fontSize * 0.6 - bannerPadding;
              const bannerBottom = bottomLineY + fontSize * 0.6 + bannerPadding;
              const bannerHeight = bannerBottom - bannerTop;
              // Kolor tła zależy od koloru tekstu: biały→czarne, czarny→białe, złoty→ciemnobrązowe
              const bannerBg = options.color === 'black' ? 'rgba(255,255,255,0.4)' :
                               options.color === 'gold' ? 'rgba(40,25,15,0.45)' :
                               options.color === 'red' ? 'rgba(255,255,255,0.4)' :
                               options.color === 'green' ? 'rgba(255,255,255,0.4)' :
                               options.color === 'blue' ? 'rgba(255,255,255,0.4)' :
                               options.color === 'yellow' ? 'rgba(0,0,0,0.4)' :
                               options.color === 'brown' ? 'rgba(255,255,255,0.4)' :
                               'rgba(0,0,0,0.4)'; // fallback
              ctx.fillStyle = bannerBg;
              ctx.fillRect(padding * 0.9, bannerTop, canvas.width - padding * 1.8, bannerHeight);
            }

            limitedLines.forEach((line, idx) => {
              const lineY = correctedLineYs[idx];

      if (options.preset === '3d') {
        const shadowColor =
          options.color === 'white' ? 'rgba(0,0,0,0.45)' :
          options.color === 'black' ? 'rgba(255,255,255,0.45)' :
          options.color === 'gold' ? 'rgba(95, 70, 30, 0.55)' :
          options.color === 'red' ? 'rgba(0,0,0,0.4)' :
          options.color === 'green' ? 'rgba(0,0,0,0.4)' :
          options.color === 'blue' ? 'rgba(0,0,0,0.4)' :
          options.color === 'yellow' ? 'rgba(0,0,0,0.4)' :
          options.color === 'brown' ? 'rgba(0,0,0,0.4)' :
          'rgba(0,0,0,0.45)'; // fallback
        ctx.fillStyle = shadowColor;
        ctx.fillText(line, canvas.width / 2 + Math.max(2, fontSize * 0.04), lineY + Math.max(2, fontSize * 0.04));
      }

      // Stroke for better contrast per color
      const strokeColor =
        options.color === 'white' ? 'rgba(0,0,0,0.65)' :
        options.color === 'black' ? 'rgba(255,255,255,0.65)' :
        options.color === 'gold' ? 'rgba(95, 70, 30, 0.75)' :
        options.color === 'red' ? 'rgba(0,0,0,0.5)' :
        options.color === 'green' ? 'rgba(0,0,0,0.5)' :
        options.color === 'blue' ? 'rgba(0,0,0,0.5)' :
        options.color === 'yellow' ? 'rgba(0,0,0,0.5)' :
        options.color === 'brown' ? 'rgba(255,255,255,0.5)' :
        'rgba(0,0,0,0.65)'; // fallback
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = Math.max(2.5, fontSize * 0.09);
      ctx.strokeText(line, canvas.width / 2, lineY);

              ctx.fillStyle = fillColor;
              ctx.fillText(line, canvas.width / 2, lineY);
            });

            const result = canvas.toDataURL('image/jpeg', 0.92);
            resolve(result);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = (err) => reject(err);
        img.src = imageUrl;
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Sprawdza czy URL do obrazu działa
   */
  async checkImageUrl(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.log('🔍 [CLEANUP] URL not working:', url);
      return false;
    }
  }

  /**
   * Usuwa niedziałające generacje z localStorage
   */
  async cleanupBrokenGenerations() {
    console.log('🧹 [CLEANUP] Checking for broken generations...');
    const generations = this.getAIGenerations();
    const workingGenerations = [];
    
    for (const generation of generations) {
      // Sprawdź czy thumbnail to URL (nie base64)
      if (generation.thumbnail && 
          (generation.thumbnail.startsWith('http://') || generation.thumbnail.startsWith('https://'))) {
        
        // ✅ NIE SPRAWDZAJ Replicate URLs (CORS blokuje) - zachowaj jeśli to Replicate
        if (generation.thumbnail.includes('replicate.delivery')) {
          workingGenerations.push(generation);
          console.log('✅ [CLEANUP] Replicate URL kept (CORS safe):', generation.id);
          continue;
        }
        // ✅ NIE SPRAWDZAJ Vercel Blob URLs (CORS blokuje HEAD) - obrazy działają do wyświetlania
        if (generation.thumbnail.includes('blob.vercel-storage.com')) {
          workingGenerations.push(generation);
          console.log('✅ [CLEANUP] Vercel Blob URL kept (CORS):', generation.id);
          continue;
        }
        
        // Sprawdź inne URLs
        const isWorking = await this.checkImageUrl(generation.thumbnail);
        if (isWorking) {
          workingGenerations.push(generation);
          console.log('✅ [CLEANUP] Working generation kept:', generation.id);
        } else {
          console.log('🗑️ [CLEANUP] Broken generation removed:', generation.id);
        }
      } else {
        // Base64 lub inne formaty - zachowaj
        workingGenerations.push(generation);
        console.log('✅ [CLEANUP] Base64 generation kept:', generation.id);
      }
    }
    
    // Zapisz tylko działające generacje
    if (workingGenerations.length !== generations.length) {
      localStorage.setItem('customify_ai_generations', JSON.stringify(workingGenerations));
      console.log(`🧹 [CLEANUP] Cleaned up: ${generations.length} → ${workingGenerations.length} generations`);
    }
    
    return workingGenerations;
  }

  /**
   * Konwertuje base64 na File object
   */
  base64ToFile(base64String, filename) {
    return new Promise((resolve, reject) => {
      try {
        // Sprawdź czy to już jest string (base64)
        if (typeof base64String !== 'string') {
          reject(new Error('originalImage is not a base64 string'));
          return;
        }
        
        // Wyciągnij typ MIME i dane z base64
        const [header, data] = base64String.split(',');
        const mimeMatch = header.match(/data:([^;]+)/);
        if (!mimeMatch) {
          reject(new Error('Invalid base64 data URI format'));
          return;
        }
        const mimeType = mimeMatch[1];
        
        // Konwertuj base64 na binary
        const binaryString = atob(data);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Utwórz File object
        const file = new File([bytes], filename, { type: mimeType });
        resolve(file);
      } catch (error) {
        reject(error);
      }
    });
  }

  dataUrlToBlob(dataUrl) {
    if (!dataUrl || !dataUrl.startsWith('data:')) return null;
    try {
      const [header, data] = dataUrl.split(',');
      const mimeMatch = header.match(/data:([^;]+)/);
      if (!mimeMatch) return null;
      const binary = atob(data);
      const arr = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
      return new Blob([arr], { type: mimeMatch[1] });
    } catch (e) {
      return null;
    }
  }

  /**
   * Używa ponownie wybraną generację
   */
  reuseGeneration(generation) {
    console.log('🔄 [GALLERY] Reusing generation:', generation.id);
    console.log('🔄 [GALLERY] Generation data:', generation);
    console.log('🔄 [GALLERY] originalImage type:', typeof generation.originalImage);
    console.log('🔄 [GALLERY] originalImage value:', generation.originalImage);
    console.log('🔄 [GALLERY] transformedImage type:', typeof generation.transformedImage);
    console.log('🔄 [GALLERY] transformedImage length:', generation.transformedImage?.length);
    console.log('🔄 [GALLERY] transformedImage preview:', generation.transformedImage?.substring(0, 100));
    console.log('🔄 [GALLERY] watermarkedImageUrl:', generation.watermarkedImageUrl?.substring(0, 100) || 'brak');
    
    // Pokaż wynik AI (transformedImage) w result area
    if (generation.transformedImage) {
      console.log('🔄 [GALLERY] Showing AI result in result area:', generation.transformedImage);
      
      // ✅ KLUCZOWE: Ustaw this.transformedImage żeby addToCart() działało
      this.transformedImage = generation.transformedImage;
      console.log('✅ [GALLERY] Set this.transformedImage for addToCart:', this.transformedImage?.substring(0, 100));
      console.log('✅ [GALLERY] this.transformedImage is base64?', this.transformedImage?.startsWith('data:'));
      console.log('✅ [GALLERY] this.transformedImage is URL?', this.transformedImage?.startsWith('http'));
      
      // ✅ KLUCZOWE: Ustaw this.watermarkedImageUrl z galerii (backend watermark)
      this.watermarkedImageUrl = generation.watermarkedImageUrl || null;
      console.log('✅ [GALLERY] Set this.watermarkedImageUrl from generation:', this.watermarkedImageUrl?.substring(0, 100) || 'brak');
      if (!this.watermarkedImageUrl) {
        console.warn('⚠️ [GALLERY] Stara generacja bez watermarkedImageUrl - showResult() pokaże bez watermarku');
      }
      
      // ✅ NOWE: Ustaw this.watermarkedImageBase64 z galerii (dla /api/products - BEZ PONOWNEGO DOWNLOADU)
      this.watermarkedImageBase64 = generation.watermarkedImageBase64 || null;
      console.log('✅ [GALLERY] Set this.watermarkedImageBase64 from generation:', this.watermarkedImageBase64 ? `${this.watermarkedImageBase64.length} chars` : 'brak');

      // 🆕 Tekst na obrazie - odtwórz stan z generacji (tylko produkt pilota)
      if (this.textOverlayEnabled) {
        this.watermarkedImageUrl = generation.watermarkedImageUrl || generation.transformedImage;
        this.textOverlayBaseImage = generation.transformedImage;
        this.textOverlayOriginalWatermarked = generation.watermarkedImageUrl || null;
        const textOverlay = generation.textOverlay || null;
        if (this.textOverlayInput) {
          this.textOverlayInput.value = textOverlay?.text || '';
          this.updateTextOverlayCounter();
        }
        this.textOverlayState = {
          ...this.textOverlayState,
          text: textOverlay?.text || '',
          preset: textOverlay?.preset || 'classic',
          color: textOverlay?.color || 'white',
          font: textOverlay?.font || 'sans',
          size: textOverlay?.size || 'medium',
          applied: !!textOverlay
        };
        if (this.textOverlayPanel) {
          this.textOverlayPanel.style.display = 'none';
          this.textOverlayToggleBtn?.setAttribute('data-overlay-open', 'false');
        }
        if (textOverlay?.text) {
          this.updateTextOverlayHint('Napis dodany. Możesz go zmienić i ponownie zastosować.');
        } else {
          this.updateTextOverlayHint('');
        }
      }
      
      // ✅ KLUCZOWE: Ustaw this.originalImageFromGallery żeby addToCart() działało
      this.originalImageFromGallery = generation.originalImage;
      console.log('✅ [GALLERY] Set this.originalImageFromGallery for addToCart:', this.originalImageFromGallery);
      
      this.showResult(generation.transformedImage);
      this.hideError();
    } else {
      console.error('❌ [GALLERY] No transformedImage in generation');
      this.showError('Brak wyniku AI w generacji.');
    }
    
    // Ustaw styl - bezpośrednio z generacji
    console.log('🎨 [GALLERY] Setting style:', generation.style);
    if (generation.style) {
      this.selectedStyle = generation.style;
      console.log('✅ [GALLERY] Style set directly from generation:', this.selectedStyle);
      
      // Opcjonalnie: zaznacz też element w DOM jeśli istnieje
      const styleCard = document.querySelector(`[data-style="${generation.style}"]`);
      if (styleCard) {
        this.stylesArea.querySelectorAll('.customify-style-card').forEach(card => card.classList.remove('active'));
        styleCard.classList.add('active');
        console.log('✅ [GALLERY] Style card also highlighted in DOM');
      }
    } else {
      console.warn('⚠️ [GALLERY] No style in generation');
    }
    
    // Ustaw rozmiar
    if (generation.size) {
      const sizeBtn = document.querySelector(`[data-size="${generation.size}"]`);
      if (sizeBtn) {
        this.selectSize(sizeBtn);
      }
    }

    // Komunikat usunięty - nie potrzebny
  }

  /**
   * Sprawdza czy użytkownik może wykonać transformację
   * @returns {Promise<boolean>} true jeśli może, false jeśli przekroczył limit
   */
  async checkUsageLimit() {
    const customerInfo = this.getCustomerInfo();
    
    // ✅ ZABEZPIECZENIE: Jeśli selectedStyle jest null, nie sprawdzaj limitu (pozwól wybrać styl)
    if (!this.selectedStyle) {
      console.warn(`⚠️ [USAGE-LIMIT] selectedStyle jest null - pomijam sprawdzanie limitu (user musi najpierw wybrać styl)`);
      return true; // Pozwól wybrać styl
    }
    
    // Pobierz productType z aktualnie wybranego stylu
    const productType = this.getProductTypeFromStyle(this.selectedStyle);
    
    console.log(`🔍 [USAGE-LIMIT] Sprawdzam limit:`, {
      selectedStyle: this.selectedStyle,
      productType: productType,
      isLoggedIn: !!customerInfo
    });
    
    if (!customerInfo) {
      // Niezalogowany - sprawdź localStorage (limit 1 per productType)
      const localCount = this.getLocalUsageCount(productType);
      const FREE_LIMIT = 1;
      
      console.log(`🔍 [USAGE-LIMIT] Niezalogowany: ${localCount}/${FREE_LIMIT} dla ${productType}`);
      
      // Usage limit check for anonymous users per productType
      
      if (localCount >= FREE_LIMIT) {
        console.log(`❌ [USAGE-LIMIT] Limit przekroczony dla ${productType}: ${localCount} >= ${FREE_LIMIT}`);
        this.showLoginModal(localCount, FREE_LIMIT, productType);
        return false;
      }
      
      return true;
    } else {
      // Zalogowany - sprawdź Shopify Metafields przez API (per productType)
      // Checking usage limit via API for logged-in user
      
      try {
        const response = await fetch('https://customify-s56o.vercel.app/api/check-usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            customerId: customerInfo.customerId,
            customerAccessToken: customerInfo.customerAccessToken,
            productType: productType // ✅ Przekaż productType
          })
        });
        
        if (!response.ok) {
          console.error(`❌ [USAGE] API error: ${response.status} ${response.statusText}`);
          // ⚠️ KRYTYCZNE: Jeśli błąd API, BLOKUJ (bezpieczniejsze niż pozwalanie)
          this.showError(`Błąd sprawdzania limitu użycia. Spróbuj ponownie za chwilę.`, 'transform');
          return false;
        }
        
        const data = await response.json();
        console.log('📊 [USAGE] API response:', data);
        console.log('🔍 [USAGE] Detailed response analysis:', {
          hasRemainingCount: 'remainingCount' in data,
          remainingCount: data.remainingCount,
          remainingCountType: typeof data.remainingCount,
          usedCount: data.usedCount,
          totalLimit: data.totalLimit,
          productType: data.productType,
          byProductType: data.byProductType,
          calculation: `${data.totalLimit} - ${data.usedCount} = ${data.totalLimit - data.usedCount}`
        });
        
        if (data.remainingCount <= 0) {
          console.error(`❌ [USAGE] Limit przekroczony - przerwano transformację`);
          this.showError(`Wykorzystałeś wszystkie transformacje dla ${productType} (${data.totalLimit}). Skontaktuj się z nami dla więcej.`, 'transform');
          return false;
        }
        
        console.log(`✅ [USAGE] Pozostało ${data.remainingCount} transformacji dla ${productType}`);
        return true;
      } catch (error) {
        console.error('❌ [USAGE] Błąd sprawdzania limitu:', error);
        // ⚠️ KRYTYCZNE: Jeśli błąd, BLOKUJ (bezpieczniejsze niż pozwalanie)
        // Użytkownik może spróbować ponownie, ale nie może obejść limitu przez błąd
        this.showError(`Błąd sprawdzania limitu użycia. Spróbuj ponownie za chwilę.`, 'transform');
        return false;
      }
    }
  }

  /**
   * Pokazuje modal z wymogiem rejestracji + auto-redirect
   */
  showLoginModal(usedCount, limit, productType = null) {
    // Return URL - wróć na tę samą stronę po rejestracji
    const returnUrl = window.location.pathname + window.location.search;
    
    // ⚠️ DEBUG: Pokaż dokładnie co zapisujemy
    console.log('🔍 [DEBUG] window.location.pathname:', window.location.pathname);
    console.log('🔍 [DEBUG] window.location.search:', window.location.search);
    console.log('🔍 [DEBUG] returnUrl (złożony):', returnUrl);
    console.log('🔍 [DEBUG] window.location.href (pełny):', window.location.href);
    
    // Zapisz return URL w localStorage (Shopify może ignorować return_url parameter)
    localStorage.setItem('customify_return_url', returnUrl);
    localStorage.setItem('customify_return_url_timestamp', Date.now().toString());
    console.log('💾 [USAGE] Saved return URL to localStorage:', returnUrl);
    console.log('💾 [USAGE] Timestamp:', Date.now());
    
    // Użyj pełnego URL z domeną - Shopify potrzebuje pełnego URL dla return_url
    const fullReturnUrl = window.location.origin + returnUrl;
    console.log('🌐 [DEBUG] Full return URL:', fullReturnUrl);
    
    // Shopify Customer Account może wymagać specjalnego formatu return_url
    const encodedReturnUrl = encodeURIComponent(fullReturnUrl);
    console.log('🔐 [DEBUG] Encoded return URL:', encodedReturnUrl);
    
    const registerUrl = `/account/register?return_url=${encodedReturnUrl}`;
    const loginUrl = `/account/login?return_url=${encodedReturnUrl}`;
    
    console.log('🔗 [DEBUG] Register URL:', registerUrl);
    console.log('🔗 [DEBUG] Login URL:', loginUrl);
    console.log('🔗 [DEBUG] Register URL (decoded):', decodeURIComponent(registerUrl));
    console.log('🔗 [DEBUG] Login URL (decoded):', decodeURIComponent(loginUrl));
    
    const markAuthIntent = (type) => {
      try {
        localStorage.setItem('customify_auth_intent', type);
        localStorage.setItem('customify_auth_intent_timestamp', Date.now().toString());
        localStorage.setItem('customify_auth_source', window.location.pathname + window.location.search);
        console.log('🔐 [AUTH] Marked auth intent:', type);
      } catch (error) {
        console.warn('⚠️ [AUTH] Failed to mark auth intent:', error);
      }
    };
    
    const modalHTML = `
      <div id="loginModal" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.75);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        animation: fadeIn 0.3s ease;
      ">
        <div style="
          background: white;
          padding: 50px 40px;
          border-radius: 16px;
          max-width: 550px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
          animation: slideUp 0.3s ease;
          position: relative;
        ">
          <button onclick="window.customifyLoginModal.cancel()" style="
            position: absolute;
            top: 15px;
            right: 15px;
            background: transparent;
            border: none;
            font-size: 24px;
            color: #999;
            cursor: pointer;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s;
            padding: 0;
            line-height: 1;
          " onmouseover="this.style.background='#f5f5f5'; this.style.color='#333'" onmouseout="this.style.background='transparent'; this.style.color='#999'">
            ×
          </button>
          <h2 style="
            margin-bottom: 15px; 
            color: #333; 
            font-size: 18px;
            font-weight: 600;
            line-height: 1.5;
          ">Chcesz wygenerować kolejną wersję?</h2>
          
          <p style="
            margin-bottom: 30px;
            color: #666;
            font-size: 15px;
            line-height: 1.5;
          ">Zaloguj się – darmowe generację, zapis swoich projektów</p>
          
          <div style="
            display: flex; 
            gap: 12px; 
            justify-content: center;
            flex-wrap: wrap;
          ">
            <a href="${registerUrl}" onclick="window.customifyLoginModal.trackRegisterClick()" style="
              background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
              color: white;
              padding: 14px 32px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: bold;
              font-size: 16px;
              display: inline-block;
              box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
              transition: transform 0.2s;
            " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
              Tak, chcę korzystać
            </a>
            
            <button onclick="window.customifyLoginModal.cancel()" style="
              background: #f5f5f5;
              color: #666;
              padding: 14px 32px;
              border-radius: 8px;
              border: 2px solid #ddd;
              font-weight: bold;
              font-size: 16px;
              cursor: pointer;
              transition: all 0.2s;
            " onmouseover="this.style.background='#e0e0e0'" onmouseout="this.style.background='#f5f5f5'">
              Nie teraz
            </button>
          </div>
          
          <div style="
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
          ">
            <p style="
              color: #666;
              font-size: 14px;
              margin: 0;
            ">
              Szybkie logowanie przez Google lub e-mail.
            </p>
          </div>
        </div>
      </div>
    `;
    
    // CSS Animations
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(styleEl);
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // ✅ ŚLEDZENIE: Wyświetlenie modala logowania
    // GA4
    if (typeof gtag !== 'undefined') {
      gtag('event', 'login_modal_shown', {
        'event_category': 'Customify',
        'event_label': 'Usage Limit Reached',
        'used_count': usedCount,
        'limit': limit,
        'product_url': window.location.pathname,
        'is_logged_in': false
      });
      console.log('📊 [GA4] Event sent: login_modal_shown', {
        usedCount: usedCount,
        limit: limit,
        url: window.location.pathname
      });
    }
    
    // Własny endpoint (widoczne na żywo)
    fetch('https://customify-s56o.vercel.app/api/admin/login-modal-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'login_modal_shown',
        usedCount: usedCount,
        limit: limit,
        productUrl: window.location.pathname,
        timestamp: new Date().toISOString()
      })
    }).catch(err => console.log('📊 [STATS] Failed to send event:', err));
    
    // Auto-redirect do REJESTRACJI po 5 sekundach (bez widocznego countdown)
    const countdownInterval = setInterval(() => {
      // Sprawdź czy modal nadal istnieje
      const modal = document.getElementById('loginModal');
      if (!modal) {
        clearInterval(countdownInterval);
        return;
      }
      
      // Po 5 sekundach przekieruj
      clearInterval(countdownInterval);
      markAuthIntent('register_auto_redirect');
      
      // ✅ ŚLEDZENIE: Auto-redirect do rejestracji (po 5 sekundach)
      // GA4
      if (typeof gtag !== 'undefined') {
        gtag('event', 'login_modal_auto_redirect', {
          'event_category': 'Customify',
          'event_label': 'Auto Redirect to Register',
          'used_count': usedCount,
          'limit': limit,
          'product_url': window.location.pathname
        });
        console.log('📊 [GA4] Event sent: login_modal_auto_redirect');
      }
      
      // Własny endpoint
      fetch('https://customify-s56o.vercel.app/api/admin/login-modal-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'login_modal_auto_redirect',
          usedCount: usedCount,
          limit: limit,
          productUrl: window.location.pathname,
          timestamp: new Date().toISOString()
        })
      }).catch(err => console.log('📊 [STATS] Failed to send event:', err));
      
      window.location.href = registerUrl;
    }, 5000);
    
    // Global function to close modal
    window.customifyLoginModal = {
      cancel: () => {
        // ✅ ŚLEDZENIE: Kliknięcie w Anuluj
        // GA4
        if (typeof gtag !== 'undefined') {
          gtag('event', 'login_modal_cancel_click', {
            'event_category': 'Customify',
            'event_label': 'Modal Cancelled',
            'used_count': usedCount,
            'limit': limit,
            'product_url': window.location.pathname
          });
          console.log('📊 [GA4] Event sent: login_modal_cancel_click');
        }
        
        // Własny endpoint
        fetch('https://customify-s56o.vercel.app/api/admin/login-modal-stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'login_modal_cancel_click',
            usedCount: usedCount,
            limit: limit,
            productUrl: window.location.pathname,
            timestamp: new Date().toISOString()
          })
        }).catch(err => console.log('📊 [STATS] Failed to send event:', err));
        
        clearInterval(countdownInterval);
        document.getElementById('loginModal')?.remove();
        console.log('🚫 [USAGE] Użytkownik zamknął modal');
      },
      
      trackRegisterClick: () => {
        markAuthIntent('register_click');
        // ✅ ŚLEDZENIE: Kliknięcie w Kontynuuj (rejestracja)
        // GA4
        if (typeof gtag !== 'undefined') {
          gtag('event', 'login_modal_register_click', {
            'event_category': 'Customify',
            'event_label': 'Register Button Clicked',
            'used_count': usedCount,
            'limit': limit,
            'product_url': window.location.pathname
          });
          console.log('📊 [GA4] Event sent: login_modal_register_click');
        }
        
        // Własny endpoint
        fetch('https://customify-s56o.vercel.app/api/admin/login-modal-stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'login_modal_register_click',
            usedCount: usedCount,
            limit: limit,
            productUrl: window.location.pathname,
            timestamp: new Date().toISOString()
          })
        }).catch(err => console.log('📊 [STATS] Failed to send event:', err));
      },
      
      trackLoginClick: () => {
        markAuthIntent('login_click');
        // ✅ ŚLEDZENIE: Kliknięcie w Zaloguj się
        // GA4
        if (typeof gtag !== 'undefined') {
          gtag('event', 'login_modal_login_click', {
            'event_category': 'Customify',
            'event_label': 'Login Link Clicked',
            'used_count': usedCount,
            'limit': limit,
            'product_url': window.location.pathname
          });
          console.log('📊 [GA4] Event sent: login_modal_login_click');
        }
        
        // Własny endpoint
        fetch('https://customify-s56o.vercel.app/api/admin/login-modal-stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'login_modal_login_click',
            usedCount: usedCount,
            limit: limit,
            productUrl: window.location.pathname,
            timestamp: new Date().toISOString()
          })
        }).catch(err => console.log('📊 [STATS] Failed to send event:', err));
      }
    };
  }

  /**
   * Pokazuje licznik użyć w UI
   */
  async showUsageCounter() {
    console.log('🔍 [USAGE] showUsageCounter() called');
    
    // Usage counter initialization
    const customerInfo = this.getCustomerInfo();
    console.log('🔍 [USAGE] Customer info:', customerInfo ? 'logged in' : 'not logged in');
    let counterHTML = '';
    
    if (!customerInfo) {
      // Niezalogowany - UKRYJ licznik (nie pokazuj komunikatu)
      console.log(`🔍 [USAGE] Not logged in - hiding usage counter`);
      counterHTML = ''; // Nie pokazuj komunikatu dla niezalogowanych
    } else {
      // Zalogowany - pobierz z API
      console.log('🔍 [USAGE] Fetching usage data from API...');
      try {
        const response = await fetch('https://customify-s56o.vercel.app/api/check-usage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId: customerInfo.customerId,
            customerAccessToken: customerInfo.customerAccessToken
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const remaining = data.remainingCount || 0;
          const totalLimit = data.totalLimit || 3;
          
          console.log(`🔍 [USAGE] API response - remaining: ${remaining}, totalLimit: ${totalLimit}`);
          
          if (remaining > 0) {
            // Niebieski - zalogowany, pozostało transformacji
            counterHTML = `
              <div id="usageCounter" class="usage-counter usage-counter-blue">
                ✅ Zalogowany: ${remaining}/${totalLimit} transformacji
              </div>
            `;
          } else {
            // Czerwony - limit wykorzystany
            counterHTML = `
              <div id="usageCounter" class="usage-counter usage-counter-red">
                ❌ Wykorzystano ${totalLimit}/${totalLimit} transformacji
              </div>
            `;
          }
        } else {
          console.warn('⚠️ [USAGE] Failed to fetch usage data:', response.status);
          // Fallback - pokaż że jest zalogowany ale nie wiemy ile ma transformacji
          counterHTML = `
            <div id="usageCounter" class="usage-counter usage-counter-blue">
              ✅ Zalogowany - sprawdzanie limitów...
            </div>
          `;
        }
      } catch (error) {
        console.error('❌ [USAGE] Error fetching usage counter:', error);
        // Fallback - pokaż że jest zalogowany ale nie wiemy ile ma transformacji
        counterHTML = `
          <div id="usageCounter" class="usage-counter usage-counter-blue">
            ✅ Zalogowany - sprawdzanie limitów...
          </div>
        `;
      }
    }
    
    console.log('🔍 [USAGE] counterHTML generated:', counterHTML ? 'YES' : 'NO', counterHTML.substring(0, 100));
    
    // Wstaw licznik do DOM (przed upload area)
    const uploadArea = document.getElementById('uploadArea');
    console.log('🔍 [USAGE] uploadArea found:', !!uploadArea);
    
    if (uploadArea && counterHTML) {
      // Usuń stary licznik jeśli istnieje
      const oldCounter = document.getElementById('usageCounter');
      if (oldCounter) {
        oldCounter.remove();
        console.log('🔍 [USAGE] Removed old counter');
      }
      
      // Wstaw nowy licznik przed upload area
      uploadArea.insertAdjacentHTML('beforebegin', counterHTML);
      console.log('✅ [USAGE] Usage counter displayed successfully');
    } else {
      if (!uploadArea) {
        console.warn('⚠️ [USAGE] Upload area not found - counter not displayed');
      }
      if (!counterHTML) {
        console.warn('⚠️ [USAGE] counterHTML is empty - counter not displayed');
      }
    }
  }

  // filterStylesForProduct() USUNIĘTE - logika przeniesiona na server-side (Shopify Liquid)

  // ETSY-STYLE EXPANDABLE DESCRIPTION USUNIĘTE - opisy produktów są teraz pełne

  // ACCORDION: SZCZEGÓŁY PRODUKTU
  setupAccordion() {
    console.log('🎯 [CUSTOMIFY] Setting up accordion...');
    
    // Znajdź wszystkie accordion items
    const accordionItems = document.querySelectorAll('.accordion-item');
    
    if (!accordionItems || accordionItems.length === 0) {
      console.log('⚠️ [CUSTOMIFY] No accordion items found');
      return;
    }
    
    console.log('✅ [CUSTOMIFY] Found', accordionItems.length, 'accordion items');
    
    // Dodaj event listener do każdego accordion header
    accordionItems.forEach((item, index) => {
      const header = item.querySelector('.accordion-header');
      
      if (!header) {
        console.log('⚠️ [CUSTOMIFY] No header found for item', index);
        return;
      }
      
      // Event listener - TYLKO toggle klasy (BEZ DOM manipulation)
      header.addEventListener('click', () => {
        const isExpanded = item.classList.contains('expanded');
        
        if (isExpanded) {
          // Zwiń
          item.classList.remove('expanded');
          console.log('🔽 [CUSTOMIFY] Collapsed:', item.dataset.accordion);
        } else {
          // Rozwiń (opcjonalnie: zwiń inne)
          // accordionItems.forEach(otherItem => otherItem.classList.remove('expanded'));
          item.classList.add('expanded');
          console.log('🔼 [CUSTOMIFY] Expanded:', item.dataset.accordion);
        }
      });
      
      console.log('✅ [CUSTOMIFY] Accordion item', index, 'setup complete');
    });
    
    console.log('✅ [CUSTOMIFY] Accordion setup complete!');
  }

  // WSTRZYJ APLIKACJĘ DO KOLUMNY 2
  positionApp() {
    if (!window.location.pathname.includes('/products/')) {
      return;
    }

    const appContainer = document.getElementById('customify-app-container');
    if (!appContainer) return;

    // Znajdź kolumnę 2 (detale produktu)
    const productDetails = document.querySelector('#ProductInformation-template--26351135293765__main') || 
                          document.querySelector('.product-details') ||
                          document.querySelector('.product__info');

    if (productDetails) {
      console.log('🎯 [CUSTOMIFY] Found product details column, inserting app at top');
      
      // Dodaj elementy pod tytułem
      this.addProductBadges();
      
      // Pokaż aplikację
      appContainer.style.display = 'block';
      
      // Wstaw na górę kolumny 2
      productDetails.insertBefore(appContainer, productDetails.firstChild);
      
      // USTAW FINALNY UKŁAD ELEMENTÓW
      this.setFinalLayout();
    } else {
      console.warn('⚠️ [CUSTOMIFY] Could not find product details column');
    }
  }


  // USTAW FINALNY UKŁAD ELEMENTÓW - JEDNA FUNKCJA, BEZ HISTORII PRZENIESIEŃ
  setFinalLayout() {
    console.log('🎯 [LAYOUT] Ustawiam finalny układ elementów...');
    
    // 1. ZNAJDŹ GŁÓWNY KONTENER
    const productInfoColumn = document.querySelector('[id^="ProductInformation-"]');
    if (!productInfoColumn) {
      console.warn('⚠️ [LAYOUT] Nie znaleziono ProductInformation');
      return;
    }

    // 2. ZNAJDŹ WSZYSTKIE ELEMENTY
    const titleElement = document.querySelector('.group-block[data-testid="group-block"] [class*="product_title"]')?.parentElement?.parentElement;
    const descriptionElement = document.querySelector('rte-formatter');
    const priceElement = document.querySelector('product-price');
    const productTypeArea = document.getElementById('productTypeArea');
    const sizeArea = document.getElementById('sizeArea');

    console.log('📦 [LAYOUT] Znalezione elementy:', {
      title: !!titleElement,
      description: !!descriptionElement,
      price: !!priceElement,
      productType: !!productTypeArea,
      sizes: !!sizeArea
    });

    // 3. UTWÓRZ KONTENER DLA UPORZĄDKOWANYCH ELEMENTÓW
    let orderedContainer = productInfoColumn.querySelector('.customify-ordered-layout');
    if (!orderedContainer) {
      orderedContainer = document.createElement('div');
      orderedContainer.className = 'customify-ordered-layout';
      orderedContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
      `;
      productInfoColumn.appendChild(orderedContainer);
    }

    // 4. USTAW KOLEJNOŚĆ: TYTUŁ > OPIS > CENA > TYPY > ROZMIARY
    if (titleElement && !titleElement.classList.contains('layout-set')) {
      orderedContainer.appendChild(titleElement);
      titleElement.classList.add('layout-set');
      console.log('✅ [LAYOUT] Tytuł ustawiony');
    }

    if (descriptionElement && !descriptionElement.classList.contains('layout-set')) {
      orderedContainer.appendChild(descriptionElement);
      descriptionElement.classList.add('layout-set');
      console.log('✅ [LAYOUT] Opis ustawiony');
    }

    if (priceElement && !priceElement.classList.contains('layout-set')) {
      orderedContainer.appendChild(priceElement);
      priceElement.classList.add('layout-set');
      console.log('✅ [LAYOUT] Cena ustawiona');
    }

    if (productTypeArea && !productTypeArea.classList.contains('layout-set')) {
      orderedContainer.appendChild(productTypeArea);
      productTypeArea.classList.add('layout-set');
      console.log('✅ [LAYOUT] Typy materiału ustawione');
    }

    if (sizeArea && !sizeArea.classList.contains('layout-set')) {
      orderedContainer.appendChild(sizeArea);
      sizeArea.classList.add('layout-set');
      console.log('✅ [LAYOUT] Rozmiary ustawione');
    }

    console.log('🎉 [LAYOUT] Finalny układ ustawiony!');

    // NIE ukrywamy ceny - zostawiamy oryginalną pozycję Shopify
    // (usunięto klonowanie ceny ze względu na potencjalne problemy z cloakingiem Google)

    // DODAJ DIVIDER POD ROZMIARAMI
    this.addDividerAfterSizes();

    console.log('✅ [CUSTOMIFY] Title moved to top successfully!');
  }



  // DODAJ DIVIDER POD ROZMIARAMI
  addDividerAfterSizes() {
    // Sprawdź czy już nie ma dividera
    if (document.querySelector('.customify-title-divider')) {
      console.log('🎯 [CUSTOMIFY] Divider already exists');
      return;
    }

    // Znajdź kontener z rozmiarami
    const sizeArea = document.getElementById('sizeArea');
    if (!sizeArea) {
      console.warn('⚠️ [CUSTOMIFY] Could not find sizeArea for divider');
      return;
    }

    // Stwórz divider
    const divider = document.createElement('div');
    divider.className = 'customify-title-divider';
    divider.style.cssText = `
      width: 100%;
      height: 1px;
      background-color: #ccc;
      margin: 15px 0;
      border-radius: 0.5px;
    `;

    // Dodaj divider po rozmiarach
    sizeArea.parentNode.insertBefore(divider, sizeArea.nextSibling);

    console.log('✅ [CUSTOMIFY] Divider added after sizes');
  }

  // FUNKCJA USUNIĘTA: showPriceBelowApp()
  // Powód: Potencjalne problemy z cloakingiem Google (klonowanie elementów DOM)
  // Cena pozostaje w oryginalnej pozycji Shopify

  // DODAJ GWIAZDKI DO OPISU PRODUKTU (rte-formatter)
  addProductBadges() {
    console.log('🎯 [CUSTOMIFY] Dodaję gwiazdki do opisu produktu...');
    
    // Znajdź opis produktu (rte-formatter)
    const descriptionElement = document.querySelector('rte-formatter');
    if (!descriptionElement) {
      console.log('⚠️ [CUSTOMIFY] Nie znaleziono rte-formatter');
      return;
    }

    // Sprawdź czy już nie ma badge'ów
    if (document.querySelector('.product-badges')) {
      console.log('⚠️ [CUSTOMIFY] Badge\'y już istnieją');
      return;
    }

    // Stwórz kontener dla badge'ów
    const badgesContainer = document.createElement('div');
    badgesContainer.className = 'product-badges';
    badgesContainer.style.cssText = 'margin-bottom: 16px; display: block;';

    // Dodaj sekcję z gwiazdkami
    const ratingSection = document.createElement('div');
    ratingSection.className = 'rating-section';

    const stars = document.createElement('div');
    stars.className = 'stars';
    for (let i = 0; i < 5; i++) {
      const star = document.createElement('span');
      star.className = 'star';
      star.innerHTML = '★';
      stars.appendChild(star);
    }

    const reviewCount = document.createElement('span');
    reviewCount.className = 'review-count';
    reviewCount.textContent = '(143)';

    ratingSection.appendChild(stars);
    ratingSection.appendChild(reviewCount);

    // Dodaj do kontenera
    badgesContainer.appendChild(ratingSection);

    // DODAJ GWIAZDKI NA POCZĄTEK OPISU (przed tekstem w rte-formatter)
    descriptionElement.insertBefore(badgesContainer, descriptionElement.firstChild);
    
    // DODAJ MARGINES DO TEKSTU OPISU (aby gwiazdki nie zasłaniały)
    const descriptionText = descriptionElement.querySelector('p, .p1');
    if (descriptionText) {
      descriptionText.style.setProperty('margin-top', '24px', 'important');
      console.log('✅ [CUSTOMIFY] Margines dodany do tekstu opisu: 24px');
    }
    
    console.log('✅ [CUSTOMIFY] Gwiazdki dodane do opisu produktu');
  }

  setupEventListeners() {
    this.uploadArea.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));
    
    this.uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.uploadArea.classList.add('dragover');
    });
    
    this.uploadArea.addEventListener('dragleave', () => {
      this.uploadArea.classList.remove('dragover');
    });
    
    this.uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      this.uploadArea.classList.remove('dragover');
      this.handleFileSelect(e.dataTransfer.files[0]);
    });

    this.stylesArea.addEventListener('click', (e) => {
      console.log('🖱️ [CLICK] Kliknięcie w stylesArea:', e.target);
      console.log('🖱️ [CLICK] Czy to customify-style-card?', e.target.classList.contains('customify-style-card'));
      console.log('🖱️ [CLICK] Czy closest?', e.target.closest('.customify-style-card'));
      
      if (e.target.classList.contains('customify-style-card') || 
          e.target.closest('.customify-style-card')) {
        const card = e.target.classList.contains('customify-style-card') ? 
                    e.target : e.target.closest('.customify-style-card');
        console.log('🖱️ [CLICK] Znaleziona karta:', card);
        console.log('🖱️ [CLICK] data-style:', card?.dataset?.style);
        this.selectStyle(card);
      } else {
        console.log('🖱️ [CLICK] Kliknięcie poza kartą stylu');
      }
    });

    // Event listener dla rozmiarów - sprawdź zarówno główny jak i w resultArea
    document.addEventListener('click', (e) => {
      const sizeBtn = e.target.closest('.customify-size-btn');
      if (sizeBtn) {
        if (sizeBtn.classList.contains('disabled')) {
          e.preventDefault();
          return;
        }
        this.selectSize(sizeBtn);
      }
    });

    // Event listener dla wyboru typu produktu (Plakat vs Canvas)
    document.addEventListener('click', (e) => {
      if (e.target.id === 'textOverlayToggleBtn') {
        return; // nie traktuj toggle jako wyboru typu produktu
      }
      if (e.target.classList.contains('customify-product-type-btn')) {
        this.selectProductType(e.target);
      }
    });

    document.getElementById('transformBtn').addEventListener('click', () => this.transformImage());
    document.getElementById('resetBtn').addEventListener('click', () => this.reset());
    document.getElementById('addToCartBtn').addEventListener('click', () => this.addToCart());
    document.getElementById('addToCartBtnMain').addEventListener('click', () => this.addToCart());
    const addToCartBtnPhoneCase = document.getElementById('addToCartBtnPhoneCase');
    if (addToCartBtnPhoneCase) addToCartBtnPhoneCase.addEventListener('click', () => this.addToCart());
    document.getElementById('tryAgainBtn').addEventListener('click', () => this.tryAgain());

    if (this.spotifyCropConfirmBtn) {
      this.spotifyCropConfirmBtn.addEventListener('click', () => this.confirmSpotifyCrop());
    }
    if (this.spotifyCropCancelBtn) {
      this.spotifyCropCancelBtn.addEventListener('click', () => this.cancelSpotifyCrop());
    }
    
    // 📱 Telefon - event listenery dla croppera (sprawdź w momencie użycia)
    const phoneCropConfirmBtn = document.getElementById('phoneCropConfirmBtn');
    const phoneCropCancelBtn = document.getElementById('phoneCropCancelBtn');
    if (phoneCropConfirmBtn) {
      phoneCropConfirmBtn.addEventListener('click', () => this.confirmPhoneCrop());
    }
    if (phoneCropCancelBtn) {
      phoneCropCancelBtn.addEventListener('click', () => this.cancelPhoneCrop());
    }
    
    // 📱 Telefon (etui) - event listenery dla croppera
    const phonePhotoCropConfirmBtn = document.getElementById('phonePhotoCropConfirmBtn');
    const phonePhotoCropCancelBtn = document.getElementById('phonePhotoCropCancelBtn');
    if (phonePhotoCropConfirmBtn) {
      phonePhotoCropConfirmBtn.addEventListener('click', () => this.confirmPhonePhotoCrop());
    }
    if (phonePhotoCropCancelBtn) {
      phonePhotoCropCancelBtn.addEventListener('click', () => this.cancelPhonePhotoCrop());
    }
    
    // 🎵 Kliknięcie w preview image otwiera cropper ponownie (ponowne kadrowanie)
    if (this.isCropperProduct()) {
      if (this.isPhonePhotoCaseProduct()) {
        // 📱 Phone case: click na preview (przed AI) i result (po AI) - ponowne kadrowanie
        const photoBg = document.getElementById('phoneCasePhotoBg');
        const resultBg = document.getElementById('phoneCaseResultBg');
        [photoBg, resultBg].forEach(el => {
          if (el) {
            el.style.cursor = 'pointer';
            el.title = 'Kliknij aby ponownie wykadrować zdjęcie';
            el.addEventListener('click', () => this.reopenPhonePhotoCropper());
          }
        });
      } else if (this.previewImage) {
        this.previewImage.style.cursor = 'pointer';
        this.previewImage.title = 'Kliknij aby ponownie wykadrować zdjęcie';
        if (this.isPhoneCaseProduct()) {
          this.previewImage.addEventListener('click', () => this.reopenPhoneCropper());
        } else {
          this.previewImage.addEventListener('click', () => this.reopenSpotifyCropper());
        }
      }
    }
    
    // 📱 Phone case preview initialization (background-image mode)
    if (this.isPhonePhotoCaseProduct()) {
      console.log('📱 [PHONE PREVIEW] Initializing phone case preview (background-image mode)...');
      const photoBg = document.getElementById('phoneCasePhotoBg');
      if (photoBg) {
        console.log(`📱 [PHONE PREVIEW] Found preview background div`);
      } else {
        console.warn('⚠️ [PHONE PREVIEW] No preview background div found - HTML may not be updated');
      }
      
      // Debug: Log rendered sizes
      setTimeout(() => {
        const inner = document.querySelector('#customify-app-container .phone-case-inner');
        const overlay = document.querySelector('#customify-app-container .phone-case-overlay');
        const photoBgEl = document.getElementById('phoneCasePhotoBg');
        if (inner) {
          const innerRect = inner.getBoundingClientRect();
          console.log('[PHONE PREVIEW] inner rect', {
            width: innerRect.width,
            height: innerRect.height,
            aspectRatio: innerRect.width / innerRect.height,
            expectedRatio: 559 / 1154
          });
        }
        if (overlay) {
          const overlayRect = overlay.getBoundingClientRect();
          console.log('[PHONE PREVIEW] overlay rect', {
            width: overlayRect.width,
            height: overlayRect.height,
            aspectRatio: overlayRect.width / overlayRect.height,
            expectedRatio: 559 / 1154
          });
        }
        if (photoBgEl) {
          const photoBgRect = photoBgEl.getBoundingClientRect();
          console.log('[PHONE PREVIEW] photo-bg rect', {
            width: photoBgRect.width,
            height: photoBgRect.height,
            aspectRatio: photoBgRect.width / photoBgRect.height
          });
        }
      }, 500);
    }
  }
  
  // 🎵 Ponowne otwarcie croppera z oryginalnym zdjęciem
  reopenSpotifyCropper() {
    if (!this.originalSpotifyFile) {
      console.warn('⚠️ [SPOTIFY] Brak oryginalnego zdjęcia do ponownego kadrowania');
      return;
    }
    console.log('🎵 [SPOTIFY] Ponowne otwieranie croppera z oryginalnym zdjęciem');
    
    // Resetuj flagę spotifyBezZmianActive żeby syncPosition znów działał
    window.spotifyBezZmianActive = false;
    
    // Otwórz cropper z oryginalnym zdjęciem
    this.openSpotifyCropper(this.originalSpotifyFile);
  }

  /**
   * Inicjalizacja UI napisów (tylko produkt pilota)
   */
  setupTextOverlayUI() {
    if (!this.textOverlayEnabled) {
      if (this.textOverlayPanel) {
        this.textOverlayPanel.style.display = 'none';
      }
      return;
    }

    if (this.textOverlayInput && this.textOverlayCounter) {
      this.textOverlayInput.addEventListener('input', () => {
        this.updateTextOverlayCounter();
        this.textOverlayState.applied = false;
        
        // ✅ DEBOUNCE: Opóźnij preview o 80ms żeby nie renderować przy każdym znaku
        if (this.textOverlayDebounceTimer) {
          clearTimeout(this.textOverlayDebounceTimer);
        }
        this.textOverlayDebounceTimer = setTimeout(() => {
          this.previewTextOverlay().catch(err => {
            console.error('❌ [TEXT-OVERLAY] auto-preview error:', err);
          });
        }, 80);
      });
      this.updateTextOverlayCounter();
    }

    const bindSelect = (selectEl, key) => {
      if (!selectEl) return;
      selectEl.addEventListener('change', () => {
        // Specjalna logika dla kolorów: opcje z "-banner" wymuszają tło
        if (selectEl === this.textOverlayColorSelect) {
          const value = selectEl.value;
          const isBanner = value?.endsWith('-banner');
          const baseColor = isBanner ? value.replace('-banner', '') : value;
          this.textOverlayState.color = baseColor;
          this.textOverlayState.preset = isBanner ? 'banner' : 'classic';
        } else {
          this.textOverlayState[key] = selectEl.value;
        }
        this.textOverlayState.applied = false;
        
        // ✅ DEBOUNCE: Opóźnij preview o 80ms (tak samo jak dla input)
        if (this.textOverlayDebounceTimer) {
          clearTimeout(this.textOverlayDebounceTimer);
        }
        this.textOverlayDebounceTimer = setTimeout(() => {
          this.previewTextOverlay().catch(err => {
            console.error('❌ [TEXT-OVERLAY] auto-preview error:', err);
          });
        }, 80);
      });
    };

    bindSelect(this.textOverlayColorSelect, 'color');
    bindSelect(this.textOverlayFontSelect, 'font');
    bindSelect(this.textOverlaySizeSelect, 'size');

    if (this.textOverlayToggleBtn && this.textOverlayPanel) {
      this.textOverlayToggleBtn.addEventListener('click', () => {
        const isOpen = this.textOverlayPanel.style.display !== 'none';
        if (isOpen) {
          this.textOverlayPanel.style.display = 'none';
          this.textOverlayToggleBtn.setAttribute('data-overlay-open', 'false');
        } else {
          this.textOverlayPanel.style.display = 'block';
          this.textOverlayToggleBtn.setAttribute('data-overlay-open', 'true');
        }
      });
    }

    if (this.textOverlaySaveBtn) {
      this.textOverlaySaveBtn.addEventListener('click', () => {
        this.saveTextOverlay().catch(err => {
          console.error('❌ [TEXT-OVERLAY] save error:', err);
          this.showError('Nie udało się zapisać napisu. Spróbuj ponownie.', 'cart');
        });
      });
    }

    this.textOverlayState = {
      ...this.textOverlayState,
      preset: 'classic',
      color: this.textOverlayColorSelect?.value || null,
      font: this.textOverlayFontSelect?.value || null,
      size: this.textOverlaySizeSelect?.value || null
    };

    if (this.textOverlayPanel) {
      this.textOverlayPanel.style.display = 'none';
    }
  }

  updateTextOverlayCounter() {
    if (!this.textOverlayInput || !this.textOverlayCounter) return;
    const current = this.textOverlayInput.value.length;
    const max = this.textOverlayInput.maxLength || 80;
    this.textOverlayCounter.textContent = `${current}/${max}`;
  }

  updateTextOverlayHint(message = '') {
    if (!this.textOverlayHint) return;
    if (message) {
      this.textOverlayHint.textContent = message;
      this.textOverlayHint.style.display = 'block';
    } else {
      this.textOverlayHint.style.display = 'none';
    }
  }

  updateSpotifyFrameScale(retryCount = 0) {
    if (!this.isSpotifyProduct()) return;
    const containers = document.querySelectorAll('.spotify-frame-preview, .spotify-frame-result');
    if (!containers.length) return;

    let needsRetry = false;
    containers.forEach(container => {
      const inner = container.querySelector('.spotify-frame-inner');
      if (!inner) return;
      const styles = window.getComputedStyle(container);
      const padX = parseFloat(styles.paddingLeft || '0') + parseFloat(styles.paddingRight || '0');
      const padY = parseFloat(styles.paddingTop || '0') + parseFloat(styles.paddingBottom || '0');
      const availableWidth = Math.max(0, container.clientWidth - padX);
      
      // Jeśli container nie ma jeszcze wymiarów, zaplanuj retry
      if (availableWidth <= 0) {
        needsRetry = true;
        return;
      }
      
      const scale = availableWidth / 1024;
      inner.style.transform = `scale(${scale})`;
      container.style.height = `${1536 * scale + padY}px`;
    });
    
    // Retry max 10 razy co 50ms jeśli container nie ma wymiarów
    if (needsRetry && retryCount < 10) {
      setTimeout(() => this.updateSpotifyFrameScale(retryCount + 1), 50);
    }
  }

  /**
   * 🎵 Komponuje finalny obraz dla ramka-spotify
   * Zawiera: tło + zdjęcie użytkownika + maska spotify + teksty
   * @returns {Promise<string>} Base64 skomponowanego obrazu
   */
  async composeSpotifyImage() {
    return new Promise((resolve, reject) => {
      console.log('🎵 [SPOTIFY COMPOSE] Starting image composition...');
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Wymiary ramki spotify
      canvas.width = 1024;
      canvas.height = 1536;
      
      // 1. Przezroczyste tło (dla druku na szkle - podświetlane ramki)
      // Canvas domyślnie ma przezroczyste tło
      
      // 2. Zdjęcie użytkownika (wykadrowane)
      const userImage = new Image();
      userImage.crossOrigin = 'anonymous';
      
      // Użyj wykadrowanego zdjęcia (base64) lub transformedImage (URL – przez proxy przy Vercel Blob)
      let imageSource = this.spotifyCropDataUrl || this.transformedImage;
      if (imageSource && typeof imageSource === 'string' && imageSource.startsWith('http')) {
        imageSource = this.getCanvasSafeImageUrl(imageSource);
      }
      if (!imageSource) {
        reject(new Error('Brak zdjęcia do kompozycji'));
        return;
      }
      
      userImage.onload = () => {
        console.log('🎵 [SPOTIFY COMPOSE] User image loaded:', userImage.width, 'x', userImage.height);
        
        // Rysuj zdjęcie użytkownika w pozycji 61,61 o rozmiarze 902x902
        ctx.drawImage(userImage, 61, 61, 902, 902);
        
        // 3. Nałóż maskę spotify
        const maskImage = new Image();
        maskImage.crossOrigin = 'anonymous';
        maskImage.src = 'https://customify-s56o.vercel.app/spotify/biale_male.png';
        
        maskImage.onload = () => {
          console.log('🎵 [SPOTIFY COMPOSE] Mask loaded');
          ctx.drawImage(maskImage, 0, 0, canvas.width, canvas.height);
          
          // 4. Dodaj teksty
          const titleInput = document.getElementById('spotifyTitle');
          const artistInput = document.getElementById('spotifyArtist');
          const titleText = titleInput ? titleInput.value : '';
          const artistText = artistInput ? artistInput.value : '';
          
          // Pozycja tekstów (między zdjęciem a kontrolerami) - zgodna z CSS (top: 1000px)
          // Używamy textBaseline = 'top' żeby pozycjonować od góry tekstu (jak w CSS)
          ctx.textBaseline = 'top';
          const textY = 1000; // Zgodne z CSS .spotify-text-overlay { top: 1000px; }
          
          // Nagłówek - gruby, BIAŁY, wyrównany do lewej
          if (titleText) {
            ctx.font = 'bold 72px Arial, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(titleText, 61, textY);
            console.log('🎵 [SPOTIFY COMPOSE] Title added:', titleText);
          }
          
          // Podpis - cieńszy, BIAŁY, wyrównany do lewej
          // Oblicz pozycję na podstawie wysokości nagłówka (72px) + odstęp (6px jak w CSS margin-bottom)
          if (artistText) {
            ctx.font = '48px Arial, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(artistText, 61, textY + 72 + 6); // 72px (wysokość nagłówka) + 6px (margin-bottom z CSS)
            console.log('🎵 [SPOTIFY COMPOSE] Artist added:', artistText);
          }
          
          // 5. Eksportuj jako PNG (przezroczystość dla druku na szkle!)
          const composedImagePNG = canvas.toDataURL('image/png');
          console.log('🎵 [SPOTIFY COMPOSE] PNG for print, size:', composedImagePNG.length);
          
          // 6. Eksportuj również JPEG z ciemniejszym szarym tłem (dla podglądu w koszyku - lepiej widać białe napisy)
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = '#9a9a9a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const composedImagePreview = canvas.toDataURL('image/jpeg', 0.92);
          console.log('🎵 [SPOTIFY COMPOSE] JPEG preview, size:', composedImagePreview.length);
          
          // Zwróć oba obrazy
          const composedImage = { png: composedImagePNG, preview: composedImagePreview };
          
          resolve(composedImage);
        };
        
        maskImage.onerror = (err) => {
          console.error('🎵 [SPOTIFY COMPOSE] Failed to load mask:', err);
          reject(new Error('Nie udało się załadować maski spotify'));
        };
      };
      
      userImage.onerror = (err) => {
        console.error('🎵 [SPOTIFY COMPOSE] Failed to load user image:', err);
        reject(new Error('Nie udało się załadować zdjęcia'));
      };
      
      userImage.src = imageSource;
    });
  }

  getTextOverlayPayload() {
    if (!this.textOverlayEnabled || !this.textOverlayState.applied) return null;
    return {
      text: (this.textOverlayState.text || '').trim(),
      preset: this.textOverlayState.preset,
      color: this.textOverlayState.color,
      font: this.textOverlayState.font,
      size: this.textOverlayState.size
    };
  }

  openSpotifyCropper(file) {
    if (!this.spotifyCropModal || !this.spotifyCropImage) {
      this.showPreview(file);
      return;
    }
    if (typeof Cropper === 'undefined') {
      console.warn('⚠️ [SPOTIFY] CropperJS not loaded, fallback to normal preview');
      this.showPreview(file);
      return;
    }

    // 🎵 Zachowaj oryginalne zdjęcie do ponownego kadrowania
    this.originalSpotifyFile = file;
    console.log('🎵 [SPOTIFY] Zapisano oryginalne zdjęcie do ponownego kadrowania');

    this.spotifyCropConfirmed = false;
    if (this.spotifyCropper) {
      this.spotifyCropper.destroy();
      this.spotifyCropper = null;
    }
    if (this.spotifyCropSourceUrl) {
      URL.revokeObjectURL(this.spotifyCropSourceUrl);
      this.spotifyCropSourceUrl = null;
    }

    this.spotifyCropSourceUrl = URL.createObjectURL(file);
    this.spotifyCropImage.src = this.spotifyCropSourceUrl;
    this.spotifyCropModal.classList.add('is-open');
    this.spotifyCropModal.setAttribute('aria-hidden', 'false');

    const cropConfig = this.getCropConfig();
    this.spotifyCropper = new Cropper(this.spotifyCropImage, {
      aspectRatio: cropConfig.aspectRatio,
      viewMode: 1,
      autoCropArea: 1,
      responsive: true,
      movable: true,
      zoomable: true,
      zoomOnTouch: true,
      zoomOnWheel: true,
      background: false
    });
  }

  closeSpotifyCropper() {
    if (this.spotifyCropper) {
      this.spotifyCropper.destroy();
      this.spotifyCropper = null;
    }
    if (this.spotifyCropSourceUrl) {
      URL.revokeObjectURL(this.spotifyCropSourceUrl);
      this.spotifyCropSourceUrl = null;
    }
    if (this.spotifyCropModal) {
      this.spotifyCropModal.classList.remove('is-open');
      this.spotifyCropModal.setAttribute('aria-hidden', 'true');
    }
  }

  confirmSpotifyCrop() {
    if (!this.spotifyCropper) return;
    const cropConfig = this.getCropConfig();
    const canvas = this.spotifyCropper.getCroppedCanvas({
      width: cropConfig.width,
      height: cropConfig.height,
      imageSmoothingQuality: 'high'
    });
    canvas.toBlob((blob) => {
      if (!blob) {
        this.showError('Nie udało się przyciąć zdjęcia', 'transform');
        return;
      }
      const croppedFile = new File([blob], `${cropConfig.filePrefix}-${Date.now()}.jpg`, { type: 'image/jpeg' });
      this.uploadedFile = croppedFile;
      this.spotifyCropConfirmed = true;
      this.spotifyCropDataUrl = canvas.toDataURL('image/jpeg', 0.9); // Zapisz dla composeSpotifyImage
      this.closeSpotifyCropper();
      this.showPreview(croppedFile);
      this.hideError();
      
      // 🎵 Produkt bez AI - automatycznie aktywuj flow "bez-zmian" po kadrowanie
      if (this.isSpotifyNoAIProduct()) {
        console.log('🎵 [SPOTIFY NO-AI] Automatyczne przejście do koszyka po kadrowanie');
        this.selectedStyle = 'bez-zmian'; // Ustaw styl na "bez-zmian"
        setTimeout(() => this.handleBezZmianStyle(), 100); // Poczekaj na showPreview
      }
    }, 'image/jpeg', 0.9);
  }

  cancelSpotifyCrop() {
    this.uploadedFile = null;
    this.spotifyCropConfirmed = false;
    if (this.fileInput) {
      this.fileInput.value = '';
    }
    this.closeSpotifyCropper();
  }

  // 📱 TELEFON - Otwórz cropper
  openPhoneCropper(file) {
    // Sprawdź elementy w momencie użycia (nie w konstruktorze - mogą nie być w DOM)
    const phoneCropModal = document.getElementById('phoneCropModal');
    const phoneCropImage = document.getElementById('phoneCropImage');
    
    if (!phoneCropModal || !phoneCropImage) {
      console.warn('⚠️ [PHONE] Brak elementów croppera, fallback do normalnego preview');
      this.showPreview(file);
      return;
    }
    
    if (typeof Cropper === 'undefined') {
      console.warn('⚠️ [PHONE] CropperJS not loaded, fallback to normal preview');
      this.showPreview(file);
      return;
    }

    this.originalPhoneFile = file;
    console.log('📱 [PHONE] Zapisano oryginalne zdjęcie do ponownego kadrowania');

    this.phoneCropConfirmed = false;
    if (this.phoneCropper) {
      this.phoneCropper.destroy();
      this.phoneCropper = null;
    }
    if (this.phoneCropSourceUrl) {
      URL.revokeObjectURL(this.phoneCropSourceUrl);
      this.phoneCropSourceUrl = null;
    }

    this.phoneCropSourceUrl = URL.createObjectURL(file);
    phoneCropImage.src = this.phoneCropSourceUrl;
    phoneCropModal.classList.add('is-open');
    phoneCropModal.setAttribute('aria-hidden', 'false');

    const cropConfig = this.getPhoneCropConfig();
    this.phoneCropper = new Cropper(phoneCropImage, {
      aspectRatio: cropConfig.aspectRatio,
      viewMode: 1,
      autoCropArea: 1,
      responsive: true,
      movable: true,
      zoomable: true,
      zoomOnTouch: true,
      zoomOnWheel: true,
      background: false
    });
  }

  // 📱 TELEFON - Zamknij cropper
  closePhoneCropper() {
    if (this.phoneCropper) {
      this.phoneCropper.destroy();
      this.phoneCropper = null;
    }
    if (this.phoneCropSourceUrl) {
      URL.revokeObjectURL(this.phoneCropSourceUrl);
      this.phoneCropSourceUrl = null;
    }
    const phoneCropModal = document.getElementById('phoneCropModal');
    if (phoneCropModal) {
      phoneCropModal.classList.remove('is-open');
      phoneCropModal.setAttribute('aria-hidden', 'true');
    }
  }

  // 📱 TELEFON - Potwierdź kadrowanie
  confirmPhoneCrop() {
    if (!this.phoneCropper) return;
    const cropConfig = this.getPhoneCropConfig();
    const canvas = this.phoneCropper.getCroppedCanvas({
      width: cropConfig.width,
      height: cropConfig.height,
      imageSmoothingQuality: 'high'
    });
    canvas.toBlob((blob) => {
      if (!blob) {
        this.showError('Nie udało się przyciąć zdjęcia', 'transform');
        return;
      }
      const croppedFile = new File([blob], `${cropConfig.filePrefix}-${Date.now()}.jpg`, { type: 'image/jpeg' });
      this.uploadedFile = croppedFile;
      this.phoneCropConfirmed = true;
      this.phoneCropDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      this.closePhoneCropper();
      this.showPreview(croppedFile);
      this.hideError();
    }, 'image/jpeg', 0.9);
  }

  // 📱 TELEFON - Anuluj kadrowanie
  cancelPhoneCrop() {
    this.uploadedFile = null;
    this.phoneCropConfirmed = false;
    if (this.fileInput) {
      this.fileInput.value = '';
    }
    this.closePhoneCropper();
  }

  // 📱 TELEFON - Ponowne otwarcie croppera
  reopenPhoneCropper() {
    if (!this.originalPhoneFile) {
      console.warn('⚠️ [PHONE] Brak oryginalnego zdjęcia do ponownego kadrowania');
      return;
    }
    console.log('📱 [PHONE] Ponowne otwieranie croppera z oryginalnym zdjęciem');
    this.openPhoneCropper(this.originalPhoneFile);
  }
  
  // 📱 TELEFON (ETUI) - Otwórz cropper
  openPhonePhotoCropper(file) {
    const phonePhotoCropModal = document.getElementById('phonePhotoCropModal');
    const phonePhotoCropImage = document.getElementById('phonePhotoCropImage');
    
    if (!phonePhotoCropModal || !phonePhotoCropImage) {
      console.warn('⚠️ [PHONE-PHOTO] Brak elementów croppera, fallback do normalnego preview');
      this.showPreview(file);
      return;
    }
    
    if (typeof Cropper === 'undefined') {
      console.warn('⚠️ [PHONE-PHOTO] CropperJS not loaded, fallback to normal preview');
      this.showPreview(file);
      return;
    }
    
    this.originalPhonePhotoFile = file;
    console.log('📱 [PHONE-PHOTO] Zapisano oryginalne zdjęcie do ponownego kadrowania');
    
    this.phonePhotoCropConfirmed = false;
    if (this.phonePhotoCropper) {
      this.phonePhotoCropper.destroy();
      this.phonePhotoCropper = null;
    }
    if (this.phonePhotoCropSourceUrl) {
      URL.revokeObjectURL(this.phonePhotoCropSourceUrl);
      this.phonePhotoCropSourceUrl = null;
    }
    
    this.phonePhotoCropSourceUrl = URL.createObjectURL(file);
    
    // Hide watermark overlay initially (will be shown in reopenPhonePhotoCropper if needed)
    const watermarkOverlay = document.getElementById('phonePhotoCropWatermark');
    if (watermarkOverlay) {
      watermarkOverlay.style.display = 'none';
    }
    
    phonePhotoCropModal.classList.add('is-open');
    phonePhotoCropModal.setAttribute('aria-hidden', 'false');
    
    const cropConfig = this.getPhonePhotoCropConfig();
    const initCropper = () => {
      if (this.phonePhotoCropper) return;
      this.phonePhotoCropper = new Cropper(phonePhotoCropImage, {
        aspectRatio: cropConfig.aspectRatio,
        viewMode: 1,
        autoCropArea: 1,
        responsive: true,
        movable: true,
        zoomable: true,
        zoomOnTouch: true,
        zoomOnWheel: false,
        background: false
      });
    };
    phonePhotoCropImage.onload = () => {
      phonePhotoCropImage.onload = null;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          initCropper();
        });
      });
    };
    phonePhotoCropImage.src = this.phonePhotoCropSourceUrl;
    
    // Powiększone uchwyty croppera - z-index nad watermark, widoczne
    setTimeout(() => {
      const canvas = phonePhotoCropModal.querySelector('.phone-photo-crop-canvas');
      if (canvas) {
        const style = document.createElement('style');
        style.textContent = '.phone-photo-crop-canvas .cropper-point{width:20px!important;height:20px!important;background:#39f!important;border:2px solid #fff!important;box-shadow:0 0 0 1px rgba(0,0,0,.2)!important;z-index:10!important}.phone-photo-crop-canvas .cropper-line,.phone-photo-crop-canvas .cropper-face{border-color:#39f!important;border-width:2px!important;z-index:5!important}';
        document.head.appendChild(style);
      }
    }, 100);
  }
  
  // 📱 TELEFON (ETUI) - Zamknij cropper
  closePhonePhotoCropper() {
    if (this.phonePhotoCropper) {
      this.phonePhotoCropper.destroy();
      this.phonePhotoCropper = null;
    }
    if (this.phonePhotoCropSourceUrl) {
      URL.revokeObjectURL(this.phonePhotoCropSourceUrl);
      this.phonePhotoCropSourceUrl = null;
    }
    const phonePhotoCropModal = document.getElementById('phonePhotoCropModal');
    if (phonePhotoCropModal) {
      if (document.activeElement && phonePhotoCropModal.contains(document.activeElement)) {
        document.activeElement.blur();
      }
      phonePhotoCropModal.classList.remove('is-open');
      phonePhotoCropModal.setAttribute('aria-hidden', 'true');
    }
  }
  
  // 📱 TELEFON (ETUI) - Potwierdź kadrowanie
  confirmPhonePhotoCrop() {
    if (!this.phonePhotoCropper) return;
    const cropConfig = this.getPhonePhotoCropConfig();
    
    const finishWithCropped = (printDataUrl, displayDataUrl) => {
      displayDataUrl = displayDataUrl || printDataUrl;
      this.phonePhotoCropDataUrl = printDataUrl;
      this.closePhonePhotoCropper();
      if (this.transformedImage) {
        const resultBg = document.getElementById('phoneCaseResultBg');
        const photoBg = document.getElementById('phoneCasePhotoBg');
        if (resultBg) resultBg.style.backgroundImage = `url(${displayDataUrl})`;
        if (photoBg) photoBg.style.backgroundImage = `url(${displayDataUrl})`;
        if (this.resultImage) this.resultImage.src = displayDataUrl;
        this.transformedImage = printDataUrl;
        this.textOverlayBaseImage = printDataUrl; // 📱 Napis na wykadrowanym, nie na pełnym
      } else {
        const blob = this.dataUrlToBlob(printDataUrl);
        if (blob) this.showPreview(new File([blob], `${cropConfig.filePrefix}-${Date.now()}.jpg`, { type: 'image/jpeg' }));
        else this.showError('Nie udało się przygotować zdjęcia', 'transform');
      }
      this.phonePhotoCropConfirmed = true;
      const blob = this.dataUrlToBlob(printDataUrl);
      this.uploadedFile = blob ? new File([blob], `${cropConfig.filePrefix}-${Date.now()}.jpg`, { type: 'image/jpeg' }) : null;
      this.hideError();
    };
    
    if (this.phonePhotoCropSourceIsWatermarked && this.transformedImage) {
      const data = this.phonePhotoCropper.getData();
      const displayDataUrl = this.phonePhotoCropper.getCroppedCanvas({ width: cropConfig.width, height: cropConfig.height, imageSmoothingQuality: 'high' }).toDataURL('image/jpeg', 0.9);
      const cleanUrl = this.transformedImage.startsWith('http') ? this.getCanvasSafeImageUrl(this.transformedImage) : this.transformedImage;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = cropConfig.width;
        c.height = cropConfig.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, data.x, data.y, data.width, data.height, 0, 0, c.width, c.height);
        finishWithCropped(c.toDataURL('image/jpeg', 0.9), displayDataUrl);
      };
      img.onerror = () => finishWithCropped(displayDataUrl, displayDataUrl);
      img.src = cleanUrl;
      return;
    }
    
    const canvas = this.phonePhotoCropper.getCroppedCanvas({
      width: cropConfig.width,
      height: cropConfig.height,
      imageSmoothingQuality: 'high'
    });
    canvas.toBlob((blob) => {
      if (!blob) {
        this.showError('Nie udało się przyciąć zdjęcia', 'transform');
        return;
      }
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      finishWithCropped(dataUrl);
    }, 'image/jpeg', 0.9);
  }
  
  // 📱 TELEFON (ETUI) - Anuluj kadrowanie
  cancelPhonePhotoCrop() {
    this.uploadedFile = null;
    this.phonePhotoCropConfirmed = false;
    if (this.fileInput) {
      this.fileInput.value = '';
    }
    this.closePhonePhotoCropper();
  }
  
  // 📱 TELEFON (ETUI) - Ponowne otwarcie croppera
  async reopenPhonePhotoCropper() {
    // 📱 ZAWSZE watermark widoczny: ładujemy obraz Z watermarkem do croppera
    // Przy zapisie: stosujemy ten sam crop do czystego obrazu (dla druku)
    const watermarkedSource = this.watermarkedImageBase64 || this.watermarkedImageUrl;
    
    if (watermarkedSource && this.transformedImage) {
      try {
        let file;
        if (watermarkedSource.startsWith('data:')) {
          file = await this.base64ToFile(watermarkedSource, 'phone-photo-watermarked.jpg');
        } else if (watermarkedSource.startsWith('http') || watermarkedSource.includes('blob.vercel-storage.com')) {
          file = await this.urlToFile(this.getCanvasSafeImageUrl(watermarkedSource), 'phone-photo-watermarked.jpg');
        } else {
          // Backend zwraca raw base64 (bez prefiksu) dla etui
          const dataUrl = `data:image/jpeg;base64,${watermarkedSource}`;
          file = await this.base64ToFile(dataUrl, 'phone-photo-watermarked.jpg');
        }
        this.phonePhotoCropSourceIsWatermarked = true;
        this.openPhonePhotoCropper(file);
      } catch (error) {
        console.error('❌ [PHONE-PHOTO] Błąd ładowania watermarked:', error);
        this.showError('Nie udało się załadować obrazu do edycji. Odśwież stronę i spróbuj ponownie.', 'transform');
      }
    } else if (this.originalPhonePhotoFile) {
      this.phonePhotoCropSourceIsWatermarked = false;
      this.openPhonePhotoCropper(this.originalPhonePhotoFile);
    } else {
      console.warn('⚠️ [PHONE-PHOTO] Brak obrazu do kadrowania');
    }
  }

  handleFileSelect(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.showError('Proszę wybrać plik obrazu (JPG, PNG, GIF)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.showError('Plik jest za duży. Maksymalny rozmiar to 10MB');
      return;
    }

    this.hideError();
    if (this.isCropperProduct()) {
      console.log('🔍 [DEBUG] isCropperProduct = true');
      if (this.isPhoneCaseProduct()) {
        console.log('📱 [DEBUG] isPhoneCaseProduct = true, otwieram phone cropper');
        this.phoneCropConfirmed = false;
        this.openPhoneCropper(file);
      } else if (this.isPhonePhotoCaseProduct()) {
        console.log('📱 [DEBUG] isPhonePhotoCaseProduct = true, otwieram phone photo cropper');
        this.phonePhotoCropConfirmed = false;
        this.phonePhotoCropSourceIsWatermarked = false;
        this.openPhonePhotoCropper(file);
      } else {
        console.log('🎵 [DEBUG] isPhoneCaseProduct = false, otwieram spotify cropper');
        this.spotifyCropConfirmed = false;
        this.openSpotifyCropper(file);
      }
      return;
    }
    console.log('🔍 [DEBUG] isCropperProduct = false, normalny upload');
    this.uploadedFile = file;
    this.showPreview(file);

    // ✅ Google Ads Conversion Tracking - Image Upload Event
    if (typeof gtag !== 'undefined') {
      // Wyślij konwersję Google Ads z właściwym send_to ID
      gtag('event', 'conversion', {
        'send_to': 'AW-858040473/1k70CIur7LQbEJnRkpkD',
        'event_category': 'Customify',
        'event_label': 'Image Uploaded',
        'product_url': window.location.pathname,
        'file_size': file.size,
        'file_type': file.type
      });
      console.log('📊 [GOOGLE ADS] Conversion event sent: image_upload', 'AW-858040473/1k70CIur7LQbEJnRkpkD');
    } else {
      console.warn('⚠️ [GOOGLE ADS] gtag not available - conversion not tracked');
    }
  }

  showPreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      // Walidacja rozdzielczości obrazu
      const img = new Image();
      img.onload = () => {
        // Minimalna rozdzielczość dla wszystkich produktów: 600×600px
        const minWidth = 600;
        const minHeight = 600;
        
        console.log(`🖼️ [IMAGE] Rozdzielczość: ${img.width}×${img.height}`);
        console.log(`🖼️ [IMAGE] Minimalna rozdzielczość: ${minWidth}×${minHeight}px`);
        
        // Sprawdź minimalną rozdzielczość
        if (img.width < minWidth || img.height < minHeight) {
          this.showError(`Zdjęcie jest za małe. Minimalna rozdzielczość to ${minWidth}×${minHeight}px. Twoje zdjęcie: ${img.width}×${img.height}px`);
          this.previewArea.style.display = 'none';
          this.uploadedFile = null;
          this.fileInput.value = '';
          return;
        }
        
        // Zdjęcie OK - pokaż podgląd
        // 📱 Phone case: use background-image instead of img src
        if (this.isPhonePhotoCaseProduct()) {
          const photoBg = document.getElementById('phoneCasePhotoBg');
          const inner = document.querySelector('#customify-app-container .phone-case-inner');
          if (photoBg) {
            photoBg.style.backgroundImage = `url(${e.target.result})`;
            console.log('[PHONE PREVIEW] set background image', e.target.result.substring(0, 50) + '...');
            if (inner) {
              const innerRect = inner.getBoundingClientRect();
              console.log('[PHONE PREVIEW] inner rect', {
                width: innerRect.width,
                height: innerRect.height,
                aspectRatio: innerRect.width / innerRect.height
              });
            }
          }
          // Keep previewImage hidden but set src for compatibility
          if (this.previewImage) {
            this.previewImage.src = e.target.result;
          }
        } else {
          this.previewImage.src = e.target.result;
        }
        this.previewArea.style.display = 'block';
        console.log(`✅ [IMAGE] Rozdzielczość OK (min ${minWidth}×${minHeight}px)`);
        
        // 🎵 Spotify frame: przelicz skalę po pokazaniu preview (z opóźnieniem na layout)
        setTimeout(() => this.updateSpotifyFrameScale(), 50);
        
        // Ukryj "Dodaj do koszyka" i pokaż "Wgraj inne zdjęcie" po wgraniu zdjęcia
        const addToCartBtnMain = document.getElementById('addToCartBtnMain');
        const resetBtn = document.getElementById('resetBtn');
        if (addToCartBtnMain) {
          addToCartBtnMain.style.display = 'none';
        }
        // 🎵 Dla produktu bez AI nie pokazuj "Wgraj inne zdjęcie" - upload jest zawsze widoczny na górze
        if (resetBtn && !this.isSpotifyNoAIProduct()) {
          resetBtn.style.display = 'inline-block';
        }
      };
      
      img.onerror = () => {
        this.showError('Nie można wczytać obrazu. Wybierz inny plik.');
        this.uploadedFile = null;
        this.fileInput.value = '';
      };
      
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  showStyles() {
    // 🎵 Dla produktu bez AI nie pokazuj stylów
    if (!this.isSpotifyNoAIProduct()) {
      if (this.isMultiUploadProduct()) {
        this.stylesArea.style.display = 'none';
        this.selectedStyle = 'dodaj-osobe';
        console.log('📸 [MULTI-UPLOAD] Ukryto wybór stylu, auto-select dodaj-osobe');
      } else if (this.isDlaNiejProduct()) {
        this.stylesArea.style.display = 'none';
        this.selectedStyle = 'caricature-new';
        console.log('💝 [DLA-NIEJ] Ukryto wybór stylu, auto-select caricature-new');
      } else if (this.isSuperheroBoyProduct()) {
        this.stylesArea.style.display = 'none';
        this.selectedStyle = 'superhero_boy';
        console.log('🦸 [SUPERHERO] Ukryto wybór stylu, auto-select superhero_boy');
      } else if (this.isLoveRoseProduct()) {
        this.stylesArea.style.display = 'none';
        this.selectedStyle = 'love-rose';
        console.log('🌹 [LOVE-ROSE] Ukryto wybór stylu, auto-select love-rose');
      } else if (this.isRoyalLoveProduct()) {
        this.stylesArea.style.display = 'none';
        this.selectedStyle = 'royal-love';
        console.log('💕 [ROYAL-LOVE] Ukryto wybór stylu, auto-select royal-love');
      } else if (this.isGTAProduct()) {
        this.stylesArea.style.display = 'none';
        this.selectedStyle = 'gta';
        console.log('🎮 [GTA] Ukryto wybór stylu, auto-select gta');
      } else if (this.isRetuszStarychZdjecProduct()) {
        this.stylesArea.style.display = 'none';
        this.selectedStyle = 'retusz-starych-zdjec';
        console.log('📷 [RETUSZ] Ukryto wybór stylu, auto-select retusz-starych-zdjec');
      } else {
        this.stylesArea.style.display = 'block';
      }
    }
    this.sizeArea.style.display = 'block'; // Pokaż rozmiary od razu
    
    // 🎵 Dla produktu bez AI ukryj przyciski "Zobacz podgląd" - upload jest zawsze widoczny
    if (this.isSpotifyNoAIProduct()) {
      this.actionsArea.style.display = 'none';
    } else {
      this.actionsArea.style.display = 'flex';
    }
    
    // Pokaż przycisk "Dodaj do koszyka" jeśli użytkownik nie wgrał zdjęcia
    const addToCartBtnMain = document.getElementById('addToCartBtnMain');
    if (addToCartBtnMain) {
      addToCartBtnMain.style.display = 'inline-block';
    }
    
  }

  selectStyle(styleCard) {
    this.stylesArea.querySelectorAll('.customify-style-card').forEach(card => card.classList.remove('active'));
    styleCard.classList.add('active');
    this.selectedStyle = styleCard.dataset.style;
    
    // ✅ DEBUG: Pokaż który styl został wybrany
    console.log('🎨 [STYLE-SELECT] ===== WYBÓR STYLU =====');
    console.log('🎨 [STYLE-SELECT] Wybrany styl:', this.selectedStyle);
    console.log('🎨 [STYLE-SELECT] data-style attribute:', styleCard.dataset.style);
    console.log('🎨 [STYLE-SELECT] styleCard element:', styleCard);
    console.log('🎨 [STYLE-SELECT] this.selectedStyle type:', typeof this.selectedStyle);
    console.log('🎨 [STYLE-SELECT] =========================');
    
    // Ukryj komunikat błędu po wyborze stylu
    this.hideError();
    
    // 🎵 SPOTIFY: Styl "bez-zmian" - od razu przejdź do koszyka (bez "Zobacz podgląd")
    if (this.selectedStyle === 'bez-zmian' && this.uploadedFile) {
      console.log('🎵 [SPOTIFY] Styl "bez-zmian" - automatyczne przejście do koszyka');
      this.handleBezZmianStyle();
    }
    
    // Rozmiary już są widoczne od razu
  }
  
  // 🎵 SPOTIFY: Obsługa stylu "bez-zmian"
  handleBezZmianStyle() {
    // 🎵 SPOTIFY: Ustaw flagę żeby syncPosition() nie przenosiło elementów z powrotem
    window.spotifyBezZmianActive = true;
    
    // Użyj wykadrowanego zdjęcia jako transformedImage (dla addToCart)
    const reader = new FileReader();
    reader.onload = (e) => {
      this.transformedImage = e.target.result;
      this.originalCroppedImage = e.target.result; // 🎨 Zachowaj oryginał dla filtrów
      this.watermarkedImageUrl = null; // Będzie generowany przy dodaniu do koszyka
      
      // Ukryj sekcje jak po normalnej generacji
      if (this.uploadArea) this.uploadArea.style.display = 'none';
      if (this.stylesArea) this.stylesArea.style.display = 'none';
      
      // Ukryj "Zobacz Podgląd" i "Wgraj inne" oraz główny przycisk koszyka z actionsArea
      const transformBtn = document.getElementById('transformBtn');
      const resetBtn = document.getElementById('resetBtn');
      const addToCartBtnMain = document.getElementById('addToCartBtnMain');
      if (transformBtn) transformBtn.style.display = 'none';
      if (resetBtn) resetBtn.style.display = 'none';
      if (addToCartBtnMain) addToCartBtnMain.style.display = 'none';
      
      // UKRYJ actionsArea - będziemy używać tylko przycisków z resultArea
      if (this.actionsArea) this.actionsArea.style.display = 'none';
      
      // 🎨 Pokaż panel filtrów dla produktu bez AI
      if (this.isSpotifyNoAIProduct()) {
        const filtersPanel = document.getElementById('spotifyFiltersPanel');
        if (filtersPanel) {
          filtersPanel.style.display = 'block';
          this.initGlfxFilters(); // Inicjalizuj glfx.js
        }
      }
      
      // 🎵 SPOTIFY: Przenieś elementy typu i rozmiaru pod preview (nie na górę strony!)
      const spotifySlot = document.getElementById('spotify-type-size-slot');
      if (spotifySlot && this.productTypeArea && this.sizeArea) {
        spotifySlot.style.display = 'block';
        spotifySlot.appendChild(this.productTypeArea);
        spotifySlot.appendChild(this.sizeArea);
        
        // Przenieś też cenę
        const cartPriceDisplay = document.getElementById('cartPriceDisplay');
        if (cartPriceDisplay) {
          spotifySlot.appendChild(cartPriceDisplay);
          cartPriceDisplay.style.display = 'block';
        }
        
        // Przenieś przyciski koszyka z resultArea
        const addToCartBtn = document.getElementById('addToCartBtn');
        const tryAgainBtn = document.getElementById('tryAgainBtn');
        if (addToCartBtn) {
          // Stwórz kontener na przyciski jeśli nie istnieje
          let btnContainer = document.getElementById('spotify-cart-buttons');
          if (!btnContainer) {
            btnContainer = document.createElement('div');
            btnContainer.id = 'spotify-cart-buttons';
            btnContainer.style.cssText = 'display: flex; gap: 10px; justify-content: center; margin-top: 15px;';
            spotifySlot.appendChild(btnContainer);
          }
          btnContainer.appendChild(addToCartBtn);
          addToCartBtn.style.display = 'inline-block';
          
          // 🎵 Dla produktu bez AI ukryj "Spróbuj ponownie" - upload jest zawsze widoczny na górze
          if (tryAgainBtn && !this.isSpotifyNoAIProduct()) {
            btnContainer.appendChild(tryAgainBtn);
            tryAgainBtn.style.display = 'inline-block';
          } else if (tryAgainBtn) {
            tryAgainBtn.style.display = 'none';
          }
        }
        
        console.log('✅ [SPOTIFY] Przeniesiono elementy typu/rozmiaru/ceny/przycisków pod preview');
      } else {
        console.error('❌ [SPOTIFY] Nie znaleziono spotify-type-size-slot lub elementów do przeniesienia');
        console.log('spotifySlot:', !!spotifySlot, 'productTypeArea:', !!this.productTypeArea, 'sizeArea:', !!this.sizeArea);
      }
      
      // Pokaż rozmiary i typ wydruku
      if (this.sizeArea) this.sizeArea.style.display = 'block';
      if (this.productTypeArea) this.productTypeArea.style.display = 'block';
      
      // Aktualizuj cenę
      this.updateCartPrice();
      
      // Komunikat sukcesu
      this.showSuccess('Projekt gotowy! Wybierz parametry wydruku i dodaj do koszyka.');
      
      console.log('✅ [SPOTIFY] Styl "bez-zmian" - widok koszyka aktywny');
    };
    reader.readAsDataURL(this.uploadedFile);
  }
  
  // 🎨 GLFX.JS: Ładowanie konfiguracji filtrów z API
  async loadFilterConfig() {
    if (this.filterConfig) {
      return this.filterConfig; // Już załadowane
    }
    
    if (this.filterConfigLoading) {
      // Czekaj na zakończenie ładowania
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.filterConfig) {
            clearInterval(checkInterval);
            resolve(this.filterConfig);
          }
        }, 100);
      });
    }
    
    this.filterConfigLoading = true;
    
    try {
      const res = await fetch('https://customify-s56o.vercel.app/api/admin/filter-config');
      if (res.ok) {
        const config = await res.json();
        this.filterConfig = config;
        console.log('✅ [GLFX] Konfiguracja filtrów załadowana z API');
        return config;
      } else {
        console.warn('⚠️ [GLFX] Błąd ładowania konfiguracji, używam domyślnej');
        return this.getDefaultFilterConfig();
      }
    } catch (err) {
      console.error('❌ [GLFX] Błąd ładowania konfiguracji:', err);
      return this.getDefaultFilterConfig();
    } finally {
      this.filterConfigLoading = false;
    }
  }
  
  // 🎨 Domyślna konfiguracja (fallback)
  getDefaultFilterConfig() {
    return {
      brighten: { brightness: 0.15, contrast: 0.1 },
      vivid: { hue: 0, saturation: 0.2, vibrance: 0.2 },
      sharpen: { radius: 50, strength: 1.5 },
      warm: { hue: 0.05, saturation: 0.1, brightness: 0.05, contrast: 0.05 },
      bw: { saturation: -1, brightness: 0.05, contrast: 0.15 },
      vintage: { sepia: 0.3, vignetteSize: 0.3, vignetteAmount: 0.7, brightness: -0.05, contrast: 0.1 },
      dotScreen: { centerX: 0.5, centerY: 0.5, angle: 0, size: 3 }
    };
  }
  
  // 🎨 GLFX.JS: Inicjalizacja filtrów zdjęć
  async initGlfxFilters() {
    if (this.glfxInitialized) return;
    
    // Sprawdź czy glfx.js jest załadowane
    if (typeof fx === 'undefined') {
      console.warn('⚠️ [GLFX] Biblioteka glfx.js nie jest załadowana');
      return;
    }
    
    console.log('🎨 [GLFX] Inicjalizacja filtrów zdjęć...');
    
    // Załaduj konfigurację z API
    await this.loadFilterConfig();
    
    // Event listeners dla przycisków filtrów
    const filterBtns = document.querySelectorAll('.spotify-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Usuń active ze wszystkich
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.dataset.filter;
        console.log('🎨 [GLFX] Wybrano filtr:', filter);
        this.applyGlfxFilter(filter);
      });
    });
    
    this.glfxInitialized = true;
    console.log('✅ [GLFX] Filtry zainicjalizowane');
  }
  
  // 🎨 GLFX.JS: Aplikuj filtr na zdjęcie
  async applyGlfxFilter(filterName) {
    if (!this.originalCroppedImage) {
      console.warn('⚠️ [GLFX] Brak oryginalnego zdjęcia');
      return;
    }
    
    console.log('🎨 [GLFX] Aplikuję filtr:', filterName);
    
    // Upewnij się że konfiguracja jest załadowana
    if (!this.filterConfig) {
      await this.loadFilterConfig();
    }
    
    // Stwórz tymczasowy obraz z oryginalnego
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        // Stwórz canvas glfx
        const canvas = fx.canvas();
        const texture = canvas.texture(img);
        
        // Aplikuj filtry w zależności od wyboru
        // 🎨 Pobierz konfigurację z API (lub domyślną)
        const cfg = this.filterConfig || this.getDefaultFilterConfig();
        
        canvas.draw(texture);
        
        switch(filterName) {
          case 'none':
            // Bez filtra - oryginał
            break;
          case 'brighten':
            const b = cfg.brighten || { brightness: 0.15, contrast: 0.1 };
            canvas.brightnessContrast(b.brightness, b.contrast);
            break;
          case 'vivid':
            const v = cfg.vivid || { hue: 0, saturation: 0.2, vibrance: 0.2 };
            canvas.hueSaturation(v.hue, v.saturation);
            canvas.vibrance(v.vibrance);
            break;
          case 'sharpen':
            const sh = cfg.sharpen || { radius: 50, strength: 1.5 };
            canvas.unsharpMask(sh.radius, sh.strength);
            break;
          case 'warm':
            const w = cfg.warm || { hue: 0.05, saturation: 0.1, brightness: 0.05, contrast: 0.05 };
            canvas.hueSaturation(w.hue, w.saturation);
            canvas.brightnessContrast(w.brightness, w.contrast);
            break;
          case 'bw':
            const bw = cfg.bw || { saturation: -1, brightness: 0.05, contrast: 0.15 };
            canvas.hueSaturation(0, bw.saturation);
            canvas.brightnessContrast(bw.brightness, bw.contrast);
            break;
          case 'vintage':
            const vt = cfg.vintage || { sepia: 0.3, vignetteSize: 0.3, vignetteAmount: 0.7, brightness: -0.05, contrast: 0.1 };
            canvas.sepia(vt.sepia);
            canvas.vignette(vt.vignetteSize, vt.vignetteAmount);
            canvas.brightnessContrast(vt.brightness, vt.contrast);
            break;
          case 'dotScreen':
            const ds = cfg.dotScreen || { centerX: 0.5, centerY: 0.5, angle: 0, size: 3 };
            canvas.dotScreen(ds.centerX, ds.centerY, ds.angle, ds.size);
            break;
        }
        
        canvas.update();
        
        // Pobierz wynik jako data URL
        const filteredImage = canvas.toDataURL('image/jpeg', 0.92);
        
        // Zaktualizuj transformedImage (dla addToCart)
        this.transformedImage = filteredImage;
        
        // Zaktualizuj podgląd na stronie
        const previewImg = document.querySelector('.spotify-frame-inner img');
        if (previewImg) {
          previewImg.src = filteredImage;
        }
        
        console.log('✅ [GLFX] Filtr zastosowany:', filterName);
        
      } catch (err) {
        console.error('❌ [GLFX] Błąd aplikowania filtra:', err);
        // Fallback do CSS filters jeśli glfx zawiedzie
        this.applyCssFilter(filterName);
      }
    };
    
    img.onerror = () => {
      console.error('❌ [GLFX] Nie można załadować obrazu');
    };
    
    img.src = this.originalCroppedImage;
  }
  
  // 🎨 CSS Fallback: Jeśli glfx.js nie działa
  applyCssFilter(filterName) {
    const previewImg = document.querySelector('.spotify-frame-inner img');
    if (!previewImg) return;
    
    let filter = '';
    switch(filterName) {
      case 'none':
        filter = 'none';
        break;
      case 'brighten':
        filter = 'brightness(1.15) contrast(1.1)';
        break;
      case 'vivid':
        filter = 'saturate(1.4)';
        break;
      case 'sharpen':
        filter = 'contrast(1.1)';
        break;
      case 'warm':
        filter = 'sepia(0.2) saturate(1.1)';
        break;
      case 'bw':
        filter = 'grayscale(1) contrast(1.15)';
        break;
      case 'vintage':
        filter = 'sepia(0.4) contrast(1.1)';
        break;
      case 'dotScreen':
        filter = 'contrast(1.2)'; // Prosty fallback dla halftone
        break;
    }
    
    previewImg.style.filter = filter;
    console.log('🎨 [CSS] Fallback filtr:', filterName, filter);
  }

  selectSize(sizeBtn) {
    if (sizeBtn.classList.contains('disabled')) {
      console.log('⚠️ [SIZE] Attempted to select disabled size:', sizeBtn.dataset.size);
      return;
    }
    
    // 🚨 WALIDACJA: Dla szkła tylko A5 i A4 są dozwolone
    const size = sizeBtn.dataset.size;
    if (this.selectedProductType === 'szklo') {
      const allowedSizes = ['a5', 'a4'];
      if (!allowedSizes.includes(size.toLowerCase())) {
        console.error('❌ [SIZE] Invalid size for szklo:', size);
        this.showError('Dla wydruku na szkle dostępne są tylko rozmiary: 15×21 cm (A5) i 20×30 cm (A4). Wybierz jeden z dostępnych rozmiarów.', 'size');
        return;
      }
    }
    
    this.sizeArea.querySelectorAll('.customify-size-btn').forEach(btn => btn.classList.remove('active'));
    sizeBtn.classList.add('active');
    this.selectedSize = sizeBtn.dataset.size;
    console.log('📏 [SIZE] Selected size:', this.selectedSize);
    
    // Ukryj błąd jeśli rozmiar jest poprawny
    this.hideError();
    
    // Aktualizuj cenę po wyborze rozmiaru
    this.updateProductPrice();
    this.updateCartPrice(); // ✅ Dodaj aktualizację ceny nad przyciskiem
    this.syncActiveSizeButton();
  }

  selectProductType(typeBtn) {
    this.productTypeArea.querySelectorAll('.customify-product-type-btn').forEach(btn => btn.classList.remove('active'));
    typeBtn.classList.add('active');
    this.selectedProductType = typeBtn.dataset.productType;
    console.log('🎨 [PRODUCT-TYPE] Selected product type:', this.selectedProductType);

    // Aktualizuj ceny po zmianie typu (ramka dostępna tylko dla plakatu)
    const sizeAdjusted = this.updateSizeAvailability();
    this.updateProductPrice();
    this.updateCartPrice();
    if (sizeAdjusted) {
      console.log('📏 [SIZE] Adjusted selection after product type change:', this.selectedSize || 'none');
    }
    console.log('🖼️ [FRAME] Type changed -> recalculated price with frame:', {
      selectedProductType: this.selectedProductType,
      frame: window.CustomifyFrame?.color || 'none'
    });
  }

  /**
   * Aktualizuje dostępność poszczególnych rozmiarów w zależności od typu produktu
   * Dla szkła: tylko A5 i A4 widoczne. Dla plakat/canvas/digital: A4, A3, A2, A0, A1.
   * Zwraca true, jeśli wybrany rozmiar został zmieniony
   */
  updateSizeAvailability() {
    if (!this.sizeArea) {
      return false;
    }

    const sizeButtons = Array.from(this.sizeArea.querySelectorAll('.customify-size-btn'));
    const szkloSizes = ['a5', 'a4'];
    const plakatSizes = ['a4', 'a3', 'a2', 'a0', 'a1'];

    if (this.selectedProductType === 'szklo') {
      sizeButtons.forEach(btn => {
        const size = btn.dataset.size?.toLowerCase();
        const isForSzklo = szkloSizes.includes(size);
        btn.style.display = isForSzklo ? '' : 'none';
        btn.classList.remove('disabled');
        btn.removeAttribute('aria-disabled');
      });
    } else {
      sizeButtons.forEach(btn => {
        const size = btn.dataset.size?.toLowerCase();
        const isForPlakat = plakatSizes.includes(size);
        btn.style.display = isForPlakat ? '' : 'none';
        btn.classList.remove('disabled');
        btn.removeAttribute('aria-disabled');
      });
    }

    const visibleSizes = this.selectedProductType === 'szklo' ? szkloSizes : plakatSizes;
    let selectionChanged = false;
    if (!visibleSizes.includes(this.selectedSize?.toLowerCase())) {
      const fallback = visibleSizes[0];
      this.selectedSize = fallback;
      selectionChanged = true;
    }

    this.syncActiveSizeButton();
    return selectionChanged;
  }

  /**
   * Synchronizuje klasę .active przycisków rozmiarów z aktualnie wybranym rozmiarem
   */
  syncActiveSizeButton() {
    if (!this.sizeArea) {
      return;
    }

    const sizeButtons = this.sizeArea.querySelectorAll('.customify-size-btn');
    sizeButtons.forEach(btn => {
      if (btn.classList.contains('disabled')) {
        btn.classList.remove('active');
        return;
      }
      const shouldBeActive = this.selectedSize && btn.dataset.size === this.selectedSize;
      btn.classList.toggle('active', !!shouldBeActive);
    });
  }

  /**
   * Aktualizuje cenę nad przyciskiem "Dodaj do koszyka"
   */
  updateCartPrice() {
    try {
      // Sprawdź czy mamy wybrany rozmiar
      if (!this.selectedSize) {
        console.log('🔍 [CART-PRICE] No selectedSize, hiding cart price');
        this.hideCartPrice();
        return;
      }

      // Pobierz oryginalną bazową cenę
      if (!this.originalBasePrice) {
        this.originalBasePrice = 49.00; // Fallback
        console.log(`💰 [CART-PRICE] Using fallback base price: ${this.originalBasePrice} zł`);
      }

      // Pobierz cenę rozmiaru
      const sizePrice = this.getSizePrice(this.selectedSize);
      
      // Dopłata za ramkę (tylko plakat i wybrany kolor != none)
      const frameSelected = (this.selectedProductType === 'plakat') && (window.CustomifyFrame && window.CustomifyFrame.color && window.CustomifyFrame.color !== 'none');
      const frameSurcharge = frameSelected && this.selectedSize ? (this.framePricing[this.selectedSize] || 29) : 0;
      
      // Oblicz końcową cenę (bazowa + rozmiar + ramka)
      const finalPrice = this.originalBasePrice + sizePrice + frameSurcharge;

      // Price calculation completed

        // Znajdź element ceny w koszyku
        const cartPriceElement = document.getElementById('cartPriceValue');

        if (cartPriceElement) {
          cartPriceElement.textContent = `${finalPrice.toFixed(2)} zł`;
          console.log('✅ [CART-PRICE] Cart price updated:', finalPrice.toFixed(2), 'zł');
          console.log('🖼️ [FRAME] Cart price components:', {
            base: this.originalBasePrice,
            sizePrice,
            frameSelected,
            frame: window.CustomifyFrame?.color || 'none',
            frameSurcharge
          });

          // 📱 Phone case: Also update phone case specific price display (ONLY after AI generation)
          if (this.isPhonePhotoCaseProduct && this.isPhonePhotoCaseProduct()) {
            // Phone case has its own price display - don't show main cart price
            // (phone case price is shown/hidden separately in phoneCaseCartPriceDisplay)
          } else {
            // Pokaż element ceny (tylko dla innych produktów, nie phone case)
            this.showCartPrice();
          }
          
          // 📱 Phone case: Update phone case specific price display (ONLY after AI generation)
          if (this.isPhonePhotoCaseProduct && this.isPhonePhotoCaseProduct()) {
            const phoneCaseCartPriceValue = document.getElementById('phoneCaseCartPriceValue');
            if (phoneCaseCartPriceValue) {
              phoneCaseCartPriceValue.textContent = `${finalPrice.toFixed(2)} zł`;
              console.log('📱 [PHONE PREVIEW] Phone case cart price updated:', finalPrice.toFixed(2), 'zł');
            }
            // Show price and buttons ONLY if image is generated (after AI)
            const phoneCaseCartPriceDisplay = document.getElementById('phoneCaseCartPriceDisplay');
            const phoneCaseCartActions = document.getElementById('phoneCaseCartActions');
            if (this.transformedImage) {
              if (phoneCaseCartPriceDisplay) {
                phoneCaseCartPriceDisplay.style.display = 'block';
                console.log('📱 [PHONE PREVIEW] Cart price shown (after AI generation)');
              }
              if (phoneCaseCartActions) {
                phoneCaseCartActions.style.display = 'flex';
                console.log('📱 [PHONE PREVIEW] Cart actions shown (after AI generation)');
              }
            } else {
              if (phoneCaseCartPriceDisplay) phoneCaseCartPriceDisplay.style.display = 'none';
              if (phoneCaseCartActions) phoneCaseCartActions.style.display = 'none';
            }
          }
        } else {
          console.warn('⚠️ [CART-PRICE] Cart price element not found');
        }
    } catch (error) {
      console.error('❌ [CART-PRICE] Error updating cart price:', error);
    }
  }

  /**
   * Pokazuje element ceny nad przyciskiem
   */
  showCartPrice() {
    // Etui używa tego samego cartPriceDisplay (w resultArea) jak inne produkty
    const cartPriceDisplay = document.getElementById('cartPriceDisplay');
    if (cartPriceDisplay) {
      cartPriceDisplay.style.display = 'block';
      console.log('✅ [CART-PRICE] Cart price displayed');
    }
  }

  /**
   * Ukrywa element ceny nad przyciskiem
   */
  hideCartPrice() {
    const cartPriceDisplay = document.getElementById('cartPriceDisplay');
    if (cartPriceDisplay) {
      cartPriceDisplay.style.display = 'none';
      console.log('✅ [CART-PRICE] Cart price hidden');
    }
  }

  /**
   * Ustawia początkową cenę bazową (bez rozmiaru) przy starcie aplikacji
   */
  setInitialPrice() {
    try {
      const priceElement = this.getPriceElement();
      if (!priceElement) {
        console.warn('⚠️ [INIT-PRICE] Price element not found');
        return;
      }

      // Pobierz oryginalną bazową cenę (zapamiętaj przy pierwszym wywołaniu)
      if (!this.originalBasePrice) {
        // ✅ Użyj window.ShopifyProduct (niezmienione źródło) zamiast DOM
        this.originalBasePrice = this.getBasePriceFromShopify();
        
        if (this.originalBasePrice === null) {
          // Fallback: spróbuj z DOM jeśli window.ShopifyProduct nie dostępne
          const basePriceText = priceElement.textContent;
          this.originalBasePrice = this.extractBasePrice(basePriceText);
          
          if (this.originalBasePrice === null) {
            console.warn('⚠️ [INIT-PRICE] Could not get base price from Shopify or DOM, using fallback');
            this.originalBasePrice = 49.00;
            console.log(`💰 [INIT-PRICE] Using fallback base price: ${this.originalBasePrice} zł`);
          } else {
            console.log(`💰 [INIT-PRICE] Base price from DOM (fallback): ${this.originalBasePrice} zł`);
          }
        } else {
          console.log(`💰 [INIT-PRICE] Original base price saved: ${this.originalBasePrice} zł`);
        }
      }

      // Ustaw TYLKO cenę bazową (bez rozmiaru)
      this.applyProductPriceDisplay(this.originalBasePrice);
      console.log(`💰 [INIT-PRICE] Set initial base price: ${this.originalBasePrice} zł`);
      
    } catch (error) {
      console.error('❌ [INIT-PRICE] Error setting initial price:', error);
    }
  }

  /**
   * Aktualizuje cenę na stronie produktu po wyborze rozmiaru
   */
  updateProductPrice() {
    try {
      const priceElement = this.getPriceElement();
      if (!priceElement) {
        console.warn('⚠️ [PRICE] Price element not found with any selector');
        return;
      }

      console.log('✅ [PRICE] Found price element:', priceElement, 'Text:', priceElement.textContent);

      // Pobierz oryginalną bazową cenę (zapamiętaj przy pierwszym wywołaniu)
      if (!this.originalBasePrice) {
        // ✅ Użyj window.ShopifyProduct (niezmienione źródło) zamiast DOM
        this.originalBasePrice = this.getBasePriceFromShopify();
        
        if (this.originalBasePrice === null) {
          // Fallback: spróbuj z DOM jeśli window.ShopifyProduct nie dostępne
          const basePriceText = priceElement.textContent;
          this.originalBasePrice = this.extractBasePrice(basePriceText);
          
          if (this.originalBasePrice === null) {
            console.warn('⚠️ [PRICE] Could not get base price from Shopify or DOM, using fallback');
            // Fallback - użyj domyślnej ceny
            this.originalBasePrice = 49.00;
            console.log(`💰 [PRICE] Using fallback base price: ${this.originalBasePrice} zł`);
          } else {
            console.log(`💰 [PRICE] Base price from DOM (fallback): ${this.originalBasePrice} zł`);
          }
        } else {
          console.log(`💰 [PRICE] Original base price saved: ${this.originalBasePrice} zł`);
        }
      }

      // Pobierz cenę rozmiaru
      const sizePrice = this.getSizePrice(this.selectedSize);
      
      // Dopłata za ramkę (tylko plakat i wybrany kolor != none)
      const frameSelected = (this.selectedProductType === 'plakat') && (window.CustomifyFrame && window.CustomifyFrame.color && window.CustomifyFrame.color !== 'none');
      const frameSurcharge = frameSelected && this.selectedSize ? (this.framePricing[this.selectedSize] || 29) : 0;
      
      // Oblicz końcową cenę (oryginalna cena + rozmiar + ramka)
      const finalPrice = this.originalBasePrice + sizePrice + frameSurcharge;
      
      // Aktualizuj cenę na stronie
      this.applyProductPriceDisplay(finalPrice);
      this.schedulePriceConsistency(finalPrice);
      
      console.log(`💰 [PRICE] Updated: base ${this.originalBasePrice} + size ${sizePrice} + frame ${frameSurcharge} = ${finalPrice} zł`);
      console.log('🖼️ [FRAME] Product price components:', {
        base: this.originalBasePrice,
        sizePrice,
        frameSelected,
        frame: window.CustomifyFrame?.color || 'none',
        frameSurcharge,
        finalPrice
      });
      
    } catch (error) {
      console.error('❌ [PRICE] Error updating product price:', error);
    }
  }

  /**
   * Pobiera bazową cenę produktu z window.ShopifyProduct (niezmienione źródło)
   */
  getBasePriceFromShopify() {
    if (window.ShopifyProduct && window.ShopifyProduct.variants && window.ShopifyProduct.variants.length > 0) {
      // variants[0].price jest w groszach, konwertuj na złotówki
      const priceInGrosz = parseFloat(window.ShopifyProduct.variants[0].price);
      const priceInZl = priceInGrosz / 100;
      console.log(`💰 [BASE-PRICE] Pobrano z window.ShopifyProduct: ${priceInZl} zł (${priceInGrosz} groszy)`);
      return priceInZl;
    }
    console.warn('⚠️ [BASE-PRICE] window.ShopifyProduct.variants nie dostępne, używam fallback');
    return null;
  }

  /**
   * Wyciąga bazową cenę z tekstu ceny (stara metoda - tylko jako fallback)
   */
  extractBasePrice(priceText) {
    // Usuń "zł" i spacje, znajdź liczbę
    const match = priceText.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  }

  /**
   * Zwraca cenę dla wybranego rozmiaru
   */
  getSizePrice(size, productType = null) {
    const type = productType || this.selectedProductType || 'canvas';
    const table = this.sizePricing[type] || this.sizePricing.canvas;
    return table[size] ?? 0;
  }

  /**
   * Zwraca wymiar dla wybranego rozmiaru (np. "20×30 cm")
   */
  getSizeDimension(size) {
    const dimensions = {
      'a5': '15×21 cm',  // 🆕 Nowy rozmiar dla szkła
      'a4': '20×30 cm',
      'a3': '30×45 cm', 
      'a2': '40×60 cm',
      'a0': '50×75 cm',
      'a1': '60×90 cm',
      'etui': 'Etui na telefon'  // 📱 Etui - brak selektora rozmiaru
    };
    return dimensions[size] || size;
  }

  /**
   * Zwraca element ceny produktu
   */
  getPriceElement() {
    let priceElement = document.querySelector('product-price div');
    if (priceElement) {
      return priceElement;
    }

    priceElement = document.querySelector('.price');
    if (priceElement) {
      console.log('🔍 [PRICE] Using .price selector');
      return priceElement;
    }

    priceElement = document.querySelector('[class*="price"]');
    if (priceElement) {
      console.log('🔍 [PRICE] Using [class*="price"] selector');
      return priceElement;
    }

    return null;
  }

  /**
   * Ustawia cenę produktu w DOM
   */
  applyProductPriceDisplay(value) {
    const priceElement = this.getPriceElement();
    if (!priceElement) {
      console.warn('⚠️ [PRICE] Price element not found when applying display');
      return;
    }
    const formatted = `${value.toFixed(2)} zł`;
    priceElement.textContent = formatted;
    priceElement.setAttribute('data-customify-price', formatted);
  }

  /**
   * Dodatkowe zabezpieczenie przed nadpisaniem ceny przez motyw
   */
  schedulePriceConsistency(finalPrice) {
    if (this.priceConsistencyTimers) {
      this.priceConsistencyTimers.forEach(timer => clearTimeout(timer));
    }

    const delays = [50, 250, 500, 1000, 2000];
    this.priceConsistencyTimers = delays.map(delay => setTimeout(() => {
      try {
        const priceElement = this.getPriceElement();
        if (!priceElement) {
          return;
        }
        const displayed = this.extractBasePrice(priceElement.textContent);
        if (displayed === null || Math.abs(displayed - finalPrice) > 0.5) {
          console.log('♻️ [PRICE] Reapplying price after external update:', {
            displayed,
            finalPrice,
            delay
          });
          const formatted = `${finalPrice.toFixed(2)} zł`;
          priceElement.textContent = formatted;
          priceElement.setAttribute('data-customify-price', formatted);
        }
      } catch (error) {
        console.warn('⚠️ [PRICE] Error in price consistency timer:', error);
      }
    }, delay));
  }

  /**
   * Inicjalizuje domyślny rozmiar i cenę przy starcie aplikacji
   */
  initializeDefaultPrice() {
    try {
      // Znajdź pierwszy dostępny rozmiar (domyślnie A4)
      const defaultSizeBtn = this.sizeArea?.querySelector('[data-size="a4"]') || 
                            this.sizeArea?.querySelector('.customify-size-btn');
      
      if (defaultSizeBtn) {
        // Ustaw domyślny rozmiar (bez podświetlania)
        this.selectedSize = defaultSizeBtn.dataset.size;
        // defaultSizeBtn.classList.add('active'); // USUNIĘTO - żaden rozmiar nie jest podświetlony domyślnie
        
        console.log('💰 [INIT] Default size selected (no highlight):', this.selectedSize);
        
        // Ustaw początkową cenę bazową (bez rozmiaru)
        this.setInitialPrice();
        this.updateCartPrice(); // ✅ Dodaj aktualizację ceny nad przyciskiem
      } else {
        console.warn('⚠️ [INIT] No size buttons found for default price');
      }
    } catch (error) {
      console.error('❌ [INIT] Error initializing default price:', error);
    }
  }




  async transformImage(retryCount = 0) {
    // ✅ DEBUG: Sprawdź selectedStyle NAJPIERW (przed walidacją)
    console.log(`🔍🔍🔍 [TRANSFORM] START transformImage:`, {
      selectedStyle: this.selectedStyle,
      selectedStyleType: typeof this.selectedStyle,
      productType: this.selectedStyle ? this.getProductTypeFromStyle(this.selectedStyle) : 'BRAK STYLU',
      uploadedFile: !!this.uploadedFile,
      uploadedFileName: this.uploadedFile?.name
    });
    
    if (this.isMultiUploadProduct()) {
      const multiFiles = this.getMultiUploadFiles();
      if (multiFiles.length === 0) {
        this.showError('Wgraj przynajmniej jedno zdjęcie', 'transform');
        return;
      }
      if (!this.uploadedFile) this.uploadedFile = multiFiles[0];
    } else if (!this.uploadedFile || !this.selectedStyle) {
      console.error(`❌ [TRANSFORM] Brak wymaganych danych:`, {
        uploadedFile: !!this.uploadedFile,
        selectedStyle: this.selectedStyle
      });
      this.showError('Wgraj zdjęcie i wybierz styl', 'transform');
      return;
    }

    // Dla spotify: sprawdź czy zdjęcie zostało wykadrowane
    // - spotifyCropConfirmed = true (świeżo wykadrowane)
    // - lub uploadedFile.name zaczyna się od 'spotify-crop-' (już wykadrowane, po "spróbuj ponownie")
    const isSpotifyCropped = this.spotifyCropConfirmed || 
      (this.uploadedFile && this.uploadedFile.name && this.uploadedFile.name.startsWith('spotify-crop-'));
    
    if (this.isSpotifyProduct() && !isSpotifyCropped) {
      this.showError('Najpierw wykadruj zdjęcie', 'transform');
      return;
    }

    // 📱 Dla telefonu: sprawdź czy zdjęcie zostało wykadrowane
    const isPhoneCropped = this.phoneCropConfirmed || 
      (this.uploadedFile && this.uploadedFile.name && this.uploadedFile.name.startsWith('phone-crop-'));
    
    if (this.isPhoneCaseProduct() && !isPhoneCropped) {
      this.showError('Najpierw wykadruj zdjęcie', 'transform');
      return;
    }
    
    // 📱 Dla etui (zdjęcie): sprawdź czy zdjęcie zostało wykadrowane
    const isPhonePhotoCropped = this.phonePhotoCropConfirmed || 
      (this.uploadedFile && this.uploadedFile.name && this.uploadedFile.name.startsWith('phone-photo-crop-'));
    
    if (this.isPhonePhotoCaseProduct() && !isPhonePhotoCropped) {
      this.showError('Najpierw wykadruj zdjęcie', 'transform');
      return;
    }

      // 🎛️ CUSTOM FIELDS: Zbierz wartości pól personalizacji i zbuduj promptAddition
      let promptAddition = null;
      try {
        promptAddition = this.collectCustomFieldsPrompt();
        if (promptAddition) {
          console.log('🎛️ [CUSTOM-FIELDS] promptAddition:', promptAddition);
        }
      } catch (fieldError) {
        this.showError(fieldError.message, 'transform');
        this.hideLoading();
        return;
      }

      let spotifyPayload = null;
      if (this.isSpotifyProduct()) {
        const spotifyTitle = (this.spotifyTitleInput?.value || '').trim().slice(0, 60);
        const spotifyArtist = (this.spotifyArtistInput?.value || '').trim().slice(0, 60);
        spotifyPayload = { title: spotifyTitle, artist: spotifyArtist };
      }

    // 🎵 SPOTIFY: Styl "bez-zmian" - pomijamy AI, pokazujemy widok jak po generacji
    if (this.selectedStyle === 'bez-zmian') {
      console.log('🎵 [SPOTIFY] Styl "bez-zmian" - pomijamy transformację AI');
      this.showLoading();
      
      // Użyj wykadrowanego zdjęcia jako transformedImage (dla addToCart)
      const reader = new FileReader();
      reader.onload = (e) => {
        this.transformedImage = e.target.result;
        this.watermarkedImageUrl = null; // Będzie generowany przy dodaniu do koszyka
        
        // Ukryj sekcje jak po normalnej generacji
        if (this.uploadArea) this.uploadArea.style.display = 'none';
        if (this.stylesArea) this.stylesArea.style.display = 'none';
        if (this.actionsArea) this.actionsArea.style.display = 'none';
        
        // Pokaż przyciski koszyka
        if (this.cartActionsArea) this.cartActionsArea.style.display = 'flex';
        
        // Pokaż rozmiary i typ wydruku
        if (this.sizeArea) this.sizeArea.style.display = 'block';
        if (this.productTypeArea) this.productTypeArea.style.display = 'block';
        
        // Preview z maską pozostaje widoczny (nie zmieniamy na resultArea)
        // Komunikat sukcesu
        this.showSuccess('Projekt gotowy! Wybierz parametry wydruku i dodaj do koszyka.');
        this.hideLoading();
        
        console.log('✅ [SPOTIFY] Styl "bez-zmian" - widok jak po generacji, gotowe do koszyka');
      };
      reader.readAsDataURL(this.uploadedFile);
      return;
    }

    // ✅ DEBUG: Sprawdź selectedStyle przed checkUsageLimit
    console.log(`🔍 [TRANSFORM] Przed checkUsageLimit:`, {
      selectedStyle: this.selectedStyle,
      productType: this.getProductTypeFromStyle(this.selectedStyle),
      uploadedFile: !!this.uploadedFile
    });

    // ✅ USAGE LIMITS: Sprawdź limit PRZED transformacją (ZAWSZE, nawet przy retry)
      const canTransform = await this.checkUsageLimit();
      if (!canTransform) {
        console.log('❌ [USAGE] Limit przekroczony - przerwano transformację');
        return;
    }

    // ✅ Google Analytics Event Tracking - "Zobacz Podgląd" kliknięty
    if (retryCount === 0 && typeof gtag !== 'undefined') {
      gtag('event', 'zobacz_podglad_click', {
        'event_category': 'Customify',
        'event_label': this.selectedStyle,
        'style_name': this.selectedStyle,
        'product_url': window.location.pathname
      });
      console.log('📊 [GA4] Event sent: zobacz_podglad_click', {
        style: this.selectedStyle,
        url: window.location.pathname
      });
    }

    this.showLoading();
    this.hideError();
    
    if (retryCount > 0) {
      console.log(`🔄 [MOBILE] Retry attempt ${retryCount}/3`);
    }

    try {
      const base64 = (this.isSpotifyProduct() && this.spotifyCropConfirmed && this.spotifyCropDataUrl)
        ? this.spotifyCropDataUrl
        : (this.isPhoneCaseProduct() && this.phoneCropConfirmed && this.phoneCropDataUrl)
        ? this.phoneCropDataUrl
        : (this.isPhonePhotoCaseProduct() && this.phonePhotoCropConfirmed && this.phonePhotoCropDataUrl)
        ? this.phonePhotoCropDataUrl
        : await this.fileToBase64(this.uploadedFile);
      console.log('📱 [MOBILE] Starting transform request...');
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes
      
      console.log('📱 [MOBILE] Sending request to transform API...');
      console.log('📱 [MOBILE] Base64 length:', base64.length, 'characters');
      console.log('📱 [MOBILE] Base64 preview:', base64.substring(0, 50) + '...');
      
      // ✅ Użyj productType z stylu (zgodne z backend - config.productType)
      const productType = this.getProductTypeFromStyle(this.selectedStyle);
      
      // ✅ USAGE LIMITS: Pobierz dane użytkownika do przekazania do API
      const customerInfo = this.getCustomerInfo();
      
      // ✅ Pobierz email z localStorage (jeśli był w formularzu) lub z customerInfo
      const email = customerInfo?.email || localStorage.getItem('customify_email_provided') || null;
      
      const requestBody = {
        imageData: base64,
        // ❌ USUNIĘTO: prompt - backend używa config.prompt z konfiguracji stylu (jak dla króla, kotów, etc.)
        style: this.selectedStyle, // ✅ STYL - API użyje tego do identyfikacji stylu i pobrania prompta z config
        productType: productType, // Przekaż typ produktu do API
        customerId: customerInfo?.customerId || null,
        // ✅ EMAIL: ZAWSZE wysyłaj email jeśli dostępny (dla zalogowanych i niezalogowanych)
        // Backend użyje tego do ustawienia metafield generation_ready dla emaili Shopify Flow
        email: customerInfo?.email || email || null
        // ❌ USUNIĘTO: watermarkedImage - watermark generujemy PO transformacji AI, nie przed!
      };
      
      if (spotifyPayload) {
        requestBody.spotifyTitle = spotifyPayload.title;
        requestBody.spotifyArtist = spotifyPayload.artist;
      }

      if (promptAddition) {
        requestBody.promptAddition = promptAddition;
        const cfg = this.getCustomFieldConfig();
        if (cfg && cfg.promptTemplate) requestBody.replaceBasePrompt = true;
        console.log('🎛️ [CUSTOM-FIELDS] Dodano promptAddition do requestBody:', promptAddition.substring(0, 100), cfg && cfg.promptTemplate ? '(replaceBasePrompt)' : '');
      }

      // 📸 MULTI-UPLOAD: Upload dodatkowych zdjęć do Vercel Blob i dodaj URL-e
      if (this.isMultiUploadProduct()) {
        const multiFiles = this.getMultiUploadFiles();
        const additionalImageUrls = [];
        for (let i = 1; i < multiFiles.length; i++) {
          const file = multiFiles[i];
          const fileBase64 = await this.fileToBase64(file);
          console.log(`📸 [MULTI-UPLOAD] Uploading image ${i+1}/${multiFiles.length} to Vercel Blob...`);
          try {
            const uploadResp = await fetch('https://customify-s56o.vercel.app/api/upload-temp-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageData: fileBase64, filename: `multi-upload-${Date.now()}-${i}.jpg` })
            });
            if (uploadResp.ok) {
              const uploadResult = await uploadResp.json();
              if (uploadResult.url) {
                additionalImageUrls.push(uploadResult.url);
                console.log(`📸 [MULTI-UPLOAD] Image ${i+1} uploaded:`, uploadResult.url.substring(0, 80));
              }
            }
          } catch (uploadErr) {
            console.warn(`⚠️ [MULTI-UPLOAD] Failed to upload image ${i+1}:`, uploadErr);
          }
        }
        if (additionalImageUrls.length > 0) {
          requestBody.additionalImages = additionalImageUrls;
          console.log(`📸 [MULTI-UPLOAD] Total additional images: ${additionalImageUrls.length}`);
        }
      }
      
      console.log('📱 [MOBILE] Request body size:', JSON.stringify(requestBody).length, 'bytes');
      console.log('👤 [MOBILE] Customer info:', customerInfo ? 'zalogowany' : 'niezalogowany');
      
      // ✅ SZCZEGÓŁOWE LOGOWANIE DLA DIAGNOSTYKI
      console.log('🔍 [FRONTEND] Customer Info Details:', {
        customerId: customerInfo?.customerId || 'null',
        customerIdType: typeof customerInfo?.customerId,
        email: customerInfo?.email || email || 'null',
        customerAccessToken: customerInfo?.customerAccessToken || 'null',
        hasCustomerInfo: !!customerInfo,
        windowShopifyCustomer: window.ShopifyCustomer ? {
          id: window.ShopifyCustomer.id,
          loggedIn: window.ShopifyCustomer.loggedIn,
          email: window.ShopifyCustomer.email
        } : 'null'
      });
      
      console.log('🔍 [FRONTEND] Request Body (bez imageData):', {
        // ❌ USUNIĘTO: prompt - backend używa config.prompt
        style: requestBody.style, // ✅ STYL - API użyje tego do identyfikacji stylu
        selectedStyle: this.selectedStyle, // ✅ DEBUG: Dodaj selectedStyle
        productType: requestBody.productType,
        customerId: requestBody.customerId,
        customerIdType: typeof requestBody.customerId,
        customerAccessToken: requestBody.customerAccessToken ? 'present' : 'null',
        email: requestBody.email,
        imageDataLength: requestBody.imageData?.length || 0
      });
      
      // ✅ POKAŻ PEŁNY REQUEST BODY (bez imageData dla czytelności)
      const requestBodyForLog = { ...requestBody };
      requestBodyForLog.imageData = `[BASE64 DATA: ${requestBody.imageData?.length || 0} characters]`;
      console.log('📤 [FRONTEND] ===== PEŁNY REQUEST BODY (imageData skrócony) =====');
      console.log('📤 [FRONTEND]', JSON.stringify(requestBodyForLog, null, 2));
      console.log('📤 [FRONTEND] style value:', requestBody.style);
      console.log('📤 [FRONTEND] style type:', typeof requestBody.style);
      console.log('📤 [FRONTEND] style === undefined:', requestBody.style === undefined);
      console.log('📤 [FRONTEND] this.selectedStyle:', this.selectedStyle);
      console.log('📤 [FRONTEND] ====================================================');
      
      // ✅ DEBUG: Sprawdź czy selectedStyle jest poprawny
      console.log('🔍🔍🔍 [FRONTEND-DEBUG] selectedStyle przed wysłaniem:', {
        selectedStyle: this.selectedStyle,
        selectedStyleType: typeof this.selectedStyle,
        styleCard: document.querySelector(`[data-style="${this.selectedStyle}"]`) ? 'found' : 'NOT FOUND'
        // ❌ USUNIĘTO: promptContainsStyle - prompt nie jest już w request body
      });
      
      const response = await fetch('https://customify-s56o.vercel.app/api/transform', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('📱 [MOBILE] Response received:', response.status, response.statusText);
      console.log('📱 [MOBILE] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📱 [MOBILE] Response error:', errorText);

        let errorJson = null;
        try {
          errorJson = JSON.parse(errorText);
        } catch (parseError) {
          console.warn('⚠️ [MOBILE] Failed to parse error JSON:', parseError);
        }

        if (response.status === 403 && errorJson?.error === 'Usage limit exceeded') {
          console.warn('⚠️ [USAGE] Limit exceeded response from API:', errorJson);

          if (!customerInfo) {
            const usedCount = typeof errorJson.usedCount === 'number' ? errorJson.usedCount : 1;
            const totalLimit = typeof errorJson.totalLimit === 'number' ? errorJson.totalLimit : 1;

            try {
              const FREE_LIMIT = 1;
              const enforcedCount = Math.max(usedCount, FREE_LIMIT);
              localStorage.setItem('customify_usage_count', enforcedCount.toString());
              console.log('💾 [USAGE] Synced local usage count to', enforcedCount);
            } catch (storageError) {
              console.warn('⚠️ [USAGE] Failed to sync local usage count:', storageError);
            }

            this.showLoginModal(usedCount, totalLimit);
          } else {
            const limitMessage = errorJson.message || 'Wykorzystałeś wszystkie dostępne transformacje.';
            this.showError(limitMessage, 'transform');
          }

          return;
        }

        if (response.status === 403 && errorJson?.error === 'Image already used') {
          console.warn('⚠️ [IMAGE-HASH] Image already used response from API:', errorJson);
          const baseMessage = errorJson.message || 'Dla tego zdjęcia wynik jest gotowy, zobacz poniżej. Spróbuj inne zdjęcie, albo inne produkty';
          // Utwórz komunikat z linkiem do innych produktów
          const messageWithLink = `${baseMessage} <a href="/collections/see_also" style="color: #0066cc; text-decoration: underline;">Zobacz inne produkty</a>`;
          this.showErrorWithHTML(messageWithLink, 'transform');
          return;
        }

        if (errorJson?.error === 'CROPPED_FACE') {
          const msg = errorJson.message || 'Zdjęcie musi pokazywać całą twarz z przodu. Użyj zdjęcia, gdzie twarz jest w pełni widoczna i nie jest ucięta.';
          this.showError(msg, 'transform');
          return;
        }

        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('📱 [MOBILE] Response JSON parsed successfully');
      
      // ✅ BARDZO WIDOCZNE LOGOWANIE - SPRAWDŹ CZY JEST saveGenerationDebug
      console.log('🔍🔍🔍 [FRONTEND] ===== SPRAWDZAM RESPONSE Z TRANSFORM API =====');
      console.log('🔍 [FRONTEND] Response keys:', Object.keys(result));
      console.log('🔍 [FRONTEND] hasSaveGenerationDebug:', !!result.saveGenerationDebug);
      console.log('🔍 [FRONTEND] saveGenerationDebug value:', result.saveGenerationDebug);
      console.log('✅ [FRONTEND] Transform API Response:', {
        success: result.success,
        hasTransformedImage: !!result.transformedImage,
        transformedImageType: typeof result.transformedImage,
        transformedImagePreview: result.transformedImage?.substring(0, 100) || 'null',
        error: result.error || 'none',
        hasSaveGenerationDebug: !!result.saveGenerationDebug
      });
      
      // ✅ SPRAWDŹ CZY W RESPONSE SĄ DEBUG INFO Z SAVE-GENERATION
      if (result.saveGenerationDebug) {
        console.log('🔍🔍🔍 [FRONTEND] ===== ZNALEZIONO saveGenerationDebug W RESPONSE! =====');
        console.log('🔍 [FRONTEND] Save-generation debug info (z backend):', JSON.stringify(result.saveGenerationDebug, null, 2));
        console.log('🔍 [FRONTEND] customerId:', result.saveGenerationDebug.customerId || 'null');
        console.log('🔍 [FRONTEND] metafieldUpdateAttempted:', result.saveGenerationDebug.metafieldUpdateAttempted || false);
        console.log('🔍 [FRONTEND] metafieldUpdateSuccess:', result.saveGenerationDebug.metafieldUpdateSuccess || false);
        console.log('🔍 [FRONTEND] metafieldUpdateError:', result.saveGenerationDebug.metafieldUpdateError || 'none');
        
        // ✅ POKAŻ W CONSOLE CZY METAFIELD ZOSTAŁ ZAKTUALIZOWANY
        if (result.saveGenerationDebug.metafieldUpdateSuccess) {
          console.log('✅ [FRONTEND] Metafield zaktualizowany pomyślnie w Shopify Admin!');
        } else if (result.saveGenerationDebug.metafieldUpdateAttempted) {
          console.warn('⚠️ [FRONTEND] Próba aktualizacji metafielda nie powiodła się:', result.saveGenerationDebug.metafieldUpdateError || 'unknown error');
        } else if (result.saveGenerationDebug.skipped) {
          console.warn('⚠️ [FRONTEND] Zapis generacji został pominięty:', result.saveGenerationDebug.reason || 'unknown reason');
        } else {
          console.warn('⚠️ [FRONTEND] Metafield nie został zaktualizowany - brak customerId lub inny problem');
        }
      } else {
        console.warn('⚠️⚠️⚠️ [FRONTEND] ===== BRAK saveGenerationDebug W RESPONSE! =====');
        console.warn('⚠️ [FRONTEND] Response keys:', Object.keys(result));
        console.warn('⚠️ [FRONTEND] Full response:', JSON.stringify(result, null, 2));
        console.warn('⚠️⚠️⚠️ [FRONTEND] ===== KONIEC SPRAWDZANIA RESPONSE =====');
      }
      
      if (result.success) {
        this.transformedImage = result.transformedImage;
        // ✅ STATS: Generacje AI zlicza backend (transform.js) – jedna źródło prawdy, bez podwójnego liczenia
        // ✅ ZAPISZ watermarkedImageUrl z backendu (jeśli dostępny)
        this.watermarkedImageUrl = result.watermarkedImageUrl || null;
        console.log('✅ [TRANSFORM] watermarkedImageUrl z backendu:', this.watermarkedImageUrl?.substring(0, 100) || 'brak');
        // ✅ NOWE: ZAPISZ watermarkedImageBase64 z backendu (dla /api/products - BEZ PONOWNEGO DOWNLOADU)
        this.watermarkedImageBase64 = result.watermarkedImageBase64 || null;
        console.log('✅ [TRANSFORM] watermarkedImageBase64 z backendu:', this.watermarkedImageBase64 ? `${this.watermarkedImageBase64.length} chars` : 'brak');
        this.hideError(); // Ukryj komunikat błędu po udanej transformacji
        
        // ✅ AWAIT: Czekaj aż wynik zostanie pokazany
        // showResult() użyje watermarkedImageUrl jeśli dostępny, w przeciwnym razie transformedImage
        await this.showResult(result.transformedImage);
        if (!this.isPhonePhotoCaseProduct || !this.isPhonePhotoCaseProduct()) {
          if (customerInfo) {
            this.showSuccess('Obraz zapisany, jest dostępny w sekcji <a href="https://lumly.pl/pages/my-generations" target="_blank" rel="noopener">Moje obrazy</a>.', { html: true });
          } else {
            this.showSuccess('Obraz zapisany! Możesz go zobaczyć później w sekcji Twoje obrazy - Poniżej.');
          }
        }
        
        // ✅ UKRYJ PASEK POSTĘPU - obraz jest już widoczny, reszta działa w tle
        this.hideLoading();

        // 🆕 Tekst na obrazie – pokaż panel dopiero po generacji (tylko produkt pilota)
        if (this.textOverlayEnabled && this.textOverlayPanel) {
          this.watermarkedImageUrl = result.watermarkedImageUrl || result.transformedImage;
          this.textOverlayBaseImage = result.transformedImage || null;
          this.textOverlayOriginalWatermarked = result.watermarkedImageUrl || null;
          this.textOverlayState = { ...this.textOverlayState, text: '', applied: false };
          if (this.textOverlayInput) {
            this.textOverlayInput.value = '';
            this.updateTextOverlayCounter();
          }
          this.textOverlayPanel.style.display = 'none';
          this.textOverlayToggleBtn?.setAttribute('data-overlay-open', 'false');
          this.updateTextOverlayHint('');
        }
        
        // ✅ BACKEND WATERMARK: Backend już generuje watermark i zwraca watermarkedImageUrl w response
        // ✅ Backend zapisuje watermarkedImageUrl w save-generation-v2 automatycznie
        // ✅ NIE WYSYŁAMY już frontend watermarku do /api/update-generation-watermark (stary system)
        if (result.watermarkedImageUrl) {
          console.log('✅ [TRANSFORM] Backend watermark dostępny:', result.watermarkedImageUrl.substring(0, 100));
          console.log('✅ [TRANSFORM] Backend watermark zapisany w save-generation automatycznie');
        } else {
          console.warn('⚠️ [TRANSFORM] Backend watermark nie jest dostępny - frontend użyje fallback w showResult()');
        }
        
        // ✅ STARY KOD USUNIĘTY: Frontend watermark generation i /api/update-generation-watermark
        // ✅ Backend już generuje watermark i zwraca watermarkedImageUrl w response
        // ✅ showResult() w theme.liquid używa this.watermarkedImageUrl (ustawiony powyżej)
        
        // 🎨 GALERIA: Zapisz generację do localStorage z base64 cache
        // ✅ DODAJ productType do generacji (dla skalowalności)
        const productType = this.getProductTypeFromStyle(this.selectedStyle);
        this.saveAIGeneration(
          base64,                     // Oryginalne zdjęcie (base64)
          result.transformedImage,    // AI obraz URL
          this.selectedStyle,         // Styl (pixar, boho, etc)
          this.selectedSize,         // Rozmiar (a4, a3, etc)
          productType,                // ✅ ProductType (boho, king, cats, etc)
          result.watermarkedImageUrl || this.watermarkedImageUrl || null, // ✅ ZAPISZ watermarkedImageUrl (Vercel Blob z watermarkiem)
          result.watermarkedImageBase64 || this.watermarkedImageBase64 || null // ✅ NOWE: Base64 watermarku (dla /api/products - BEZ PONOWNEGO DOWNLOADU)
        ).then(() => {
          console.log('✅ [CACHE] AI generation saved with base64 cache');
          
          // ✅ KLUCZOWE: Pobierz zapisany generation z historii i użyj jego URL (z Vercel Blob)
          const generations = this.getAIGenerations();
          if (generations.length > 0) {
            const lastGeneration = generations[0];
            if (lastGeneration.transformedImage) {
              console.log('✅ [CACHE] Using saved URL from history:', lastGeneration.transformedImage.substring(0, 100));
              this.transformedImage = lastGeneration.transformedImage; // Użyj URL z Vercel Blob zamiast oryginału
              console.log('✅ [CACHE] Updated this.transformedImage to saved URL');
            }
          }
        }).catch(error => {
          console.error('❌ [CACHE] Failed to save AI generation:', error);
        });
        
        // ✅ USAGE LIMITS: Inkrementuj licznik dla niezalogowanych (zalogowani są inkrementowani w API)
        if (!customerInfo) {
          const productType = this.getProductTypeFromStyle(this.selectedStyle);
          this.incrementLocalUsage(productType);
          // Usage count incremented after successful transform (per productType)
        } else {
          // Zalogowani - odśwież licznik z API (został zaktualizowany w backend)
          this.showUsageCounter();
          // Counter refreshed for logged-in user
        }
      } else {
        this.showError('Błąd podczas transformacji: ' + (result.error || 'Nieznany błąd'), 'transform');
      }
    } catch (error) {
      console.error('📱 [MOBILE] Transform error:', error);
      
      // Retry logic for network errors
      if (retryCount < 3 && (
        error.name === 'AbortError' || 
        (error?.message && error.message.includes('Failed to fetch')) || 
        (error?.message && error.message.includes('NetworkError'))
      )) {
        console.log(`🔄 [MOBILE] Retrying in 2 seconds... (attempt ${retryCount + 1}/3)`);
        alert(`🔄 Ponawiam próbę ${retryCount + 1}/3...`);
        setTimeout(() => {
          this.transformImage(retryCount + 1);
        }, 2000);
        return;
      }
      
      let errorMessage = 'Błąd połączenia z serwerem';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Przekroczono limit czasu (5 minut). Spróbuj ponownie.';
      } else if (error?.message && error.message.includes('Failed to fetch')) {
        errorMessage = 'Błąd sieci. Sprawdź połączenie internetowe.';
      } else if (error?.message && error.message.includes('NetworkError')) {
        errorMessage = 'Błąd sieci. Spróbuj ponownie za chwilę.';
      } else if (error?.message && error.message.includes('TypeError')) {
        errorMessage = 'Błąd przetwarzania. Spróbuj ponownie.';
      } else if (error?.message) {
        errorMessage = 'Błąd: ' + error.message;
      } else if (typeof error === 'string') {
        errorMessage = 'Błąd: ' + error;
      }
      
      this.showError(errorMessage, 'transform');
    } finally {
      this.hideLoading();
    }
  }

  // FUNKCJA DODAWANIA WATERMARKU
  async addWatermark(imageUrl) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('🔤 [WATERMARK DEBUG] START - imageUrl:', imageUrl?.substring(0, 100));
        console.log('🔤 [WATERMARK DEBUG] document.fonts.status:', document.fonts.status);
        console.log('🔤 [WATERMARK DEBUG] Czekam na document.fonts.ready...');
        
        // 🔧 POZIOM 1: Poczekaj na załadowanie fontów PRZED renderowaniem
        await document.fonts.ready;
        console.log('✅ [WATERMARK DEBUG] document.fonts.ready - fonty załadowane!');
        
        const img = new Image();
        // ✅ crossOrigin tylko dla zdalnych URL-i (HTTP/HTTPS), NIE dla base64 data URI!
        // Base64 data URI nie wymaga crossOrigin - działa bezpośrednio
        if (imageUrl && !imageUrl.startsWith('data:')) {
          img.crossOrigin = 'anonymous'; // Tylko dla zdalnych URL-i
        }
        
        img.onload = () => {
          try {
            console.log('🖼️ [WATERMARK DEBUG] Image loaded:', img.width, 'x', img.height);
            
            // ✅ ZMNIEJSZENIE WATERMARKU: 50% rozmiaru oryginału (dla miniaturki w Shopify i emaili)
            // Oryginał BEZ watermarku pozostaje w pełnym rozmiarze na Vercel (do druku)
            const scale = 0.5; // 50% rozmiaru (zmniejszamy dla Shopify + Vercel watermark)
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            console.log(`📐 [WATERMARK DEBUG] Watermark canvas size: ${canvas.width}x${canvas.height} (${Math.round(scale * 100)}% of original)`);
            
            // Rysuj oryginalny obraz na zmniejszonym Canvas (automatycznie skaluje)
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            console.log('✅ [WATERMARK DEBUG] Original image drawn on resized canvas (50% scale)');
            
            // ===== WZÓR DIAGONALNY - "LUMLY.PL" i "PODGLAD" NA PRZEMIAN =====
            ctx.save();
            
            // ✅ DOSTOSOWANY FONT SIZE: większy dla lepszej widoczności
            const fontSize = Math.max(20, Math.min(canvas.width, canvas.height) * 0.11); // 11% canvas
            console.log('📏 [WATERMARK DEBUG] fontSize:', fontSize);
            
            // 🔧 POZIOM 2: Użyj systemowych fontów z fallbackami + UPPERCASE bez polskich znaków
            const fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
            ctx.font = `bold ${fontSize}px ${fontFamily}`;
            console.log('🔤 [WATERMARK DEBUG] Font ustawiony:', ctx.font);
            
            // 🔒 Watermark podglądu: ZBALANSOWANY (opacity 0.45 + cieńszy obrys)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.lineWidth = 1.5;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // 🔧 POZIOM 3: Test renderowania - sprawdź czy font działa
            const testText = 'TEST';
            const testMetrics = ctx.measureText(testText);
            console.log('🔍 [WATERMARK DEBUG] Test measureText("TEST"):', {
              width: testMetrics.width,
              actualBoundingBoxLeft: testMetrics.actualBoundingBoxLeft,
              actualBoundingBoxRight: testMetrics.actualBoundingBoxRight
            });
            
            if (testMetrics.width === 0) {
              console.error('❌ [WATERMARK DEBUG] Font test FAILED! width=0, próbuję fallback monospace');
              ctx.font = `bold ${fontSize}px monospace`;
              console.log('🔄 [WATERMARK DEBUG] Fallback font:', ctx.font);
              
              const fallbackMetrics = ctx.measureText(testText);
              console.log('🔍 [WATERMARK DEBUG] Fallback measureText("TEST"):', {
                width: fallbackMetrics.width
              });
            } else {
              console.log('✅ [WATERMARK DEBUG] Font test OK! width=' + testMetrics.width);
            }
            
            // Test canvas rendering - czy tekst się faktycznie renderuje?
            const testCanvas = document.createElement('canvas');
            testCanvas.width = 200;
            testCanvas.height = 100;
            const testCtx = testCanvas.getContext('2d');
            testCtx.font = ctx.font;
            testCtx.fillStyle = 'black';
            testCtx.fillText('Lumly.pl', 100, 50);
            const testDataUrl = testCanvas.toDataURL();
            console.log('🧪 [WATERMARK DEBUG] Test canvas rendering:', testDataUrl.substring(0, 100) + '...');
            
            // Obróć canvas w przeciwną stronę niż backend (ok. +30°)
            ctx.translate(canvas.width/2, canvas.height/2);
            ctx.rotate(30 * Math.PI / 180);
            ctx.translate(-canvas.width/2, -canvas.height/2);
            console.log('🔄 [WATERMARK DEBUG] Canvas rotated +30°');
            
            // 🔧 TEKST WATERMARKU - tylko "Lumly.pl"
            const texts = ['Lumly.pl'];
            console.log('📝 [WATERMARK DEBUG] Teksty watermarku:', texts);
            
            // Rysuj watermarki w siatce - na przemian
            const spacing = Math.max(200, Math.min(canvas.width, canvas.height) * 0.3);
            console.log('📏 [WATERMARK DEBUG] Spacing:', spacing);
            
            let textIndex = 0;
            let watermarkCount = 0;
            
            for(let y = -canvas.height; y < canvas.height * 2; y += spacing) {
              for(let x = -canvas.width; x < canvas.width * 2; x += spacing * 1.5) {
                const text = texts[0]; // Tylko "Lumly.pl"
                // ✅ RYSUJ STROKE PRZED FILL (dla lepszej widoczności)
                ctx.strokeText(text, x, y);
                ctx.fillText(text, x, y);
                textIndex++;
                watermarkCount++;
              }
              // Zmień wzór co wiersz dla lepszego efektu
              textIndex++;
            }
            
            console.log('✅ [WATERMARK DEBUG] Narysowano', watermarkCount, 'watermarków');
            
            ctx.restore();
            
            // Zwróć obraz z watermarkiem jako Data URL
            // ✅ ZMNIEJSZONA JAKOŚĆ: 70% quality (watermark nie musi być w wysokiej jakości - tylko do podglądu/emaili)
            const result = canvas.toDataURL('image/jpeg', 0.70);
            const resultSizeKB = Math.round(result.length / 1024);
            console.log('✅ [WATERMARK DEBUG] Canvas.toDataURL() - rozmiar:', result.length, 'znaków (', resultSizeKB, 'KB /', (result.length / 1024 / 1024).toFixed(2), 'MB)');
            console.log('✅ [WATERMARK DEBUG] Watermark: 50% rozmiaru + 70% quality = kompaktowy plik');
            console.log('✅ [WATERMARK DEBUG] Result preview:', result.substring(0, 100) + '...');
            
            resolve(result);
          } catch (error) {
            console.error('❌ [WATERMARK DEBUG] Canvas error:', error);
            console.error('❌ [WATERMARK DEBUG] Error stack:', error.stack);
            reject(error);
          }
        };
        
        img.onerror = (error) => {
          console.error('❌ [WATERMARK DEBUG] Image load error:', error);
          console.error('❌ [WATERMARK DEBUG] Failed imageUrl:', imageUrl?.substring(0, 100));
          reject(new Error('Nie udało się załadować obrazu do watermarku: ' + error.message));
        };
        
        // ✅ Ustaw src - działa zarówno z URL jak i base64 data URI
        console.log('🖼️ [WATERMARK DEBUG] Setting img.src, type:', imageUrl?.startsWith('data:') ? 'base64' : 'URL');
        img.src = imageUrl;
      } catch (error) {
        console.error('❌ [WATERMARK DEBUG] Async error:', error);
        console.error('❌ [WATERMARK DEBUG] Error stack:', error.stack);
        reject(error);
      }
    });
  }

  async showResult(imageUrl) {
    console.log('🎯 [CUSTOMIFY] showResult called, hiding actionsArea and stylesArea');
    
    // ✅ POKAŻ PRZETWORZONY OBRAZ AI (bez watermarku w podglądzie)
    // Watermark będzie dodany PO transformacji i zapisany przez /api/update-generation-watermark
    // 📱 Phone case: use background-image in PREVIEW area (same place as uploaded image)
    if (this.isPhonePhotoCaseProduct()) {
      console.log('📱 [PHONE PREVIEW] Phone case detected, using preview area');
      // Use watermarkedImageUrl if available, otherwise use imageUrl
      const finalImageUrl = this.watermarkedImageUrl || imageUrl;
      console.log('📱 [PHONE PREVIEW] Using image URL:', finalImageUrl ? finalImageUrl.substring(0, 50) + '...' : 'none');
      
      const photoBg = document.getElementById('phoneCasePhotoBg');
      const resultBg = document.getElementById('phoneCaseResultBg');
      const inner = document.querySelector('#customify-app-container .phone-case-inner');
      
      // Set image in PREVIEW area (main location)
      if (photoBg) {
        photoBg.style.backgroundImage = `url(${finalImageUrl})`;
        console.log('[PHONE PREVIEW] set background image in PREVIEW area (phoneCasePhotoBg)', finalImageUrl.substring(0, 50) + '...');
      } else {
        console.warn('⚠️ [PHONE PREVIEW] phoneCasePhotoBg not found!');
      }
      
      // Also set in result area (backup, but resultArea will be hidden)
      if (resultBg) {
        resultBg.style.backgroundImage = `url(${finalImageUrl})`;
        console.log('[PHONE PREVIEW] set background image in RESULT area (phoneCaseResultBg) as backup');
      }
      
      if (inner) {
        const innerRect = inner.getBoundingClientRect();
        console.log('[PHONE PREVIEW] inner rect', {
          width: innerRect.width,
          height: innerRect.height,
          aspectRatio: innerRect.width / innerRect.height
        });
      }
      // Keep resultImage hidden but set src for compatibility
      if (this.resultImage) {
        this.resultImage.src = finalImageUrl;
      }
      // 📱 Phone case: hide resultArea, keep previewArea visible (like Spotify)
      if (this.resultArea) {
        this.resultArea.style.display = 'none !important';
        this.resultArea.style.setProperty('display', 'none', 'important');
        console.log('📱 [PHONE PREVIEW] resultArea hidden with !important');
      }
      if (this.previewArea) {
        this.previewArea.style.display = 'block';
        console.log('📱 [PHONE PREVIEW] previewArea shown');
      }
      // 📱 Phone case: Also hide resultArea after a delay (in case something shows it later)
      setTimeout(() => {
        if (this.resultArea && this.isPhonePhotoCaseProduct()) {
          this.resultArea.style.display = 'none !important';
          this.resultArea.style.setProperty('display', 'none', 'important');
          console.log('📱 [PHONE PREVIEW] resultArea hidden again (delayed)');
        }
      }, 100);
    } else {
      this.resultImage.src = imageUrl; // Pokaż PRZETWORZONY obraz AI (bez watermarku w podglądzie)
      this.resultArea.style.display = 'block';
    }
    console.log('✅ [CUSTOMIFY] Showing AI result (watermark will be added after)');
    
    // Rozmiary są zawsze widoczne na górze (poza resultArea)
    this.sizeArea.style.display = 'block';
    console.log('🎯 [CUSTOMIFY] Size area visible on top (outside resultArea)');
    
    // UKRYJ przyciski "Przekształć z AI" i "Resetuj" (główne actionsArea)
    this.actionsArea.style.display = 'none';
    console.log('🎯 [CUSTOMIFY] actionsArea hidden:', this.actionsArea.style.display);
    
    // UKRYJ style po przekształceniu
    this.stylesArea.style.display = 'none';
    console.log('🎯 [CUSTOMIFY] stylesArea hidden:', this.stylesArea.style.display);
    
    // Zmień kolory przycisków po wygenerowaniu AI
    this.swapButtonColors();
    
    // UKRYJ pole upload po przekształceniu
    this.uploadArea.style.display = 'none';
    console.log('🎯 [CUSTOMIFY] uploadArea hidden:', this.uploadArea.style.display);
    // 📸 UKRYJ multi-upload grid po przekształceniu
    const multiUploadArea = document.getElementById('multiUploadArea');
    if (multiUploadArea) multiUploadArea.style.display = 'none';

    // Ukryj previewArea po generacji TYLKO dla spotify
    if (this.isSpotifyProduct() && this.previewArea) {
      this.previewArea.style.display = 'none';
      console.log('🎯 [CUSTOMIFY] previewArea hidden after generation (spotify only)');
      // Ukryj ponownie po 200ms - na wypadek gdyby coś później ustawiło block
      setTimeout(() => {
        if (this.previewArea) {
          this.previewArea.style.display = 'none';
          console.log('🎯 [CUSTOMIFY] previewArea hidden again (delayed)');
        }
      }, 200);
    }
    
    if (this.isSpotifyProduct() && this.spotifyFieldsPanel) {
      this.spotifyFieldsPanel.style.display = 'block';
    }
    
    // ✅ POKAŻ CENĘ NAD PRZYCISKIEM po wygenerowaniu AI
    this.updateCartPrice();
    
    // 🎵 Spotify frame: przelicz skalę z opóźnieniem (czekaj na layout + załadowanie obrazka)
    setTimeout(() => this.updateSpotifyFrameScale(), 100);
    this.resultImage.onload = () => {
      setTimeout(() => this.updateSpotifyFrameScale(), 50);
    };
    
  }

  // NAPRAWIONA FUNKCJA: STWÓRZ NOWY PRODUKT Z OBRAZKIEM AI (UKRYTY W KATALOGU)
  async addToCart(retryCount = 0) {
    // ✅ POKAŻ LOADING od razu - dodawanie do koszyka może trwać
    this.showLoading();
    
    console.log('🛒 [CUSTOMIFY] addToCart called with:', {
      transformedImage: !!this.transformedImage,
      selectedStyle: this.selectedStyle,
      selectedSize: this.selectedSize,
      selectedProductType: this.selectedProductType,
      retryCount: retryCount
    });
    
    // ✅ SPRAWDŹ ROZMIAR - dla etui brak selektora, używamy domyślnego
    if (this.isPhonePhotoCaseProduct()) {
      if (!this.selectedSize) this.selectedSize = 'etui';
      if (this.selectedProductType !== 'etui') this.selectedProductType = 'etui';
    }
    if (!this.selectedSize) {
      console.log('❌ [CUSTOMIFY] No selectedSize, showing error');
      this.showError('Nie wybrałeś rozmiaru', 'cart');
      this.hideLoading();
      return;
    }
    
    // 🚨 WALIDACJA: Dla szkła tylko A5 i A4 są dozwolone (maksymalnie 20×30 cm)
    if (this.selectedProductType === 'szklo') {
      const allowedSizes = ['a5', 'a4'];
      if (!allowedSizes.includes(this.selectedSize.toLowerCase())) {
        console.error('❌ [CUSTOMIFY] Invalid size for szklo:', this.selectedSize);
        this.showError('Dla wydruku na szkle dostępne są tylko rozmiary: 15×21 cm (A5) i 20×30 cm (A4). Maksymalny rozmiar to 20×30 cm.', 'cart');
        this.hideLoading();
        return;
      }
    }
    
    console.log('✅ [CUSTOMIFY] selectedSize OK, proceeding with price calculation');

    // ✅ OBLICZ CENĘ NAJPIERW - niezależnie od obrazu AI
    const basePrice = this.originalBasePrice || 49.00;
    const sizePrice = this.getSizePrice(this.selectedSize);
    const frameSelected = (this.selectedProductType === 'plakat') && (window.CustomifyFrame && window.CustomifyFrame.color && window.CustomifyFrame.color !== 'none');
    const frameSurcharge = frameSelected && this.selectedSize ? (this.framePricing[this.selectedSize] || 29) : 0;
    const finalPrice = basePrice + sizePrice + frameSurcharge;
    
    console.log('💰 [CUSTOMIFY] Price calculation:', {
      originalBasePrice: this.originalBasePrice,
      basePrice: basePrice,
      sizePrice: sizePrice,
      frameSelected: frameSelected,
      frameSurcharge: frameSurcharge,
      frameColor: window.CustomifyFrame?.color || 'none',
      selectedProductType: this.selectedProductType,
      finalPrice: finalPrice,
      size: this.selectedSize
    });

    // ✅ SPRAWDŹ OBRAZ AI DOPIERO POTEM
    if (!this.transformedImage) {
      this.showError('Brak przekształconego obrazu', 'cart');
      this.hideLoading();
      return;
    }
    
    // ✅ SPRAWDŹ STYL
    if (!this.selectedStyle) {
      this.showError('Wybierz styl', 'cart');
      return;
    }

    // 📱 Etui: wymagana marka i model telefonu
    if (this.isPhonePhotoCaseProduct()) {
      if (!this.selectedPhoneBrand || !this.selectedPhoneModel) {
        this.showError('Wybierz markę i model telefonu', 'cart');
        this.hideLoading();
        return;
      }
    }

    // 🆕 Tekst na obrazie: jeśli użytkownik wpisał tekst, musi kliknąć „Zastosuj napis”
    let textOverlayPayload = null;
    if (this.textOverlayEnabled) {
      const draftText = (this.textOverlayInput?.value || '').trim();
      if (draftText && !this.textOverlayState.applied) {
        this.showError('Kliknij „Zapisz”, aby dodać napis do zamówienia', 'cart');
        return;
      }
      textOverlayPayload = this.getTextOverlayPayload();
    }

    console.log('🛒 [CUSTOMIFY] Starting addToCart process...');
    this.hideError();

    // Pokaż pasek postępu dla koszyka
    this.showCartLoading();

    try {
      // Pobierz ID produktu z różnych możliwych źródeł
      const productId = 
        document.querySelector('[data-product-id]')?.getAttribute('data-product-id') ||
        document.querySelector('form[action*="/cart/add"] input[name="id"]')?.value ||
        window.ShopifyAnalytics?.meta?.product?.id ||
        null;
      
      console.log('🆔 [CUSTOMIFY] Original product ID:', productId);
      
      // Sprawdź czy finalPrice jest poprawny
      if (!finalPrice || finalPrice <= 0) {
        console.error('❌ [CUSTOMIFY] Invalid finalPrice:', finalPrice);
        this.showError('Błąd obliczania ceny. Spróbuj ponownie.', 'cart');
        return;
      }

      // Sprawdź czy mamy uploadedFile (z upload) czy originalImage (z galerii)
      console.log('[DEBUG] Before originalImage check');
      console.log('[DEBUG] this.uploadedFile:', !!this.uploadedFile);
      console.log('[DEBUG] this.originalImageFromGallery:', !!this.originalImageFromGallery);
      console.log('[DEBUG] this.transformedImage:', !!this.transformedImage);
      
      let originalImage;
      if (this.uploadedFile) {
        // Z upload - konwertuj plik na base64
        console.log('[DEBUG] Before fileToBase64 call');
        originalImage = await this.fileToBase64(this.uploadedFile);
        console.log('[DEBUG] After fileToBase64 call, originalImage length:', originalImage?.length);
      } else if (this.originalImageFromGallery) {
        // Z galerii - użyj zapisany originalImage
        originalImage = this.originalImageFromGallery;
      } else {
        // Fallback - użyj transformedImage jako originalImage
        originalImage = this.transformedImage;
        console.warn('⚠️ [CUSTOMIFY] No original image available, using transformed image as fallback');
      }

      console.log('[DEBUG] After originalImage assignment, before SPOTIFY section');
      console.log('[DEBUG] this.isSpotifyProduct() result:', this.isSpotifyProduct());

      // 🎵 SPOTIFY: Komponuj finalny obraz z maską i tekstami
      console.log('[SPOTIFY CHECK] Reached SPOTIFY section in addToCart');
      console.log('[SPOTIFY CHECK] this.transformedImage:', this.transformedImage?.substring(0, 50));
      console.log('[SPOTIFY CHECK] this.watermarkedImageUrl:', this.watermarkedImageUrl?.substring(0, 50));
      
      let finalTransformedImage = this.transformedImage;
      let watermarkedImageUrl = this.watermarkedImageUrl || null;
      let needsBackendWatermark = false;
      
      // DEBUG: Sprawdź isSpotifyProduct
      console.log('[SPOTIFY CHECK] Before isSpotifyProduct() call');
      const isSpotify = this.isSpotifyProduct();
      console.log('[SPOTIFY CHECK] After isSpotifyProduct() call, result:', isSpotify);
      console.log('[SPOTIFY DEBUG] isSpotifyProduct():', isSpotify);
      console.log('[SPOTIFY DEBUG] window.location.pathname:', window.location.pathname);
      console.log('[SPOTIFY DEBUG] pathname.toLowerCase():', window.location.pathname.toLowerCase());
      console.log('[SPOTIFY DEBUG] includes ramka-spotify:', window.location.pathname.toLowerCase().includes('ramka-spotify'));
      console.log('[SPOTIFY DEBUG] this.isSpotifyProduct direct:', this.isSpotifyProduct());
      
      if (isSpotify) {
        console.log('🎵 [SPOTIFY] Composing final image with mask and texts...');
        try {
          finalTransformedImage = await this.composeSpotifyImage();
          console.log('✅ [SPOTIFY] Image composed successfully, length:', finalTransformedImage.length);
          // Dla spotify - backend musi dodać watermark do skomponowanego obrazu
          watermarkedImageUrl = null;
          needsBackendWatermark = true;
        } catch (err) {
          console.error('❌ [SPOTIFY] Failed to compose image:', err);
          this.showError('Nie udało się przygotować obrazu. Spróbuj ponownie.', 'cart');
          this.hideLoading();
          return;
        }
      }
      
      // ✅ TYLKO BACKEND WATERMARK - już jest na Vercel Blob, nie trzeba uploadować ponownie!
      if (!watermarkedImageUrl && !needsBackendWatermark) {
        console.error('❌ [CUSTOMIFY] Brak backend watermarkedImageUrl - nie można dodać do koszyka!');
        alert('Wystąpił błąd podczas generowania obrazu. Spróbuj wygenerować obraz ponownie klikając "Przekształć z AI".');
        this.hideLoading();
        return; // Blokada dodania do koszyka
      }
      
      if (watermarkedImageUrl) {
        console.log('✅ [CUSTOMIFY] Używam backend watermarkedImageUrl (już na Vercel Blob):', watermarkedImageUrl.substring(0, 100));
      } else {
        console.log('🎵 [SPOTIFY] Backend doda watermark do skomponowanego obrazu');
      }

      const productData = {
        originalImage: originalImage,
        transformedImage: finalTransformedImage, // 🎵 Dla spotify: skomponowany obraz, dla innych: this.transformedImage
        watermarkedImage: watermarkedImageUrl, // ✅ URL obrazka z watermarkiem (fallback dla starych wersji)
        watermarkedImageUrl: watermarkedImageUrl, // ✅ URL obrazka z watermarkiem (backend PNG - PRIORYTET), null dla spotify
        needsBackendWatermark: needsBackendWatermark, // 🎵 Dla spotify: backend musi dodać watermark
        watermarkedImageBase64: this.watermarkedImageBase64 || null, // ✅ NOWE: Base64 watermarku (dla /api/products - BEZ PONOWNEGO DOWNLOADU)
        style: this.selectedStyle,
        size: this.selectedSize,
        productType: this.isPhonePhotoCaseProduct() ? 'etui' : (this.selectedProductType || 'canvas'), // 📱 Etui: wymuszony productType
        originalProductTitle: document.querySelector('h1, .product-title, .view-product-title')?.textContent?.trim() || 'Produkt',
        originalProductId: productId, // ✅ Dodano ID produktu do pobrania ceny z Shopify
        finalPrice: finalPrice, // ✅ Przekaż obliczoną cenę do API
        frameColor: window.CustomifyFrame?.color || 'none', // ✅ Informacja o ramce dla debugowania
        frameSurcharge: frameSurcharge, // ✅ Dopłata za ramkę dla weryfikacji
        textOverlay: textOverlayPayload
      };

      console.log('🛒 [CUSTOMIFY] Creating product with data:', productData);
      console.log('🛒 [CUSTOMIFY] transformedImage type:', typeof this.transformedImage);
      console.log('🛒 [CUSTOMIFY] transformedImage length:', this.transformedImage?.length);
      console.log('🛒 [CUSTOMIFY] transformedImage is base64?', this.transformedImage?.startsWith('data:'));
      console.log('🛒 [CUSTOMIFY] transformedImage is URL?', this.transformedImage?.startsWith('http'));
      console.log('🛒 [CUSTOMIFY] transformedImage preview:', this.transformedImage?.substring(0, 200));
      
      // Stwórz nowy produkt z obrazkiem AI jako głównym obrazem
      // ✅ DODANO: Timeout i retry logic dla network errors
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 sekund timeout
      
      const response = await fetch('https://customify-s56o.vercel.app/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log('🛒 [CUSTOMIFY] API response status:', response.status);
      const result = await response.json();
      console.log('🛒 [CUSTOMIFY] API response:', result);

      if (result.success) {
        this.showSuccess('✅ ' + (result.message || 'Produkt został utworzony!'));
        console.log('✅ [CUSTOMIFY] Product created:', result.product);
        
        // Obraz AI jest już głównym obrazem produktu
        
        if (result.variantId) {
          console.log('🛒 [CUSTOMIFY] Attempting to add to cart with Variant ID:', result.variantId);
          console.log('🛒 [CUSTOMIFY] Product ID:', result.productId);
          console.log('🛒 [CUSTOMIFY] Variant ID type:', typeof result.variantId);
          console.log('🛒 [CUSTOMIFY] Variant ID length:', result.variantId.toString().length);
          
          // Tytuł z wszystkimi parametrami (ramka, podstawka)
          const selectedFrame = ((this.selectedProductType === 'plakat' || this.selectedProductType === 'canvas') && window.CustomifyFrame && window.CustomifyFrame.color)
            ? window.CustomifyFrame.color : 'none';
          const selectedStand = (this.selectedProductType === 'szklo' && window.CustomifyStand && window.CustomifyStand.type)
            ? window.CustomifyStand.type : 'none';
          const frameLabelMap = { none: null, black: 'czarnej', white: 'białej', wood: 'drewnianej' };
          const frameLabel = frameLabelMap[(selectedFrame || 'none').toLowerCase()] || null;
          const standLabelMap = { none: null, wood: 'drewnianej', led: 'LED' };
          const standLabelForTitle = standLabelMap[(selectedStand || 'none').toLowerCase()] || null;
          let productTypeName;
          if (this.isPhonePhotoCaseProduct && this.isPhonePhotoCaseProduct()) {
            productTypeName = PRODUCT_TYPE_LABELS.etui;
          } else if (this.selectedProductType === 'szklo') {
            productTypeName = standLabelForTitle ? `Wydruk na szkle na podstawce ${standLabelForTitle}` : 'Wydruk na szkle';
          } else if (this.selectedProductType === 'plakat' || this.selectedProductType === 'canvas') {
            const base = this.selectedProductType === 'plakat' ? 'Plakat' : 'Obraz na płótnie (canvas)';
            productTypeName = frameLabel ? `${base} w ${frameLabel} ramce za szkłem` : base;
          } else {
            productTypeName = PRODUCT_TYPE_LABELS[this.selectedProductType] || PRODUCT_TYPE_LABELS.canvas;
          }
          const standLabelForRamka = { none: 'brak', wood: 'podstawka drewniana', led: 'podstawka drewniana z LED' }[(selectedStand || 'none').toLowerCase()] || 'brak';
          const frameLabelForRamka = { none: 'brak', black: 'czarna', white: 'biała', wood: 'drewno' }[(selectedFrame || 'none').toLowerCase()] || 'brak';
          
          const shortOrderId = result.shortOrderId || (result.orderId ? result.orderId.split('-').pop() : Date.now().toString());
          
          const spotifyTitle = (this.spotifyTitleInput?.value || '').trim().slice(0, 60);
          const spotifyArtist = (this.spotifyArtistInput?.value || '').trim().slice(0, 60);

          const properties = {
            'Rozmiar': this.getSizeDimension(this.selectedSize),
            'Rodzaj wydruku': productTypeName,
            'Ramka': this.selectedProductType === 'szklo' ? `podstawka - ${standLabelForRamka}` : `ramka - ${frameLabelForRamka}`
          };
          if (this.isSpotifyProduct()) {
            if (spotifyTitle) properties['Tytuł utworu'] = spotifyTitle;
            if (spotifyArtist) properties['Artysta'] = spotifyArtist;
          }
          if (textOverlayPayload?.text) {
            properties['Napis na obrazie'] = textOverlayPayload.text;
          }
          if (this.isPhonePhotoCaseProduct()) {
            const brandLabel = this.getPhoneBrandLabel();
            const modelLabel = this.getPhoneModelLabel();
            if (brandLabel) properties['Marka'] = brandLabel;
            if (modelLabel) properties['Model'] = modelLabel;
          }
          
          const noteAttributes = {};
          
          // ✅ Dodaj tylko techniczne informacje dla admina (bez "Styl AI" - nie pokazywane w koszyku)
          if (result.orderId) {
            noteAttributes['Order ID Full'] = result.orderId;
          }
          if (result.imageUrl) {
            noteAttributes['AI Image URL'] = result.imageUrl;
          }
          if (result.permanentImageUrl) {
            noteAttributes['AI Image Backup'] = result.permanentImageUrl;
          }
          if (result.vercelBlobUrl) {
            noteAttributes['AI Image Vercel'] = result.vercelBlobUrl;
          }
          if (textOverlayPayload) {
            noteAttributes['AI Text Overlay'] = JSON.stringify(textOverlayPayload);
          }
          
          console.log('🛒 [CUSTOMIFY CART PROPERTIES VISIBLE]:', properties);
          console.log('📝 [CUSTOMIFY NOTE ATTRIBUTES]:', noteAttributes);
          
          console.log('🖼️ [CUSTOMIFY] Image URLs:', {
            shopifyImageUrl: result.imageUrl,
            permanentImageUrl: result.permanentImageUrl,
            replicateImageUrl: this.transformedImage,
            orderId: result.orderId
          });
          
          // Buduj URL z parametrami
          const params = new URLSearchParams();
          params.append('id', result.variantId);
          params.append('quantity', '1');
          
          // Dodaj właściwości (tylko widoczne dla klienta)
          Object.entries(properties).forEach(([key, value]) => {
            params.append(`properties[${key}]`, value);
          });
          
          const cartUrl = `/cart/add?${params.toString()}`;
          const fullUrl = window.location.origin + cartUrl;
          console.log('🛒 [CUSTOMIFY] Cart URL length:', cartUrl.length, 'chars');
          console.log('🛒 [CUSTOMIFY] Cart URL:', cartUrl.substring(0, 200), '...');
          console.log('🛒 [CUSTOMIFY] Full URL length:', fullUrl.length, 'chars');
          
          // ❌ PROBLEM: URL > 2048 znaków może być zablokowany przez przeglądarkę
          if (fullUrl.length > 2048) {
            console.error('❌ [CUSTOMIFY] URL TOO LONG:', fullUrl.length, 'chars (max 2048)');
            console.error('❌ [CUSTOMIFY] Properties:', properties);
            this.showError('URL zbyt długi - usuń niektóre właściwości lub skontaktuj się z supportem', 'cart');
            return;
          }
          
    // ✅ ZAPISZ NOTE ATTRIBUTES (linki dla admina)
    if (Object.keys(noteAttributes).length > 0) {
      try {
        await this.updateCartNoteAttributes(noteAttributes);
        console.log('✅ [CUSTOMIFY] Note attributes updated successfully');
      } catch (error) {
        console.error('⚠️ [CUSTOMIFY] Failed to update cart note attributes:', error);
      }
    }
    
    // ✅ DODAJ DO KOSZYKA PRZEZ DIRECT NAVIGATION (jak w rules)
    console.log('✅ [CUSTOMIFY] Adding to cart via direct navigation');
    
    // Ukryj pasek postępu
    this.hideCartLoading();
    
    // Przekieruj bezpośrednio do koszyka (zamiast fetch)
    // ✅ DODANO: Małe opóźnienie dla pewności zapisu atrybutów
    setTimeout(() => {
      window.location.href = cartUrl;
    }, 300);
        }
      } else {
        console.error('❌ [CUSTOMIFY] Product creation failed:', result);
        this.hideCartLoading();
        this.showError('❌ Błąd podczas tworzenia produktu: ' + (result.error || 'Nieznany błąd'), 'cart');
      }
    } catch (error) {
      console.error('❌ [CUSTOMIFY] Add to cart error:', error);
      
      // ✅ RETRY LOGIC: Ponów próbę dla network errors (max 3 próby)
      if (retryCount < 3 && (
        error.name === 'AbortError' || 
        (error?.message && error.message.includes('Failed to fetch')) || 
        (error?.message && error.message.includes('NetworkError')) ||
        (error?.message && error.message.includes('Load failed'))
      )) {
        const retryDelay = (retryCount + 1) * 2000; // 2s, 4s, 6s
        console.log(`🔄 [CUSTOMIFY] Retrying addToCart in ${retryDelay}ms... (attempt ${retryCount + 1}/3)`);
        this.showError(`🔄 Błąd sieci - ponawiam próbę ${retryCount + 1}/3...`, 'cart');
        
        setTimeout(() => {
          this.addToCart(retryCount + 1);
        }, retryDelay);
        return;
      }
      
      this.hideCartLoading();
      
      let errorMessage = '❌ Błąd połączenia z serwerem';
      
      if (error.name === 'AbortError') {
        errorMessage = '❌ Przekroczono limit czasu (30 sekund). Spróbuj ponownie.';
      } else if (error?.message && error.message.includes('Failed to fetch')) {
        errorMessage = '❌ Błąd sieci. Sprawdź połączenie internetowe i spróbuj ponownie.';
      } else if (error?.message && (error.message.includes('NetworkError') || error.message.includes('Load failed'))) {
        errorMessage = '❌ Błąd sieci. Spróbuj ponownie za chwilę.';
      } else if (error?.message) {
        errorMessage = '❌ Błąd: ' + error.message;
      } else if (typeof error === 'string') {
        errorMessage = '❌ Błąd: ' + error;
      }
      
      this.showError(errorMessage, 'cart');
    }
  }

  async updateCartNoteAttributes(noteAttributes) {
    if (!noteAttributes || Object.keys(noteAttributes).length === 0) {
      return;
    }

    console.log('📝 [CUSTOMIFY] Updating cart note attributes:', noteAttributes);

    const payload = {
      attributes: noteAttributes
    };

    const response = await fetch('/cart/update.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cart note update failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ [CUSTOMIFY] Cart attributes saved:', data.attributes || data);
    return data;
  }

  // UKRYJ PRODUKT PO DODANIU DO KOSZYKA
  async hideProductAfterCartAdd(productId) {
    if (!productId) {
      console.log('⚠️ [CUSTOMIFY] No product ID to hide');
      return;
    }

    try {
      console.log('🔒 [CUSTOMIFY] Hiding product after cart add:', productId);
      
      const response = await fetch('https://customify-s56o.vercel.app/api/hide-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: productId })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [CUSTOMIFY] Product hidden successfully:', result);
      } else {
        console.error('❌ [CUSTOMIFY] Failed to hide product:', response.status);
      }
    } catch (error) {
      console.error('❌ [CUSTOMIFY] Error hiding product:', error);
    }
  }

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      console.log('📱 [MOBILE] Converting file to base64...');
      console.log('📱 [MOBILE] File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // ZAWSZE kompresuj na frontend (optymalizacja dla Nano Banana)
      console.log('📱 [MOBILE] Compressing image for Nano Banana optimization...');
      this.compressImage(file).then(compressedFile => {
        this.convertToBase64(compressedFile, resolve, reject);
      }).catch(error => {
        console.error('📱 [MOBILE] Compression failed:', error);
        reject(error);
      });
    });
  }

  convertToBase64(file, resolve, reject) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(',')[1];
      console.log('📱 [MOBILE] Base64 conversion successful:', {
        fullResultLength: result.length,
        base64Length: base64.length,
        preview: base64.substring(0, 50) + '...'
      });
      resolve(base64);
    };
    reader.onerror = error => {
      console.error('📱 [MOBILE] Base64 conversion failed:', error);
      reject(error);
    };
  }

  compressImage(file) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Oblicz nowe wymiary (max 1024px - dłuższy bok, optymalne dla Nano Banana)
        const maxSize = 1024;
        let { width, height } = img;
        
        // Znajdź dłuższy bok i przeskaluj zachowując proporcje
        const longerSide = Math.max(width, height);
        
        if (longerSide > maxSize) {
          const scale = maxSize / longerSide;
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Narysuj skompresowany obraz
        ctx.drawImage(img, 0, 0, width, height);
        
        // Konwertuj do blob z kompresją
        canvas.toBlob(blob => {
          console.log('📱 [MOBILE] Image compressed:', {
            originalSize: file.size,
            compressedSize: blob.size,
            compressionRatio: ((1 - blob.size / file.size) * 100).toFixed(1) + '%',
            dimensions: `${width}x${height}`,
            maxSize: maxSize
          });
          resolve(blob);
        }, 'image/jpeg', 0.85); // 85% jakość (optymalne dla Nano Banana)
      };
      
      img.onerror = error => {
        console.error('📱 [MOBILE] Image load failed:', error);
        reject(error);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  reset() {
    this.uploadedFile = null;
    this.selectedStyle = null;
    this.selectedSize = null;
    this.transformedImage = null;
    this.textOverlayBaseImage = null;
    this.textOverlayWatermarkedUrl = null;
    this.textOverlayOriginalWatermarked = null;
    this.textOverlayState = { ...this.textOverlayState, text: '', applied: false };
    this.spotifyCropConfirmed = false;
    this.closeSpotifyCropper();
    this.phoneCropConfirmed = false;
    this.closePhoneCropper();
    this.phonePhotoCropConfirmed = false;
    this.closePhonePhotoCropper();
    if (this.textOverlayInput) {
      this.textOverlayInput.value = '';
      this.updateTextOverlayCounter();
    }
    if (this.textOverlayPanel) {
      this.textOverlayPanel.style.display = this.textOverlayEnabled ? 'none' : 'none';
    }
    if (this.spotifyFieldsPanel) {
      this.spotifyFieldsPanel.style.display = 'none';
    }
    
    this.fileInput.value = '';
    this.uploadArea.style.display = 'block'; // Pokaż pole upload z powrotem
    this.previewArea.style.display = 'none';
    this.stylesArea.style.display = 'none';
    
    // 📱 Phone case: Hide cart buttons in previewArea
    if (this.isPhonePhotoCaseProduct && this.isPhonePhotoCaseProduct()) {
      const phoneCaseCartActions = document.getElementById('phoneCaseCartActions');
      const phoneCaseCartPriceDisplay = document.getElementById('phoneCaseCartPriceDisplay');
      if (phoneCaseCartActions) {
        phoneCaseCartActions.style.display = 'none';
      }
      if (phoneCaseCartPriceDisplay) {
        phoneCaseCartPriceDisplay.style.display = 'none';
      }
    }
    
    // Usuń klasę has-result żeby previewArea mogło być widoczne po wgraniu nowego zdjęcia
    const container = document.getElementById('customify-app-container');
    if (container) {
      container.classList.remove('has-result');
    }
    this.sizeArea.style.display = 'block'; // ✅ ZAWSZE WIDOCZNE - nie ukrywaj rozmiarów
    this.actionsArea.style.display = 'none';
    this.resultArea.style.display = 'none';
    this.hideError();
    this.hideSuccess();
    
    this.stylesArea.querySelectorAll('.customify-style-card').forEach(card => card.classList.remove('active'));
    this.sizeArea.querySelectorAll('.customify-size-btn').forEach(btn => btn.classList.remove('active'));
    
    // Przywróć stan początkowy przycisków
    const addToCartBtnMain = document.getElementById('addToCartBtnMain');
    const resetBtn = document.getElementById('resetBtn');
    if (addToCartBtnMain) {
      addToCartBtnMain.style.display = 'inline-block';
    }
    if (resetBtn) {
      resetBtn.style.display = 'none';
    }
    
    // Przywróć kolory przycisków do stanu początkowego
    this.resetButtonColors();
  }

  tryAgain() {
    console.log('🔄 [CUSTOMIFY] tryAgain called - returning to style selection');
    
    // Ukryj wynik AI
    this.resultArea.style.display = 'none';
    
    // Pokaż style AI i przyciski (nie dla produktu bez AI)
    if (!this.isSpotifyNoAIProduct()) {
      if (this.isMultiUploadProduct()) {
        this.stylesArea.style.display = 'none';
        this.selectedStyle = 'dodaj-osobe';
      } else if (this.isDlaNiejProduct()) {
        this.stylesArea.style.display = 'none';
        this.selectedStyle = 'caricature-new';
      } else if (this.isSuperheroBoyProduct()) {
        this.stylesArea.style.display = 'none';
        this.selectedStyle = 'superhero_boy';
      } else if (this.isLoveRoseProduct()) {
        this.stylesArea.style.display = 'none';
        this.selectedStyle = 'love-rose';
      } else if (this.isRoyalLoveProduct()) {
        this.stylesArea.style.display = 'none';
        this.selectedStyle = 'royal-love';
      } else if (this.isGTAProduct()) {
        this.stylesArea.style.display = 'none';
        this.selectedStyle = 'gta';
      } else if (this.isRetuszStarychZdjecProduct()) {
        this.stylesArea.style.display = 'none';
        this.selectedStyle = 'retusz-starych-zdjec';
      } else {
        this.stylesArea.style.display = 'block';
      }
      this.actionsArea.style.display = 'flex';
    }
    
    // Pokaż pole upload (jeśli było ukryte)
    this.uploadArea.style.display = 'block';
    // 📸 Multi-upload: pokaż grid
    const multiUploadArea = document.getElementById('multiUploadArea');
    if (multiUploadArea && this.isMultiUploadProduct()) {
      multiUploadArea.style.display = 'block';
    }
    
    // 📱 Phone case: Hide cart buttons in previewArea
    if (this.isPhonePhotoCaseProduct && this.isPhonePhotoCaseProduct()) {
      const phoneCaseCartActions = document.getElementById('phoneCaseCartActions');
      const phoneCaseCartPriceDisplay = document.getElementById('phoneCaseCartPriceDisplay');
      if (phoneCaseCartActions) {
        phoneCaseCartActions.style.display = 'none';
      }
      if (phoneCaseCartPriceDisplay) {
        phoneCaseCartPriceDisplay.style.display = 'none';
      }
    }
    
    // Zresetuj wybrane style i rozmiary
    this.selectedStyle = this.isMultiUploadProduct() ? 'dodaj-osobe' : (this.isDlaNiejProduct() ? 'caricature-new' : (this.isSuperheroBoyProduct() ? 'superhero_boy' : (this.isLoveRoseProduct() ? 'love-rose' : (this.isRoyalLoveProduct() ? 'royal-love' : (this.isGTAProduct() ? 'gta' : (this.isRetuszStarychZdjecProduct() ? 'retusz-starych-zdjec' : null))))));
    this.selectedSize = null;
    this.transformedImage = null;
    this.textOverlayBaseImage = null;
    this.textOverlayWatermarkedUrl = null;
    this.textOverlayOriginalWatermarked = null;
    this.textOverlayState = { ...this.textOverlayState, text: '', applied: false };
    this.spotifyCropConfirmed = false;
    this.closeSpotifyCropper();
    this.phoneCropConfirmed = false;
    this.closePhoneCropper();
    this.phonePhotoCropConfirmed = false;
    this.closePhonePhotoCropper();
    if (this.textOverlayInput) {
      this.textOverlayInput.value = '';
      this.updateTextOverlayCounter();
    }
    if (this.textOverlayPanel) {
      this.textOverlayPanel.style.display = this.textOverlayEnabled ? 'none' : 'none';
    }
    if (this.spotifyFieldsPanel) {
      this.spotifyFieldsPanel.style.display = 'none';
    }
    
    // Usuń aktywne style
    this.stylesArea.querySelectorAll('.customify-style-card').forEach(card => card.classList.remove('active'));
    
    // Usuń aktywne rozmiary
    this.sizeArea.querySelectorAll('.customify-size-btn').forEach(btn => btn.classList.remove('active'));
    
    // Ukryj wiadomości
    this.hideSuccess();
    this.hideError();
    
    console.log('🔄 [CUSTOMIFY] tryAgain completed - user can select new style');
  }

  showLoading() {
    this.loadingArea.style.display = 'block';
    this.actionsArea.style.display = 'none';
    
    // Animacja paska postępu z etapami
    const progressBar = document.getElementById('progressBar');
    const loadingStage = document.getElementById('loadingStage');
    
    if (progressBar && loadingStage) {
      let progress = 0;
      const stages = [
        { percent: 20, text: 'Przesyłanie zdjęcia...' },
        { percent: 40, text: 'Przygotowywanie AI...' },
        { percent: 60, text: 'Generowanie obrazu...' },
        { percent: 80, text: 'Finalizowanie...' },
        { percent: 95, text: 'Prawie gotowe...' }
      ];
      
      let currentStage = 0;
      progressBar.style.width = '0%';
      loadingStage.textContent = stages[0].text;
      
      this.progressInterval = setInterval(() => {
        if (currentStage < stages.length) {
          const targetPercent = stages[currentStage].percent;
          if (progress < targetPercent) {
            progress += 1;
            progressBar.style.width = progress + '%';
          } else {
            loadingStage.textContent = stages[currentStage].text;
            currentStage++;
          }
        }
      }, 100); // Aktualizacja co 100ms
    }
  }

  hideLoading() {
    // Zatrzymaj animację paska postępu
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    
    // Ustaw pasek na 100% przed ukryciem
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
      progressBar.style.width = '100%';
    }
    
    this.loadingArea.style.display = 'none';
    // NIE pokazuj actionsArea jeśli mamy już wynik AI
    console.log('🎯 [CUSTOMIFY] hideLoading called, transformedImage:', !!this.transformedImage);
    if (!this.transformedImage) {
      this.actionsArea.style.display = 'flex';
      console.log('🎯 [CUSTOMIFY] actionsArea shown because no transformedImage');
    } else {
      console.log('🎯 [CUSTOMIFY] actionsArea NOT shown because transformedImage exists');
    }
  }

  showCartLoading() {
    const cartLoadingArea = document.getElementById('cartLoadingArea');
    if (cartLoadingArea) {
      cartLoadingArea.style.display = 'block';
      
      // Animacja paska postępu dla koszyka
      const progressBar = document.getElementById('cartProgressBar');
      const loadingStage = document.getElementById('cartLoadingStage');
      
      if (progressBar && loadingStage) {
        let progress = 0;
        const stages = [
          { percent: 25, text: 'Tworzenie produktu...' },
          { percent: 50, text: 'Przesyłanie obrazu...' },
          { percent: 75, text: 'Dodawanie do koszyka...' },
          { percent: 90, text: 'Finalizowanie...' }
        ];
        
        let currentStage = 0;
        progressBar.style.width = '0%';
        loadingStage.textContent = stages[0].text;
        
        this.cartProgressInterval = setInterval(() => {
          if (currentStage < stages.length) {
            const targetPercent = stages[currentStage].percent;
            if (progress < targetPercent) {
              progress += 1;
              progressBar.style.width = progress + '%';
            } else {
              loadingStage.textContent = stages[currentStage].text;
              currentStage++;
            }
          }
        }, 80); // Szybsza animacja dla koszyka
      }
    }
  }

  hideCartLoading() {
    const cartLoadingArea = document.getElementById('cartLoadingArea');
    if (cartLoadingArea) {
      // Zatrzymaj animację paska postępu
      if (this.cartProgressInterval) {
        clearInterval(this.cartProgressInterval);
        this.cartProgressInterval = null;
      }
      
      // Ustaw pasek na 100% przed ukryciem
      const progressBar = document.getElementById('cartProgressBar');
      if (progressBar) {
        progressBar.style.width = '100%';
      }
      
      cartLoadingArea.style.display = 'none';
    }
  }

  showError(message, location = 'top') {
    // Ukryj wszystkie komunikaty błędów najpierw
    if (this.errorMessage) {
      this.errorMessage.style.display = 'none';
    }
    if (this.errorMessageTransform) {
      this.errorMessageTransform.style.display = 'none';
    }
    if (this.errorMessageBottom) {
      this.errorMessageBottom.style.display = 'none';
    }
    const phoneCaseCartError = document.getElementById('phoneCaseCartError');
    if (phoneCaseCartError) {
      phoneCaseCartError.style.display = 'none';
    }
    
    // Pokaż błąd w odpowiednim miejscu
    if (location === 'transform' && this.errorMessageTransform) {
      // Błędy transformacji - nad przyciskiem "Zobacz Podgląd"
      this.errorMessageTransform.textContent = message;
      this.errorMessageTransform.style.display = 'block';
    } else if (location === 'cart') {
      // Błędy koszyka - nad przyciskiem "Dodaj do koszyka"
      // 📱 Etui: pokaż w errorMessageBottom (zaraz pod #cartPriceDisplay)
      if (this.errorMessageBottom) {
        this.errorMessageBottom.textContent = message;
        this.errorMessageBottom.style.display = 'block';
      }
    } else if (location === 'top' && this.errorMessage) {
      // Błędy uploadu/walidacji pliku - na górze
      this.errorMessage.textContent = message;
      this.errorMessage.style.display = 'block';
    } else {
      // Fallback: pokaż w górze jeśli nie określono lokalizacji
      if (this.errorMessage) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
      }
    }
  }

  showErrorWithHTML(message, location = 'top') {
    // Ukryj wszystkie komunikaty błędów najpierw
    if (this.errorMessage) {
      this.errorMessage.style.display = 'none';
    }
    if (this.errorMessageTransform) {
      this.errorMessageTransform.style.display = 'none';
    }
    if (this.errorMessageBottom) {
      this.errorMessageBottom.style.display = 'none';
    }
    const phoneCaseCartError = document.getElementById('phoneCaseCartError');
    if (phoneCaseCartError) {
      phoneCaseCartError.style.display = 'none';
    }
    
    // Pokaż błąd z HTML w odpowiednim miejscu
    if (location === 'transform' && this.errorMessageTransform) {
      // Błędy transformacji - nad przyciskiem "Zobacz Podgląd"
      this.errorMessageTransform.innerHTML = message;
      this.errorMessageTransform.style.display = 'block';
    } else if (location === 'cart') {
      // Błędy koszyka - nad przyciskiem "Dodaj do koszyka"
      // 📱 Etui: pokaż w errorMessageBottom (zaraz pod #cartPriceDisplay)
      if (this.errorMessageBottom) {
        this.errorMessageBottom.innerHTML = message;
        this.errorMessageBottom.style.display = 'block';
      }
    } else if (location === 'top' && this.errorMessage) {
      // Błędy uploadu/walidacji pliku - na górze
      this.errorMessage.innerHTML = message;
      this.errorMessage.style.display = 'block';
    } else {
      // Fallback: pokaż w górze jeśli nie określono lokalizacji
      if (this.errorMessage) {
        this.errorMessage.innerHTML = message;
        this.errorMessage.style.display = 'block';
      }
    }
  }

  hideError() {
    // Ukryj wszystkie komunikaty błędów
    if (this.errorMessage) {
      this.errorMessage.style.display = 'none';
    }
    if (this.errorMessageTransform) {
      this.errorMessageTransform.style.display = 'none';
    }
    if (this.errorMessageBottom) {
      this.errorMessageBottom.style.display = 'none';
    }
    const phoneCaseCartError = document.getElementById('phoneCaseCartError');
    if (phoneCaseCartError) {
      phoneCaseCartError.style.display = 'none';
    }
  }

  showSuccess(message, options = {}) {
    if (options.html) {
      this.successMessage.innerHTML = message;
    } else {
      this.successMessage.textContent = message;
    }
    this.successMessage.style.display = 'block';
  }

  hideSuccess() {
    this.successMessage.style.display = 'none';
  }

  // Zmień kolory przycisków po wygenerowaniu AI
  swapButtonColors() {
    const transformBtn = document.getElementById('transformBtn');
    const addToCartBtnMain = document.getElementById('addToCartBtnMain');
    
    if (transformBtn && addToCartBtnMain) {
      // Po AI: "Zobacz Podgląd" -> czarny, "Dodaj do koszyka" -> czerwony
      transformBtn.classList.remove('customify-btn-red');
      transformBtn.classList.add('customify-btn-primary');
      addToCartBtnMain.classList.remove('customify-btn-primary');
      addToCartBtnMain.classList.add('customify-btn-red');
      console.log('🔄 [CUSTOMIFY] Button colors swapped after AI generation');
    }
  }

  // Przywróć kolory przycisków do stanu początkowego
  resetButtonColors() {
    const transformBtn = document.getElementById('transformBtn');
    const addToCartBtnMain = document.getElementById('addToCartBtnMain');
    
    if (transformBtn && addToCartBtnMain) {
      // Na początku: "Zobacz Podgląd" -> czerwony, "Dodaj do koszyka" -> czarny
      transformBtn.classList.remove('customify-btn-primary');
      transformBtn.classList.add('customify-btn-red');
      addToCartBtnMain.classList.remove('customify-btn-red');
      addToCartBtnMain.classList.add('customify-btn-primary');
      console.log('🔄 [CUSTOMIFY] Button colors reset to initial state');
    }
  }
}

/**
 * CART - ukryj Order ID, Cena (w properties), sekcja ilości
 */
function hideCartOrderIdQuantityCena() {
  const items = document.querySelectorAll('.cart-item, .cart-items__row, tr[role="row"]');
  items.forEach(r => {
    r.querySelectorAll('.cart-items__properties dt').forEach(dt => {
      const t = (dt.textContent || '').trim().toLowerCase();
      const dd = dt.nextElementSibling;
      if ((t.includes('order id') || t === 'cena') && dd) {
        dt.style.display = dd.style.display = 'none';
      }
    });
    // Ukryj TYLKO kontrolki ilości (+/-, input), nie cały komponent – inaczej ukrywa się symbol Usuń
    const quantitySelectors = 'quantity-selector-component .quantity-minus, quantity-selector-component .quantity-plus, quantity-selector-component input, quantity-input .quantity-minus, quantity-input .quantity-plus, quantity-input input';
    r.querySelectorAll(quantitySelectors).forEach(x => { x.style.display = 'none'; });
    // Przycisk usuwania – pokaż (ZACHOWAJ ikonę kosza SVG! el.textContent usuwało ją)
    const removeSelectors = 'a[href*="quantity=0"], a[href*="cart/change"], .cart-item__remove, .line-item__remove, [data-cart-remove], button[aria-label*="Remove"], button[aria-label*="Usuń"]';
    r.querySelectorAll(removeSelectors).forEach(el => {
      el.style.display = '';
      el.style.visibility = 'visible';
      if (el.querySelector('svg')) {
        // Ma ikonę – zachowaj SVG, usuń resztę (np. "Remove"), dodaj "Usuń"
        const svg = el.querySelector('svg');
        el.innerHTML = '';
        el.appendChild(svg.cloneNode(true));
        const txt = document.createElement('span');
        txt.className = 'customify-remove-text';
        txt.textContent = ' Usuń';
        el.appendChild(txt);
      } else {
        // Brak ikony – dodaj ikonę kosza + tekst
        const iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
        el.innerHTML = iconSvg + ' <span class="customify-remove-text">Usuń</span>';
      }
      el.setAttribute('aria-label', 'Usuń');
    });
    // Fallback: znajdź w komórce ilości cokolwiek z "Remove"
    r.querySelectorAll('td:nth-child(3) a, td:nth-child(3) button').forEach(el => {
      if ((el.textContent || '').trim().toLowerCase().includes('remove') || (el.getAttribute('aria-label') || '').toLowerCase().includes('remove')) {
        el.style.display = '';
        el.style.visibility = 'visible';
        if (el.querySelector('svg')) {
          const svg = el.querySelector('svg');
          el.innerHTML = '';
          el.appendChild(svg.cloneNode(true));
          const txt = document.createElement('span');
          txt.className = 'customify-remove-text';
          txt.textContent = ' Usuń';
          el.appendChild(txt);
        } else {
          const iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
          el.innerHTML = iconSvg + ' <span class="customify-remove-text">Usuń</span>';
        }
        el.setAttribute('aria-label', 'Usuń');
      }
    });
  });
  // Nagłówek kolumny – zmień na "Usuń" zamiast "Ilość"
  document.querySelectorAll('.cart-items th:nth-child(3)').forEach(h => {
    h.style.display = '';
    const t = (h.textContent || '').trim().toLowerCase();
    if (t.includes('ilość') || t.includes('quantity')) h.textContent = 'Usuń';
  });
}

/**
 * CART INTEGRATION - AI Image Display
 */
function initCartIntegration() {
  if (window.location.pathname.includes('/cart')) hideCartOrderIdQuantityCena();
  // Znajdź wszystkie elementy koszyka z AI obrazkami
  const cartItems = document.querySelectorAll('.cart-item, .cart-items__row');
  
  cartItems.forEach(item => {
    // Znajdź ukryte property z AI obrazkiem
    const aiImageProperty = item.querySelector('dd[data-property="_AI_Image_URL"], .cart-items__properties dd');
    
    if (aiImageProperty && aiImageProperty.textContent.includes('replicate.delivery')) {
      const imageUrl = aiImageProperty.textContent.trim();
      
      // Ukryj surowy URL
      const propertyDiv = aiImageProperty.closest('.cart-items__properties');
      if (propertyDiv) {
        propertyDiv.style.display = 'none';
      }
      
      // Dodaj miniaturkę
      const imageCell = item.querySelector('.cart-items__image, .cart-item__image-wrapper');
      if (imageCell && !imageCell.querySelector('.cart-item__ai-image')) {
        const aiImage = document.createElement('img');
        aiImage.src = imageUrl;
        aiImage.alt = 'AI Transformed Image';
        aiImage.className = 'cart-item__ai-image';
        aiImage.style.cssText = 'width: 80px; height: 80px; object-fit: cover; border-radius: 0; border: 2px solid #e0e0e0;';
        
        // Wstaw miniaturkę jako główny obrazek lub obok
        const existingImage = imageCell.querySelector('img');
        if (existingImage) {
          existingImage.replaceWith(aiImage);
        } else {
          imageCell.appendChild(aiImage);
        }
      }
    }
  });
}

/**
 * MOBILE THUMBNAILS - Dodaj miniaturki na mobile
 */
function addMobileThumbnails() {
  // Sprawdź czy jesteśmy na mobile
  if (window.innerWidth > 749) return;
  
  // Znajdź właściwy container - product information media (widoczny na mobile)
  const mediaContainer = document.querySelector('.product-information__media');
  if (!mediaContainer) {
    console.log('🎯 [CUSTOMIFY] Media container not found, skipping thumbnails');
    return;
  }
  
  // Sprawdź czy miniaturki już istnieją
  if (mediaContainer.querySelector('.customify-mobile-thumbnails')) return;
  
  // Znajdź wszystkie obrazy w kontenerze
  const productImages = mediaContainer.querySelectorAll('img');
  if (productImages.length < 2) return; // Potrzebujemy co najmniej 2 obrazy
  
  console.log('🎯 [CUSTOMIFY] Dodaję miniaturki na mobile, znaleziono', productImages.length, 'obrazów');
  
  // Stwórz container dla miniaturek
  const thumbnailsContainer = document.createElement('div');
  thumbnailsContainer.className = 'customify-mobile-thumbnails';
  thumbnailsContainer.style.cssText = `
    display: flex !important;
    gap: 8px !important;
    padding: 10px !important;
    justify-content: center !important;
    margin-top: 10px !important;
    flex-wrap: wrap !important;
    width: 100% !important;
  `;
  
  // Dodaj miniaturki (użyj pierwszych 3 obrazów - 0, 1, 2)
  for (let i = 0; i < Math.min(3, productImages.length); i++) {
    const img = productImages[i];
    const thumbnail = document.createElement('div');
    thumbnail.className = 'customify-mobile-thumbnail';
    thumbnail.style.cssText = `
      width: 60px !important;
      height: 60px !important;
      border-radius: 6px !important;
      border: 2px solid #e0e0e0 !important;
      cursor: pointer !important;
      transition: all 0.3s ease !important;
      overflow: hidden !important;
      flex-shrink: 0 !important;
    `;
    
    // Stwórz nowy obraz z tym samym src
    const thumbnailImg = document.createElement('img');
    thumbnailImg.src = img.src;
    thumbnailImg.alt = img.alt || 'Thumbnail';
    thumbnailImg.style.cssText = `
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      border-radius: 4px !important;
    `;
    
    thumbnail.appendChild(thumbnailImg);
    
    // Dodaj event listener do kliknięcia
    thumbnail.addEventListener('click', () => {
      // Znajdź odpowiedni przycisk nawigacji i kliknij go
      const navButtons = document.querySelectorAll('.slideshow-control');
      if (navButtons[i]) {
        navButtons[i].click();
        console.log('🎯 [CUSTOMIFY] Kliknięto miniaturkę', i);
      }
    });
    
    // Hover effect
    thumbnail.addEventListener('mouseenter', () => {
      thumbnail.style.borderColor = '#dc3545';
      thumbnail.style.transform = 'scale(1.05)';
    });
    
    thumbnail.addEventListener('mouseleave', () => {
      thumbnail.style.borderColor = '#e0e0e0';
      thumbnail.style.transform = 'scale(1)';
    });
    
    thumbnailsContainer.appendChild(thumbnail);
  }
  
  // Dodaj container do media container
  mediaContainer.appendChild(thumbnailsContainer);
  console.log('✅ [CUSTOMIFY] Miniaturki na mobile dodane pomyślnie');
}

/**
 * INITIALIZATION
 */
document.addEventListener('DOMContentLoaded', () => {
  // Simple-product: nie uruchamiaj Customify w ogóle (strona ma tylko przycisk Kup → koszyk)
  const p = window.ShopifyProduct;
  if (p && p.tags) {
    const tags = Array.isArray(p.tags) ? p.tags : String(p.tags).split(',');
    if (tags.some(t => String(t).toLowerCase().trim() === 'simple-product')) {
      return;
    }
  }

  // Initialize Customify app
  const customifyApp = new CustomifyEmbed();
  
  // ✅ AUTO-LOAD: Sprawdź czy user wybrał generację na stronie "Moje generacje"
  try {
    const selectedData = localStorage.getItem('customify_selected_generation');
    if (selectedData) {
      const { index, generation } = JSON.parse(selectedData);
      console.log('🎯 [CUSTOMIFY] Auto-loading generation from "Moje generacje":', index, generation);
      
      // Załaduj generację używając reuseGeneration() (ta sama funkcja co kliknięcie w galerii)
      setTimeout(() => {
        // Sprawdź czy DOM jest gotowy (resultImage musi istnieć)
        const resultImage = document.getElementById('resultImage');
        if (!resultImage) {
          console.warn('⚠️ [CUSTOMIFY] resultImage not found, retrying in 1s...');
          setTimeout(() => {
            customifyApp.reuseGeneration(generation);
            console.log('✅ [CUSTOMIFY] Generation loaded from "Moje generacje" (retry), ready for checkout');
          }, 1000);
          return;
        }
        
        customifyApp.reuseGeneration(generation);
        console.log('✅ [CUSTOMIFY] Generation loaded from "Moje generacje", ready for checkout');
        
        // Scroll do wyniku żeby user widział co się załadowało
        const resultArea = document.getElementById('resultArea');
        if (resultArea) {
          resultArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 2000); // 2s delay żeby DOM się załadował + galeria się zbudowała
      
      // Wyczyść po użyciu
      localStorage.removeItem('customify_selected_generation');
    }
  } catch (error) {
    console.error('❌ [CUSTOMIFY] Error loading selected generation:', error);
  }
  
  // Initialize cart integration
  initCartIntegration();
  
  // Add mobile thumbnails - WYŁĄCZONE (miniaturki są obsługiwane przez theme.liquid)
  // addMobileThumbnails();
  
  // Re-add thumbnails on resize - WYŁĄCZONE
  // window.addEventListener('resize', () => {
  //   addMobileThumbnails();
  // });
  
  // Clean up dividers and spacing
  window.addEventListener('load', () => {
    setTimeout(() => {
      // Add mobile thumbnails after load - WYŁĄCZONE
      // addMobileThumbnails();
      // USUŃ DIVIDERY FIZYCZNIE Z DOM
      const dividers = document.querySelectorAll('.divider, .divider__line, .divider-AM3M2YnhsTllLTUtCS__divider_VJhene');
      dividers.forEach(divider => {
        if (divider && divider.parentNode) {
          divider.parentNode.removeChild(divider);
          console.log('🎯 [CUSTOMIFY] Divider usunięty z DOM');
        }
      });

      // AGRESYWNE USUNIĘCIE ODSTĘPÓW MIĘDZY TYTUŁEM A BADGE'AMI
      const titleElement = document.querySelector('.view-product-title');
      const badgesElement = document.querySelector('.product-badges');
      
      if (titleElement) {
        titleElement.style.setProperty('margin-bottom', '0px', 'important');
        titleElement.style.setProperty('padding-bottom', '0px', 'important');
        titleElement.style.setProperty('margin', '0 0 0px 0', 'important');
        console.log('🎯 [CUSTOMIFY] Odstępy tytułu usunięte (inline)');
      }
      
      if (badgesElement) {
        badgesElement.style.setProperty('margin', '0 0 24px 0', 'important');
        badgesElement.style.setProperty('padding', '0', 'important');
        badgesElement.style.setProperty('gap', '8px', 'important');
        badgesElement.style.setProperty('display', 'block', 'important');
        console.log('🎯 [CUSTOMIFY] Odstęp badge\'ów ustawiony: 16px');
      }

      // DODATKOWE FORCE HIDE DIVIDERS - INLINE STYLES
      const allDividers = document.querySelectorAll('.divider, .divider__line, .divider-AM3M2YnhsTllLTUtCS__divider_VJhene');
      allDividers.forEach(divider => {
        divider.style.setProperty('display', 'none', 'important');
        divider.style.setProperty('visibility', 'hidden', 'important');
        divider.style.setProperty('opacity', '0', 'important');
        divider.style.setProperty('height', '0', 'important');
        divider.style.setProperty('margin', '0', 'important');
        divider.style.setProperty('padding', '0', 'important');
        divider.style.setProperty('border', 'none', 'important');
        console.log('🎯 [CUSTOMIFY] Divider ukryty (inline styles)');
      });
    }, 1000); // Zwiększ opóźnienie do 1 sekundy
  });
});

// FUNKCJA NAPRAWY POWIĘKSZONYCH ZDJĘĆ W DIALOGU - UNIWERSALNA
function fixDialogImages() {
  const dialog = document.querySelector('dialog[open]');
  if (!dialog) return;
  
  // Znajdź wszystkie zdjęcia w dialogu
  const allImages = dialog.querySelectorAll('img');
  let largestImg = null;
  let largestWidth = 0;
  
  allImages.forEach(img => {
    const width = img.clientWidth;
    if (width > largestWidth) {
      largestWidth = width;
      largestImg = img;
    }
  });
  
  if (!largestImg) return;
  
  // Wymuś poprawne style - WYPEŁNIA CAŁY KONTENER
  largestImg.style.setProperty('object-fit', 'cover', 'important');
  largestImg.style.setProperty('max-height', 'none', 'important');
  largestImg.style.setProperty('height', '100%', 'important');
  largestImg.style.setProperty('width', '100%', 'important');
  largestImg.style.setProperty('object-position', 'center', 'important');
  
  // Styluj kontener
  if (largestImg.parentElement) {
    largestImg.parentElement.style.setProperty('height', '100%', 'important');
  }
  
  console.log('✅ Zdjęcie w dialogu naprawione - brak białych pól!');
}

// Event listener dla kliknięć w przyciski powiększenia
document.addEventListener('click', function(e) {
  const zoomButton = e.target.closest('.product-media-container__zoom-button, button[class*="zoom"]');
  if (zoomButton) {
    setTimeout(fixDialogImages, 100);  // Czekaj aż dialog się otworzy
    setTimeout(fixDialogImages, 300);  // Ponownie po załadowaniu
    setTimeout(fixDialogImages, 600);  // I jeszcze raz dla pewności
  }
});

// Regularnie sprawdzaj czy dialog jest otwarty i naprawiaj
setInterval(fixDialogImages, 300);



// ====================================================
// DYNAMICZNE PRZENOSZENIE SEKCJI RODZAJU I ROZMIARU
// ====================================================
 document.addEventListener('DOMContentLoaded', function() {
 var resultArea = document.getElementById('resultArea');
 var inlineSlot = document.getElementById('type-size-inline-slot');
 var originalPlaceholder = document.getElementById('type-size-original-placeholder');
 var productTypeArea = document.getElementById('productTypeArea');
 var sizeArea = document.getElementById('sizeArea');
 // Elemente ramki
 var frameSelector = document.getElementById('frameSelector');
 var frameToggle = document.getElementById('frameToggle');
 var frameOptions = document.getElementById('frameOptions');
 var frameCurrentLabel = document.getElementById('frameCurrentLabel');

 if (!resultArea || !inlineSlot || !originalPlaceholder || !productTypeArea || !sizeArea) {
 return;
 }

 function isVisible(el) {
 if (!el) return false;
 var style = window.getComputedStyle(el);
 return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
 }

 function moveToResult() {
 if (!inlineSlot.contains(productTypeArea)) {
 inlineSlot.appendChild(productTypeArea);
 }
 if (!inlineSlot.contains(sizeArea)) {
 inlineSlot.appendChild(sizeArea);
 }
 }

 function moveBack() {
 if (productTypeArea && productTypeArea.parentElement !== originalPlaceholder.parentElement) {
 originalPlaceholder.parentNode.insertBefore(productTypeArea, originalPlaceholder);
 }
 if (sizeArea && sizeArea.parentElement !== originalPlaceholder.parentElement) {
 originalPlaceholder.parentNode.insertBefore(sizeArea, originalPlaceholder);
 }
 }

 function syncPosition() {
 // 🎵 SPOTIFY: Nie przenoś elementów gdy "bez-zmian" jest aktywny
 if (window.spotifyBezZmianActive) {
 return;
 }
 if (isVisible(resultArea)) {
 moveToResult();
 } else {
 moveBack();
 }
 }

 // Obserwuj zmiany widoczności
 var observer = new MutationObserver(syncPosition);
 observer.observe(resultArea, { attributes: true, attributeFilter: ['style', 'class'], subtree: false });

 // Polling jako fallback (np. zmiany przez skrypty zewnętrzne)
 setInterval(syncPosition, 500);

 // Pierwsza synchronizacja
 syncPosition();

 // ============ LOGIKA RAMKI ============
 // Stan globalny (współdzielony między lokalizacjami)
 window.CustomifyFrame = window.CustomifyFrame || { color: 'none' };

 function setFrame(color) {
 window.CustomifyFrame.color = color;
 // Aktualizuj UI
 if (frameCurrentLabel) {
 frameCurrentLabel.textContent =
 color === 'black' ? 'Czarna' :
 color === 'white' ? 'Biała' :
 color === 'wood' ? 'Drewno' : 'Brak ramki';
 }
 if (frameOptions) {
 var opts = frameOptions.querySelectorAll('.frame-option');
 opts.forEach(function(opt){
 opt.setAttribute('aria-selected', opt.getAttribute('data-frame') === color ? 'true' : 'false');
 });
 }
 }

 function toggleOptions() {
 if (!frameOptions) return;
 var isOpen = frameOptions.style.display !== 'none';
 frameOptions.style.display = isOpen ? 'none' : 'block';
 if (frameSelector) frameSelector.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
 }

 function closeOptions() {
 if (frameOptions) {
 frameOptions.style.display = 'none';
 if (frameSelector) frameSelector.setAttribute('aria-expanded', 'false');
 }
 }

 function isPlakatSelected() {
 var active = productTypeArea && productTypeArea.querySelector('.customify-product-type-btn.active');
 return active && active.getAttribute('data-product-type') === 'plakat';
 }

 // 🚨 ROLLBACK: START - Funkcje dla produktu cyfrowego
 function isDigitalProductSelected() {
 var active = productTypeArea && productTypeArea.querySelector('.customify-product-type-btn.active');
 return active && active.getAttribute('data-product-type') === 'digital';
 }

 function updateDigitalProductUI() {
 var isDigital = isDigitalProductSelected();
 var sizeArea = document.getElementById('sizeArea');
 
 // Ukryj/pokaż rozmiary
 if (sizeArea) {
 if (isDigital) {
 sizeArea.style.display = 'none';
 console.log('📦 [DIGITAL] Size area hidden for digital product');
 } else {
 sizeArea.style.display = 'block';
 console.log('📦 [DIGITAL] Size area shown for physical product');
 }
 }
 }
 // 🚨 ROLLBACK: END - Funkcje dla produktu cyfrowego

 function updateFrameAvailability() {
 var enabled = isPlakatSelected();
 // 🚨 ROLLBACK: START - Ukryj ramkę dla produktu cyfrowego
 var isDigital = isDigitalProductSelected();
 if (isDigital) {
 enabled = false; // Produkt cyfrowy nie ma ramki
 }
 // 🚨 ROLLBACK: END - Ukryj ramkę dla produktu cyfrowego
 
 if (frameSelector) {
 if (enabled) {
 frameSelector.style.display = 'block'; // ✅ Pokazuje ramkę
 frameSelector.classList.remove('disabled');
 } else {
 frameSelector.style.display = 'none'; // ✅ Całkowicie ukrywa ramkę
 frameSelector.classList.add('disabled');
 closeOptions();
 }
 }
 }

 // ============ 🆕 LOGIKA PODSTAWKI (SZKŁO) ============
 window.CustomifyStand = window.CustomifyStand || { type: 'none' };
 
 var standSelector = document.getElementById('standSelector');
 var standToggle = document.getElementById('standToggle');
 var standOptions = document.getElementById('standOptions');
 var standCurrentLabel = document.getElementById('standCurrentLabel');
 
 function isSzkloSelected() {
 var active = productTypeArea && productTypeArea.querySelector('.customify-product-type-btn.active');
 return active && active.getAttribute('data-product-type') === 'szklo';
 }
 
 function setStand(type) {
 window.CustomifyStand.type = type;
 // Aktualizuj UI
 if (standCurrentLabel) {
 standCurrentLabel.textContent =
 type === 'wood' ? 'Podstawka drewniana (+29 zł)' :
 type === 'led' ? 'Podstawka drewniana z LED (+44.90 zł)' :
 'Brak podstawki';
 }
 if (standOptions) {
 var opts = standOptions.querySelectorAll('.stand-option');
 opts.forEach(function(opt){
 opt.setAttribute('aria-selected', opt.getAttribute('data-stand') === type ? 'true' : 'false');
 });
 }
 
 // Aktualizuj ceny po zmianie podstawki
 if (window.__customify) {
 window.__customify.updateProductPrice();
 window.__customify.updateCartPrice();
 }
 }
 
 function toggleStandOptions() {
 if (!standOptions) return;
 var isOpen = standOptions.style.display !== 'none';
 standOptions.style.display = isOpen ? 'none' : 'block';
 if (standSelector) standSelector.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
 }
 
 function closeStandOptions() {
 if (standOptions) {
 standOptions.style.display = 'none';
 if (standSelector) standSelector.setAttribute('aria-expanded', 'false');
 }
 }
 
 function updateStandAvailability() {
 var enabled = isSzkloSelected();
 
 if (standSelector) {
 if (enabled) {
 standSelector.style.display = 'block';
 standSelector.classList.remove('disabled');
 } else {
 standSelector.style.display = 'none';
 standSelector.classList.add('disabled');
 closeStandOptions();
 }
 }
 }
 
 function updateSizeAvailability() {
 var isSzklo = isSzkloSelected();
 var sizeButtons = document.querySelectorAll('.customify-size-btn');
 
 sizeButtons.forEach(function(btn) {
 var size = btn.getAttribute('data-size');
 if (isSzklo) {
 // Dla szkła: tylko A5 i A4 widoczne
 if (size === 'a5' || size === 'a4') {
 btn.style.display = 'block';
 } else {
 btn.style.display = 'none';
 }
 } else {
 // Dla plakat/canvas: A4, A3, A2, A0, A1 widoczne (bez A5)
 if (size === 'a5') {
 btn.style.display = 'none';
 } else {
 btn.style.display = 'block';
 }
 }
 });
 
 // Jeśli aktualnie wybrany rozmiar jest ukryty, wybierz pierwszy widoczny
 if (window.__customify && window.__customify.selectedSize) {
 var currentBtn = document.querySelector('.customify-size-btn[data-size="' + window.__customify.selectedSize + '"]');
 if (currentBtn && currentBtn.style.display === 'none') {
 // Wybierz pierwszy widoczny rozmiar
 var firstVisible = Array.from(sizeButtons).find(function(b) { return b.style.display !== 'none'; });
 if (firstVisible) {
 firstVisible.click();
 }
 }
 }
 }

 // Inicjalizacja UI ramki i podstawki
 setFrame(window.CustomifyFrame.color || 'none');
 setStand(window.CustomifyStand.type || 'none');
 updateFrameAvailability();
 updateStandAvailability();
 updateSizeAvailability();
 // 🚨 ROLLBACK: START - Inicjalizacja UI produktu cyfrowego
 updateDigitalProductUI();
 // 🚨 ROLLBACK: END - Inicjalizacja UI produktu cyfrowego

 // Zdarzenia UI
 if (frameToggle) {
 frameToggle.addEventListener('click', function(e){
 if (frameSelector && frameSelector.classList.contains('disabled')) return;
 toggleOptions();
 });
 }
 if (frameOptions) {
 frameOptions.addEventListener('click', function(e){
 var target = e.target.closest('.frame-option');
 if (!target) return;
 if (frameSelector && frameSelector.classList.contains('disabled')) return;
 var color = target.getAttribute('data-frame');
 setFrame(color);
 closeOptions();
 if (window.__customify && typeof window.__customify.updateCartPrice === 'function') {
 window.__customify.updateCartPrice();
 if (typeof window.__customify.updateProductPrice === 'function') {
 window.__customify.updateProductPrice();
 }
 }
 });
 }
 document.addEventListener('click', function(e){
 if (!frameSelector) return;
 if (!frameSelector.contains(e.target)) closeOptions();
 });
 
 // 🆕 Event listenery dla podstawki (szkło)
 if (standToggle) {
 standToggle.addEventListener('click', function(e){
 if (standSelector && standSelector.classList.contains('disabled')) return;
 toggleStandOptions();
 });
 }
 if (standOptions) {
 standOptions.addEventListener('click', function(e){
 var target = e.target.closest('.stand-option');
 if (!target) return;
 if (standSelector && standSelector.classList.contains('disabled')) return;
 var type = target.getAttribute('data-stand');
 setStand(type);
 closeStandOptions();
 });
 }
 document.addEventListener('click', function(e){
 if (!standSelector) return;
 if (!standSelector.contains(e.target)) closeStandOptions();
 });

 // Nasłuchiwanie na zmianę typu produktu (Plakat/Canvas/Szkło/Digital)
 var typeBtns = productTypeArea ? productTypeArea.querySelectorAll('.customify-product-type-btn') : [];
 typeBtns.forEach(function(btn){
 btn.addEventListener('click', function(){
 // Daj czas istniejącym handlerom na ustawienie .active
 setTimeout(function(){
 updateFrameAvailability();
 updateStandAvailability(); // 🆕 Aktualizuj dostępność podstawki
 updateSizeAvailability(); // 🆕 Aktualizuj widoczność rozmiarów
 // 🚨 ROLLBACK: START - Aktualizuj UI produktu cyfrowego
 updateDigitalProductUI();
 // 🚨 ROLLBACK: END - Aktualizuj UI produktu cyfrowego
 }, 0);
 });
 });
 
// 🆕 AUTO-INICJALIZACJA dla produktów ze szkłem
var currentUrl = window.location.pathname.toLowerCase();
var isSzkloProduct = currentUrl.includes('szkle') ||
currentUrl.includes('szklo') ||
currentUrl.includes('akryl') ||
currentUrl.includes('karykatura-dla-niej') ||
currentUrl.includes('salon-spa') ||
currentUrl.includes('nauczycielki-karykatura-na-prezent');
 
 if (isSzkloProduct) {
 console.log('🔍 [SZKLO] Produkt ze szkłem wykryty - automatyczne filtrowanie rozmiarów');
 // Ustaw szkło jako wybrany typ
 if (window.__customify) {
 window.__customify.selectedProductType = 'szklo';
 }
 // Wywoła updateSizeAvailability() żeby pokazać tylko A5 i A4
 updateStandAvailability();
 updateSizeAvailability();
 
 // 🆕 AUTO-ZAZNACZ ROZMIAR A5 jako domyślny dla szkła
 setTimeout(function() {
 var a5Btn = document.querySelector('.customify-size-btn[data-size="a5"]');
 var activeBtn = document.querySelector('.customify-size-btn.active');
 var activeSize = activeBtn ? activeBtn.getAttribute('data-size') : null;
 if (a5Btn && activeSize !== 'a5') {
 a5Btn.click();
 console.log('✅ [SZKLO] Automatycznie zaznaczono rozmiar A5');
 }
 }, 100);
 
 console.log('✅ [SZKLO] Automatycznie pokazano tylko rozmiary dla szkła (A5, A4)');
 }
 });

// ====================================================
// CART WATERMARK INTEGRATION
// ====================================================
 (function() {
 
 // Funkcja dodawania watermarku do obrazka
 async function addWatermarkToImage(imageUrl) {
 return new Promise((resolve, reject) => {
 const img = new Image();
 img.crossOrigin = 'anonymous';
 
 img.onload = () => {
 try {
 const canvas = document.createElement('canvas');
 const ctx = canvas.getContext('2d');
 
 canvas.width = img.width;
 canvas.height = img.height;
 
 // Rysuj oryginalny obraz
 ctx.drawImage(img, 0, 0);
 
 // ===== WZÓR DIAGONALNY - "Lumly.pl" i "Podgląd" NA PRZEMIAN =====
 ctx.save();
 
 // ✅ ZWIĘKSZONY FONT I OPACITY DLA LEPSZEJ WIDOCZNOŚCI
 const fontSize = Math.max(40, Math.min(canvas.width, canvas.height) * 0.08); // Min 40px, max 8% obrazu
 
 // ✅ FIX: Użyj systemowego fontu z fallbackami (Arial może nie być dostępny w Canvas)
 // Użyj fontu który ZAWSZE jest dostępny w przeglądarce
 const fontFamily = 'sans-serif'; // Systemowy font - zawsze dostępny
 ctx.font = `bold ${fontSize}px ${fontFamily}`;
 
 // ✅ SPRAWDŹ CZY FONT JEST ZAŁADOWANY (test renderowania)
 ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // ✅ ZWIĘKSZONA OPACITY (było 0.5)
 ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'; // ✅ ZWIĘKSZONA OPACITY (było 0.35)
 ctx.lineWidth = 2; // ✅ ZWIĘKSZONA GRUBOŚĆ (było 1.5)
 ctx.textAlign = 'center';
 ctx.textBaseline = 'middle';
 
 // ✅ TEST: Sprawdź czy tekst się renderuje (jeśli nie - użyj innego fontu)
 const testText = 'Test';
 const testMetrics = ctx.measureText(testText);
 if (testMetrics.width === 0) {
 console.warn('⚠️ [WATERMARK] Font test failed, using fallback');
 ctx.font = `bold ${fontSize}px monospace`; // Fallback na monospace
 }
 
 // Obróć canvas
 ctx.translate(canvas.width/2, canvas.height/2);
 ctx.rotate(-30 * Math.PI / 180);
 ctx.translate(-canvas.width/2, -canvas.height/2);
 
 // Rysuj watermarki w siatce - na przemian "Lumly.pl" i "Podgląd"
 const spacing = Math.max(200, Math.min(canvas.width, canvas.height) * 0.3); // ✅ DYNAMICZNY SPACING
 let textIndex = 0;
 const texts = ['Lumly.pl', 'Podgląd'];
 
 for(let y = -canvas.height; y < canvas.height * 2; y += spacing) {
 for(let x = -canvas.width; x < canvas.width * 2; x += spacing * 1.5) {
 const text = texts[textIndex % 2];
 // ✅ RYSUJ STROKE PRZED FILL (dla lepszej widoczności)
 ctx.strokeText(text, x, y);
 ctx.fillText(text, x, y);
 textIndex++;
 }
 // Zmień wzór co wiersz dla lepszego efektu
 textIndex++;
 }
 
 ctx.restore();
 
 // Zwróć obraz z watermarkiem jako Data URL
 resolve(canvas.toDataURL('image/jpeg', 0.92));
 console.log('✅ [CUSTOMIFY CART] Watermark dodany do miniaturki');
 } catch (error) {
 console.error('❌ [CUSTOMIFY CART] Watermark error:', error);
 reject(error);
 }
 };
 
 img.onerror = (error) => {
 console.error('❌ [CUSTOMIFY CART] Image load error:', error);
 reject(error);
 };
 
 img.src = imageUrl;
 });
 }
 
 function showImageLightbox(imageUrl) {
 console.log('🔍 [CUSTOMIFY CART] Pokazuję lightbox dla:', imageUrl);
 
 // Stwórz overlay
 const overlay = document.createElement('div');
 overlay.className = 'customify-lightbox';
 
 // Dodaj powiększony obraz
 const img = document.createElement('img');
 img.src = imageUrl;
 img.alt = 'Powiększony obraz AI';
 
 // Przycisk zamknięcia
 const closeBtn = document.createElement('button');
 closeBtn.className = 'customify-lightbox-close';
 closeBtn.innerHTML = '×';
 closeBtn.setAttribute('aria-label', 'Zamknij');
 
 overlay.appendChild(img);
 overlay.appendChild(closeBtn);
 
 // Zamknij po kliknięciu overlay lub przycisku
 overlay.addEventListener('click', (e) => {
 if (e.target === overlay || e.target === closeBtn) {
 overlay.remove();
 console.log('🔍 [CUSTOMIFY CART] Lightbox zamknięty');
 }
 });
 
 // Zamknij po ESC
 const handleEsc = (e) => {
 if (e.key === 'Escape') {
 overlay.remove();
 document.removeEventListener('keydown', handleEsc);
 console.log('🔍 [CUSTOMIFY CART] Lightbox zamknięty (ESC)');
 }
 };
 document.addEventListener('keydown', handleEsc);
 
 document.body.appendChild(overlay);
 }
 
 function disableAIProductLinks() {

 
 // Znajdź wszystkie elementy koszyka (różne selektory dla różnych motywów)
 const cartItems = document.querySelectorAll(
 '.cart-item, .cart-items__table-row, .cart-items__row, [data-line-item], .line-item, .cart__line-item, tr[role="row"]'
 );
 

 
 cartItems.forEach((item, index) => {
 // Znajdź wszystkie linki w tym elemencie (miniaturka + tytuł)
 const links = item.querySelectorAll('a[href*="/products/"]');
 console.log(`🔗 [CUSTOMIFY CART] Element ${index} - znaleziono linków: ${links.length}`);
 
 links.forEach(async (link, linkIndex) => {
 // Sprawdź czy już przetworzono ten link (unikaj wielokrotnego dodawania event listenerów)
 if (link.dataset.customifyProcessed === 'true') {
 console.log(`⏭️ [CUSTOMIFY CART] Link ${linkIndex} już przetworzony - pomijam`);
 return;
 }
 
 // Oznacz jako przetworzony
 link.dataset.customifyProcessed = 'true';
 
 // Znajdź obrazek w linku
 const img = link.querySelector('img');
 
 if (img) {
 // To jest link z miniaturką - sprawdź czy mamy URL z watermarkiem w cart properties
 console.log(`🖼️ [CUSTOMIFY CART] Link ${linkIndex} ma obrazek`);
 console.log(` Obrazek src: ${img.src}`);
 
 // Znajdź cart properties dla tego produktu
 const cartItem = link.closest('.cart-item, .cart-items__table-row, tr[role="row"]');
 let watermarkedUrl = null;
 
if (cartItem) {
const properties = cartItem.querySelectorAll('dd, .product-option dd');
 properties.forEach(prop => {
 const dt = prop.previousElementSibling;
 if (!dt) return;

 const propertyName = dt.textContent.trim();
 const normalizedName = propertyName.replace(/\s+/g, '').toLowerCase();

 if (normalizedName.includes('ai_image_watermarked')) {
 watermarkedUrl = prop.textContent.trim();
 console.log('✅ [CUSTOMIFY CART] Znaleziono URL z watermarkiem:', watermarkedUrl);
 }

// ✅ UKRYJ "Styl AI", "Rozmiar", "Rodzaj wydruku" i wszystkie ukryte properties
if (propertyName.startsWith('_') || 
normalizedName.includes('ai_image_') || 
normalizedName.includes('styl ai') || 
normalizedName === 'stylai' ||
propertyName === 'Styl AI' ||
propertyName.toLowerCase() === 'styl ai' ||
propertyName.includes('Styl AI') ||
propertyName.includes('styl ai') ||
propertyName === 'Rozmiar' ||
propertyName === 'Rodzaj wydruku') {
dt.style.display = 'none';
prop.style.display = 'none';
console.log('🙈 [CUSTOMIFY CART] Ukryto property:', propertyName);
}
 });
 }
 
 // ✅ Główny obrazek produktu w Shopify jest już Z watermarkiem (uploadowany z watermarkedImage)
 // ✅ Miniaturka: mała (250px) - Shopify automatycznie
 // ✅ Lightbox: DUŻA (1200px) - zmieniamy parametr width w URL
 
 let originalSrc = img.src;
 console.log('🖼️ [CUSTOMIFY CART] Oryginalny src:', originalSrc);
 
 // Zmień URL Shopify na większy rozmiar dla lightbox (1200px zamiast 250px)
 if (originalSrc.includes('cdn.shopify.com') || originalSrc.includes('lumly.pl/cdn/')) {
 let largeImageSrc = originalSrc;
 
 if (largeImageSrc.includes('width=')) {
 // Zmień istniejący parametr width
 largeImageSrc = largeImageSrc.replace(/width=\d+/, 'width=1200');
 } else {
 // Dodaj parametr width
 largeImageSrc = largeImageSrc + (largeImageSrc.includes('?') ? '&' : '?') + 'width=1200';
 }
 
 img.dataset.watermarkedSrc = largeImageSrc;
 console.log('✅ [CUSTOMIFY CART] Przygotowano większy obrazek (1200px):', largeImageSrc);
 } else {
 // Nie ma cdn.shopify.com - zostaw oryginalny
 img.dataset.watermarkedSrc = originalSrc;
 console.log('⚠️ [CUSTOMIFY CART] To nie jest Shopify CDN URL - używam oryginalnego');
 }
 
 link.addEventListener('click', (e) => {
 e.preventDefault();
 e.stopPropagation();
 console.log('🖼️ [CUSTOMIFY CART] Kliknięto miniaturkę - pokazuję lightbox');
 
 // Użyj większego obrazka (1200px) przygotowanego wcześniej
 const imageToShow = img.dataset.watermarkedSrc || img.src;
 console.log('📏 [CUSTOMIFY CART] Pokazuję obrazek:', imageToShow);
 
 showImageLightbox(imageToShow);
 });
 
 // Zmień cursor na zoom-in
 link.style.cursor = 'zoom-in';
 link.title = 'Kliknij aby powiększyć';
 } else {
 // To jest link z tytułem - wyłącz całkowicie
 console.log(`📝 [CUSTOMIFY CART] Link ${linkIndex} to tytuł - wyłączam`);
 console.log(` Link href: ${link.href}`);
 console.log(` Link text: ${link.textContent.trim()}`);
 
 link.addEventListener('click', (e) => {
 e.preventDefault();
 e.stopPropagation();
 console.log('📝 [CUSTOMIFY CART] Kliknięto tytuł - blokuję');
 });
 
 link.style.cursor = 'default';
 link.style.pointerEvents = 'none';
 link.style.textDecoration = 'none';
 }
 });
 });
 
 console.log(`✅ [CUSTOMIFY CART] Wyłączono linki dla ${cartItems.length} produktów`);
 }
 
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', disableAIProductLinks);
} else {
disableAIProductLinks();
}

document.addEventListener('cart:updated', () => {
setTimeout(disableAIProductLinks, 500);
});
 
 // Obserwuj zmiany w DOM (dla dynamicznych aktualizacji koszyka)
 const observer = new MutationObserver((mutations) => {
 // Sprawdź czy zmiana nie jest w lightbox (ignoruj zmiany w lightbox)
 const isLightboxChange = mutations.some(mutation => {
 return Array.from(mutation.addedNodes).some(node => {
 return node.classList && node.classList.contains('customify-lightbox');
 }) || Array.from(mutation.removedNodes).some(node => {
 return node.classList && node.classList.contains('customify-lightbox');
 });
 });
 
 if (isLightboxChange) {

 return;
 }
 

 disableAIProductLinks();
 });
 
 // Obserwuj zmiany tylko w kontenerze koszyka (nie w całym body)
 const cartContainer = document.querySelector('.cart-items, .cart, [data-cart-items]') || document.body;
 observer.observe(cartContainer, {
 childList: true,
 subtree: true
 });
 
 console.log('✅ [CUSTOMIFY CART] Inicjalizacja zakończona - obserwuję zmiany');
 })();

// ====================================================
// CHECKOUT LINK MODIFICATION
// ====================================================
 (function() {
 // Sprawdź czy jesteśmy na checkout lub thank you page
 const isCheckout = window.location.pathname.includes('/checkout') || 
 window.location.pathname.includes('/thank_you') ||
 window.Shopify?.Checkout;
 
 if (!isCheckout) {
 console.log('🛒 [CUSTOMIFY CHECKOUT] Nie jesteśmy na checkout - pomijam');
 return;
 }
 
 console.log('🛒 [CUSTOMIFY CHECKOUT] Inicjalizacja wyłączania linków produktów AI');
 
 function showImageLightbox(imageUrl) {
 console.log('🔍 [CUSTOMIFY CHECKOUT] Pokazuję lightbox dla:', imageUrl);
 
 // Stwórz overlay
 const overlay = document.createElement('div');
 overlay.style.cssText = `
 position: fixed;
 top: 0;
 left: 0;
 width: 100vw;
 height: 100vh;
 background: rgba(0, 0, 0, 0.9);
 z-index: 99999;
 display: flex;
 align-items: center;
 justify-content: center;
 cursor: zoom-out;
 animation: fadeIn 0.2s ease;
 `;
 
 // Dodaj powiększony obraz
 const img = document.createElement('img');
 img.src = imageUrl;
 img.alt = 'Powiększony obraz AI';
 img.style.cssText = `
 max-width: 90vw;
 max-height: 90vh;
 object-fit: contain;
 border-radius: 8px;
 box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
 `;
 
 // Przycisk zamknięcia
 const closeBtn = document.createElement('button');
 closeBtn.innerHTML = '×';
 closeBtn.setAttribute('aria-label', 'Zamknij');
 closeBtn.style.cssText = `
 position: absolute;
 top: 20px;
 right: 20px;
 width: 40px;
 height: 40px;
 background: white;
 border: none;
 border-radius: 50%;
 cursor: pointer;
 font-size: 24px;
 font-weight: bold;
 color: #333;
 display: flex;
 align-items: center;
 justify-content: center;
 box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
 transition: all 0.2s ease;
 `;
 
 overlay.appendChild(img);
 overlay.appendChild(closeBtn);
 
 // Zamknij po kliknięciu overlay lub przycisku
 overlay.addEventListener('click', (e) => {
 if (e.target === overlay || e.target === closeBtn) {
 overlay.remove();
 console.log('🔍 [CUSTOMIFY CHECKOUT] Lightbox zamknięty');
 }
 });
 
 // Zamknij po ESC
 const handleEsc = (e) => {
 if (e.key === 'Escape') {
 overlay.remove();
 document.removeEventListener('keydown', handleEsc);
 console.log('🔍 [CUSTOMIFY CHECKOUT] Lightbox zamknięty (ESC)');
 }
 };
 document.addEventListener('keydown', handleEsc);
 
 document.body.appendChild(overlay);
 }
 
 function disableAIProductLinks() {
 console.log('🛒 [CUSTOMIFY CHECKOUT] Wyłączam linki dla wszystkich produktów w checkout...');
 
 // Znajdź wszystkie elementy checkout (różne selektory dla Shopify checkout)
 const checkoutItems = document.querySelectorAll(
 '.product, .product-thumbnail, [data-product-table], .order-summary__section--product-list .product, .review-block__content .product'
 );
 
 console.log('🛒 [CUSTOMIFY CHECKOUT] Znaleziono elementów checkout:', checkoutItems.length);
 
 checkoutItems.forEach((item, index) => {
 // Znajdź wszystkie linki w tym elemencie
 const links = item.querySelectorAll('a[href*="/products/"]');
 console.log(`🔗 [CUSTOMIFY CHECKOUT] Element ${index} - znaleziono linków: ${links.length}`);
 
 links.forEach((link, linkIndex) => {
 // Znajdź obrazek w linku
 const img = link.querySelector('img');
 
 if (img) {
 // To jest link z miniaturką - wyłącz i dodaj lightbox
 console.log(`🖼️ [CUSTOMIFY CHECKOUT] Link ${linkIndex} ma obrazek - dodaję lightbox`);
 
 link.addEventListener('click', (e) => {
 e.preventDefault();
 e.stopPropagation();
 showImageLightbox(img.src);
 });
 
 // Zmień cursor na zoom-in
 link.style.cursor = 'zoom-in';
 link.title = 'Kliknij aby powiększyć';
 } else {
 // To jest link z tytułem - wyłącz całkowicie
 console.log(`📝 [CUSTOMIFY CHECKOUT] Link ${linkIndex} to tytuł - wyłączam`);
 
 link.addEventListener('click', (e) => {
 e.preventDefault();
 e.stopPropagation();
 });
 
 link.style.cursor = 'default';
 link.style.pointerEvents = 'none';
 link.style.textDecoration = 'none';
 }
 });
 });
 
 console.log(`✅ [CUSTOMIFY CHECKOUT] Wyłączono linki dla ${checkoutItems.length} produktów`);
 }
 
 // Uruchom po załadowaniu DOM
 if (document.readyState === 'loading') {
 document.addEventListener('DOMContentLoaded', disableAIProductLinks);
 } else {
 disableAIProductLinks();
 }
 
 // Uruchom ponownie po zmianach (Shopify checkout może się dynamicznie aktualizować)
 setTimeout(disableAIProductLinks, 1000);
 setTimeout(disableAIProductLinks, 2000);
 
 console.log('✅ [CUSTOMIFY CHECKOUT] Inicjalizacja zakończona');
 })();


// ====================================================
// CONTACT PAGE FUNCTIONALITY
// ====================================================
 document.addEventListener('DOMContentLoaded', function() {
 // Sprawdź czy jesteśmy na stronie kontakt
 if (window.location.pathname.includes('/pages/kontakt') || window.location.pathname.includes('/policies/contact-information')) {
 // Czekaj chwilę, żeby DOM się załadował
 setTimeout(function() {
 // Znajdź główną treść strony - szukaj po różnych selektorach
 let targetElement = null;
 
 // Próbuj znaleźć główną sekcję z treścią
 const selectors = [
 '#MainContent',
 'main',
 '.main-content',
 '.page-content',
 '.rte',
 '.page__content',
 '.page-content-wrapper',
 '[class*="policy"]',
 '[class*="content"]',
 'article',
 '.content-for-layout',
 '[class*="page"]'
 ];
 
 for (const selector of selectors) {
 const element = document.querySelector(selector);
 if (element && element.offsetHeight > 0) {
 targetElement = element;
 break;
 }
 }
 
 // Jeśli nie znaleziono, szukaj po nagłówku h1
 if (!targetElement) {
 const h1 = document.querySelector('h1');
 if (h1) {
 // Znajdź najbliższy kontener z treścią
 targetElement = h1.closest('div, section, article, main') || h1.parentElement;
 }
 }
 
 // Ostatecznie użyj body, ale znajdź miejsce przed footerem
 if (!targetElement) {
 const footer = document.querySelector('footer, [class*="footer"]');
 if (footer) {
 targetElement = footer;
 } else {
 targetElement = document.body;
 }
 }
 
 if (targetElement) {
 // Utwórz formularz kontaktowy
 const contactFormHTML = `
 <div id="contact-form-container" style="
 max-width: 600px;
 margin: 40px auto;
 padding: 30px;
 background: #fff;
 border-radius: 8px;
 box-shadow: 0 2px 8px rgba(0,0,0,0.1);
 ">
 <h2 style="
 font-size: 24px;
 font-weight: 600;
 margin-bottom: 20px;
 color: #333;
 ">Wyślij wiadomość</h2>
 
 <form id="contactForm" style="display: flex; flex-direction: column; gap: 16px;">
 <div>
 <label for="contactName" style="display: block; margin-bottom: 6px; font-weight: 500; color: #555;">
 Imię i nazwisko *
 </label>
 <input 
 type="text" 
 id="contactName" 
 name="name" 
 required
 style="
 width: 100%;
 padding: 12px;
 border: 1px solid #ddd;
 border-radius: 4px;
 font-size: 16px;
 box-sizing: border-box;
 "
 >
 </div>
 
 <div>
 <label for="contactEmail" style="display: block; margin-bottom: 6px; font-weight: 500; color: #555;">
 Email *
 </label>
 <input 
 type="email" 
 id="contactEmail" 
 name="email" 
 required
 style="
 width: 100%;
 padding: 12px;
 border: 1px solid #ddd;
 border-radius: 4px;
 font-size: 16px;
 box-sizing: border-box;
 "
 >
 </div>
 
 <div>
 <label for="contactSubject" style="display: block; margin-bottom: 6px; font-weight: 500; color: #555;">
 Temat
 </label>
 <input 
 type="text" 
 id="contactSubject" 
 name="subject"
 style="
 width: 100%;
 padding: 12px;
 border: 1px solid #ddd;
 border-radius: 4px;
 font-size: 16px;
 box-sizing: border-box;
 "
 >
 </div>
 
 <div>
 <label for="contactMessage" style="display: block; margin-bottom: 6px; font-weight: 500; color: #555;">
 Wiadomość *
 </label>
 <textarea 
 id="contactMessage" 
 name="message" 
 required
 rows="6"
 style="
 width: 100%;
 padding: 12px;
 border: 1px solid #ddd;
 border-radius: 4px;
 font-size: 16px;
 font-family: inherit;
 box-sizing: border-box;
 resize: vertical;
 "
 ></textarea>
 </div>
 
 <button 
 type="submit"
 style="
 background: #000;
 color: #fff;
 padding: 14px 28px;
 border: none;
 border-radius: 4px;
 font-size: 16px;
 font-weight: 600;
 cursor: pointer;
 transition: background 0.2s;
 "
 onmouseover="this.style.background='#333'"
 onmouseout="this.style.background='#000'"
 >
 Wyślij wiadomość
 </button>
 
 <div id="contactFormMessage" style="
 margin-top: 12px;
 padding: 12px;
 border-radius: 4px;
 display: none;
 "></div>
 </form>
 </div>
 `;
 
 // Jeśli targetElement to footer, dodaj przed nim
 if (targetElement.tagName === 'FOOTER' || targetElement.className.includes('footer')) {
 targetElement.insertAdjacentHTML('beforebegin', contactFormHTML);
 } else {
 // W przeciwnym razie dodaj na końcu elementu
 targetElement.insertAdjacentHTML('beforeend', contactFormHTML);
 }
 
 // Obsługa formularza
 const form = document.getElementById('contactForm');
 const messageDiv = document.getElementById('contactFormMessage');
 
 if (form) {
 form.addEventListener('submit', async function(e) {
 e.preventDefault();
 
 const formData = {
 name: document.getElementById('contactName').value,
 email: document.getElementById('contactEmail').value,
 subject: document.getElementById('contactSubject').value || 'Kontakt ze strony',
 message: document.getElementById('contactMessage').value
 };
 
 // Wyłącz przycisk podczas wysyłania
 const submitBtn = form.querySelector('button[type="submit"]');
 submitBtn.disabled = true;
 submitBtn.textContent = 'Wysyłanie...';
 
 try {
 const response = await fetch('https://customify-s56o.vercel.app/api/contact-form', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json'
 },
 body: JSON.stringify(formData)
 });
 
 const result = await response.json();
 
 if (response.ok && result.success) {
 messageDiv.style.display = 'block';
 messageDiv.style.background = '#E8F5E9';
 messageDiv.style.color = '#2E7D32';
 messageDiv.textContent = '✅ ' + result.message;
 form.reset();
 } else {
 throw new Error(result.error || 'Błąd wysyłania wiadomości');
 }
 } catch (error) {
 messageDiv.style.display = 'block';
 messageDiv.style.background = '#FFEBEE';
 messageDiv.style.color = '#C62828';
 messageDiv.textContent = '❌ Błąd: ' + error.message;
 } finally {
 submitBtn.disabled = false;
 submitBtn.textContent = 'Wyślij wiadomość';
 }
 }); // Zamknij addEventListener
 } // Zamknij if (form)
 } // Zamknij if (targetElement)
 }, 500); // Czekaj 500ms na załadowanie DOM
 }
 });

