# 🧪 INSTRUKCJA TESTOWANIA WATERMARKU

## ✅ Wdrożono zmiany:
- Dodano szczegółowe logi debugowania do `addWatermark()`
- Implementacja: `document.fonts.ready` + systemowe fonty + UPPERCASE bez polskich znaków
- Status: **WDROŻONE NA SHOPIFY** (https://lumly.pl)

## 📋 JAK PRZETESTOWAĆ:

### **KROK 1: Otwórz stronę produktu**
1. Otwórz: https://lumly.pl/products/personalizowany-portret-w-stylu-boho
2. Otwórz DevTools (F12 lub Cmd+Option+I na Mac)
3. Przejdź do zakładki **Console**

### **KROK 2: Wgraj zdjęcie i generuj**
1. Kliknij "Wybierz zdjęcie" i wgraj dowolne zdjęcie
2. Wybierz styl (np. "Minimalistyczny")
3. Wybierz rozmiar (np. "A4")
4. Kliknij "Generuj"

### **KROK 3: Sprawdź logi w konsoli**

Powinny pojawić się **szczegółowe logi** z prefiksem `[WATERMARK DEBUG]`:

```
🔤 [WATERMARK DEBUG] START - imageUrl: data:image/jpeg;base64,/9j/4AAQ...
🔤 [WATERMARK DEBUG] document.fonts.status: loaded
🔤 [WATERMARK DEBUG] Czekam na document.fonts.ready...
✅ [WATERMARK DEBUG] document.fonts.ready - fonty załadowane!
🖼️ [WATERMARK DEBUG] Image loaded: 896 x 1152
✅ [WATERMARK DEBUG] Original image drawn on canvas
📏 [WATERMARK DEBUG] fontSize: 92
🔤 [WATERMARK DEBUG] Font ustawiony: bold 92px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif
🔍 [WATERMARK DEBUG] Test measureText("TEST"): { width: XXX, ... }
✅ [WATERMARK DEBUG] Font test OK! width=XXX
🧪 [WATERMARK DEBUG] Test canvas rendering: data:image/png;base64,iVBOR...
🔄 [WATERMARK DEBUG] Canvas rotated -30°
📝 [WATERMARK DEBUG] Teksty watermarku: ["LUMLY.PL", "PODGLAD"]
📏 [WATERMARK DEBUG] Spacing: 268
✅ [WATERMARK DEBUG] Narysowano XX watermarków
✅ [WATERMARK DEBUG] Canvas.toDataURL() - rozmiar: XXXXX znaków ( X.XX MB)
✅ [WATERMARK DEBUG] Result preview: data:image/jpeg;base64,/9j/4AAQ...
```

### **KROK 4: Sprawdź watermark wizualnie**

Po transformacji powinieneś zobaczyć:
- ✅ **Tekst "LUMLY.PL"** i **"PODGLAD"** (nie kwadraty □)
- ✅ Tekst ułożony diagonalnie (-30°)
- ✅ Tekst powtarzający się w siatce
- ✅ Biały tekst z czarnym obramowaniem

### **KROK 5: Zrób screenshot**

1. **Screenshot podglądu** z watermarkiem (cała strona)
2. **Screenshot konsoli** z logami `[WATERMARK DEBUG]`
3. **Zbliżenie na watermark** - czy widać tekst czy kwadraty?

---

## 🔍 CO SPRAWDZIĆ W LOGACH:

### ✅ **Jeśli wszystko działa:**
```
✅ [WATERMARK DEBUG] Font test OK! width=XXX  (width > 0)
✅ [WATERMARK DEBUG] Narysowano XX watermarków
```
→ **Watermark powinien być widoczny jako tekst**

### ❌ **Jeśli font nie działa:**
```
❌ [WATERMARK DEBUG] Font test FAILED! width=0, próbuję fallback monospace
🔄 [WATERMARK DEBUG] Fallback font: bold XXpx monospace
```
→ **Fallback na monospace, ale tekst powinien być widoczny**

### ❌ **Jeśli nadal kwadraty:**
Skopiuj **WSZYSTKIE** logi z `[WATERMARK DEBUG]` i prześlij mi.

---

## 📊 MOŻLIWE WYNIKI:

### **Scenariusz A: Działa! ✅**
- Tekst widoczny: "LUMLY.PL" i "PODGLAD"
- Logi: `Font test OK! width=XXX`
- **Akcja:** Commit zmian, koniec testów

### **Scenariusz B: Fallback działa ✅**
- Tekst widoczny (font monospace)
- Logi: `Font test FAILED! width=0, próbuję fallback`
- **Akcja:** Commit zmian, działa ale font systemowy nie załadowany

### **Scenariusz C: Nadal kwadraty ❌**
- Kwadraty zamiast tekstu
- Logi: ???
- **Akcja:** Prześlij logi, iterujemy dalej

---

## 🎯 NASTĘPNE KROKI:

1. **Przetestuj** według instrukcji powyżej
2. **Zrób screenshoty** (podgląd + konsola)
3. **Prześlij wyniki** - powiedz mi:
   - Czy widzisz tekst czy kwadraty?
   - Co pokazują logi?
   - Screenshot podglądu i konsoli

---

## 📝 DODATKOWE TESTY (opcjonalne):

### **Test 1: Różne przeglądarki**
- Chrome
- Firefox
- Safari (Mac/iOS)
- Edge

### **Test 2: Różne urządzenia**
- Desktop (Windows/Mac/Linux)
- Mobile (iOS/Android)

### **Test 3: Różne style**
- Boho (Minimalistyczny, Realistyczny)
- Król (wszystkie style)
- Koty (wszystkie style)

---

## ⚠️ WAŻNE:

- **Nie commituj** jeszcze - czekam na wyniki testów
- **Skopiuj WSZYSTKIE logi** z `[WATERMARK DEBUG]`
- **Zrób screenshot** podglądu i konsoli
- **Powiedz mi** czy widzisz tekst czy kwadraty

---

## 🔧 JEŚLI POTRZEBUJESZ POMOCY:

Prześlij mi:
1. Screenshot podglądu z watermarkiem
2. Screenshot konsoli z logami
3. Przeglądarka i system operacyjny
4. Czy to dotyczy wszystkich stylów czy tylko niektórych

Wtedy dam Ci **DOKŁADNE** rozwiązanie!

