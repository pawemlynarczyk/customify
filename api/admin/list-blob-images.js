const { list } = require('@vercel/blob');

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { prefix = 'customify', limit = 500, cursor, sortBy = 'date', sortOrder = 'desc' } = req.query;

    console.log('📋 [ADMIN] Listing blob images with prefix:', prefix);

    const result = await list({
      prefix: prefix,
      limit: parseInt(limit),
      cursor: cursor || undefined,
      token: process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log(`✅ [ADMIN] Found ${result.blobs.length} images`);

    // Mapuj bloby do formatu odpowiedzi
    let blobs = result.blobs.map(blob => ({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
      filename: blob.pathname.split('/').pop(),
    }));

    // Sortuj po dacie
    if (sortBy === 'date') {
      blobs.sort((a, b) => {
        const dateA = new Date(a.uploadedAt).getTime();
        const dateB = new Date(b.uploadedAt).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
    }

    // Statystyki - policz obrazy w różnych prefiksach
    const stats = {
      total: blobs.length,
      byPrefix: {},
      byType: {
        temp: 0,
        orders: 0,
        other: 0
      }
    };

    blobs.forEach(blob => {
      // Statystyki po prefiksie
      const prefix = blob.pathname.split('/').slice(0, 2).join('/');
      stats.byPrefix[prefix] = (stats.byPrefix[prefix] || 0) + 1;
      
      // Statystyki po typie
      if (blob.pathname.includes('/temp/')) {
        stats.byType.temp++;
      } else if (blob.pathname.includes('/orders/')) {
        stats.byType.orders++;
      } else {
        stats.byType.other++;
      }
    });

    res.json({
      success: true,
      blobs: blobs,
      cursor: result.cursor,
      hasMore: result.hasMore,
      stats: stats,
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error listing blob images:', error);
    res.status(500).json({ 
      error: 'Failed to list images',
      details: error.message 
    });
  }
};

