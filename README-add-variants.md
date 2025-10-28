# Jak dodać warianty rozmiarów do produktu Customify

## 🎯 Cel
Dodanie wariantów rozmiarów (A4, A3, A2, A1) z cenami do głównych produktów Customify, żeby można było edytować ceny w Shopify Admin.

## 🔧 Krok 1: Znajdź Shopify Access Token

1. Otwórz: https://customify-ok.myshopify.com/admin/settings/apps
2. Kliknij "Develop apps"
3. Wybierz aplikację "Customify"
4. W sekcji "API credentials" znajdź "Admin API access token"
5. Skopiuj token (zaczyna się od `shpat_...`)

## 🚀 Krok 2: Uruchom skrypt

```bash
# W terminalu, w katalogu projektu:
SHOPIFY_ACCESS_TOKEN=shpat_twoj_token_tutaj node add-variants.js
```

## 📋 Produkty do aktualizacji

Dodaj warianty do tych produktów:
1. ✅ **personalizowany-portret-w-stylu-boho** (TEST)
2. ⏳ **krol-personalizowany-portret**
3. ⏳ **koty-krolewskie**

## 💰 Obecne ceny (Canvas = Obraz na płótnie)

- A4 (20×30 cm): 49 zł
- A3 (30×40 cm): 99 zł
- A2 (40×60 cm): 149 zł
- A1 (60×85 cm): 199 zł

## 🔄 Alternatywa: Dodaj ręcznie w Shopify Admin

1. Otwórz produkt w Shopify Admin
2. Scrolluj do sekcji "Pricing"
3. Kliknij "Add option" → wybierz "Size" lub "Rozmiar"
4. Dodaj wartości: A4, A3, A2, A1
5. Dla każdego rozmiaru ustaw cenę
6. Zapisz
