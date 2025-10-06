# KRYTYCZNE ZASADY CUSTOMIFY - NIGDY NIE ŁAM!

## 🚨 ZASADA #1: NIGDY NIE UKRYWAJ APLIKACJI
- **NIGDY** nie ustawiaj `style="display: none;"` na aplikacji Customify
- Aplikacja MUSI być zawsze widoczna z `style="display: block;"` lub bez tego atrybutu
- Ukrywanie aplikacji powoduje, że użytkownik nie widzi funkcjonalności
- To jest BARDZO FRUSTRUJĄCE dla użytkownika

## 🚨 ZASADA #2: ZAWSZE SPRAWDZAJ WIDOCZNOŚĆ
- Przed każdą zmianą sprawdź czy aplikacja jest widoczna
- Użyj `curl` lub przeglądarki żeby zweryfikować
- Jeśli aplikacja nie jest widoczna - NAPRAW NATYCHMIAST

## 🚨 ZASADA #3: CACHE JEST AGRESYWNY
- Vercel cache: 15-30 minut
- Shopify cache: 15-30 minut  
- Przeglądarka cache: może być godzinami
- Zawsze dodawaj `?v=timestamp` do testów

## 🚨 ZASADA #4: NIE ZMIENIAJ NAZW PLIKÓW BEZ POWODU
- Nie zmieniaj `customify.js` na `customify-v2.js` bez powodu
- To powoduje błędy 404 i wyłącza aplikację
- Używaj tylko gdy naprawdę musisz wymusić cache

## ✅ CO ROBIĆ:
- Zawsze ustawiaj `style="display: block;"` na aplikacji
- Testuj zmiany w przeglądarce
- Commituj zmiany do GitHub
- Wdrażaj na Shopify
- Sprawdzaj czy działa

## ❌ CZEGO NIE ROBIĆ:
- NIE ukrywaj aplikacji (`display: none`)
- NIE zmieniaj nazw plików bez powodu
- NIE ignoruj błędów 404
- NIE zostawiaj aplikacji niewidocznej

## 🎯 ZASADA KONFIGURACJI STYLÓW AI:

### **Struktura konfiguracji stylów w `api/transform.js`:**
```javascript
const styleConfig = {
  'nazwa-stylu': {
    model: "nazwa-modelu-ai",           // Model AI (np. google/nano-banana, swartype/sdxl-pixar)
    prompt: "prompt dla AI",            // Prompt tekstowy dla modelu
    apiType: "typ-api",                 // Typ API (nano-banana, replicate, openai, etc.)
    parameters: {                       // Parametry specyficzne dla API
      // Parametry zależą od apiType
    }
  }
}
```

### **Typy API i ich parametry:**

#### **1. nano-banana (google/nano-banana):**
```javascript
'styl-kota': {
  model: "google/nano-banana",
  prompt: "wygeneruj obraz dokładnie jak na pierwszym obrazku...",
  apiType: "nano-banana",
  parameters: {
    image_input: ["URL_MINIATURKI", "USER_IMAGE"], // Array z 2 obrazkami
    aspect_ratio: "match_input_image",
    output_format: "jpg"
  }
}
```

#### **2. replicate (stability-ai, sdxl-pixar, etc.):**
```javascript
'pixar': {
  model: "swartype/sdxl-pixar:...",
  prompt: "Pixar style 3D animation...",
  apiType: "replicate", // lub brak apiType = domyślnie replicate
  parameters: {
    task: "img2img",
    guidance_scale: 7.5,
    num_inference_steps: 25,
    // ... inne parametry Replicate
  }
}
```

### **Zasady dodawania nowych stylów:**
1. **Dodaj do `styleConfig`** z wszystkimi wymaganymi polami
2. **Ustaw `apiType`** (nano-banana, replicate, openai, etc.)
3. **Zdefiniuj `parameters`** specyficzne dla danego API
4. **Dodaj logikę** w sekcji wykonywania modeli jeśli potrzeba
5. **Przetestuj** z różnymi obrazkami
