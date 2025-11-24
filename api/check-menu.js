/**
 * Sprawdź co jest w menu Shopify main-menu
 */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(500).json({ error: 'Missing SHOPIFY_ACCESS_TOKEN' });
    }

    // GraphQL query: Pobierz menu main-menu
    const query = `
      query {
        menu(handle: "main-menu") {
          id
          handle
          title
          items {
            id
            title
            url
            type
            items {
              id
              title
              url
              type
            }
          }
        }
      }
    `;

    const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Shopify API error',
        details: data
      });
    }

    if (data.errors) {
      return res.status(400).json({
        error: 'GraphQL errors',
        details: data.errors
      });
    }

    const menu = data.data?.menu;

    return res.json({
      success: true,
      menu: menu,
      items: menu?.items || [],
      itemTitles: menu?.items?.map(item => item.title) || []
    });

  } catch (error) {
    console.error('❌ [CHECK-MENU] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

