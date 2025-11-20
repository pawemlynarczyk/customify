const fs = require('fs');
const path = require('path');

async function deploySection() {
  const sectionPath = 'shopify-theme/customify-theme/sections/main-my-generations.liquid';
  const sectionContent = fs.readFileSync(sectionPath, 'utf8');
  
  console.log('📤 [DEPLOY-SECTION] Wdrażam sekcję main-my-generations.liquid do Shopify...');
  console.log('📊 [DEPLOY-SECTION] Rozmiar pliku:', sectionContent.length, 'znaków');
  
  try {
    const response = await fetch('https://customify-s56o.vercel.app/api/update-theme-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        themeContent: sectionContent,
        fileName: 'sections/main-my-generations.liquid'
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ [DEPLOY-SECTION] Błąd wdrożenia:', error);
      process.exit(1);
    }
    
    const result = await response.json();
    console.log('✅ [DEPLOY-SECTION] Sekcja wdrożona pomyślnie!');
    console.log('📝 [DEPLOY-SECTION] Odpowiedź:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ [DEPLOY-SECTION] Błąd:', error.message);
    process.exit(1);
  }
}

deploySection();

