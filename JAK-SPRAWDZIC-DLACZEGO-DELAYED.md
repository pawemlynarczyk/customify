# 🔍 Jak Sprawdzić Dlaczego Maile Są "Delivery Delayed"

## 📋 KROK PO KROKU - Diagnostyka

### **KROK 1: Sprawdź Szczegóły w Resend Dashboard**

1. **Wejdź na:** https://resend.com/emails
2. **Filtruj:** Status = "Delivery Delayed"
3. **Kliknij na jeden z maili** - zobaczysz szczegóły:
   - **Last Event** - ostatni event (np. "queued", "sent", "delivery_delayed")
   - **Error Message** - komunikat błędu (jeśli jest)
   - **Recipient** - adres odbiorcy
   - **Created At** - kiedy został wysłany
   - **Subject** - temat maila

### **KROK 2: Sprawdź Event History**

W szczegółach maila znajdziesz **Event History**:
- `queued` - mail w kolejce
- `sent` - mail wysłany przez Resend
- `delivery_delayed` - opóźnienie w dostarczeniu
- `delivered` - dostarczony (jeśli się udało)
- `bounced` - odrzucony
- `failed` - nieudany

**Sprawdź:**
- Czy jest komunikat błędu w event history?
- Jaki jest ostatni event przed "delivery_delayed"?

### **KROK 3: Sprawdź Weryfikację Domeny**

1. **Wejdź na:** https://resend.com/domains
2. **Sprawdź domenę:** `notification.lumly.pl`
3. **Status powinien być:** ✅ "Verified" (zielony)
4. **Jeśli jest:** ⚠️ "Pending" lub ❌ "Failed":
   - To jest **główna przyczyna** opóźnień!
   - Zweryfikuj domenę (dodaj rekordy DNS)

### **KROK 4: Sprawdź Rekordy DNS**

Jeśli domena nie jest zweryfikowana, sprawdź rekordy DNS:

**Wymagane rekordy:**
1. **SPF** - `v=spf1 include:resend.com ~all`
2. **DKIM** - klucz publiczny (Resend poda)
3. **DMARC** - `v=DMARC1; p=none;`

**Jak sprawdzić:**
```bash
# Sprawdź SPF
dig TXT notification.lumly.pl | grep spf

# Sprawdź DKIM
dig TXT resend._domainkey.notification.lumly.pl

# Sprawdź DMARC
dig TXT _dmarc.notification.lumly.pl
```

### **KROK 5: Sprawdź Logi Vercel**

Sprawdź czy są błędy wysyłania w logach:

```bash
# Pobierz logi z ostatnich 24h
vercel logs customify-s56o.vercel.app --since 24h > vercel-logs.txt

# Sprawdź błędy wysyłania maili
grep -E "Exception podczas wysyłania emaila|Error message|delivery delayed" vercel-logs.txt

# Sprawdź szczegóły błędów
grep -A 5 "Exception podczas wysyłania emaila" vercel-logs.txt
```

### **KROK 6: Sprawdź Rozmiar Obrazów**

Duże obrazy mogą powodować opóźnienia:

```bash
# W logach Vercel sprawdź rozmiar obrazów
grep "watermarkedImageUrl\|finalImageUrlForEmail" vercel-logs.txt | head -10
```

**Sprawdź w kodzie:**
- Obrazy w emailu powinny być < 1-2MB
- Jeśli są większe - zoptymalizuj przed wysłaniem

### **KROK 7: Sprawdź Przez Resend API**

Możesz sprawdzić szczegóły maili przez API:

```bash
# Użyj skryptu (wymaga RESEND_API_KEY)
node check-emails-direct.js RE_KEY

# Lub przez endpoint (po wdrożeniu)
curl "https://customify-s56o.vercel.app/api/check-email-stats"
```

## 🔍 Najczęstsze Przyczyny "Delivery Delayed"

### **1. Domena Nie Jest Zweryfikowana (NAJCZĘSTSZE!)**
**Objaw:** Domena `notification.lumly.pl` ma status "Pending" lub "Failed"  
**Rozwiązanie:** Zweryfikuj domenę w Resend (dodaj rekordy DNS)

### **2. Problemy z DNS/SPF/DKIM**
**Objaw:** Rekordy DNS nie są poprawnie skonfigurowane  
**Sprawdź:** `dig TXT notification.lumly.pl`  
**Rozwiązanie:** Popraw rekordy DNS zgodnie z instrukcjami Resend

### **3. Duże Obrazy w Emailu**
**Objaw:** Obrazy w emailu są > 2MB  
**Sprawdź:** Rozmiar `watermarkedImageUrl` w logach  
**Rozwiązanie:** Zoptymalizuj obrazy przed wysłaniem

### **4. Serwer Odbiorcy Przeciążony**
**Objaw:** Tylko niektóre maile są delayed (np. tylko Gmail)  
**Rozwiązanie:** Resend automatycznie ponowi próbę (24-48h)

### **5. Filtrowanie Antyspamowe**
**Objaw:** Maile są delayed dla konkretnych domen (np. tylko @gmail.com)  
**Rozwiązanie:** To normalne - serwery czasem opóźniają dla bezpieczeństwa

## 📊 Jak Sprawdzić Statystyki

### **W Resend Dashboard:**
1. Wejdź: https://resend.com/emails
2. Filtruj: Status = "Delivery Delayed"
3. Sprawdź:
   - Ile maili jest delayed?
   - Do jakich domen są wysyłane? (Gmail, Outlook, etc.)
   - Jaki jest ostatni event?

### **Przez Logi Vercel:**
```bash
# Sprawdź ile maili zostało wysłanych
grep "Email wysłany pomyślnie" vercel-logs.txt | wc -l

# Sprawdź ile jest delayed (jeśli jest info w logach)
grep "delivery delayed\|delayed" vercel-logs.txt | wc -l
```

## ✅ Szybka Diagnostyka (5 minut)

1. **Resend Dashboard** → Emails → Filtruj "Delivery Delayed" → Kliknij na mail → Sprawdź "Last Event" i "Error Message"
2. **Resend Dashboard** → Domains → Sprawdź status `notification.lumly.pl`
3. **Jeśli domena nie jest zweryfikowana** → To jest główna przyczyna!

## 🎯 Najczęstsze Rozwiązanie

**90% przypadków "delivery delayed" to brak weryfikacji domeny.**

**Sprawdź:**
1. https://resend.com/domains
2. Czy `notification.lumly.pl` jest zweryfikowana?
3. Jeśli nie → zweryfikuj (dodaj rekordy DNS)

Po weryfikacji domeny, maile powinny być dostarczane normalnie.

