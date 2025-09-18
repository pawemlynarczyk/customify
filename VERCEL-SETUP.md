# Vercel Setup Instructions

## 1. Environment Variables Setup

### Krok 1: Idź do Vercel Dashboard
- Otwórz https://vercel.com/dashboard
- Wybierz swój projekt `customify`

### Krok 2: Dodaj Environment Variables
- Kliknij **Settings** > **Environment Variables**
- Dodaj każdą zmienną osobno:

```
Name: SHOPIFY_API_KEY
Value: b55e6ae3386a566f74df4db5d1d11ee6
Environment: Production, Preview, Development

Name: SHOPIFY_API_SECRET  
Value: 40e832d641a2ac8c6a2acf1945a34436
Environment: Production, Preview, Development

Name: SHOP_DOMAIN
Value: customiffyy.myshopify.com
Environment: Production, Preview, Development

Name: SHOPIFY_ACCESS_TOKEN
Value: your_access_token_here
Environment: Production, Preview, Development

Name: REPLICATE_API_TOKEN
Value: leave_empty_for_now
Environment: Production, Preview, Development

Name: NODE_ENV
Value: production
Environment: Production, Preview, Development

Name: APP_URL
Value: https://customify-s56o.vercel.app
Environment: Production, Preview, Development
```

### Krok 3: Zaktualizuj APP_URL
- Po wdrożeniu, skopiuj Twój Vercel URL
- Zaktualizuj `APP_URL` w Environment Variables
- Przykład: `https://customify-abc123.vercel.app`

## 2. Redeploy
- Po dodaniu zmiennych, kliknij **Redeploy**
- Lub push nowy commit do GitHub

## 3. Test
- Otwórz Twój Vercel URL
- Sprawdź czy aplikacja działa bez błędów EROFS
