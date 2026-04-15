/**
 * Cron: przypomnienie „masz generację, nie kupiłeś” – 3, 7 i 14 dni po ostatniej generacji.
 * Źródło: Blob customer-*.json. Wysyłamy tylko do tych, którzy nie kupili (sprawdzenie Orders API).
 * Jeden mail z ostatnią generacją (jedna miniaturka + CTA do Moje generacje).
 */

const { list } = require('@vercel/blob');
const { kv } = require('@vercel/kv');
const { Resend } = require('resend');
const { SHOPIFY_API_VERSION } = require('../../utils/shopifyConfig');

const BLOB_TOKEN = process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
const PREFIX = 'customify/system/stats/generations/';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const KV_TTL_SEC = 90 * 24 * 3600; // 90 dni
const THROTTLE_MS = 600;
const EVALUATION_BATCH_SIZE = 25;
const MAX_SENDS_PER_RUN = 250;
const resend = new Resend(process.env.RESEND_API_KEY);

function isCustomifyLineItem(item) {
  return (
    item.vendor === 'Customify' ||
    item.product_type === 'Custom AI Product' ||
    item.product_type === 'Digital Product' ||
    (item.title && item.title.includes('Spersonalizowany'))
  );
}

async function getRecentCustomifyPurchases(shopDomain, accessToken, daysBack = 30) {
  const allowedStatus = new Set(['paid', 'partially_paid']);
  const createdAtMin = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
  let url = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/orders.json?status=any&limit=250&created_at_min=${encodeURIComponent(createdAtMin)}`;
  let pageCount = 0;
  const maxPages = 10;
  const purchasesByCustomerId = new Map();

  while (url && pageCount < maxPages) {
    pageCount++;
    const res = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': accessToken }
    });
    if (!res.ok) {
      throw new Error(`Shopify orders fetch failed: ${res.status}`);
    }

    const data = await res.json();
    const orders = data.orders || [];

    for (const order of orders) {
      if (order.cancelled_at) continue;
      if (!allowedStatus.has(order.financial_status)) continue;
      if (!(order.line_items || []).some(isCustomifyLineItem)) continue;

      const customerId = order.customer?.id;
      if (!customerId) continue;

      const paidAt = new Date(order.processed_at || order.created_at || order.updated_at).getTime();
      if (Number.isNaN(paidAt)) continue;

      const current = purchasesByCustomerId.get(String(customerId));
      if (!current || paidAt > current) {
        purchasesByCustomerId.set(String(customerId), paidAt);
      }
    }

    const link = res.headers.get('link');
    const nextMatch = link && link.match(/<([^>]+)>;\s*rel="next"/);
    url = nextMatch ? nextMatch[1] : null;
  }

  return purchasesByCustomerId;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getCollectionProducts(shopDomain, accessToken, collectionHandle) {
  try {
    const query = `
      query getCollectionProducts($handle: String!) {
        collectionByHandle(handle: $handle) {
          products(first: 50) {
            edges {
              node {
                title
                handle
                onlineStoreUrl
                featuredImage { url(transform: { maxWidth: 600, maxHeight: 600 }) }
              }
            }
          }
        }
      }
    `;
    const res = await fetch(`https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
      body: JSON.stringify({ query, variables: { handle: collectionHandle } })
    });
    if (!res.ok) return [];
    const data = await res.json();
    const collection = data?.data?.collectionByHandle;
    if (!collection) return [];
    return (collection.products?.edges || [])
      .map(e => {
        const p = e.node;
        return { title: p.title, handle: p.handle, href: p.onlineStoreUrl || `https://lumly.pl/products/${p.handle}`, img: p.featuredImage?.url };
      })
      .filter(p => p.img);
  } catch (err) {
    console.warn('[REMINDER] getCollectionProducts error:', err.message);
    return [];
  }
}

const BASE_URL = 'https://customify-s56o.vercel.app';

function trackingUrl(type, customerId, target) {
  const encoded = encodeURIComponent(target);
  const cidPart = customerId ? `&cid=${encodeURIComponent(customerId)}` : '';
  return `${BASE_URL}/api/email-click?type=${type}${cidPart}&url=${encoded}`;
}

function buildReminderEmailHtml(imageUrl, variant, products = [], customerId = null) {
  const headlines = {
    '1d': 'Twój obraz AI jest gotowy – odbierz go teraz',
    '3d': 'Twój obraz czeka – dokończ zamówienie, zanim zniknie',
    '7d': 'Twoja generacja wciąż na Ciebie czeka',
    '14d': 'Ostatnia szansa – Twój obraz czeka na zamówienie'
  };
  const texts = {
    '1d': 'Właśnie wygenerowaliśmy Twój projekt AI. Otwórz „Moje generacje”, zobacz podgląd i zamów wydruk, gdy będziesz gotowy.',
    '3d': 'Twój projekt z ostatniej generacji czeka w galerii. Zobacz go i dodaj do koszyka, gdy będziesz gotowy.',
    '7d': 'Nie zapomnij o swoim projekcie. Zobacz go w galerii i zamów wydruk w kilku kliknięciach.',
    '14d': 'Minęły już 2 tygodnie od Twojej ostatniej generacji. Zobacz projekt w galerii i zamów wydruk – to ostatnia szansa.'
  };
  const headline = headlines[variant] || headlines['3d'];
  const text = texts[variant] || texts['3d'];
  const imgSrc = imageUrl || 'https://lumly.pl/cdn/shop/files/w_rece_bez_ramy_d6f06d22-9697-4b0a-b247-c024515a036d.jpg';
  const emailType = `reminder_${variant}`;
  const ctaHref = trackingUrl(emailType, customerId, 'https://lumly.pl/pages/my-generations');
  const imgHref = ctaHref;
  const productRows = [];
  for (let i = 0; i < products.length; i += 3) {
    const rowItems = products.slice(i, i + 3);
    const tds = rowItems.map(item => `<td style="width: 33.33%; padding: 8px; vertical-align: top;"><a href="${item.href}" style="text-decoration: none; color: #333; display: block; border: 2px solid #e8e8e8; border-radius: 10px; overflow: hidden; background: #fff;"><img src="${item.img}" alt="${item.title}" style="width: 100%; height: auto; display: block; background: #f5f5f5;"><div style="padding: 12px; font-size: 14px; line-height: 1.4; color: #333; text-align: center; font-weight: 500;">${item.title}</div></a></td>`).join('');
    productRows.push(`<tr>${tds}</tr>`);
  }
  const productTable = productRows.length > 0 ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin: 20px 0;">${productRows.join('')}</table>` : '';
  const productsSection = products.length > 0 ? `<div style="margin: 32px 0 12px;"><h3 style="margin: 0 0 12px; font-size: 18px; color: #333;">Zobacz nasze najnowsze produkty</h3>${productTable}<div style="text-align: center; margin: 16px 0 0;"><a href="https://lumly.pl/collections/see_also" style="color: #667eea; text-decoration: none; font-weight: bold; font-size: 14px; border-bottom: 2px solid #667eea; padding-bottom: 2px;">Przeglądaj kolekcję →</a></div></div>` : '';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${headline}</h1>
    </div>
    <div style="padding: 40px 30px; background-color: #ffffff;">
      <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 24px;">${text}</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${imgHref}" style="text-decoration: none;">
          <img src="${imgSrc}" alt="Twoja generacja" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
        </a>
      </div>
      <div style="text-align: center; margin: 40px 0;">
        <a href="${ctaHref}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Zobacz Moje generacje i zamów</a>
      </div>
      ${productsSection}
      <p style="font-size: 14px; color: #666; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; text-align: center;">Pytania? <a href="mailto:biuro@lumly.pl" style="color: #667eea; text-decoration: none; font-weight: bold;">biuro@lumly.pl</a></p>
    </div>
    <div style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
      <p style="margin: 0; font-size: 12px; color: #999;">© 2025 Lumly.pl - Personalizowane portrety AI</p>
    </div>
  </div>
</body>
</html>
`;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const expectedToken = process.env.ADMIN_STATS_TOKEN;
  const authHeader = req.headers.authorization;
  const vercelCronHeader = req.headers['x-vercel-cron'];
  const vercelId = req.headers['x-vercel-id'];
  const userAgent = req.headers['user-agent'] || '';
  const isCron =
    (Boolean(vercelCronHeader) && Boolean(vercelId)) ||
    (/vercel/i.test(userAgent) && /cron/i.test(userAgent) && Boolean(vercelId));
  const isToken = expectedToken && authHeader === `Bearer ${expectedToken}`;

  if (!isCron && !isToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!BLOB_TOKEN) {
    return res.status(500).json({ error: 'Blob token not configured' });
  }
  if (!process.env.SHOPIFY_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'SHOPIFY_ACCESS_TOKEN not configured' });
  }
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  }

  const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  const now = Date.now();
  const sent1d = [];
  const sent3d = [];
  const sent7d = [];
  const sent14d = [];
  const errors = [];
  const dryRun = (req.url || '').includes('dryRun=1');
  const diagnostics = dryRun ? { skipped: { noEmail: 0, noLastGen: 0, bought: 0 }, wouldSend: { '1d': 0, '3d': 0, '7d': 0, '14d': 0 } } : null;

  try {
    let cursor;
    let customerBlobs = [];
    do {
      const result = await list({
        prefix: PREFIX,
        limit: 500,
        cursor: cursor,
        token: BLOB_TOKEN
      });
      const onlyCustomer = (result.blobs || []).filter(
        (b) => (b.pathname || b.name || '').includes('customer-') && (b.pathname || b.name || '').endsWith('.json') && !(b.pathname || b.name || '').includes('device-')
      );
      customerBlobs = customerBlobs.concat(onlyCustomer);
      cursor = result.cursor;
      if (!cursor || customerBlobs.length >= 2000) break;
    } while (cursor);

    console.log(`📧 [REMINDER-3-7D] Sprawdzam ${customerBlobs.length} plików customer-*.json${dryRun ? ' [DRY RUN]' : ''}`);

    const [products, recentPurchasesByCustomerId] = await Promise.all([
      getCollectionProducts(shopDomain, accessToken, 'see_also'),
      getRecentCustomifyPurchases(shopDomain, accessToken, 30)
    ]);
    if (products.length > 0) console.log(`📧 [REMINDER-3-7D] Pobrano ${products.length} produktów z kolekcji see_also`);
    console.log(`📧 [REMINDER-3-7D] Pobrano ${recentPurchasesByCustomerId.size} klientów z zakupami Customify z ostatnich 30 dni`);

    const candidates = [];

    for (let offset = 0; offset < customerBlobs.length; offset += EVALUATION_BATCH_SIZE) {
      const batch = customerBlobs.slice(offset, offset + EVALUATION_BATCH_SIZE);
      const results = await Promise.all(batch.map(async (blob) => {
        try {
          const fetchRes = await fetch(blob.url);
          if (!fetchRes.ok) return null;

          const data = await fetchRes.json();
          const customerId = data.customerId || (blob.pathname || blob.name || '').match(/customer-([^.]+)/)?.[1];
          if (!customerId) return null;

          const email = data.email || data.generations?.[0]?.email;
          if (!email || typeof email !== 'string' || !email.includes('@')) {
            return { skip: 'noEmail' };
          }

          const lastGenDate = data.lastGenerationDate || data.generations?.[0]?.date || data.generations?.[0]?.timestamp;
          if (!lastGenDate) {
            return { skip: 'noLastGen' };
          }

          const T = new Date(lastGenDate).getTime();
          if (Number.isNaN(T)) return null;

          const lastPurchaseAt = recentPurchasesByCustomerId.get(String(customerId));
          if (lastPurchaseAt && lastPurchaseAt > T) {
            return { skip: 'bought' };
          }

          const generations = Array.isArray(data.generations) ? data.generations : [];
          const lastGen = generations[0] || generations[generations.length - 1];
          const imageUrl = lastGen?.watermarkedImageUrl || lastGen?.imageUrl || null;

        const key1d = `reminder-1d:${customerId}`;
        const key3d = `reminder-3d:${customerId}`;
        const key7d = `reminder-7d:${customerId}`;
        const key14d = `reminder-14d:${customerId}`;
        const [raw1d, raw3d, raw7d, raw14d] = await Promise.all([
          kv.get(key1d),
          kv.get(key3d),
          kv.get(key7d),
          kv.get(key14d)
        ]);
        const parse = (r) => typeof r === 'string' ? (() => { try { return JSON.parse(r); } catch { return r; } })() : r;
        const lastGenAt1d  = parse(raw1d)?.lastGenAt  ? new Date(parse(raw1d).lastGenAt).getTime()  : null;
        const lastGenAt3d  = parse(raw3d)?.lastGenAt  ? new Date(parse(raw3d).lastGenAt).getTime()  : null;
        const lastGenAt7d  = parse(raw7d)?.lastGenAt  ? new Date(parse(raw7d).lastGenAt).getTime()  : null;
        const lastGenAt14d = parse(raw14d)?.lastGenAt ? new Date(parse(raw14d).lastGenAt).getTime() : null;

          const ageMs = now - T;
          // Ścisłe okna 1-dniowe: mail idzie raz dokładnie w 1., 3., 7. i 14. dobie
          const due1d  = ageMs >= ONE_DAY_MS       && ageMs < ONE_DAY_MS       + ONE_DAY_MS && lastGenAt1d  !== T;
          const due3d  = ageMs >= THREE_DAYS_MS    && ageMs < THREE_DAYS_MS    + ONE_DAY_MS && lastGenAt3d  !== T;
          const due7d  = ageMs >= SEVEN_DAYS_MS    && ageMs < SEVEN_DAYS_MS    + ONE_DAY_MS && lastGenAt7d  !== T;
          const due14d = ageMs >= FOURTEEN_DAYS_MS && ageMs < FOURTEEN_DAYS_MS + ONE_DAY_MS && lastGenAt14d !== T;

          let variant = null;
          if (due1d)       variant = '1d';
          else if (due3d)  variant = '3d';
          else if (due7d)  variant = '7d';
          else if (due14d) variant = '14d';

          if (!variant) return null;

          return { customerId, email, T, imageUrl, variant, keys: { '1d': key1d, '3d': key3d, '7d': key7d, '14d': key14d } };
        } catch (err) {
          return { error: err.message, blob: blob.pathname || blob.url };
        }
      }));

      for (const result of results) {
        if (!result) continue;
        if (result.error) {
          errors.push({ blob: result.blob, error: result.error });
          continue;
        }
        if (result.skip) {
          if (diagnostics && diagnostics.skipped[result.skip] !== undefined) diagnostics.skipped[result.skip]++;
          continue;
        }

        candidates.push(result);
        if (dryRun) diagnostics.wouldSend[result.variant]++;
      }
    }

    console.log(`📧 [REMINDER-3-7D] Kandydaci do wysyłki: ${candidates.length}${dryRun ? ' [DRY RUN]' : ''}`);

    if (!dryRun) {
      const subjects = {
        '1d':  'Twój obraz AI jest gotowy – odbierz go teraz',
        '3d':  'Twój obraz czeka – dokończ zamówienie, zanim zniknie',
        '7d':  'Twoja generacja wciąż na Ciebie czeka',
        '14d': 'Ostatnia szansa – Twój obraz czeka na zamówienie'
      };
      const lists = { '1d': sent1d, '3d': sent3d, '7d': sent7d, '14d': sent14d };
      const limitedCandidates = candidates.slice(0, MAX_SENDS_PER_RUN);

      console.log(`📧 [REMINDER-3-7D] Wysyłam ${limitedCandidates.length}/${candidates.length} kandydatów w tym przebiegu`);

      for (const candidate of limitedCandidates) {
        const { customerId, email, T, imageUrl, variant, keys } = candidate;
        await sleep(THROTTLE_MS);
        const sendRes = await resend.emails.send({
          from: 'Lumly <noreply@notification.lumly.pl>',
          reply_to: 'biuro@lumly.pl',
          to: email,
          subject: subjects[variant],
          html: buildReminderEmailHtml(imageUrl, variant, products, customerId)
        });
        if (sendRes.error) {
          errors.push({ customerId, type: variant, error: sendRes.error.message || JSON.stringify(sendRes.error) });
          continue;
        }

        await kv.set(keys[variant], JSON.stringify({ lastGenAt: new Date(T).toISOString(), sentAt: new Date().toISOString() }), { ex: KV_TTL_SEC });
        await kv.incr(`email-stats:reminder_${variant}:sent`).catch(() => {});
        lists[variant].push({ customerId, email: email.substring(0, 12) + '...' });
        console.log(`✅ [REMINDER-3-7D] Wysłano ${variant}: ${customerId}`);
      }
    }

    const payload = {
      success: true,
      checked: customerBlobs.length,
      sent1d: sent1d.length,
      sent3d: sent3d.length,
      sent7d: sent7d.length,
      sent14d: sent14d.length,
      remainingCandidates: dryRun ? candidates.length : Math.max(candidates.length - MAX_SENDS_PER_RUN, 0),
      sent1dList: sent1d,
      sent3dList: sent3d,
      sent7dList: sent7d,
      sent14dList: sent14d,
      errors: errors.length ? errors : undefined
    };
    if (diagnostics) {
      payload.dryRun = true;
      payload.diagnostics = diagnostics;
    }
    return res.status(200).json(payload);
  } catch (err) {
    console.error('❌ [REMINDER-3-7D]', err);
    return res.status(500).json({ error: err.message, errors });
  }
};
