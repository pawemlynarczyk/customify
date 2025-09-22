const crypto = require('crypto');
const querystring = require('querystring');

// Shopify OAuth helper functions
function generateHmac(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

function verifyHmac(query, secret) {
  const { hmac, ...rest } = query;
  const message = querystring.stringify(rest);
  const hash = generateHmac(message, secret);
  return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(hash, 'hex'));
}

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

  try {
    const { code, state, shop, hmac } = req.query;

    console.log('🔐 OAuth callback received:', { 
      shop, 
      state, 
      hasCode: !!code, 
      hasHmac: !!hmac,
      allQueryParams: req.query 
    });

    // Check for error from Shopify
    if (req.query.error) {
      console.error('❌ Shopify OAuth error:', req.query.error);
      res.setHeader('Content-Type', 'text/html');
      return res.status(400).send(`OAuth error: ${req.query.error}`);
    }

    if (!shop || !code) {
      console.error('❌ Missing required parameters:', { shop, code });
      res.setHeader('Content-Type', 'text/html');
      return res.status(400).send(`
        <h1>OAuth Error</h1>
        <p>Missing required parameters:</p>
        <ul>
          <li>Shop: ${shop || 'undefined'}</li>
          <li>Code: ${code || 'undefined'}</li>
        </ul>
        <p>All query parameters: ${JSON.stringify(req.query)}</p>
        <a href="/install">Try again</a>
      `);
    }

    // Verify HMAC if provided
    if (hmac && !verifyHmac(req.query, process.env.SHOPIFY_API_SECRET)) {
      console.error('❌ Invalid HMAC');
      res.setHeader('Content-Type', 'text/html');
      return res.status(400).send('Invalid HMAC');
    }

    // Exchange code for access token
    console.log('🔄 Exchanging code for access token...');
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code: code
      })
    });

    const tokenData = await tokenResponse.json();
    console.log('🔑 Token response:', tokenData);
    
    if (tokenData.access_token) {
      console.log('✅ OAuth successful for shop:', shop);
      
      // Register webhook for orders/create
      try {
        const webhookResponse = await fetch(`https://${shop}/admin/api/2023-10/webhooks.json`, {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': tokenData.access_token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            webhook: {
              topic: 'orders/create',
              address: `${process.env.APP_URL}/api/webhooks/orders/create`,
              format: 'json'
            }
          })
        });
        
        if (webhookResponse.ok) {
          console.log('✅ Webhook registered successfully');
        } else {
          console.log('⚠️ Webhook registration failed:', webhookResponse.status);
        }
      } catch (webhookError) {
        console.log('⚠️ Webhook registration error:', webhookError.message);
      }
      
      res.redirect('/?shop=' + shop + '&authenticated=true');
    } else {
      console.error('❌ Failed to get access token:', tokenData);
      res.setHeader('Content-Type', 'text/html');
      res.status(400).send(`
        <h1>Token Exchange Failed</h1>
        <p>Response: ${JSON.stringify(tokenData)}</p>
        <a href="/install">Try again</a>
      `);
    }
  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    res.setHeader('Content-Type', 'text/html');
    res.status(500).send(`
      <h1>Authentication Error</h1>
      <p>Error: ${error.message}</p>
      <a href="/install">Try again</a>
    `);
  }
};
