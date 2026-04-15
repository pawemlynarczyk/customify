const { SHOPIFY_API_VERSION } = require('../utils/shopifyConfig');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
    
    if (!accessToken) {
      return res.status(500).json({ error: 'Missing SHOPIFY_ACCESS_TOKEN' });
    }

    console.log('🔍 Pobieranie theme z Shopify...');
    
    // Get themes
    const themesResponse = await fetch(`https://${shop}/admin/api/${SHOPIFY_API_VERSION}/themes.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    const themes = await themesResponse.json();
    const mainTheme = themes.themes.find(theme => theme.role === 'main');
    
    if (!mainTheme) {
      return res.status(404).json({ error: 'Main theme not found' });
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

    const syncedFiles = [];

    // Pobierz każdy plik
    for (const fileKey of filesToSync) {
      try {
        const assetResponse = await fetch(`https://${shop}/admin/api/${SHOPIFY_API_VERSION}/themes/${mainTheme.id}/assets.json?asset[key]=${encodeURIComponent(fileKey)}`, {
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

        syncedFiles.push({
          key: fileKey,
          size: asset.value.length,
          content: asset.value
        });

        console.log(`✅ Pobrano: ${fileKey} (${asset.value.length} znaków)`);
      } catch (error) {
        console.error(`❌ Błąd przy ${fileKey}:`, error.message);
      }
    }

    res.json({
      success: true,
      theme: mainTheme.name,
      themeId: mainTheme.id,
      files: syncedFiles.map(f => ({ key: f.key, size: f.size })),
      filesContent: syncedFiles
    });

  } catch (error) {
    console.error('❌ Błąd synchronizacji:', error);
    res.status(500).json({ error: error.message });
  }
};
