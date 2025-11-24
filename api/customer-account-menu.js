// api/customer-account-menu.js
/**
 * Script Tag JavaScript - dodaje link "Moje obrazy" do menu konta klienta
 * 
 * Ten skrypt jest ładowany przez Shopify Script Tags API na wszystkich stronach,
 * w tym na account.lumly.pl (Customer Account API)
 */

module.exports = async (req, res) => {
  // Ustaw Content-Type dla JavaScript
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache 1 godzina
  
  // Zwróć JavaScript jako string
  const script = `(function() {
  'use strict';

  // 🔄 PRZEKIEROWANIE PO LOGOWANIU - działa na account.lumly.pl
  (function() {
    console.log('🔧 [SCRIPT-TAG] Script loaded on:', window.location.href);
    console.log('🔧 [SCRIPT-TAG] Hostname:', window.location.hostname);
    
    const urlParams = new URLSearchParams(window.location.search);
    const newLogin = urlParams.get('new_login');
    const isAccountDomain = window.location.hostname.includes('account.');
    
    console.log('🔧 [SCRIPT-TAG] new_login:', newLogin);
    console.log('🔧 [SCRIPT-TAG] isAccountDomain:', isAccountDomain);
    
    if (isAccountDomain && newLogin === '1') {
      console.log('🔄 [REDIRECT] Redirecting after login to /pages/my-generations');
      // Użyj setTimeout żeby dać czas na załadowanie strony
      setTimeout(function() {
        window.location.replace('https://lumly.pl/pages/my-generations?country=PL');
      }, 100);
      return; // Nie wykonuj reszty kodu
    }
  })();

  // Funkcja dodająca link "Moje obrazy" do menu konta klienta
  function addMyImagesLink() {
    // Sprawdź czy jesteśmy na stronie konta klienta (Shopify Customer Account API)
    const isAccountPage = window.location.hostname.includes('account.') || 
                          window.location.pathname.startsWith('/account') ||
                          document.querySelector('[data-customer-account]');
    
    if (!isAccountPage) {
      return;
    }

    // Sprawdź czy link już istnieje
    const existingLink = document.querySelector('a[href="/pages/my-generations"], a[href*="my-generations"]');
    if (existingLink) {
      return true;
    }

    // Różne selektory dla menu konta klienta w Shopify Customer Account API
    const menuSelectors = [
      'nav[aria-label*="Account"]',
      'nav[aria-label*="Konto"]',
      'nav[role="navigation"]',
      'nav ul',
      'aside nav',
      'aside nav ul',
      '[role="navigation"] ul',
      'nav > ul',
      'ul[role="list"]'
    ];

    let menuElement = null;
    let ordersLink = null;

    // Szukaj menu i linku "Zamówienia" jednocześnie
    for (const selector of menuSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        // Sprawdź czy to menu (zawiera linki)
        const links = el.querySelectorAll('a');
        if (links.length === 0) continue;

        // Szukaj linku "Zamówienia" w tym menu
        for (const link of links) {
          const text = link.textContent.trim().toLowerCase();
          if (text.includes('zamówienia') || text.includes('orders') || text.includes('order')) {
            menuElement = el;
            ordersLink = link;
            break;
          }
        }
        
        if (menuElement && ordersLink) break;
      }
      if (menuElement && ordersLink) break;
    }

    // Alternatywnie: szukaj bezpośrednio linku "Zamówienia" i znajdź jego menu
    if (!menuElement || !ordersLink) {
      const allLinks = document.querySelectorAll('nav a, aside a');
      for (const link of allLinks) {
        const text = link.textContent.trim().toLowerCase();
        if (text.includes('zamówienia') || text.includes('orders') || text.includes('order')) {
          ordersLink = link;
          menuElement = link.closest('ul') || link.closest('nav') || link.parentElement;
          break;
        }
      }
    }

    if (!menuElement || !ordersLink) {
      return false;
    }

    const ordersListItem = ordersLink.closest('li') || ordersLink.parentElement;
    if (!ordersListItem) {
      return false;
    }

    // Utwórz nowy element listy z linkiem "Moje obrazy"
    const newListItem = document.createElement('li');
    if (ordersListItem.className) {
      newListItem.className = ordersListItem.className;
    }
    
    const newLink = document.createElement('a');
    newLink.href = '/pages/my-generations';
    newLink.textContent = 'Moje obrazy';
    if (ordersLink.className) {
      newLink.className = ordersLink.className;
    }
    // Skopiuj style z linku "Zamówienia"
    if (ordersLink.style.cssText) {
      newLink.style.cssText = ordersLink.style.cssText;
    }
    
    newListItem.appendChild(newLink);

    // Dodaj link po "Zamówienia"
    const parent = ordersListItem.parentElement;
    if (parent) {
      if (ordersListItem.nextSibling) {
        parent.insertBefore(newListItem, ordersListItem.nextSibling);
      } else {
        parent.appendChild(newListItem);
      }
      return true;
    }

    return false;
  }

  // Próbuj dodać link wielokrotnie (dla dynamicznych stron Shopify Customer Account API)
  function tryAddLink() {
    const maxAttempts = 15;
    let attempts = 0;
    
    const interval = setInterval(function() {
      attempts++;
      if (addMyImagesLink() || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 500);
  }

  // Start gdy DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      tryAddLink();
    });
  } else {
    tryAddLink();
  }

  // Obserwuj zmiany w DOM (dla dynamicznych menu Shopify Customer Account API)
  const observer = new MutationObserver(function(mutations) {
    addMyImagesLink();
  });

  setTimeout(function() {
    const accountSection = document.querySelector('main') || document.querySelector('body');
    if (accountSection) {
      observer.observe(accountSection, {
        childList: true,
        subtree: true
      });
    }
  }, 1000);
})();`;

  res.send(script);
};
