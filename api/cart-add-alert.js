/**
 * /api/cart-add-alert
 * Wysyła email alert gdy cart add nie uda się po wszystkich retries
 * Wywoływany z frontendu (theme.liquid) po 4 nieudanych próbach
 */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.error('❌ [CART-ALERT] Brak RESEND_API_KEY');
    return res.status(500).json({ error: 'Email not configured' });
  }

  const {
    variantId,
    productId,
    productTitle,
    shopifyError,
    style,
    size,
    url,
    userEmail,
    attempts
  } = req.body || {};

  const now = new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' });

  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #dc2626; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
    <h2 style="margin:0">🛒 Błąd dodawania do koszyka</h2>
    <p style="margin:4px 0 0; opacity:0.9; font-size:14px;">${now}</p>
  </div>
  <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px 24px; border-radius: 0 0 8px 8px;">
    
    <table style="width:100%; border-collapse: collapse;">
      <tr><td style="padding:8px 0; color:#666; width:160px;">Błąd Shopify</td><td style="padding:8px 0; font-weight:bold; color:#dc2626;">${shopifyError || 'nieznany'}</td></tr>
      <tr><td style="padding:8px 0; color:#666;">Użytkownik</td><td style="padding:8px 0;">${userEmail || 'niezalogowany'}</td></tr>
      <tr><td style="padding:8px 0; color:#666;">Styl</td><td style="padding:8px 0;">${style || '?'}</td></tr>
      <tr><td style="padding:8px 0; color:#666;">Rozmiar</td><td style="padding:8px 0;">${size || '?'}</td></tr>
      <tr><td style="padding:8px 0; color:#666;">Produkt</td><td style="padding:8px 0;">${productTitle || '?'}</td></tr>
      <tr><td style="padding:8px 0; color:#666;">Variant ID</td><td style="padding:8px 0; font-size:12px; font-family:monospace;">${variantId || '?'}</td></tr>
      <tr><td style="padding:8px 0; color:#666;">Product ID</td><td style="padding:8px 0; font-size:12px; font-family:monospace;">${productId || '?'}</td></tr>
      <tr><td style="padding:8px 0; color:#666;">Próby</td><td style="padding:8px 0;">${attempts || 4}/4 — wszystkie nieudane</td></tr>
      <tr><td style="padding:8px 0; color:#666;">Strona</td><td style="padding:8px 0; font-size:12px;"><a href="${url||'#'}">${(url||'').substring(0,80)}</a></td></tr>
    </table>

    <div style="margin-top:16px; padding:12px; background:#fff; border-radius:6px; border:1px solid #fecaca;">
      <p style="margin:0; font-size:13px; color:#666;">
        Produkt <strong>został stworzony</strong> w Shopify (ID: ${productId||'?'}) ale <strong>nie trafił do koszyka</strong>.<br>
        Klient mógł opuścić stronę bez zakupu.
      </p>
    </div>

    <div style="margin-top:12px; text-align:center;">
      <a href="https://admin.shopify.com/store/customify-ok/products/${productId||''}" 
         style="display:inline-block; padding:8px 20px; background:#dc2626; color:white; border-radius:6px; text-decoration:none; font-size:14px;">
        Zobacz produkt w Shopify Admin
      </a>
    </div>
  </div>
</div>`;

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Customify Alerts <alerts@lumly.pl>',
        to: ['biuro@onliner.one'],
        subject: `🛒 Cart add FAILED — ${style || '?'} ${size || ''} | ${userEmail || 'niezalogowany'}`,
        html
      })
    });

    const emailResult = await emailRes.json();

    if (!emailRes.ok) {
      console.error('❌ [CART-ALERT] Resend error:', emailResult);
      return res.status(500).json({ error: 'Email failed', details: emailResult });
    }

    console.log('✅ [CART-ALERT] Alert email sent:', emailResult.id);
    return res.status(200).json({ success: true, emailId: emailResult.id });

  } catch (err) {
    console.error('❌ [CART-ALERT] Exception:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
