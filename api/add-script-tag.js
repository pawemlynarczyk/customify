// api/add-script-tag.js
/**
 * API Endpoint: Dodaj Script Tag do Shopify
 * 
 * Script Tag pozwala na załadowanie JavaScript na wszystkich stronach Shopify,
 * w tym na stronach Customer Account API (account.lumly.pl)
 * 
 * Endpoint: POST /api/add-script-tag
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

    // Sprawdź czy Script Tag już istnieje
    const checkResponse = await fetch(`https://${shop}/admin/api/2024-01/script_tags.json`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (checkResponse.ok) {
      const existingScripts = await checkResponse.json();
      const scriptUrl = 'https://customify-s56o.vercel.app/api/customer-account-menu.js';
      
      const existingScript = existingScripts.script_tags?.find(
        script => script.src === scriptUrl
      );

      if (existingScript) {
        // Usuń stary Script Tag jeśli display_scope jest zły
        if (existingScript.display_scope !== 'all') {
          console.log('⚠️ [SCRIPT-TAG] Stary Script Tag ma zły display_scope, usuwam...');
          await fetch(`https://${shop}/admin/api/2024-01/script_tags/${existingScript.id}.json`, {
            method: 'DELETE',
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json'
            }
          });
          // Kontynuuj tworzenie nowego
        } else {
          return res.json({
            success: true,
            message: 'Script Tag już istnieje z poprawnym display_scope',
            script_tag: existingScript
          });
        }
      }
    }

    // Utwórz Script Tag
    const scriptTagData = {
      script_tag: {
        event: 'onload', // Ładuj na wszystkich stronach
        src: 'https://customify-s56o.vercel.app/api/customer-account-menu.js',
        display_scope: 'all' // Wszystkie strony (w tym account.lumly.pl)
      }
    };

    const createResponse = await fetch(`https://${shop}/admin/api/2024-01/script_tags.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(scriptTagData)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ [SCRIPT-TAG] Error creating script tag:', errorText);
      return res.status(500).json({
        error: 'Failed to create script tag',
        details: errorText
      });
    }

    const createdScript = await createResponse.json();

    return res.json({
      success: true,
      message: 'Script Tag utworzony pomyślnie',
      script_tag: createdScript.script_tag
    });

  } catch (error) {
    console.error('❌ [SCRIPT-TAG] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

