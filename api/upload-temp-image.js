const { put } = require('@vercel/blob');
const { logError, logSuccess } = require('../utils/analytics-logger');
const { getClientIP } = require('../utils/vercelRateLimiter');

module.exports = async (req, res) => {
  // Set CORS headers
  const origin = req.headers.origin;
  if (origin && (origin.includes('lumly.pl') || origin.includes('customify-s56o.vercel.app'))) {                                                                
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
    const ip = getClientIP(req);
    
    if (!imageData) {
      logError('/api/upload-temp-image', new Error('No image data provided'), {
        statusCode: 400,
        ip
      });
      return res.status(400).json({ error: 'No image data provided' });
    }

    console.log('📤 [VERCEL-BLOB] Starting upload to Vercel Blob Storage...');
    
    // Check if customify_READ_WRITE_TOKEN is configured
    if (!process.env.customify_READ_WRITE_TOKEN) {
      console.error('❌ [VERCEL-BLOB] customify_READ_WRITE_TOKEN not configured!');
      return res.status(500).json({ 
        error: 'Vercel Blob Storage not configured',
        details: 'customify_READ_WRITE_TOKEN environment variable is missing. Please configure it in Vercel Dashboard.'
      });
    }
    
    // Convert data URI to buffer if needed
    let imageBuffer;
    if (typeof imageData === 'string') {
      // Remove data URI prefix
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      imageBuffer = Buffer.from(imageData);
    }

    console.log('📦 [VERCEL-BLOB] Image buffer size:', imageBuffer.length, 'bytes');

    // Generate unique filename with custom prefix
    const timestamp = Date.now();
    const uniqueFilename = `customify/temp/${filename || `image-${timestamp}`}.jpg`;

    console.log('📝 [VERCEL-BLOB] Uploading to:', uniqueFilename);

    // Upload to Vercel Blob Storage with custom token for organized storage
    const blob = await put(uniqueFilename, imageBuffer, {
      access: 'public',
      contentType: 'image/jpeg',
      token: process.env.customify_READ_WRITE_TOKEN,
    });

    console.log('✅ [VERCEL-BLOB] Image uploaded successfully:', blob.url);
    
    // Log success
    logSuccess('/api/upload-temp-image', {
      statusCode: 200,
      ip,
      filename: uniqueFilename,
      size: imageBuffer.length,
      url: blob.url
    });

    res.json({
      success: true,
      url: blob.url,
      imageUrl: blob.url,
      filename: uniqueFilename,
      method: 'vercel-blob-storage'
    });

  } catch (error) {
    console.error('❌ [VERCEL-BLOB] Error:', error);
    console.error('❌ [VERCEL-BLOB] Error details:', error.stack);
    
    const ip = getClientIP(req);
    logError('/api/upload-temp-image', error, {
      statusCode: 500,
      ip,
      filename: req.body?.filename,
      imageDataSize: req.body?.imageData?.length || 0
    });
    
    res.status(500).json({ 
      error: 'Upload to Vercel Blob Storage failed',
      details: error.message,
      hint: 'Make sure customify_READ_WRITE_TOKEN is configured in Vercel Dashboard'
    });
  }
};
