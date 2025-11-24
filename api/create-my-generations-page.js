// api/create-my-generations-page.js
/**
 * API Endpoint: Utwórz stronę "Moje generacje" w Shopify
 * 
 * Endpoint: POST /api/create-my-generations-page
 * 
 * Tworzy stronę /pages/my-generations z template page.my-generations.json
 */

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(500).json({ 
        error: 'Missing SHOPIFY_ACCESS_TOKEN',
        message: 'Brak tokenu dostępu do Shopify API'
      });
    }

    // Sprawdź czy strona już istnieje
    const checkResponse = await fetch(`https://${shop}/admin/api/2024-01/pages.json?handle=my-generations`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (checkResponse.ok) {
      const existingPages = await checkResponse.json();
      if (existingPages.pages && existingPages.pages.length > 0) {
        return res.json({
          success: true,
          message: 'Strona już istnieje',
          page: existingPages.pages[0],
          url: `https://lumly.pl/pages/my-generations`
        });
      }
    }

    // Utwórz nową stronę
    const pageData = {
      page: {
        title: 'Moje generacje',
        handle: 'my-generations',
        body_html: '', // Puste - template obsługuje zawartość
        template_suffix: 'my-generations', // Używa template page.my-generations.json
        published: true,
        published_at: new Date().toISOString()
      }
    };

    const createResponse = await fetch(`https://${shop}/admin/api/2024-01/pages.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pageData)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ [CREATE-PAGE] Error creating page:', errorText);
      return res.status(500).json({
        error: 'Failed to create page',
        details: errorText
      });
    }

    const createdPage = await createResponse.json();

    return res.json({
      success: true,
      message: 'Strona utworzona pomyślnie',
      page: createdPage.page,
      url: `https://lumly.pl/pages/my-generations`
    });

  } catch (error) {
    console.error('❌ [CREATE-PAGE] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

