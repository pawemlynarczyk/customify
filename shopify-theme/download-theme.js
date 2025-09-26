const fs = require('fs');
const path = require('path');

async function downloadTheme() {
  try {
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    const shop = 'customify-ok.myshopify.com';
    
    if (!accessToken) {
      console.error('❌ Missing SHOPIFY_ACCESS_TOKEN');
      return;
    }

    console.log('🔍 Fetching themes...');
    
    // Get themes
    const themesResponse = await fetch(`https://${shop}/admin/api/2023-10/themes.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    const themes = await themesResponse.json();
    console.log('📋 Available themes:', themes.themes.map(t => ({ id: t.id, name: t.name, role: t.role })));

    // Find main theme
    const mainTheme = themes.themes.find(theme => theme.role === 'main');
    if (!mainTheme) {
      console.error('❌ Main theme not found');
      return;
    }

    console.log(`🎯 Using main theme: ${mainTheme.name} (ID: ${mainTheme.id})`);

    // Get theme assets
    const assetsResponse = await fetch(`https://${shop}/admin/api/2023-10/themes/${mainTheme.id}/assets.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    const assets = await assetsResponse.json();
    console.log(`📁 Found ${assets.assets.length} assets`);

    // Create directories and download files
    for (const asset of assets.assets) {
      const filePath = path.join(__dirname, asset.key);
      const dir = path.dirname(filePath);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(filePath, asset.value || '');
      console.log(`✅ Downloaded: ${asset.key}`);
    }

    console.log('🎉 Theme downloaded successfully!');

  } catch (error) {
    console.error('❌ Error downloading theme:', error);
  }
}

downloadTheme();
