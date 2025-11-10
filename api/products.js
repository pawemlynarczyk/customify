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
    watermarkedImage, // ✅ Obrazek Z watermarkiem - do uploadu na Shopify (miniaturka)
    style, 
    size, 
    productType, // Rodzaj wydruku: plakat lub canvas
    originalProductTitle,
    originalProductId,
    finalPrice // ✅ Dodano finalPrice z frontendu
  } = req.body;

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

    // ✅ UŻYJ CENY PRZESŁANEJ Z FRONTENDU (już obliczonej z rozmiarem)
    let totalPrice = 99.00; // Domyślna cena fallback
    
    // Product creation data received
    
    if (finalPrice && finalPrice > 0) {
      totalPrice = finalPrice;
      // Using final price from frontend
    } else {
      // Fallback: pobierz cenę bazową z oryginalnego produktu
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

    // Creating product with AI image

    // Zmapuj productType i size na polskie nazwy
    const productTypeName = productType === 'plakat' ? 'Plakat' : 'Obraz na płótnie';
    const sizeName = size === 'a1' ? '60×85 cm' : size === 'a2' ? '40×60 cm' : size === 'a3' ? '30×40 cm' : size === 'a4' ? '20×30 cm' : size?.toUpperCase() || 'standard';

    // KROK 1: Utwórz produkt BEZ obrazka (najpierw potrzebujemy product ID)
    const productData = {
      product: {
        title: `${productTypeName} - Rozmiar ${sizeName}`,
        body_html: `
          <p><strong>Spersonalizowany produkt z AI</strong></p>
          <p><strong>Rodzaj wydruku:</strong> ${productTypeName}</p>
          <p><strong>Styl:</strong> ${style}</p>
          <p><strong>Rozmiar:</strong> ${sizeName}</p>
          <p><strong>Cena całkowita:</strong> ${totalPrice.toFixed(2)} zł</p>
          <p>Twoje zdjęcie zostało przekształcone przez AI w stylu ${style}.</p>
        `,
        vendor: 'Customify',
        product_type: 'Custom AI Product',
        tags: ['custom', 'ai', 'personalized', style, 'no-recommendations', 'hidden-from-catalog', 'customer-order'],
        status: 'active', // ✅ ACTIVE - MUSI być active żeby dodać do koszyka (Shopify zwraca 422 dla draft)
        published: true, // ✅ MUSI być published=true żeby variant działał w koszyku
        published_scope: 'web',
        variants: [{
          title: `${productTypeName} - ${sizeName}`,
          price: totalPrice.toFixed(2), // ✅ NAPRAWIONE: Shopify przyjmuje PLN jako string (np. "79.99")
          inventory_quantity: 100,
          inventory_management: 'shopify',
          fulfillment_service: 'manual'
        }]
      }
    };

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
    const shortOrderId = timestamp;

    // Product created successfully

    // KROK 2: Pobierz obrazek Z WATERMARKIEM (dla miniaturki w Shopify)
    // ✅ Używamy watermarkedImage (Z watermarkiem) zamiast transformedImage (BEZ watermarku)
    // ✅ Użytkownik widzi miniaturkę Z watermarkiem w koszyku i checkout
    let imageBuffer;
    const imageToUpload = watermarkedImage || transformedImage; // Fallback jeśli brak watermarked
    
    if (imageToUpload.startsWith('data:image')) {
      // Base64 format - convert directly
      console.log('📦 [PRODUCTS] Detected base64 watermarked image, converting...');
      const base64Data = imageToUpload.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      // URL format - download first
      console.log('📥 [PRODUCTS] Downloading watermarked image from:', imageToUpload);
      const imageResponse = await fetch(imageToUpload);
      
      if (!imageResponse.ok) {
        // Failed to download watermarked image
        console.error('❌ [PRODUCTS] Failed to download watermarked image');
        return res.json({
          success: true,
          product: product,
          variantId: product.variants[0].id,
          productId: productId,
          warning: 'Product created but watermarked image upload failed',
          imageUrl: imageToUpload
        });
      }
      
      const imageArrayBuffer = await imageResponse.arrayBuffer();
      imageBuffer = Buffer.from(imageArrayBuffer);
    }
    
    // Convert imageBuffer to base64 for Shopify API
    const base64Image = imageBuffer.toString('base64');
    console.log('✅ [PRODUCTS] Watermarked image ready for Shopify upload');

    // Uploading image to product

    // Generuj unikalny identyfikator z nazwą klienta, stylem i timestamp
    const customerName = (originalProductTitle || 'Customer').replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    const timestamp = Date.now().toString().slice(-8);
    const uniqueId = `${customerName}-${style}-${timestamp}`;
    
    const imageUploadData = {
      image: {
        attachment: base64Image,
        filename: `ai-${uniqueId}.webp`,
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
    
    if (!process.env.customify_READ_WRITE_TOKEN) {
      console.error('❌ [PRODUCTS.JS] CRITICAL: customify_READ_WRITE_TOKEN not configured!');
      console.error('   Image will be lost if product is deleted!');
      blobUploadFailed = true;
    } else {
      try {
        // Pobierz obrazek BEZ watermarku (transformedImage) do backupu
        let nonWatermarkedBuffer;
        
        if (transformedImage.startsWith('data:image')) {
          console.log('📦 [PRODUCTS] Converting non-watermarked image for backup...');
          const base64Data = transformedImage.split(',')[1];
          nonWatermarkedBuffer = Buffer.from(base64Data, 'base64');
        } else {
          console.log('📥 [PRODUCTS] Downloading non-watermarked image for backup...');
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
      const metafieldsData = {
        metafield: {
          namespace: 'customify',
          key: 'order_details',
          value: JSON.stringify({
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
          }),
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