// api/test-metafield-simple.js
/**
 * API endpoint do testowania metafield bez danych osobowych
 */

module.exports = async (req, res) => {
  console.log(`🧪 [TEST-METAFIELD] API called - Method: ${req.method}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!accessToken) {
    return res.status(500).json({ 
      error: 'SHOPIFY_ACCESS_TOKEN not configured'
    });
  }

  try {
    console.log(`🧪 [TEST-METAFIELD] Testuję metafield bez danych osobowych...`);
    
    // GraphQL query - TYLKO metafield, bez danych osobowych
    const query = `
      query {
        customer(id: "gid://shopify/Customer/24685923598661") {
          id
          metafield(namespace: "customify", key: "usage_count") {
            value
          }
        }
      }
    `;

    const response = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    console.log(`📊 [TEST-METAFIELD] Response:`, JSON.stringify(data, null, 2));
    
    if (data.errors) {
      console.error('❌ [TEST-METAFIELD] GraphQL errors:', data.errors);
      return res.status(500).json({ 
        error: 'Failed to fetch metafield',
        details: data.errors
      });
    }

    const customer = data.data?.customer;
    
    if (!customer) {
      return res.status(404).json({ 
        error: 'Customer not found',
        customerId: '24685923598661'
      });
    }

    const usageCount = customer.metafield?.value ? parseInt(customer.metafield.value, 10) : 0;

    return res.json({
      success: true,
      customerId: customer.id,
      metafield: {
        namespace: 'customify',
        key: 'usage_count',
        value: usageCount,
        exists: !!customer.metafield
      },
      message: `Metafield value: ${usageCount}`
    });

  } catch (error) {
    console.error('❌ [TEST-METAFIELD] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
