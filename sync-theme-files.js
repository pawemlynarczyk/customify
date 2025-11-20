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
  
  // 1. SYNCHRONIZACJA THEME.LIQUID
  const mainThemePath = path.join(__dirname, 'theme.liquid');
  const mainThemeContent = fs.readFileSync(mainThemePath, 'utf8');
  
  console.log('📁 Główny plik:', mainThemePath);
  console.log('📊 Rozmiar:', mainThemeContent.length, 'znaków');
  
  // Synchronizuj theme.liquid
  const themeFilesToSync = [
    'shopify-theme/customify-theme/layout/theme.liquid'
  ];
  
  themeFilesToSync.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    
    try {
      fs.writeFileSync(fullPath, mainThemeContent);
      console.log('✅ Zsynchronizowano:', filePath);
      
    } catch (error) {
      console.error('❌ Błąd synchronizacji', filePath, ':', error.message);
    }
  });
  
  // 2. SYNCHRONIZACJA JS/CSS Z public/ DO shopify-theme/
  const assetsToSync = [
    {
      from: 'public/customify.js',
      to: 'shopify-theme/customify-theme/assets/customify.js'
    },
    {
      from: 'public/customify.css',
      to: 'shopify-theme/customify-theme/assets/customify.css'
    }
  ];
  
  assetsToSync.forEach(({ from, to }) => {
    const sourcePath = path.join(__dirname, from);
    const targetPath = path.join(__dirname, to);
    
    try {
      // Sprawdź czy plik źródłowy istnieje
      if (!fs.existsSync(sourcePath)) {
        console.warn('⚠️ Plik źródłowy nie istnieje:', from);
        return;
      }
      
      // Skopiuj plik
      const content = fs.readFileSync(sourcePath, 'utf8');
      fs.writeFileSync(targetPath, content);
      console.log(`✅ Zsynchronizowano: ${from} → ${to}`);
      console.log(`📊 Rozmiar: ${content.length} znaków`);
      
    } catch (error) {
      console.error(`❌ Błąd synchronizacji ${from} → ${to}:`, error.message);
    }
  });
  
  console.log('🎉 Synchronizacja zakończona!');
  console.log('📝 Wszystkie pliki theme są teraz zsynchronizowane');
}

// Uruchom synchronizację
if (require.main === module) {
  syncThemeFiles();
}

module.exports = { syncThemeFiles };
