# 🔍 Co Szukać w Logach Vercel

## 📋 KONKRETNE FRAZY DO SZUKANIA:

### **1. Próby wysłania maila:**
```bash
vercel logs customify-s56o.vercel.app --since 24h | grep "Wysyłam email przez Resend"
```

**Co znajdziesz:**
- Kto próbował wysłać maila
- Email odbiorcy
- CustomerId

### **2. Sukces - Resend ID (mail został wysłany):**
```bash
vercel logs customify-s56o.vercel.app --since 24h | grep "Resend ID"
```

**Co znajdziesz:**
- Resend ID każdego wysłanego maila
- Możesz sprawdzić ten ID w Resend Dashboard

### **3. Błędy wysyłania:**
```bash
vercel logs customify-s56o.vercel.app --since 24h | grep "Exception podczas wysyłania emaila"
```

**Co znajdziesz:**
- Błędy podczas wysyłania
- Komunikaty błędów

### **4. Warunki przed wysłaniem:**
```bash
vercel logs customify-s56o.vercel.app --since 24h | grep "SPRAWDZAM WARUNKI WYSYŁANIA EMAILA"
```

**Co znajdziesz:**
- Email odbiorcy
- CustomerId
- Czy warunki były spełnione

### **5. Pominięte maile (brak warunków):**
```bash
vercel logs customify-s56o.vercel.app --since 24h | grep "Pomijam email"
```

**Co znajdziesz:**
- Dlaczego mail nie został wysłany
- Brak emaila, customerId, watermarkedImageUrl, etc.

## 🎯 JEDNA KOMENDA - WSZYSTKO:

```bash
vercel logs customify-s56o.vercel.app --since 24h | grep -E "Wysyłam email|Resend ID|Exception podczas wysyłania|Pomijam email|SPRAWDZAM WARUNKI"
```

## 📊 SZYBKA ANALIZA:

```bash
# Zapisz logi do pliku
vercel logs customify-s56o.vercel.app --since 24h > logs.txt

# Sprawdź statystyki
echo "=== PRÓBY WYSŁANIA ===" && grep "Wysyłam email przez Resend" logs.txt | wc -l
echo "=== WYSŁANE (Resend ID) ===" && grep "Resend ID:" logs.txt | wc -l
echo "=== BŁĘDY ===" && grep "Exception podczas wysyłania emaila" logs.txt | wc -l
echo "=== POMINIĘTE ===" && grep "Pomijam email" logs.txt | wc -l
```

## 🔍 WYCIĄGNIJ LISTĘ EMAILI:

```bash
# Wyciągnij emaile które powinny dostać maila
vercel logs customify-s56o.vercel.app --since 24h | grep -A 3 "Wysyłam email przez Resend" | grep "email:" | awk '{print $NF}'

# Wyciągnij Resend ID
vercel logs customify-s56o.vercel.app --since 24h | grep "Resend ID:" | awk '{print $NF}'
```

## 📝 PRZYKŁADOWE LOGI:

### **Sukces:**
```
📧 [SAVE-GENERATION] Wysyłam email przez Resend...
📧 [SAVE-GENERATION] email: user@example.com
✅ [SAVE-GENERATION] Email wysłany pomyślnie!
✅ [SAVE-GENERATION] Resend ID: abc123def456
```

### **Błąd:**
```
📧 [SAVE-GENERATION] Wysyłam email przez Resend...
❌ [SAVE-GENERATION] Exception podczas wysyłania emaila: ...
❌ [SAVE-GENERATION] Error message: Invalid API key
```

### **Pominięte:**
```
📧 [SAVE-GENERATION] Pomijam email - brak emaila (niezalogowany)
```

## ✅ CHECKLIST:

- [ ] `Wysyłam email przez Resend` - próby wysłania
- [ ] `Resend ID:` - sukces (mail wysłany)
- [ ] `Exception podczas wysyłania emaila` - błędy
- [ ] `Pomijam email` - pominięte (brak warunków)
- [ ] `SPRAWDZAM WARUNKI WYSYŁANIA EMAILA` - warunki przed wysłaniem



