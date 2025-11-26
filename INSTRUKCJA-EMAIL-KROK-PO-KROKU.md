# 📧 Instrukcja: Co zrobić z emailem - KROK PO KROKU

## 🎯 SITUACJA OBECNA

✅ **Kod już jest naprawiony** - metafield `generation_ready` jest ustawiany  
❌ **Email nie wysyła się automatycznie** - `send_invite` jest wyłączony

---

## 🎯 CO MASZ DO WYBORU:

### **OPCJA 1: Włączyć z powrotem `send_invite` (SZYBKO, ale BEZ OBRAZKA)**

**Co to daje:**
- ✅ Email wysyła się automatycznie
- ✅ Działa od razu (bez konfiguracji)
- ❌ Tylko tekst (bez obrazka w mailu)
- ❌ Link do obrazka w tekście (nie wizualnie)

**Co zrobić:**
1. Otwórz plik `api/_save-generation-core.js`
2. Znajdź linię `// ⚠️ WYŁĄCZONE: send_invite`
3. Usuń komentarze `/*` i `*/` wokół kodu `send_invite` (linie ~516-560)
4. Zapisz i wdróż (`git push`)

**Efekt:** Email będzie wysyłany automatycznie, ale bez obrazka (tylko link tekstowy).

---

### **OPCJA 2: Użyć Shopify Flow (LEPIEJ, z OBRAZKIEM)**

**Co to daje:**
- ✅ Email z obrazkiem (HTML template)
- ✅ Profesjonalny wygląd
- ✅ Obrazek widoczny bezpośrednio w mailu
- ❌ Wymaga konfiguracji Shopify Flow (5-10 minut)

**Co zrobić:**

#### **KROK 1: Sprawdź czy metafield jest ustawiany**

1. Wygeneruj nową generację AI (jako zalogowany użytkownik)
2. Shopify Admin → **Customers** → [Twój customer] → **Metafields**
3. Sprawdź czy istnieje: `customify.generation_ready`
4. Jeśli NIE istnieje → kod nie działa, sprawdź logi Vercel

#### **KROK 2: Utwórz Shopify Flow**

1. **Shopify Admin** → **Settings** → **Automation** → **Flows**
2. **Create flow** → **Custom**
3. **Nazwa**: "Wysyłanie emaila po generacji AI"

#### **KROK 3: Ustaw Trigger (Wyzwalacz)**

1. **Trigger**: **Customer updated**
2. **Condition** (warunek):
   - **If** `Customer metafield` → `customify.generation_ready` → `is not empty`
   - **And** `Customer metafield` → `customify.generation_ready` → `was changed`

#### **KROK 4: Ustaw Action (Akcja)**

1. **Action**: **Send email**
2. **Email template**: Wybierz swój template z "Custom Liquid" section
3. **Recipient**: `{{ customer.email }}`
4. **Subject**: "Twoja generacja AI jest gotowa! 🎨"

#### **KROK 5: Test**

1. Wygeneruj nową generację AI
2. Sprawdź czy Flow się uruchomił (Shopify Admin → Flows → [Your Flow] → Activity)
3. Sprawdź czy email przyszedł z obrazkiem

---

## 🎯 REKOMENDACJA

**Jeśli chcesz szybko:** OPCJA 1 (włącz `send_invite`)  
**Jeśli chcesz profesjonalnie:** OPCJA 2 (Shopify Flow)

---

## ❓ CO Z KODEM W CUSTOM LIQUID?

**NIE MUSISZ ZMIENIAĆ** kodu w Custom Liquid - już jest gotowy!

Kod w `SHOPIFY-EMAIL-CUSTOM-LIQUID.md` jest poprawny - używa:
```liquid
{{ customer.metafields.customify.generation_ready.value }}
```

**Problem był:** Metafield nie istniał (kod go nie ustawiał).  
**Teraz:** Metafield jest ustawiany, więc template będzie działał.

---

## 📝 PODSUMOWANIE

1. ✅ **Kod już naprawiony** - metafield jest ustawiany
2. ✅ **Template już gotowy** - Custom Liquid kod jest poprawny
3. ⚠️ **Teraz wybierz:** OPCJA 1 (szybko) lub OPCJA 2 (profesjonalnie)

---

**Status:** 📝 Instrukcje gotowe  
**Data:** 2025-01-XX  
**Autor:** AI Assistant

