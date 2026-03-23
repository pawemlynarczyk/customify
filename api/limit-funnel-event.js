// api/limit-funnel-event.js
// Zdarzenia lejka „komunikat limitu” → KV (agregacja do panelu admin).

const { kv } = require('@vercel/kv');
const { checkRateLimit, getClientIP } = require('../utils/vercelRateLimiter');
const { isKVConfigured } = require('../utils/vercelKVLimiter');

const ALLOWED_ORIGINS = [
  'https://lumly.pl',
  'https://customify-s56o.vercel.app',
  'http://localhost:3000'
];

const WINDOW_RETURN_MS = 14 * 24 * 60 * 60 * 1000;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = getClientIP(req);
  if (!checkRateLimit(ip, 120, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  if (!isKVConfigured()) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  try {
    const body = req.body || {};
    const { event, customerId, messageVariant, wallTier, productHandle, source } = body;
    const cid = customerId ? String(customerId).trim() : null;
    const day = todayStr();

    if (event === 'limit_message_shown' && cid) {
      await kv.incr(`lf:stats:all:limit_shown`);
      await kv.incr(`lf:stats:day:${day}:limit_shown`);
      await kv.set(
        `lf:user:last_limit:${cid}`,
        JSON.stringify({
          ts: Date.now(),
          messageVariant: messageVariant || 'default',
          wallTier: wallTier || 'unknown',
          productHandle: productHandle || null,
          source: source || 'frontend'
        }),
        { ex: 60 * 60 * 24 * 45 }
      );
      return res.status(200).json({ ok: true });
    }

    if (event === 'generation_success' && cid) {
      const raw = await kv.get(`lf:user:last_limit:${cid}`);
      if (!raw) return res.status(200).json({ ok: true, note: 'no_prior_limit' });
      let data;
      try {
        data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch {
        return res.status(200).json({ ok: true });
      }
      if (!data.ts || Date.now() - data.ts > WINDOW_RETURN_MS) {
        return res.status(200).json({ ok: true, note: 'outside_window' });
      }
      const already = await kv.get(`lf:counted_return:${cid}`);
      if (already) return res.status(200).json({ ok: true, note: 'already_counted' });
      await kv.set(`lf:counted_return:${cid}`, '1', { ex: 60 * 60 * 24 * 60 });
      await kv.incr(`lf:stats:all:returned_after_limit`);
      await kv.incr(`lf:stats:day:${day}:returned_after_limit`);
      return res.status(200).json({ ok: true, counted: true });
    }

    return res.status(400).json({ error: 'Unknown event or missing customerId' });
  } catch (e) {
    console.error('[LIMIT-FUNNEL-EVENT]', e);
    return res.status(500).json({ error: 'Internal error' });
  }
};
