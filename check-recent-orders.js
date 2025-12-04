const fetch = require('node-fetch');
const shop = 'customify-ok.myshopify.com';
const token = process.env.SHOPIFY_ACCESS_TOKEN;

(async () => {
  try {
    // Pobierz ostatnie 10 zamówień
    const response = await fetch(`https://${shop}/admin/api/2023-10/orders.json?limit=10&status=any`, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.orders && data.orders.length > 0) {
      console.log(`📦 Ostatnie ${data.orders.length} zamówień:\n`);
      
      for (const order of data.orders) {
        console.log(`Order ${order.name} (ID: ${order.id})`);
        console.log(`  Created: ${order.created_at}`);
        console.log(`  Items: ${order.line_items.length}`);
        
        for (const item of order.line_items) {
          console.log(`    - ${item.title}`);
          
          if (item.vendor === 'Customify' || item.product_type === 'Custom AI Product') {
            // To jest produkt Customify - sprawdź obrazki
            const productId = item.product_id;
            const productResponse = await fetch(`https://${shop}/admin/api/2023-10/products/${productId}.json`, {
              headers: {
                'X-Shopify-Access-Token': token,
                'Content-Type': 'application/json'
              }
            });
            
            const productData = await productResponse.json();
            if (productData.product) {
              const imageCount = productData.product.images?.length || 0;
              console.log(`      🖼️ Images: ${imageCount}`);
              if (imageCount === 0) {
                console.log(`      ❌ BRAK ZDJĘCIA!`);
              }
            }
          }
        }
        console.log('');
      }
    } else {
      console.log('❌ No orders found');
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
})();



