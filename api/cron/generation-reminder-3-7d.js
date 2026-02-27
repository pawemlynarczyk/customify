/**
 * Cron: przypomnienie „masz generację, nie kupiłeś” – 3 dni i 7 dni po ostatniej generacji.
 * Źródło: Blob customer-*.json. Wysyłamy tylko do tych, którzy nie kupili (sprawdzenie Orders API).
 * Jeden mail z ostatnią generacją (jedna miniaturka + CTA do Moje generacje).
 */

const { list } = require('@vercel/blob');
const { kv } = require('@vercel/kv');
const { Resend } = require('resend');

const BLOB_TOKEN = process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
const PREFIX = 'customify/system/stats/generations/';
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const KV_TTL_SEC = 90 * 24 * 3600; // 90 dni
const THROTTLE_MS = 600;
const resend = new Resend(process.env.RESEND_API_KEY);

function isCustomifyLineItem(item) {
  return (
    item.vendor === 'Customify' ||
    item.product_type === 'Custom AI Product' ||
    item.product_type === 'Digital Product' ||
    (item.title && item.title.includes('Spersonalizowany'))
  );
}

async function customerBoughtCustomify(shopDomain, accessToken, customerId) {
  const allowedStatus = new Set(['paid', 'partially_paid']);
  let url = `https://${shopDomain}/admin/api/2024-01/orders.json?customer_id=${customerId}&status=any&limit=250`;
  let pageCount = 0;
  const maxPages = 5;

  while (url && pageCount < maxPages) {
    pageCount++;
    const res = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': accessToken }
    });
    if (!res.ok) return false;
    const data = await res.json();
    const orders = data.orders || [];
    for (const order of orders) {
      if (order.cancelled_at) continue;
      if (!allowedStatus.has(order.financial_status)) continue;
      const hasCustomify = (order.line_items || []).some(isCustomifyLineItem);
      if (hasCustomify) return true;
    }
    const link = res.headers.get('link');
    const nextMatch = link && link.match(/<([^>]+)>;\s*rel="next"/);
    url = nextMatch ? nextMatch[1] : null;
  }
  return false;
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
    const res = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
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

function buildReminderEmailHtml(imageUrl, is7d, products = []) {
  const headline = is7d
    ? 'Twoja generacja wciąż na Ciebie czeka'
    : 'Masz niezamówiony projekt – dokończ zamówienie';
  const text = is7d
    ? 'Nie zapomnij o swoim projekcie. Zobacz go w galerii i zamów wydruk w kilku kliknięciach.'
    : 'Twój projekt z ostatniej generacji czeka w galerii. Zobacz go i dodaj do koszyka, gdy będziesz gotowy.';
  const imgSrc = imageUrl || 'https://lumly.pl/cdn/shop/files/w_rece_bez_ramy_d6f06d22-9697-4b0a-b247-c024515a036d.jpg';
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
        <a href="https://lumly.pl/pages/my-generations" style="text-decoration: none;">
          <img src="${imgSrc}" alt="Twoja generacja" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
        </a>
      </div>
      <div style="text-align: center; margin: 40px 0;">
        <a href="https://lumly.pl/pages/my-generations" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Zobacz Moje generacje i zamów</a>
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
  const sent3d = [];
  const sent7d = [];
  const errors = [];

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

    console.log(`📧 [REMINDER-3-7D] Sprawdzam ${customerBlobs.length} plików customer-*.json`);

    const products = await getCollectionProducts(shopDomain, accessToken, 'see_also');
    if (products.length > 0) console.log(`📧 [REMINDER-3-7D] Pobrano ${products.length} produktów z kolekcji see_also`);

    for (const blob of customerBlobs) {
      try {
        const fetchRes = await fetch(blob.url);
        if (!fetchRes.ok) continue;
        const data = await fetchRes.json();
        const customerId = data.customerId || (blob.pathname || blob.name || '').match(/customer-([^.]+)/)?.[1];
        if (!customerId) continue;

        const email = data.email || data.generations?.[0]?.email;
        if (!email || typeof email !== 'string' || !email.includes('@')) continue;

        const lastGenDate = data.lastGenerationDate || data.generations?.[0]?.date || data.generations?.[0]?.timestamp;
        if (!lastGenDate) continue;
        const T = new Date(lastGenDate).getTime();
        if (Number.isNaN(T)) continue;

        const generations = Array.isArray(data.generations) ? data.generations : [];
        const lastGen = generations[0] || generations[generations.length - 1];
        const imageUrl = lastGen?.watermarkedImageUrl || lastGen?.imageUrl || null;

        const bought = await customerBoughtCustomify(shopDomain, accessToken, customerId);
        if (bought) continue;

        const key3d = `reminder-3d:${customerId}`;
        const key7d = `reminder-7d:${customerId}`;
        const raw3d = await kv.get(key3d);
        const raw7d = await kv.get(key7d);
        const payload3d = typeof raw3d === 'string' ? (() => { try { return JSON.parse(raw3d); } catch { return raw3d; } })() : raw3d;
        const payload7d = typeof raw7d === 'string' ? (() => { try { return JSON.parse(raw7d); } catch { return raw7d; } })() : raw7d;
        const lastGenAt3d = payload3d?.lastGenAt ? new Date(payload3d.lastGenAt).getTime() : null;
        const lastGenAt7d = payload7d?.lastGenAt ? new Date(payload7d.lastGenAt).getTime() : null;

        if (now >= T + THREE_DAYS_MS && lastGenAt3d !== T) {
          await sleep(THROTTLE_MS);
          const sendRes = await resend.emails.send({
            from: 'Lumly <noreply@notification.lumly.pl>',
            reply_to: 'biuro@lumly.pl',
            to: email,
            subject: 'Masz niezamówiony projekt – zobacz Moje generacje',
            html: buildReminderEmailHtml(imageUrl, false, products)
          });
          if (sendRes.error) {
            errors.push({ customerId, type: '3d', error: sendRes.error.message || JSON.stringify(sendRes.error) });
            continue;
          }
          await kv.set(key3d, JSON.stringify({ lastGenAt: new Date(T).toISOString(), sentAt: new Date().toISOString() }), { ex: KV_TTL_SEC });
          sent3d.push({ customerId, email: email.substring(0, 12) + '...' });
          console.log(`✅ [REMINDER-3-7D] Wysłano 3d: ${customerId}`);
        }

        if (now >= T + SEVEN_DAYS_MS && lastGenAt7d !== T) {
          await sleep(THROTTLE_MS);
          const sendRes = await resend.emails.send({
            from: 'Lumly <noreply@notification.lumly.pl>',
            reply_to: 'biuro@lumly.pl',
            to: email,
            subject: 'Twoja generacja wciąż na Ciebie czeka',
            html: buildReminderEmailHtml(imageUrl, true, products)
          });
          if (sendRes.error) {
            errors.push({ customerId, type: '7d', error: sendRes.error.message || JSON.stringify(sendRes.error) });
            continue;
          }
          await kv.set(key7d, JSON.stringify({ lastGenAt: new Date(T).toISOString(), sentAt: new Date().toISOString() }), { ex: KV_TTL_SEC });
          sent7d.push({ customerId, email: email.substring(0, 12) + '...' });
          console.log(`✅ [REMINDER-3-7D] Wysłano 7d: ${customerId}`);
        }
      } catch (err) {
        errors.push({ blob: blob.pathname || blob.url, error: err.message });
        console.warn(`⚠️ [REMINDER-3-7D] Błąd dla ${blob.pathname}:`, err.message);
      }
    }

    return res.status(200).json({
      success: true,
      checked: customerBlobs.length,
      sent3d: sent3d.length,
      sent7d: sent7d.length,
      sent3dList: sent3d,
      sent7dList: sent7d,
      errors: errors.length ? errors : undefined
    });
  } catch (err) {
    console.error('❌ [REMINDER-3-7D]', err);
    return res.status(500).json({ error: err.message, errors });
  }
};
