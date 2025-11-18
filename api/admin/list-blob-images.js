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

    const { prefix, limit = 1000, cursor, sortBy = 'date', sortOrder = 'desc', category } = req.query;

    console.log('📊 [LIST-BLOB-IMAGES] Request params:', { prefix, limit, cursor, sortBy, sortOrder, category });

    // List all blobs (bez prefixu - pobierz wszystko)
    const blobs = await list({
      prefix: prefix || undefined,
      limit: parseInt(limit),
      cursor: cursor || undefined,
      token: process.env.customify_READ_WRITE_TOKEN
    });

    console.log(`📊 [LIST-BLOB-IMAGES] Found ${blobs.blobs.length} blobs from Vercel Blob API`);
    console.log(`📊 [LIST-BLOB-IMAGES] Has cursor (more pages): ${!!blobs.cursor}`);
    if (blobs.blobs.length > 0) {
      console.log(`📊 [LIST-BLOB-IMAGES] First blob: ${blobs.blobs[0].pathname || blobs.blobs[0].path}`);
      console.log(`📊 [LIST-BLOB-IMAGES] Last blob: ${blobs.blobs[blobs.blobs.length - 1].pathname || blobs.blobs[blobs.blobs.length - 1].path}`);
    }

    // Kategoryzacja obrazków - POPRAWIONA LOGIKA Z WYKRYWANIEM OBRAZÓW AI
    const categorizeImage = (blob) => {
      const pathname = blob.pathname || blob.path || '';
      const path = pathname.toLowerCase();
      const filename = pathname.split('/').pop().toLowerCase(); // Nazwa pliku bez ścieżki
      const isJson = pathname.toLowerCase().endsWith('.json');
      
      // 0. UKRYJ pliki wewnętrzne/logi (nie pokazuj w panelu)
      if (
        path.startsWith('customify/internal/') ||
        (path.startsWith('customify/stats/') && !path.startsWith('customify/system/stats/')) ||
        path.startsWith('customify/temp/admin-stats/')
      ) {
        return null;
      }
      
      // 1. STATYSTYKI - TYLKO pliki JSON z customify/system/stats/generations/
      if (isJson && path.startsWith('customify/system/stats/generations/')) {
        return 'statystyki';
      }
      
      // 2. KOSZYKI - zawiera "watermark" w ścieżce LUB nazwie (najwyższy priorytet)
      if (path.includes('watermark')) {
        return 'koszyki';
      }
      
      // 3. ORDERS - prefix customify/orders/ (bez watermark)
      if (path.startsWith('customify/orders/')) {
        return 'orders';
      }
      
      // 4. WYGENEROWANE (obrazy AI) - w customify/temp/ z nazwami wskazującymi na AI
      // Sprawdź czy to obraz AI (caricature, generation, boho, king, koty, pixar, ai)
      if (path.startsWith('customify/temp/')) {
        const aiKeywords = ['caricature', 'generation', 'boho', 'king', 'koty', 'pixar', 'ai', 'transform', 'style'];
        const isAIGenerated = aiKeywords.some(keyword => filename.includes(keyword));
        
        if (isAIGenerated) {
          return 'wygenerowane';
        }
        
        // Jeśli nie ma słów kluczowych AI, to jest upload (oryginalne zdjęcie użytkownika)
        return 'upload';
      }
      
      // 5. WYGENEROWANE - wszystko inne (obrazy AI poza temp/, generacje, itp.)
      return 'wygenerowane';
    };

    // Kategoryzuj wszystkie obrazki
    let allCategorizedBlobs = blobs.blobs
      .map(blob => ({
        ...blob,
        category: categorizeImage(blob)
      }))
      .filter(blob => blob.category !== null);

    // Statystyki per kategoria - LICZ PRZED FILTROWANIEM!
    const stats = {
      total: allCategorizedBlobs.length,
      upload: allCategorizedBlobs.filter(b => b.category === 'upload').length,
      orders: allCategorizedBlobs.filter(b => b.category === 'orders').length,
      koszyki: allCategorizedBlobs.filter(b => b.category === 'koszyki').length,
      wygenerowane: allCategorizedBlobs.filter(b => b.category === 'wygenerowane').length,
      statystyki: allCategorizedBlobs.filter(b => b.category === 'statystyki').length
    };

    // Filtruj po kategorii jeśli podano (PO liczeniu statystyk!)
    let categorizedBlobs = allCategorizedBlobs;
    if (category && category !== 'all') {
      categorizedBlobs = allCategorizedBlobs.filter(blob => blob.category === category);
    }
    
    console.log(`📊 [LIST-BLOB-IMAGES] Category stats:`, stats);
    console.log(`📊 [LIST-BLOB-IMAGES] After filtering by category "${category || 'all'}": ${categorizedBlobs.length} blobs`);

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

    return res.json({
      success: true,
      images: categorizedBlobs.map(blob => {
        const pathname = blob.pathname || blob.path || 'unknown';
        const isJson = pathname.toLowerCase().endsWith('.json');
        return {
          url: blob.url,
          pathname: pathname,
          size: blob.size || 0,
          uploadedAt: blob.uploadedAt || blob.uploadedAt || new Date().toISOString(),
          category: blob.category,
          isJson: isJson,
          contentType: blob.contentType || (isJson ? 'application/json' : 'image')
        };
      }),
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
