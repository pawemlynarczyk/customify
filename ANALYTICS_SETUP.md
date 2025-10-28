# 📊 Customify Analytics & Error Tracking - Instrukcja

## 🎯 Co zostało zaimplementowane?

System analizy błędów i statystyk użycia aplikacji Customify:

1. **Backend Logger** (`utils/analytics-logger.js`) - zapisuje logi do `/tmp/customify-logs.json`
2. **API Endpoint** (`/api/analytics`) - zwraca statystyki i logi
3. **Frontend Error Logging** (`/api/log-frontend-error`) - przyjmuje błędy z frontendu
4. **Dashboard** (`/admin/analytics.html`) - interfejs graficzny do przeglądania logów
5. **Automatyczne logowanie** - wszystkie kluczowe endpointy logują błędy i sukcesy

---

## 🚀 Jak uruchomić dashboard?

### 1. **Ustaw hasło admin w Vercel**

Dashboard jest zabezpieczony hasłem. Dodaj zmienną środowiskową w Vercel:

```bash
ADMIN_PASSWORD=twoje_bezpieczne_haslo_123
```

**Jak dodać:**
1. Wejdź do Vercel Dashboard → Twój projekt → **Settings** → **Environment Variables**
2. Dodaj nową zmienną:
   - **Name**: `ADMIN_PASSWORD`
   - **Value**: `twoje_bezpieczne_haslo_123` (zmień na swoje!)
   - **Environment**: Production, Preview, Development
3. Kliknij **Save**
4. Redeploy aplikację (Vercel → Deployments → Redeploy)

### 2. **Wejdź na dashboard**

```
https://customify-s56o.vercel.app/admin/analytics.html
```

### 3. **Zaloguj się**

- Wprowadź hasło które ustawiłeś w `ADMIN_PASSWORD`
- Dashboard się otworzy automatycznie

---

## 📊 Co pokazuje dashboard?

### **Statystyki (karty u góry):**
- 📈 **Wszystkie Requesty** - suma wszystkich requestów
- ✅ **Sukces** - udane operacje
- 🚨 **Błędy** - nieudane operacje
- ⚠️ **Ostrzeżenia** - rate limity, przekroczenia limitów
- 📉 **Error Rate** - procent błędów

### **Wykresy:**
- 📊 **Requesty per Endpoint** - które endpointy są najczęściej używane
- 🔝 **Top 10 Błędów** - najczęstsze błędy

### **Tabela Logów:**
- **Czas** - kiedy wystąpił event
- **Typ** - error, success, warning, info
- **Endpoint** - który API endpoint
- **Status** - kod HTTP (200, 400, 500, etc.)
- **Szczegóły** - error message lub opis

### **Filtry:**
- **Typ** - pokaż tylko błędy, sukcesy, etc.
- **Endpoint** - filtruj po konkretnym API
- **Okres** - dzisiaj, 7 dni, 30 dni

### **Akcje:**
- 🔄 **Odśwież** - zaktualizuj dane
- 📥 **Eksport CSV** - pobierz logi do pliku CSV

---

## 🔍 Jakie błędy są logowane?

### **Backend (API):**

1. **`/api/transform`** (AI transformacja):
   - ❌ Missing required fields (brak imageData lub prompt)
   - ❌ Rate limit exceeded (za dużo requestów)
   - ❌ Usage limit exceeded (użytkownik przekroczył limit)
   - ❌ AI transformation failed (błąd Replicate/Segmind)
   - ✅ Success (udana transformacja)

2. **`/api/products`** (dodawanie do koszyka):
   - ❌ Missing required fields (brak transformedImage lub style)
   - ❌ Rate limit exceeded
   - ❌ Product creation failed (błąd Shopify API)
   - ✅ Success (produkt utworzony i dodany do koszyka)

3. **`/api/upload-temp-image`** (upload do Vercel Blob):
   - ❌ No image data provided
   - ❌ Upload to Vercel Blob failed
   - ✅ Success (obraz uploadowany)

### **Frontend (JavaScript):**

1. **`/frontend/transform_image`** (transformacja AI):
   - ❌ Network errors (Failed to fetch)
   - ❌ Timeout errors (AbortError)
   - ❌ Server errors (500, 503, etc.)

2. **`/frontend/add_to_cart`** (dodawanie do koszyka):
   - ❌ Network errors
   - ❌ Server errors
   - ❌ Invalid product data

3. **`/frontend/file_upload`** (upload pliku):
   - ❌ Invalid file type (nie jest obrazkiem)
   - ❌ File too large (>10MB)

---

## 💾 Gdzie są przechowywane logi?

- **Lokalizacja**: `/tmp/customify-logs.json` (Vercel serverless)
- **Limit**: Ostatnie 1000 wpisów
- **Rotacja**: Automatyczna - najstarsze logi są usuwane
- **Persistence**: Logi są tymczasowe (reset przy każdym deployment)

**⚠️ UWAGA**: Logi w `/tmp/` są tymczasowe na Vercel! Dla production warto dodać integrację z:
- **Vercel Logs** (wbudowane w dashboard)
- **Sentry** (error tracking)
- **Datadog** (monitoring)
- **LogRocket** (session replay)

---

## 🛠️ Jak to działa?

### **Backend Logging:**

```javascript
const { logError, logSuccess, logWarning } = require('../utils/analytics-logger');

// Success
logSuccess('/api/transform', {
  statusCode: 200,
  ip: '127.0.0.1',
  style: 'boho',
  imageSize: 1234567
});

// Error
logError('/api/transform', new Error('AI failed'), {
  statusCode: 500,
  ip: '127.0.0.1',
  style: 'pixar'
});

// Warning
logWarning('/api/transform', 'Rate limit exceeded', {
  statusCode: 429,
  ip: '127.0.0.1'
});
```

### **Frontend Logging:**

```javascript
// W customify.js
this.logErrorToAnalytics('transform_image', error.message, {
  style: this.selectedStyle,
  retryCount: retryCount
});
```

---

## 📈 Przykładowe case study - Jak analizować błędy?

### **Scenario 1: Użytkownicy nie mogą uploadować zdjęć**

1. Wejdź na dashboard
2. Filtruj po: **Endpoint** = `/api/upload-temp-image`
3. Szukaj błędów **Status 500** lub **413**
4. Sprawdź **imageDataSize** w szczegółach
5. **Diagnoza**: Jeśli rozmiary są >4.5MB → problem z Vercel limit

### **Scenario 2: AI transformacja często failuje**

1. Filtruj po: **Endpoint** = `/api/transform`
2. Sprawdź **Top 10 Błędów**
3. Szukaj wzorców:
   - "CUDA out of memory" → Replicate overload
   - "timeout" → Model za wolny
   - "402 Payment Required" → Billing problem

### **Scenario 3: Produkty nie dodają się do koszyka**

1. Filtruj po: **Endpoint** = `/api/products`
2. Sprawdź błędy **Status 500**
3. Szukaj w szczegółach:
   - "Missing required fields" → Frontend nie wysyła danych
   - "Shopify API error" → Problem z Shopify connection

---

## 🔒 Bezpieczeństwo

- ✅ Dashboard zabezpieczony hasłem (`ADMIN_PASSWORD`)
- ✅ Frontend errors nie mogą spamować (silent fail)
- ✅ IP tracking dla rate limiting
- ✅ CORS ograniczony do `lumly.pl` i `vercel.app`
- ⚠️ Logi zawierają IP użytkowników - zgodność z RODO!

---

## 🚀 Deployment Checklist

- [ ] Ustaw `ADMIN_PASSWORD` w Vercel Environment Variables
- [ ] Deploy aplikacji: `git push origin main`
- [ ] Sprawdź czy dashboard działa: `/admin/analytics.html`
- [ ] Zaloguj się używając hasła admin
- [ ] Sprawdź czy logi się zapisują (zrób test upload/transform)
- [ ] Sprawdź czy filtry działają
- [ ] Sprawdź eksport CSV

---

## 📞 Support

Jeśli masz pytania lub problemy:
1. Sprawdź Vercel Logs: Dashboard → Logs
2. Sprawdź Console logs w przeglądarce (F12)
3. Sprawdź czy `ADMIN_PASSWORD` jest ustawiony poprawnie

---

**Gotowe! 🎉 System analytics jest gotowy do użycia.**

