# 🛡️ DEVICE TOKEN CROSS-ACCOUNT DETECTION - INSTRUKCJA

## 📋 **CO TO JEST?**

Device Token Cross-Account Detection to system wykrywania abuse, gdzie ten sam device token (cookie w przeglądarce) jest używany przez wiele zalogowanych kont.

**Problem:**
- Oszuści tworzą wiele kont (np. `magdasia01@wp.pl`, `bts_army@wp.pl`)
- Każde konto ma 4 darmowe generacje (Shopify metafield limit)
- Używają tego samego urządzenia (device token = cookie)
- Obchodzą limit tworząc nowe emaile

**Rozwiązanie:**
- 1 device token = max 2 różne customerIds
- Jeśli device token ma już 2 konta i próbuje się zalogować 3. = BLOKADA

---

## 🔧 **JAK DZIAŁA?**

### **Storage w Vercel KV:**
```javascript
// Klucz: device:{deviceToken}:customers
// Wartość: JSON array z customerIds

device:d11f6b3b4aac002ef95c084e4f6736f0:customers = ["25928807153989", "25930613817669"]
```

### **Flow:**

#### **Konto 1: magdasia01@wp.pl**
```
1. Loguje się na device token: d11f6...
2. Robi 4 generacje
3. KV zapisuje: device:d11f6...:customers = ["25928807153989"]
```

#### **Konto 2: bts_army@wp.pl**
```
1. Loguje się na device token: d11f6... (TEN SAM!)
2. Cross-account check:
   - Lista: ["25928807153989"]
   - Obecny customerId: "25930613817669"
   - Lista ma 1 element < 2 → ✅ ALLOWED
3. Robi 4 generacje
4. KV aktualizuje: device:d11f6...:customers = ["25928807153989", "25930613817669"]
```

#### **Konto 3: thirdaccount@wp.pl**
```
1. Próbuje zalogować się na device token: d11f6... (TEN SAM!)
2. Cross-account check:
   - Lista: ["25928807153989", "25930613817669"]
   - Obecny customerId: "25930999999999"
   - Lista ma 2 elementy (max) i obecny NIE jest na liście → ❌ BLOKADA
3. Komunikat: "Wykryto nadużycie: to urządzenie jest już używane przez 2 różne konta"
```

---

## 📂 **PLIKI I FUNKCJE**

### **utils/vercelKVLimiter.js:**

#### **checkDeviceTokenCrossAccount(deviceToken, customerId)**
```javascript
// Sprawdza czy device token może być użyty przez to konto
// Zwraca: { allowed: boolean, customerIds: [], limit: 2 }

const result = await checkDeviceTokenCrossAccount('d11f6...', '25930613817669');

if (!result.allowed) {
  // BLOKADA - device token ma już 2 konta
  return res.status(403).json({ error: 'Multiple accounts detected' });
}
```

#### **addCustomerToDeviceToken(deviceToken, customerId)**
```javascript
// Dodaje customerId do listy (po udanej transformacji)
// Zwraca: { success: boolean, customerIds: [] }

const result = await addCustomerToDeviceToken('d11f6...', '25930613817669');

if (result.success) {
  console.log(`CustomerId dodany: ${result.customerIds.length}/2 kont`);
}
```

### **api/transform.js:**

#### **Sprawdzanie (linie ~1085-1115):**
```javascript
if (customerId && deviceToken && isKVConfigured()) {
  const crossAccountCheck = await checkDeviceTokenCrossAccount(deviceToken, customerId);
  
  if (!crossAccountCheck.allowed) {
    return res.status(403).json({
      error: 'Multiple accounts detected',
      message: `Wykryto nadużycie: to urządzenie jest już używane przez ${crossAccountCheck.limit} różne konta.`
    });
  }
}
```

#### **Inkrementacja (linie ~2491-2498):**
```javascript
if (customerId && deviceToken) {
  const addCustomerResult = await addCustomerToDeviceToken(deviceToken, customerId);
  
  if (addCustomerResult.success) {
    console.log(`CustomerId dodany: ${addCustomerResult.customerIds.length}/2 kont`);
  }
}
```

---

## 🧪 **TESTOWANIE**

### **Test Case 1: Pierwsze konto (OK)**
```bash
# Konto 1: magdasia01@wp.pl
curl -X POST https://customify-s56o.vercel.app/api/transform \
  -H "Content-Type: application/json" \
  -H "Cookie: customify_device_token=test123" \
  -d '{
    "imageData": "data:image/jpeg;base64,...",
    "style": "karykatura",
    "customerId": "25928807153989",
    "customerAccessToken": "token123"
  }'

# Oczekiwany wynik: ✅ OK
# KV: device:test123:customers = ["25928807153989"]
```

### **Test Case 2: Drugie konto (OK)**
```bash
# Konto 2: bts_army@wp.pl (TEN SAM device token)
curl -X POST https://customify-s56o.vercel.app/api/transform \
  -H "Content-Type: application/json" \
  -H "Cookie: customify_device_token=test123" \
  -d '{
    "imageData": "data:image/jpeg;base64,...",
    "style": "karykatura",
    "customerId": "25930613817669",
    "customerAccessToken": "token456"
  }'

# Oczekiwany wynik: ✅ OK
# KV: device:test123:customers = ["25928807153989", "25930613817669"]
```

### **Test Case 3: Trzecie konto (BLOKADA)**
```bash
# Konto 3: thirdaccount@wp.pl (TEN SAM device token)
curl -X POST https://customify-s56o.vercel.app/api/transform \
  -H "Content-Type: application/json" \
  -H "Cookie: customify_device_token=test123" \
  -d '{
    "imageData": "data:image/jpeg;base64,...",
    "style": "karykatura",
    "customerId": "25930999999999",
    "customerAccessToken": "token789"
  }'

# Oczekiwany wynik: ❌ BLOKADA (403)
# Response: { "error": "Multiple accounts detected", "message": "Wykryto nadużycie..." }
```

---

## 🔍 **DEBUGGING**

### **Sprawdzenie w Vercel KV:**
```bash
# Vercel CLI (jeśli masz dostęp)
vercel env pull

# Albo przez Vercel Dashboard → Storage → KV
# Klucz: device:{deviceToken}:customers
# Wartość: JSON array
```

### **Logi w Vercel:**
```bash
# Live streaming logów
vercel logs customify-s56o.vercel.app --follow

# Szukaj:
# 🔍 [KV-LIMITER-CROSS] Device token cross-account check
# ✅ [KV-LIMITER-CROSS] CustomerId już na liście - allowed
# ❌ [KV-LIMITER-CROSS] BLOKADA - device token ma już 2 różnych kont
# ➕ [KV-LIMITER-CROSS] CustomerId dodany do device token
```

### **Przykładowe logi:**
```
🔍 [CROSS-ACCOUNT] START sprawdzanie cross-account detection:
  customerId: 25930613...
  deviceToken: d11f6b3b4a...

🔍 [KV-LIMITER-CROSS] Device token cross-account check:
  deviceToken: d11f6b3b...
  customerId: 25930613...
  existingCustomers: 1
  customerIds: [ '25928807...' ]
  limit: 2

✅ [KV-LIMITER-CROSS] Lista ma 1/2 - można dodać

✅ [CROSS-ACCOUNT] Sprawdzenie OK: 1/2 kont na tym urządzeniu

... (po transformacji) ...

➕ [KV-LIMITER-CROSS] CustomerId dodany do device token:
  deviceToken: d11f6b3b...
  customerId: 25930613...
  totalCustomers: 2
  customerIds: [ '25928807...', '25930613...' ]

➕ [TRANSFORM] CustomerId dodany do device token: 2/2 kont
```

---

## ⚙️ **KONFIGURACJA**

### **Wymagane:**
- ✅ Vercel KV skonfigurowany (`KV_REST_API_URL`, `KV_REST_API_TOKEN`)
- ✅ Device token cookie (`customify_device_token`) - już działający

### **Parametry:**
- **Limit:** `2` różne customerIds per device token (hardcoded w `utils/vercelKVLimiter.js`)
- **TTL:** Brak (permanentne przechowywanie)
- **Failsafe:** Jeśli KV error → pozwól (nie blokuj użytkowników)

### **Zmiana limitu:**
```javascript
// W utils/vercelKVLimiter.js, linia ~271
const limit = 2; // Zmień na 3, 4, etc.
```

---

## 🚨 **OBEJŚCIE PRZEZ UŻYTKOWNIKA**

### **Możliwe:**
1. Czyszczenie cookies (DevTools → Application → Cookies → Delete)
2. Tryb incognito (nowy device token)
3. Inna przeglądarka (nowy device token)

### **Dlaczego to OK:**
- Wymaga technicznej wiedzy (większość użytkowników nie wie jak)
- Kombinacja z IP limit (10/24h) dalej blokuje
- Image hash limit (2/obrazek) dalej blokuje
- To nie jest 100% ochrona, ale **znacznie utrudnia** abuse

---

## 📊 **PRZYKŁAD ABUSE (PRAWDZIWY)**

### **Statystyki z produkcji:**
```json
{
  "customerId": "25928807153989",
  "email": "magdasia01@wp.pl",
  "ip": "188.146.152.87",
  "deviceToken": "d11f6b3b4aac002ef95c084e4f6736f0",
  "generations": 3
}

{
  "customerId": "25930613817669",
  "email": "bts_army@wp.pl",
  "ip": "188.146.152.87",
  "deviceToken": "d11f6b3b4aac002ef95c084e4f6736f0", // ← TEN SAM!
  "generations": 1
}
```

**Bez Cross-Account Detection:**
- Konto 1: 3 generacje ✅
- Konto 2: 1 generacja ✅
- Konto 3: 4 generacje ✅
- **Total: 8 generacji** zamiast 4! ❌

**Z Cross-Account Detection:**
- Konto 1: 3 generacje ✅
- Konto 2: 1 generacja ✅
- Konto 3: BLOKADA ❌
- **Total: 4 generacje (max 2 konta × 4 = 8, ale IP limit 10 też pomaga)** ✅

---

## ✅ **STATUS**

- ✅ Zaimplementowane w `utils/vercelKVLimiter.js`
- ✅ Zintegrowane w `api/transform.js`
- ✅ Dokumentacja w `.cursorrules`
- ✅ Instrukcja w `CROSS-ACCOUNT-DETECTION-INSTRUKCJA.md`
- 🔄 Gotowe do deployu na Vercel

---

## 🎯 **NASTĘPNE KROKI**

1. **Deploy na Vercel:** `git push origin main` (auto-deploy)
2. **Test w produkcji:** Spróbuj utworzyć 3 konta z tego samego urządzenia
3. **Monitor logów:** `vercel logs customify-s56o.vercel.app --follow`
4. **Sprawdź KV:** Vercel Dashboard → Storage → KV → `device:*:customers`

---

## 💡 **PRZYSZŁE ULEPSZENIA**

Jeśli to nie wystarczy, możesz dodać:
1. **SMS Verification** - definitywne rozwiązanie (1 numer = 1-2 konta)
2. **IP + Device Fingerprint** - kombinacja IP:deviceToken
3. **Admin Review System** - ręczna weryfikacja high-usage kont
4. **Tighter Limits** - zmniejsz limit z 2 na 1 konto per device token



