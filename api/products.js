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

    // Style nie wpływają na cenę - usunięto stylePrices

    const sizePrices = {
      'small': 0,
      'medium': 25,
      'large': 50,
      'xlarge': 100
    };

    const basePrice = 29.99;
    const totalPrice = Math.round((basePrice + (sizePrices[size] || 0)) * 100) / 100; // Napraw błąd zmiennoprzecinkowy

    const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(500).json({ error: 'Shopify access token not configured' });
    }

    console.log('📦 [PRODUCTS.JS] Creating product with AI image...');
    console.log('💰 [PRODUCTS.JS] Pricing details:', {
      style: style,
      size: size,
      stylePrice: 0, // Style nie wpływają na cenę
      sizePrice: sizePrices[size] || 0,
      basePrice: basePrice,
      totalPrice: totalPrice,
      shopifyPrice: totalPrice.toFixed(2) + ' PLN' // ✅ Format dla Shopify
    });

    // KROK 1: Utwórz produkt BEZ obrazka (najpierw potrzebujemy product ID)
    const productData = {
      product: {
        title: `Spersonalizowany ${originalProductTitle || 'Produkt'} - Styl ${style} - Rozmiar ${size || 'standard'}`,
        body_html: `
          <p><strong>Spersonalizowany produkt z AI</strong></p>
          <p><strong>Styl:</strong> ${style}</p>
          <p><strong>Rozmiar:</strong> ${size || 'standardowy'} (+${sizePrices[size] || 0} zł)</p>
          <p><strong>Cena bazowa:</strong> ${basePrice} zł</p>
          <p><strong>Cena całkowita:</strong> ${totalPrice} zł</p>
          <p>Twoje zdjęcie zostało przekształcone przez AI w stylu ${style}.</p>
        `,
        vendor: 'Customify',
        product_type: 'Custom AI Product',
        tags: ['custom', 'ai', 'personalized', style, 'no-recommendations', 'hidden-from-catalog'],
        published: true,
        published_scope: 'web',
        variants: [{
          title: `${style} - ${size || 'standard'} (${totalPrice} zł)`,
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

    console.log('📤 [PRODUCTS.JS] Uploading image to Shopify product...');

    // KROK 3: Upload obrazka BEZPOŚREDNIO do produktu (attachment method)
    // Generuj unikalny identyfikator z nazwą klienta, stylem i timestamp
    const customerName = (originalProductTitle || 'Customer').replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    const timestamp = Date.now().toString().slice(-8); // Ostatnie 8 cyfr timestamp
    const uniqueId = `${customerName}-${style}-${timestamp}`;
    
    const imageUploadData = {
      image: {
        attachment: base64Image,  // ✅ ATTACHMENT zamiast src!
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
        uploadError: uploadError
      });
    }

    const uploadResult = await uploadResponse.json();
    const shopifyImageUrl = uploadResult.image.src;

    console.log('✅ [PRODUCTS.JS] Image uploaded to Shopify:', shopifyImageUrl);

    // KROK 4: Odśwież dane produktu żeby mieć aktualny obrazek
    const finalProductResponse = await fetch(`https://${shop}/admin/api/2023-10/products/${productId}.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    const finalProduct = await finalProductResponse.json();

    res.json({ 
      success: true, 
      product: finalProduct.product,
      variantId: finalProduct.product.variants[0].id,
      productId: productId,
      imageUrl: shopifyImageUrl,  // ✅ Stały URL z Shopify CDN
      orderId: uniqueId,  // ✅ Unikalny identyfikator zamówienia
      message: 'Produkt został utworzony z obrazkiem AI!',
      cartUrl: `https://${shop}/cart/add?id=${finalProduct.product.variants[0].id}&quantity=1`
    });

  } catch (error) {
    console.error('❌ [PRODUCTS.JS] Product creation error:', error);
    res.status(500).json({ 
      error: 'Product creation failed',
      details: error.message 
    });
  }
};