// api/update-customer-generations.js
/**
 * Aktualizuje Customer Metafield w Shopify z listą generacji
 * Używane do wyświetlania generacji w Shopify Admin na koncie klienta
 */

module.exports = async (req, res) => {
  console.log(`📝 [UPDATE-CUSTOMER-GENERATIONS] API called - Method: ${req.method}`);
  
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
    const { customerId, generations } = req.body;

    if (!customerId) {
      return res.status(400).json({ 
        error: 'Missing required field: customerId' 
      });
    }

    if (!generations || !Array.isArray(generations)) {
      return res.status(400).json({ 
        error: 'Missing or invalid field: generations (must be array)' 
      });
    }

    const shopDomain = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(500).json({
        error: 'Shopify access token not configured'
      });
    }

    // Przygotuj dane do zapisu (tylko podstawowe info - metafield ma limit)
    const generationsData = {
      totalGenerations: generations.length,
      purchasedCount: generations.filter(g => g.purchased).length,
      lastGenerationDate: generations[0]?.date || null,
      generations: generations.slice(0, 20).map(gen => ({
        id: gen.id,
        imageUrl: gen.imageUrl,
        style: gen.style,
        date: gen.date,
        purchased: gen.purchased || false,
        orderId: gen.orderId || null
      }))
    };

    // GraphQL mutation do aktualizacji Customer Metafield
    const mutation = `
      mutation updateCustomerGenerations($input: CustomerInput!) {
        customerUpdate(input: $input) {
          customer {
            id
            metafield(namespace: "customify", key: "ai_generations") {
              id
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

    const variables = {
      input: {
        id: `gid://shopify/Customer/${customerId}`,
        metafields: [
          {
            namespace: 'customify',
            key: 'ai_generations',
            value: JSON.stringify(generationsData),
            type: 'json'
          }
        ]
      }
    };

    const response = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        query: mutation,
        variables: variables
      })
    });

    const data = await response.json();

    if (data.errors) {
      console.error('❌ [UPDATE-CUSTOMER-GENERATIONS] GraphQL errors:', data.errors);
      return res.status(500).json({
        error: 'GraphQL errors',
        details: data.errors
      });
    }

    if (data.data?.customerUpdate?.userErrors?.length > 0) {
      console.error('❌ [UPDATE-CUSTOMER-GENERATIONS] User errors:', data.data.customerUpdate.userErrors);
      return res.status(400).json({
        error: 'Customer update failed',
        details: data.data.customerUpdate.userErrors
      });
    }

    console.log(`✅ [UPDATE-CUSTOMER-GENERATIONS] Customer ${customerId} metafield updated successfully`);

    return res.json({
      success: true,
      customerId: customerId,
      totalGenerations: generationsData.totalGenerations,
      purchasedCount: generationsData.purchasedCount,
      message: 'Customer metafield updated successfully'
    });

  } catch (error) {
    console.error('❌ [UPDATE-CUSTOMER-GENERATIONS] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

