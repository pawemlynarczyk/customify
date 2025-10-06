#!/usr/bin/env node

/**
 * SKRYPT SYNCHRONIZACJI PLIKÓW THEME
 * 
 * Ten skrypt synchronizuje wszystkie pliki theme z głównym plikiem theme.liquid
 * Uruchom: node sync-theme-files.js
 */

const fs = require('fs');
const path = require('path');

function syncThemeFiles() {
  console.log('🔄 Synchronizacja plików theme...');
  
  // Główny plik (źródło prawdy)
  const mainThemePath = path.join(__dirname, 'theme.liquid');
  const mainThemeContent = fs.readFileSync(mainThemePath, 'utf8');
  
  console.log('📁 Główny plik:', mainThemePath);
  console.log('📊 Rozmiar:', mainThemeContent.length, 'znaków');
  
  // Pliki do synchronizacji
  const filesToSync = [
    'shopify-theme/customify-theme/layout/theme.liquid'
  ];
  
  filesToSync.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    
    try {
      // Synchronizacja bez backupu (backupy są niepotrzebne)
      fs.writeFileSync(fullPath, mainThemeContent);
      console.log('✅ Zsynchronizowano:', filePath);
      
    } catch (error) {
      console.error('❌ Błąd synchronizacji', filePath, ':', error.message);
    }
  });
  
  console.log('🎉 Synchronizacja zakończona!');
  console.log('📝 Wszystkie pliki theme są teraz identyczne z theme.liquid');
}

// Uruchom synchronizację
if (require.main === module) {
  syncThemeFiles();
}

module.exports = { syncThemeFiles };
