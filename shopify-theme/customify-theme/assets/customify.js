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
    
    // 🎨 GALERIA: Załaduj galerię przy starcie (jeśli są zapisane generacje)
    console.log('🎨 [GALLERY] Calling updateGallery from init()');
    this.updateGallery();
  }

  // ===== USAGE LIMITS FUNCTIONS =====
  
  /**
   * Pobiera informacje o zalogowanym użytkowniku Shopify
   * @returns {Object|null} {customerId, email, customerAccessToken} lub null jeśli niezalogowany
   */
  getCustomerInfo() {
    console.log('🔍 [USAGE] === DEBUGGING CUSTOMER DETECTION ===');
    console.log('🔍 [USAGE] window.ShopifyCustomer:', window.ShopifyCustomer);
    console.log('🔍 [USAGE] window.Shopify:', window.Shopify);
    console.log('🔍 [USAGE] document.cookie:', document.cookie);
    
    // METODA 1: NOWY SYSTEM - window.ShopifyCustomer (z Liquid w theme.liquid)
    if (window.ShopifyCustomer && window.ShopifyCustomer.loggedIn && window.ShopifyCustomer.id) {
      console.log('✅ [USAGE] METODA 1: Zalogowany użytkownik (NEW OAuth)');
      console.log('📊 [USAGE] Customer Email:', window.ShopifyCustomer.email);
      console.log('📊 [USAGE] Customer ID:', window.ShopifyCustomer.id);
      
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
      console.log('✅ [USAGE] METODA 2: Wykryto cookie Shopify - użytkownik zalogowany');
      
      // Spróbuj wyciągnąć ID z cookie
      const customerIdCookie = cookies.find(c => c.startsWith('customer_id='));
      let customerId = null;
      
      if (customerIdCookie) {
        customerId = customerIdCookie.split('=')[1];
        console.log('📊 [USAGE] Customer ID z cookie:', customerId);
      }
      
      // Jeśli brak ID, użyj window.ShopifyCustomer.id jako fallback
      if (!customerId && window.ShopifyCustomer && window.ShopifyCustomer.id) {
        customerId = window.ShopifyCustomer.id;
        console.log('📊 [USAGE] Customer ID z window.ShopifyCustomer:', customerId);
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
      console.log('✅ [USAGE] METODA 3: Zalogowany użytkownik (OLD system)');
      console.log('📊 [USAGE] Customer Email:', window.Shopify.customerEmail);
      
      const customerId = window.meta?.customer?.id || window.ShopifyCustomer?.id || null;
      const customerAccessToken = localStorage.getItem('shopify_customer_access_token');
      
      return {
        customerId: customerId,
        email: window.Shopify.customerEmail,
        customerAccessToken: customerAccessToken || 'oauth_session'
      };
    }
    
    console.log('❌ [USAGE] WSZYSTKIE METODY FAILED - Niezalogowany użytkownik');
    console.log('🔍 [USAGE] === END DEBUGGING ===');
    return null;
  }

  /**
   * Sprawdza liczbę użyć z localStorage (dla niezalogowanych)
   * @returns {number} Liczba użyć
   */
  getLocalUsageCount() {
    const count = parseInt(localStorage.getItem('customify_usage_count') || '0', 10);
    console.log('📊 [USAGE] localStorage usage count:', count);
    return count;
  }

  /**
   * Inkrementuje licznik w localStorage (dla niezalogowanych)
   */
  incrementLocalUsage() {
    const currentCount = this.getLocalUsageCount();
    const newCount = currentCount + 1;
    localStorage.setItem('customify_usage_count', newCount.toString());
    console.log('➕ [USAGE] localStorage incremented:', currentCount, '→', newCount);
    this.showUsageCounter(); // Odśwież licznik w UI
  }

  /**
   * Zapisuje generację AI w localStorage
   */
  saveAIGeneration(originalImage, transformedImage, style, size) {
    const generation = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      originalImage: originalImage, // base64 lub URL
      transformedImage: transformedImage, // URL do AI obrazu
      style: style,
      size: size,
      thumbnail: transformedImage // dla szybkiego podglądu
    };

    // Pobierz istniejące generacje
    const existingGenerations = this.getAIGenerations();
    
    // Dodaj nową generację na początku
    existingGenerations.unshift(generation);
    
    // Zachowaj tylko ostatnie 10 generacji
    const limitedGenerations = existingGenerations.slice(0, 10);
    
    // Zapisz z powrotem do localStorage
    localStorage.setItem('customify_ai_generations', JSON.stringify(limitedGenerations));
    
    console.log('🎨 [GALLERY] Saved AI generation:', generation.id, style, size);
    
    // Odśwież galerię
    this.updateGallery();
  }

  /**
   * Pobiera zapisane generacje AI
   */
  getAIGenerations() {
    try {
      const stored = localStorage.getItem('customify_ai_generations');
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      
      // Filtruj tylko generacje z poprawnym formatem base64
      const validGenerations = parsed.filter(gen => {
        if (!gen.originalImage || typeof gen.originalImage !== 'string') {
          console.log('⚠️ [GALLERY] Usuwam generację z niepoprawnym originalImage:', gen.id);
          return false;
        }
        
        // Sprawdź czy to base64 data URI
        if (!gen.originalImage.startsWith('data:image/')) {
          console.log('⚠️ [GALLERY] Usuwam generację bez data URI:', gen.id);
          return false;
        }
        
        return true;
      });
      
      // Jeśli usunięto jakieś generacje, zapisz tylko poprawne
      if (validGenerations.length !== parsed.length) {
        localStorage.setItem('customify_ai_generations', JSON.stringify(validGenerations));
        console.log(`🧹 [GALLERY] Wyczyszczono ${parsed.length - validGenerations.length} niepoprawnych generacji`);
      }
      
      return validGenerations;
    } catch (error) {
      console.error('❌ [GALLERY] Error loading generations:', error);
      return [];
    }
  }

  /**
   * Aktualizuje galerię ostatnich generacji
   */
  updateGallery() {
    const generations = this.getAIGenerations();
    console.log('🎨 [GALLERY] updateGallery called, generations:', generations.length);
    
    if (generations.length === 0) {
      // Ukryj galerię jeśli brak generacji
      const gallery = document.getElementById('aiGallery');
      if (gallery) {
        gallery.style.display = 'none';
      }
      console.log('🎨 [GALLERY] No generations, hiding gallery');
      return;
    }

    // Znajdź lub stwórz kontener galerii
    let gallery = document.getElementById('aiGallery');
    if (!gallery) {
      gallery = this.createGalleryContainer();
    }

    // Wyczyść poprzednie elementy
    gallery.innerHTML = '';

    // Dodaj nagłówek
    const header = document.createElement('h4');
    header.textContent = '🎨 Ostatnie generacje';
    header.style.cssText = `
      margin: 0 0 15px 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
      text-align: center;
    `;
    gallery.appendChild(header);

    // Stwórz grid z generacjami
    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    `;

    generations.forEach(generation => {
      const item = this.createGalleryItem(generation);
      grid.appendChild(item);
    });

    gallery.appendChild(grid);
    gallery.style.display = 'block';
  }

  /**
   * Tworzy kontener galerii
   */
  createGalleryContainer() {
    const gallery = document.createElement('div');
    gallery.id = 'aiGallery';
    gallery.style.cssText = `
      margin: 20px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    `;

    // Wstaw galerię przed accordion
    const accordion = document.querySelector('.product-details-accordion');
    console.log('🎨 [GALLERY] Looking for accordion:', accordion);
    if (accordion) {
      accordion.parentNode.insertBefore(gallery, accordion);
      console.log('🎨 [GALLERY] Gallery inserted before accordion');
    } else {
      // Fallback - wstaw na końcu body
      document.body.appendChild(gallery);
      console.log('🎨 [GALLERY] Gallery inserted at end of body (fallback)');
    }

    return gallery;
  }

  /**
   * Tworzy element galerii dla pojedynczej generacji
   */
  createGalleryItem(generation) {
    const item = document.createElement('div');
    item.style.cssText = `
      position: relative;
      cursor: pointer;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s ease;
    `;

    // Obraz
    const img = document.createElement('img');
    img.src = generation.thumbnail;
    img.style.cssText = `
      width: 100%;
      height: 120px;
      object-fit: cover;
      display: block;
    `;
    img.alt = `${generation.style} - ${generation.size}`;

    // Overlay z informacjami
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0,0,0,0.8));
      color: white;
      padding: 8px;
      font-size: 0.8rem;
    `;
    overlay.innerHTML = `
      <div style="font-weight: 600;">${generation.style}</div>
      <div style="opacity: 0.8;">${generation.size}</div>
    `;

    // Hover effect
    item.addEventListener('mouseenter', () => {
      item.style.transform = 'translateY(-4px)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.transform = 'translateY(0)';
    });

    // Kliknięcie - użyj ponownie
    item.addEventListener('click', () => {
      this.reuseGeneration(generation);
    });

    item.appendChild(img);
    item.appendChild(overlay);

    return item;
  }

  /**
   * Konwertuje base64 na File object
   */
  base64ToFile(base64String, filename) {
    return new Promise((resolve, reject) => {
      try {
        // Sprawdź czy to już jest string (base64)
        if (typeof base64String !== 'string') {
          reject(new Error('originalImage is not a base64 string'));
          return;
        }
        
        // Wyciągnij typ MIME i dane z base64
        const [header, data] = base64String.split(',');
        const mimeMatch = header.match(/data:([^;]+)/);
        if (!mimeMatch) {
          reject(new Error('Invalid base64 data URI format'));
          return;
        }
        const mimeType = mimeMatch[1];
        
        // Konwertuj base64 na binary
        const binaryString = atob(data);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Utwórz File object
        const file = new File([bytes], filename, { type: mimeType });
        resolve(file);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Używa ponownie wybraną generację
   */
  reuseGeneration(generation) {
    console.log('🔄 [GALLERY] Reusing generation:', generation.id);
    
    // Ustaw obraz jako aktualny
    if (generation.originalImage) {
      // Konwertuj base64 na File object
      this.base64ToFile(generation.originalImage, 'reused-image.jpg').then(file => {
        this.uploadedFile = file;
        this.showPreview(file);
        this.hideError();
      }).catch(error => {
        console.error('❌ [GALLERY] Error converting base64 to file:', error);
        console.log('⚠️ [GALLERY] Stare generacje z nieprawidłowym formatem - wyczyść localStorage lub wygeneruj nową');
        this.showError('Ta generacja ma stary format. Wygeneruj nowy obraz AI.');
      });
    }
    
    // Ustaw styl
    if (generation.style) {
      const styleCard = document.querySelector(`[data-style="${generation.style}"]`);
      if (styleCard) {
        this.selectStyle(styleCard);
      }
    }
    
    // Ustaw rozmiar
    if (generation.size) {
      const sizeBtn = document.querySelector(`[data-size="${generation.size}"]`);
      if (sizeBtn) {
        this.selectSize(sizeBtn);
      }
    }

    // Pokaż komunikat
    this.showSuccess('Generacja załadowana! Możesz teraz wykonać transformację.');
  }

  /**
   * Sprawdza czy użytkownik może wykonać transformację
   * @returns {Promise<boolean>} true jeśli może, false jeśli przekroczył limit
   */
  async checkUsageLimit() {
    const customerInfo = this.getCustomerInfo();
    
    if (!customerInfo) {
      // Niezalogowany - sprawdź localStorage (limit 10)
      const localCount = this.getLocalUsageCount();
      const FREE_LIMIT = 10;
      
      console.log(`📊 [USAGE] Niezalogowany: ${localCount}/${FREE_LIMIT} użyć`);
      
      if (localCount >= FREE_LIMIT) {
        this.showLoginModal(localCount, FREE_LIMIT);
        return false;
      }
      
      return true;
    } else {
      // Zalogowany - sprawdź Shopify Metafields przez API
      console.log('📊 [USAGE] Zalogowany - sprawdzam limit przez API');
      
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
        console.log('📊 [USAGE] API response:', data);
        
        if (data.remainingCount <= 0) {
          this.showError(`Wykorzystałeś wszystkie transformacje (${data.totalLimit}). Skontaktuj się z nami dla więcej.`);
          return false;
        }
        
        console.log(`✅ [USAGE] Pozostało ${data.remainingCount} transformacji`);
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
    
    // ⚠️ DEBUG: Pokaż dokładnie co zapisujemy
    console.log('🔍 [DEBUG] window.location.pathname:', window.location.pathname);
    console.log('🔍 [DEBUG] window.location.search:', window.location.search);
    console.log('🔍 [DEBUG] returnUrl (złożony):', returnUrl);
    console.log('🔍 [DEBUG] window.location.href (pełny):', window.location.href);
    
    // Zapisz return URL w localStorage (Shopify może ignorować return_url parameter)
    localStorage.setItem('customify_return_url', returnUrl);
    localStorage.setItem('customify_return_url_timestamp', Date.now().toString());
    console.log('💾 [USAGE] Saved return URL to localStorage:', returnUrl);
    console.log('💾 [USAGE] Timestamp:', Date.now());
    
    // Użyj pełnego URL z domeną - Shopify potrzebuje pełnego URL dla return_url
    const fullReturnUrl = window.location.origin + returnUrl;
    console.log('🌐 [DEBUG] Full return URL:', fullReturnUrl);
    
    const registerUrl = `/account/register?return_url=${encodeURIComponent(fullReturnUrl)}`;
    const loginUrl = `/account/login?return_url=${encodeURIComponent(fullReturnUrl)}`;
    
    console.log('🔗 [DEBUG] Register URL:', registerUrl);
    console.log('🔗 [DEBUG] Login URL:', loginUrl);
    
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
          
          <div style="
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
          ">
            <p style="
              color: #666;
              font-size: 14px;
              margin: 0;
            ">
              Masz już konto? 
              <a href="${loginUrl}" style="
                color: #1565C0;
                text-decoration: underline;
                font-weight: bold;
              ">Zaloguj się tutaj</a>
            </p>
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
        console.log('🚫 [USAGE] Użytkownik anulował przekierowanie');
      }
    };
    
    console.log('⏰ [USAGE] Countdown started - auto-redirect to REGISTER in 5 seconds');
  }

  /**
   * Pokazuje licznik użyć w UI
   */
  async showUsageCounter() {
    console.log('🔍 [USAGE] showUsageCounter called');
    const customerInfo = this.getCustomerInfo();
    let counterHTML = '';
    
    console.log('🔍 [USAGE] customerInfo:', customerInfo);
    
    if (!customerInfo) {
      // Niezalogowany - NIE POKAZUJ komunikatu o punktach
      // Modal rejestracji pojawi się dopiero po wyczerpaniu wszystkich 10 transformacji
      const localCount = this.getLocalUsageCount();
      const FREE_LIMIT = 10;
      
      // Brak komunikatu - użytkownik nie wie ile ma punktów
      // Dopiero po 10 transformacjach pojawi się modal rejestracji
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
    
    // Wstaw licznik do DOM (przed upload area)
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea && counterHTML) {
      // Usuń stary licznik jeśli istnieje
      const oldCounter = document.getElementById('usageCounter');
      if (oldCounter) {
        oldCounter.remove();
      }
      
      // Wstaw nowy licznik przed upload area
      uploadArea.insertAdjacentHTML('beforebegin', counterHTML);
      console.log('✅ [USAGE] Counter displayed:', customerInfo ? 'Logged in' : 'Anonymous');
    } else {
      console.log('⚠️ [USAGE] Upload area not found - counter not displayed');
    }
  }

  // filterStylesForProduct() USUNIĘTE - logika przeniesiona na server-side (Shopify Liquid)

  // ETSY-STYLE EXPANDABLE DESCRIPTION USUNIĘTE - opisy produktów są teraz pełne

  // ACCORDION: SZCZEGÓŁY PRODUKTU
  setupAccordion() {
    console.log('🎯 [CUSTOMIFY] Setting up accordion...');
    
    // Znajdź wszystkie accordion items
    const accordionItems = document.querySelectorAll('.accordion-item');
    
    if (!accordionItems || accordionItems.length === 0) {
      console.log('⚠️ [CUSTOMIFY] No accordion items found');
      return;
    }
    
    console.log('✅ [CUSTOMIFY] Found', accordionItems.length, 'accordion items');
    
    // Dodaj event listener do każdego accordion header
    accordionItems.forEach((item, index) => {
      const header = item.querySelector('.accordion-header');
      
      if (!header) {
        console.log('⚠️ [CUSTOMIFY] No header found for item', index);
        return;
      }
      
      // Event listener - TYLKO toggle klasy (BEZ DOM manipulation)
      header.addEventListener('click', () => {
        const isExpanded = item.classList.contains('expanded');
        
        if (isExpanded) {
          // Zwiń
          item.classList.remove('expanded');
          console.log('🔽 [CUSTOMIFY] Collapsed:', item.dataset.accordion);
        } else {
          // Rozwiń (opcjonalnie: zwiń inne)
          // accordionItems.forEach(otherItem => otherItem.classList.remove('expanded'));
          item.classList.add('expanded');
          console.log('🔼 [CUSTOMIFY] Expanded:', item.dataset.accordion);
        }
      });
      
      console.log('✅ [CUSTOMIFY] Accordion item', index, 'setup complete');
    });
    
    console.log('✅ [CUSTOMIFY] Accordion setup complete!');
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
      console.log('🎯 [CUSTOMIFY] Found product details column, inserting app at top');
      
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
      console.log('🎯 [CUSTOMIFY] Title already moved to top');
      return;
    }

    console.log('🎯 [CUSTOMIFY] Moving title to top of product info column');

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

    console.log('✅ [CUSTOMIFY] Title moved to top successfully!');
  }



  // DODAJ DIVIDER POD TYTUŁEM
  addDividerAfterTitle() {
    // Sprawdź czy już nie ma dividera
    if (document.querySelector('.customify-title-divider')) {
      console.log('🎯 [CUSTOMIFY] Divider already exists');
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

    console.log('✅ [CUSTOMIFY] Divider added after title');
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
          console.log('🎯 [CUSTOMIFY] Cena przeniesiona po tytule z badge\'ami');
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
    if (!file.type.startsWith('image/')) {
      this.showError('Proszę wybrać plik obrazu (JPG, PNG, GIF)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.showError('Plik jest za duży. Maksymalny rozmiar to 10MB');
      return;
    }

    this.uploadedFile = file;
    this.showPreview(file);
    this.hideError();
  }

  showPreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      // Walidacja rozdzielczości obrazu
      const img = new Image();
      img.onload = () => {
        // Wykryj typ produktu - koty mają niższy limit
        const isCatProduct = window.location.pathname.includes('koty-krolewskie');
        const minWidth = isCatProduct ? 600 : 768;
        const minHeight = isCatProduct ? 600 : 768;
        
        console.log(`🖼️ [IMAGE] Rozdzielczość: ${img.width}×${img.height}`);
        console.log(`🖼️ [IMAGE] Produkt: ${isCatProduct ? 'Koty (600px min)' : 'Inne (768px min)'}`);
        
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
        console.log(`✅ [IMAGE] Rozdzielczość OK (min ${minWidth}×${minHeight}px)`);
        
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
        this.showError('Nie można wczytać obrazu. Wybierz inny plik.');
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
    console.log('📏 [SIZE] Selected size:', this.selectedSize);
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
        console.log('❌ [USAGE] Limit przekroczony - przerwano transformację');
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
      console.log('📊 [GA4] Event sent: zobacz_podglad_click', {
        style: this.selectedStyle,
        url: window.location.pathname
      });
    }

    this.showLoading();
    this.hideError();
    
    if (retryCount > 0) {
      console.log(`🔄 [MOBILE] Retry attempt ${retryCount}/3`);
    }

    try {
      const base64 = await this.fileToBase64(this.uploadedFile);
      console.log('📱 [MOBILE] Starting transform request...');
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes
      
      console.log('📱 [MOBILE] Sending request to transform API...');
      console.log('📱 [MOBILE] Base64 length:', base64.length, 'characters');
      console.log('📱 [MOBILE] Base64 preview:', base64.substring(0, 50) + '...');
      
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
      
      console.log('📱 [MOBILE] Request body size:', JSON.stringify(requestBody).length, 'bytes');
      console.log('👤 [MOBILE] Customer info:', customerInfo ? 'zalogowany' : 'niezalogowany');
      
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
      console.log('📱 [MOBILE] Response received:', response.status, response.statusText);
      console.log('📱 [MOBILE] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📱 [MOBILE] Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('📱 [MOBILE] Response JSON parsed successfully');
      if (result.success) {
        this.transformedImage = result.transformedImage;
        this.showResult(result.transformedImage);
        this.showSuccess('Teraz wybierz rozmiar obrazu');
        
        // 🎨 GALERIA: Zapisz generację do localStorage
        this.saveAIGeneration(
          base64,                     // Oryginalne zdjęcie (base64)
          result.transformedImage,    // AI obraz URL
          this.selectedStyle,         // Styl (pixar, boho, etc)
          this.selectedSize           // Rozmiar (a4, a3, etc)
        );
        
        // ✅ USAGE LIMITS: Inkrementuj licznik dla niezalogowanych (zalogowani są inkrementowani w API)
        if (!customerInfo) {
          this.incrementLocalUsage();
          console.log('➕ [USAGE] localStorage incremented after successful transform');
        } else {
          // Zalogowani - odśwież licznik z API (został zaktualizowany w backend)
          this.showUsageCounter();
          console.log('🔄 [USAGE] Counter refreshed for logged-in user');
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
        console.log(`🔄 [MOBILE] Retrying in 2 seconds... (attempt ${retryCount + 1}/3)`);
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

  // FUNKCJA DODAWANIA WATERMARKU
  async addWatermark(imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Rysuj oryginalny obraz
          ctx.drawImage(img, 0, 0);
          
          // ===== WZÓR DIAGONALNY - "Lumly.pl" i "Podgląd" NA PRZEMIAN =====
          ctx.save();
          ctx.font = 'bold 30px Arial';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.lineWidth = 1.5;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Obróć canvas
          ctx.translate(canvas.width/2, canvas.height/2);
          ctx.rotate(-30 * Math.PI / 180);
          ctx.translate(-canvas.width/2, -canvas.height/2);
          
          // Rysuj watermarki w siatce - na przemian "Lumly.pl" i "Podgląd"
          const spacing = 180;
          let textIndex = 0;
          const texts = ['Lumly.pl', 'Podgląd'];
          
          for(let y = -canvas.height; y < canvas.height * 2; y += spacing) {
            for(let x = -canvas.width; x < canvas.width * 2; x += spacing * 1.5) {
              const text = texts[textIndex % 2];
              ctx.strokeText(text, x, y);
              ctx.fillText(text, x, y);
              textIndex++;
            }
            // Zmień wzór co wiersz dla lepszego efektu
            textIndex++;
          }
          
          ctx.restore();
          
          // Zwróć obraz z watermarkiem jako Data URL
          resolve(canvas.toDataURL('image/jpeg', 0.92));
        } catch (error) {
          console.error('❌ Watermark error:', error);
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        console.error('❌ Image load error:', error);
        reject(error);
      };
      
      img.src = imageUrl;
    });
  }

  async showResult(imageUrl) {
    console.log('🎯 [CUSTOMIFY] showResult called, hiding actionsArea and stylesArea');
    
    // WATERMARK WŁĄCZONY
    try {
      const watermarkedImage = await this.addWatermark(imageUrl);
      this.resultImage.src = watermarkedImage;
      console.log('🎨 [CUSTOMIFY] Watermark dodany do podglądu');
    } catch (error) {
      console.error('❌ [CUSTOMIFY] Watermark error:', error);
      this.resultImage.src = imageUrl;
    }
    
    this.resultArea.style.display = 'block';
    
    // Rozmiary są zawsze widoczne na górze (poza resultArea)
    this.sizeArea.style.display = 'block';
    console.log('🎯 [CUSTOMIFY] Size area visible on top (outside resultArea)');
    
    // UKRYJ przyciski "Przekształć z AI" i "Resetuj" (główne actionsArea)
    this.actionsArea.style.display = 'none';
    console.log('🎯 [CUSTOMIFY] actionsArea hidden:', this.actionsArea.style.display);
    
    // UKRYJ style po przekształceniu
    this.stylesArea.style.display = 'none';
    console.log('🎯 [CUSTOMIFY] stylesArea hidden:', this.stylesArea.style.display);
    
    // Zmień kolory przycisków po wygenerowaniu AI
    this.swapButtonColors();
    
    // UKRYJ pole upload po przekształceniu
    this.uploadArea.style.display = 'none';
    console.log('🎯 [CUSTOMIFY] uploadArea hidden:', this.uploadArea.style.display);
  }

  // NAPRAWIONA FUNKCJA: STWÓRZ NOWY PRODUKT Z OBRAZKIEM AI (UKRYTY W KATALOGU)
  async addToCart() {
    console.log('🛒 [CUSTOMIFY] addToCart called with:', {
      transformedImage: !!this.transformedImage,
      selectedStyle: this.selectedStyle,
      selectedSize: this.selectedSize
    });
    
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

    console.log('🛒 [CUSTOMIFY] Starting addToCart process...');
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
      
      console.log('🆔 [CUSTOMIFY] Original product ID:', productId);
      
      const productData = {
        originalImage: await this.fileToBase64(this.uploadedFile),
        transformedImage: this.transformedImage,
        style: this.selectedStyle,
        size: this.selectedSize,
        originalProductTitle: document.querySelector('h1, .product-title, .view-product-title')?.textContent?.trim() || 'Produkt',
        originalProductId: productId // ✅ Dodano ID produktu do pobrania ceny z Shopify
      };

      console.log('🛒 [CUSTOMIFY] Creating product with data:', productData);
      
      // Stwórz nowy produkt z obrazkiem AI jako głównym obrazem
      const response = await fetch('https://customify-s56o.vercel.app/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      console.log('🛒 [CUSTOMIFY] API response status:', response.status);
      const result = await response.json();
      console.log('🛒 [CUSTOMIFY] API response:', result);

      if (result.success) {
        this.showSuccess('✅ ' + (result.message || 'Produkt został utworzony!'));
        console.log('✅ [CUSTOMIFY] Product created:', result.product);
        
        // Obraz AI jest już głównym obrazem produktu
        
        if (result.variantId) {
          console.log('🛒 [CUSTOMIFY] Attempting to add to cart with Variant ID:', result.variantId);
          console.log('🛒 [CUSTOMIFY] Product ID:', result.productId);
          console.log('🛒 [CUSTOMIFY] Variant ID type:', typeof result.variantId);
          console.log('🛒 [CUSTOMIFY] Variant ID length:', result.variantId.toString().length);
          
          // NAPRAWIONA METODA: Użyj bezpośredniego przekierowania zamiast formularza
          const properties = {
            'Styl AI': this.selectedStyle,
            'Rozmiar': this.selectedSize,
            '_AI_Image_URL': result.imageUrl || this.transformedImage,  // ✅ UKRYTY przed klientem (podkreślnik na początku)
            '_AI_Image_Direct': this.transformedImage,  // Oryginalny link z Replicate (backup)
            '_Order_ID': result.orderId || Date.now().toString()  // Unikalny ID zamówienia
          };
          
          console.log('🖼️ [CUSTOMIFY] Image URLs:', {
            shopifyImageUrl: result.imageUrl,
            replicateImageUrl: this.transformedImage,
            orderId: result.orderId
          });
          
          // Buduj URL z parametrami
          const params = new URLSearchParams();
          params.append('id', result.variantId);
          params.append('quantity', '1');
          
          // Dodaj właściwości
          Object.entries(properties).forEach(([key, value]) => {
            params.append(`properties[${key}]`, value);
          });
          
          const cartUrl = `/cart/add?${params.toString()}`;
          console.log('🛒 [CUSTOMIFY] Cart URL:', cartUrl);
          
          // DODAJ DO KOSZYKA PRZEZ FETCH (żeby móc ukryć produkt po dodaniu)
          try {
            const cartResponse = await fetch(cartUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              }
            });
            
            if (cartResponse.ok) {
              console.log('✅ [CUSTOMIFY] Product added to cart successfully');
              
              // Ukryj pasek postępu
              this.hideCartLoading();
              
              // Przekieruj do koszyka
              window.location.href = '/cart';
              
              // PRODUKT ZOSTANIE UKRYTY PO FINALIZACJI TRANSAKCJI (webhook orders/paid)
            } else {
              console.error('❌ [CUSTOMIFY] Failed to add to cart:', cartResponse.status);
              this.hideCartLoading();
              this.showError('❌ Błąd podczas dodawania do koszyka');
            }
          } catch (error) {
            console.error('❌ [CUSTOMIFY] Cart add error:', error);
            this.hideCartLoading();
            this.showError('❌ Błąd połączenia z koszykiem');
          }
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
      console.log('⚠️ [CUSTOMIFY] No product ID to hide');
      return;
    }

    try {
      console.log('🔒 [CUSTOMIFY] Hiding product after cart add:', productId);
      
      const response = await fetch('https://customify-s56o.vercel.app/api/hide-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: productId })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [CUSTOMIFY] Product hidden successfully:', result);
      } else {
        console.error('❌ [CUSTOMIFY] Failed to hide product:', response.status);
      }
    } catch (error) {
      console.error('❌ [CUSTOMIFY] Error hiding product:', error);
    }
  }

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      console.log('📱 [MOBILE] Converting file to base64...');
      console.log('📱 [MOBILE] File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // ZAWSZE kompresuj na frontend (optymalizacja dla Nano Banana)
      console.log('📱 [MOBILE] Compressing image for Nano Banana optimization...');
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
      console.log('📱 [MOBILE] Base64 conversion successful:', {
        fullResultLength: result.length,
        base64Length: base64.length,
        preview: base64.substring(0, 50) + '...'
      });
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
          console.log('📱 [MOBILE] Image compressed:', {
            originalSize: file.size,
            compressedSize: blob.size,
            compressionRatio: ((1 - blob.size / file.size) * 100).toFixed(1) + '%',
            dimensions: `${width}x${height}`,
            maxSize: maxSize
          });
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
    console.log('🔄 [CUSTOMIFY] tryAgain called - returning to style selection');
    
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
    
    console.log('🔄 [CUSTOMIFY] tryAgain completed - user can select new style');
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
    console.log('🎯 [CUSTOMIFY] hideLoading called, transformedImage:', !!this.transformedImage);
    if (!this.transformedImage) {
      this.actionsArea.style.display = 'flex';
      console.log('🎯 [CUSTOMIFY] actionsArea shown because no transformedImage');
    } else {
      console.log('🎯 [CUSTOMIFY] actionsArea NOT shown because transformedImage exists');
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
      console.log('🔄 [CUSTOMIFY] Button colors swapped after AI generation');
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
      console.log('🔄 [CUSTOMIFY] Button colors reset to initial state');
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
    console.log('🎯 [CUSTOMIFY] Media container not found, skipping thumbnails');
    return;
  }
  
  // Sprawdź czy miniaturki już istnieją
  if (mediaContainer.querySelector('.customify-mobile-thumbnails')) return;
  
  // Znajdź wszystkie obrazy w kontenerze
  const productImages = mediaContainer.querySelectorAll('img');
  if (productImages.length < 2) return; // Potrzebujemy co najmniej 2 obrazy
  
  console.log('🎯 [CUSTOMIFY] Dodaję miniaturki na mobile, znaleziono', productImages.length, 'obrazów');
  
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
        console.log('🎯 [CUSTOMIFY] Kliknięto miniaturkę', i);
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
  console.log('✅ [CUSTOMIFY] Miniaturki na mobile dodane pomyślnie');
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
          console.log('🎯 [CUSTOMIFY] Divider usunięty z DOM');
        }
      });

      // AGRESYWNE USUNIĘCIE ODSTĘPÓW MIĘDZY TYTUŁEM A BADGE'AMI
      const titleElement = document.querySelector('.view-product-title');
      const badgesElement = document.querySelector('.product-badges');
      
      if (titleElement) {
        titleElement.style.setProperty('margin-bottom', '0px', 'important');
        titleElement.style.setProperty('padding-bottom', '0px', 'important');
        titleElement.style.setProperty('margin', '0 0 0px 0', 'important');
        console.log('🎯 [CUSTOMIFY] Odstępy tytułu usunięte (inline)');
      }
      
      if (badgesElement) {
        badgesElement.style.setProperty('margin-top', '0px', 'important');
        badgesElement.style.setProperty('padding-top', '0px', 'important');
        badgesElement.style.setProperty('margin', '0 0 4px 0', 'important');
        badgesElement.style.setProperty('gap', '2px', 'important');
        console.log('🎯 [CUSTOMIFY] Odstępy badge\'ów zminimalizowane (inline)');
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
        console.log('🎯 [CUSTOMIFY] Divider ukryty (inline styles)');
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
  
  console.log('✅ Zdjęcie w dialogu naprawione - brak białych pól!');
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

