# Plan: przypomnienie „masz generację” – 3 dni i 7 dni (tylko niekupujący, jedna ostatnia generacja)

## Założenie

- **Źródło adresów:** Tych samych, do których **już teraz** wysyłamy maila „Twój projekt jest gotowy!” – czyli zalogowani użytkownicy z zapisaną generacją w Blob. Adres email mamy w pliku generacji / w Blob.
- **Treść przypomnienia:** Jeden mail z **ostatnią** generacją (jedna miniaturka + CTA), nie osobny mail do każdej generacji.
- **Kiedy:** 3 dni po ostatnim mailu „projekt gotowy” → sprawdzenie czy kupił → jeśli nie, wysyłka. To samo 7 dni po.

---

## 1. Skąd bierzemy listę „do rozważenia”

- **Blob:** `customify/system/stats/generations/` – pliki `customer-{customerId}.json` (tylko customer, bez device – device nie ma pewnego emaila).
- W każdym pliku: `generations[]` (tablica), każda generacja ma m.in.:
  - `date` lub `timestamp` (kiedy utworzono),
  - `watermarkedImageUrl` / `imageUrl`, `style`, `productType`, `email` (często w obiekcie lub na poziomie pliku: `data.email`).
- Na poziomie pliku jest też: `lastGenerationDate`, `email`, `customerId`.
- **Kto dostaje „projekt gotowy”:** Zalogowani (customerId + email) – zapis w `_save-generation-core.js` przy zapisie do Blob i wysyłce Resend. Czyli lista „do przypomnienia” = klienci z plików `customer-*.json`, którzy mają `email` (w pliku lub w ostatniej generacji).

**Wniosek:** Nie trzeba osobno rejestrować „wysłaliśmy projekt gotowy”. Wystarczy: listować Blob `customer-*.json`, dla każdego brać `lastGenerationDate` (albo max z `generations[].date`/`timestamp`) i `email` + `customerId` – to są dokładnie osoby, które dostały maila „projekt gotowy” (przy ostatniej generacji).

---

## 2. Data odniesienia („od kiedy liczymy 3 i 7 dni”)

- **T = data ostatniej generacji** dla tego klienta = `lastGenerationDate` z pliku Blob (albo max z `generations[].date` / `generations[].timestamp`).
- To jest moment, w którym ostatni raz wysłaliśmy „Twój projekt jest gotowy!”.

---

## 3. Logika crona (krok po kroku)

Cron raz dziennie (np. o 10:00):

1. **Listowanie Blob**
   - Prefix: `customify/system/stats/generations/`.
   - Filtruj tylko `customer-*.json` (pominąć `device-*.json` i `email-*.json` jeśli są).

2. **Dla każdego pliku `customer-{customerId}.json`:**
   - Pobierz JSON (fetch po `blob.url`).
   - Wyciągnij: `customerId`, `email` (z `data.email` lub ostatnia generacja z emailem), `lastGenerationDate` (lub max z `generations[].date`/`timestamp`).
   - Jeśli brak `email` – pomiń (nie ma gdzie wysłać).
   - **T** = parsowana data `lastGenerationDate` (lub odpowiednika).
   - **Ostatnia generacja** = `generations[0]` (zakładając, że nowe są na początku) lub sortowanie po dacie i wzięcie najnowszej. Do maila: jedna miniaturka – `watermarkedImageUrl` lub `imageUrl`.

3. **Przypomnienie 3 dni**
   - Warunek: `now >= T + 3 dni` **oraz** jeszcze nie wysłano przypomnienia 3d dla tego klienta (dla tego T).
   - Sprawdź w KV: klucz np. `reminder-3d:customerId`. Wartość: `{ lastGenAt: T }` (ISO string) – „wysłaliśmy 3d dla cyklu z ostatnią generacją T”.
   - Jeśli `reminder-3d:customerId` istnieje i `lastGenAt === T` → już wysłane, pomiń.
   - Jeśli nie ma lub `lastGenAt !== T`: sprawdź w Shopify, czy klient **kupił** (Orders API po `customer_id`, opłacone zamówienie z Customify w `line_items`). Jeśli kupił → pomiń (i opcjonalnie ustaw w KV „nie wysyłać” żeby nie sprawdzać za każdym razem).
   - Jeśli nie kupił: wyślij **jeden** mail przypomnienia z **ostatnią** generacją (jedna grafika + link do Moje generacje). Zapisz w KV: `reminder-3d:customerId` = `{ lastGenAt: T, sentAt: now }` (TTL np. 90 dni).

4. **Przypomnienie 7 dni**
   - Analogicznie: `now >= T + 7 dni` oraz brak wysłanego przypomnienia 7d dla tego T.
   - KV: `reminder-7d:customerId` = `{ lastGenAt: T }`.
   - Sprawdzenie „czy kupił” – to samo co wyżej. Jeśli nie kupił → jeden mail z ostatnią generacją. Zapisz `reminder-7d:customerId` = `{ lastGenAt: T, sentAt: now }`.

5. **Jedna ostatnia generacja w mailu**
   - W treści maila: jedna miniaturka (np. `watermarkedImageUrl` ostatniej generacji), tekst w stylu „Masz niezamówiony projekt – zobacz Moje generacje i dokończ zamówienie”, przycisk do `https://lumly.pl/pages/my-generations`.

---

## 4. Sprawdzenie „czy kupił”

- **API:** `GET /admin/api/2024-01/orders.json?customer_id={customerId}&status=any&limit=250`.
- Dla każdego zamówienia: `financial_status === 'paid'` (lub `partially_paid` jeśli uznajecie) i brak `cancelled_at`.
- W `line_items` szukać produktu Customify: `vendor === 'Customify'` lub `product_type === 'Custom AI Product'` lub tytuł zawiera „Spersonalizowany” (logika z `api/webhooks/orders/paid.js`).
- Jeśli jest choć jedno takie zamówienie → **kupił** → nie wysyłamy przypomnienia (ani 3d, ani 7d).

---

## 5. Przechowywanie „wysłano przypomnienie”

- **Vercel KV** (już używane w projekcie).
- Klucze:
  - `reminder-3d:{customerId}` – wartość JSON: `{ lastGenAt: "<ISO T>", sentAt: "<ISO>" }`, TTL 90 dni.
  - `reminder-7d:{customerId}` – to samo.
- Dzięki `lastGenAt` przy nowej generacji (nowe T) można wysłać przypomnienia 3d/7d jeszcze raz (nowy „cykl”).

---

## 6. Nowa generacja po wysłaniu przypomnienia

- Jeśli klient zrobi nową generację **po** wysłaniu 3d (np. dzień 5), w Blob będzie nowe `lastGenerationDate` = T2.
- Przy następnym uruchomieniu crona: T2 + 3 dni itd., a w KV mamy `reminder-3d:customerId` = { lastGenAt: T }. Ponieważ T2 > T, warunek „nie wysłano 3d dla tego T2” jest spełniony (lastGenAt !== T2), więc można wysłać przypomnienie 3d dla **nowego** cyklu. To jest pożądane: nowa generacja = nowa seria 3d + 7d.

---

## 7. Pliki / endpointy do dodania lub zmiany

| Element | Działanie |
|--------|-----------|
| **Cron** | Nowy endpoint, np. `api/cron/generation-reminder-3-7d.js`, wywoływany z `vercel.json` raz dziennie. |
| **Listowanie Blob** | `list({ prefix: 'customify/system/stats/generations/' })`, filtrowanie po nazwie pliku: tylko `customer-*.json`. |
| **Pobieranie zamówień** | Funkcja pomocnicza (można w shared): `getOrdersForCustomer(customerId)` → zwraca listę zamówień; druga: `customerBoughtCustomify(orders)` → boolean. |
| **Wysyłka maila** | Resend (jak w `_save-generation-core.js`), jeden szablon HTML: „Masz niezamówiony projekt” + jedna miniaturka (ostatnia generacja) + link do Moje generacje. |
| **KV** | Zapis/odczyt `reminder-3d:customerId`, `reminder-7d:customerId` (z wartością jak wyżej). |

---

## 8. Kolejność w cronie (dla jednego klienta)

1. Pobierz Blob → customerId, email, lastGenerationDate, ostatnia generacja (obraz).
2. Jeśli brak emaila → pomiń.
3. T = lastGenerationDate.
4. **3 dni:** jeśli `now >= T+3d` i (brak KV `reminder-3d:customerId` lub `lastGenAt !== T`) → sprawdź czy kupił → jeśli nie, wyślij mail, zapisz KV.
5. **7 dni:** jeśli `now >= T+7d` i (brak KV `reminder-7d:customerId` lub `lastGenAt !== T`) → sprawdź czy kupił → jeśli nie, wyślij mail, zapisz KV.
6. Throttle: np. 600 ms między mailami (jak w check-and-reset-limits), żeby nie przekroczyć limitów Resend.

---

## 9. Podsumowanie

- **Źródło:** Blob `customer-*.json` – ci sami, do których wysyłamy „projekt gotowy”, mamy adres email.
- **3 dni po T:** sprawdź kupno → jeśli nie kupił, jeden mail z **ostatnią** generacją; zapisz „wysłano 3d”.
- **7 dni po T:** to samo, osobny mail i zapis „wysłano 7d”.
- **Zawsze:** jeden mail z jedną ostatnią generacją, nie do każdej generacji osobno.
- **Nowa generacja:** nowe T → nowy cykl 3d/7d (KV po `lastGenAt` to umożliwia).

To jest pełny plan implementacji bez pisania kodu – tylko logika i miejsca w systemie.
