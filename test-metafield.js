#!/usr/bin/env node

/**
 * Test script to check if Customer Metafield Definition exists
 */

const https = require('https');

const SHOPIFY_STORE = 'posterizme.myshopify.com'; // Używam nazwy z URL
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

if (!SHOPIFY_TOKEN) {
  console.error('❌ Brak SHOPIFY_ACCESS_TOKEN');
  console.log('💡 Uruchom: export SHOPIFY_ACCESS_TOKEN="twoj_token"');
  process.exit(1);
}

console.log('🔍 Sprawdzam Customer Metafield Definitions...');
console.log(`📍 Store: ${SHOPIFY_STORE}`);
console.log('');

// Query to check existing metafield definitions
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
        ownerType
      }
    }
  }
}
`;

const postData = JSON.stringify({ query });

const options = {
  hostname: SHOPIFY_STORE,
  path: '/admin/api/2024-01/graphql.json',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'X-Shopify-Access-Token': SHOPIFY_TOKEN
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      console.log('📊 Response:', JSON.stringify(response, null, 2));
      console.log('');

      if (response.errors) {
        console.error('❌ GraphQL Errors:', response.errors);
        process.exit(1);
      }

      const definitions = response.data?.metafieldDefinitions?.edges || [];
      console.log(`📋 Znaleziono ${definitions.length} Customer Metafield Definitions:`);
      console.log('');

      if (definitions.length === 0) {
        console.log('❌ BRAK METAFIELD DEFINITIONS!');
        console.log('');
        console.log('💡 Rozwiązanie:');
        console.log('1. Wróć do Shopify Admin');
        console.log('2. Settings → Custom data → Customer');
        console.log('3. Kliknij "Add definition"');
        console.log('4. Name: Usage Count');
        console.log('5. Namespace and key: custom.usage_count');
        console.log('6. Type: Integer');
        console.log('7. Save');
        process.exit(1);
      }

      definitions.forEach(({ node }, index) => {
        console.log(`${index + 1}. ${node.name}`);
        console.log(`   Namespace: ${node.namespace}`);
        console.log(`   Key: ${node.key}`);
        console.log(`   Type: ${node.type.name}`);
        console.log(`   ID: ${node.id}`);
        if (node.description) {
          console.log(`   Description: ${node.description}`);
        }
        console.log('');
      });

      // Check if our metafield exists
      const ourMetafield = definitions.find(({ node }) => 
        node.namespace === 'custom' && node.key === 'usage_count'
      );

      if (ourMetafield) {
        console.log('✅ Metafield "custom.usage_count" ZNALEZIONY!');
        console.log('✅ Powinien być widoczny w Shopify Admin → Customers');
        console.log('');
        console.log('🧪 Test:');
        console.log('1. Idź do: Customers → [wybierz klienta]');
        console.log('2. Przewiń w dół');
        console.log('3. Powinieneś zobaczyć sekcję "Metafields"');
        console.log('4. W środku: "Usage Count" z wartością 0');
      } else {
        console.log('❌ Metafield "custom.usage_count" NIE ZNALEZIONY');
        console.log('');
        console.log('💡 Sprawdź czy:');
        console.log('- Nazwa: "Usage Count"');
        console.log('- Namespace: "custom"');
        console.log('- Key: "usage_count"');
        console.log('- Type: "Integer"');
        console.log('- Został zapisany (Save)');
      }

    } catch (error) {
      console.error('❌ Błąd parsowania JSON:', error.message);
      console.error('Raw response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
  process.exit(1);
});

req.write(postData);
req.end();
