// api/check-email-stats.js
// Sprawdza statystyki maili kredytowych z Vercel KV
// (Resend API key jest ograniczony tylko do wysyłania, nie można pobierać statystyk)

const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    console.log('📧 [CHECK-EMAIL-STATS] Sprawdzam maile kredytowe w Vercel KV...');
    
    // Pobierz wszystkie klucze credit-email-sent:*
    const keys = await kv.keys('credit-email-sent:*');
    console.log(`📋 [CHECK-EMAIL-STATS] Znaleziono ${keys.length} wpisów o wysłanych mailach`);
    
    const emails = [];
    for (const key of keys) {
      const data = await kv.get(key);
      if (data) {
        const payload = typeof data === 'string' ? JSON.parse(data) : data;
        emails.push({
          customerId: key.replace('credit-email-sent:', ''),
          email: payload.email || 'N/A',
          sentAt: payload.sentAt || payload.timestamp,
          emailId: payload.emailId || null,
          usageCount: payload.usageCount || null
        });
      }
    }
    
    // Sortuj po dacie (najnowsze pierwsze)
    emails.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
    
    // Filtruj maile z dzisiaj
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayEmails = emails.filter(email => {
      if (!email.sentAt) return false;
      const date = new Date(email.sentAt);
      return date.toISOString().startsWith(todayStr);
    });
    
    // Filtruj maile z ostatnich 7 dni
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekEmails = emails.filter(email => {
      if (!email.sentAt) return false;
      return new Date(email.sentAt) >= weekAgo;
    });
    
    // Filtruj maile z ostatnich 30 dni
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthEmails = emails.filter(email => {
      if (!email.sentAt) return false;
      return new Date(email.sentAt) >= monthAgo;
    });
    
    const stats = {
      total: emails.length,
      today: {
        count: todayEmails.length,
        emails: todayEmails.slice(0, 50) // Max 50 najnowszych
      },
      last7Days: {
        count: weekEmails.length,
        emails: weekEmails.slice(0, 50)
      },
      last30Days: {
        count: monthEmails.length,
        emails: monthEmails.slice(0, 50)
      },
      all: emails.slice(0, 100) // Max 100 najnowszych
    };
    
    console.log('✅ [CHECK-EMAIL-STATS] Statystyki:', {
      total: stats.total,
      today: stats.today.count,
      last7Days: stats.last7Days.count,
      last30Days: stats.last30Days.count
    });
    
    return res.status(200).json({
      success: true,
      note: 'Statystyki z Vercel KV (Resend API key jest ograniczony tylko do wysyłania)',
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

