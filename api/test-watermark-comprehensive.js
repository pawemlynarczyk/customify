// api/test-watermark-comprehensive.js
// 🧪 KOMPLEKSOWY TEST WATERMARK - Testowanie różnych scenariuszy przed wdrożeniem
// Testuje: różne rozmiary, formaty, źródła obrazów

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
    console.log('🧪 [TEST-WATERMARK-COMPREHENSIVE] Starting comprehensive watermark tests...');

    const blobToken = process.env.customify_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      return res.status(500).json({ error: 'Vercel Blob Storage not configured' });
    }

    // Test cases - różne scenariusze używane w transform.js
    const testCases = [
      {
        name: 'Portret 3:4 (Boho, Koty, Król)',
        imageUrl: 'https://customify-s56o.vercel.app/koty/krolewski.png',
        expectedSize: '896x1152',
        productType: 'boho/cats/king',
        description: 'Standardowy format portretowy używany dla większości stylów'
      },
      {
        name: 'Krajobraz 4:3 (SDXL)',
        imageUrl: 'https://customify-s56o.vercel.app/koty/krolewski.png', // Użyjemy tego samego, ale zmienimy rozmiar
        expectedSize: '1152x896',
        productType: 'landscape',
        description: 'Format krajobrazowy dla niektórych stylów SDXL'
      },
      {
        name: 'Kwadrat 1024x1024 (Koty)',
        imageUrl: 'https://customify-s56o.vercel.app/koty/krolewski.png',
        expectedSize: '1024x1024',
        productType: 'cats-square',
        description: 'Format kwadratowy używany dla niektórych stylów kotów'
      },
      {
        name: 'Portret 1024x1536 (Karykatura Segmind)',
        imageUrl: 'https://customify-s56o.vercel.app/koty/krolewski.png',
        expectedSize: '1024x1536',
        productType: 'caricature',
        description: 'Format portretowy 2:3 dla karykatury Segmind (używany w transform.js)'
      }
    ];

    const watermarkUrl = 'https://customify-s56o.vercel.app/watermark_22.png';
    console.log('📥 [TEST-WATERMARK-COMPREHENSIVE] Fetching watermark:', watermarkUrl);
    
    const watermarkResponse = await fetch(watermarkUrl);
    if (!watermarkResponse.ok) {
      return res.status(404).json({ error: 'Watermark PNG not found' });
    }

    const watermarkBuffer = Buffer.from(await watermarkResponse.arrayBuffer());
    console.log('✅ [TEST-WATERMARK-COMPREHENSIVE] Watermark loaded:', watermarkBuffer.length, 'bytes');

    const results = [];

    for (const testCase of testCases) {
      try {
        console.log(`\n🧪 [TEST-WATERMARK-COMPREHENSIVE] Testing: ${testCase.name}`);
        
        // Pobierz testowy obrazek
        const imageResponse = await fetch(testCase.imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch test image: ${imageResponse.status}`);
        }
        
        let imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        const originalMetadata = await sharp(imageBuffer).metadata();
        
        // Zmień rozmiar obrazu do oczekiwanego formatu (jeśli potrzeba)
        const [targetWidth, targetHeight] = testCase.expectedSize.split('x').map(Number);
        if (originalMetadata.width !== targetWidth || originalMetadata.height !== targetHeight) {
          console.log(`📐 [TEST-WATERMARK-COMPREHENSIVE] Resizing image to ${targetWidth}x${targetHeight}`);
          imageBuffer = await sharp(imageBuffer)
            .resize(targetWidth, targetHeight, {
              fit: 'cover',
              position: 'center'
            })
            .jpeg({ quality: 92 })
            .toBuffer();
        }

        const metadata = await sharp(imageBuffer).metadata();
        const { width, height } = metadata;
        console.log(`📐 [TEST-WATERMARK-COMPREHENSIVE] Image dimensions: ${width}x${height}`);

        // Oblicz rozmiar watermarku (40% z mniejszego wymiaru)
        const watermarkSize = Math.min(width, height) * 0.40;
        console.log(`📏 [TEST-WATERMARK-COMPREHENSIVE] Watermark size: ${Math.round(watermarkSize)}px`);

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
        const filename = `customify/test/watermark-comprehensive-${testCase.productType}-${timestamp}.jpg`;
        
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
          productType: testCase.productType,
          description: testCase.description,
          imageSize: `${width}x${height}`,
          watermarkSize: `${Math.round(watermarkSize)}px`,
          watermarkedImageUrl: blob.url,
          originalSize: originalSize,
          watermarkedSize: watermarkedSize,
          sizeIncrease: `${sizeIncrease}%`,
          status: 'success'
        });

        console.log(`✅ [TEST-WATERMARK-COMPREHENSIVE] ${testCase.name}: SUCCESS`);

      } catch (error) {
        console.error(`❌ [TEST-WATERMARK-COMPREHENSIVE] ${testCase.name}: ERROR`, error);
        results.push({
          testCase: testCase.name,
          productType: testCase.productType,
          status: 'error',
          error: error.message
        });
      }
    }

    return res.json({
      success: true,
      message: 'Comprehensive watermark tests completed',
      watermarkUrl: watermarkUrl,
      results: results,
      summary: {
        total: results.length,
        success: results.filter(r => r.status === 'success').length,
        errors: results.filter(r => r.status === 'error').length
      },
      instructions: {
        check: 'Open each watermarkedImageUrl to verify watermark looks good',
        verify: [
          'Watermark is visible but not intrusive (22% opacity)',
          'Watermark is repeated in diagonal grid pattern',
          'Watermark size is appropriate (40% of image)',
          'Image quality is preserved (92% JPEG)',
          'File size increase is reasonable (<20%)'
        ]
      }
    });

  } catch (error) {
    console.error('❌ [TEST-WATERMARK-COMPREHENSIVE] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

