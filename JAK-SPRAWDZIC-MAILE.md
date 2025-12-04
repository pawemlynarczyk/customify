# 📧 Jak Sprawdzić Ile Maili Zostało Wysłanych

## 🎯 Szybka Metoda - Resend Dashboard (NAJSZYBSZE!)

1. **Wejdź na:** https://resend.com/emails
2. **Filtruj po dacie:** Wybierz 27.11.2025
3. **Sprawdź liczbę maili** z tematem "🎨 Twoja generacja AI jest gotowa!"

## 📊 Alternatywa - Przez API (po wdrożeniu)

```bash
curl "https://customify-s56o.vercel.app/api/check-email-stats"
```

Endpoint zwróci:
```json
{
  "success": true,
  "stats": {
    "today": {
      "total": 5,
      "generation": 3,
      "emails": [...]
    },
    "nov27": {
      "total": 10,
      "generation": 8,
      "emails": [...]
    }
  }
}
```

## 🔍 Co Sprawdzić w Resend Dashboard:

1. **Data:** 27.11.2025
2. **Temat:** "🎨 Twoja generacja AI jest gotowa!"
3. **Status:** Delivered / Bounced / Failed
4. **Odbiorca:** Sprawdź czy wszystkie maile trafiły do właściwych adresów

## ⚠️ Jeśli Maile Nie Są Wysyłane:

1. **Sprawdź RESEND_API_KEY** w Vercel Dashboard
2. **Sprawdź logi Vercel** - szukaj błędów:
   ```bash
   vercel logs customify-s56o.vercel.app --since 24h | grep "Exception podczas wysyłania emaila"
   ```
3. **Sprawdź warunki** w kodzie:
   - `customerId` musi istnieć (zalogowany użytkownik)
   - `email` musi być dostępny
   - `watermarkedImageUrl` musi być dostępny
   - `RESEND_API_KEY` musi być ustawiony

## 📝 Najczęstsze Powody Braku Maili:

- ❌ Użytkownik niezalogowany (brak `customerId`)
- ❌ Brak emaila w danych użytkownika
- ❌ Brak `watermarkedImageUrl` (obraz nie został wygenerowany)
- ❌ Błąd Resend API (sprawdź szczegóły w logach)



