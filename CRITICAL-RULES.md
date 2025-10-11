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

### **RÓŻNICE MIĘDZY TYPAMI STYLÓW:**

#### **🐱 STYLE KOTÓW (productType: "cats"):**
- **API:** Nano Banana z **2 obrazkami**
- **Obrazki:** Miniaturka stylu + zdjęcie użytkownika
- **Format:** `image_input: ["https://url-miniaturki.png", "USER_IMAGE"]`
- **Prompt:** "Stwórz obraz w stylu jak na pierwszym obrazku, z pyskiem i głową kota z drugiego obrazka..."
- **Parametry:** `aspect_ratio: "3:4"`, `output_format: "jpg"`

#### **🎨 STYLE BOHO (productType: "boho"):**
- **API:** Nano Banana z **1 obrazkiem**
- **Obrazki:** Tylko zdjęcie użytkownika (BEZ miniaturki)
- **Format:** `image_input: ["USER_IMAGE"]`
- **Prompt:** Różne prompty (minimalistyczny vs realistyczny)
- **Parametry:** `aspect_ratio: "3:4"`, `output_format: "jpg"`, `guidance: 3.5`

#### **🎭 INNE STYLE (productType: "other"):**
- **API:** Różne modele (SDXL, Ghibli, Pixar, etc.)
- **Obrazki:** 1 obrazek (zdjęcie użytkownika)
- **Format:** `image: "USER_IMAGE"`
- **Prompt:** Zależny od stylu
- **Parametry:** Zależne od modelu

### **Struktura konfiguracji stylów w `api/transform.js`:**
```javascript
const styleConfig = {
  'nazwa-stylu': {
    model: "nazwa-modelu-ai",           // Model AI (np. google/nano-banana, swartype/sdxl-pixar)
    prompt: "prompt dla AI",            // Prompt tekstowy dla modelu
    productType: "typ-produktu",        // "cats", "boho", "other"
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

---

## 🚨 ZASADA #5: OCHRONA PRZED ODRZUCENIEM PRZEZ GOOGLE ADS (CLOAKING)

### **KRYTYCZNE: Google Ads wykrywa "Obchodzenie zabezpieczeń systemu" (Cloaking)**

Google Ads BLOKUJE reklamy jeśli wykryje różnice między tym co widzi **bot Google** a **użytkownik**. To nazywa się **CLOAKING** i jest SUROWO ZAKAZANE.

---

### 🚫 **NIGDY NIE RÓB TEGO (Cloaking Risk):**

#### **1. NIE UKRYWAJ ELEMENTÓW PRZEZ CSS:**
```css
/* ❌ ZABRONIONE - Google widzi HTML, user nie widzi element */
.discount-badge {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}
```

#### **2. NIE MANIPULUJ DOM PRZEZ JAVASCRIPT:**
```javascript
// ❌ ZABRONIONE - Bot widzi inny content niż user
if (file.size > 4MB) {
  this.compressImage(file); // Tylko dla niektórych
}

card.style.display = isCatStyle ? 'block' : 'none'; // Dynamic hiding
```

#### **3. NIE UŻYWAJ setTimeout DO ŁADOWANIA CONTENTU:**
```javascript
// ❌ ZABRONIONE - Bot może nie zobaczyć contentu
setTimeout(() => {
  this.showContent();
}, 1500); // Bot załaduje stronę PRZED tym czasem!
```

#### **4. NIE TWÓRZ ELEMENTÓW DYNAMICZNIE W JAVASCRIPT:**
```javascript
// ❌ ZABRONIONE - Bot może nie wykonać JavaScript
const badge = document.createElement('div');
badge.textContent = 'Oszczędzasz 30%';
document.body.appendChild(badge);
```

---

### ✅ **ZAWSZE RÓB TO (Google Ads Safe):**

#### **1. UŻYWAJ SERVER-SIDE RENDERING (Shopify Liquid):**
```liquid
{% comment %} ✅ OK - Bot widzi to samo co user {% endcomment %}
{% if product.handle == 'koty-krolewskie' %}
  <!-- Style kotów -->
{% else %}
  <!-- Style normalne -->
{% endif %}
```

#### **2. UŻYWAJ CSS DO UKRYWANIA (Ale bez display:none na content!):**
```css
/* ✅ OK - Etsy-style collapse z CSS */
.text-block.rte {
  max-height: 150px; /* Ukrywa część, NIE cały element */
  overflow: hidden;
}

.text-block.rte.expanded {
  max-height: none; /* Pokaż cały po kliknięciu */
}

/* ✅ OK - Fade gradient przez ::after pseudo-element */
.text-block.rte::after {
  content: '';
  background: linear-gradient(transparent, white);
}
```

#### **3. KOMPRESUJ WSZYSTKIE PLIKI JEDNAKOWO:**
```javascript
// ✅ OK - WSZYSTKIE pliki kompresowane tak samo
this.compressImage(file); // Dla WSZYSTKICH, nie tylko >4MB

// ❌ ZŁE - Różne traktowanie = cloaking risk
if (file.size > 4MB) {
  this.compressImage(file);
}
```

#### **4. BEZ setTimeout - NATYCHMIAST POKAŻ CONTENT:**
```javascript
// ✅ OK - Natychmiast
this.setupExpandableDescription();

// ❌ ZŁE - Opóźnienie
setTimeout(() => {
  this.setupExpandableDescription();
}, 1500);
```

#### **5. TYLKO TOGGLE KLAS, NIE TWÓRZ NOWEGO HTML:**
```javascript
// ✅ OK - Tylko zmiana klasy
container.classList.toggle('expanded');

// ❌ ZŁE - Tworzenie nowych elementów
const newDiv = document.createElement('div');
container.appendChild(newDiv);
```

---

### 📋 **CHECKLIST PRZED WDROŻENIEM:**

Przed każdą zmianą sprawdź:

- [ ] ✅ Czy CSS ukrywa content natychmiast (BEZ setTimeout)?
- [ ] ✅ Czy bot Google widzi TEN SAM HTML co użytkownik?
- [ ] ✅ Czy używasz server-side rendering (Shopify Liquid) zamiast JavaScript?
- [ ] ✅ Czy WSZYSTKIE pliki są traktowane jednakowo (nie tylko >4MB)?
- [ ] ✅ Czy JavaScript tylko dodaje/usuwa klasy (NIE tworzy nowego HTML)?
- [ ] ✅ Czy elementy są ukrywane przez max-height/overflow (NIE display:none na content)?
- [ ] ✅ Czy fade gradient jest przez CSS ::after (NIE JavaScript)?

---

### 🔍 **JAK SPRAWDZIĆ CZY JEST OK:**

#### **1. Google Search Console - URL Inspection Tool:**
```
1. Przejdź do Google Search Console
2. URL Inspection Tool
3. Wpisz: https://lumly.pl/products/custom
4. Kliknij "TEST LIVE URL"
5. Sprawdź "View Crawled Page"
6. ✅ Porównaj z tym co widzi user - muszą być IDENTYCZNE!
```

#### **2. curl test (bot simulation):**
```bash
curl https://lumly.pl/products/custom > bot.html
# Otwórz w przeglądarce i porównaj z live site
# ✅ Muszą być identyczne!
```

#### **3. Disable JavaScript test:**
```
1. Otwórz DevTools (F12)
2. Settings → Debugger → Disable JavaScript
3. Odśwież stronę
4. ✅ CAŁY content musi być widoczny (może być bez interakcji)
```

---

### 🚨 **CO ZROBIĆ JEŚLI GOOGLE ADS ZABLOKUJE:**

#### **1. Przeanalizuj co może być problemem:**
- Sprawdź czy coś jest ukrywane przez CSS (`display:none`, `visibility:hidden`)
- Sprawdź czy JavaScript tworzy nowe elementy
- Sprawdź czy jest setTimeout przed pokazaniem contentu
- Sprawdź czy różne pliki są traktowane różnie

#### **2. Złóż odwołanie w Google Ads:**
```
1. Menedżer zasad Google Ads
2. Wybierz odrzuconą reklamę
3. Kliknij "Odwołanie"
4. Opisz co naprawiłeś:
   - "Usunięto cloaking"
   - "Przeniesiono logikę na server-side"
   - "Usunięto setTimeout"
   - "Content renderowany natychmiast"
```

#### **3. Poczekaj 24-48h na weryfikację**

---

### 💡 **PRZYKŁADY Z CUSTOMIFY:**

#### **✅ DOBRE PRAKTYKI (zaimplementowane):**

1. **Filtrowanie stylów - SERVER-SIDE:**
```liquid
{% if product.handle == 'koty-krolewskie' %}
  <div data-style="krolewski">Królewski Kot</div>
{% else %}
  <div data-style="van gogh">Van Gogh</div>
{% endif %}
```

2. **Expandable description - CSS:**
```css
.text-block.rte {
  max-height: 150px; /* Ukrywa część */
}
.text-block.rte.expanded {
  max-height: none; /* Pokaż cały */
}
```

3. **Kompresja - WSZYSTKIE pliki:**
```javascript
// ZAWSZE kompresuj
this.compressImage(file);
```

4. **BEZ setTimeout:**
```javascript
// Natychmiast
this.setupExpandableDescription();
```

#### **❌ ZŁYCH PRAKTYK (usunięte):**

1. ~~Ukrywanie discount badge przez CSS~~
2. ~~Dynamic hiding stylów przez JavaScript~~
3. ~~setTimeout 1500ms przed pokazaniem contentu~~
4. ~~Tworzenie elementów przez JavaScript~~
5. ~~Różne traktowanie plików <4MB vs >4MB~~

---

### 🎯 **ZASADA ZŁOTEGO ŚRODKA:**

**"Bot Google i użytkownik muszą widzieć IDENTYCZNY HTML i CSS. JavaScript może tylko dodawać/usuwać klasy, NIE tworzyć nowych elementów."**

---

### 📚 **LINKI:**

- [Google Ads Policy - Obchodzenie zabezpieczeń](https://support.google.com/adspolicy/answer/6020954)
- [Google Search Console - URL Inspection](https://search.google.com/search-console)
- [Shopify Liquid Documentation](https://shopify.dev/docs/api/liquid)

---

**PAMIĘTAJ: Jeśli masz wątpliwości czy coś może być uznane za cloaking - PYTAJ ZANIM ZAIMPLEMENTUJESZ!**
