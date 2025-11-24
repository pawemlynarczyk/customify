// api/update-page-settings.js
/**
 * API Endpoint: Zaktualizuj ustawienia strony "Moje generacje"
 * 
 * Endpoint: POST /api/update-page-settings
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

    // Znajdź stronę "my-generations"
    const checkResponse = await fetch(`https://${shop}/admin/api/2024-01/pages.json?handle=my-generations`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!checkResponse.ok) {
      return res.status(500).json({
        error: 'Failed to fetch page',
        message: `HTTP ${checkResponse.status}`
      });
    }

    const pagesData = await checkResponse.json();
    if (!pagesData.pages || pagesData.pages.length === 0) {
      return res.status(404).json({
        error: 'Page not found',
        message: 'Strona /pages/my-generations nie istnieje'
      });
    }

    const page = pagesData.pages[0];
    const pageId = page.id;

    // Zaktualizuj stronę - upewnij się że używa template
    const updateResponse = await fetch(`https://${shop}/admin/api/2024-01/pages/${pageId}.json`, {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page: {
          id: pageId,
          template_suffix: 'my-generations' // Upewnij się że używa template
        }
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('❌ [UPDATE-PAGE] Error updating page:', errorText);
      return res.status(500).json({
        error: 'Failed to update page',
        details: errorText
      });
    }

    const updatedPage = await updateResponse.json();

    return res.json({
      success: true,
      message: 'Strona zaktualizowana - używa template page.my-generations.json',
      page: updatedPage.page,
      note: 'Ustawienia sekcji (title, description) są teraz z template, nie z ręcznych ustawień strony'
    });

  } catch (error) {
    console.error('❌ [UPDATE-PAGE] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

