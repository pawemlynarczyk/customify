const fs = require('fs');
const path = require('path');

async function deployTemplate() {
  const templatePath = 'shopify-theme/customify-theme/templates/page.my-generations.json';
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  
  console.log('📤 [DEPLOY-TEMPLATE] Wdrażam template page.my-generations.json do Shopify...');
  console.log('📊 [DEPLOY-TEMPLATE] Rozmiar pliku:', templateContent.length, 'znaków');
  
  try {
    const response = await fetch('https://customify-s56o.vercel.app/api/update-theme-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        themeContent: templateContent,
        fileName: 'templates/page.my-generations.json'
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ [DEPLOY-TEMPLATE] Błąd wdrożenia:', error);
      process.exit(1);
    }
    
    const result = await response.json();
    console.log('✅ [DEPLOY-TEMPLATE] Template wdrożony pomyślnie!');
    console.log('📝 [DEPLOY-TEMPLATE] Odpowiedź:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ [DEPLOY-TEMPLATE] Błąd:', error.message);
    process.exit(1);
  }
}

deployTemplate();

