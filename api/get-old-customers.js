// api/get-old-customers.js
/**
 * Endpoint do pobierania klientów starszych niż 2 tygodnie
 * GET: /api/get-old-customers?days=14
 */

const { SHOPIFY_API_VERSION } = require('../utils/shopifyConfig');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(500).json({ error: 'SHOPIFY_ACCESS_TOKEN not configured' });
    }

    // Domyślnie 14 dni (2 tygodnie), można zmienić przez query param
    const days = parseInt(req.query.days || '14', 10);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    console.log(`📋 [GET-OLD-CUSTOMERS] Pobieranie klientów starszych niż ${days} dni (przed ${cutoffDate.toISOString()})...`);

    const allCustomers = [];
    let hasNextPage = true;
    let cursor = null;
    let pageCount = 0;
    const maxPages = 100; // Limit bezpieczeństwa (max 10,000 klientów)

    while (hasNextPage && pageCount < maxPages) {
      pageCount += 1;

      const query = cursor
        ? `
          query getOldCustomers($first: Int!, $after: String!) {
            customers(first: $first, after: $after) {
              pageInfo {
                hasNextPage
                endCursor
              }
              edges {
                node {
                  id
                  email
                  createdAt
                }
              }
            }
          }
        `
        : `
          query getOldCustomers($first: Int!) {
            customers(first: $first) {
              pageInfo {
                hasNextPage
                endCursor
              }
              edges {
                node {
                  id
                  email
                  createdAt
                }
              }
            }
          }
        `;

      const variables = cursor
        ? { first: 100, after: cursor }
        : { first: 100 };

      const response = await fetch(`https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        },
        body: JSON.stringify({ query, variables })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [GET-OLD-CUSTOMERS] Shopify API error: ${response.status}`);
        return res.status(500).json({
          error: 'Failed to fetch customers',
          details: errorText.substring(0, 500)
        });
      }

      const data = await response.json();

      if (data.errors) {
        console.error('❌ [GET-OLD-CUSTOMERS] GraphQL errors:', data.errors);
        return res.status(500).json({
          error: 'GraphQL errors',
          details: data.errors
        });
      }

      const customersPage = data?.data?.customers?.edges || [];
      allCustomers.push(...customersPage);

      hasNextPage = data?.data?.customers?.pageInfo?.hasNextPage || false;
      cursor = data?.data?.customers?.pageInfo?.endCursor || null;

      console.log(`📋 [GET-OLD-CUSTOMERS] Pobrano stronę ${pageCount}: ${customersPage.length} klientów (łącznie: ${allCustomers.length})`);
    }

    console.log(`📋 [GET-OLD-CUSTOMERS] Znaleziono łącznie ${allCustomers.length} klientów`);

    // Filtruj klientów starszych niż cutoffDate
    const oldCustomers = allCustomers
      .filter(edge => {
        const customer = edge.node;
        if (!customer.email || !customer.email.includes('@')) {
          return false; // Pomiń bez emaila
        }
        const createdAt = new Date(customer.createdAt);
        return createdAt < cutoffDate;
      })
      .map(edge => {
        const customer = edge.node;
        // Wyciągnij numeric ID z "gid://shopify/Customer/123456"
        const customerId = customer.id.split('/').pop();
        return {
          customerId: customerId,
          email: customer.email.toLowerCase().trim(),
          createdAt: customer.createdAt
        };
      });

    console.log(`✅ [GET-OLD-CUSTOMERS] Znaleziono ${oldCustomers.length} klientów starszych niż ${days} dni`);

    return res.status(200).json({
      success: true,
      totalCustomers: allCustomers.length,
      oldCustomers: oldCustomers.length,
      days: days,
      cutoffDate: cutoffDate.toISOString(),
      customers: oldCustomers
    });

  } catch (error) {
    console.error('❌ [GET-OLD-CUSTOMERS] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
