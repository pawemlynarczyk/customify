// api/email-click.js
// Tracking kliknięć z maili – loguje kliknięcie w KV, robi redirect na docelowy URL

const { kv } = require('@vercel/kv');

const VALID_TYPES = new Set(['generation', 'credits', 'reminder_3d', 'reminder_7d', 'reminder_14d']);
const KV_TTL_30D = 30 * 24 * 3600;

module.exports = async (req, res) => {
  const { type, cid, url } = req.query;

  const redirectUrl = (url && url.startsWith('https://')) ? url : 'https://lumly.pl/pages/my-generations';

  if (type && VALID_TYPES.has(type)) {
    try {
      await kv.incr(`email-stats:${type}:clicks`);

      // Zapisz ostatnie kliknięcie dla atrybucji zakupów (per customerId)
      if (cid) {
        await kv.set(
          `email-click:${cid}`,
          JSON.stringify({ type, clickedAt: new Date().toISOString() }),
          { ex: KV_TTL_30D }
        );
      }
    } catch (err) {
      console.warn('[EMAIL-CLICK] KV error (non-fatal):', err.message);
    }
  }

  res.setHeader('Location', redirectUrl);
  return res.status(302).end();
};
