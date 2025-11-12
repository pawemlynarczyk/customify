# Instrukcja: Stworzenie strony "Moje generacje" w Shopify

## 📋 Co zostało zrobione:

1. ✅ **Template strony**: `shopify-theme/customify-theme/templates/page.my-generations.json`
2. ✅ **Section**: `shopify-theme/customify-theme/sections/main-my-generations.liquid`
3. ✅ **Link w headerze**: Dodany link "Moje generacje" w menu konta klienta

## 🚀 Jak utworzyć stronę w Shopify Admin:

### Krok 1: Wejdź do Shopify Admin
1. Przejdź do: https://admin.shopify.com/store/customify-ok
2. Przejdź do: **Online Store** → **Pages**

### Krok 2: Utwórz nową stronę
1. Kliknij **"Add page"**
2. **Title**: `Moje generacje` (lub `My Generations`)
3. **Content**: (możesz zostawić puste)
4. **Template**: Wybierz **"page.my-generations"** z listy templates
5. **Visibility**: 
   - ✅ **Visible** (dla zalogowanych użytkowników)
   - ✅ **Hidden from sitemap** (opcjonalnie)

### Krok 3: Zapisz stronę
1. Kliknij **"Save"**
2. Shopify automatycznie utworzy URL: `/pages/my-generations`

## 🔗 Link w headerze:

Link "Moje generacje" jest już dodany w headerze dla zalogowanych użytkowników:
- Widoczny tylko dla zalogowanych użytkowników
- Prowadzi do `/pages/my-generations`
- Znajduje się w menu konta klienta (obok "Moje konto")

## 📱 Jak działa strona:

1. **Tylko dla zalogowanych**: Strona sprawdza czy użytkownik jest zalogowany
2. **Pobiera generacje**: Automatycznie pobiera generacje z API `/api/get-customer-generations`
3. **Wyświetla galerię**: Pokazuje wszystkie generacje w formie kart z obrazkami
4. **Informacje**: Każda karta pokazuje:
   - Obrazek generacji
   - Styl AI
   - Data generacji
   - Status (Kupione/Nie kupione)

## 🎨 Funkcjonalności:

- ✅ **Responsive design**: Działa na mobile i desktop
- ✅ **Lazy loading**: Obrazki ładują się w tle
- ✅ **Status**: Pokazuje czy generacja została kupiona
- ✅ **Data**: Formatowana data generacji
- ✅ **Styl**: Nazwa stylu AI

## 🔧 Techniczne szczegóły:

- **Template**: `page.my-generations.json`
- **Section**: `main-my-generations.liquid`
- **API**: `/api/get-customer-generations?customerId=...`
- **Authentication**: Wymaga zalogowanego użytkownika (Shopify Customer)

## ✅ Testowanie:

1. **Zaloguj się** jako klient w sklepie
2. **Wygeneruj** kilka obrazków AI
3. **Wejdź** na stronę `/pages/my-generations`
4. **Sprawdź** czy wszystkie generacje są widoczne

## 🐛 Troubleshooting:

### Problem: Strona nie istnieje
- **Rozwiązanie**: Utwórz stronę w Shopify Admin (Krok 2)

### Problem: Nie widzę generacji
- **Sprawdź**: Czy jesteś zalogowany jako klient
- **Sprawdź**: Czy masz generacje w systemie
- **Sprawdź**: Konsolę przeglądarki (F12) - czy są błędy API

### Problem: Błąd API
- **Sprawdź**: Czy endpoint `/api/get-customer-generations` działa
- **Sprawdź**: Czy `customerId` jest poprawny
- **Sprawdź**: Logi Vercel dla błędów

## 📝 Następne kroki:

1. ✅ Utwórz stronę w Shopify Admin
2. ✅ Przetestuj na żywo
3. ✅ Sprawdź czy wszystkie generacje są widoczne
4. ✅ Opcjonalnie: Dodaj filtrowanie/sortowanie

