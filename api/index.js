const express = require('express');
const multer = require('multer');
const Replicate = require('replicate');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const crypto = require('crypto');
const querystring = require('querystring');
const fs = require('fs');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Use memory storage for serverless

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Initialize Replicate (only if token is provided)
let replicate = null;
if (process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_API_TOKEN !== 'leave_empty_for_now') {
  replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });
}

// Shopify OAuth helper functions
function generateNonce() {
  return crypto.randomBytes(16).toString('hex');
}

function generateHmac(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

function verifyHmac(query, secret) {
  const { hmac, ...rest } = query;
  const message = querystring.stringify(rest);
  const hash = generateHmac(message, secret);
  return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(hash, 'hex'));
}

// Routes

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Install route - redirects to Shopify OAuth
app.get('/install', (req, res) => {
  const shop = process.env.SHOP_DOMAIN || '4b4k1d-fy.myshopify.com';
  const installUrl = `${process.env.APP_URL}/auth?shop=${shop}`;
  
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
                <strong>URL autoryzacji:</strong> ${installUrl}
            </div>
            
            <a href="${installUrl}" class="btn">🚀 Zainstaluj aplikację</a>
            
            <h3>Dostępne endpointy:</h3>
            <ul style="text-align: left; display: inline-block;">
                <li><code>GET /</code> - Strona główna</li>
                <li><code>POST /api/upload</code> - Upload obrazów</li>
                <li><code>POST /api/transform</code> - Transformacja AI</li>
                <li><code>POST /api/products</code> - Tworzenie produktów</li>
                <li><code>GET /auth</code> - OAuth authorization</li>
                <li><code>GET /auth/callback</code> - OAuth callback</li>
                <li><code>GET /install</code> - Ta strona</li>
            </ul>
        </div>
    </body>
    </html>
  `);
});

// File upload endpoint
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // For serverless, we'll return the file data as base64
    const fileData = req.file.buffer.toString('base64');
    res.json({ 
      success: true, 
      fileData: fileData,
      filename: req.file.originalname,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// AI transformation endpoint
app.post('/api/transform', async (req, res) => {
  try {
    const { imageData, prompt } = req.body;

    if (!imageData || !prompt) {
      return res.status(400).json({ error: 'Image data and prompt are required' });
    }

    if (!replicate) {
      return res.status(400).json({ error: 'Replicate API token not configured' });
    }

    // Convert base64 to data URL for Replicate
    const imageUrl = `data:image/jpeg;base64,${imageData}`;

    // Use Replicate for AI image transformation
    const output = await replicate.run(
      "stability-ai/stable-diffusion:db21e45d3f7023abc2e46a38e7e5df2717954a28",
      {
        input: {
          image: imageUrl,
          prompt: prompt,
          num_inference_steps: 20,
          guidance_scale: 7.5,
          strength: 0.8
        }
      }
    );

    res.json({ 
      success: true, 
      transformedImage: output[0] 
    });
  } catch (error) {
    console.error('AI transformation error:', error);
    res.status(500).json({ error: 'AI transformation failed' });
  }
});

// Product creation endpoint
app.post('/api/products', async (req, res) => {
  try {
    const { title, description, price, images, variantTitle } = req.body;

    if (!title || !price) {
      return res.status(400).json({ error: 'Title and price are required' });
    }

    // This would typically use Shopify's GraphQL Admin API
    // For demo purposes, we'll return a mock response
    const product = {
      id: Date.now(),
      title: title,
      body_html: description || '',
      vendor: 'Customify',
      product_type: 'Custom Product',
      variants: [{
        id: Date.now() + 1,
        title: variantTitle || 'Default Title',
        price: price,
        inventory_quantity: 100
      }],
      images: images || []
    };

    res.json({ 
      success: true, 
      product: product 
    });
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: 'Product creation failed' });
  }
});

// Shopify OAuth routes
app.get('/auth', (req, res) => {
  const { shop } = req.query;
  
  if (!shop) {
    return res.status(400).send('Shop parameter is required');
  }

  // Generate OAuth URL with correct scopes
  const nonce = generateNonce();
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
});

app.get('/auth/callback', async (req, res) => {
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
      return res.status(400).send(`OAuth error: ${req.query.error}`);
    }

    if (!shop || !code) {
      console.error('❌ Missing required parameters:', { shop, code });
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
      res.redirect('/?shop=' + shop + '&authenticated=true');
    } else {
      console.error('❌ Failed to get access token:', tokenData);
      res.status(400).send(`
        <h1>Token Exchange Failed</h1>
        <p>Response: ${JSON.stringify(tokenData)}</p>
        <a href="/install">Try again</a>
      `);
    }
  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    res.status(500).send(`
      <h1>Authentication Error</h1>
      <p>Error: ${error.message}</p>
      <a href="/install">Try again</a>
    `);
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }
  
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
