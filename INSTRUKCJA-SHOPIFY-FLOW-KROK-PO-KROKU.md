# 📧 Instrukcja: Konfiguracja Shopify Flow dla emaili z obrazkiem

## 🎯 CEL
Wysyłać email z obrazkiem (Shopify Email template) zamiast tekstowego (`send_invite`).

---

## ✅ KROK 1: Sprawdź czy metafield jest ustawiany

1. Wygeneruj nową generację AI (jako zalogowany użytkownik)
2. Shopify Admin → **Customers** → [Twój customer] → **Metafields**
3. Sprawdź czy istnieje: `customify.generation_ready`
4. Jeśli NIE istnieje → kod nie działa, sprawdź logi Vercel

---

## ✅ KROK 2: Utwórz Shopify Flow

1. **Shopify Admin** → **Settings** → **Automation** → **Flows**
2. **Create flow** → **Custom**
3. **Nazwa**: "Wysyłanie emaila po generacji AI"

---

## ✅ KROK 3: Ustaw Trigger (Wyzwalacz)

1. **Trigger**: **Customer tags added**
2. **Condition** (warunek):
   - **If** `Customer tags` → `contains` → `generation-ready`

**Uwaga**: Kod automatycznie dodaje tag `generation-ready` do customera po ustawieniu metafield. 
- Jeśli tag **NIE istnieje** → kod dodaje tag (Flow się uruchomi)
- Jeśli tag **już istnieje** → kod najpierw usuwa tag, czeka 500ms, potem dodaje ponownie (Flow się uruchomi za każdym razem)

---

## ✅ KROK 4: Ustaw Action (Akcja)

1. **Action**: **Send email**
2. **Email template**: Wybierz swój template z "Custom Liquid" section
   - Template powinien mieć kod z `SHOPIFY-EMAIL-CUSTOM-LIQUID.md`
3. **Recipient**: `{{ customer.email }}`
4. **Subject**: "Twoja generacja AI jest gotowa! 🎨"
5. **From**: `biuro@lumly.pl` (jeśli dostępne)

---

## ✅ KROK 5: Test

1. Wygeneruj nową generację AI (jako zalogowany użytkownik)
2. Sprawdź czy Flow się uruchomił:
   - Shopify Admin → **Settings** → **Automation** → **Flows** → [Your Flow] → **Activity**
3. Sprawdź czy email przyszedł z obrazkiem (nie tekstowy)

---

## 🔍 DEBUGOWANIE

### Problem: Flow się nie uruchamia
- Sprawdź czy metafield został ustawiony (Shopify Admin → Customers → [Customer] → Metafields)
- Sprawdź czy tag `generation-ready` został dodany (Shopify Admin → Customers → [Customer] → Tags)
- Sprawdź warunki w Flow (czy są poprawne - tag `generation-ready`)
- Sprawdź logi Vercel: 
  - `✅ [SAVE-GENERATION] Tag "generation-ready" usunięty` (jeśli tag istniał)
  - `✅ [SAVE-GENERATION] Tag "generation-ready" dodany` (lub "dodany ponownie")

### Problem: Email przychodzi bez obrazka
- Sprawdź czy template ma kod z `SHOPIFY-EMAIL-CUSTOM-LIQUID.md`
- Sprawdź czy metafield ma `imageUrl` (Shopify Admin → Customers → [Customer] → Metafields)
- Sprawdź czy obrazek z Vercel Blob jest dostępny (otwórz URL w przeglądarce)

### Problem: Email nie przychodzi
- Sprawdź czy Flow jest włączony (Shopify Admin → Flows → [Your Flow] → toggle ON)
- Sprawdź czy Flow ma błędy (Shopify Admin → Flows → [Your Flow] → Activity → errors)

---

## 📝 UWAGI

- **Metafield jest ustawiany automatycznie** - kod już to robi
- **Tag jest usuwany i dodawany w osobnych operacjach** - żeby Flow się uruchomił za każdym razem (nawet jeśli tag już istniał)
- **Flow musi być skonfigurowany ręcznie** - nie da się tego zrobić przez API
- **Template musi mieć kod Liquid** - z `SHOPIFY-EMAIL-CUSTOM-LIQUID.md`
- **Email będzie z obrazkiem** - jeśli wszystko jest skonfigurowane poprawnie

---

**Status:** 📝 Instrukcje gotowe  
**Data:** 2025-01-XX  
**Autor:** AI Assistant

