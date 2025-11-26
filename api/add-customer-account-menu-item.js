/**
 * API Endpoint: Dodaj link "Moje obrazy" do menu konta klienta w Shopify
 * 
 * W Shopify 2.0, menu konta klienta jest zarządzane przez Customer Account API.
 * Ten endpoint dodaje link "Moje obrazy" obok "Zamówienia" w menu konta klienta.
 * 
 * Endpoint: POST /api/add-customer-account-menu-item
 */

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
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

    // GraphQL mutation: Dodaj link do menu konta klienta
    const mutation = `
      mutation customerAccountMenuCreate($menuItem: CustomerAccountMenuItemInput!) {
        customerAccountMenuCreate(menuItem: $menuItem) {
          menuItem {
            id
            title
            url
            type
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      menuItem: {
        title: "Moje obrazy",
        url: "/pages/my-generations",
        type: "PAGE"
      }
    };

    const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        query: mutation,
        variables: variables
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [CUSTOMER-ACCOUNT-MENU] Shopify API error:', response.status, data);
      return res.status(response.status).json({
        error: 'Shopify API error',
        details: data,
        message: 'Błąd podczas dodawania linku do menu konta klienta'
      });
    }

    if (data.errors) {
      console.error('❌ [CUSTOMER-ACCOUNT-MENU] GraphQL errors:', data.errors);
      return res.status(400).json({
        error: 'GraphQL errors',
        details: data.errors,
        message: 'Błąd GraphQL podczas dodawania linku'
      });
    }

    const result = data.data?.customerAccountMenuCreate;

    if (result?.userErrors && result.userErrors.length > 0) {
      console.error('❌ [CUSTOMER-ACCOUNT-MENU] User errors:', result.userErrors);
      return res.status(400).json({
        error: 'User errors',
        details: result.userErrors,
        message: 'Błędy podczas dodawania linku do menu'
      });
    }

    console.log('✅ [CUSTOMER-ACCOUNT-MENU] Link dodany do menu konta klienta:', result?.menuItem);

    return res.status(200).json({
      success: true,
      message: 'Link "Moje obrazy" został dodany do menu konta klienta',
      menuItem: result?.menuItem
    });

  } catch (error) {
    console.error('❌ [CUSTOMER-ACCOUNT-MENU] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      details: 'Błąd podczas przetwarzania żądania'
    });
  }
};


