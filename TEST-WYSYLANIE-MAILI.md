# 🧪 TEST: Wysyłanie maili z obrazkiem generacji

## 🎯 CEL
Przetestowanie wysyłania maili z obrazkiem generacji do zalogowanego użytkownika.

---

## 📝 METODA 1: Test przez endpoint (Resend)

### **Krok 1: Przygotuj dane**

Potrzebujesz:
- Email użytkownika (twój email do testów)
- URL obrazu z Vercel Blob (np. z localStorage lub logów)

### **Krok 2: Wyślij test request**

**Przez curl:**
```bash
curl -X POST https://customify-s56o.vercel.app/api/test-send-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "twoj-email@example.com",
    "imageUrl": "https://vzwqqb14qtsxe2wx.public.blob.vercel-storage.com/customify/temp/generation-watermarked-1764104403915.jpg",
    "style": "pixar",
    "size": "medium",
    "method": "resend"
  }'
```

**Przez przeglądarkę (DevTools Console):**
```javascript
fetch('https://customify-s56o.vercel.app/api/test-send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'twoj-email@example.com',
    imageUrl: 'https://vzwqqb14qtsxe2wx.public.blob.vercel-storage.com/customify/temp/generation-watermarked-1764104403915.jpg',
    style: 'pixar',
    size: 'medium',
    method: 'resend'
  })
})
.then(r => r.json())
.then(console.log);
```

### **Krok 3: Sprawdź skrzynkę mailową**

1. Otwórz skrzynkę mailową
2. Sprawdź folder SPAM (jeśli nie ma w głównej)
3. Sprawdź czy:
   - ✅ Email dotarł
   - ✅ Obrazek się wyświetla
   - ✅ Link do galerii działa

### **Krok 4: Sprawdź logi**

```bash
vercel logs customify-s56o.vercel.app | grep "TEST-SEND-EMAIL"
```

---

## 📝 METODA 2: Test przez Shopify (Customer Notification API)

### **Krok 1: Pobierz customerId**

**Z localStorage (frontend):**
```javascript
// W DevTools Console na stronie lumly.pl
const customerInfo = JSON.parse(localStorage.getItem('customify_customer_info'));
console.log('Customer ID:', customerInfo?.id);
```

**Z GraphQL (backend):**
```javascript
// W api/transform.js - sprawdź logi
// Customer ID jest w logach po zalogowaniu
```

### **Krok 2: Wyślij test request**

```bash
curl -X POST https://customify-s56o.vercel.app/api/test-send-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "twoj-email@example.com",
    "customerId": "24364235915589",
    "imageUrl": "https://vzwqqb14qtsxe2wx.public.blob.vercel-storage.com/customify/temp/generation-watermarked-1764104403915.jpg",
    "style": "pixar",
    "size": "medium",
    "method": "shopify"
  }'
```

**⚠️ UWAGA:** Shopify `send_invite` może nie obsługiwać HTML/images - sprawdź czy obrazek się wyświetla.

---

## 📝 METODA 3: Test przez Shopify Flow (automatyczny)

### **Krok 1: Ustaw metafield na customer**

**Endpoint testowy:**
```bash
curl -X POST https://customify-s56o.vercel.app/api/test-set-metafield \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "24364235915589",
    "imageUrl": "https://vzwqqb14qtsxe2wx.public.blob.vercel-storage.com/customify/temp/generation-watermarked-1764104403915.jpg",
    "style": "pixar",
    "size": "medium"
  }'
```

**Lub ręcznie w kodzie:**
```javascript
// W api/_save-generation-core.js - po zapisie generacji
// Metafield zostanie ustawiony automatycznie
```

### **Krok 2: Shopify Flow wyśle email**

1. Shopify Flow wykryje zmianę metafield
2. Wywoła workflow "Send email"
3. Email zostanie wysłany przez Shopify Email

### **Krok 3: Sprawdź skrzynkę mailową**

---

## 📝 METODA 4: Test przez rzeczywistą generację

### **Krok 1: Wygeneruj obraz jako zalogowany użytkownik**

1. Zaloguj się na https://lumly.pl
2. Przejdź do produktu (np. Boho, Król, Koty)
3. Wgraj zdjęcie i wybierz styl
4. Wygeneruj obraz

### **Krok 2: Sprawdź czy email został wysłany**

**Sprawdź logi:**
```bash
vercel logs customify-s56o.vercel.app | grep "SEND-EMAIL\|SAVE-GENERATION"
```

**Sprawdź metafield:**
- Shopify Admin → Customers → [Twój customer] → Metafields
- Powinien być: `customify.generation_ready`

### **Krok 3: Sprawdź skrzynkę mailową**

---

## ✅ CHECKLIST TESTÓW:

- [ ] **Test 1:** Endpoint testowy (Resend) - obrazek wyświetla się
- [ ] **Test 2:** Endpoint testowy (Shopify) - email dotarł
- [ ] **Test 3:** Shopify Flow - metafield ustawiony
- [ ] **Test 4:** Rzeczywista generacja - email wysłany automatycznie
- [ ] **Test 5:** Sprawdź różne klienty email (Gmail, Outlook, etc.)

---

## 🔍 ROZWIĄZYWANIE PROBLEMÓW:

### **Problem 1: Email nie dotarł**

**Sprawdź:**
1. Folder SPAM
2. Logi Vercel: `vercel logs customify-s56o.vercel.app | grep "TEST-SEND-EMAIL"`
3. Czy `RESEND_API_KEY` jest ustawiony (dla Resend)
4. Czy `SHOPIFY_ACCESS_TOKEN` jest ustawiony (dla Shopify)

### **Problem 2: Obrazek nie wyświetla się w emailu**

**Sprawdź:**
1. Czy URL obrazu jest dostępny (otwórz w przeglądarce)
2. Czy email klient blokuje zewnętrzne obrazy (Gmail, Outlook)
3. Spróbuj proxy endpoint: `/api/proxy-image?url=...`

### **Problem 3: Shopify Flow nie wysyła emaila**

**Sprawdź:**
1. Czy workflow jest aktywny w Shopify Flow
2. Czy metafield został ustawiony (Shopify Admin → Customers → Metafields)
3. Czy template emaila jest poprawny

---

## 🎯 REKOMENDACJA:

**Dla szybkiego testu:**
- Użyj **METODA 1** (endpoint testowy z Resend)

**Dla testu produkcyjnego:**
- Użyj **METODA 4** (rzeczywista generacja)

**Dla automatyzacji:**
- Użyj **METODA 3** (Shopify Flow)

---

**Status:** 📝 Instrukcje gotowe do testowania
**Data:** 2025-01-XX
**Autor:** AI Assistant

