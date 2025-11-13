# 📋 PLAN: Powiązanie Generacji AI z Klientem (Przed Dodaniem do Koszyka)

## 🎯 PROBLEM
Obecnie generacje AI są zapisywane tylko w:
- **localStorage** (frontend) - tylko dla przeglądarki użytkownika
- **Vercel Blob Storage** - obrazy są zapisywane, ale **nie są powiązane z customerId**

**Efekt:** Jeśli klient nie doda do koszyka, tracimy powiązanie obrazu z klientem.

---

## 🎯 CEL
Zapisać **wszystkie generacje AI** z powiązaniem do **customerId** (lub emaila dla niezalogowanych), **nawet jeśli klient nie doda do koszyka**.

---

## 🏗️ OBECNA SYTUACJA

### **Co się dzieje teraz:**

1. **Użytkownik generuje obraz:**
   - `api/transform.js` → generuje obraz AI
   - Obraz zapisywany w Vercel Blob Storage (przez `/api/upload-temp-image`)
   - Frontend: `saveAIGeneration()` → zapisuje w localStorage
   - **BRAK powiązania z customerId**

2. **Użytkownik dodaje do koszyka:**
   - `api/products.js` → tworzy produkt w Shopify
   - Obraz zapisywany w Vercel Blob (backup)
   - Obraz w metafields produktu
   - **Dopiero tutaj jest powiązanie z zamówieniem**

3. **Jeśli użytkownik NIE dodaje do koszyka:**
   - Obraz jest w Vercel Blob (ale bez powiązania)
   - Obraz jest w localStorage (tylko lokalnie)
   - **Tracimy powiązanie z klientem**

---

## 💡 ROZWIĄZANIE: 3-WARSTWOWY SYSTEM ZAPISU

### **WARSTWA 1: Vercel Blob Storage (obrazy)**
- **Cel:** Przechowywanie obrazów (już działa)
- **Lokalizacja:** `customify/generations/{customerId}/{timestamp}.jpg`
- **Dostęp:** Publiczny URL

### **WARSTWA 2: Vercel KV (metadata + powiązania)**
- **Cel:** Powiązanie obrazów z klientami
- **Key format:** `customer:{customerId}:generations` lub `email:{email}:generations`
- **Value:** Lista generacji z URL obrazu + metadata

### **WARSTWA 3: Shopify Customer Metafields (opcjonalnie)**
- **Cel:** Trwałe powiązanie w Shopify
- **Namespace:** `customify`
- **Key:** `ai_generations` (JSON array)

---

## 📝 PLAN IMPLEMENTACJI

### **KROK 1: Modyfikacja `api/transform.js` - Zapis po generacji**

**Kiedy:** Natychmiast po udanej generacji AI (przed zwróceniem odpowiedzi)

**Co robić:**
1. **Sprawdź czy jest customerId:**
   - Jeśli TAK → użyj `customerId`
   - Jeśli NIE → użyj emaila (jeśli był w request) lub IP (fallback)

2. **Zapisz obraz w Vercel Blob z powiązaniem:**
   - Path: `customify/generations/{customerId}/{timestamp}-{style}.jpg`
   - Lub: `customify/generations/email-{email}/{timestamp}-{style}.jpg` (dla niezalogowanych)

3. **Zapisz metadata w Vercel KV:**
   - Key: `customer:{customerId}:generations` (lub `email:{email}:generations`)
   - Value: Dodaj nową generację do tablicy

**Struktura w Vercel KV:**
```json
{
  "customerId": "123456789",
  "email": "user@example.com",
  "generations": [
    {
      "id": "gen-1234567890",
      "imageUrl": "https://blob.vercel-storage.com/customify/generations/123456789/1234567890-pixar.jpg",
      "style": "pixar",
      "productType": "other",
      "originalImageUrl": "https://...",  // opcjonalnie
      "date": "2025-01-15T10:30:00Z",
      "purchased": false,
      "orderId": null
    }
  ],
  "lastGenerationDate": "2025-01-15T10:30:00Z",
  "totalGenerations": 1
}
```

---

### **KROK 2: Endpoint do zapisu generacji**

**Endpoint:** `POST /api/save-generation`

**Request:**
```json
{
  "customerId": "123456789",  // lub null
  "email": "user@example.com",  // lub null
  "imageUrl": "https://blob.vercel-storage.com/...",
  "style": "pixar",
  "productType": "other",
  "originalImageUrl": "https://..."  // opcjonalnie
}
```

**Logika:**
1. **Określ identyfikator klienta:**
   - Jeśli `customerId` → użyj `customer:{customerId}:generations`
   - Jeśli `email` → użyj `email:{email}:generations`
   - Jeśli oba → priorytet dla `customerId`

2. **Pobierz istniejące generacje z Vercel KV:**
   - Jeśli nie istnieje → utwórz nowy rekord
   - Jeśli istnieje → dodaj do tablicy `generations`

3. **Zapisz zaktualizowane dane:**
   - Aktualizuj `lastGenerationDate`
   - Inkrementuj `totalGenerations`
   - Dodaj nową generację do tablicy

4. **Response:**
   ```json
   {
     "success": true,
     "generationId": "gen-1234567890",
     "message": "Generation saved successfully"
   }
   ```

---

### **KROK 3: Modyfikacja `api/transform.js` - Wywołanie zapisu**

**Gdzie:** Po udanej generacji AI, przed zwróceniem odpowiedzi

**Logika:**
1. **Po otrzymaniu `imageUrl` z AI (Replicate/Segmind):**
   - Obraz jest już w Vercel Blob (przez `/api/upload-temp-image`)
   - Mamy `customerId` z request (jeśli zalogowany)
   - Mamy `email` z request (jeśli był w formularzu)

2. **Wywołaj `/api/save-generation`:**
   - Przekaż `customerId`, `email`, `imageUrl`, `style`, `productType`
   - Zapisz w Vercel KV

3. **Nie blokuj odpowiedzi:**
   - Jeśli zapis się nie uda → loguj błąd, ale zwróć obraz
   - Użytkownik nie powinien czekać na zapis

---

### **KROK 4: Frontend - Przekazanie customerId/email**

**Modyfikacja:** `customify.js` - funkcja `transformImage()`

**Zmiany:**
1. **Przed wywołaniem `/api/transform`:**
   - Pobierz `customerId` z `getCustomerInfo()` (jeśli zalogowany)
   - Pobierz `email` z localStorage (jeśli był w formularzu)
   - Dodaj do request body

2. **Request body:**
   ```json
   {
     "imageData": "base64...",
     "prompt": "pixar",
     "productType": "other",
     "customerId": "123456789",  // NOWE
     "customerAccessToken": "...",  // NOWE
     "email": "user@example.com"  // NOWE (dla niezalogowanych)
   }
   ```

---

### **KROK 5: Endpoint do pobierania generacji klienta**

**Endpoint:** `GET /api/get-customer-generations`

**Request:**
- Query params: `customerId` lub `email`

**Response:**
```json
{
  "success": true,
  "customerId": "123456789",
  "email": "user@example.com",
  "generations": [
    {
      "id": "gen-1234567890",
      "imageUrl": "https://...",
      "style": "pixar",
      "date": "2025-01-15T10:30:00Z",
      "purchased": false
    }
  ],
  "totalGenerations": 5,
  "purchasedCount": 2
}
```

**Użycie:**
- Admin panel: wyświetlanie generacji klienta
- Follow-up emaile: wysyłanie obrazów
- Dashboard: statystyki

---

### **KROK 6: Aktualizacja flagi "purchased" po zakupie**

**Modyfikacja:** Webhook Shopify `orders/paid`

**Logika:**
1. **Po otrzymaniu webhooka:**
   - Pobierz `customerId` z zamówienia
   - Pobierz `_AI_Image_URL` z properties zamówienia
   - Znajdź generację w Vercel KV (po `imageUrl`)
   - Zaktualizuj `purchased: true` i `orderId`

2. **Endpoint:** `POST /api/webhooks/orders/paid` (już istnieje)

**Zmiany:**
- Dodaj logikę aktualizacji generacji w Vercel KV
- Zaktualizuj flagę `purchased` dla odpowiedniej generacji

---

## 🗂️ STRUKTURA DANYCH

### **Vercel KV - Key Format:**

**Dla zalogowanych:**
```
customer:123456789:generations
```

**Dla niezalogowanych (email):**
```
email:user@example.com:generations
```

**Dla niezalogowanych (bez emaila - fallback):**
```
ip:192.168.1.1:generations
```

### **Vercel KV - Value Structure:**

```json
{
  "customerId": "123456789",
  "email": "user@example.com",
  "ip": "192.168.1.1",  // fallback
  "generations": [
    {
      "id": "gen-1234567890",
      "imageUrl": "https://blob.vercel-storage.com/customify/generations/123456789/1234567890-pixar.jpg",
      "style": "pixar",
      "productType": "other",
      "originalImageUrl": "https://...",  // opcjonalnie
      "date": "2025-01-15T10:30:00Z",
      "purchased": false,
      "orderId": null,
      "purchaseDate": null
    }
  ],
  "lastGenerationDate": "2025-01-15T10:30:00Z",
  "totalGenerations": 5,
  "purchasedCount": 2,
  "createdAt": "2025-01-10T08:00:00Z"
}
```

### **Vercel Blob - Path Structure:**

**Dla zalogowanych:**
```
customify/generations/{customerId}/{timestamp}-{style}.jpg
```

**Dla niezalogowanych (email):**
```
customify/generations/email-{email-hash}/{timestamp}-{style}.jpg
```

**Dla niezalogowanych (IP - fallback):**
```
customify/generations/ip-{ip-hash}/{timestamp}-{style}.jpg
```

---

## 🔄 FLOW UŻYTKOWNIKA

### **Scenariusz 1: Zalogowany użytkownik**

1. **Generuje obraz:**
   - `api/transform.js` → generuje obraz AI
   - Obraz zapisywany w Vercel Blob: `customify/generations/123456789/1234567890-pixar.jpg`
   - Wywołanie `/api/save-generation` z `customerId`
   - Zapis w Vercel KV: `customer:123456789:generations`
   - ✅ **Powiązanie zapisane**

2. **Nie dodaje do koszyka:**
   - Obraz pozostaje w Vercel Blob
   - Metadata w Vercel KV z `purchased: false`
   - ✅ **Możemy wysłać follow-up email**

3. **Dodaje do koszyka (później):**
   - Webhook `orders/paid` → aktualizuje `purchased: true`
   - ✅ **Flaga zaktualizowana**

---

### **Scenariusz 2: Niezalogowany użytkownik (z emailem)**

1. **Generuje obraz:**
   - `api/transform.js` → generuje obraz AI
   - Obraz zapisywany w Vercel Blob: `customify/generations/email-abc123/1234567890-pixar.jpg`
   - Wywołanie `/api/save-generation` z `email`
   - Zapis w Vercel KV: `email:user@example.com:generations`
   - ✅ **Powiązanie zapisane**

2. **Rejestruje się później:**
   - Po rejestracji → możemy połączyć generacje z `customerId`
   - Endpoint: `/api/link-email-to-customer` (opcjonalnie)

---

### **Scenariusz 3: Niezalogowany użytkownik (bez emaila)**

1. **Generuje obraz:**
   - `api/transform.js` → generuje obraz AI
   - Obraz zapisywany w Vercel Blob: `customify/generations/ip-xyz789/1234567890-pixar.jpg`
   - Wywołanie `/api/save-generation` z `ip` (fallback)
   - Zapis w Vercel KV: `ip:192.168.1.1:generations`
   - ⚠️ **Powiązanie słabe (tylko IP)**

2. **Rejestruje się później:**
   - Trudne powiązanie (tylko IP)
   - Można próbować połączyć po dacie/IP (niepewne)

---

## 📊 KORZYŚCI

### **1. Follow-up emaile:**
- Mamy wszystkie generacje klienta (nawet niekupione)
- Możemy wysłać obrazy w emailu
- Możemy zachęcić do zakupu

### **2. Statystyki:**
- Ile generacji robi klient przed zakupem?
- Które style są najpopularniejsze?
- Jaki % generacji kończy się zakupem?

### **3. Admin panel:**
- Wyświetlanie generacji klienta
- Możliwość ręcznego dodania do koszyka
- Analiza zachowań użytkowników

### **4. Personalizacja:**
- "Ostatnio generowałeś w stylu Pixar"
- "Zobacz inne style"
- "Kontynuuj zakup"

---

## 🔐 BEZPIECZEŃSTWO

### **1. Dostęp do generacji:**
- Tylko właściciel (`customerId`/`email`) może zobaczyć swoje generacje
- Admin może zobaczyć wszystkie (dla supportu)

### **2. Rate Limiting:**
- `/api/save-generation`: 50 requestów / 15 minut (IP)
- `/api/get-customer-generations`: 20 requestów / 15 minut (IP)

### **3. Walidacja:**
- Sprawdzenie czy `customerId` istnieje w Shopify
- Sprawdzenie formatu emaila
- Sprawdzenie czy obraz istnieje w Vercel Blob

---

## 📋 CHECKLIST IMPLEMENTACJI

### **Backend:**
- [ ] Endpoint `/api/save-generation` (zapis w Vercel KV)
- [ ] Modyfikacja `api/transform.js` (wywołanie zapisu po generacji)
- [ ] Endpoint `/api/get-customer-generations` (pobieranie generacji)
- [ ] Modyfikacja webhook `orders/paid` (aktualizacja flagi `purchased`)
- [ ] Rate limiting dla nowych endpointów
- [ ] Error handling (Vercel KV errors)

### **Frontend:**
- [ ] Modyfikacja `customify.js` (przekazanie `customerId`/`email` do API)
- [ ] Sprawdzanie czy użytkownik zalogowany (przekazanie `customerId`)
- [ ] Sprawdzanie localStorage (przekazanie `email`)

### **Vercel:**
- [ ] Konfiguracja Vercel KV (Environment Variables)
- [ ] Test zapisu/odczytu z Vercel KV
- [ ] Test Vercel Blob Storage (struktura folderów)

### **Shopify:**
- [ ] Sprawdzenie uprawnień: `read_customers` (dla walidacji `customerId`)
- [ ] Test webhook `orders/paid` (aktualizacja flagi)

---

## 🚀 KOLEJNOŚĆ WDROŻENIA

### **Faza 1: Podstawowy zapis**
1. Endpoint `/api/save-generation`
2. Modyfikacja `api/transform.js` (wywołanie zapisu)
3. Frontend: przekazanie `customerId`/`email`

### **Faza 2: Pobieranie generacji**
1. Endpoint `/api/get-customer-generations`
2. Test pobierania generacji

### **Faza 3: Aktualizacja po zakupie**
1. Modyfikacja webhook `orders/paid`
2. Aktualizacja flagi `purchased`

### **Faza 4: Follow-up (opcjonalnie)**
1. Użycie generacji w follow-up emailach
2. Dashboard ze statystykami

---

## ✅ GOTOWE DO IMPLEMENTACJI

Plan jest gotowy. Możemy zacząć od Fazy 1 (podstawowy zapis).

