const https = require('https');
const SHOP = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

const assetsToDelete = [
  'assets/product-layout.css',
  'assets/hide-products-inline.css',
  'assets/collection-override.css',
  'assets/article-collection-inline.css',
  'assets/custom-collection.css',
  'assets/customify-frames.css',
  'assets/cart-lightbox.css',
  'assets/customer-reviews.css',
  'assets/footer-poradnik.css'
];

async function deleteAsset(themeId, assetKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${SHOP}`,
      port: 443,
      path: `/admin/api/2023-10/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(assetKey)}`,
      method: 'DELETE',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 404) {
          resolve({ success: true, statusCode: res.statusCode });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    // Pobierz główny theme
    const themeResponse = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: SHOP,
        port: 443,
        path: '/admin/api/2023-10/themes.json',
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json'
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.end();
    });

    const mainTheme = themeResponse.themes.find(t => t.role === 'main');
    if (!mainTheme) {
      console.error('❌ Nie znaleziono głównego theme');
      process.exit(1);
    }

    console.log(`🎯 Usuwanie plików CSS z theme: ${mainTheme.name} (ID: ${mainTheme.id})\n`);

    for (const assetKey of assetsToDelete) {
      try {
        await deleteAsset(mainTheme.id, assetKey);
        console.log(`✅ Usunięto: ${assetKey}`);
      } catch (error) {
        if (error.message.includes('404')) {
          console.log(`⚠️  Nie znaleziono (już usunięty?): ${assetKey}`);
        } else {
          console.error(`❌ Błąd przy ${assetKey}:`, error.message);
        }
      }
    }

    console.log('\n✅ Gotowe! Wszystkie pliki CSS usunięte z Shopify.');
  } catch (error) {
    console.error('❌ Błąd:', error.message);
    process.exit(1);
  }
}

main();
