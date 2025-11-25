# 🧪 TEST: Sprawdzanie czy obrazy z Vercel Blob działają w Shopify Email

## 🎯 CEL
Sprawdzenie czy obrazy z Vercel Blob Storage są dostępne i kompatybilne z Shopify Email.

---

## 📝 KROK 1: Pobierz URL obrazu z Vercel Blob

### **Sposób 1: Z logów Vercel**
```bash
# Sprawdź logi po generacji obrazu
vercel logs customify-s56o.vercel.app | grep "watermarkedImageUrl"

# Przykład URL:
# https://vzwqqb14qtsxe2wx.public.blob.vercel-storage.com/customify/temp/generation-watermarked-1234567890.jpg
```

### **Sposób 2: Z localStorage (frontend)**
1. Otwórz DevTools (F12)
2. Console → wpisz:
```javascript
const generations = JSON.parse(localStorage.getItem('customify_ai_generations'));
if (generations && generations.length > 0) {
  console.log('Watermarked URL:', generations[0].watermarkedImageUrl);
  console.log('Transformed URL:', generations[0].transformedImage);
}
```

### **Sposób 3: Z API response**
Po generacji obrazu, sprawdź response z `/api/transform`:
```json
{
  "success": true,
  "transformedImage": "https://...",
  "watermarkedImageUrl": "https://..."
}
```

---

## 📝 KROK 2: Test dostępności obrazu

### **Test 1: Endpoint testowy**

**URL:**
```
https://customify-s56o.vercel.app/api/test-image-accessibility?url=TWÓJ_URL
```

**Przykład:**
```bash
curl "https://customify-s56o.vercel.app/api/test-image-accessibility?url=https://vzwqqb14qtsxe2wx.public.blob.vercel-storage.com/customify/temp/generation-watermarked-1234567890.jpg"
```

**Response:**
```json
{
  "url": "https://...",
  "tests": {
    "httpAccess": {
      "status": 200,
      "accessible": true,
      "headers": {
        "content-type": "image/jpeg",
        "content-length": "123456"
      }
    },
    "contentType": {
      "value": "image/jpeg",
      "isImage": true,
      "valid": true
    },
    "download": {
      "success": true,
      "size": 123456,
      "validImageFormat": true
    },
    "cors": {
      "shopifyEmailCompatible": true
    }
  },
  "summary": {
    "accessible": true,
    "shopifyEmailCompatible": true,
    "issues": []
  },
  "recommendation": "✅ Image is accessible and compatible with Shopify Email"
}
```

### **Test 2: Bezpośredni dostęp (przeglądarka)**

1. **Otwórz URL w przeglądarce:**
   ```
   https://vzwqqb14qtsxe2wx.public.blob.vercel-storage.com/customify/temp/generation-watermarked-1234567890.jpg
   ```

2. **Sprawdź:**
   - ✅ Obrazek się wyświetla → OK
   - ❌ Błąd 404/403 → Problem z dostępem
   - ❌ Błąd CORS → Problem z CORS (ale to nie powinno być problem dla Shopify Email)

### **Test 3: curl (terminal)**

```bash
# HEAD request (tylko headers)
curl -I "https://vzwqqb14qtsxe2wx.public.blob.vercel-storage.com/customify/temp/generation-watermarked-1234567890.jpg"

# GET request (pobierz obrazek)
curl -o test-image.jpg "https://vzwqqb14qtsxe2wx.public.blob.vercel-storage.com/customify/temp/generation-watermarked-1234567890.jpg"
```

**Oczekiwane headers:**
```
HTTP/2 200
content-type: image/jpeg
content-length: 123456
cache-control: public, max-age=31536000
access-control-allow-origin: *
```

---

## 📝 KROK 3: Test w Shopify Email

### **Metoda 1: Test email (ręcznie)**

1. **Utwórz test email w Shopify:**
   - Marketing → Shopify Email → Create email
   - Dodaj obrazek: `<img src="TWÓJ_URL" />`
   - Wyślij test email do siebie

2. **Sprawdź:**
   - ✅ Obrazek się wyświetla → OK
   - ❌ Obrazek nie wyświetla się → Problem z Shopify Email

### **Metoda 2: Shopify Flow (automatycznie)**

1. **Ustaw metafield na customer:**
   ```javascript
   // W api/_save-generation-core.js
   metafield: {
     namespace: 'customify',
     key: 'generation_ready',
     value: JSON.stringify({
       imageUrl: watermarkedImageUrl, // URL z Vercel Blob
       // ...
     })
   }
   ```

2. **Shopify Flow wyśle email:**
   - Sprawdź czy obrazek się wyświetla w emailu

---

## 📝 KROK 4: Rozwiązanie problemów

### **Problem 1: Obrazek nie wyświetla się w Shopify Email**

**Przyczyna:** Shopify Email może blokować zewnętrzne obrazy z powodów bezpieczeństwa.

**Rozwiązanie:** Użyj proxy endpoint:

**URL proxy:**
```
https://customify-s56o.vercel.app/api/proxy-image?url=TWÓJ_URL
```

**Przykład:**
```
https://customify-s56o.vercel.app/api/proxy-image?url=https://vzwqqb14qtsxe2wx.public.blob.vercel-storage.com/customify/temp/generation-watermarked-1234567890.jpg
```

**Zalety proxy:**
- ✅ Obrazek serwowany przez naszą domenę (lumly.pl/customify)
- ✅ Kontrola nad headers (Cache-Control, CORS)
- ✅ Backup jeśli Vercel Blob nie działa

### **Problem 2: Obrazek wyświetla się w przeglądarce, ale nie w emailu**

**Przyczyna:** Email klienty (Gmail, Outlook) mogą blokować zewnętrzne obrazy.

**Rozwiązanie:**
1. Użyj proxy endpoint (patrz Problem 1)
2. Lub upload obrazek do Shopify Files (Shopify CDN)

### **Problem 3: Błąd CORS**

**Przyczyna:** Vercel Blob może mieć restrykcje CORS.

**Rozwiązanie:** 
- Vercel Blob public images nie powinny mieć problemów z CORS
- Jeśli problem występuje → użyj proxy endpoint

---

## 📝 KROK 5: Automatyczny test (opcjonalnie)

### **Skrypt testowy:**

```javascript
// test-vercel-blob.js
async function testVercelBlobImage(url) {
  console.log('🧪 Testing Vercel Blob image:', url);
  
  // Test 1: HTTP Access
  const response = await fetch(url, { method: 'HEAD' });
  console.log('✅ HTTP Access:', response.ok ? 'OK' : 'FAILED', response.status);
  
  // Test 2: Download
  const imageResponse = await fetch(url);
  const buffer = await imageResponse.arrayBuffer();
  console.log('✅ Download:', buffer.byteLength > 0 ? 'OK' : 'FAILED', buffer.byteLength, 'bytes');
  
  // Test 3: Content-Type
  const contentType = response.headers.get('content-type');
  console.log('✅ Content-Type:', contentType?.startsWith('image/') ? 'OK' : 'FAILED', contentType);
  
  // Test 4: Proxy
  const proxyUrl = `https://customify-s56o.vercel.app/api/proxy-image?url=${encodeURIComponent(url)}`;
  const proxyResponse = await fetch(proxyUrl);
  console.log('✅ Proxy:', proxyResponse.ok ? 'OK' : 'FAILED', proxyResponse.status);
  
  return {
    httpAccess: response.ok,
    download: buffer.byteLength > 0,
    contentType: contentType?.startsWith('image/'),
    proxy: proxyResponse.ok
  };
}

// Użycie:
testVercelBlobImage('https://vzwqqb14qtsxe2wx.public.blob.vercel-storage.com/customify/temp/generation-watermarked-1234567890.jpg');
```

---

## ✅ CHECKLIST TESTÓW:

- [ ] **Test 1:** Endpoint testowy (`/api/test-image-accessibility`)
- [ ] **Test 2:** Bezpośredni dostęp w przeglądarce
- [ ] **Test 3:** curl (terminal)
- [ ] **Test 4:** Test email w Shopify Email
- [ ] **Test 5:** Proxy endpoint (`/api/proxy-image`)
- [ ] **Test 6:** Shopify Flow (automatyczny email)

---

## 🎯 PODSUMOWANIE:

### **Oczekiwane wyniki:**

1. **Vercel Blob URL:**
   - ✅ HTTP 200 OK
   - ✅ Content-Type: image/jpeg
   - ✅ Obrazek dostępny publicznie
   - ✅ Shopify Email może wyświetlić (jeśli URL jest publiczny)

2. **Proxy URL:**
   - ✅ HTTP 200 OK
   - ✅ Content-Type: image/jpeg
   - ✅ Obrazek serwowany przez naszą domenę
   - ✅ Shopify Email powinien wyświetlić (backup)

### **Rekomendacja:**

**Jeśli Vercel Blob działa:**
- Użyj bezpośrednio URL z Vercel Blob w Shopify Email

**Jeśli Vercel Blob nie działa:**
- Użyj proxy endpoint: `/api/proxy-image?url=...`

**Jeśli oba nie działają:**
- Upload obrazek do Shopify Files (Shopify CDN)

---

**Status:** 📝 Instrukcje gotowe do testowania
**Data:** 2025-01-XX
**Autor:** AI Assistant

