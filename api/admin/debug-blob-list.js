// api/admin/debug-blob-list.js
// Endpoint diagnostyczny do sprawdzania Vercel Blob Storage

const { list } = require('@vercel/blob');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Prosta autoryzacja
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.ADMIN_STATS_TOKEN;
    if (authHeader !== `Bearer ${expectedToken}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('🔍 [DEBUG-BLOB] Starting blob list...');
    
    // Pobierz wszystkie bloby
    const allBlobs = [];
    let nextCursor = undefined;
    let pageCount = 0;
    
    do {
      pageCount++;
      console.log(`🔍 [DEBUG-BLOB] Fetching page ${pageCount}...`);
      
      const result = await list({
        prefix: 'customify/temp/',
        limit: 1000,
        cursor: nextCursor,
        token: process.env.customify_READ_WRITE_TOKEN
      });
      
      allBlobs.push(...result.blobs);
      nextCursor = result.cursor;
      
      console.log(`🔍 [DEBUG-BLOB] Page ${pageCount}: ${result.blobs.length} blobs, hasMore: ${!!nextCursor}`);
    } while (nextCursor && pageCount < 50); // Max 50 stron
    
    console.log(`🔍 [DEBUG-BLOB] Total blobs: ${allBlobs.length}`);
    
    // Filtruj tylko generation-*
    const generationBlobs = allBlobs.filter(b => {
      const filename = (b.pathname || b.path || '').split('/').pop();
      return filename.startsWith('generation-') || filename.startsWith('ai-') || filename.startsWith('text-overlay-');
    });
    
    console.log(`🔍 [DEBUG-BLOB] Generation blobs: ${generationBlobs.length}`);
    
    // Sortuj po dacie (timestamp z nazwy pliku)
    generationBlobs.sort((a, b) => {
      const getTimestamp = (blob) => {
        const match = (blob.pathname || '').match(/\d{13}/);
        return match ? parseInt(match[0]) : 0;
      };
      return getTimestamp(b) - getTimestamp(a); // Najnowsze najpierw
    });
    
    // Pokaż 20 najnowszych
    const newest20 = generationBlobs.slice(0, 20).map(b => ({
      pathname: b.pathname,
      uploadedAt: b.uploadedAt,
      timestampFromName: (() => {
        const match = (b.pathname || '').match(/\d{13}/);
        return match ? new Date(parseInt(match[0])).toISOString() : null;
      })(),
      size: b.size
    }));
    
    // Pokaż 5 najstarszych
    const oldest5 = generationBlobs.slice(-5).map(b => ({
      pathname: b.pathname,
      uploadedAt: b.uploadedAt,
      timestampFromName: (() => {
        const match = (b.pathname || '').match(/\d{13}/);
        return match ? new Date(parseInt(match[0])).toISOString() : null;
      })(),
      size: b.size
    }));
    
    return res.json({
      success: true,
      stats: {
        totalBlobs: allBlobs.length,
        generationBlobs: generationBlobs.length,
        pages: pageCount
      },
      newest20,
      oldest5
    });
    
  } catch (error) {
    console.error('❌ [DEBUG-BLOB] Error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
};

