// api/credits/use.js
// Odlicza 1 kredyt i wysyła email z plikiem do pobrania (bez watermarku)
// Atomiczne odliczenie przez Vercel KV lock

const { kv } = require('@vercel/kv');
const { Resend } = require('resend');
const { SHOPIFY_API_VERSION } = require('../../utils/shopifyConfig');

const CORS_ORIGINS = [
  'https://lumly.pl',
  'https://customify-s56o.vercel.app',
  'http://localhost:3000'
];

const SHOP_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (CORS_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Pobierz aktualne saldo kredytów klienta (i metafield ID do update)
async function getCustomerData(customerId) {
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  const query = `
    query getCredits($id: ID!) {
      customer(id: $id) {
        id
        email
        firstName
        metafield(namespace: "customify", key: "credits") {
          id
          value
          type
        }
      }
    }
  `;

  const response = await fetch(`https://${SHOP_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({
      query,
      variables: { id: `gid://shopify/Customer/${customerId}` }
    })
  });

  const data = await response.json();
  if (data.errors) throw new Error('GraphQL error: ' + JSON.stringify(data.errors));

  const customer = data.data?.customer;
  if (!customer) throw new Error('Customer not found');

  const credits = parseInt(customer.metafield?.value || '0', 10) || 0;
  const metafieldId = customer.metafield?.id || null;

  return { email: customer.email, firstName: customer.firstName, credits, metafieldId };
}

// Zaktualizuj liczbę kredytów klienta
async function setCustomerCredits(customerId, newCredits, existingMetafieldId) {
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (existingMetafieldId) {
    // Update istniejącego metafield
    const mutation = `
      mutation updateMetafield($input: MetafieldsSetInput!) {
        metafieldsSet(metafields: [$input]) {
          metafields { id value }
          userErrors { field message }
        }
      }
    `;
    const response = await fetch(`https://${SHOP_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            ownerId: `gid://shopify/Customer/${customerId}`,
            namespace: 'customify',
            key: 'credits',
            value: String(newCredits),
            type: 'number_integer'
          }
        }
      })
    });
    const data = await response.json();
    if (data.errors || data.data?.metafieldsSet?.userErrors?.length > 0) {
      throw new Error('Failed to update credits metafield: ' + JSON.stringify(data.errors || data.data?.metafieldsSet?.userErrors));
    }
  } else {
    // Utwórz nowy metafield
    const mutation = `
      mutation createMetafield($input: MetafieldsSetInput!) {
        metafieldsSet(metafields: [$input]) {
          metafields { id value }
          userErrors { field message }
        }
      }
    `;
    const response = await fetch(`https://${SHOP_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            ownerId: `gid://shopify/Customer/${customerId}`,
            namespace: 'customify',
            key: 'credits',
            value: String(newCredits),
            type: 'number_integer'
          }
        }
      })
    });
    const data = await response.json();
    if (data.errors || data.data?.metafieldsSet?.userErrors?.length > 0) {
      throw new Error('Failed to create credits metafield: ' + JSON.stringify(data.errors || data.data?.metafieldsSet?.userErrors));
    }
  }
}

const STYLE_NAMES = {
  'minimalistyczny': 'Minimalistyczny',
  'realistyczny': 'Realistyczny',
  'karykatura': 'Karykatura',
  'krol-krolewski': 'Król – Królewski',
  'krolewski': 'Królewski',
  'barokowy': 'Barokowy',
  'renesansowy': 'Renesansowy',
  'wiktorianski': 'Wiktoriański',
  'wojenny': 'Wojenny',
  'na-tronie': 'Na tronie',
  'pixar': 'Pixar',
  'pop-art': 'Pop Art',
  'akwarela': 'Akwarela',
  'caricature-new': 'Karykatura',
};

// Wysyłka emaila z linkiem do pobrania (przez Resend)
async function sendDownloadEmail({ email, firstName, imageUrl, style }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const styleName = STYLE_NAMES[style] || style || 'AI';

  const html = `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        
        <tr>
          <td style="background:#1a1a1a;padding:32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:1px;">✨ Lumly</h1>
            <p style="color:#aaa;margin:8px 0 0;font-size:14px;">Twój spersonalizowany portret AI</p>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 32px;">
            <h2 style="color:#1a1a1a;margin:0 0 16px;font-size:22px;">Twój plik jest gotowy do pobrania!</h2>
            <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 24px;">
              Cześć ${firstName || 'Kliencie'},<br><br>
              Twój spersonalizowany portret w stylu <strong>${styleName}</strong> jest gotowy. 
              Kliknij przycisk poniżej, aby pobrać plik w wysokiej rozdzielczości (bez znaku wodnego).
            </p>

            <div style="text-align:center;margin:32px 0;">
              <a href="${imageUrl}" 
                 style="background:#1a1a1a;color:#fff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:600;display:inline-block;">
                📥 Pobierz plik
              </a>
            </div>

            <div style="background:#f9f9f9;border-radius:8px;padding:20px;margin:24px 0;">
              <p style="color:#333;font-size:14px;margin:0 0 8px;font-weight:600;">Szczegóły:</p>
              <p style="color:#666;font-size:14px;margin:0;line-height:1.8;">
                Styl: ${styleName}<br>
                Format: JPEG / PNG<br>
                Rozdzielczość: wysoka (gotowa do druku)<br>
                Link ważny: 1 rok
              </p>
            </div>

            <p style="color:#888;font-size:13px;line-height:1.6;margin:0;">
              Jeśli przycisk nie działa, skopiuj i wklej ten link w przeglądarce:<br>
              <a href="${imageUrl}" style="color:#1a1a1a;word-break:break-all;">${imageUrl}</a>
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#f5f5f5;padding:24px 32px;border-top:1px solid #eee;text-align:center;">
            <p style="color:#aaa;font-size:12px;margin:0;">
              Lumly – personalizowane portrety AI<br>
              <a href="https://lumly.pl" style="color:#888;">lumly.pl</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const result = await resend.emails.send({
    from: 'Lumly <noreply@notification.lumly.pl>',
    to: email,
    subject: `Twój portret AI gotowy do pobrania – styl ${styleName} 🎨`,
    html
  });

  return result;
}

module.exports = async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { customerId, imageUrl, style } = req.body;

  if (!customerId) {
    return res.status(401).json({ error: 'Musisz być zalogowany, żeby użyć kredytów.' });
  }
  if (!imageUrl) {
    return res.status(400).json({ error: 'Brak URL obrazu (imageUrl).' });
  }
  if (!process.env.SHOPIFY_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'Shopify not configured' });
  }
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  // Weryfikacja: imageUrl musi być z Vercel Blob (ochrona przed podrabianiem)
  const ALLOWED_URL_PREFIXES = [
    'https://vzwqqb14qtsxe2wx.public.blob.vercel-storage.com/',
    'https://customify-s56o.vercel.app/'
  ];
  const isAllowedUrl = ALLOWED_URL_PREFIXES.some(prefix => imageUrl.startsWith(prefix));
  if (!isAllowedUrl) {
    console.warn(`⚠️ [CREDITS/USE] Suspicious imageUrl from customer ${customerId}: ${imageUrl.substring(0, 60)}`);
    return res.status(400).json({ error: 'Nieprawidłowy URL obrazu.' });
  }

  // Atomyczny lock (zapobiega podwójnemu odliczeniu przy równoczesnych requestach)
  const lockKey = `credits:lock:${customerId}`;
  const lockAcquired = await kv.set(lockKey, '1', { nx: true, ex: 10 }); // 10 sekund lock

  if (!lockAcquired) {
    return res.status(429).json({
      error: 'Trwa przetwarzanie poprzedniego żądania. Spróbuj za chwilę.'
    });
  }

  try {
    // Pobierz aktualne dane klienta
    const { email, firstName, credits, metafieldId } = await getCustomerData(customerId);

    console.log(`💳 [CREDITS/USE] Customer ${customerId} (${email}) has ${credits} credits`);

    if (credits <= 0) {
      return res.status(402).json({
        error: 'Nie masz wystarczającej liczby kredytów.',
        credits: 0
      });
    }

    // Odlicz 1 kredyt
    const newCredits = credits - 1;
    await setCustomerCredits(customerId, newCredits, metafieldId);

    console.log(`✅ [CREDITS/USE] Credit deducted. Customer ${customerId}: ${credits} → ${newCredits}`);

    // Wyślij email z linkiem do pobrania
    try {
      await sendDownloadEmail({ email, firstName, imageUrl, style });
      console.log(`📧 [CREDITS/USE] Download email sent to ${email}`);
    } catch (emailError) {
      console.error('❌ [CREDITS/USE] Email failed (non-fatal, credits already deducted):', emailError);
      // Nie rollback kredytu - email mógł dotrzeć mimo błędu, lub user ma URL
    }

    // Zaloguj użycie w KV (statystyki)
    try {
      const day = new Date().toISOString().slice(0, 10);
      await kv.incr(`credits:stats:used:${day}`);
      await kv.incr('credits:stats:used:total');
    } catch (statsError) {
      console.warn('⚠️ [CREDITS/USE] Stats update failed (non-fatal):', statsError.message);
    }

    return res.json({
      success: true,
      creditsRemaining: newCredits,
      emailSent: true,
      message: `Email z plikiem wysłany na ${email}. Pozostało kredytów: ${newCredits}.`
    });

  } catch (error) {
    console.error('❌ [CREDITS/USE] Error:', error);
    return res.status(500).json({ error: 'Błąd podczas przetwarzania. Spróbuj ponownie.' });
  } finally {
    // Zawsze zwolnij lock
    await kv.del(lockKey);
  }
};
