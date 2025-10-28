// api/setup-pricing-data.js
/**
 * API endpoint do ustawienia domyślnych cen w Shop Metafield
 * Uruchom przez: POST https://customify-s56o.vercel.app/api/setup-pricing-data
 */

const fetch = require('node-fetch');

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
    console.error('❌ [SETUP-DATA] Brak SHOPIFY_ACCESS_TOKEN');
    return res.status(500).json({ error: 'Missing access token' });
  }

  try {
    console.log('🚀 [SETUP-DATA] Ustawianie domyślnych cen w Shop Metafield...');
    console.log(`📍 Store: ${shop}`);

    // Domyślne ceny (backup z obecnego systemu)
    const defaultPricing = {
      "productTypes": {
        "plakat": {
          "name": "Plakat",
          "sizes": [
            {
              "code": "a4",
              "name": "20×30 cm",
              "price": 29,
              "enabled": true
            },
            {
              "code": "a3",
              "name": "30×40 cm",
              "price": 49,
              "enabled": true
            },
            {
              "code": "a2",
              "name": "40×60 cm",
              "price": 79,
              "enabled": true
            },
            {
              "code": "a1",
              "name": "60×85 cm",
              "price": 129,
              "enabled": true
            }
          ]
        },
        "canvas": {
          "name": "Obraz na płótnie",
          "sizes": [
            {
              "code": "a4",
              "name": "20×30 cm",
              "price": 49,
              "enabled": true
            },
            {
              "code": "a3",
              "name": "30×40 cm",
              "price": 99,
              "enabled": true
            },
            {
              "code": "a2",
              "name": "40×60 cm",
              "price": 149,
              "enabled": true
            },
            {
              "code": "a1",
              "name": "60×85 cm",
              "price": 199,
              "enabled": true
            }
          ]
        }
      }
    };

    // GraphQL Mutation do ustawienia Metafield
    const mutation = `
      mutation shopMetafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
            value
            type
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
      metafields: [
        {
          namespace: "customify",
          key: "global_pricing",
          value: JSON.stringify(defaultPricing),
          type: "json",
          ownerId: `gid://shopify/Shop/1` // Shop ID = 1 dla metafieldów sklepu
        }
      ]
    };

    const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
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
      console.error('❌ [SETUP-DATA] GraphQL Errors:', result.errors);
      return res.status(500).json({ 
        error: 'GraphQL errors',
        details: result.errors
      });
    }

    if (result.data.metafieldsSet.userErrors.length > 0) {
      console.error('❌ [SETUP-DATA] User Errors:', result.data.metafieldsSet.userErrors);
      return res.status(500).json({ 
        error: 'User errors',
        details: result.data.metafieldsSet.userErrors
      });
    }

    const metafield = result.data.metafieldsSet.metafields[0];
    console.log('✅ [SETUP-DATA] Ceny ustawione pomyślnie!');
    
    return res.status(200).json({
      success: true,
      message: 'Ceny ustawione pomyślnie',
      metafield: {
        id: metafield.id,
        namespace: metafield.namespace,
        key: metafield.key,
        type: metafield.type
      },
      pricing: defaultPricing,
      nextStep: 'Przetestuj GET /api/get-pricing-config'
    });

  } catch (error) {
    console.error('❌ [SETUP-DATA] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
};
