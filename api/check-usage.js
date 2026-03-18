// api/check-usage.js
/**
 * API endpoint do sprawdzania limitów użycia
 * - Niezalogowani: 1 darmowa transformacja (Device Token)
 * - Zalogowani: 3 darmowe transformacje (Shopify Metafields)
 */

const { checkRateLimit, getClientIP } = require('../utils/vercelRateLimiter');

// 🧪 Lista emaili testowych (pomijają WSZYSTKIE limity dla testowania)
const TEST_EMAILS = new Set([
  'pawel.mlynarczyk@internetcapital.pl', // Admin email - bypass wszystkich limitów
  'fabrykaetui@gmail.com', // Bez limitu transformacji
]);

// 🚫 Lista zablokowanych emaili (brak możliwości dodawania kredytów / generacji) – musi być zsynchronizowana z api/transform.js
const BLOCKED_EMAILS = new Set([
  'angelika.pacewicz@gmail.com',
]);

function isBlockedUser(email) {
  return email && BLOCKED_EMAILS.has(email.toLowerCase());
}

/**
 * Sprawdza czy użytkownik jest na liście testowej (bypass wszystkich limitów)
 * @param {string} email - Email użytkownika
 * @returns {boolean} - true jeśli użytkownik jest na liście testowej
 */
function isTestUser(email) {
  const isTestEmail = email && TEST_EMAILS.has(email.toLowerCase());
  
  if (isTestEmail) {
    console.log(`🧪 [CHECK-USAGE] Test user detected:`, {
      email: email ? email.substring(0, 10) + '...' : 'brak'
    });
    return true;
  }
  return false;
}

module.exports = async (req, res) => {
  console.log(`🔍 [CHECK-USAGE] API called - Method: ${req.method}`);
  
  // CORS headers
  const allowedOrigins = [
    'https://lumly.pl',
    'https://customify-s56o.vercel.app',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // ✅ Wymagane dla credentials: 'include'
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
    // ⚠️ UWAGA: Nie można użyć '*' z Access-Control-Allow-Credentials: true
    // Więc dla innych origin nie ustawiamy credentials
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerId, customerAccessToken, productType } = req.body;
    
    // IP-based rate limiting (backup security)
    const ip = getClientIP(req);
    if (!checkRateLimit(ip, 100, 15 * 60 * 1000)) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests from this IP',
        retryAfter: 900
      });
    }

    // Jeśli nie zalogowany - zwróć limit 3 (Vercel KV sprawdza device token)
    if (!customerId || !customerAccessToken) {
      console.log(`👤 [CHECK-USAGE] Niezalogowany użytkownik - limit 3 użycia TOTAL`);
      return res.json({
        isLoggedIn: false,
        totalLimit: 3,
        usedCount: 0, // KV sprawdza device token
        remainingCount: 3,
        message: 'Masz 3 darmowe transformacje. Zaloguj się dla więcej!'
      });
    }

    // Zalogowany użytkownik - sprawdź Shopify Metafields
    console.log(`✅ [CHECK-USAGE] Zalogowany użytkownik: ${customerId}`);
    
    const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
      console.error('❌ [CHECK-USAGE] SHOPIFY_ACCESS_TOKEN not configured');
      return res.status(500).json({ error: 'Shopify not configured' });
    }

    // Pobierz metafield z liczbą użyć (namespace: customify, key: usage_count)
    const metafieldQuery = `
      query getCustomerUsage($id: ID!) {
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

    const metafieldResponse = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        query: metafieldQuery,
        variables: {
          id: `gid://shopify/Customer/${customerId}`
        }
      })
    });

    const metafieldData = await metafieldResponse.json();
    console.log(`📊 [CHECK-USAGE] Metafield response:`, JSON.stringify(metafieldData, null, 2));

    if (metafieldData.errors) {
      console.error('❌ [CHECK-USAGE] Shopify GraphQL errors:', metafieldData.errors);
      return res.status(500).json({ error: 'Failed to fetch usage data' });
    }

    const customer = metafieldData.data?.customer;
    
    console.log(`🔍 [CHECK-USAGE] Customer data:`, {
      hasCustomer: !!customer,
      customerId: customer?.id || null,
      email: customer?.email || null,
      hasMetafield: !!customer?.metafield,
      metafieldId: customer?.metafield?.id || null,
      metafieldType: customer?.metafield?.type || null,
      metafieldValue: customer?.metafield?.value || null
    });
    
    console.log(`🔍 [CHECK-USAGE] Request body:`, {
      customerId: customerId,
      hasCustomerAccessToken: !!customerAccessToken,
      productType: productType,
      productTypeType: typeof productType
    });
    
    // Parsuj JSON lub konwertuj stary format (liczba)
    let usageData;
    try {
      const rawValue = customer?.metafield?.value || '{}';
      console.log(`🔍 [CHECK-USAGE] Parsing metafield value:`, {
        rawValue: rawValue,
        type: typeof rawValue
      });
      usageData = JSON.parse(rawValue);
      if (typeof usageData !== 'object' || usageData === null || Array.isArray(usageData)) {
        throw new Error('Not a valid JSON object');
      }
      console.log(`✅ [CHECK-USAGE] Parsed JSON successfully:`, usageData);
    } catch (parseError) {
      // Stary format (liczba) → konwertuj
      const rawValue = customer?.metafield?.value || '0';
      const oldTotal = parseInt(rawValue, 10);
      console.log(`⚠️ [CHECK-USAGE] Stary format metafield:`, {
        rawValue: rawValue,
        parsedTotal: oldTotal,
        parseError: parseError.message
      });
      usageData = {
        total: oldTotal,
        other: oldTotal  // Wszystkie stare → "other"
      };
      console.log(`⚠️ [CHECK-USAGE] Konwertuję: ${oldTotal} →`, usageData);
    }
    
    const totalLimit = 4; // 4 darmowe generacje TOTAL dla zalogowanych
    
    // 🧪 BYPASS: Test users mają nieograniczone generacje
    const customerEmail = customer?.email || null;
    const isTest = isTestUser(customerEmail);
    
    // 🚫 BLOKADA: Zablokowani użytkownicy nie mogą dodawać kredytów
    if (isBlockedUser(customerEmail)) {
      console.warn(`🚫 [CHECK-USAGE] Zablokowany użytkownik:`, customerEmail ? customerEmail.substring(0, 15) + '...' : 'brak');
      return res.status(403).json({
        error: 'blocked',
        blocked: true,
        usedCount: 4,
        totalLimit: 4,
        remainingCount: 0
      });
    }
    
    if (isTest) {
      console.log(`🧪 [CHECK-USAGE] Test user - zwracam nieograniczone generacje`);
      return res.json({
        isLoggedIn: true,
        customerId: customerId,
        email: customerEmail,
        totalLimit: 999, // Nieograniczone dla test user
        usedCount: 0,
        remainingCount: 999, // Nieograniczone dla test user
        message: 'Nieograniczone generacje (test user)',
        isTestUser: true
      });
    }
    
    // Sprawdź TOTAL (bez per productType)
    const totalUsed = usageData.total || 0;
    const totalRemaining = Math.max(0, totalLimit - totalUsed);
    
    console.log(`📊 [CHECK-USAGE] Limit check TOTAL:`, {
      totalUsed: totalUsed,
      totalLimit: totalLimit,
      totalRemaining: totalRemaining,
      calculation: `${totalLimit} - ${totalUsed} = ${totalRemaining}`
    });

    return res.json({
      isLoggedIn: true,
      customerId: customerId,
      email: customer?.email,
      totalLimit: totalLimit,
      usedCount: totalUsed,
      remainingCount: totalRemaining,
      message: totalRemaining > 0 
        ? `Pozostało ${totalRemaining} transformacji`
        : 'Wykorzystałeś wszystkie transformacje'
    });

  } catch (error) {
    console.error('❌ [CHECK-USAGE] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

