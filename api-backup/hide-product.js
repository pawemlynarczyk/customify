module.exports = async (req, res) => {
  console.log('🔒 [HIDE-PRODUCT.JS] Endpoint called');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    return res.json({ 
      message: 'Hide Product API endpoint is working',
      methods: ['POST'],
      usage: 'Send POST request with { "productId": "123" }'
    });
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ 
        error: 'Missing required field: productId' 
      });
    }

    const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(500).json({ error: 'Shopify access token not configured' });
    }

    console.log('🔒 [HIDE-PRODUCT.JS] Hiding product:', productId);

    // Ukryj produkt (ustaw published: false)
    const hideData = {
      product: {
        id: parseInt(productId),
        published: false
      }
    };

    const hideResponse = await fetch(`https://${shop}/admin/api/2023-10/products/${productId}.json`, {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(hideData)
    });

    if (!hideResponse.ok) {
      const errorText = await hideResponse.text();
      console.error('❌ [HIDE-PRODUCT.JS] Product hide error:', errorText);
      return res.status(500).json({ 
        error: 'Failed to hide product',
        details: errorText
      });
    }

    const hiddenProduct = await hideResponse.json();

    console.log('✅ [HIDE-PRODUCT.JS] Product hidden successfully:', productId);

    res.json({ 
      success: true, 
      productId: productId,
      message: 'Produkt został ukryty z katalogu',
      product: hiddenProduct.product
    });

  } catch (error) {
    console.error('❌ [HIDE-PRODUCT.JS] Product hide error:', error);
    res.status(500).json({ 
      error: 'Product hide failed',
      details: error.message 
    });
  }
};
