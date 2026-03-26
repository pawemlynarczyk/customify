/**
 * Cron endpoint: sprawdza wpisy limit-reached:* w Vercel KV,
 * jeśli minęła ≥1h, resetuje total w usage_count do 0 i wysyła mail kredytowy.
 */

const { kv } = require('@vercel/kv');
const { Resend } = require('resend');
const { isKVConfigured } = require('../utils/vercelKVLimiter');

const EMAIL_TRACKING_BASE = 'https://customify-s56o.vercel.app';
function creditsTrackingUrl(customerId, target, type = 'credits') {
  const cidPart = customerId ? `&cid=${encodeURIComponent(customerId)}` : '';
  return `${EMAIL_TRACKING_BASE}/api/email-click?type=${type}${cidPart}&url=${encodeURIComponent(target)}`;
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

function buildEmailHtml(customerId = null) {
  const ctaHref = creditsTrackingUrl(customerId, 'https://lumly.pl/products/personalizowany-portret-w-stylu-boho');
  const galHref = creditsTrackingUrl(customerId, 'https://lumly.pl/pages/my-generations');
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
        <a href="${ctaHref}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Zacznij tworzyć →</a>
      </div>
      <p style="font-size: 15px; color: #555; line-height: 1.6; margin: 0 0 14px;">
        Zobacz swoje wcześniejsze efekty: <a href="${galHref}" style="color: #667eea; text-decoration: none; font-weight: bold;">Moje generacje</a>
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

function buildLastChanceEmailHtml(customerId = null) {
  const ctaHref = creditsTrackingUrl(customerId, 'https://lumly.pl/products/personalizowany-portret-w-stylu-boho', 'last-chance');
  const galHref = creditsTrackingUrl(customerId, 'https://lumly.pl/pages/my-generations', 'last-chance');
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 40px 30px; text-align: center;">
      <p style="color: rgba(255,255,255,0.85); margin: 0 0 12px; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">Ostatnia szansa</p>
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold; line-height: 1.3;">Dodaliśmy Ci ostatnie kredyty</h1>
    </div>
    <div style="padding: 32px 30px; background-color: #ffffff;">
      <p style="font-size: 16px; color: #333; margin: 0 0 16px; line-height: 1.6;">
        Wiesz, że wygenerowałeś już sporo obrazów — a żaden nie trafił do wydruku? 😟
      </p>
      <p style="font-size: 16px; color: #555; margin: 0 0 20px; line-height: 1.6;">
        Dajemy Ci <strong>ostatnie 4 kredyty</strong>. To naprawdę ostatnia szansa — wykorzystaj je, żeby zamówić swój portret i zobaczyć go w realu.
      </p>
      <div style="background: #fff8f8; border-left: 4px solid #e74c3c; padding: 16px 20px; border-radius: 4px; margin: 24px 0;">
        <p style="margin: 0; font-size: 15px; color: #555; line-height: 1.6;">
          💡 <strong>Wskazówka:</strong> Zamów wydruk jeszcze dzisiaj — ceny zaczynają się od 49 zł, a realizacja to tylko kilka dni.
        </p>
      </div>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${ctaHref}" style="display: inline-block; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Zacznij tworzyć →</a>
      </div>
      <p style="font-size: 15px; color: #555; line-height: 1.6; margin: 0 0 14px;">
        Wróć do swoich wcześniejszych generacji: <a href="${galHref}" style="color: #e74c3c; text-decoration: none; font-weight: bold;">Moje generacje</a>
      </p>
      <div style="margin: 32px 0 12px; text-align: left;">
        <h3 style="margin: 0 0 12px; font-size: 16px; color: #333;">Zobacz wszystkie produkty</h3>
        <a href="https://lumly.pl/collections/see_also" style="color: #e74c3c; text-decoration: none; font-weight: bold; font-size: 14px;">Przeglądaj kolekcję →</a>
      </div>
      <div style="margin: 14px 0 20px;">
        ${PRODUCT_TABLE}
      </div>
      <p style="font-size: 14px; color: #666; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; text-align: center;">
        Masz pytania? Napisz: <a href="mailto:biuro@lumly.pl" style="color: #e74c3c; text-decoration: none; font-weight: bold;">biuro@lumly.pl</a>
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

// Helper: sleep for throttling
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function sendLastChanceEmail(to, customerId = null, retryCount = 0) {
  if (!process.env.RESEND_API_KEY || !resend) {
    console.warn('⚠️ [RESET-LIMITS] Brak RESEND_API_KEY - pomijam email ostatnia szansa');
    return { success: false, error: 'RESEND_API_KEY missing' };
  }
  try {
    const result = await resend.emails.send({
      from: 'Lumly <noreply@notification.lumly.pl>',
      to,
      subject: 'Ostatnia szansa – dodaliśmy Ci ostatnie kredyty',
      html: buildLastChanceEmailHtml(customerId)
    });
    if (result.error) {
      if (result.error.statusCode === 429 && retryCount < 3) {
        const waitTime = (retryCount + 1) * 1000;
        console.warn(`⚠️ [RESET-LIMITS] Rate limit 429 (last-chance), retry ${retryCount + 1}/3 za ${waitTime}ms...`);
        await sleep(waitTime);
        return sendLastChanceEmail(to, customerId, retryCount + 1);
      }
      console.error('❌ [RESET-LIMITS] Resend error (last-chance):', result.error);
      return { success: false, error: result.error.message || JSON.stringify(result.error) };
    }
    const emailId = result.data?.id || result.id || null;
    console.log('✅ [RESET-LIMITS] Email "ostatnia szansa" wysłany:', { to, emailId });
    return { success: true, emailId };
  } catch (error) {
    if (error.statusCode === 429 && retryCount < 3) {
      const waitTime = (retryCount + 1) * 1000;
      await sleep(waitTime);
      return sendLastChanceEmail(to, customerId, retryCount + 1);
    }
    console.error('❌ [RESET-LIMITS] Błąd wysyłania emaila last-chance:', error);
    return { success: false, error: error.message };
  }
}

async function sendCreditEmail(to, customerId = null, retryCount = 0) {
  if (!process.env.RESEND_API_KEY || !resend) {
    console.warn('⚠️ [RESET-LIMITS] Brak RESEND_API_KEY - pomijam email');
    return { success: false, error: 'RESEND_API_KEY missing' };
  }

  try {
    const result = await resend.emails.send({
      from: 'Lumly <noreply@notification.lumly.pl>',
      to,
      subject: 'Dodaliśmy Ci nowe kredyty – możesz znowu generować!',
      html: buildEmailHtml(customerId)
    });

    // Resend może zwrócić error w result zamiast rzucić exception
    if (result.error) {
      // Rate limit - retry z backoff
      if (result.error.statusCode === 429 && retryCount < 3) {
        const waitTime = (retryCount + 1) * 1000; // 1s, 2s, 3s
        console.warn(`⚠️ [RESET-LIMITS] Rate limit 429, retry ${retryCount + 1}/3 za ${waitTime}ms...`);
        await sleep(waitTime);
        return sendCreditEmail(to, customerId, retryCount + 1);
      }
      console.error('❌ [RESET-LIMITS] Resend error:', result.error);
      return { success: false, error: result.error.message || JSON.stringify(result.error) };
    }

    const emailId = result.data?.id || result.id || null;
    console.log('✅ [RESET-LIMITS] Email wysłany:', { to, emailId });
    return { success: true, emailId };
  } catch (error) {
    // Rate limit w exception - retry z backoff
    if (error.statusCode === 429 && retryCount < 3) {
      const waitTime = (retryCount + 1) * 1000;
      console.warn(`⚠️ [RESET-LIMITS] Rate limit 429 (exception), retry ${retryCount + 1}/3 za ${waitTime}ms...`);
      await sleep(waitTime);
      return sendCreditEmail(to, customerId, retryCount + 1);
    }
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

async function updateUsageToZero(shopDomain, accessToken, customerId, metafieldId, currentType) {
  // ✅ OBSŁUGA DWÓCH TYPÓW: number_integer (stary) i json (nowy)
  let value, type;
  
  if (currentType === 'number_integer') {
    // STARY FORMAT: Shopify nie pozwala zmienić typu - użyj number_integer
    value = '0'; // String zero dla number_integer
    type = 'number_integer';
    console.log(`🔄 [RESET-LIMITS] Reset STARY FORMAT (number_integer) dla ${customerId}`);
  } else {
    // NOWY FORMAT: JSON
    value = JSON.stringify({ total: 0 });
    type = 'json';
    console.log(`🔄 [RESET-LIMITS] Reset NOWY FORMAT (json) dla ${customerId}`);
  }

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
              type: type,
              value: value
            }
          ]
        }
      }
    })
  });

  const data = await resp.json();
  const errors = data?.data?.customerUpdate?.userErrors;
  if (errors && errors.length > 0) {
    console.error(`❌ [RESET-LIMITS] Błąd resetu dla ${customerId}:`, errors);
    throw new Error(JSON.stringify(errors));
  }
  
  console.log(`✅ [RESET-LIMITS] Reset pomyślny dla ${customerId} (typ: ${type})`);
}

const handler = async (req, res) => {
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
  const cooldownMs = 60 * 60 * 1000; // 1h (pierwsze doładowanie)
  const cooldownSecondMs = 24 * 60 * 60 * 1000; // 24h (drugie doładowanie)
  
  // Parametr force=1 ignoruje cooldown (do ręcznego wymuszenia wysyłki)
  const forceMode = req.query?.force === '1' || req.query?.force === 'true';
  if (forceMode) {
    console.log('⚡ [RESET-LIMITS] FORCE MODE - ignoruję cooldown 1h');
  }

  try {
    const keys = await kv.keys('limit-reached:*');
    const secondKeys = await kv.keys('limit-reached-second:*');
    const thirdKeys = await kv.keys('limit-reached-third:*');
    console.log('🔍 [RESET-LIMITS] Sprawdzam wpisy KV:', {
      firstQueue: keys.length,
      secondQueue: secondKeys.length,
      thirdQueue: thirdKeys.length,
      forceMode: !!forceMode
    });

    let processed = 0;
    let resetCount = 0;
    let secondResetCount = 0;
    let thirdResetCount = 0;
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
        if (!forceMode && now - ts < cooldownMs) {
          continue; // jeszcze nie minęła godzina (chyba że force mode)
        }

        const customerId = key.replace('limit-reached:', '');
        // Kredyty można dodać tylko raz – jeśli już były doładowane, pomijamy
        if (isKVConfigured()) {
          const alreadyRefilled = await kv.get(`credits-refilled:${customerId}`);
          if (alreadyRefilled) {
            console.log('⏭️ [RESET-LIMITS] Pomijam – kredyty już były dodane raz:', customerId);
            await kv.del(key);
            continue;
          }
        }

        const customer = await getUsageData(shopDomain, accessToken, customerId);
        const email = customer?.email;
        const metafieldId = customer?.metafield?.id || null;
        const currentType = customer?.metafield?.type || 'json'; // Domyślnie json dla nowych

        // Reset usage_count -> 0 (z odpowiednim typem)
        await updateUsageToZero(shopDomain, accessToken, customerId, metafieldId, currentType);

        // Email (tylko jeśli jest email)
        let emailSent = false;
        if (email) {
          // Throttle: 600ms między mailami (Resend limit: 2/s)
          await sleep(600);
          const emailResult = await sendCreditEmail(email, customerId);
          
          if (emailResult.success) {
            emailSent = true;
            kv.incr('email-stats:credits:sent').catch(() => {});
            
            // Zapisz informację o wysłanym mailu do KV (dla statystyk)
            if (isKVConfigured()) {
              try {
                const emailKey = `credit-email-sent:${customerId}`;
                const emailPayload = {
                  email: email,
                  customerId: customerId,
                  sentAt: new Date().toISOString(),
                  emailId: emailResult.emailId || null,
                  usageCount: payload.totalUsed || null,
                  totalLimit: payload.totalLimit || 4
                };
                await kv.set(emailKey, JSON.stringify(emailPayload), { ex: 60 * 60 * 24 * 90 }); // 90 dni TTL
                console.log('📧 [RESET-LIMITS] Zapisano informację o wysłanym mailu do KV:', { emailKey });
              } catch (kvErr) {
                console.warn('⚠️ [RESET-LIMITS] Nie udało się zapisać informacji o mailu do KV:', kvErr);
              }
            }
          } else {
            // ❌ Email się nie wysłał - NIE usuwaj wpisu, spróbuj ponownie później
            console.error('❌ [RESET-LIMITS] Email NIE wysłany, zostawiam wpis w kolejce:', { customerId, email, error: emailResult.error });
            errors.push({ key, error: `Email failed: ${emailResult.error}` });
            continue; // Przejdź do następnego wpisu, nie usuwaj tego
          }
        } else {
          // Brak emaila - traktuj jako "sukces" (nie ma komu wysłać)
          emailSent = true;
          console.warn('⚠️ [RESET-LIMITS] Brak emaila, pomijam wysyłkę', { customerId });
        }

        // Usuń wpis z kolejki TYLKO jeśli email się wysłał lub nie ma emaila
        if (emailSent) {
          if (isKVConfigured()) {
            await kv.set(`credits-refilled:${customerId}`, '1'); // tylko raz można dodać kredyty
            // Trwałe metadane doładowania (bez TTL) - źródło daty dla panelu i automatyzacji
            const refillMeta = {
              customerId,
              email: email || null,
              refilledAt: new Date().toISOString(),
              source: 'check-and-reset-limits'
            };
            await kv.set(`credits-refilled-meta:${customerId}`, JSON.stringify(refillMeta));
          }
          await kv.del(key);
          resetCount += 1;
          console.log('✅ [RESET-LIMITS] Zresetowano limity i wysłano email (pierwsze doładowanie):', { customerId, email });
        }
      } catch (errItem) {
        errors.push({ key, error: errItem.message });
        console.error('❌ [RESET-LIMITS] Błąd dla wpisu:', key, errItem);
      }
    }

    // Druga kolejka: użytkownik po 1. doładowaniu znowu dobił do limitu.
    for (const key of secondKeys) {
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
          console.warn('⚠️ [RESET-LIMITS] Brak poprawnego timestamp (2nd queue), usuwam wpis', key);
          await kv.del(key);
          continue;
        }
        if (!forceMode && now - ts < cooldownSecondMs) {
          continue; // jeszcze nie minęły 24h
        }

        const customerId = key.replace('limit-reached-second:', '');
        const hasFirstRefill = await kv.get(`credits-refilled:${customerId}`);
        if (!hasFirstRefill) {
          // zabezpieczenie: druga kolejka tylko po pierwszym doładowaniu
          await kv.del(key);
          continue;
        }
        const secondRefillDone = await kv.get(`credits-second-refilled:${customerId}`);
        if (secondRefillDone) {
          await kv.del(key);
          continue;
        }

        const customer = await getUsageData(shopDomain, accessToken, customerId);
        const email = customer?.email;
        const metafieldId = customer?.metafield?.id || null;
        const currentType = customer?.metafield?.type || 'json';

        // Drugie doładowanie: znów reset do 0 i mail
        await updateUsageToZero(shopDomain, accessToken, customerId, metafieldId, currentType);

        let emailSent = false;
        if (email) {
          await sleep(600);
          const emailResult = await sendCreditEmail(email, customerId);
          if (emailResult.success) {
            emailSent = true;
            kv.incr('email-stats:credits:sent').catch(() => {});
            if (isKVConfigured()) {
              try {
                const emailKey = `credit-email-sent:${customerId}`;
                const emailPayload = {
                  email: email,
                  customerId: customerId,
                  sentAt: new Date().toISOString(),
                  emailId: emailResult.emailId || null,
                  usageCount: payload.totalUsed || null,
                  totalLimit: payload.totalLimit || 4,
                  refillRound: 2
                };
                await kv.set(emailKey, JSON.stringify(emailPayload), { ex: 60 * 60 * 24 * 90 });
              } catch (kvErr) {
                console.warn('⚠️ [RESET-LIMITS] Nie udało się zapisać informacji o mailu 2nd refill:', kvErr);
              }
            }
          } else {
            errors.push({ key, error: `Email failed (2nd refill): ${emailResult.error}` });
            continue;
          }
        } else {
          emailSent = true;
        }

        if (emailSent) {
          if (isKVConfigured()) {
            await kv.set(`credits-second-refilled:${customerId}`, '1'); // druga szansa tylko raz
            const refillMetaRaw = await kv.get(`credits-refilled-meta:${customerId}`).catch(() => null);
            const refillMeta = typeof refillMetaRaw === 'string'
              ? (() => { try { return JSON.parse(refillMetaRaw); } catch { return {}; } })()
              : (refillMetaRaw || {});
            refillMeta.secondRefilledAt = new Date().toISOString();
            refillMeta.secondRefillSource = 'check-and-reset-limits';
            await kv.set(`credits-refilled-meta:${customerId}`, JSON.stringify(refillMeta));
          }
          await kv.del(key);
          secondResetCount += 1;
          console.log('✅ [RESET-LIMITS] Zresetowano limity i wysłano email (drugie doładowanie po 24h):', { customerId, email });
        }
      } catch (errItem) {
        errors.push({ key, error: errItem.message });
        console.error('❌ [RESET-LIMITS] Błąd dla wpisu:', key, errItem);
      }
    }

    // Trzecia kolejka: "ostatnia szansa" po 7 dniach od 3. dojścia do limitu.
    const cooldownThirdMs = 7 * 24 * 60 * 60 * 1000; // 7 dni
    for (const key of thirdKeys) {
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
          console.warn('⚠️ [RESET-LIMITS] Brak poprawnego timestamp (3rd queue), usuwam wpis', key);
          await kv.del(key);
          continue;
        }
        if (!forceMode && now - ts < cooldownThirdMs) {
          continue; // jeszcze nie minęło 7 dni
        }

        const customerId = key.replace('limit-reached-third:', '');

        // Zabezpieczenie: wymagaj żeby 1. i 2. doładowanie było zrobione
        const hasFirstRefill = await kv.get(`credits-refilled:${customerId}`);
        const hasSecondRefill = await kv.get(`credits-second-refilled:${customerId}`);
        if (!hasFirstRefill || !hasSecondRefill) {
          await kv.del(key);
          continue;
        }

        const thirdRefillDone = await kv.get(`credits-third-refilled:${customerId}`);
        if (thirdRefillDone) {
          await kv.del(key);
          continue;
        }

        const customer = await getUsageData(shopDomain, accessToken, customerId);
        const email = customer?.email;
        const metafieldId = customer?.metafield?.id || null;
        const currentType = customer?.metafield?.type || 'json';

        await updateUsageToZero(shopDomain, accessToken, customerId, metafieldId, currentType);

        let emailSent = false;
        if (email) {
          await sleep(600);
          const emailResult = await sendLastChanceEmail(email, customerId);
          if (emailResult.success) {
            emailSent = true;
            kv.incr('email-stats:credits:sent').catch(() => {});
            if (isKVConfigured()) {
              try {
                const emailKey = `credit-email-sent:${customerId}`;
                const emailPayload = {
                  email,
                  customerId,
                  sentAt: new Date().toISOString(),
                  emailId: emailResult.emailId || null,
                  usageCount: payload.totalUsed || null,
                  totalLimit: payload.totalLimit || 4,
                  refillRound: 3
                };
                await kv.set(emailKey, JSON.stringify(emailPayload), { ex: 60 * 60 * 24 * 90 });
              } catch (kvErr) {
                console.warn('⚠️ [RESET-LIMITS] Nie udało się zapisać info o mailu 3rd refill:', kvErr);
              }
            }
          } else {
            errors.push({ key, error: `Email failed (3rd refill): ${emailResult.error}` });
            continue;
          }
        } else {
          emailSent = true;
        }

        if (emailSent) {
          if (isKVConfigured()) {
            await kv.set(`credits-third-refilled:${customerId}`, '1');
            const refillMetaRaw = await kv.get(`credits-refilled-meta:${customerId}`).catch(() => null);
            const refillMeta = typeof refillMetaRaw === 'string'
              ? (() => { try { return JSON.parse(refillMetaRaw); } catch { return {}; } })()
              : (refillMetaRaw || {});
            refillMeta.thirdRefilledAt = new Date().toISOString();
            refillMeta.thirdRefillSource = 'check-and-reset-limits';
            await kv.set(`credits-refilled-meta:${customerId}`, JSON.stringify(refillMeta));
          }
          await kv.del(key);
          thirdResetCount += 1;
          console.log('✅ [RESET-LIMITS] Zresetowano limity i wysłano email (trzecie doładowanie - ostatnia szansa):', { customerId, email });
        }
      } catch (errItem) {
        errors.push({ key, error: errItem.message });
        console.error('❌ [RESET-LIMITS] Błąd dla wpisu (3rd queue):', key, errItem);
      }
    }

    return res.status(200).json({
      success: true,
      processed,
      resetCount,
      secondResetCount,
      thirdResetCount,
      errors
    });
  } catch (error) {
    console.error('❌ [RESET-LIMITS] Błąd główny:', error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = handler;
module.exports.updateUsageToZero = updateUsageToZero;
module.exports.getUsageData = getUsageData;
module.exports.sendCreditEmail = sendCreditEmail;

