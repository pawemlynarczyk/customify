// api/increment-usage.js
/**
 * API endpoint do inkrementacji liczby użyć po udanej transformacji
 * Tylko dla zalogowanych użytkowników (Shopify Customer Metafields)
 */

const { checkRateLimit, getClientIP } = require('../utils/vercelRateLimiter');
const { SHOPIFY_API_VERSION } = require('../utils/shopifyConfig');

module.exports = async (req, res) => {
  console.log(`➕ [INCREMENT-USAGE] API called - Method: ${req.method}`);
  
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
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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
    
    // IP-based rate limiting
    const ip = getClientIP(req);
    if (!checkRateLimit(ip, 100, 15 * 60 * 1000)) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: 900
      });
    }

    // Wymagane dla zalogowanych użytkowników
    if (!customerId || !customerAccessToken) {
      console.log(`❌ [INCREMENT-USAGE] Brak customerId lub token - pomijam inkrementację`);
      return res.json({
        success: false,
        message: 'Nie zalogowany - inkrementacja tylko dla zalogowanych'
      });
    }

    console.log(`➕ [INCREMENT-USAGE] Inkrementacja dla użytkownika: ${customerId}`);
    
    const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
      console.error('❌ [INCREMENT-USAGE] SHOPIFY_ACCESS_TOKEN not configured');
      return res.status(500).json({ error: 'Shopify not configured' });
    }

    // 1. Pobierz obecną wartość metafield (namespace: customify, key: usage_count)
    const getQuery = `
      query getCustomerUsage($id: ID!) {
        customer(id: $id) {
          id
          metafield(namespace: "customify", key: "usage_count") {
            id
            value
          }
        }
      }
    `;

    const getResponse = await fetch(`https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        query: getQuery,
        variables: {
          id: `gid://shopify/Customer/${customerId}`
        }
      })
    });

    const getData = await getResponse.json();
    console.log(`📊 [INCREMENT-USAGE] Current metafield:`, JSON.stringify(getData, null, 2));

    if (getData.errors) {
      console.error('❌ [INCREMENT-USAGE] Shopify GraphQL errors:', getData.errors);
      return res.status(500).json({ error: 'Failed to fetch usage data' });
    }

    const customer = getData.data?.customer;
    const currentUsage = parseInt(customer?.metafield?.value || '0', 10);
    const newUsage = currentUsage + 1;

    console.log(`📊 [INCREMENT-USAGE] Inkrementacja: ${currentUsage} → ${newUsage}`);

    // 2. Zaktualizuj metafield
    const updateMutation = `
      mutation updateCustomerUsage($input: CustomerInput!) {
        customerUpdate(input: $input) {
          customer {
            id
            metafield(namespace: "customify", key: "usage_count") {
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const updateResponse = await fetch(`https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        query: updateMutation,
        variables: {
          input: {
            id: `gid://shopify/Customer/${customerId}`,
            metafields: [
              {
                namespace: 'customify',
                key: 'usage_count',
                value: newUsage.toString(),
                type: 'number_integer'
              }
            ]
          }
        }
      })
    });

    const updateData = await updateResponse.json();
    console.log(`✅ [INCREMENT-USAGE] Update response:`, JSON.stringify(updateData, null, 2));

    if (updateData.data?.customerUpdate?.userErrors?.length > 0) {
      console.error('❌ [INCREMENT-USAGE] User errors:', updateData.data.customerUpdate.userErrors);
      return res.status(500).json({ 
        error: 'Failed to update usage count',
        details: updateData.data.customerUpdate.userErrors
      });
    }

    return res.json({
      success: true,
      previousUsage: currentUsage,
      newUsage: newUsage,
      message: `Użycie zaktualizowane: ${newUsage}`
    });

  } catch (error) {
    console.error('❌ [INCREMENT-USAGE] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

