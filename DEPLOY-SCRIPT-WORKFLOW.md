# DEPLOY SCRIPT WORKFLOW - JAK DZIAŁA WDRAŻANIE ZMIAN DO SHOPIFY

## 🚀 Komenda: `npm run deploy`
- **Plik**: `deploy-optimized-theme.js`
- **Funkcja**: Wdraża zmiany z lokalnych plików do Shopify theme

## 📁 STRUKTURA PLIKÓW:
```
theme.liquid                           ← GŁÓWNY PLIK (edytuj tylko ten!)
├── shopify-theme/customify-theme/assets/
│   ├── customify.js                   ← BACKUP (synchronizowany automatycznie)
│   ├── customify.css                  ← BACKUP (synchronizowany automatycznie)
│   └── base.css                       ← BACKUP (synchronizowany automatycznie)
└── public/
    ├── customify.js                   ← PLIK LOKALNY (edytuj tutaj!)
    └── customify.css                  ← PLIK LOKALNY (edytuj tutaj!)
```

## 🔄 PROCES WDRAŻANIA:
1. **SYNCHRONIZACJA**: `sync-theme-files.js` kopiuje `theme.liquid` do wszystkich plików backup
2. **KOPIOWANIE**: Deploy script używa plików z `shopify-theme/customify-theme/assets/` (NIE z `public/`)
3. **WDROŻENIE**: Wysyła pliki do Shopify API (theme, CSS, JS)
4. **POTWIERDZENIE**: Sprawdza czy wszystkie pliki zostały wdrożone

## ⚠️ KRYTYCZNE UWAGI:
- **EDYTUJ TYLKO**: `public/customify.js` i `public/customify.css`
- **PRZED DEPLOY**: Zawsze skopiuj `public/customify.js` do `shopify-theme/customify-theme/assets/customify.js`
- **KOMENDA KOPIOWANIA**: `cp public/customify.js shopify-theme/customify-theme/assets/customify.js`
- **NIE EDYTUJ**: Plików w `shopify-theme/customify-theme/assets/` bezpośrednio
- **CACHE**: Shopify może potrzebować 5-15 minut na odświeżenie cache

## 🛠️ WORKFLOW:
1. Edytuj `public/customify.js`
2. Skopiuj: `cp public/customify.js shopify-theme/customify-theme/assets/customify.js`
3. Deploy: `npm run deploy`
4. Test: Sprawdź na https://lumly.pl/products/custom?v=timestamp

## 🚨 PROBLEM ZNALEZIONY DZISIAJ:
**Problem**: Deploy script używa `shopify-theme/customify-theme/assets/customify.js` zamiast `public/customify.js`!

**Rozwiązanie**: Zawsze kopiuj plik przed deployem:
```bash
cp public/customify.js shopify-theme/customify-theme/assets/customify.js
npm run deploy
```

## 📊 ROZMIARY PLIKÓW (przykład):
- **Przed kopiowaniem**: 81556 znaków
- **Po kopiowaniu**: 83714 znaków (więcej logów debugowania)
- **Różnica**: +2158 znaków (nowe logi zostały dodane)

## ✅ POTWIERDZENIE WDROŻENIA:
```
📁 Wczytano customify.js: 83714 znaków
✅ JavaScript wdrożony pomyślnie!
🎉 Wszystkie pliki wdrożone pomyślnie!
```

## 🔍 DEBUGGING:
- **Sprawdź czy kod jest na serwerze**: `curl -s "https://lumly.pl/cdn/shop/t/18/assets/customify.js" | grep "Checking selectedSize"`
- **Wymuś cache refresh**: Dodaj `?v=timestamp` do URL
- **Sprawdź logi**: Otwórz konsolę przeglądarki (F12)
