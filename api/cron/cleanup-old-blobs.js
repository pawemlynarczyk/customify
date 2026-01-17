// api/cron/cleanup-old-blobs.js
// Cron: automatyczne czyszczenie Vercel Blob (customify/temp/) starszych niż 14 dni
//
// UWAGA: Vercel Blob `list()` zwraca alfabetycznie; nie polegamy na tym, tylko filtrujemy po timestampie w nazwie.
// Usuwanie robimy w batchach, żeby nie wisieć/nie timeoutować.

const { list, del } = require('@vercel/blob');
const { checkRateLimit, getClientIP } = require('../../utils/vercelRateLimiter');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Minimalna ochrona przed przypadkowym spamem z zewnątrz
  try {
    const ip = getClientIP(req);
    if (!checkRateLimit(ip, 10, 15 * 60 * 1000)) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
  } catch (_) {
    // jeśli limiter nie zadziała, nie blokuj crona
  }

  // Autoryzacja:
  // - Preferowane: Vercel Cron header (jeśli Vercel go dodaje)
  // - Fallback: Bearer ADMIN_STATS_TOKEN (ręczne uruchomienie)
  const expectedToken = process.env.ADMIN_STATS_TOKEN;
  const authHeader = req.headers.authorization;
  const vercelCronHeader = req.headers['x-vercel-cron'];

  const isAuthorizedByCronHeader = vercelCronHeader === '1' || vercelCronHeader === 'true';
  const isAuthorizedByToken = expectedToken && authHeader === `Bearer ${expectedToken}`;

  if (!isAuthorizedByCronHeader && !isAuthorizedByToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.customify_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'Blob token not configured' });
  }

  const DAYS_OLD = 14;
  const cutoffDate = Date.now() - DAYS_OLD * 24 * 60 * 60 * 1000;
  const MAX_ROUNDS = 20; // 20 * 300 = max 6000 plików/dzień (bezpiecznie)
  const MAX_DELETE_PER_ROUND = 300; // zgodnie z hard cap w admin cleanup
  const BATCH_SIZE = 25; // równoległość del()

  const startedAt = new Date().toISOString();
  let totalDeleted = 0;
  let totalErrors = 0;

  console.log(`🕒 [CRON-CLEANUP] Start ${startedAt} (cutoff=${new Date(cutoffDate).toISOString()})`);

  try {
    for (let round = 1; round <= MAX_ROUNDS; round++) {
      // 1) Pobierz listę blobów (customify/temp/)
      const allBlobs = [];
      let nextCursor = undefined;
      let pageCount = 0;

      do {
        pageCount++;
        const result = await list({
          prefix: 'customify/temp/',
          limit: 1000,
          cursor: nextCursor,
          token: process.env.customify_READ_WRITE_TOKEN,
        });
        allBlobs.push(...result.blobs);
        nextCursor = result.cursor;

        // Bezpieczeństwo: nie skanuj nieskończoność w jednym roundzie
        if (pageCount >= 60) break; // max ~60k rekordów
      } while (nextCursor);

      // 2) Wyznacz stare
      const oldBlobs = allBlobs
        .filter((b) => {
          const pathname = b.pathname || '';
          const match = pathname.match(/\d{13}/);
          if (match) {
            return parseInt(match[0], 10) < cutoffDate;
          }
          if (b.uploadedAt) {
            return new Date(b.uploadedAt).getTime() < cutoffDate;
          }
          return false;
        })
        .sort((a, b) => {
          const getTs = (blob) => {
            const m = (blob.pathname || '').match(/\d{13}/);
            return m ? parseInt(m[0], 10) : 0;
          };
          return getTs(a) - getTs(b);
        })
        .slice(0, MAX_DELETE_PER_ROUND);

      if (oldBlobs.length === 0) {
        console.log(`✅ [CRON-CLEANUP] Round ${round}: nothing to delete`);
        break;
      }

      console.log(`🧹 [CRON-CLEANUP] Round ${round}: deleting ${oldBlobs.length} old blobs`);

      // 3) Kasuj batchami
      let deletedThisRound = 0;
      let errorsThisRound = 0;

      for (let i = 0; i < oldBlobs.length; i += BATCH_SIZE) {
        const batch = oldBlobs.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map((blob) => del(blob.url, { token: process.env.customify_READ_WRITE_TOKEN }))
        );
        results.forEach((r) => {
          if (r.status === 'fulfilled') deletedThisRound++;
          else errorsThisRound++;
        });
      }

      totalDeleted += deletedThisRound;
      totalErrors += errorsThisRound;

      console.log(
        `🧹 [CRON-CLEANUP] Round ${round} done: deleted=${deletedThisRound}, errors=${errorsThisRound}, totalDeleted=${totalDeleted}`
      );

      // Krótka przerwa między rundami
      await new Promise((r) => setTimeout(r, 500));
    }

    return res.json({
      success: true,
      message: `Cron cleanup finished (>${DAYS_OLD} days)`,
      daysOld: DAYS_OLD,
      cutoff: new Date(cutoffDate).toISOString(),
      deleted: totalDeleted,
      errors: totalErrors,
      startedAt,
      finishedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [CRON-CLEANUP] Error:', error);
    return res.status(500).json({
      error: 'Cron cleanup failed',
      details: error.message,
    });
  }
};

