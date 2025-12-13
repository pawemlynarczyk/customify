/**
 * Cron endpoint: sprawdza wpisy limit-reached:* w Vercel KV,
 * jeśli minęła ≥1h, resetuje total w usage_count do 0 i wysyła mail kredytowy.
 */

const { kv } = require('@vercel/kv');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const PRODUCTS = [
  {
    title: 'Obraz ze zdjęcia karykatura na zamówienie',
    href: 'https://lumly.pl/products/karykatura-prezent-na-rocznice-prezent-ze-zdjecia',
    img: 'https://lumly.pl/cdn/shop/files/Screenshot_2025-10-28_at_13.29.18.png?v=1764960222&width=600'
  },
  {
    title: 'Portret królowej - obraz na płótnie z Twojego zdjęcia',
    href: 'https://lumly.pl/products/krol-i-krolowa-portrety-krolewskie',
    img: 'https://lumly.pl/cdn/shop/files/fotoobraznaplotnieztwoimzdjeciemkrolowa_7.jpg?v=1761819184&width=600'
  },
  {
    title: 'Świąteczny Nastrój - Obraz ze zdjęcia',
    href: 'https://lumly.pl/products/obraz-ze-zdjecia-swiateczny-nastroj',
    img: 'https://lumly.pl/cdn/shop/files/swieta_1.png?v=1765493716&width=600'
  },
  {
    title: 'Obraz ze zdjęcia Akwarela. Prezent dla niej dla Niego',
    href: 'https://lumly.pl/products/obraz-ze-zdjecia-akwarela',
    img: 'https://lumly.pl/cdn/shop/files/watercolor_1_1.jpg?v=1765479201&width=600'
  },
  {
    title: 'Król - personalizowany portret ze zdjecia',
    href: 'https://lumly.pl/products/krol-portret-personalizowany',
    img: 'https://lumly.pl/cdn/shop/files/krol_obraz_na_plotnie_z_twoim_zdjeciem_1.jpg?v=1761817120&width=600'
  },
  {
    title: 'Obraz ze zdjęcia portret pary królewskiej. Prezent na rocznice',
    href: 'https://lumly.pl/products/portret-pary-z-okazji-rocznicy-z-twojego-zdjecia',
    img: 'https://lumly.pl/cdn/shop/files/Screenshot_2025-11-28_at_00.50.59.png?v=1764287511&width=600'
  },
  {
    title: 'Karykatura ze zdjęcia - Prezent dla Niego dla Niej',
    href: 'https://lumly.pl/products/karykatura-z-twojego-zdjecia-obraz',
    img: 'https://lumly.pl/cdn/shop/files/aaaaaa.jpg?v=1762346383&width=600'
  },
  {
    title: 'Portret minimalistyczny ze zdjęcia - prezent dla niego dla niej',
    href: 'https://lumly.pl/products/personalizowany-portret-w-stylu-boho',
    img: 'https://lumly.pl/cdn/shop/files/w_rece_bez_ramy_d6f06d22-9697-4b0a-b247-c024515a036d.jpg?v=1764089438&width=600'
  },
  {
    title: 'Królewski portret Twojego Kota - Wydruk',
    href: 'https://lumly.pl/products/koty-krolewskie-zwierzeta-w-koronach',
    img: 'https://lumly.pl/cdn/shop/files/portert_kota_na_plotnie_krolewski_1.jpg?v=1761823550&width=600'
  },
  {
    title: 'Obraz ze zdjęcia w stylu Ghibli',
    href: 'https://lumly.pl/products/zdjecie-w-stylu-anime-personalizowane-z-twojego-zdjecia-obraz',
    img: 'https://lumly.pl/cdn/shop/files/ai-Obrazzezdj-pixar-45612036.webp?v=1761745614&width=600'
  }
];

const PRODUCT_TABLE = (() => {
  const rows = [];
  for (let i = 0; i < PRODUCTS.length; i += 3) {
    const cols = PRODUCTS.slice(i, i + 3).map(p => `
      <td style="width: 33%; padding: 6px; vertical-align: top;">
        <a href="${p.href}" style="text-decoration: none; color: #333; display: block; border: 1px solid #eee; border-radius: 8px; overflow: hidden; background: #fafafa;">
          <img src="${p.img}" alt="${p.title}" style="width: 100%; height: auto; display: block; background: #eaeaea;">
          <div style="padding: 8px 10px; font-size: 13px; line-height: 1.4; color: #333;">${p.title}</div>
        </a>
      </td>
    `).join('');
    rows.push(`<tr>${cols}</tr>`);
  }
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
      ${rows.join('')}
    </table>
  `;
})();

function buildEmailHtml() {
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
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Dodaliśmy nowe kredyty</h1>
    </div>
    <div style="padding: 32px 30px; background-color: #ffffff;">
      <p style="font-size: 16px; color: #333; margin: 0 0 20px;">
        Właśnie dodaliśmy do Twojego konta nowe kredyty. Masz ponownie <strong>4 kredyty</strong> i możesz dalej tworzyć obrazy.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="https://lumly.pl/products/personalizowany-portret-w-stylu-boho" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Zacznij tworzyć →</a>
      </div>
      <p style="font-size: 15px; color: #555; line-height: 1.6; margin: 0 0 14px;">
        Zobacz swoje wcześniejsze efekty: <a href="https://lumly.pl/pages/my-generations" style="color: #667eea; text-decoration: none; font-weight: bold;">Moje generacje</a>
      </p>

      <div style="margin: 32px 0 12px; text-align: left;">
        <h3 style="margin: 0 0 12px; font-size: 16px; color: #333;">Zobacz wszystkie produkty</h3>
        <a href="https://lumly.pl/collections/see_also" style="color: #667eea; text-decoration: none; font-weight: bold; font-size: 14px;">Przeglądaj kolekcję →</a>
      </div>

      <div style="margin: 14px 0 20px;">
        ${PRODUCT_TABLE}
      </div>

      <p style="font-size: 14px; color: #666; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; text-align: center;">
        Masz pytania? Napisz: <a href="mailto:biuro@lumly.pl" style="color: #667eea; text-decoration: none; font-weight: bold;">biuro@lumly.pl</a>
      </p>
    </div>
    <div style="background-color: #f9f9f9; padding: 18px 30px; text-align: center; border-top: 1px solid #eee;">
      <p style="margin: 0; font-size: 12px; color: #999;">© 2025 Lumly.pl - Personalizowane portrety AI</p>
    </div>
  </div>
</body>
</html>
`;
}

async function sendCreditEmail(to) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ [RESET-LIMITS] Brak RESEND_API_KEY - pomijam email');
    return { success: false, error: 'RESEND_API_KEY missing' };
  }

  try {
    const result = await resend.emails.send({
      from: 'Lumly <noreply@notification.lumly.pl>',
      to,
      subject: 'Dodaliśmy Ci nowe kredyty – możesz znowu generować!',
      html: buildEmailHtml()
    });

    const emailId = result.data?.id || result.id || null;
    console.log('✅ [RESET-LIMITS] Email wysłany:', { to, emailId });
    return { success: true, emailId };
  } catch (error) {
    console.error('❌ [RESET-LIMITS] Błąd wysyłania emaila:', error);
    return { success: false, error: error.message };
  }
}

async function getUsageData(shopDomain, accessToken, customerId) {
  const getQuery = `
    query getCustomerUsage($id: ID!) {
      customer(id: $id) {
        id
        email
        metafield(namespace: "customify", key: "usage_count") {
          id
          value
          type
        }
      }
    }
  `;

  const resp = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({
      query: getQuery,
      variables: { id: `gid://shopify/Customer/${customerId}` }
    })
  });

  const data = await resp.json();
  return data?.data?.customer;
}

async function updateUsageToZero(shopDomain, accessToken, customerId, metafieldId) {
  const usageJson = { total: 0 };
  const value = JSON.stringify(usageJson);

  const mutation = `
    mutation updateCustomerUsage($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer { id }
        userErrors { field message }
      }
    }
  `;

  const resp = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        input: {
          id: `gid://shopify/Customer/${customerId}`,
          metafields: [
            {
              id: metafieldId || undefined,
              namespace: 'customify',
              key: 'usage_count',
              type: 'json',
              value
            }
          ]
        }
      }
    })
  });

  const data = await resp.json();
  const errors = data?.data?.customerUpdate?.userErrors;
  if (errors && errors.length > 0) {
    throw new Error(JSON.stringify(errors));
  }
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(500).json({ error: 'SHOPIFY_ACCESS_TOKEN not configured' });
  }

  const now = Date.now();
  const cooldownMs = 60 * 60 * 1000; // 1h

  try {
    const keys = await kv.keys('limit-reached:*');
    console.log('🔍 [RESET-LIMITS] Sprawdzam wpisy KV:', keys.length);

    let processed = 0;
    let resetCount = 0;
    const errors = [];

    for (const key of keys) {
      processed += 1;
      try {
        const raw = await kv.get(key);
        if (!raw) {
          await kv.del(key);
          continue;
        }
        let payload;
        try {
          payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch {
          payload = raw;
        }
        const ts = payload?.timestamp ? Date.parse(payload.timestamp) : null;
        if (!ts || Number.isNaN(ts)) {
          console.warn('⚠️ [RESET-LIMITS] Brak poprawnego timestamp, usuwam wpis', key);
          await kv.del(key);
          continue;
        }
        if (now - ts < cooldownMs) {
          continue; // jeszcze nie minęła godzina
        }

        const customerId = key.replace('limit-reached:', '');
        const customer = await getUsageData(shopDomain, accessToken, customerId);
        const email = customer?.email;
        const metafieldId = customer?.metafield?.id || null;

        // Reset usage_count -> total:0
        await updateUsageToZero(shopDomain, accessToken, customerId, metafieldId);

        // Email (tylko jeśli jest email)
        if (email) {
          await sendCreditEmail(email);
        } else {
          console.warn('⚠️ [RESET-LIMITS] Brak emaila, pomijam wysyłkę', { customerId });
        }

        // Usuń wpis z kolejki
        await kv.del(key);
        resetCount += 1;
        console.log('✅ [RESET-LIMITS] Zresetowano limity i wysłano (lub pominięto) email:', { customerId, email });
      } catch (errItem) {
        errors.push({ key, error: errItem.message });
        console.error('❌ [RESET-LIMITS] Błąd dla wpisu:', key, errItem);
      }
    }

    return res.status(200).json({
      success: true,
      processed,
      resetCount,
      errors
    });
  } catch (error) {
    console.error('❌ [RESET-LIMITS] Błąd główny:', error);
    return res.status(500).json({ error: error.message });
  }
};

