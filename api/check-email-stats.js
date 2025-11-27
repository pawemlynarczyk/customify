// api/check-email-stats.js
// Sprawdza statystyki maili przez Resend API

const { Resend } = require('resend');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ 
      error: 'RESEND_API_KEY not configured',
      message: 'Sprawdź Vercel Environment Variables'
    });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    console.log('📧 [CHECK-EMAIL-STATS] Sprawdzam maile w Resend...');
    
    // Pobierz listę maili (ostatnie 100)
    const response = await resend.emails.list({
      limit: 100
    });
    
    if (response.error) {
      console.error('❌ [CHECK-EMAIL-STATS] Resend API error:', response.error);
      return res.status(500).json({ 
        error: 'Resend API error',
        details: response.error
      });
    }
    
    const emails = response.data?.data || [];
    
    // Filtruj maile z 27.11.2025
    const nov27 = emails.filter(email => {
      if (!email.created_at) return false;
      const date = new Date(email.created_at);
      return date.toISOString().startsWith('2025-11-27');
    });
    
    // Filtruj maile z dzisiaj
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayEmails = emails.filter(email => {
      if (!email.created_at) return false;
      const date = new Date(email.created_at);
      return date.toISOString().startsWith(todayStr);
    });
    
    // Filtruj tylko maile z tematem "Twoja generacja AI"
    const generationEmails = emails.filter(email => 
      email.subject && email.subject.includes('generacja AI')
    );
    
    const nov27Generation = nov27.filter(email => 
      email.subject && email.subject.includes('generacja AI')
    );
    
    const todayGeneration = todayEmails.filter(email => 
      email.subject && email.subject.includes('generacja AI')
    );
    
    const stats = {
      today: {
        total: todayEmails.length,
        generation: todayGeneration.length,
        emails: todayGeneration.map(e => ({
          id: e.id,
          to: e.to,
          subject: e.subject,
          status: e.last_event,
          createdAt: e.created_at
        }))
      },
      nov27: {
        total: nov27.length,
        generation: nov27Generation.length,
        emails: nov27Generation.map(e => ({
          id: e.id,
          to: e.to,
          subject: e.subject,
          status: e.last_event,
          createdAt: e.created_at
        }))
      },
      all: {
        total: emails.length,
        generation: generationEmails.length
      }
    };
    
    console.log('✅ [CHECK-EMAIL-STATS] Statystyki:', stats);
    
    return res.status(200).json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('❌ [CHECK-EMAIL-STATS] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
};

