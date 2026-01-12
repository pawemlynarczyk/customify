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

    // Zwiększ domyślny limit do 5000 żeby pokazać więcej najnowszych obrazków
    const { prefix, limit = 5000, cursor, sortBy = 'date', sortOrder = 'desc', category } = req.query;

    console.log('📊 [LIST-BLOB-IMAGES] Request params:', { prefix, limit, cursor, sortBy, sortOrder, category });

    // ⚠️ KRYTYCZNE: Pobierz WSZYSTKIE bloby bez limitu, żeby sortowanie działało poprawnie
    // Vercel Blob list() zwraca bloby w kolejności alfabetycznej, nie po dacie
    // Musimy pobrać wszystko i posortować po stronie serwera
    const allBlobs = [];
    let nextCursor = cursor || undefined;
    let fetchedCount = 0;
    const maxFetch = 20000; // Trzymamy w pamięci max 20k, ale nie urywamy paginacji (żeby dojść do najnowszych)
    let truncatedToLastN = false;
    
    // Pobieraj wszystkie strony (pagination)
    // ✅ ZAWSZE używaj prefix 'customify/' żeby pobierać tylko nasze pliki
    const effectivePrefix = prefix || 'customify/';
    console.log(`📊 [LIST-BLOB-IMAGES] Using prefix: "${effectivePrefix}"`);
    
    do {
      const blobsBatch = await list({
        prefix: effectivePrefix,
        limit: 1000, // Pobieraj po 1000 na raz
        cursor: nextCursor,
        token: process.env.customify_READ_WRITE_TOKEN
      });
      
      allBlobs.push(...blobsBatch.blobs);
      fetchedCount += blobsBatch.blobs.length;
      nextCursor = blobsBatch.cursor;
      
      console.log(`📊 [LIST-BLOB-IMAGES] Fetched ${fetchedCount} blobs so far, has more: ${!!nextCursor}`);
      
      // Jeśli jest bardzo dużo plików, NIE przerywaj (bo najnowsze są na końcu alfabetycznej listy),
      // tylko utrzymuj bufor ostatnich maxFetch elementów.
      if (allBlobs.length > maxFetch) {
        const toDrop = allBlobs.length - maxFetch;
        allBlobs.splice(0, toDrop);
        truncatedToLastN = true;
        if (fetchedCount >= maxFetch && fetchedCount - blobsBatch.blobs.length < maxFetch) {
          console.warn(`⚠️ [LIST-BLOB-IMAGES] Buffering last ${maxFetch} blobs (repo has more than ${maxFetch}).`);
        }
      }
    } while (nextCursor);
    
    const blobs = { blobs: allBlobs, cursor: nextCursor };

    console.log(`📊 [LIST-BLOB-IMAGES] Found ${blobs.blobs.length} blobs from Vercel Blob API`);
    console.log(`📊 [LIST-BLOB-IMAGES] Has cursor (more pages): ${!!blobs.cursor}`);
    
    // (nie filtrujemy po dacie po stronie API – panel ma mieć pełny widok)
    
    // Debug: sprawdź wszystkie bloby z generation- lub text-overlay- i ich timestampy
    const aiBlobs = blobs.blobs.filter(b => {
      const filename = (b.pathname || '').split('/').pop().toLowerCase();
      return filename.startsWith('generation-') || filename.startsWith('ai-') || filename.startsWith('text-overlay-');
    });
    console.log(`📊 [LIST-BLOB-IMAGES] AI blobs (generation/ai/text-overlay): ${aiBlobs.length}`);
    
    // Debug: sprawdź czy konkretne pliki są w liście
    const testFiles = [
      'text-overlay-1767966781915.jpg',
      'text-overlay-1767962921529.jpg', 
      'generation-1767949280207.jpg'
    ];
    testFiles.forEach(testFile => {
      const found = blobs.blobs.find(b => (b.pathname || '').includes(testFile));
      console.log(`🔍 [LIST-BLOB-IMAGES] Test file "${testFile}": ${found ? 'ZNALEZIONY ✅' : 'NIE ZNALEZIONY ❌'}`);
    });
    
    // Sortuj AI bloby po timestamp z nazwy pliku
    const sortedAiBlobs = aiBlobs.sort((a, b) => {
      const getTs = (blob) => {
        const match = (blob.pathname || '').match(/\d{13}/);
        return match ? parseInt(match[0]) : 0;
      };
      return getTs(b) - getTs(a);
    });
    
    // Pokaż 10 najnowszych AI blobów
    console.log(`📊 [LIST-BLOB-IMAGES] 10 najnowszych AI blobów:`, sortedAiBlobs.slice(0, 10).map(b => {
      const match = (b.pathname || '').match(/\d{13}/);
      return {
        path: b.pathname,
        ts: match ? new Date(parseInt(match[0])).toISOString() : 'brak'
      };
    }));

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
      // 2. WYGENEROWANE (NAJWYŻSZY PRIORYTET!) - pliki z prefiksami AI
      //    Sprawdzane PRZED watermark, bo generation-watermarked-* to też wygenerowane!
      //    Prefiksy: generation-*, ai-*, text-overlay-*
      // ────────────────────────────────────────────────────────────────────────
      if (
        filename.startsWith('generation-') || 
        filename.startsWith('ai-') ||
        filename.startsWith('text-overlay-')
      ) {
        console.log(`✅ [CATEGORIZE] ${pathname}: AI generated file → wygenerowane`);
        return 'wygenerowane';
      }
      
      // ────────────────────────────────────────────────────────────────────────
      // 3. KOSZYKI - zawiera "watermark" w ścieżce (ale nie generation-*)
      // ────────────────────────────────────────────────────────────────────────
      if (path.includes('watermark')) {
        return 'koszyki';
      }
      
      // ────────────────────────────────────────────────────────────────────────
      // 4. ORDERS - prefix customify/orders/
      // ────────────────────────────────────────────────────────────────────────
      if (path.startsWith('customify/orders/')) {
        return 'orders';
      }
      
      // ────────────────────────────────────────────────────────────────────────
      // 5. UPLOAD - oryginalne zdjęcia użytkownika w customify/temp/
      // ────────────────────────────────────────────────────────────────────────
      if (path.startsWith('customify/temp/')) {
        // Wszystko w temp/ co nie jest generation-* lub ai-* to UPLOAD
        // (oryginalne zdjęcia przed transformacją)
        console.log(`📤 [CATEGORIZE] ${pathname}: temp/ file (not AI) → upload`);
        return 'upload';
      }
      
      // ────────────────────────────────────────────────────────────────────────
      // 6. FALLBACK - wszystko inne → upload
      // ────────────────────────────────────────────────────────────────────────
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
    
    // Debug: pokaż 5 najnowszych wygenerowanych (po timestamp z nazwy pliku)
    const wygenerowane = allCategorizedBlobs.filter(b => b.category === 'wygenerowane');
    const sortedByTimestamp = wygenerowane.sort((a, b) => {
      const getTs = (blob) => {
        const match = (blob.pathname || '').match(/\d{13}/);
        return match ? parseInt(match[0]) : 0;
      };
      return getTs(b) - getTs(a);
    });
    console.log(`📊 [LIST-BLOB-IMAGES] Najnowsze 5 wygenerowanych:`, sortedByTimestamp.slice(0, 5).map(b => ({
      pathname: b.pathname,
      timestamp: (() => {
        const match = (b.pathname || '').match(/\d{13}/);
        return match ? new Date(parseInt(match[0])).toISOString() : 'brak';
      })()
    })));

    // ═══════════════════════════════════════════════════════════════════════
    // NORMALIZACJA I MAPOWANIE OBRAZKÓW (z normalizacją daty)
    // ═══════════════════════════════════════════════════════════════════════
    const normalizedBlobs = categorizedBlobs.map(blob => {
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
      
      // Parsuj datę do timestamp dla sortowania
      const uploadedAtTimestamp = new Date(uploadedAt).getTime();
      
      return {
        url: blob.url,
        pathname: pathname,
        size: blob.size || 0,
        uploadedAt: uploadedAt,
        uploadedAtTimestamp: uploadedAtTimestamp, // Dodaj timestamp dla sortowania
        category: blob.category,
        isJson: isJson,
        contentType: blob.contentType || (isJson ? 'application/json' : 'image')
      };
    });

    // ═══════════════════════════════════════════════════════════════════════
    // SORTOWANIE (PO normalizacji daty!)
    // ═══════════════════════════════════════════════════════════════════════
    if (sortBy === 'date') {
      normalizedBlobs.sort((a, b) => {
        const dateA = a.uploadedAtTimestamp || 0;
        const dateB = b.uploadedAtTimestamp || 0;
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    } else if (sortBy === 'name') {
      normalizedBlobs.sort((a, b) => {
        const nameA = (a.pathname || '').toLowerCase();
        const nameB = (b.pathname || '').toLowerCase();
        return sortOrder === 'asc' 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    }

    // Debug: Sprawdź właściwości pierwszego bloba
    if (normalizedBlobs.length > 0) {
      const firstBlob = normalizedBlobs[0];
      console.log(`🔍 [LIST-BLOB-IMAGES] First blob properties:`, {
        pathname: firstBlob.pathname,
        uploadedAt: firstBlob.uploadedAt,
        uploadedAtTimestamp: firstBlob.uploadedAtTimestamp,
        category: firstBlob.category
      });
    }
    
    return res.json({
      success: true,
      images: normalizedBlobs.map(blob => {
        // Usuń uploadedAtTimestamp z odpowiedzi (tylko do sortowania)
        const { uploadedAtTimestamp, ...responseBlob } = blob;
        return responseBlob;
      }),
      cursor: blobs.cursor,
      hasMore: !!blobs.cursor,
      stats: stats,
      filteredCount: categorizedBlobs.length,
      truncated: truncatedToLastN ? true : undefined
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
