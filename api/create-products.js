const { SHOPIFY_API_VERSION } = require('../utils/shopifyConfig');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    return res.json({ 
      message: 'Create Products API endpoint is working',
      methods: ['POST'],
      usage: 'Send POST request to create new products'
    });
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(500).json({ error: 'Shopify access token not configured' });
    }

    console.log('🛍️ [CREATE-PRODUCTS] Creating 3 new products...');

    // Konfiguracja 4 produktów z różnymi stylami AI
    const products = [
      {
        handle: 'zabawne-style',
        title: 'Zabawne Style AI - Ghibli, Pixar i więcej',
        description: 'Przekształć swoje zdjęcie w zabawne style z filmów animowanych. Wybierz spośród stylów Ghibli, Pixar, Disney i innych popularnych animacji.',
        styles: ['ghibli', 'pixar', 'disney', 'anime', 'cartoon', 'kawaii'],
        tags: ['custom', 'ai', 'funny', 'animation', 'cartoon', 'no-recommendations']
      },
      {
        handle: 'krol-krolowa',
        title: 'Król i Królowa - Portrety Królewskie',
        description: 'Przekształć swoje zdjęcie w majestatyczny portret królewski. Dodaj koronę, królewskie szaty i królewską oprawę do swojego zdjęcia.',
        styles: ['royal-portrait', 'king-crown', 'queen-crown', 'medieval-royal', 'renaissance-royal', 'baroque-royal'],
        tags: ['custom', 'ai', 'royal', 'king', 'queen', 'crown', 'no-recommendations']
      },
      {
        handle: 'koty-krolewskie',
        title: 'Koty Królewskie - Zwierzęta w Koronach',
        description: 'Przekształć zdjęcie swojego kota w królewskiego władcę. Dodaj koronę, królewskie szaty i majestatyczną oprawę dla Twojego pupila.',
        styles: ['royal-cat', 'crown-cat', 'medieval-cat', 'renaissance-cat', 'baroque-cat', 'victorian-cat'],
        tags: ['custom', 'ai', 'cat', 'royal', 'crown', 'pet', 'no-recommendations']
      },
      {
        handle: 'rodzina-ai',
        title: 'Rodzina AI - Składanie Zdjęć Grupowych',
        description: 'Stwórz piękne zdjęcie rodzinne składając pojedyncze zdjęcia w jedną harmonijną kompozycję. Idealne dla rodzin, które nie mogą się spotkać.',
        styles: ['family-composition', 'group-photo', 'family-portrait', 'wedding-group', 'reunion-photo', 'generation-photo'],
        tags: ['custom', 'ai', 'family', 'group', 'composition', 'reunion', 'no-recommendations']
      }
    ];

    const createdProducts = [];

    for (const productConfig of products) {
      console.log(`🛍️ [CREATE-PRODUCTS] Creating product: ${productConfig.title}`);

      const productData = {
        product: {
          title: productConfig.title,
          body_html: `
            <p><strong>${productConfig.title}</strong></p>
            <p>${productConfig.description}</p>
            <p><strong>Dostępne style AI:</strong></p>
            <ul>
              ${productConfig.styles.map(style => `<li>${style}</li>`).join('')}
            </ul>
            <p>Wgraj swoje zdjęcie i wybierz styl AI, a my wydrukujemy je jako obrazek na prezent.</p>
          `,
          vendor: 'Customify',
          product_type: 'Custom AI Product',
          tags: productConfig.tags,
          published: true,
          published_scope: 'web',
          variants: [{
            title: 'Standardowy (99 zł)',
            price: '99.00',
            inventory_quantity: 100,
            inventory_management: 'shopify',
            fulfillment_service: 'manual'
          }]
        }
      };

      const createResponse = await fetch(`https://${shop}/admin/api/${SHOPIFY_API_VERSION}/products.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error(`❌ [CREATE-PRODUCTS] Failed to create product ${productConfig.title}:`, errorText);
        continue;
      }

      const createdProduct = await createResponse.json();
      const product = createdProduct.product;
      
      createdProducts.push({
        id: product.id,
        handle: product.handle,
        title: product.title,
        styles: productConfig.styles
      });

      console.log(`✅ [CREATE-PRODUCTS] Created product: ${product.title} (ID: ${product.id})`);
    }

    console.log(`🎉 [CREATE-PRODUCTS] Successfully created ${createdProducts.length} products`);

    res.json({
      success: true,
      message: `Successfully created ${createdProducts.length} products`,
      products: createdProducts
    });

  } catch (error) {
    console.error('❌ [CREATE-PRODUCTS] Error:', error);
    res.status(500).json({ 
      error: 'Failed to create products',
      details: error.message
    });
  }
};
