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

    console.log('💾 [SAVE-AI-IMAGE-PUBLIC] Saving AI image to public folder...');
    console.log('📸 [SAVE-AI-IMAGE-PUBLIC] Image URL:', imageUrl);
    console.log('🎨 [SAVE-AI-IMAGE-PUBLIC] Style:', style);
    console.log('👤 [SAVE-AI-IMAGE-PUBLIC] Customer:', customerName);

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
    
    // Nazwa pliku
    const filename = `ai-${uniqueId}.webp`;
    
    // Ścieżka do publicznego folderu
    const publicPath = path.join(process.cwd(), 'public', 'ai-images');
    
    // Utwórz folder jeśli nie istnieje
    if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath, { recursive: true });
    }
    
    const filePath = path.join(publicPath, filename);
    
    // Zapisz plik w publicznym folderze
    fs.writeFileSync(filePath, buffer);

    // URL do obrazu (dostępny publicznie)
    const publicUrl = `https://customify-s56o.vercel.app/ai-images/${filename}`;
    
    console.log('✅ [SAVE-AI-IMAGE-PUBLIC] Image saved to public folder:', publicUrl);

    res.json({
      success: true,
      imageUrl: publicUrl,
      filename: filename,
      uniqueId: uniqueId,
      message: 'AI image saved to public folder (permanent)'
    });

  } catch (error) {
    console.error('❌ [SAVE-AI-IMAGE-PUBLIC] Error:', error);
    res.status(500).json({ 
      error: 'Failed to save AI image to public folder',
      details: error.message 
    });
  }
};
