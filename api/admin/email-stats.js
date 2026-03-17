// api/admin/email-stats.js
// Panel statystyk mailingu: wysłane / kliknięcia / zakupy dla każdego typu maila

const { kv } = require('@vercel/kv');

const EMAIL_TYPES = [
  { key: 'generation',   label: '🎨 Po generacji',     desc: '"Twój projekt jest gotowy!"' },
  { key: 'credits',      label: '🔄 Reset kredytów',   desc: '"Dodaliśmy Ci nowe kredyty"' },
  { key: 'reminder_1d',  label: '📅 Przypomnienie 1d', desc: '"Twój obraz AI jest gotowy – odbierz go teraz"' },
  { key: 'reminder_3d',  label: '📅 Przypomnienie 3d', desc: '"Twój obraz czeka..."' },
  { key: 'reminder_7d',  label: '📅 Przypomnienie 7d', desc: '"Twoja generacja wciąż czeka"' },
  { key: 'reminder_14d', label: '📅 Przypomnienie 14d',desc: '"Ostatnia szansa..."' },
];

function pct(num, den) {
  if (!den || den === 0) return '–';
  return (num / den * 100).toFixed(1) + '%';
}

function buildHtml(rows) {
  const rowsHtml = rows.map(r => `
    <tr>
      <td>${r.label}</td>
      <td style="font-size:12px;color:#888;">${r.desc}</td>
      <td class="num">${r.sent}</td>
      <td class="num">${r.clicks}</td>
      <td class="num ${r.ctrClass}">${pct(r.clicks, r.sent)}</td>
      <td class="num">${r.purchases}</td>
      <td class="num ${r.convClass}">${pct(r.purchases, r.clicks)}</td>
    </tr>
  `).join('');

  const totalSent = rows.reduce((s, r) => s + r.sent, 0);
  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
  const totalPurchases = rows.reduce((s, r) => s + r.purchases, 0);

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>📧 Email Stats – Lumly</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f6f9; margin: 0; padding: 24px; color: #222; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    .sub { color: #888; font-size: 13px; margin: 0 0 24px; }
    .card { background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.08); overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #667eea; color: #fff; padding: 12px 16px; text-align: left; font-size: 13px; font-weight: 600; }
    th.num, td.num { text-align: right; }
    td { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #fafbff; }
    .num { font-variant-numeric: tabular-nums; }
    .good { color: #27ae60; font-weight: 600; }
    .ok   { color: #e67e22; font-weight: 600; }
    .low  { color: #e74c3c; }
    .total td { background: #f4f6f9; font-weight: 700; border-top: 2px solid #ddd; }
    .badges { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .badge { background: #fff; border-radius: 10px; padding: 14px 20px; box-shadow: 0 2px 6px rgba(0,0,0,.07); min-width: 120px; }
    .badge .val { font-size: 28px; font-weight: 700; color: #667eea; }
    .badge .lbl { font-size: 12px; color: #888; margin-top: 2px; }
    .updated { color: #aaa; font-size: 12px; margin-top: 14px; text-align: right; }
  </style>
</head>
<body>
  <h1>📧 Statystyki mailingu</h1>
  <p class="sub">Dane od momentu wdrożenia trackingu. Odśwież stronę żeby zobaczyć aktualne liczby.</p>

  <div class="badges">
    <div class="badge"><div class="val">${totalSent}</div><div class="lbl">Wysłanych maili</div></div>
    <div class="badge"><div class="val">${totalClicks}</div><div class="lbl">Kliknięć łącznie</div></div>
    <div class="badge"><div class="val">${pct(totalClicks, totalSent)}</div><div class="lbl">CTR ogółem</div></div>
    <div class="badge"><div class="val">${totalPurchases}</div><div class="lbl">Zakupów z maili</div></div>
    <div class="badge"><div class="val">${pct(totalPurchases, totalClicks)}</div><div class="lbl">Konwersja (klik→zakup)</div></div>
  </div>

  <div class="card">
    <table>
      <thead>
        <tr>
          <th>Typ maila</th>
          <th>Temat</th>
          <th class="num">Wysłane</th>
          <th class="num">Kliknięcia</th>
          <th class="num">CTR</th>
          <th class="num">Zakupy</th>
          <th class="num">Konwersja</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        <tr class="total">
          <td colspan="2">RAZEM</td>
          <td class="num">${totalSent}</td>
          <td class="num">${totalClicks}</td>
          <td class="num">${pct(totalClicks, totalSent)}</td>
          <td class="num">${totalPurchases}</td>
          <td class="num">${pct(totalPurchases, totalClicks)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <p class="updated">Wygenerowano: ${new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' })}</p>
</body>
</html>`;
}

module.exports = async (req, res) => {
  const expectedToken = process.env.ADMIN_STATS_TOKEN;
  const authHeader = req.headers.authorization;
  const tokenQuery = req.query.token;

  const isAuth = expectedToken && (
    authHeader === `Bearer ${expectedToken}` ||
    tokenQuery === expectedToken
  );

  if (!isAuth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.query.format === 'json') {
    try {
      const results = {};
      for (const t of EMAIL_TYPES) {
        const [sent, clicks, purchases] = await Promise.all([
          kv.get(`email-stats:${t.key}:sent`),
          kv.get(`email-stats:${t.key}:clicks`),
          kv.get(`email-stats:${t.key}:purchases`),
        ]);
        results[t.key] = {
          label: t.label,
          sent: Number(sent) || 0,
          clicks: Number(clicks) || 0,
          purchases: Number(purchases) || 0,
        };
      }
      return res.status(200).json(results);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  try {
    const rows = await Promise.all(EMAIL_TYPES.map(async (t) => {
      const [sent, clicks, purchases] = await Promise.all([
        kv.get(`email-stats:${t.key}:sent`),
        kv.get(`email-stats:${t.key}:clicks`),
        kv.get(`email-stats:${t.key}:purchases`),
      ]);
      const s = Number(sent) || 0;
      const c = Number(clicks) || 0;
      const p = Number(purchases) || 0;
      const ctr = s > 0 ? c / s : 0;
      const conv = c > 0 ? p / c : 0;
      return {
        ...t,
        sent: s,
        clicks: c,
        purchases: p,
        ctrClass: ctr >= 0.2 ? 'good' : ctr >= 0.1 ? 'ok' : 'low',
        convClass: conv >= 0.1 ? 'good' : conv >= 0.05 ? 'ok' : 'low',
      };
    }));

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(buildHtml(rows));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
