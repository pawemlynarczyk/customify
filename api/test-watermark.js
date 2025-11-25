// api/test-watermark.js
// 🧪 TEST ENDPOINT - Testowanie generowania watermarku PNG + zapis do Vercel Blob
// Nie wpływa na działający sklep - tylko test

const { put } = require('@vercel/blob');
const sharp = require('sharp');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 [TEST-WATERMARK] Starting watermark PNG test...');

    // Sprawdź czy Sharp jest dostępny
    if (!sharp) {
      return res.status(500).json({
        error: 'Sharp not available',
        message: 'Sharp library is not installed or not working'
      });
    }

    // Sprawdź czy Vercel Blob token jest skonfigurowany
    const blobToken = process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      return res.status(500).json({
        error: 'Vercel Blob Storage not configured',
        message: 'customify_READ_WRITE_TOKEN or BLOB_READ_WRITE_TOKEN is missing'
      });
    }

    // KROK 1: Pobierz testowy obrazek
    let testImageUrl;
    let testImageBuffer;

    if (req.method === 'POST' && req.body.imageUrl) {
      // POST: Użyj obrazek z request
      testImageUrl = req.body.imageUrl;
      console.log('📥 [TEST-WATERMARK] Using image from request:', testImageUrl);
      
      const imageResponse = await fetch(testImageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch test image: ${imageResponse.status}`);
      }
      testImageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    } else {
      // GET: Użyj domyślny testowy obrazek z public/
      testImageUrl = 'https://customify-s56o.vercel.app/koty/krolewski.png';
      console.log('📥 [TEST-WATERMARK] Using default test image:', testImageUrl);
      
      const imageResponse = await fetch(testImageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch default test image: ${imageResponse.status}`);
      }
      testImageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    }

    console.log('✅ [TEST-WATERMARK] Test image loaded:', testImageBuffer.length, 'bytes');

    // KROK 2: Pobierz watermark PNG
    const watermarkUrl = 'https://customify-s56o.vercel.app/watermark.png';
    console.log('📥 [TEST-WATERMARK] Fetching watermark PNG:', watermarkUrl);
    
    const watermarkResponse = await fetch(watermarkUrl);
    if (!watermarkResponse.ok) {
      // Jeśli watermark.png nie istnieje, zwróć błąd z instrukcją
      return res.status(404).json({
        error: 'Watermark PNG not found',
        message: `Watermark PNG not found at: ${watermarkUrl}`,
        instruction: 'Please create public/watermark.png (2000x2000px, transparent, text "Lumly.pl" rotated -30°)'
      });
    }

    const watermarkBuffer = Buffer.from(await watermarkResponse.arrayBuffer());
    console.log('✅ [TEST-WATERMARK] Watermark PNG loaded:', watermarkBuffer.length, 'bytes');

    // KROK 3: Pobierz metadata obrazu testowego
    const metadata = await sharp(testImageBuffer).metadata();
    const { width, height } = metadata;
    console.log(`📐 [TEST-WATERMARK] Test image dimensions: ${width}x${height}`);

    // KROK 4: Resize watermark do 10% rozmiaru obrazu
    const watermarkSize = Math.min(width, height) * 0.1;
    console.log(`📏 [TEST-WATERMARK] Watermark size: ${Math.round(watermarkSize)}px`);
    
    const watermarkTile = await sharp(watermarkBuffer)
      .resize(Math.round(watermarkSize), Math.round(watermarkSize), {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
      })
      .toBuffer();

    console.log('✅ [TEST-WATERMARK] Watermark tile resized:', watermarkTile.length, 'bytes');

    // KROK 5: Sharp composite - nakładaj watermark w siatce
    console.log('🎨 [TEST-WATERMARK] Applying watermark with Sharp composite...');
    
    const watermarkedBuffer = await sharp(testImageBuffer)
      .composite([
        {
          input: watermarkTile,
          blend: 'over',
          tile: true, // Powtarzaj watermark w siatce
          gravity: 'center'
        }
      ])
      .jpeg({ quality: 92 })
      .toBuffer();

    console.log('✅ [TEST-WATERMARK] Watermark applied successfully:', watermarkedBuffer.length, 'bytes');

    // KROK 6: Upload do Vercel Blob Storage
    const timestamp = Date.now();
    const filename = `customify/test/watermark-test-${timestamp}.jpg`;
    console.log('📤 [TEST-WATERMARK] Uploading to Vercel Blob:', filename);

    const blob = await put(filename, watermarkedBuffer, {
      access: 'public',
      contentType: 'image/jpeg',
      token: blobToken,
    });

    console.log('✅ [TEST-WATERMARK] Uploaded successfully:', blob.url);

    // KROK 7: Zwróć wyniki
    return res.json({
      success: true,
      message: 'Watermark PNG test completed successfully',
      results: {
        testImageUrl: testImageUrl,
        testImageSize: `${width}x${height}`,
        watermarkUrl: watermarkUrl,
        watermarkSize: `${Math.round(watermarkSize)}px`,
        watermarkedImageUrl: blob.url,
        originalSize: testImageBuffer.length,
        watermarkedSize: watermarkedBuffer.length,
        compressionRatio: `${((1 - watermarkedBuffer.length / testImageBuffer.length) * 100).toFixed(1)}%`
      },
      instructions: {
        check: 'Open the watermarkedImageUrl in browser to see the result',
        next: 'If watermark looks good, you can implement this in transform.js'
      }
    });

  } catch (error) {
    console.error('❌ [TEST-WATERMARK] Error:', error);
    console.error('❌ [TEST-WATERMARK] Error stack:', error.stack);
    
    return res.status(500).json({
      error: 'Watermark test failed',
      message: error.message,
      details: error.stack,
      troubleshooting: {
        sharp: 'Check if Sharp is installed: npm install sharp',
        watermark: 'Check if public/watermark.png exists',
        blob: 'Check if customify_READ_WRITE_TOKEN is configured in Vercel'
      }
    });
  }
};

