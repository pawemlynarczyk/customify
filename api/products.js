const { checkRateLimit, getClientIP } = require('../utils/vercelRateLimiter');
const { put } = require('@vercel/blob');

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
    style, 
    size, 
    productType, // Rodzaj wydruku: plakat lub canvas
    originalProductTitle,
    originalProductId,
    finalPrice, // ✅ Dodano finalPrice z frontendu
    frameColor, // ✅ Informacja o ramce
    frameSurcharge // ✅ Dopłata za ramkę
  } = req.body;

  console.log('💰 [PRODUCTS.JS] Price data received:', {
    finalPrice,
    frameColor,
    frameSurcharge,
    productType,
    size
  });

    if (!transformedImage || !style) {
      return res.status(400).json({ 
        error: 'Missing required fields: transformedImage, style' 
      });
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
    
    // Dla produktu cyfrowy: ZAWSZE 69 zł, niezależnie od ceny bazowej produktu
    if (isDigitalProduct) {
      totalPrice = 69.00; // 🚨 ROLLBACK: Stała cena produktu cyfrowego
      console.log('💰 [PRODUCTS.JS] Digital product - using fixed price: 69.00 zł (ignoring base price)');
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

    // Zmapuj productType i size na polskie nazwy
    // 🚨 ROLLBACK: START - Obsługa produktu cyfrowego w nazwach
    let productTypeName, sizeName;
    
    if (isDigitalProduct) {
      // Produkt cyfrowy - bez rozmiaru fizycznego
      productTypeName = 'Produkt cyfrowy';
      sizeName = 'Plik do pobrania';
    } else {
      // Produkt fizyczny - normalna logika
      productTypeName = productType === 'plakat' ? 'Plakat' : 'Obraz na płótnie';
      sizeName = size === 'a4'
        ? '20×30 cm'
        : size === 'a3'
          ? '30×45 cm'
          : size === 'a2'
            ? '40×60 cm'
            : size === 'a0'
              ? '50×75 cm'
              : size === 'a1'
                ? '60×90 cm'
                : size === 'a5'
                  ? '15×20 cm'
                  : size?.toUpperCase() || 'standard';
    }
    // 🚨 ROLLBACK: END - Obsługa produktu cyfrowego w nazwach

    // KROK 1: Utwórz produkt BEZ obrazka (najpierw potrzebujemy product ID)
    // 🚨 ROLLBACK: START - Konfiguracja produktu cyfrowego
    const productData = {
      product: {
        title: isDigitalProduct 
          ? `${productTypeName} - Styl ${style}`
          : `${productTypeName} - Rozmiar ${sizeName}`,
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
          inventory_quantity: 100,
          inventory_management: 'shopify',
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
    // ✅ Używamy watermarkedImageUrl (Z watermarkiem) zamiast transformedImage (BEZ watermarku)
    // ✅ Użytkownik widzi miniaturkę Z watermarkiem w koszyku i checkout
    let imageBuffer;
    let contentType = 'image/jpeg'; // Domyślnie JPEG
    // Priorytet: watermarkedImageUrl z request body (backend PNG) > watermarkedImage (frontend Canvas) > transformedImage (bez watermarku)
    const imageToUpload = watermarkedImageUrl || watermarkedImage || transformedImage;
    console.log('📦 [PRODUCTS] Image to upload priority:', {
      hasWatermarkedImageUrl: !!watermarkedImageUrl,
      hasWatermarkedImage: !!watermarkedImage,
      hasTransformedImage: !!transformedImage,
      selected: watermarkedImageUrl ? 'watermarkedImageUrl (backend)' : watermarkedImage ? 'watermarkedImage (frontend)' : 'transformedImage (no watermark)'
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
        // Failed to download watermarked image
        console.error('❌ [PRODUCTS] Failed to download watermarked image:', imageResponse.status, imageResponse.statusText);
        return res.json({
          success: true,
          product: product,
          variantId: product.variants[0].id,
          productId: productId,
          warning: 'Product created but watermarked image upload failed',
          imageUrl: imageToUpload
        });
      }
      
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

    // 🗄️ VERCEL BLOB BACKUP (OBOWIĄZKOWY): Zapisz obrazek BEZ watermarku jako permanentny backup
    // ✅ Backup BEZ watermarku - do realizacji zamówienia (tylko dla admina w metafields)
    // ✅ Shopify ma obrazek Z watermarkiem (miniaturka dla użytkownika)
    let vercelBlobUrl = null;
    let blobUploadFailed = false;
    
    // ✅ SCENARIUSZ 1: Jeśli transformedImage to już URL z Vercel Blob - użyj bezpośrednio!
    const isVercelBlobUrl = transformedImage && 
      (transformedImage.includes('blob.vercel-storage.com') || 
       transformedImage.includes('.public.blob.vercel'));
    
    if (isVercelBlobUrl) {
      console.log('✅ [PRODUCTS] Detected Vercel Blob URL - reusing directly (no duplicate upload)');
      console.log('📍 [PRODUCTS] Vercel Blob URL:', transformedImage.substring(0, 80) + '...');
      vercelBlobUrl = transformedImage;
      // SKIP download & upload - obraz już jest w Vercel Blob!
    } else if (!process.env.customify_READ_WRITE_TOKEN) {
      console.error('❌ [PRODUCTS.JS] CRITICAL: customify_READ_WRITE_TOKEN not configured!');
      console.error('   Image will be lost if product is deleted!');
      blobUploadFailed = true;
    } else {
      try {
        // ✅ SCENARIUSZ 2 & 3: Base64 lub Replicate URL - pobierz i zapisz w Vercel Blob
        let nonWatermarkedBuffer;
        
        if (transformedImage.startsWith('data:image')) {
          console.log('📦 [PRODUCTS] Converting non-watermarked base64 for backup...');
          const base64Data = transformedImage.split(',')[1];
          nonWatermarkedBuffer = Buffer.from(base64Data, 'base64');
        } else {
          console.log('📥 [PRODUCTS] Downloading non-watermarked image for backup...');
          console.log('📍 [PRODUCTS] Source URL:', transformedImage.substring(0, 80) + '...');
          const imageResponse = await fetch(transformedImage);
          if (imageResponse.ok) {
            const imageArrayBuffer = await imageResponse.arrayBuffer();
            nonWatermarkedBuffer = Buffer.from(imageArrayBuffer);
          } else {
            throw new Error('Failed to download non-watermarked image');
          }
        }
        
        const blobFilename = `customify/orders/${uniqueId}.jpg`;
        const blob = await put(blobFilename, nonWatermarkedBuffer, {
          access: 'public',
          contentType: 'image/jpeg',
          token: process.env.customify_READ_WRITE_TOKEN,
        });
        vercelBlobUrl = blob.url;
        console.log('✅ [PRODUCTS.JS] Non-watermarked backup uploaded to Vercel Blob:', vercelBlobUrl);
      } catch (blobError) {
        console.error('❌ [PRODUCTS.JS] CRITICAL: Vercel Blob backup failed:', blobError.message);
        console.error('   Non-watermarked image will be lost if product is deleted!');
        blobUploadFailed = true;
      }
    }

    // ⚠️ WARNING jeśli Vercel Blob nie działa - obraz nie będzie miał backupu
    const warnings = [];
    if (blobUploadFailed || !vercelBlobUrl) {
      warnings.push('Vercel Blob backup failed - image may be lost if product is deleted');
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
        warnings.push('Metafields not saved - admin may not see order details');
      }
    } catch (metafieldsError) {
      console.error('⚠️ [PRODUCTS.JS] Metafields error:', metafieldsError.message);
      warnings.push('Metafields not saved - admin may not see order details');
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
      warnings: warnings.length > 0 ? warnings : undefined,  // ⚠️ Ostrzeżenie jeśli backup nie działa
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