# 🔄 ROLLBACK - Produkt Cyfrowy

## 📋 INFORMACJE O ZMIANACH

**Data implementacji:** 2025-01-XX  
**Funkcjonalność:** Produkt cyfrowy z automatyczną wysyłką e-maili  
**Feature Flag:** `ENABLE_DIGITAL_PRODUCTS` (environment variable)

---

## 🚨 JAK SZYBKO COFNĄĆ ZMIANY

### **Opcja 1: Wyłączenie przez Feature Flag (NAJSZYBSZE - 30 sekund)**

Ustaw w Vercel Environment Variables:
```
ENABLE_DIGITAL_PRODUCTS=false
```

Lub całkowicie usuń zmienną `ENABLE_DIGITAL_PRODUCTS` - funkcjonalność się wyłączy.

**Efekt:** Produkty cyfrowe będą działać jak fizyczne (z rozmiarami).

---

### **Opcja 2: Usunięcie kodu (5-10 minut)**

#### **Krok 1: Usuń zmiany w `api/products.js`**

Znajdź i usuń wszystkie bloki oznaczone:
```javascript
// 🚨 ROLLBACK: START - Produkt cyfrowy
// ... kod produktu cyfrowego ...
// 🚨 ROLLBACK: END - Produkt cyfrowy
```

**Linie do usunięcia:** Sprawdź komentarze `// 🚨 ROLLBACK` w pliku.

#### **Krok 2: Usuń zmiany w `api/webhooks/orders/paid.js`**

Znajdź i usuń wszystkie bloki oznaczone:
```javascript
// 🚨 ROLLBACK: START - Wysyłka e-maili dla produktów cyfrowych
// ... kod wysyłki e-maili ...
// 🚨 ROLLBACK: END - Wysyłka e-maili dla produktów cyfrowych
```

**Linie do usunięcia:** Sprawdź komentarze `// 🚨 ROLLBACK` w pliku.

#### **Krok 3: Usuń zmiany w `theme.liquid`**

Znajdź i usuń wszystkie bloki oznaczone:
```html
<!-- 🚨 ROLLBACK: START - Selektor typu produktu -->
<!-- ... HTML selektora ... -->
<!-- 🚨 ROLLBACK: END - Selektor typu produktu -->
```

**Linie do usunięcia:** Sprawdź komentarze `<!-- 🚨 ROLLBACK -->` w pliku.

#### **Krok 4: Usuń zmiany w `customify.js` (jeśli są)**

Znajdź i usuń wszystkie bloki oznaczone:
```javascript
// 🚨 ROLLBACK: START - Obsługa produktu cyfrowego
// ... kod JavaScript ...
// 🚨 ROLLBACK: END - Obsługa produktu cyfrowy
```

---

### **Opcja 3: Git Rollback (NAJBEZPIECZNIEJSZE - 2 minuty)**

```bash
# Znajdź commit przed zmianami
git log --oneline | grep -i "digital\|cyfrowy"

# Cofnij do commit przed zmianami
git revert <commit-hash>

# LUB całkowicie usuń zmiany
git reset --hard <commit-hash-before-changes>
```

---

## 📝 LISTA ZMIENIONYCH PLIKÓW

1. **`api/products.js`**
   - Dodano logikę produktu cyfrowego (linie z `// 🚨 ROLLBACK`)
   - Feature flag: `ENABLE_DIGITAL_PRODUCTS`

2. **`api/webhooks/orders/paid.js`**
   - Dodano wysyłkę e-maili dla produktów cyfrowych (linie z `// 🚨 ROLLBACK`)
   - Feature flag: `ENABLE_DIGITAL_PRODUCTS`

3. **`theme.liquid`**
   - Linie 2521-2525: Opcja "Produkt cyfrowy" w selektorze typu produktu
   - Linie 118-142: Logika pomijania rozmiaru dla produktu cyfrowego
   - Linie 261-267: Nazwa typu produktu z obsługą cyfrowego
   - Linie 3300-3309: CSS dla 3 przycisków (zamiast 2)
   - Linie 3347-3359: Responsive CSS dla 3 przycisków
   - Linie 3507-3528: Funkcje JavaScript dla produktu cyfrowego
   - Linie 3532-3537: Ukrywanie ramki dla produktu cyfrowego
   - Linie 3552-3554: Inicjalizacja UI produktu cyfrowego
   - Linie 3591-3593: Aktualizacja UI po zmianie typu produktu

---

## 🔍 JAK ZNALEŹĆ WSZYSTKIE ZMIANY

### **W terminalu:**
```bash
# Znajdź wszystkie markery ROLLBACK
grep -r "ROLLBACK" api/ theme.liquid shopify-theme/

# Znajdź wszystkie użycia ENABLE_DIGITAL_PRODUCTS
grep -r "ENABLE_DIGITAL_PRODUCTS" api/
```

### **W edytorze:**
- Wyszukaj: `🚨 ROLLBACK`
- Wszystkie zmiany są oznaczone tym markerem

---

## ✅ WERYFIKACJA PO ROLLBACK

Po cofnięciu zmian sprawdź:

1. **Produkty fizyczne działają normalnie:**
   - Wybór rozmiaru działa
   - Dodawanie do koszyka działa
   - Ceny są poprawne

2. **Brak błędów w konsoli:**
   - Sprawdź Vercel Logs
   - Sprawdź browser console

3. **Webhook działa:**
   - Zamówienie fizyczne → produkt ukryty w adminie
   - Brak błędów w webhook

---

## 📞 WSPARCIE

Jeśli rollback nie działa:
1. Sprawdź czy feature flag jest wyłączony
2. Sprawdź czy wszystkie markery ROLLBACK zostały usunięte
3. Sprawdź Vercel Logs pod kątem błędów
4. Sprawdź czy nie ma pozostałych referencji do `digital` w kodzie

---

## 🎯 CHECKPOINT PRZED ZMIANAMI

**Commit hash przed zmianami:** `[WSTAW PRZED IMPLEMENTACJĄ]`

```bash
# Przed zmianami wykonaj:
git add .
git commit -m "Checkpoint przed implementacją produktu cyfrowego"
git push origin main

# Zapisz hash:
git rev-parse HEAD
```

**Hash:** `_________________`

---

## ⚙️ FEATURE FLAG - SZYBKI ROLLBACK

### **Jak wyłączyć funkcjonalność (30 sekund):**

1. **Vercel Dashboard:**
   - Settings → Environment Variables
   - Dodaj/edytuj: `ENABLE_DIGITAL_PRODUCTS` = `false`
   - Zapisz i redeploy

2. **Lokalnie:**
   ```bash
   # W pliku .env lub vercel.json
   ENABLE_DIGITAL_PRODUCTS=false
   ```

**Efekt:** Produkty cyfrowe będą działać jak fizyczne (z rozmiarami).

### **Jak włączyć z powrotem:**

Ustaw `ENABLE_DIGITAL_PRODUCTS=true` lub usuń zmienną (domyślnie włączone).

---

## 📋 SZYBKA LISTA KONTROLNA ROLLBACK

- [ ] Ustaw `ENABLE_DIGITAL_PRODUCTS=false` w Vercel (najszybsze)
- [ ] Sprawdź czy produkty fizyczne działają normalnie
- [ ] Sprawdź Vercel Logs pod kątem błędów
- [ ] Jeśli problemy - usuń kod z markerami `🚨 ROLLBACK`
- [ ] Jeśli nadal problemy - użyj git revert

