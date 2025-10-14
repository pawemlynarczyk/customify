# 🚀 QUICK START - System Limitów Użycia

## ✅ CO ZOSTAŁO ZAIMPLEMENTOWANE?

### **🎨 LIMITY UŻYCIA:**
```
┌─────────────────────────────────────────┐
│  NIEZALOGOWANI → 3 darmowe użycia      │
│  (localStorage)                         │
└─────────────────────────────────────────┘
                ↓ ZALOGUJ SIĘ
┌─────────────────────────────────────────┐
│  ZALOGOWANI → +10 dodatkowych = 13      │
│  (Shopify Metafields)                   │
└─────────────────────────────────────────┘
```

---

## 🎯 JAK TO DZIAŁA?

### **1. NIEZALOGOWANY UŻYTKOWNIK (3 użycia):**
```
1. Wchodzi na stronę → Widzi: "🎨 Pozostało 3/3 darmowych transformacji"
2. Pierwsza transformacja → "🎨 Pozostało 2/3"
3. Druga transformacja → "🎨 Pozostało 1/3"
4. Trzecia transformacja → "🎨 Pozostało 0/3"
5. Czwarta próba → 🚫 MODAL: "Zaloguj się dla +10 transformacji"
```

### **2. ZALOGOWANY UŻYTKOWNIK (13 użyć):**
```
1. Loguje się → Shopify Customer Account
2. Widzi: "✅ Zalogowany: 13/13 transformacji"
3. Każda transformacja → licznik maleje: 12, 11, 10...
4. Po 13 transformacjach → 🚫 "Wykorzystałeś wszystkie (13)"
```

---

## 📂 NOWE PLIKI:

### **Backend:**
✅ `api/check-usage.js` - Sprawdzanie limitów  
✅ `api/increment-usage.js` - Inkrementacja licznika  
✅ `api/transform.js` - Zmodyfikowany (sprawdza + inkrementuje)

### **Frontend:**
✅ `shopify-theme/customify-theme/assets/customify.js` - Zmodyfikowany:
- `getCustomerInfo()` - wykrywa zalogowanego użytkownika
- `checkUsageLimit()` - sprawdza limit PRZED transformacją
- `showLoginModal()` - modal z wymogiem logowania
- `showUsageCounter()` - licznik w UI
- `incrementLocalUsage()` - inkrementacja localStorage

### **Dokumentacja:**
✅ `USAGE-LIMITS.md` - Pełna dokumentacja techniczna

---

## 🧪 TESTOWANIE:

### **Test 1: Niezalogowany (3 użycia)**
```javascript
// 1. Otwórz: https://lumly.pl/products/custom
// 2. Otwórz konsolę (F12)
// 3. Ustaw 2 użycia:
localStorage.setItem('customify_usage_count', '2');
location.reload();

// 4. Wykonaj transformację → Modal logowania po 1 użyciu
```

### **Test 2: Reset localStorage**
```javascript
// Wyczyść licznik (symulacja nowego użytkownika)
localStorage.removeItem('customify_usage_count');
location.reload();
// Licznik: "Pozostało 3/3 darmowych transformacji"
```

### **Test 3: Zalogowany użytkownik**
```
1. Zaloguj się: https://lumly.pl/account/login
2. Otwórz: https://lumly.pl/products/custom
3. Sprawdź licznik: "✅ Zalogowany: 13/13 transformacji"
4. Wykonaj transformację
5. Licznik: "✅ Zalogowany: 12/13 transformacji"
6. Shopify Admin → Customers → [twój email] → Metafields → customify.usage_count = 1
```

---

## 📊 SHOPIFY METAFIELDS:

### **Lokalizacja:**
```
Shopify Admin → Customers → [Wybierz klienta] → Metafields
```

### **Dane:**
```
Namespace: customify
Key: usage_count
Type: number_integer
Value: 0-13 (liczba użyć)
```

### **Reset ręczny:**
1. Shopify Admin → Customers
2. Wybierz klienta
3. Metafields → customify.usage_count
4. Zmień wartość na `0` (reset)
5. Zapisz

---

## 🔐 BEZPIECZEŃSTWO:

### **3 POZIOMY OCHRONY:**

#### **1. Frontend (localStorage):**
- ⚠️ Łatwy do obejścia (wyczyszczenie przeglądarki)
- 🎯 Cel: Motywacja do rejestracji

#### **2. Backend (Shopify Metafields):**
- ✅ Trwały - nie można zresetować z przeglądarki
- 🔒 Tylko admin może zmodyfikować

#### **3. IP Rate Limiting:**
- ✅ 20 requestów / 15 minut (backup security)
- 🛡️ Działa nawet jeśli ktoś obejdzie frontend

---

## 🎨 UI ELEMENTS:

### **Licznik użyć:**
```
┌──────────────────────────────────────────────┐
│  🎨 Pozostało 3/3 darmowych transformacji    │ ← Zielony (niezalogowani, pozostało >0)
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  ❌ Wykorzystano 3/3 - Zaloguj się!          │ ← Czerwony (niezalogowani, limit)
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  ✅ Zalogowany: 12/13 transformacji          │ ← Niebieski (zalogowani, pozostało >0)
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  ❌ Wykorzystano 13/13 transformacji         │ ← Czerwony (zalogowani, limit)
└──────────────────────────────────────────────┘
```

### **Modal logowania:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  🎨 Wykorzystałeś darmowe transformacje!           │
│                                                     │
│  Użyłeś 3/3 darmowych transformacji.               │
│  Zaloguj się aby otrzymać +10 dodatkowych!         │
│                                                     │
│  [ Zaloguj się ]  [ Zarejestruj się ]  [ Zamknij ] │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 ZMIANA LIMITÓW:

### **Gdzie zmienić:**

#### **Frontend (customify.js):**
```javascript
// Linia ~109
const FREE_LIMIT = 3; // ← ZMIEŃ TUTAJ (niezalogowani)

// Linia ~192
const totalLimit = 13; // ← ZMIEŃ TUTAJ (zalogowani)
```

#### **Backend (api/transform.js):**
```javascript
// Linia ~192
const totalLimit = 13; // ← MUSI być zgodne z frontendem
```

#### **Backend (api/check-usage.js):**
```javascript
// Linia ~57
const totalLimit = 13; // ← MUSI być zgodne z frontendem
```

### **Po zmianie:**
```bash
npm run deploy  # Wdróż do Shopify
git add .
git commit -m "Zmiana limitów użycia"
git push origin main  # Vercel auto-deploy
```

---

## 📝 CONSOLE LOGS (monitoring):

### **Frontend:**
```
✅ [USAGE] Zalogowany użytkownik: user@example.com
📊 [USAGE] localStorage usage count: 2
📊 [USAGE] Niezalogowany: 2/3 użyć
➕ [USAGE] localStorage incremented: 2 → 3
❌ [USAGE] Limit przekroczony - przerwano transformację
```

### **Backend (Vercel):**
```
🔍 [TRANSFORM] Sprawdzam limity dla zalogowanego użytkownika...
📊 [TRANSFORM] Użytkownik user@example.com: 5/13 użyć
✅ [TRANSFORM] Limit OK - kontynuuję transformację
➕ [TRANSFORM] Inkrementuję licznik: 5 → 6
✅ [TRANSFORM] Licznik zaktualizowany
❌ [TRANSFORM] Limit przekroczony
```

---

## 🐛 TROUBLESHOOTING:

### **Problem: Licznik nie się aktualizuje**
```javascript
// Konsola przeglądarki:
localStorage.clear();
location.reload();
```

### **Problem: Modal nie znika**
```javascript
// Konsola przeglądarki:
document.getElementById('loginModal')?.remove();
```

### **Problem: Zalogowany widzi 3 zamiast 13**
```javascript
// Sprawdź czy Shopify rozpoznaje użytkownika:
console.log('Customer:', window.Shopify.customerEmail);
console.log('ID:', window.meta?.customer?.id);

// Jeśli null → zaloguj się ponownie:
// https://lumly.pl/account/login
```

---

## 🚀 STATUS WDROŻENIA:

✅ **Backend APIs** - wdrożone do Vercel  
✅ **Frontend JS** - wdrożone do Shopify  
✅ **Dokumentacja** - USAGE-LIMITS.md  
✅ **Git commit & push** - zmieniane w GitHub  
✅ **Vercel auto-deploy** - aktywne  

### **Sprawdź na żywo:**
🌐 https://lumly.pl/products/custom

---

## 📞 WSPARCIE:

📖 **Pełna dokumentacja:** `USAGE-LIMITS.md`  
🐛 **Issue tracker:** GitHub Issues  
💬 **Pytania:** [kontakt email]

---

## 🎯 NASTĘPNE KROKI:

1. ✅ **Test na żywo:** https://lumly.pl/products/custom
2. ⚙️ **Dostosuj limity** (opcjonalnie) - zobacz sekcję "Zmiana limitów"
3. 📊 **Monitoruj użycie** - Shopify Admin → Customers → Metafields
4. 🎨 **Dostosuj wygląd** (opcjonalnie) - kolory, teksty w customify.js
5. 📧 **Email notyfikacje** (przyszłość) - powiadom przy niskim limicie

---

## 🎉 GOTOWE!

System limitów użycia jest **w pełni funkcjonalny**:
- ✅ Niezalogowani: 3 darmowe
- ✅ Zalogowani: +10 dodatkowych = 13 total
- ✅ Licznik w UI
- ✅ Modal logowania
- ✅ Automatyczna inkrementacja
- ✅ Shopify Metafields integration
- ✅ Backup security (IP rate limiting)

**Sprawdź teraz:** https://lumly.pl/products/custom

