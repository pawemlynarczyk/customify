/**
 * REDIRECT AFTER LOGIN - JavaScript do wstrzyknięcia w theme.liquid
 * Przekierowuje użytkownika z powrotem na produkt po rejestracji/logowaniu
 */

(function() {
  // Sprawdź czy jesteśmy na stronie account (po logowaniu)
  const isAccountPage = window.location.pathname.includes('/account');
  
  if (!isAccountPage) {
    return; // Nie na stronie account - nic nie rób
  }
  
  // Sprawdź czy jest zapisany return URL w localStorage
  const returnUrl = localStorage.getItem('customify_return_url');
  
  if (returnUrl) {
    console.log('🔄 [REDIRECT] Found return URL:', returnUrl);
    
    // Usuń z localStorage (użyj tylko raz)
    localStorage.removeItem('customify_return_url');
    
    // Małe opóźnienie żeby Shopify zakończył swoje rzeczy
    setTimeout(() => {
      console.log('➡️ [REDIRECT] Redirecting to:', returnUrl);
      window.location.href = returnUrl;
    }, 500);
  }
})();

