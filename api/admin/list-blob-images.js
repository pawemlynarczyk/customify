// api/admin/list-blob-images.js
/**
 * API endpoint do listowania obrazków z Vercel Blob Storage
 * Kategoryzacja: temp, orders, watermarked, original
 */

const { list } = require('@vercel/blob');
const { checkRateLimit, getClientIP } = require('../../utils/vercelRateLimiter');

module.exports = async (req, res) => {
  console.log(`📊 [LIST-BLOB-IMAGES] API called - Method: ${req.method}`);
  
  // CORS headers
  const allowedOrigins = [
    'https://lumly.pl',
    'https://customify-s56o.vercel.app',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Prosta autoryzacja
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.ADMIN_STATS_TOKEN || 'customify-admin-2024';
    if (authHeader !== `Bearer ${expectedToken}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // IP-based rate limiting
    const ip = getClientIP(req);
    if (!checkRateLimit(ip, 100, 15 * 60 * 1000)) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    const { prefix, limit = 500, cursor, sortBy = 'date', sortOrder = 'desc', category } = req.query;

    console.log('📊 [LIST-BLOB-IMAGES] Request params:', { prefix, limit, cursor, sortBy, sortOrder, category });

    // Sprawdź czy token jest dostępny
    const blobToken = process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      console.error('❌ [LIST-BLOB-IMAGES] No blob token found!');
      return res.status(500).json({ 
        error: 'Blob token not configured',
        message: 'customify_READ_WRITE_TOKEN or BLOB_READ_WRITE_TOKEN environment variable is missing'
      });
    }

    console.log('✅ [LIST-BLOB-IMAGES] Token found:', blobToken ? 'YES' : 'NO');

    // List all blobs (bez prefixu - pobierz wszystko)
    const blobs = await list({
      prefix: prefix || undefined,
      limit: parseInt(limit),
      cursor: cursor || undefined,
      token: blobToken
    });

    console.log(`📊 [LIST-BLOB-IMAGES] Found ${blobs.blobs.length} blobs`);

    // Kategoryzacja obrazków
    const categorizeImage = (blob) => {
      // Użyj pathname lub path (w zależności od wersji API)
      const pathname = blob.pathname || blob.path || '';
      const path = pathname.toLowerCase();
      const name = pathname.toLowerCase();
      
      // 1. Watermarked - zawiera "watermark" w nazwie
      if (name.includes('watermark')) {
        return 'watermarked';
      }
      
      // 2. Temp - prefix customify/temp/
      if (path.startsWith('customify/temp/')) {
        return 'temp';
      }
      
      // 3. Orders - prefix customify/orders/
      if (path.startsWith('customify/orders/')) {
        return 'orders';
      }
      
      // 4. Original - NIE zawiera "watermark" i NIE zawiera "ai" w nazwie
      // i nie jest w temp/orders
      if (!name.includes('watermark') && !name.includes('ai') && 
          !path.startsWith('customify/temp/') && !path.startsWith('customify/orders/')) {
        return 'original';
      }
      
      // 5. Other - wszystko inne
      return 'other';
    };

    // Kategoryzuj wszystkie obrazki
    let categorizedBlobs = blobs.blobs.map(blob => ({
      ...blob,
      category: categorizeImage(blob)
    }));

    // Filtruj po kategorii jeśli podano
    if (category && category !== 'all') {
      categorizedBlobs = categorizedBlobs.filter(blob => blob.category === category);
    }

    // Sortowanie
    if (sortBy === 'date') {
      categorizedBlobs.sort((a, b) => {
        const dateA = new Date(a.uploadedAt).getTime();
        const dateB = new Date(b.uploadedAt).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    } else if (sortBy === 'name') {
      categorizedBlobs.sort((a, b) => {
        const nameA = (a.pathname || a.path || '').toLowerCase();
        const nameB = (b.pathname || b.path || '').toLowerCase();
        return sortOrder === 'asc' 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    }

    // Statystyki per kategoria
    const stats = {
      total: blobs.blobs.length,
      temp: blobs.blobs.filter(b => categorizeImage(b) === 'temp').length,
      orders: blobs.blobs.filter(b => categorizeImage(b) === 'orders').length,
      watermarked: blobs.blobs.filter(b => categorizeImage(b) === 'watermarked').length,
      original: blobs.blobs.filter(b => categorizeImage(b) === 'original').length,
      other: blobs.blobs.filter(b => categorizeImage(b) === 'other').length
    };

    return res.json({
      success: true,
      images: categorizedBlobs.map(blob => ({
        url: blob.url,
        pathname: blob.pathname || blob.path || 'unknown',
        size: blob.size || 0,
        uploadedAt: blob.uploadedAt || blob.uploadedAt || new Date().toISOString(),
        category: blob.category
      })),
      cursor: blobs.cursor,
      hasMore: !!blobs.cursor,
      stats: stats,
      filteredCount: categorizedBlobs.length
    });

  } catch (error) {
    console.error('❌ [LIST-BLOB-IMAGES] Error:', error);
    console.error('❌ [LIST-BLOB-IMAGES] Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
