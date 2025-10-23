const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { productId } = req.query;
  
  if (!productId) {
    return res.status(400).json({ error: 'Missing productId parameter' });
  }

  try {
    const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    const response = await fetch(`https://${shop}/admin/api/2023-10/products/${productId}.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: 'Failed to fetch product', details: errorText });
    }

    const data = await response.json();
    const product = data.product;

    return res.json({
      id: product.id,
      title: product.title,
      handle: product.handle,
      url: `https://lumly.pl/products/${product.handle}`
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

