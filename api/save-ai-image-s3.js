const AWS = require('aws-sdk');
const crypto = require('crypto');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'customify-ai-images';

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { imageUrl, style, customerName, orderId } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ 
        error: 'Missing imageUrl parameter' 
      });
    }

    console.log('💾 [SAVE-AI-IMAGE-S3] Saving AI image to AWS S3...');
    console.log('📸 [SAVE-AI-IMAGE-S3] Image URL:', imageUrl);
    console.log('🎨 [SAVE-AI-IMAGE-S3] Style:', style);
    console.log('👤 [SAVE-AI-IMAGE-S3] Customer:', customerName);

    // Pobierz obraz z Replicate/Segmind
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);

    // Generuj unikalny identyfikator
    const timestamp = Date.now();
    const hash = crypto.createHash('md5').update(imageUrl + timestamp).digest('hex').substring(0, 8);
    const uniqueId = orderId || `${customerName || 'customer'}-${style || 'ai'}-${timestamp}-${hash}`;
    
    // Nazwa pliku w S3
    const filename = `ai-images/${uniqueId}.webp`;
    
    // Parametry uploadu do S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType: 'image/webp',
      ACL: 'public-read', // Publiczny dostęp
      Metadata: {
        'customer-name': customerName || 'unknown',
        'ai-style': style || 'unknown',
        'order-id': uniqueId,
        'upload-date': new Date().toISOString()
      }
    };

    // Upload do S3
    const uploadResult = await s3.upload(uploadParams).promise();
    
    console.log('✅ [SAVE-AI-IMAGE-S3] Image uploaded to S3:', uploadResult.Location);

    // URL do obrazu (CloudFront CDN)
    const cdnUrl = `https://d1234567890.cloudfront.net/${filename}`;
    
    res.json({
      success: true,
      imageUrl: uploadResult.Location, // S3 URL
      cdnUrl: cdnUrl, // CloudFront CDN URL (szybszy)
      filename: filename,
      uniqueId: uniqueId,
      message: 'AI image saved permanently to AWS S3'
    });

  } catch (error) {
    console.error('❌ [SAVE-AI-IMAGE-S3] Error:', error);
    res.status(500).json({ 
      error: 'Failed to save AI image to S3',
      details: error.message 
    });
  }
};
