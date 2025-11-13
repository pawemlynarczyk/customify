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
    const { name, email, message, subject } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, message' 
      });
    }

    // Email do wysłania (biuro@lumly.pl)
    const recipientEmail = 'biuro@lumly.pl';
    
    // Tutaj możesz użyć serwisu do wysyłania emaili (np. SendGrid, Mailgun, Resend)
    // Na razie zwracam sukces - możesz dodać integrację z serwisem email
    
    console.log('📧 [CONTACT-FORM] New contact form submission:', {
      name,
      email,
      subject: subject || 'Kontakt ze strony',
      message
    });

    // TODO: Dodaj integrację z serwisem email (SendGrid, Mailgun, Resend, etc.)
    // Przykład z Resend:
    // const resend = require('resend');
    // const resendClient = new resend.Resend(process.env.RESEND_API_KEY);
    // await resendClient.emails.send({
    //   from: 'noreply@lumly.pl',
    //   to: recipientEmail,
    //   subject: subject || `Kontakt ze strony: ${name}`,
    //   html: `<p><strong>Od:</strong> ${name} (${email})</p><p><strong>Wiadomość:</strong></p><p>${message}</p>`
    // });

    res.json({
      success: true,
      message: 'Wiadomość została wysłana. Odpowiemy najszybciej jak to możliwe.'
    });

  } catch (error) {
    console.error('❌ [CONTACT-FORM] Error:', error);
    res.status(500).json({ 
      error: 'Failed to send message',
      details: error.message 
    });
  }
};

