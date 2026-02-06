# 🧪 Test lokalny bez pushowania na git

## ✅ Można testować lokalnie!

Możesz testować endpointy lokalnie używając `vercel dev` - nie musisz pushować na git.

---

## 📋 KROK 1: Uruchom lokalny serwer Vercel

```bash
cd /Users/main/Desktop/customify
vercel dev
```

**Oczekiwany output:**
```
> Ready! Available at http://localhost:3000
```

---

## 📋 KROK 2: Test pobierania produktów z kolekcji (używając ID)

### **Używając ID kolekcji (672196395333):**
```bash
curl "http://localhost:3000/api/get-collection-products?id=672196395333"
```

**Lub używając handle (jeśli znasz):**
```bash
curl "http://localhost:3000/api/get-collection-products?handle=walentynki"
```

**Oczekiwany wynik:**
```json
{
  "success": true,
  "collection": {
    "id": "gid://shopify/Collection/672196395333",
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

---

## 📋 KROK 3: Wyślij testowego maila (lokalnie)

### **Używając ID kolekcji:**
```bash
curl -X POST http://localhost:3000/api/send-bulk-generation-emails \
  -H "Content-Type: application/json" \
  -d '{
    "testEmail": "twoj@email.pl",
    "collectionId": "672196395333"
  }'
```

**Lub używając handle:**
```bash
curl -X POST http://localhost:3000/api/send-bulk-generation-emails \
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

## 📋 KROK 4: Sprawdź skrzynkę mailową

1. **Sprawdź folder SPAM** - czasami maile trafiają do spamu
2. **Sprawdź czy email się wyświetla poprawnie:**
   - ✅ Header z gradientem różowym
   - ✅ Tytuł "💕 Walentynki z Lumly.pl"
   - ✅ Produkty z kolekcji (3 kolumny)
   - ✅ Linki działają
   - ✅ Obrazki się ładują

---

## 🔧 Rozwiązywanie problemów

### **Problem: "Collection not found"**
- Sprawdź czy ID kolekcji jest poprawne (672196395333)
- Sprawdź czy kolekcja ma produkty w Shopify Admin
- Sprawdź czy produkty mają `featuredImage` (obrazek główny)

### **Problem: "SHOPIFY_ACCESS_TOKEN not configured"**
- Sprawdź czy masz `.env` w katalogu głównym
- Dodaj: `SHOPIFY_ACCESS_TOKEN=twoj_token`
- Lub użyj: `vercel env pull` (pobiera zmienne z Vercel)

### **Problem: "RESEND_API_KEY not configured"**
- Sprawdź czy masz `.env` w katalogu głównym
- Dodaj: `RESEND_API_KEY=re_...`
- Lub użyj: `vercel env pull`

### **Problem: Email nie przychodzi**
- Sprawdź logi w terminalu gdzie działa `vercel dev`
- Sprawdź folder SPAM
- Sprawdź czy `RESEND_API_KEY` jest poprawny

---

## ✅ Zalety testowania lokalnie

- ✅ **Szybko** - zmiany widoczne od razu
- ✅ **Bezpiecznie** - nie wpływa na produkcję
- ✅ **Bez git** - nie musisz commitować/pushować
- ✅ **Debugowanie** - widzisz logi w terminalu

---

## 🚀 Po pozytywnym teście lokalnym

Jeśli wszystko działa lokalnie, możesz:
1. **Commitować zmiany** (opcjonalnie)
2. **Pushować na branch** (opcjonalnie)
3. **Testować na produkcji** (Vercel automatycznie wdroży po push)

---

**Status:** 📝 Gotowe do testowania lokalnie  
**Branch:** `mailing-walentynki`  
**Data:** 2025-01-XX
