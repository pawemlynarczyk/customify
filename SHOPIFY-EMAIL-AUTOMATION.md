# 📧 Automatyzacja wysyłania emaili przez Shopify Email Template

## 🎯 PROBLEM
Metafield `customify.generation_ready` jest ustawiany, ale email nie wysyła się automatycznie. Shopify Email template wymaga ręcznego wywołania lub automatyzacji.

---

## ✅ ROZWIĄZANIE 1: Shopify Flow (REKOMENDOWANE)

### **Krok 1: Utwórz Shopify Flow**

1. **Shopify Admin** → **Settings** → **Automation** → **Flows**
2. **Create flow** → **Custom**
3. **Nazwa**: "Wysyłanie emaila po generacji AI"

### **Krok 2: Trigger (Wyzwalacz)**

**Problem**: Shopify Flow NIE MA triggera dla metafield updates.

**Rozwiązanie**: Użyj **"Customer updated"** trigger i sprawdź metafield w warunku:

1. **Trigger**: **Customer updated**
2. **Condition**: 
   - **If** `Customer metafield` → `customify.generation_ready` → `is not empty`
   - **And** `Customer metafield` → `customify.generation_ready` → `was changed`

### **Krok 3: Action (Akcja)**

1. **Action**: **Send email**
2. **Email template**: Wybierz swój template z "Custom Liquid" section
3. **Recipient**: `{{ customer.email }}`
4. **Subject**: "Twoja generacja AI jest gotowa! 🎨"

### **Krok 4: Test**

1. Wygeneruj nową generację AI (dla zalogowanego użytkownika)
2. Sprawdź czy metafield został ustawiony (Shopify Admin → Customers → [Customer] → Metafields)
3. Sprawdź czy Flow się uruchomił (Shopify Admin → Settings → Automation → Flows → [Your Flow] → Activity)

---

## ✅ ROZWIĄZANIE 2: Shopify Email API (JEŚLI DOSTĘPNE)

Shopify Email API może nie być dostępne bezpośrednio. Sprawdź dokumentację:
- https://shopify.dev/docs/api/admin-rest/2024-01/resources/email

**Alternatywa**: Użyj Shopify Flow (Rozwiązanie 1) - to jest oficjalny sposób.

---

## ✅ ROZWIĄZANIE 3: Webhook + Shopify Flow

Jeśli Shopify Flow nie ma triggera dla metafield updates, możesz:

1. **Utwórz webhook** który wywoła Shopify Flow
2. **W `api/_save-generation-core.js`** wyślij webhook po ustawieniu metafield
3. **Shopify Flow** nasłuchuje webhook i wysyła email

**Kod webhook** (dodaj do `api/_save-generation-core.js`):

```javascript
// Po ustawieniu metafield:
try {
  const webhookResponse = await fetch(`https://${shop}/admin/api/2023-10/webhooks.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      webhook: {
        topic: 'customers/update',
        address: 'https://your-flow-webhook-url.com',
        format: 'json'
      }
    })
  });
} catch (error) {
  console.error('❌ Webhook error:', error);
}
```

**Uwaga**: To może być skomplikowane - lepiej użyj Rozwiązania 1.

---

## ✅ ROZWIĄZANIE 4: Ręczne wysyłanie (TESTING)

Dla testów możesz ręcznie wysłać email:

1. **Shopify Admin** → **Customers** → [Customer]
2. **Metafields** → Sprawdź czy `customify.generation_ready` istnieje
3. **Shopify Admin** → **Marketing** → **Email**
4. **Create email** → Wybierz template z "Custom Liquid"
5. **Send** → Wybierz customera

---

## 🎯 REKOMENDACJA

**Użyj Rozwiązania 1 (Shopify Flow)** - to jest najprostsze i oficjalne rozwiązanie.

**Kroki:**
1. Utwórz Flow z triggerem "Customer updated"
2. Dodaj warunek: metafield `customify.generation_ready` is not empty
3. Dodaj akcję: Send email z template
4. Przetestuj na nowej generacji

---

**Status:** 📝 Instrukcje gotowe
**Data:** 2025-01-XX
**Autor:** AI Assistant

