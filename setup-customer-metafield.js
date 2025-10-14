// setup-customer-metafield.js
/**
 * Tworzy Customer Metafield Definition w Shopify
 * Dzięki temu metafield "usage_count" będzie widoczny w Shopify Admin
 */

const fetch = require('node-fetch');

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

if (!SHOPIFY_ACCESS_TOKEN) {
  console.error('❌ Brak SHOPIFY_ACCESS_TOKEN w zmiennych środowiskowych');
  process.exit(1);
}

async function createCustomerMetafieldDefinition() {
  console.log('🚀 Tworzenie Customer Metafield Definition...');
  console.log(`📍 Store: ${SHOPIFY_STORE_DOMAIN}`);

  // GraphQL Mutation do utworzenia Metafield Definition
  const mutation = `
    mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition {
          id
          name
          namespace
          key
          description
          type {
            name
          }
          ownerType
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  const variables = {
    definition: {
      name: "Usage Count",
      namespace: "customify",
      key: "usage_count",
      description: "Liczba wykorzystanych transformacji AI przez użytkownika (0-13)",
      type: "number_integer",
      ownerType: "CUSTOMER",
      validations: [
        {
          name: "min",
          value: "0"
        },
        {
          name: "max",
          value: "999"
        }
      ]
    }
  };

  try {
    const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
      },
      body: JSON.stringify({
        query: mutation,
        variables: variables
      })
    });

    const data = await response.json();
    console.log('📊 Response:', JSON.stringify(data, null, 2));

    if (data.errors) {
      console.error('❌ GraphQL Errors:', data.errors);
      return false;
    }

    const result = data.data?.metafieldDefinitionCreate;
    
    if (result?.userErrors && result.userErrors.length > 0) {
      console.error('❌ User Errors:', result.userErrors);
      
      // Sprawdź czy to błąd "already exists"
      const alreadyExists = result.userErrors.some(err => 
        err.message.includes('already exists') || 
        err.message.includes('taken')
      );
      
      if (alreadyExists) {
        console.log('✅ Metafield Definition już istnieje - OK!');
        return true;
      }
      
      return false;
    }

    if (result?.createdDefinition) {
      console.log('✅ Metafield Definition utworzony pomyślnie!');
      console.log('📋 ID:', result.createdDefinition.id);
      console.log('📋 Name:', result.createdDefinition.name);
      console.log('📋 Namespace:', result.createdDefinition.namespace);
      console.log('📋 Key:', result.createdDefinition.key);
      console.log('📋 Type:', result.createdDefinition.type.name);
      console.log('📋 Owner:', result.createdDefinition.ownerType);
      return true;
    }

    console.error('❌ Nieoczekiwany format odpowiedzi');
    return false;

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function verifyMetafieldDefinition() {
  console.log('\n🔍 Weryfikacja Metafield Definition...');

  const query = `
    query {
      metafieldDefinitions(first: 100, ownerType: CUSTOMER) {
        edges {
          node {
            id
            name
            namespace
            key
            description
            type {
              name
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();

    if (data.errors) {
      console.error('❌ GraphQL Errors:', data.errors);
      return;
    }

    const definitions = data.data?.metafieldDefinitions?.edges || [];
    console.log(`📊 Znaleziono ${definitions.length} Customer Metafield Definitions:`);

    definitions.forEach(({ node }) => {
      console.log(`\n  📋 ${node.name}`);
      console.log(`     Namespace: ${node.namespace}`);
      console.log(`     Key: ${node.key}`);
      console.log(`     Type: ${node.type.name}`);
      if (node.description) {
        console.log(`     Description: ${node.description}`);
      }
    });

    // Znajdź nasz metafield
    const ourMetafield = definitions.find(({ node }) => 
      node.namespace === 'customify' && node.key === 'usage_count'
    );

    if (ourMetafield) {
      console.log('\n✅ Metafield "customify.usage_count" istnieje!');
      console.log('✅ Powinien być teraz widoczny w Shopify Admin → Customers');
    } else {
      console.log('\n❌ Metafield "customify.usage_count" NIE ZOSTAŁ ZNALEZIONY');
    }

  } catch (error) {
    console.error('❌ Verification Error:', error.message);
  }
}

// Main execution
(async () => {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  SHOPIFY CUSTOMER METAFIELD DEFINITION SETUP          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const success = await createCustomerMetafieldDefinition();
  
  if (success) {
    await verifyMetafieldDefinition();
    
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ SETUP ZAKOŃCZONY POMYŚLNIE!                       ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    
    console.log('\n📍 JAK SPRAWDZIĆ:');
    console.log('1. Shopify Admin → Settings → Custom Data');
    console.log('2. Wybierz: Customers');
    console.log('3. Znajdź: "Usage Count" (customify.usage_count)');
    console.log('\n📍 LUB:');
    console.log('1. Shopify Admin → Customers');
    console.log('2. Wybierz dowolnego klienta');
    console.log('3. Przewiń w dół → Metafields');
    console.log('4. Znajdź: "Usage Count" (customify.usage_count)');
    
  } else {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  ❌ SETUP FAILED                                       ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    process.exit(1);
  }
})();

