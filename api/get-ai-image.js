const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    const { file } = req.query;
    
    if (!file) {
      return res.status(400).json({ error: 'Missing file parameter' });
    }

    // Bezpieczeństwo - sprawdź czy plik ma dozwolone rozszerzenie
    if (!file.match(/^ai-[a-zA-Z0-9-]+\.(webp|jpg|jpeg|png)$/)) {
      return res.status(400).json({ error: 'Invalid file format' });
    }

    const filePath = path.join('/tmp', file);
    
    // Sprawdź czy plik istnieje
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Pobierz plik
    const imageBuffer = fs.readFileSync(filePath);
    
    // Ustaw odpowiednie nagłówki
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache na rok
    res.setHeader('Content-Length', imageBuffer.length);
    
    // Wyślij obraz
    res.send(imageBuffer);

  } catch (error) {
    console.error('❌ [GET-AI-IMAGE] Error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve image',
      details: error.message 
    });
  }
};
