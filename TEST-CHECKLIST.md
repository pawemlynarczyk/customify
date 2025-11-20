# ✅ CHECKLIST TESTÓW - Produkt Cyfrowy

## 🧪 TESTY AUTOMATYCZNE (WYKONANE)

- [x] Składnia kodu (brak błędów)
- [x] Feature flag działa
- [x] Wykrywanie produktu cyfrowego
- [x] Konfiguracja produktu (`requires_shipping: false`)
- [x] Cena produktu cyfrowego (29 zł)
- [x] Metafields dla produktu cyfrowego
- [x] Wykrywanie w webhook

---

## 🌐 TESTY FRONTEND (WYMAGAJĄ PRZEGLĄDARKI)

### **1. UI - Selektor typu produktu:**
- [ ] Przycisk "Produkt cyfrowy" jest widoczny (3. przycisk)
- [ ] Przycisk ma poprawny styl (aktywny/nieaktywny)
- [ ] Kliknięcie zmienia aktywny przycisk

### **2. UI - Ukrywanie rozmiarów:**
- [ ] Po wyborze "Produkt cyfrowy" → sekcja rozmiarów jest ukryta
- [ ] Po wyborze "Plakat" → sekcja rozmiarów jest widoczna
- [ ] Po wyborze "Obraz na płótnie" → sekcja rozmiarów jest widoczna

### **3. UI - Ukrywanie ramki:**
- [ ] Po wyborze "Produkt cyfrowy" → ramka jest ukryta/disabled
- [ ] Po wyborze "Plakat" → ramka jest dostępna
- [ ] Po wyborze "Obraz na płótnie" → ramka jest ukryta/disabled

### **4. UI - Cena:**
- [ ] Dla "Produkt cyfrowy" → cena pokazuje 29 zł
- [ ] Dla "Plakat" → cena pokazuje cenę z rozmiarem
- [ ] Dla "Obraz na płótnie" → cena pokazuje cenę z rozmiarem

### **5. UI - Dodawanie do koszyka:**
- [ ] Dla "Produkt cyfrowy" → można dodać bez wyboru rozmiaru
- [ ] Dla "Plakat" → wymaga wyboru rozmiaru
- [ ] Dla "Obraz na płótnie" → wymaga wyboru rozmiaru

---

## 🔌 TESTY BACKEND (WYMAGAJĄ API)

### **1. Tworzenie produktu cyfrowego:**
- [ ] `api/products.js` tworzy produkt z `requires_shipping: false`
- [ ] `product_type: 'Digital Product'`
- [ ] Tagi zawierają `'digital'` i `'download'`
- [ ] Metafields zawierają `digitalDownloadUrl`

### **2. Webhook orders/paid:**
- [ ] Wykrywa produkt cyfrowy w zamówieniu
- [ ] Pobiera URL z metafields
- [ ] Wysyła e-mail przez Shopify Customer Notification API
- [ ] Backup: Order Notification API (jeśli Customer API nie działa)
- [ ] Oznacza zamówienie jako zrealizowane (fulfillment)

### **3. E-maile:**
- [ ] E-mail jest wysyłany po płatności
- [ ] Link do pobrania działa (otwiera plik)
- [ ] Treść e-maila jest poprawna (polski, zawiera link)
- [ ] E-mail zawiera numer zamówienia i styl

---

## 🚀 TESTY END-TO-END (PEŁNY FLOW)

### **Scenariusz 1: Produkt cyfrowy - sukces**
1. [ ] Użytkownik wybiera styl AI
2. [ ] Użytkownik wybiera "Produkt cyfrowy"
3. [ ] Rozmiary i ramka są ukryte
4. [ ] Cena pokazuje 29 zł
5. [ ] Użytkownik wgrywa zdjęcie
6. [ ] AI generuje efekt
7. [ ] Użytkownik dodaje do koszyka (bez rozmiaru)
8. [ ] Produkt jest w koszyku z ceną 29 zł
9. [ ] Użytkownik przechodzi przez checkout
10. [ ] Użytkownik płaci
11. [ ] Webhook `orders/paid` jest wywołany
12. [ ] E-mail z linkiem do pobrania jest wysłany
13. [ ] Zamówienie jest oznaczone jako zrealizowane
14. [ ] Link w e-mailu działa (pobiera plik)

### **Scenariusz 2: Produkt fizyczny - nadal działa**
1. [ ] Użytkownik wybiera "Plakat" lub "Obraz na płótnie"
2. [ ] Rozmiary są widoczne
3. [ ] Użytkownik wybiera rozmiar
4. [ ] Cena jest obliczana z rozmiarem
5. [ ] Dodawanie do koszyka działa normalnie

---

## 🔍 LOGI DO SPRAWDZENIA

### **Vercel Logs - Tworzenie produktu:**
```
📦 [PRODUCTS.JS] Digital product - download URL saved: [URL]
✅ [PRODUCTS.JS] Metafields added successfully
```

### **Vercel Logs - Webhook:**
```
📧 [ORDER-PAID-WEBHOOK] Digital product detected - sending download email
✅ [ORDER-PAID-WEBHOOK] Digital product download email sent
✅ [ORDER-PAID-WEBHOOK] Digital product marked as fulfilled
```

### **Browser Console:**
```
📦 [DIGITAL] Size area hidden for digital product
✅ [CUSTOMIFY] Digital product - skipping size requirement
💰 [CUSTOMIFY] Price calculation: { finalPrice: 29 }
```

---

## ⚠️ PROBLEMY DO SPRAWDZENIA

- [ ] Czy `getSizePrice()` nie zwraca błędu dla `undefined` selectedSize?
- [ ] Czy `getSizeDimension()` nie zwraca błędu dla `undefined` selectedSize?
- [ ] Czy Shopify Customer Notification API działa?
- [ ] Czy Order Notification API (backup) działa?
- [ ] Czy fulfillment API działa?

---

## 🎯 PRIORYTET TESTÓW

1. **Wysoki:** Frontend UI (selektor, ukrywanie rozmiarów)
2. **Wysoki:** Backend (tworzenie produktu, webhook)
3. **Średni:** E-maile (wysyłka, linki)
4. **Niski:** Edge cases (błędy API, fallback)

---

## 📝 NOTATKI Z TESTÓW

_Data: _______________  
_Tester: _______________  
_Wyniki: _______________



