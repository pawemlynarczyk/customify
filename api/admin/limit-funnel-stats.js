// api/admin/limit-funnel-stats.js
// Agregaty lejka limitu (KV) – do panelu admin.

const { kv } = require('@vercel/kv');
const { isKVConfigured } = require('../../utils/vercelKVLimiter');

const ADMIN_TOKEN = process.env.ADMIN_STATS_TOKEN;

function lastNDays(n) {
  const out = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const x = new Date(d);
    x.setDate(x.getDate() - i);
    out.push(x.toISOString().slice(0, 10));
  }
  return out;
}

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

  if (!isKVConfigured()) {
    return res.status(200).json({
      success: true,
      kv: false,
      totals: { limitShown: 0, returnedAfterLimit: 0, purchaseAfterLimit: 0 },
      rates: { returnPct: null, purchasePct: null }
    });
  }

  try {
    const [shown, returned, purchase] = await Promise.all([
      kv.get('lf:stats:all:limit_shown'),
      kv.get('lf:stats:all:returned_after_limit'),
      kv.get('lf:stats:all:purchase_after_limit')
    ]);

    const limitShown = parseInt(shown || '0', 10) || 0;
    const returnedAfterLimit = parseInt(returned || '0', 10) || 0;
    const purchaseAfterLimit = parseInt(purchase || '0', 10) || 0;

    const returnPct = limitShown > 0 ? Math.round((returnedAfterLimit / limitShown) * 1000) / 10 : null;
    const purchasePct = limitShown > 0 ? Math.round((purchaseAfterLimit / limitShown) * 1000) / 10 : null;
    const purchaseOfReturnedPct = returnedAfterLimit > 0
      ? Math.round((purchaseAfterLimit / returnedAfterLimit) * 1000) / 10
      : null;

    const days = lastNDays(14);
    const daily = [];
    for (const day of days) {
      const [sh, ret, pur] = await Promise.all([
        kv.get(`lf:stats:day:${day}:limit_shown`),
        kv.get(`lf:stats:day:${day}:returned_after_limit`),
        kv.get(`lf:stats:day:${day}:purchase_after_limit`)
      ]);
      daily.push({
        date: day,
        limitShown: parseInt(sh || '0', 10) || 0,
        returnedAfterLimit: parseInt(ret || '0', 10) || 0,
        purchaseAfterLimit: parseInt(pur || '0', 10) || 0
      });
    }

    return res.status(200).json({
      success: true,
      kv: true,
      totals: {
        limitShown,
        returnedAfterLimit,
        purchaseAfterLimit
      },
      rates: {
        returnPct,
        purchasePct,
        purchaseOfReturnedPct,
        neverReturnedPct: limitShown > 0
          ? Math.round(((limitShown - returnedAfterLimit) / limitShown) * 1000) / 10
          : null
      },
      daily: daily.reverse(),
      note: 'limitShown = ile razy pokazano komunikat (eventy). returned = unikalni użytkownicy z powrotem w 14 dni po komunikacie. Zakup = unikalne po komunikacie (30 dni).'
    });
  } catch (e) {
    console.error('[LIMIT-FUNNEL-STATS]', e);
    return res.status(500).json({ error: e.message });
  }
};
