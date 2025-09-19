// Customify Shopify Integration Script
(function() {
    'use strict';

    // Configuration
    const CUSTOMIFY_CONFIG = {
        appUrl: 'https://customify-s56o.vercel.app',
        embedUrl: 'https://customify-s56o.vercel.app/shopify-embed.html?v=' + Date.now(),
        containerId: 'customify-app-container',
        enabledProducts: [], // Will be populated from Shopify
        debug: false,
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
        const style = document.createElement('style');
        style.textContent = `
            /* Layout for product page - app and product image side by side */
            #customify-app-container {
                width: 50%;
                float: left;
                margin-right: 20px;
                box-sizing: border-box;
            }

            /* Product image container */
            .product-media {
                width: 50%;
                float: right;
                box-sizing: border-box;
            }

            /* Product image styling */
            .product-media img,
            .product__media img,
            .product-single__media img,
            .product__photo img,
            .product__image img {
                width: 100%;
                height: auto;
                object-fit: contain;
                max-height: 500px;
                border-radius: 8px;
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

            @media (max-width: 768px) {
                /* Mobile: stack vertically */
                #customify-app-container,
                .product-media {
                    width: 100%;
                    float: none;
                    margin-right: 0;
                }

                /* Mobile product image */
                .product-media img,
                .product__media img,
                .product-single__media img,
                .product__photo img,
                .product__image img {
                    max-height: 300px;
                }
            }
        `;
        document.head.appendChild(style);
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 8px 8px 0 0;
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

    // Initialize when DOM is ready
    function init() {
        log('Initializing Customify...');
        
        // Inject CSS styles for layout
        injectStyles();
        
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
