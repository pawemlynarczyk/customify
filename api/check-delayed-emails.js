// api/check-delayed-emails.js
// Endpoint do sprawdzania maili "delivery delayed"

const https = require('https');

async function checkDelayedEmailsAPI(apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.resend.com',
      path: '/emails?limit=1000',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

module.exports = async (req, res) => {
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

  try {
    console.log('📧 [CHECK-DELAYED] Sprawdzam maile "delivery delayed"...');
    
    const response = await checkDelayedEmailsAPI(process.env.RESEND_API_KEY);
    
    if (response.error) {
      console.error('❌ [CHECK-DELAYED] Resend API error:', response.error);
      return res.status(500).json({ 
        error: 'Resend API error',
        details: response.error
      });
    }
    
    const emails = response.data || [];
    
    // Filtruj tylko "delivery delayed"
    const delayed = emails.filter(email => 
      email.last_event === 'delivery_delayed' || 
      email.last_event === 'delayed' ||
      (email.last_event && email.last_event.toLowerCase().includes('delayed'))
    );
    
    // Grupuj po domenie odbiorcy
    const byDomain = {};
    delayed.forEach(email => {
      const recipient = Array.isArray(email.to) ? email.to[0] : email.to;
      const domain = recipient ? recipient.split('@')[1] : 'unknown';
      if (!byDomain[domain]) {
        byDomain[domain] = [];
      }
      byDomain[domain].push({
        id: email.id,
        to: recipient,
        subject: email.subject,
        status: email.last_event,
        createdAt: email.created_at,
        error: email.error || null
      });
    });
    
    const stats = {
      total: delayed.length,
      byDomain: Object.keys(byDomain).map(domain => ({
        domain,
        count: byDomain[domain].length,
        emails: byDomain[domain].slice(0, 5) // Pierwsze 5 z każdej domeny
      })),
      allDelayed: delayed.slice(0, 20).map(e => ({
        id: e.id,
        to: Array.isArray(e.to) ? e.to[0] : e.to,
        subject: e.subject,
        status: e.last_event,
        createdAt: e.created_at,
        error: e.error || null
      }))
    };
    
    console.log('✅ [CHECK-DELAYED] Statystyki:', stats);
    
    return res.status(200).json({
      success: true,
      stats,
      note: 'Sprawdź szczegóły w Resend Dashboard dla pełnych informacji o błędach'
    });
    
  } catch (error) {
    console.error('❌ [CHECK-DELAYED] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
};

