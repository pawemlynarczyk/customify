const https = require('https');
const fs = require('fs');
const path = require('path');

// Pobierz SHOPIFY_ACCESS_TOKEN z Vercel
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOP = 'customify-ok';

if (!SHOPIFY_ACCESS_TOKEN) {
  console.error('❌ Missing SHOPIFY_ACCESS_TOKEN');
  console.log('💡 Uruchom: vercel env pull .env.local');
  process.exit(1);
}

console.log('🔍 Pobieranie ORYGINALNEGO product-information.liquid z Shopify...');

const options = {
  hostname: `${SHOP}.myshopify.com`,
  port: 443,
  path: '/admin/api/2023-10/themes/186692927813/assets.json',
  method: 'GET',
  headers: {
    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      const assets = response.assets || [];
      
      console.log(`📊 Znaleziono ${assets.length} plików w theme`);
      
      // Znajdź product-information.liquid
      const productInfo = assets.find(asset => 
        asset.key === 'sections/product-information.liquid'
      );
      
      if (productInfo) {
        console.log('✅ Znaleziono product-information.liquid!');
        console.log(`📏 Rozmiar: ${productInfo.value ? productInfo.value.length : 0} znaków`);
        
        if (productInfo.value && productInfo.value.length > 0) {
          // Zapisz do pliku
          const filePath = path.join(__dirname, 'shopify-theme/customify-theme/sections/product-information.liquid');
          fs.writeFileSync(filePath, productInfo.value);
          console.log('💾 Zapisano do: shopify-theme/customify-theme/sections/product-information.liquid');
          
          // Pokaż pierwsze linie
          const lines = productInfo.value.split('\n');
          console.log('\n📄 Pierwsze 10 linii:');
          lines.slice(0, 10).forEach((line, i) => {
            console.log(`${i + 1}: ${line}`);
          });
        } else {
          console.log('⚠️ Plik jest pusty na Shopify!');
        }
      } else {
        console.log('❌ Nie znaleziono product-information.liquid');
        console.log('📋 Dostępne pliki sections:');
        assets
          .filter(asset => asset.key.startsWith('sections/'))
          .forEach(asset => {
            console.log(`  - ${asset.key}`);
          });
      }
    } catch (error) {
      console.error('❌ Błąd parsowania JSON:', error.message);
      console.log('📄 Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Błąd request:', error.message);
});

req.end();
