// api/test-kv.js
/**
 * Test endpoint do sprawdzenia czy Vercel KV działa
 */

const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  console.log(`🧪 [TEST-KV] API called - Method: ${req.method}`);
  
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
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Sprawdź czy zmienne środowiskowe są ustawione
    const hasKvUrl = !!process.env.KV_REST_API_URL;
    const hasKvToken = !!process.env.KV_REST_API_TOKEN;
    
    console.log(`🔍 [TEST-KV] Environment check:`, {
      hasKvUrl,
      hasKvToken,
      kvUrlPreview: hasKvUrl ? process.env.KV_REST_API_URL.substring(0, 30) + '...' : null
    });

    if (!hasKvUrl || !hasKvToken) {
      return res.status(500).json({
        success: false,
        error: 'KV not configured',
        message: 'Brakuje zmiennych środowiskowych KV_REST_API_URL lub KV_REST_API_TOKEN',
        kvConfigured: false,
        hasKvUrl,
        hasKvToken
      });
    }

    // Test 1: Ping KV
    console.log(`🧪 [TEST-KV] Test 1: Ping KV...`);
    let pingResult;
    try {
      // Upstash nie ma ping(), więc spróbujmy prosty get
      await kv.get('test-ping-key');
      pingResult = 'OK';
    } catch (pingError) {
      console.warn(`⚠️ [TEST-KV] Ping test failed:`, pingError.message);
      pingResult = `Error: ${pingError.message}`;
    }

    // Test 2: Set value
    console.log(`🧪 [TEST-KV] Test 2: Set value...`);
    const testKey = `test-${Date.now()}`;
    const testValue = 'test-value-' + Date.now();
    let setResult;
    try {
      await kv.set(testKey, testValue);
      setResult = 'OK';
    } catch (setError) {
      console.error(`❌ [TEST-KV] Set test failed:`, setError);
      setResult = `Error: ${setError.message}`;
    }

    // Test 3: Get value
    console.log(`🧪 [TEST-KV] Test 3: Get value...`);
    let getResult;
    let getValue;
    try {
      getValue = await kv.get(testKey);
      getResult = getValue === testValue ? 'OK' : `Mismatch: expected ${testValue}, got ${getValue}`;
    } catch (getError) {
      console.error(`❌ [TEST-KV] Get test failed:`, getError);
      getResult = `Error: ${getError.message}`;
    }

    // Test 4: Increment (atomic operation)
    console.log(`🧪 [TEST-KV] Test 4: Increment (atomic)...`);
    const incrementKey = `test-increment-${Date.now()}`;
    let incrementResult;
    let incrementValue;
    try {
      await kv.set(incrementKey, 0);
      incrementValue = await kv.incr(incrementKey);
      incrementResult = incrementValue === 1 ? 'OK' : `Expected 1, got ${incrementValue}`;
    } catch (incrError) {
      console.error(`❌ [TEST-KV] Increment test failed:`, incrError);
      incrementResult = `Error: ${incrError.message}`;
    }

    // Test 5: Set with TTL
    console.log(`🧪 [TEST-KV] Test 5: Set with TTL...`);
    const ttlKey = `test-ttl-${Date.now()}`;
    let ttlResult;
    try {
      await kv.set(ttlKey, 'ttl-value', { ex: 60 }); // 60 sekund TTL
      ttlResult = 'OK';
    } catch (ttlError) {
      console.error(`❌ [TEST-KV] TTL test failed:`, ttlError);
      ttlResult = `Error: ${ttlError.message}`;
    }

    // Cleanup: usuń testowe klucze
    try {
      await kv.del(testKey, incrementKey, ttlKey);
      console.log(`🧹 [TEST-KV] Cleanup: usunięto testowe klucze`);
    } catch (cleanupError) {
      console.warn(`⚠️ [TEST-KV] Cleanup failed:`, cleanupError.message);
    }

    const allTestsPassed = 
      pingResult === 'OK' &&
      setResult === 'OK' &&
      getResult === 'OK' &&
      incrementResult === 'OK' &&
      ttlResult === 'OK';

    return res.json({
      success: allTestsPassed,
      kvConfigured: true,
      message: allTestsPassed 
        ? '✅ Vercel KV działa poprawnie!' 
        : '⚠️ Niektóre testy nie przeszły',
      tests: {
        ping: pingResult,
        set: setResult,
        get: getResult,
        increment: incrementResult,
        ttl: ttlResult
      },
      details: {
        testKey,
        testValue,
        getValue,
        incrementValue,
        kvUrlConfigured: hasKvUrl,
        kvTokenConfigured: hasKvToken
      }
    });

  } catch (error) {
    console.error('❌ [TEST-KV] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      kvConfigured: !!process.env.KV_REST_API_URL,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

