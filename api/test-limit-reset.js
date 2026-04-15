/**
 * Endpoint testowy - symuluje reset limitu dla jednego użytkownika
 * 1. Zmienia timestamp w kolejce na "2h temu"
 * 2. Uruchamia check-and-reset-limits
 * 3. Sprawdza czy usage_count został zresetowany
 */

const { kv } = require('@vercel/kv');
const { SHOPIFY_API_VERSION } = require('../utils/shopifyConfig');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed - use POST' });
  }

  try {
    const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(500).json({ error: 'SHOPIFY_ACCESS_TOKEN not configured' });
    }

    console.log('🧪 [TEST-RESET] === ROZPOCZYNAM TEST RESETU LIMITU ===');

    // KROK 1: Pobierz wszystkie wpisy z kolejki
    const keys = await kv.keys('limit-reached:*');
    
    if (keys.length === 0) {
      return res.status(400).json({ 
        error: 'Kolejka jest pusta - najpierw uruchom /api/populate-limit-queue' 
      });
    }

    console.log(`📋 [TEST-RESET] Znaleziono ${keys.length} wpisów w kolejce`);

    // KROK 2: Wybierz użytkownika do testu (użytkownik z 4-5 użyciami, nie admin)
    let testKey = null;
    let testCustomerId = null;
    let testPayload = null;

    for (const key of keys) {
      const data = await kv.get(key);
      let payload;
      try {
        payload = typeof data === 'string' ? JSON.parse(data) : data;
      } catch {
        payload = data;
      }

      // Wybierz użytkownika z 4-5 użyciami (nie admin z 56)
      if (payload.totalUsed >= 4 && payload.totalUsed <= 5 && payload.email !== 'pawel.mlynarczyk@internetcapital.pl') {
        testKey = key;
        testCustomerId = key.replace('limit-reached:', '');
        testPayload = payload;
        break;
      }
    }

    if (!testKey) {
      return res.status(400).json({ 
        error: 'Nie znaleziono odpowiedniego użytkownika do testu (szukam 4-5 użyć, nie admin)' 
      });
    }

    console.log(`✅ [TEST-RESET] Wybrany użytkownik do testu:`, {
      customerId: testCustomerId,
      email: testPayload.email,
      usageCount: testPayload.totalUsed
    });

    // KROK 3: Pobierz OBECNY usage_count z Shopify (przed resetem)
    const queryBefore = `
      query getCustomer($id: ID!) {
        customer(id: $id) {
          id
          email
          metafield(namespace: "customify", key: "usage_count") {
            id
            value
            type
          }
        }
      }
    `;

    const responseBefore = await fetch(`https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        query: queryBefore,
        variables: { id: `gid://shopify/Customer/${testCustomerId}` }
      })
    });

    const dataBefore = await responseBefore.json();
    const customerBefore = dataBefore?.data?.customer;
    const metafieldBefore = customerBefore?.metafield;

    let usageBeforeReset = 0;
    let typeBefore = 'unknown';

    if (metafieldBefore) {
      typeBefore = metafieldBefore.type;
      try {
        if (typeBefore === 'json') {
          const parsed = JSON.parse(metafieldBefore.value);
          usageBeforeReset = parsed.total || 0;
        } else if (typeBefore === 'number_integer') {
          usageBeforeReset = parseInt(metafieldBefore.value, 10) || 0;
        }
      } catch (err) {
        console.error(`⚠️ [TEST-RESET] Błąd parsowania BEFORE:`, err);
      }
    }

    console.log(`📊 [TEST-RESET] PRZED resetem:`, {
      email: customerBefore?.email,
      usageCount: usageBeforeReset,
      type: typeBefore
    });

    // KROK 4: Zmień timestamp na "2 godziny temu"
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const modifiedPayload = {
      ...testPayload,
      timestamp: twoHoursAgo,
      modifiedBy: 'test-limit-reset'
    };

    await kv.set(testKey, JSON.stringify(modifiedPayload), { ex: 60 * 60 * 48 }); // 48h TTL
    console.log(`⏰ [TEST-RESET] Zmieniono timestamp na: ${twoHoursAgo} (2h temu)`);

    // KROK 5: Uruchom cron job (symulacja)
    console.log(`🔄 [TEST-RESET] Wywołuję /api/check-and-reset-limits...`);
    
    const cronResponse = await fetch(`https://${req.headers.host}/api/check-and-reset-limits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const cronResult = await cronResponse.json();
    console.log(`📋 [TEST-RESET] Wynik crona:`, cronResult);

    // Poczekaj chwilę na propagację
    await new Promise(resolve => setTimeout(resolve, 2000));

    // KROK 6: Sprawdź usage_count PO resecie
    const responseAfter = await fetch(`https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        query: queryBefore, // ta sama query
        variables: { id: `gid://shopify/Customer/${testCustomerId}` }
      })
    });

    const dataAfter = await responseAfter.json();
    const customerAfter = dataAfter?.data?.customer;
    const metafieldAfter = customerAfter?.metafield;

    let usageAfterReset = 0;
    let typeAfter = 'unknown';

    if (metafieldAfter) {
      typeAfter = metafieldAfter.type;
      try {
        if (typeAfter === 'json') {
          const parsed = JSON.parse(metafieldAfter.value);
          usageAfterReset = parsed.total || 0;
        } else if (typeAfter === 'number_integer') {
          usageAfterReset = parseInt(metafieldAfter.value, 10) || 0;
        }
      } catch (err) {
        console.error(`⚠️ [TEST-RESET] Błąd parsowania AFTER:`, err);
      }
    }

    console.log(`📊 [TEST-RESET] PO resecie:`, {
      email: customerAfter?.email,
      usageCount: usageAfterReset,
      type: typeAfter
    });

    // KROK 7: Sprawdź czy wpis został usunięty z kolejki
    const keyStillExists = await kv.get(testKey);

    const resetSuccessful = usageAfterReset === 0;
    const queueCleared = !keyStillExists;

    console.log(`✅ [TEST-RESET] === WYNIKI TESTU ===`);
    console.log(`   Reset usage_count: ${resetSuccessful ? 'OK' : 'FAIL'} (${usageBeforeReset} → ${usageAfterReset})`);
    console.log(`   Usunięcie z kolejki: ${queueCleared ? 'OK' : 'FAIL'}`);
    console.log(`   Email wysłany: ${cronResult.resetCount > 0 ? 'TAK' : 'NIE'}`);

    return res.status(200).json({
      success: true,
      test: {
        customerId: testCustomerId,
        email: testPayload.email,
        beforeReset: {
          usageCount: usageBeforeReset,
          type: typeBefore
        },
        afterReset: {
          usageCount: usageAfterReset,
          type: typeAfter
        },
        resetSuccessful,
        queueCleared,
        emailSent: cronResult.resetCount > 0
      },
      cronResult,
      verdict: resetSuccessful && queueCleared 
        ? '✅ TEST PASSED - System działa poprawnie!' 
        : '❌ TEST FAILED - Coś poszło nie tak'
    });

  } catch (error) {
    console.error('❌ [TEST-RESET] Błąd:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
};
