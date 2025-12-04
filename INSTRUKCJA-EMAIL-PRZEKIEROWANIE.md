# 📧 Instrukcja: Przekierowanie do "Moje Generacje" po zalogowaniu

## 🎯 KTÓRE PLIKI UŻYĆ?

Masz **3 wersje** kodu - wybierz odpowiednią:

---

### ✅ **WERSJA 1: Email Aktywacyjny (NAJBARDZIEJ POLECANE)**

**Plik:** `shopify-email-activation-redirect.liquid`

**Kiedy używać:** Email który dostaje użytkownik zaraz po rejestracji (z linkiem "Aktywuj konto")

**Co robi:** Po kliknięciu "Aktywuj konto" → przekierowanie do `/pages/my-generations`

**Gdzie wkleić:**
1. Shopify Admin → Settings → Notifications
2. Znajdź: **"Customer account activation"** (NIE "Welcome")
3. Kliknij: "Edit code"
4. **ZAZNACZ CAŁY KOD** (Ctrl+A)
5. **WKLEJ** kod z pliku `shopify-email-activation-redirect.liquid`
6. Kliknij: "Save"

**Kluczowa zmiana:**
```liquid
<a href="{{ customer.account_activation_url }}?return_to=/pages/my-generations">
  Aktywuj konto i zobacz generacje
</a>
```

---

### ✅ **WERSJA 2: Email Welcome - Główny przycisk do Generacji**

**Plik:** `shopify-email-welcome-moje-generacje.liquid`

**Kiedy używać:** Email powitalny po aktywacji konta

**Co robi:** Główny przycisk prowadzi do `/pages/my-generations`, mniejszy link do `/account`

**Gdzie wkleić:**
1. Shopify Admin → Settings → Notifications
2. Znajdź: **"Customer account welcome"**
3. Kliknij: "Edit code"
4. **ZAZNACZ CAŁY KOD** (Ctrl+A)
5. **WKLEJ** kod z pliku `shopify-email-welcome-moje-generacje.liquid`
6. Kliknij: "Save"

**Główne przyciski:**
- Przycisk główny: "Zobacz moje generacje AI" → `/pages/my-generations`
- Link dodatkowy: "Przejdź do mojego konta" → `/account`

---

### ✅ **WERSJA 3: Email Welcome - Dwa równorzędne przyciski**

**Plik:** `shopify-email-welcome-dwa-przyciski.liquid`

**Kiedy używać:** Email powitalny z dwoma równymi przyciskami

**Co robi:** Dwa równorzędne przyciski - jeden do generacji, drugi do konta

**Gdzie wkleić:**
1. Shopify Admin → Settings → Notifications
2. Znajdź: **"Customer account welcome"**
3. Kliknij: "Edit code"
4. **ZAZNACZ CAŁY KOD** (Ctrl+A)
5. **WKLEJ** kod z pliku `shopify-email-welcome-dwa-przyciski.liquid`
6. Kliknij: "Save"

**Przyciski:**
- Przycisk 1: "Zobacz moje generacje AI" → `/pages/my-generations`
- Przycisk 2: "Przejdź do mojego konta" → `/account`

---

## 🎯 MOJA REKOMENDACJA

**Użyj WERSJI 1** (`shopify-email-activation-redirect.liquid`) - email aktywacyjny:

✅ **Dlaczego?**
- Użytkownik trafia do generacji ZARAZ po aktywacji konta
- Najlepsza UX - widzi swoje generacje natychmiast
- Nie wymaga dodatkowego kliknięcia

**Opcjonalnie:** Możesz również zmienić email Welcome (WERSJA 2 lub 3) dla użytkowników którzy już mają aktywne konto.

---

## 📝 KROK PO KROKU - IMPLEMENTACJA

### **KROK 1: Email Aktywacyjny (GŁÓWNY)**

1. Otwórz plik: `shopify-email-activation-redirect.liquid`
2. Zaznacz CAŁY KOD (Ctrl+A), skopiuj (Ctrl+C)
3. Shopify Admin → Settings → Notifications
4. Znajdź: **"Customer account activation"**
5. Kliknij: "Edit code"
6. Zaznacz CAŁY STARY KOD (Ctrl+A)
7. Wklej NOWY KOD (Ctrl+V)
8. Kliknij: "Save"

### **KROK 2: Email Welcome (OPCJONALNY)**

1. Wybierz: `shopify-email-welcome-moje-generacje.liquid` lub `shopify-email-welcome-dwa-przyciski.liquid`
2. Zaznacz CAŁY KOD, skopiuj
3. Shopify Admin → Settings → Notifications
4. Znajdź: **"Customer account welcome"**
5. Kliknij: "Edit code"
6. Zaznacz CAŁY STARY KOD
7. Wklej NOWY KOD
8. Kliknij: "Save"

---

## ✅ TESTOWANIE

### **Test Email Aktywacyjny:**

1. Utwórz nowe konto testowe w sklepie
2. Sprawdź email w skrzynce
3. Kliknij "Aktywuj konto i zobacz generacje"
4. Sprawdź czy trafiasz do: `https://lumly.pl/pages/my-generations`

### **Test Email Welcome:**

1. Aktywuj konto testowe
2. Sprawdź email powitalny
3. Kliknij przyciski
4. Sprawdź czy prowadzą do odpowiednich stron

---

## 🔧 CO ZOSTAŁO ZMIENIONE?

### **W Email Aktywacyjnym:**

❌ **PRZED:**
```liquid
<a href="{{ customer.account_activation_url }}">
  Activate your account
</a>
```

✅ **PO:**
```liquid
<a href="{{ customer.account_activation_url }}?return_to=/pages/my-generations">
  Aktywuj konto i zobacz generacje
</a>
```

### **W Email Welcome:**

❌ **PRZED:**
```liquid
<a href="{{ shop.url }}">Visit our store</a>
```

✅ **PO:**
```liquid
<a href="{{ shop.url }}/pages/my-generations">
  Zobacz moje generacje AI
</a>
```

---

## ⚠️ UWAGI

1. **Email Aktywacyjny** jest wysyłany tylko raz - przy pierwszej rejestracji
2. **Email Welcome** jest wysyłany po aktywacji konta
3. **Link `/pages/my-generations`** wymaga zalogowanego użytkownika (chronione przez Liquid: `{% if customer %}`)
4. **Shopify automatycznie przekieruje** do logowania jeśli użytkownik nie jest zalogowany

---

## 📊 PODSUMOWANIE

| Wersja | Plik | Email Type | Główny Przycisk |
|--------|------|------------|-----------------|
| **1 (POLECANE)** | `shopify-email-activation-redirect.liquid` | Activation | "Aktywuj konto i zobacz generacje" → `/pages/my-generations` |
| **2** | `shopify-email-welcome-moje-generacje.liquid` | Welcome | "Zobacz moje generacje AI" → `/pages/my-generations` |
| **3** | `shopify-email-welcome-dwa-przyciski.liquid` | Welcome | Dwa przyciski równorzędne |

---

**Status:** ✅ Gotowe do implementacji  
**Data:** 2025-12-03  
**Autor:** AI Assistant

