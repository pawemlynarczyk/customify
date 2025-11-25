# 📧 PLAN: Wysyłanie maila przez Shopify Flow

## 🎯 CEL
Wysyłanie automatycznego maila do zalogowanego użytkownika po udanej generacji AI przez **Shopify Flow** (wbudowane w Shopify, bez dodatkowych kosztów).

---

## ✅ ZALETY SHOPIFY FLOW:
- ✅ Wbudowane w Shopify (bez dodatkowych kosztów)
- ✅ Automatyzacja bez kodu (konfiguracja w UI)
- ✅ Integracja z Customer Account
- ✅ Wsparcie dla HTML templates
- ✅ Nie wymaga zewnętrznych serwisów

---

## ⚠️ WADY SHOPIFY FLOW:
- ⚠️ Wymaga konfiguracji w Shopify Admin UI
- ⚠️ Ograniczenia w personalizacji (trudniejsze dodanie obrazka z watermarkiem)
- ⚠️ Trudniejsze debugowanie
- ⚠️ Obrazki z zewnętrznych URL mogą nie działać (Vercel Blob)

---

## 📝 KROK 1: Ustawienie metafield po zapisie generacji

### **Modyfikacja:** `api/_save-generation-core.js`

### **Gdzie dodać:**
Po udanym zapisie generacji do Vercel Blob (około linia 350)

### **Kod:**
```javascript
// W api/_save-generation-core.js, po zapisie generacji do Vercel Blob

// ✅ USTAW METAFIELD NA CUSTOMER (TRIGGER DLA SHOPIFY FLOW)
if (customerId && email && watermarkedImageUrl && process.env.SHOPIFY_ACCESS_TOKEN) {
  const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  
  console.log('📧 [SAVE-GENERATION] Ustawiam metafield dla Shopify Flow:', {
    customerId,
    email: email.substring(0, 10) + '...',
    hasWatermarkedUrl: !!watermarkedImageUrl
  });
  
  try {
    // Ustaw metafield na customer (trigger dla Shopify Flow)
    const metafieldResponse = await fetch(`https://${shop}/admin/api/2023-10/customers/${customerId}/metafields.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        metafield: {
          namespace: 'customify',
          key: 'generation_ready',
          value: JSON.stringify({
            imageUrl: watermarkedImageUrl,
            style: style,
            size: size || null,
            productType: productType || 'other',
            timestamp: new Date().toISOString(),
            galleryUrl: 'https://lumly.pl/pages/my-generations'
          }),
          type: 'json'
        }
      })
    });
    
    if (metafieldResponse.ok) {
      console.log('✅ [SAVE-GENERATION] Metafield ustawiony - Shopify Flow wyśle email');
    } else {
      const error = await metafieldResponse.text();
      console.warn('⚠️ [SAVE-GENERATION] Nie udało się ustawić metafield:', error);
    }
  } catch (error) {
    console.error('❌ [SAVE-GENERATION] Błąd ustawiania metafield:', error);
    // Nie blokuj - email to bonus, nie krytyczna funkcja
  }
} else {
  if (!customerId) {
    console.log('📧 [SAVE-GENERATION] Pomijam Shopify Flow - brak customerId (niezalogowany)');
  } else if (!email) {
    console.log('📧 [SAVE-GENERATION] Pomijam Shopify Flow - brak emaila');
  } else if (!watermarkedImageUrl) {
    console.log('📧 [SAVE-GENERATION] Pomijam Shopify Flow - brak watermarkedImageUrl');
  }
}
```

---

## 📝 KROK 2: Konfiguracja Shopify Flow (w Shopify Admin UI)

### **2.1. Utworzenie workflow:**

1. **Zaloguj się do Shopify Admin:**
   - Przejdź do: `Settings → Shopify Flow`
   - Kliknij: `Create workflow`

2. **Nazwa workflow:**
   - `Send email after AI generation`

3. **Trigger (Wyzwalacz):**
   - **Typ:** `Customer metafield updated`
   - **Metafield:** `customify.generation_ready`
   - **Condition:** `Metafield value is not empty`

4. **Action (Akcja):**
   - **Typ:** `Send email`
   - **To:** `{{ customer.email }}`
   - **Subject:** `Twoja generacja AI jest gotowa! 🎨`
   - **Template:** Utwórz template w Shopify Email (patrz KROK 3)

---

## 📝 KROK 3: Utworzenie template emaila w Shopify Email

### **3.1. Utworzenie template:**

1. **Przejdź do:** `Marketing → Shopify Email`
2. **Kliknij:** `Create email`
3. **Wybierz:** `Blank template` lub `Custom template`

### **3.2. Struktura emaila:**

```
┌─────────────────────────────────┐
│  🎨 Twoja generacja AI jest     │
│     gotowa!                      │
├─────────────────────────────────┤
│  Cześć {{ customer.first_name }},│
│                                  │
│  Twoja generacja w stylu         │
│  {{ customer.metafields.         │
│     customify.generation_ready.  │
│     style }} jest gotowa!        │
│                                  │
│  [OBRAZEK]                       │
│  ({{ customer.metafields.        │
│     customify.generation_ready.  │
│     imageUrl }})                  │
│                                  │
│  [PRZYCISK]                      │
│  Zobacz wszystkie generacje →    │
│  ({{ customer.metafields.        │
│     customify.generation_ready.  │
│     galleryUrl }})                │
│                                  │
│  Rozmiar: {{ customer.           │
│     metafields.customify.        │
│     generation_ready.size }}     │
└─────────────────────────────────┘
```

### **3.3. HTML Template (jeśli Shopify Email nie obsługuje metafields):**

**⚠️ UWAGA:** Shopify Email może nie obsługiwać bezpośrednio metafields w template. W takim przypadku:

1. **Użyj Shopify Flow Variables:**
   - W Shopify Flow, przed akcją "Send email", dodaj:
     - **Action:** `Set variable`
     - **Variable name:** `generation_image`
     - **Value:** `{{ customer.metafields.customify.generation_ready.imageUrl }}`

2. **Użyj zmiennej w emailu:**
   - W template emaila: `{{ generation_image }}`

### **3.4. Alternatywa: Użyj Liquid w template:**

Jeśli Shopify Email obsługuje Liquid:

```liquid
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Twoja generacja AI jest gotowa!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎨 Twoja generacja AI jest gotowa!</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Cześć {{ customer.first_name }}, 👋
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Twoja generacja w stylu <strong>{{ customer.metafields.customify.generation_ready.style }}</strong> jest gotowa! Sprawdź efekt poniżej:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <img 
        src="{{ customer.metafields.customify.generation_ready.imageUrl }}" 
        alt="Generacja {{ customer.metafields.customify.generation_ready.style }}" 
        style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
      />
    </div>
    
    {% if customer.metafields.customify.generation_ready.size %}
    <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
      <strong>Rozmiar:</strong> {{ customer.metafields.customify.generation_ready.size }}
    </p>
    {% endif %}
    
    <div style="text-align: center; margin: 30px 0;">
      <a 
        href="{{ customer.metafields.customify.generation_ready.galleryUrl }}" 
        style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;"
      >
        Zobacz wszystkie generacje →
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
      Masz pytania? Odpowiedz na ten mail lub skontaktuj się z nami przez stronę.
    </p>
    
    <p style="font-size: 12px; color: #999; margin-top: 20px; text-align: center;">
      © {{ 'now' | date: '%Y' }} Lumly.pl - Personalizowane portrety AI
    </p>
  </div>
</body>
</html>
```

---

## 📝 KROK 4: Testowanie

### **4.1. Test metafield:**
1. Wygeneruj obraz jako zalogowany użytkownik
2. Sprawdź w Shopify Admin → Customers → [Customer] → Metafields
3. Powinien być metafield: `customify.generation_ready`

### **4.2. Test Shopify Flow:**
1. Sprawdź w Shopify Admin → Settings → Shopify Flow → [Workflow]
2. Sprawdź logi workflow (czy został wywołany)
3. Sprawdź czy email został wysłany

### **4.3. Test emaila:**
1. Sprawdź skrzynkę mailową użytkownika
2. Sprawdź czy obrazek się wyświetla (może być problem z Vercel Blob CORS)
3. Sprawdź czy link do galerii działa

---

## ⚠️ POTENCJALNE PROBLEMY:

### **1. Obrazki z Vercel Blob mogą nie działać:**
- **Problem:** Shopify Email może blokować zewnętrzne obrazy
- **Rozwiązanie:** 
  - Użyj obrazka z Shopify CDN (upload do Shopify Files)
  - Lub użyj proxy URL (przez nasz endpoint)

### **2. Metafields mogą nie być dostępne w Shopify Email:**
- **Problem:** Shopify Email może nie obsługiwać metafields w template
- **Rozwiązanie:** 
  - Użyj Shopify Flow Variables (ustaw przed akcją "Send email")
  - Lub użyj Liquid w template (jeśli obsługiwane)

### **3. Shopify Flow może nie działać natychmiast:**
- **Problem:** Shopify Flow może mieć opóźnienie (kilka minut)
- **Rozwiązanie:** 
  - To jest normalne - Shopify Flow działa asynchronicznie
  - Można dodać retry logic w kodzie

---

## 📋 CHECKLIST IMPLEMENTACJI:

- [ ] **KROK 1:** Modyfikacja `api/_save-generation-core.js` (ustawienie metafield)
- [ ] **KROK 2:** Utworzenie workflow w Shopify Flow
- [ ] **KROK 3:** Utworzenie template emaila w Shopify Email
- [ ] **KROK 4:** Testowanie metafield
- [ ] **KROK 5:** Testowanie Shopify Flow
- [ ] **KROK 6:** Testowanie emaila
- [ ] **KROK 7:** Rozwiązanie problemów z obrazkami (jeśli występują)

---

## 🎯 PODSUMOWANIE:

### **Flow końcowy:**
1. User generuje obraz → `api/transform.js`
2. Obraz zapisany → `api/save-generation-v2.js`
3. Metafield ustawiony → `customify.generation_ready`
4. Shopify Flow wykrywa zmianę → Wywołuje workflow
5. Shopify Email wysyła mail → User otrzymuje mail z obrazkiem i linkiem

### **Korzyści:**
- ✅ Wbudowane w Shopify (bez dodatkowych kosztów)
- ✅ Automatyzacja bez kodu (konfiguracja w UI)
- ✅ Integracja z Customer Account

### **Wady:**
- ⚠️ Wymaga konfiguracji w UI (nie tylko kod)
- ⚠️ Ograniczenia w personalizacji
- ⚠️ Trudniejsze debugowanie

---

**Status:** 📝 Plan gotowy do implementacji
**Data:** 2025-01-XX
**Autor:** AI Assistant

