# 📧 Template emaila w Shopify Email

## 🎯 CEL
Utworzenie template emaila w Shopify Email z obrazkiem generacji i linkiem do galerii.

---

## 📝 KROK 1: Utworzenie template

1. **Shopify Admin → Marketing → Shopify Email**
2. **Kliknij:** `Create email`
3. **Wybierz:** `Blank template` lub `Custom template`

---

## 📝 KROK 2: Struktura template

### **Nagłówek:**
```
🎨 Twoja generacja AI jest gotowa!
```

### **Treść:**
```
Cześć {{ customer.first_name }},

Twoja generacja w stylu [STYL] jest gotowa! Sprawdź efekt poniżej:

[OBRAZEK]

Rozmiar: [ROZMIAR]

[PRZYCISK] Zobacz wszystkie generacje →
```

---

## 📝 KROK 3: Kod HTML template

### **Pełny template HTML:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Twoja generacja AI jest gotowa!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <!-- Nagłówek -->
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎨 Twoja generacja AI jest gotowa!</h1>
  </div>
  
  <!-- Treść -->
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Cześć {{ customer.first_name }}, 👋
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Twoja generacja w stylu <strong>{{ customer.metafields.customify.generation_ready.style }}</strong> jest gotowa! Sprawdź efekt poniżej:
    </p>
    
    <!-- Obrazek -->
    <div style="text-align: center; margin: 30px 0;">
      <img 
        src="{{ customer.metafields.customify.generation_ready.imageUrl }}" 
        alt="Generacja {{ customer.metafields.customify.generation_ready.style }}" 
        style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
      />
    </div>
    
    <!-- Rozmiar (jeśli dostępny) -->
    {% if customer.metafields.customify.generation_ready.size %}
    <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
      <strong>Rozmiar:</strong> {{ customer.metafields.customify.generation_ready.size }}
    </p>
    {% endif %}
    
    <!-- Przycisk do galerii -->
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

## 📝 KROK 4: Użycie w Shopify Email Editor

### **Jeśli Shopify Email ma drag & drop editor:**

1. **Dodaj blok "Image":**
   - URL obrazka: `{{ customer.metafields.customify.generation_ready.imageUrl }}`
   - Alt text: `Generacja {{ customer.metafields.customify.generation_ready.style }}`

2. **Dodaj blok "Text":**
   - Treść: `Cześć {{ customer.first_name }}, Twoja generacja w stylu {{ customer.metafields.customify.generation_ready.style }} jest gotowa!`

3. **Dodaj blok "Button":**
   - Tekst: `Zobacz wszystkie generacje`
   - Link: `{{ customer.metafields.customify.generation_ready.galleryUrl }}`

4. **Dodaj blok "Text" (rozmiar):**
   - Treść: `Rozmiar: {{ customer.metafields.customify.generation_ready.size }}`

### **Jeśli Shopify Email ma HTML editor:**

1. **Kliknij:** "Edit HTML" lub "Source"
2. **Wklej:** Kod HTML z KROKU 3
3. **Zapisz**

---

## 📝 KROK 5: Zmienne Liquid dostępne w template

### **Dane z metafield `customify.generation_ready`:**

- `{{ customer.metafields.customify.generation_ready.imageUrl }}` - URL obrazka z watermarkiem
- `{{ customer.metafields.customify.generation_ready.style }}` - Styl generacji (np. "pixar", "krol-krolewski")
- `{{ customer.metafields.customify.generation_ready.size }}` - Rozmiar (np. "medium", "large")
- `{{ customer.metafields.customify.generation_ready.productType }}` - Typ produktu (np. "boho", "king", "cats")
- `{{ customer.metafields.customify.generation_ready.galleryUrl }}` - Link do galerii (`https://lumly.pl/pages/my-generations`)
- `{{ customer.metafields.customify.generation_ready.timestamp }}` - Data generacji

### **Inne dostępne zmienne:**

- `{{ customer.first_name }}` - Imię klienta
- `{{ customer.last_name }}` - Nazwisko klienta
- `{{ customer.email }}` - Email klienta
- `{{ shop.name }}` - Nazwa sklepu (Lumly)

---

## 📝 KROK 6: Mapowanie stylów (opcjonalnie)

Jeśli chcesz wyświetlić czytelne nazwy stylów zamiast kodów:

```liquid
{% assign style = customer.metafields.customify.generation_ready.style %}
{% case style %}
  {% when 'pixar' %}
    {% assign styleName = 'Pixar' %}
  {% when 'minimalistyczny' %}
    {% assign styleName = 'Minimalistyczny' %}
  {% when 'realistyczny' %}
    {% assign styleName = 'Realistyczny' %}
  {% when 'krol-krolewski' %}
    {% assign styleName = 'Król - Królewski' %}
  {% when 'krolowa-krolewska' %}
    {% assign styleName = 'Królowa - Królewska' %}
  {% when 'krolewski' %}
    {% assign styleName = 'Królewski' %}
  {% when 'barokowy' %}
    {% assign styleName = 'Barokowy' %}
  {% when 'renesansowy' %}
    {% assign styleName = 'Renesansowy' %}
  {% when 'wiktorianski' %}
    {% assign styleName = 'Wiktoriański' %}
  {% when 'wojenny' %}
    {% assign styleName = 'Wojenny' %}
  {% when 'na-tronie' %}
    {% assign styleName = 'Na tronie' %}
  {% else %}
    {% assign styleName = style %}
{% endcase %}

Twoja generacja w stylu <strong>{{ styleName }}</strong> jest gotowa!
```

---

## 📝 KROK 7: Testowanie template

### **Test w Shopify Email:**

1. **Utwórz test email:**
   - Marketing → Shopify Email → [Twój template] → Send test
   - Wybierz test customer (z metafield `customify.generation_ready`)

2. **Sprawdź:**
   - Czy obrazek się wyświetla
   - Czy link do galerii działa
   - Czy wszystkie zmienne są wypełnione

---

## ⚠️ UWAGI:

### **1. Metafield musi być ustawiony:**
- Kod w `api/_save-generation-core.js` ustawia metafield `customify.generation_ready`
- Sprawdź czy metafield jest ustawiony: Shopify Admin → Customers → [Customer] → Metafields

### **2. Obrazek z Vercel Blob:**
- URL obrazka: `{{ customer.metafields.customify.generation_ready.imageUrl }}`
- Obrazek powinien być dostępny publicznie (testowaliśmy - działa ✅)

### **3. Jeśli metafield nie jest dostępny w template:**
- Sprawdź czy metafield jest typu `json`
- Sprawdź czy namespace i key są poprawne: `customify.generation_ready`

---

## ✅ CHECKLIST:

- [ ] **KROK 1:** Utworzenie template w Shopify Email
- [ ] **KROK 2:** Dodanie HTML lub użycie drag & drop editor
- [ ] **KROK 3:** Użycie zmiennych Liquid z metafield
- [ ] **KROK 4:** Testowanie template
- [ ] **KROK 5:** (Opcjonalnie) Mapowanie stylów na czytelne nazwy

---

**Status:** 📝 Instrukcje gotowe
**Data:** 2025-01-XX
**Autor:** AI Assistant

