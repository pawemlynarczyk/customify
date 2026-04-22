// api/admin/list-blob-images.js
/**
 * API endpoint do listowania obrazków z Vercel Blob Storage
 * Kategoryzacja: temp, orders, watermarked, original
 */

const { list } = require('@vercel/blob');
const { checkRateLimit, getClientIP } = require('../../utils/vercelRateLimiter');

/**
 * Buduje mapę imageUrl → productType z plików JSON w customify/system/stats/generations/
 * jsonBlobs powinny być posortowane po dacie (najnowsze pierwsze).
 * Ograniczenie do 80 plików + batching - zapobiega 504 timeout (800 równoległych fetchów = timeout).
 */
async function buildProductTypeMap(jsonBlobs) {
  const urlToProductType = {};
  const pathnameToProductType = {};
  const urlToUser = {};
  const pathnameToUser = {};
  const MAX_JSON_FETCH = 250;
  const BATCH_SIZE = 25;
  const toFetch = jsonBlobs.slice(0, MAX_JSON_FETCH);

  for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
    const batch = toFetch.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (blob) => {
      try {
        const resp = await fetch(blob.url, { signal: AbortSignal.timeout(3000) });
        if (!resp.ok) return;
        const data = await resp.json();
        // Dane użytkownika z pliku JSON (customerId, email)
        // Fallback: jeśli top-level puste, spróbuj wyciągnąć customerId z nazwy pliku: customer-123.json
        const customerIdFromPath = (() => {
          const path = blob.pathname || '';
          const match = path.match(/\/customer-([0-9]+)\.json$/i);
          return match ? match[1] : null;
        })();
        const fileEmail = data?.email || null;
        const fileCustomerId = data?.customerId || customerIdFromPath || null;
        const generations = data?.generations || [];
        for (const gen of generations) {
          const urls = [gen.imageUrl, gen.watermarkedImageUrl].filter(Boolean);
          const pt = gen.productType || gen.style || 'other';
          for (const url of urls) {
            if (pt) {
              urlToProductType[url] = pt;
            }
            // Zapisz dane użytkownika dla każdego URL z tej generacji
            if (fileEmail || fileCustomerId) {
              urlToUser[url] = { email: fileEmail, customerId: fileCustomerId };
            }
            try {
              const pathFromUrl = new URL(url).pathname.replace(/^\//, '');
              if (pathFromUrl) {
                if (pt) {
                  pathnameToProductType[pathFromUrl] = pt;
                  const fn = pathFromUrl.split('/').pop();
                  if (fn) pathnameToProductType[fn] = pt;
                  const pathWithoutPrefix = pathFromUrl.replace(/^customify\/?/, '');
                  if (pathWithoutPrefix) pathnameToProductType[pathWithoutPrefix] = pt;
                }
                if (fileEmail || fileCustomerId) {
                  const userEntry = { email: fileEmail, customerId: fileCustomerId };
                  pathnameToUser[pathFromUrl] = userEntry;
                  const fn = pathFromUrl.split('/').pop();
                  if (fn) pathnameToUser[fn] = userEntry;
                  const pathWithoutPrefix = pathFromUrl.replace(/^customify\/?/, '');
                  if (pathWithoutPrefix) pathnameToUser[pathWithoutPrefix] = userEntry;
                }
              }
            } catch (_) {}
          }
        }
      } catch (e) {
        // Cicho ignoruj błędy fetch
      }
    }));
  }

  console.log(`📊 [LIST-BLOB-IMAGES] productType map: ${Object.keys(urlToProductType).length} URLs, ${Object.keys(pathnameToProductType).length} pathnames (z ${toFetch.length} plików JSON)`);
  console.log(`📊 [LIST-BLOB-IMAGES] user map: ${Object.keys(urlToUser).length} URLs z danymi użytkownika`);
  return { urlToProductType, pathnameToProductType, urlToUser, pathnameToUser };
}

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

    const { prefix, limit = 3000, cursor, sortBy = 'date', sortOrder = 'desc', category, dateFrom, dateTo } = req.query;

    console.log('📊 [LIST-BLOB-IMAGES] Request params:', { prefix, limit, cursor, sortBy, sortOrder, category, dateFrom, dateTo });

    // ═══════════════════════════════════════════════════════════════════════
    // FILTR DAT PO STRONIE SERWERA
    // ═══════════════════════════════════════════════════════════════════════
    // Vercel Blob list() paginuje ALFABETYCZNIE po pathname, NIE po dacie.
    // Aby panel z filtrem "dzisiaj"/"ostatnie 2 dni" szybko dał sensowne wyniki
    // bez potrzeby ręcznego scrollowania w dół przez usera, paginujemy przez
    // Blob API i akumulujemy TYLKO blobs w zakresie dat, aż uzbieramy TARGET_IN_RANGE
    // ALBO upłynie TIME_BUDGET_MS (żeby uniknąć 504), ALBO skończy się cursor.
    // ═══════════════════════════════════════════════════════════════════════
    let dateFromMs = null;
    let dateToMs = null;
    // Parsujemy jako UTC i dodajemy ±24h bufor (user filtruje w lokalnej strefie,
    // serwer Vercel w UTC - precyzyjny filtr i tak robi frontend w filterByDate()).
    const TZ_BUFFER_MS = 24 * 3600 * 1000;
    if (dateFrom) {
      const d = new Date(dateFrom + 'T00:00:00Z');
      if (!isNaN(d.getTime())) dateFromMs = d.getTime() - TZ_BUFFER_MS;
    }
    if (dateTo) {
      const d = new Date(dateTo + 'T23:59:59.999Z');
      if (!isNaN(d.getTime())) dateToMs = d.getTime() + TZ_BUFFER_MS;
    }
    const hasDateFilter = dateFromMs !== null || dateToMs !== null;

    // Helper: czy blob mieści się w zakresie dat (na podstawie uploadedAt / timestamp w nazwie)
    const blobInDateRange = (blob) => {
      if (!hasDateFilter) return true;
      let uploadedAt = blob.uploadedAt || blob.createdAt;
      if (!uploadedAt) {
        const m = (blob.pathname || '').match(/\d{13}/);
        if (m) uploadedAt = new Date(parseInt(m[0])).toISOString();
      }
      if (!uploadedAt) return false; // bez daty – odrzucamy gdy jest filtr
      const t = new Date(uploadedAt).getTime();
      if (isNaN(t)) return false;
      if (dateFromMs !== null && t < dateFromMs) return false;
      if (dateToMs !== null && t > dateToMs) return false;
      return true;
    };

    // Budżety: z filtrem dat MUSIMY zeskanować wszystkie prefiksy alfabetyczne
    // (Vercel Blob paginuje po pathname, więc najnowsze pliki mogą być w
    // alfabetycznie późnych prefiksach jak text-overlay-*, wedding-*).
    // Stopujemy DOPIERO gdy skończy się cursor albo upłynie budżet czasu -
    // dzięki temu sortowanie po uploadedAt DESC faktycznie pokaże najnowsze.
    const BLOBS_PER_PAGE = 1000;
    const MAX_PAGES_PER_REQUEST = hasDateFilter ? 150 : 12;
    const TIME_BUDGET_MS = hasDateFilter ? 25000 : 15000; // <30s Vercel Pro
    const maxBlobsThisRequest = Math.min(parseInt(limit, 10) || 3000, MAX_PAGES_PER_REQUEST * BLOBS_PER_PAGE);

    const allBlobs = [];
    let inRangeCount = 0;
    let scannedTotal = 0;
    let nextCursor = cursor || undefined;
    let pageCount = 0;
    let truncatedToLastN = false;
    const startTs = Date.now();

    const effectivePrefix = prefix || 'customify/temp/';
    console.log(`📊 [LIST-BLOB-IMAGES] Using prefix: "${effectivePrefix}", dateFilter: ${hasDateFilter ? `${dateFrom || '-∞'} → ${dateTo || '+∞'}` : 'none'}, maxPages: ${MAX_PAGES_PER_REQUEST}, budget: ${TIME_BUDGET_MS}ms`);

    do {
      // Stop po budżecie czasu (anti-504/timeout)
      if (Date.now() - startTs > TIME_BUDGET_MS) {
        console.log(`⏱️ [LIST-BLOB-IMAGES] Time budget ${TIME_BUDGET_MS}ms exceeded, stopping at page ${pageCount} (inRange: ${inRangeCount}, scanned: ${scannedTotal})`);
        break;
      }
      // Bez filtra dat - ograniczenie rozmiaru odpowiedzi
      if (!hasDateFilter && allBlobs.length >= maxBlobsThisRequest) {
        console.log(`📊 [LIST-BLOB-IMAGES] Reached limit ${maxBlobsThisRequest}, stopping pagination (anti-504)`);
        break;
      }
      // Z filtrem dat NIE przerywamy po liczbie znalezionych - musimy zeskanować
      // wszystkie prefiksy alfabetyczne, bo najnowsze pliki mogą być w późnych
      // (np. text-overlay-*, wedding-*). Przerywamy tylko po budżecie czasu lub
      // gdy skończy się cursor Vercel Blob.

      const blobsBatch = await list({
        prefix: effectivePrefix,
        limit: BLOBS_PER_PAGE,
        cursor: nextCursor,
        token: process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN
      });

      scannedTotal += blobsBatch.blobs.length;

      if (hasDateFilter) {
        // Akumuluj tylko te w zakresie dat
        for (const b of blobsBatch.blobs) {
          if (blobInDateRange(b)) {
            allBlobs.push(b);
            inRangeCount++;
          }
        }
      } else {
        allBlobs.push(...blobsBatch.blobs);
      }
      pageCount++;
      nextCursor = blobsBatch.cursor;

      console.log(`📊 [LIST-BLOB-IMAGES] Page ${pageCount}: scanned +${blobsBatch.blobs.length} (total scanned ${scannedTotal}), in-range ${inRangeCount}, hasMore: ${!!nextCursor}`);

      if (!hasDateFilter && allBlobs.length > maxBlobsThisRequest) {
        const toDrop = allBlobs.length - maxBlobsThisRequest;
        allBlobs.splice(0, toDrop);
        truncatedToLastN = true;
      }
    } while (nextCursor && pageCount < MAX_PAGES_PER_REQUEST);
    
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

    // Lookup productType + danych użytkownika z plików JSON (customify/system/stats/generations/)
    // WAŻNE: Osobny list call - pliki JSON są pod innym prefixem niż obrazy (customify/temp/)
    // dlatego nie ma ich w blobs.blobs i trzeba je pobrać oddzielnie (1 szybki call, tylko metadane)
    let jsonBlobsSorted = [];
    try {
      const statsToken = process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
      const maxStatsPages = 4;
      const statsPerPage = 500;
      const allStatsBlobs = [];
      let statsCursor = undefined;
      let statsPage = 0;

      do {
        const statsListResult = await list({
          prefix: 'customify/system/stats/generations/',
          limit: statsPerPage,
          cursor: statsCursor,
          token: statsToken
        });
        allStatsBlobs.push(...(statsListResult.blobs || []));
        statsCursor = statsListResult.cursor;
        statsPage++;
      } while (statsCursor && statsPage < maxStatsPages);

      jsonBlobsSorted = allStatsBlobs
        .filter(b => (b.pathname || '').toLowerCase().endsWith('.json'))
        .sort((a, b) => {
          const at = (a.uploadedAt && new Date(a.uploadedAt).getTime()) || 0;
          const bt = (b.uploadedAt && new Date(b.uploadedAt).getTime()) || 0;
          return bt - at;
        });
      console.log(`📊 [LIST-BLOB-IMAGES] Stats JSON files found: ${jsonBlobsSorted.length}`);
    } catch (statsListErr) {
      console.warn(`⚠️ [LIST-BLOB-IMAGES] Nie udało się pobrać stats JSON files:`, statsListErr.message);
    }
    const { urlToProductType, pathnameToProductType, urlToUser, pathnameToUser } = await buildProductTypeMap(jsonBlobsSorted);

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
    // Mapowanie prefiksu nazwy pliku (upload) → czytelna etykieta stylu
    const uploadPrefixToLabel = {
      'caricature-': 'Karykatura',
      'watercolor-': 'Akwarela',
      'anime-': 'Anime',
      'bg-remove-': 'Bg remove',
      'royal-love-': 'Royal Love',
      'gta-': 'GTA',
      'minimalistyczny-': 'Boho (min.)',
      'realistyczny-': 'Boho (real.)',
      'van-gogh-': 'Van Gogh',
      'pixar-': 'Pixar'
    };
    const normalizedBlobs = categorizedBlobs.map(blob => {
      const pathname = blob.pathname || blob.path || 'unknown';
      const isJson = pathname.toLowerCase().endsWith('.json');
      const filenameOnly = pathname.split('/').pop() || '';
      
      // productType + dane użytkownika dla wygenerowanych - lookup z JSON
      let productType = null;
      let uploadType = null; // dla kategorii "upload" - który styl zapisał oryginał
      let userEmail = null;
      let userId = null;
      if (blob.category === 'wygenerowane') {
        const pathWithoutPrefix = pathname.replace(/^customify\/?/, '');
        productType = urlToProductType[blob.url] 
          || pathnameToProductType[pathname] 
          || (pathWithoutPrefix ? pathnameToProductType[pathWithoutPrefix] : null)
          || (filenameOnly ? pathnameToProductType[filenameOnly] : null) 
          || null;
        // Lookup użytkownika (email, customerId) - bez dodatkowych requestów
        const userInfo = urlToUser[blob.url]
          || pathnameToUser[pathname]
          || (pathWithoutPrefix ? pathnameToUser[pathWithoutPrefix] : null)
          || (filenameOnly ? pathnameToUser[filenameOnly] : null)
          || null;
        if (userInfo) {
          userEmail = userInfo.email || null;
          userId = userInfo.customerId ? String(userInfo.customerId) : null;
        }
      } else if (blob.category === 'upload') {
        const fn = filenameOnly.toLowerCase();
        for (const [prefix, label] of Object.entries(uploadPrefixToLabel)) {
          if (fn.startsWith(prefix)) {
            uploadType = label;
            break;
          }
        }
        // Nano-banana single-image: nazwa to np. "gta-123.jpg", "zamkowy-123.jpg" - etykieta z pierwszego segmentu
        if (!uploadType && /^[a-z0-9_-]+-\d+\.(jpg|jpeg|png|webp)$/i.test(fn)) {
          const prefix = fn.replace(/-\d+\.(jpg|jpeg|png|webp)$/i, '');
          uploadType = uploadPrefixToLabel[prefix + '-'] || (prefix.charAt(0).toUpperCase() + prefix.slice(1));
        }
        if (!uploadType) uploadType = 'Inny upload';
      }
      
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
        productType: productType, // karykatura, king, cats, phone, boho, etc.
        uploadType: uploadType, // dla upload: Karykatura, Akwarela, GTA, itd.
        userEmail: userEmail, // email użytkownika (tylko dla wygenerowanych, tylko zalogowani)
        userId: userId, // Shopify customerId (tylko dla wygenerowanych, tylko zalogowani)
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
