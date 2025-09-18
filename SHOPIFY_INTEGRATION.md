# 🎨 Customify - Integracja ze sklepem Shopify

## 📋 Co zostało utworzone:

### **1. Pliki integracji:**
- **`public/shopify-embed.html`** - Kompletny komponent do osadzenia
- **`public/shopify-script.js`** - Script do automatycznej integracji
- **`public/shopify-theme-integration.liquid`** - Kod Liquid do motywu

### **2. Funkcjonalności:**
- ✅ **Upload zdjęć** - Drag & drop, wybór plików
- ✅ **AI transformation** - 6 stylów artystycznych
- ✅ **Podgląd** - Przed i po transformacji
- ✅ **Dodawanie do koszyka** - Integracja z Shopify
- ✅ **Responsywny design** - Działa na mobile i desktop

## 🚀 Instrukcje instalacji:

### **Metoda 1: Automatyczna integracja (Zalecana)**

1. **Dodaj script do motywu:**
   ```html
   <script src="https://customify-s56o.vercel.app/shopify-script.js"></script>
   ```

2. **Dodaj do `theme.liquid` w sekcji `</head>`:**
   ```html
   <script src="https://customify-s56o.vercel.app/shopify-script.js"></script>
   ```

3. **Aplikacja automatycznie pojawi się na stronach produktów**

### **Metoda 2: Ręczna integracja z Liquid**

1. **Skopiuj kod z `shopify-theme-integration.liquid`**

2. **Dodaj do `product.liquid` lub `product-template.liquid`** w miejscu gdzie chcesz wyświetlić aplikację

3. **Zapisz i opublikuj motyw**

### **Metoda 3: Iframe (Najprostsza)**

1. **Dodaj do `product.liquid`:**
   ```html
   <div id="customify-app">
     <iframe 
       src="https://customify-s56o.vercel.app/shopify-embed.html" 
       width="100%" 
       height="600" 
       frameborder="0">
     </iframe>
   </div>
   ```

## ⚙️ Konfiguracja:

### **1. Włącz dla konkretnych produktów:**
- **Dodaj tag** `customify-enabled` do produktu
- **Lub zmień typ** produktu na `Custom Product`

### **2. Włącz dla wszystkich produktów:**
- **Ustaw** `customify_enabled = true` w kodzie Liquid

### **3. Dostosuj pozycję:**
- **Przenieś kod** w `product.liquid` w odpowiednie miejsce
- **Dodaj CSS** do zmiany wyglądu

## 🎨 Style AI dostępne:

1. **Van Gogh** - Impresjonistyczny styl
2. **Picasso** - Kubistyczny styl  
3. **Monet** - Akwarelowy styl
4. **Anime** - Styl anime/manga
5. **Cyberpunk** - Futurystyczny styl
6. **Akwarela** - Malarstwo akwarelowe

## 🔧 Dostosowanie:

### **1. Zmiana stylów:**
- **Edytuj** `data-style` w przyciskach stylów
- **Dodaj nowe** style w sekcji `.styles-grid`

### **2. Zmiana cen:**
- **Edytuj** `price: '29.99'` w funkcji `addToCart()`

### **3. Zmiana wyglądu:**
- **Dostosuj CSS** w sekcji `<style>`
- **Zmień kolory** i rozmiary

## 📱 Testowanie:

### **1. Sprawdź na stronie produktu:**
- **Wgraj zdjęcie** - powinno pokazać podgląd
- **Wybierz styl** - przycisk powinien się podświetlić
- **Kliknij transform** - powinno pokazać loading
- **Sprawdź wynik** - powinien pokazać przekształcone zdjęcie

### **2. Sprawdź responsywność:**
- **Mobile** - przyciski w kolumnie
- **Desktop** - przyciski w rzędzie

## 🐛 Rozwiązywanie problemów:

### **1. Aplikacja się nie pokazuje:**
- **Sprawdź** czy jesteś na stronie produktu
- **Sprawdź** czy kod został dodany do motywu
- **Sprawdź** konsolę przeglądarki pod kątem błędów

### **2. Upload nie działa:**
- **Sprawdź** czy plik jest obrazem
- **Sprawdź** czy plik nie jest za duży (max 10MB)

### **3. AI transformation nie działa:**
- **Sprawdź** czy `REPLICATE_API_TOKEN` jest ustawiony
- **Sprawdź** logi w Vercel Functions

## 📞 Wsparcie:

- **Status aplikacji:** https://customify-s56o.vercel.app/status
- **Test funkcji:** https://customify-s56o.vercel.app/test
- **Logi Vercel:** Vercel Dashboard → Functions

## 🎯 Następne kroki:

1. **Zainstaluj** jedną z metod powyżej
2. **Przetestuj** na stronie produktu
3. **Dostosuj** wygląd i funkcjonalności
4. **Skonfiguruj** ceny i produkty
5. **Włącz** dla wybranych produktów

**Aplikacja jest gotowa do użycia!** 🚀
