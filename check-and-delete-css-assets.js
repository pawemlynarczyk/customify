const https = require('https');
const fs = require('fs');

// Pobierz token z .env lub zmiennych środowiskowych
let SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
if (!SHOPIFY_ACCESS_TOKEN && fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const match = envContent.match(/SHOPIFY_ACCESS_TOKEN=(.+)/);
  if (match) SHOPIFY_ACCESS_TOKEN = match[1].trim();
}

const SHOP = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';

const assetsToCheck = [
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

function httpsRequest(options) {
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
    req.end();
  });
}

async function checkAndDeleteAsset(themeId, assetKey) {
  try {
    // Sprawdź czy plik istnieje
    const checkRes = await httpsRequest({
      hostname: SHOP,
      path: `/admin/api/2023-10/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(assetKey)}`,
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    if (checkRes.statusCode === 200 && checkRes.body.asset) {
      console.log(`⚠️  Znaleziono: ${assetKey}`);
      
      // Usuń plik
      const deleteRes = await httpsRequest({
        hostname: SHOP,
        path: `/admin/api/2023-10/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(assetKey)}`,
        method: 'DELETE',
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json'
        }
      });

      if (deleteRes.statusCode === 200) {
        console.log(`✅ Usunięto: ${assetKey}`);
        return true;
      } else {
        console.log(`❌ Błąd usuwania (${deleteRes.statusCode}): ${assetKey}`);
        return false;
      }
    } else {
      console.log(`✅ Nie znaleziono (OK): ${assetKey}`);
      return false;
    }
  } catch (error) {
    console.log(`⚠️  Błąd przy ${assetKey}: ${error.message}`);
    return false;
  }
}

async function main() {
  if (!SHOPIFY_ACCESS_TOKEN) {
    console.error('❌ Brak SHOPIFY_ACCESS_TOKEN');
    console.error('Sprawdź zmienną środowiskową lub plik .env');
    process.exit(1);
  }

  try {
    console.log('🔍 Sprawdzanie plików CSS na Shopify...\n');

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

    if (themeRes.statusCode !== 200) {
      console.error('❌ Błąd pobierania themes:', themeRes.body);
      process.exit(1);
    }

    const mainTheme = themeRes.body.themes?.find(t => t.role === 'main');
    if (!mainTheme) {
      console.error('❌ Nie znaleziono głównego theme');
      process.exit(1);
    }

    console.log(`🎯 Theme: ${mainTheme.name} (ID: ${mainTheme.id})\n`);

    let deletedCount = 0;
    for (const assetKey of assetsToCheck) {
      const deleted = await checkAndDeleteAsset(mainTheme.id, assetKey);
      if (deleted) deletedCount++;
    }

    console.log(`\n✅ Gotowe! Usunięto ${deletedCount} plików CSS z Shopify.`);
  } catch (error) {
    console.error('❌ Błąd:', error.message);
    process.exit(1);
  }
}

main();
