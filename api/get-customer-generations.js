// api/get-customer-generations.js
/**
 * API endpoint do pobierania generacji AI dla klienta
 * Pobiera z Vercel Blob Storage: customerId/email → lista generacji
 */

const { head } = require('@vercel/blob');
const { checkRateLimit, getClientIP } = require('../utils/vercelRateLimiter');

module.exports = async (req, res) => {
  console.log(`📥 [GET-CUSTOMER-GENERATIONS] API called - Method: ${req.method}`);
  
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
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // IP-based rate limiting
    const ip = getClientIP(req);
    if (!checkRateLimit(ip, 100, 15 * 60 * 1000)) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests from this IP',
        retryAfter: 900
      });
    }

    const { customerId, email } = req.query;

    // Musi być customerId LUB email
    if (!customerId && !email) {
      return res.status(400).json({ 
        error: 'Missing required parameter: customerId or email' 
      });
    }

    // Sprawdź czy Vercel Blob Storage jest skonfigurowany
    if (!process.env.customify_READ_WRITE_TOKEN) {
      return res.status(500).json({
        error: 'Vercel Blob Storage not configured',
        message: 'customify_READ_WRITE_TOKEN environment variable is missing'
      });
    }

    // Określ identyfikator klienta (priorytet: customerId > email)
    let keyPrefix = 'customer';
    let identifier = customerId;
    
    if (!customerId && email) {
      keyPrefix = 'email';
      identifier = email.toLowerCase().trim();
    }

    // Path w Vercel Blob Storage dla JSON z generacjami
    const blobPath = `customify/system/stats/generations/${keyPrefix}-${identifier.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
    console.log(`📝 [GET-CUSTOMER-GENERATIONS] Blob Path: ${blobPath}`);

    // Pobierz plik z Vercel Blob Storage
    try {
      const blob = await head(blobPath, {
        token: process.env.customify_READ_WRITE_TOKEN
      }).catch(() => null);
      
      if (!blob || !blob.url) {
        return res.json({
          success: true,
          customerId: customerId || null,
          email: email || null,
          generations: [],
          totalGenerations: 0,
          message: 'No generations found'
        });
      }

      // Pobierz zawartość pliku
      const response = await fetch(blob.url);
      if (!response.ok) {
        return res.status(500).json({
          error: 'Failed to fetch generations file',
          message: `HTTP ${response.status}`
        });
      }

      const data = await response.json();
      
      return res.json({
        success: true,
        customerId: data.customerId || customerId || null,
        email: data.email || email || null,
        generations: data.generations || [],
        totalGenerations: data.totalGenerations || 0,
        purchasedCount: data.purchasedCount || 0,
        lastGenerationDate: data.lastGenerationDate || null,
        createdAt: data.createdAt || null,
        blobUrl: blob.url
      });

    } catch (blobError) {
      console.error('❌ [GET-CUSTOMER-GENERATIONS] Error reading from Blob:', blobError);
      return res.status(500).json({
        error: 'Failed to read generations file',
        message: blobError.message
      });
    }

  } catch (error) {
    console.error('❌ [GET-CUSTOMER-GENERATIONS] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

