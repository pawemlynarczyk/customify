// api/save-generation.js
/**
 * API endpoint do zapisywania generacji AI z powiązaniem do klienta
 * Zapisuje w Vercel KV: customerId/email → lista generacji
 */

const { kv } = require('@vercel/kv');
const { checkRateLimit, getClientIP } = require('../utils/vercelRateLimiter');

module.exports = async (req, res) => {
  console.log(`💾 [SAVE-GENERATION] API called - Method: ${req.method}`);
  
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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
    if (!checkRateLimit(ip, 50, 15 * 60 * 1000)) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests from this IP',
        retryAfter: 900
      });
    }

    const { customerId, email, imageUrl, style, productType, originalImageUrl } = req.body;

    // Walidacja wymaganych pól
    if (!imageUrl) {
      return res.status(400).json({ 
        error: 'Missing required field: imageUrl' 
      });
    }

    // Musi być customerId LUB email
    if (!customerId && !email) {
      return res.status(400).json({ 
        error: 'Missing required field: customerId or email' 
      });
    }

    // Sprawdź czy Vercel KV jest skonfigurowany
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.error('❌ [SAVE-GENERATION] Vercel KV not configured');
      // Nie blokuj - zwróć sukces ale z warningiem
      return res.json({
        success: true,
        warning: 'Vercel KV not configured - generation not saved',
        message: 'Generation saved locally only'
      });
    }

    // Określ identyfikator klienta (priorytet: customerId > email > IP)
    let keyPrefix = 'customer';
    let identifier = customerId;
    
    if (!customerId && email) {
      keyPrefix = 'email';
      identifier = email.toLowerCase().trim();
    } else if (!customerId && !email) {
      // Fallback do IP (nie zalecane, ale lepsze niż nic)
      keyPrefix = 'ip';
      identifier = ip;
      console.warn('⚠️ [SAVE-GENERATION] Using IP as identifier (no customerId or email)');
    }

    const kvKey = `${keyPrefix}:${identifier}:generations`;
    console.log(`📝 [SAVE-GENERATION] KV Key: ${kvKey}`);

    // Generuj unikalny ID dla generacji
    const generationId = `gen-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Nowa generacja
    const newGeneration = {
      id: generationId,
      imageUrl: imageUrl,
      style: style || 'unknown',
      productType: productType || 'other',
      originalImageUrl: originalImageUrl || null,
      date: new Date().toISOString(),
      purchased: false,
      orderId: null,
      purchaseDate: null
    };

    // Pobierz istniejące generacje z Vercel KV
    let existingData = null;
    try {
      existingData = await kv.get(kvKey);
      console.log(`📊 [SAVE-GENERATION] Existing data found:`, existingData ? 'yes' : 'no');
    } catch (kvError) {
      console.error('❌ [SAVE-GENERATION] Error reading from KV:', kvError);
      // Kontynuuj - utworzymy nowy rekord
    }

    // Przygotuj dane do zapisu
    let dataToSave;
    
    if (existingData && Array.isArray(existingData.generations)) {
      // Dodaj nową generację do istniejącej tablicy
      existingData.generations.unshift(newGeneration); // Dodaj na początku
      // Zachowaj ostatnie 50 generacji (limit)
      if (existingData.generations.length > 50) {
        existingData.generations = existingData.generations.slice(0, 50);
      }
      dataToSave = {
        ...existingData,
        lastGenerationDate: new Date().toISOString(),
        totalGenerations: existingData.generations.length
      };
    } else {
      // Utwórz nowy rekord
      dataToSave = {
        customerId: customerId || null,
        email: email || null,
        ip: ip,
        generations: [newGeneration],
        lastGenerationDate: new Date().toISOString(),
        totalGenerations: 1,
        purchasedCount: 0,
        createdAt: new Date().toISOString()
      };
    }

    // Zapisz w Vercel KV
    try {
      await kv.set(kvKey, dataToSave);
      console.log(`✅ [SAVE-GENERATION] Saved to KV: ${kvKey}`);
    } catch (kvError) {
      console.error('❌ [SAVE-GENERATION] Error writing to KV:', kvError);
      // Nie blokuj - zwróć sukces ale z warningiem
      return res.json({
        success: true,
        warning: 'Failed to save to Vercel KV',
        message: 'Generation saved locally only',
        generationId: generationId
      });
    }

    return res.json({
      success: true,
      generationId: generationId,
      key: kvKey,
      totalGenerations: dataToSave.totalGenerations,
      message: 'Generation saved successfully'
    });

  } catch (error) {
    console.error('❌ [SAVE-GENERATION] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

