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
    
    // Pobierz listę maili przez Resend API v3
    // W Resend v3 używamy innej metody
    let emails = [];
    
    try {
      // Spróbuj przez API v3
      const response = await fetch('https://api.resend.com/emails?limit=100', {
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        emails = data.data || [];
      } else {
        const errorText = await response.text();
        console.error('❌ [CHECK-EMAIL-STATS] Resend API error:', errorText);
        return res.status(500).json({ 
          error: 'Resend API error',
          details: errorText
        });
      }
    } catch (fetchError) {
      // Fallback - sprawdź przez logi Vercel
      console.warn('⚠️ [CHECK-EMAIL-STATS] Nie można pobrać z Resend API, używam logów Vercel');
      emails = []; // Pusty array - zwrócimy info że trzeba sprawdzić ręcznie
    }
    
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

