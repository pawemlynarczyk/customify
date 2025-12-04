# 📧 Jak Sprawdzić Kto Powinien Dostać Maila

## 🎯 Problem
Chcesz sprawdzić:
1. Kto w ostatnich godzinach powinien dostać maila
2. Czy są logi gdzie wysyłaliśmy zapytania do Resend API
3. Porównać z tym co faktycznie zostało wysłane w Resend

## 🔍 METODA 1: Sprawdź Logi Vercel (REKOMENDOWANA)

### **KROK 1: Pobierz logi z ostatnich 24h**

```bash
vercel logs customify-s56o.vercel.app --since 24h > vercel-logs.txt
```

### **KROK 2: Filtruj próby wysłania maili**

```bash
# Sprawdź kto powinien dostać maila
grep -E "Wysyłam email przez Resend|SPRAWDZAM WARUNKI WYSYŁANIA EMAILA" vercel-logs.txt

# Sprawdź czy zostały wysłane (Resend ID)
grep "Resend ID:" vercel-logs.txt

# Sprawdź błędy
grep "Exception podczas wysyłania emaila" vercel-logs.txt
```

### **KROK 3: Wyciągnij listę emaili**

```bash
# Wyciągnij emaile które powinny dostać maila
grep -A 5 "Wysyłam email przez Resend" vercel-logs.txt | grep "email:" | awk '{print $2}'

# Wyciągnij Resend ID
grep "Resend ID:" vercel-logs.txt | awk '{print $NF}'
```

### **KROK 4: Użyj skryptu do analizy**

```bash
node check-email-sent-attempts.js
```

Skrypt automatycznie:
- Pobierze logi z Vercel
- Wyciągnie listę emaili które powinny dostać maila
- Wyciągnie Resend ID
- Pokaże błędy i pominięte

## 🔍 METODA 2: Sprawdź w Kodzie - Gdzie Wysyłamy Maile

### **Lokalizacja w kodzie:**

1. **`api/_save-generation-core.js`** (linie 570-654)
   - Log: `[SAVE-GENERATION] Wysyłam email przez Resend...`
   - Log: `[SAVE-GENERATION] Resend ID: ...`
   - Log: `[SAVE-GENERATION] Exception podczas wysyłania emaila: ...`

2. **Warunki wysyłania:**
   - `customerId` musi istnieć
   - `email` musi być dostępny
   - `watermarkedImageUrl` musi być dostępny
   - `RESEND_API_KEY` musi być ustawiony

### **Szukaj w logach:**

```bash
# Sprawdź warunki przed wysłaniem
grep -A 10 "SPRAWDZAM WARUNKI WYSYŁANIA EMAILA" vercel-logs.txt

# Sprawdź czy warunki były spełnione
grep "Warunek (customerId && email && imageUrlForEmail && token):" vercel-logs.txt
```

## 🔍 METODA 3: Porównaj z Resend Dashboard

### **KROK 1: Pobierz listę z logów Vercel**

```bash
# Wyciągnij Resend ID z logów
grep "Resend ID:" vercel-logs.txt | awk '{print $NF}' > resend-ids.txt
```

### **KROK 2: Sprawdź w Resend Dashboard**

1. Wejdź: https://resend.com/emails
2. Dla każdego Resend ID z `resend-ids.txt`:
   - Wyszukaj ID w Resend Dashboard
   - Sprawdź status (delivered, delayed, bounced, failed)
   - Sprawdź czy email trafił do właściwego odbiorcy

### **KROK 3: Porównaj statystyki**

```bash
# Ile prób wysłania w logach
grep "Wysyłam email przez Resend" vercel-logs.txt | wc -l

# Ile Resend ID (sukces)
grep "Resend ID:" vercel-logs.txt | wc -l

# Ile błędów
grep "Exception podczas wysyłania emaila" vercel-logs.txt | wc -l
```

## 📊 Szybka Analiza (1 komenda)

```bash
# Pobierz logi i przeanalizuj
vercel logs customify-s56o.vercel.app --since 24h | \
  grep -E "Wysyłam email|Resend ID|Exception" | \
  awk '
    /Wysyłam email/ { attempts++ }
    /Resend ID:/ { sent++ }
    /Exception/ { failed++ }
    END {
      print "📧 Próby wysłania:", attempts
      print "✅ Wysłane (Resend ID):", sent
      print "❌ Błędy:", failed
    }
  '
```

## 🔍 Co Sprawdzić w Logach

### **1. Próby wysłania:**
```
[SAVE-GENERATION] Wysyłam email przez Resend...
```

### **2. Sukces (Resend ID):**
```
[SAVE-GENERATION] Email wysłany pomyślnie!
[SAVE-GENERATION] Resend ID: abc123...
```

### **3. Błędy:**
```
[SAVE-GENERATION] Exception podczas wysyłania emaila: ...
[SAVE-GENERATION] Error message: ...
```

### **4. Pominięte (brak warunków):**
```
[SAVE-GENERATION] Pomijam email - brak emaila (niezalogowany)
[SAVE-GENERATION] Pomijam email - brak customerId
[SAVE-GENERATION] Pomijam email - brak watermarkedImageUrl
```

## ✅ Checklist Sprawdzania

- [ ] Pobierz logi z Vercel (ostatnie 24h)
- [ ] Sprawdź ile prób wysłania (`Wysyłam email przez Resend`)
- [ ] Sprawdź ile Resend ID (sukces)
- [ ] Sprawdź ile błędów (`Exception podczas wysyłania emaila`)
- [ ] Wyciągnij listę emaili z logów
- [ ] Wyciągnij listę Resend ID
- [ ] Sprawdź w Resend Dashboard czy wszystkie ID są widoczne
- [ ] Porównaj statusy (delivered, delayed, bounced, failed)

## 🎯 Najważniejsze Komendy

```bash
# 1. Pobierz logi
vercel logs customify-s56o.vercel.app --since 24h > logs.txt

# 2. Sprawdź próby wysłania
grep "Wysyłam email przez Resend" logs.txt | wc -l

# 3. Sprawdź sukces (Resend ID)
grep "Resend ID:" logs.txt | wc -l

# 4. Wyciągnij Resend ID do sprawdzenia
grep "Resend ID:" logs.txt | awk '{print $NF}' > resend-ids.txt

# 5. Sprawdź w Resend Dashboard każdy ID z resend-ids.txt
```

## 💡 Automatyczna Analiza

Użyj skryptu:
```bash
node check-email-sent-attempts.js
```

Skrypt automatycznie:
- Pobierze logi
- Przeanalizuje próby wysłania
- Wyciągnie listę emaili i Resend ID
- Pokaże statystyki
- Zapisze wyniki do `email-attempts-results.json`



