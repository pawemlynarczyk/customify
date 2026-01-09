# Analiza błędów Sentry - Wpływ na użytkownika

**Data analizy:** 29.12.2025  
**Łącznie błędów:** 59  
**Łącznie eventów:** 1228

---

## 🔴 BŁĘDY ISTOTNE DLA UŻYTKOWNIKA (WYSOKI PRIORYTET)

### 1. **Failed to fetch / Network errors** - 98 eventów, 56 użytkowników
**Błędy:**
- `80094193`: Error completing request (59x, 41 użytkowników)
- `80204835`: Load failed (26x, 23 użytkownicy)
- `80137078`: Load failed (18x, 14 użytkowników)
- `80395792`: Failed to fetch (15x, 15 użytkowników)
- `80968952`: NetworkError (6x, 3 użytkowników)
- `82048660`: Failed to fetch (3x, 3 użytkowników)
- Inne pojedyncze: 11 eventów

**Wpływ na użytkownika:**
- ⚠️ **MOŻE BLOKOWAĆ** funkcjonalność (upload zdjęć, dodanie do koszyka, API calls)
- ⚠️ **MOŻE PSOWAĆ** UX (przyciski nie działają, formularze się nie wysyłają)
- ⚠️ **MOŻE BYĆ** problemem z Customify API lub Shopify API

**Rekomendacja:** 
- Sprawdź czy to Customify API (`/api/transform`, `/api/products`) czy Shopify
- Sprawdź logi Vercel dla tych endpointów
- Sprawdź czy to problem z CORS lub rate limiting

---

### 2. **Cannot read properties of undefined/null** - 180 eventów, 99 użytkowników
**Błędy:**
- `80114466`: Cannot read 'processNewElements' (155x, 81 użytkowników) ⚠️ **NAJWIĘKSZY PROBLEM**
- `80114470`: Cannot read 'processNewElements' (14x, 11 użytkowników)
- `82465592`: undefined is not an object (evaluating 'error.message.includes') (37x, 24 użytkowników)
- `80235931`: Cannot read 'dispatchEvent' (11x, 7 użytkowników)
- `80124600`: Cannot read 'includes' (8x, 7 użytkowników)
- `80449801`: Cannot read 'setState' (7x, 7 użytkowników)
- Inne: 8 eventów

**Wpływ na użytkownika:**
- ⚠️ **MOŻE POWODOWAĆ** crashy JavaScript (funkcje przestają działać)
- ⚠️ **MOŻE PSOWAĆ** interakcje (kliknięcie nie działa, formularze się nie wypełniają)
- ⚠️ **MOŻE BLOKOWAĆ** Customify (jeśli to dotyczy `customify.js`)

**Rekomendacja:**
- Sprawdź czy `processNewElements` to funkcja Customify czy motywu Shopify
- Sprawdź stack trace w Sentry dla szczegółów
- Dodaj walidację `if (obj && obj.processNewElements)` przed wywołaniem

---

### 3. **Segmind API Error** - 1 event, 0 użytkowników (ale to Customify!)
**Błąd:**
- `80098034`: Segmind API error: 400 (1x, 0 użytkowników)

**Wpływ na użytkownika:**
- 🔴 **BLOKUJE** transformację AI dla stylu "Król" (Segmind Faceswap)
- 🔴 **UŻYTKOWNIK NIE MOŻE** wygenerować portretu króla

**Rekomendacja:**
- ⚠️ **KRYTYCZNE** - sprawdź logi `/api/transform.js` dla Segmind
- Sprawdź czy to problem z API key czy z requestem
- Dodaj lepsze error handling i retry logic

---

### 4. **Product ID required** - 2 eventy, 2 użytkowników
**Błąd:**
- `80093697`: Product ID and an ID attribute are required (2x, 2 użytkowników)

**Wpływ na użytkownika:**
- ⚠️ **MOŻE BLOKOWAĆ** dodanie produktu do koszyka
- ⚠️ **MOŻE PSOWAĆ** funkcjonalność Customify (jeśli to dotyczy naszych produktów)

**Rekomendacja:**
- Sprawdź czy to Customify produkty czy Shopify produkty
- Sprawdź logi `/api/products.js` dla błędów tworzenia produktów

---

### 5. **Invalid element types / Missing shadow root** - 10 eventów, 9 użytkowników
**Błędy:**
- `80332161`: Invalid element types in OverflowList (6x, 6 użytkowników)
- `83023959`: Missing shadow root (4x, 3 użytkownicy)

**Wpływ na użytkownika:**
- ⚠️ **MOŻE PSOWAĆ** renderowanie komponentów (menu, dropdowny)
- ⚠️ **MOŻE PSOWAĆ** UX (elementy nie wyświetlają się poprawnie)

**Rekomendacja:**
- Sprawdź czy to Customify komponenty czy motyw Shopify
- Sprawdź stack trace w Sentry

---

## 🟡 BŁĘDY ŚREDNIO ISTOTNE (ŚREDNI PRIORYTET)

### 6. **Unable to fetch assets** - 95 eventów, 5 użytkowników
**Błędy:**
- `80591690`: Unable to fetch rte-formatter.js (78x, 1 użytkownik) - **STARY PLIK**
- `81408286`: Unable to fetch slideshow.js (10x, 3 użytkowników)
- `83030193`: Unable to fetch recently-viewed-products.js (4x, 1 użytkownik)
- `83451101`: Unable to fetch recently-viewed-products.js (1x, 1 użytkownik)
- `81407326`: Unable to fetch performance.js (2x, 2 użytkowników)

**Wpływ na użytkownika:**
- 🟡 **MOŻE PSOWAĆ** funkcjonalność jeśli te pliki są używane (edytor tekstu, slider, rekomendacje)
- 🟡 **WIĘKSZOŚĆ** to stare pliki (ostatni raz 16.12) - może już nie są używane

**Rekomendacja:**
- Sprawdź czy te pliki są jeszcze używane w `theme.liquid`
- Jeśli nie - usuń referencje
- Jeśli tak - napraw ścieżki

---

### 7. **No empty section markup found** - 21 eventów, 4 użytkowników
**Błąd:**
- `80093698`: No empty section markup found (21x, 4 użytkowników)

**Wpływ na użytkownika:**
- 🟡 **MOŻE PSOWAĆ** edycję sekcji w Shopify Theme Editor
- 🟡 **NIE WPŁYWA** na zwykłych użytkowników (tylko admin)

**Rekomendacja:**
- Niski priorytet - dotyczy tylko admin panelu
- Sprawdź czy to Customify sekcje czy motyw Shopify

---

## 🟢 BŁĘDY NIEISTOTNE (NISKI PRIORYTET)

### 8. **@theme/ module specifier errors** - 591 eventów, 6 użytkowników
**Błędy:**
- `80506259`: @theme/component (430x) - component-quantity-selector.js
- `80506267`: @theme/utilities (57x) - accordion-custom.js, floating-panel.js
- `80506263`: @theme/events (54x) - product-price.js
- `80506260`: @theme/critical (26x) - product-card.js
- `80506262`: @theme/morph (19x) - quick-add.js
- `80506271`: @theme/recently-viewed-products (12x)
- `81934700`: @theme/section-renderer (3x) - facets.js

**Wpływ na użytkownika:**
- 🟢 **NIE WPŁYWA** - to są błędy w konsoli, ale funkcjonalność działa
- 🟢 **PROBLEM MOTYWU** Shopify, nie Customify
- 🟢 **UŻYTKOWNIK NIE WIDZI** - tylko w konsoli przeglądarki

**Rekomendacja:**
- Niski priorytet - to problem motywu Horizon, nie Customify
- Można zignorować lub naprawić w przyszłości (wymaga rebuild motywu)

---

### 9. **View transition errors** - 52 eventy, 43 użytkowników
**Błędy:**
- `80125576`: AbortError: Skipping view transition (49x, 40 użytkowników)
- `81268293`: InvalidStateError: viewport size changed (3x, 3 użytkownicy)

**Wpływ na użytkownika:**
- 🟢 **NIE WPŁYWA** - to tylko animacje przejść między stronami
- 🟢 **FUNKCJONALNOŚĆ DZIAŁA** - tylko animacje są pomijane

**Rekomendacja:**
- Niski priorytet - to tylko UX enhancement, nie funkcjonalność

---

### 10. **Browser extension errors** - 2 eventy, 2 użytkowników
**Błędy:**
- `82478147`: Invalid call to runtime.sendMessage() - Tab not found (2x, 2 użytkowników)
- `80893489`: Clipboard write is not allowed (1x, 1 użytkownik)

**Wpływ na użytkownika:**
- 🟢 **NIE WPŁYWA** - to błędy rozszerzeń przeglądarki (np. adblocker, password manager)
- 🟢 **NIE NASZ PROBLEM** - użytkownik ma rozszerzenie które powoduje błąd

**Rekomendacja:**
- Zignoruj - to nie nasz kod

---

### 11. **Unknown errors** - 32 eventy, 14 użytkowników
**Błędy:**
- `80398489`: <unknown> (30x, 12 użytkowników)
- `81239197`: <unknown> (2x, 2 użytkownicy)

**Wpływ na użytkownika:**
- 🟢 **NIEZNANY** - brak szczegółów w Sentry

**Rekomendacja:**
- Sprawdź szczegóły w Sentry UI dla tych błędów
- Może być związane z minifikacją kodu

---

### 12. **Illegal constructor / Syntax errors** - 9 eventów, 4 użytkowników
**Błędy:**
- `81935111`: Illegal constructor (8x, 3 użytkowników)
- `83956941`: Invalid regular expression (1x, 1 użytkownik)

**Wpływ na użytkownika:**
- 🟢 **MOŻE PSOWAĆ** funkcjonalność jeśli dotyczy Customify
- 🟢 **MOŻE BYĆ** problemem z przeglądarką (stara wersja)

**Rekomendacja:**
- Sprawdź stack trace w Sentry
- Sprawdź czy to Customify czy motyw Shopify

---

## 📊 PODSUMOWANIE PRIORYTETÓW

### 🔴 WYSOKI PRIORYTET (NAPRAW NATYCHMIAST):
1. **Segmind API Error** (1x) - 🔴 **KRYTYCZNE** - blokuje transformację "Król"
2. **Failed to fetch / Network errors** (98x, 56 użytkowników) - może blokować Customify
3. **Cannot read properties** (180x, 99 użytkowników) - może powodować crashy

### 🟡 ŚREDNI PRIORYTET (NAPRAW WKRÓTCE):
4. **Unable to fetch assets** (95x, 5 użytkowników) - sprawdź czy pliki są używane
5. **Product ID required** (2x, 2 użytkowników) - sprawdź Customify produkty

### 🟢 NISKI PRIORYTET (MOŻNA ZIGNOROWAĆ):
6. **@theme/ module specifier** (591x, 6 użytkowników) - problem motywu, nie Customify
7. **View transition errors** (52x, 43 użytkowników) - tylko animacje
8. **Browser extension errors** (2x, 2 użytkowników) - nie nasz problem
9. **Unknown errors** (32x, 14 użytkowników) - sprawdź szczegóły w Sentry

---

## 🎯 REKOMENDACJE DZIAŁAŃ

### 1. **Natychmiast (dziś):**
- ✅ Sprawdź logi `/api/transform.js` dla Segmind API error
- ✅ Sprawdź czy Failed to fetch dotyczy Customify API (`/api/transform`, `/api/products`)
- ✅ Sprawdź stack trace dla `processNewElements` - czy to Customify?

### 2. **Wkrótce (ten tydzień):**
- ✅ Dodaj error handling dla network errors w Customify
- ✅ Dodaj walidację dla `undefined` przed wywołaniem funkcji
- ✅ Sprawdź czy stare pliki JS są jeszcze używane (rte-formatter.js, slideshow.js)

### 3. **W przyszłości (niski priorytet):**
- ⚪ Napraw @theme/ module specifier errors (wymaga rebuild motywu)
- ⚪ Napraw view transition errors (tylko animacje)

---

## 📈 STATYSTYKI WPŁYWU

- **Błędy istotne dla użytkownika:** ~280 eventów, ~160 użytkowników
- **Błędy nieistotne:** ~948 eventów, ~6 użytkowników (głównie @theme/ errors)
- **Procent istotnych:** ~23% eventów, ale dotyczy większości użytkowników

**WNIOSEK:** Większość błędów to problemy motywu Shopify (@theme/), ale błędy istotne dotykają większości użytkowników (160 vs 6).

