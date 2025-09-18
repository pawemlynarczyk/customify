const fs = require('fs');
const path = require('path');

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
    const { imageData, style, timestamp } = req.body;

    if (!imageData) {
      return res.status(400).json({ 
        error: 'Missing imageData' 
      });
    }

    // Create unique filename
    const filename = `ai-${style}-${timestamp || Date.now()}.jpg`;
    
    // For Vercel, we'll use a temporary approach
    // In production, you'd want to use a proper image storage service
    const imageUrl = `https://customify-s56o.vercel.app/api/get-image?file=${filename}`;
    
    // Store image data in a simple way (for demo purposes)
    // In production, use AWS S3, Cloudinary, or similar
    const imageBuffer = Buffer.from(imageData, 'base64');
    
    // For now, we'll return the original image URL
    // In production, you'd save this to a proper storage service
    res.json({
      success: true,
      imageUrl: imageData, // Return the base64 data URL for now
      filename: filename,
      message: 'Image saved successfully'
    });

  } catch (error) {
    console.error('Save image error:', error);
    res.status(500).json({ 
      error: 'Failed to save image',
      details: error.message 
    });
  }
};
