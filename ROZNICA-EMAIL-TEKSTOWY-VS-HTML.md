# 📧 Różnica: Email tekstowy vs HTML z obrazkiem

## 🎯 OBECNA SYTUACJA (send_invite)

**Co mamy teraz:**
- ✅ Email wysyła się automatycznie
- ✅ Zawiera link do obrazka
- ❌ **Obrazek NIE jest widoczny w mailu** (tylko link tekstowy)
- ❌ Email jest tekstowy (nie HTML)

**Przykład emaila:**
```
Cześć!

Twoja generacja w stylu Pixar jest gotowa! 🎨

Obrazek: https://vzwqqb14qtsxe2wx.public.blob.vercel-storage.com/...

Zobacz wszystkie generacje: https://lumly.pl/pages/my-generations
```

**Problem:** Użytkownik musi kliknąć link żeby zobaczyć obrazek.

---

## 🎯 CO CHCEMY (Shopify Email template)

**Co chcemy mieć:**
- ✅ Email wysyła się automatycznie
- ✅ **Obrazek jest widoczny bezpośrednio w mailu** (nie trzeba klikać)
- ✅ Profesjonalny wygląd (HTML)
- ✅ Obrazek z watermarkiem widoczny od razu

**Przykład emaila:**
```
🎨 Twoja generacja AI jest gotowa!

[OBRAZEK WIDOCZNY TUTAJ - nie trzeba klikać]

Zobacz wszystkie generacje →
```

**Korzyść:** Użytkownik widzi obrazek od razu, bez klikania.

---

## 🔧 ROZWIĄZANIE: Shopify Flow + Shopify Email Template

### **KROK 1: Metafield już jest ustawiany** ✅

Kod już ustawia metafield `customify.generation_ready` z:
- `imageUrl` (obrazek z watermarkiem)
- `style` (nazwa stylu)
- `size` (rozmiar)
- `galleryUrl` (link do galerii)

### **KROK 2: Shopify Email Template już jest gotowy** ✅

Kod w `SHOPIFY-EMAIL-CUSTOM-LIQUID.md` już wyświetla obrazek:
```liquid
<img src="{{ customer.metafields.customify.generation_ready.value.imageUrl }}" />
```

### **KROK 3: Trzeba utworzyć Shopify Flow** ⚠️

Shopify Flow wyśle email z template (z obrazkiem).

**Instrukcja:**
1. Shopify Admin → Settings → Automation → Flows
2. Create flow → Custom
3. Trigger: Customer updated
4. Condition: `customify.generation_ready` is not empty
5. Action: Send email → wybierz template z Custom Liquid

---

## 📊 PORÓWNANIE

| Funkcja | send_invite (obecne) | Shopify Email template (chcemy) |
|---------|---------------------|--------------------------------|
| Wysyłanie | ✅ Automatyczne | ✅ Automatyczne (przez Flow) |
| Obrazek widoczny | ❌ Tylko link | ✅ Tak, bezpośrednio w mailu |
| Format | Tekstowy | HTML |
| Profesjonalny wygląd | ❌ Podstawowy | ✅ Profesjonalny |
| Konfiguracja | ✅ Już działa | ⚠️ Wymaga Flow (5 min) |

---

## 🎯 CO ZROBIĆ?

**OPCJA A: Zostaw jak jest (send_invite)**
- Działa od razu
- Tylko link tekstowy (bez obrazka wizualnie)

**OPCJA B: Użyj Shopify Flow (z obrazkiem)**
- Obrazek widoczny w mailu
- Wymaga konfiguracji Flow (5-10 minut)
- Profesjonalny wygląd

---

**Status:** 📝 Wyjaśnienie gotowe  
**Data:** 2025-01-XX  
**Autor:** AI Assistant


