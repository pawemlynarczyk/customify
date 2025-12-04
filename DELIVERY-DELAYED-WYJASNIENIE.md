# ⏳ Delivery Delayed - Co To Oznacza?

## 📧 Status "Delivery Delayed" w Resend

**"Delivery delayed"** oznacza, że maile zostały **zaakceptowane przez Resend**, ale **nie zostały jeszcze dostarczone** do serwera odbiorcy.

## 🔍 Możliwe Przyczyny:

### **1. Tymczasowe problemy z serwerem odbiorcy**
- Serwer pocztowy odbiorcy (Gmail, Outlook, etc.) jest chwilowo niedostępny
- Serwer jest przeciążony
- **Rozwiązanie:** Resend automatycznie ponowi próbę dostarczenia (zwykle przez 24-48h)

### **2. Pełna skrzynka odbiorcza**
- Skrzynka odbiorcy jest pełna
- **Rozwiązanie:** Odbiorca musi zwolnić miejsce w skrzynce

### **3. Problemy z DNS/SPF/DKIM**
- Nieprawidłowe rekordy SPF, DKIM lub DMARC
- **Sprawdź:** Resend Dashboard → Domains → Sprawdź status weryfikacji domeny
- **Rozwiązanie:** Zweryfikuj domenę w Resend (jeśli nie jest zweryfikowana)

### **4. Filtrowanie antyspamowe**
- Serwer odbiorcy tymczasowo opóźnia dostarczanie (procedury antyspamowe)
- **Rozwiązanie:** Resend automatycznie ponowi próbę

### **5. Duże obrazy w emailu**
- Obrazy w emailu są zbyt duże
- **Sprawdź:** Czy `watermarkedImageUrl` w emailu nie jest zbyt duży
- **Rozwiązanie:** Upewnij się że obrazy są zoptymalizowane

## ✅ Co Zrobić:

### **KROK 1: Sprawdź weryfikację domeny**
1. Wejdź: https://resend.com/domains
2. Sprawdź czy domena `notification.lumly.pl` jest zweryfikowana
3. Jeśli nie - zweryfikuj domenę (dodaj rekordy DNS)

### **KROK 2: Sprawdź szczegóły maili**
1. W Resend Dashboard kliknij na jeden z maili "delivery delayed"
2. Sprawdź:
   - **Odbiorca:** Czy email jest poprawny?
   - **Błąd:** Czy jest jakiś komunikat błędu?
   - **Last Event:** Jaki jest ostatni event?

### **KROK 3: Sprawdź rozmiar obrazów**
- Obrazy w emailu nie powinny być większe niż 1-2MB
- Sprawdź czy `watermarkedImageUrl` w emailu nie jest zbyt duży

### **KROK 4: Poczekaj na automatyczne ponowienie**
- Resend automatycznie ponowi próbę dostarczenia przez 24-48h
- Większość maili "delivery delayed" zostanie dostarczona automatycznie

## ⚠️ Jeśli Maile Nadal Są Opóźnione Po 48h:

1. **Sprawdź logi Vercel** - czy są błędy wysyłania:
   ```bash
   vercel logs customify-s56o.vercel.app --since 48h | grep "Exception podczas wysyłania emaila"
   ```

2. **Sprawdź weryfikację domeny** - czy domena jest zweryfikowana w Resend

3. **Sprawdź rozmiar obrazów** - czy obrazy w emailu nie są zbyt duże

4. **Skontaktuj się z Resend Support** - jeśli problem się utrzymuje

## 📊 Statystyki:

- **20 maili "delivery delayed"** - to normalne jeśli:
  - Wysyłasz dużo maili jednocześnie
  - Niektóre serwery odbiorców są przeciążone
  - To pierwsze maile z nowej domeny (wymaga "rozgrzania" reputacji)

## 🎯 Najczęstsze Rozwiązanie:

**Większość maili "delivery delayed" zostanie dostarczona automatycznie przez Resend w ciągu 24-48h.** 

Jeśli po 48h nadal są opóźnione, sprawdź:
1. Weryfikację domeny w Resend
2. Rozmiar obrazów w emailu
3. Logi błędów w Vercel



