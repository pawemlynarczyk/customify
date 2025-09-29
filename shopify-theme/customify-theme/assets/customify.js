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
      padding: 20px !important;
      border-radius: 8px !important;
      box-shadow: none !important;
      position: relative !important;
      z-index: 10 !important;
    `;

    // UKRYJ CENĘ W PRZENIESIONYM KONTENERZE
    const priceElement = titleContainer.querySelector('product-price, .price');
    if (priceElement) {
      priceElement.style.display = 'none';
      console.log('🎯 [CUSTOMIFY] Price hidden in moved container');
    }

    // POKAŻ CENĘ PONIŻEJ APLIKACJI CUSTOMIFY
    this.showPriceBelowApp();

    console.log('✅ [CUSTOMIFY] Title moved to top successfully!');
  }

  // POKAŻ CENĘ PONIŻEJ APLIKACJI CUSTOMIFY
  showPriceBelowApp() {
    // Znajdź aplikację Customify
    const appContainer = document.getElementById('customify-app-container');
    if (!appContainer) {
      console.warn('⚠️ [CUSTOMIFY] Could not find app container for price');
      return;
    }

    // Znajdź cenę w przeniesionym kontenerze
    const titleContainer = document.querySelector('.group-block[data-testid="group-block"].customify-title-moved');
    if (!titleContainer) {
      console.warn('⚠️ [CUSTOMIFY] Could not find title container for price');
      return;
    }

    const priceElement = titleContainer.querySelector('product-price, .price');
    if (!priceElement) {
      console.warn('⚠️ [CUSTOMIFY] Could not find price element');
      return;
    }

    // Sprawdź czy już nie ma ceny poniżej aplikacji
    if (document.querySelector('.customify-price-below-app')) {
      console.log('🎯 [CUSTOMIFY] Price already shown below app');
      return;
    }

    console.log('🎯 [CUSTOMIFY] Showing price below Customify app');

    // Stwórz kontener dla ceny poniżej aplikacji
    const priceContainer = document.createElement('div');
    priceContainer.className = 'customify-price-below-app';
    priceContainer.style.cssText = `
      margin: 20px 0 0 0 !important;
      padding: 20px !important;
      background: white !important;
      border-radius: 8px !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
      text-align: center !important;
    `;

    // Skopiuj cenę do nowego kontenera
    const clonedPrice = priceElement.cloneNode(true);
    clonedPrice.style.display = 'block';
    clonedPrice.style.cssText = `
      display: block !important;
      margin: 0 !important;
      padding: 0 !important;
      background: transparent !important;
      font-size: 2.5rem !important;
      font-weight: 700 !important;
      color: #000 !important;
    `;

    priceContainer.appendChild(clonedPrice);

    // Wstaw cenę poniżej aplikacji
    appContainer.parentNode.insertBefore(priceContainer, appContainer.nextSibling);

    console.log('✅ [CUSTOMIFY] Price shown below app successfully!');
  }

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

    // Dodaj badge z okazją
    const discountBadge = document.createElement('div');
    discountBadge.className = 'discount-badge';
    discountBadge.textContent = 'Oszczędzasz 30%';

    // Dodaj sekcję z gwiazdkami
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
    reviewCount.textContent = '(43)';

    ratingSection.appendChild(stars);
    ratingSection.appendChild(reviewCount);

    // Dodaj do kontenera
    badgesContainer.appendChild(discountBadge);
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
      this.previewImage.src = e.target.result;
      this.previewArea.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  showStyles() {
    this.stylesArea.style.display = 'block';
    this.sizeArea.style.display = 'none'; // Wymiary pokażemy po wyborze stylu
    this.actionsArea.style.display = 'flex';
  }

  selectStyle(styleCard) {
    this.stylesArea.querySelectorAll('.customify-style-card').forEach(card => card.classList.remove('active'));
    styleCard.classList.add('active');
    this.selectedStyle = styleCard.dataset.style;
    
    // Pokaż wymiary po wyborze stylu
    this.sizeArea.style.display = 'block';
  }

  selectSize(sizeBtn) {
    this.sizeArea.querySelectorAll('.customify-size-btn').forEach(btn => btn.classList.remove('active'));
    sizeBtn.classList.add('active');
    this.selectedSize = sizeBtn.dataset.size;
  }

  async transformImage() {
    if (!this.uploadedFile || !this.selectedStyle) {
      this.showError('Proszę wybrać zdjęcie i styl');
      return;
    }

    this.showLoading();
    this.hideError();

    try {
      const base64 = await this.fileToBase64(this.uploadedFile);
      const response = await fetch('https://customify-s56o.vercel.app/api/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: base64,
          prompt: `Transform this image in ${this.selectedStyle} style`
        })
      });

      const result = await response.json();
      if (result.success) {
        this.transformedImage = result.transformedImage;
        this.showResult(result.transformedImage);
        this.showSuccess('Zdjęcie zostało pomyślnie przekształcone!');
      } else {
        this.showError('Błąd podczas transformacji: ' + (result.error || 'Nieznany błąd'));
      }
    } catch (error) {
      this.showError('Błąd połączenia z serwerem');
    } finally {
      this.hideLoading();
    }
  }

  showResult(imageUrl) {
    console.log('🎯 [CUSTOMIFY] showResult called, hiding actionsArea and stylesArea');
    this.resultImage.src = imageUrl;
    this.resultArea.style.display = 'block';
    
    // Pokaż rozmiary pod zdjęciem wynikowym
    const sizeAreaInResult = this.resultArea.querySelector('#sizeArea');
    if (sizeAreaInResult) {
      sizeAreaInResult.style.display = 'block';
      console.log('🎯 [CUSTOMIFY] Size area shown under result image');
    }
    
    // UKRYJ przyciski "Przekształć z AI" i "Resetuj" (główne actionsArea)
    this.actionsArea.style.display = 'none';
    console.log('🎯 [CUSTOMIFY] actionsArea hidden:', this.actionsArea.style.display);
    
    // UKRYJ style po przekształceniu
    this.stylesArea.style.display = 'none';
    console.log('🎯 [CUSTOMIFY] stylesArea hidden:', this.stylesArea.style.display);
    
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
      this.showError('Wybierz rozmiar');
      return;
    }

    this.hideError();
    console.log('🛒 [CUSTOMIFY] Starting addToCart process...');

    try {
      const productData = {
        originalImage: await this.fileToBase64(this.uploadedFile),
        transformedImage: this.transformedImage,
        style: this.selectedStyle,
        size: this.selectedSize,
        originalProductTitle: document.querySelector('h1, .product-title, .view-product-title')?.textContent?.trim() || 'Produkt'
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
            'AI Style': this.selectedStyle,
            'Size': this.selectedSize,
            'Original Product': productData.originalProductTitle,
            'Customization Type': 'AI Generated',
            '_AI_Image_URL': result.imageUrl || this.transformedImage
          };
          
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
              
              // Przekieruj do koszyka
              window.location.href = '/cart';
              
              // UKRYJ PRODUKT PO 30 SEKUNDACH (żeby użytkownik zdążył przejść checkout)
              setTimeout(() => {
                this.hideProductAfterCartAdd(result.productId);
              }, 30000);
            } else {
              console.error('❌ [CUSTOMIFY] Failed to add to cart:', cartResponse.status);
              this.showError('❌ Błąd podczas dodawania do koszyka');
            }
          } catch (error) {
            console.error('❌ [CUSTOMIFY] Cart add error:', error);
            this.showError('❌ Błąd połączenia z koszykiem');
          }
        }
      } else {
        console.error('❌ [CUSTOMIFY] Product creation failed:', result);
        this.showError('❌ Błąd podczas tworzenia produktu: ' + (result.error || 'Nieznany błąd'));
      }
    } catch (error) {
      console.error('❌ [CUSTOMIFY] Add to cart error:', error);
      this.showError('❌ Błąd połączenia z serwerem: ' + error.message);
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
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
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
    this.sizeArea.style.display = 'none';
    this.actionsArea.style.display = 'none';
    this.resultArea.style.display = 'none';
    this.hideError();
    this.hideSuccess();
    
    this.stylesArea.querySelectorAll('.customify-style-card').forEach(card => card.classList.remove('active'));
    this.sizeArea.querySelectorAll('.customify-size-btn').forEach(btn => btn.classList.remove('active'));
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
  }

  hideLoading() {
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

  showError(message) {
    this.errorMessage.textContent = message;
    this.errorMessage.style.display = 'block';
  }

  hideError() {
    this.errorMessage.style.display = 'none';
  }

  showSuccess(message) {
    this.successMessage.textContent = message;
    this.successMessage.style.display = 'block';
  }

  hideSuccess() {
    this.successMessage.style.display = 'none';
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
 * INITIALIZATION
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Customify app
  new CustomifyEmbed();
  
  // Initialize cart integration
  initCartIntegration();
  
  // Clean up dividers and spacing
  window.addEventListener('load', () => {
    setTimeout(() => {
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
