# 📧 Instrukcja: Konfiguracja Shopify Flow dla emaili z obrazkiem

## 🎯 CEL
Wysyłać email z obrazkiem (Shopify Email template) zamiast tekstowego (`send_invite`).

---

## ✅ CHECKLIST - Co musisz zrobić:

- [ ] **KROK 1:** Sprawdź czy metafield jest ustawiany (po generacji)
- [ ] **KROK 2:** Utwórz Shopify Flow workflow
- [ ] **KROK 3:** Ustaw trigger "Customer tags added" z warunkiem `generation-ready`
- [ ] **KROK 4:** Utwórz Shopify Email template z kodem Liquid
- [ ] **KROK 5:** Dodaj akcję "Send email" w Flow i wybierz template
- [ ] **KROK 6:** Zapisz i włącz workflow
- [ ] **KROK 7:** Przetestuj generację i sprawdź czy email przyszedł

**Czas:** ~15-20 minut

---

## ✅ KROK 1: Sprawdź czy metafield jest ustawiany

1. Wygeneruj nową generację AI (jako zalogowany użytkownik)
2. Shopify Admin → **Customers** → [Twój customer] → **Metafields**
3. Sprawdź czy istnieje: `customify.generation_ready`
4. Jeśli NIE istnieje → kod nie działa, sprawdź logi Vercel

---

## ✅ KROK 2: Utwórz Shopify Flow

### **2.1: Wejdź do Shopify Flow**
1. **Shopify Admin** (https://admin.shopify.com)
2. W lewym menu kliknij: **Settings** (Ustawienia)
3. W ustawieniach kliknij: **Automation** (Automatyzacja)
4. Kliknij: **Flows** (lub **Shopify Flow**)

### **2.2: Utwórz nowy workflow**
1. Kliknij przycisk: **Create flow** (Utwórz workflow)
2. Wybierz: **Custom** (Niestandardowy) - NIE wybieraj gotowych szablonów
3. W polu **Workflow name** (Nazwa workflow) wpisz: `Wysyłanie emaila po generacji AI`
4. Kliknij: **Create workflow** (Utwórz workflow)

---

## ✅ KROK 3: Ustaw Trigger (Wyzwalacz)

### **3.1: Dodaj trigger**
1. W edytorze workflow zobaczysz sekcję: **Trigger** (Wyzwalacz)
2. Kliknij: **Add trigger** (Dodaj wyzwalacz) lub **Select trigger** (Wybierz wyzwalacz)
3. W wyszukiwarce wpisz: `Customer tags added` lub przewiń listę i znajdź: **Customer tags added**
4. Kliknij: **Customer tags added** (Dodano tagi klienta)

### **3.2: Ustaw warunek (Condition)**
1. Po dodaniu triggera zobaczysz sekcję: **Condition** (Warunek)
2. Kliknij: **Add condition** (Dodaj warunek) lub **If** (Jeśli)
3. W pierwszym polu wybierz: **Customer tags** (Tagi klienta)
4. W drugim polu wybierz: **contains** (zawiera)
5. W trzecim polu (wartość) wpisz dokładnie: `generation-ready` (bez cudzysłowów, małe litery, z myślnikiem)
6. Kliknij: **Save** (Zapisz) lub **Done** (Gotowe)

**Uwaga**: Kod automatycznie dodaje tag `generation-ready` do customera po ustawieniu metafield. 
- Jeśli tag **NIE istnieje** → kod dodaje tag (Flow się uruchomi)
- Jeśli tag **już istnieje** → kod najpierw usuwa tag, czeka 500ms, potem dodaje ponownie (Flow się uruchomi za każdym razem)

---

## ✅ KROK 4: Utwórz Shopify Email Template (PRZED dodaniem akcji)

### **4.1: Utwórz template w Shopify Email**
1. **Shopify Admin** → **Marketing** → **Shopify Email**
2. Kliknij: **Create email** (Utwórz email)
3. Wybierz: **Blank template** (Pusty szablon) lub **Custom template** (Niestandardowy szablon)
4. W edytorze drag & drop kliknij: **Add section** (Dodaj sekcję) lub **+**
5. Przewiń listę sekcji i znajdź: **Custom Liquid**
6. Kliknij: **Custom Liquid** (dodaje sekcję do emaila)
7. Kliknij na sekcję **Custom Liquid** → **Edit** (Edytuj) lub **Customize** (Dostosuj)
8. **Wklej kod z pliku `SHOPIFY-EMAIL-CUSTOM-LIQUID.md`** (cały kod Liquid)
9. Kliknij: **Save** (Zapisz)
10. W prawym górnym rogu kliknij: **Save** (Zapisz template)
11. **Zapisz nazwę template** (np. "Generacja AI gotowa") - będziesz jej potrzebować w Flow

### **4.2: Dodaj akcję "Send email" w Flow**
1. Wróć do Shopify Flow (Settings → Automation → Flows → [Twój workflow])
2. W sekcji **Actions** (Akcje) kliknij: **Add action** (Dodaj akcję) lub **+**
3. W wyszukiwarce wpisz: `Send email` lub znajdź: **Send email** (Wyślij email)
4. Kliknij: **Send email**

### **4.3: Skonfiguruj akcję "Send email"**
1. **Email template** (Szablon emaila):
   - Kliknij dropdown i wybierz template utworzony w kroku 4.1 (np. "Generacja AI gotowa")
   - Jeśli nie widzisz template → sprawdź czy zapisałeś go w Shopify Email
2. **Recipient** (Odbiorca):
   - Kliknij pole i wybierz: **Customer email** (Email klienta)
   - LUB wpisz ręcznie: `{{ customer.email }}`
3. **Subject** (Temat):
   - Wpisz: `Twoja generacja AI jest gotowa! 🎨`
4. **From** (Od):
   - Jeśli dostępne, wybierz: `biuro@lumly.pl`
   - Jeśli nie ma opcji → zostaw domyślne (Shopify wyśle z domyślnego adresu)
5. Kliknij: **Save** (Zapisz) lub **Done** (Gotowe)

### **4.4: Zapisz i włącz workflow**
1. W prawym górnym rogu kliknij: **Save** (Zapisz workflow)
2. Upewnij się, że workflow jest **włączony** (toggle ON w prawym górnym rogu)
3. Jeśli workflow jest wyłączony (szary) → kliknij toggle żeby go włączyć (zielony)

---

## ✅ KROK 5: Test

### **5.1: Wygeneruj nową generację**
1. Wejdź na stronę produktu (np. https://lumly.pl/products/personalizowany-portret-w-stylu-boho)
2. **Zaloguj się** jako użytkownik (musisz być zalogowany!)
3. Wgraj zdjęcie i wybierz styl
4. Kliknij: **Zobacz podgląd** lub **Generuj**
5. Poczekaj aż generacja się zakończy

### **5.2: Sprawdź czy Flow się uruchomił**
1. **Shopify Admin** → **Settings** → **Automation** → **Flows**
2. Kliknij na workflow: **Wysyłanie emaila po generacji AI**
3. Kliknij zakładkę: **Activity** (Aktywność) lub **Runs** (Uruchomienia)
4. Powinieneś zobaczyć wpis z datą/czasem ostatniej generacji
5. Jeśli widzisz wpis → Flow zadziałał ✅
6. Jeśli NIE widzisz wpisu → Flow się nie uruchomił ❌ (sprawdź debugowanie poniżej)

### **5.3: Sprawdź czy email przyszedł**
1. Sprawdź skrzynkę email: `pawel.mlynarczyk@internetcapital.pl` (lub email użytkownika który generował)
2. Szukaj emaila z tematem: **"Twoja generacja AI jest gotowa! 🎨"**
3. Otwórz email i sprawdź:
   - ✅ Czy jest obrazek (nie tylko link)
   - ✅ Czy jest przycisk "Zobacz wszystkie generacje"
   - ✅ Czy jest tekst o stylu generacji
4. Jeśli email nie przyszedł → sprawdź debugowanie poniżej

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

