/**
 * Pierwsza „ściana” limitu (brak credits-refilled): formularz → zapis + doładowanie + mail.
 * Kolejne ściany: endpoint zwraca 403 — UI pokazuje tylko komunikat (bez formularza).
 */

const { put } = require('@vercel/blob');
const { kv } = require('@vercel/kv');
const { Resend } = require('resend');
const { checkRateLimit, getClientIP } = require('../utils/vercelRateLimiter');
const { isKVConfigured } = require('../utils/vercelKVLimiter');
const {
  updateUsageToZero,
  getUsageData,
  sendCreditEmail,
} = require('./check-and-reset-limits');

const BLOCKED_EMAILS = new Set(['angelika.pacewicz@gmail.com']);

function isBlockedUser(email) {
  return email && BLOCKED_EMAILS.has(email.toLowerCase());
}

function parseTotalUsage(customer) {
  try {
    const raw = customer?.metafield?.value || '{}';
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return Number(parsed.total || 0);
  } catch (_) {
    /* fallthrough */
  }
  const rawValue = customer?.metafield?.value || '0';
  const n = parseInt(rawValue, 10);
  return Number.isNaN(n) ? 0 : n;
}

function trimField(v, max = 2000) {
  if (v == null) return '';
  const t = String(v).trim();
  return t.length > max ? t.slice(0, max) : t;
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = async (req, res) => {
  const allowedOrigins = ['https://lumly.pl', 'https://customify-s56o.vercel.app', 'http://localhost:3000'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = getClientIP(req);
  if (!checkRateLimit(ip, 15, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Rate limit exceeded', message: 'Zbyt wiele prób. Spróbuj za chwilę.' });
  }

  try {
    const { customerId, fixImage, giftSearch, productUrl } = req.body || {};
    if (!customerId) {
      return res.status(400).json({ error: 'Missing customerId' });
    }

    const fixImageText = trimField(fixImage, 2000);
    const giftSearchText = trimField(giftSearch, 2000);
    if (fixImageText.length < 10) {
      return res.status(400).json({
        error: 'Validation',
        message: 'Opisz proszę krótko, co poprawić (min. 10 znaków).',
      });
    }

    const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(500).json({ error: 'Shopify not configured' });
    }

    const customer = await getUsageData(shopDomain, accessToken, customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const email = customer.email || null;
    if (isBlockedUser(email)) {
      return res.status(403).json({ error: 'blocked', message: 'Operacja niedostępna.' });
    }

    const totalUsed = parseTotalUsage(customer);
    const totalLimit = 4;
    if (totalUsed < totalLimit) {
      return res.status(400).json({
        error: 'not_at_limit',
        message: 'Masz jeszcze dostępne generacje — formularz nie jest potrzebny.',
      });
    }

    if (isKVConfigured()) {
      const alreadyRefilled = await kv.get(`credits-refilled:${customerId}`);
      if (alreadyRefilled) {
        return res.status(403).json({
          error: 'not_first_wall',
          message:
            'Doładowanie z formularza przysługuje tylko przy pierwszym skończeniu limitu. Następnym razem — informacja mailem.',
        });
      }
    }

    const metafieldId = customer?.metafield?.id || null;
    const currentType = customer?.metafield?.type || 'json';

    const payload = {
      submittedAt: new Date().toISOString(),
      customerId: String(customerId),
      customerEmail: email,
      fixImage: fixImageText,
      giftSearch: giftSearchText || null,
      productUrl: trimField(productUrl || '', 800) || null,
      source: 'limit_wall_feedback',
    };

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const safeId = String(customerId).replace(/[^a-zA-Z0-9_-]/g, '');
        const fname = `customify/system/limit-wall-feedback/${Date.now()}-${safeId}.json`;
        await put(fname, JSON.stringify(payload, null, 2), {
          access: 'public',
          contentType: 'application/json',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
      } catch (blobErr) {
        console.warn('⚠️ [LIMIT-WALL-FEEDBACK] Blob:', blobErr?.message);
      }
    }

    const notifyTo = process.env.LIMIT_EXTENSION_NOTIFY_EMAIL || 'biuro@lumly.pl';
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;line-height:1.5;color:#333;">
  <h2>Ściana limitu — feedback (pierwsza)</h2>
  <p><strong>Customer ID:</strong> ${escapeHtml(payload.customerId)}</p>
  <p><strong>Email:</strong> ${escapeHtml(email || '—')}</p>
  ${payload.productUrl ? `<p><strong>Strona:</strong> ${escapeHtml(payload.productUrl)}</p>` : ''}
  <p><strong>Co poprawić w obrazku:</strong></p>
  <p style="white-space:pre-wrap;">${escapeHtml(fixImageText)}</p>
  <p><strong>Prezentu którego szukasz (jeśli brak):</strong></p>
  <p style="white-space:pre-wrap;">${escapeHtml(giftSearchText || '—')}</p>
</body></html>`;
      const emailPayload = {
        from: 'Lumly <noreply@notification.lumly.pl>',
        to: notifyTo,
        subject: `[Lumly] Feedback ściana – ${email || payload.customerId}`,
        html,
      };
      if (email) emailPayload.replyTo = email;
      await resend.emails.send(emailPayload).catch((e) => console.warn('⚠️ [LIMIT-WALL-FEEDBACK] Admin mail:', e?.message));
    }

    await updateUsageToZero(shopDomain, accessToken, customerId, metafieldId, currentType);

    if (isKVConfigured()) {
      try {
        await kv.set(`credits-refilled:${customerId}`, '1');
        await kv.set(
          `credits-refilled-meta:${customerId}`,
          JSON.stringify({
            customerId,
            email: email || null,
            refilledAt: new Date().toISOString(),
            source: 'limit_wall_feedback',
          })
        );
      } catch (kvErr) {
        console.warn('⚠️ [LIMIT-WALL-FEEDBACK] KV:', kvErr?.message);
      }
    }

    let emailUserOk = false;
    if (email) {
      const r = await sendCreditEmail(email, customerId);
      emailUserOk = !!r?.success;
    }

    return res.status(200).json({
      success: true,
      message:
        'Dziękujemy! W ciągu kilku minut wyślemy maila z potwierdzeniem — konto ma już 4 nowe generacje.',
      creditEmailSent: emailUserOk,
    });
  } catch (err) {
    console.error('❌ [LIMIT-WALL-FEEDBACK]', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
};
