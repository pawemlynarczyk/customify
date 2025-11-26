// Test endpoint - sprawdź czy metafield generation_ready istnieje
module.exports = async (req, res) => {
  const customerId = '24364235915589'; // Twoje ID
  const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  try {
    // Pobierz wszystkie metafields dla customera
    const response = await fetch(`https://${shop}/admin/api/2023-10/customers/${customerId}/metafields.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    res.json({
      success: true,
      allMetafields: data.metafields,
      generationReadyExists: data.metafields?.some(m => m.namespace === 'customify' && m.key === 'generation_ready'),
      generationReadyMetafield: data.metafields?.find(m => m.namespace === 'customify' && m.key === 'generation_ready')
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

