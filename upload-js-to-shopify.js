const fs = require('fs');
const path = require('path');

async function uploadCustomifyJS() {
  try {
    console.log('🔍 1. Pobieranie aktualnego customify.js z Shopify (backup)...');
    
    // Pobierz aktualny plik (backup)
    const getResponse = await fetch('https://customify-s56o.vercel.app/api/update-theme-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'assets/customify.js',
        action: 'get'
      })
    });
    
    const getResult = await getResponse.json();
    console.log('📦 Backup result:', getResult.success ? '✅ Pobrano' : '❌ Błąd');
    
    console.log('📁 2. Wczytywanie nowego customify.js z lokalnego pliku...');
    const jsPath = path.join(__dirname, 'shopify-theme/customify-theme/assets/customify.js');
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    
    console.log('📊 Rozmiar nowego pliku:', jsContent.length, 'znaków');
    console.log('🔍 Sprawdzanie czy funkcja logErrorToAnalytics jest w pliku...');
    const hasFunction = jsContent.includes('logErrorToAnalytics');
    console.log('✅ Funkcja znaleziona:', hasFunction ? 'TAK ✅' : 'NIE ❌');
    
    if (!hasFunction) {
      console.error('❌ BŁĄD: Funkcja logErrorToAnalytics nie znaleziona w pliku! Przerywam.');
      process.exit(1);
    }
    
    console.log('📤 3. Uploadowanie nowego customify.js do Shopify...');
    const uploadResponse = await fetch('https://customify-s56o.vercel.app/api/update-theme-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        themeContent: jsContent,
        fileName: 'assets/customify.js'
      })
    });
    
    const uploadResult = await uploadResponse.json();
    console.log('📦 Upload result:', uploadResult);
    
    if (uploadResult.success) {
      console.log('✅ customify.js wdrożony pomyślnie!');
      console.log('🎉 Shopify powinien teraz mieć nowy plik z logowaniem błędów!');
      console.log('⏱️  Poczekaj 1-2 minuty na odświeżenie cache CDN');
    } else {
      console.error('❌ Błąd uploadu:', uploadResult);
    }
    
  } catch (error) {
    console.error('❌ Błąd:', error);
  }
}

uploadCustomifyJS();
