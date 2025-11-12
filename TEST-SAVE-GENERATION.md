# 🧪 TEST: Zapis Generacji AI w Vercel Blob Storage

## 📋 PRZEGLĄD
Test sprawdza czy generacje AI są poprawnie zapisywane w Vercel Blob Storage z powiązaniem do klienta.

---

## ✅ TEST 1: Sprawdź konfigurację

### **Krok 1: Test endpoint testowy**
```
GET https://customify-s56o.vercel.app/api/test-save-generation
```

### **Oczekiwany wynik:**
```json
{
  "success": true,
  "tests": {
    "blobConfigured": true,
    "blobTest": "OK",
    "saveGenerationEndpoint": "OK"
  },
  "message": "Vercel Blob Storage jest skonfigurowany i działa"
}
```

### **Jeśli błąd:**
- Sprawdź czy `customify_READ_WRITE_TOKEN` jest skonfigurowany w Vercel Dashboard
- Przejdź do: **Settings** → **Environment Variables**
- Dodaj: `customify_READ_WRITE_TOKEN` = token z Vercel Dashboard → Storage → Blob

---

## ✅ TEST 2: Test zapisu generacji (ręcznie)

### **Krok 1: Wywołaj endpoint zapisu**
```bash
curl -X POST https://customify-s56o.vercel.app/api/save-generation \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "123456789",
    "email": "test@example.com",
    "imageUrl": "https://example.com/image.jpg",
    "style": "pixar",
    "productType": "other"
  }'
```

### **Oczekiwany wynik:**
```json
{
  "success": true,
  "generationId": "gen-1234567890-abc123",
  "blobPath": "customify/generations/customer-123456789.json",
  "totalGenerations": 1,
  "message": "Generation saved successfully"
}
```

### **Krok 2: Sprawdź czy plik został zapisany**
1. Przejdź do: **Vercel Dashboard** → **Storage** → **Blob**
2. Sprawdź czy istnieje plik: `customify/generations/customer-123456789.json`
3. Pobierz plik i sprawdź zawartość (powinien zawierać JSON z generacją)

---

## ✅ TEST 3: Test pełnego flow (generacja AI)

### **Krok 1: Zaloguj się na https://lumly.pl**
- Użyj konta testowego lub utwórz nowe

### **Krok 2: Wejdź na stronę produktu**
- Przejdź do: https://lumly.pl/products/personalizowany-portret-w-stylu-boho
- Lub: https://lumly.pl/products/koty-krolewskie

### **Krok 3: Wygeneruj obraz AI**
1. Wgraj zdjęcie
2. Wybierz styl (np. "Pixar" lub "Minimalistyczny")
3. Kliknij "Zobacz Podgląd"
4. Poczekaj na generację (30-60 sekund)

### **Krok 4: Sprawdź logi w Vercel Dashboard**
1. Przejdź do: **Vercel Dashboard** → **Deployments** → **Functions**
2. Sprawdź logi `transform`:
   - Powinien być log: `💾 [TRANSFORM] Zapisuję generację w Vercel KV dla klienta...`
   - Powinien być log: `✅ [TRANSFORM] Generacja zapisana w Vercel KV: gen-...`
3. Sprawdź logi `save-generation`:
   - Powinien być log: `📝 [SAVE-GENERATION] Blob Path: customify/generations/...`
   - Powinien być log: `✅ [SAVE-GENERATION] Saved to Blob: https://...`

### **Krok 5: Sprawdź czy plik został zapisany**
1. Przejdź do: **Vercel Dashboard** → **Storage** → **Blob**
2. Sprawdź czy istnieje plik: `customify/generations/customer-{ID}.json` lub `customify/generations/email-{EMAIL}.json`
3. Pobierz plik i sprawdź zawartość (powinien zawierać JSON z generacją)

---

## ✅ TEST 4: Test dla niezalogowanych użytkowników

### **Krok 1: Wyloguj się z https://lumly.pl**
- Upewnij się, że jesteś niezalogowany

### **Krok 2: Wejdź na stronę produktu**
- Przejdź do: https://lumly.pl/products/personalizowany-portret-w-stylu-boho

### **Krok 3: Wygeneruj obraz AI**
1. Wgraj zdjęcie
2. Wybierz styl
3. Kliknij "Zobacz Podgląd"
4. Poczekaj na generację

### **Krok 4: Sprawdź czy plik został zapisany**
1. Przejdź do: **Vercel Dashboard** → **Storage** → **Blob**
2. Sprawdź czy istnieje plik: `customify/generations/email-{EMAIL}.json` lub `customify/generations/ip-{IP}.json`
3. Pobierz plik i sprawdź zawartość

---

## ✅ TEST 5: Test wielu generacji dla jednego klienta

### **Krok 1: Wygeneruj kilka obrazów AI**
1. Zaloguj się na https://lumly.pl
2. Wygeneruj 3-5 obrazów AI (różne style)
3. Poczekaj na każdą generację

### **Krok 2: Sprawdź czy wszystkie generacje są zapisane**
1. Przejdź do: **Vercel Dashboard** → **Storage** → **Blob**
2. Pobierz plik: `customify/generations/customer-{ID}.json`
3. Sprawdź czy `totalGenerations` = 3-5
4. Sprawdź czy `generations` zawiera wszystkie generacje

---

## 🔍 DEBUGOWANIE

### **Problem: Plik nie został zapisany**
1. Sprawdź logi w Vercel Dashboard → Functions → `save-generation`
2. Sprawdź czy `customify_READ_WRITE_TOKEN` jest skonfigurowany
3. Sprawdź czy endpoint zwraca błąd (sprawdź response)

### **Problem: Błąd zapisu**
1. Sprawdź logi w Vercel Dashboard → Functions → `save-generation`
2. Sprawdź czy błąd jest związany z Vercel Blob Storage
3. Sprawdź czy token ma odpowiednie uprawnienia

### **Problem: Generacja nie jest zapisywana**
1. Sprawdź logi w Vercel Dashboard → Functions → `transform`
2. Sprawdź czy endpoint `save-generation` jest wywoływany
3. Sprawdź czy `customerId` lub `email` jest przekazywany do API

---

## 📊 SPRAWDZENIE WYNIKÓW

### **Gdzie sprawdzić dane:**
1. **Vercel Dashboard** → **Storage** → **Blob** → `customify/generations/`
2. **Vercel Dashboard** → **Functions** → Logi `save-generation`
3. **Vercel Dashboard** → **Functions** → Logi `transform`

### **Co sprawdzić:**
1. Czy plik JSON został utworzony
2. Czy zawiera wszystkie generacje
3. Czy `totalGenerations` jest poprawne
4. Czy `imageUrl` jest poprawny (URL z Vercel Blob)
5. Czy `style` i `productType` są poprawne

---

## ✅ PODSUMOWANIE

Po wykonaniu wszystkich testów powinieneś mieć:
- ✅ Endpoint testowy działa
- ✅ Zapis generacji działa (ręcznie)
- ✅ Pełny flow działa (generacja AI → zapis)
- ✅ Zapis działa dla niezalogowanych
- ✅ Wiele generacji jest zapisywanych poprawnie
- ✅ Pliki JSON są dostępne w Vercel Blob Storage

---

## 🚀 NASTĘPNE KROKI

Po pomyślnym teście:
1. **Faza 2**: Endpoint `/api/get-customer-generations` - pobieranie generacji
2. **Faza 3**: Webhook `orders/paid` - aktualizacja flagi `purchased`

