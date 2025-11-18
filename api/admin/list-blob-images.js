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

    // ═══════════════════════════════════════════════════════════════════════════
    // KATEGORYZACJA OBRAZKÓW - KOMPLETNA LOGIKA
    // ═══════════════════════════════════════════════════════════════════════════
    // 
    // KATEGORIE (w kolejności priorytetu):
    // 1. STATYSTYKI - pliki JSON z customify/system/stats/generations/
    // 2. KOSZYKI - zawiera "watermark" w nazwie/ścieżce
    // 3. ORDERS - prefix customify/orders/
    // 4. WYGENEROWANE - obrazy AI (wynik transformacji)
    // 5. UPLOAD - oryginalne zdjęcia użytkownika (przed transformacją)
    //
    // ROZRÓŻNIENIE UPLOAD vs WYGENEROWANE:
    // - UPLOAD: oryginalne zdjęcia użytkownika (przed transformacją AI)
    //   * Podwójne rozszerzenie .jpg.jpg → upload (błąd w nazwie)
    //   * Zaczyna się od "image-" → upload (domyślna nazwa)
    //   * NIE zawiera słów kluczowych AI → upload
    // - WYGENEROWANE: obrazy wygenerowane przez AI (wynik transformacji)
    //   * Zawiera słowa kluczowe AI (caricature, generation, ai-, boho, king, koty, pixar)
    //   * I NIE ma podwójnego rozszerzenia .jpg.jpg
    //   * I NIE zaczyna się od "image-"
    //
    // SŁOWA KLUCZOWE AI:
    // - caricature, generation, ai-, boho, king, koty, pixar, transform, style
    // ═══════════════════════════════════════════════════════════════════════════
    const categorizeImage = (blob) => {
      const pathname = blob.pathname || blob.path || '';
      const path = pathname.toLowerCase();
      const filename = pathname.split('/').pop().toLowerCase(); // Nazwa pliku bez ścieżki
      const isJson = pathname.toLowerCase().endsWith('.json');
      
      // ────────────────────────────────────────────────────────────────────────
      // 0. UKRYJ pliki wewnętrzne/logi (nie pokazuj w panelu)
      // ────────────────────────────────────────────────────────────────────────
      if (
        path.startsWith('customify/internal/') ||
        (path.startsWith('customify/stats/') && !path.startsWith('customify/system/stats/')) ||
        path.startsWith('customify/temp/admin-stats/')
      ) {
        return null;
      }
      
      // ────────────────────────────────────────────────────────────────────────
      // 1. STATYSTYKI - TYLKO pliki JSON z customify/system/stats/generations/
      // ────────────────────────────────────────────────────────────────────────
      if (isJson && path.startsWith('customify/system/stats/generations/')) {
        return 'statystyki';
      }
      
      // UKRYJ inne pliki JSON (nie statystyki)
      if (isJson) {
        return null;
      }
      
      // ────────────────────────────────────────────────────────────────────────
      // 2. KOSZYKI - zawiera "watermark" w ścieżce LUB nazwie (najwyższy priorytet)
      // ────────────────────────────────────────────────────────────────────────
      if (path.includes('watermark')) {
        return 'koszyki';
      }
      
      // ────────────────────────────────────────────────────────────────────────
      // 3. ORDERS - prefix customify/orders/ (bez watermark)
      // ────────────────────────────────────────────────────────────────────────
      if (path.startsWith('customify/orders/')) {
        return 'orders';
      }
      
      // ────────────────────────────────────────────────────────────────────────
      // 4. WYGENEROWANE vs UPLOAD - obrazy w customify/temp/
      // ────────────────────────────────────────────────────────────────────────
      if (path.startsWith('customify/temp/')) {
        // ═══════════════════════════════════════════════════════════════════════
        // WYGENEROWANE - obrazy AI (wynik transformacji)
        // ═══════════════════════════════════════════════════════════════════════
        // Format: ai-{numer}.jpg.jpg (z podwójnym rozszerzeniem - błąd w nazwie)
        // Format: generation-{numer}.jpg (Replicate, Segmind base64 - WYNIK transformacji)
        // ═══════════════════════════════════════════════════════════════════════
        
        // WYGENEROWANE: Zaczyna się od "ai-" (nawet z podwójnym rozszerzeniem!)
        if (filename.startsWith('ai-')) {
          console.log(`✅ [CATEGORIZE] ${pathname}: Starts with "ai-" → wygenerowane`);
          return 'wygenerowane';
        }
        
        // WYGENEROWANE: Zaczyna się od "generation-" (WYNIK transformacji)
        if (filename.startsWith('generation-')) {
          console.log(`✅ [CATEGORIZE] ${pathname}: AI generation file → wygenerowane`);
          return 'wygenerowane';
        }
        
        // ═══════════════════════════════════════════════════════════════════════
        // UPLOAD - oryginalne zdjęcia użytkownika (przed transformacją)
        // ═══════════════════════════════════════════════════════════════════════
        // Format: image-{numer}.jpg (domyślna nazwa z upload-temp-image.js)
        // Format: caricature-{numer}.jpg (oryginalne zdjęcie przed Segmind caricature)
        // Format: {dowolna-nazwa}.jpg.jpg (podwójne rozszerzenie BEZ prefiksu "ai-")
        // ═══════════════════════════════════════════════════════════════════════
        
        // UPLOAD: Zaczyna się od "image-" (domyślna nazwa z upload-temp-image.js)
        if (filename.startsWith('image-')) {
          console.log(`📤 [CATEGORIZE] ${pathname}: Starts with "image-" → upload`);
          return 'upload';
        }
        
        // UPLOAD: Zaczyna się od "caricature-" (oryginalne zdjęcie przed transformacją Segmind)
        if (filename.startsWith('caricature-')) {
          console.log(`📤 [CATEGORIZE] ${pathname}: Starts with "caricature-" → upload (original image)`);
          return 'upload';
        }
        
        // UPLOAD: Zaczyna się od "watercolor-" (oryginalne zdjęcie przed transformacją Segmind Become-Image)
        if (filename.startsWith('watercolor-')) {
          console.log(`📤 [CATEGORIZE] ${pathname}: Starts with "watercolor-" → upload (original image)`);
          return 'upload';
        }
        
        // UPLOAD: Zawiera "styl-" w nazwie (np. styl-minimalistyczny, styl-realistyczny)
        if (filename.includes('styl-')) {
          console.log(`📤 [CATEGORIZE] ${pathname}: Contains "styl-" → upload (original image)`);
          return 'upload';
        }
        
        // UPLOAD: Podwójne rozszerzenie .jpg.jpg BEZ prefiksu "ai-" (błąd w nazwie uploadu)
        if (filename.includes('.jpg.jpg') && !filename.startsWith('ai-')) {
          console.log(`📤 [CATEGORIZE] ${pathname}: Double extension without "ai-" prefix → upload`);
          return 'upload';
        }
        
        // Fallback → upload (nieznany format = prawdopodobnie oryginalne zdjęcie użytkownika)
        // UWAGA: Jeśli nie ma żadnego z prefiksów AI (ai-, generation-), 
        // to prawdopodobnie jest to oryginalne zdjęcie użytkownika (upload)
        console.log(`📤 [CATEGORIZE] ${pathname}: Unknown format (no AI prefix) → upload (fallback)`);
        return 'upload';
      }
      
      // ────────────────────────────────────────────────────────────────────────
      // 5. WYGENEROWANE - obrazy AI poza temp/ (z prefiksami AI)
      // ────────────────────────────────────────────────────────────────────────
      // Sprawdź czy zaczyna się od prefiksów AI (generation-, ai-)
      // UWAGA: caricature- i watercolor- to UPLOAD (oryginalne zdjęcia przed transformacją), nie wygenerowane!
      if (filename.startsWith('generation-') || filename.startsWith('ai-')) {
        return 'wygenerowane';
      }
      
      // ────────────────────────────────────────────────────────────────────────
      // 6. FALLBACK - wszystko inne → upload (prawdopodobnie oryginalne zdjęcie)
      // ────────────────────────────────────────────────────────────────────────
      // UWAGA: Jeśli nie ma żadnego z prefiksów AI, to prawdopodobnie jest to upload
      // (oryginalne zdjęcie użytkownika przed transformacją)
      return 'upload';
    };

    // Kategoryzuj wszystkie obrazki
    let allCategorizedBlobs = blobs.blobs
      .map(blob => {
        const category = categorizeImage(blob);
        // Debug log dla pierwszych 10 obrazków
        if (blobs.blobs.indexOf(blob) < 10) {
          const pathname = blob.pathname || blob.path || 'unknown';
          console.log(`🔍 [LIST-BLOB-IMAGES] Categorizing: ${pathname} → ${category || 'null (hidden)'}`);
        }
        return {
          ...blob,
          category: category
        };
      })
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
        // Funkcja pomocnicza do bezpiecznego parsowania daty
        const getDate = (blob) => {
          // Najpierw sprawdź uploadedAt
          if (blob.uploadedAt) {
            const date = new Date(blob.uploadedAt);
            if (!isNaN(date.getTime())) {
              return date.getTime();
            }
          }
          // Potem sprawdź createdAt
          if (blob.createdAt) {
            const date = new Date(blob.createdAt);
            if (!isNaN(date.getTime())) {
              return date.getTime();
            }
          }
          // Spróbuj wyciągnąć timestamp z nazwy pliku
          const pathname = blob.pathname || blob.path || '';
          const timestampMatch = pathname.match(/\d{13}/);
          if (timestampMatch) {
            return parseInt(timestampMatch[0]);
          }
          // Fallback - bardzo stara data (będzie na końcu przy sortowaniu desc)
          return 0;
        };
        
        const dateA = getDate(a);
        const dateB = getDate(b);
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

    // Debug: Sprawdź właściwości pierwszego bloba
    if (categorizedBlobs.length > 0) {
      const firstBlob = categorizedBlobs[0];
      console.log(`🔍 [LIST-BLOB-IMAGES] First blob properties:`, {
        pathname: firstBlob.pathname || firstBlob.path,
        uploadedAt: firstBlob.uploadedAt,
        createdAt: firstBlob.createdAt,
        allKeys: Object.keys(firstBlob)
      });
    }
    
    return res.json({
      success: true,
      images: categorizedBlobs.map(blob => {
        const pathname = blob.pathname || blob.path || 'unknown';
        const isJson = pathname.toLowerCase().endsWith('.json');
        
        // Wyciągnij datę z uploadedAt, createdAt lub z timestamp w nazwie pliku
        let uploadedAt = blob.uploadedAt;
        if (!uploadedAt && blob.createdAt) {
          uploadedAt = blob.createdAt;
        }
        if (!uploadedAt) {
          // Spróbuj wyciągnąć timestamp z nazwy pliku (np. caricature-1763312200173.jpg)
          const timestampMatch = pathname.match(/\d{13}/);
          if (timestampMatch) {
            uploadedAt = new Date(parseInt(timestampMatch[0])).toISOString();
          } else {
            uploadedAt = new Date().toISOString(); // Fallback - data teraz
          }
        }
        
        return {
          url: blob.url,
          pathname: pathname,
          size: blob.size || 0,
          uploadedAt: uploadedAt,
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
