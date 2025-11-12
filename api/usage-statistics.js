// api/usage-statistics.js
/**
 * API endpoint do analizy statystyk użycia generacji AI
 * Pobiera dane z Shopify Customer Metafields (namespace: customify, key: usage_count)
 */

const { checkRateLimit, getClientIP } = require('../utils/vercelRateLimiter');

module.exports = async (req, res) => {
  console.log(`📊 [USAGE-STATISTICS] API called - Method: ${req.method}`);
  
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

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // IP-based rate limiting
    const ip = getClientIP(req);
    if (!checkRateLimit(ip, 10, 60 * 1000)) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests from this IP',
        retryAfter: 60
      });
    }

    const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
      console.error('❌ [USAGE-STATISTICS] SHOPIFY_ACCESS_TOKEN not configured');
      return res.status(500).json({ error: 'Shopify not configured' });
    }

    console.log(`📊 [USAGE-STATISTICS] Pobieranie danych o użyciu...`);
    
    // Pobierz wszystkich klientów z metafieldami (z paginacją)
    const allCustomers = [];
    let hasNextPage = true;
    let cursor = null;
    let pageCount = 0;
    const maxPages = 100; // Limit bezpieczeństwa (max 2500 klientów)

    while (hasNextPage && pageCount < maxPages) {
      const query = `
        query getCustomersUsage($first: Int!, $after: String) {
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
                metafield(namespace: "customify", key: "usage_count") {
                  value
                }
              }
            }
          }
        }
      `;

      const variables = {
        first: 25, // Shopify limit per page
        after: cursor
      };

      const response = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        },
        body: JSON.stringify({
          query,
          variables
        })
      });

      const data = await response.json();

      if (data.errors) {
        console.error('❌ [USAGE-STATISTICS] Shopify GraphQL errors:', data.errors);
        return res.status(500).json({ 
          error: 'Failed to fetch customers data',
          details: data.errors
        });
      }

      const customers = data.data?.customers;
      if (!customers) {
        break;
      }

      // Dodaj klientów do listy
      customers.edges.forEach(({ node }) => {
        const usageCount = parseInt(node.metafield?.value || '0', 10);
        if (usageCount > 0) { // Tylko klienci z użyciem > 0
          allCustomers.push({
            id: node.id,
            email: node.email,
            createdAt: node.createdAt,
            usageCount: usageCount
          });
        }
      });

      // Sprawdź czy są kolejne strony
      hasNextPage = customers.pageInfo?.hasNextPage || false;
      cursor = customers.pageInfo?.endCursor || null;
      pageCount++;

      console.log(`📊 [USAGE-STATISTICS] Pobrano stronę ${pageCount}, klientów z użyciem: ${allCustomers.length}`);
    }

    console.log(`📊 [USAGE-STATISTICS] Łącznie pobrano ${allCustomers.length} klientów z użyciem`);

    // Oblicz statystyki
    if (allCustomers.length === 0) {
      return res.json({
        success: true,
        message: 'Brak danych o użyciu',
        statistics: {
          totalCustomers: 0,
          totalGenerations: 0,
          averageGenerations: 0,
          medianGenerations: 0,
          maxGenerations: 0,
          minGenerations: 0,
          customersWithUsage: 0
        },
        customers: []
      });
    }

    // Sortuj użycia
    const usageCounts = allCustomers.map(c => c.usageCount).sort((a, b) => a - b);
    const totalGenerations = usageCounts.reduce((sum, count) => sum + count, 0);
    const averageGenerations = totalGenerations / allCustomers.length;
    
    // Mediana
    const medianGenerations = usageCounts.length % 2 === 0
      ? (usageCounts[usageCounts.length / 2 - 1] + usageCounts[usageCounts.length / 2]) / 2
      : usageCounts[Math.floor(usageCounts.length / 2)];

    const maxGenerations = Math.max(...usageCounts);
    const minGenerations = Math.min(...usageCounts);

    // Rozkład użycia (histogram)
    const distribution = {};
    usageCounts.forEach(count => {
      const range = count <= 3 ? '1-3' :
                   count <= 5 ? '4-5' :
                   count <= 10 ? '6-10' :
                   count <= 20 ? '11-20' :
                   '21+';
      distribution[range] = (distribution[range] || 0) + 1;
    });

    // Top 10 użytkowników
    const topUsers = allCustomers
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
      .map(c => ({
        email: c.email?.substring(0, 3) + '***@***', // Anonimizacja
        usageCount: c.usageCount
      }));

    return res.json({
      success: true,
      message: `Analiza ${allCustomers.length} klientów z użyciem`,
      statistics: {
        totalCustomers: allCustomers.length,
        totalGenerations: totalGenerations,
        averageGenerations: Math.round(averageGenerations * 100) / 100, // 2 miejsca po przecinku
        medianGenerations: medianGenerations,
        maxGenerations: maxGenerations,
        minGenerations: minGenerations,
        customersWithUsage: allCustomers.length
      },
      distribution: distribution,
      topUsers: topUsers,
      note: 'Dane tylko dla zalogowanych użytkowników. Niezalogowani używają localStorage (brak danych).'
    });

  } catch (error) {
    console.error('❌ [USAGE-STATISTICS] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

