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

    // Pobierz produkt "custom" (handle: custom)
    const response = await fetch(`https://${shop}/admin/api/2023-10/products.json?handle=custom`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [GET-PRODUCT-DESCRIPTION] API error:', errorText);
      return res.status(500).json({ 
        error: 'Failed to fetch product',
        details: errorText
      });
    }

    const data = await response.json();
    const products = data.products;

    if (!products || products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];

    console.log('📋 [GET-PRODUCT-DESCRIPTION] Product found:', {
      id: product.id,
      title: product.title,
      handle: product.handle,
      descriptionLength: product.body_html ? product.body_html.length : 0
    });

    res.json({
      success: true,
      product: {
        id: product.id,
        title: product.title,
        handle: product.handle,
        body_html: product.body_html,
        body_html_length: product.body_html ? product.body_html.length : 0,
        // Raw text bez HTML
        body_text: product.body_html ? product.body_html.replace(/<[^>]*>/g, '').trim() : '',
        body_text_length: product.body_html ? product.body_html.replace(/<[^>]*>/g, '').trim().length : 0
      }
    });

  } catch (error) {
    console.error('❌ [GET-PRODUCT-DESCRIPTION] Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
