// api/update-generation-watermark.js
/**
 * Endpoint do aktualizacji watermarkedImageUrl dla istniejącej generacji
 * Frontend wysyła watermarkedImage (base64 z Canvas) po dodaniu watermarku
 */

const { put, head } = require('@vercel/blob');
const { getClientIP } = require('../utils/vercelRateLimiter');

module.exports = async (req, res) => {
  console.log(`🎨 [UPDATE-WATERMARK] API called - Method: ${req.method}`);
  
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
    const { generationId, watermarkedImage, customerId, email } = req.body;

    if (!generationId) {
      return res.status(400).json({ 
        error: 'Missing required field: generationId' 
      });
    }

    if (!watermarkedImage) {
      return res.status(400).json({ 
        error: 'Missing required field: watermarkedImage' 
      });
    }

    // Sprawdź czy Vercel Blob Storage jest skonfigurowany
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN || process.env.customify_READ_WRITE_TOKEN;
    if (!blobToken) {
      return res.status(500).json({
        error: 'Vercel Blob Storage not configured'
      });
    }

    // Określ identyfikator klienta (tak samo jak w save-generation-v2)
    let keyPrefix = 'customer';
    let identifier = customerId;
    
    if (!customerId && email) {
      keyPrefix = 'email';
      identifier = email.toLowerCase().trim();
    } else if (!customerId && !email) {
      // Dla niezalogowanych użyj IP
      const ip = getClientIP(req);
      keyPrefix = 'ip';
      identifier = ip || 'unknown';
    }

    // Path w Vercel Blob Storage (tak samo jak w save-generation-v2)
    const sanitizedIdentifier = String(identifier).replace(/[^a-zA-Z0-9]/g, '-');
    const blobPath = `customify/system/stats/generations/${keyPrefix}-${sanitizedIdentifier}.json`;
    
    console.log(`📝 [UPDATE-WATERMARK] Blob Path: ${blobPath}`);
    console.log(`🔍 [UPDATE-WATERMARK] Looking for generationId: ${generationId}`);

    // Pobierz istniejące generacje z Vercel Blob Storage
    let existingData = null;
    try {
      const existingBlob = await head(blobPath, {
        token: blobToken
      }).catch(() => null);
      
      if (existingBlob && existingBlob.url) {
        const existingResponse = await fetch(existingBlob.url);
        if (existingResponse.ok) {
          existingData = await existingResponse.json();
          console.log(`📊 [UPDATE-WATERMARK] Found ${existingData.generations?.length || 0} generations`);
        }
      }
    } catch (blobError) {
      console.error('❌ [UPDATE-WATERMARK] Error reading existing file:', blobError);
      return res.status(500).json({
        error: 'Failed to read generations file',
        message: blobError.message
      });
    }

    if (!existingData || !Array.isArray(existingData.generations)) {
      return res.status(404).json({
        error: 'Generations file not found or invalid',
        message: 'No generations found for this user'
      });
    }

    // ✅ DEBUG: Pokaż pierwsze 5 ID w tablicy
    console.log(`🔍 [UPDATE-WATERMARK] First 5 generation IDs in file:`, 
      existingData.generations.slice(0, 5).map(gen => gen.id));
    console.log(`🔍 [UPDATE-WATERMARK] Looking for ID: ${generationId}`);

    // Znajdź generację po generationId
    const generationIndex = existingData.generations.findIndex(gen => gen.id === generationId);
    
    if (generationIndex === -1) {
      // ✅ DEBUG: Sprawdź czy może być problem z formatem ID
      const similarIds = existingData.generations
        .slice(0, 10)
        .map(gen => gen.id)
        .filter(id => id.includes(generationId.split('-')[1])); // Szukaj podobnych (po timestamp)
      
      console.log(`⚠️ [UPDATE-WATERMARK] Generation not found. Similar IDs (by timestamp):`, similarIds);
      
      return res.status(404).json({
        error: 'Generation not found',
        message: `Generation with id ${generationId} not found`,
        debug: {
          totalGenerations: existingData.generations.length,
          firstId: existingData.generations[0]?.id || null,
          similarIds: similarIds
        }
      });
    }

    const generation = existingData.generations[generationIndex];
    console.log(`✅ [UPDATE-WATERMARK] Found generation: ${generation.id}, style: ${generation.style}`);

    // Upload watermarked image do Vercel Blob Storage
    let watermarkedImageUrl = null;
    try {
      // Konwertuj base64 na buffer
      const base64Data = watermarkedImage.replace(/^data:image\/[a-z]+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      console.log(`📦 [UPDATE-WATERMARK] Watermarked image size: ${imageBuffer.length} bytes (${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
      
      // Upload do Vercel Blob
      const timestamp = Date.now();
      const watermarkedFilename = `customify/temp/generation-${timestamp}-watermarked.jpg`;
      
      const blob = await put(watermarkedFilename, imageBuffer, {
        access: 'public',
        contentType: 'image/jpeg',
        token: blobToken,
      });
      
      watermarkedImageUrl = blob.url;
      console.log(`✅ [UPDATE-WATERMARK] Watermarked image uploaded: ${watermarkedImageUrl.substring(0, 50)}...`);
    } catch (uploadError) {
      console.error('❌ [UPDATE-WATERMARK] Error uploading watermarked image:', uploadError);
      return res.status(500).json({
        error: 'Failed to upload watermarked image',
        message: uploadError.message
      });
      return;
    }

    // Aktualizuj watermarkedImageUrl w generacji
    existingData.generations[generationIndex].watermarkedImageUrl = watermarkedImageUrl;
    console.log(`✅ [UPDATE-WATERMARK] Updated watermarkedImageUrl for generation ${generationId}`);

    // Zapisz zaktualizowane dane z powrotem do Vercel Blob Storage
    const updatedJsonData = JSON.stringify(existingData, null, 2);
    const updatedJsonBuffer = Buffer.from(updatedJsonData, 'utf-8');
    
    await put(blobPath, updatedJsonBuffer, {
      access: 'public',
      contentType: 'application/json',
      token: blobToken,
      allowOverwrite: true
    });

    console.log(`✅ [UPDATE-WATERMARK] Generation updated successfully`);

    return res.json({
      success: true,
      generationId: generationId,
      watermarkedImageUrl: watermarkedImageUrl,
      message: 'Watermarked image updated successfully'
    });

  } catch (error) {
    console.error('❌ [UPDATE-WATERMARK] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

