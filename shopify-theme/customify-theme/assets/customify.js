/**
 * CUSTOMIFY AI PHOTO CUSTOMIZATION
 * Clean JavaScript implementation for Shopify theme integration
 */

class CustomifyEmbed {
  constructor() {
    this.uploadArea = document.getElementById('uploadArea');
    this.fileInput = document.getElementById('fileInput');
    this.previewArea = document.getElementById('previewArea');
    this.previewImage = document.getElementById('previewImage');
    this.stylesArea = document.getElementById('stylesArea');
    this.sizeArea = document.getElementById('sizeArea');
    this.actionsArea = document.getElementById('actionsArea');
    this.loadingArea = document.getElementById('loadingArea');
    this.resultArea = document.getElementById('resultArea');
    this.resultImage = document.getElementById('resultImage');
    this.errorMessage = document.getElementById('errorMessage');
    this.errorMessageBottom = document.getElementById('errorMessageBottom');
    this.successMessage = document.getElementById('successMessage');
    
    this.uploadedFile = null;
    this.selectedStyle = null;
    this.selectedSize = null;
    this.transformedImage = null;
    
    this.init();
  }

  init() {
    if (!document.getElementById('uploadArea')) {
      return; // Jeśli nie ma elementów, nie rób nic
    }
    this.setupEventListeners();
    this.positionApp();
    this.showStyles(); // Pokaż style od razu
    // filterStylesForProduct() USUNIĘTE - logika przeniesiona na server-side (Shopify Liquid)
    
    // Setup expandable description USUNIĘTE - opisy produktów są teraz pełne
    
    // Setup accordion for product details - BEZ setTimeout!
    this.setupAccordion();
    
    // ✅ USAGE LIMITS: Pokaż licznik użyć
    this.showUsageCounter();
  }

  // ===== USAGE LIMITS FUNCTIONS =====
  
  /**
   * Pobiera informacje o zalogowanym użytkowniku Shopify
   * @returns {Object|null} {customerId, email, customerAccessToken} lub null jeśli niezalogowany
   */
  getCustomerInfo() {
    
    // METODA 1: NOWY SYSTEM - window.ShopifyCustomer (z Liquid w theme.liquid)
    if (window.ShopifyCustomer && window.ShopifyCustomer.loggedIn && window.ShopifyCustomer.id) {
      
      return {
        customerId: window.ShopifyCustomer.id,
        email: window.ShopifyCustomer.email || 'no-email@shopify.com',
        firstName: window.ShopifyCustomer.firstName,
        lastName: window.ShopifyCustomer.lastName,
        customerAccessToken: 'oauth_session' // Placeholder - sesja zarządzana przez Shopify
      };
    }
    
    // METODA 2: FALLBACK - Sprawdź cookie Shopify (customer_auth_token)
    const cookies = document.cookie.split(';').map(c => c.trim());
    const hasCustomerCookie = cookies.some(cookie => 
      cookie.startsWith('_shopify_customer_') || 
      cookie.startsWith('customer_auth_token') ||
      cookie.startsWith('customer_id')
    );
    
    if (hasCustomerCookie) {
      
      // Spróbuj wyciągnąć ID z cookie
      const customerIdCookie = cookies.find(c => c.startsWith('customer_id='));
      let customerId = null;
      
      if (customerIdCookie) {
        customerId = customerIdCookie.split('=')[1];
      }
      
      // Jeśli brak ID, użyj window.ShopifyCustomer.id jako fallback
      if (!customerId && window.ShopifyCustomer && window.ShopifyCustomer.id) {
        customerId = window.ShopifyCustomer.id;
      }
      
      return {
        customerId: customerId || 'unknown',
        email: window.ShopifyCustomer?.email || 'cookie-user@shopify.com',
        firstName: window.ShopifyCustomer?.firstName || '',
        lastName: window.ShopifyCustomer?.lastName || '',
        customerAccessToken: 'oauth_session'
      };
    }
    
    // METODA 3: STARY SYSTEM - window.Shopify.customerEmail (Classic Customer Accounts)
    if (window.Shopify && window.Shopify.customerEmail) {
      
      const customerId = window.meta?.customer?.id || window.ShopifyCustomer?.id || null;
      const customerAccessToken = localStorage.getItem('shopify_customer_access_token');
      
      return {
        customerId: customerId,
        email: window.Shopify.customerEmail,
        customerAccessToken: customerAccessToken || 'oauth_session'
      };
    }
    
    return null;
  }

  /**
   * Sprawdza liczbę użyć z localStorage (dla niezalogowanych)
   * @returns {number} Liczba użyć
   */
  getLocalUsageCount() {
    const count = parseInt(localStorage.getItem('customify_usage_count') || '0', 10);
    return count;
  }

  /**
   * Inkrementuje licznik w localStorage (dla niezalogowanych)
   */
  incrementLocalUsage() {
    const currentCount = this.getLocalUsageCount();
    const newCount = currentCount + 1;
    localStorage.setItem('customify_usage_count', newCount.toString());
    this.showUsageCounter(); // Odśwież licznik w UI
  }

  /**
   * Sprawdza czy użytkownik może wykonać transformację
   * @returns {Promise<boolean>} true jeśli może, false jeśli przekroczył limit
   */
  async checkUsageLimit() {
    const customerInfo = this.getCustomerInfo();
    
    if (!customerInfo) {
      // Niezalogowany - sprawdź localStorage (limit 3)
      const localCount = this.getLocalUsageCount();
      const FREE_LIMIT = 3;
      
      
      if (localCount >= FREE_LIMIT) {
        this.showLoginModal(localCount, FREE_LIMIT);
        return false;
      }
      
      return true;
    } else {
      // Zalogowany - sprawdź Shopify Metafields przez API
      
      try {
        const response = await fetch('https://customify-s56o.vercel.app/api/check-usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: customerInfo.customerId,
            customerAccessToken: customerInfo.customerAccessToken
          })
        });
        
        const data = await response.json();
        
        if (data.remainingCount <= 0) {
          this.showError(`Wykorzystałeś wszystkie transformacje (${data.totalLimit}). Skontaktuj się z nami dla więcej.`);
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('❌ [USAGE] Błąd sprawdzania limitu:', error);
        // W razie błędu - pozwól (fallback)
        return true;
      }
    }
  }

  /**
   * Pokazuje modal z wymogiem rejestracji + auto-redirect
   */
  showLoginModal(usedCount, limit) {
    // Return URL - wróć na tę samą stronę po rejestracji
    const returnUrl = window.location.pathname + window.location.search;
    const registerUrl = `/account/register?return_url=${encodeURIComponent(returnUrl)}`;
    const loginUrl = `/account/login?return_url=${encodeURIComponent(returnUrl)}`;
    
    const modalHTML = `
      <div id="loginModal" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.75);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        animation: fadeIn 0.3s ease;
      ">
        <div style="
          background: white;
          padding: 50px 40px;
          border-radius: 16px;
          max-width: 550px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
          animation: slideUp 0.3s ease;
        ">
          <div style="font-size: 60px; margin-bottom: 20px;">🎨</div>
          
          <h2 style="
            margin-bottom: 15px; 
            color: #333; 
            font-size: 24px;
            font-weight: 600;
          ">Wykorzystałeś darmowe transformacje!</h2>
          
          <p style="
            margin-bottom: 25px; 
            color: #666; 
            font-size: 16px;
            line-height: 1.6;
          ">
            Użyłeś <strong style="color: #FF6B6B;">${usedCount}/${limit}</strong> darmowych transformacji.<br>
            <strong style="color: #4CAF50; font-size: 18px;">Załóż bezpłatne konto (bez hasła!) i otrzymaj +10 dodatkowych!</strong>
          </p>
          
          <div id="countdownText" style="
            margin-bottom: 25px;
            padding: 15px;
            background: #E8F5E9;
            border-radius: 8px;
            color: #2E7D32;
            font-weight: 600;
            font-size: 16px;
          ">
            ⏰ Przekierowanie za: <span id="countdownSeconds">5</span> sekund...
          </div>
          
          <div style="
            display: flex; 
            gap: 12px; 
            justify-content: center;
            flex-wrap: wrap;
          ">
            <a href="${registerUrl}" style="
              background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
              color: white;
              padding: 14px 32px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: bold;
              font-size: 16px;
              display: inline-block;
              box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
              transition: transform 0.2s;
            " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
              ✉️ Kontynuuj (podaj email)
            </a>
            
            <button onclick="window.customifyLoginModal.cancel()" style="
              background: #f5f5f5;
              color: #666;
              padding: 14px 32px;
              border-radius: 8px;
              border: 2px solid #ddd;
              font-weight: bold;
              font-size: 16px;
              cursor: pointer;
              transition: all 0.2s;
            " onmouseover="this.style.background='#e0e0e0'" onmouseout="this.style.background='#f5f5f5'">
              ❌ Anuluj
            </button>
          </div>
        </div>
      </div>
    `;
    
    // CSS Animations
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(styleEl);
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Countdown timer (5 sekund)
    let countdown = 5;
    const countdownEl = document.getElementById('countdownSeconds');
    
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdownEl) {
        countdownEl.textContent = countdown;
      }
      
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        // Auto-redirect do REJESTRACJI (główny CTA)
        window.location.href = registerUrl;
      }
    }, 1000);
    
    // Global function to cancel countdown
    window.customifyLoginModal = {
      cancel: () => {
        clearInterval(countdownInterval);
        document.getElementById('loginModal')?.remove();
      }
    };
    
  }

  /**
   * Pokazuje licznik użyć w UI
   */
  async showUsageCounter() {
    const customerInfo = this.getCustomerInfo();
    let counterHTML = '';
    
    
    if (!customerInfo) {
      // Niezalogowany
      const localCount = this.getLocalUsageCount();
      const FREE_LIMIT = 3;
      const remaining = Math.max(0, FREE_LIMIT - localCount);
      
      counterHTML = `
        <div id="usageCounter" style="
          background: ${remaining > 0 ? '#E8F5E9' : '#FFEBEE'};
          color: ${remaining > 0 ? '#2E7D32' : '#C62828'};
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 15px;
          text-align: center;
          font-weight: bold;
        ">
          ${remaining > 0 
            ? `🎨 Pozostało ${remaining}/${FREE_LIMIT} darmowych transformacji` 
            : `❌ Wykorzystano ${FREE_LIMIT}/${FREE_LIMIT} - Zaloguj się dla więcej!`
          }
        </div>
      `;
    } else {
      // Zalogowany - pobierz z API
      try {
        const response = await fetch('https://customify-s56o.vercel.app/api/check-usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: customerInfo.customerId,
            customerAccessToken: customerInfo.customerAccessToken
          })
        });
        
        const data = await response.json();
        
        counterHTML = `
          <div id="usageCounter" style="
            background: ${data.remainingCount > 0 ? '#E3F2FD' : '#FFEBEE'};
            color: ${data.remainingCount > 0 ? '#1565C0' : '#C62828'};
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 15px;
            text-align: center;
            font-weight: bold;
          ">
            ${data.remainingCount > 0 
              ? `✅ Zalogowany: ${data.remainingCount}/${data.totalLimit} transformacji` 
              : `❌ Wykorzystano ${data.totalLimit}/${data.totalLimit} transformacji`
            }
          </div>
        `;
      } catch (error) {
        console.error('❌ [USAGE] Błąd pobierania licznika:', error);
      }
    }
    
    // Wstaw licznik do DOM - na górze aplikacji Customify
    const customifyEmbed = document.getElementById('customifyEmbed');
    if (customifyEmbed && counterHTML) {
      // Usuń stary licznik jeśli istnieje
      const oldCounter = document.getElementById('usageCounter');
      if (oldCounter) {
        oldCounter.remove();
      }
      
      // Wstaw nowy licznik na samej górze
      customifyEmbed.insertAdjacentHTML('afterbegin', counterHTML);
      console.log('🔧 [USAGE] Licznik wyświetlony w UI');
    }
  }

  // filterStylesForProduct() USUNIĘTE - logika przeniesiona na server-side (Shopify Liquid)

  // ETSY-STYLE EXPANDABLE DESCRIPTION USUNIĘTE - opisy produktów są teraz pełne

  // ACCORDION: SZCZEGÓŁY PRODUKTU
  setupAccordion() {
    
    // Znajdź wszystkie accordion items
    const accordionItems = document.querySelectorAll('.accordion-item');
    
    if (!accordionItems || accordionItems.length === 0) {
      return;
    }
    
    
    // Dodaj event listener do każdego accordion header
    accordionItems.forEach((item, index) => {
      const header = item.querySelector('.accordion-header');
      
      if (!header) {
        return;
      }
      
      // Event listener - TYLKO toggle klasy (BEZ DOM manipulation)
      header.addEventListener('click', () => {
        const isExpanded = item.classList.contains('expanded');
        
        if (isExpanded) {
          // Zwiń
          item.classList.remove('expanded');
        } else {
          // Rozwiń (opcjonalnie: zwiń inne)
          // accordionItems.forEach(otherItem => otherItem.classList.remove('expanded'));
          item.classList.add('expanded');
        }
      });
      
    });
    
  }

  // WSTRZYJ APLIKACJĘ DO KOLUMNY 2
  positionApp() {
    if (!window.location.pathname.includes('/products/')) {
      return;
    }

    const appContainer = document.getElementById('customify-app-container');
    if (!appContainer) return;

    // Znajdź kolumnę 2 (detale produktu)
    const productDetails = document.querySelector('#ProductInformation-template--26351135293765__main') || 
                          document.querySelector('.product-details') ||
                          document.querySelector('.product__info');

    if (productDetails) {
      
      // Dodaj elementy pod tytułem
      this.addProductBadges();
      
      // Pokaż aplikację
      appContainer.style.display = 'block';
      
      // Wstaw na górę kolumny 2
      productDetails.insertBefore(appContainer, productDetails.firstChild);
      
      // PRZENIEŚ TYTUŁ NA GÓRĘ KOLUMNY PRODUKT INFO
      this.moveTitleToTop();
    } else {
      console.warn('⚠️ [CUSTOMIFY] Could not find product details column');
    }
  }


  // PRZENIEŚ TYTUŁ NA GÓRĘ KOLUMNY PRODUKT INFO
  moveTitleToTop() {
    // Znajdź kontener z tytułem (bezpieczny element)
    const titleContainer = document.querySelector('.group-block[data-testid="group-block"]');
    
    if (!titleContainer) {
      console.warn('⚠️ [CUSTOMIFY] Could not find title container');
      return;
    }

    // Znajdź kolumnę produkt info (gdzie ma być przeniesiony)
    const productInfoColumn = document.querySelector('#ProductInformation-template--26351135293765__main') || 
                              document.querySelector('.product-details') ||
                              document.querySelector('.product__info');

    if (!productInfoColumn) {
      console.warn('⚠️ [CUSTOMIFY] Could not find product info column');
      return;
    }

    // Sprawdź czy już nie jest przeniesiony
    if (titleContainer.classList.contains('customify-title-moved')) {
      return;
    }


    // Oznacz jako przeniesiony
    titleContainer.classList.add('customify-title-moved');

    // Przenieś tytuł na górę kolumny produkt info
    productInfoColumn.insertBefore(titleContainer, productInfoColumn.firstChild);

    // Ustaw style dla przeniesionego tytułu
    titleContainer.style.cssText = `
      order: -1 !important;
      width: 100% !important;
      margin: 0 0 20px 0 !important;
      background: white !important;
      padding: 8px 20px !important;
      border-radius: 8px !important;
      box-shadow: none !important;
      position: relative !important;
      z-index: 10 !important;
    `;

    // NIE ukrywamy ceny - zostawiamy oryginalną pozycję Shopify
    // (usunięto klonowanie ceny ze względu na potencjalne problemy z cloakingiem Google)

    // DODAJ DIVIDER POD TYTUŁEM
    this.addDividerAfterTitle();

  }



  // DODAJ DIVIDER POD TYTUŁEM
  addDividerAfterTitle() {
    // Sprawdź czy już nie ma dividera
    if (document.querySelector('.customify-title-divider')) {
      return;
    }

    // Znajdź kontener z tytułem
    const titleContainer = document.querySelector('.group-block[data-testid="group-block"].customify-title-moved');
    if (!titleContainer) {
      console.warn('⚠️ [CUSTOMIFY] Could not find title container for divider');
      return;
    }

    // Stwórz divider
    const divider = document.createElement('div');
    divider.className = 'customify-title-divider';
    divider.style.cssText = `
      width: 100%;
      height: 1px;
      background-color: #ccc;
      margin: 15px 0;
      border-radius: 0.5px;
    `;

    // Dodaj divider po kontenerze z tytułem
    titleContainer.parentNode.insertBefore(divider, titleContainer.nextSibling);

  }

  // FUNKCJA USUNIĘTA: showPriceBelowApp()
  // Powód: Potencjalne problemy z cloakingiem Google (klonowanie elementów DOM)
  // Cena pozostaje w oryginalnej pozycji Shopify

  // DODAJ GWIAZDKI I OKAZJĘ POD TYTUŁEM
  addProductBadges() {
    // Znajdź tytuł produktu
    const titleElement = document.querySelector('h1, .product-title, .view-product-title');
    if (!titleElement) return;

    // Sprawdź czy już nie ma badge'ów
    if (document.querySelector('.product-badges')) return;

    // Stwórz kontener dla badge'ów
    const badgesContainer = document.createElement('div');
    badgesContainer.className = 'product-badges';

    // Dodaj sekcję z gwiazdkami (discount badge USUNIĘTY)
    const ratingSection = document.createElement('div');
    ratingSection.className = 'rating-section';

    const stars = document.createElement('div');
    stars.className = 'stars';
    for (let i = 0; i < 5; i++) {
      const star = document.createElement('span');
      star.className = 'star';
      star.innerHTML = '★';
      stars.appendChild(star);
    }

    const reviewCount = document.createElement('span');
    reviewCount.className = 'review-count';
    reviewCount.textContent = '(143)';

    ratingSection.appendChild(stars);
    ratingSection.appendChild(reviewCount);

    // Dodaj do kontenera (discount badge USUNIĘTY)
    badgesContainer.appendChild(ratingSection);

    // POŁĄCZ TYTUŁ Z BADGE'AMI W JEDEN ELEMENT
    const titleBadgesContainer = document.createElement('div');
    titleBadgesContainer.className = 'title-with-badges';
    titleBadgesContainer.style.cssText = 'order: 1; margin-bottom: 4px;';

    // Przenieś tytuł do nowego kontenera
    titleElement.parentNode.insertBefore(titleBadgesContainer, titleElement);
    titleBadgesContainer.appendChild(titleElement);
    
    // Dodaj badge'y do tego samego kontenera
    titleBadgesContainer.appendChild(badgesContainer);

    // PRZENIEŚ CENĘ PO TYTULE Z BADGE'AMI
    setTimeout(() => {
      const priceElement = document.querySelector('product-price');
      const titleBadgesContainer = document.querySelector('.title-with-badges');
      if (priceElement && titleBadgesContainer) {
        // Znajdź kontener flexbox
        const flexContainer = document.querySelector('.layout-panel-flex');
        if (flexContainer) {
          // Przenieś cenę po tytule z badge'ami
          flexContainer.insertBefore(priceElement, titleBadgesContainer.nextSibling);
        }
      }
    }, 100);
  }

  setupEventListeners() {
    this.uploadArea.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));
    
    this.uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.uploadArea.classList.add('dragover');
    });
    
    this.uploadArea.addEventListener('dragleave', () => {
      this.uploadArea.classList.remove('dragover');
    });
    
    this.uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      this.uploadArea.classList.remove('dragover');
      this.handleFileSelect(e.dataTransfer.files[0]);
    });

    this.stylesArea.addEventListener('click', (e) => {
      if (e.target.classList.contains('customify-style-card') || 
          e.target.closest('.customify-style-card')) {
        const card = e.target.classList.contains('customify-style-card') ? 
                    e.target : e.target.closest('.customify-style-card');
        this.selectStyle(card);
      }
    });

    // Event listener dla rozmiarów - sprawdź zarówno główny jak i w resultArea
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('customify-size-btn')) {
        this.selectSize(e.target);
      }
    });

    document.getElementById('transformBtn').addEventListener('click', () => this.transformImage());
    document.getElementById('resetBtn').addEventListener('click', () => this.reset());
    document.getElementById('addToCartBtn').addEventListener('click', () => this.addToCart());
    document.getElementById('addToCartBtnMain').addEventListener('click', () => this.addToCart());
    document.getElementById('tryAgainBtn').addEventListener('click', () => this.tryAgain());
  }

  handleFileSelect(file) {
    if (!file) return;
    
    // ✅ OBSŁUGA FORMATÓW: JPG, PNG, GIF, WEBP (HEIC może nie działać w przeglądarce)
    const supportedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'
    ];
    
    const isImageType = file.type.startsWith('image/') || 
                       file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
    
    // ✅ SPECJALNA OBSŁUGA HEIC: Sprawdź czy to HEIC i ostrzeż
    if (file.name.toLowerCase().match(/\.(heic|heif)$/)) {
      this.showError('Format HEIC może nie działać w przeglądarce. Spróbuj przekonwertować na JPG lub PNG.');
      return;
    }
    
    if (!isImageType) {
      this.showError('Proszę wybrać plik obrazu (JPG, PNG, GIF)');
      return;
    }
    // ✅ ZMNIEJSZONY LIMIT: 5MB zamiast 10MB (lepsze dla przeglądarek)
    if (file.size > 5 * 1024 * 1024) {
      this.showError('Plik jest za duży. Maksymalny rozmiar to 5MB. Spróbuj skompresować zdjęcie.');
      return;
    }

    this.uploadedFile = file;
    this.showPreview(file);
    this.hideError();
  }

  showPreview(file) {
    const reader = new FileReader();
    
    // ✅ DODANO: Error handling dla FileReader
    reader.onerror = () => {
      this.showError('Nie można wczytać pliku. Plik może być uszkodzony lub za duży. Spróbuj inny plik.');
      this.uploadedFile = null;
      this.fileInput.value = '';
    };
    
    reader.onload = (e) => {
      // Walidacja rozdzielczości obrazu
      const img = new Image();
      img.onload = () => {
        // Wykryj typ produktu - koty mają niższy limit
        const isCatProduct = window.location.pathname.includes('koty-krolewskie');
        const minWidth = isCatProduct ? 600 : 768;
        const minHeight = isCatProduct ? 600 : 768;
        
        
        // Sprawdź minimalną rozdzielczość
        if (img.width < minWidth || img.height < minHeight) {
          this.showError(`Zdjęcie jest za małe. Minimalna rozdzielczość to ${minWidth}×${minHeight}px. Twoje zdjęcie: ${img.width}×${img.height}px`);
          this.previewArea.style.display = 'none';
          this.uploadedFile = null;
          this.fileInput.value = '';
          return;
        }
        
        // Zdjęcie OK - pokaż podgląd
        this.previewImage.src = e.target.result;
        this.previewArea.style.display = 'block';
        
        // Ukryj "Dodaj do koszyka" i pokaż "Wgraj inne zdjęcie" po wgraniu zdjęcia
        const addToCartBtnMain = document.getElementById('addToCartBtnMain');
        const resetBtn = document.getElementById('resetBtn');
        if (addToCartBtnMain) {
          addToCartBtnMain.style.display = 'none';
        }
        if (resetBtn) {
          resetBtn.style.display = 'inline-block';
        }
      };
      
      img.onerror = () => {
        this.showError('Nie można wczytać obrazu. Plik może być uszkodzony lub za duży. Spróbuj inny plik.');
        this.uploadedFile = null;
        this.fileInput.value = '';
      };
      
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  showStyles() {
    this.stylesArea.style.display = 'block';
    this.sizeArea.style.display = 'block'; // Pokaż rozmiary od razu
    this.actionsArea.style.display = 'flex';
    
    // Pokaż przycisk "Dodaj do koszyka" jeśli użytkownik nie wgrał zdjęcia
    const addToCartBtnMain = document.getElementById('addToCartBtnMain');
    if (addToCartBtnMain) {
      addToCartBtnMain.style.display = 'inline-block';
    }
  }

  selectStyle(styleCard) {
    this.stylesArea.querySelectorAll('.customify-style-card').forEach(card => card.classList.remove('active'));
    styleCard.classList.add('active');
    this.selectedStyle = styleCard.dataset.style;
    
    // Rozmiary już są widoczne od razu
  }

  selectSize(sizeBtn) {
    this.sizeArea.querySelectorAll('.customify-size-btn').forEach(btn => btn.classList.remove('active'));
    sizeBtn.classList.add('active');
    this.selectedSize = sizeBtn.dataset.size;
  }

  async transformImage(retryCount = 0) {
    if (!this.uploadedFile || !this.selectedStyle) {
      this.showError('Wgraj zdjęcie i wybierz styl');
      return;
    }

    // ✅ USAGE LIMITS: Sprawdź limit PRZED transformacją
    if (retryCount === 0) { // Tylko przy pierwszej próbie (nie przy retry)
      const canTransform = await this.checkUsageLimit();
      if (!canTransform) {
        return;
      }
    }

    // ✅ Google Analytics Event Tracking - "Zobacz Podgląd" kliknięty
    if (retryCount === 0 && typeof gtag !== 'undefined') {
      gtag('event', 'zobacz_podglad_click', {
        'event_category': 'Customify',
        'event_label': this.selectedStyle,
        'style_name': this.selectedStyle,
        'product_url': window.location.pathname
      });
    }

    this.showLoading();
    this.hideError();
    
    if (retryCount > 0) {
    }

    try {
      const base64 = await this.fileToBase64(this.uploadedFile);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes
      
      
      // Wykryj typ produktu na podstawie URL produktu (jak w theme.liquid)
      const currentPath = window.location.pathname;
      let productType = 'other'; // domyślnie
      
      if (currentPath.includes('koty-krolewskie-zwierzeta-w-koronach')) {
        productType = 'cats';
      } else if (currentPath.includes('personalizowany-portret-w-stylu-boho')) {
        productType = 'boho';
      }
      
      // ✅ USAGE LIMITS: Pobierz dane użytkownika do przekazania do API
      const customerInfo = this.getCustomerInfo();
      
      const requestBody = {
        imageData: base64,
        prompt: `Transform this image in ${this.selectedStyle} style`,
        productType: productType, // Przekaż typ produktu do API
        customerId: customerInfo?.customerId || null,
        customerAccessToken: customerInfo?.customerAccessToken || null
      };
      
      
      const response = await fetch('https://customify-s56o.vercel.app/api/transform', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📱 [MOBILE] Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      if (result.success) {
        this.transformedImage = result.transformedImage;
        this.showResult(result.transformedImage);
        this.showSuccess('Teraz wybierz rozmiar obrazu');
        
        // ✅ USAGE LIMITS: Inkrementuj licznik dla niezalogowanych (zalogowani są inkrementowani w API)
        if (!customerInfo) {
          this.incrementLocalUsage();
        } else {
          // Zalogowani - odśwież licznik z API (został zaktualizowany w backend)
          this.showUsageCounter();
        }
      } else {
        this.showError('Błąd podczas transformacji: ' + (result.error || 'Nieznany błąd'));
      }
    } catch (error) {
      console.error('📱 [MOBILE] Transform error:', error);
      
      // Retry logic for network errors
      if (retryCount < 3 && (
        error.name === 'AbortError' || 
        error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError')
      )) {
        alert(`🔄 Ponawiam próbę ${retryCount + 1}/3...`);
        setTimeout(() => {
          this.transformImage(retryCount + 1);
        }, 2000);
        return;
      }
      
      let errorMessage = 'Błąd połączenia z serwerem';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Przekroczono limit czasu (5 minut). Spróbuj ponownie.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Błąd sieci. Sprawdź połączenie internetowe.';
      } else if (error.message.includes('NetworkError')) {
        errorMessage = 'Błąd sieci. Spróbuj ponownie za chwilę.';
      } else if (error.message.includes('TypeError')) {
        errorMessage = 'Błąd przetwarzania. Spróbuj ponownie.';
      }
      
      this.showError(errorMessage);
    } finally {
      this.hideLoading();
    }
  }

  // FUNKCJA DODAWANIA WATERMARKU - UPROSZCZONA (API robi watermark)
  async addWatermark(imageUrl) {
    // ✅ NOWA LOGIKA: API już nakłada watermark dla wszystkich obrazów
    // Jeśli to base64 (już z watermarkiem z API), zwróć bez zmian
    if (imageUrl.startsWith('data:')) {
      console.log('✅ [WATERMARK] Obraz już ma watermark z API (base64)');
      return imageUrl;
    }
    
    // Fallback: jeśli to nadal zewnętrzny URL, zwróć bez watermarku (błąd API)
    console.warn('⚠️ [WATERMARK] Obraz bez watermarku z API:', imageUrl);
    return imageUrl;
  }

  async showResult(imageUrl) {
    
    // WATERMARK WŁĄCZONY
    try {
      const watermarkedImage = await this.addWatermark(imageUrl);
      this.resultImage.src = watermarkedImage;
    } catch (error) {
      console.error('❌ [CUSTOMIFY] Watermark error:', error);
      this.resultImage.src = imageUrl;
    }
    
    this.resultArea.style.display = 'block';
    
    // Rozmiary są zawsze widoczne na górze (poza resultArea)
    this.sizeArea.style.display = 'block';
    
    // UKRYJ przyciski "Przekształć z AI" i "Resetuj" (główne actionsArea)
    this.actionsArea.style.display = 'none';
    
    // UKRYJ style po przekształceniu
    this.stylesArea.style.display = 'none';
    
    // Zmień kolory przycisków po wygenerowaniu AI
    this.swapButtonColors();
    
    // UKRYJ pole upload po przekształceniu
    this.uploadArea.style.display = 'none';
  }

  // NAPRAWIONA FUNKCJA: STWÓRZ NOWY PRODUKT Z OBRAZKIEM AI (UKRYTY W KATALOGU)
  async addToCart() {
    if (!this.transformedImage) {
      this.showError('Brak przekształconego obrazu');
      return;
    }
    
    if (!this.selectedStyle) {
      this.showError('Wybierz styl');
      return;
    }
    
    if (!this.selectedSize) {
      this.showError('Nie wybrałeś rozmiaru');
      return;
    }

    this.hideError();

    // Pokaż pasek postępu dla koszyka
    this.showCartLoading();

    try {
      // Pobierz ID produktu z różnych możliwych źródeł
      const productId = 
        document.querySelector('[data-product-id]')?.getAttribute('data-product-id') ||
        document.querySelector('form[action*="/cart/add"] input[name="id"]')?.value ||
        window.ShopifyAnalytics?.meta?.product?.id ||
        null;
      
      
      const productData = {
        originalImage: await this.fileToBase64(this.uploadedFile),
        transformedImage: this.transformedImage,
        style: this.selectedStyle,
        size: this.selectedSize,
        originalProductTitle: document.querySelector('h1, .product-title, .view-product-title')?.textContent?.trim() || 'Produkt',
        originalProductId: productId // ✅ Dodano ID produktu do pobrania ceny z Shopify
      };

      
      // Stwórz nowy produkt z obrazkiem AI jako głównym obrazem
      const response = await fetch('https://customify-s56o.vercel.app/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      const result = await response.json();

      if (result.success) {
        this.showSuccess('✅ ' + (result.message || 'Produkt został utworzony!'));
        
        // Obraz AI jest już głównym obrazem produktu
        
        if (result.variantId) {
          
          // NAPRAWIONA METODA: Użyj bezpośredniego przekierowania zamiast formularza
          const properties = {
            'Styl AI': this.selectedStyle,
            'Rozmiar': this.selectedSize,
            '_AI_Image_URL': result.imageUrl || this.transformedImage,  // ✅ UKRYTY przed klientem (podkreślnik na początku)
            '_Order_ID': result.orderId || Date.now().toString()  // Unikalny ID zamówienia
          };
          
          // ✅ Dodaj _AI_Image_Direct TYLKO jeśli to NIE jest base64 (tylko dla Replicate URLs)
          // Segmind zwraca base64 data URI (256KB+) co przekracza limit URL
          if (this.transformedImage && !this.transformedImage.startsWith('data:')) {
            properties['_AI_Image_Direct'] = this.transformedImage;  // Replicate URL (krótki)
          }
          
          // Buduj URL z parametrami
          const params = new URLSearchParams();
          params.append('id', result.variantId);
          params.append('quantity', '1');
          
          // Dodaj właściwości
          Object.entries(properties).forEach(([key, value]) => {
            params.append(`properties[${key}]`, value);
          });
          
          const cartUrl = `/cart/add?${params.toString()}`;
          
          // ✅ UŻYWAJ DIRECT NAVIGATION (nie fetch) - unika CORS i działa zawsze
          // Ukryj pasek postępu
          this.hideCartLoading();
          
          // Bezpośrednie przekierowanie - Shopify obsłuży dodanie do koszyka
          window.location.href = cartUrl;
          
          // PRODUKT ZOSTANIE UKRYTY PO FINALIZACJI TRANSAKCJI (webhook orders/paid)
        }
      } else {
        console.error('❌ [CUSTOMIFY] Product creation failed:', result);
        this.hideCartLoading();
        this.showError('❌ Błąd podczas tworzenia produktu: ' + (result.error || 'Nieznany błąd'));
      }
    } catch (error) {
      console.error('❌ [CUSTOMIFY] Add to cart error:', error);
      this.hideCartLoading();
      
      let errorMessage = '❌ Błąd połączenia z serwerem';
      
      if (error.name === 'AbortError') {
        errorMessage = '❌ Przekroczono limit czasu. Spróbuj ponownie.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = '❌ Błąd sieci. Sprawdź połączenie internetowe.';
      } else if (error.message.includes('NetworkError')) {
        errorMessage = '❌ Błąd sieci. Spróbuj ponownie za chwilę.';
      } else {
        errorMessage = '❌ Błąd: ' + error.message;
      }
      
      this.showError(errorMessage);
    }
  }

  // UKRYJ PRODUKT PO DODANIU DO KOSZYKA
  async hideProductAfterCartAdd(productId) {
    if (!productId) {
      return;
    }

    try {
      
      const response = await fetch('https://customify-s56o.vercel.app/api/hide-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: productId })
      });

      if (response.ok) {
        const result = await response.json();
      } else {
        console.error('❌ [CUSTOMIFY] Failed to hide product:', response.status);
      }
    } catch (error) {
      console.error('❌ [CUSTOMIFY] Error hiding product:', error);
    }
  }

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      // ZAWSZE kompresuj na frontend (optymalizacja dla Nano Banana)
      this.compressImage(file).then(compressedFile => {
        this.convertToBase64(compressedFile, resolve, reject);
      }).catch(error => {
        console.error('📱 [MOBILE] Compression failed:', error);
        reject(error);
      });
    });
  }

  convertToBase64(file, resolve, reject) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => {
      console.error('📱 [MOBILE] Base64 conversion failed:', error);
      reject(error);
    };
  }

  compressImage(file) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Oblicz nowe wymiary (max 1024px - dłuższy bok, optymalne dla Nano Banana)
        const maxSize = 1024;
        let { width, height } = img;
        
        // Znajdź dłuższy bok i przeskaluj zachowując proporcje
        const longerSide = Math.max(width, height);
        
        if (longerSide > maxSize) {
          const scale = maxSize / longerSide;
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Narysuj skompresowany obraz
        ctx.drawImage(img, 0, 0, width, height);
        
        // Konwertuj do blob z kompresją
        canvas.toBlob(blob => {
          resolve(blob);
        }, 'image/jpeg', 0.85); // 85% jakość (optymalne dla Nano Banana)
      };
      
      img.onerror = error => {
        console.error('📱 [MOBILE] Image load failed:', error);
        reject(error);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  reset() {
    this.uploadedFile = null;
    this.selectedStyle = null;
    this.selectedSize = null;
    this.transformedImage = null;
    
    this.fileInput.value = '';
    this.uploadArea.style.display = 'block'; // Pokaż pole upload z powrotem
    this.previewArea.style.display = 'none';
    this.stylesArea.style.display = 'none';
    this.sizeArea.style.display = 'block'; // ✅ ZAWSZE WIDOCZNE - nie ukrywaj rozmiarów
    this.actionsArea.style.display = 'none';
    this.resultArea.style.display = 'none';
    this.hideError();
    this.hideSuccess();
    
    this.stylesArea.querySelectorAll('.customify-style-card').forEach(card => card.classList.remove('active'));
    this.sizeArea.querySelectorAll('.customify-size-btn').forEach(btn => btn.classList.remove('active'));
    
    // Przywróć stan początkowy przycisków
    const addToCartBtnMain = document.getElementById('addToCartBtnMain');
    const resetBtn = document.getElementById('resetBtn');
    if (addToCartBtnMain) {
      addToCartBtnMain.style.display = 'inline-block';
    }
    if (resetBtn) {
      resetBtn.style.display = 'none';
    }
    
    // Przywróć kolory przycisków do stanu początkowego
    this.resetButtonColors();
  }

  tryAgain() {
    
    // Ukryj wynik AI
    this.resultArea.style.display = 'none';
    
    // Pokaż style AI i przyciski
    this.stylesArea.style.display = 'block';
    this.actionsArea.style.display = 'flex';
    
    // Pokaż pole upload (jeśli było ukryte)
    this.uploadArea.style.display = 'block';
    
    // Zresetuj wybrane style i rozmiary
    this.selectedStyle = null;
    this.selectedSize = null;
    this.transformedImage = null;
    
    // Usuń aktywne style
    this.stylesArea.querySelectorAll('.customify-style-card').forEach(card => card.classList.remove('active'));
    
    // Usuń aktywne rozmiary
    this.sizeArea.querySelectorAll('.customify-size-btn').forEach(btn => btn.classList.remove('active'));
    
    // Ukryj wiadomości
    this.hideSuccess();
    this.hideError();
    
  }

  showLoading() {
    this.loadingArea.style.display = 'block';
    this.actionsArea.style.display = 'none';
    
    // Animacja paska postępu z etapami
    const progressBar = document.getElementById('progressBar');
    const loadingStage = document.getElementById('loadingStage');
    
    if (progressBar && loadingStage) {
      let progress = 0;
      const stages = [
        { percent: 20, text: 'Przesyłanie zdjęcia...' },
        { percent: 40, text: 'Przygotowywanie AI...' },
        { percent: 60, text: 'Generowanie obrazu...' },
        { percent: 80, text: 'Finalizowanie...' },
        { percent: 95, text: 'Prawie gotowe...' }
      ];
      
      let currentStage = 0;
      progressBar.style.width = '0%';
      loadingStage.textContent = stages[0].text;
      
      this.progressInterval = setInterval(() => {
        if (currentStage < stages.length) {
          const targetPercent = stages[currentStage].percent;
          if (progress < targetPercent) {
            progress += 1;
            progressBar.style.width = progress + '%';
          } else {
            loadingStage.textContent = stages[currentStage].text;
            currentStage++;
          }
        }
      }, 100); // Aktualizacja co 100ms
    }
  }

  hideLoading() {
    // Zatrzymaj animację paska postępu
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    
    // Ustaw pasek na 100% przed ukryciem
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
      progressBar.style.width = '100%';
    }
    
    this.loadingArea.style.display = 'none';
    // NIE pokazuj actionsArea jeśli mamy już wynik AI
    if (!this.transformedImage) {
      this.actionsArea.style.display = 'flex';
    } else {
    }
  }

  showCartLoading() {
    const cartLoadingArea = document.getElementById('cartLoadingArea');
    if (cartLoadingArea) {
      cartLoadingArea.style.display = 'block';
      
      // Animacja paska postępu dla koszyka
      const progressBar = document.getElementById('cartProgressBar');
      const loadingStage = document.getElementById('cartLoadingStage');
      
      if (progressBar && loadingStage) {
        let progress = 0;
        const stages = [
          { percent: 25, text: 'Tworzenie produktu...' },
          { percent: 50, text: 'Przesyłanie obrazu...' },
          { percent: 75, text: 'Dodawanie do koszyka...' },
          { percent: 90, text: 'Finalizowanie...' }
        ];
        
        let currentStage = 0;
        progressBar.style.width = '0%';
        loadingStage.textContent = stages[0].text;
        
        this.cartProgressInterval = setInterval(() => {
          if (currentStage < stages.length) {
            const targetPercent = stages[currentStage].percent;
            if (progress < targetPercent) {
              progress += 1;
              progressBar.style.width = progress + '%';
            } else {
              loadingStage.textContent = stages[currentStage].text;
              currentStage++;
            }
          }
        }, 80); // Szybsza animacja dla koszyka
      }
    }
  }

  hideCartLoading() {
    const cartLoadingArea = document.getElementById('cartLoadingArea');
    if (cartLoadingArea) {
      // Zatrzymaj animację paska postępu
      if (this.cartProgressInterval) {
        clearInterval(this.cartProgressInterval);
        this.cartProgressInterval = null;
      }
      
      // Ustaw pasek na 100% przed ukryciem
      const progressBar = document.getElementById('cartProgressBar');
      if (progressBar) {
        progressBar.style.width = '100%';
      }
      
      cartLoadingArea.style.display = 'none';
    }
  }

  showError(message) {
    // Pokaż błąd w OBUMIASTA miejscach (góra + dół)
    this.errorMessage.textContent = message;
    this.errorMessage.style.display = 'block';
    if (this.errorMessageBottom) {
      this.errorMessageBottom.textContent = message;
      this.errorMessageBottom.style.display = 'block';
    }
  }

  hideError() {
    // Ukryj błąd w OBUMIASTA miejscach
    this.errorMessage.style.display = 'none';
    if (this.errorMessageBottom) {
      this.errorMessageBottom.style.display = 'none';
    }
  }

  showSuccess(message) {
    this.successMessage.textContent = message;
    this.successMessage.style.display = 'block';
  }

  hideSuccess() {
    this.successMessage.style.display = 'none';
  }

  // Zmień kolory przycisków po wygenerowaniu AI
  swapButtonColors() {
    const transformBtn = document.getElementById('transformBtn');
    const addToCartBtnMain = document.getElementById('addToCartBtnMain');
    
    if (transformBtn && addToCartBtnMain) {
      // Po AI: "Zobacz Podgląd" -> czarny, "Dodaj do koszyka" -> czerwony
      transformBtn.classList.remove('customify-btn-red');
      transformBtn.classList.add('customify-btn-primary');
      addToCartBtnMain.classList.remove('customify-btn-primary');
      addToCartBtnMain.classList.add('customify-btn-red');
    }
  }

  // Przywróć kolory przycisków do stanu początkowego
  resetButtonColors() {
    const transformBtn = document.getElementById('transformBtn');
    const addToCartBtnMain = document.getElementById('addToCartBtnMain');
    
    if (transformBtn && addToCartBtnMain) {
      // Na początku: "Zobacz Podgląd" -> czerwony, "Dodaj do koszyka" -> czarny
      transformBtn.classList.remove('customify-btn-primary');
      transformBtn.classList.add('customify-btn-red');
      addToCartBtnMain.classList.remove('customify-btn-red');
      addToCartBtnMain.classList.add('customify-btn-primary');
    }
  }
}

/**
 * CART INTEGRATION - AI Image Display
 */
function initCartIntegration() {
  // Znajdź wszystkie elementy koszyka z AI obrazkami
  const cartItems = document.querySelectorAll('.cart-item, .cart-items__row');
  
  cartItems.forEach(item => {
    // Znajdź ukryte property z AI obrazkiem
    const aiImageProperty = item.querySelector('dd[data-property="_AI_Image_URL"], .cart-items__properties dd');
    
    if (aiImageProperty && aiImageProperty.textContent.includes('replicate.delivery')) {
      const imageUrl = aiImageProperty.textContent.trim();
      
      // Ukryj surowy URL
      const propertyDiv = aiImageProperty.closest('.cart-items__properties');
      if (propertyDiv) {
        propertyDiv.style.display = 'none';
      }
      
      // Dodaj miniaturkę
      const imageCell = item.querySelector('.cart-items__image, .cart-item__image-wrapper');
      if (imageCell && !imageCell.querySelector('.cart-item__ai-image')) {
        const aiImage = document.createElement('img');
        aiImage.src = imageUrl;
        aiImage.alt = 'AI Transformed Image';
        aiImage.className = 'cart-item__ai-image';
        aiImage.style.cssText = 'width: 80px; height: 80px; object-fit: cover; border-radius: 0; border: 2px solid #e0e0e0;';
        
        // Wstaw miniaturkę jako główny obrazek lub obok
        const existingImage = imageCell.querySelector('img');
        if (existingImage) {
          existingImage.replaceWith(aiImage);
        } else {
          imageCell.appendChild(aiImage);
        }
      }
    }
  });
}

/**
 * MOBILE THUMBNAILS - Dodaj miniaturki na mobile
 */
function addMobileThumbnails() {
  // Sprawdź czy jesteśmy na mobile
  if (window.innerWidth > 749) return;
  
  // Znajdź właściwy container - product information media (widoczny na mobile)
  const mediaContainer = document.querySelector('.product-information__media');
  if (!mediaContainer) {
    return;
  }
  
  // Sprawdź czy miniaturki już istnieją
  if (mediaContainer.querySelector('.customify-mobile-thumbnails')) return;
  
  // Znajdź wszystkie obrazy w kontenerze
  const productImages = mediaContainer.querySelectorAll('img');
  if (productImages.length < 2) return; // Potrzebujemy co najmniej 2 obrazy
  
  
  // Stwórz container dla miniaturek
  const thumbnailsContainer = document.createElement('div');
  thumbnailsContainer.className = 'customify-mobile-thumbnails';
  thumbnailsContainer.style.cssText = `
    display: flex !important;
    gap: 8px !important;
    padding: 10px !important;
    justify-content: center !important;
    margin-top: 10px !important;
    flex-wrap: wrap !important;
    width: 100% !important;
  `;
  
  // Dodaj miniaturki (użyj pierwszych 3 obrazów - 0, 1, 2)
  for (let i = 0; i < Math.min(3, productImages.length); i++) {
    const img = productImages[i];
    const thumbnail = document.createElement('div');
    thumbnail.className = 'customify-mobile-thumbnail';
    thumbnail.style.cssText = `
      width: 60px !important;
      height: 60px !important;
      border-radius: 6px !important;
      border: 2px solid #e0e0e0 !important;
      cursor: pointer !important;
      transition: all 0.3s ease !important;
      overflow: hidden !important;
      flex-shrink: 0 !important;
    `;
    
    // Stwórz nowy obraz z tym samym src
    const thumbnailImg = document.createElement('img');
    thumbnailImg.src = img.src;
    thumbnailImg.alt = img.alt || 'Thumbnail';
    thumbnailImg.style.cssText = `
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      border-radius: 4px !important;
    `;
    
    thumbnail.appendChild(thumbnailImg);
    
    // Dodaj event listener do kliknięcia
    thumbnail.addEventListener('click', () => {
      // Znajdź odpowiedni przycisk nawigacji i kliknij go
      const navButtons = document.querySelectorAll('.slideshow-control');
      if (navButtons[i]) {
        navButtons[i].click();
      }
    });
    
    // Hover effect
    thumbnail.addEventListener('mouseenter', () => {
      thumbnail.style.borderColor = '#dc3545';
      thumbnail.style.transform = 'scale(1.05)';
    });
    
    thumbnail.addEventListener('mouseleave', () => {
      thumbnail.style.borderColor = '#e0e0e0';
      thumbnail.style.transform = 'scale(1)';
    });
    
    thumbnailsContainer.appendChild(thumbnail);
  }
  
  // Dodaj container do media container
  mediaContainer.appendChild(thumbnailsContainer);
}

/**
 * INITIALIZATION
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Customify app
  new CustomifyEmbed();
  
  // Initialize cart integration
  initCartIntegration();
  
  // Add mobile thumbnails - WYŁĄCZONE (miniaturki są obsługiwane przez theme.liquid)
  // addMobileThumbnails();
  
  // Re-add thumbnails on resize - WYŁĄCZONE
  // window.addEventListener('resize', () => {
  //   addMobileThumbnails();
  // });
  
  // Clean up dividers and spacing
  window.addEventListener('load', () => {
    setTimeout(() => {
      // Add mobile thumbnails after load - WYŁĄCZONE
      // addMobileThumbnails();
      // USUŃ DIVIDERY FIZYCZNIE Z DOM
      const dividers = document.querySelectorAll('.divider, .divider__line, .divider-AM3M2YnhsTllLTUtCS__divider_VJhene');
      dividers.forEach(divider => {
        if (divider && divider.parentNode) {
          divider.parentNode.removeChild(divider);
        }
      });

      // AGRESYWNE USUNIĘCIE ODSTĘPÓW MIĘDZY TYTUŁEM A BADGE'AMI
      const titleElement = document.querySelector('.view-product-title');
      const badgesElement = document.querySelector('.product-badges');
      
      if (titleElement) {
        titleElement.style.setProperty('margin-bottom', '0px', 'important');
        titleElement.style.setProperty('padding-bottom', '0px', 'important');
        titleElement.style.setProperty('margin', '0 0 0px 0', 'important');
      }
      
      if (badgesElement) {
        badgesElement.style.setProperty('margin-top', '0px', 'important');
        badgesElement.style.setProperty('padding-top', '0px', 'important');
        badgesElement.style.setProperty('margin', '0 0 4px 0', 'important');
        badgesElement.style.setProperty('gap', '2px', 'important');
      }

      // DODATKOWE FORCE HIDE DIVIDERS - INLINE STYLES
      const allDividers = document.querySelectorAll('.divider, .divider__line, .divider-AM3M2YnhsTllLTUtCS__divider_VJhene');
      allDividers.forEach(divider => {
        divider.style.setProperty('display', 'none', 'important');
        divider.style.setProperty('visibility', 'hidden', 'important');
        divider.style.setProperty('opacity', '0', 'important');
        divider.style.setProperty('height', '0', 'important');
        divider.style.setProperty('margin', '0', 'important');
        divider.style.setProperty('padding', '0', 'important');
        divider.style.setProperty('border', 'none', 'important');
      });
    }, 1000); // Zwiększ opóźnienie do 1 sekundy
  });
});

// FUNKCJA NAPRAWY POWIĘKSZONYCH ZDJĘĆ W DIALOGU - UNIWERSALNA
function fixDialogImages() {
  const dialog = document.querySelector('dialog[open]');
  if (!dialog) return;
  
  // Znajdź wszystkie zdjęcia w dialogu
  const allImages = dialog.querySelectorAll('img');
  let largestImg = null;
  let largestWidth = 0;
  
  allImages.forEach(img => {
    const width = img.clientWidth;
    if (width > largestWidth) {
      largestWidth = width;
      largestImg = img;
    }
  });
  
  if (!largestImg) return;
  
  // Wymuś poprawne style - WYPEŁNIA CAŁY KONTENER
  largestImg.style.setProperty('object-fit', 'cover', 'important');
  largestImg.style.setProperty('max-height', 'none', 'important');
  largestImg.style.setProperty('height', '100%', 'important');
  largestImg.style.setProperty('width', '100%', 'important');
  largestImg.style.setProperty('object-position', 'center', 'important');
  
  // Styluj kontener
  if (largestImg.parentElement) {
    largestImg.parentElement.style.setProperty('height', '100%', 'important');
  }
  
}

// Event listener dla kliknięć w przyciski powiększenia
document.addEventListener('click', function(e) {
  const zoomButton = e.target.closest('.product-media-container__zoom-button, button[class*="zoom"]');
  if (zoomButton) {
    setTimeout(fixDialogImages, 100);  // Czekaj aż dialog się otworzy
    setTimeout(fixDialogImages, 300);  // Ponownie po załadowaniu
    setTimeout(fixDialogImages, 600);  // I jeszcze raz dla pewności
  }
});

// Regularnie sprawdzaj czy dialog jest otwarty i naprawiaj
setInterval(fixDialogImages, 300);

