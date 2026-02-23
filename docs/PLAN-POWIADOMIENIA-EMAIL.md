# 📧 Plan powiadomień email – co mamy i co warto dodać

## ✅ Co wysyłamy teraz (aktualny stan)

| Typ | Kiedy | Treść | Plik / trigger |
|-----|--------|--------|------------------|
| **1. Po stworzonej generacji** | Od razu po udanej transformacji AI | "Twój projekt jest gotowy!" – obrazek z watermarkem, link do Moje generacje | `api/_save-generation-core.js` (wywołanie z `transform.js`). Warunek: **zalogowany** + email + obraz. |
| **2. Po doładowaniu kredytów** | Co najmniej 1h po osiągnięciu limitu 4/4 | "Dodaliśmy Ci nowe kredyty – możesz znowu generować!" + link do tworzenia i Moje generacje | Cron `api/check-and-reset-limits` co **20 min**. Wpis w KV: `limit-reached:customerId` (tworzony w `transform.js` gdy limit 4/4). |
| **3. Zamówienie produktu cyfrowego** | Webhook order paid (Shopify) | Mail z linkiem do pobrania produktu cyfrowego | `api/webhooks/orders/paid.js` (dla produktów cyfrowych). |
| **4. Masowa wysyłka (kampanie)** | Ręcznie (POST) | Np. walentynki, promocje – lista odbiorców + template | `api/send-bulk-generation-emails.js`. |

**Nie wysyłamy (albo nie działają):**
- **Formularz kontaktowy** – `api/contact-form.js` tylko loguje, bez wysyłki (jest TODO na Resend).
- **Porzucone koszyki** – w Shopify włączony jest Abandoned Checkout, ale **praktycznie nie działa** (wysłany mail w 1 na ~100 przypadków). Brak własnego flow.
- **Przypomnienie „masz generację, nie kupiłeś”** – brak.

---

## ❌ Czego nie ma (luki)

1. **Porzucone koszyki (abandoned cart)**  
   W Shopify jest włączony Abandoned Checkout, ale **działa słabo (rzędu 1 na 100)**. Własnego automatu nie ma – kto dodał Customify do koszyka i nie dokończył, w praktyce nie dostaje maila.

2. **Przypomnienie po niezakupionej generacji**  
   Klient ma generację w „Moje generacje”, ale nie dodał do koszyka / nie kupił – brak maila po 3 dniach / tygodniu.

3. **Kontakt z formularza**  
   Wiadomość z formularza nie trafia mailem do biura (tylko log).

---

## 🎯 Propozycja: co warto dodać (plan, bez kodu)

### 1. Przypomnienie „Nie kupiłeś – masz gotową generację” (priorytet wysoki)

**Cel:** Osoby z generacją w galerii, które nie kupiły w ciągu X dni – dostały jeden (lub dwa) maile z CTA do Moje generacje / produktu.

**Logika (koncepcyjnie):**
- **Źródło danych:** Vercel Blob – pliki `customer-{customerId}.json` (i opcjonalnie `device-{deviceToken}.json`). Każda generacja ma m.in. `timestamp`, `style`, `productType`, `imageUrl` / `watermarkedImageUrl`.
- **Kogo wybierać:** Tylko **zalogowanych** (mamy customerId + email z Shopify). Dla „device” nie mamy pewnego emaila – można pominąć albo traktować osobno (np. tylko customer).
- **Warunek „nie kupił” (rekomendowane: sprawdzać):** Przed wysłaniem sprawdzić w Shopify, czy ten klient ma **jakiekolwiek opłacone zamówienie z produktem Customify** (Orders API po `customer_id`, filtrowanie `line_items` po vendor/product_type – patrz sekcja „Sprawdzanie kto kupił” poniżej). Jeśli **kupił** → nie wysyłamy. Wysyłamy **tylko do tych, którzy nie kupili**.
- **Kiedy wysyłać:** Np. **3 dni** po najstarszej niezakupionej generacji (albo 7 dni – mniej nachalnie). Jedno przypomnienie; ewentualnie drugie po kolejnym tygodniu (np. 7 + 7 dni).
- **Cron:** Nowy cron (np. raz dziennie) który:  
  - listuje blob-y `customer-*.json`,  
  - dla każdego sprawdza ostatnią generację (lub wszystkie) i daty,  
  - filtruje „starsze niż 3 dni”, „jeszcze nie wysłano przypomnienia”,  
  - wysyła mail przez Resend (template: link do Moje generacje, może 1 obrazek z watermarkem).  
- **Żeby nie spamować:** W Blob lub KV zapisać np. `reminder-sent:customerId` z datą (albo per generacja) i nie wysyłać drugi raz dla tego samego zestawu.

**Szacunek:** Średni nakład – jeden nowy endpoint cron + template maila + zapis „wysłano przypomnienie”.

---

### 2. Porzucone koszyki (abandoned cart) (priorytet średni / wysoki)

**Cel:** Kto dodał produkt Customify do koszyka i nie sfinalizował – po X godzinach (np. 4–24h) dostaje mail „Twój koszyk / Twój portret czeka”.

**Stan:** W Shopify jest włączony Abandoned Checkout, ale **działa w jednym na sto** – w praktyce nie można na nim polegać.

**Rekomendacja: własny flow (cron + Shopify API + Resend)**  
- **Źródło:** Shopify Admin API – lista **abandoned checkouts** (endpoint zwraca checkouts z `email`, `line_items`, `created_at` itd.).  
- **Cron:** np. co 4–6 h: pobrać ostatnie abandoned checkouts (np. ostatnie 24–48 h), odfiltrować tylko te, które mają w `line_items` produkty Customify (vendor / product_type / tytuł).  
- **Mail:** Resend – jeden mail na adres z checkoutu: link do koszyka (Shopify zwraca `abandoned_checkout_url`), krótki tekst w stylu „Zostawiłeś portret w koszyku – dokończ zamówienie”.  
- **Unikanie duplikatów:** W KV zapisać np. `abandoned-email-sent:{checkout_id}` z TTL 7 dni, żeby nie wysyłać drugi raz dla tego samego checkoutu.  
- **Wysyłaj tylko do tych, którzy nie kupili:** Przed wysłaniem sprawdzić w Shopify Orders (po `customer_id` z checkoutu lub po email), czy klient nie ma już **opłaconego zamówienia z Customify** (np. dokończył w międzyczasie). Jeśli kupił → pomiń. Patrz sekcja „Sprawdzanie kto kupił” poniżej.  
- **Efekt:** Pełna kontrola nad tym, kiedy i do kogo leci mail; dostawa przez Resend (tak jak reszta maili), bez polegania na słabym automacie Shopify; zero maili do osób, które już kupiły.

**Uwaga:** Email jest dostępny tylko gdy klient podał go w checkout (np. na stronie przed płatnością). Checkouty bez emaila trzeba pominąć.

**API Shopify:** W Admin API (REST) lista porzuconych checkoutów – endpoint typu `GET /admin/api/2024-01/checkouts.json` (lub aktualna wersja) z parametrami `status=open`, `created_at_min` itd. W odpowiedzi: `email`, `abandoned_checkout_url`, `line_items` (po tym filtrować Customify). Scope: `read_checkouts` (jeśli osobny) lub w ramach `read_orders`. Przed implementacją sprawdzić w dokumentacji Shopify aktualną nazwę zasobu (Checkout vs Abandoned checkout).

---

### 3. Formularz kontaktowy (niski nakład)

**Cel:** Wiadomość z formularza trafia na `biuro@lumly.pl`.

**Sposób:** W `api/contact-form.js` dodać wywołanie Resend (już macie RESEND_API_KEY): jeden mail do `biuro@lumly.pl` z treścią: od kogo (name, email), temat, message. Bez nowych cronów – tylko uzupełnienie istniejącego endpointu.

---

## 📋 Podsumowanie rekomendacji

| Element | Priorytet | Działanie |
|--------|-----------|-----------|
| **Przypomnienie „masz generację, nie kupiłeś” (3–7 dni)** | Wysoki | Nowy cron dzienny: Blob generacje → filtruj starsze niż N dni, wyślij 1× mail „Zobacz Moje generacje”, zapisz „wysłano” (Blob/KV). |
| **Porzucone koszyki** | Średni/wysoki | **Własny flow:** cron (co 4–6 h) + Shopify API abandoned checkouts → filtruj Customify → Resend. Shopify wbudowany działa w ~1/100, więc nie polegać na nim. |
| **Formularz kontaktowy** | Niski | Dokończyć `contact-form.js` – wysyłka przez Resend do biuro@lumly.pl. |

---

## ✅ Sprawdzanie „kto kupił” – tak, można wysyłać tylko do tych, którzy NIE kupili

**Odpowiedź:** Tak – można (i warto) przed wysłaniem maila sprawdzić w Shopify, czy dany klient już coś kupił. Wysyłamy **tylko do tych, którzy nie kupili**.

### Jak sprawdzić w Shopify

- **Źródło:** Shopify Admin API – zamówienia (Orders).
- **Kryterium „kupił Customify”:** Zamówienie ma w `line_items` co najmniej jeden produkt, gdzie:
  - `item.vendor === 'Customify'` **lub**
  - `item.product_type === 'Custom AI Product'` **lub**
  - tytuł zawiera np. „Spersonalizowany”.  
  **W projekcie:** Ta sama logika jest już w `api/webhooks/orders/paid.js` (linie 17–22) – można wyciągnąć do wspólnej funkcji `isCustomifyLineItem(item)` i użyć w cronie.
- **Status zamówienia:** Uwzględniamy tylko opłacone: `financial_status === 'paid'` (lub `partially_paid` jeśli uznajecie). Anulowane (`cancelled_at`) pomijamy.

### Dwa sposoby zapytania

1. **REST:**  
   `GET /admin/api/2024-01/orders.json?customer_id={customerId}&status=any&limit=250`  
   (plus ewentualnie `created_at_min` / `created_at_max`).  
   Dla każdego zwróconego zamówienia: sprawdzić `financial_status` i czy w `line_items` jest produkt Customify (jak wyżej).  
   Jeśli jest choć jedno takie zamówienie → **klient kupił** → nie wysyłamy maila.

2. **GraphQL (Admin API):**  
   Zapytanie `orders` z filtrem `query: "customer_id:123"` (albo po emailu), zwrócić np. `id`, `financialStatus`, `lineItems`. Po stronie aplikacji odfiltrować opłacone i sprawdzić, czy któryś `lineItem` to Customify.  
   Efekt: lista zamówień danego klienta → „kupił” = istnieje opłacone zamówienie z Customify.

### Zastosowanie w flowach

| Flow | Kogo sprawdzamy | Jak |
|------|------------------|-----|
| **Przypomnienie „masz generację, nie kupiłeś”** | Każdy `customerId` z Blob (generacje) | Pobierz zamówienia `?customer_id=...`. Jeśli jest opłacone z Customify → **pomiń** (nie wysyłaj maila). |
| **Abandoned checkout** | Każdy abandoned checkout (mamy `customer_id` jeśli zalogowany, albo `email`) | Przed wysłaniem: jeśli jest `customer_id` → `orders.json?customer_id=...`. Jeśli nie ma customer_id, można po `email` (REST: pobrać ostatnie zamówienia i filtrować po `order.email`, albo GraphQL po email). Jeśli klient ma opłacone zamówienie z Customify **po dacie utworzenia tego checkoutu** → uznajemy „kupił” (np. dokończył później) → **pomiń**. |

**Podsumowanie:** Sprawdzenie „kto kupił” jest możliwe i powinno być w obu automatyzacjach – wtedy maile idą **tylko do tych, którzy naprawdę nie kupili** (nie spamujemy tych, którzy już sfinalizowali zamówienie).

---

## 🔧 Dane techniczne (dla ewentualnej implementacji przypomnienia)

- **Generacje:** Vercel Blob, ścieżki typu `customify/system/stats/generations/customer-{customerId}.json`. Zawartość: tablica obiektów z `timestamp`, `style`, `productType`, `imageUrl`, `watermarkedImageUrl`, `email` itd.
- **Email klienta:** W pliku generacji lub z Shopify GraphQL po `customerId`.
- **Unikanie duplikatów:** Nowy klucz w KV, np. `generation-reminder-sent:customerId` z wartością `{ lastSentAt, generationCount }` i TTL (np. 30 dni), żeby nie wysyłać ponownie za szybko.

Jeśli chcesz, następny krok może być: konkretna specyfikacja (kroki crona, format maila, dokładne warunki) pod wybrany wariant (np. tylko 3 dni, tylko zalogowani, jeden mail).
