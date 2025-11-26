#!/usr/bin/env node

/**
 * Deploy customify.js to Shopify theme assets
 * Wdraża plik customify.js do Shopify CDN
 */

const fs = require('fs');
const path = require('path');

async function deployCustomifyJS() {
  try {
    console.log('📦 [DEPLOY] Wdrażanie customify.js do Shopify...');
    
    // Odczytaj plik customify.js
    const customifyPath = path.join(__dirname, 'shopify-theme/customify-theme/assets/customify.js');
    const customifyContent = fs.readFileSync(customifyPath, 'utf8');
    
    console.log(`📄 [DEPLOY] Odczytano plik: ${customifyPath}`);
    console.log(`📊 [DEPLOY] Rozmiar: ${customifyContent.length} znaków`);
    
    // Wyślij do API
    const response = await fetch('https://customify-s56o.vercel.app/api/update-theme-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        themeContent: customifyContent,
        fileName: 'assets/customify.js'
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ [DEPLOY] customify.js wdrożony pomyślnie!');
      console.log('🎯 [DEPLOY] URL:', result.url || 'N/A');
      console.log('');
      console.log('🔄 [DEPLOY] Wyczyść cache przeglądarki (Ctrl+Shift+R) żeby zobaczyć zmiany');
    } else {
      console.error('❌ [DEPLOY] Błąd wdrożenia:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ [DEPLOY] Błąd:', error.message);
    process.exit(1);
  }
}

deployCustomifyJS();

