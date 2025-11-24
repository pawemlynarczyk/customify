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

  const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
  
  // Generate direct Shopify OAuth URL (no redirect through /auth)
  const scopes = 'read_products,write_products,read_orders,write_orders,read_customers,read_content,read_themes,write_themes,read_script_tags,write_script_tags';
  const redirectUri = `${process.env.APP_URL}/auth/callback`;
  const clientId = process.env.SHOPIFY_API_KEY;
  
  // Debug info
  console.log('🔧 Install debug:', {
    shop,
    clientId,
    redirectUri,
    appUrl: process.env.APP_URL,
    scopes
  });
  
  // Validate required parameters
  if (!clientId) {
    console.error('❌ Missing SHOPIFY_API_KEY');
    return res.status(500).send('Missing SHOPIFY_API_KEY environment variable');
  }
  
  if (!process.env.APP_URL) {
    console.error('❌ Missing APP_URL');
    return res.status(500).send('Missing APP_URL environment variable');
  }
  
  // Ensure HTTPS
  const httpsRedirectUri = redirectUri.replace('http://', 'https://');
  
  // Generate state for security (required by Shopify)
  const state = crypto.randomBytes(16).toString('hex');
  
  const installUrl = `https://${shop}/admin/oauth/authorize?` + querystring.stringify({
    client_id: clientId,
    scope: scopes,
    redirect_uri: httpsRedirectUri,
    state: state
  });
  
  console.log('🔗 Generated install URL:', installUrl);
  console.log('🔗 Redirect URI used:', httpsRedirectUri);
  
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
                <strong>Client ID:</strong> ${clientId || 'MISSING!'}<br>
                <strong>Redirect URI:</strong> ${httpsRedirectUri}<br>
                <strong>App URL:</strong> ${process.env.APP_URL || 'MISSING!'}<br>
                <strong>Scopes:</strong> ${scopes}<br>
                <strong>State:</strong> ${state}<br>
                <strong>URL autoryzacji:</strong> <a href="${installUrl}" target="_blank">${installUrl}</a>
            </div>
            
            <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: left;">
                <h4>🔍 OAuth Parameters:</h4>
                <ul>
                    <li><strong>client_id:</strong> ${clientId || 'MISSING!'}</li>
                    <li><strong>scope:</strong> ${scopes}</li>
                    <li><strong>redirect_uri:</strong> ${httpsRedirectUri}</li>
                    <li><strong>state:</strong> ${state}</li>
                </ul>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: left;">
                <h4>🔍 Debug Info:</h4>
                <p><strong>Expected Shopify Partner Dashboard settings:</strong></p>
                <ul>
                    <li><strong>App URL:</strong> ${process.env.APP_URL || 'MISSING!'}</li>
                    <li><strong>Allowed redirection URLs:</strong> ${httpsRedirectUri}</li>
                    <li><strong>Client ID:</strong> ${clientId || 'MISSING!'}</li>
                </ul>
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
