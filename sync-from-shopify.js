const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function syncFromShopify() {
  try {
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
    
    if (!accessToken) {
      console.error('❌ Missing SHOPIFY_ACCESS_TOKEN');
      return;
    }

    console.log('🔍 Pobieranie theme z Shopify...');
    
    // Get themes
    const themesResponse = await fetch(`https://${shop}/admin/api/2023-10/themes.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    const themes = await themesResponse.json();
    console.log('📋 Themes response:', JSON.stringify(themes, null, 2));
    
    if (!themes.themes || !Array.isArray(themes.themes)) {
      throw new Error('Invalid themes response: ' + JSON.stringify(themes));
    }
    
    const mainTheme = themes.themes.find(theme => theme.role === 'main');
    
    if (!mainTheme) {
      console.error('❌ Main theme not found');
      return;
    }

    console.log(`🎯 Using main theme: ${mainTheme.name} (ID: ${mainTheme.id})`);

    // Lista plików do synchronizacji
    const filesToSync = [
      'layout/theme.liquid',
      'assets/customify.css',
      'assets/customify.js',
      'assets/base.css',
      'assets/products.css',
      'assets/hide-products.css',
      'assets/footer.css',
      'assets/reviews.css',
      'sections/product-information.liquid',
      'sections/product-recommendations.liquid',
      'sections/main-my-generations.liquid',
      'snippets/stylesheets.liquid'
    ];

    // Pobierz każdy plik
    for (const fileKey of filesToSync) {
      try {
        const assetResponse = await fetch(`https://${shop}/admin/api/2023-10/themes/${mainTheme.id}/assets.json?asset[key]=${encodeURIComponent(fileKey)}`, {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        });

        if (!assetResponse.ok) {
          console.warn(`⚠️ Nie znaleziono: ${fileKey}`);
          continue;
        }

        const assetData = await assetResponse.json();
        const asset = assetData.asset;

        if (!asset || !asset.value) {
          console.warn(`⚠️ Plik pusty: ${fileKey}`);
          continue;
        }

        // Mapowanie ścieżek Shopify → lokalne
        let localPath;
        if (fileKey.startsWith('layout/')) {
          localPath = path.join(__dirname, 'theme.liquid');
        } else if (fileKey.startsWith('assets/')) {
          const fileName = path.basename(fileKey);
          localPath = path.join(__dirname, 'shopify-theme/customify-theme/assets', fileName);
        } else if (fileKey.startsWith('sections/')) {
          const fileName = path.basename(fileKey);
          localPath = path.join(__dirname, 'shopify-theme/customify-theme/sections', fileName);
        } else if (fileKey.startsWith('snippets/')) {
          const fileName = path.basename(fileKey);
          localPath = path.join(__dirname, 'shopify-theme/customify-theme/snippets', fileName);
        } else {
          console.warn(`⚠️ Nieznana ścieżka: ${fileKey}`);
          continue;
        }

        // Utwórz katalog jeśli nie istnieje
        const dir = path.dirname(localPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Zapisz plik
        fs.writeFileSync(localPath, asset.value);
        console.log(`✅ Zsynchronizowano: ${fileKey} → ${localPath} (${asset.value.length} znaków)`);
      } catch (error) {
        console.error(`❌ Błąd przy ${fileKey}:`, error.message);
      }
    }

    console.log('🎉 Synchronizacja zakończona!');
    console.log('📝 Wszystkie pliki są teraz zsynchronizowane z Shopify');

  } catch (error) {
    console.error('❌ Błąd synchronizacji:', error);
  }
}

syncFromShopify();
