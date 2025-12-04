# 📧 Analiza Systemu Wysyłania Maili po Generacji AI

## 🎯 TRIGGER - Co uruchamia wysyłanie maila?

### **1. Flow od generacji do maila:**

```
User generuje obraz → api/transform.js
  ↓
Transformacja AI (Replicate/Segmind)
  ↓
Upload obrazu na Vercel Blob Storage
  ↓
Wywołanie /api/save-generation-v2 (linia 2482 w transform.js)
  ↓
api/_save-generation-core.js (save-generation-v2 to alias)
  ↓
SPRAWDZENIE WARUNKÓW (linia 491)
  ↓
✅ Jeśli spełnione → WYSYŁANIE MAILA przez Resend
```

### **2. Dokładny trigger w kodzie:**

**Plik:** `api/transform.js`  
**Linia:** ~2482

```javascript
// Po udanej transformacji i uploadzie na Vercel Blob
const saveResponse = await fetch('https://customify-s56o.vercel.app/api/save-generation-v2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(saveData) // customerId, email, imageUrl, watermarkedImageUrl, style, size, productType
});
```

**Co jest w `saveData`:**
- `customerId` - ID klienta Shopify (tylko dla zalogowanych)
- `email` - Email klienta (pobrany z GraphQL dla zalogowanych)
- `imageUrl` - URL obrazu z Vercel Blob (bez watermarku)
- `watermarkedImageUrl` - URL obrazu z watermarkiem (dla emaili)
- `style` - Styl AI (np. "pixar", "krol-krolewski")
- `size` - Rozmiar (np. "a4", "a3")
- `productType` - Typ produktu (np. "boho", "king", "cats")
- `originalImageUrl` - Oryginalne zdjęcie użytkownika
- `productHandle` - Handle produktu Shopify

---

## ✅ WARUNKI WYSYŁANIA MAILA

### **Plik:** `api/_save-generation-core.js`  
**Linia:** 491

### **Warunki (WSZYSTKIE muszą być spełnione):**

```javascript
if (customerId && email && imageUrlForEmail && process.env.SHOPIFY_ACCESS_TOKEN) {
  // ✅ WYSYŁAJ MAILA
}
```

**Szczegóły:**
1. ✅ **`customerId`** - Musi istnieć (użytkownik ZALOGOWANY)
2. ✅ **`email`** - Musi być dostępny (pobrany z GraphQL w transform.js)
3. ✅ **`imageUrlForEmail`** - `watermarkedImageUrl || imageUrl` (priorytet: watermark)
4. ✅ **`SHOPIFY_ACCESS_TOKEN`** - Token Shopify API (z Vercel env variables)

### **Co się dzieje jeśli warunki NIE są spełnione:**

**Plik:** `api/_save-generation-core.js`  
**Linia:** 764-775

```javascript
console.log('⚠️ [SAVE-GENERATION] ===== EMAIL NIE ZOSTAŁ WYSŁANY =====');
if (!customerId) {
  console.log('❌ Pomijam email - brak customerId (niezalogowany)');
} else if (!email) {
  console.log('❌ Pomijam email - brak emaila');
} else if (!imageUrlForEmail) {
  console.log('❌ Pomijam email - brak watermarkedImageUrl');
} else if (!process.env.SHOPIFY_ACCESS_TOKEN) {
  console.log('❌ Pomijam email - brak SHOPIFY_ACCESS_TOKEN');
}
```

**WNIOSEK:** 
- ❌ **Niezalogowani użytkownicy NIE dostają maili** (brak `customerId`)
- ❌ **Zalogowani bez emaila NIE dostają maili** (brak email w GraphQL)
- ❌ **Bez obrazu NIE ma maila** (brak `watermarkedImageUrl` lub `imageUrl`)

---

## 📧 JAK DZIAŁA WYSYŁANIE PRZEZ RESEND

### **1. Kiedy używamy Resend:**

**ZAWSZE** - Resend to jedyny sposób wysyłania maili po generacji AI.

**Plik:** `api/_save-generation-core.js`  
**Linia:** 585-664

### **2. Proces wysyłania:**

#### **KROK 1: Sprawdzenie RESEND_API_KEY**
```javascript
if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY nie skonfigurowany - pomijam email');
  return; // Nie wysyłamy maila
}
```

#### **KROK 2: Inicjalizacja Resend**
```javascript
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
```

#### **KROK 3: Przygotowanie HTML emaila**
```javascript
const emailHtml = `
<!DOCTYPE html>
<html>
  <!-- Template HTML z obrazkiem, stylem, rozmiarem, linkiem do galerii -->
</html>
`;
```

**Zawartość emaila:**
- 🎨 Nagłówek: "🎨 Twoja generacja AI jest gotowa!"
- 📸 Obrazek: `watermarkedImageUrl` (z watermarkiem)
- 🔗 Link: "Zobacz wszystkie generacje →" → `https://lumly.pl/pages/my-generations`
- 📧 Reply-to: `biuro@lumly.pl`

#### **KROK 4: Wysłanie przez Resend API**
```javascript
const result = await resend.emails.send({
  from: 'Lumly <noreply@notification.lumly.pl>',
  reply_to: 'biuro@lumly.pl',
  to: email,
  subject: '🎨 Twoja generacja AI jest gotowa!',
  html: emailHtml
});

console.log('✅ Email wysłany pomyślnie!');
console.log('✅ Resend ID:', result.id);
```

### **3. Obsługa błędów:**

**Plik:** `api/_save-generation-core.js`  
**Linia:** 665-682

```javascript
try {
  // Wysyłanie maila
} catch (emailError) {
  console.error('❌ Exception podczas wysyłania emaila:', emailError);
  
  // ✅ SENTRY: Loguj błąd
  Sentry.captureException(emailError);
  
  // ⚠️ NIE BLOKUJ - email to nice-to-have, nie critical
  // Transformacja się udała, brak maila nie blokuje użytkownika
}
```

**WAŻNE:** Błąd wysyłania maila **NIE blokuje** odpowiedzi API - transformacja się udała, użytkownik dostaje obraz.

---

## 🔄 PEŁNY FLOW WYSYŁANIA MAILA

### **KROK PO KROKU:**

1. **User generuje obraz** (frontend → `api/transform.js`)
   - Upload zdjęcia
   - Wybór stylu
   - Transformacja AI

2. **Transformacja AI** (`api/transform.js`)
   - Replicate API (Boho, Pixar, Koty)
   - Segmind API (Król, Karykatura)
   - Upload wyniku na Vercel Blob

3. **Pobranie emaila** (`api/transform.js` - linia 1450-1495)
   - Dla zalogowanych: GraphQL query do Shopify
   - `customerEmailFromGraphQL = customer?.email`

4. **Zapis generacji** (`api/transform.js` - linia 2482)
   - Wywołanie `/api/save-generation-v2`
   - Przekazanie: `customerId`, `email`, `imageUrl`, `watermarkedImageUrl`

5. **Sprawdzenie warunków** (`api/_save-generation-core.js` - linia 491)
   - ✅ `customerId` istnieje?
   - ✅ `email` istnieje?
   - ✅ `imageUrlForEmail` istnieje?
   - ✅ `SHOPIFY_ACCESS_TOKEN` istnieje?

6. **Ustawienie metafield** (`api/_save-generation-core.js` - linia 502-583)
   - Metafield: `customify.generation_ready`
   - Zawartość: `{ imageUrl, style, size, productType, timestamp, galleryUrl }`
   - Cel: Dla Shopify Email template (opcjonalnie)

7. **Wysłanie maila przez Resend** (`api/_save-generation-core.js` - linia 585-664)
   - Sprawdzenie `RESEND_API_KEY`
   - Inicjalizacja Resend
   - Przygotowanie HTML
   - `resend.emails.send()`
   - Logowanie Resend ID

8. **Odpowiedź do frontendu**
   - Transformacja zwraca obraz (base64 lub URL)
   - Email wysłany w tle (nie blokuje odpowiedzi)

---

## 📊 STATYSTYKI I MONITORING

### **Logi do sprawdzenia:**

#### **1. Próby wysłania:**
```bash
vercel logs customify-s56o.vercel.app --since 24h | grep "Wysyłam email przez Resend"
```

#### **2. Sukces (Resend ID):**
```bash
vercel logs customify-s56o.vercel.app --since 24h | grep "Resend ID:"
```

#### **3. Błędy:**
```bash
vercel logs customify-s56o.vercel.app --since 24h | grep "Exception podczas wysyłania emaila"
```

#### **4. Pominięte (brak warunków):**
```bash
vercel logs customify-s56o.vercel.app --since 24h | grep "Pomijam email"
```

### **Resend Dashboard:**
- **URL:** https://resend.com/emails
- **Sprawdź:** Status maili (Delivered, Bounced, Failed, Delivery Delayed)
- **Filtruj:** Po dacie, temacie "🎨 Twoja generacja AI jest gotowa!"

---

## ⚙️ KONFIGURACJA

### **Wymagane zmienne środowiskowe (Vercel):**

1. **`RESEND_API_KEY`** - Klucz API Resend
   - **Cel:** Wysyłanie maili
   - **Gdzie:** Vercel Dashboard → Settings → Environment Variables
   - **Format:** `re_...`

2. **`SHOPIFY_ACCESS_TOKEN`** - Token Shopify API
   - **Cel:** Sprawdzenie warunków (musi istnieć)
   - **Gdzie:** Vercel Dashboard → Settings → Environment Variables

3. **`BLOB_READ_WRITE_TOKEN`** - Token Vercel Blob Storage
   - **Cel:** Upload obrazów (watermark)
   - **Gdzie:** Vercel Dashboard → Settings → Environment Variables

### **Domena email (Resend):**
- **From:** `Lumly <noreply@notification.lumly.pl>`
- **Reply-to:** `biuro@lumly.pl`
- **Wymagane:** Weryfikacja domeny `notification.lumly.pl` w Resend Dashboard

---

## 🚨 CZĘSTE PROBLEMY

### **1. Email nie wysyła się - brak customerId**
**Przyczyna:** Użytkownik niezalogowany  
**Rozwiązanie:** To jest zamierzone - tylko zalogowani dostają maile

### **2. Email nie wysyła się - brak emaila**
**Przyczyna:** GraphQL nie zwrócił emaila dla customerId  
**Sprawdź:** Logi `[METAFIELD-CHECK]` w `api/transform.js`

### **3. Email nie wysyła się - brak RESEND_API_KEY**
**Przyczyna:** Zmienna środowiskowa nie ustawiona  
**Rozwiązanie:** Dodaj `RESEND_API_KEY` w Vercel Dashboard

### **4. Email wysłany ale nie dotarł**
**Przyczyna:** Status "Delivery Delayed" w Resend  
**Sprawdź:** Resend Dashboard → Emails → Status  
**Rozwiązanie:** Resend automatycznie ponowi próbę (24-48h)

### **5. Email bez obrazka**
**Przyczyna:** `watermarkedImageUrl` jest null  
**Sprawdź:** Logi `[SAVE-GENERATION] imageUrlForEmail`

---

## 📝 PODSUMOWANIE

### **✅ CO DZIAŁA:**
- ✅ Automatyczne wysyłanie maili po generacji AI
- ✅ Tylko dla zalogowanych użytkowników
- ✅ HTML email z obrazkiem (watermark)
- ✅ Link do galerii "Moje generacje"
- ✅ Obsługa błędów (nie blokuje transformacji)
- ✅ Logowanie Resend ID dla trackingu

### **❌ CO NIE DZIAŁA:**
- ❌ Maile dla niezalogowanych (brak customerId)
- ❌ Maile bez obrazka (brak watermarkedImageUrl)
- ❌ Maile bez emaila (brak email w GraphQL)

### **🔧 CO MOŻNA ULEPSZYĆ:**
- 🔧 Retry mechanism dla błędów Resend
- 🔧 Queue system dla masowego wysyłania
- 🔧 A/B testing różnych template'ów emaili
- 🔧 Tracking otwarć i kliknięć (Resend Analytics)

---

**Data analizy:** 2025-01-XX  
**Wersja kodu:** `save-generation-core@2025-11-13T13:10`



