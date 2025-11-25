# 📧 Kod Liquid dla Shopify Email - Custom Liquid Section

## 🎯 CEL
Kod do wklejenia w sekcji "Custom Liquid" w Shopify Email drag & drop editorze.

---

## 📝 KROK 1: Dodaj sekcję "Custom Liquid"

1. **W Shopify Email editorze:**
   - Kliknij: `Add section` lub `+`
   - Wybierz: `Custom Liquid`
   - Kliknij: `Edit` lub `Customize`

2. **Wklej kod poniżej** do edytora Custom Liquid

---

## 📝 KROK 2: Kod Liquid do wklejenia

```liquid
{% comment %}
  Custom Liquid section dla emaila z generacją AI
  Używa metafield: customify.generation_ready (JSON)
{% endcomment %}

{% if customer.metafields.customify.generation_ready %}
  {% assign generation = customer.metafields.customify.generation_ready.value | default: customer.metafields.customify.generation_ready %}
  
  {% comment %} Parsuj JSON jeśli to string {% endcomment %}
  {% if generation contains '{' %}
    {% assign genData = generation | parse_json %}
  {% else %}
    {% assign genData = generation %}
  {% endif %}
  
  {% comment %} Mapuj style na czytelne nazwy {% endcomment %}
  {% assign style = genData.style | default: genData['style'] %}
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
  
  {% assign imageUrl = genData.imageUrl | default: genData['imageUrl'] %}
  {% assign size = genData.size | default: genData['size'] %}
  {% assign galleryUrl = genData.galleryUrl | default: 'https://lumly.pl/pages/my-generations' %}
  
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 28px;">🎨 Twoja generacja AI jest gotowa!</h1>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
      <p style="font-size: 16px; margin-bottom: 20px;">
        Cześć {% if customer.first_name %}{{ customer.first_name }}{% else %}Kliencie{% endif %}, 👋
      </p>
      
      <p style="font-size: 16px; margin-bottom: 20px;">
        Twoja generacja w stylu <strong>{{ styleName }}</strong> jest gotowa! Sprawdź efekt poniżej:
      </p>
      
      {% if imageUrl %}
      <div style="text-align: center; margin: 30px 0;">
        <img 
          src="{{ imageUrl }}" 
          alt="Generacja {{ styleName }}" 
          style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
        />
      </div>
      {% endif %}
      
      {% if size %}
      <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
        <strong>Rozmiar:</strong> {{ size }}
      </p>
      {% endif %}
      
      <div style="text-align: center; margin: 30px 0;">
        <a 
          href="{{ galleryUrl }}" 
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
  </div>
{% else %}
  {% comment %} Fallback jeśli metafield nie istnieje {% endcomment %}
  <div style="padding: 20px; text-align: center; color: #666;">
    <p>Twoja generacja AI jest gotowa!</p>
    <p><a href="https://lumly.pl/pages/my-generations">Zobacz wszystkie generacje →</a></p>
  </div>
{% endif %}
```

---

## 📝 KROK 3: Uproszczona wersja (jeśli powyższa nie działa)

Jeśli metafield JSON nie parsuje się poprawnie, użyj tej wersji:

```liquid
{% comment %}
  Uproszczona wersja - bezpośredni dostęp do metafield
{% endcomment %}

{% assign generation = customer.metafields.customify.generation_ready %}

{% if generation %}
  <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #667eea; text-align: center;">🎨 Twoja generacja AI jest gotowa!</h2>
    
    <p>Cześć {% if customer.first_name %}{{ customer.first_name }}{% endif %}!</p>
    
    {% comment %} Spróbuj wyciągnąć dane z JSON {% endcomment %}
    {% assign genJson = generation | json %}
    
    <p>Twoja generacja jest gotowa! Sprawdź efekt:</p>
    
    <div style="text-align: center; margin: 20px 0;">
      <a 
        href="https://lumly.pl/pages/my-generations" 
        style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;"
      >
        Zobacz wszystkie generacje →
      </a>
    </div>
  </div>
{% endif %}
```

---

## 📝 KROK 4: Debugowanie (jeśli nie działa)

Dodaj debug output żeby zobaczyć co jest w metafield:

```liquid
{% comment %} DEBUG - usuń po testach {% endcomment %}
<div style="background: #f0f0f0; padding: 10px; margin: 10px 0; font-size: 12px;">
  <strong>DEBUG:</strong><br>
  Metafield exists: {% if customer.metafields.customify.generation_ready %}YES{% else %}NO{% endif %}<br>
  Metafield value: {{ customer.metafields.customify.generation_ready | json }}<br>
  Customer ID: {{ customer.id }}<br>
  Customer name: {{ customer.first_name }}
</div>
```

---

## ⚠️ UWAGI:

1. **Metafield musi być typu JSON** - sprawdź w Shopify Admin → Customers → [Customer] → Metafields
2. **Liquid może nie mieć `parse_json`** - wtedy użyj wersji uproszczonej
3. **Testuj z rzeczywistym customer** - który ma ustawiony metafield `customify.generation_ready`

---

## ✅ CHECKLIST:

- [ ] **KROK 1:** Dodaj sekcję "Custom Liquid" w Shopify Email
- [ ] **KROK 2:** Wklej kod Liquid (pierwsza wersja)
- [ ] **KROK 3:** Testuj z customer który ma metafield
- [ ] **KROK 4:** Jeśli nie działa - użyj wersji uproszczonej lub dodaj debug

---

**Status:** 📝 Kod gotowy do wklejenia
**Data:** 2025-01-XX
**Autor:** AI Assistant

