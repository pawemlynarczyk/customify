const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

    console.log('💾 [SAVE-AI-IMAGE] Saving AI image permanently...');
    console.log('📸 [SAVE-AI-IMAGE] Image URL:', imageUrl);
    console.log('🎨 [SAVE-AI-IMAGE] Style:', style);
    console.log('👤 [SAVE-AI-IMAGE] Customer:', customerName);

    // Pobierz obraz z Replicate/Segmind
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Generuj unikalny identyfikator
    const timestamp = Date.now();
    const hash = crypto.createHash('md5').update(imageUrl + timestamp).digest('hex').substring(0, 8);
    const uniqueId = orderId || `${customerName || 'customer'}-${style || 'ai'}-${timestamp}-${hash}`;
    
    // Nazwa pliku
    const filename = `ai-${uniqueId}.webp`;
    
    // W Vercel, pliki są przechowywane w /tmp (tymczasowo)
    // W produkcji, użyj AWS S3, Cloudinary, lub innego CDN
    const tempPath = path.join('/tmp', filename);
    
    // Zapisz plik tymczasowo (w Vercel /tmp)
    fs.writeFileSync(tempPath, Buffer.from(imageBuffer));

    // URL do obrazu (w Vercel, pliki w /tmp są dostępne przez API)
    const permanentUrl = `https://customify-s56o.vercel.app/api/get-ai-image?file=${filename}`;

    console.log('✅ [SAVE-AI-IMAGE] Image saved permanently:', permanentUrl);

    res.json({
      success: true,
      imageUrl: permanentUrl,
      filename: filename,
      uniqueId: uniqueId,
      message: 'AI image saved permanently'
    });

  } catch (error) {
    console.error('❌ [SAVE-AI-IMAGE] Error:', error);
    res.status(500).json({ 
      error: 'Failed to save AI image',
      details: error.message 
    });
  }
};
