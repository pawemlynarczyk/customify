# 📋 PLAN WDROŻENIA: Limity per ProductType

**Data:** 2025-11-17  
**Wersja:** 1.0  
**Status:** Gotowy do wdrożenia

---

## 🎯 CEL

Zmiana systemu limitów z **TOTAL** na **per ProductType**:
- **Niezalogowani:** 1 generacja per productType (np. 1 dla boho, 1 dla king, 1 dla cats)
- **Zalogowani:** 3 generacje per productType (np. 3 dla boho, 3 dla king, 3 dla cats)

---

## 📊 OBECNA SYTUACJA

### **Limity (TOTAL):**
- Niezalogowani: **1 TOTAL** (device token)
- Zalogowani: **3 TOTAL** (Shopify metafields)

### **Struktura danych:**
- Device Token: `{ totalGenerations: 1, generations: [...] }`
- Shopify Metafields: `"3"` (liczba)

---

## 🚀 PLAN WDROŻENIA

### **FAZA 1: Przygotowanie (Backend - Bezpieczne zmiany)**

#### **KROK 1.1: Użyj `config.productType` zamiast `body.productType`**

**Plik:** `api/transform.js`  
**Linia:** ~955-958

**Zmiana:**
```javascript
// PRZED:
const { imageData, prompt, productType, ... } = req.body;
// Używa productType z body (można zmienić)

// PO:
const style = Object.keys(styleConfig).find(s => prompt.toLowerCase().includes(s));
const config = styleConfig[style] || styleConfig['anime'];
const finalProductType = config.productType || productType || 'other';
// ✅ Używa productType z config (bezpieczne)
```

**Test:**
- Sprawdź czy `finalProductType` jest poprawny dla każdego stylu
- Log: `console.log('🎯 [TRANSFORM] Final productType:', finalProductType);`

---

#### **KROK 1.2: Zmień strukturę Device Token (Niezalogowani)**

**Plik:** `api/_save-generation-core.js`  
**Linie:** ~290-350 (zapis device token)

**Zmiana struktury:**
```javascript
// PRZED:
const deviceData = {
  deviceToken: deviceToken,
  totalGenerations: 1,
  generations: [newGeneration]
};

// PO:
const deviceData = {
  deviceToken: deviceToken,
  totalGenerations: 1, // Suma wszystkich typów
  generationsByProductType: {
    [productType]: 1  // ✅ Per productType
  },
  generations: [newGeneration]
};
```

**Logika zapisu:**
1. Pobierz istniejący `device-{token}.json`
2. Jeśli nie istnieje → utwórz z `generationsByProductType: {}`
3. Inkrementuj `generationsByProductType[productType]`
4. Zaktualizuj `totalGenerations` (suma wszystkich typów)

**Backward compatibility:**
- Jeśli stary format (brak `generationsByProductType`) → konwertuj:
  ```javascript
  if (!deviceData.generationsByProductType) {
    // Stary format - konwertuj
    const oldTotal = deviceData.totalGenerations || 0;
    deviceData.generationsByProductType = {
      'other': oldTotal  // Wszystkie stare generacje → "other"
    };
  }
  ```

---

#### **KROK 1.3: Zmień sprawdzanie Device Token Limit**

**Plik:** `api/transform.js`  
**Linie:** ~573-605

**Zmiana:**
```javascript
// PRZED:
if (deviceData && deviceData.totalGenerations > 0) {
  return 403; // Blokada TOTAL
}

// PO:
// Sprawdź limit dla TEGO productType
const usedForThisType = deviceData.generationsByProductType?.[finalProductType] || 0;
if (usedForThisType >= 1) {
  console.warn(`❌ [TRANSFORM] Device token limit exceeded dla ${finalProductType}: ${usedForThisType}/1`);
  return res.status(403).json({
    error: 'Usage limit exceeded',
    message: `Wykorzystałeś limit generacji dla ${finalProductType} - zaloguj się po więcej`,
    showLoginModal: true,
    productType: finalProductType
  });
}
```

**Backward compatibility:**
- Jeśli brak `generationsByProductType` → sprawdź `totalGenerations` (stary format)

---

#### **KROK 1.4: Zmień strukturę Shopify Metafields (Zalogowani)**

**Plik:** `api/increment-usage.js`  
**Linie:** ~104-168

**Zmiana struktury:**
```javascript
// PRZED:
const currentUsage = parseInt(metafield.value || '0', 10);
const newUsage = currentUsage + 1;
// Zapisuje: "3" (liczba)

// PO:
// Parsuj JSON lub konwertuj stary format
let usageData;
try {
  usageData = JSON.parse(metafield.value || '{}');
} catch {
  // Stary format (liczba) → konwertuj
  const oldTotal = parseInt(metafield.value || '0', 10);
  usageData = {
    total: oldTotal,
    other: oldTotal  // Wszystkie stare → "other"
  };
}

// Inkrementuj dla TEGO productType
usageData[productType] = (usageData[productType] || 0) + 1;
usageData.total = Object.values(usageData).reduce((sum, val) => {
  return typeof val === 'number' && val !== usageData.total ? sum + val : sum;
}, 0);

// Zapisuje: JSON string
const newValue = JSON.stringify(usageData);
```

**Zmiana typu metafield:**
- Z `number_integer` na `json` (Shopify automatycznie konwertuje)

---

#### **KROK 1.5: Zmień sprawdzanie Shopify Metafields Limit**

**Plik:** `api/transform.js`  
**Linie:** ~611-657

**Zmiana:**
```javascript
// PRZED:
const usedCount = parseInt(customer?.metafield?.value || '0', 10);
if (usedCount >= 3) {
  return 403; // Blokada TOTAL
}

// PO:
// Parsuj JSON lub konwertuj stary format
let usageData;
try {
  usageData = JSON.parse(customer?.metafield?.value || '{}');
} catch {
  // Stary format (liczba) → konwertuj
  const oldTotal = parseInt(customer?.metafield?.value || '0', 10);
  usageData = {
    total: oldTotal,
    other: oldTotal
  };
}

// Sprawdź limit dla TEGO productType
const usedForThisType = usageData[finalProductType] || 0;
if (usedForThisType >= 3) {
  console.warn(`❌ [TRANSFORM] Limit przekroczony dla ${finalProductType}: ${usedForThisType}/3`);
  return res.status(403).json({
    error: 'Usage limit exceeded',
    message: `Wykorzystałeś wszystkie transformacje dla ${finalProductType} (3). Skontaktuj się z nami dla więcej.`,
    usedCount: usedForThisType,
    totalLimit: 3,
    productType: finalProductType
  });
}
```

---

#### **KROK 1.6: Zmień `api/check-usage.js` (Frontend check)**

**Plik:** `api/check-usage.js`  
**Linie:** ~109-126

**Zmiana:**
```javascript
// PRZED:
const usedCount = parseInt(customer?.metafield?.value || '0', 10);
return res.json({
  totalLimit: 3,
  usedCount: usedCount,
  remainingCount: 3 - usedCount
});

// PO:
// Parsuj JSON lub konwertuj stary format
let usageData;
try {
  usageData = JSON.parse(customer?.metafield?.value || '{}');
} catch {
  const oldTotal = parseInt(customer?.metafield?.value || '0', 10);
  usageData = { total: oldTotal, other: oldTotal };
}

// Zwróć per productType (jeśli productType w request)
const { productType } = req.body;
if (productType) {
  const usedForThisType = usageData[productType] || 0;
  return res.json({
    isLoggedIn: true,
    totalLimit: 3,
    usedCount: usedForThisType,
    remainingCount: Math.max(0, 3 - usedForThisType),
    byProductType: usageData,
    productType: productType
  });
}

// Fallback: zwróć total (dla backward compatibility)
return res.json({
  isLoggedIn: true,
  totalLimit: 3,
  usedCount: usageData.total || 0,
  remainingCount: Math.max(0, 3 - (usageData.total || 0)),
  byProductType: usageData
});
```

---

### **FAZA 2: Frontend (localStorage per productType)**

#### **KROK 2.1: Zmień `checkUsageLimit()`**

**Plik:** `public/customify.js`  
**Linie:** ~868-915

**Zmiana:**
```javascript
// PRZED:
const localCount = this.getLocalUsageCount(); // TOTAL
if (localCount >= 1) {
  this.showLoginModal(localCount, 1);
  return false;
}

// PO:
// Pobierz productType z aktualnie wybranego stylu
const productType = this.getProductTypeFromStyle(this.selectedStyle);
const localCount = this.getLocalUsageCount(productType); // Per productType
if (localCount >= 1) {
  this.showLoginModal(localCount, 1, productType);
  return false;
}
```

---

#### **KROK 2.2: Zmień `getLocalUsageCount()`**

**Plik:** `public/customify.js`  
**Funkcja:** `getLocalUsageCount()`

**Zmiana:**
```javascript
// PRZED:
getLocalUsageCount() {
  return parseInt(localStorage.getItem('customify_usage_count') || '0', 10);
}

// PO:
getLocalUsageCount(productType) {
  if (!productType) {
    // Fallback: suma wszystkich typów (backward compatibility)
    const allTypes = ['boho', 'king', 'cats', 'caricature', 'watercolor', 'other'];
    return allTypes.reduce((sum, type) => {
      return sum + parseInt(localStorage.getItem(`customify_usage_${type}`) || '0', 10);
    }, 0);
  }
  const key = `customify_usage_${productType}`;
  return parseInt(localStorage.getItem(key) || '0', 10);
}
```

---

#### **KROK 2.3: Zmień `incrementLocalUsage()`**

**Plik:** `public/customify.js`  
**Funkcja:** `incrementLocalUsage()` (lub gdzie zapisuje do localStorage)

**Zmiana:**
```javascript
// PRZED:
incrementLocalUsage() {
  const current = parseInt(localStorage.getItem('customify_usage_count') || '0', 10);
  localStorage.setItem('customify_usage_count', String(current + 1));
}

// PO:
incrementLocalUsage(productType) {
  if (!productType) {
    productType = 'other'; // Fallback
  }
  const key = `customify_usage_${productType}`;
  const current = parseInt(localStorage.getItem(key) || '0', 10);
  localStorage.setItem(key, String(current + 1));
}
```

---

#### **KROK 2.4: Dodaj `getProductTypeFromStyle()`**

**Plik:** `public/customify.js`  
**Nowa funkcja:**

```javascript
getProductTypeFromStyle(style) {
  // Mapowanie styl → productType (zgodne z backend)
  const styleToProductType = {
    'minimalistyczny': 'boho',
    'realistyczny': 'boho',
    'krol-krolewski': 'king',
    'krol-majestatyczny': 'king',
    'krol-triumfalny': 'king',
    'krol-imponujacy': 'king',
    'krolewski': 'cats',
    'na-tronie': 'cats',
    'wojenny': 'cats',
    'wiktorianski': 'cats',
    'renesansowy': 'cats',
    'karykatura': 'caricature',
    'akwarela': 'watercolor'
  };
  
  return styleToProductType[style] || 'other';
}
```

---

#### **KROK 2.5: Przekaż `productType` do `transformImage()`**

**Plik:** `public/customify.js`  
**Funkcja:** `transformImage()` (linia ~2098)

**Zmiana:**
```javascript
// PRZED:
const productType = this.selectedProductType || 'canvas'; // Z DOM

// PO:
const styleProductType = this.getProductTypeFromStyle(this.selectedStyle);
const productType = styleProductType || this.selectedProductType || 'other';
// ✅ Użyj productType z stylu (zgodne z backend)
```

---

### **FAZA 3: Testowanie**

#### **KROK 3.1: Test Device Token (Niezalogowani)**

**Scenariusz:**
1. Otwórz incognito
2. Wygeneruj obraz w stylu "boho" → ✅ Powinno działać
3. Spróbuj ponownie "boho" → ❌ Powinno zablokować
4. Wygeneruj obraz w stylu "king" → ✅ Powinno działać (inny productType!)
5. Spróbuj ponownie "king" → ❌ Powinno zablokować

**Oczekiwany wynik:**
- Device token: `{ generationsByProductType: { boho: 1, king: 1 } }`
- Limit działa per productType

---

#### **KROK 3.2: Test Shopify Metafields (Zalogowani)**

**Scenariusz:**
1. Zaloguj się
2. Wygeneruj 3 obrazy w stylu "boho" → ✅ Powinno działać
3. Spróbuj 4. "boho" → ❌ Powinno zablokować
4. Wygeneruj 3 obrazy w stylu "king" → ✅ Powinno działać (inny productType!)
5. Spróbuj 4. "king" → ❌ Powinno zablokować

**Oczekiwany wynik:**
- Shopify metafield: `{"boho": 3, "king": 3, "total": 6}`
- Limit działa per productType

---

#### **KROK 3.3: Test Backward Compatibility**

**Scenariusz:**
1. Stary device token (bez `generationsByProductType`) → powinien działać
2. Stary Shopify metafield (`"3"` zamiast JSON) → powinien działać
3. Frontend bez `productType` → powinien działać (fallback)

**Oczekiwany wynik:**
- Wszystkie stare dane są konwertowane automatycznie
- Brak błędów

---

### **FAZA 4: Wdrożenie**

#### **KROK 4.1: Commit i Push**

```bash
git add .
git commit -m "Feature: Limity per productType (1 dla niezalogowanych, 3 dla zalogowanych)

- api/transform.js: Używa config.productType zamiast body.productType
- api/_save-generation-core.js: Device token z generationsByProductType
- api/increment-usage.js: Shopify metafields jako JSON per productType
- api/check-usage.js: Zwraca limity per productType
- public/customify.js: localStorage per productType
- Backward compatibility: Automatyczna konwersja starych danych"
git push origin main
```

---

#### **KROK 4.2: Monitorowanie (24h)**

**Co sprawdzać:**
- Logi Vercel: błędy parsowania JSON
- Logi Vercel: backward compatibility warnings
- Testy manualne: każdy productType
- Sprawdź Vercel Blob: czy struktura jest poprawna

---

## 🔄 ROLLBACK PLAN

### **Jeśli coś pójdzie nie tak:**

#### **Opcja 1: Revert commit**
```bash
git revert HEAD
git push origin main
```

#### **Opcja 2: Quick fix (tylko jeśli małe błędy)**
- Dodać fallback do starego formatu
- Logować błędy bez blokowania

---

## ✅ CHECKLIST WDROŻENIA

### **Przed wdrożeniem:**
- [ ] Kod przetestowany lokalnie
- [ ] Backward compatibility działa
- [ ] Wszystkie pliki zmienione
- [ ] Testy manualne wykonane

### **Podczas wdrożenia:**
- [ ] Commit i push wykonany
- [ ] Vercel deploy zakończony
- [ ] Logi Vercel sprawdzone (brak błędów)

### **Po wdrożeniu:**
- [ ] Test Device Token (niezalogowani) ✅
- [ ] Test Shopify Metafields (zalogowani) ✅
- [ ] Test Backward Compatibility ✅
- [ ] Monitorowanie 24h ✅

---

## 📊 OCZEKIWANE REZULTATY

### **Przed:**
- Niezalogowany: 1 generacja TOTAL
- Zalogowany: 3 generacje TOTAL

### **Po:**
- Niezalogowany: 1 generacja per productType (np. 5 typów = 5 generacji)
- Zalogowany: 3 generacje per productType (np. 5 typów = 15 generacji)

### **Przykład:**
- User niezalogowany może zrobić:
  - 1x boho ✅
  - 1x king ✅
  - 1x cats ✅
  - 1x caricature ✅
  - 1x watercolor ✅
  - **Total: 5 generacji** (zamiast 1!)

---

## 🎯 SUKCES = WSZYSTKIE CHECKLISTY ✅

**Gotowy do wdrożenia!** 🚀

