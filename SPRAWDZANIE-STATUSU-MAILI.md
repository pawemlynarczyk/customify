# 📧 Sprawdzanie Statusu Wysyłania Maili

## 🎯 Problem
Masz wrażenie, że nie wszyscy zalogowani użytkownicy dostają maile po generacji produktu.

## 🔍 Jak Sprawdzić Status Wysyłania Maili

### **METODA 1: Szybka weryfikacja przez Vercel CLI (REKOMENDOWANA)**

```bash
# 1. Pobierz logi z ostatnich 24h
vercel logs customify-s56o.vercel.app --since 24h > vercel-logs.txt

# 2. Sprawdź ile maili zostało wysłanych
grep "Email wysłany pomyślnie" vercel-logs.txt | wc -l

# 3. Sprawdź ile maili zostało pominiętych (brak emaila)
grep "Pomijam email - brak emaila" vercel-logs.txt | wc -l

# 4. Sprawdź ile maili zostało pominiętych (brak customerId - niezalogowani)
grep "Pomijam email - brak customerId" vercel-logs.txt | wc -l

# 5. Sprawdź błędy wysyłania
grep "Exception podczas wysyłania emaila" vercel-logs.txt | wc -l

# 6. Zobacz szczegóły błędów
grep -A 3 "Exception podczas wysyłania emaila" vercel-logs.txt
```

### **METODA 2: Szczegółowa analiza z filtrowaniem**

```bash
# 1. Pobierz logi
vercel logs customify-s56o.vercel.app --since 24h > vercel-logs.txt

# 2. Filtruj tylko logi związane z mailami
grep -E "SAVE-GENERATION.*email|📧.*SAVE-GENERATION|✅.*Email|❌.*Email|Pomijam email" vercel-logs.txt > email-logs.txt

# 3. Użyj skryptu do analizy
node check-email-status.js email-logs.txt
```

### **METODA 3: Sprawdzenie warunków wysyłania**

```bash
# Sprawdź wszystkie generacje i ich warunki
vercel logs customify-s56o.vercel.app --since 24h | grep -E "SPRAWDZAM WARUNKI WYSYŁANIA EMAILA|Warunek \(customerId && email" | head -50
```

## 📊 Warunki Wysyłania Maila

Email jest wysyłany **TYLKO** gdy spełnione są **WSZYSTKIE** warunki:

1. ✅ **`customerId`** - użytkownik musi być zalogowany
2. ✅ **`email`** - email musi być dostępny (z GraphQL lub request body)
3. ✅ **`watermarkedImageUrl`** lub **`imageUrl`** - obraz musi być dostępny
4. ✅ **`process.env.RESEND_API_KEY`** - klucz API musi być ustawiony
5. ✅ **`process.env.SHOPIFY_ACCESS_TOKEN`** - token Shopify musi być ustawiony

## 🔍 Najczęstsze Powody Braku Maila

### **1. Brak emaila (niezalogowany użytkownik)**
```
📧 [SAVE-GENERATION] Pomijam email - brak emaila (niezalogowany)
```
**Rozwiązanie:** To jest normalne - niezalogowani użytkownicy nie dostają maili.

### **2. Brak customerId (niezalogowany użytkownik)**
```
📧 [SAVE-GENERATION] Pomijam email - brak customerId (niezalogowany)
```
**Rozwiązanie:** To jest normalne - niezalogowani użytkownicy nie dostają maili.

### **3. Brak watermarkedImageUrl**
```
📧 [SAVE-GENERATION] Pomijam email - brak watermarkedImageUrl
```
**Problem:** Obraz nie został wygenerowany z watermarkiem.
**Sprawdź:** Logi transformacji - czy watermark został dodany?

### **4. Brak RESEND_API_KEY**
```
⚠️ [SAVE-GENERATION] RESEND_API_KEY nie skonfigurowany - pomijam email
```
**Problem:** Klucz API nie jest ustawiony w Vercel.
**Rozwiązanie:** Sprawdź Vercel Dashboard → Settings → Environment Variables → `RESEND_API_KEY`

### **5. Błąd wysyłania (Resend API error)**
```
❌ [SAVE-GENERATION] Exception podczas wysyłania emaila: ...
❌ [SAVE-GENERATION] Error message: ...
```
**Problem:** Błąd API Resend (np. nieprawidłowy email, limit rate, problem z domeną).
**Sprawdź:** Szczegóły błędu w logach.

## 🛠️ Debugowanie

### **Sprawdź czy email jest przekazywany do save-generation:**

```bash
vercel logs customify-s56o.vercel.app --since 24h | grep -E "Email do zapisu generacji|finalEmail" | head -20
```

### **Sprawdź warunki przed wysłaniem:**

```bash
vercel logs customify-s56o.vercel.app --since 24h | grep -A 5 "SPRAWDZAM WARUNKI WYSYŁANIA EMAILA" | head -50
```

### **Sprawdź czy RESEND_API_KEY jest ustawiony:**

```bash
vercel logs customify-s56o.vercel.app --since 24h | grep "RESEND_API_KEY" | head -10
```

## 📈 Statystyki

Po uruchomieniu analizy otrzymasz:
- 📦 Łączna liczba generacji
- ✅ Liczba maili wysłanych
- ❌ Liczba maili nieudanych
- ⚠️ Liczba maili pominiętych (z powodu braku warunków)
- 🔍 Szczegóły generacji bez maila

## 🚨 Najczęstsze Problemy

### **Problem 1: Email nie jest przekazywany z GraphQL**
**Objaw:** `email: null` w logach `[TRANSFORM] Email do zapisu generacji`
**Sprawdź:** Czy `customerEmailFromGraphQL` jest ustawiony w `transform.js` (linia ~1494)

### **Problem 2: watermarkedImageUrl jest null**
**Objaw:** `watermarkedImageUrl: NULL` w logach
**Sprawdź:** Czy watermark jest generowany w `transform.js` (funkcja `addWatermarkToImage`)

### **Problem 3: RESEND_API_KEY nie działa**
**Objaw:** `RESEND_API_KEY nie skonfigurowany` w logach
**Sprawdź:** Vercel Dashboard → Settings → Environment Variables

## ✅ Szybki Test

```bash
# 1. Pobierz logi
vercel logs customify-s56o.vercel.app --since 1h > test-logs.txt

# 2. Sprawdź statystyki
echo "=== MAILE WYSŁANE ===" && grep "Email wysłany pomyślnie" test-logs.txt | wc -l
echo "=== MAILE POMINIĘTE ===" && grep "Pomijam email" test-logs.txt | wc -l
echo "=== BŁĘDY ===" && grep "Exception podczas wysyłania emaila" test-logs.txt | wc -l
```

## 📝 Pliki do Sprawdzenia

1. **`api/_save-generation-core.js`** (linie 570-654) - logika wysyłania maili
2. **`api/transform.js`** (linie 2436-2446) - przekazywanie emaila do save-generation
3. **`api/transform.js`** (linia ~1494) - pobieranie emaila z GraphQL

## 🔗 Powiązane Pliki

- `check-email-status.js` - skrypt do analizy logów
- `check-email-status-simple.js` - prosty przewodnik



