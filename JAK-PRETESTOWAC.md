# 🧪 JAK PRZETESTOWAĆ PRODUKT CYFROWY

## 📋 PRZED TESTAMI

### **1. Sprawdź czy wdrożenie się udało:**
- Otwórz: https://vercel.com/dashboard
- Znajdź najnowszy deployment (commit `bd53243`)
- Status powinien być: ✅ "Ready"
- Jeśli jest "Building" → poczekaj 2-5 minut

### **2. Sprawdź czy strona działa:**
- Otwórz: https://lumly.pl/products/personalizowany-portret-w-stylu-boho
- Strona powinna się normalnie załadować
- Sprawdź konsolę przeglądarki (F12) - brak błędów

---

## 🎯 TEST 1: UI - SELEKTOR TYPU PRODUKTU

### **Krok 1: Znajdź selektor**
1. Otwórz stronę produktu (np. Boho, Król, Koty)
2. Przewiń w dół do sekcji Customify
3. Znajdź sekcję "Rodzaj wydruku:"

### **Krok 2: Sprawdź przyciski**
Powinny być **3 przyciski**:
- [ ] "Plakat (dodaj ramkę)" - pierwszy
- [ ] "Obraz na płótnie" - drugi
- [ ] **"Produkt cyfrowy"** - trzeci (NOWY!)

### **Krok 3: Kliknij "Produkt cyfrowy"**
- [ ] Przycisk zmienia kolor (żółty border)
- [ ] Przycisk ma klasę `.active`
- [ ] W konsoli przeglądarki: `📦 [DIGITAL] Size area hidden for digital product`

---

## 🎯 TEST 2: UKRYWANIE ROZMIARÓW

### **Krok 1: Wybierz "Produkt cyfrowy"**
- Kliknij przycisk "Produkt cyfrowy"

### **Krok 2: Sprawdź sekcję rozmiarów**
- [ ] Sekcja "Rozmiar (cm):" jest **UKRYTA** (display: none)
- [ ] Nie widzisz przycisków: 20×30, 30×40, 40×60, 60×85
- [ ] W konsoli: `📦 [DIGITAL] Size area hidden for digital product`

### **Krok 3: Wróć do "Plakat"**
- Kliknij "Plakat (dodaj ramkę)"
- [ ] Sekcja rozmiarów jest **WIDOCZNA** (display: block)
- [ ] Widzisz przyciski rozmiarów

---

## 🎯 TEST 3: UKRYWANIE RAMKI

### **Krok 1: Wybierz "Produkt cyfrowy"**
- Kliknij przycisk "Produkt cyfrowy"

### **Krok 2: Sprawdź sekcję ramki**
- [ ] Sekcja "Ramka:" jest **UKRYTA/DISABLED**
- [ ] Przycisk ramki ma klasę `.disabled`
- [ ] Nie możesz kliknąć na ramkę

### **Krok 3: Wróć do "Plakat"**
- Kliknij "Plakat (dodaj ramkę)"
- [ ] Sekcja ramki jest **DOSTĘPNA**
- [ ] Możesz wybrać ramkę (czarna, biała, drewno)

---

## 🎯 TEST 4: CENA PRODUKTU CYFROWEGO

### **Krok 1: Wybierz "Produkt cyfrowy"**
- Kliknij przycisk "Produkt cyfrowy"

### **Krok 2: Sprawdź cenę**
- [ ] Cena pokazuje: **29 zł** (stała, bez rozmiaru)
- [ ] Cena NIE zmienia się (nie ma dopłat za rozmiar)
- [ ] W konsoli: `💰 [CUSTOMIFY] Price calculation: { finalPrice: 29 }`

### **Krok 3: Porównaj z produktem fizycznym**
- Kliknij "Plakat (dodaj ramkę)"
- Wybierz rozmiar (np. 30×40)
- [ ] Cena zmienia się (np. 49 + dopłata za rozmiar)

---

## 🎯 TEST 5: DODAWANIE DO KOSZYKA (BEZ ROZMIARU)

### **Krok 1: Przygotuj produkt cyfrowy**
1. Wybierz "Produkt cyfrowy"
2. Wybierz styl AI (np. "Minimalistyczny")
3. Wgraj zdjęcie (kliknij obszar upload)
4. Poczekaj na generację efektu AI

### **Krok 2: Sprawdź czy można dodać bez rozmiaru**
- [ ] Przycisk "Dodaj do koszyka" jest **AKTYWNY**
- [ ] NIE ma błędu "Nie wybrałeś rozmiaru"
- [ ] W konsoli: `✅ [CUSTOMIFY] Digital product - skipping size requirement`

### **Krok 3: Dodaj do koszyka**
- Kliknij "Dodaj do koszyka"
- [ ] Produkt jest dodany do koszyka
- [ ] Przekierowanie do koszyka działa

---

## 🎯 TEST 6: KOSZYK - PRODUKT CYFROWY

### **Krok 1: Sprawdź koszyk**
- Otwórz koszyk (po dodaniu produktu cyfrowego)

### **Krok 2: Sprawdź szczegóły produktu**
- [ ] Tytuł zawiera: "Produkt cyfrowy"
- [ ] Cena: **29 zł**
- [ ] Properties zawierają:
  - `Rozmiar: Plik do pobrania` ✅
  - `Rodzaj wydruku: Produkt cyfrowy` ✅
  - `Ramka: brak` ✅

### **Krok 3: Sprawdź czy nie ma opcji wysyłki**
- [ ] Produkt NIE wymaga adresu wysyłki
- [ ] W checkout nie ma sekcji "Adres wysyłki" (lub jest pusta)

---

## 🎯 TEST 7: CHECKOUT I PŁATNOŚĆ

### **Krok 1: Przejdź do checkout**
- Kliknij "Przejdź do kasy" w koszyku

### **Krok 2: Sprawdź checkout**
- [ ] Brak sekcji "Adres wysyłki" (produkt cyfrowy)
- [ ] Możesz podać tylko e-mail (dla faktury)
- [ ] Cena: 29 zł

### **Krok 3: Złóż testowe zamówienie**
- Wypełnij dane (e-mail, imię, nazwisko)
- Wybierz metodę płatności (testową)
- Złóż zamówienie

---

## 🎯 TEST 8: WEBHOOK - AUTOMATYCZNA WYSYŁKA E-MAILA

### **Krok 1: Sprawdź Vercel Logs**
1. Otwórz: https://vercel.com/dashboard
2. Wybierz projekt: `customify`
3. Kliknij "Logs"
4. Filtruj: `ORDER-PAID-WEBHOOK`

### **Krok 2: Szukaj logów**
Po płatności powinny pojawić się:
- [ ] `📧 [ORDER-PAID-WEBHOOK] Digital product detected - sending download email`
- [ ] `✅ [ORDER-PAID-WEBHOOK] Digital product download email sent`
- [ ] `✅ [ORDER-PAID-WEBHOOK] Digital product marked as fulfilled`

### **Krok 3: Sprawdź e-mail**
- [ ] Sprawdź skrzynkę e-mail (ten sam e-mail co w zamówieniu)
- [ ] Powinien być e-mail z tematem: "Twój produkt cyfrowy Customify jest gotowy! 🎨"
- [ ] E-mail zawiera link do pobrania
- [ ] Link działa (kliknij - pobiera plik)

---

## 🎯 TEST 9: PRODUKTY FIZYCZNE - NADAL DZIAŁAJĄ

### **Krok 1: Wybierz "Plakat"**
- Kliknij "Plakat (dodaj ramkę)"

### **Krok 2: Sprawdź czy wszystko działa**
- [ ] Rozmiary są widoczne
- [ ] Ramka jest dostępna
- [ ] Cena zmienia się z rozmiarem
- [ ] Wymaga wyboru rozmiaru przed dodaniem do koszyka

### **Krok 3: Dodaj do koszyka**
- [ ] Produkt fizyczny działa normalnie
- [ ] Wymaga adresu wysyłki w checkout

---

## 🔍 DEBUGGING - GDZIE SPRAWDZIĆ BŁĘDY

### **1. Browser Console (F12)**
Szukaj:
- `❌ [CUSTOMIFY]` - błędy
- `📦 [DIGITAL]` - logi produktu cyfrowego
- `💰 [CUSTOMIFY] Price calculation` - ceny

### **2. Vercel Logs**
- https://vercel.com/dashboard → Logs
- Filtruj: `PRODUCTS.JS` lub `ORDER-PAID-WEBHOOK`
- Szukaj błędów: `❌`

### **3. Network Tab (F12 → Network)**
- Sprawdź request do `/api/products`
- Sprawdź response - czy `success: true`
- Sprawdź czy `productType: "digital"` jest w request

---

## ⚠️ CZĘSTE PROBLEMY I ROZWIĄZANIA

### **Problem: Przycisk "Produkt cyfrowy" nie jest widoczny**
**Rozwiązanie:**
- Sprawdź czy Vercel deployment się udał
- Odśwież stronę (Ctrl+F5)
- Sprawdź czy nie ma błędów w konsoli

### **Problem: Rozmiary nie są ukryte**
**Rozwiązanie:**
- Sprawdź konsolę: `📦 [DIGITAL] Size area hidden`
- Sprawdź czy `isDigitalProductSelected()` działa
- Sprawdź czy przycisk ma `data-product-type="digital"`

### **Problem: Nie można dodać do koszyka bez rozmiaru**
**Rozwiązanie:**
- Sprawdź konsolę: `✅ [CUSTOMIFY] Digital product - skipping size requirement`
- Sprawdź czy `isDigitalProduct` jest `true`
- Sprawdź czy `selectedProductType === 'digital'`

### **Problem: E-mail nie został wysłany**
**Rozwiązanie:**
- Sprawdź Vercel Logs: `📧 [ORDER-PAID-WEBHOOK] Digital product detected`
- Sprawdź czy webhook został wywołany
- Sprawdź czy metafields zawierają `digitalDownloadUrl`
- Sprawdź czy Shopify Customer Notification API działa

---

## ✅ CHECKLISTA TESTÓW

### **Podstawowe testy:**
- [ ] Przycisk "Produkt cyfrowy" jest widoczny
- [ ] Rozmiary są ukryte dla produktu cyfrowego
- [ ] Ramka jest ukryta dla produktu cyfrowego
- [ ] Cena: 29 zł dla produktu cyfrowego
- [ ] Można dodać do koszyka bez rozmiaru

### **Zaawansowane testy:**
- [ ] Produkt cyfrowy w koszyku ma właściwe properties
- [ ] Checkout nie wymaga adresu wysyłki
- [ ] Webhook wykrywa produkt cyfrowy
- [ ] E-mail jest wysyłany po płatności
- [ ] Link do pobrania działa

### **Testy regresji:**
- [ ] Produkty fizyczne nadal działają
- [ ] Plakat wymaga rozmiaru
- [ ] Obraz na płótnie wymaga rozmiaru
- [ ] Ramka działa dla plakatu

---

## 📞 WSPARCIE

Jeśli coś nie działa:
1. Sprawdź Vercel Logs
2. Sprawdź Browser Console
3. Sprawdź `ROLLBACK-DIGITAL-PRODUCT.md` (rollback)
4. Sprawdź `TEST-RESULTS-DIGITAL-PRODUCT.md` (wyniki testów)

---

**Gotowe do testów!** 🚀




