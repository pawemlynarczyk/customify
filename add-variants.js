// add-variants.js
/**
 * Skrypt do dodawania wariantów rozmiarów do produktu Customify
 * 
 * Użycie:
 *   SHOPIFY_ACCESS_TOKEN=twoj_token node add-variants.js
 */

const fetch = require('node-fetch');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE || 'customify-ok.myshopify.com';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

if (!SHOPIFY_ACCESS_TOKEN) {
  console.error('❌ Brak SHOPIFY_ACCESS_TOKEN!');
  console.log('\n💡 Użycie:');
  console.log('   SHOPIFY_ACCESS_TOKEN=shpat_xxx node add-variants.js');
  console.log('\n🔗 Znajdź token w: https://customify-ok.myshopify.com/admin/settings/apps');
  process.exit(1);
}

async function addVariants() {
  console.log('🚀 Dodawanie wariantów rozmiarów do produktu Boho...');
  console.log(`📍 Store: ${SHOPIFY_STORE}`);
  console.log(`🔑 Token: ${SHOPIFY_ACCESS_TOKEN.substring(0, 10)}...\n`);

  const productHandle = 'personalizowany-portret-w-stylu-boho';
  
  // KROK 1: Znajdź produkt
  console.log(`🔍 Szukam produktu: ${productHandle}`);
  
  const productQuery = `
    query {
      productByHandle(handle: "${productHandle}") {
        id
        title
        variants(first: 5) {
          edges {
            node {
              id
              title
              price
            }
          }
        }
      }
    }
  `;

  const queryResponse = await fetch(`https://${SHOPIFY_STORE}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
    },
    body: JSON.stringify({ query: productQuery })
  });

  if (!queryResponse.ok) {
    const errorText = await queryResponse.text();
    console.error('❌ Błąd pobierania produktu:', errorText);
    return;
  }

  const queryResult = await queryResponse.json();
  
  if (queryResult.errors) {
    console.error('❌ GraphQL Errors:', JSON.stringify(queryResult.errors, null, 2));
    return;
  }

  if (!queryResult.data.productByHandle) {
    console.error('❌ Produkt nie znaleziony');
    return;
  }

  const product = queryResult.data.productByHandle;
  const existingVariants = product.variants.edges.map(edge => edge.node);

  console.log(`✅ Znaleziono: ${product.title}`);
  console.log(`📦 Obecne warianty: ${existingVariants.length}`);
  
  if (existingVariants.length > 0) {
    existingVariants.forEach(v => {
      console.log(`   - ${v.title}: ${v.price}`);
    });
  }

  // KROK 2: Sprawdź czy już ma warianty
  if (existingVariants.length > 1) {
    console.log('\n⚠️ Produkt ma już więcej niż 1 wariant!');
    console.log('❓ Czy chcesz kontynuować? (może to spowodować duplikację)');
    // Możesz dodać input dla użytkownika
    return;
  }

  // KROK 3: Dodaj nowe warianty
  const newVariants = [
    { size: 'A4', name: '20×30 cm', price: 49 },
    { size: 'A3', name: '30×40 cm', price: 99 },
    { size: 'A2', name: '40×60 cm', price: 149 },
    { size: 'A1', name: '60×85 cm', price: 199 }
  ];

  console.log('\n📦 Dodawanie wariantów:');
  newVariants.forEach(v => {
    console.log(`   - ${v.size} (${v.name}): ${v.price} zł`);
  });

  const mutation = `
    mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkCreate(productId: $productId, variants: $variants) {
        productVariants {
          id
          title
          price
          option1
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    productId: product.id,
    variants: newVariants.map(v => ({
      option1: v.size,
      price: v.price.toFixed(2),
      inventoryPolicy: 'CONTINUE',
      inventoryQuantity: 100
    }))
  };

  const createResponse = await fetch(`https://${SHOPIFY_STORE}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
    },
    body: JSON.stringify({ query: mutation, variables })
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error('❌ Błąd tworzenia wariantów:', errorText);
    return;
  }

  const createResult = await createResponse.json();

  if (createResult.errors) {
    console.error('❌ GraphQL Errors:', JSON.stringify(createResult.errors, null, 2));
    return;
  }

  if (createResult.data.productVariantsBulkCreate.userErrors.length > 0) {
    console.error('❌ User Errors:');
    createResult.data.productVariantsBulkCreate.userErrors.forEach(err => {
      console.error(`   - ${err.field}: ${err.message}`);
    });
    return;
  }

  const createdVariants = createResult.data.productVariantsBulkCreate.productVariants;
  
  console.log('\n✅ Sukces! Dodano warianty:');
  createdVariants.forEach(v => {
    console.log(`   - ${v.option1}: ${v.price} zł`);
  });
  
  console.log('\n🎯 Następne kroki:');
  console.log('   1. Przetestuj produkt na: https://lumly.pl/products/personalizowany-portret-w-stylu-boho');
  console.log('   2. Sprawdź czy ceny się zmieniają po wyborze rozmiaru');
  console.log('   3. Jeśli działa - dodaj warianty do pozostałych produktów Customify');
}

addVariants().catch(console.error);
