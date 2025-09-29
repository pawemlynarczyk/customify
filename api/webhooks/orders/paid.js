module.exports = async (req, res) => {
  console.log('🛒 [ORDER-PAID-WEBHOOK] Order paid webhook received');
  
  try {
    const order = req.body;
    console.log('🛒 [ORDER-PAID-WEBHOOK] Order ID:', order.id);
    console.log('🛒 [ORDER-PAID-WEBHOOK] Order line items:', order.line_items?.length || 0);
    
    // Znajdź produkty Customify w zamówieniu
    const customifyProducts = order.line_items?.filter(item => 
      item.vendor === 'Customify' || 
      item.product_type === 'Custom AI Product' ||
      item.title?.includes('Spersonalizowany')
    ) || [];
    
    console.log('🛒 [ORDER-PAID-WEBHOOK] Found Customify products:', customifyProducts.length);
    
    if (customifyProducts.length === 0) {
      console.log('🛒 [ORDER-PAID-WEBHOOK] No Customify products in this order');
      return res.status(200).json({ message: 'No Customify products to hide' });
    }
    
    const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    
    if (!accessToken) {
      console.error('❌ [ORDER-PAID-WEBHOOK] No access token');
      return res.status(500).json({ error: 'No access token' });
    }
    
    // Ukryj każdy produkt Customify
    for (const item of customifyProducts) {
      if (item.product_id) {
        console.log('🔒 [ORDER-PAID-WEBHOOK] Hiding product:', item.product_id);
        
        const hideData = {
          product: {
            id: parseInt(item.product_id),
            published: false
          }
        };
        
        const hideResponse = await fetch(`https://${shop}/admin/api/2023-10/products/${item.product_id}.json`, {
          method: 'PUT',
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(hideData)
        });
        
        if (hideResponse.ok) {
          console.log('✅ [ORDER-PAID-WEBHOOK] Product hidden:', item.product_id);
        } else {
          console.error('❌ [ORDER-PAID-WEBHOOK] Failed to hide product:', item.product_id);
        }
      }
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Customify products hidden after order payment',
      hiddenCount: customifyProducts.length
    });
    
  } catch (error) {
    console.error('❌ [ORDER-PAID-WEBHOOK] Error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};
