# 📧 PLAN: Mailing promocyjny z okazji Dnia Kobiet

## 🎯 CEL
Wysłać mailing do wszystkich klientów (analogicznie do walentynkowego) z produktami z kolekcji **Dzień Kobiet**: https://lumly.pl/collections/dzien-kobiet

---

## 📋 OBSERWACJA: Jak wyglądał mailing walentynkowy

### **Struktura walentynkowa (do skopiowania):**
1. **Źródło klientów:** `/api/get-old-customers?days=14` – klienci starsi niż 2 tygodnie
2. **Źródło produktów:** dynamicznie z kolekcji (handle lub ID) przez `getCollectionProducts()`
3. **Template:** `generateValentineTemplate(products)` w `api/send-bulk-generation-emails.js`
4. **Skrypt masowej wysyłki:** `send-bulk-walentynki.js` – partie po 100 maili, przerwy między partiami
5. **Kolory walentynkowe:** gradient `#ff6b9d` → `#c44569`, tło `#fff5f8`
6. **Struktura maila:** Header → Powitanie → Treść motywacyjna → CTA → Produkty (3 kolumny) → "Dlaczego warto?" → Moje generacje → Kontakt → Footer

### **Kolekcja Dzień Kobiet (z lumly.pl):**
- **URL:** https://lumly.pl/collections/dzien-kobiet
- **Handle:** `dzien-kobiet`
- **Produkty (10 szt.):** Portret królowej, Akwarela, Karykatury (Psycholog, Policjantka, Podróżniczka, Lekarka, Kucharka, Hobby/zawody, Fitness, Farmerka)

---

## 📋 KROK 1: Endpoint get-old-customers – BEZ ZMIAN ✅

Endpoint `/api/get-old-customers.js` jest uniwersalny – pobiera klientów starszych niż X dni.  
**Użycie:** `GET /api/get-old-customers?days=14`

---

## 📋 KROK 2: Pobieranie produktów z kolekcji – BEZ ZMIAN ✅

Funkcja `getCollectionProducts(collectionHandleOrId)` w `send-bulk-generation-emails.js` obsługuje zarówno **handle** (`dzien-kobiet`) jak i **ID** kolekcji.  
**Wystarczy przekazać:** `collectionHandle: 'dzien-kobiet'` lub `collectionId` (jeśli znane).

---

## 📋 KROK 3: Nowy template Dnia Kobiet

### **Modyfikacja:** `api/send-bulk-generation-emails.js`

### **Dodaj:**
1. Funkcję `generateDzienKobietTemplate(products)` – analogiczna do `generateValentineTemplate(products)`
2. Warunek wyboru template: jeśli `collectionHandle === 'dzien-kobiet'` lub `collectionId === ID kolekcji` → użyj template Dnia Kobiet

### **Różnice względem walentynkowego:**

| Element | Walentynki | Dzień Kobiet |
|-------|----------------|----------------|
| **Header** | "Obraz z waszego zdjęcia" / "Stwórz prezent dla ukochanej osoby" | "Dzień Kobiet z Lumly.pl" / "Wyjątkowy prezent dla Niej" |
| **Treść** | "Walentynki zbliżają się wielkimi krokami! 💝" | "Dzień Kobiet zbliża się! 🌸" |
| **Emoji** | 💝 ❤️ | 🌸 💐 |
| **CTA** | "Zobacz produkty walentynkowe →" | "Zobacz produkty na Dzień Kobiet →" |
| **Link** | `https://lumly.pl/collections/walentynki` | `https://lumly.pl/collections/dzien-kobiet` |
| **Sekcja produktów** | "💝 Nasze propozycje na Walentynki" | "🌸 Nasze propozycje na Dzień Kobiet" |
| **Subject** | "Walentynki - obraz z Waszego zdjęcia" | "Dzień Kobiet - wyjątkowy prezent dla Niej" |
| **Kolory** | Różowy (`#ff6b9d` → `#c44569`) | Fioletowo-różowy (np. `#9b59b6` → `#e91e63` lub zachować różowy – spójność z Lumly) |

### **Propozycja kolorów Dnia Kobiet:**
- **Opcja A (spójność):** zachować ten sam gradient jak walentynki – różowy pasuje do Dnia Kobiet
- **Opcja B (odróżnienie):** gradient fioletowy `#9b59b6` → `#e91e63` (fiolet → różowy)

### **Struktura HTML:** identyczna jak walentynkowy (header, tabela produktów 3 kolumny, "Dlaczego warto?", Moje generacje, footer).

---

## 📋 KROK 4: Integracja w send-bulk-generation-emails.js

### **Logika wyboru template (uproszczenie):**
- Obecnie: `collectionIdentifier` (handle lub ID) → zawsze `generateValentineTemplate`
- **Docelowo:** 
  - jeśli `collectionHandle === 'dzien-kobiet'` lub `collectionId === ID_DZIEN_KOBIET` → `generateDzienKobietTemplate`
  - jeśli `collectionHandle === 'walentynki'` lub `collectionId === ID_WALENTYNKI` → `generateValentineTemplate`
  - jeśli inny handle/ID → można użyć generycznego template (np. walentynkowy jako fallback) lub dodać kolejne w kolejnych kampaniach

### **Alternatywa (prostsza):**
- Dodać parametr `templateType: 'walentynki' | 'dzien-kobiet'` w request body
- Jeśli `templateType === 'dzien-kobiet'` → użyj template Dnia Kobiet niezależnie od collectionHandle

---

## 📋 KROK 5: Skrypt masowej wysyłki

### **Nowy plik:** `send-bulk-dzien-kobiet.js`

Skopiować `send-bulk-walentynki.js` i zmienić:
- `COLLECTION_HANDLE = 'dzien-kobiet'` (lub `collectionId` jeśli znane)
- W body: `collectionHandle: 'dzien-kobiet'` zamiast `collectionId`
- Nazwy w logach: "maili walentynkowych" → "maili z okazji Dnia Kobiet"
- Pliki postępu: opcjonalnie `mailing-progress-dzien-kobiet.json` (żeby nie nadpisać postępu walentynkowego)

---

## 📋 KROK 6: Workflow wysyłki (analogiczny do walentynkowego)

### **1. Test emaila (na swój adres):**
```bash
curl -X POST https://customify-s56o.vercel.app/api/send-bulk-generation-emails \
  -H "Content-Type: application/json" \
  -d '{
    "testEmail": "twoj@email.pl",
    "collectionHandle": "dzien-kobiet"
  }'
```

*(Wymaga: najpierw dodać obsługę `dzien-kobiet` w backendzie – Krok 3–4)*

### **2. Pobranie listy klientów:**
```bash
curl "https://customify-s56o.vercel.app/api/get-old-customers?days=14" > old-customers.json
```

### **3. Masowa wysyłka:**
```bash
node send-bulk-dzien-kobiet.js
```

### **4. Opcjonalnie – harmonogram:**
- Dzień Kobiet: **8 marca**
- Sugerowana data wysyłki: **5–6 marca** (2–3 dni przed świętem)
- Można użyć `at` lub crona jak przy walentynkach

---

## 📋 KROK 7: Checklist przed wdrożeniem

- [ ] Dodać `generateDzienKobietTemplate(products)` w `api/send-bulk-generation-emails.js`
- [ ] Dodać warunek wyboru template dla `dzien-kobiet` (lub `templateType`)
- [ ] Utworzyć `send-bulk-dzien-kobiet.js`
- [ ] Test emaila (testEmail + collectionHandle: 'dzien-kobiet')
- [ ] Weryfikacja wizualna maila (kolory, teksty, linki)
- [ ] Ustalenie daty wysyłki (np. 5–6 marca)
- [ ] Masowa wysyłka

---

## 📋 KROK 8: Szacowanie

### **Czas implementacji:**
- Template Dnia Kobiet: ~30 min
- Integracja w send-bulk-generation-emails: ~20 min
- Skrypt send-bulk-dzien-kobiet.js: ~15 min
- Testy: ~15 min  
**Łącznie: ~1,5 h**

### **Czas wysyłki:** (jak przy walentynkach)
- 100 klientów: ~2 minuty
- 500 klientów: ~8 minut
- 1000 klientów: ~17 minut

---

## ✅ PODSUMOWANIE

| Element | Walentynki | Dzień Kobiet |
|---------|------------|--------------|
| Kolekcja | `walentynki` / ID 672196395333 | `dzien-kobiet` |
| URL | lumly.pl/collections/walentynki | lumly.pl/collections/dzien-kobiet |
| get-old-customers | ✅ | ✅ (bez zmian) |
| getCollectionProducts | ✅ | ✅ (obsługuje handle) |
| Template | generateValentineTemplate | **generateDzienKobietTemplate** (nowy) |
| Skrypt | send-bulk-walentynki.js | **send-bulk-dzien-kobiet.js** (nowy) |

**Status:** 📝 Plan gotowy do implementacji  
**Data:** 2025-02-24
