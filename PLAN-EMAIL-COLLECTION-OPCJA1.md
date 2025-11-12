# 📋 PLAN IMPLEMENTACJI: Zbieranie Emaili Przed Generacją AI (OPCJA 1)

## 🎯 CEL
Zbierać email użytkownika PRZED pokazaniem efektu AI, tworzyć konto w Shopify (passwordless), i zapisywać dane dla follow-up emaili.

---

## 🏗️ ARCHITEKTURA

### **Flow użytkownika:**
1. Użytkownik wgrywa zdjęcie → wybiera styl → klika "Zobacz Podgląd"
2. **NOWE:** Modal z formularzem email (przed generacją)
3. Użytkownik wpisuje email → klika "Zobacz efekt"
4. Backend: Tworzy klienta w Shopify (jeśli nie istnieje)
5. Backend: Zapisuje email + obraz w Vercel KV
6. **Pokazanie efektu AI** (użytkownik nie czeka na aktywację)
7. Shopify automatycznie wysyła email aktywacyjny (passwordless)
8. Użytkownik klika link → automatyczna rejestracja

### **Komponenty:**
- **Frontend:** Modal z formularzem email
- **Backend:** `/api/create-customer` - tworzenie klienta w Shopify
- **Backend:** `/api/save-email-generation` - zapis emaila + obrazu w Vercel KV
- **Shopify:** Automatyczny email aktywacyjny (passwordless)
- **Opcjonalnie:** Follow-up emaile przez Resend

---

## 📝 KROK 1: FRONTEND - Modal z formularzem email

### **Lokalizacja:**
- `theme.liquid` lub `customify.js`
- Wywołanie: PRZED wywołaniem `transformImage()`

### **Kiedy pokazywać:**
- Tylko dla **niezalogowanych** użytkowników
- PRZED pierwszą generacją (lub każdą, jeśli chcesz)
- Jeśli użytkownik już podał email w tej sesji → pominąć modal

### **Zawartość modala:**
- Tytuł: "Podaj email, żeby zobaczyć efekt"
- Input: Email (walidacja formatu)
- Checkbox: "Zgadzam się na otrzymywanie ofert" (opcjonalnie, GDPR)
- Przycisk: "Zobacz efekt" (zamyka modal + wywołuje generację)
- Przycisk: "Pomiń" (opcjonalnie - generacja bez emaila)

### **Logika:**
1. Sprawdź czy użytkownik jest zalogowany → jeśli TAK, pominąć modal
2. Sprawdź localStorage: `customify_email_provided` → jeśli TAK, pominąć modal
3. Pokaż modal
4. Po podaniu emaila:
   - Zapisz w localStorage: `customify_email_provided = email`
   - Wywołaj `/api/create-customer` (tworzenie klienta)
   - Wywołaj `/api/save-email-generation` (zapis w Vercel KV)
   - Zamknij modal
   - Wywołaj `transformImage()` (generacja AI)

---

## 📝 KROK 2: BACKEND - Endpoint tworzenia klienta

### **Endpoint:** `POST /api/create-customer`

### **Request:**
```json
{
  "email": "user@example.com",
  "acceptsMarketing": true  // opcjonalnie
}
```

### **Logika:**
1. **Walidacja emaila** (format, nie pusty)
2. **Sprawdź czy klient już istnieje:**
   - GraphQL query: `customers(first: 1, query: "email:user@example.com")`
   - Jeśli istnieje → zwróć `customerId` (nie tworz ponownie)
3. **Jeśli nie istnieje → utwórz:**
   - GraphQL mutation: `customerCreate`
   - Shopify automatycznie wyśle email aktywacyjny
4. **Response:**
   ```json
   {
     "success": true,
     "customerId": "123456789",
     "email": "user@example.com",
     "isNew": true/false,
     "message": "Customer created successfully"
   }
   ```

### **Shopify GraphQL Mutation:**
```graphql
mutation customerCreate($input: CustomerInput!) {
  customerCreate(input: $input) {
    customer {
      id
      email
      acceptsMarketing
    }
    userErrors {
      field
      message
    }
  }
}
```

### **Błędy do obsługi:**
- Email już istnieje → zwróć istniejący `customerId`
- Nieprawidłowy format emaila → 400 Bad Request
- Shopify API error → 500 + logowanie

---

## 📝 KROK 3: BACKEND - Zapis emaila + obrazu w Vercel KV

### **Endpoint:** `POST /api/save-email-generation`

### **Request:**
```json
{
  "email": "user@example.com",
  "imageUrl": "https://blob.vercel-storage.com/...",
  "style": "pixar",
  "productType": "other"
}
```

### **Logika:**
1. **Sprawdź czy email już istnieje w Vercel KV:**
   - Key: `email:${email}`
   - Jeśli istnieje → dodaj nową generację do tablicy
   - Jeśli nie → utwórz nowy rekord
2. **Zapisz strukturę:**
   ```json
   {
     "email": "user@example.com",
     "customerId": "123456789",  // z /api/create-customer
     "generations": [
       {
         "imageUrl": "https://...",
         "style": "pixar",
         "productType": "other",
         "date": "2025-01-15T10:30:00Z",
         "purchased": false
       }
     ],
     "lastGenerationDate": "2025-01-15T10:30:00Z",
     "purchaseCount": 0,
     "createdAt": "2025-01-15T10:30:00Z"
   }
   ```
3. **Response:**
   ```json
   {
     "success": true,
     "message": "Email and generation saved"
   }
   ```

### **Vercel KV Setup:**
- Wymagane: `KV_REST_API_URL` i `KV_REST_API_TOKEN` w Vercel Environment Variables
- Package: `@vercel/kv` (już zainstalowany w `package.json`)

---

## 📝 KROK 4: INTEGRACJA Z TRANSFORM.JS

### **Modyfikacja:** `api/transform.js`

### **Zmiany:**
1. **Przed transformacją:**
   - Sprawdź czy w request jest `email`
   - Jeśli TAK → wywołaj `/api/create-customer` (lub bezpośrednio w transform.js)
   - Jeśli TAK → zapisz email w Vercel KV (lub bezpośrednio w transform.js)

2. **Po udanej transformacji:**
   - Jeśli był `email` w request → wywołaj `/api/save-email-generation`
   - Zapisz `imageUrl` (z Vercel Blob) + email + styl

### **Request body (transform.js):**
```json
{
  "imageData": "base64...",
  "prompt": "pixar",
  "productType": "other",
  "email": "user@example.com",  // NOWE
  "customerId": null,  // jeśli nie zalogowany
  "customerAccessToken": null
}
```

---

## 📝 KROK 5: FRONTEND - Wywołanie przed generacją

### **Modyfikacja:** `customify.js` - funkcja `transformImage()`

### **Zmiany:**
1. **PRZED wywołaniem API transform:**
   - Sprawdź czy użytkownik zalogowany → jeśli TAK, pominąć modal
   - Sprawdź localStorage: `customify_email_provided` → jeśli TAK, użyj tego emaila
   - Jeśli NIE → pokaż modal z formularzem email
   - Po podaniu emaila → zapisz w localStorage
   - Dodaj `email` do request body

2. **Po udanej transformacji:**
   - Jeśli był email → wywołaj `/api/save-email-generation` (opcjonalnie, jeśli nie w transform.js)

---

## 📝 KROK 6: OPCJONALNIE - Follow-up emaile

### **Endpoint:** `POST /api/send-followup-email`

### **Logika:**
1. Pobierz wszystkich użytkowników z Vercel KV
2. Dla każdego użytkownika:
   - Sprawdź `purchased: false`
   - Sprawdź datę ostatniej generacji
   - Jeśli minęło 24h/3 dni/7 dni → wyślij email przez Resend
3. Aktualizuj flagę `lastEmailSent`

### **Vercel Cron Job:**
- Konfiguracja w `vercel.json`:
  ```json
  {
    "crons": [{
      "path": "/api/send-followup-email",
      "schedule": "0 9 * * *"
    }]
  }
  ```

### **Resend Setup:**
- Wymagane: `RESEND_API_KEY` w Vercel Environment Variables
- Package: `resend` (do zainstalowania)

---

## 🔐 BEZPIECZEŃSTWO

### **1. Walidacja emaila:**
- Format emaila (regex)
- Nie pusty
- Max długość

### **2. Rate Limiting:**
- `/api/create-customer`: 10 requestów / 15 minut (IP)
- `/api/save-email-generation`: 50 requestów / 15 minut (IP)

### **3. CORS:**
- Tylko dozwolone origins (lumly.pl, customify-s56o.vercel.app)

### **4. Shopify API:**
- Access token w Environment Variables
- Nigdy nie wysyłany do klienta

---

## 📊 STRUKTURA DANYCH VERCEL KV

### **Key format:**
```
email:user@example.com
```

### **Value structure:**
```json
{
  "email": "user@example.com",
  "customerId": "123456789",
  "generations": [
    {
      "imageUrl": "https://blob.vercel-storage.com/...",
      "style": "pixar",
      "productType": "other",
      "date": "2025-01-15T10:30:00Z",
      "purchased": false
    }
  ],
  "lastGenerationDate": "2025-01-15T10:30:00Z",
  "purchaseCount": 0,
  "createdAt": "2025-01-15T10:30:00Z",
  "lastEmailSent": null  // "24h" | "3days" | "7days"
}
```

---

## 🧪 TESTING

### **Scenariusz 1: Nowy użytkownik**
1. Wgrywa zdjęcie → wybiera styl → klika "Zobacz Podgląd"
2. Modal z formularzem email
3. Wpisuje email → klika "Zobacz efekt"
4. ✅ Klient utworzony w Shopify
5. ✅ Email zapisany w Vercel KV
6. ✅ Efekt AI pokazany
7. ✅ Shopify wysyła email aktywacyjny

### **Scenariusz 2: Użytkownik już podał email**
1. Wgrywa zdjęcie → wybiera styl → klika "Zobacz Podgląd"
2. ❌ Modal NIE pokazuje się (email w localStorage)
3. ✅ Generacja AI od razu

### **Scenariusz 3: Zalogowany użytkownik**
1. Wgrywa zdjęcie → wybiera styl → klika "Zobacz Podgląd"
2. ❌ Modal NIE pokazuje się (użytkownik zalogowany)
3. ✅ Generacja AI od razu

### **Scenariusz 4: Email już istnieje w Shopify**
1. Wgrywa zdjęcie → wybiera styl → klika "Zobacz Podgląd"
2. Modal z formularzem email
3. Wpisuje istniejący email → klika "Zobacz efekt"
4. ✅ Zwrócony istniejący `customerId` (nie tworzy duplikatu)
5. ✅ Email zapisany w Vercel KV
6. ✅ Efekt AI pokazany

---

## 📋 CHECKLIST IMPLEMENTACJI

### **Frontend:**
- [ ] Modal z formularzem email (HTML + CSS)
- [ ] Walidacja emaila (JavaScript)
- [ ] Zapisywanie emaila w localStorage
- [ ] Wywołanie `/api/create-customer` przed generacją
- [ ] Wywołanie `/api/save-email-generation` po generacji
- [ ] Sprawdzanie czy użytkownik zalogowany (pomijanie modala)
- [ ] Sprawdzanie localStorage (pomijanie modala jeśli email już podany)

### **Backend:**
- [ ] Endpoint `/api/create-customer` (tworzenie klienta w Shopify)
- [ ] Endpoint `/api/save-email-generation` (zapis w Vercel KV)
- [ ] Modyfikacja `api/transform.js` (obsługa emaila)
- [ ] Rate limiting dla nowych endpointów
- [ ] Error handling (Shopify API errors)
- [ ] Logowanie (dla debugowania)

### **Shopify:**
- [ ] Sprawdzenie uprawnień: `write_customers` (wymagane)
- [ ] Konfiguracja emaila aktywacyjnego (Shopify Admin → Settings → Customer accounts)

### **Vercel:**
- [ ] Konfiguracja Vercel KV (Environment Variables)
- [ ] Test zapisu/odczytu z Vercel KV

### **Opcjonalnie (później):**
- [ ] Endpoint `/api/send-followup-email` (Resend)
- [ ] Vercel Cron Job (harmonogram wysyłania)
- [ ] Webhook Shopify (aktualizacja flagi "kupił")
- [ ] Szablony emaili HTML (Resend)

---

## 🚀 KOLEJNOŚĆ WDROŻENIA

1. **Faza 1: Podstawowa funkcjonalność**
   - Frontend: Modal z formularzem email
   - Backend: `/api/create-customer`
   - Backend: `/api/save-email-generation`
   - Integracja z `transform.js`

2. **Faza 2: Optymalizacja**
   - Sprawdzanie czy klient już istnieje
   - localStorage (pomijanie modala)
   - Error handling

3. **Faza 3: Follow-up (opcjonalnie)**
   - Resend integration
   - Vercel Cron Jobs
   - Webhook Shopify

---

## 📝 NOTATKI

### **Shopify Customer Create:**
- Automatycznie wysyła email aktywacyjny (passwordless)
- Można dostosować treść w Shopify Admin
- Email zawiera magic link do aktywacji

### **Vercel KV:**
- Key: `email:user@example.com`
- Value: JSON z danymi użytkownika
- TTL: Opcjonalnie (np. 90 dni dla nieaktywnych)

### **Follow-up emaile:**
- Można dodać później (nie jest wymagane na start)
- Shopify Email (wbudowane) lub Resend (zewnętrzny)
- Harmonogram: 24h, 3 dni, 7 dni po generacji

---

## ✅ GOTOWE DO IMPLEMENTACJI

Plan jest gotowy. Możemy zacząć od Fazy 1 (podstawowa funkcjonalność).

