const { checkRateLimit, getClientIP } = require('../utils/vercelRateLimiter');

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
    logWarning('/api/products', 'Rate limit exceeded', { ip, statusCode: 429 });
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
    style, 
    size, 
    productType, // Rodzaj wydruku: plakat lub canvas
    originalProductTitle,
    originalProductId,
    finalPrice // ✅ Dodano finalPrice z frontendu
  } = req.body;

    if (!transformedImage || !style) {
      logError('/api/products', new Error('Missing required fields'), {
        statusCode: 400,
        ip,
        hasTransformedImage: !!transformedImage,
        hasStyle: !!style
      });
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

    // Product created successfully

    // KROK 2: Pobierz obrazek (Replicate/Segmind)
    // Check if transformedImage is base64 or URL
    let imageBuffer;
    
    if (transformedImage.startsWith('data:image')) {
      // Base64 format (Segmind Caricature) - convert directly
      console.log('📦 [PRODUCTS] Detected base64 image, converting...');
      const base64Data = transformedImage.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      // URL format (Replicate) - download first
      console.log('📥 [PRODUCTS] Detected URL image, downloading...');
      const imageResponse = await fetch(transformedImage);
      
      if (!imageResponse.ok) {
        // Failed to download image from Replicate
        return res.json({
          success: true,
          product: product,
          variantId: product.variants[0].id,
          productId: productId,
          warning: 'Product created but image upload failed',
          imageUrl: transformedImage
        });
      }
      
      const imageArrayBuffer = await imageResponse.arrayBuffer();
      imageBuffer = Buffer.from(imageArrayBuffer);
    }
    
    // Convert imageBuffer to base64 for Shopify API
    const base64Image = imageBuffer.toString('base64');

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
    
    // Log success
    logSuccess('/api/products', {
      statusCode: 200,
      ip,
      productId,
      variantId: product.variants[0].id,
      style,
      size,
      productType,
      finalPrice: totalPrice
    });

    res.json({ 
      success: true, 
      product: product,
      variantId: product.variants[0].id,
      productId: productId,
      imageUrl: shopifyImageUrl,  // ✅ URL z Shopify (w nowym produkcie)
      orderId: uniqueId,  // ✅ Unikalny identyfikator zamówienia
      message: 'Produkt został utworzony z obrazkiem AI!',
      cartUrl: `https://${shop}/cart/add?id=${product.variants[0].id}&quantity=1`
    });

  } catch (error) {
    console.error('❌ [PRODUCTS.JS] Product creation error:', error);
    logError('/api/products', error, {
      statusCode: 500,
      ip,
      style: req.body?.style,
      size: req.body?.size,
      productType: req.body?.productType,
      hasTransformedImage: !!req.body?.transformedImage
    });
    res.status(500).json({ 
      error: 'Product creation failed',
      details: error.message 
    });
  }
};