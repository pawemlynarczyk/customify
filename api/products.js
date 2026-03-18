const { checkRateLimit, getClientIP } = require('../utils/vercelRateLimiter');
const { put } = require('@vercel/blob');

// Import Sharp for watermark (optional - may not be available in all environments)
let sharp;
try {
  sharp = require('sharp');
  console.log('✅ [PRODUCTS] Sharp loaded successfully');
} catch (e) {
  console.warn('⚠️ [PRODUCTS] Sharp not available:', e.message);
  sharp = null;
}

// 🎵 Function to add watermark to image for Spotify products
async function addWatermarkForSpotify(imageBuffer) {
  if (!sharp) {
    console.warn('⚠️ [WATERMARK] Sharp not available, returning original image');
    return imageBuffer;
  }
  
  try {
    console.log('🎨 [WATERMARK-SPOTIFY] Adding PNG watermark to Spotify image...');
    
    // Pobierz watermark PNG
    const watermarkUrl = 'https://customify-s56o.vercel.app/watermark_22.png';
    console.log('📥 [WATERMARK-SPOTIFY] Fetching watermark PNG:', watermarkUrl);
    
    const watermarkResponse = await fetch(watermarkUrl);
    if (!watermarkResponse.ok) {
      throw new Error(`Failed to fetch watermark: ${watermarkResponse.status}`);
    }
    const watermarkArrayBuffer = await watermarkResponse.arrayBuffer();
    const watermarkBuffer = Buffer.from(watermarkArrayBuffer);
    console.log('✅ [WATERMARK-SPOTIFY] Watermark PNG fetched:', watermarkBuffer.length, 'bytes');
    
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1536;
    console.log('📏 [WATERMARK-SPOTIFY] Image dimensions:', width, 'x', height);
    
    // Skaluj watermark do 60% szerokości obrazu
    const watermarkWidth = Math.round(width * 0.6);
    const resizedWatermark = await sharp(watermarkBuffer)
      .resize(watermarkWidth, null, { fit: 'inside' })
      .toBuffer();
    
    // Pozycjonuj watermark na środku-dole
    const resizedWatermarkMeta = await sharp(resizedWatermark).metadata();
    const left = Math.round((width - resizedWatermarkMeta.width) / 2);
    const top = Math.round(height * 0.75 - resizedWatermarkMeta.height / 2);
    
    // Nałóż watermark
    const watermarkedBuffer = await sharp(imageBuffer)
      .composite([{
        input: resizedWatermark,
        left: left,
        top: top,
        blend: 'over'
      }])
      .jpeg({ quality: 92 })
      .toBuffer();
    
    console.log('✅ [WATERMARK-SPOTIFY] Watermark applied successfully');
    return watermarkedBuffer;
  } catch (err) {
    console.error('❌ [WATERMARK-SPOTIFY] Error adding watermark:', err);
    return imageBuffer; // Fallback to original
  }
}

module.exports = async (req, res) => {
  // ✅ POPRAWIONE CORS - nie można używać credentials: true z origin: *
  const origin = req.headers.origin;
  if (origin && (origin.includes('lumly.pl') || origin.includes('customify-s56o.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'false'); // ✅ Zmienione na false

  // RATE LIMITING - Sprawdź limit dla API
  const ip = getClientIP(req);
  if (!checkRateLimit(ip, 100, 15 * 60 * 1000)) { // 100 requestów na 15 minut
    console.log(`API rate limit exceeded for IP: ${ip}`);
    return res.status(429).json({
      error: 'API rate limit exceeded',
      message: 'Too many API requests. Please try again later.',
      retryAfter: 900 // 15 minut w sekundach
    });
  }

  if (req.method === 'OPTIONS') {
    console.log('✅ [PRODUCTS.JS] Handling OPTIONS preflight request');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
  const { 
    originalImage, 
    transformedImage, 
    watermarkedImage, // ✅ Obrazek Z watermarkiem (frontend fallback) - do uploadu na Shopify (miniaturka)
    watermarkedImageUrl, // ✅ Obrazek Z watermarkiem (backend PNG) - PRIORYTET - do uploadu na Shopify (miniaturka)
    watermarkedImageBase64, // ✅ NOWE: Base64 obrazka z watermarkiem (z /api/transform) - BEZPOŚREDNI UPLOAD BEZ DOWNLOADU
    needsBackendWatermark, // 🎵 SPOTIFY: Backend musi dodać watermark do skomponowanego obrazu
    spotifyPreviewUrl, // 🎵 SPOTIFY: JPEG z szarym tłem - do koszyka (zamiast watermarku)
    style, 
    size, 
    productType, // Rodzaj wydruku: plakat, canvas lub szklo
    originalProductTitle,
    originalProductId,
    finalPrice, // ✅ Dodano finalPrice z frontendu
    frameColor, // ✅ Informacja o ramce (plakat)
    frameSurcharge, // ✅ Dopłata za ramkę (plakat)
    standType, // 🆕 Informacja o podstawce (szkło)
    standSurcharge // 🆕 Dopłata za podstawkę (szkło)
  } = req.body;

  console.log('💰 [PRODUCTS.JS] Price data received:', {
    finalPrice,
    frameColor,
    frameSurcharge,
    standType,
    standSurcharge,
    productType,
    size
  });

    if (!transformedImage || !style) {
      return res.status(400).json({ 
        error: 'Missing required fields: transformedImage, style' 
      });
    }

    // 🚨 WALIDACJA: Dla szkła tylko A5 i A4 są dozwolone (maksymalnie 20×30 cm)
    if (productType === 'szklo' && size) {
      const allowedSizes = ['a5', 'a4'];
      if (!allowedSizes.includes(size.toLowerCase())) {
        console.error('❌ [PRODUCTS.JS] Invalid size for szklo:', size);
        return res.status(400).json({ 
          error: 'Dla wydruku na szkle dostępne są tylko rozmiary: 15×21 cm (A5) i 20×30 cm (A4). Maksymalny rozmiar to 20×30 cm.',
          invalidSize: size
        });
      }
    }

    const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(500).json({ error: 'Shopify access token not configured' });
    }

    // 🚨 ROLLBACK: START - Feature flag dla produktu cyfrowego (PRZED obliczaniem ceny)
    const ENABLE_DIGITAL_PRODUCTS = process.env.ENABLE_DIGITAL_PRODUCTS !== 'false'; // Domyślnie włączone, wyłącz przez 'false'
    const isDigitalProduct = ENABLE_DIGITAL_PRODUCTS && productType === 'digital';
    // 🚨 ROLLBACK: END - Feature flag dla produktu cyfrowego

    // ✅ UŻYJ CENY PRZESŁANEJ Z FRONTENDU (już obliczonej z rozmiarem)
    // 🚨 ROLLBACK: START - Cena dla produktu cyfrowego (STAŁA 69 zł, NIE zależy od ceny bazowej)
    let totalPrice = 99.00; // Domyślna cena fallback
    
    // Dla produktu cyfrowy: ZAWSZE 49 zł, niezależnie od ceny bazowej produktu
    if (isDigitalProduct) {
      totalPrice = 49.00; // 🚨 ROLLBACK: Stała cena produktu cyfrowego
      console.log('💰 [PRODUCTS.JS] Digital product - using fixed price: 49.00 zł (ignoring base price)');
    } else if (finalPrice && finalPrice > 0) {
      // Produkt fizyczny: użyj ceny z frontendu (już obliczonej z rozmiarem)
      totalPrice = finalPrice;
      console.log('💰 [PRODUCTS.JS] Physical product - using final price from frontend:', finalPrice);
    } else {
      // Fallback: pobierz cenę bazową z oryginalnego produktu (TYLKO dla produktów fizycznych)
      let basePrice = 99.00;
      
      if (originalProductId) {
        try {
          // Fetching base price from original product
          const productResponse = await fetch(`https://${shop}/admin/api/2023-10/products/${originalProductId}.json`, {
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json'
            }
          });
          
          if (productResponse.ok) {
            const productData = await productResponse.json();
            const originalPrice = parseFloat(productData.product.variants[0].price);
            basePrice = originalPrice;
            // Base price retrieved from Shopify
          } else {
            // Could not fetch original product price, using fallback
          }
        } catch (priceError) {
          // Error fetching price, using fallback
        }
      } else {
        // No originalProductId provided, using fallback price
      }
      
      totalPrice = basePrice;
      // Using fallback base price
    }
    // 🚨 ROLLBACK: END - Cena dla produktu cyfrowego

    // Creating product with AI image

    // Buduj tytuł produktu z wszystkimi parametrami (koszyk, zamówienie)
    const frameLabelMap = { none: null, black: 'czarnej', white: 'białej', wood: 'drewnianej' };
    const standLabelMap = { none: null, wood: 'drewnianej', led: 'LED' };
    const fc = (frameColor || 'none').toLowerCase();
    const st = (standType || 'none').toLowerCase();
    const frameLabel = frameLabelMap[fc] || null;
    const standLabel = standLabelMap[st] || null;

    let productTypeName, sizeName;
    
    if (isDigitalProduct) {
      productTypeName = 'Plik cyfrowy do pobrania';
      sizeName = 'Plik do pobrania';
    } else if (productType === 'etui') {
      productTypeName = 'Etui na telefon z Twoim zdjęciem';
      sizeName = 'Etui na telefon';
    } else if (productType === 'spotify_frame') {
      productTypeName = 'Ramka Spotify ze zdjęciem';
      sizeName = size === 'a4' ? '20×30 cm' : size === 'a3' ? '30×45 cm' : size === 'a2' ? '40×60 cm' : size === 'a0' ? '50×75 cm' : size === 'a1' ? '60×90 cm' : (size || '20×30 cm');
    } else if (productType === 'szklo') {
      productTypeName = standLabel
        ? `Wydruk na szkle na podstawce ${standLabel}`
        : 'Wydruk na szkle';
      sizeName = size === 'a5' ? '15×21 cm' : size === 'a4' ? '20×30 cm' : '20×30 cm';
    } else if (productType === 'plakat' || productType === 'canvas') {
      const base = productType === 'plakat' ? 'Plakat' : 'Obraz na płótnie (canvas)';
      productTypeName = frameLabel ? `${base} w ${frameLabel} ramce za szkłem` : base;
      sizeName = size === 'a5' ? '15×21 cm' : size === 'a4' ? '20×30 cm' : size === 'a3' ? '30×45 cm' : size === 'a2' ? '40×60 cm' : size === 'a0' ? '50×75 cm' : size === 'a1' ? '60×90 cm' : (size?.toUpperCase() || 'standard');
    } else {
      productTypeName = 'Obraz na płótnie (canvas)';
      sizeName = size === 'etui'
        ? 'Etui na telefon'  // 📱 Etui - brak rozmiaru
        : size === 'a5'
        ? '15×21 cm'  // 🆕 A5 dla szkła
        : size === 'a4'
          ? '20×30 cm'
          : size === 'a3'
            ? '30×45 cm'
            : size === 'a2'
              ? '40×60 cm'
              : size === 'a0'
                ? '50×75 cm'
                : size === 'a1'
                  ? '60×90 cm'
                  : size?.toUpperCase() || 'standard';
    }
    // 🚨 ROLLBACK: END - Obsługa produktu cyfrowego w nazwach

    // KROK 1: Utwórz produkt BEZ obrazka (najpierw potrzebujemy product ID)
    // 🚨 ROLLBACK: START - Konfiguracja produktu cyfrowego
    const uniqueSuffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const productData = {
      product: {
        title: (isDigitalProduct || productType === 'etui')
          ? `${productTypeName} - Styl ${style}`
          : `${productTypeName} - Rozmiar ${sizeName}`,
        handle: (isDigitalProduct || productType === 'etui')
          ? `custom-${style}-${uniqueSuffix}`
          : `custom-${sizeName}-${uniqueSuffix}`,
        body_html: isDigitalProduct
          ? `
            <p><strong>Spersonalizowany produkt cyfrowy z AI</strong></p>
            <p><strong>Typ produktu:</strong> ${productTypeName}</p>
            <p><strong>Styl:</strong> ${style}</p>
            <p><strong>Cena całkowita:</strong> ${totalPrice.toFixed(2)} zł</p>
            <p>Twoje zdjęcie zostało przekształcone przez AI w stylu ${style}.</p>
            <p><strong>Po zakupie otrzymasz link do pobrania pliku.</strong></p>
          `
          : `
            <p><strong>Spersonalizowany produkt z AI</strong></p>
            <p><strong>Rodzaj wydruku:</strong> ${productTypeName}</p>
            <p><strong>Styl:</strong> ${style}</p>
            <p><strong>Rozmiar:</strong> ${sizeName}</p>
            <p><strong>Cena całkowita:</strong> ${totalPrice.toFixed(2)} zł</p>
            <p>Twoje zdjęcie zostało przekształcone przez AI w stylu ${style}.</p>
          `,
        vendor: 'Customify',
        product_type: isDigitalProduct ? 'Digital Product' : 'Custom AI Product',
        tags: isDigitalProduct
          ? ['custom', 'ai', 'personalized', style, 'digital', 'download', 'no-recommendations', 'hidden-from-catalog', 'customer-order']
          : ['custom', 'ai', 'personalized', style, 'no-recommendations', 'hidden-from-catalog', 'customer-order'],
        status: 'active', // ✅ ACTIVE - MUSI być active żeby dodać do koszyka (Shopify zwraca 422 dla draft)
        published: true, // ✅ MUSI być published=true żeby variant działał w koszyku
        published_scope: 'web',
        requires_shipping: !isDigitalProduct, // 🚨 ROLLBACK: Produkt cyfrowy nie wymaga wysyłki
        variants: [{
          title: isDigitalProduct
            ? `${productTypeName} - ${style}`
            : `${productTypeName} - ${sizeName}`,
          price: totalPrice.toFixed(2), // ✅ NAPRAWIONE: Shopify przyjmuje PLN jako string (np. "79.99")
          inventory_management: null, // null = nie śledź zapasów → zawsze "dostępny" (inventory_quantity jest read-only w REST API 2023-10+)
          fulfillment_service: 'manual',
          requires_shipping: !isDigitalProduct // 🚨 ROLLBACK: Variant cyfrowy nie wymaga wysyłki
        }]
      }
    };
    // 🚨 ROLLBACK: END - Konfiguracja produktu cyfrowego

    const createResponse = await fetch(`https://${shop}/admin/api/2023-10/products.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ [PRODUCTS.JS] Product creation error:', errorText);
      return res.status(500).json({ 
        error: 'Failed to create product',
        details: errorText
      });
    }

    const createdProduct = await createResponse.json();
    const product = createdProduct.product;
    const productId = product.id;

    // Generuj unikalny identyfikator i skrócony numer zamówienia
    const timestamp = Date.now().toString().slice(-8);
    const shortOrderId = timestamp;

    // Product created successfully

    // KROK 2: Pobierz obrazek Z WATERMARKIEM (dla miniaturki w Shopify)
    // ✅ Używamy watermarkedImageBase64 (Z watermarkiem, bezpośrednio z /api/transform) - BEZ PONOWNEGO DOWNLOADU!
    // ✅ Użytkownik widzi miniaturkę Z watermarkiem w koszyku i checkout
    let imageBuffer;
    let contentType = 'image/jpeg'; // Domyślnie JPEG
    
    // 🎵 PRIORYTET 0: SPOTIFY - spotifyPreviewUrl to JPEG z szarym tłem (do koszyka)
    if (spotifyPreviewUrl) {
      console.log('🎵 [PRODUCTS] SPOTIFY: Using spotifyPreviewUrl for cart thumbnail');
      console.log('🎵 [PRODUCTS] Preview URL:', spotifyPreviewUrl.substring(0, 100));
      
      // Pobierz preview image (JPEG z szarym tłem) - to będzie miniaturka w koszyku
      const response = await fetch(spotifyPreviewUrl);
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      contentType = 'image/jpeg';
      
      console.log('✅ [PRODUCTS] SPOTIFY: Preview loaded, size:', imageBuffer.length, 'bytes');
      
    } else if (needsBackendWatermark && transformedImage) {
      // Fallback: stara metoda - dodaj watermark do skomponowanego obrazu
      console.log('🎵 [PRODUCTS] SPOTIFY FALLBACK: Adding watermark to composed image...');
      
      // Pobierz transformedImage (base64) i dodaj watermark
      let transformedBuffer;
      if (transformedImage.startsWith('data:image')) {
        const base64Data = transformedImage.split(',')[1];
        transformedBuffer = Buffer.from(base64Data, 'base64');
      } else if (transformedImage.startsWith('http')) {
        const response = await fetch(transformedImage);
        const arrayBuffer = await response.arrayBuffer();
        transformedBuffer = Buffer.from(arrayBuffer);
      } else {
        transformedBuffer = Buffer.from(transformedImage, 'base64');
      }
      
      console.log('🎵 [PRODUCTS] Transformed image loaded:', transformedBuffer.length, 'bytes');
      
      // Dodaj watermark
      imageBuffer = await addWatermarkForSpotify(transformedBuffer);
      contentType = 'image/jpeg';
      
      console.log('✅ [PRODUCTS] SPOTIFY: Watermark added, final size:', imageBuffer.length, 'bytes');
      
    } else if (watermarkedImageBase64) {
    // ✅ PRIORYTET 1: watermarkedImageBase64 (bezpośrednio z /api/transform - BEZ DOWNLOADU!)
      console.log('✅ [PRODUCTS] Using watermarkedImageBase64 directly (no download needed)');
      
      // Sprawdź czy to jest data URI czy czysty base64
      if (watermarkedImageBase64.startsWith('data:image')) {
        // Data URI format
        const dataUriMatch = watermarkedImageBase64.match(/^data:image\/([a-z]+);base64,/);
        if (dataUriMatch) {
          contentType = `image/${dataUriMatch[1]}`;
          console.log('📦 [PRODUCTS] Detected format from data URI:', contentType);
        }
        const base64Data = watermarkedImageBase64.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
      } else {
        // Czysty base64 (bez data URI prefix)
        imageBuffer = Buffer.from(watermarkedImageBase64, 'base64');
        contentType = 'image/png'; // Backend watermark jest zawsze PNG
      }
      
      console.log('✅ [PRODUCTS] Watermarked image loaded from base64:', imageBuffer.length, 'bytes');
      
    } else {
      // ✅ FALLBACK: Pobierz z URL (stara metoda - może zawieść)
      // Priorytet: watermarkedImageUrl (backend PNG) > watermarkedImage (frontend Canvas) > transformedImage (bez watermarku)
      const imageToUpload = watermarkedImageUrl || watermarkedImage || transformedImage;
      console.log('⚠️ [PRODUCTS] No watermarkedImageBase64 - falling back to download from URL');
      console.log('📦 [PRODUCTS] Image to upload priority:', {
        hasWatermarkedImageUrl: !!watermarkedImageUrl,
        hasWatermarkedImage: !!watermarkedImage,
        hasTransformedImage: !!transformedImage,
        selected: watermarkedImageUrl ? 'watermarkedImageUrl (backend)' : watermarkedImage ? 'watermarkedImage (frontend)' : 'transformedImage (no watermark)'
      });
      console.log('🔍 [PRODUCTS] Debug - watermarkedImageBase64 in request:', {
        hasWatermarkedImageBase64: !!watermarkedImageBase64,
        watermarkedImageBase64Type: typeof watermarkedImageBase64,
        watermarkedImageBase64Length: watermarkedImageBase64?.length || 0,
        watermarkedImageBase64Preview: watermarkedImageBase64?.substring(0, 100) || 'null'
      });
      
      if (imageToUpload.startsWith('data:image')) {
        // Base64 format - convert directly
        console.log('📦 [PRODUCTS] Detected base64 watermarked image, converting...');
        // ✅ WYKRYJ FORMAT Z data URI
        const dataUriMatch = imageToUpload.match(/^data:image\/([a-z]+);base64,/);
        if (dataUriMatch) {
          contentType = `image/${dataUriMatch[1]}`;
          console.log('📦 [PRODUCTS] Detected format from data URI:', contentType);
        }
        const base64Data = imageToUpload.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
      } else {
        // URL format - download first
        console.log('📥 [PRODUCTS] Downloading watermarked image from:', imageToUpload);
        const imageResponse = await fetch(imageToUpload);
        
        if (!imageResponse.ok) {
          // Failed to download watermarked image - użyj fallback do transformedImage
          console.error('❌ [PRODUCTS] Failed to download watermarked image:', imageResponse.status, imageResponse.statusText);
          console.warn('⚠️ [PRODUCTS] Falling back to transformedImage (bez watermarku)');
          
          // ✅ FALLBACK: Użyj transformedImage bez watermarku (lepsze niż brak obrazu)
          if (transformedImage && transformedImage.startsWith('http')) {
            console.log('📥 [PRODUCTS] Downloading transformedImage (bez watermarku) as fallback:', transformedImage);
            const fallbackResponse = await fetch(transformedImage);
            
            if (fallbackResponse.ok) {
              contentType = fallbackResponse.headers.get('content-type') || 'image/jpeg';
              const fallbackArrayBuffer = await fallbackResponse.arrayBuffer();
              imageBuffer = Buffer.from(fallbackArrayBuffer);
              console.log('✅ [PRODUCTS] Fallback image downloaded successfully:', imageBuffer.length, 'bytes');
            } else {
              console.error('❌ [PRODUCTS] Fallback image also failed:', fallbackResponse.status, fallbackResponse.statusText);
              return res.json({
                success: true,
                product: product,
                variantId: product.variants[0].id,
                productId: productId,
                warning: 'Product created but image upload failed (watermarked and fallback)',
                imageUrl: imageToUpload
              });
            }
          } else {
            console.error('❌ [PRODUCTS] No valid fallback image available');
            return res.json({
              success: true,
              product: product,
              variantId: product.variants[0].id,
              productId: productId,
              warning: 'Product created but watermarked image upload failed and no fallback',
              imageUrl: imageToUpload
            });
          }
        } else {
        
          // ✅ SPRAWDŹ Content-Type z response
          contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
          console.log('📦 [PRODUCTS] Image Content-Type:', contentType);
          
          const imageArrayBuffer = await imageResponse.arrayBuffer();
          imageBuffer = Buffer.from(imageArrayBuffer);
          
          // ✅ WALIDACJA: Sprawdź czy obrazek nie jest pusty
          if (!imageBuffer || imageBuffer.length === 0) {
            console.error('❌ [PRODUCTS] Downloaded image is empty');
            return res.json({
              success: true,
              product: product,
              variantId: product.variants[0].id,
              productId: productId,
              warning: 'Product created but downloaded image is empty',
              imageUrl: imageToUpload
            });
          }
          
          console.log('✅ [PRODUCTS] Image downloaded successfully:', imageBuffer.length, 'bytes');
        }
      }
    }
    
    // ✅ WALIDACJA: Sprawdź czy imageBuffer jest poprawny
    if (!imageBuffer || imageBuffer.length === 0) {
      console.error('❌ [PRODUCTS] Image buffer is empty or invalid');
      return res.json({
        success: true,
        product: product,
        variantId: product.variants[0].id,
        productId: productId,
        warning: 'Product created but image buffer is invalid',
        imageUrl: transformedImage
      });
    }
    
    // ✅ WALIDACJA: Sprawdź magic bytes (pierwsze bajty pliku) - czy to jest poprawny obrazek
    const magicBytes = imageBuffer.slice(0, 4);
    const isValidImage = 
      magicBytes[0] === 0xFF && magicBytes[1] === 0xD8 && magicBytes[2] === 0xFF && (magicBytes[3] === 0xE0 || magicBytes[3] === 0xE1 || magicBytes[3] === 0xDB) || // JPEG
      magicBytes[0] === 0x89 && magicBytes[1] === 0x50 && magicBytes[2] === 0x4E && magicBytes[3] === 0x47 || // PNG
      magicBytes[0] === 0x52 && magicBytes[1] === 0x49 && magicBytes[2] === 0x46 && magicBytes[3] === 0x46; // WebP (RIFF)
    
    if (!isValidImage) {
      console.error('❌ [PRODUCTS] Image magic bytes invalid:', magicBytes);
      console.error('❌ [PRODUCTS] First 16 bytes:', imageBuffer.slice(0, 16));
      return res.json({
        success: true,
        product: product,
        variantId: product.variants[0].id,
        productId: productId,
        warning: 'Product created but image format is invalid (corrupt file)',
        imageUrl: transformedImage
      });
    }
    
    console.log('✅ [PRODUCTS] Image magic bytes validated:', magicBytes.toString('hex'));
    
    // Convert imageBuffer to base64 for Shopify API
    const base64Image = imageBuffer.toString('base64');
    console.log('✅ [PRODUCTS] Watermarked image ready for Shopify upload:', base64Image.length, 'chars base64');

    // Uploading image to product

    // Generuj unikalny identyfikator z nazwą klienta, stylem i timestamp
    const customerName = (originalProductTitle || 'Customer').replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    const uniqueId = `${customerName}-${style}-${timestamp}`;
    
    // ✅ WYKRYJ FORMAT OBRAZKA z Content-Type lub URL
    let imageExtension = 'jpg'; // Domyślnie JPEG
    if (contentType.includes('png')) {
      imageExtension = 'png';
    } else if (contentType.includes('webp')) {
      imageExtension = 'webp';
    } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      imageExtension = 'jpg';
    } else if (imageToUpload.includes('.png')) {
      imageExtension = 'png';
    } else if (imageToUpload.includes('.webp')) {
      imageExtension = 'webp';
    } else if (imageToUpload.includes('.jpg') || imageToUpload.includes('.jpeg')) {
      imageExtension = 'jpg';
    }
    
    console.log('📦 [PRODUCTS] Detected image format:', imageExtension, '(from Content-Type:', contentType, ')');
    
    const imageUploadData = {
      image: {
        attachment: base64Image,
        filename: `ai-${uniqueId}.${imageExtension}`,
        alt: `AI ${style} for ${customerName} - ${timestamp}`
      }
    };

    const uploadResponse = await fetch(`https://${shop}/admin/api/2023-10/products/${productId}/images.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(imageUploadData)
    });

    if (!uploadResponse.ok) {
      const uploadError = await uploadResponse.text();
      console.error('❌ [PRODUCTS.JS] Image upload error:', uploadError);
      return res.json({
        success: true,
        product: product,
        variantId: product.variants[0].id,
        productId: productId,
        warning: 'Product created but image upload failed',
        imageUrl: transformedImage
      });
    }

    const uploadResult = await uploadResponse.json();
    const shopifyImageUrl = uploadResult.image.src;

    // Image uploaded successfully

    // ✅ SPRAWDŹ CZY transformedImage TO URL CZY BASE64
    // Jeśli to base64 (z galerii), uploaduj do Vercel Blob przed użyciem
    let vercelBlobUrl = null;
    
    if (transformedImage && transformedImage.startsWith('http')) {
      // ✅ TO JEST URL - użyj bezpośrednio (już jest na Vercel Blob)
      vercelBlobUrl = transformedImage;
      console.log('✅ [PRODUCTS] Using existing Vercel Blob URL from /api/transform (no duplicate upload)');
      console.log('📍 [PRODUCTS] Vercel Blob URL:', vercelBlobUrl?.substring(0, 80) + '...');
    } else if (transformedImage && transformedImage.startsWith('data:')) {
      // ❌ TO JEST BASE64 - uploaduj do Vercel Blob (z galerii - stara generacja)
      console.log('⚠️ [PRODUCTS] transformedImage is base64 - uploading to Vercel Blob...');
      
      try {
        const base64Data = transformedImage.replace(/^data:image\/[a-z]+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        console.log(`📦 [PRODUCTS] Base64 buffer size: ${imageBuffer.length} bytes (${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
        
        const timestamp = Date.now();
        // ✅ ZAPISZ W TRWAŁYM MIEJSCU (customify/orders/) - NIE BĘDZIE USUNIĘTY PRZEZ CLEANUP
        // Cleanup usuwa tylko customify/temp/ - customify/orders/ jest trwałe
        const uniqueFilename = `customify/orders/generation-${timestamp}.jpg`;
        
        const blob = await put(uniqueFilename, imageBuffer, {
          access: 'public',
          contentType: 'image/jpeg',
          token: process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN,
        });
        
        vercelBlobUrl = blob.url;
        console.log(`✅ [PRODUCTS] Base64 uploaded to Vercel Blob: ${vercelBlobUrl.substring(0, 80)}...`);
      } catch (uploadError) {
        console.error('❌ [PRODUCTS] Failed to upload base64 to Vercel Blob:', uploadError);
        // Fallback: użyj transformedImage (base64) - ale to nie zadziała dla _AI_Image_URL
        vercelBlobUrl = null;
      }
    } else {
      console.warn('⚠️ [PRODUCTS] transformedImage is neither URL nor base64:', typeof transformedImage);
      vercelBlobUrl = null;
    }

    // ✅ permanentImageUrl ZAWSZE używa Vercel Blob jako głównego źródła (backup)
    // Shopify CDN jest tylko dla produktu w Shopify, ale może zniknąć
    const permanentImageUrl = vercelBlobUrl || shopifyImageUrl;

    // KROK 4: Dodaj metafields do produktu (TYLKO dla admina - nie widoczne dla użytkownika)
    // Te URLe są TYLKO dla realizacji zamówienia w adminie
    console.log('📝 [PRODUCTS.JS] Adding metafields to product...');
    
    // watermarkedImage już jest zadeklarowane na górze (linia 42)
    
    try {
      // 🚨 ROLLBACK: START - Metafields dla produktu cyfrowego
      const orderDetails = {
        orderId: uniqueId,
        shortOrderId: shortOrderId,
        shopifyImageUrl: shopifyImageUrl,  // BEZ watermarku - do realizacji
        vercelBlobUrl: vercelBlobUrl,  // BEZ watermarku - backup
        permanentImageUrl: permanentImageUrl,  // BEZ watermarku - główny URL do realizacji
        _AI_Image_URL: vercelBlobUrl || permanentImageUrl,  // ✅ BEZ WATERMARKU - dla admina w zamówieniu (główny URL)
        watermarkedImageUrl: watermarkedImage || null,  // Z watermarkiem - dla referencji
        style: style,
        size: size,
        productType: productType,
        createdAt: new Date().toISOString()
      };

      // Dla produktu cyfrowego - dodaj URL do pobrania
      if (isDigitalProduct) {
        orderDetails.digitalDownloadUrl = permanentImageUrl; // URL do pliku cyfrowego (BEZ watermarku)
        orderDetails.isDigital = true;
        console.log('📦 [PRODUCTS.JS] Digital product - download URL saved:', permanentImageUrl);
      }
      // 🚨 ROLLBACK: END - Metafields dla produktu cyfrowego

      const metafieldsData = {
        metafield: {
          namespace: 'customify',
          key: 'order_details',
          value: JSON.stringify(orderDetails),
          type: 'json'
        }
      };

      const metafieldsResponse = await fetch(`https://${shop}/admin/api/2023-10/products/${productId}/metafields.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metafieldsData)
      });

      if (metafieldsResponse.ok) {
        console.log('✅ [PRODUCTS.JS] Metafields added successfully');
      } else {
        const metafieldsError = await metafieldsResponse.text();
        console.error('⚠️ [PRODUCTS.JS] Failed to add metafields:', metafieldsError);
      }
    } catch (metafieldsError) {
      console.error('⚠️ [PRODUCTS.JS] Metafields error:', metafieldsError.message);
    }

    res.json({ 
      success: true, 
      product: product,
      variantId: product.variants[0].id,
      productId: productId,
      imageUrl: shopifyImageUrl,  // ✅ URL z Shopify (dla produktu w Shopify)
      permanentImageUrl: permanentImageUrl,  // ✅ PERMANENTNY URL - Vercel Blob (backup) lub fallback Shopify
      vercelBlobUrl: vercelBlobUrl,  // ✅ URL z Vercel Blob (backup - zawsze powinien być dostępny)
      orderId: uniqueId,  // ✅ Unikalny identyfikator zamówienia
      shortOrderId: shortOrderId,  // ✅ Skrócony numer (tylko timestamp) - dla klienta
      message: 'Produkt został utworzony z obrazkiem AI!',
      cartUrl: `https://${shop}/cart/add?id=${product.variants[0].id}&quantity=1`
    });

  } catch (error) {
    console.error('❌ [PRODUCTS.JS] Product creation error:', error);
    res.status(500).json({ 
      error: 'Product creation failed',
      details: error.message 
    });
  }
};