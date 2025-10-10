# Nano Banana API - Konfiguracja per typ produktu

## 📋 Podsumowanie

System automatycznie wykrywa typ produktu (koty vs inne) i przekazuje tę informację do API. Możesz teraz łatwo dostosować parametry Nano Banana dla różnych grup produktów.

---

## 🎯 Jak to działa?

### **1. Frontend (`customify.js`)**
Wykrywa typ produktu na podstawie wybranego stylu:

```javascript
// Style kotów
const catStyles = ['krolewski', 'na-tronie', 'wojenny', 'barokowy', 'wiktorianski', 'renesansowy'];

// Wykryj czy produkt to "koty"
const isCatProduct = catStyles.includes(this.selectedStyle);

// Przekaż do API
const requestBody = {
  imageData: base64,
  prompt: `Transform this image in ${this.selectedStyle} style`,
  productType: isCatProduct ? 'cats' : 'other'
};
```

### **2. Backend (`api/transform.js`)**
Odbiera `productType` i może dostosować parametry:

```javascript
// W styleConfig każdy styl ma productType:
'krolewski': {
  model: "google/nano-banana",
  productType: "cats", // Identyfikator
  parameters: {
    aspect_ratio: "match_input_image", // ← ZMIEŃ TUTAJ
    output_format: "jpg"                // ← ZMIEŃ TUTAJ
  }
}
```

---

## 🔧 Dostępne parametry Nano Banana

### **aspect_ratio**
Format outputu (proporcje zdjęcia):
- `"match_input_image"` - zachowaj proporcje zdjęcia użytkownika **(DOMYŚLNE)**
- `"1:1"` - kwadrat (1024x1024)
- `"16:9"` - krajobraz szeroki
- `"9:16"` - portret wysoki
- `"4:3"` - krajobraz standardowy
- `"3:4"` - portret standardowy

### **output_format**
Format pliku:
- `"jpg"` - JPEG (mniejszy plik, lekko traci jakość) **(DOMYŚLNE)**
- `"png"` - PNG (większy plik, bez straty jakości)
- `"webp"` - WebP (nowoczesny format, mały + dobra jakość)

---

## 📝 Jak zmienić ustawienia?

### **Opcja A: Zmiana domyślnych parametrów dla konkretnego stylu**

Edytuj `api/transform.js` - znajdź swój styl i zmień parametry:

```javascript
'krolewski': {
  model: "google/nano-banana",
  productType: "cats",
  parameters: {
    aspect_ratio: "1:1",    // ← Koty królewskie zawsze kwadrat
    output_format: "png"    // ← Lepsza jakość dla kotów
  }
}
```

### **Opcja B: Dynamiczna zmiana per typ produktu**

Edytuj `api/transform.js` - znajdź sekcję `// 🎯 LOGIKA NADPISYWANIA` (około linia 349):

```javascript
// Domyślne parametry z config
let aspectRatio = config.parameters.aspect_ratio;
let outputFormat = config.parameters.output_format;

// ✅ DODAJ TEN KOD:
if (productType === 'cats') {
  aspectRatio = '1:1';      // Koty ZAWSZE kwadrat
  outputFormat = 'png';     // Koty ZAWSZE PNG
} else if (productType === 'other') {
  aspectRatio = '16:9';     // Inne produkty krajobraz
  outputFormat = 'jpg';     // Inne produkty JPEG
}
```

---

## 🚀 Przykłady konfiguracji

### **Przykład 1: Koty kwadratowe, inne produkty zachowuj proporcje**

```javascript
if (productType === 'cats') {
  aspectRatio = '1:1';      // Koty kwadrat
  outputFormat = 'jpg';
} else {
  aspectRatio = 'match_input_image'; // Inne zachowaj proporcje
  outputFormat = 'jpg';
}
```

### **Przykład 2: Koty PNG, inne JPEG**

```javascript
if (productType === 'cats') {
  outputFormat = 'png';     // Koty lepsza jakość
} else {
  outputFormat = 'jpg';     // Inne mniejsze pliki
}
// aspect_ratio pozostaje bez zmian (match_input_image)
```

### **Przykład 3: Różne proporcje per produkt**

```javascript
if (productType === 'cats') {
  aspectRatio = '4:3';      // Koty klasyczne proporcje
  outputFormat = 'png';
} else if (productType === 'other') {
  aspectRatio = '16:9';     // Inne nowoczesne proporcje
  outputFormat = 'jpg';
}
```

---

## 📊 Obecna konfiguracja

### **Style kotów** (productType: "cats"):
- `krolewski`, `na-tronie`, `wojenny`, `barokowy`, `wiktorianski`, `renesansowy`
- **Model**: `google/nano-banana`
- **aspect_ratio**: `match_input_image` (zachowuje proporcje zdjęcia użytkownika)
- **output_format**: `jpg`

### **Inne style** (productType: "other"):
- `anime` (Ghibli), `pixar`, `van gogh`, `picasso`, `monet`, `cyberpunk`, `watercolor`
- **Model**: Różne (Stable Diffusion, SDXL-Pixar, Mirage-Ghibli)
- Parametry zależą od konkretnego modelu

---

## 🔍 Debugging

Sprawdź logi w konsoli Vercel:

```bash
🎯 [TRANSFORM] Product type: cats
🎯 [TRANSFORM] Style: Transform this image in krolewski style
Config productType: cats, Request productType: cats
🖼️ [NANO-BANANA] Using aspect_ratio: match_input_image, output_format: jpg
```

---

## ✅ Status

- ✅ Frontend wykrywa typ produktu (koty vs inne)
- ✅ Backend odbiera productType w API request
- ✅ Każdy styl ma identyfikator productType
- ✅ Logika nadpisywania parametrów przygotowana
- ⚠️ **Domyślne parametry nie zostały zmienione** - nadal używamy `match_input_image` + `jpg`

---

## 🎨 Teraz Twoja kolej!

**Powiedz mi:**
1. Jakie proporcje chcesz dla kotów? (np. `1:1`, `4:3`, `match_input_image`)
2. Jaki format dla kotów? (np. `jpg`, `png`, `webp`)
3. Jakie proporcje dla innych produktów?
4. Jaki format dla innych produktów?

**Przykład odpowiedzi:**
> "Koty zawsze 1:1 PNG, inne produkty zachowaj proporcje JPEG"

I zaimplementuję to od razu! 🚀

