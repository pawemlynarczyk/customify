// api/send-bulk-generation-emails.js
/**
 * API endpoint do masowej wysyłki emaili z generacjami
 * POST: { customers: [{ email, customerId }], testEmail?: string }
 */

const { Resend } = require('resend');

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

  try {
    const { customers, testEmail } = req.body;

    // Jeśli testEmail, wyślij tylko do niego (nie wymaga customers)
    // Dodano obsługę custom subject/html przez payload (fallback do domyślnego)
    if (testEmail) {
      console.log(`📧 [BULK-EMAIL] Wysyłam testowy email do: ${testEmail}`);

      const {
        subject: customSubject,
        html: customHtml
      } = req.body || {};

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

      const emailHtml = customHtml || defaultHtml;
      const subject = customSubject || '🎨 Zobacz wspaniałe obrazy, które stworzyłeś!';

      const result = await resend.emails.send({
        from: 'Lumly <noreply@notification.lumly.pl>',
        reply_to: 'biuro@lumly.pl',
        to: testEmail,
        subject,
        html: emailHtml
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

    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      const email = customer.email;

      if (!email || !email.includes('@')) {
        results.failed.push({ customer, error: 'Invalid email' });
        continue;
      }

      try {
        const emailHtml = `
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

        const result = await resend.emails.send({
          from: 'Lumly <noreply@notification.lumly.pl>',
          reply_to: 'biuro@lumly.pl',
          to: email,
          subject: '🎨 Zobacz wspaniałe obrazy, które stworzyłeś!',
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

