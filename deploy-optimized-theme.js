const fs = require('fs');
const path = require('path');
const { syncThemeFiles } = require('./sync-theme-files');

async function deployOptimizedTheme() {
  // AUTOMATYCZNA SYNCHRONIZACJA PRZED WDROŻENIEM
  console.log('🔄 Synchronizacja plików theme przed wdrożeniem...');
  syncThemeFiles();
  try {
    console.log('🚀 Wdrażanie zoptymalizowanego motywu Customify...');
    
    // Wczytaj plik theme.liquid
    const themePath = path.join(__dirname, 'theme.liquid');
    const themeContent = fs.readFileSync(themePath, 'utf8');
    
    console.log('📁 Wczytano theme.liquid:', themeContent.length, 'znaków');
    
    // Wczytaj plik customify.css
    const cssPath = path.join(__dirname, 'shopify-theme/customify-theme/assets/customify.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    console.log('📁 Wczytano customify.css:', cssContent.length, 'znaków');
    
    // Wczytaj plik customify.js
    const jsPath = path.join(__dirname, 'shopify-theme/customify-theme/assets/customify.js');
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    
    console.log('📁 Wczytano customify.js:', jsContent.length, 'znaków');
    
    // Wczytaj plik base.css
    const baseCssPath = path.join(__dirname, 'shopify-theme/customify-theme/assets/base.css');
    const baseCssContent = fs.readFileSync(baseCssPath, 'utf8');
    
    console.log('📁 Wczytano base.css:', baseCssContent.length, 'znaków');
    
    // Wdróż przez API endpoint
    const response = await fetch('https://customify-s56o.vercel.app/api/update-theme-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        themeContent: themeContent,
        fileName: 'layout/theme.liquid'
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    const result = await response.json();
    console.log('✅ Motyw wdrożony pomyślnie!');
    console.log('📄 Theme:', result.theme);
    console.log('📄 File:', result.file);
    
    // Wdróż CSS
    const cssResponse = await fetch('https://customify-s56o.vercel.app/api/update-theme-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        themeContent: cssContent,
        fileName: 'assets/customify.css'
      })
    });
    
    if (cssResponse.ok) {
      console.log('✅ CSS wdrożony pomyślnie!');
    }
    
    // Wdróż JS
    const jsResponse = await fetch('https://customify-s56o.vercel.app/api/update-theme-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        themeContent: jsContent,
        fileName: 'assets/customify.js'
      })
    });
    
    if (jsResponse.ok) {
      console.log('✅ JavaScript wdrożony pomyślnie!');
    }
    
    // Wdróż base.css
    const baseCssResponse = await fetch('https://customify-s56o.vercel.app/api/update-theme-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        themeContent: baseCssContent,
        fileName: 'assets/base.css'
      })
    });
    
    if (baseCssResponse.ok) {
      console.log('✅ Base CSS wdrożony pomyślnie!');
    }
    
    console.log('🎉 Wszystkie pliki wdrożone pomyślnie!');
    console.log('🌐 Sprawdź zmiany na: https://lumly.pl/products/custom');
    
  } catch (error) {
    console.error('❌ Błąd wdrażania motywu:', error.message);
    process.exit(1);
  }
}

deployOptimizedTheme();
