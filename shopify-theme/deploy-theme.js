const fs = require('fs');
const path = require('path');

// Wczytaj token z zmiennej środowiskowej
const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
const shop = 'customify-ok.myshopify.com';

if (!accessToken) {
  console.error('❌ Brak SHOPIFY_ACCESS_TOKEN w zmiennych środowiskowych');
  process.exit(1);
}

async function uploadThemeFile() {
  try {
    console.log('🚀 Wdrażanie motywu...');
    
    // Wczytaj plik theme.liquid
    const themePath = path.join(__dirname, 'customify-theme/layout/theme.liquid');
    const themeContent = fs.readFileSync(themePath, 'utf8');
    
    console.log('📁 Wczytano theme.liquid:', themeContent.length, 'znaków');
    
    // Upload do Shopify
    const response = await fetch(`https://${shop}/admin/api/2023-10/themes/186692927813/assets.json`, {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        asset: {
          key: 'layout/theme.liquid',
          value: themeContent
        }
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    const result = await response.json();
    console.log('✅ Motyw wdrożony pomyślnie!');
    console.log('📄 Asset:', result.asset.key);
    
  } catch (error) {
    console.error('❌ Błąd wdrażania motywu:', error.message);
    process.exit(1);
  }
}

uploadThemeFile();
