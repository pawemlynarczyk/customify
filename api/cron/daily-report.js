/**
 * Cron: Dzienny raport o 8:00 rano.
 * Sprawdza: błędy Sentry (24h), aktywność generacji AI (Shopify), logi Vercel.
 * Wysyła email na REPORT_EMAIL (domyślnie biuro@lumly.pl).
 */

const https = require('https');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
const SENTRY_ORG = process.env.SENTRY_ORG || 'eshop-xg';
const SHOPIFY_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN || 'customify-ok.myshopify.com';
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const REPORT_EMAIL = process.env.REPORT_EMAIL || 'biuro@lumly.pl';
const ADMIN_STATS_TOKEN = process.env.ADMIN_STATS_TOKEN;

// ─── helpers ────────────────────────────────────────────────────────────────

function httpsGet(options) {
  return new Promise((resolve, reject) => {
    https.get(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    }).on('error', reject);
  });
}

// ─── Sentry: błędy ostatnie 24h ─────────────────────────────────────────────

async function getSentryErrors() {
  if (!SENTRY_AUTH_TOKEN) return { ok: false, reason: 'Brak SENTRY_AUTH_TOKEN', issues: [] };

  const query = new URLSearchParams({ statsPeriod: '24h', query: 'is:unresolved', sort: 'freq', limit: '50' });
  const result = await httpsGet({
    hostname: 'sentry.io',
    path: `/api/0/organizations/${SENTRY_ORG}/issues/?${query}`,
    headers: { 'Authorization': `Bearer ${SENTRY_AUTH_TOKEN}` }
  });

  if (result.status !== 200 || !Array.isArray(result.body)) {
    return { ok: false, reason: `Sentry API status ${result.status}`, issues: [] };
  }

  const issues = result.body.map(i => ({
    id: i.id,
    title: i.title,
    count: parseInt(i.count) || 0,
    userCount: parseInt(i.userCount) || 0,
    lastSeen: i.lastSeen,
    url: `https://sentry.io/organizations/${SENTRY_ORG}/issues/${i.id}/`
  })).sort((a, b) => b.count - a.count);

  return {
    ok: true,
    issues,
    totalEvents: issues.reduce((s, i) => s + i.count, 0),
    totalIssues: issues.length
  };
}

// ─── Shopify: generacje z ostatnich 24h ─────────────────────────────────────

async function getShopifyStats() {
  if (!SHOPIFY_TOKEN) return { ok: false, reason: 'Brak SHOPIFY_ACCESS_TOKEN', products: [] };

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const result = await httpsGet({
    hostname: SHOPIFY_DOMAIN,
    path: `/admin/api/2024-01/products.json?limit=250&fields=id,title,status,created_at&order=created_at+desc&created_at_min=${encodeURIComponent(since)}`,
    headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN }
  });

  if (result.status !== 200 || !result.body.products) {
    return { ok: false, reason: `Shopify API status ${result.status}`, products: [] };
  }

  const products = result.body.products;
  const active = products.filter(p => p.status === 'active').length;
  const failed = products.filter(p => p.status !== 'active').length;

  // Zlicz typy produktów (koszyk, format, styl) po tytule
  const typeCount = {};
  for (const p of products) {
    const title = p.title || '';
    let type = 'Inne';
    if (title.includes('Plik cyfrowy')) type = 'Plik cyfrowy';
    else if (title.includes('szkle na podstawce LED')) type = 'Szkło LED';
    else if (title.includes('szkle na podstawce drewnianej')) type = 'Szkło + podstawka';
    else if (title.includes('szkle')) type = 'Wydruk na szkle';
    else if (title.includes('płótnie')) type = 'Canvas';
    else if (title.includes('ramce')) type = 'Plakat w ramce';
    else if (title.includes('Plakat')) type = 'Plakat';
    typeCount[type] = (typeCount[type] || 0) + 1;
  }

  return {
    ok: true,
    total: products.length,
    active,
    failed,
    typeCount,
    recent: products.slice(0, 8).map(p => ({
      title: p.title,
      status: p.status,
      createdAt: p.created_at
    }))
  };
}

// ─── HTML raportu ────────────────────────────────────────────────────────────

function buildEmailHtml({ sentry, shopify, reportDate }) {
  const dateStr = reportDate.toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw', dateStyle: 'full', timeStyle: 'short' });

  // Sentry section
  const sentryStatus = !sentry.ok
    ? `<p style="color:#e74c3c;">⚠️ Nie udało się pobrać danych Sentry: ${sentry.reason}</p>`
    : sentry.totalIssues === 0
      ? `<p style="color:#27ae60; font-size:18px; font-weight:bold;">✅ Brak błędów w ostatnich 24h</p>`
      : `<p style="color:#e67e22; font-weight:bold;">⚠️ ${sentry.totalIssues} błędów, ${sentry.totalEvents} eventów w ostatnich 24h</p>`;

  const sentryTable = sentry.ok && sentry.issues.length > 0 ? `
    <table style="width:100%; border-collapse:collapse; margin-top:12px; font-size:13px;">
      <thead>
        <tr style="background:#f8f9fa;">
          <th style="padding:8px; text-align:left; border-bottom:2px solid #dee2e6;">#</th>
          <th style="padding:8px; text-align:left; border-bottom:2px solid #dee2e6;">Błąd</th>
          <th style="padding:8px; text-align:center; border-bottom:2px solid #dee2e6;">Eventy</th>
          <th style="padding:8px; text-align:center; border-bottom:2px solid #dee2e6;">Userzy</th>
          <th style="padding:8px; text-align:left; border-bottom:2px solid #dee2e6;">Ostatni</th>
        </tr>
      </thead>
      <tbody>
        ${sentry.issues.slice(0, 10).map((issue, i) => `
          <tr style="border-bottom:1px solid #f0f0f0; ${i % 2 === 0 ? 'background:#fff;' : 'background:#fafafa;'}">
            <td style="padding:8px; color:#888;">${i + 1}</td>
            <td style="padding:8px;"><a href="${issue.url}" style="color:#667eea; text-decoration:none;">${issue.title.substring(0, 80)}${issue.title.length > 80 ? '…' : ''}</a></td>
            <td style="padding:8px; text-align:center; font-weight:bold; color:${issue.count > 5 ? '#e74c3c' : '#333'};">${issue.count}</td>
            <td style="padding:8px; text-align:center;">${issue.userCount}</td>
            <td style="padding:8px; color:#888; font-size:12px;">${new Date(issue.lastSeen).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw', dateStyle: 'short', timeStyle: 'short' })}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '';

  // Shopify section
  const shopifyStatus = !shopify.ok
    ? `<p style="color:#e74c3c;">⚠️ Nie udało się pobrać danych Shopify: ${shopify.reason}</p>`
    : shopify.total === 0
      ? `<p style="color:#888;">Brak generacji AI w ostatnich 24h.</p>`
      : `<p style="color:#27ae60; font-size:18px; font-weight:bold;">🎨 ${shopify.total} generacji AI</p>`;

  const shopifyTypes = shopify.ok && shopify.typeCount ? `
    <table style="width:100%; border-collapse:collapse; margin-top:12px; font-size:13px;">
      <thead>
        <tr style="background:#f8f9fa;">
          <th style="padding:8px; text-align:left; border-bottom:2px solid #dee2e6;">Typ produktu</th>
          <th style="padding:8px; text-align:center; border-bottom:2px solid #dee2e6;">Liczba</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(shopify.typeCount).sort((a,b) => b[1]-a[1]).map(([type, count], i) => `
          <tr style="border-bottom:1px solid #f0f0f0; ${i % 2 === 0 ? 'background:#fff;' : 'background:#fafafa;'}">
            <td style="padding:8px;">${type}</td>
            <td style="padding:8px; text-align:center; font-weight:bold;">${count}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '';

  const overallStatus = sentry.totalIssues === 0 && shopify.ok
    ? { color: '#27ae60', icon: '✅', label: 'Wszystko działa poprawnie' }
    : sentry.totalIssues > 0
      ? { color: '#e67e22', icon: '⚠️', label: 'Są błędy do sprawdzenia' }
      : { color: '#95a5a6', icon: '❓', label: 'Częściowe dane' };

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
<div style="max-width:640px;margin:0 auto;background:#fff;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:32px 30px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:bold;">📊 Dzienny Raport Lumly</h1>
    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">${dateStr}</p>
  </div>

  <!-- Overall status -->
  <div style="padding:20px 30px;background:${overallStatus.color}10;border-bottom:3px solid ${overallStatus.color};text-align:center;">
    <p style="margin:0;font-size:20px;font-weight:bold;color:${overallStatus.color};">${overallStatus.icon} ${overallStatus.label}</p>
  </div>

  <!-- Sentry -->
  <div style="padding:24px 30px;border-bottom:1px solid #eee;">
    <h2 style="margin:0 0 12px;font-size:16px;color:#333;">🔴 Błędy Sentry (ostatnie 24h)</h2>
    ${sentryStatus}
    ${sentryTable}
    ${sentry.ok ? `<p style="margin-top:12px;"><a href="https://sentry.io/organizations/${SENTRY_ORG}/issues/?query=is%3Aunresolved&statsPeriod=24h" style="color:#667eea;font-size:13px;">→ Otwórz Sentry Dashboard</a></p>` : ''}
  </div>

  <!-- Shopify generacje -->
  <div style="padding:24px 30px;border-bottom:1px solid #eee;">
    <h2 style="margin:0 0 12px;font-size:16px;color:#333;">🎨 Generacje AI (ostatnie 24h)</h2>
    ${shopifyStatus}
    ${shopify.ok && shopify.total > 0 ? `
      <p style="margin:4px 0;font-size:13px;color:#555;">
        ✅ Aktywnych (do koszyka): <strong>${shopify.active}</strong>
        ${shopify.failed > 0 ? `&nbsp;&nbsp;❌ Błędnych: <strong style="color:#e74c3c;">${shopify.failed}</strong>` : ''}
      </p>
    ` : ''}
    ${shopifyTypes}
  </div>

  <!-- Linki -->
  <div style="padding:24px 30px;border-bottom:1px solid #eee;background:#fafafa;">
    <h2 style="margin:0 0 12px;font-size:16px;color:#333;">🔗 Szybkie linki</h2>
    <p style="margin:4px 0;"><a href="https://lumly.pl/admin/orders?status=open" style="color:#667eea;text-decoration:none;font-size:13px;">→ Zamówienia Shopify (otwarte)</a></p>
    <p style="margin:4px 0;"><a href="https://customify-s56o.vercel.app/api/admin/stats" style="color:#667eea;text-decoration:none;font-size:13px;">→ Panel Admin Customify</a></p>
    <p style="margin:4px 0;"><a href="https://sentry.io/organizations/${SENTRY_ORG}/issues/" style="color:#667eea;text-decoration:none;font-size:13px;">→ Sentry — wszystkie błędy</a></p>
    <p style="margin:4px 0;"><a href="https://vercel.com/my-team-2e3205fe/customify" style="color:#667eea;text-decoration:none;font-size:13px;">→ Vercel Dashboard</a></p>
  </div>

  <!-- Footer -->
  <div style="padding:20px 30px;text-align:center;background:#f9f9f9;">
    <p style="margin:0;font-size:12px;color:#999;">Lumly.pl — Automatyczny raport dzienny &bull; Wysyłany codziennie o 8:00</p>
  </div>

</div>
</body>
</html>`;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  // Zabezpieczenie: tylko Vercel Cron lub ręczny call z tokenem
  const authHeader = req.headers.authorization;
  const isVercelCron = req.headers['x-vercel-cron'] === '1' || req.headers['x-vercel-signature'];
  const hasToken = authHeader === `Bearer ${ADMIN_STATS_TOKEN}`;

  if (!isVercelCron && !hasToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('📊 [DAILY-REPORT] Start raportu...');

  try {
    const reportDate = new Date();

    const [sentry, shopify] = await Promise.all([
      getSentryErrors(),
      getShopifyStats()
    ]);

    console.log(`📊 [DAILY-REPORT] Sentry: ${sentry.totalIssues || 0} błędów | Shopify: ${shopify.total || 0} generacji`);

    const html = buildEmailHtml({ sentry, shopify, reportDate });

    const subject = sentry.totalIssues === 0
      ? `✅ Raport Lumly ${reportDate.toLocaleDateString('pl-PL')} — brak błędów, ${shopify.total || 0} generacji`
      : `⚠️ Raport Lumly ${reportDate.toLocaleDateString('pl-PL')} — ${sentry.totalIssues} błędów, ${shopify.total || 0} generacji`;

    const emailRes = await resend.emails.send({
      from: 'Lumly Raport <noreply@notification.lumly.pl>',
      to: REPORT_EMAIL,
      subject,
      html
    });

    console.log(`✅ [DAILY-REPORT] Email wysłany do ${REPORT_EMAIL}, id: ${emailRes?.data?.id}`);

    return res.status(200).json({
      ok: true,
      sentTo: REPORT_EMAIL,
      subject,
      sentry: { issues: sentry.totalIssues || 0, events: sentry.totalEvents || 0 },
      shopify: { generations: shopify.total || 0 }
    });

  } catch (err) {
    console.error('❌ [DAILY-REPORT] Błąd:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
