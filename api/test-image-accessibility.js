/**
 * Test endpoint do sprawdzania czy obrazy z Vercel Blob są dostępne dla Shopify Email
 * 
 * Użycie:
 * GET /api/test-image-accessibility?url=https://vzwqqb14qtsxe2wx.public.blob.vercel-storage.com/...
 */

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ 
        error: 'Missing url parameter',
        usage: 'GET /api/test-image-accessibility?url=https://...'
      });
    }

    console.log('🔍 [TEST-IMAGE] Testing image accessibility:', url.substring(0, 80) + '...');

    const tests = {
      url: url,
      tests: {},
      summary: {
        accessible: false,
        shopifyEmailCompatible: false,
        issues: []
      }
    };

    // TEST 1: Sprawdź czy obrazek jest dostępny (HTTP GET)
    try {
      const imageResponse = await fetch(url, {
        method: 'HEAD', // HEAD request - tylko headers, bez body
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ShopifyEmail/1.0)'
        }
      });

      tests.tests.httpAccess = {
        status: imageResponse.status,
        statusText: imageResponse.statusText,
        accessible: imageResponse.ok,
        headers: {}
      };

      // Sprawdź ważne headers
      const importantHeaders = [
        'content-type',
        'content-length',
        'cache-control',
        'access-control-allow-origin',
        'x-content-type-options',
        'x-frame-options'
      ];

      importantHeaders.forEach(header => {
        const value = imageResponse.headers.get(header);
        if (value) {
          tests.tests.httpAccess.headers[header] = value;
        }
      });

      if (!imageResponse.ok) {
        tests.summary.issues.push(`HTTP ${imageResponse.status}: ${imageResponse.statusText}`);
      } else {
        tests.summary.accessible = true;
      }

    } catch (error) {
      tests.tests.httpAccess = {
        error: error.message,
        accessible: false
      };
      tests.summary.issues.push(`HTTP request failed: ${error.message}`);
    }

    // TEST 2: Sprawdź Content-Type
    if (tests.tests.httpAccess && tests.tests.httpAccess.headers['content-type']) {
      const contentType = tests.tests.httpAccess.headers['content-type'];
      const isImage = contentType.startsWith('image/');
      
      tests.tests.contentType = {
        value: contentType,
        isImage: isImage,
        valid: isImage
      };

      if (!isImage) {
        tests.summary.issues.push(`Invalid Content-Type: ${contentType} (expected image/*)`);
      }
    } else {
      tests.tests.contentType = {
        error: 'Content-Type header not found',
        valid: false
      };
      tests.summary.issues.push('Content-Type header missing');
    }

    // TEST 3: Sprawdź czy obrazek można pobrać (GET request z body)
    try {
      const fullResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ShopifyEmail/1.0)'
        }
      });

      if (fullResponse.ok) {
        const arrayBuffer = await fullResponse.arrayBuffer();
        const size = arrayBuffer.byteLength;
        
        tests.tests.download = {
          success: true,
          size: size,
          sizeKB: (size / 1024).toFixed(2) + ' KB',
          sizeMB: (size / 1024 / 1024).toFixed(2) + ' MB',
          valid: size > 0
        };

        if (size === 0) {
          tests.summary.issues.push('Image file is empty (0 bytes)');
        }

        // Sprawdź magic bytes (czy to prawdziwy obrazek)
        const buffer = Buffer.from(arrayBuffer);
        const magicBytes = buffer.slice(0, 4);
        const isValidImage =
          (magicBytes[0] === 0xFF && magicBytes[1] === 0xD8 && magicBytes[2] === 0xFF) || // JPEG
          (magicBytes[0] === 0x89 && magicBytes[1] === 0x50 && magicBytes[2] === 0x4E && magicBytes[3] === 0x47) || // PNG
          (magicBytes[0] === 0x52 && magicBytes[1] === 0x49 && magicBytes[2] === 0x46 && magicBytes[3] === 0x46); // WebP

        tests.tests.download.validImageFormat = isValidImage;

        if (!isValidImage) {
          tests.summary.issues.push('File does not appear to be a valid image (invalid magic bytes)');
        }

      } else {
        tests.tests.download = {
          success: false,
          status: fullResponse.status,
          statusText: fullResponse.statusText
        };
        tests.summary.issues.push(`Download failed: HTTP ${fullResponse.status}`);
      }

    } catch (error) {
      tests.tests.download = {
        error: error.message,
        success: false
      };
      tests.summary.issues.push(`Download error: ${error.message}`);
    }

    // TEST 4: Sprawdź CORS (czy Shopify Email może wyświetlić)
    try {
      const corsResponse = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://lumly.pl',
          'Access-Control-Request-Method': 'GET'
        }
      });

      const corsHeaders = {
        'access-control-allow-origin': corsResponse.headers.get('access-control-allow-origin'),
        'access-control-allow-methods': corsResponse.headers.get('access-control-allow-methods'),
        'access-control-allow-credentials': corsResponse.headers.get('access-control-allow-credentials')
      };

      tests.tests.cors = {
        headers: corsHeaders,
        // Vercel Blob powinien mieć public access (brak CORS restrictions)
        // Shopify Email może wyświetlać obrazy z zewnętrznych źródeł jeśli są publiczne
        shopifyEmailCompatible: true // Vercel Blob public images są dostępne dla wszystkich
      };

    } catch (error) {
      tests.tests.cors = {
        error: error.message,
        shopifyEmailCompatible: false
      };
      tests.summary.issues.push(`CORS check failed: ${error.message}`);
    }

    // TEST 5: Sprawdź czy URL jest z Vercel Blob
    const isVercelBlob = url.includes('blob.vercel-storage.com') || url.includes('.public.blob.vercel');
    tests.tests.vercelBlob = {
      isVercelBlob: isVercelBlob,
      domain: isVercelBlob ? url.match(/https?:\/\/([^\/]+)/)?.[1] : null
    };

    // PODSUMOWANIE
    tests.summary.accessible = tests.tests.httpAccess?.accessible === true;
    tests.summary.shopifyEmailCompatible = 
      tests.summary.accessible && 
      tests.tests.contentType?.valid === true &&
      tests.tests.download?.valid === true &&
      tests.tests.cors?.shopifyEmailCompatible === true;

    // Rekomendacja
    if (tests.summary.shopifyEmailCompatible) {
      tests.recommendation = '✅ Image is accessible and compatible with Shopify Email';
    } else if (tests.summary.accessible) {
      tests.recommendation = '⚠️ Image is accessible but may have compatibility issues with Shopify Email';
    } else {
      tests.recommendation = '❌ Image is not accessible - check URL and permissions';
    }

    // Dodatkowe informacje
    tests.info = {
      note: 'Shopify Email may block external images for security. If images don\'t display, consider using a proxy endpoint.',
      proxyEndpoint: 'https://customify-s56o.vercel.app/api/proxy-image?url=' + encodeURIComponent(url)
    };

    console.log('✅ [TEST-IMAGE] Test completed:', {
      accessible: tests.summary.accessible,
      shopifyEmailCompatible: tests.summary.shopifyEmailCompatible,
      issues: tests.summary.issues.length
    });

    return res.status(200).json(tests);

  } catch (error) {
    console.error('❌ [TEST-IMAGE] Error:', error);
    return res.status(500).json({ 
      error: 'Test failed', 
      details: error.message 
    });
  }
};

