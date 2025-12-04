const fetch = require('node-fetch');
const shop = 'customify-ok.myshopify.com';
const token = process.env.SHOPIFY_ACCESS_TOKEN;

(async () => {
  try {
    // Pobierz zamówienia z numerem 1125
    const response = await fetch(`https://${shop}/admin/api/2023-10/orders.json?name=1125&status=any`, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.orders && data.orders.length > 0) {
      const order = data.orders[0];
      console.log('📦 Order #1125:');
      console.log('ID:', order.id);
      console.log('Name:', order.name);
      console.log('Created:', order.created_at);
      console.log('Line items:', order.line_items.length);
      
      order.line_items.forEach((item, i) => {
        console.log(`\nItem ${i+1}:`);
        console.log('  Title:', item.title);
        console.log('  Product ID:', item.product_id);
        console.log('  Variant ID:', item.variant_id);
        
        // Pobierz produkt żeby sprawdzić obrazki
        console.log('  Checking product images...');
      });
      
      // Pobierz pierwszy produkt żeby sprawdzić obrazki
      if (order.line_items[0]) {
        const productId = order.line_items[0].product_id;
        const productResponse = await fetch(`https://${shop}/admin/api/2023-10/products/${productId}.json`, {
          headers: {
            'X-Shopify-Access-Token': token,
            'Content-Type': 'application/json'
          }
        });
        
        const productData = await productResponse.json();
        if (productData.product) {
          console.log('\n🖼️ Product images:', productData.product.images?.length || 0);
          if (productData.product.images && productData.product.images.length > 0) {
            productData.product.images.forEach((img, i) => {
              console.log(`  Image ${i+1}: ${img.src?.substring(0, 80)}`);
            });
          } else {
            console.log('  ❌ NO IMAGES!');
          }
        }
      }
    } else {
      console.log('❌ Order #1125 not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
})();



