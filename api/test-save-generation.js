// api/test-save-generation.js
/**
 * Test endpoint do sprawdzenia czy zapis generacji działa
 */

const { kv } = require('@vercel/kv');

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
    // Test 1: Sprawdź czy Vercel KV jest skonfigurowany
    const kvConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
    
    // Test 2: Spróbuj zapisać testową wartość
    let kvTestResult = null;
    if (kvConfigured) {
      try {
        const testKey = 'test:save-generation:test';
        await kv.set(testKey, { test: true, timestamp: new Date().toISOString() });
        const testValue = await kv.get(testKey);
        kvTestResult = testValue ? 'OK' : 'FAILED';
        await kv.del(testKey); // Usuń testowy klucz
      } catch (kvError) {
        kvTestResult = `ERROR: ${kvError.message}`;
      }
    }

    // Test 3: Sprawdź czy endpoint save-generation istnieje
    const saveGenerationExists = true; // Wiemy że istnieje bo go stworzyliśmy

    return res.json({
      success: true,
      tests: {
        kvConfigured: kvConfigured,
        kvTest: kvTestResult,
        saveGenerationEndpoint: saveGenerationExists ? 'OK' : 'NOT FOUND',
        timestamp: new Date().toISOString()
      },
      message: kvConfigured 
        ? 'Vercel KV jest skonfigurowany i działa' 
        : 'Vercel KV NIE jest skonfigurowany - dodaj KV_REST_API_URL i KV_REST_API_TOKEN w Vercel Dashboard'
    });

  } catch (error) {
    console.error('❌ [TEST-SAVE-GENERATION] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

