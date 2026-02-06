# 📧 Instrukcja: Wysyłka testowego maila walentynkowego

## 🎯 Cel
Wysłać testowego maila walentynkowego do siebie, żeby sprawdzić jak wygląda przed masową wysyłką.

---

## 📋 KROK 1: Sprawdź czy endpoint działa

### **Test pobierania produktów z kolekcji:**
```bash
curl "https://customify-s56o.vercel.app/api/get-collection-products?handle=walentynki"
```

**Oczekiwany wynik:**
```json
{
  "success": true,
  "collection": {
    "id": "gid://shopify/Collection/...",
    "title": "Walentynki",
    "handle": "walentynki"
  },
  "products": [
    {
      "title": "Nazwa produktu",
      "handle": "nazwa-produktu",
      "href": "https://lumly.pl/products/nazwa-produktu",
      "img": "https://cdn.shopify.com/..."
    }
  ],
  "count": 5
}
```

**Jeśli kolekcja nie istnieje:**
- Sprawdź w Shopify Admin czy kolekcja "walentynki" istnieje
- Sprawdź handle kolekcji (może być "valentine" zamiast "walentynki")
- Utwórz kolekcję jeśli nie istnieje

---

## 📋 KROK 2: Wyślij testowego maila

### **Komenda:**
```bash
curl -X POST https://customify-s56o.vercel.app/api/send-bulk-generation-emails \
  -H "Content-Type: application/json" \
  -d '{
    "testEmail": "twoj@email.pl",
    "collectionHandle": "walentynki"
  }'
```

**Zastąp:**
- `twoj@email.pl` → Twój prawdziwy email

**Oczekiwany wynik:**
```json
{
  "success": true,
  "testEmail": "twoj@email.pl",
  "emailId": "re_...",
  "message": "Testowy email wysłany!"
}
```

---

## 📋 KROK 3: Sprawdź skrzynkę mailową

1. **Sprawdź folder SPAM** - czasami maile trafiają do spamu
2. **Sprawdź czy email się wyświetla poprawnie:**
   - ✅ Header z gradientem różowym
   - ✅ Tytuł "💕 Walentynki z Lumly.pl"
   - ✅ Produkty z kolekcji "walentynki" (3 kolumny)
   - ✅ Linki działają
   - ✅ Obrazki się ładują

---

## 📋 KROK 4: Jeśli coś nie działa

### **Problem: Kolekcja nie znaleziona**
```json
{
  "error": "Collection not found",
  "handle": "walentynki"
}
```

**Rozwiązanie:**
1. Sprawdź w Shopify Admin → Collections → znajdź kolekcję walentynkową
2. Sprawdź handle kolekcji (URL: `/collections/HANDLE`)
3. Użyj poprawnego handle w request:
   ```bash
   curl -X POST ... -d '{"testEmail": "...", "collectionHandle": "POPRAWNY_HANDLE"}'
   ```

### **Problem: Brak produktów w kolekcji**
- Sprawdź czy kolekcja ma produkty w Shopify Admin
- Produkty muszą mieć `featuredImage` (obrazek główny)

### **Problem: Email nie przychodzi**
- Sprawdź logi Vercel: `vercel logs customify-s56o.vercel.app | grep "BULK-EMAIL"`
- Sprawdź czy `RESEND_API_KEY` jest ustawiony w Vercel
- Sprawdź folder SPAM

---

## 📋 KROK 5: Po pozytywnym teście

### **Pobierz klientów starszych niż 2 tygodnie:**
```bash
curl "https://customify-s56o.vercel.app/api/get-old-customers?days=14" > old-customers.json
```

### **Sprawdź ile klientów:**
```bash
cat old-customers.json | jq '.oldCustomers'
```

### **Przygotuj do masowej wysyłki:**
```bash
# Wyciągnij tylko email i customerId
cat old-customers.json | jq '.customers | map({email, customerId})' > customers-to-send.json
```

### **Masowa wysyłka (przykład):**
```bash
curl -X POST https://customify-s56o.vercel.app/api/send-bulk-generation-emails \
  -H "Content-Type: application/json" \
  -d @customers-to-send.json \
  -d '{"collectionHandle": "walentynki"}'
```

**UWAGA:** Masowa wysyłka może zająć dużo czasu (1 email/sekundę). Dla 100 klientów = ~2 minuty.

---

## ✅ CHECKLIST PRZED MASOWĄ WYSYŁKĄ

- [ ] Test email przyszedł i wygląda dobrze
- [ ] Produkty z kolekcji "walentynki" są widoczne
- [ ] Linki działają
- [ ] Obrazki się ładują
- [ ] Pobrano listę klientów starszych niż 2 tygodnie
- [ ] Sprawdzono ile klientów będzie (nie za dużo!)
- [ ] Masowa wysyłka gotowa

---

**Status:** 📝 Gotowe do testowania  
**Branch:** `mailing-walentynki`  
**Data:** 2025-01-XX
