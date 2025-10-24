const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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

    console.log('💾 [SAVE-AI-IMAGE-CLOUDINARY] Saving AI image to Cloudinary...');
    console.log('📸 [SAVE-AI-IMAGE-CLOUDINARY] Image URL:', imageUrl);
    console.log('🎨 [SAVE-AI-IMAGE-CLOUDINARY] Style:', style);
    console.log('👤 [SAVE-AI-IMAGE-CLOUDINARY] Customer:', customerName);

    // Generuj unikalny identyfikator
    const timestamp = Date.now();
    const uniqueId = orderId || `${customerName || 'customer'}-${style || 'ai'}-${timestamp}`;
    
    // Upload do Cloudinary
    const uploadResult = await cloudinary.uploader.upload(imageUrl, {
      public_id: `customify-ai-images/${uniqueId}`,
      folder: 'customify-ai-images',
      resource_type: 'image',
      format: 'webp',
      quality: 'auto',
      fetch_format: 'auto',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' }, // Maksymalny rozmiar
        { quality: 'auto' }
      ]
    });
    
    console.log('✅ [SAVE-AI-IMAGE-CLOUDINARY] Image uploaded to Cloudinary:', uploadResult.secure_url);

    res.json({
      success: true,
      imageUrl: uploadResult.secure_url, // HTTPS URL z Cloudinary
      publicId: uploadResult.public_id,
      filename: uploadResult.original_filename,
      uniqueId: uniqueId,
      message: 'AI image saved permanently to Cloudinary'
    });

  } catch (error) {
    console.error('❌ [SAVE-AI-IMAGE-CLOUDINARY] Error:', error);
    res.status(500).json({ 
      error: 'Failed to save AI image to Cloudinary',
      details: error.message 
    });
  }
};
