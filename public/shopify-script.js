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
            })
            .catch(error => {
                log('Error loading Customify content:', error);
                container.innerHTML = '<p>Błąd ładowania aplikacji Customify. Spróbuj ponownie później.</p>';
            });
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
