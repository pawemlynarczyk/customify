// api/list-customers.js
/**
 * API endpoint do listowania klientów (tylko do debugowania)
 */

module.exports = async (req, res) => {
  console.log(`👥 [LIST-CUSTOMERS] API called - Method: ${req.method}`);
  
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
    console.log(`🔍 [LIST-CUSTOMERS] Pobieram listę klientów...`);
    
    // GraphQL query to get customers
    const query = `
      query {
        customers(first: 10) {
          edges {
            node {
              id
              email
              firstName
              lastName
              createdAt
              metafield(namespace: "custom", key: "usage_count") {
                value
              }
            }
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
    
    if (data.errors) {
      console.error('❌ [LIST-CUSTOMERS] GraphQL errors:', data.errors);
      return res.status(500).json({ 
        error: 'Failed to fetch customers',
        details: data.errors
      });
    }

    const customers = data.data?.customers?.edges || [];
    console.log(`📊 [LIST-CUSTOMERS] Znaleziono ${customers.length} klientów`);

    const customerList = customers.map(({ node }) => ({
      id: node.id,
      email: node.email,
      firstName: node.firstName,
      lastName: node.lastName,
      createdAt: node.createdAt,
      usageCount: node.metafield?.value ? parseInt(node.metafield.value, 10) : 0,
      hasMetafield: !!node.metafield
    }));

    return res.json({
      success: true,
      count: customers.length,
      customers: customerList,
      message: `Znaleziono ${customers.length} klientów`
    });

  } catch (error) {
    console.error('❌ [LIST-CUSTOMERS] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
