// api/save-generation.js
/**
 * API endpoint do zapisywania generacji AI z powiązaniem do klienta
 * Zapisuje w Vercel Blob Storage: customerId/email → lista generacji (JSON)
 */

const { put, head } = require('@vercel/blob');
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

    // Sprawdź czy Vercel Blob Storage jest skonfigurowany
    if (!process.env.customify_READ_WRITE_TOKEN) {
      console.error('❌ [SAVE-GENERATION] Vercel Blob Storage not configured');
      // Nie blokuj - zwróć sukces ale z warningiem
      return res.json({
        success: true,
        warning: 'Vercel Blob Storage not configured - generation not saved',
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

    // Path w Vercel Blob Storage dla JSON z generacjami
    const blobPath = `customify/generations/${keyPrefix}-${identifier.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
    console.log(`📝 [SAVE-GENERATION] Blob Path: ${blobPath}`);

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

    // Pobierz istniejące generacje z Vercel Blob Storage
    let existingData = null;
    try {
      // Spróbuj sprawdzić czy plik istnieje używając head()
      const existingBlob = await head(blobPath, {
        token: process.env.customify_READ_WRITE_TOKEN
      }).catch(() => null);
      
      if (existingBlob && existingBlob.url) {
        // Plik istnieje - pobierz go
        const existingResponse = await fetch(existingBlob.url);
        if (existingResponse.ok) {
          existingData = await existingResponse.json();
          console.log(`📊 [SAVE-GENERATION] Existing data found: ${existingData.generations?.length || 0} generations`);
        }
      } else {
        console.log(`📊 [SAVE-GENERATION] No existing file found - creating new`);
      }
    } catch (blobError) {
      console.error('❌ [SAVE-GENERATION] Error reading existing file:', blobError);
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

    // Zapisz w Vercel Blob Storage jako JSON
    try {
      const jsonData = JSON.stringify(dataToSave, null, 2);
      const jsonBuffer = Buffer.from(jsonData, 'utf-8');
      
      const blob = await put(blobPath, jsonBuffer, {
        access: 'public',
        contentType: 'application/json',
        token: process.env.customify_READ_WRITE_TOKEN
      });
      
      console.log(`✅ [SAVE-GENERATION] Saved to Blob: ${blob.url}`);
    } catch (blobError) {
      console.error('❌ [SAVE-GENERATION] Error writing to Blob:', blobError);
      // Nie blokuj - zwróć sukces ale z warningiem
      return res.json({
        success: true,
        warning: 'Failed to save to Vercel Blob Storage',
        message: 'Generation saved locally only',
        generationId: generationId
      });
    }

    return res.json({
      success: true,
      generationId: generationId,
      blobPath: blobPath,
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

