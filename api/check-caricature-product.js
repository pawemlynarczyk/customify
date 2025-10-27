module.exports = async (req, res) => {
  const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!accessToken) {
    return res.status(500).json({ error: 'Shopify access token not configured' });
  }

  try {
    console.log('🔍 [CHECK-CARICATURE] Sprawdzanie produktów...');
    
    // Szukaj wszystkich produktów
    const response = await fetch(`https://${shop}/admin/api/2023-10/products.json?limit=100`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [CHECK-CARICATURE] Błąd:', errorText);
      return res.status(500).json({ error: 'Failed to fetch products', details: errorText });
    }

    const data = await response.json();
    const products = data.products || [];
    
    console.log(`📦 [CHECK-CARICATURE] Znaleziono ${products.length} produktów`);
    
    // Szukaj produktów z karykaturami
    const caricatureProducts = products.filter(p => 
      p.title.toLowerCase().includes('karykatura') || 
      p.handle.includes('caricature') ||
      p.product_type === 'Custom AI Caricature'
    );
    
    // Wszystkie produkty
    const allProducts = products.map(p => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      status: p.status,
      published: p.published,
      url: `https://${shop}/products/${p.handle}`
    }));

    res.json({
      success: true,
      total: products.length,
      caricatureProducts: caricatureProducts.length,
      products: allProducts,
      foundCaricature: caricatureProducts.map(p => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
        status: p.status,
        published: p.published,
        url: `https://${shop}/products/${p.handle}`
      }))
    });

  } catch (error) {
    console.error('❌ [CHECK-CARICATURE] Błąd:', error);
    res.status(500).json({ 
      error: 'Failed to check products',
      details: error.message 
    });
  }
};
