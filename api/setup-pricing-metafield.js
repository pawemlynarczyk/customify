// api/setup-pricing-metafield.js
/**
 * API endpoint do tworzenia Shop Metafield Definition dla globalnych cen Customify
 * Uruchom przez: POST https://customify-s56o.vercel.app/api/setup-pricing-metafield
 */

const fetch = require('node-fetch');
const { SHOPIFY_API_VERSION } = require('../utils/shopifyConfig');

module.exports = async (req, res) => {
  // ✅ CORS dla wszystkich domen
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const shop = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!accessToken) {
    console.error('❌ [SETUP-METAFIELD] Brak SHOPIFY_ACCESS_TOKEN');
    return res.status(500).json({ error: 'Missing access token' });
  }

  try {
    console.log('🚀 [SETUP-METAFIELD] Tworzenie Shop Metafield Definition...');
    console.log(`📍 Store: ${shop}`);

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
        name: "Customify Global Pricing",
        namespace: "customify",
        key: "global_pricing",
        description: "Globalne ceny dla wszystkich produktów Customify (Plakat vs Obraz na płótnie)",
        type: "json",
        ownerType: "SHOP"
      }
    };

    const response = await fetch(`https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        query: mutation,
        variables: variables
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ [SETUP-METAFIELD] GraphQL Errors:', result.errors);
      return res.status(500).json({ 
        error: 'GraphQL errors',
        details: result.errors
      });
    }

    if (result.data.metafieldDefinitionCreate.userErrors.length > 0) {
      console.error('❌ [SETUP-METAFIELD] User Errors:', result.data.metafieldDefinitionCreate.userErrors);
      return res.status(500).json({ 
        error: 'User errors',
        details: result.data.metafieldDefinitionCreate.userErrors
      });
    }

    const createdDefinition = result.data.metafieldDefinitionCreate.createdDefinition;
    console.log('✅ [SETUP-METAFIELD] Metafield Definition utworzony pomyślnie!');
    
    return res.status(200).json({
      success: true,
      message: 'Metafield Definition utworzony pomyślnie',
      metafieldDefinition: {
        id: createdDefinition.id,
        namespace: createdDefinition.namespace,
        key: createdDefinition.key,
        type: createdDefinition.type.name,
        ownerType: createdDefinition.ownerType,
        description: createdDefinition.description
      },
      nextStep: 'Uruchom POST /api/setup-pricing-data żeby ustawić domyślne ceny'
    });

  } catch (error) {
    console.error('❌ [SETUP-METAFIELD] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
};
