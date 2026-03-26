// Lista odpowiedzi z formularza pierwszej ściany (Blob) — panel admin.

const { list } = require('@vercel/blob');

const ADMIN_TOKEN = process.env.ADMIN_STATS_TOKEN;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  if (ADMIN_TOKEN && token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    return res.status(200).json({
      success: true,
      submissions: [],
      note: 'BLOB_READ_WRITE_TOKEN nie skonfigurowany',
    });
  }

  try {
    const { blobs } = await list({
      prefix: 'customify/system/limit-wall-feedback/',
      token: blobToken,
      limit: 250,
    });
    const sorted = (blobs || []).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    const slice = sorted.slice(0, 100);
    const submissions = [];
    for (const b of slice) {
      try {
        const r = await fetch(b.url, { signal: AbortSignal.timeout(10000) });
        if (!r.ok) continue;
        const j = await r.json();
        submissions.push({
          ...j,
          blobPathname: b.pathname || null,
        });
      } catch (_) {
        /* skip broken */
      }
    }
    submissions.sort((a, b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')));
    return res.status(200).json({ success: true, submissions, totalBlobs: blobs?.length || 0 });
  } catch (e) {
    console.error('[LIMIT-WALL-FEEDBACK-LIST]', e);
    return res.status(500).json({ error: e.message });
  }
};
