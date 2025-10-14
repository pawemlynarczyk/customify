#!/usr/bin/env node

/**
 * Skrypt do utworzenia Customer Metafield Definition w Shopify
 * Uruchom: node create-metafield-definition.js
 */

const https = require('https');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

if (!SHOPIFY_TOKEN) {
  console.error('❌ Błąd: Brak SHOPIFY_ACCESS_TOKEN w zmiennych środowiskowych');
  console.log('\n💡 Rozwiązanie:');
  console.log('export SHOPIFY_ACCESS_TOKEN="twoj_token_tutaj"');
  console.log('node create-metafield-definition.js');
  process.exit(1);
}

console.log('🚀 Tworzenie Customer Metafield Definition...');
console.log(`📍 Store: ${SHOPIFY_STORE}`);
console.log('');

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

const postData = JSON.stringify({
  query: mutation,
  variables: variables
});

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

      const result = response.data?.metafieldDefinitionCreate;
      
      if (result?.userErrors && result.userErrors.length > 0) {
        console.error('❌ User Errors:', result.userErrors);
        
        const alreadyExists = result.userErrors.some(err => 
          err.message.includes('already exists') || 
          err.message.includes('taken') ||
          err.code === 'TAKEN'
        );
        
        if (alreadyExists) {
          console.log('');
          console.log('✅ Metafield Definition już istnieje!');
          console.log('');
          console.log('📍 Gdzie sprawdzić:');
          console.log('1. Shopify Admin → Settings → Custom Data → Customers');
          console.log('2. Shopify Admin → Customers → [wybierz klienta] → Metafields');
          process.exit(0);
        }
        
        process.exit(1);
      }

      if (result?.createdDefinition) {
        console.log('✅ Metafield Definition utworzony pomyślnie!');
        console.log('');
        console.log('📋 Szczegóły:');
        console.log(`   ID: ${result.createdDefinition.id}`);
        console.log(`   Name: ${result.createdDefinition.name}`);
        console.log(`   Namespace: ${result.createdDefinition.namespace}`);
        console.log(`   Key: ${result.createdDefinition.key}`);
        console.log(`   Type: ${result.createdDefinition.type.name}`);
        console.log(`   Owner: ${result.createdDefinition.ownerType}`);
        console.log('');
        console.log('📍 Gdzie sprawdzić:');
        console.log('1. Shopify Admin → Settings → Custom Data → Customers');
        console.log('2. Shopify Admin → Customers → [wybierz klienta] → Metafields');
        console.log('');
        console.log('🎉 Gotowe! Teraz w panelu Customers zobaczysz pole "Usage Count"');
        process.exit(0);
      }

      console.error('❌ Nieoczekiwany format odpowiedzi');
      process.exit(1);

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

