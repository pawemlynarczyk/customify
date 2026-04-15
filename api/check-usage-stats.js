/**
 * Endpoint do sprawdzania statystyk użycia limitów
 * Pokazuje ile użyć ma każdy zalogowany użytkownik
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

    console.log('📊 [USAGE-STATS] Pobieranie statystyk użycia...');

    // GraphQL query - pobierz WSZYSTKICH klientów z metafield usage_count
    const query = `
      query getCustomersUsage {
        customers(first: 100) {
          edges {
            node {
              id
              email
              createdAt
              metafield(namespace: "customify", key: "usage_count") {
                id
                value
                type
              }
            }
          }
        }
      }
    `;

    const response = await fetch(`https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error('❌ [USAGE-STATS] GraphQL errors:', data.errors);
      return res.status(500).json({ error: 'GraphQL error', details: data.errors });
    }

    const customers = data?.data?.customers?.edges || [];
    
    console.log(`📋 [USAGE-STATS] Znaleziono ${customers.length} klientów`);

    // Parsuj usage_count dla każdego klienta
    const stats = customers.map(edge => {
      const customer = edge.node;
      const metafield = customer.metafield;
      
      let usageCount = 0;
      let usageType = 'brak';
      
      if (metafield) {
        try {
          const value = metafield.value;
          const type = metafield.type;
          
          if (type === 'json') {
            const parsed = JSON.parse(value);
            usageCount = parsed.total || 0;
            usageType = 'json';
          } else if (type === 'number_integer') {
            usageCount = parseInt(value, 10) || 0;
            usageType = 'number_integer';
          }
        } catch (err) {
          console.error(`⚠️ [USAGE-STATS] Błąd parsowania dla ${customer.email}:`, err);
        }
      }
      
      return {
        customerId: customer.id.replace('gid://shopify/Customer/', ''),
        email: customer.email,
        createdAt: customer.createdAt,
        usageCount,
        usageType,
        hasMetafield: !!metafield,
        limitReached: usageCount >= 4,
        remaining: Math.max(0, 4 - usageCount)
      };
    });

    // Sortuj po usageCount (malejąco)
    stats.sort((a, b) => b.usageCount - a.usageCount);

    // Statystyki
    const totalCustomers = stats.length;
    const withGenerations = stats.filter(s => s.usageCount > 0).length;
    const limitReached = stats.filter(s => s.limitReached).length;
    const noGenerations = stats.filter(s => s.usageCount === 0).length;

    // Grupuj po liczbie użyć
    const usageDistribution = {
      '0 użyć': stats.filter(s => s.usageCount === 0).length,
      '1 użycie': stats.filter(s => s.usageCount === 1).length,
      '2 użycia': stats.filter(s => s.usageCount === 2).length,
      '3 użycia': stats.filter(s => s.usageCount === 3).length,
      '4 użycia (LIMIT)': stats.filter(s => s.usageCount === 4).length,
      '5+ użyć': stats.filter(s => s.usageCount > 4).length
    };

    return res.status(200).json({
      success: true,
      summary: {
        totalCustomers,
        withGenerations,
        noGenerations,
        limitReached,
        avgUsage: (stats.reduce((sum, s) => sum + s.usageCount, 0) / totalCustomers).toFixed(2)
      },
      usageDistribution,
      topUsers: stats.slice(0, 20), // Top 20 użytkowników
      allUsers: stats,
      info: limitReached === 0 
        ? '✅ Nikt nie wyczerpał limitu 4/4 - dlatego kolejka jest pusta'
        : `⚠️ ${limitReached} użytkowników wyczerpało limit - powinni być w kolejce`
    });

  } catch (error) {
    console.error('❌ [USAGE-STATS] Błąd:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
};
