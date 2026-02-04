// api/cron/cleanup-old-blobs.js
  // Cron: automatyczne czyszczenie Vercel Blob (customify/temp/ + customify/system/stats/generations/) starszych niż 14 dni
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
  // - Crony Vercel nie wysyłają naszego Bearer tokena, więc musimy rozpoznać request crona po nagłówkach.
  // - Dodatkowo zostawiamy fallback: Bearer ADMIN_STATS_TOKEN (ręczne uruchomienie).
  const expectedToken = process.env.ADMIN_STATS_TOKEN;
  const authHeader = req.headers.authorization;
  const vercelCronHeader = req.headers['x-vercel-cron'];
  const userAgent = req.headers['user-agent'] || '';
  const vercelId = req.headers['x-vercel-id'];

  // W praktyce Vercel może ustawiać x-vercel-cron (różne wartości), a zawsze ustawia x-vercel-id.
  // Dla bezpieczeństwa wymagamy: (x-vercel-cron obecny) LUB (User-Agent zawiera "Vercel" i "Cron") oraz x-vercel-id.
  const isProbablyVercelCron =
    (Boolean(vercelCronHeader) && Boolean(vercelId)) ||
    (/vercel/i.test(userAgent) && /cron/i.test(userAgent) && Boolean(vercelId));

  const isAuthorizedByToken = expectedToken && authHeader === `Bearer ${expectedToken}`;

  if (!isProbablyVercelCron && !isAuthorizedByToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.customify_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'Blob token not configured' });
  }

  const DAYS_OLD = 30; // ✅ ZWIĘKSZONO z 14 do 30 dni - więcej czasu na dodanie do koszyka
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
      const listAllFromPrefix = async (prefix) => {
        const blobs = [];
        let nextCursor = undefined;
        let pageCount = 0;
        do {
          pageCount++;
          const result = await list({
            prefix,
            limit: 1000,
            cursor: nextCursor,
            token: process.env.customify_READ_WRITE_TOKEN,
          });
          blobs.push(...result.blobs);
          nextCursor = result.cursor;
          if (pageCount >= 60) break; // max ~60k rekordów / prefix / round
        } while (nextCursor);
        return blobs;
      };

      // 1) Pobierz listę blobów (customify/temp/ + stats JSON)
      // ✅ NIE USUWAJ customify/orders/ - to są trwałe obrazki z zamówień
      const tempBlobs = await listAllFromPrefix('customify/temp/');
      const statsBlobs = await listAllFromPrefix('customify/system/stats/generations/');
      const allBlobs = [...tempBlobs, ...statsBlobs];

      // 2) Wyznacz stare
      const oldBlobs = allBlobs
        .filter((b) => {
          const pathname = b.pathname || '';
          const match = pathname.match(/\d{13}/);
          if (match) {
            return parseInt(match[0], 10) < cutoffDate;
          }
          const blobDate = b.uploadedAt || b.createdAt;
          if (blobDate) {
            return new Date(blobDate).getTime() < cutoffDate;
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

