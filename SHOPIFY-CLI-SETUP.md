# 🚀 Shopify CLI Setup - Krok po kroku

## ✅ **Krok 1: Shopify CLI zainstalowany**
```bash
shopify version
# Output: 3.85.2
```

## 🔐 **Krok 2: Pobierz Access Token**

### **Opcja A: Z Shopify Admin**
1. Idź do **Shopify Admin** → **Apps** → **App and sales channel settings**
2. Znajdź aplikację **Customify**
3. Skopiuj **Access Token** (zaczyna się od `shpat_...`)

### **Opcja B: Z aplikacji Customify**
1. Idź do: https://customify-s56o.vercel.app/api/status
2. Skopiuj token z sekcji "Access Token"

## 📥 **Krok 3: Pobierz motyw**

### **Automatycznie:**
```bash
cd /Users/main/Desktop/customify/shopify-theme
node download-theme-direct.js
```

### **Ręcznie:**
1. Otwórz `download-theme-direct.js`
2. Wklej swój token w linii 8:
   ```javascript
   const accessToken = 'your_shopify_token_here';
   ```
3. Uruchom: `node download-theme-direct.js`

## 🎯 **Krok 4: Otwórz w Cursor**

```bash
cd /Users/main/Desktop/customify/shopify-theme/customify-theme
cursor .
```

## 🔧 **Krok 5: Zainstaluj rozszerzenia Cursor**

1. **Shopify Liquid** - `shopify.theme-liquid`
2. **Liquid** - `sissel.shopify-liquid`
3. **GitLens** - `eamodio.gitlens`

## ✏️ **Krok 6: Edytuj motyw**

1. Otwórz `layout/theme.liquid`
2. Wprowadź zmiany
3. Zapisz plik

## 🚀 **Krok 7: Wdróż zmiany**

```bash
# Z katalogu shopify-theme
node upload-theme.js customify-theme/layout/theme.liquid
```

## 🔄 **Workflow development**

### **1. Pobierz najnowszy motyw:**
```bash
node download-theme-direct.js
```

### **2. Edytuj w Cursor:**
- Otwórz pliki w Cursor
- Wprowadź zmiany
- Zapisz

### **3. Wdróż zmiany:**
```bash
node upload-theme.js customify-theme/layout/theme.liquid
```

## 🛠️ **Przydatne skrypty**

### **Pobierz motyw:**
```bash
node download-theme-direct.js
```

### **Wdróż plik:**
```bash
node upload-theme.js customify-theme/layout/theme.liquid
```

### **Wdróż wszystkie pliki:**
```bash
# Stwórz skrypt do wdrożenia wszystkich plików
find customify-theme -name "*.liquid" -exec node upload-theme.js {} \;
```

## 🎨 **Konfiguracja Cursor**

### **Ustawienia (.vscode/settings.json):**
```json
{
  "liquid.format.enable": true,
  "liquid.validate": true,
  "emmet.includeLanguages": {
    "liquid": "html"
  },
  "files.associations": {
    "*.liquid": "liquid"
  }
}
```

## 🚨 **Rozwiązywanie problemów**

### **Problem: "Failed to fetch themes"**
- Sprawdź czy token jest poprawny
- Sprawdź czy sklep istnieje

### **Problem: "Main theme not found"**
- Sprawdź czy sklep ma aktywny motyw
- Sprawdź uprawnienia tokenu

### **Problem: "Upload failed"**
- Sprawdź czy plik istnieje
- Sprawdź uprawnienia tokenu (`write_themes`)

## 📋 **Checklist**

- [ ] Shopify CLI zainstalowany
- [ ] Access token pobrany
- [ ] Motyw pobrany lokalnie
- [ ] Cursor otwarty z motywem
- [ ] Rozszerzenia zainstalowane
- [ ] Pierwsza zmiana wdrożona

## 🎉 **Gotowe!**

Teraz możesz:
- ✅ Edytować motyw w Cursor
- ✅ Wdrażać zmiany automatycznie
- ✅ Używać autocomplete i walidacji
- ✅ Śledzić zmiany w Git
