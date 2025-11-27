// api/check-generations-with-dates.js
// Sprawdza generacje z datami z Vercel Blob Storage

const { list } = require('@vercel/blob');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN not configured' });
  }

  try {
    console.log('📧 [CHECK-GENERATIONS] Sprawdzam generacje z datami...');
    
    // Lista wszystkich plików z generacjami
    const { blobs } = await list({
      prefix: 'customify/system/stats/generations/',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    
    console.log(`✅ Znaleziono ${blobs.length} plików z generacjami`);
    
    const stats = {
      nov27: { total: 0, withEmail: 0, emails: [] },
      today: { total: 0, withEmail: 0, emails: [] },
      all: { total: 0, withEmail: 0 }
    };
    
    const today = new Date().toISOString().split('T')[0];
    const nov27 = '2025-11-27';
    
    // Pobierz zawartość każdego pliku
    for (const blob of blobs.slice(0, 100)) { // Max 100 plików
      try {
        const response = await fetch(blob.url);
        const data = await response.json();
        
        if (Array.isArray(data.generations)) {
          for (const gen of data.generations) {
            if (!gen.timestamp) continue;
            
            const genDate = new Date(gen.timestamp).toISOString().split('T')[0];
            
            if (genDate === nov27) {
              stats.nov27.total++;
              if (gen.email) {
                stats.nov27.withEmail++;
                stats.nov27.emails.push({
                  email: gen.email,
                  timestamp: gen.timestamp,
                  style: gen.style,
                  customerId: gen.customerId
                });
              }
            }
            
            if (genDate === today) {
              stats.today.total++;
              if (gen.email) {
                stats.today.withEmail++;
                stats.today.emails.push({
                  email: gen.email,
                  timestamp: gen.timestamp,
                  style: gen.style,
                  customerId: gen.customerId
                });
              }
            }
            
            stats.all.total++;
            if (gen.email) stats.all.withEmail++;
          }
        }
      } catch (err) {
        console.warn(`⚠️ Błąd czytania ${blob.pathname}:`, err.message);
      }
    }
    
    return res.status(200).json({
      success: true,
      stats,
      note: 'To są generacje z emailami - nie wszystkie mogą mieć wysłane maile (sprawdź warunki w kodzie)'
    });
    
  } catch (error) {
    console.error('❌ [CHECK-GENERATIONS] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
};

