# Customify - Shopify AI Customization App

Aplikacja Shopify do personalizacji produktów za pomocą sztucznej inteligencji.

## Funkcje

- 🎨 Przekształcanie obrazów za pomocą AI (Replicate)
- 📤 Upload plików z drag & drop
- 🛍️ Tworzenie produktów w Shopify
- 🔐 OAuth autoryzacja Shopify
- 📱 Responsywny interfejs

## Instalacja

1. Sklonuj repozytorium:
```bash
git clone <repository-url>
cd customify
```

2. Zainstaluj zależności:
```bash
npm install
```

3. Skonfiguruj zmienne środowiskowe:
```bash
cp env.example .env
```

4. Edytuj plik `.env` i dodaj swoje klucze API:
```
SHOPIFY_API_KEY=your_client_id_here
SHOPIFY_API_SECRET=your_client_secret_here
SHOP_DOMAIN=your-shop.myshopify.com
REPLICATE_API_TOKEN=your_replicate_token
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000
```

## Uruchomienie

### Tryb deweloperski:
```bash
npm run dev
```

### Tryb produkcyjny:
```bash
npm start
```

Aplikacja będzie dostępna pod adresem: http://localhost:3000

## Konfiguracja Shopify App

1. Utwórz nową aplikację w Shopify Partners Dashboard
2. Skonfiguruj URL autoryzacji: `http://localhost:3000/auth`
3. Skonfiguruj URL przekierowania: `http://localhost:3000/auth/callback`
4. Skopiuj Client ID i Client Secret do pliku `.env`

## Konfiguracja Replicate

1. Zarejestruj się na [Replicate](https://replicate.com)
2. Wygeneruj token API
3. Dodaj token do pliku `.env`

## Struktura projektu

```
customify/
├── public/
│   └── index.html          # Interfejs użytkownika
├── uploads/                # Przesłane pliki (tworzone automatycznie)
├── package.json            # Zależności Node.js
├── server.js              # Główny serwer Express
├── env.example            # Przykład konfiguracji
└── README.md              # Dokumentacja
```

## API Endpoints

- `POST /api/upload` - Upload obrazu
- `POST /api/transform` - Przekształcenie obrazu AI
- `POST /api/products` - Tworzenie produktu
- `GET /auth` - Autoryzacja Shopify
- `GET /auth/callback` - Callback autoryzacji

## Wymagania

- Node.js 16+
- Konto Shopify Partners
- Konto Replicate

## Licencja

MIT
