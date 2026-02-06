const https = require('https');
const fs = require('fs');
require('dotenv').config();

const SHOP = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || fs.readFileSync('.env', 'utf8').match(/SHOPIFY_ACCESS_TOKEN=(.+)/)?.[1]?.trim();

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

function httpsRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  if (!SHOPIFY_ACCESS_TOKEN) {
    console.error('❌ Brak SHOPIFY_ACCESS_TOKEN');
    process.exit(1);
  }

  try {
    // Pobierz główny theme
    const themeRes = await httpsRequest({
      hostname: SHOP,
      path: '/admin/api/2023-10/themes.json',
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    const mainTheme = themeRes.body.themes?.find(t => t.role === 'main');
    if (!mainTheme) {
      console.error('❌ Nie znaleziono głównego theme');
      process.exit(1);
    }

    console.log(`🎯 Usuwanie plików CSS z theme: ${mainTheme.name} (ID: ${mainTheme.id})\n`);

    for (const assetKey of assetsToDelete) {
      try {
        const deleteRes = await httpsRequest({
          hostname: SHOP,
          path: `/admin/api/2023-10/themes/${mainTheme.id}/assets.json?asset[key]=${encodeURIComponent(assetKey)}`,
          method: 'DELETE',
          headers: {
            'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
            'Content-Type': 'application/json'
          }
        });

        if (deleteRes.statusCode === 200) {
          console.log(`✅ Usunięto: ${assetKey}`);
        } else if (deleteRes.statusCode === 404) {
          console.log(`⚠️  Nie znaleziono (już usunięty?): ${assetKey}`);
        } else {
          console.log(`⚠️  Status ${deleteRes.statusCode} dla: ${assetKey}`);
        }
      } catch (error) {
        console.log(`⚠️  ${assetKey}: ${error.message}`);
      }
    }

    console.log('\n✅ Gotowe! Wszystkie pliki CSS usunięte z Shopify.');
  } catch (error) {
    console.error('❌ Błąd:', error.message);
    process.exit(1);
  }
}

main();
