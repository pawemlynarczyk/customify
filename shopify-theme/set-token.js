const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 Ustawianie Access Token...');
console.log('');
console.log('📋 Kroki:');
console.log('1. Idź do: https://customify-ok.myshopify.com/admin/apps');
console.log('2. Znajdź aplikację "Customify"');
console.log('3. Skopiuj Access Token (zaczyna się od shpat_)');
console.log('');

rl.question('🔑 Wklej tutaj swój Access Token: ', (token) => {
  if (!token || !token.startsWith('shpat_')) {
    console.log('❌ Nieprawidłowy token. Token musi zaczynać się od "shpat_"');
    rl.close();
    return;
  }

  try {
    // Update vercel-env.json
    const configFile = path.join(__dirname, '..', 'vercel-env.json');
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    config.SHOPIFY_ACCESS_TOKEN = token;
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    
    // Update download script
    const downloadScript = path.join(__dirname, 'download-theme-direct.js');
    let scriptContent = fs.readFileSync(downloadScript, 'utf8');
    scriptContent = scriptContent.replace(
      /const accessToken = '[^']*';/,
      `const accessToken = '${token}';`
    );
    fs.writeFileSync(downloadScript, scriptContent);
    
    // Update upload script
    const uploadScript = path.join(__dirname, 'upload-theme.js');
    let uploadContent = fs.readFileSync(uploadScript, 'utf8');
    uploadContent = uploadContent.replace(
      /const accessToken = '[^']*';/,
      `const accessToken = '${token}';`
    );
    fs.writeFileSync(uploadScript, uploadContent);

    console.log('✅ Token został ustawiony!');
    console.log('');
    console.log('🎯 Teraz możesz uruchomić:');
    console.log('   node download-theme-direct.js');
    console.log('');
    console.log('📂 To pobierze motyw do katalogu: customify-theme/');
    
  } catch (error) {
    console.log('❌ Błąd podczas zapisywania tokenu:', error.message);
  }
  
  rl.close();
});
