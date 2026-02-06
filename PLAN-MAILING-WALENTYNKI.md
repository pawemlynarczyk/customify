# 📧 PLAN: Mailing Walentynkowy - Klienci starsi niż 2 tygodnie

## 🎯 CEL
Wysłać mailing do wszystkich klientów starszych niż 2 tygodnie z produktami z kolekcji "walentynki".

---

## 📋 KROK 1: Pobranie klientów starszych niż 2 tygodnie

### **Endpoint:** `/api/get-old-customers.js`

### **Logika:**
1. Pobierz wszystkich klientów z Shopify GraphQL (paginacja)
2. Filtruj po `createdAt` - starsi niż 14 dni
3. Zwróć listę: `[{ email, customerId, createdAt }]`

### **GraphQL Query:**
```graphql
query getOldCustomers($first: Int!, $after: String) {
  customers(first: $first, after: $after) {
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      node {
        id
        email
        createdAt
      }
    }
  }
}
```

### **Filtrowanie:**
```javascript
const twoWeeksAgo = new Date();
twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

const oldCustomers = allCustomers.filter(customer => {
  const createdAt = new Date(customer.node.createdAt);
  return createdAt < twoWeeksAgo;
});
```

---

## 📋 KROK 2: Pobranie produktów z kolekcji "walentynki"

### **Endpoint:** `/api/get-collection-products.js`

### **Logika:**
1. Znajdź kolekcję po handle "walentynki" (lub "valentine")
2. Pobierz produkty z kolekcji (GraphQL)
3. Zwróć listę: `[{ title, handle, imageUrl, productUrl }]`

### **GraphQL Query:**
```graphql
query getCollectionProducts($handle: String!) {
  collectionByHandle(handle: $handle) {
    id
    title
    products(first: 50) {
      edges {
        node {
          id
          title
          handle
          onlineStoreUrl
          featuredImage {
            url(transform: { maxWidth: 600 })
          }
        }
      }
    }
  }
}
```

### **Alternatywa (REST API):**
```javascript
// Pobierz kolekcję po handle
GET /admin/api/2024-01/collections.json?handle=walentynki

// Pobierz produkty z kolekcji
GET /admin/api/2024-01/collections/{collectionId}/products.json
```

---

## 📋 KROK 3: Template emaila walentynkowego

### **Struktura:**
1. **Header** - gradient różowy/czerwony (walentynkowy)
2. **Treść główna** - powitanie, motyw walentynkowy
3. **Produkty** - miniatury z kolekcji "walentynki" (3 kolumny)
4. **CTA** - link do kolekcji lub produktu
5. **Footer** - kontakt, unsubscribe

### **Kolory walentynkowe:**
- Gradient: `#ff6b9d` → `#c44569` (różowy do ciemnoróżowego)
- Lub: `#e91e63` → `#c2185b` (różowy do bordowego)
- Tło: `#fff5f8` (jasnoróżowy)

---

## 📋 KROK 4: Integracja z istniejącym endpointem

### **Modyfikacja:** `/api/send-bulk-generation-emails.js`

### **Dodaj:**
1. Parametr `collectionHandle` w request body
2. Funkcję `getCollectionProducts(collectionHandle)` 
3. Nowy template `valentineEmailTemplate(products)`
4. Warunek: jeśli `collectionHandle === 'walentynki'` → użyj template walentynkowego

---

## 📋 KROK 5: Workflow wysyłki

### **Krok po kroku:**

1. **Pobierz klientów:**
   ```bash
   curl https://customify-s56o.vercel.app/api/get-old-customers > old-customers.json
   ```

2. **Pobierz produkty:**
   ```bash
   curl https://customify-s56o.vercel.app/api/get-collection-products?handle=walentynki > walentynki-products.json
   ```

3. **Test emaila:**
   ```bash
   curl -X POST https://customify-s56o.vercel.app/api/send-bulk-generation-emails \
     -H "Content-Type: application/json" \
     -d '{
       "testEmail": "twoj@email.pl",
       "collectionHandle": "walentynki"
     }'
   ```

4. **Masowa wysyłka:**
   ```bash
   node send-bulk-emails-walentynki.js
   ```

---

## 📋 KROK 6: Bezpieczeństwo (branch)

### **Branch:** `mailing-walentynki`
- ✅ Nie koliduje z innym agentem (main branch)
- ✅ Można testować bez wpływu na produkcję
- ✅ Merge tylko po akceptacji

### **Workflow:**
```bash
# 1. Stwórz branch (już zrobione)
git checkout -b mailing-walentynki

# 2. Pracuj na branchu
# ... implementacja ...

# 3. Testuj lokalnie
vercel dev

# 4. Commit zmiany
git add .
git commit -m "Dodano mailing walentynkowy"

# 5. Push branch
git push origin mailing-walentynki

# 6. Po testach - merge do main (TYLKO PO PYTANIU!)
# git checkout main
# git merge mailing-walentynki  # ← ZAWSZE PYTAJ PRZED MERGE!
```

---

## 📋 KROK 7: Szacowanie

### **Czas implementacji:**
- Endpoint get-old-customers: ~30 min
- Endpoint get-collection-products: ~30 min
- Template emaila: ~1h
- Integracja: ~30 min
- **Łącznie: ~2.5h**

### **Czas wysyłki:**
- 100 klientów: ~2 minuty
- 500 klientów: ~8 minut
- 1000 klientów: ~17 minut

### **Koszty:**
- Resend: Darmowy tier (3,000 maili/miesiąc) → wystarczający

---

## ✅ CHECKLIST

- [ ] Stworzyć branch `mailing-walentynki` ✅
- [ ] Endpoint `/api/get-old-customers.js`
- [ ] Endpoint `/api/get-collection-products.js`
- [ ] Template emaila walentynkowego
- [ ] Integracja z `/api/send-bulk-generation-emails.js`
- [ ] Test emaila (testEmail)
- [ ] Masowa wysyłka
- [ ] Monitoring wyników

---

**Status:** 📝 Plan gotowy do implementacji  
**Branch:** `mailing-walentynki`  
**Data:** 2025-01-XX
