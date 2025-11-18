# 📊 TABELA KATEGORYZACJI OBRAZÓW - VERCEL BLOB STORAGE

## 🎯 GŁÓWNE KATEGORIE

| Kategoria | Format nazwy pliku | Przykład | Opis |
|-----------|-------------------|----------|------|
| **WYGENEROWANE** | `ai-{numer}.jpg.jpg` | `ai-1763307205175.jpg.jpg` | Obrazy wygenerowane przez AI (wynik transformacji) |
| **WYGENEROWANE** | `generation-{numer}.jpg` | `generation-1763309346114.jpg` | Obrazy z Replicate/Segmind base64 |
| **WYGENEROWANE** | `caricature-{numer}.jpg` | `caricature-1763043791544.jpg` | Karykatury Segmind |
| **WYGENEROWANE** | `watercolor-{numer}.jpg` | `watercolor-1763309346114.jpg` | Obrazy watercolor |
| **UPLOAD** | `image-{numer}.jpg` | `image-1763309346114.jpg` | Oryginalne zdjęcia użytkownika (przed transformacją) |
| **UPLOAD** | `{dowolna-nazwa}.jpg.jpg` (bez `ai-`) | `caricature-1763043791544.jpg.jpg` | Błąd w nazwie uploadu (podwójne rozszerzenie) |
| **ORDERS** | `customify/orders/{nazwa}.jpg` | `customify/orders/Karykatura-karykatura-00363895.jpg` | Obrazy z zamówień |
| **KOSZYKI** | Zawiera `watermark` w ścieżce/nazwie | `customify/temp/watermark-xyz.jpg` | Obrazy z watermarkiem (koszyki) |
| **STATYSTYKI** | `customify/system/stats/generations/*.json` | `customify/system/stats/generations/customer-123.json` | Pliki JSON z historią generacji |

## 🔍 LOGIKA KATEGORYZACJI (kolejność sprawdzania)

### 1. STATYSTYKI (najwyższy priorytet)
- ✅ Pliki JSON z `customify/system/stats/generations/`
- ❌ Inne pliki JSON są ukrywane

### 2. KOSZYKI
- ✅ Zawiera `watermark` w ścieżce LUB nazwie pliku

### 3. ORDERS
- ✅ Prefix `customify/orders/` (bez watermark)

### 4. WYGENEROWANE vs UPLOAD (w `customify/temp/`)

#### WYGENEROWANE (obrazy AI):
- ✅ Zaczyna się od `ai-` (nawet z `.jpg.jpg`)
- ✅ Zaczyna się od `generation-`
- ✅ Zaczyna się od `caricature-`
- ✅ Zaczyna się od `watercolor-`

#### UPLOAD (oryginalne zdjęcia):
- ✅ Zaczyna się od `image-` (domyślna nazwa)
- ✅ Podwójne rozszerzenie `.jpg.jpg` BEZ prefiksu `ai-`

### 5. WYGENEROWANE (poza `temp/`)
- ✅ Zaczyna się od `generation-`, `caricature-`, `ai-`, `watercolor-`

### 6. FALLBACK
- ✅ Wszystko inne → `wygenerowane` (może być obraz AI w innych lokalizacjach)

## 📝 PRZYKŁADY KATEGORYZACJI

| Plik | Kategoria | Powód |
|------|-----------|-------|
| `customify/temp/ai-1763307205175.jpg.jpg` | **WYGENEROWANE** | Zaczyna się od `ai-` |
| `customify/temp/generation-1763309346114.jpg` | **WYGENEROWANE** | Zaczyna się od `generation-` |
| `customify/temp/caricature-1763043791544.jpg` | **WYGENEROWANE** | Zaczyna się od `caricature-` |
| `customify/temp/caricature-1763043791544.jpg.jpg` | **WYGENEROWANE** | Zaczyna się od `caricature-` (nawet z podwójnym rozszerzeniem) |
| `customify/temp/image-1763309346114.jpg` | **UPLOAD** | Zaczyna się od `image-` |
| `customify/temp/xyz-123.jpg.jpg` | **UPLOAD** | Podwójne rozszerzenie bez `ai-` |
| `customify/orders/Karykatura-00363895.jpg` | **ORDERS** | Prefix `customify/orders/` |
| `customify/temp/watermark-xyz.jpg` | **KOSZYKI** | Zawiera `watermark` |
| `customify/system/stats/generations/customer-123.json` | **STATYSTYKI** | JSON z `customify/system/stats/generations/` |

## 🚨 WAŻNE UWAGI

1. **Podwójne rozszerzenie `.jpg.jpg`**:
   - Jeśli zaczyna się od `ai-` → **WYGENEROWANE**
   - Jeśli NIE zaczyna się od `ai-` → **UPLOAD**

2. **Prefiksy AI mają priorytet**:
   - `ai-`, `generation-`, `caricature-`, `watercolor-` → zawsze **WYGENEROWANE**
   - Nawet z podwójnym rozszerzeniem!

3. **Format uploadu**:
   - Domyślna nazwa: `image-{timestamp}.jpg` (z `upload-temp-image.js`)
   - Może mieć podwójne rozszerzenie (błąd w nazwie)

4. **Lokalizacja**:
   - Wszystkie obrazy w `customify/temp/` są sprawdzane według powyższej logiki
   - Obrazy poza `temp/` są kategoryzowane jako **WYGENEROWANE** jeśli mają prefiksy AI

