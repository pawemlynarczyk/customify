// Customify Shopify Integration Script
(function() {
    'use strict';
    
    // HEADER STICKY FIX - USUŃ STICKY
    function fixHeaderSticky() {
        const header = document.querySelector('.header-main');
        if (header) {
            header.style.position = 'relative';
            header.style.top = 'auto';
            header.style.zIndex = 'auto';
            console.log('🔧 [HEADER] Usunięto sticky positioning');
        }
    }
    
    // DESKTOP LOGO FIX - LOGO DO LEWEJ NA DESKTOP
    function fixDesktopLogo() {
        if (window.innerWidth >= 769) {
            const logo = document.querySelector('.header-logo');
            if (logo) {
                logo.style.order = '1';
                logo.style.flexGrow = '0';
                logo.style.textAlign = 'left';
                logo.style.marginRight = 'auto';
                console.log('🔧 [DESKTOP LOGO] Logo przesunięte do lewej');
            }
        }
    }
    
    // MOBILE HEADER LAYOUT FIX - PRZEPISANIE STRUKTURY PRZEZ JAVASCRIPT
    function fixMobileHeaderLayout() {
        if (window.innerWidth <= 768) {
            const headerMain = document.querySelector('.header-main');
            const headerTop = document.querySelector('.header-top');
            const headerNav = document.querySelector('.header-nav');
            const headerLogo = document.querySelector('.header-logo');
            const headerRight = document.querySelector('.header-right');
            
            if (headerMain && headerTop && headerNav && headerLogo && headerRight) {
                console.log('🔧 [MOBILE HEADER] Przepisuję strukturę przez JavaScript');
                
                // Sprawdź czy już nie ma header-bottom
                let headerBottom = document.querySelector('.header-bottom');
                if (!headerBottom) {
                    // Utwórz nową strukturę
                    headerBottom = document.createElement('div');
                    headerBottom.className = 'header-bottom';
                    
                    const headerBottomContainer = document.createElement('div');
                    headerBottomContainer.className = 'header-container';
                    
                    // Przenieś menu do header-bottom
                    const clonedNav = headerNav.cloneNode(true);
                    headerBottomContainer.appendChild(clonedNav);
                    headerBottom.appendChild(headerBottomContainer);
                    
                    // Dodaj header-bottom do header-main
                    headerMain.appendChild(headerBottom);
                    
                    // Usuń menu z header-top
                    headerNav.remove();
                    
                    console.log('✅ [MOBILE HEADER] Nowa struktura utworzona');
                }
                
                // Ustaw style dla nowej struktury
                headerTop.style.display = 'flex';
                headerTop.style.flexDirection = 'row';
                headerTop.style.alignItems = 'center';
                headerTop.style.justifyContent = 'space-between';
                headerTop.style.padding = '15px';
                headerTop.style.gap = '15px';
                
                // Logo na mobile
                headerLogo.style.flexGrow = '1';
                headerLogo.style.textAlign = 'center';
                
                // Zmniejsz logo
                const logoImg = headerLogo.querySelector('img');
                if (logoImg) {
                    logoImg.style.maxWidth = '120px';
                    logoImg.style.height = 'auto';
                }
                
                // Ikony po prawej
                headerRight.style.display = 'flex';
                headerRight.style.alignItems = 'center';
                headerRight.style.gap = '15px';
                
                // Style dla header-bottom
                headerBottom.style.width = '100%';
                headerBottom.style.backgroundColor = '#f8f9fa';
                headerBottom.style.borderTop = '1px solid #dee2e6';
                
                const headerBottomContainer = headerBottom.querySelector('.header-container');
                if (headerBottomContainer) {
                    headerBottomContainer.style.padding = '10px 15px';
                }
                
                // Style dla menu w header-bottom
                const newNav = headerBottom.querySelector('.header-nav');
                if (newNav) {
                    newNav.style.display = 'flex';
                    newNav.style.justifyContent = 'center';
                    newNav.style.flexWrap = 'wrap';
                    newNav.style.gap = '15px';
                }
                
                // Style dla linków menu
                const navLinks = headerBottom.querySelectorAll('.nav-link');
                navLinks.forEach(link => {
                    link.style.fontSize = '14px';
                    link.style.padding = '8px 12px';
                    link.style.color = '#495057';
                    link.style.textDecoration = 'none';
                    link.style.borderRadius = '4px';
                    link.style.transition = 'background-color 0.2s';
                });
                
                // Ukryj napisy logowania
                const userTextLinks = document.querySelectorAll('.user-text-link');
                userTextLinks.forEach(link => {
                    link.style.display = 'none';
                });
                
                // Style dla ikonki użytkownika
                const userIconWrapper = document.querySelector('.user-icon-wrapper');
                if (userIconWrapper) {
                    userIconWrapper.style.width = '36px';
                    userIconWrapper.style.height = '36px';
                    userIconWrapper.style.borderRadius = '50%';
                    userIconWrapper.style.backgroundColor = '#f8f9fa';
                    userIconWrapper.style.border = '1px solid #dee2e6';
                    userIconWrapper.style.display = 'flex';
                    userIconWrapper.style.alignItems = 'center';
                    userIconWrapper.style.justifyContent = 'center';
                }
                
                const userIcon = document.querySelector('.user-icon');
                if (userIcon) {
                    userIcon.style.width = '20px';
                    userIcon.style.height = '20px';
                    userIcon.style.color = '#6c757d';
                }
                
                console.log('✅ [MOBILE HEADER] Layout przepisany przez JavaScript');
            }
        }
    }
    
    // Uruchom na load i resize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            fixHeaderSticky();
            fixDesktopLogo();
            fixMobileHeaderLayout();
        });
    } else {
        fixHeaderSticky();
        fixDesktopLogo();
        fixMobileHeaderLayout();
    }
    
    window.addEventListener('resize', () => {
        fixHeaderSticky();
        fixDesktopLogo();
        fixMobileHeaderLayout();
    });

    // Configuration
    const CUSTOMIFY_CONFIG = {
        appUrl: 'https://customify-s56o.vercel.app',
        embedUrl: 'https://customify-s56o.vercel.app/shopify-embed.html?v=' + Date.now(),
        containerId: 'customify-app-container',
        enabledProducts: [], // Will be populated from Shopify
        debug: true,
        // Custom button texts
        addToCartText: window.CustomifyConfig?.addToCartText || '🛒 Dodaj spersonalizowany produkt',
        tryAgainText: window.CustomifyConfig?.tryAgainText || '🔄 Spróbuj ponownie'
    };

    // Utility functions
    function log(message, ...args) {
        if (CUSTOMIFY_CONFIG.debug) {
            console.log('[Customify]', message, ...args);
        }
    }

    function createElement(tag, attributes = {}, innerHTML = '') {
        const element = document.createElement(tag);
        Object.assign(element, attributes);
        if (innerHTML) element.innerHTML = innerHTML;
        return element;
    }

    function loadCSS(url) {
        const link = createElement('link', {
            rel: 'stylesheet',
            href: url
        });
        document.head.appendChild(link);
    }

    function loadScript(url, callback) {
        const script = createElement('script', {
            src: url,
            onload: callback
        });
        document.head.appendChild(script);
    }

    function injectStyles() {
        console.log('🎨 [CUSTOMIFY] Injecting CSS styles...');
        const style = document.createElement('style');
        style.textContent = `
            /* Layout controlled by theme.liquid - no conflicting styles */

            /* Product image styling - USUNIĘTE - KONFLIKT Z CUSTOMIFY.CSS */

            /* Customify app images - force proper proportions */
            .customify-preview img,
            .customify-result img {
                max-width: 100% !important;
                max-height: 300px !important;
                width: auto !important;
                height: auto !important;
                object-fit: contain !important;
            }

            /* Clear floats */
            .product-page-layout::after {
                content: "";
                display: table;
                clear: both;
            }

            /* Hide native Shopify add to cart and buy now buttons */
            #BuyButtons-ProductForm-template--26351135293765__main > div,
            .product-form__buttons,
            .product-form__cart-submit,
            .btn--add-to-cart,
            .product-form__buy-buttons,
            .shopify-payment-button,
            .product-form__payment-container,
            .product-form__buttons-wrapper,
            .product-form__cart,
            .product-form__add-button,
            .btn[data-add-to-cart],
            .product-form__buttons-container,
            .product-form__cart-wrapper,
            .product-form__submit,
            .product-form__buttons-group {
                display: none !important;
            }

            /* FORCE OVERRIDE DIVIDERS AND SPACING - NAJWYŻSZA SPECYFICZNOŚĆ */
            .group-block[data-testid="group-block"] .view-product-title {
                margin-bottom: 2px !important;
                padding-bottom: 0px !important;
            }
            
            .group-block[data-testid="group-block"] .product-badges {
                margin-top: 0px !important;
                margin-bottom: 0px !important;
                padding-top: 0px !important;
                padding-bottom: 0px !important;
            }
            
            /* FORCE HIDE DIVIDERS - NAJWYŻSZA SPECYFICZNOŚĆ */
            .group-block[data-testid="group-block"] .divider,
            .group-block[data-testid="group-block"] .divider__line,
            .divider-AM3M2YnhsTllLTUtCS__divider_VJhene,
            .divider-AM3M2YnhsTllLTUtCS__divider_VJhene .divider__line {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                background: transparent !important;
            }

            /* FORCE GREEN BACKGROUND FOR DISCOUNT BADGE - ZMNIEJSZONY */
            .discount-badge,
            .group-block[data-testid="group-block"] .discount-badge,
            .product-badges .discount-badge,
            div.discount-badge {
                background: #28a745 !important;
                background-color: #28a745 !important;
                color: white !important;
                padding: 4px 8px !important;
                border-radius: 0 !important;
                font-size: 12px !important;
                font-weight: 600 !important;
                display: inline-block !important;
                border: none !important;
                box-shadow: 0 1px 2px rgba(40, 167, 69, 0.3) !important;
                text-shadow: none !important;
                margin: 0 !important;
            }
            
            /* ZMNIEJSZ GWIAZDKI I BADGE'Y - MAKSYMALNIE */
            .product-badges {
                gap: 2px !important;
                margin-bottom: 4px !important;
                margin-top: 0px !important;
            }
            
            .rating-section {
                gap: 2px !important;
                font-size: 12px !important;
            }
            
            /* AGRESYWNE USUNIĘCIE ODSTĘPÓW POD TYTUŁEM */
            .group-block[data-testid="group-block"] .view-product-title,
            .group-block[data-testid="group-block"] .view-product-title a,
            .group-block[data-testid="group-block"] .view-product-title p {
                margin-bottom: 0px !important;
                padding-bottom: 0px !important;
                margin: 0 0 0px 0 !important;
            }

            @media (max-width: 768px) {
                /* Mobile: stack vertically */
                #customify-app-container {
                    width: 100%;
                    float: none;
                    margin-right: 0;
                }

                /* Mobile product image - USUNIĘTE - KONFLIKT Z CUSTOMIFY.CSS */
            }
        `;
        document.head.appendChild(style);
        console.log('🎨 [CUSTOMIFY] CSS styles injected successfully');
    }

    // Check if we're on a product page
    function isProductPage() {
        return window.location.pathname.includes('/products/') || 
               document.querySelector('[data-product-id]') ||
               document.querySelector('.product-form') ||
               document.querySelector('[data-section-type="product"]');
    }

    // Get current product ID
    function getCurrentProductId() {
        // Try different methods to get product ID
        const productId = 
            document.querySelector('[data-product-id]')?.dataset.productId ||
            window.location.pathname.match(/\/products\/([^\/\?]+)/)?.[1] ||
            document.querySelector('meta[property="og:url"]')?.content?.match(/\/products\/([^\/\?]+)/)?.[1];
        
        return productId;
    }

    // Check if product should show Customify
    function shouldShowCustomify(productId) {
        // For now, show on all products
        // Later this can be configured per product
        return true;
    }

    // Create Customify container
    function createCustomifyContainer() {
        const container = createElement('div', {
            id: CUSTOMIFY_CONFIG.containerId,
            className: 'customify-shopify-container'
        });

        // Add some basic styling
        container.style.cssText = `
            margin: 20px 0;
            padding: 0;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background: #fff;
        `;

        return container;
    }

    // Load Customify embed
    function loadCustomifyEmbed(container) {
        log('Loading Customify embed...');
        
        // Create iframe for embed
        const iframe = createElement('iframe', {
            src: CUSTOMIFY_CONFIG.embedUrl,
            width: '100%',
            height: '600',
            frameborder: '0',
            scrolling: 'no',
            style: 'border: none; border-radius: 8px;'
        });

        // Handle iframe load
        iframe.onload = function() {
            log('Customify embed loaded');
            // Resize iframe based on content
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (iframeDoc) {
                    iframe.style.height = iframeDoc.body.scrollHeight + 'px';
                }
            } catch (e) {
                log('Could not resize iframe:', e);
            }
        };

        container.appendChild(iframe);
    }

    // Alternative: Load as inline content
    function loadCustomifyInline(container) {
        console.log('🚀 Loading Customify inline...');
        
        // Fetch embed content
        fetch(CUSTOMIFY_CONFIG.embedUrl)
            .then(response => {
                console.log('📡 Fetch response:', response.status);
                return response.text();
            })
            .then(html => {
                console.log('📄 HTML received, length:', html.length);
                // Extract body content
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const bodyContent = doc.body.innerHTML;
                console.log('🔍 Body content extracted, length:', bodyContent.length);
                
                // Create wrapper
                const wrapper = createElement('div', {
                    className: 'customify-inline-wrapper'
                });
                wrapper.innerHTML = bodyContent;
                
                container.appendChild(wrapper);
                log('Customify inline content loaded');
                
                // Load dynamic styles after content is loaded
                loadDynamicStyles();
                
                // Podmień style po załadowaniu aplikacji
                setTimeout(() => {
                    updateStylesForProduct();
                }, 500);
            })
            .catch(error => {
                log('Error loading Customify content:', error);
                container.innerHTML = '<p>Błąd ładowania aplikacji Customify. Spróbuj ponownie później.</p>';
            });
    }
    
    // Podmień style w aplikacji Customify na podstawie produktu
    function updateStylesForProduct() {
        console.log('🎨 [DYNAMIC STYLES] Updating styles for current product...');
        
        // Pobierz ID produktu
        const productId = getCurrentProductId();
        console.log('🔍 [DYNAMIC STYLES] Product ID:', productId);
        
        // Pobierz handle produktu z URL
        const currentPath = window.location.pathname;
        const productHandle = currentPath.split('/products/')[1]?.split('?')[0];
        console.log('🔍 [DYNAMIC STYLES] Product handle:', productHandle);
        
        // Definicja stylów dla każdego produktu
        const productStyles = {
            'zabawne-style-ai-ghibli-pixar-i-wiecej': [
                { id: 'ghibli', name: 'Ghibli' },
                { id: 'pixar', name: 'Pixar' },
                { id: 'disney', name: 'Disney' },
                { id: 'anime', name: 'Anime' },
                { id: 'cartoon', name: 'Cartoon' },
                { id: 'kawaii', name: 'Kawaii' },
                { id: 'comic', name: 'Komiks' }
            ],
            'krol-i-krolowa-portrety-krolewskie': [
                { id: 'royal-portrait', name: 'Portret Królewski' },
                { id: 'king-crown', name: 'Król z Koroną' },
                { id: 'queen-elegant', name: 'Elegancka Królowa' },
                { id: 'medieval-royal', name: 'Średniowieczny' },
                { id: 'renaissance', name: 'Renesans' },
                { id: 'baroque', name: 'Barok' },
                { id: 'victorian', name: 'Wiktoriański' }
            ],
            'koty-krolewskie-zwierzeta-w-koronach': [
                { id: 'cat-king', name: 'Kot Król' },
                { id: 'cat-crown', name: 'Kot z Koroną' },
                { id: 'lion-cat', name: 'Kot Lew' },
                { id: 'tiger-cat', name: 'Kot Tygrys' },
                { id: 'royal-cat', name: 'Królewski Kot' },
                { id: 'noble-cat', name: 'Szlachecki Kot' },
                { id: 'majestic-cat', name: 'Majestatyczny' }
            ],
            'rodzina-ai-skladanie-zdjec-grupowych': [
                { id: 'family-portrait', name: 'Portret Rodzinny' },
                { id: 'family-collage', name: 'Kolaż Rodzinny' },
                { id: 'family-vintage', name: 'Vintage Rodzina' },
                { id: 'family-modern', name: 'Nowoczesna Rodzina' },
                { id: 'family-artistic', name: 'Artystyczna Rodzina' },
                { id: 'family-classic', name: 'Klasyczna Rodzina' },
                { id: 'family-fun', name: 'Zabawna Rodzina' }
            ],
            'custom': [ // Domyślny produkt
                { id: 'van gogh', name: 'Van Gogh' },
                { id: 'picasso', name: 'Picasso' },
                { id: 'monet', name: 'Monet' },
                { id: 'anime', name: 'Anime' },
                { id: 'cyberpunk', name: 'Cyberpunk' },
                { id: 'watercolor', name: 'Akwarela' },
                { id: 'pixar', name: 'Pixar' }
            ]
        };
        
        // Znajdź odpowiednie style dla produktu
        let stylesToShow = productStyles['custom']; // domyślne
        
        for (const [key, styles] of Object.entries(productStyles)) {
            if (productHandle && productHandle.includes(key)) {
                stylesToShow = styles;
                console.log('✅ [DYNAMIC STYLES] Found styles for:', key);
                break;
            }
        }
        
        // Znajdź kontener na style
        const styleContainer = document.querySelector('.customify-style-buttons');
        if (!styleContainer) {
            console.log('❌ [DYNAMIC STYLES] Style container not found');
            return;
        }
        
        // Wyczyść istniejące style
        styleContainer.innerHTML = '';
        
        // Dodaj nowe style
        stylesToShow.forEach(style => {
            const button = document.createElement('div');
            button.className = 'customify-style-btn';
            button.setAttribute('data-style', style.id);
            button.textContent = style.name;
            styleContainer.appendChild(button);
        });
        
        console.log('✅ [DYNAMIC STYLES] Styles updated:', stylesToShow.map(s => s.name).join(', '));
    }
    
    // Load dynamic styles based on product
    function loadDynamicStyles() {
        console.log('🎨 [DYNAMIC STYLES] Loading styles based on product...');
        
        // Get product ID
        const productId = getCurrentProductId();
        console.log('🔍 [DYNAMIC STYLES] Product ID:', productId);
        
        // Define style groups
        const styleGroups = {
            'zabawne-style-ai-ghibli-pixar-i-wiecej': {
                name: 'Zabawne Style AI',
                styles: [
                    { id: 'ghibli', name: 'Ghibli', description: 'Studio Ghibli' },
                    { id: 'pixar', name: 'Pixar', description: 'Pixar Animation' },
                    { id: 'disney', name: 'Disney', description: 'Disney Classic' },
                    { id: 'anime', name: 'Anime', description: 'Anime Style' },
                    { id: 'cartoon', name: 'Cartoon', description: 'Cartoon Style' },
                    { id: 'kawaii', name: 'Kawaii', description: 'Kawaii Cute' }
                ]
            },
            'krol-i-krolowa-portrety-krolewskie': {
                name: 'Król i Królowa',
                styles: [
                    { id: 'royal-portrait', name: 'Portret Królewski', description: 'Królewski portret' },
                    { id: 'crown-jewel', name: 'Korona i Klejnoty', description: 'Z koroną i klejnotami' },
                    { id: 'medieval-king', name: 'Król Średniowieczny', description: 'Średniowieczny król' },
                    { id: 'queen-elegant', name: 'Elegancka Królowa', description: 'Elegancka królowa' },
                    { id: 'royal-court', name: 'Dwór Królewski', description: 'W stylu dworu' },
                    { id: 'noble-portrait', name: 'Portret Szlachecki', description: 'Szlachecki portret' }
                ]
            },
            'koty-w-koronie-i-stroju': {
                name: 'Koty w Koronie',
                styles: [
                    { id: 'cat-king', name: 'Król Kot', description: 'Kot jako król' },
                    { id: 'cat-crown', name: 'Kot z Koroną', description: 'Kot z koroną' },
                    { id: 'cat-royal', name: 'Królewski Kot', description: 'Królewski kot' },
                    { id: 'cat-noble', name: 'Szlachecki Kot', description: 'Szlachecki kot' },
                    { id: 'cat-elegant', name: 'Elegancki Kot', description: 'Elegancki kot' },
                    { id: 'cat-majestic', name: 'Majestatyczny Kot', description: 'Majestatyczny kot' }
                ]
            },
            'rodzina-ze-zdjec-grupowych': {
                name: 'Rodzina ze Zdjęć',
                styles: [
                    { id: 'family-portrait', name: 'Portret Rodzinny', description: 'Portret rodzinny' },
                    { id: 'family-group', name: 'Grupa Rodzinna', description: 'Grupa rodzinna' },
                    { id: 'family-collage', name: 'Kolaż Rodzinny', description: 'Kolaż rodzinny' },
                    { id: 'family-memory', name: 'Wspomnienie Rodzinne', description: 'Wspomnienie rodzinne' },
                    { id: 'family-together', name: 'Razem', description: 'Razem jako rodzina' },
                    { id: 'family-love', name: 'Miłość Rodzinna', description: 'Miłość rodzinna' }
                ]
            }
        };
        
        // Get current product handle from URL
        const currentPath = window.location.pathname;
        const productHandle = currentPath.split('/products/')[1];
        console.log('🔍 [DYNAMIC STYLES] Product handle:', productHandle);
        
        // Find matching style group
        let selectedGroup = null;
        for (const [handle, group] of Object.entries(styleGroups)) {
            if (productHandle && productHandle.includes(handle.split('-')[0])) {
                selectedGroup = group;
                break;
            }
        }
        
        // Fallback to first group if no match
        if (!selectedGroup) {
            selectedGroup = styleGroups['zabawne-style-ai-ghibli-pixar-i-wiecej'];
            console.log('🔍 [DYNAMIC STYLES] Using fallback group');
        }
        
        console.log('🎨 [DYNAMIC STYLES] Selected group:', selectedGroup.name);
        
        // Update styles area
        const stylesArea = document.getElementById('stylesArea');
        if (stylesArea) {
            const styleButtons = stylesArea.querySelector('.customify-style-buttons');
            if (styleButtons) {
                // Clear existing buttons
                styleButtons.innerHTML = '';
                
                // Add new style buttons
                selectedGroup.styles.forEach(style => {
                    const button = document.createElement('div');
                    button.className = 'customify-style-btn';
                    button.setAttribute('data-style', style.id);
                    button.textContent = style.name;
                    button.title = style.description;
                    styleButtons.appendChild(button);
                });
                
                console.log('✅ [DYNAMIC STYLES] Styles updated for:', selectedGroup.name);
            }
        }
    }

    // Find insertion point
    function findInsertionPoint() {
        // Try different selectors for product page elements
        const selectors = [
            '.product-form',
            '.product-single__description',
            '.product__description',
            '.product-description',
            '[data-section-type="product"] .product__content',
            '.product-details',
            '.product-info',
            '.product-summary'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                log('Found insertion point:', selector);
                return element;
            }
        }

        // Fallback: try to find any product-related container
        const fallbackSelectors = [
            'main',
            '.main-content',
            '.content',
            '.product',
            '.product-page'
        ];

        for (const selector of fallbackSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                log('Using fallback insertion point:', selector);
                return element;
            }
        }

        return null;
    }

    // Insert Customify into page
    function insertCustomify() {
        if (!isProductPage()) {
            log('Not on product page, skipping Customify');
            return;
        }

        const productId = getCurrentProductId();
        if (!productId) {
            log('Could not determine product ID');
            return;
        }

        if (!shouldShowCustomify(productId)) {
            log('Product not configured for Customify');
            return;
        }

        log('Inserting Customify for product:', productId);

        // Check if container already exists and just show it
        const existingContainer = document.getElementById(CUSTOMIFY_CONFIG.containerId);
        if (existingContainer) {
            log('Existing Customify container found, showing it');
            existingContainer.style.display = 'block';
            existingContainer.style.visibility = 'visible';
            return;
        }

        const insertionPoint = findInsertionPoint();
        if (!insertionPoint) {
            log('Could not find insertion point');
            return;
        }

        // Create container
        const container = createCustomifyContainer();

        // Add title
        const title = createElement('h3', {
            className: 'customify-title',
            innerHTML: '🎨 Spersonalizuj swój produkt z AI'
        });
        title.style.cssText = `
            margin: 0 0 15px 0;
            padding: 15px 20px;
            background: transparent;
            color: #000;
            border-radius: 0;
            font-size: 1.2rem;
            font-weight: 600;
        `;
        container.appendChild(title);

        // Load embed (try inline first, fallback to iframe)
        try {
            console.log('🚀 Trying inline loading...');
            loadCustomifyInline(container);
            console.log('✅ Inline loading successful');
        } catch (e) {
            console.log('❌ Inline loading failed, using iframe:', e);
            loadCustomifyEmbed(container);
        }

        // Insert into page
        insertionPoint.appendChild(container);
        log('Customify inserted successfully');
    }

    // Force override dividers and spacing with JavaScript
    function forceOverrideStyles() {
        console.log('🎯 [CUSTOMIFY] Force overriding styles...');
        
        // Wait for all elements to be loaded
        setTimeout(() => {
            // Remove dividers completely
            const dividers = document.querySelectorAll('.divider, .divider__line, .divider-AM3M2YnhsTllLTUtCS__divider_VJhene');
            dividers.forEach(divider => {
                if (divider && divider.parentNode) {
                    divider.parentNode.removeChild(divider);
                    console.log('🎯 [CUSTOMIFY] Divider removed from DOM');
                }
            });

            // Force spacing with inline styles
            const titleElement = document.querySelector('.group-block[data-testid="group-block"] .view-product-title');
            const badgesElement = document.querySelector('.group-block[data-testid="group-block"] .product-badges');
            
            if (titleElement) {
                titleElement.style.setProperty('margin-bottom', '2px', 'important');
                titleElement.style.setProperty('padding-bottom', '0px', 'important');
                console.log('🎯 [CUSTOMIFY] Title spacing forced');
            }
            
            if (badgesElement) {
                badgesElement.style.setProperty('margin-top', '0px', 'important');
                badgesElement.style.setProperty('padding-top', '0px', 'important');
                console.log('🎯 [CUSTOMIFY] Badges spacing forced');
            }
        }, 1500); // Wait 1.5 seconds for everything to load
    }

    // Initialize when DOM is ready
    function init() {
        console.log('🚀 [CUSTOMIFY] Initializing Customify...');
        log('Initializing Customify...');
        
        // Inject CSS styles for layout
        injectStyles();
        
        // Force override styles after everything loads
        forceOverrideStyles();
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', insertCustomify);
        } else {
            insertCustomify();
        }
    }

    // Handle page navigation (for SPA themes)
    function handleNavigation() {
        // Listen for URL changes
        let currentUrl = window.location.href;
        setInterval(() => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                log('Page navigation detected, reinitializing...');
                
                // Remove existing Customify
                const existing = document.getElementById(CUSTOMIFY_CONFIG.containerId);
                if (existing) {
                    existing.remove();
                }
                
                // Reinsert after a short delay
                setTimeout(insertCustomify, 500);
            }
        }, 1000);
    }

    // Start initialization
    init();
    handleNavigation();

    // Expose for debugging
    window.Customify = {
        config: CUSTOMIFY_CONFIG,
        insert: insertCustomify,
        log: log
    };

})();
// Force cache refresh: 1759763598
