/**
 * Endpoint do wysyłania emaila z generacją przez Shopify Email API
 * 
 * Używa Shopify Customer Notification API z HTML body (jeśli obsługiwane)
 * lub fallback do tekstowego send_invite
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
    const { email, customerId, watermarkedImageUrl, style, size, productType } = req.body;

    // Walidacja
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (!customerId) {
      return res.status(400).json({ error: 'Missing customerId' });
    }

    if (!watermarkedImageUrl) {
      return res.status(400).json({ error: 'Missing watermarkedImageUrl' });
    }

    const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(500).json({ error: 'SHOPIFY_ACCESS_TOKEN not configured' });
    }

    console.log('📧 [SEND-EMAIL-SHOPIFY] Wysyłam email przez Shopify API:', {
      email: email.substring(0, 10) + '...',
      customerId,
      hasImageUrl: !!watermarkedImageUrl
    });

    // Mapuj style na czytelne nazwy
    const styleNames = {
      'pixar': 'Pixar',
      'minimalistyczny': 'Minimalistyczny',
      'realistyczny': 'Realistyczny',
      'krol-krolewski': 'Król - Królewski',
      'krolowa-krolewska': 'Królowa - Królewska',
      'krolowa-prezent-1': 'Królowa - Prezent 1',
      'krolowa-prezent-2': 'Królowa - Prezent 2',
      'krolewski': 'Królewski',
      'barokowy': 'Barokowy',
      'renesansowy': 'Renesansowy',
      'wiktorianski': 'Wiktoriański',
      'wojenny': 'Wojenny',
      'na-tronie': 'Na tronie'
    };

    const styleName = styleNames[style] || style;
    const sizeText = size ? `Rozmiar: ${size}` : '';

    // HTML Template
    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Twoja generacja AI jest gotowa!</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎨 Twoja generacja AI jest gotowa!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Cześć! 👋
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Twoja generacja w stylu <strong>${styleName}</strong> jest gotowa! Sprawdź efekt poniżej:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <img 
                src="${watermarkedImageUrl}" 
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
              Masz pytania? Odpowiedz na ten mail lub skontaktuj się z nami przez stronę.
            </p>
            
            <p style="font-size: 12px; color: #999; margin-top: 20px; text-align: center;">
              © ${new Date().getFullYear()} Lumly.pl - Personalizowane portrety AI
            </p>
          </div>
        </body>
      </html>
    `;

    // Tekstowa wersja (fallback)
    const emailText = `
Cześć!

Twoja generacja w stylu ${styleName} jest gotowa! 🎨

Obrazek: ${watermarkedImageUrl}

${sizeText ? sizeText + '\n' : ''}
Zobacz wszystkie generacje: https://lumly.pl/pages/my-generations

Pozdrawiamy,
Zespół Lumly
    `.trim();

    // Próbuj użyć Shopify Customer Notification API
    // ⚠️ UWAGA: send_invite może nie obsługiwać HTML - sprawdzamy
    try {
      const emailResponse = await fetch(`https://${shop}/admin/api/2023-10/customers/${customerId}/send_invite.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer_invite: {
            to: email,
            subject: 'Twoja generacja AI jest gotowa! 🎨',
            custom_message: emailText // Tekstowa wersja (send_invite nie obsługuje HTML)
          }
        })
      });

      if (emailResponse.ok) {
        const result = await emailResponse.json();
        console.log('✅ [SEND-EMAIL-SHOPIFY] Email wysłany przez Shopify API');
        
        return res.status(200).json({
          success: true,
          method: 'shopify_send_invite',
          message: 'Email sent successfully',
          note: 'Shopify send_invite only supports text, not HTML. For HTML emails, use Shopify Email templates.'
        });
      } else {
        const error = await emailResponse.text();
        console.error('❌ [SEND-EMAIL-SHOPIFY] Shopify error:', error);
        return res.status(500).json({ 
          error: 'Failed to send email via Shopify', 
          details: error 
        });
      }
    } catch (error) {
      console.error('❌ [SEND-EMAIL-SHOPIFY] Error:', error);
      return res.status(500).json({ 
        error: 'Internal server error', 
        details: error.message 
      });
    }

  } catch (error) {
    console.error('❌ [SEND-EMAIL-SHOPIFY] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
};


