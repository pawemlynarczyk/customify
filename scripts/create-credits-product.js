#!/usr/bin/env node
// scripts/create-credits-product.js
// Tworzy produkt "Pakiet kredytów" w Shopify z 3 wariantami
// Uruchom RAZ: node scripts/create-credits-product.js

require('dotenv').config();

const SHOP_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('❌ Brak SHOPIFY_ACCESS_TOKEN w zmiennych środowiskowych');
  process.exit(1);
}

const productData = {
  product: {
    title: 'Pakiet kredytów – produkty cyfrowe',
    body_html: `
      <p><strong>Kredyty do pobierania spersonalizowanych plików cyfrowych</strong></p>
      <p>Użyj kredytów, żeby pobrać swoje portrety AI w wysokiej rozdzielczości – bez znaku wodnego, gotowe do druku.</p>
      <ul>
        <li>1 kredyt = 1 plik cyfrowy do pobrania</li>
        <li>Kredyty nie wygasają</li>
        <li>Plik wysyłany emailem po użyciu kredytu</li>
      </ul>
    `,
    vendor: 'Lumly',
    product_type: 'Credits Package',
    status: 'active',
    published: true,
    published_scope: 'web',
    requires_shipping: false,
    tags: ['credits-package', 'digital', 'no-recommendations', 'hidden-from-catalog'],
    options: [
      { name: 'Pakiet', values: ['3 kredyty', '5 kredytów', '10 kredytów'] }
    ],
    variants: [
      {
        option1: '3 kredyty',
        price: '89.00',
        sku: 'CREDITS-3',
        requires_shipping: false,
        taxable: true,
        inventory_management: null,
        inventory_policy: 'continue'
      },
      {
        option1: '5 kredytów',
        price: '149.00',
        sku: 'CREDITS-5',
        requires_shipping: false,
        taxable: true,
        inventory_management: null,
        inventory_policy: 'continue'
      },
      {
        option1: '10 kredytów',
        price: '199.00',
        sku: 'CREDITS-10',
        requires_shipping: false,
        taxable: true,
        inventory_management: null,
        inventory_policy: 'continue'
      }
    ]
  }
};

async function createProduct() {
  console.log('🚀 Tworzę produkt "Pakiet kredytów" w Shopify...');
  console.log(`   Sklep: ${SHOP_DOMAIN}`);

  const response = await fetch(`https://${SHOP_DOMAIN}/admin/api/2024-01/products.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ACCESS_TOKEN
    },
    body: JSON.stringify(productData)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Błąd Shopify API:', response.status, error);
    process.exit(1);
  }

  const data = await response.json();
  const product = data.product;

  console.log('\n✅ Produkt stworzony!\n');
  console.log('='.repeat(50));
  console.log(`ID produktu: ${product.id}`);
  console.log(`Handle: ${product.handle}`);
  console.log(`URL w adminie: https://${SHOP_DOMAIN}/admin/products/${product.id}`);
  console.log(`URL sklepu: https://lumly.pl/products/${product.handle}`);
  console.log('\nWarianty:');
  product.variants.forEach(v => {
    console.log(`  - ${v.title}: ${v.price} zł (ID: ${v.id})`);
  });
  console.log('='.repeat(50));
  console.log('\n💡 Następne kroki:');
  console.log('   1. Dodaj zdjęcie do produktu w Shopify Admin');
  console.log('   2. Wdróż kod: npm run deploy && git push origin main');
  console.log('   3. Link do zakupu możesz wstawić w theme.liquid: /products/' + product.handle);
}

createProduct().catch(err => {
  console.error('❌ Błąd:', err);
  process.exit(1);
});
