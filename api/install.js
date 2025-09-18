const crypto = require('crypto');
const querystring = require('querystring');

// Shopify OAuth helper functions
function generateNonce() {
  return crypto.randomBytes(16).toString('hex');
}

module.exports = (req, res) => {
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

  const shop = process.env.SHOP_DOMAIN || '4b4k1d-fy.myshopify.com';
  
  // Generate direct Shopify OAuth URL (no redirect through /auth)
  const scopes = 'write_products,read_orders,write_orders';
  const redirectUri = `${process.env.APP_URL}/auth/callback`;
  const clientId = process.env.SHOPIFY_API_KEY;
  
  // Debug info
  console.log('🔧 Install debug:', {
    shop,
    clientId,
    redirectUri,
    appUrl: process.env.APP_URL
  });
  
  const installUrl = `https://${shop}/admin/oauth/authorize?` + querystring.stringify({
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri
  });
  
  console.log('🔗 Generated install URL:', installUrl);
  
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html lang="pl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Customify - Install App</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .container { background: #f5f5f5; padding: 30px; border-radius: 10px; text-align: center; }
            .btn { background: #007cba; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px; }
            .btn:hover { background: #005a87; }
            .info { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎨 Customify App Installation</h1>
            <p>Kliknij poniższy przycisk, aby zainstalować aplikację w swoim sklepie Shopify:</p>
            
            <div class="info">
                <strong>Sklep:</strong> ${shop}<br>
                <strong>Client ID:</strong> ${clientId}<br>
                <strong>Redirect URI:</strong> ${redirectUri}<br>
                <strong>App URL:</strong> ${process.env.APP_URL}<br>
                <strong>URL autoryzacji:</strong> <a href="${installUrl}" target="_blank">${installUrl}</a>
            </div>
            
            <a href="${installUrl}" class="btn">🚀 Zainstaluj aplikację</a>
            
            <h3>Dostępne endpointy:</h3>
            <ul style="text-align: left; display: inline-block;">
                <li><code>GET /</code> - Strona główna</li>
                <li><code>POST /api/upload</code> - Upload obrazów</li>
                <li><code>POST /api/transform</code> - Transformacja AI</li>
                <li><code>POST /api/products</code> - Tworzenie produktów</li>
                <li><code>GET /auth/callback</code> - OAuth callback</li>
                <li><code>GET /install</code> - Ta strona</li>
            </ul>
        </div>
    </body>
    </html>
  `);
};
