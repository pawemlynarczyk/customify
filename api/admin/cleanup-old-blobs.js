// api/admin/cleanup-old-blobs.js
// Bezpieczne usuwanie starych plików z Vercel Blob Storage

const { list, del } = require('@vercel/blob');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Autoryzacja
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.ADMIN_STATS_TOKEN;
    if (!expectedToken) {
      return res.status(500).json({
        error: 'Admin token not configured'
      });
    }
    if (authHeader !== `Bearer ${expectedToken}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Parametry
    const { daysOld = 30, dryRun = true, maxDelete = 1000 } = req.query;
    const daysOldNum = parseInt(daysOld);
    const requestedMaxDeleteNum = parseInt(maxDelete);
    const isDryRun = dryRun === 'true' || dryRun === true;

    // Hard cap żeby request nie wisiał na Vercel (kasuj w turach)
    const HARD_MAX_DELETE = 300;
    const maxDeleteNum = Number.isFinite(requestedMaxDeleteNum)
      ? Math.min(Math.max(requestedMaxDeleteNum, 1), HARD_MAX_DELETE)
      : Math.min(1000, HARD_MAX_DELETE);
    
    const cutoffDate = Date.now() - (daysOldNum * 24 * 60 * 60 * 1000);
    
    console.log(`🧹 [CLEANUP] Starting cleanup...`);
    console.log(`🧹 [CLEANUP] Delete files older than: ${daysOldNum} days (${new Date(cutoffDate).toISOString()})`);
    console.log(`🧹 [CLEANUP] Dry run: ${isDryRun}`);
    console.log(`🧹 [CLEANUP] Max delete requested: ${requestedMaxDeleteNum}, effective: ${maxDeleteNum} (hard cap)`);

    // Pobierz wszystkie bloby
    const allBlobs = [];
    let nextCursor = undefined;
    let pageCount = 0;
    
    do {
      pageCount++;
      const result = await list({
        prefix: 'customify/temp/',
        limit: 1000,
        cursor: nextCursor,
        token: process.env.customify_READ_WRITE_TOKEN
      });
      
      allBlobs.push(...result.blobs);
      nextCursor = result.cursor;
      
      // Limit bezpieczeństwa
      if (allBlobs.length >= 50000) break;
    } while (nextCursor && pageCount < 100);
    
    console.log(`🧹 [CLEANUP] Found ${allBlobs.length} blobs in customify/temp/`);

    // Znajdź stare pliki (po timestamp w nazwie lub uploadedAt)
    const oldBlobs = allBlobs.filter(b => {
      const pathname = b.pathname || '';
      const timestampMatch = pathname.match(/\d{13}/);
      
      if (timestampMatch) {
        const fileTimestamp = parseInt(timestampMatch[0]);
        return fileTimestamp < cutoffDate;
      }
      
      if (b.uploadedAt) {
        return new Date(b.uploadedAt).getTime() < cutoffDate;
      }
      
      return false;
    });
    
    console.log(`🧹 [CLEANUP] Old blobs (older than ${daysOldNum} days): ${oldBlobs.length}`);

    // Sortuj od najstarszych
    oldBlobs.sort((a, b) => {
      const getTs = (blob) => {
        const match = (blob.pathname || '').match(/\d{13}/);
        return match ? parseInt(match[0]) : 0;
      };
      return getTs(a) - getTs(b);
    });

    // Ogranicz do maxDelete
    const toDelete = oldBlobs.slice(0, maxDeleteNum);
    
    console.log(`🧹 [CLEANUP] Will delete: ${toDelete.length} blobs`);

    if (isDryRun) {
      // Dry run - tylko pokaż co zostanie usunięte
      return res.json({
        success: true,
        dryRun: true,
        message: `DRY RUN: Would delete ${toDelete.length} files older than ${daysOldNum} days`,
        stats: {
          totalBlobs: allBlobs.length,
          oldBlobs: oldBlobs.length,
          toDelete: toDelete.length,
          cutoffDate: new Date(cutoffDate).toISOString()
        },
        sampleToDelete: toDelete.slice(0, 10).map(b => ({
          pathname: b.pathname,
          timestamp: (() => {
            const match = (b.pathname || '').match(/\d{13}/);
            return match ? new Date(parseInt(match[0])).toISOString() : 'unknown';
          })()
        })),
        instruction: `Aby usunąć, wywołuj w turach (hard cap ${HARD_MAX_DELETE}): /api/admin/cleanup-old-blobs?daysOld=${daysOldNum}&dryRun=false&maxDelete=${HARD_MAX_DELETE}`
      });
    }

    // FAKTYCZNE USUWANIE
    let deletedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Kasowanie w małych batchach z ograniczoną równoległością
    const BATCH_SIZE = 25;
    for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
      const batch = toDelete.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(blob => del(blob.url, { token: process.env.customify_READ_WRITE_TOKEN }))
      );
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled') {
          deletedCount++;
        } else {
          errorCount++;
          if (errors.length < 5) {
            errors.push({
              pathname: batch[idx]?.pathname,
              error: r.reason?.message || String(r.reason)
            });
          }
        }
      });
      if (deletedCount > 0 && deletedCount % 100 === 0) {
        console.log(`🧹 [CLEANUP] Deleted ${deletedCount}/${toDelete.length}...`);
      }
    }

    console.log(`🧹 [CLEANUP] Done! Deleted: ${deletedCount}, Errors: ${errorCount}`);

    return res.json({
      success: true,
      dryRun: false,
      message: `Deleted ${deletedCount} files older than ${daysOldNum} days`,
      stats: {
        totalBlobs: allBlobs.length,
        oldBlobs: oldBlobs.length,
        deleted: deletedCount,
        errors: errorCount,
        remaining: allBlobs.length - deletedCount
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ [CLEANUP] Error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
};

