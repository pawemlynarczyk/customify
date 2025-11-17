// api/check-usage.js
/**
 * API endpoint do sprawdzania limitów użycia
 * - Niezalogowani: 1 darmowa transformacja (Device Token)
 * - Zalogowani: 3 darmowe transformacje (Shopify Metafields)
 */

const { checkRateLimit, getClientIP } = require('../utils/vercelRateLimiter');

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

    // Jeśli nie zalogowany - zwróć limit 1 (frontend sprawdza localStorage)
    if (!customerId || !customerAccessToken) {
      console.log(`👤 [CHECK-USAGE] Niezalogowany użytkownik - limit 1 użycia`);
      return res.json({
        isLoggedIn: false,
        totalLimit: 1,
        usedCount: 0, // Frontend sprawdza localStorage
        remainingCount: 1,
        message: 'Masz 1 darmową transformację. Zaloguj się dla więcej!'
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
    
    const totalLimit = 3; // 3 darmowe generacje per productType dla zalogowanych
    
    console.log(`📊 [CHECK-USAGE] Usage data:`, {
      usageData: usageData,
      productType: productType,
      hasProductType: !!productType
    });
    
    // Jeśli productType w request → zwróć per productType
    if (productType) {
      const usedForThisType = usageData[productType] || 0;
      const remainingForThisType = Math.max(0, totalLimit - usedForThisType);
      
      console.log(`📊 [CHECK-USAGE] Limit check dla ${productType}:`, {
        usedForThisType: usedForThisType,
        totalLimit: totalLimit,
        remainingForThisType: remainingForThisType,
        calculation: `${totalLimit} - ${usedForThisType} = ${remainingForThisType}`
      });
      
      return res.json({
        isLoggedIn: true,
        customerId: customerId,
        email: customer?.email,
        totalLimit: totalLimit,
        usedCount: usedForThisType,
        remainingCount: remainingForThisType,
        byProductType: usageData,
        productType: productType,
        message: remainingForThisType > 0 
          ? `Pozostało ${remainingForThisType} transformacji dla ${productType}` 
          : `Wykorzystałeś wszystkie transformacje dla ${productType}`
      });
    }
    
    // Fallback: zwróć total (dla backward compatibility)
    // ⚠️ FIX: Poprawne obliczanie - jeśli brak productType, zwróć limit dla pierwszego dostępnego typu
    const totalUsed = usageData.total || 0;
    // Jeśli total = 0, to znaczy że użytkownik nie ma żadnych generacji - zwróć limit dla pierwszego typu
    const totalRemaining = totalUsed === 0 ? totalLimit : Math.max(0, totalLimit - totalUsed);
    
    console.log(`📊 [CHECK-USAGE] Fallback (bez productType):`, {
      totalUsed: totalUsed,
      totalLimit: totalLimit,
      totalRemaining: totalRemaining,
      calculation: totalUsed === 0 ? `${totalLimit} (brak użyć)` : `${totalLimit} - ${totalUsed} = ${totalRemaining}`
    });

    return res.json({
      isLoggedIn: true,
      customerId: customerId,
      email: customer?.email,
      totalLimit: totalLimit,
      usedCount: totalUsed,
      remainingCount: totalRemaining,
      byProductType: usageData,
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

