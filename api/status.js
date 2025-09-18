const crypto = require('crypto');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const shop = process.env.SHOP_DOMAIN || 'customiffyy.myshopify.com';
  const clientId = process.env.SHOPIFY_API_KEY;
  const appUrl = process.env.APP_URL;

  // Check if we have access token (app is installed)
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  
  console.log('🔍 Status debug:', {
    hasAccessToken: !!accessToken,
    tokenLength: accessToken ? accessToken.length : 0,
    tokenStart: accessToken ? accessToken.substring(0, 10) + '...' : 'none',
    shop,
    clientId: !!clientId
  });
  
  let installationStatus = 'unknown';
  let shopInfo = null;
  let error = null;

  // Check if app is installed by looking for access token
  if (accessToken) {
    try {
      // Try to fetch shop info to verify installation
      const response = await fetch(`https://${shop}/admin/api/2023-10/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        shopInfo = data.shop;
        installationStatus = 'installed';
      } else {
        installationStatus = 'not_installed';
        error = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (err) {
      installationStatus = 'error';
      error = err.message;
    }
  } else {
    // No access token in environment - check if we can get one via OAuth
    installationStatus = 'needs_oauth';
    error = 'App needs to complete OAuth flow to get access token';
  }

  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html lang="pl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Customify - App Status</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .container { background: #f5f5f5; padding: 30px; border-radius: 10px; }
            .status { padding: 15px; border-radius: 5px; margin: 10px 0; }
            .installed { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .not-installed { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
            .error { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
            .info { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .btn { background: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 5px; }
            .btn:hover { background: #005a87; }
            .shop-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔍 Customify App Status</h1>
            
            <div class="status ${installationStatus === 'installed' ? 'installed' : installationStatus === 'needs_oauth' ? 'error' : installationStatus === 'error' ? 'error' : 'not-installed'}">
                <h3>Status instalacji: ${installationStatus === 'installed' ? '✅ ZAINSTALOWANA' : installationStatus === 'needs_oauth' ? '🔄 WYMAGA OAuth' : installationStatus === 'error' ? '❌ BŁĄD' : '❌ NIE ZAINSTALOWANA'}</h3>
                ${error ? `<p><strong>Błąd:</strong> ${error}</p>` : ''}
                ${installationStatus === 'needs_oauth' ? '<p><strong>Rozwiązanie:</strong> Kliknij "Zainstaluj aplikację" poniżej, aby przejść przez OAuth i uzyskać access token.</p>' : ''}
            </div>

            <div class="info">
                <h4>🔧 Informacje o aplikacji:</h4>
                <p><strong>Sklep:</strong> ${shop}</p>
                <p><strong>Client ID:</strong> ${clientId || 'MISSING!'}</p>
                <p><strong>App URL:</strong> ${appUrl || 'MISSING!'}</p>
                <p><strong>Access Token:</strong> ${accessToken ? '✅ Ustawiony' : '❌ Brak'}</p>
                ${accessToken ? `<p><strong>Token (pierwsze 10 znaków):</strong> ${accessToken.substring(0, 10)}...</p>` : ''}
                <p><strong>Długość tokenu:</strong> ${accessToken ? accessToken.length : 0} znaków</p>
            </div>

            ${shopInfo ? `
            <div class="shop-info">
                <h4>🏪 Informacje o sklepie:</h4>
                <p><strong>Nazwa:</strong> ${shopInfo.name}</p>
                <p><strong>Email:</strong> ${shopInfo.email}</p>
                <p><strong>Domena:</strong> ${shopInfo.domain}</p>
                <p><strong>Waluta:</strong> ${shopInfo.currency}</p>
                <p><strong>Plan:</strong> ${shopInfo.plan_name}</p>
            </div>
            ` : ''}

            <div style="margin-top: 30px;">
                <a href="/install" class="btn">🚀 Zainstaluj aplikację</a>
                <a href="/" class="btn">🏠 Strona główna</a>
                <a href="https://${shop}/admin/apps" class="btn" target="_blank">📱 Shopify Apps</a>
            </div>

            <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4>💡 Jak sprawdzić instalację:</h4>
                <ol>
                    <li><strong>W Shopify Admin:</strong> Przejdź do <code>Apps</code> w lewym menu</li>
                    <li><strong>W Partner Dashboard:</strong> Sprawdź sekcję "Test your app"</li>
                    <li><strong>Sprawdź URL:</strong> <a href="https://${shop}/admin/apps" target="_blank">https://${shop}/admin/apps</a></li>
                </ol>
            </div>
        </div>
    </body>
    </html>
  `);
};
