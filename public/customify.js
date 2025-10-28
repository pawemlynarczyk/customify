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
    this.updateGallery().catch(error => {
      console.error('❌ [GALLERY] Error updating gallery on init:', error);
    });
    
    // 💰 CENA: Ustaw domyślny rozmiar i aktualizuj cenę
    this.initializeDefaultPrice();
  }
  

  // ===== USAGE LIMITS FUNCTIONS =====
  
  /**
   * Pobiera informacje o zalogowanym użytkowniku Shopify
   * @returns {Object|null} {customerId, email, customerAccessToken} lub null jeśli niezalogowany
   */
  getCustomerInfo() {
    // Debug info removed for security
    
    // METODA 1: NOWY SYSTEM - window.ShopifyCustomer (z Liquid w theme.liquid)
    if (window.ShopifyCustomer && window.ShopifyCustomer.loggedIn && window.ShopifyCustomer.id) {
      // Customer detection successful
      
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
      // Cookie-based customer detection
      
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
      // Legacy customer detection
      
      const customerId = window.meta?.customer?.id || window.ShopifyCustomer?.id || null;
      const customerAccessToken = localStorage.getItem('shopify_customer_access_token');
      
      return {
        customerId: customerId,
        email: window.Shopify.customerEmail,
        customerAccessToken: customerAccessToken || 'oauth_session'
      };
    }
    
    // No customer detected
    return null;
  }

  /**
   * Sprawdza liczbę użyć z localStorage (dla niezalogowanych)
   * @returns {number} Liczba użyć
   */
  getLocalUsageCount() {
    const count = parseInt(localStorage.getItem('customify_usage_count') || '0', 10);
    // Local usage count retrieved
    return count;
  }

  /**
   * Inkrementuje licznik w localStorage (dla niezalogowanych)
   */
  incrementLocalUsage() {
    const currentCount = this.getLocalUsageCount();
    const newCount = currentCount + 1;
    localStorage.setItem('customify_usage_count', newCount.toString());
    // Usage count incremented
    this.showUsageCounter(); // Odśwież licznik w UI
  }

  /**
   * Zapisuje generację AI w localStorage
   */
  async saveAIGeneration(originalImage, transformedImage, style, size) {
    console.log('💾 [CACHE] Saving AI generation to Vercel Blob...');
    
    // ZAWSZE używamy URL (zamiast base64) dla localStorage
    let transformedImageUrl = transformedImage; // fallback
    
    try {
      // ✅ Dla base64 (karykatura, król) - ZAPISZ NA VERCEL BLOB i dostać URL
      if (transformedImage && transformedImage.startsWith('data:image/')) {
        console.log('🎨 [CACHE] Detected base64 image (Segmind API), uploading to Vercel Blob...');
        transformedImageUrl = await this.saveToVercelBlob(transformedImage, `ai-${Date.now()}.jpg`);
        console.log('✅ [CACHE] Uploaded to Vercel Blob:', transformedImageUrl?.substring(0, 50));
      } else if (transformedImage && (transformedImage.startsWith('http://') || transformedImage.startsWith('https://'))) {
        console.log('✅ [CACHE] AI result already has URL, using directly:', transformedImage);
        transformedImageUrl = transformedImage;
      }
    } catch (error) {
      console.warn('⚠️ [CACHE] Failed to save to Vercel Blob, using original:', error);
      // Użyj oryginału jako fallback
    }

    const generation = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      originalImage: originalImage, // base64 lub URL (zachowaj)
      transformedImage: transformedImageUrl, // ZAWSZE URL (nie base64)
      style: style,
      size: size,
      thumbnail: transformedImageUrl // Użyj tego samego URL dla thumbnail
    };

    // Pobierz istniejące generacje
    const existingGenerations = this.getAIGenerations();
    
    // Dodaj nową generację na początku
    existingGenerations.unshift(generation);
    
    // Zachowaj ostatnie 8 generacji (URL są małe, ~100 znaków zamiast 2-5MB base64)
    const limitedGenerations = existingGenerations.slice(0, 8);
    
    // Zapisz z powrotem do localStorage
    localStorage.setItem('customify_ai_generations', JSON.stringify(limitedGenerations));
    
    console.log('🎨 [GALLERY] Saved AI generation:', generation.id, style, size);
    
    // Odśwież galerię
    this.updateGallery().catch(error => {
      console.error('❌ [GALLERY] Error updating gallery after save:', error);
    });
  }

  /**
   * Pobiera zapisane generacje AI
   */
  getAIGenerations() {
    try {
      const stored = localStorage.getItem('customify_ai_generations');
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      console.log('🎨 [GALLERY] Loaded generations from localStorage:', parsed.length);
      
      // TYMCZASOWO: zwróć wszystkie generacje bez filtrowania
      return parsed;
    } catch (error) {
      console.error('❌ [GALLERY] Error loading generations:', error);
      return [];
    }
  }

  /**
   * Aktualizuje galerię ostatnich generacji
   */
  async updateGallery() {
    console.log('🎨 [GALLERY] updateGallery called');
    
    // 🧹 CLEANUP: Usuń niedziałające generacje
    const generations = await this.cleanupBrokenGenerations();
    console.log('🎨 [GALLERY] After cleanup, generations:', generations.length);
    
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
    header.textContent = 'Twoje obrazy - wybierz najlepszy';
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
      // Fallback - wstaw w kontener aplikacji
      const appContainer = document.getElementById('customify-app-container');
      if (appContainer) {
        appContainer.appendChild(gallery);
        console.log('🎨 [GALLERY] Gallery inserted in app container');
      } else {
        // Ostatni fallback - wstaw na końcu body
        document.body.appendChild(gallery);
        console.log('🎨 [GALLERY] Gallery inserted at end of body (fallback)');
      }
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
    
    // Obsługa błędów ładowania obrazu
    img.onerror = function() {
      console.error('❌ [GALLERY] Image failed to load:', generation.thumbnail?.substring(0, 50));
      console.log('🔄 [GALLERY] Generation data:', generation);
      // Ukryj uszkodzony obraz, ale zachowaj element
      img.style.display = 'none';
      // Pokaż placeholder
      const placeholder = document.createElement('div');
      placeholder.textContent = 'Brak obrazu';
      placeholder.style.cssText = 'width: 100%; height: 120px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999;';
      img.parentNode.insertBefore(placeholder, img);
    };
    
    img.onload = function() {
      console.log('✅ [GALLERY] Image loaded successfully:', generation.thumbnail?.substring(0, 50));
    };

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
   * Konwertuje URL na File object
   */
  urlToFile(url, filename) {
    return new Promise((resolve, reject) => {
      fetch(url)
        .then(response => response.blob())
        .then(blob => {
          const file = new File([blob], filename, { type: blob.type });
          resolve(file);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Konwertuje URL na base64 string
   */
  async urlToBase64(url) {
    try {
      console.log('🔄 [CACHE] Converting URL to base64:', url);
      const response = await fetch(url);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          console.log('✅ [CACHE] URL converted to base64 successfully');
          resolve(reader.result);
        };
        reader.onerror = () => {
          console.error('❌ [CACHE] Error reading blob to base64');
          reject(new Error('Failed to convert blob to base64'));
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('❌ [CACHE] Error converting URL to base64:', error);
      throw error;
    }
  }

  /**
   * Kompresuje obraz base64 do małego thumbnail (150x150px)
   * Zwraca kompresowany base64 string (~50-100KB zamiast 2-5MB)
   */
  async compressBase64Thumbnail(base64String, maxWidth = 150, maxHeight = 150, quality = 0.6) {
    return new Promise((resolve, reject) => {
      try {
        console.log('🗜️ [COMPRESS] Compressing thumbnail to', maxWidth, 'x', maxHeight, 'px');
        
        const img = new Image();
        img.onload = () => {
          // Oblicz nowe wymiary zachowując proporcje
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          
          // Stwórz canvas i narysuj skompresowany obraz
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Konwertuj do base64 z kompresją
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          
          const originalSize = Math.round(base64String.length / 1024); // KB
          const compressedSize = Math.round(compressedBase64.length / 1024); // KB
          const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);
          
          console.log(`✅ [COMPRESS] Compressed: ${originalSize}KB → ${compressedSize}KB (${compressionRatio}% reduction)`);
          
          resolve(compressedBase64);
        };
        
        img.onerror = () => {
          console.error('❌ [COMPRESS] Failed to load image for compression');
          reject(new Error('Failed to compress image'));
        };
        
        img.src = base64String;
      } catch (error) {
        console.error('❌ [COMPRESS] Error compressing thumbnail:', error);
        reject(error);
      }
    });
  }

  /**
   * Zapisuje obraz base64 do Vercel Blob Storage i zwraca URL
   */
  async saveToVercelBlob(base64String, filename) {
    try {
      console.log('📤 [VERCEL-BLOB] Uploading to Vercel Blob Storage...');
      
      const response = await fetch('https://customify-s56o.vercel.app/api/upload-temp-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: base64String,
          filename: filename,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to upload: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.url) {
        console.log('✅ [VERCEL-BLOB] Uploaded successfully:', result.url);
        return result.url;
      } else {
        throw new Error('No URL in response');
      }
    } catch (error) {
      console.error('❌ [VERCEL-BLOB] Error uploading:', error);
      throw error;
    }
  }

  /**
   * Sprawdza czy URL do obrazu działa
   */
  async checkImageUrl(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.log('🔍 [CLEANUP] URL not working:', url);
      return false;
    }
  }

  /**
   * Usuwa niedziałające generacje z localStorage
   */
  async cleanupBrokenGenerations() {
    console.log('🧹 [CLEANUP] Checking for broken generations...');
    const generations = this.getAIGenerations();
    const workingGenerations = [];
    
    for (const generation of generations) {
      // Sprawdź czy thumbnail to URL (nie base64)
      if (generation.thumbnail && 
          (generation.thumbnail.startsWith('http://') || generation.thumbnail.startsWith('https://'))) {
        
        const isWorking = await this.checkImageUrl(generation.thumbnail);
        if (isWorking) {
          workingGenerations.push(generation);
          console.log('✅ [CLEANUP] Working generation kept:', generation.id);
        } else {
          console.log('🗑️ [CLEANUP] Broken generation removed:', generation.id);
        }
      } else {
        // Base64 lub inne formaty - zachowaj
        workingGenerations.push(generation);
        console.log('✅ [CLEANUP] Base64 generation kept:', generation.id);
      }
    }
    
    // Zapisz tylko działające generacje
    if (workingGenerations.length !== generations.length) {
      localStorage.setItem('customify_ai_generations', JSON.stringify(workingGenerations));
      console.log(`🧹 [CLEANUP] Cleaned up: ${generations.length} → ${workingGenerations.length} generations`);
    }
    
    return workingGenerations;
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
    console.log('🔄 [GALLERY] Generation data:', generation);
    console.log('🔄 [GALLERY] originalImage type:', typeof generation.originalImage);
    console.log('🔄 [GALLERY] originalImage value:', generation.originalImage);
    console.log('🔄 [GALLERY] transformedImage type:', typeof generation.transformedImage);
    console.log('🔄 [GALLERY] transformedImage length:', generation.transformedImage?.length);
    console.log('🔄 [GALLERY] transformedImage preview:', generation.transformedImage?.substring(0, 100));
    
    // Pokaż wynik AI (transformedImage) w result area
    if (generation.transformedImage) {
      console.log('🔄 [GALLERY] Showing AI result in result area:', generation.transformedImage);
      
      // ✅ KLUCZOWE: Ustaw this.transformedImage żeby addToCart() działało
      this.transformedImage = generation.transformedImage;
      console.log('✅ [GALLERY] Set this.transformedImage for addToCart:', this.transformedImage?.substring(0, 100));
      console.log('✅ [GALLERY] this.transformedImage is base64?', this.transformedImage?.startsWith('data:'));
      console.log('✅ [GALLERY] this.transformedImage is URL?', this.transformedImage?.startsWith('http'));
      
      // ✅ KLUCZOWE: Ustaw this.originalImageFromGallery żeby addToCart() działało
      this.originalImageFromGallery = generation.originalImage;
      console.log('✅ [GALLERY] Set this.originalImageFromGallery for addToCart:', this.originalImageFromGallery);
      
      this.showResult(generation.transformedImage);
      this.hideError();
    } else {
      console.error('❌ [GALLERY] No transformedImage in generation');
      this.showError('Brak wyniku AI w generacji.');
    }
    
    // Ustaw styl - bezpośrednio z generacji
    console.log('🎨 [GALLERY] Setting style:', generation.style);
    if (generation.style) {
      this.selectedStyle = generation.style;
      console.log('✅ [GALLERY] Style set directly from generation:', this.selectedStyle);
      
      // Opcjonalnie: zaznacz też element w DOM jeśli istnieje
      const styleCard = document.querySelector(`[data-style="${generation.style}"]`);
      if (styleCard) {
        this.stylesArea.querySelectorAll('.customify-style-card').forEach(card => card.classList.remove('active'));
        styleCard.classList.add('active');
        console.log('✅ [GALLERY] Style card also highlighted in DOM');
      }
    } else {
      console.warn('⚠️ [GALLERY] No style in generation');
    }
    
    // Ustaw rozmiar
    if (generation.size) {
      const sizeBtn = document.querySelector(`[data-size="${generation.size}"]`);
      if (sizeBtn) {
        this.selectSize(sizeBtn);
      }
    }

    // Komunikat usunięty - nie potrzebny
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
      
      // Usage limit check for anonymous users
      
      if (localCount >= FREE_LIMIT) {
        this.showLoginModal(localCount, FREE_LIMIT);
        return false;
      }
      
      return true;
    } else {
      // Zalogowany - sprawdź Shopify Metafields przez API
      // Checking usage limit via API for logged-in user
      
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
    
    // Shopify Customer Account może wymagać specjalnego formatu return_url
    const encodedReturnUrl = encodeURIComponent(fullReturnUrl);
    console.log('🔐 [DEBUG] Encoded return URL:', encodedReturnUrl);
    
    const registerUrl = `/account/register?return_url=${encodedReturnUrl}`;
    const loginUrl = `/account/login?return_url=${encodedReturnUrl}`;
    
    console.log('🔗 [DEBUG] Register URL:', registerUrl);
    console.log('🔗 [DEBUG] Login URL:', loginUrl);
    console.log('🔗 [DEBUG] Register URL (decoded):', decodeURIComponent(registerUrl));
    console.log('🔗 [DEBUG] Login URL (decoded):', decodeURIComponent(loginUrl));
    
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
    // Usage counter initialization
    const customerInfo = this.getCustomerInfo();
    let counterHTML = '';
    
    // Customer info retrieved
    
    if (!customerInfo) {
      // Niezalogowany - NIE POKAZUJ komunikatu o punktach
      // Modal rejestracji pojawi się dopiero po wyczerpaniu wszystkich 10 transformacji
      const localCount = this.getLocalUsageCount();
      const FREE_LIMIT = 10;
      
      // Brak komunikatu - użytkownik nie wie ile ma punktów
      // Dopiero po 10 transformacjach pojawi się modal rejestracji
    } else {
      // Zalogowany - NIE POKAZUJ komunikatu o kredytach
      // Użytkownik ma nieograniczone transformacje
      console.log('🔍 [USAGE] Logged in user - no counter display');
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
      // Counter displayed successfully
    } else {
      // Upload area not found - counter not displayed
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

    // DODAJ DIVIDER POD ROZMIARAMI
    this.addDividerAfterSizes();

    console.log('✅ [CUSTOMIFY] Title moved to top successfully!');
  }



  // DODAJ DIVIDER POD ROZMIARAMI
  addDividerAfterSizes() {
    // Sprawdź czy już nie ma dividera
    if (document.querySelector('.customify-title-divider')) {
      console.log('🎯 [CUSTOMIFY] Divider already exists');
      return;
    }

    // Znajdź kontener z rozmiarami
    const sizeArea = document.getElementById('sizeArea');
    if (!sizeArea) {
      console.warn('⚠️ [CUSTOMIFY] Could not find sizeArea for divider');
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

    // Dodaj divider po rozmiarach
    sizeArea.parentNode.insertBefore(divider, sizeArea.nextSibling);

    console.log('✅ [CUSTOMIFY] Divider added after sizes');
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

    // PRZENIEŚ CENĘ NAD SEKCJĘ "WYBIERZ ROZMIAR" - OD RAZU (bez setTimeout)
    const priceElement = document.querySelector('product-price');
    const sizeArea = document.getElementById('sizeArea');
    sizeArea.parentNode.insertBefore(priceElement, sizeArea);
    console.log('🎯 [CUSTOMIFY] Cena przeniesiona nad sekcję "Wybierz rozmiar"');
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

    // ✅ Google Ads Conversion Tracking - Image Upload Event
    if (typeof gtag !== 'undefined') {
      // Wyślij konwersję Google Ads z właściwym send_to ID
      gtag('event', 'conversion', {
        'send_to': 'AW-858040473/1k70CIur7LQbEJnRkpkD',
        'event_category': 'Customify',
        'event_label': 'Image Uploaded',
        'product_url': window.location.pathname,
        'file_size': file.size,
        'file_type': file.type
      });
      console.log('📊 [GOOGLE ADS] Conversion event sent: image_upload', 'AW-858040473/1k70CIur7LQbEJnRkpkD');
    } else {
      console.warn('⚠️ [GOOGLE ADS] gtag not available - conversion not tracked');
    }
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
    
    // Aktualizuj cenę po wyborze rozmiaru
    this.updateProductPrice();
    this.updateCartPrice(); // ✅ Dodaj aktualizację ceny nad przyciskiem
  }

  /**
   * Aktualizuje cenę nad przyciskiem "Dodaj do koszyka"
   */
  updateCartPrice() {
    try {
      // Sprawdź czy mamy wybrany rozmiar
      if (!this.selectedSize) {
        console.log('🔍 [CART-PRICE] No selectedSize, hiding cart price');
        this.hideCartPrice();
        return;
      }

      // Pobierz oryginalną bazową cenę
      if (!this.originalBasePrice) {
        this.originalBasePrice = 49.00; // Fallback
        console.log(`💰 [CART-PRICE] Using fallback base price: ${this.originalBasePrice} zł`);
      }

      // Pobierz cenę rozmiaru
      const sizePrice = this.getSizePrice(this.selectedSize);
      
      // Oblicz końcową cenę (bazowa + rozmiar)
      const finalPrice = this.originalBasePrice + sizePrice;

      // Price calculation completed

        // Znajdź element ceny w koszyku
        const cartPriceElement = document.getElementById('cartPriceValue');

        if (cartPriceElement) {
          cartPriceElement.textContent = `${finalPrice.toFixed(2)} zł`;
          console.log('✅ [CART-PRICE] Cart price updated:', finalPrice.toFixed(2), 'zł');

          // Pokaż element ceny
          this.showCartPrice();
        } else {
          console.warn('⚠️ [CART-PRICE] Cart price element not found');
        }
    } catch (error) {
      console.error('❌ [CART-PRICE] Error updating cart price:', error);
    }
  }

  /**
   * Pokazuje element ceny nad przyciskiem
   */
  showCartPrice() {
    const cartPriceDisplay = document.getElementById('cartPriceDisplay');
    if (cartPriceDisplay) {
      cartPriceDisplay.style.display = 'block';
      console.log('✅ [CART-PRICE] Cart price displayed');
    }
  }

  /**
   * Ukrywa element ceny nad przyciskiem
   */
  hideCartPrice() {
    const cartPriceDisplay = document.getElementById('cartPriceDisplay');
    if (cartPriceDisplay) {
      cartPriceDisplay.style.display = 'none';
      console.log('✅ [CART-PRICE] Cart price hidden');
    }
  }

  /**
   * Ustawia początkową cenę bazową (bez rozmiaru) przy starcie aplikacji
   */
  setInitialPrice() {
    try {
      // Znajdź element ceny na stronie produktu - spróbuj różnych selektorów
      let priceElement = document.querySelector('product-price div');
      
      if (!priceElement) {
        priceElement = document.querySelector('.price');
      }
      
      if (!priceElement) {
        priceElement = document.querySelector('[class*="price"]');
      }
      
      if (!priceElement) {
        console.warn('⚠️ [INIT-PRICE] Price element not found');
        return;
      }

      // Pobierz oryginalną bazową cenę (zapamiętaj przy pierwszym wywołaniu)
      if (!this.originalBasePrice) {
        const basePriceText = priceElement.textContent;
        this.originalBasePrice = this.extractBasePrice(basePriceText);
        
        if (this.originalBasePrice === null) {
          console.warn('⚠️ [INIT-PRICE] Could not extract original base price from:', basePriceText);
          this.originalBasePrice = 49.00;
          console.log(`💰 [INIT-PRICE] Using fallback base price: ${this.originalBasePrice} zł`);
        } else {
          console.log(`💰 [INIT-PRICE] Original base price saved: ${this.originalBasePrice} zł`);
        }
      }

      // Ustaw TYLKO cenę bazową (bez rozmiaru)
      priceElement.textContent = `${this.originalBasePrice.toFixed(2)} zł`;
      
      console.log(`💰 [INIT-PRICE] Set initial base price: ${this.originalBasePrice} zł`);
      
    } catch (error) {
      console.error('❌ [INIT-PRICE] Error setting initial price:', error);
    }
  }

  /**
   * Aktualizuje cenę na stronie produktu po wyborze rozmiaru
   */
  updateProductPrice() {
    try {
      // Znajdź element ceny na stronie produktu - spróbuj różnych selektorów
      let priceElement = document.querySelector('product-price div');
      
      if (!priceElement) {
        // Spróbuj innych selektorów
        priceElement = document.querySelector('.price');
        console.log('🔍 [PRICE] Trying .price selector:', priceElement);
      }
      
      if (!priceElement) {
        priceElement = document.querySelector('[class*="price"]');
        console.log('🔍 [PRICE] Trying [class*="price"] selector:', priceElement);
      }
      
      if (!priceElement) {
        priceElement = document.querySelector('span:contains("zł")');
        console.log('🔍 [PRICE] Trying span:contains("zł") selector:', priceElement);
      }
      
      if (!priceElement) {
        console.warn('⚠️ [PRICE] Price element not found with any selector');
        console.log('🔍 [PRICE] Available price elements:', document.querySelectorAll('[class*="price"], [id*="price"], span, div').length);
        return;
      }

      console.log('✅ [PRICE] Found price element:', priceElement, 'Text:', priceElement.textContent);

      // Pobierz oryginalną bazową cenę (zapamiętaj przy pierwszym wywołaniu)
      if (!this.originalBasePrice) {
        const basePriceText = priceElement.textContent;
        this.originalBasePrice = this.extractBasePrice(basePriceText);
        
        if (this.originalBasePrice === null) {
          console.warn('⚠️ [PRICE] Could not extract original base price from:', basePriceText);
          // Fallback - użyj domyślnej ceny
          this.originalBasePrice = 49.00;
          console.log(`💰 [PRICE] Using fallback base price: ${this.originalBasePrice} zł`);
        } else {
          console.log(`💰 [PRICE] Original base price saved: ${this.originalBasePrice} zł`);
        }
      }

      // Pobierz cenę rozmiaru
      const sizePrice = this.getSizePrice(this.selectedSize);
      
      // Oblicz końcową cenę (oryginalna cena + tylko jeden rozmiar)
      const finalPrice = this.originalBasePrice + sizePrice;
      
      // Aktualizuj cenę na stronie
      priceElement.textContent = `${finalPrice.toFixed(2)} zł`;
      
      console.log(`💰 [PRICE] Updated: ${this.originalBasePrice} + ${sizePrice} = ${finalPrice} zł`);
      
    } catch (error) {
      console.error('❌ [PRICE] Error updating product price:', error);
    }
  }

  /**
   * Wyciąga bazową cenę z tekstu ceny
   */
  extractBasePrice(priceText) {
    // Usuń "zł" i spacje, znajdź liczbę
    const match = priceText.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  }

  /**
   * Zwraca cenę dla wybranego rozmiaru
   */
  getSizePrice(size) {
    const prices = {
      'a4': 49,
      'a3': 99,
      'a2': 149,
      'a1': 199
    };
    return prices[size] || 0;
  }

  /**
   * Zwraca wymiar dla wybranego rozmiaru (np. "20×30 cm")
   */
  getSizeDimension(size) {
    const dimensions = {
      'a4': '20×30 cm',
      'a3': '30×40 cm', 
      'a2': '40×60 cm',
      'a1': '60×85 cm'
    };
    return dimensions[size] || size;
  }

  /**
   * Inicjalizuje domyślny rozmiar i cenę przy starcie aplikacji
   */
  initializeDefaultPrice() {
    try {
      // Znajdź pierwszy dostępny rozmiar (domyślnie A4)
      const defaultSizeBtn = this.sizeArea?.querySelector('[data-size="a4"]') || 
                            this.sizeArea?.querySelector('.customify-size-btn');
      
      if (defaultSizeBtn) {
        // Ustaw domyślny rozmiar (bez podświetlania)
        this.selectedSize = defaultSizeBtn.dataset.size;
        // defaultSizeBtn.classList.add('active'); // USUNIĘTO - żaden rozmiar nie jest podświetlony domyślnie
        
        console.log('💰 [INIT] Default size selected (no highlight):', this.selectedSize);
        
        // Ustaw początkową cenę bazową (bez rozmiaru)
        this.setInitialPrice();
        this.updateCartPrice(); // ✅ Dodaj aktualizację ceny nad przyciskiem
      } else {
        console.warn('⚠️ [INIT] No size buttons found for default price');
      }
    } catch (error) {
      console.error('❌ [INIT] Error initializing default price:', error);
    }
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
        
        // 🎨 GALERIA: Zapisz generację do localStorage z base64 cache
        this.saveAIGeneration(
          base64,                     // Oryginalne zdjęcie (base64)
          result.transformedImage,    // AI obraz URL
          this.selectedStyle,         // Styl (pixar, boho, etc)
          this.selectedSize           // Rozmiar (a4, a3, etc)
        ).then(() => {
          console.log('✅ [CACHE] AI generation saved with base64 cache');
        }).catch(error => {
          console.error('❌ [CACHE] Failed to save AI generation:', error);
        });
        
        // ✅ USAGE LIMITS: Inkrementuj licznik dla niezalogowanych (zalogowani są inkrementowani w API)
        if (!customerInfo) {
          this.incrementLocalUsage();
          // Usage count incremented after successful transform
        } else {
          // Zalogowani - odśwież licznik z API (został zaktualizowany w backend)
          this.showUsageCounter();
          // Counter refreshed for logged-in user
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
    
    // ✅ POKAŻ CENĘ NAD PRZYCISKIEM po wygenerowaniu AI
    this.updateCartPrice();
  }

  // NAPRAWIONA FUNKCJA: STWÓRZ NOWY PRODUKT Z OBRAZKIEM AI (UKRYTY W KATALOGU)
  async addToCart() {
    console.log('🛒 [CUSTOMIFY] addToCart called with:', {
      transformedImage: !!this.transformedImage,
      selectedStyle: this.selectedStyle,
      selectedSize: this.selectedSize
    });
    
    // ✅ SPRAWDŹ ROZMIAR NAJPIERW - to jest wymagane dla ceny
    console.log('🔍 [CUSTOMIFY] Checking selectedSize:', this.selectedSize);
    if (!this.selectedSize) {
      console.log('❌ [CUSTOMIFY] No selectedSize, showing error');
      this.showError('Nie wybrałeś rozmiaru');
      return;
    }
    console.log('✅ [CUSTOMIFY] selectedSize OK, proceeding with price calculation');

    // ✅ OBLICZ CENĘ NAJPIERW - niezależnie od obrazu AI
    const basePrice = this.originalBasePrice || 49.00;
    const sizePrice = this.getSizePrice(this.selectedSize);
    const finalPrice = basePrice + sizePrice;
    
    console.log('💰 [CUSTOMIFY] Price calculation:', {
      originalBasePrice: this.originalBasePrice,
      basePrice: basePrice,
      sizePrice: sizePrice,
      finalPrice: finalPrice,
      size: this.selectedSize
    });

    // ✅ SPRAWDŹ OBRAZ AI DOPIERO POTEM
    if (!this.transformedImage) {
      this.showError('Brak przekształconego obrazu');
      return;
    }
    
    // ✅ SPRAWDŹ STYL
    if (!this.selectedStyle) {
      this.showError('Wybierz styl');
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
      
      // Sprawdź czy finalPrice jest poprawny
      if (!finalPrice || finalPrice <= 0) {
        console.error('❌ [CUSTOMIFY] Invalid finalPrice:', finalPrice);
        this.showError('Błąd obliczania ceny. Spróbuj ponownie.');
        return;
      }

      // Sprawdź czy mamy uploadedFile (z upload) czy originalImage (z galerii)
      let originalImage;
      if (this.uploadedFile) {
        // Z upload - konwertuj plik na base64
        originalImage = await this.fileToBase64(this.uploadedFile);
      } else if (this.originalImageFromGallery) {
        // Z galerii - użyj zapisany originalImage
        originalImage = this.originalImageFromGallery;
      } else {
        // Fallback - użyj transformedImage jako originalImage
        originalImage = this.transformedImage;
        console.warn('⚠️ [CUSTOMIFY] No original image available, using transformed image as fallback');
      }

      const productData = {
        originalImage: originalImage,
        transformedImage: this.transformedImage,
        style: this.selectedStyle,
        size: this.selectedSize,
        originalProductTitle: document.querySelector('h1, .product-title, .view-product-title')?.textContent?.trim() || 'Produkt',
        originalProductId: productId, // ✅ Dodano ID produktu do pobrania ceny z Shopify
        finalPrice: finalPrice // ✅ Przekaż obliczoną cenę do API
      };

      console.log('🛒 [CUSTOMIFY] Creating product with data:', productData);
      console.log('🛒 [CUSTOMIFY] transformedImage type:', typeof this.transformedImage);
      console.log('🛒 [CUSTOMIFY] transformedImage length:', this.transformedImage?.length);
      console.log('🛒 [CUSTOMIFY] transformedImage is base64?', this.transformedImage?.startsWith('data:'));
      console.log('🛒 [CUSTOMIFY] transformedImage is URL?', this.transformedImage?.startsWith('http'));
      console.log('🛒 [CUSTOMIFY] transformedImage preview:', this.transformedImage?.substring(0, 200));
      
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
            'Rozmiar': this.getSizeDimension(this.selectedSize),  // ✅ Przekaż wymiar (np. "20×30 cm") zamiast kodu (np. "a4")
            '_AI_Image_URL': result.imageUrl || this.transformedImage,  // ✅ URL z Shopify (główny obraz)
            '_Order_ID': result.orderId || Date.now().toString()  // Unikalny ID zamówienia
          };
          
          // Dodaj _AI_Image_Permanent TYLKO jeśli to krótki URL (Vercel Blob URLs są za długie)
          const permanentUrl = result.permanentImageUrl || this.transformedImage;
          if (permanentUrl && permanentUrl.length < 150 && permanentUrl.includes('replicate.delivery')) {
            properties['_AI_Image_Permanent'] = permanentUrl;
          }
          
          // Dodaj _AI_Image_Direct TYLKO jeśli to krótki URL (Replicate ~100 znaków)
          // Vercel Blob URLs są za długie (~200+ znaków) - NIE dodawaj ich tutaj
          if (this.transformedImage && 
              !this.transformedImage.startsWith('data:') && 
              this.transformedImage.length < 150 &&
              this.transformedImage.includes('replicate.delivery')) {
            properties['_AI_Image_Direct'] = this.transformedImage;  // Tylko Replicate URLs (krótkie)
          }
          // Segmind base64 data URI (~256KB) przekracza limit URL - POMIŃ!
          // Vercel Blob URLs są za długie dla properties - POMIŃ!
          
          console.log('🖼️ [CUSTOMIFY] Image URLs:', {
            shopifyImageUrl: result.imageUrl,
            permanentImageUrl: result.permanentImageUrl,
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
          const fullUrl = window.location.origin + cartUrl;
          console.log('🛒 [CUSTOMIFY] Cart URL length:', cartUrl.length, 'chars');
          console.log('🛒 [CUSTOMIFY] Cart URL:', cartUrl.substring(0, 200), '...');
          console.log('🛒 [CUSTOMIFY] Full URL length:', fullUrl.length, 'chars');
          
          // ❌ PROBLEM: URL > 2048 znaków może być zablokowany przez przeglądarkę
          if (fullUrl.length > 2048) {
            console.error('❌ [CUSTOMIFY] URL TOO LONG:', fullUrl.length, 'chars (max 2048)');
            console.error('❌ [CUSTOMIFY] Properties:', properties);
            this.showError('URL zbyt długi - usuń niektóre właściwości lub skontaktuj się z supportem');
            return;
          }
          
          // ✅ DODAJ DO KOSZYKA PRZEZ DIRECT NAVIGATION (jak w rules)
          console.log('✅ [CUSTOMIFY] Adding to cart via direct navigation');
          
          // Ukryj pasek postępu
          this.hideCartLoading();
          
          // Przekieruj bezpośrednio do koszyka (zamiast fetch)
          window.location.href = cartUrl;
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

