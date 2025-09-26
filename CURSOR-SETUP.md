# 🎨 Cursor Setup dla Shopify Development

## 📋 Wymagane rozszerzenia

Zainstaluj te rozszerzenia w Cursor:

### 1. **Shopify Liquid**
- **ID:** `shopify.theme-liquid`
- **Funkcje:** Syntax highlighting, autocomplete, hover info dla Liquid
- **Link:** [Shopify Liquid Extension](https://marketplace.visualstudio.com/items?itemName=shopify.theme-liquid)

### 2. **Shopify Theme Development Tools**
- **ID:** `shopify.theme-check`
- **Funkcje:** Theme validation, auto-fix, performance checks
- **Link:** [Shopify Theme Check](https://marketplace.visualstudio.com/items?itemName=shopify.theme-check)

### 3. **GitLens**
- **ID:** `eamodio.gitlens`
- **Funkcje:** Git integration, blame, history
- **Link:** [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens)

## 🚀 Instalacja

### Metoda 1: Przez Command Palette
1. Otwórz Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Wpisz: `Extensions: Install Extensions`
3. Wyszukaj i zainstaluj każdy z powyższych rozszerzeń

### Metoda 2: Przez plik extensions.json
1. Otwórz Command Palette
2. Wpisz: `Extensions: Show Recommended Extensions`
3. Zainstaluj wszystkie zalecane rozszerzenia

## ⚙️ Konfiguracja

### 1. **Shopify Theme Check**
- Automatycznie waliduje pliki `.liquid`
- Pokazuje błędy i ostrzeżenia
- Auto-fix dla prostych problemów

### 2. **Liquid Support**
- Syntax highlighting dla plików `.liquid`
- Autocomplete dla Shopify objects
- Hover info dla funkcji Liquid

### 3. **Git Integration**
- Git blame w liniach kodu
- Historia zmian
- Porównywanie wersji

## 🎯 Jak używać

### 1. **Edytuj theme.liquid**
- Otwórz `theme.liquid`
- Rozszerzenia automatycznie podświetlą składnię
- Błędy będą podświetlone na czerwono

### 2. **Walidacja**
- Błędy będą widoczne w Problems panel
- Kliknij na błąd aby przejść do linii
- Użyj Quick Fix (`Cmd+.` / `Ctrl+.`)

### 3. **Autocomplete**
- Wpisz `{{` aby zobaczyć dostępne obiekty
- `product.` pokaże dostępne właściwości produktu
- `settings.` pokaże ustawienia motywu

## 🔧 Przydatne skróty

- `Cmd+Shift+P` / `Ctrl+Shift+P` - Command Palette
- `Cmd+.` / `Ctrl+.` - Quick Fix
- `F12` - Go to Definition
- `Shift+F12` - Find All References
- `Cmd+Shift+F` / `Ctrl+Shift+F` - Find in Files

## 📁 Struktura plików

```
customify/
├── .vscode/
│   ├── extensions.json      # Zalecane rozszerzenia
│   └── settings.json        # Ustawienia Cursor
├── .theme-check.yml         # Konfiguracja Theme Check
├── shopify.theme.toml       # Konfiguracja Shopify CLI
├── theme.liquid             # Główny plik motywu
└── public/
    └── shopify-script.js    # Skrypt integracji
```

## 🚀 Następne kroki

1. **Zainstaluj rozszerzenia**
2. **Otwórz `theme.liquid`**
3. **Sprawdź czy syntax highlighting działa**
4. **Edytuj plik i sprawdź walidację**
5. **Skopiuj zmiany do Shopify**

## 💡 Wskazówki

- **Używaj autocomplete** - znacznie przyspiesza kodowanie
- **Sprawdzaj Problems panel** - znajdź błędy przed wdrożeniem
- **Używaj GitLens** - śledź zmiany w kodzie
- **Testuj lokalnie** - używaj Theme Check do walidacji
