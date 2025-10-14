# 🎯 SYSTEM LIMITÓW UŻYCIA API

## 📊 LIMITY

### **Niezalogowani użytkownicy:**
- ✅ **3 darmowe transformacje** (localStorage w przeglądarce)
- ❌ Po wykorzystaniu → Modal z wymogiem logowania
- 🔄 Reset: Wyczyszczenie localStorage przeglądarki

### **Zalogowani użytkownicy:**
- ✅ **13 total transformacji** (3 darmowe + 10 po zalogowaniu)
- 📊 Licznik przechowywany w **Shopify Customer Metafields**
- 🔐 Trwałe - nie można zresetować czyszcząc przeglądarkę
- ⚙️ Admin może ręcznie zresetować w Shopify Admin

---

## 🏗️ ARCHITEKTURA

### **Frontend (customify.js):**

#### **1. Wykrywanie użytkownika:**
```javascript
getCustomerInfo() {
  // Sprawdza window.Shopify.customerEmail
  // Pobiera customerId z window.meta.customer.id
  // Pobiera customerAccessToken z localStorage
  return { customerId, email, customerAccessToken } lub null
}
```

#### **2. Sprawdzanie limitów PRZED transformacją:**
```javascript
async checkUsageLimit() {
  // Niezalogowani: localStorage (3 użycia)
  // Zalogowani: API call do /api/check-usage (13 użyć)
  // return true/false
}
```

#### **3. Inkrementacja PO udanej transformacji:**
```javascript
// Niezalogowani: localStorage++
incrementLocalUsage()

// Zalogowani: backend automatycznie inkrementuje w transform.js
showUsageCounter() // Odśwież UI
```

#### **4. Licznik w UI:**
```javascript
showUsageCounter() {
  // Niezalogowani: localStorage count
  // Zalogowani: API call do /api/check-usage
  // Wyświetla kolorowy banner: pozostało X/Y transformacji
}
```

#### **5. Modal logowania:**
```javascript
showLoginModal(usedCount, limit) {
  // Pokazuje modal z przyciskami:
  // - Zaloguj się (/account/login)
  // - Zarejestruj się (/account/register)
  // - Zamknij
}
```

---

### **Backend APIs:**

#### **1. `/api/check-usage` (POST)**
**Przeznaczenie:** Sprawdza liczbę użyć dla zalogowanego użytkownika

**Request:**
```json
{
  "customerId": "123456789",
  "customerAccessToken": "token..."
}
```

**Response (zalogowany):**
```json
{
  "isLoggedIn": true,
  "customerId": "123456789",
  "email": "user@example.com",
  "totalLimit": 13,
  "usedCount": 5,
  "remainingCount": 8,
  "message": "Pozostało 8 transformacji"
}
```

**Response (niezalogowany):**
```json
{
  "isLoggedIn": false,
  "totalLimit": 3,
  "usedCount": 0,
  "remainingCount": 3,
  "message": "Masz 3 darmowe transformacje. Zaloguj się dla więcej!"
}
```

---

#### **2. `/api/increment-usage` (POST)**
**Przeznaczenie:** Inkrementuje licznik dla zalogowanego użytkownika (obecnie niewykorzystywane - inkrementacja w transform.js)

**Request:**
```json
{
  "customerId": "123456789",
  "customerAccessToken": "token..."
}
```

**Response:**
```json
{
  "success": true,
  "previousUsage": 5,
  "newUsage": 6,
  "message": "Użycie zaktualizowane: 6"
}
```

---

#### **3. `/api/transform` (POST) - zmodyfikowany**
**Nowe pola:**
- `customerId` (opcjonalne) - ID zalogowanego użytkownika
- `customerAccessToken` (opcjonalne) - Token dostępu

**Request:**
```json
{
  "imageData": "base64...",
  "prompt": "Transform in pixar style",
  "productType": "boho",
  "customerId": "123456789",
  "customerAccessToken": "token..."
}
```

**Logika:**
1. **PRZED transformacją:** Sprawdza limit w Shopify Metafields
2. Jeśli limit przekroczony → `403 Forbidden`
3. Wykonuje transformację AI
4. **PO transformacji:** Automatycznie inkrementuje licznik w Shopify Metafields
5. Zwraca wynik

**Response (sukces):**
```json
{
  "success": true,
  "transformedImage": "https://replicate.delivery/..."
}
```

**Response (limit przekroczony):**
```json
{
  "error": "Usage limit exceeded",
  "message": "Wykorzystałeś wszystkie dostępne transformacje (13). Skontaktuj się z nami dla więcej.",
  "usedCount": 13,
  "totalLimit": 13
}
```

---

## 🗄️ SHOPIFY METAFIELDS

### **Namespace:** `customify`
### **Key:** `usage_count`
### **Type:** `number_integer`
### **Value:** Liczba użyć (0-13)

### **Lokalizacja w Shopify Admin:**
```
Customers → [Wybierz klienta] → Metafields → customify.usage_count
```

### **GraphQL Query (odczyt):**
```graphql
query getCustomerUsage($id: ID!) {
  customer(id: $id) {
    id
    email
    metafield(namespace: "customify", key: "usage_count") {
      value
    }
  }
}
```

### **GraphQL Mutation (zapis):**
```graphql
mutation updateCustomerUsage($input: CustomerInput!) {
  customerUpdate(input: $input) {
    customer {
      id
      metafield(namespace: "customify", key: "usage_count") {
        value
      }
    }
    userErrors {
      field
      message
    }
  }
}
```

---

## 🔐 BEZPIECZEŃSTWO

### **1. Rate Limiting (IP-based):**
- **API transform:** 20 requestów / 15 minut
- **API check-usage:** 100 requestów / 15 minut
- **Backup security** - działa nawet jeśli użytkownik obejdzie frontend

### **2. Shopify Access Token:**
- Przechowywany w Vercel Environment Variables
- Nigdy nie jest wysyłany do klienta
- Używany tylko w backend API calls

### **3. Customer Access Token:**
- Generowany przez Shopify po logowaniu
- Przechowywany w localStorage klienta
- Weryfikowany przez Shopify GraphQL API

### **4. localStorage (niezalogowani):**
- ⚠️ **Łatwy do obejścia** (wyczyszczenie przeglądarki)
- 🎯 **Cel:** Motywacja do rejestracji, nie twarda blokada
- 🔒 **Backup:** IP-based rate limiting (20/15min)

---

## 📱 WORKFLOW UŻYTKOWNIKA

### **Scenariusz 1: Niezalogowany użytkownik**
1. Wchodzi na stronę produktu
2. Widzi licznik: "🎨 Pozostało 3/3 darmowych transformacji"
3. Uploaduje zdjęcie, wybiera styl, klika "Zobacz Podgląd"
4. ✅ Transformacja OK → localStorage: 2/3
5. Kolejna transformacja → localStorage: 1/3
6. Kolejna transformacja → localStorage: 0/3
7. ❌ **4-ta transformacja:** Modal z wymogiem logowania
8. Klika "Zaloguj się" → przekierowanie do `/account/login`

### **Scenariusz 2: Zalogowany użytkownik (nowy)**
1. Loguje się → Shopify tworzy Customer Account
2. Wchodzi na stronę produktu
3. Widzi licznik: "✅ Zalogowany: 13/13 transformacji"
4. Wykonuje transformację → Backend: Shopify Metafields `usage_count = 1`
5. Kolejne transformacje → `usage_count` rośnie: 2, 3, 4... 13
6. ❌ **14-ta transformacja:** Błąd "Wykorzystałeś wszystkie transformacje (13)"

### **Scenariusz 3: Zalogowany użytkownik (kontynuacja po 3 darmowych)**
1. Niezalogowany: Użył 3 darmowe (localStorage)
2. Loguje się → Shopify Customer Account
3. Backend **NIE** kopiuje localStorage do Metafields (osobne liczniki!)
4. Użytkownik dostaje pełne 13 transformacji (nowy licznik)
5. ✅ **Bonus:** 3 localStorage + 13 Shopify = 16 total (feature, not bug)

---

## 🧪 TESTOWANIE

### **Test 1: Niezalogowany użytkownik**
```javascript
// Otwórz konsolę przeglądarki
localStorage.setItem('customify_usage_count', '2'); // Ustaw 2 użycia
location.reload(); // Odśwież stronę
// Sprawdź licznik: "Pozostało 1/3 darmowych transformacji"
// Wykonaj transformację → Modal logowania po 3-ciej
```

### **Test 2: Reset localStorage**
```javascript
localStorage.removeItem('customify_usage_count');
location.reload();
// Licznik reset: "Pozostało 3/3 darmowych transformacji"
```

### **Test 3: Zalogowany użytkownik**
1. Zaloguj się: https://lumly.pl/account/login
2. Sprawdź licznik w konsoli:
```javascript
const customerInfo = window.customifyEmbed.getCustomerInfo();
console.log('Customer:', customerInfo);
```
3. Wykonaj transformację
4. Sprawdź w Shopify Admin: Customers → [twój email] → Metafields

### **Test 4: Shopify Admin - ręczny reset**
1. Shopify Admin → Customers
2. Wybierz klienta
3. Znajdź Metafield: `customify.usage_count`
4. Ustaw wartość: `0` (reset) lub `13` (max)
5. Zapisz

---

## 🔧 KONFIGURACJA

### **Zmiana limitów:**

#### **Frontend (customify.js):**
```javascript
// Linia ~109
const FREE_LIMIT = 3; // Zmień na inny limit dla niezalogowanych

// Linia ~192
const totalLimit = 13; // Zmień na inny limit dla zalogowanych
```

#### **Backend (api/transform.js):**
```javascript
// Linia ~192
const totalLimit = 13; // Musi być zgodne z frontendem
```

#### **Backend (api/check-usage.js):**
```javascript
// Linia ~57
const totalLimit = 13; // Musi być zgodne z frontendem
```

### **Zmiana wiadomości:**
- **Modal logowania:** `customify.js` linia ~176
- **Licznik UI:** `customify.js` linia ~240, ~270
- **Błąd API:** `api/transform.js` linia ~200

---

## 📈 MONITORING

### **Console Logs:**

#### **Frontend:**
```
✅ [USAGE] Zalogowany użytkownik: user@example.com
📊 [USAGE] localStorage usage count: 2
📊 [USAGE] Niezalogowany: 2/3 użyć
➕ [USAGE] localStorage incremented: 2 → 3
🔄 [USAGE] Counter refreshed for logged-in user
❌ [USAGE] Limit przekroczony - przerwano transformację
```

#### **Backend:**
```
🔍 [TRANSFORM] Sprawdzam limity dla zalogowanego użytkownika...
📊 [TRANSFORM] Użytkownik user@example.com: 5/13 użyć
✅ [TRANSFORM] Limit OK - kontynuuję transformację
➕ [TRANSFORM] Inkrementuję licznik dla użytkownika 123456789
✅ [TRANSFORM] Licznik zaktualizowany: 5 → 6
❌ [TRANSFORM] Limit przekroczony dla użytkownika user@example.com
```

---

## 🐛 TROUBLESHOOTING

### **Problem: Licznik nie się aktualizuje**
```javascript
// Wyczyść cache i odśwież
localStorage.clear();
location.reload();
```

### **Problem: Zalogowany użytkownik widzi limit 3 zamiast 13**
```javascript
// Sprawdź czy Shopify rozpoznaje użytkownika
console.log('Shopify customer:', window.Shopify.customerEmail);
console.log('Customer ID:', window.meta?.customer?.id);

// Jeśli null → użytkownik nie jest zalogowany w Shopify
// Zaloguj się ponownie: https://lumly.pl/account/login
```

### **Problem: Backend nie aktualizuje Metafields**
```bash
# Sprawdź logi Vercel
# https://vercel.com/[twój-projekt]/[deployment]/functions

# Sprawdź czy SHOPIFY_ACCESS_TOKEN jest ustawiony
# Vercel Dashboard → Settings → Environment Variables
```

### **Problem: Modal logowania nie znika**
```javascript
// Usuń modal ręcznie
document.getElementById('loginModal')?.remove();
```

---

## 🚀 WDROŻENIE

### **1. Deploy do Shopify:**
```bash
npm run deploy
```

### **2. Deploy do Vercel (automatyczny):**
```bash
git add .
git commit -m "Update usage limits"
git push origin main
# Vercel automatycznie deployuje
```

### **3. Testowanie:**
1. Otwórz: https://lumly.pl/products/custom
2. Sprawdź licznik użyć
3. Wykonaj transformację
4. Sprawdź czy licznik się zmniejsza

---

## 📝 CHANGELOG

### **2025-01-15: Initial Release**
- ✅ System limitów użycia (3 darmowe + 10 zalogowanych)
- ✅ localStorage dla niezalogowanych
- ✅ Shopify Metafields dla zalogowanych
- ✅ Modal logowania
- ✅ Licznik w UI
- ✅ Auto-inkrementacja w backend
- ✅ IP-based rate limiting (backup security)

---

## 🎯 ROADMAP

### **Future Improvements:**
- [ ] Dashboard użytkownika z historią transformacji
- [ ] System kredytów (płatne pakiety)
- [ ] Email notyfikacje przy niskim limicie
- [ ] Admin panel do zarządzania limitami
- [ ] Analytics: najpopularniejsze style
- [ ] Referral program (zaproś znajomego = +5 transformacji)

---

## 📞 SUPPORT

### **Pytania:**
Kontakt: [email support]

### **Dokumentacja Shopify:**
- [Customer Metafields](https://shopify.dev/docs/api/admin-graphql/latest/objects/Metafield)
- [Customer Accounts](https://shopify.dev/docs/storefronts/headless/building-with-the-customer-account-api)
- [GraphQL Admin API](https://shopify.dev/docs/api/admin-graphql)

