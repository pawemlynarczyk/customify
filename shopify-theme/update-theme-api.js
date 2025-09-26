const fs = require('fs');
const path = require('path');

async function updateThemeViaAPI() {
  try {
    console.log('🚀 Updating theme via API...');
    
    // Read the theme.liquid file
    const themePath = path.join(__dirname, '..', 'theme.liquid');
    const themeContent = fs.readFileSync(themePath, 'utf8');
    
    console.log(`📄 Read theme.liquid (${themeContent.length} characters)`);
    
    // Update via API
    const response = await fetch('https://customify-s56o.vercel.app/api/update-theme', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        themeContent: themeContent,
        fileName: 'layout/theme.liquid'
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ API Error:', error);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Theme updated successfully!');
    console.log('📋 Result:', result);
    
  } catch (error) {
    console.error('❌ Error updating theme:', error);
  }
}

updateThemeViaAPI();
