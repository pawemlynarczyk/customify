const { del } = require('@vercel/blob');

module.exports = async (req, res) => {
  // Prosta autoryzacja - sprawdzenie nagłówków Vercel
  const isVercelRequest = req.headers['x-vercel-proxy-signature'] || 
                          req.headers['x-vercel-id'] ||
                          req.headers['x-vercel-deployment-url'];
  
  if (!isVercelRequest) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'DELETE' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    console.log('🗑️ [ADMIN] Deleting blob image:', url);

    await del(url, {
      token: process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log('✅ [ADMIN] Image deleted successfully');

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error deleting blob image:', error);
    res.status(500).json({ 
      error: 'Failed to delete image',
      details: error.message 
    });
  }
};

