# 📧 Instrukcja: Masowa wysyłka maili walentynkowych

## 🎯 Cel
Wysłać mailing do 1,331 klientów starszych niż 2 tygodnie, partiami po 100 maili.

---

## 📋 PARAMETRY WYSYŁKI

- **Rozmiar partii:** 100 maili
- **Opóźnienie między mailami:** 1 sekunda (rate limiting)
- **Przerwa między partiami:** 5 sekund
- **Łącznie partii:** ~14 partii (1,331 klientów)
- **Szacowany czas:** ~25-30 minut

---

## 🚀 JAK URUCHOMIĆ

### **Krok 1: Uruchom skrypt**
```bash
node send-bulk-walentynki.js
```

### **Krok 2: Skrypt automatycznie:**
1. Pobierze listę klientów starszych niż 2 tygodnie
2. Podzieli na partie po 100 maili
3. Wyśle partie po kolei
4. Zapisze postęp po każdej partii

---

## ⏸️ PRZERWANIE I WZNOWIENIE

### **Przerwanie (Ctrl+C):**
- Skrypt zapisze postęp automatycznie
- Możesz przerwać w dowolnym momencie

### **Wznowienie:**
- Uruchom ponownie: `node send-bulk-walentynki.js`
- Skrypt automatycznie wykryje wysłane partie i pominie je
- Wysyła tylko pozostałe partie

---

## 📊 MONITORING

### **Pliki z wynikami:**

1. **`mailing-progress.json`** - Postęp wysyłki:
   ```json
   {
     "completedBatches": [1, 2, 3],
     "allResults": {
       "sent": [...],
       "failed": [...]
     }
   }
   ```

2. **`mailing-results.json`** - Pełne wyniki:
   ```json
   {
     "sent": [
       {
         "email": "user@example.com",
         "customerId": "123",
         "emailId": "re_..."
       }
     ],
     "failed": [
       {
         "email": "invalid@",
         "error": "Invalid email"
       }
     ]
   }
   ```

---

## 📈 PRZYKŁADOWY OUTPUT

```
🚀 Masowa wysyłka maili walentynkowych
============================================================
📦 Rozmiar partii: 100 maili
⏱️  Opóźnienie między mailami: 1000ms
⏸️  Przerwa między partiami: 5000ms
============================================================

📋 Pobieranie klientów starszych niż 2 tygodnie...

✅ Znaleziono 1331 klientów starszych niż 2 tygodnie
📊 Łącznie klientów w bazie: 1579

📦 Przygotowano 14 partii po 100 maili
📧 Łącznie do wysłania: 1331 maili

📧 Partia 1/14 - Wysyłka do 100 klientów...
  ✅ 1/100 - user1@example.com
  ✅ 2/100 - user2@example.com
  ...
  
📊 Partia 1/14 zakończona:
   ✅ Wysłano: 98
   ❌ Błędy: 2

⏸️  Przerwa 5000ms przed następną partią...

📧 Partia 2/14 - Wysyłka do 100 klientów...
...
```

---

## ⚠️ WAŻNE UWAGI

1. **Rate Limiting:**
   - 1 email na sekundę (Resend limit: 100/sekundę)
   - Bezpieczne tempo dla stabilności

2. **Przerwy między partiami:**
   - 5 sekund przerwy między partiami
   - Zapobiega przeciążeniu API

3. **Automatyczne zapisywanie:**
   - Postęp zapisywany po każdej partii
   - Bezpieczne przerwanie w dowolnym momencie

4. **Błędy:**
   - Błędne emaile są pomijane
   - Wyniki zapisywane w `mailing-results.json`

---

## 🔍 SPRAWDZENIE WYNIKÓW

### **Po zakończeniu:**
```bash
# Zobacz podsumowanie
cat mailing-results.json | python3 -m json.tool | grep -A 5 "sent\|failed"

# Policz wysłane
cat mailing-results.json | python3 -c "import sys, json; d=json.load(sys.stdin); print(f\"Wysłano: {len(d['sent'])}\nBłędy: {len(d['failed'])}\")"
```

---

## 🚨 W RAZIE PROBLEMÓW

### **Problem: Skrypt się zawiesza**
- Przerwij (Ctrl+C)
- Sprawdź logi w konsoli
- Uruchom ponownie (automatycznie wznowi)

### **Problem: Zbyt dużo błędów**
- Sprawdź `mailing-results.json` - lista błędów
- Sprawdź czy `RESEND_API_KEY` jest poprawny
- Sprawdź limity Resend (3,000 maili/miesiąc darmowo)

### **Problem: Nie wszystkie maile wysłane**
- Uruchom ponownie skrypt
- Automatycznie wykryje i wyśle tylko brakujące partie

---

## ✅ CHECKLIST PRZED WYSYŁKĄ

- [ ] Sprawdzono testowy email (wygląda dobrze)
- [ ] Sprawdzono liczbę klientów (1,331)
- [ ] Sprawdzono kolekcję (14 produktów)
- [ ] Sprawdzono `RESEND_API_KEY` (działa)
- [ ] Przygotowano czas (~30 minut)
- [ ] Gotowy do uruchomienia

---

**Status:** 📝 Gotowe do uruchomienia  
**Skrypt:** `send-bulk-walentynki.js`  
**Data:** 2025-01-XX
