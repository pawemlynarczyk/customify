const fs = require('fs');
const path = require('path');

console.log('🔐 Pobieranie pełnego Access Token...');
console.log('');
console.log('📋 Kroki do wykonania:');
console.log('');
console.log('1. 🌐 Otwórz przeglądarkę i idź do:');
console.log('   https://customify-ok.myshopify.com/admin/apps');
console.log('');
console.log('2. 🔍 Znajdź aplikację "Customify"');
console.log('');
console.log('3. ⚙️ Kliknij na aplikację i przejdź do ustawień');
console.log('');
console.log('4. 🔑 Skopiuj "Access Token" (zaczyna się od shpat_...)');
console.log('');
console.log('5. 📝 Wklej token poniżej:');
console.log('');

// Read current token from file
const tokenFile = path.join(__dirname, '..', 'vercel-env.json');
let currentConfig = {};

try {
  currentConfig = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
  console.log('📄 Aktualny token (skrócony):', currentConfig.SHOPIFY_ACCESS_TOKEN);
} catch (error) {
  console.log('❌ Nie można odczytać pliku konfiguracyjnego');
}

console.log('');
console.log('💡 Alternatywnie, możesz:');
console.log('');
console.log('1. 🔗 Użyć tego linku do autoryzacji:');
console.log('   https://customify-ok.myshopify.com/admin/oauth/authorize?client_id=b55e6ae3386a566f74df4db5d1d11ee6&scope=read_themes,write_themes,read_products,write_products&redirect_uri=https://customify-s56o.vercel.app/auth/callback');
console.log('');
console.log('2. 📱 Lub sprawdź w Shopify Admin → Apps → Customify');
console.log('');
console.log('🎯 Po pobraniu tokenu, uruchom:');
console.log('   node download-theme-direct.js');
