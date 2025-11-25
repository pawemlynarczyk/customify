/**
 * Test endpoint do wysyłania testowego maila z obrazkiem
 * 
 * Użycie:
 * POST /api/test-send-email
 * {
 *   "email": "test@example.com",
 *   "imageUrl": "https://vzwqqb14qtsxe2wx.public.blob.vercel-storage.com/...",
 *   "style": "pixar",
 *   "size": "medium"
 * }
 */

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, imageUrl, style, size, method } = req.body;

    // Walidacja
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing imageUrl' });
    }

    console.log('📧 [TEST-SEND-EMAIL] Sending test email:', {
      email: email.substring(0, 10) + '...',
      imageUrl: imageUrl.substring(0, 50) + '...',
      style: style || 'test',
      method: method || 'resend'
    });

    const styleName = style || 'Test';
    const sizeText = size ? `Rozmiar: ${size}` : '';

    // HTML Template
    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test - Twoja generacja AI jest gotowa!</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎨 Test - Twoja generacja AI jest gotowa!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Cześć! 👋
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              To jest <strong>testowy email</strong> z obrazkiem generacji w stylu <strong>${styleName}</strong>.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <img 
                src="${imageUrl}" 
                alt="Generacja ${styleName}" 
                style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
              />
            </div>
            
            ${sizeText ? `<p style="font-size: 14px; color: #666; margin-bottom: 20px;">
              <strong>${sizeText}</strong>
            </p>` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a 
                href="https://lumly.pl/pages/my-generations" 
                style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;"
              >
                Zobacz wszystkie generacje →
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
              <strong>⚠️ To jest testowy email.</strong> Jeśli obrazek się wyświetla, oznacza to że system działa poprawnie!
            </p>
            
            <p style="font-size: 12px; color: #999; margin-top: 20px; text-align: center;">
              © ${new Date().getFullYear()} Lumly.pl - Personalizowane portrety AI
            </p>
          </div>
        </body>
      </html>
    `;

    // Używamy tylko Shopify (Resend wycofany)
    const sendMethod = method || 'shopify';

    if (sendMethod === 'shopify') {
      // OPCJA 2: Shopify Customer Notification API (jeśli mamy customerId)
      const { customerId } = req.body;

      if (!customerId) {
        return res.status(400).json({ 
          error: 'customerId required for Shopify method',
          hint: 'Add customerId to request body or use method=resend'
        });
      }

      const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
      const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

      if (!accessToken) {
        return res.status(500).json({ error: 'SHOPIFY_ACCESS_TOKEN not configured' });
      }

      // Shopify Customer Notification API (send_invite)
      const emailResponse = await fetch(`https://${shop}/admin/api/2023-10/customers/${customerId}/send_invite.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer_invite: {
            to: email,
            subject: '🧪 TEST - Twoja generacja AI jest gotowa! 🎨',
            custom_message: `
Cześć!

To jest testowy email z obrazkiem generacji.

Obrazek: ${imageUrl}

Link do galerii: https://lumly.pl/pages/my-generations

⚠️ To jest testowy email. Jeśli obrazek się wyświetla, oznacza to że system działa poprawnie!
            `.trim()
          }
        })
      });

      if (!emailResponse.ok) {
        const error = await emailResponse.text();
        console.error('❌ [TEST-SEND-EMAIL] Shopify error:', error);
        return res.status(500).json({ error: 'Failed to send email via Shopify', details: error });
      }

      const result = await emailResponse.json();
      console.log('✅ [TEST-SEND-EMAIL] Email sent via Shopify:', result);

      return res.status(200).json({
        success: true,
        method: 'shopify',
        message: 'Test email sent successfully via Shopify Customer Notification API',
        note: 'Shopify send_invite may not support HTML/images - check email client'
      });

    } else {
      return res.status(400).json({ 
        error: 'Invalid method',
        validMethods: ['shopify'],
        note: 'Only Shopify method is supported (Resend removed)'
      });
    }

  } catch (error) {
    console.error('❌ [TEST-SEND-EMAIL] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
};

