// api/add-product-variants.js
/**
 * API endpoint do dodawania wariantów rozmiarów do produktu Customify
 * POST /api/add-product-variants
 * Body: { "productHandle": "personalizowany-portret-w-stylu-boho" }
 */

const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // ✅ CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const shop = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!accessToken) {
    console.error('❌ [ADD-VARIANTS] Brak SHOPIFY_ACCESS_TOKEN');
    return res.status(500).json({ error: 'Missing access token' });
  }

  try {
    const { productHandle } = req.body;
    
    if (!productHandle) {
      return res.status(400).json({ error: 'productHandle required' });
    }

    console.log(`🚀 [ADD-VARIANTS] Dodawanie wariantów do produktu: ${productHandle}`);

    // Znajdź produkt po handle
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

    const queryResponse = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({ query: productQuery })
    });

    const queryResult = await queryResponse.json();
    
    if (queryResult.errors) {
      console.error('❌ [ADD-VARIANTS] GraphQL Errors:', queryResult.errors);
      return res.status(500).json({ 
        error: 'GraphQL errors',
        details: queryResult.errors
      });
    }

    const product = queryResult.data.productByHandle;
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const existingVariants = product.variants.edges.map(edge => edge.node);

    console.log(`✅ [ADD-VARIANTS] Produkt znaleziony: ${product.title}`);
    console.log(`📦 [ADD-VARIANTS] Istniejące warianty: ${existingVariants.length}`);

    if (existingVariants.length > 1) {
      return res.status(400).json({
        error: 'Product already has variants',
        existingVariants: existingVariants.map(v => ({ title: v.title, price: v.price }))
      });
    }

    // Nowe warianty rozmiarów
    const newVariants = [
      { size: 'A4', name: '20×30 cm', price: 49 },
      { size: 'A3', name: '30×40 cm', price: 99 },
      { size: 'A2', name: '40×60 cm', price: 149 },
      { size: 'A1', name: '60×85 cm', price: 199 }
    ];

    // GraphQL Mutation
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

    const createResponse = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({ query: mutation, variables })
    });

    const createResult = await createResponse.json();

    if (createResult.errors) {
      console.error('❌ [ADD-VARIANTS] GraphQL Errors:', createResult.errors);
      return res.status(500).json({ 
        error: 'GraphQL errors',
        details: createResult.errors
      });
    }

    if (createResult.data.productVariantsBulkCreate.userErrors.length > 0) {
      console.error('❌ [ADD-VARIANTS] User Errors:', createResult.data.productVariantsBulkCreate.userErrors);
      return res.status(500).json({ 
        error: 'User errors',
        details: createResult.data.productVariantsBulkCreate.userErrors
      });
    }

    const createdVariants = createResult.data.productVariantsBulkCreate.productVariants;
    
    console.log(`✅ [ADD-VARIANTS] Dodano ${createdVariants.length} wariantów`);
    
    return res.status(200).json({
      success: true,
      message: 'Variants added successfully',
      product: product.title,
      variants: createdVariants
    });

  } catch (error) {
    console.error('❌ [ADD-VARIANTS] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
};
