# 📊 Plan implementacji Error Tracking i Monitoringu

## 🎯 OBECNA SYTUACJA

### ✅ Co już mamy:
- **Frontend**: 214 logów `console.error/log` w `customify.js`
- **Backend**: 107 logów `console.error/log` w `api/transform.js`
- **Vercel Logs**: Dostęp do logów w Vercel Dashboard
- **Shopify**: Brak wbudowanego error tracking dla custom aplikacji
- **Try-catch blocks**: Podstawowe error handling

### ❌ Czego brakuje:
- **Brak sentry/logrocket** - brak centralnego error trackingu
- **Brak analytics** - nie wiemy ile błędów się zdarza
- **Brak user feedback** - użytkownicy nie zgłaszają problemów
- **Brak automatycznych alertów** - nie wiemy o problemach natychmiast

---

## 📋 PLAN IMPLEMENTACJI (4 POZIOMY)

### **POZIOM 1: VERCEL LOGS + GOOGLE ANALYTICS** ✅ (Najszybsze)

**Cel**: Podstawowy monitoring bez dodatkowych narzędzi

#### **1.1 Vercel Function Logs (JUŻ DZIAŁA)**
```
Lokalizacja: https://vercel.com/[projekt]/[deployment]/functions
```
**Co widzimy:**
- Błędy API (500, 400, etc.)
- Console.error z backendu
- Czas wykonania funkcji
- Memory usage

**Ograniczenia:**
- ❌ Tylko backend
- ❌ Brak frontend
- ❌ Nie wiemy o użytkownikach

#### **1.2 Google Analytics 4 dla błędów (POTRZEBNE)**
```javascript
// Dodaj do theme.liquid lub customify.js
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-XXXXXXXXXX');
```

**Co śledzić:**
- `gtag('event', 'error', { error_type: 'transform_failed' })`
- `gtag('event', 'error', { error_type: 'cart_add_failed' })`
- `gtag('event', 'error', { error_type: 'upload_failed' })`

**Zalety:**
- ✅ Darmowe
- ✅ Łatwe do wdrożenia
- ✅ Widoczne w GA4

**Wady:**
- ❌ Brak stack traces
- ❌ Brak kontekstu użytkownika

---

### **POZIOM 2: SENTRY (ZALECANE)** ⭐

**Cel**: Profesjonalny error tracking z kontekstem

#### **2.1 Sentry Setup**

```bash
npm install @sentry/browser @sentry/node
```

#### **2.2 Frontend (customify.js)**

```javascript
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "https://xxx@xxx.ingest.sentry.io/xxx",
  environment: "production",
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

#### **2.3 Backend (api/*.js)**

```javascript
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://xxx@xxx.ingest.sentry.io/xxx",
  environment: process.env.VERCEL_ENV || "production",
  tracesSampleRate: 1.0,
});

// W każdym API
module.exports = async (req, res) => {
  try {
    // ... kod
  } catch (error) {
    Sentry.captureException(error, {
      contexts: {
        user: { email: customerEmail },
        extra: { style, productType }
      }
    });
    throw error;
  }
};
```

#### **2.4 Tracking konkretnych błędów**

```javascript
// Przykłady gdzie dodać Sentry.captureException():

// 1. Transform failed
catch (error) {
  Sentry.captureException(error, {
    tags: { error_type: 'transform_failed' },
    extra: { style, imageSize, productType }
  });
}

// 2. Cart add failed
catch (error) {
  Sentry.captureException(error, {
    tags: { error_type: 'cart_add_failed' },
    extra: { productId, variantId }
  });
}

// Krości 3. Upload failed
catch (error) {
  Sentry.captureException(error, {
    tags: { error_type: 'upload_failed' },
    extra: { fileSize, fileName }
  });
}
```

**Zalety:**
- ✅ Stack traces
- ✅ Kontekst użytkownika
- ✅ Automatyczne alerty
- ✅ Session replay
- ✅ Darmowy tier: 5000 events/miesiąc

**Cena:**
- Free: 5000 errors/miesiąc
- Pro: $26/miesiąc (10k errors)

---

### **POZIOM 3: LOGROCKET (PREMIUM)** 🎯

**Cel**: Full session replay + error tracking

```javascript
// Dodaj do customify.js
import LogRocket from 'logrocket';

LogRocket.init('xxx/xxx');

// Auto-capture errors
LogRocket.captureException(error);

// Custom events
LogRocket.event('transform-started', { style: this.selectedStyle });
LogRocket.event('transform-completed', { style: this.selectedStyle });
```

**Zalety:**
- ✅ Session replay (wideo akcji użytkownika)
- ✅ Network monitoring
- ✅ Console logs capture
- ✅ Redux state capture

**Cena:**
- Starter: $99/miesiąc (1000 sessions)

---

### **POZIOM 4: CUSTOM DASHBOARD** 📊

**Cel**: Własny monitoring dashboard

#### **4.1 Error endpoint**

```javascript
// api/log-error.js
module.exports = async (req, res) => {
  const { error, context } = req.body;
  
  // Zapisz do Vercel KV lub Supabase
  await kv.set(`error:${Date.now()}`, {
    error,
    context,
    timestamp: new Date(),
    userAgent: req.headers['user-agent']
  });
  
  res.json({ success: true });
};
```

#### **4.2 Dashboard widget**

```javascript
// admin/errors.js - widget dla Ciebie
const errors = await kv.keys('error:*');
// Wyświetl najnowsze błędy
```

---

## 🚀 PLAN WDROŻENIA (Krok po kroku)

### **TYDZIEŃ 1: Poziom 1 (Vercel + GA4)**
1. Dodać Google Analytics do theme.liquid
2. Dodać event tracking dla błędów transformacji
3. Dodać event tracking dla błędów cart
4. Monitorować przez 7 dni

### **TYDZIEŃ 2: Poziom 2 (Sentry)**
1. Założyć konto Sentry (darmowe)
2. Zainstalować `@sentry/browser` i `@sentry/node`
3. Dodać Sentry.init() do customify.js i centers funkcji API
4. Dodać `Sentry.captureException()` do 3 kluczowych miejsc:
   - `transformImage()` catch
   - `addToCart()` catch
   - `uploadImage()` catch

### **TYDZIEŃ 3: Optymalizacja**
1. Przeanalizować błędy z Sentry
2. Naprawić top 3 najczęstsze błędy
3. Dodać więcej context do Sentry (user email, style, etc.)
4. Setup automatycznych alertów w Sentry

---

## 📊 CO TRACKOWAĆ?

### **Błędy krytyczne (TOP PRIORITY):**
1. **Transform failed** - AI nie działa
2. **Cart add failed** - nie można dodać do koszyka
3. **Upload failed** - nie można wgrać zdjęcia

### **Błędy medium (NORMAL):**
4. **Payment failed** - płatność nie działa
5. **Customer not found** - problem z loginem
6. **Rate limit exceeded** - za dużo requestów

### **Metrics do trackowania:**
- Success rate transformacji (% successful)
- Average transform time
- Cart conversion rate
- Error rate per style
- User drop-off points

---

## 🔔 AUTOMATYCZNE ALERTY

### **Shopify (ograniczone):**
- ❌ Shopify pu alpha.NIE MAZER ZA TEXAS
- ❌ JEDYNIE: App analytics dla Shopify Apps
- ❌ Brak custom alertów

### **Vercel (ograniczone):**
- ✅ Function errors (tylko w dashboard)
- ❌ Brak email alerts out-of-the-box

### **Sentry (ZALECANE):**
```javascript
// Automatic alerts: Error rate spike
if (errorCount > 10 in 5 min) {
  sendSlackWebhook('🚨 Error spike detected!');
}
```

### **Custom (możliwe):**
```javascript
// api/monitor-errors.js
const rateLimiter = new RateLimiter({
  interval: 5 * 60 * 1000, // 5 minutes
  max: 10 // max 10 errors
});

if (rateLimiter.exceeded) {
  // Send email/SMS
}
```

---

## 💰 KOSZTY

| Narzędzie | Plan | Cena | Limit |
|-----------|------|------|-------|
| **Google Analytics** | Free | $0 | Unlimited |
| **Vercel Logs** | Included | $0 | Unlimited |
| **Sentry** | Free | $0 | 5k events/mo |
| **Sentry** | Pro | $26/mo | 10k events/mo |
| **LogRocket** | Starter | $99/mo | 1000 sessions |

**Rekomendacja**: Start z **Sentry Free** ($0), upgrade po 5k events.

---

## 🎯 NASTĘPNE KROKI

### **Teraz (10 min):**
1. ✅ Dodaj ten plan do dokumentacji
2. ✅ Przejrzyj top błędy w Vercel logs

### **Dziś (1h):**
1. Załóż konto Sentry (free)
2. Dodaj Sentry.init() do customify.js
3. Dodaj Sentry.captureException() do transformImage() catch

### **Ten tydzień (3h):**
1. Dodać Sentry do wszystkich API endpoints
2. Setup alertów w Sentry
3. Monitorować przez tydzień

### **Następny tydzień:**
1. Analiza błędów z Sentry
2. Naprawa top 5 najczęstszych błędów
3. Optymalizacja na podstawie insights

---

## 📝 PRZYKŁADY IMPLEMENTACJI

### **Przykład 1: Sentry w transformImage()**

```javascript
async transformImage() {
  try {
    const result = await fetch('/api/transform', {...});
    // ...
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        error_type: 'transform_failed',
        style: this.selectedStyle,
        productType: this.productType
      },
      user: {
        email: this.customerEmail
      },
      extra: {
        imageSize: this.originalImage?.length,
        retryCount: this.retryCount
      }
    });
    this.showError('Błąd transformacji');
  }
}
```

### **Przykład 2: Sentry w addToCart()**

```javascript
async addToCart() {
  try {
    await fetch('/api/products', {...});
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        error_type: 'cart_add_failed',
        action: 'add_to_cart'
      },
      ten: {
        productId: this.productId,
        variantId: this.variantId,
        cartUrl: this.cartUrl
      }
    });
  }
}
```

---

## ✅ CHECKLIST WDROŻENIA

- [ ] Założenie konta Sentry (free tier)
- [ ] `npm install @sentry/browser @sentry/node`
- [ ] Dodanie Sentry.init() do customify.js
- [ ] Dodanie Sentry.captureException() do 3 miejsc
- [ ] Testowanie na staging
- [ ] Deploy na production
- [ ] Setup alertów w Sentry
- [ ] Monitoring przez tydzień
- [ ] Analiza i optymalizacja

---

**Data utworzenia**: 2025-01-XX  
**Ostatnia aktualizacja**: 2025-01-XX  
**Status**: ✅ Plan gotowy do wdrożenia



