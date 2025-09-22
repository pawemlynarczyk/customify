module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

    // Style pricing
    const stylePrices = {
      'van gogh': 50,
      'picasso': 75,
      'monet': 60,
      'anime': 40,
      'cyberpunk': 80,
      'watercolor': 45
    };

    const basePrice = 29.99; // Base price for custom product
    const totalPrice = basePrice + (stylePrices[style] || 0);

    // Create product in Shopify
    const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(500).json({ error: 'Shopify access token not configured' });
    }

    // First, upload the AI image to Shopify as a file
    let shopifyImageUrl = transformedImage; // fallback to original URL
    
    try {
      console.log('📤 [PRODUCTS.JS] Uploading AI image to Shopify...');
      
      // Download image from Replicate
      const imageResponse = await fetch(transformedImage);
      if (imageResponse.ok) {
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        
        // Upload to Shopify using REST API
        const uploadResponse = await fetch(`https://${shop}/admin/api/2023-10/files.json`, {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            file: {
              filename: `ai-${style}-${Date.now()}.webp`,
              content_type: 'image/webp',
              contents: base64Image
            }
          })
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          shopifyImageUrl = uploadResult.file.url;
          console.log('✅ [PRODUCTS.JS] Image uploaded to Shopify:', shopifyImageUrl);
        } else {
          console.log('⚠️ [PRODUCTS.JS] Failed to upload image, using original URL');
        }
      }
    } catch (error) {
      console.log('⚠️ [PRODUCTS.JS] Error uploading image:', error.message);
    }

    const productData = {
      product: {
        title: `Spersonalizowany ${originalProductTitle || 'Produkt'} - Styl ${style}`,
        body_html: `
          <p><strong>Spersonalizowany produkt z AI</strong></p>
          <p><strong>Styl:</strong> ${style}</p>
          <p><strong>Oryginalny produkt:</strong> ${originalProductTitle || 'N/A'}</p>
          <p>Twoje zdjęcie zostało przekształcone przez AI w stylu ${style}.</p>
        `,
        vendor: 'Customify',
        product_type: 'Custom AI Product',
        tags: ['custom', 'ai', 'personalized', style, 'hidden', 'no-search'],
        published: true, // MUSI BYĆ PUBLIKOWANY ŻEBY DZIAŁAŁ KOSZYK
        published_scope: 'web', // TYLKO WEB (nie w API)
        variants: [{
          title: `Styl ${style}`,
          price: totalPrice.toString(),
          inventory_quantity: 100,
          inventory_management: 'shopify',
          fulfillment_service: 'manual'
        }],
        images: [{
          src: shopifyImageUrl,
          alt: `AI transformed image in ${style} style`
        }]
      }
    };

    // Create product via Shopify Admin API
    const response = await fetch(`https://${shop}/admin/api/2023-10/products.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [PRODUCTS.JS] Shopify API error:', response.status, errorText);
      console.error('❌ [PRODUCTS.JS] Product data sent:', JSON.stringify(productData, null, 2));
      return res.status(500).json({ 
        error: 'Failed to create product in Shopify',
        details: errorText,
        status: response.status
      });
    }

    const createdProduct = await response.json();
    const product = createdProduct.product;

    console.log('🔍 [PRODUCTS.JS] Created product response:', JSON.stringify(product, null, 2));
    console.log('🔍 [PRODUCTS.JS] Product ID:', product.id);
    console.log('🔍 [PRODUCTS.JS] Product published:', product.published);
    console.log('🔍 [PRODUCTS.JS] Product status:', product.status);
    console.log('🔍 [PRODUCTS.JS] Product images:', product.images);
    console.log('🔍 [PRODUCTS.JS] Transformed image URL:', transformedImage);
    console.log('🔍 [PRODUCTS.JS] Variants count:', product.variants ? product.variants.length : 'NO VARIANTS');
    console.log('🔍 [PRODUCTS.JS] Variants:', product.variants);
    
    if (product.variants && product.variants.length > 0) {
      console.log('🔍 [PRODUCTS.JS] Variant ID:', product.variants[0].id);
      console.log('🔍 [PRODUCTS.JS] Variant title:', product.variants[0].title);
      console.log('🔍 [PRODUCTS.JS] Variant price:', product.variants[0].price);
    } else {
      console.error('❌ [PRODUCTS.JS] NO VARIANTS FOUND!');
    }

    res.json({ 
      success: true, 
      product: product,
      variantId: product.variants[0].id,
      productId: product.id,
      shopifyImageUrl: shopifyImageUrl, // Stały URL z Shopify
      message: 'Produkt został utworzony! Możesz go teraz dodać do koszyka.',
      cartUrl: `https://${shop}/cart/add?id=${product.variants[0].id}&quantity=1&properties[AI Style]=${encodeURIComponent(style)}&properties[Original Product]=${encodeURIComponent(originalProductTitle || '')}&properties[Customization Type]=AI Generated`
    });

  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ 
      error: 'Product creation failed',
      details: error.message 
    });
  }
};
