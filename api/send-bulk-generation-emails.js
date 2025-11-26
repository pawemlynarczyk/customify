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
    if (testEmail) {
      console.log(`📧 [BULK-EMAIL] Wysyłam testowy email do: ${testEmail}`);

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
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎨 Twoje obrazy czekają!</h1>
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
        to: testEmail,
        subject: '🎨 Zobacz wspaniałe obrazy, które stworzyłeś!',
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
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎨 Twoje obrazy czekają!</h1>
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

