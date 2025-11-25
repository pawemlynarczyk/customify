// api/test-watermark-sources.js
// 🧪 TEST WATERMARK DLA RÓŻNYCH ŹRÓDEŁ OBRAZÓW
// Testuje: Replicate URLs, Segmind base64, różne rozdzielczości

const { put } = require('@vercel/blob');
const sharp = require('sharp');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🧪 [TEST-WATERMARK-SOURCES] Starting watermark test for different image sources...');

    const blobToken = process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      return res.status(500).json({ error: 'Vercel Blob Storage not configured' });
    }

    const watermarkUrl = 'https://customify-s56o.vercel.app/watermark_22.png';
    console.log('📥 [TEST-WATERMARK-SOURCES] Fetching watermark:', watermarkUrl);
    
    const watermarkResponse = await fetch(watermarkUrl);
    if (!watermarkResponse.ok) {
      return res.status(404).json({ error: 'Watermark PNG not found' });
    }

    const watermarkBuffer = Buffer.from(await watermarkResponse.arrayBuffer());
    console.log('✅ [TEST-WATERMARK-SOURCES] Watermark loaded:', watermarkBuffer.length, 'bytes');

    // Test cases - różne źródła obrazów używane w transform.js
    const testCases = [
      // 1. REPLICATE URLs (większość stylów: Boho, Koty, Pixar, etc.)
      {
        name: 'Replicate URL - Obraz z zewnętrznego serwera',
        source: 'replicate-url',
        imageUrl: 'https://replicate.delivery/pbxt/example.jpg', // Przykładowy URL (może nie istnieć)
        description: 'Obrazy z Replicate API zwracają URL do zewnętrznego serwera',
        note: 'Używamy testowego obrazu jako symulacja Replicate URL'
      },
      {
        name: 'Replicate URL - Pobrany obraz',
        source: 'replicate-url-fetched',
        imageUrl: 'https://customify-s56o.vercel.app/koty/krolewski.png', // Symulacja Replicate URL
        description: 'Obraz pobrany z URL (jak w transform.js dla Replicate)',
        simulateReplicate: true
      },
      // 2. SEGMIND BASE64 (Król, Karykatura)
      {
        name: 'Segmind Base64 - Data URI',
        source: 'segmind-base64',
        imageUrl: null, // Będzie wygenerowany jako base64
        description: 'Segmind zwraca base64 data URI (data:image/jpeg;base64,...)',
        generateBase64: true
      },
      // 3. RÓŻNE ROZDZIELCZOŚCI OBRAZÓW UŻYTKOWNIKA
      {
        name: 'Mały obraz użytkownika (512x512)',
        source: 'user-small',
        imageUrl: 'https://customify-s56o.vercel.app/koty/krolewski.png',
        resizeTo: '512x512',
        description: 'Małe zdjęcie z telefonu (kompresja frontend)'
      },
      {
        name: 'Średni obraz użytkownika (1024x1024)',
        source: 'user-medium',
        imageUrl: 'https://customify-s56o.vercel.app/koty/krolewski.png',
        resizeTo: '1024x1024',
        description: 'Średnie zdjęcie (standardowa kompresja)'
      },
      {
        name: 'Duży obraz użytkownika (2048x2048)',
        source: 'user-large',
        imageUrl: 'https://customify-s56o.vercel.app/koty/krolewski.png',
        resizeTo: '2048x2048',
        description: 'Duże zdjęcie (przed kompresją)'
      },
      {
        name: 'Portret użytkownika (896x1152)',
        source: 'user-portrait',
        imageUrl: 'https://customify-s56o.vercel.app/koty/krolewski.png',
        resizeTo: '896x1152',
        description: 'Portret pionowy (format używany dla większości stylów)'
      },
      {
        name: 'Krajobraz użytkownika (1152x896)',
        source: 'user-landscape',
        imageUrl: 'https://customify-s56o.vercel.app/koty/krolewski.png',
        resizeTo: '1152x896',
        description: 'Krajobraz poziomy (format SDXL)'
      }
    ];

    const results = [];

    for (const testCase of testCases) {
      try {
        console.log(`\n🧪 [TEST-WATERMARK-SOURCES] Testing: ${testCase.name}`);
        
        let imageBuffer;
        let imageSource;

        // Przygotuj obraz w zależności od typu źródła
        if (testCase.generateBase64) {
          // Symulacja Segmind base64: pobierz obraz i konwertuj na base64 data URI
          console.log('📥 [TEST-WATERMARK-SOURCES] Generating base64 data URI (Segmind style)...');
          const testImageResponse = await fetch('https://customify-s56o.vercel.app/koty/krolewski.png');
          const testImageBuffer = Buffer.from(await testImageResponse.arrayBuffer());
          
          // Konwertuj na base64 data URI (jak Segmind)
          const base64Data = testImageBuffer.toString('base64');
          const dataUri = `data:image/jpeg;base64,${base64Data}`;
          
          // Konwertuj data URI z powrotem na buffer (jak w transform.js)
          const base64Only = dataUri.replace(/^data:image\/[a-z]+;base64,/, '');
          imageBuffer = Buffer.from(base64Only, 'base64');
          imageSource = 'base64-data-uri';
          console.log(`✅ [TEST-WATERMARK-SOURCES] Base64 data URI generated: ${dataUri.substring(0, 50)}...`);
        } else {
          // Pobierz obraz z URL (Replicate lub użytkownik)
          const imageResponse = await fetch(testCase.imageUrl);
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.status}`);
          }
          imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
          imageSource = testCase.simulateReplicate ? 'replicate-url' : 'user-upload';
        }

        // Zmień rozmiar jeśli potrzeba
        if (testCase.resizeTo) {
          const [width, height] = testCase.resizeTo.split('x').map(Number);
          console.log(`📐 [TEST-WATERMARK-SOURCES] Resizing to ${width}x${height}`);
          imageBuffer = await sharp(imageBuffer)
            .resize(width, height, {
              fit: 'cover',
              position: 'center'
            })
            .jpeg({ quality: 92 })
            .toBuffer();
        }

        const metadata = await sharp(imageBuffer).metadata();
        const { width, height } = metadata;
        console.log(`📐 [TEST-WATERMARK-SOURCES] Image dimensions: ${width}x${height}, source: ${imageSource}`);

        // Oblicz rozmiar watermarku (40% z mniejszego wymiaru)
        const watermarkSize = Math.min(width, height) * 0.40;
        console.log(`📏 [TEST-WATERMARK-SOURCES] Watermark size: ${Math.round(watermarkSize)}px`);

        // Resize watermark
        const watermarkTile = await sharp(watermarkBuffer)
          .resize(Math.round(watermarkSize), Math.round(watermarkSize), {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .toBuffer();

        // Zastosuj watermark w siatce
        const watermarkedBuffer = await sharp(imageBuffer)
          .composite([
            {
              input: watermarkTile,
              blend: 'over',
              tile: true,
              gravity: 'center'
            }
          ])
          .jpeg({ quality: 92 })
          .toBuffer();

        // Upload do Vercel Blob
        const timestamp = Date.now();
        const filename = `customify/test/watermark-sources-${testCase.source}-${timestamp}.jpg`;
        
        const blob = await put(filename, watermarkedBuffer, {
          access: 'public',
          contentType: 'image/jpeg',
          token: blobToken,
        });

        const originalSize = imageBuffer.length;
        const watermarkedSize = watermarkedBuffer.length;
        const sizeIncrease = ((watermarkedSize / originalSize - 1) * 100).toFixed(1);

        results.push({
          testCase: testCase.name,
          source: testCase.source,
          description: testCase.description,
          imageSource: imageSource,
          imageSize: `${width}x${height}`,
          watermarkSize: `${Math.round(watermarkSize)}px`,
          watermarkedImageUrl: blob.url,
          originalSize: originalSize,
          watermarkedSize: watermarkedSize,
          sizeIncrease: `${sizeIncrease}%`,
          status: 'success'
        });

        console.log(`✅ [TEST-WATERMARK-SOURCES] ${testCase.name}: SUCCESS`);

      } catch (error) {
        console.error(`❌ [TEST-WATERMARK-SOURCES] ${testCase.name}: ERROR`, error);
        results.push({
          testCase: testCase.name,
          source: testCase.source,
          status: 'error',
          error: error.message
        });
      }
    }

    // Grupuj wyniki według źródła
    const groupedResults = {
      replicate: results.filter(r => r.source?.includes('replicate')),
      segmind: results.filter(r => r.source?.includes('segmind') || r.imageSource === 'base64-data-uri'),
      userImages: results.filter(r => r.source?.includes('user'))
    };

    return res.json({
      success: true,
      message: 'Watermark tests for different image sources completed',
      watermarkUrl: watermarkUrl,
      results: results,
      groupedResults: groupedResults,
      summary: {
        total: results.length,
        success: results.filter(r => r.status === 'success').length,
        errors: results.filter(r => r.status === 'error').length,
        bySource: {
          replicate: groupedResults.replicate.filter(r => r.status === 'success').length,
          segmind: groupedResults.segmind.filter(r => r.status === 'success').length,
          userImages: groupedResults.userImages.filter(r => r.status === 'success').length
        }
      },
      instructions: {
        check: 'Open each watermarkedImageUrl to verify watermark works for all sources',
        verify: [
          'Replicate URLs: Watermark applied correctly to fetched images',
          'Segmind Base64: Watermark works with base64 data URI conversion',
          'User Images: Watermark scales correctly for different resolutions',
          'All sources: Watermark is visible, not intrusive, and file size increase is reasonable'
        ]
      }
    });

  } catch (error) {
    console.error('❌ [TEST-WATERMARK-SOURCES] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

