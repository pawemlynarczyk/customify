// add-variants-to-product.js
/**
 * Dodaje warianty rozmiarów do produktu Customify (test na produkcie Boho)
 * Handle: personalizowany-portret-w-stylu-boho
 */

const fetch = require('node-fetch');

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

if (!SHOPIFY_ACCESS_TOKEN) {
  console.error('❌ Brak SHOPIFY_ACCESS_TOKEN w zmiennych środowiskowych');
  process.exit(1);
}

async function addVariants() {
  console.log('🚀 Dodawanie wariantów rozmiarów do produktu Boho...');
  console.log(`📍 Store: ${SHOPIFY_STORE_DOMAIN}`);

  // Najpierw znajdź produkt po handle
  const productHandle = 'personalizowany-portret-w-stylu-boho';
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

  const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
    },
    body: JSON.stringify({ query: productQuery })
  });

  const result = await response.json();
  
  if (result.errors) {
    console.error('❌ GraphQL Errors:', result.errors);
    return;
  }

  if (!result.data.productByHandle) {
    console.error('❌ Produkt nie znaleziony');
    return;
  }

  const product = result.data.productByHandle;
  const productId = product.id;
  const existingVariants = product.variants.edges.map(edge => edge.node);

  console.log(`✅ Znaleziono produkt: ${product.title}`);
  console.log(`📋 ID produktu: ${productId}`);
  console.log(`📦 Istniejące warianty: ${existingVariants.length}`);

  if (existingVariants.length > 1) {
    console.log('⚠️ Produkt ma już więcej niż 1 wariant!');
    console.log('📋 Obecne warianty:');
    existingVariants.forEach(v => {
      console.log(`   - ${v.title}: ${v.price} ${SHOPIFY_STORE_DOMAIN.includes('.myshopify') ? 'PLN' : ''}`);
    });
    console.log('\n❓ Czy chcesz dodać nowe warianty czy usunąć stare?');
    return;
  }

  // Dodaj nowe warianty rozmiarów (dla Canvas = Obraz na płótnie)
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

  // GraphQL Mutation do dodania wariantów
  const flatProductId = productId.split('/').pop(); // Usuń "gid://shopify/Product/"
  
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
    productId: productId,
    variants: newVariants.map(v => ({
      option1: v.size,
      price: v.price.toFixed(2),
      inventoryPolicy: 'CONTINUE',
      inventoryQuantity: 100
    }))
  };

  const createResponse = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
    },
    body: JSON.stringify({ query: mutation, variables })
  });

  const createResult = await createResponse.json();

  if (createResult.errors) {
    console.error('❌ GraphQL Errors:', createResult.errors);
    return;
  }

  if (createResult.data.productVariantsBulkCreate.userErrors.length > 0) {
    console.error('❌ User Errors:', createResult.data.productVariantsBulkCreate.userErrors);
    return;
  }

  const createdVariants = createResult.data.productVariantsBulkCreate.productVariants;
  
  console.log('\n✅ Warianty dodane pomyślnie!');
  createdVariants.forEach(v => {
    console.log(`   - ${v.option1}: ${v.price} PLN`);
  });
  
  console.log('\n🎯 Następny krok: Przetestuj frontend!');
}

// Uruchom funkcję
addVariants();
