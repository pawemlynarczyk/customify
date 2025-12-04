# ⚡ QUICK REFERENCE - Szybkie zmiany w emailach Shopify

## 🎯 Jeśli chcesz zmienić TYLKO konkretne linijki (nie cały kod)

---

## ✅ EMAIL AKTYWACYJNY - Zmiana przycisku

### **Znajdź linię (około 60-70):**
```liquid
<td class="button__cell"><a href="{{ customer.account_activation_url }}" class="button__text">Activate your account</a></td>
```

### **ZAMIEŃ NA:**
```liquid
<td class="button__cell"><a href="{{ customer.account_activation_url }}?return_to=/pages/my-generations" class="button__text">Aktywuj konto i zobacz generacje</a></td>
```

---

## ✅ EMAIL WELCOME - Zmiana głównego przycisku

### **Znajdź linię (około 68):**
```liquid
<td class="button__cell"><a href="{{ shop.url }}" class="button__text">Visit our store</a></td>
```

### **ZAMIEŃ NA - Opcja A (do generacji):**
```liquid
<td class="button__cell"><a href="{{ shop.url }}/pages/my-generations" class="button__text">Zobacz moje generacje AI</a></td>
```

### **ZAMIEŃ NA - Opcja B (do konta):**
```liquid
<td class="button__cell"><a href="{{ shop.url }}/account" class="button__text">Przejdź do mojego konta</a></td>
```

---

## ✅ EMAIL WELCOME - Zmiana tekstów na polski

### **Znajdź górę pliku (linia 1-2):**
```liquid
{% capture email_title %}Welcome to {{ shop.name }}!{% endcapture %}
{% capture email_body %}You've activated your customer account. Next time you shop with us, log in for faster checkout.{% endcapture %}
```

### **ZAMIEŃ NA:**
```liquid
{% capture email_title %}Witamy w {{ shop.name }}!{% endcapture %}
{% capture email_body %}Twoje konto zostało aktywowane. Zaloguj się aby zobaczyć swoje generacje AI i zarządzać zamówieniami.{% endcapture %}
```

---

## ✅ EMAIL WELCOME - Zmiana języka w HTML

### **Znajdź (linia 4):**
```html
<html lang="en">
```

### **ZAMIEŃ NA:**
```html
<html lang="pl">
```

---

## ✅ EMAIL WELCOME - Zmiana footera na polski

### **Znajdź (około linia 90):**
```liquid
<p class="disclaimer__subtext">If you have any questions, reply to this email or contact us at <a href="mailto:{{ shop.email }}">{{ shop.email }}</a></p>
```

### **ZAMIEŃ NA:**
```liquid
<p class="disclaimer__subtext">Jeśli masz pytania, odpowiedz na ten email lub skontaktuj się z nami: <a href="mailto:{{ shop.email }}">{{ shop.email }}</a></p>
```

---

## 🎯 NAJSZYBSZA ZMIANA - TYLKO LINK AKTYWACYJNY

Jeśli chcesz TYLKO zmienić przekierowanie (bez zmiany tekstu):

### **W Email Aktywacyjnym:**

**Znajdź:**
```liquid
{{ customer.account_activation_url }}
```

**ZAMIEŃ NA:**
```liquid
{{ customer.account_activation_url }}?return_to=/pages/my-generations
```

**To wszystko!** 🎉

---

## 📊 GDZIE JEST CO?

| Element | Email Type | Przybliżona linia | Co zmienić |
|---------|------------|-------------------|------------|
| **Tytuł emaila** | Wszystkie | 1-2 | `{% capture email_title %}` |
| **Treść emaila** | Wszystkie | 2-3 | `{% capture email_body %}` |
| **Język** | Wszystkie | 4 | `<html lang="en">` |
| **Przycisk aktywacji** | Activation | 60-70 | `customer.account_activation_url` |
| **Przycisk główny** | Welcome | 68 | `{{ shop.url }}` |
| **Footer** | Wszystkie | 90 | `If you have any questions` |

---

## ⚡ SUPER SZYBKA IMPLEMENTACJA (1 minuta)

**Dla Email Aktywacyjny:**

1. Shopify Admin → Settings → Notifications → "Customer account activation" → "Edit code"
2. Ctrl+F: `customer.account_activation_url`
3. Zamień: `{{ customer.account_activation_url }}` na `{{ customer.account_activation_url }}?return_to=/pages/my-generations`
4. Save ✅

**Gotowe!** Użytkownik trafi do generacji po aktywacji.

---

## 🔧 DODATKOWE OPCJE PRZEKIEROWANIA

Możesz przekierować do różnych stron:

| URL | Gdzie przekieruje |
|-----|-------------------|
| `/pages/my-generations` | Moje Generacje (POLECANE) |
| `/account` | Konto użytkownika |
| `/collections/all` | Wszystkie produkty |
| `/collections/nowosci` | Kolekcja nowości |
| `/products/custom` | Konkretny produkt |

**Przykład:**
```liquid
{{ customer.account_activation_url }}?return_to=/account
```

---

**Status:** ⚡ Quick reference gotowy  
**Data:** 2025-12-03  
**Autor:** AI Assistant

