# 📋 INSTRUKCJA: Tworzenie Vercel KV

## 🎯 CO TO JEST VERCEL KV?
Vercel KV to baza danych typu key-value (Redis) do przechowywania danych w aplikacjach Vercel.

## 🚀 KROK PO KROKU

### **KROK 1: Wejdź do Vercel Dashboard**
1. Otwórz: https://vercel.com/dashboard
2. Zaloguj się na swoje konto
3. Wybierz projekt: **customify** (lub nazwa Twojego projektu)

### **KROK 2: Przejdź do Storage**
1. W menu po lewej stronie kliknij **"Storage"**
2. Lub przejdź bezpośrednio: https://vercel.com/dashboard/stores

### **KROK 3: Utwórz nowy KV Store**
1. Kliknij przycisk **"Create Database"** lub **"Add"**
2. Wybierz **"KV"** (Redis-compatible)
3. Wpisz nazwę: `customify-kv` (lub dowolną inną)
4. Wybierz region: **Europe (Frankfurt)** lub najbliższy do Ciebie
5. Kliknij **"Create"**

### **KROK 4: Połącz KV Store z projektem**
1. Po utworzeniu KV Store, kliknij **"Connect to Project"**
2. Wybierz projekt: **customify** (lub nazwa Twojego projektu)
3. Kliknij **"Connect"**

### **KROK 5: Skopiuj zmienne środowiskowe**
1. Po połączeniu, Vercel automatycznie doda zmienne środowiskowe do projektu
2. Sprawdź czy są dodane:
   - Przejdź do: **Settings** → **Environment Variables**
   - Powinny być:
     - `KV_REST_API_URL` - URL do KV Store
     - `KV_REST_API_TOKEN` - Token dostępu

### **KROK 6: Weryfikacja**
1. Przejdź do: **Settings** → **Environment Variables**
2. Sprawdź czy widzisz:
   - `KV_REST_API_URL` = `https://...upstash.io`
   - `KV_REST_API_TOKEN` = `...` (długi token)

## ✅ GOTOWE!

Po utworzeniu Vercel KV:
- ✅ Zmienne środowiskowe są automatycznie dodane
- ✅ Endpoint `/api/save-generation` będzie działał
- ✅ Endpoint `/api/test-save-generation` pokaże status

## 🧪 TEST

Po utworzeniu KV, przetestuj:
```
GET https://customify-s56o.vercel.app/api/test-save-generation
```

Powinno zwrócić:
```json
{
  "success": true,
  "tests": {
    "kvConfigured": true,
    "kvTest": "OK",
    "saveGenerationEndpoint": "OK"
  }
}
```

## 💰 KOSZTY

**Vercel KV (Free Tier):**
- 10,000 operacji/dzień
- 256 MB storage
- Wystarczy na start!

**Jeśli przekroczysz limit:**
- Pro: $0.20 za 100,000 operacji
- Storage: $0.25 za GB

## 📝 NOTATKI

- **Vercel KV** to Redis-compatible database
- Dane są przechowywane w regionie, który wybrałeś
- Automatyczne backupy (Vercel zarządza)
- Szybki dostęp (key-value store)

## 🔗 LINKI

- Vercel Storage: https://vercel.com/docs/storage/vercel-kv
- Dashboard: https://vercel.com/dashboard/stores

