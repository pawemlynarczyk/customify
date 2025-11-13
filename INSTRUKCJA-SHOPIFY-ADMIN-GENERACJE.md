# Instrukcja: Jak zobaczyć generacje klienta w Shopify Admin

## 📋 Co zostało zrobione:

1. ✅ **Endpoint**: `/api/setup-customer-generations-metafield` - tworzy Metafield Definition
2. ✅ **Endpoint**: `/api/update-customer-generations` - aktualizuje metafield z generacjami
3. ✅ **Automatyczna aktualizacja**: Po każdej generacji metafield jest automatycznie aktualizowany

## 🚀 Jak to działa:

### Krok 1: Utwórz Metafield Definition (jednorazowo)

1. **Otwórz endpoint**:
   - GET/POST: `https://customify-s56o.vercel.app/api/setup-customer-generations-metafield`
   - Lub użyj curl:
   ```bash
   curl https://customify-s56o.vercel.app/api/setup-customer-generations-metafield
   ```

2. **Endpoint automatycznie**:
   - Sprawdza czy metafield istnieje
   - Jeśli nie istnieje - tworzy go
   - Jeśli istnieje - zwraca informację

### Krok 2: Zobacz generacje w Shopify Admin

1. **Wejdź do Shopify Admin**:
   - Przejdź do: https://admin.shopify.com/store/customify-ok
   - Przejdź do: **Customers** → Wybierz klienta

2. **Znajdź sekcję Metafields**:
   - Przewiń w dół na stronie klienta
   - Znajdź sekcję **"Metafields"** lub **"Custom data"**
   - Powinieneś zobaczyć: **"AI Generations"**

3. **Zobacz generacje**:
   - Kliknij na metafield **"AI Generations"**
   - Zobaczysz JSON z listą generacji
   - Każda generacja zawiera:
     - `imageUrl`: URL obrazka (skopiuj i otwórz w przeglądarce)
     - `style`: Styl AI (np. "pixar", "boho")
     - `date`: Data generacji
     - `purchased`: Status (true/false)
     - `orderId`: ID zamówienia (jeśli kupione)

## 📸 Jak zobaczyć obrazki:

### Metoda 1: Z JSON w Shopify Admin
1. Otwórz metafield **"AI Generations"** w Shopify Admin
2. Znajdź pole `imageUrl` w JSON
3. Skopiuj URL obrazka
4. Otwórz URL w przeglądarce

### Metoda 2: Panel Admin (lepsze rozwiązanie)
1. Otwórz: https://customify-s56o.vercel.app/admin-generations.html
2. Wpisz Customer ID lub Email klienta
3. Kliknij "🔍 Szukaj"
4. Zobacz wszystkie generacje z obrazkami wizualnie

## 🔧 Struktura danych w metafield:

```json
{
  "totalGenerations": 5,
  "purchasedCount": 2,
  "lastGenerationDate": "2025-01-15T10:30:00Z",
  "generations": [
    {
      "id": "gen-1234567890",
      "imageUrl": "https://...",
      "style": "pixar",
      "date": "2025-01-15T10:30:00Z",
      "purchased": false,
      "orderId": null
    },
    {
      "id": "gen-0987654321",
      "imageUrl": "https://...",
      "style": "boho",
      "date": "2025-01-14T15:20:00Z",
      "purchased": true,
      "orderId": "1234567890"
    }
  ]
}
```

## ⚠️ Ograniczenia:

### JSON Metafield w Shopify Admin:
- **Wyświetla tylko tekst JSON** - nie pokazuje obrazków wizualnie
- **Musisz skopiować URL** z pola `imageUrl` i otworzyć w przeglądarce
- **Limit danych**: Metafield może przechowywać max 65,535 znaków (JSON)

### Rozwiązanie:
- **Panel Admin**: Użyj `https://customify-s56o.vercel.app/admin-generations.html` - pokazuje obrazki wizualnie
- **Metafield**: Użyj jako backup/referencja w Shopify Admin

## 🎯 Automatyczna aktualizacja:

### Po każdej generacji AI:
1. Generacja jest zapisywana w Vercel Blob Storage
2. Automatycznie wywoływany jest `/api/update-customer-generations`
3. Metafield w Shopify jest aktualizowany z nową generacją
4. Metafield jest widoczny w Shopify Admin → Customers → [klient] → Metafields

## 📝 Następne kroki:

1. ✅ **Utwórz Metafield Definition**: Wywołaj `/api/setup-customer-generations-metafield`
2. ✅ **Wygeneruj obrazek AI**: Jako zalogowany klient
3. ✅ **Sprawdź w Shopify Admin**: Customers → [klient] → Metafields → "AI Generations"
4. ✅ **Zobacz obrazki**: Użyj panelu admin lub skopiuj URL z JSON

## 🐛 Troubleshooting:

### Problem: Metafield nie jest widoczny w Shopify Admin
- **Sprawdź**: Czy wywołałeś `/api/setup-customer-generations-metafield`
- **Sprawdź**: Czy klient ma generacje (sprawdź w panelu admin)
- **Sprawdź**: Czy metafield został utworzony (sprawdź w odpowiedzi API)

### Problem: Metafield jest pusty
- **Sprawdź**: Czy klient ma generacje w Vercel Blob Storage
- **Sprawdź**: Czy `/api/update-customer-generations` jest wywoływany po generacji
- **Sprawdź**: Logi Vercel dla błędów

### Problem: Nie widzę obrazków w Shopify Admin
- **To normalne**: JSON metafield nie wyświetla obrazków wizualnie
- **Rozwiązanie**: Użyj panelu admin lub skopiuj URL z JSON

## 💡 Alternatywne rozwiązania:

### 1. Shopify App Extension (zaawansowane)
- Stworzenie App Extension dla Shopify Admin
- Wyświetlanie obrazków wizualnie w interfejsie Shopify
- Wymaga większej integracji z Shopify

### 2. Panel Admin (obecne rozwiązanie)
- Strona HTML z galerią obrazków
- Filtrowanie, statystyki, paginacja
- Działa natychmiast, bez dodatkowej integracji

### 3. Metafield JSON (backup)
- Widoczny w Shopify Admin
- Zawiera wszystkie dane
- Wymaga kopiowania URL do przeglądarki

