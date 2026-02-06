const fs = require('fs');
const path = require('path');

async function syncFromShopify() {
  try {
    console.log('🔍 Pobieranie plików z Shopify przez API...');
    
    const response = await fetch('https://customify-s56o.vercel.app/api/sync-from-shopify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Synchronizacja nie powiodła się');
    }

    console.log(`✅ Pobrano ${data.files.length} plików z theme: ${data.theme} (ID: ${data.themeId})`);

    // Zapisz każdy plik lokalnie
    for (const file of data.filesContent) {
      // Mapowanie ścieżek Shopify → lokalne
      let localPath;
      if (file.key.startsWith('layout/')) {
        localPath = path.join(__dirname, 'theme.liquid');
      } else if (file.key.startsWith('assets/')) {
        const fileName = path.basename(file.key);
        localPath = path.join(__dirname, 'shopify-theme/customify-theme/assets', fileName);
      } else if (file.key.startsWith('sections/')) {
        const fileName = path.basename(file.key);
        localPath = path.join(__dirname, 'shopify-theme/customify-theme/sections', fileName);
      } else if (file.key.startsWith('snippets/')) {
        const fileName = path.basename(file.key);
        localPath = path.join(__dirname, 'shopify-theme/customify-theme/snippets', fileName);
      } else {
        console.warn(`⚠️ Nieznana ścieżka: ${file.key}`);
        continue;
      }

      // Utwórz katalog jeśli nie istnieje
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Zapisz plik
      fs.writeFileSync(localPath, file.content);
      console.log(`✅ Zapisano: ${file.key} → ${localPath} (${file.size} znaków)`);
    }

    console.log('🎉 Synchronizacja zakończona!');
    console.log('📝 Wszystkie pliki są teraz zsynchronizowane z Shopify');

  } catch (error) {
    console.error('❌ Błąd synchronizacji:', error);
    process.exit(1);
  }
}

syncFromShopify();
