# 🧪 INSTRUKCJA TESTOWANIA WATERMARK PNG

## 📋 CO TO JEST

Endpoint testowy `/api/test-watermark` który:
1. Pobiera testowy obrazek (domyślnie z `public/koty/krolewski.png`)
2. Pobiera watermark PNG (z `public/watermark.png`)
3. Generuje watermark Sharp composite (nakłada PNG w siatce)
4. Zapisuje do Vercel Blob Storage
5. Zwraca URL do sprawdzenia

**Nie wpływa na działający sklep** - tylko test!

---

## 🚀 JAK PRZETESTOWAĆ

### **Krok 1: Utwórz watermark PNG**

Utwórz plik `public/watermark.png`:
- **Rozmiar**: 2000x2000px (lub większy)
- **Format**: PNG z przezroczystością
- **Tekst**: "Lumly.pl" (lub "LUMLY.PL")
- **Obrót**: -30° (diagonalnie)
- **Kolor**: Biały tekst z czarnym obramowaniem (lub jak chcesz)
- **Tło**: Przezroczyste

**Jak utworzyć:**
- Figma/Photoshop: Utwórz tekst, obróć -30°, export PNG
- Online: Użyj Canva/Photopea z przezroczystością
- Lokalnie: Użyj ImageMagick/Sharp do generowania

**Przykład komendy ImageMagick:**
```bash
convert -size 2000x2000 xc:transparent \
  -font Arial -pointsize 200 -fill white -stroke black -strokewidth 2 \
  -gravity center -annotate +0+0 "LUMLY.PL" \
  -rotate -30 \
  watermark.png
```

### **Krok 2: Upload watermark.png do Vercel**

**Opcja A: Przez GitHub**
```bash
# Dodaj plik do public/watermark.png
git add public/watermark.png
git commit -m "Add watermark PNG for testing"
git push origin main
# Vercel automatycznie wdroży
```

**Opcja B: Przez Vercel Dashboard**
- Vercel Dashboard → Storage → Upload `watermark.png` do `public/`

### **Krok 3: Wywołaj endpoint testowy**

**GET Request (używa domyślny obrazek):**
```bash
curl https://customify-s56o.vercel.app/api/test-watermark
```

**Lub w przeglądarce:**
```
https://customify-s56o.vercel.app/api/test-watermark
```

**POST Request (użyj własny obrazek):**
```bash
curl -X POST https://customify-s56o.vercel.app/api/test-watermark \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://customify-s56o.vercel.app/koty/krolewski.png"}'
```

### **Krok 4: Sprawdź wyniki**

Odpowiedź JSON:
```json
{
  "success": true,
  "message": "Watermark PNG test completed successfully",
  "results": {
    "testImageUrl": "https://customify-s56o.vercel.app/koty/krolewski.png",
    "testImageSize": "896x1152",
    "watermarkUrl": "https://customify-s56o.vercel.app/watermark.png",
    "watermarkSize": "89px",
    "watermarkedImageUrl": "https://[blob-url]/customify/test/watermark-test-1234567890.jpg",
    "originalSize": 123456,
    "watermarkedSize": 234567,
    "compressionRatio": "5.2%"
  }
}
```

**Sprawdź wynik:**
- Otwórz `watermarkedImageUrl` w przeglądarce
- Sprawdź czy watermark jest widoczny
- Sprawdź czy watermark jest powtarzany w siatce diagonalnej
- Sprawdź czy nie ma problemów z fontami (powinno być OK - to PNG!)

---

## ✅ CO SPRAWDZIĆ

### **Jeśli wszystko działa:**
- ✅ Watermark jest widoczny (tekst "Lumly.pl" lub "LUMLY.PL")
- ✅ Watermark jest powtarzany w siatce diagonalnej
- ✅ Watermark ma przezroczyste tło (nie zasłania obrazu)
- ✅ Obraz z watermarkiem jest zapisany w Vercel Blob
- ✅ URL działa i można otworzyć w przeglądarce

### **Jeśli są problemy:**

#### **Problem: "Watermark PNG not found"**
- Sprawdź czy `public/watermark.png` istnieje
- Sprawdź czy plik jest dostępny przez URL: `https://customify-s56o.vercel.app/watermark.png`
- Sprawdź czy Vercel wdrożył zmiany (może potrzebować redeploy)

#### **Problem: "Sharp not available"**
- Sprawdź czy Sharp jest zainstalowany: `npm list sharp`
- Sprawdź Vercel Logs czy Sharp się ładuje
- Może potrzebować redeploy

#### **Problem: "Vercel Blob Storage not configured"**
- Sprawdź czy `customify_READ_WRITE_TOKEN` jest ustawiony w Vercel
- Vercel Dashboard → Settings → Environment Variables

#### **Problem: Watermark nie jest widoczny**
- Sprawdź czy watermark PNG ma przezroczyste tło
- Sprawdź czy watermark PNG ma odpowiedni rozmiar (nie za mały)
- Sprawdź czy watermark PNG ma tekst (nie jest pusty)

#### **Problem: Watermark jest za duży/za mały**
- Zmień `watermarkSize` w kodzie (obecnie 10% rozmiaru obrazu)
- Możesz zmienić: `const watermarkSize = Math.min(width, height) * 0.15;` (15% zamiast 10%)

---

## 📊 PRZYKŁADOWE WYNIKI

### **Sukces:**
```
✅ [TEST-WATERMARK] Starting watermark PNG test...
📥 [TEST-WATERMARK] Using default test image: https://customify-s56o.vercel.app/koty/krolewski.png
✅ [TEST-WATERMARK] Test image loaded: 123456 bytes
📥 [TEST-WATERMARK] Fetching watermark PNG: https://customify-s56o.vercel.app/watermark.png
✅ [TEST-WATERMARK] Watermark PNG loaded: 45678 bytes
📐 [TEST-WATERMARK] Test image dimensions: 896x1152
📏 [TEST-WATERMARK] Watermark size: 89px
✅ [TEST-WATERMARK] Watermark tile resized: 12345 bytes
🎨 [TEST-WATERMARK] Applying watermark with Sharp composite...
✅ [TEST-WATERMARK] Watermark applied successfully: 234567 bytes
📤 [TEST-WATERMARK] Uploading to Vercel Blob: customify/test/watermark-test-1234567890.jpg
✅ [TEST-WATERMARK] Uploaded successfully: https://[blob-url]/...
```

### **Błąd:**
```
❌ [TEST-WATERMARK] Error: Watermark PNG not found
❌ [TEST-WATERMARK] Error stack: ...
```

---

## 🎯 NASTĘPNE KROKI

### **Jeśli test działa:**
1. ✅ Watermark PNG jest widoczny i działa
2. ✅ Sharp composite działa poprawnie
3. ✅ Upload do Vercel Blob działa
4. **Możesz wdrożyć to w `transform.js`** (z feature flagiem dla bezpieczeństwa)

### **Jeśli test nie działa:**
1. Sprawdź błędy w odpowiedzi JSON
2. Sprawdź Vercel Logs dla szczegółów
3. Napraw problemy (watermark PNG, Sharp, Blob token)
4. Przetestuj ponownie

---

## 🔧 DOSTOSOWANIE TESTU

### **Zmiana rozmiaru watermarku:**
W `api/test-watermark.js` linia z `watermarkSize`:
```javascript
// Obecnie: 10% rozmiaru obrazu
const watermarkSize = Math.min(width, height) * 0.1;

// Większy: 15%
const watermarkSize = Math.min(width, height) * 0.15;

// Mniejszy: 5%
const watermarkSize = Math.min(width, height) * 0.05;
```

### **Zmiana jakości JPEG:**
W `api/test-watermark.js` linia z `.jpeg()`:
```javascript
// Obecnie: 92%
.jpeg({ quality: 92 })

// Wyższa jakość: 95%
.jpeg({ quality: 95 })

// Niższa jakość (mniejszy plik): 85%
.jpeg({ quality: 85 })
```

### **Zmiana testowego obrazka:**
W `api/test-watermark.js` linia z `testImageUrl`:
```javascript
// Obecnie: koty/krolewski.png
testImageUrl = 'https://customify-s56o.vercel.app/koty/krolewski.png';

// Inny obrazek:
testImageUrl = 'https://customify-s56o.vercel.app/krol/krol-styl-1.jpg';
```

---

## 📝 NOTATKI

- **Endpoint nie wpływa na działający sklep** - tylko test
- **Można wywołać wielokrotnie** - każdy test tworzy nowy plik w Vercel Blob
- **Pliki testowe** są zapisywane w `customify/test/` (można później usunąć)
- **Watermark PNG** powinien być dostępny publicznie (w `public/`)

---

## 🚨 WAŻNE

- **Nie commituj** zmian w `transform.js` przed testem
- **Przetestuj** endpoint kilka razy z różnymi obrazkami
- **Sprawdź** czy watermark wygląda dobrze wizualnie
- **Dopiero potem** wdrażaj w `transform.js` (z feature flagiem)

