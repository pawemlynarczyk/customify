const { checkRateLimit, getClientIP } = require('../utils/vercelRateLimiter');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
    originalProductTitle,
    originalProductId
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

    // ✅ POBIERZ CENĘ BAZOWĄ Z ORYGINALNEGO PRODUKTU SHOPIFY
    let basePrice = 99.00; // Domyślna cena fallback
    
    if (originalProductId) {
      try {
        console.log('💰 [PRODUCTS.JS] Fetching price from original product:', originalProductId);
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
          console.log('✅ [PRODUCTS.JS] Base price from Shopify:', basePrice, 'PLN');
        } else {
          console.warn('⚠️ [PRODUCTS.JS] Could not fetch original product price, using fallback:', basePrice, 'PLN');
        }
      } catch (priceError) {
        console.error('❌ [PRODUCTS.JS] Error fetching price:', priceError.message);
        console.log('⚠️ [PRODUCTS.JS] Using fallback price:', basePrice, 'PLN');
      }
    } else {
      console.warn('⚠️ [PRODUCTS.JS] No originalProductId provided, using fallback price:', basePrice, 'PLN');
    }

    // Użyj bazowej ceny produktu
    const totalPrice = basePrice;
    console.log('💰 [PRODUCTS.JS] Using base price:', totalPrice, 'PLN');

    console.log('📦 [PRODUCTS.JS] Creating product with AI image...');
    console.log('💰 [PRODUCTS.JS] Pricing details:', {
      style: style,
      size: size,
      basePrice: basePrice,
      totalPrice: totalPrice,
      shopifyPrice: totalPrice.toFixed(2) + ' PLN' // ✅ Format dla Shopify
    });

    // KROK 1: Utwórz produkt BEZ obrazka (najpierw potrzebujemy product ID)
    const productData = {
      product: {
        title: `Spersonalizowany ${originalProductTitle || 'Produkt'} - Styl ${style} - Rozmiar ${size?.toUpperCase() || 'standard'}`,
        body_html: `
          <p><strong>Spersonalizowany produkt z AI</strong></p>
          <p><strong>Styl:</strong> ${style}</p>
          <p><strong>Rozmiar:</strong> ${size?.toUpperCase() || 'standardowy'}</p>
          <p><strong>Cena bazowa:</strong> ${basePrice} zł</p>
          <p><strong>Cena całkowita:</strong> ${totalPrice} zł</p>
          <p>Twoje zdjęcie zostało przekształcone przez AI w stylu ${style}.</p>
        `,
        vendor: 'Customify',
        product_type: 'Custom AI Product',
        tags: ['custom', 'ai', 'personalized', style, 'no-recommendations', 'hidden-from-catalog', 'customer-order'],
        status: 'active', // ✅ ACTIVE - MUSI być active żeby dodać do koszyka (Shopify zwraca 422 dla draft)
        published: true, // ✅ MUSI być published=true żeby variant działał w koszyku
        published_scope: 'web',
        variants: [{
          title: `${style} - ${size?.toUpperCase() || 'standard'} (${totalPrice} zł)`,
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

    console.log('✅ [PRODUCTS.JS] Product created, ID:', productId);

    // KROK 2: Pobierz obrazek z Replicate
    console.log('📥 [PRODUCTS.JS] Downloading image from Replicate...');
    const imageResponse = await fetch(transformedImage);
    
    if (!imageResponse.ok) {
      console.error('❌ [PRODUCTS.JS] Failed to download image from Replicate');
      return res.json({
        success: true,
        product: product,
        variantId: product.variants[0].id,
        productId: productId,
        warning: 'Product created but image upload failed',
        imageUrl: transformedImage
      });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    console.log('📤 [PRODUCTS.JS] Uploading image to NEW product...');

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

    console.log('✅ [PRODUCTS.JS] Image uploaded to NEW product:', shopifyImageUrl);

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
    res.status(500).json({ 
      error: 'Product creation failed',
      details: error.message 
    });
  }
};