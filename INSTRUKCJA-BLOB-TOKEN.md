# 🔑 INSTRUKCJA: Konfiguracja customify_READ_WRITE_TOKEN

## 🎯 CO TO JEST?
`customify_READ_WRITE_TOKEN` to token do Vercel Blob Storage, który pozwala aplikacji zapisywać i odczytywać pliki (obrazy i JSON z generacjami).

## ✅ SPRAWDŹ CZY MASZ TOKEN

### **Test 1: Endpoint testowy**
```
GET https://customify-s56o.vercel.app/api/test-save-generation
```

**Jeśli widzisz:**
```json
{
  "tests": {
    "blobConfigured": true,
    "blobTest": "OK"
  }
}
```
✅ **Token jest skonfigurowany!**

**Jeśli widzisz:**
```json
{
  "tests": {
    "blobConfigured": false,
    "blobTest": null
  },
  "message": "Vercel Blob Storage NIE jest skonfigurowany"
}
```
❌ **Token NIE jest skonfigurowany - musisz go dodać**

---

## 🚀 JAK DODAĆ TOKEN (KROK PO KROKU)

### **KROK 1: Utwórz Vercel Blob Store (jeśli nie masz)**
1. Przejdź do: https://vercel.com/dashboard
2. Wybierz projekt: **customify**
3. Przejdź do: **Storage** → **Blob**
4. Jeśli nie masz Blob Store:
   - Kliknij **"Create Database"** lub **"Add"**
   - Wybierz **"Blob"**
   - Nazwa: `customify-blob` (lub dowolna)
   - Region: **Europe (Frankfurt)** lub najbliższy
   - Kliknij **"Create"**

### **KROK 2: Połącz Blob Store z projektem**
1. Po utworzeniu Blob Store, kliknij **"Connect to Project"**
2. Wybierz projekt: **customify**
3. Kliknij **"Connect"**

### **KROK 3: Skopiuj token**
1. Po połączeniu, Vercel automatycznie doda zmienne środowiskowe
2. **ALE** - musimy użyć **własnej nazwy**: `customify_READ_WRITE_TOKEN`
3. Przejdź do: **Storage** → **Blob** → Twój Blob Store
4. Kliknij **"Settings"** lub **"..."** → **"View Token"**
5. Skopiuj token (wygląda jak: `vercel_blob_rw_...`)

### **KROK 4: Dodaj token jako Environment Variable**
1. Przejdź do: **Settings** → **Environment Variables**
2. Kliknij **"Add New"**
3. Wpisz:
   - **Name**: `customify_READ_WRITE_TOKEN`
   - **Value**: Wklej skopiowany token
   - **Environment**: Zaznacz wszystkie (Production, Preview, Development)
4. Kliknij **"Save"**

### **KROK 5: Redeploy**
1. Po dodaniu zmiennej, przejdź do: **Deployments**
2. Kliknij **"..."** na najnowszym deployment
3. Wybierz **"Redeploy"**
4. Lub: Push nowy commit do GitHub (Vercel automatycznie zredeployuje)

---

## ✅ WERYFIKACJA

### **Test 1: Endpoint testowy**
```
GET https://customify-s56o.vercel.app/api/test-save-generation
```

Powinno zwrócić:
```json
{
  "success": true,
  "tests": {
    "blobConfigured": true,
    "blobTest": "OK"
  },
  "message": "Vercel Blob Storage jest skonfigurowany i działa"
}
```

### **Test 2: Sprawdź w Vercel Dashboard**
1. Przejdź do: **Settings** → **Environment Variables**
2. Sprawdź czy widzisz: `customify_READ_WRITE_TOKEN` = `vercel_blob_rw_...`

---

## ⚠️ WAŻNE UWAGI

1. **Nazwa zmiennej**: Musi być dokładnie `customify_READ_WRITE_TOKEN` (nie `BLOB_READ_WRITE_TOKEN` ani inna)
2. **Token format**: Zaczyna się od `vercel_blob_rw_...`
3. **Redeploy**: Po dodaniu zmiennej **ZAWSZE** zrób redeploy, żeby zmiany weszły w życie
4. **Environment**: Zaznacz wszystkie środowiska (Production, Preview, Development)

---

## 🔍 GDZIE TOKEN JEST UŻYWANY?

Token jest używany w:
- ✅ `/api/upload-temp-image` - upload obrazów
- ✅ `/api/save-generation` - zapis generacji AI
- ✅ `/api/products.js` - backup obrazów produktów
- ✅ `/api/get-customer-generations` - odczyt generacji

---

## ❌ PROBLEMY?

### **Problem: Token nie działa**
1. Sprawdź czy token jest poprawny (skopiowany w całości)
2. Sprawdź czy nazwa zmiennej jest dokładnie `customify_READ_WRITE_TOKEN`
3. Sprawdź czy zrobiłeś redeploy po dodaniu zmiennej

### **Problem: "Vercel Blob Storage not configured"**
1. Sprawdź czy token jest w Environment Variables
2. Sprawdź czy zrobiłeś redeploy
3. Sprawdź logi w Vercel Dashboard → Functions → `save-generation`

---

## 📝 NOTATKI

- Token jest **wymagany** dla wszystkich funkcji związanych z Vercel Blob Storage
- Bez tokena generacje **NIE będą zapisywane** (ale aplikacja nadal działa)
- Token jest **bezpieczny** - tylko do odczytu/zapisu w Twoim Blob Store

