// api/check-email-attempts.js
// Sprawdza logi Vercel - kto powinien dostać maila i czy został wysłany

const https = require('https');

async function getVercelLogs() {
  return new Promise((resolve, reject) => {
    // Użyj Vercel API do pobrania logów
    // To wymaga Vercel API token - na razie zwróć instrukcję
    reject(new Error('Use Vercel CLI: vercel logs customify-s56o.vercel.app --since 24h'));
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Pobierz logi przez Vercel API (wymaga VERCEL_TOKEN)
    // Na razie zwróć instrukcję jak to sprawdzić
    
    return res.status(200).json({
      success: true,
      message: 'Użyj lokalnego skryptu do sprawdzenia logów',
      instructions: {
        step1: 'Pobierz logi: vercel logs customify-s56o.vercel.app --since 24h > logs.txt',
        step2: 'Uruchom skrypt: node check-email-sent-attempts.js',
        step3: 'Sprawdź w Resend Dashboard czy maile zostały wysłane'
      },
      whatToCheck: [
        'Szukaj w logach: "[SAVE-GENERATION] Wysyłam email przez Resend"',
        'Szukaj Resend ID: "[SAVE-GENERATION] Resend ID:"',
        'Szukaj błędów: "[SAVE-GENERATION] Exception podczas wysyłania emaila"',
        'Porównaj z Resend Dashboard: https://resend.com/emails'
      ]
    });
    
  } catch (error) {
    console.error('❌ [CHECK-EMAIL-ATTEMPTS] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
};



