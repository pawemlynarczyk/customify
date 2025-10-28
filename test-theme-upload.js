const fs = require('fs');
const path = require('path');

async function testThemeUpload() {
  try {
    const themePath = path.join(__dirname, 'theme.liquid');
    const themeContent = fs.readFileSync(themePath, 'utf8');
    
    console.log('📊 Rozmiar theme.liquid:', themeContent.length, 'znaków');
    console.log('🔍 Czy zawiera window.customifyLogError:', themeContent.includes('window.customifyLogError') ? 'TAK ✅' : 'NIE ❌');
    
    console.log('📤 Uploadowanie do Shopify...');
    const response = await fetch('https://customify-s56o.vercel.app/api/update-theme-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        themeContent: themeContent,
        fileName: 'layout/theme.liquid'
      })
    });
    
    const result = await response.json();
    console.log('📦 Odpowiedź API:', result);
    
    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Błąd:', error.message);
  }
}

testThemeUpload();
