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
    
    console.log('🔍 [PRODUCTS.JS] Received data:', {
      finalPrice: finalPrice,
      style: style,
      size: size,
      originalProductId: originalProductId
    });
    
    if (finalPrice && finalPrice > 0) {
      totalPrice = finalPrice;
      console.log('✅ [PRODUCTS.JS] Using final price from frontend:', totalPrice, 'PLN');
    } else {
      // Fallback: pobierz cenę bazową z oryginalnego produktu
      let basePrice = 99.00;
      
      if (originalProductId) {
        try {
          console.log('💰 [PRODUCTS.JS] Fetching base price from original product:', originalProductId);
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
      
      totalPrice = basePrice;
      console.log('⚠️ [PRODUCTS.JS] Using fallback base price (no size added):', totalPrice, 'PLN');
    }

    console.log('📦 [PRODUCTS.JS] Creating product with AI image...');
    console.log('💰 [PRODUCTS.JS] Pricing details:', {
      style: style,
      size: size,
      finalPrice: finalPrice,
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

    // KROK 2: Zapisz obraz AI trwale na Vercel
    console.log('💾 [PRODUCTS.JS] Saving AI image permanently...');
    
    // Generuj unikalny identyfikator
    const customerName = (originalProductTitle || 'Customer').replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    const timestamp = Date.now().toString().slice(-8);
    const uniqueId = `${customerName}-${style}-${timestamp}`;
    
    // Zapisz obraz AI trwale w publicznym folderze
    const saveImageResponse = await fetch('https://customify-s56o.vercel.app/api/save-ai-image-public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: transformedImage,
        style: style,
        customerName: customerName,
        orderId: uniqueId
      })
    });

    if (!saveImageResponse.ok) {
      console.error('❌ [PRODUCTS.JS] Failed to save AI image permanently');
      return res.json({
        success: true,
        product: product,
        variantId: product.variants[0].id,
        productId: productId,
        warning: 'Product created but image not saved permanently',
        imageUrl: transformedImage
      });
    }

    const saveResult = await saveImageResponse.json();
    const permanentImageUrl = saveResult.imageUrl;
    
    console.log('✅ [PRODUCTS.JS] AI image saved permanently:', permanentImageUrl);

    // KROK 3: Pobierz obraz z trwałego URL
    console.log('📥 [PRODUCTS.JS] Downloading image from permanent storage...');
    console.log('🔗 [PRODUCTS.JS] Permanent URL:', permanentImageUrl);
    
    const imageResponse = await fetch(permanentImageUrl);
    console.log('📥 [PRODUCTS.JS] Image response status:', imageResponse.status);
    console.log('📥 [PRODUCTS.JS] Image response headers:', Object.fromEntries(imageResponse.headers.entries()));
    
    if (!imageResponse.ok) {
      console.error('❌ [PRODUCTS.JS] Failed to download image from permanent storage');
      console.error('❌ [PRODUCTS.JS] Response status:', imageResponse.status);
      console.error('❌ [PRODUCTS.JS] Response text:', await imageResponse.text());
      return res.json({
        success: true,
        product: product,
        variantId: product.variants[0].id,
        productId: productId,
        warning: 'Product created but image upload failed',
        imageUrl: permanentImageUrl
      });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    console.log('📤 [PRODUCTS.JS] Uploading image to NEW product...');
    
    const imageUploadData = {
      image: {
        attachment: base64Image,
        filename: `ai-${uniqueId}.webp`,
        alt: `AI ${style} for ${customerName} - ${timestamp}`,
        position: 1  // ✅ Ustaw jako główny obraz (pozycja 1)
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
    console.log('🖼️ [PRODUCTS.JS] Upload result details:', {
      imageId: uploadResult.image.id,
      imageSrc: uploadResult.image.src,
      imagePosition: uploadResult.image.position,
      imageAlt: uploadResult.image.alt
    });

    // ✅ USTAW OBRAZ JAKO GŁÓWNY OBRAZ PRODUKTU (żeby był widoczny w koszyku)
    // W Shopify, główny obraz to ten z position: 1, ale musimy też ustawić go jako featured image
    const setMainImageResponse = await fetch(`https://${shop}/admin/api/2023-10/products/${productId}.json`, {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product: {
          id: productId,
          featured_image: uploadResult.image.src  // ✅ Ustaw jako featured image
        }
      })
    });

    if (setMainImageResponse.ok) {
      console.log('✅ [PRODUCTS.JS] Image set as featured image');
    } else {
      const errorText = await setMainImageResponse.text();
      console.warn('⚠️ [PRODUCTS.JS] Failed to set featured image:', errorText);
    }

    res.json({ 
      success: true, 
      product: product,
      variantId: product.variants[0].id,
      productId: productId,
      imageUrl: shopifyImageUrl,  // ✅ URL z Shopify (w nowym produkcie)
      permanentImageUrl: permanentImageUrl,  // ✅ TRWAŁY URL na Vercel (nie wygaśnie!)
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