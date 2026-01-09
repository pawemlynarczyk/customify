// check-limit-email-stats.js
// Sprawdza ilu użytkowników wykorzystało limit i dostało maila zwiększającego limit

const https = require('https');

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

async function shopifyGraphQL(body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SHOPIFY_STORE_DOMAIN,
      path: '/admin/api/2024-01/graphql.json',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function getAllCustomersWithUsage() {
  const allCustomers = [];
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const query = cursor 
      ? `
        query getCustomers($cursor: String!) {
          customers(first: 100, after: $cursor) {
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
                  id
                  value
                  type
                }
              }
            }
          }
        }
      `
      : `
        query getCustomers {
          customers(first: 100) {
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
                  id
                  value
                  type
                }
              }
            }
          }
        }
      `;

    const body = cursor 
      ? JSON.stringify({ query, variables: { cursor } })
      : JSON.stringify({ query });
    
    const data = await shopifyGraphQL(body);
    
    if (data.errors) {
      throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
    }

    const customers = data.data.customers.edges;
    allCustomers.push(...customers);

    hasNextPage = data.data.customers.pageInfo.hasNextPage;
    cursor = data.data.customers.pageInfo.endCursor;
  }

  return allCustomers;
}

async function main() {
  if (!SHOPIFY_ACCESS_TOKEN) {
    console.error('❌ Ustaw SHOPIFY_ACCESS_TOKEN w .env.local');
    process.exit(1);
  }

  try {
    console.log('🔍 Sprawdzam wszystkich użytkowników z limitem generacji...\n');
    
    const customers = await getAllCustomersWithUsage();
    console.log(`📊 Znaleziono ${customers.length} klientów w Shopify\n`);

    // Analiza usage_count
    const customersWithUsage = customers.filter(c => {
      const metafield = c.node.metafield;
      if (!metafield) return false;
      
      let usageCount = 0;
      if (metafield.type === 'json') {
        try {
          const parsed = JSON.parse(metafield.value);
          usageCount = parsed.total || 0;
        } catch {
          usageCount = 0;
        }
      } else if (metafield.type === 'number_integer') {
        usageCount = parseInt(metafield.value) || 0;
      }
      
      return usageCount > 0;
    });

    // Użytkownicy z limitem >= 4
    const customersAtLimit = customersWithUsage.filter(c => {
      const metafield = c.node.metafield;
      if (!metafield) return false;
      
      let usageCount = 0;
      if (metafield.type === 'json') {
        try {
          const parsed = JSON.parse(metafield.value);
          usageCount = parsed.total || 0;
        } catch {
          usageCount = 0;
        }
      } else if (metafield.type === 'number_integer') {
        usageCount = parseInt(metafield.value) || 0;
      }
      
      return usageCount >= 4;
    });

    // Użytkownicy z limitem = 0 (zresetowani)
    const customersReset = customersWithUsage.filter(c => {
      const metafield = c.node.metafield;
      if (!metafield) return false;
      
      let usageCount = 0;
      if (metafield.type === 'json') {
        try {
          const parsed = JSON.parse(metafield.value);
          usageCount = parsed.total || 0;
        } catch {
          usageCount = 0;
        }
      } else if (metafield.type === 'number_integer') {
        usageCount = parseInt(metafield.value) || 0;
      }
      
      return usageCount === 0 && c.node.createdAt; // Mieli usage, teraz 0
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 STATYSTYKI LIMITÓW GENERACJI:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Łącznie klientów: ${customers.length}`);
    console.log(`Klientów z usage_count > 0: ${customersWithUsage.length}`);
    console.log(`Klientów z limitem >= 4 (wyczerpali limit): ${customersAtLimit.length}`);
    console.log(`Klientów z limitem = 0 (zresetowani): ${customersReset.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (customersAtLimit.length > 0) {
      console.log('🔴 UŻYTKOWNICY Z WYCZERPANYM LIMITEM (≥4 generacji):\n');
      customersAtLimit.forEach((c, i) => {
        const node = c.node;
        const metafield = node.metafield;
        let usageCount = 0;
        
        if (metafield.type === 'json') {
          try {
            const parsed = JSON.parse(metafield.value);
            usageCount = parsed.total || 0;
          } catch {
            usageCount = 0;
          }
        } else if (metafield.type === 'number_integer') {
          usageCount = parseInt(metafield.value) || 0;
        }
        
        console.log(`${i + 1}. ${node.email || 'N/A'}`);
        console.log(`   Customer ID: ${node.id.replace('gid://shopify/Customer/', '')}`);
        console.log(`   Usage: ${usageCount}/4`);
        console.log(`   Data rejestracji: ${new Date(node.createdAt).toLocaleString('pl-PL')}`);
        console.log('');
      });
    }

    console.log('\n💡 JAK DZIAŁA SYSTEM ZWIĘKSZANIA LIMITU:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Gdy użytkownik osiągnie limit (usage_count >= 4):');
    console.log('   → Zapisuje się do Vercel KV: limit-reached:${customerId}');
    console.log('   → Endpoint: /api/transform.js (linia 2171-2186)');
    console.log('');
    console.log('2. Cron job (/api/check-and-reset-limits) uruchamia się co 20 minut:');
    console.log('   → Sprawdza wpisy w KV');
    console.log('   → Jeśli minęła ≥1h od zapisu:');
    console.log('     • Resetuje usage_count do 0');
    console.log('     • Wysyła mail kredytowy: "Dodaliśmy Ci nowe kredyty"');
    console.log('     • Usuwa wpis z kolejki');
    console.log('');
    console.log('3. Mail kredytowy:');
    console.log('   → Temat: "Dodaliśmy Ci nowe kredyty – możesz znowu generować!"');
    console.log('   → Treść: Informuje że ma ponownie 4 kredyty');
    console.log('   → Endpoint: /api/check-and-reset-limits.js (linia 130-151)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔧 SPRAWDZENIE KOLEJKI:');
    console.log('   curl https://customify-s56o.vercel.app/api/check-limit-queue');
    console.log('');
    console.log('🔧 RĘCZNE DODANIE DO KOLEJKI:');
    console.log('   curl -X POST https://customify-s56o.vercel.app/api/populate-limit-queue');
    console.log('');
    console.log('🔧 RĘCZNY RESET I MAIL:');
    console.log('   curl -X POST https://customify-s56o.vercel.app/api/check-and-reset-limits');

  } catch (error) {
    console.error('❌ Błąd:', error.message);
    process.exit(1);
  }
}

main();

