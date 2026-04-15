// api/send-bulk-generation-emails.js
/**
 * API endpoint do masowej wysyłki emaili z generacjami
 * POST: { customers: [{ email, customerId }], testEmail?: string }
 */

const { Resend } = require('resend');
const { SHOPIFY_API_VERSION } = require('../utils/shopifyConfig');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Funkcja pomocnicza do pobierania produktów z kolekcji (obsługuje handle lub ID)
  async function getCollectionProducts(collectionHandleOrId) {
    try {
      const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
      const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

      if (!accessToken) {
        console.warn('⚠️ [BULK-EMAIL] SHOPIFY_ACCESS_TOKEN not configured, skipping collection products');
        return [];
      }

      // Sprawdź czy to ID (tylko cyfry) czy handle (string)
      const isId = /^\d+$/.test(collectionHandleOrId);
      let query, variables;

      if (isId) {
        // Użyj ID (np. 672196395333)
        const gid = `gid://shopify/Collection/${collectionHandleOrId}`;
        query = `
          query getCollectionProducts($id: ID!) {
            collection(id: $id) {
              id
              title
              handle
              products(first: 50) {
                edges {
                  node {
                    id
                    title
                    handle
                    onlineStoreUrl
                    featuredImage {
                      url(transform: { maxWidth: 600, maxHeight: 600 })
                    }
                  }
                }
              }
            }
          }
        `;
        variables = { id: gid };
      } else {
        // Użyj handle (np. "walentynki")
        query = `
          query getCollectionProducts($handle: String!) {
            collectionByHandle(handle: $handle) {
              id
              title
              handle
              products(first: 50) {
                edges {
                  node {
                    id
                    title
                    handle
                    onlineStoreUrl
                    featuredImage {
                      url(transform: { maxWidth: 600, maxHeight: 600 })
                    }
                  }
                }
              }
            }
          }
        `;
        variables = { handle: collectionHandleOrId };
      }

      const response = await fetch(`https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        },
        body: JSON.stringify({
          query,
          variables
        })
      });

      if (!response.ok) {
        console.warn(`⚠️ [BULK-EMAIL] Failed to fetch collection ${collectionHandleOrId}`);
        return [];
      }

      const data = await response.json();

      // Obsługa zarówno collectionByHandle jak i collection (ID)
      const collection = data?.data?.collectionByHandle || data?.data?.collection;

      if (data.errors || !collection) {
        console.warn(`⚠️ [BULK-EMAIL] Collection ${collectionHandleOrId} not found`);
        return [];
      }
      const products = collection.products.edges
        .map(edge => {
          const product = edge.node;
          return {
            title: product.title,
            handle: product.handle,
            href: product.onlineStoreUrl || `https://lumly.pl/products/${product.handle}`,
            img: product.featuredImage?.url || null
          };
        })
        .filter(product => product.img); // Tylko produkty z obrazkiem

      console.log(`✅ [BULK-EMAIL] Pobrano ${products.length} produktów z kolekcji "${collection.title}"`);
      return products;
    } catch (error) {
      console.error(`❌ [BULK-EMAIL] Error fetching collection products:`, error);
      return [];
    }
  }

  // Funkcja do generowania template Dnia Kobiet
  function generateDzienKobietTemplate(products) {
    const productRows = [];
    for (let i = 0; i < products.length; i += 3) {
      const rowItems = products.slice(i, i + 3);
      const tds = rowItems.map(item => `
        <td style="width: 33.33%; padding: 8px; vertical-align: top;">
          <a href="${item.href}" style="text-decoration: none; color: #333; display: block; border: 2px solid #f3e5f5; border-radius: 10px; overflow: hidden; background: #fff;">
            <img src="${item.img}" alt="${item.title}" style="width: 100%; height: auto; display: block; background: #f3e5f5;">
            <div style="padding: 12px; font-size: 14px; line-height: 1.4; color: #333; text-align: center; font-weight: 500;">${item.title}</div>
          </a>
        </td>
      `).join('');
      productRows.push(`<tr>${tds}</tr>`);
    }

    const productTable = productRows.length > 0 ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin: 20px 0;">
        ${productRows.join('')}
      </table>
    ` : '';

    const heroUrl = 'https://vzwqqb14qtsxe2wx.public.blob.vercel-storage.com/customify/mailing/dzien-kobiet-hero.png';
    return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dzień Kobiet – Lumly</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px; overflow: hidden; max-width: 600px;">
          <!-- TOP BAR -->
          <tr>
            <td style="padding: 12px 20px; text-align: center; background: #fafafa; font-size: 14px; color: #333;">
              🎁 Pomysł na prezent na Dzień Kobiet • Dostawa przed 8 marca
            </td>
          </tr>
          <!-- HERO IMAGE -->
          <tr>
            <td>
              <a href="https://lumly.pl/collections/dzien-kobiet" style="display: block;">
                <img src="${heroUrl}" alt="Dzień Kobiet - Portret ze zdjęcia" width="600" style="display: block; width: 100%; max-width: 600px; height: auto;">
              </a>
            </td>
          </tr>
          <!-- HEADLINE -->
          <tr>
            <td style="padding: 24px 40px 16px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; color: #222; font-weight: bold;">
                Zamień zdjęcie w wyjątkowy portret
              </h1>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td align="center" style="padding: 0 40px 24px 40px;">
              <a href="https://lumly.pl/collections/dzien-kobiet" style="display: inline-block; padding: 16px 34px; font-size: 18px; color: #ffffff; text-decoration: none; border-radius: 30px; background: linear-gradient(90deg, #a44cff, #ff2f6d); font-weight: bold;">
                Stwórz portret ze zdjęcia
              </a>
              <p style="margin: 12px 0 0; font-size: 14px; color: #777;">
                Od 99 zł • Dostawa 3 dni
              </p>
            </td>
          </tr>
      ${products.length > 0 ? `
          <tr>
            <td style="padding: 20px 30px 24px 30px; background-color: #ffffff;">
              <h2 style="margin: 0 0 16px; font-size: 22px; color: #333; text-align: center;">
                🌸 Nasze propozycje na Dzień Kobiet
              </h2>
              ${productTable}
              <div style="text-align: center; margin: 20px 0 0;">
                <a href="https://lumly.pl/collections/dzien-kobiet" style="color: #9b59b6; text-decoration: none; font-weight: bold; font-size: 16px; border-bottom: 2px solid #9b59b6; padding-bottom: 2px;">
                  Zobacz wszystkie produkty na Dzień Kobiet →
                </a>
              </div>
            </td>
          </tr>
      ` : ''}
          <tr>
            <td style="background: linear-gradient(135deg, #fdf5f8 0%, #f3e5f5 100%); padding: 25px 30px; text-align: center; border-top: 1px solid #f3e5f5;">
              <p style="margin: 0 0 10px; font-size: 12px; color: #999;">
                © 2025 Lumly.pl - Personalizowane portrety AI
              </p>
              <p style="margin: 0; font-size: 11px; color: #bbb;">
                <a href="#" style="color: #999; text-decoration: underline;">Wypisz się z newslettera</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  // Funkcja do generowania template walentynkowego
  function generateValentineTemplate(products) {
    // Zbuduj wiersze produktów po 3 kolumny
    const productRows = [];
    for (let i = 0; i < products.length; i += 3) {
      const rowItems = products.slice(i, i + 3);
      const tds = rowItems.map(item => `
        <td style="width: 33.33%; padding: 8px; vertical-align: top;">
          <a href="${item.href}" style="text-decoration: none; color: #333; display: block; border: 2px solid #ffe0e8; border-radius: 10px; overflow: hidden; background: #fff;">
            <img src="${item.img}" alt="${item.title}" style="width: 100%; height: auto; display: block; background: #ffe0e8;">
            <div style="padding: 12px; font-size: 14px; line-height: 1.4; color: #333; text-align: center; font-weight: 500;">${item.title}</div>
          </a>
        </td>
      `).join('');
      productRows.push(`<tr>${tds}</tr>`);
    }

    const productTable = productRows.length > 0 ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin: 20px 0;">
        ${productRows.join('')}
      </table>
    ` : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #fff5f8;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); padding: 50px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
        Obraz z waszego zdjęcia
      </h1>
      <p style="color: white; margin: 15px 0 0; font-size: 18px; opacity: 0.95;">
        Stwórz wyjątkowy prezent dla ukochanej osoby
      </p>
    </div>
    <div style="padding: 40px 30px; background-color: #ffffff;">
      <p style="font-size: 18px; color: #333; margin: 0 0 20px; line-height: 1.6;">
        Cześć! 👋
      </p>
      <p style="font-size: 16px; color: #555; margin: 0 0 20px; line-height: 1.6;">
        Walentynki zbliżają się wielkimi krokami! 💝<br>
        To idealny moment, żeby stworzyć wyjątkowy prezent - <strong>personalizowany obraz ze zdjęcia</strong> w stylu AI.
      </p>
      <p style="font-size: 16px; color: #555; margin: 0 0 30px; line-height: 1.6;">
        Wybierz jeden z naszych <strong>walentynkowych stylów</strong> i stwórz niepowtarzalny portret, który zachwyci Twoją drugą połówkę! ❤️
      </p>
      <div style="text-align: center; margin: 35px 0;">
        <a href="https://lumly.pl/collections/walentynki" style="display: inline-block; background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); color: white; padding: 18px 45px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);">
          Zobacz produkty walentynkowe →
        </a>
      </div>
      ${products.length > 0 ? `
      <div style="margin: 40px 0 20px;">
        <h2 style="margin: 0 0 20px; font-size: 22px; color: #333; text-align: center;">
          💝 Nasze propozycje na Walentynki
        </h2>
        ${productTable}
        <div style="text-align: center; margin: 25px 0;">
          <a href="https://lumly.pl/collections/walentynki" style="color: #ff6b9d; text-decoration: none; font-weight: bold; font-size: 16px; border-bottom: 2px solid #ff6b9d; padding-bottom: 2px;">
            Zobacz wszystkie produkty walentynkowe →
          </a>
        </div>
      </div>
      ` : ''}
      <div style="background: #fff5f8; padding: 25px; border-radius: 10px; margin: 30px 0; border-left: 4px solid #ff6b9d;">
        <p style="font-size: 15px; color: #555; margin: 0 0 12px; line-height: 1.6;">
          <strong>💡 Dlaczego warto?</strong>
        </p>
        <ul style="font-size: 14px; color: #666; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Wyjątkowe, personalizowane prezenty</li>
          <li>Wysoka jakość wydruku na płótnie</li>
          <li>Szybka realizacja zamówienia</li>
          <li>Darmowa dostawa przy zamówieniach powyżej 200 zł</li>
        </ul>
      </div>
      <p style="font-size: 15px; color: #555; line-height: 1.6; margin: 30px 0 20px; text-align: center;">
        Zobacz swoje wcześniejsze efekty: 
        <a href="https://lumly.pl/pages/my-generations" style="color: #ff6b9d; text-decoration: none; font-weight: bold;">Moje generacje</a>
      </p>
      <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
        Masz pytania? Napisz do nas: 
        <a href="mailto:biuro@lumly.pl" style="color: #ff6b9d; text-decoration: none; font-weight: bold;">biuro@lumly.pl</a>
      </p>
    </div>
    <div style="background: linear-gradient(135deg, #fff5f8 0%, #ffe0e8 100%); padding: 25px 30px; text-align: center; border-top: 1px solid #ffe0e8;">
      <p style="margin: 0 0 10px; font-size: 12px; color: #999;">
        © 2025 Lumly.pl - Personalizowane portrety AI
      </p>
      <p style="margin: 0; font-size: 11px; color: #bbb;">
        <a href="#" style="color: #999; text-decoration: underline;">Wypisz się z newslettera</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  try {
    const { customers, testEmail, collectionHandle, templateType } = req.body;

    // Jeśli testEmail, wyślij tylko do niego (nie wymaga customers)
    if (testEmail) {
      console.log(`📧 [BULK-EMAIL] Wysyłam testowy email do: ${testEmail}`);

      const { subject: customSubject, html: customHtml } = req.body || {};
      let emailHtml = customHtml;
      let subject = customSubject;

      // Test szablonu przypomnienia 3d/7d/14d – ta sama treść co do klientów
      if ((templateType === 'reminder' || collectionHandle === 'reminder') && !customHtml) {
        const variant = req.body.reminder14d === true ? '14d' : (req.body.reminder7d === true ? '7d' : '3d');
        const headlines = { '3d': 'Twój obraz czeka – dokończ zamówienie, zanim zniknie', '7d': 'Twoja generacja wciąż na Ciebie czeka', '14d': 'Ostatnia szansa – Twój obraz czeka na zamówienie' };
        const texts = { '3d': 'Twój projekt z ostatniej generacji czeka w galerii. Zobacz go i dodaj do koszyka, gdy będziesz gotowy.', '7d': 'Nie zapomnij o swoim projekcie. Zobacz go w galerii i zamów wydruk w kilku kliknięciach.', '14d': 'Minęły już 2 tygodnie od Twojej ostatniej generacji. Zobacz projekt w galerii i zamów wydruk – to ostatnia szansa.' };
        const headline = headlines[variant];
        const text = texts[variant];
        const imgSrc = 'https://lumly.pl/cdn/shop/files/w_rece_bez_ramy_d6f06d22-9697-4b0a-b247-c024515a036d.jpg';
        const products = await getCollectionProducts('see_also');
        const productRows = [];
        for (let i = 0; i < products.length; i += 3) {
          const rowItems = products.slice(i, i + 3);
          const tds = rowItems.map(item => `<td style="width: 33.33%; padding: 8px; vertical-align: top;"><a href="${item.href}" style="text-decoration: none; color: #333; display: block; border: 2px solid #e8e8e8; border-radius: 10px; overflow: hidden; background: #fff;"><img src="${item.img}" alt="${item.title}" style="width: 100%; height: auto; display: block; background: #f5f5f5;"><div style="padding: 12px; font-size: 14px; line-height: 1.4; color: #333; text-align: center; font-weight: 500;">${item.title}</div></a></td>`).join('');
          productRows.push(`<tr>${tds}</tr>`);
        }
        const productTable = productRows.length > 0 ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin: 20px 0;">${productRows.join('')}</table>` : '';
        const productsSection = products.length > 0 ? `<div style="margin: 32px 0 12px;"><h3 style="margin: 0 0 12px; font-size: 18px; color: #333;">Zobacz nasze najnowsze produkty</h3>${productTable}<div style="text-align: center; margin: 16px 0 0;"><a href="https://lumly.pl/collections/see_also" style="color: #667eea; text-decoration: none; font-weight: bold; font-size: 14px; border-bottom: 2px solid #667eea; padding-bottom: 2px;">Przeglądaj kolekcję →</a></div></div>` : '';
        emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;"><div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;"><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;"><h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${headline}</h1></div><div style="padding: 40px 30px; background-color: #ffffff;"><p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 24px;">${text}</p><div style="text-align: center; margin: 30px 0;"><a href="https://lumly.pl/pages/my-generations" style="text-decoration: none;"><img src="${imgSrc}" alt="Twoja generacja" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" /></a></div><div style="text-align: center; margin: 40px 0;"><a href="https://lumly.pl/pages/my-generations" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Zobacz Moje generacje i zamów</a></div>${productsSection}<p style="font-size: 14px; color: #666; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; text-align: center;">Pytania? <a href="mailto:biuro@lumly.pl" style="color: #667eea; text-decoration: none; font-weight: bold;">biuro@lumly.pl</a></p></div><div style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;"><p style="margin: 0; font-size: 12px; color: #999;">© 2025 Lumly.pl - Personalizowane portrety AI</p></div></div></body></html>`;
        subject = subject || (variant === '14d' ? 'Ostatnia szansa – Twój obraz czeka na zamówienie' : (variant === '7d' ? 'Twoja generacja wciąż na Ciebie czeka' : 'Twój obraz czeka – dokończ zamówienie, zanim zniknie'));
      }

      const collectionId = req.body.collectionId;
      const collectionIdentifier = collectionId || collectionHandle;
      const usedReminder = templateType === 'reminder' || collectionHandle === 'reminder';

      if (collectionIdentifier && !customHtml && !usedReminder) {
        const products = await getCollectionProducts(collectionIdentifier);
        const isDzienKobiet = (collectionHandle === 'dzien-kobiet' || collectionIdentifier === 'dzien-kobiet');
        if (isDzienKobiet) {
          console.log(`🌸 [BULK-EMAIL] Używam template Dnia Kobiet dla kolekcji: ${collectionIdentifier}`);
          emailHtml = generateDzienKobietTemplate(products);
          subject = subject || 'Dzień Kobiet - wyjątkowy prezent dla Niej';
        } else {
          console.log(`💕 [BULK-EMAIL] Używam template walentynkowego dla kolekcji: ${collectionIdentifier}`);
          emailHtml = generateValentineTemplate(products);
          subject = subject || 'Walentynki - obraz z Waszego zdjęcia';
        }
      } else if (!customHtml) {
        // Domyślny template (stary kod)
      // Produkty do sekcji na dole maila (realne miniatury z kolekcji see_also)
      const products = [
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
      // Zbuduj wiersze po 3 kolumny (mailem-safe table layout; większość klientów nie wspiera CSS grid)
      const productRows = [];
      for (let i = 0; i < products.length; i += 3) {
        const rowItems = products.slice(i, i + 3);
        const tds = rowItems.map(item => `
          <td style="width: 33%; padding: 6px; vertical-align: top;">
            <a href="${item.href}" style="text-decoration: none; color: #333; display: block; border: 1px solid #eee; border-radius: 8px; overflow: hidden; background: #fafafa;">
              <img src="${item.img}" alt="${item.title}" style="width: 100%; height: auto; display: block; background: #eaeaea;">
              <div style="padding: 8px 10px; font-size: 13px; line-height: 1.4; color: #333;">${item.title}</div>
            </a>
          </td>
        `).join('');
        productRows.push(`<tr>${tds}</tr>`);
      }
      const productTable = `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
          ${productRows.join('')}
        </table>
      `;

      const defaultHtml = `
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
    <div style="padding: 40px 30px; background-color: #ffffff;">
      <p style="font-size: 16px; color: #333; margin: 0 0 20px;">
        Właśnie dodalismy do Twojego konta nowe kredyty. Masz ponownie <strong>4 kredyty</strong> i możesz dalej tworzyć obrazy.
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

      <!-- Miniatury w tabeli 3 kolumny (mail-safe) -->
      <div style="margin: 14px 0 20px;">
        ${productTable}
      </div>

      <p style="font-size: 14px; color: #666; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; text-align: center;">Masz pytania? Napisz: <a href="mailto:biuro@lumly.pl" style="color: #667eea; text-decoration: none; font-weight: bold;">biuro@lumly.pl</a></p>
    </div>
    <div style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
      <p style="margin: 0; font-size: 12px; color: #999;">© 2025 Lumly.pl - Personalizowane portrety AI</p>
    </div>
  </div>
</body>
</html>
      `;

        emailHtml = emailHtml || defaultHtml;
        subject = subject || '🎨 Zobacz wspaniałe obrazy, które stworzyłeś!';
      }

      const result = await resend.emails.send({
        from: 'Lumly <noreply@notification.lumly.pl>',
        reply_to: 'biuro@lumly.pl',
        to: testEmail,
        subject: subject || '🎨 Zobacz wspaniałe obrazy, które stworzyłeś!',
        html: emailHtml || defaultHtml
      });

      return res.status(200).json({
        success: true,
        testEmail: testEmail,
        emailId: result.data?.id,
        message: 'Testowy email wysłany!'
      });
    }

    // Masowa wysyłka - wymaga customers
    if (!customers || !Array.isArray(customers)) {
      return res.status(400).json({ error: 'customers array required for bulk send' });
    }
    const results = {
      sent: [],
      failed: []
    };

    console.log(`📧 [BULK-EMAIL] Rozpoczynam wysyłkę do ${customers.length} klientów...`);

    // Jeśli collectionHandle lub collectionId, pobierz produkty raz (dla wszystkich)
    const collectionId = req.body.collectionId;
    const collectionIdentifier = collectionId || collectionHandle;
    const isDzienKobiet = (collectionHandle === 'dzien-kobiet' || collectionIdentifier === 'dzien-kobiet');
    let campaignProducts = [];
    let campaignTemplate = null;
    let campaignSubject = null;
    if (collectionIdentifier) {
      console.log(`📧 [BULK-EMAIL] Pobieram produkty z kolekcji ${collectionIdentifier} dla masowej wysyłki...`);
      campaignProducts = await getCollectionProducts(collectionIdentifier);
      if (isDzienKobiet) {
        campaignTemplate = generateDzienKobietTemplate(campaignProducts);
        campaignSubject = 'Dzień Kobiet - wyjątkowy prezent dla Niej';
      } else {
        campaignTemplate = generateValentineTemplate(campaignProducts);
        campaignSubject = 'Walentynki - obraz z Waszego zdjęcia';
      }
    }

    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      const email = customer.email;

      if (!email || !email.includes('@')) {
        results.failed.push({ customer, error: 'Invalid email' });
        continue;
      }

      try {
        // Użyj template kampanii jeśli dostępny, w przeciwnym razie domyślny
        const emailHtml = collectionIdentifier && campaignTemplate
          ? campaignTemplate
          : `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Twoje obrazy z Lumly.pl czekają!</h1>
    </div>
    <div style="padding: 40px 30px; background-color: #ffffff;">
      <p style="font-size: 18px; color: #333; margin-bottom: 30px; line-height: 1.6; text-align: center;">
        Zobacz wspaniałe obrazy, które stworzyłeś! Czekają na zamówienie.
      </p>
      <div style="text-align: center; margin: 40px 0;">
        <a href="https://lumly.pl/pages/my-generations" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Zobacz obrazy →</a>
      </div>
      <p style="font-size: 14px; color: #666; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">Jeśli masz do nas jakieś pytania lub chcesz coś zmienić w obrazku, napisz do nas: <a href="mailto:biuro@lumly.pl" style="color: #667eea; text-decoration: none; font-weight: bold;">biuro@lumly.pl</a></p>
    </div>
    <div style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
      <p style="margin: 0; font-size: 12px; color: #999;">© 2025 Lumly.pl - Personalizowane portrety AI</p>
    </div>
  </div>
</body>
</html>
        `;

        const emailSubject = collectionIdentifier
          ? campaignSubject
          : '🎨 Zobacz wspaniałe obrazy, które stworzyłeś!';

        const result = await resend.emails.send({
          from: 'Lumly <noreply@notification.lumly.pl>',
          reply_to: 'biuro@lumly.pl',
          to: email,
          subject: emailSubject,
          html: emailHtml
        });

        results.sent.push({
          email,
          customerId: customer.customerId,
          emailId: result.data?.id
        });

        console.log(`✅ ${i + 1}/${customers.length} - Wysłano do: ${email}`);

        // Rate limiting - 1 email na sekundę (Resend limit: 100/sekundę, ale bezpieczniej wolniej)
        if (i < customers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        results.failed.push({
          email,
          customerId: customer.customerId,
          error: error.message
        });
        console.error(`❌ Błąd dla ${email}:`, error.message);
      }
    }

    return res.status(200).json({
      success: true,
      total: customers.length,
      sent: results.sent.length,
      failed: results.failed.length,
      results
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ error: error.message });
  }
};

