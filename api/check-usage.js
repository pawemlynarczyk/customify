// api/check-usage.js
/**
 * API endpoint do sprawdzania limitów użycia
 * - Niezalogowani: 3 darmowe transformacje (localStorage frontend)
 * - Zalogowani: +10 dodatkowych transformacji (Shopify Metafields)
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
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
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
    const { customerId, customerAccessToken } = req.body;
    
    // IP-based rate limiting (backup security)
    const ip = getClientIP(req);
    if (!checkRateLimit(ip, 100, 15 * 60 * 1000)) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests from this IP',
        retryAfter: 900
      });
    }

    // Jeśli nie zalogowany - zwróć limit 3 (frontend sprawdza localStorage)
    if (!customerId || !customerAccessToken) {
      console.log(`👤 [CHECK-USAGE] Niezalogowany użytkownik - limit 3 użycia`);
      return res.json({
        isLoggedIn: false,
        totalLimit: 3,
        usedCount: 0, // Frontend sprawdza localStorage
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

    // Pobierz metafield z liczbą użyć (namespace: custom, key: usage_count)
    const metafieldQuery = `
      query getCustomerUsage($id: ID!) {
        customer(id: $id) {
          id
          email
          metafield(namespace: "custom", key: "usage_count") {
            value
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
    const usedCount = parseInt(customer?.metafield?.value || '0', 10);
    const totalLimit = 13; // 3 darmowe + 10 po zalogowaniu
    const remainingCount = Math.max(0, totalLimit - usedCount);

    console.log(`📊 [CHECK-USAGE] Użytkownik ${customer?.email}: ${usedCount}/${totalLimit} użyć`);

    return res.json({
      isLoggedIn: true,
      customerId: customerId,
      email: customer?.email,
      totalLimit: totalLimit,
      usedCount: usedCount,
      remainingCount: remainingCount,
      message: remainingCount > 0 
        ? `Pozostało ${remainingCount} transformacji` 
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

