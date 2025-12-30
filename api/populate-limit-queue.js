/**
 * Endpoint do napełnienia kolejki limit-reached:*
 * Dodaje wszystkich użytkowników z usage_count >= 4 do kolejki
 * Cron automatycznie zresetuje po 1h i wyśle maile
 */

const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed - use POST' });
  }

  try {
    const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(500).json({ error: 'SHOPIFY_ACCESS_TOKEN not configured' });
    }

    console.log('🔄 [POPULATE-QUEUE] Pobieranie użytkowników z limitem...');

    // Paginacja - pobierz wszystkich użytkowników
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

      const variables = {
        first: 100, // Shopify limit per page
        after: cursor
      };

      const response = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        },
        body: JSON.stringify({ query, variables })
      });

      const data = await response.json();
      
      if (data.errors) {
        console.error('❌ [POPULATE-QUEUE] GraphQL errors:', data.errors);
        return res.status(500).json({ error: 'GraphQL error', details: data.errors });
      }

      const customersPage = data?.data?.customers?.edges || [];
      allCustomers.push(...customersPage);
      
      hasNextPage = data?.data?.customers?.pageInfo?.hasNextPage || false;
      cursor = data?.data?.customers?.pageInfo?.endCursor || null;
      pageCount++;
      
      console.log(`📋 [POPULATE-QUEUE] Pobrano stronę ${pageCount}: ${customersPage.length} klientów (łącznie: ${allCustomers.length})`);
    }
    
    console.log(`📋 [POPULATE-QUEUE] Znaleziono łącznie ${allCustomers.length} klientów`);

    let addedCount = 0;
    let skippedCount = 0;
    const results = [];

    for (const edge of allCustomers) {
      const customer = edge.node;
      const metafield = customer.metafield;
      
      if (!metafield) {
        skippedCount++;
        continue;
      }

      let usageCount = 0;
      
      try {
        const value = metafield.value;
        const type = metafield.type;
        
        if (type === 'json') {
          const parsed = JSON.parse(value);
          usageCount = parsed.total || 0;
        } else if (type === 'number_integer') {
          usageCount = parseInt(value, 10) || 0;
        }
      } catch (err) {
        console.error(`⚠️ [POPULATE-QUEUE] Błąd parsowania dla ${customer.email}:`, err);
        skippedCount++;
        continue;
      }

      // Dodaj do kolejki TYLKO jeśli usage >= 4
      if (usageCount >= 4) {
        const customerId = customer.id.replace('gid://shopify/Customer/', '');
        const key = `limit-reached:${customerId}`;
        
        const payload = {
          timestamp: new Date().toISOString(),
          totalUsed: usageCount,
          totalLimit: 4,
          email: customer.email,
          addedBy: 'populate-queue-script'
        };

        try {
          await kv.set(key, JSON.stringify(payload), { ex: 60 * 60 * 48 }); // 48h TTL
          console.log(`✅ [POPULATE-QUEUE] Dodano do kolejki: ${customer.email} (${usageCount}/4)`);
          
          addedCount++;
          results.push({
            customerId,
            email: customer.email,
            usageCount,
            status: 'added'
          });
        } catch (kvErr) {
          console.error(`❌ [POPULATE-QUEUE] Błąd KV dla ${customer.email}:`, kvErr);
          skippedCount++;
          results.push({
            customerId,
            email: customer.email,
            usageCount,
            status: 'error',
            error: kvErr.message
          });
        }
      } else {
        skippedCount++;
      }
    }

    console.log(`✅ [POPULATE-QUEUE] Zakończono: ${addedCount} dodanych, ${skippedCount} pominiętych`);

    return res.status(200).json({
      success: true,
      summary: {
        totalCustomers: allCustomers.length,
        addedToQueue: addedCount,
        skipped: skippedCount,
        pagesProcessed: pageCount
      },
      results: results,
      nextSteps: [
        'Cron job (/api/check-and-reset-limits) uruchomi się za max 20 minut',
        'Po 1h od dodania do kolejki: reset usage_count do 0',
        'Email kredytowy zostanie wysłany do każdego użytkownika'
      ],
      info: `Dodano ${addedCount} użytkowników do kolejki. Cron automatycznie zresetuje i wyśle maile po 1h.`
    });

  } catch (error) {
    console.error('❌ [POPULATE-QUEUE] Błąd główny:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
};
