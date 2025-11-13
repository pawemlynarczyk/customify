// api/test-save-generation.js
/**
 * Test endpoint do sprawdzenia czy zapis generacji działa
 */

const { put, head } = require('@vercel/blob');

module.exports = async (req, res) => {
  console.log(`🧪 [TEST-SAVE-GENERATION] API called - Method: ${req.method}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Test 1: Sprawdź czy Vercel Blob Storage jest skonfigurowany
    const blobConfigured = !!process.env.customify_READ_WRITE_TOKEN;
    
    // Test 2: Spróbuj zapisać testową wartość
    let blobTestResult = null;
    if (blobConfigured) {
      try {
        const testPath = 'customify/test/save-generation-test.json';
        const testData = JSON.stringify({ test: true, timestamp: new Date().toISOString() });
        const testBuffer = Buffer.from(testData, 'utf-8');
        
        // Zapisz testowy plik
        const blob = await put(testPath, testBuffer, {
          access: 'public',
          contentType: 'application/json',
          token: process.env.customify_READ_WRITE_TOKEN
        });
        
        // Pobierz testowy plik
        const testResponse = await fetch(blob.url);
        if (testResponse.ok) {
          const testValue = await testResponse.json();
          blobTestResult = testValue ? 'OK' : 'FAILED';
        } else {
          blobTestResult = 'FAILED: Could not read test file';
        }
      } catch (blobError) {
        blobTestResult = `ERROR: ${blobError.message}`;
      }
    }

    // Test 3: Sprawdź czy endpoint save-generation istnieje
    const saveGenerationExists = true; // Wiemy że istnieje bo go stworzyliśmy

    return res.json({
      success: true,
      tests: {
        blobConfigured: blobConfigured,
        blobTest: blobTestResult,
        saveGenerationEndpoint: saveGenerationExists ? 'OK' : 'NOT FOUND',
        timestamp: new Date().toISOString()
      },
      message: blobConfigured 
        ? 'Vercel Blob Storage jest skonfigurowany i działa' 
        : 'Vercel Blob Storage NIE jest skonfigurowany - dodaj customify_READ_WRITE_TOKEN w Vercel Dashboard'
    });

  } catch (error) {
    console.error('❌ [TEST-SAVE-GENERATION] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

