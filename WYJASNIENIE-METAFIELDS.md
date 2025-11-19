# Wyjaśnienie Metafields w Shopify

## 📋 DWA RÓŻNE METAFIELDS:

### 1. `customify.usage_count` - DO LIMITÓW
**Lokalizacja**: Shopify Admin → Customers → [Klient] → Metafields → **"Usage Count"**

**Format (JSON)**:
```json
{
  "total": 7,
  "boho": 1,
  "king": 2,
  "cats": 3,
  "caricature": 1,
  "watercolor": 0,
  "other": 0
}
```

**Używany przez**:
- `api/transform.js` - sprawdzanie limitów przed generacją
- `api/check-usage.js` - sprawdzanie ile pozostało użyć
- `api/transform.js` - inkrementacja po generacji

**Typ**: `json` (nowy) lub `number_integer` (stary - automatycznie konwertowany)

---

### 2. `customify.ai_generations` - DO HISTORII GENERACJI
**Lokalizacja**: Shopify Admin → Customers → [Klient] → Metafields → **"AI Generations"**

**Format (JSON)**:
```json
{
  "totalGenerations": 7,
  "purchasedCount": 0,
  "lastGenerationDate": "2025-11-17T23:45:40.153Z",
  "generations": [
    {
      "id": "gen-1763423140153-c3ptoi1",
      "imageUrl": "https://...",
      "style": "Transform this image in realistyczny style",
      "date": "2025-11-17T23:45:40.153Z",
      "purchased": false,
      "orderId": null
    }
  ]
}
```

**Używany przez**:
- `api/_save-generation-core.js` - zapis historii generacji
- Panel Admin - wyświetlanie generacji z obrazkami

**Typ**: `json`

---

## ⚠️ PROBLEM: W `usage_count` widzisz format z `ai_generations`

**To oznacza że**:
- Albo patrzysz na zły metafield (sprawdź czy to `usage_count` czy `ai_generations`)
- Albo gdzieś jest błąd i zapisuje do złego metafielda

**Sprawdź w Shopify Admin**:
1. Otwórz: Shopify Admin → Customers → [Twój klient]
2. Scrolluj do sekcji "Metafields"
3. Sprawdź czy są **DWA** metafields:
   - `customify.usage_count` (Usage Count)
   - `customify.ai_generations` (AI Generations)

**Jeśli widzisz tylko jeden metafield** z formatem `totalGenerations`:
- To jest `ai_generations` ✅ (poprawny)
- `usage_count` może nie istnieć jeszcze (zostanie utworzony przy pierwszej generacji)

---

## 🔧 CO POWINNO BYĆ W `usage_count`:

Dla użytkownika z 7 generacjami (1 boho, 2 król, 3 koty, 1 karykatura):

```json
{
  "total": 7,
  "boho": 1,
  "king": 2,
  "cats": 3,
  "caricature": 1,
  "watercolor": 0,
  "other": 0
}
```

**Jeśli widzisz `totalGenerations` w `usage_count`** - to jest BŁĄD i trzeba to naprawić!


