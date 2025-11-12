# Instrukcja Krok po Kroku: Generacje w Shopify Admin

## 🎯 Cel: 
Admin ma widzieć generacje AI klienta w Shopify Admin Panel na koncie klienta.

## 📋 Krok 1: Utwórz Metafield Definition (jednorazowo)

### Opcja A: Przez API (automatycznie)
1. Otwórz w przeglądarce:
   ```
   https://customify-s56o.vercel.app/api/setup-customer-generations-metafield
   ```
2. Sprawdź odpowiedź:
   - Jeśli `"success": true` i `"exists": true` → Metafield już istnieje ✅
   - Jeśli `"success": true` i `"created": true` → Metafield został utworzony ✅

### Opcja B: Przez curl (terminal)
```bash
curl https://customify-s56o.vercel.app/api/setup-customer-generations-metafield
```

### Opcja C: Ręcznie w Shopify Admin (alternatywa)
1. Wejdź do: Shopify Admin → Settings → Custom data → Customers
2. Kliknij: "Add definition"
3. Wypełnij:
   - **Name**: `AI Generations`
   - **Namespace and key**: `customify.ai_generations`
   - **Type**: `JSON`
   - **Description**: `Lista generacji AI stworzonych przez klienta`
4. Kliknij: "Save"

## 📋 Krok 2: Wygeneruj obrazek AI (test)

1. **Zaloguj się** jako klient w sklepie
2. **Wybierz produkt** (np. "Personalizowany portret w stylu Boho")
3. **Wgraj zdjęcie** i wybierz styl
4. **Wygeneruj obrazek** AI
5. **Sprawdź logi**: Powinien być log `✅ [SAVE-GENERATION] Customer Metafield zaktualizowany`

## 📋 Krok 3: Zobacz generacje w Shopify Admin

1. **Wejdź do Shopify Admin**:
   - URL: https://admin.shopify.com/store/customify-ok
   - Przejdź do: **Customers**

2. **Wybierz klienta**:
   - Znajdź klienta, który wygenerował obrazek AI
   - Kliknij na klienta

3. **Znajdź sekcję Metafields**:
   - Przewiń w dół na stronie klienta
   - Znajdź sekcję **"Metafields"** lub **"Custom data"**
   - Powinieneś zobaczyć: **"AI Generations"**

4. **Zobacz generacje**:
   - Kliknij na metafield **"AI Generations"**
   - Zobaczysz JSON z listą generacji:
     ```json
     {
       "totalGenerations": 1,
       "purchasedCount": 0,
       "lastGenerationDate": "2025-01-15T10:30:00Z",
       "generations": [
         {
           "id": "gen-1234567890",
           "imageUrl": "https://...",
           "style": "pixar",
           "date": "2025-01-15T10:30:00Z",
           "purchased": false,
           "orderId": null
         }
       ]
     }
     ```

5. **Zobacz obrazek**:
   - Skopiuj URL z pola `imageUrl`
   - Otwórz URL w przeglądarce
   - Zobaczysz obrazek AI

## ⚠️ Ważne uwagi:

### JSON Metafield w Shopify Admin:
- **Wyświetla tylko tekst JSON** - nie pokazuje obrazków wizualnie
- **Musisz skopiować URL** z pola `imageUrl` i otworzyć w przeglądarce
- **To jest normalne** - Shopify Admin nie wyświetla obrazków w JSON metafield

### Alternatywa - Panel Admin (lepsze rozwiązanie):
- **Panel Admin**: https://customify-s56o.vercel.app/admin-generations.html
- **Pokazuje obrazki wizualnie** - galeria z obrazkami
- **Filtrowanie**: Po Customer ID, Email, Status
- **Statystyki**: Liczba generacji, kupione/nie kupione

## 🔧 Troubleshooting:

### Problem: Metafield nie jest widoczny w Shopify Admin
**Rozwiązanie**:
1. Sprawdź czy wywołałeś `/api/setup-customer-generations-metafield`
2. Sprawdź odpowiedź API - czy metafield został utworzony
3. Odśwież stronę klienta w Shopify Admin (Ctrl+F5)
4. Sprawdź czy klient ma generacje (sprawdź w panelu admin)

### Problem: Metafield jest pusty
**Rozwiązanie**:
1. Sprawdź czy klient ma generacje w Vercel Blob Storage
2. Sprawdź czy `/api/update-customer-generations` jest wywoływany po generacji
3. Sprawdź logi Vercel dla błędów
4. Sprawdź czy `customerId` jest poprawny

### Problem: Nie widzę obrazków w Shopify Admin
**To normalne**:
- JSON metafield nie wyświetla obrazków wizualnie
- Musisz skopiować URL z pola `imageUrl` i otworzyć w przeglądarce
- **Lepsze rozwiązanie**: Użyj panelu admin (pokazuje obrazki wizualnie)

## ✅ Podsumowanie:

### Co admin zobaczy w Shopify Admin:
1. **Metafield "AI Generations"** w sekcji Metafields na stronie klienta
2. **JSON z listą generacji** - każda generacja zawiera:
   - `imageUrl`: URL obrazka (skopiuj i otwórz w przeglądarce)
   - `style`: Styl AI
   - `date`: Data generacji
   - `purchased`: Status (true/false)
   - `orderId`: ID zamówienia (jeśli kupione)

### Co admin NIE zobaczy w Shopify Admin:
- **Obrazków wizualnie** - tylko JSON z URL
- **Galeria obrazków** - tylko tekst JSON

### Lepsze rozwiązanie dla admina:
- **Panel Admin**: https://customify-s56o.vercel.app/admin-generations.html
- **Pokazuje obrazki wizualnie** - galeria z obrazkami
- **Filtrowanie, statystyki, paginacja**

## 🚀 Następne kroki:

1. ✅ **Utwórz Metafield Definition**: Wywołaj `/api/setup-customer-generations-metafield`
2. ✅ **Wygeneruj obrazek AI**: Jako zalogowany klient
3. ✅ **Sprawdź w Shopify Admin**: Customers → [klient] → Metafields → "AI Generations"
4. ✅ **Zobacz obrazki**: Użyj panelu admin lub skopiuj URL z JSON

