# 📧 PLAN: Wysyłanie maila do zalogowanego użytkownika po generacji

## 🎯 CEL
Wysyłanie automatycznego maila do zalogowanego użytkownika po udanej generacji AI z:
- Obrazkiem generacji (z watermarkiem)
- Linkiem do galerii "Moje generacje"
- Informacją o stylu i rozmiarze

---

## 📋 WYMAGANIA

### ✅ Co mamy:
- ✅ Email użytkownika dostępny w `api/transform.js` (z GraphQL dla zalogowanych)
- ✅ `watermarkedImageUrl` zapisywany w `save-generation-v2.js`
- ✅ Link do galerii: `https://lumly.pl/pages/my-generations`
- ✅ Customer ID dostępny w `api/transform.js`

### ❌ Czego potrzebujemy:
- ❌ Biblioteka do wysyłania maili (SendGrid, Resend, Nodemailer)
- ❌ Template emaila HTML
- ❌ Endpoint do wysyłania maila
- ❌ Integracja z `save-generation-v2.js`

---

## 🏗️ ARCHITEKTURA

### **Flow:**
```
1. User generuje obraz → api/transform.js
2. Obraz zapisany → api/save-generation-v2.js
3. Po zapisie → Wywołaj api/send-generation-email.js
4. Email wysłany → User otrzymuje mail z obrazkiem i linkiem
```

---

## 📝 KROK 1: Wybór metody wysyłania emaili

### **Opcje:**

#### **Opcja A: Shopify Flow + Shopify Email (Rekomendowane dla Shopify)**
- ✅ Wbudowane w Shopify (bez dodatkowych kosztów)
- ✅ Automatyzacja przez Shopify Flow
- ✅ Wsparcie dla HTML templates
- ✅ Integracja z Customer Account
- ⚠️ Wymaga konfiguracji w Shopify Admin UI
- ⚠️ Ograniczenia w personalizacji (trudniejsze dodanie obrazka z watermarkiem)

**Jak działa:**
1. Po zapisie generacji → ustaw metafield `email_sent: false`
2. Shopify Flow wykrywa zmianę metafield
3. Shopify Flow wywołuje Shopify Email z template
4. Email wysłany przez Shopify

**Instalacja:**
- Nie wymaga instalacji (wbudowane w Shopify)
- Wymaga konfiguracji w Shopify Admin → Settings → Shopify Flow

#### **Opcja B: Resend (Rekomendowane dla prostoty)**
- ✅ Prosty API
- ✅ Darmowy tier: 3,000 maili/miesiąc
- ✅ Dobra dokumentacja
- ✅ Wsparcie dla HTML templates
- ✅ Tracking (opcjonalnie)

**Instalacja:**
```bash
npm install resend
```

**Environment Variable:**
```
RESEND_API_KEY=re_...
```

#### **Opcja B: SendGrid**
- ✅ Popularna, sprawdzona
- ✅ Darmowy tier: 100 maili/dzień
- ✅ Więcej funkcji (analytics, templates)
- ⚠️ Większa złożoność

**Instalacja:**
```bash
npm install @sendgrid/mail
```

**Environment Variable:**
```
SENDGRID_API_KEY=SG...
```

#### **Opcja C: Nodemailer (SMTP)**
- ✅ Uniwersalna (działa z każdym SMTP)
- ✅ Możliwość użycia własnego serwera SMTP
- ⚠️ Wymaga konfiguracji SMTP

**Instalacja:**
```bash
npm install nodemailer
```

**Environment Variables:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
```

### **🎯 REKOMENDACJA: Shopify Flow + Shopify Email**
- ✅ Wbudowane w Shopify (bez dodatkowych kosztów)
- ✅ Automatyzacja bez kodu
- ✅ Integracja z Customer Account
- ✅ Wsparcie dla HTML templates
- ⚠️ Wymaga konfiguracji w Shopify Admin UI

**Alternatywa: Resend** (jeśli Shopify Flow jest zbyt skomplikowane)
- Prostsze w implementacji (tylko kod)
- Większa kontrola nad template
- Wymaga dodatkowego serwisu (ale darmowy tier wystarczy)

---

## 📝 KROK 1A: Implementacja przez Shopify Flow (OPCJA SHOPIFY)

### **Zalety:**
- ✅ Wbudowane w Shopify (bez dodatkowych kosztów)
- ✅ Automatyzacja bez kodu
- ✅ Integracja z Customer Account
- ✅ Wsparcie dla HTML templates

### **Wady:**
- ⚠️ Wymaga konfiguracji w Shopify Admin UI
- ⚠️ Ograniczenia w personalizacji (trudniejsze dodanie obrazka z watermarkiem)
- ⚠️ Trudniejsze debugowanie

### **Jak to działa:**

#### **1. Ustaw metafield po zapisie generacji:**
```javascript
// W api/_save-generation-core.js, po zapisie generacji
if (customerId && email && watermarkedImageUrl) {
  // Ustaw metafield na customer (trigger dla Shopify Flow)
  await fetch(`https://${shop}/admin/api/2023-10/customers/${customerId}/metafields.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      metafield: {
        namespace: 'customify',
        key: 'generation_ready',
        value: JSON.stringify({
          imageUrl: watermarkedImageUrl,
          style: style,
          size: size,
          productType: productType,
          timestamp: new Date().toISOString()
        }),
        type: 'json'
      }
    })
  });
}
```

#### **2. Konfiguracja Shopify Flow (w Shopify Admin):**
1. **Settings → Shopify Flow → Create workflow**
2. **Trigger:** "Customer metafield updated"
   - Metafield: `customify.generation_ready`
3. **Action:** "Send email"
   - Template: Utwórz template w Shopify Email
   - To: Customer email
   - Subject: "Twoja generacja AI jest gotowa! 🎨"
   - Body: HTML template z obrazkiem i linkiem

#### **3. Template emaila w Shopify Email:**
- Użyj Shopify Email editor (drag & drop)
- Dodaj obrazek: `{{ customer.metafields.customify.generation_ready.imageUrl }}`
- Dodaj link: `https://lumly.pl/pages/my-generations`

### **⚠️ OGRANICZENIA:**
- Shopify Flow nie obsługuje bezpośrednio obrazków z zewnętrznych URL (Vercel Blob)
- Trudniejsze dodanie watermarku (musi być już w URL)
- Wymaga konfiguracji w UI (nie tylko kod)

---

## 📝 KROK 2: Instalacja i konfiguracja (OPCJA RESEND)

### **2.1. Instalacja Resend:**
```bash
npm install resend
```

### **2.2. Dodaj Environment Variable w Vercel:**
```
RESEND_API_KEY=re_...
```

**Gdzie znaleźć API Key:**
1. Zarejestruj się na https://resend.com
2. Dashboard → API Keys → Create API Key
3. Skopiuj klucz (zaczyna się od `re_`)

### **2.3. Dodaj do `package.json`:**
```json
{
  "dependencies": {
    "resend": "^3.0.0"
  }
}
```

---

## 📝 KROK 3: Utworzenie endpointu do wysyłania maila

### **Endpoint:** `POST /api/send-generation-email.js`

### **Request Body:**
```json
{
  "email": "user@example.com",
  "customerId": "123456789",
  "watermarkedImageUrl": "https://blob.vercel-storage.com/...",
  "style": "pixar",
  "size": "medium",
  "productType": "boho"
}
```

### **Logika:**
1. **Walidacja:**
   - Sprawdź czy `email` jest poprawny
   - Sprawdź czy `watermarkedImageUrl` istnieje
   - Sprawdź czy `RESEND_API_KEY` jest ustawiony

2. **Przygotuj template emaila:**
   - HTML z obrazkiem (watermarked)
   - Link do galerii: `https://lumly.pl/pages/my-generations`
   - Informacje o stylu i rozmiarze

3. **Wyślij mail przez Resend:**
   - From: `Lumly <noreply@lumly.pl>` (lub custom domain)
   - To: `email`
   - Subject: `Twoja generacja AI jest gotowa! 🎨`
   - HTML: Template z obrazkiem

4. **Response:**
   ```json
   {
     "success": true,
     "messageId": "re_...",
     "message": "Email sent successfully"
   }
   ```

### **Kod endpointu:**
```javascript
// api/send-generation-email.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, customerId, watermarkedImageUrl, style, size, productType } = req.body;

    // Walidacja
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (!watermarkedImageUrl) {
      return res.status(400).json({ error: 'Missing watermarkedImageUrl' });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('❌ [SEND-EMAIL] RESEND_API_KEY not configured');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // Mapuj style na czytelne nazwy
    const styleNames = {
      'pixar': 'Pixar',
      'minimalistyczny': 'Minimalistyczny',
      'realistyczny': 'Realistyczny',
      'krol-krolewski': 'Król - Królewski',
      'krolowa-krolewska': 'Królowa - Królewska',
      'krolewski': 'Królewski',
      'barokowy': 'Barokowy',
      // ... więcej stylów
    };

    const styleName = styleNames[style] || style;

    // Template emaila HTML
    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Twoja generacja AI jest gotowa!</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎨 Twoja generacja AI jest gotowa!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Cześć! 👋
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Twoja generacja w stylu <strong>${styleName}</strong> jest gotowa! Sprawdź efekt poniżej:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <img 
                src="${watermarkedImageUrl}" 
                alt="Generacja ${styleName}" 
                style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
              />
            </div>
            
            ${size ? `<p style="font-size: 14px; color: #666; margin-bottom: 20px;">
              <strong>Rozmiar:</strong> ${size}
            </p>` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a 
                href="https://lumly.pl/pages/my-generations" 
                style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;"
              >
                Zobacz wszystkie generacje →
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
              Masz pytania? Odpowiedz na ten mail lub skontaktuj się z nami przez stronę.
            </p>
            
            <p style="font-size: 12px; color: #999; margin-top: 20px; text-align: center;">
              © ${new Date().getFullYear()} Lumly.pl - Personalizowane portrety AI
            </p>
          </div>
        </body>
      </html>
    `;

    // Wyślij mail
    const { data, error } = await resend.emails.send({
      from: 'Lumly <noreply@lumly.pl>', // ⚠️ Musisz zweryfikować domenę w Resend
      to: email,
      subject: `Twoja generacja AI jest gotowa! 🎨`,
      html: emailHTML,
    });

    if (error) {
      console.error('❌ [SEND-EMAIL] Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email', details: error });
    }

    console.log('✅ [SEND-EMAIL] Email sent successfully:', {
      email,
      customerId,
      messageId: data?.id,
      style,
      productType
    });

    return res.status(200).json({
      success: true,
      messageId: data?.id,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('❌ [SEND-EMAIL] Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
```

---

## 📝 KROK 4: Integracja z `save-generation-v2.js`

### **Modyfikacja:** `api/_save-generation-core.js`

### **Gdzie dodać:**
Po udanym zapisie generacji do Vercel Blob (po linii ~350)

### **Logika:**
1. **Sprawdź warunki:**
   - ✅ `email` istnieje (zalogowany użytkownik)
   - ✅ `watermarkedImageUrl` istnieje
   - ✅ `RESEND_API_KEY` jest ustawiony

2. **Wywołaj endpoint asynchronicznie (nie blokuj odpowiedzi):**
   ```javascript
   // Po zapisie generacji do Vercel Blob
   if (email && watermarkedImageUrl && process.env.RESEND_API_KEY) {
     // ✅ ASYNCHRONICZNE - nie czekaj na odpowiedź
     fetch('https://customify-s56o.vercel.app/api/send-generation-email', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         email: email,
         customerId: customerId,
         watermarkedImageUrl: watermarkedImageUrl,
         style: style,
         size: size || null,
         productType: productType
       })
     }).catch(error => {
       console.error('❌ [SAVE-GENERATION] Failed to send email:', error);
       // Nie blokuj - email to bonus, nie krytyczna funkcja
     });
   }
   ```

### **Kod:**
```javascript
// W api/_save-generation-core.js, po zapisie do Vercel Blob (około linia 350)

// ✅ WYŚLIJ EMAIL DO ZALOGOWANEGO UŻYTKOWNIKA (asynchronicznie)
if (email && watermarkedImageUrl && process.env.RESEND_API_KEY) {
  console.log('📧 [SAVE-GENERATION] Wysyłam email do użytkownika:', email.substring(0, 10) + '...');
  
  // ✅ ASYNCHRONICZNE - nie czekaj na odpowiedź (nie blokuj zapisu)
  fetch('https://customify-s56o.vercel.app/api/send-generation-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      customerId: customerId,
      watermarkedImageUrl: watermarkedImageUrl,
      style: style,
      size: size || null,
      productType: productType || 'other'
    })
  }).then(response => {
    if (response.ok) {
      console.log('✅ [SAVE-GENERATION] Email wysłany pomyślnie');
    } else {
      console.warn('⚠️ [SAVE-GENERATION] Email nie został wysłany:', response.status);
    }
  }).catch(error => {
    console.error('❌ [SAVE-GENERATION] Błąd wysyłania emaila:', error);
    // Nie blokuj - email to bonus, nie krytyczna funkcja
  });
} else {
  if (!email) {
    console.log('📧 [SAVE-GENERATION] Pomijam email - brak emaila (niezalogowany)');
  } else if (!watermarkedImageUrl) {
    console.log('📧 [SAVE-GENERATION] Pomijam email - brak watermarkedImageUrl');
  } else if (!process.env.RESEND_API_KEY) {
    console.log('📧 [SAVE-GENERATION] Pomijam email - RESEND_API_KEY nie ustawiony');
  }
}
```

---

## 📝 KROK 5: Pobranie emaila z GraphQL (dla zalogowanych)

### **Modyfikacja:** `api/transform.js`

### **Gdzie:**
W sekcji gdzie pobieramy dane klienta z GraphQL (około linia 1800)

### **Logika:**
1. **Pobierz email z GraphQL:**
   ```javascript
   const customerEmail = customer?.email;
   ```

2. **Przekaż email do `save-generation-v2`:**
   ```javascript
   const saveData = {
     // ... istniejące pola
     email: customerEmail || email, // ✅ PRIORYTET: GraphQL email > request body email
   };
   ```

### **Kod:**
```javascript
// W api/transform.js, po pobraniu customer z GraphQL

const customerEmail = customer?.email;
console.log('📧 [TRANSFORM] Customer email from GraphQL:', customerEmail ? customerEmail.substring(0, 10) + '...' : 'brak');

// W saveData:
const saveData = {
  customerId: customerId,
  email: customerEmail || email, // ✅ PRIORYTET: GraphQL email (dla zalogowanych)
  // ... reszta pól
};
```

---

## 📝 KROK 6: Weryfikacja domeny w Resend

### **Wymagane:**
1. **Zarejestruj domenę w Resend:**
   - Dashboard → Domains → Add Domain
   - Dodaj `lumly.pl`
   - Dodaj DNS records (SPF, DKIM, DMARC)

2. **Zweryfikuj domenę:**
   - Resend wyśle instrukcje DNS
   - Dodaj rekordy w panelu DNS (np. Cloudflare)
   - Czekaj na weryfikację (zwykle kilka minut)

3. **Użyj zweryfikowanej domeny:**
   ```javascript
   from: 'Lumly <noreply@lumly.pl>'
   ```

### **Alternatywa (dla testów):**
- Użyj domeny Resend: `onboarding@resend.dev` (tylko do testów)

---

## 📝 KROK 7: Testowanie

### **7.1. Test lokalny:**
```bash
# Uruchom Vercel dev
vercel dev

# Wyślij test request:
curl -X POST http://localhost:3000/api/send-generation-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "customerId": "123",
    "watermarkedImageUrl": "https://example.com/image.jpg",
    "style": "pixar",
    "size": "medium",
    "productType": "boho"
  }'
```

### **7.2. Test produkcyjny:**
1. Zaloguj się na stronie
2. Wygeneruj obraz
3. Sprawdź skrzynkę mailową
4. Sprawdź logi Vercel: `vercel logs customify-s56o.vercel.app`

### **7.3. Sprawdź logi:**
```bash
vercel logs customify-s56o.vercel.app | grep "SEND-EMAIL"
```

---

## 📝 KROK 8: Obsługa błędów

### **Scenariusze błędów:**

1. **Brak RESEND_API_KEY:**
   - Loguj warning
   - Nie blokuj zapisu generacji
   - Zwróć sukces (email to bonus)

2. **Nieprawidłowy email:**
   - Walidacja przed wysłaniem
   - Zwróć 400 Bad Request
   - Loguj błąd

3. **Resend API error:**
   - Loguj szczegóły błędu
   - Nie blokuj zapisu generacji
   - Zwróć 500 (ale nie blokuj głównego flow)

4. **Brak watermarkedImageUrl:**
   - Pomijaj wysyłanie emaila
   - Loguj info
   - Nie blokuj zapisu

---

## 📝 KROK 9: Optymalizacja

### **9.1. Rate Limiting:**
- Maksymalnie 1 email na generację
- Cache: Sprawdź czy email już został wysłany dla tej generacji

### **9.2. Retry Logic:**
- Jeśli wysyłanie się nie powiedzie, spróbuj ponownie (max 3 razy)
- Użyj exponential backoff

### **9.3. Analytics:**
- Śledź ile maili zostało wysłanych
- Śledź otwarcia (Resend ma wbudowane tracking)
- Śledź kliknięcia w link do galerii

---

## 📋 CHECKLIST IMPLEMENTACJI

- [ ] **KROK 1:** Wybór biblioteki (Resend)
- [ ] **KROK 2:** Instalacja `npm install resend`
- [ ] **KROK 3:** Dodanie `RESEND_API_KEY` w Vercel Dashboard
- [ ] **KROK 4:** Utworzenie `api/send-generation-email.js`
- [ ] **KROK 5:** Modyfikacja `api/_save-generation-core.js` (wywołanie emaila)
- [ ] **KROK 6:** Modyfikacja `api/transform.js` (przekazanie emaila)
- [ ] **KROK 7:** Weryfikacja domeny w Resend
- [ ] **KROK 8:** Testowanie lokalne
- [ ] **KROK 9:** Testowanie produkcyjne
- [ ] **KROK 10:** Monitoring i optymalizacja

---

## 🎯 PODSUMOWANIE

### **Flow końcowy:**
1. User generuje obraz → `api/transform.js`
2. Obraz zapisany → `api/save-generation-v2.js`
3. Email wysłany → `api/send-generation-email.js` (asynchronicznie)
4. User otrzymuje mail z obrazkiem i linkiem do galerii

### **Korzyści:**
- ✅ User nie zapomni o swojej generacji
- ✅ Łatwy dostęp do galerii przez link
- ✅ Profesjonalny wygląd (HTML email)
- ✅ Wzrost konwersji (przypomnienie o generacji)

### **Koszty:**
- Resend: Darmowy tier (3,000 maili/miesiąc) → wystarczający na start
- Jeśli więcej → $20/miesiąc za 50,000 maili

---

## 📚 DODATKOWE MATERIAŁY

- **Resend Docs:** https://resend.com/docs
- **Resend Dashboard:** https://resend.com/dashboard
- **Email Template Examples:** https://resend.com/docs/send-with-nodejs

---

**Status:** 📝 Plan gotowy do implementacji
**Data:** 2025-01-XX
**Autor:** AI Assistant

