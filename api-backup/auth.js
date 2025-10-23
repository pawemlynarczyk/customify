const crypto = require('crypto');
const querystring = require('querystring');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).send('Shop parameter is required');
    }

    // Generate OAuth URL with correct scopes
    const nonce = crypto.randomBytes(16).toString('hex');
    const scopes = 'write_products,read_orders,write_orders';
    const redirectUri = `${process.env.APP_URL}/auth/callback`;
    
    const authUrl = `https://${shop}/admin/oauth/authorize?` + querystring.stringify({
      client_id: process.env.SHOPIFY_API_KEY,
      scope: scopes,
      redirect_uri: redirectUri,
      state: nonce
    });

    console.log(`🔐 Redirecting to Shopify OAuth: ${authUrl}`);
    res.redirect(authUrl);
  } catch (error) {
    console.error('❌ OAuth auth error:', error);
    res.status(500).send(`
      <h1>Authentication Error</h1>
      <p>Error: ${error.message}</p>
      <a href="/install">Try again</a>
    `);
  }
};
