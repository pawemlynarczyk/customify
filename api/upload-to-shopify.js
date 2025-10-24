const { checkRateLimit, getClientIP } = require('../utils/vercelRateLimiter');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, Authorization');

  // RATE LIMITING - Sprawdź limit dla upload'ów
  const ip = getClientIP(req);
  if (!checkRateLimit(ip, 50, 60 * 60 * 1000)) { // 50 upload'ów na godzinę
    console.log(`Upload rate limit exceeded for IP: ${ip}`);
    return res.status(429).json({
      error: 'Upload rate limit exceeded',
      message: 'Too many uploads. Please try again in 1 hour.',
      retryAfter: 3600
    });
  }

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { imageData, filename } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    console.log('📤 [UPLOAD-SHOPIFY] Starting upload to Shopify CDN...');
    console.log('📤 [UPLOAD-SHOPIFY] Filename:', filename || 'image.png');

    // Shopify configuration
    const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
      console.error('❌ [UPLOAD-SHOPIFY] SHOPIFY_ACCESS_TOKEN not found');
      return res.status(500).json({ error: 'Shopify access token not configured' });
    }

    // Convert data URI to base64 if needed
    let base64Image = imageData;
    if (imageData.startsWith('data:image/')) {
      base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const uniqueFilename = filename ? 
      `temp-${timestamp}-${filename}` : 
      `temp-${timestamp}-image.png`;

    // Prepare image data for Shopify
    const imageUploadData = {
      image: {
        attachment: base64Image,
        filename: uniqueFilename,
        alt: `Temporary upload for AI processing - ${timestamp}`
      }
    };

    console.log('📤 [UPLOAD-SHOPIFY] Uploading to Shopify...');

    // Upload to Shopify using Products API (more reliable permissions)
    console.log('📤 [UPLOAD-SHOPIFY] Uploading via Products API...');
    
    const uploadResponse = await fetch(`https://${shop}/admin/api/2023-10/products.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product: {
          title: `Temp Upload ${timestamp}`,
          body_html: 'Temporary product for image upload',
          vendor: 'Customify',
          product_type: 'Temporary',
          status: 'draft',
          images: [{
            attachment: base64Image,
            filename: uniqueFilename
          }]
        }
      })
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ [UPLOAD-SHOPIFY] Upload failed:', uploadResponse.status, errorText);
      return res.status(500).json({ 
        error: 'Failed to upload to Shopify CDN',
        details: errorText
      });
    }

    const uploadResult = await uploadResponse.json();
    const imageUrl = uploadResult.product.images[0].src;
    
    console.log('✅ [UPLOAD-SHOPIFY] Upload successful:', imageUrl);
    
    res.json({
      success: true,
      url: imageUrl,
      imageUrl: imageUrl,
      filename: uniqueFilename,
      method: 'products-api'
    });

  } catch (error) {
    console.error('❌ [UPLOAD-SHOPIFY] Error:', error);
    res.status(500).json({ 
      error: 'Upload to Shopify failed',
      details: error.message 
    });
  }
};
