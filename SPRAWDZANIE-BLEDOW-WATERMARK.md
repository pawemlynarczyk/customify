# 🔍 Jak Sprawdzić Błędy watermarkedImageUrl w Vercel

## 🎯 Problem
Chcesz sprawdzić ile razy pojawił się błąd: **"Brak backend watermarkedImageUrl - nie można dodać do koszyka!"**

## ⚠️ WAŻNE - Gdzie Szukać

### **Frontend (Przeglądarka) - NIE W LOGACH VERCEL!**
Błąd `❌ [CUSTOMIFY] Brak backend watermarkedImageUrl - nie można dodać do koszyka!` jest logowany przez `console.error()` w przeglądarce użytkownika, więc **NIE pojawi się w logach Vercel backend**.

**Gdzie szukać:**
- ✅ **Sentry Dashboard** (gdy dodamy tracking - poniżej)
- ✅ **Browser Console** użytkowników (DevTools)
- ✅ **Sentry Browser SDK** (już skonfigurowane)

### **Backend (Vercel) - Możliwe Przyczyny**
Błędy które **MOGĄ** być w logach Vercel i powodować brak watermarkedImageUrl:

1. **Błąd aplikowania watermarku:**
   ```
   ❌ [TRANSFORM] Watermark application failed:
   ```

2. **Błąd uploadu do Vercel Blob:**
   ```
   ❌ [TRANSFORM] Błąd uploadu base64 do Vercel Blob (SDK):
   ❌ [TRANSFORM] Błąd uploadu do Vercel Blob (SDK):
   ```

3. **Błąd transformacji AI:**
   ```
   AI transformation error:
   ```

## 🔍 METODA 1: Sprawdź Logi Vercel (Backend)

### **KROK 1: Pobierz logi z ostatnich 24h**

```bash
vercel logs customify-s56o.vercel.app --since 24h > vercel-logs.txt
```

### **KROK 2: Filtruj błędy związane z watermarkiem**

```bash
# Błędy aplikowania watermarku
grep -E "Watermark application failed|Watermark is required but failed" vercel-logs.txt

# Błędy uploadu do Vercel Blob
grep -E "Błąd uploadu.*Vercel Blob|upload.*failed" vercel-logs.txt

# Błędy transformacji (które mogą powodować brak watermarku)
grep -E "AI transformation error|transform_failed" vercel-logs.txt
```

### **KROK 3: Sprawdź szczegóły błędów**

```bash
# Pełne konteksty błędów watermarku
grep -B 5 -A 10 "Watermark application failed" vercel-logs.txt

# Błędy uploadu z kontekstem
grep -B 5 -A 10 "Błąd uploadu.*Vercel Blob" vercel-logs.txt
```

### **KROK 4: Statystyki błędów**

```bash
# Ile błędów watermarku
grep -c "Watermark application failed" vercel-logs.txt

# Ile błędów uploadu
grep -c "Błąd uploadu.*Vercel Blob" vercel-logs.txt

# Ile błędów transformacji
grep -c "AI transformation error" vercel-logs.txt
```

## 🔍 METODA 2: Sprawdź Sentry (Frontend + Backend)

### **Backend Błędy (Sentry)**
Sentry już loguje błędy transformacji w `api/transform.js`:

1. **Wejdź do Sentry Dashboard:**
   - URL: https://sentry.io/organizations/your-org/issues/
   - Filter: `error_type:transform_failed`

2. **Szukaj błędów:**
   - Tag: `error_type=transform_failed`
   - Tag: `endpoint=transform`
   - Tag: `customify=true`

### **Frontend Błędy (Sentry Browser)**
Aktualnie błąd `watermarkedImageUrl` **NIE jest** logowany do Sentry. 

**Aby dodać tracking**, dodaj w `theme.liquid` (około linii 503-508):
```javascript
if (!watermarkedImageUrl) {
  console.error('❌ [CUSTOMIFY] Brak backend watermarkedImageUrl - nie można dodać do koszyka!');
  
  // ✅ DODAJ TRACKING DO SENTRY
  if (typeof Sentry !== 'undefined') {
    Sentry.withScope((scope) => {
      scope.setTag('customify', 'true');
      scope.setTag('error_type', 'missing_watermark_url');
      scope.setTag('location', 'add_to_cart');
      scope.setContext('watermark_error', {
        hasTransformedImage: !!this.transformedImage,
        hasWatermarkedImageUrl: !!this.watermarkedImageUrl,
        selectedStyle: this.selectedStyle,
        selectedSize: this.selectedSize,
        productType: this.selectedProductType
      });
      Sentry.captureMessage('Brak backend watermarkedImageUrl podczas dodawania do koszyka', 'error');
    });
  }
  
  alert('Wystąpił błąd podczas generowania obrazu. Spróbuj wygenerować obraz ponownie klikając "Przekształć z AI".');
  this.hideLoading();
  return;
}
```

## 🔍 METODA 3: Szybka Analiza (1 Komenda)

```bash
# Pobierz logi i przeanalizuj wszystkie możliwe przyczyny
vercel logs customify-s56o.vercel.app --since 24h | \
  grep -E "Watermark|upload.*Blob|transform.*error|transform_failed" | \
  awk '
    /Watermark.*failed/ { watermark_errors++ }
    /upload.*Blob.*failed/ { upload_errors++ }
    /transform.*error/ { transform_errors++ }
    END {
      print "🎨 Błędy watermarku:", watermark_errors+0
      print "📤 Błędy uploadu Vercel Blob:", upload_errors+0
      print "🤖 Błędy transformacji AI:", transform_errors+0
    }
  '
```

## 🔍 METODA 4: Sprawdź Konkretne Scenariusze

### **Scenariusz 1: Base64 Image Upload Failed**

```bash
# Sprawdź czy base64 upload się nie powiódł
grep -B 3 -A 10 "Wykryto base64 data URI" vercel-logs.txt | \
  grep -E "Błąd uploadu|failed|error"
```

### **Scenariusz 2: Replicate URL Upload Failed**

```bash
# Sprawdź czy Replicate URL upload się nie powiódł
grep -B 3 -A 10 "Wykryto URL z Replicate" vercel-logs.txt | \
  grep -E "Błąd uploadu|failed|error"
```

### **Scenariusz 3: Watermark PNG Application Failed**

```bash
# Sprawdź błędy aplikowania watermarku PNG
grep -B 10 -A 5 "Applying.*PNG watermark" vercel-logs.txt | \
  grep -E "failed|error|exception"
```

## 📊 Pełna Analiza - Skrypt

Utwórz plik `check-watermark-errors.js`:

```javascript
const { execSync } = require('child_process');

console.log('🔍 Analizuję błędy watermarkedImageUrl...\n');

try {
  const logs = execSync('vercel logs customify-s56o.vercel.app --since 24h 2>&1', {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024
  });

  const stats = {
    watermarkErrors: (logs.match(/Watermark application failed/g) || []).length,
    uploadErrors: (logs.match(/Błąd uploadu.*Vercel Blob/g) || []).length,
    transformErrors: (logs.match(/AI transformation error/g) || []).length,
    sentryTransformErrors: (logs.match(/transform_failed/g) || []).length
  };

  console.log('📊 STATYSTYKI BŁĘDÓW (ostatnie 24h):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🎨 Błędy aplikowania watermarku: ${stats.watermarkErrors}`);
  console.log(`📤 Błędy uploadu Vercel Blob: ${stats.uploadErrors}`);
  console.log(`🤖 Błędy transformacji AI: ${stats.transformErrors}`);
  console.log(`📊 Błędy Sentry (transform_failed): ${stats.sentryTransformErrors}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (stats.watermarkErrors > 0) {
    console.log('❌ ZNALEZIONO BŁĘDY WATERMARKU:\n');
    const watermarkLines = logs.split('\n').filter(line => 
      line.includes('Watermark application failed')
    );
    watermarkLines.forEach((line, i) => {
      console.log(`${i + 1}. ${line}`);
    });
  }

} catch (error) {
  console.error('❌ Błąd pobierania logów:', error.message);
}
```

Uruchom:
```bash
node check-watermark-errors.js
```

## ✅ Checklist Sprawdzania

- [ ] Pobierz logi Vercel (ostatnie 24h)
- [ ] Sprawdź błędy aplikowania watermarku (`Watermark application failed`)
- [ ] Sprawdź błędy uploadu Vercel Blob (`Błąd uploadu.*Vercel Blob`)
- [ ] Sprawdź błędy transformacji AI (`AI transformation error`)
- [ ] Sprawdź Sentry Dashboard (frontend - po dodaniu trackingu)
- [ ] Sprawdź statystyki błędów

## 🎯 Najczęstsze Przyczyny

1. **Sharp/Watermark library error** - błąd biblioteki watermarku
2. **Vercel Blob Storage limit** - przekroczenie limitu uploadu
3. **Network timeout** - timeout podczas pobierania obrazu z Replicate
4. **Base64 size limit** - obraz zbyt duży dla Vercel (4.5MB)
5. **Memory limit** - przekroczenie limitu pamięci Vercel podczas przetwarzania

