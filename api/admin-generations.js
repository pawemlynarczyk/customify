// api/admin-generations.js
/**
 * Admin endpoint do przeglądania generacji wszystkich klientów
 * Wymaga autoryzacji (można dodać później)
 */

const { list } = require('@vercel/blob');
const { checkRateLimit, getClientIP } = require('../utils/vercelRateLimiter');

module.exports = async (req, res) => {
  console.log(`👤 [ADMIN-GENERATIONS] API called - Method: ${req.method}`);
  
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
    if (!checkRateLimit(ip, 20, 15 * 60 * 1000)) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests from this IP',
        retryAfter: 900
      });
    }

    // Sprawdź czy Vercel Blob Storage jest skonfigurowany
    if (!process.env.customify_READ_WRITE_TOKEN) {
      return res.status(500).json({
        error: 'Vercel Blob Storage not configured',
        message: 'customify_READ_WRITE_TOKEN environment variable is missing'
      });
    }

    const { customerId, email, limit = 50 } = req.query;

    // Jeśli podano customerId lub email - zwróć tylko te generacje
    if (customerId || email) {
      // Użyj istniejącego endpointu
      const identifier = customerId || email;
      const keyPrefix = customerId ? 'customer' : 'email';
      const blobPath = `customify/generations/${keyPrefix}-${identifier.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
      
      try {
        const { head } = require('@vercel/blob');
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
      } catch (error) {
        return res.status(500).json({
          error: 'Failed to read generations file',
          message: error.message
        });
      }
    }

    // Jeśli nie podano customerId/email - zwróć listę wszystkich plików generacji
    try {
      const blobs = await list({
        prefix: 'customify/generations/',
        limit: parseInt(limit) || 50,
        token: process.env.customify_READ_WRITE_TOKEN
      });

      const generationsList = [];
      
      // Pobierz podstawowe informacje z każdego pliku
      for (const blob of blobs.blobs) {
        try {
          const response = await fetch(blob.url);
          if (response.ok) {
            const data = await response.json();
            generationsList.push({
              blobPath: blob.pathname,
              blobUrl: blob.url,
              customerId: data.customerId || null,
              email: data.email || null,
              totalGenerations: data.totalGenerations || 0,
              purchasedCount: data.purchasedCount || 0,
              lastGenerationDate: data.lastGenerationDate || null,
              createdAt: data.createdAt || null,
              // Pokaż pierwszą generację jako przykład
              firstGeneration: data.generations?.[0] || null
            });
          }
        } catch (error) {
          console.error(`❌ [ADMIN-GENERATIONS] Error reading ${blob.pathname}:`, error);
        }
      }

      return res.json({
        success: true,
        totalFiles: blobs.blobs.length,
        hasMore: blobs.hasMore || false,
        generations: generationsList,
        message: `Found ${generationsList.length} customer generation files`
      });

    } catch (listError) {
      console.error('❌ [ADMIN-GENERATIONS] Error listing blobs:', listError);
      return res.status(500).json({
        error: 'Failed to list generation files',
        message: listError.message
      });
    }

  } catch (error) {
    console.error('❌ [ADMIN-GENERATIONS] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

