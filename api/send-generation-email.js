const { Resend } = require('resend');

module.exports = async (req, res) => {
  // CORS headers
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
    const { email, imageUrl, style, size, customerId } = req.body;

    console.log('📧 [SEND-EMAIL] ===== WYSYŁANIE EMAILA =====');
    console.log('📧 [SEND-EMAIL] To:', email);
    console.log('📧 [SEND-EMAIL] CustomerId:', customerId);
    console.log('📧 [SEND-EMAIL] Style:', style);
    console.log('📧 [SEND-EMAIL] Size:', size);
    console.log('📧 [SEND-EMAIL] ImageUrl:', imageUrl?.substring(0, 50) + '...');

    // Walidacja
    if (!email || !imageUrl) {
      console.error('❌ [SEND-EMAIL] Brak wymaganych danych');
      return res.status(400).json({ error: 'Missing email or imageUrl' });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('❌ [SEND-EMAIL] Brak RESEND_API_KEY');
      return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
    }

    // Inicjalizuj Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Przygotuj nazwę stylu (czytelną)
    const styleNames = {
      'pixar': 'Pixar',
      'minimalistyczny': 'Minimalistyczny',
      'realistyczny': 'Realistyczny',
      'akwarela': 'Akwarela',
      'karykatura': 'Karykatura',
      'krol-krolewski': 'Król - Królewski',
      'krolewski': 'Królewski',
      'barokowy': 'Barokowy',
      'renesansowy': 'Renesansowy',
      'wiktorianski': 'Wiktoriański',
      'wojenny': 'Wojenny',
      'na-tronie': 'Na tronie'
    };

    // Wyciągnij nazwę stylu z prompt (jeśli zawiera "Transform this image in X style")
    let styleName = style;
    if (style && style.includes('Transform this image in')) {
      const match = style.match(/Transform this image in (.+?) style/);
      if (match && match[1]) {
        const extractedStyle = match[1];
        styleName = styleNames[extractedStyle] || extractedStyle;
      }
    } else {
      styleName = styleNames[style] || style;
    }

    // Rozmiary czytelne
    const sizeNames = {
      'a5': 'A5 (20×30 cm)',
      'a4': 'A4 (30×40 cm)',
      'a3': 'A3 (40×60 cm)',
      'a2': 'A2 (60×85 cm)'
    };
    const sizeName = sizeNames[size] || size || 'A4 (30×40 cm)';

    // HTML Email Template
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 0;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
        🎨 Twoja generacja AI jest gotowa!
      </h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px; background-color: #ffffff;">
      <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
        Cześć! 👋
      </p>
      
      <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 30px;">
        Twoja generacja w stylu <strong>${styleName}</strong> jest gotowa! Sprawdź efekt poniżej:
      </p>
      
      <!-- Image -->
      <div style="text-align: center; margin: 30px 0;">
        <img src="${imageUrl}" alt="Generacja ${styleName}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
      </div>
      
      <!-- Details -->
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
          <strong style="color: #333;">Styl:</strong> ${styleName}
        </p>
        <p style="margin: 0; font-size: 14px; color: #666;">
          <strong style="color: #333;">Rozmiar:</strong> ${sizeName}
        </p>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="https://lumly.pl/pages/my-generations" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
          Zobacz wszystkie generacje →
        </a>
      </div>
      
      <!-- Footer Note -->
      <p style="font-size: 14px; color: #999; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
        Masz pytania? Odpowiedz na ten email lub skontaktuj się z nami.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
      <p style="margin: 0; font-size: 12px; color: #999;">
        © 2025 Lumly.pl - Personalizowane portrety AI
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Wyślij email przez Resend
    const result = await resend.emails.send({
      from: 'Lumly <noreply@notifications.lumly.pl>',
      to: email,
      subject: '🎨 Twoja generacja AI jest gotowa!',
      html: emailHtml
    });

    console.log('✅ [SEND-EMAIL] Email wysłany pomyślnie!');
    console.log('✅ [SEND-EMAIL] Resend ID:', result.id);

    return res.status(200).json({
      success: true,
      emailId: result.id,
      to: email
    });

  } catch (error) {
    console.error('❌ [SEND-EMAIL] Błąd wysyłania emaila:', error);
    console.error('❌ [SEND-EMAIL] Error message:', error.message);
    console.error('❌ [SEND-EMAIL] Error stack:', error.stack);

    return res.status(500).json({
      error: 'Failed to send email',
      message: error.message
    });
  }
};

