module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(500).json({ error: 'Shopify access token not configured' });
    }

    // Pobierz WSZYSTKIE produkty
    const response = await fetch(`https://${shop}/admin/api/2023-10/products.json?limit=250`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [GET-ALL-PRODUCTS] API error:', errorText);
      return res.status(500).json({ 
        error: 'Failed to fetch products',
        details: errorText
      });
    }

    const data = await response.json();
    const products = data.products;

    console.log('📋 [GET-ALL-PRODUCTS] Found products:', products.length);

    // Znajdź produkty z opisami zawierającymi "rozmiary" lub "A2"
    const productsWithSizes = products.filter(product => {
      const description = product.body_html || '';
      return description.includes('rozmiary') || 
             description.includes('A2') || 
             description.includes('A3') || 
             description.includes('A4') || 
             description.includes('A5');
    });

    res.json({
      success: true,
      totalProducts: products.length,
      productsWithSizes: productsWithSizes.length,
      allProducts: products.map(product => ({
        id: product.id,
        title: product.title,
        handle: product.handle,
        descriptionLength: product.body_html ? product.body_html.length : 0,
        descriptionPreview: product.body_html ? product.body_html.replace(/<[^>]*>/g, '').substring(0, 200) : '',
        hasSizes: product.body_html ? (
          product.body_html.includes('rozmiary') || 
          product.body_html.includes('A2') || 
          product.body_html.includes('A3') || 
          product.body_html.includes('A4') || 
          product.body_html.includes('A5')
        ) : false
      })),
      productsWithSizes: productsWithSizes.map(product => ({
        id: product.id,
        title: product.title,
        handle: product.handle,
        description: product.body_html,
        descriptionText: product.body_html ? product.body_html.replace(/<[^>]*>/g, '').trim() : ''
      }))
    });

  } catch (error) {
    console.error('❌ [GET-ALL-PRODUCTS] Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
