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
    const { title, description, price, images, variantTitle } = req.body;

    if (!title || !price) {
      return res.status(400).json({ error: 'Title and price are required' });
    }

    // This would typically use Shopify's GraphQL Admin API
    // For demo purposes, we'll return a mock response
    const product = {
      id: Date.now(),
      title: title,
      body_html: description || '',
      vendor: 'Customify',
      product_type: 'Custom Product',
      variants: [{
        id: Date.now() + 1,
        title: variantTitle || 'Default Title',
        price: price,
        inventory_quantity: 100
      }],
      images: images || []
    };

    res.json({ 
      success: true, 
      product: product 
    });
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: 'Product creation failed' });
  }
};
