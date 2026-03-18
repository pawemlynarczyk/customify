/**
 * Proxy endpoint do serwowania obrazów z Vercel Blob przez naszą domenę
 * 
 * Użycie:
 * GET /api/proxy-image?url=https://vzwqqb14qtsxe2wx.public.blob.vercel-storage.com/...
 * 
 * Cel:
 * - Obejście problemów z CORS w Shopify Email
 * - Kontrola nad headers (Cache-Control, etc.)
 * - Backup jeśli Vercel Blob nie działa w Shopify Email
 */

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ 
        error: 'Missing url parameter',
        usage: 'GET /api/proxy-image?url=https://...'
      });
    }

    // Walidacja URL (tylko Vercel Blob dla bezpieczeństwa)
    const isVercelBlob = url.includes('blob.vercel-storage.com') || url.includes('.public.blob.vercel');
    if (!isVercelBlob) {
      return res.status(400).json({ 
        error: 'Only Vercel Blob URLs are allowed',
        provided: url.substring(0, 50) + '...'
      });
    }

    console.log('🔄 [PROXY-IMAGE] Proxying image:', url.substring(0, 80) + '...');

    // Pobierz obraz z Vercel Blob
    const imageResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Customify-Proxy/1.0'
      }
    });

    if (!imageResponse.ok) {
      const logUrl = url.replace(/\?.*/, '');
      if (imageResponse.status === 404) {
        // Obraz wyczyszczony przez cleanup (>30 dni) - zwróć placeholder SVG zamiast JSON błędu
        // Dzięki temu <img> tag pokazuje placeholder, a logi Vercel nie są zasypane 404
        console.warn('⚠️ [PROXY-IMAGE] Image expired/cleaned up (404), returning placeholder:', logUrl.split('/').pop());
        const placeholder = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
  <rect width="400" height="500" fill="#f5f5f5"/>
  <rect x="150" y="180" width="100" height="80" rx="8" fill="#ddd"/>
  <circle cx="175" cy="205" r="12" fill="#bbb"/>
  <polygon points="150,260 200,210 250,260" fill="#bbb"/>
  <text x="200" y="320" text-anchor="middle" font-family="Arial" font-size="13" fill="#999">Obraz niedostępny</text>
  <text x="200" y="340" text-anchor="middle" font-family="Arial" font-size="11" fill="#bbb">(wygasł po 30 dniach)</text>
</svg>`;
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.status(200).send(placeholder);
      }
      console.error('❌ [PROXY-IMAGE] Failed to fetch image:', imageResponse.status, logUrl);
      return res.status(imageResponse.status).json({ 
        error: 'Failed to fetch image from Vercel Blob',
        status: imageResponse.status
      });
    }

    // Pobierz obraz jako buffer
    const imageBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);

    // Pobierz Content-Type z oryginalnego response
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Ustaw headers dla Shopify Email compatibility
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // Cache na 1 rok
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Usuń headers które mogą powodować problemy
    res.removeHeader('X-Powered-By');

    console.log('✅ [PROXY-IMAGE] Image proxied successfully:', {
      size: buffer.length,
      contentType: contentType
    });

    // Zwróć obraz
    return res.status(200).send(buffer);

  } catch (error) {
    console.error('❌ [PROXY-IMAGE] Error:', error);
    return res.status(500).json({ 
      error: 'Proxy failed', 
      details: error.message 
    });
  }
};

