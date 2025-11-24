// api/redirect-after-login.js
/**
 * Script Tag JavaScript - przekierowuje na /pages/my-generations po logowaniu
 * Działa na account.lumly.pl (Customer Account API)
 */

module.exports = async (req, res) => {
  // Ustaw Content-Type dla JavaScript
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache 1 godzina
  
  // Zwróć JavaScript jako string
  const script = `(function() {
    'use strict';
    
    // Sprawdź czy jesteśmy na account.lumly.pl z parametrem new_login=1
    const urlParams = new URLSearchParams(window.location.search);
    const newLogin = urlParams.get('new_login');
    const isAccountDomain = window.location.hostname.includes('account.');
    
    if (isAccountDomain && newLogin === '1') {
      console.log('🔄 [REDIRECT] Redirecting after login to /pages/my-generations');
      // Użyj replace() żeby nie dodać do historii przeglądarki
      window.location.replace('https://lumly.pl/pages/my-generations?country=PL');
    }
  })();`;
  
  res.send(script);
};

