/**
 * Pobierz menu Shopify main-menu przez REST API
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

    // REST API: Pobierz wszystkie menu
    const response = await fetch(`https://${shop}/admin/api/2024-01/menus.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Shopify API error',
        details: data
      });
    }

    // Znajdź menu main-menu
    const mainMenu = data.menus?.find(menu => menu.handle === 'main-menu');

    return res.json({
      success: true,
      allMenus: data.menus?.map(m => ({ id: m.id, handle: m.handle, title: m.title })) || [],
      mainMenu: mainMenu ? {
        id: mainMenu.id,
        handle: mainMenu.handle,
        title: mainMenu.title,
        items: mainMenu.items || []
      } : null,
      mainMenuItems: mainMenu?.items || []
    });

  } catch (error) {
    console.error('❌ [GET-MENU] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

