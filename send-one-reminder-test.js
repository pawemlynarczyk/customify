#!/usr/bin/env node
/**
 * Jednorazowy test: wysyła 1 mail przypomnienia (3d) na biuro@lumly.pl.
 * Uruchom: node send-one-reminder-test.js
 * Wymaga: RESEND_API_KEY w .env lub środowisku.
 */
try { require('dotenv').config(); } catch (_) {}

const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const TO = 'biuro@lumly.pl';

const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Masz niezamówiony projekt – dokończ zamówienie</h1>
    </div>
    <div style="padding: 40px 30px; background-color: #ffffff;">
      <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 24px;">Twój projekt z ostatniej generacji czeka w galerii. Zobacz go i dodaj do koszyka, gdy będziesz gotowy.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://lumly.pl/pages/my-generations" style="text-decoration: none;">
          <img src="https://lumly.pl/cdn/shop/files/w_rece_bez_ramy_d6f06d22-9697-4b0a-b247-c024515a036d.jpg" alt="Twoja generacja" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
        </a>
      </div>
      <div style="text-align: center; margin: 40px 0;">
        <a href="https://lumly.pl/pages/my-generations" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Zobacz Moje generacje i zamów</a>
      </div>
      <p style="font-size: 14px; color: #666; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; text-align: center;">Pytania? <a href="mailto:biuro@lumly.pl" style="color: #667eea; text-decoration: none; font-weight: bold;">biuro@lumly.pl</a></p>
    </div>
    <div style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
      <p style="margin: 0; font-size: 12px; color: #999;">© 2025 Lumly.pl - Personalizowane portrety AI</p>
    </div>
  </div>
</body>
</html>
`;

async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.error('Brak RESEND_API_KEY (w .env lub środowisku).');
    process.exit(1);
  }
  const r = await resend.emails.send({
    from: 'Lumly <noreply@notification.lumly.pl>',
    reply_to: 'biuro@lumly.pl',
    to: TO,
    subject: 'Masz niezamówiony projekt – zobacz Moje generacje (test)',
    html
  });
  if (r.error) {
    console.error('Błąd:', r.error);
    process.exit(1);
  }
  console.log('Wysłano test na', TO, '– id:', r.data?.id || r.id);
}

main();
