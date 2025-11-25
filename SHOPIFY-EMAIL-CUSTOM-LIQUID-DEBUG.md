# 📧 Kod Liquid z Debugowaniem - Shopify Email

## 🎯 CEL
Kod z debugowaniem żeby zobaczyć co jest w metafield i dlaczego nie działa.

---

## 📝 KROK 1: Kod z debugowaniem (wklej to najpierw)

```liquid
{% comment %} DEBUG VERSION - pokaże co jest w metafield {% endcomment %}

<div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; margin: 20px 0; font-family: monospace; font-size: 12px;">
  <strong>🔍 DEBUG INFO:</strong><br><br>
  
  <strong>1. Metafield exists?</strong><br>
  {% if customer.metafields.customify.generation_ready %}
    ✅ YES
  {% else %}
    ❌ NO
  {% endif %}<br><br>
  
  <strong>2. Customer ID:</strong> {{ customer.id }}<br>
  <strong>3. Customer Name:</strong> {{ customer.first_name }} {{ customer.last_name }}<br>
  <strong>4. Customer Email:</strong> {{ customer.email }}<br><br>
  
  <strong>5. Metafield value (raw):</strong><br>
  {{ customer.metafields.customify.generation_ready | json }}<br><br>
  
  <strong>6. Metafield type:</strong><br>
  {{ customer.metafields.customify.generation_ready.type }}<br><br>
  
  <strong>7. Metafield namespace:</strong><br>
  {{ customer.metafields.customify.generation_ready.namespace }}<br><br>
  
  <strong>8. Metafield key:</strong><br>
  {{ customer.metafields.customify.generation_ready.key }}<br><br>
  
  <strong>9. Metafield value (as string):</strong><br>
  {{ customer.metafields.customify.generation_ready.value }}<br><br>
  
  <strong>10. All customer metafields:</strong><br>
  {% for metafield in customer.metafields %}
    - {{ metafield[0] }}: {{ metafield[1] }}<br>
  {% endfor %}
</div>

{% comment %} GŁÓWNY KOD - będzie działał gdy metafield istnieje {% endcomment %}
{% if customer.metafields.customify.generation_ready %}
  {% assign gen = customer.metafields.customify.generation_ready.value %}
  
  <div style="background: #d4edda; border: 2px solid #28a745; padding: 20px; margin: 20px 0;">
    <strong>✅ METAFIELD ZNALEZIONY!</strong><br>
    Raw value: {{ gen | json }}
  </div>
  
  {% comment %} Spróbuj sparsować JSON {% endcomment %}
  {% if gen contains '{' %}
    <div style="background: #d1ecf1; border: 2px solid #17a2b8; padding: 20px; margin: 20px 0;">
      <strong>📦 JSON DETECTED</strong><br>
      Próbuję sparsować...
    </div>
  {% endif %}
  
  <div style="font-family: Arial, sans-serif; padding: 30px; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 28px;">🎨 Twoja generacja AI jest gotowa!</h1>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
      <p style="font-size: 16px; margin-bottom: 20px;">
        Cześć {% if customer.first_name %}{{ customer.first_name }}{% endif %}! 👋
      </p>
      
      <p style="font-size: 16px; margin-bottom: 20px;">
        Twoja generacja jest gotowa!
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://lumly.pl/pages/my-generations" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
          Zobacz wszystkie generacje →
        </a>
      </div>
    </div>
  </div>
{% else %}
  <div style="background: #f8d7da; border: 2px solid #dc3545; padding: 20px; margin: 20px 0;">
    <strong>❌ METAFIELD NIE ZNALEZIONY</strong><br>
    Metafield <code>customify.generation_ready</code> nie istnieje dla tego customera.<br>
    Sprawdź czy metafield został ustawiony w Shopify Admin → Customers → [Customer] → Metafields
  </div>
{% endif %}
```

---

## 📝 KROK 2: Sprawdź wynik

Po wklejeniu kodu i wysłaniu test emaila, sprawdź:

1. **Czy "Metafield exists?" = YES?**
   - Jeśli NO → metafield nie został ustawiony
   - Sprawdź: Shopify Admin → Customers → [Customer] → Metafields

2. **Co pokazuje "Metafield value (raw)"?**
   - Jeśli pusty → metafield nie ma wartości
   - Jeśli JSON → trzeba sparsować

3. **Co pokazuje "All customer metafields"?**
   - Zobaczysz wszystkie metafields customera
   - Sprawdź czy `customify.generation_ready` jest na liście

---

## 📝 KROK 3: Po debugowaniu - użyj poprawnego kodu

Gdy zobaczysz co jest w metafield, użyj odpowiedniego kodu:

### **Jeśli metafield jest JSON string:**

```liquid
{% assign genJson = customer.metafields.customify.generation_ready.value %}
{% assign gen = genJson | parse_json %}
```

### **Jeśli metafield jest już obiektem:**

```liquid
{% assign gen = customer.metafields.customify.generation_ready.value %}
```

### **Jeśli metafield ma inną strukturę:**

Użyj debug output żeby zobaczyć dokładną strukturę i dostosuj kod.

---

**Status:** 📝 Kod debugowania gotowy
**Data:** 2025-01-XX
**Autor:** AI Assistant

