# KRYTYCZNE ZASADY CUSTOMIFY - NIGDY NIE ŁAM!

## 🚨 ZASADA #1: NIGDY NIE UKRYWAJ APLIKACJI
- **NIGDY** nie ustawiaj `style="display: none;"` na aplikacji Customify
- Aplikacja MUSI być zawsze widoczna z `style="display: block;"` lub bez tego atrybutu
- Ukrywanie aplikacji powoduje, że użytkownik nie widzi funkcjonalności
- To jest BARDZO FRUSTRUJĄCE dla użytkownika

## 🚨 ZASADA #2: ZAWSZE SPRAWDZAJ WIDOCZNOŚĆ
- Przed każdą zmianą sprawdź czy aplikacja jest widoczna
- Użyj `curl` lub przeglądarki żeby zweryfikować
- Jeśli aplikacja nie jest widoczna - NAPRAW NATYCHMIAST

## 🚨 ZASADA #3: CACHE JEST AGRESYWNY
- Vercel cache: 15-30 minut
- Shopify cache: 15-30 minut  
- Przeglądarka cache: może być godzinami
- Zawsze dodawaj `?v=timestamp` do testów

## 🚨 ZASADA #4: NIE ZMIENIAJ NAZW PLIKÓW BEZ POWODU
- Nie zmieniaj `customify.js` na `customify-v2.js` bez powodu
- To powoduje błędy 404 i wyłącza aplikację
- Używaj tylko gdy naprawdę musisz wymusić cache

## ✅ CO ROBIĆ:
- Zawsze ustawiaj `style="display: block;"` na aplikacji
- Testuj zmiany w przeglądarce
- Commituj zmiany do GitHub
- Wdrażaj na Shopify
- Sprawdzaj czy działa

## ❌ CZEGO NIE ROBIĆ:
- NIE ukrywaj aplikacji (`display: none`)
- NIE zmieniaj nazw plików bez powodu
- NIE ignoruj błędów 404
- NIE zostawiaj aplikacji niewidocznej
