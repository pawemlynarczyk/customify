// api/admin/check-password.js
/**
 * Endpoint do sprawdzania hasła do panelu blob-viewer
 * Hasło jest w Vercel Environment Variables (BLOB_VIEWER_PASSWORD)
 */

const { checkRateLimit, getClientIP } = require('../../utils/vercelRateLimiter');

module.exports = async (req, res) => {
  console.log(`🔐 [CHECK-PASSWORD] API called - Method: ${req.method}`);
  
  // CORS headers
  const allowedOrigins = [
    'https://lumly.pl',
    'https://customify-s56o.vercel.app',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // IP-based rate limiting
    const ip = getClientIP(req);
    if (!checkRateLimit(ip, 10, 15 * 60 * 1000)) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    // Sprawdź hasło z Vercel Environment Variables
    const correctPassword = process.env.BLOB_VIEWER_PASSWORD || 'customify-admin-2024';
    
    if (password === correctPassword) {
      // Generuj prosty token sesji (można użyć JWT w przyszłości)
      const sessionToken = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('✅ [CHECK-PASSWORD] Password correct');
      
      return res.json({
        success: true,
        message: 'Password correct',
        sessionToken: sessionToken
      });
    } else {
      console.log('❌ [CHECK-PASSWORD] Password incorrect');
      return res.status(401).json({ 
        error: 'Invalid password',
        message: 'Password is incorrect'
      });
    }

  } catch (error) {
    console.error('❌ [CHECK-PASSWORD] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

