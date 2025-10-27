const fetch = require('node-fetch');

const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

async function checkProducts() {
  try {
    console.log('🔍 Sprawdzanie produktów...');
    
    const response = await fetch(`https://${shop}/admin/api/2023-10/products.json?limit=50`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      }
    });

    if (!response.ok) {
      console.error('❌ Błąd:', response.status, response.statusText);
      const text = await response.text();
      console.error(text);
      return;
    }

    const data = await response.json();
    const products = data.products || [];
    
    console.log(`📦 Znaleziono ${products.length} produktów:\n`);
    
    products.forEach(product => {
      console.log(`- ${product.title} (ID: ${product.id})`);
      console.log(`  Handle: ${product.handle}`);
      console.log(`  Status: ${product.status} | Published: ${product.published}`);
      console.log(`  URL: https://${shop}/products/${product.handle}\n`);
    });
    
    // Sprawdź czy jest produkt z karykaturami
    const caricatureProduct = products.find(p => 
      p.title.toLowerCase().includes('karykatura') || 
      p.handle.includes('caricature')
    );
    
    if (caricatureProduct) {
      console.log('✅ Produkt karykatury ZNALEZIONY!');
    } else {
      console.log('❌ Produkt karykatury NIE ZNALEZIONY - trzeba utworzyć');
    }
    
  } catch (error) {
    console.error('❌ Błąd:', error.message);
  }
}

checkProducts();
