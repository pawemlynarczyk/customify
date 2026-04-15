// api/setup-customer-generations-metafield.js
/**
 * API endpoint do tworzenia Customer Metafield Definition dla generacji AI
 * Uruchom przez: GET/POST https://customify-s56o.vercel.app/api/setup-customer-generations-metafield
 * 
 * Dzięki temu metafield "customify.ai_generations" będzie widoczny w Shopify Admin
 * na stronie klienta w sekcji Metafields
 */

const { SHOPIFY_API_VERSION } = require('../utils/shopifyConfig');

module.exports = async (req, res) => {
  console.log(`🔧 [SETUP-CUSTOMER-GENERATIONS-METAFIELD] API called - Method: ${req.method}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const shopDomain = process.env.SHOP_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!accessToken) {
    return res.status(500).json({ 
      error: 'SHOPIFY_ACCESS_TOKEN not configured',
      message: 'Please configure environment variable in Vercel'
    });
  }

  try {
    // 1. Sprawdź czy metafield definition już istnieje
    console.log(`🔍 [SETUP-CUSTOMER-GENERATIONS-METAFIELD] Sprawdzam istniejące metafield definitions...`);
    
    const checkQuery = `
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

    const checkResponse = await fetch(`https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({ query: checkQuery })
    });

    const checkData = await checkResponse.json();
    
    if (checkData.errors) {
      console.error('❌ [SETUP-CUSTOMER-GENERATIONS-METAFIELD] GraphQL errors:', checkData.errors);
      return res.status(500).json({ 
        error: 'Failed to check metafield definitions',
        details: checkData.errors
      });
    }

    const definitions = checkData.data?.metafieldDefinitions?.edges || [];
    console.log(`📊 [SETUP-CUSTOMER-GENERATIONS-METAFIELD] Znaleziono ${definitions.length} metafield definitions`);

    // Sprawdź czy nasz metafield istnieje (namespace: "customify", key: "ai_generations")
    const ourMetafield = definitions.find(({ node }) => 
      node.namespace === 'customify' && node.key === 'ai_generations'
    );

    if (ourMetafield) {
      console.log('✅ [SETUP-CUSTOMER-GENERATIONS-METAFIELD] Metafield "customify.ai_generations" JUŻ ISTNIEJE!');
      return res.json({
        success: true,
        exists: true,
        metafield: {
          id: ourMetafield.node.id,
          name: ourMetafield.node.name,
          namespace: ourMetafield.node.namespace,
          key: ourMetafield.node.key,
          type: ourMetafield.node.type.name,
          description: ourMetafield.node.description
        },
        message: 'Metafield już istnieje - będzie widoczny w Shopify Admin → Customers → [klient] → Metafields',
        instructions: [
          '1. Idź do: Shopify Admin → Customers',
          '2. Wybierz dowolnego klienta, który ma generacje AI',
          '3. Przewiń w dół do sekcji "Metafields"',
          '4. Powinieneś zobaczyć: "AI Generations" z JSON zawierającym listę generacji',
          '5. W JSON znajdziesz "imageUrl" dla każdej generacji - możesz skopiować URL i otworzyć w przeglądarce'
        ]
      });
    }

    // 2. Metafield nie istnieje - stwórz go
    console.log('🆕 [SETUP-CUSTOMER-GENERATIONS-METAFIELD] Tworzę nowy metafield definition...');

    const createMutation = `
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
        name: "AI Generations",
        namespace: "customify",
        key: "ai_generations",
        description: "Lista generacji AI stworzonych przez klienta. Zawiera URL obrazków, style, daty i status (kupione/nie kupione). Obrazki dostępne w polu 'imageUrl' każdej generacji.",
        type: "json",
        ownerType: "CUSTOMER"
      }
    };

    const createResponse = await fetch(`https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        query: createMutation,
        variables: variables
      })
    });

    const createData = await createResponse.json();
    console.log(`📊 [SETUP-CUSTOMER-GENERATIONS-METAFIELD] Create response:`, JSON.stringify(createData, null, 2));

    if (createData.errors) {
      console.error('❌ [SETUP-CUSTOMER-GENERATIONS-METAFIELD] GraphQL errors:', createData.errors);
      return res.status(500).json({ 
        error: 'Failed to create metafield definition',
        details: createData.errors
      });
    }

    const result = createData.data?.metafieldDefinitionCreate;

    if (result?.userErrors && result.userErrors.length > 0) {
      console.error('❌ [SETUP-CUSTOMER-GENERATIONS-METAFIELD] User errors:', result.userErrors);
      
      const alreadyExists = result.userErrors.some(err => 
        err.message.includes('already exists') || 
        err.message.includes('taken') ||
        err.code === 'TAKEN'
      );
      
      if (alreadyExists) {
        return res.json({
          success: true,
          exists: true,
          message: 'Metafield już istnieje (error: TAKEN)',
          instructions: [
            '1. Idź do: Shopify Admin → Customers',
            '2. Wybierz dowolnego klienta, który ma generacje AI',
            '3. Przewiń w dół do sekcji "Metafields"',
            '4. Powinieneś zobaczyć: "AI Generations" z JSON zawierającym listę generacji'
          ]
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to create metafield definition',
        details: result.userErrors
      });
    }

    if (result?.createdDefinition) {
      console.log('✅ [SETUP-CUSTOMER-GENERATIONS-METAFIELD] Metafield definition utworzony pomyślnie!');
      return res.json({
        success: true,
        created: true,
        metafield: {
          id: result.createdDefinition.id,
          name: result.createdDefinition.name,
          namespace: result.createdDefinition.namespace,
          key: result.createdDefinition.key,
          type: result.createdDefinition.type.name,
          description: result.createdDefinition.description
        },
        message: 'Metafield utworzony - teraz będzie widoczny w Shopify Admin → Customers → [klient] → Metafields',
        instructions: [
          '1. Idź do: Shopify Admin → Customers',
          '2. Wybierz dowolnego klienta, który ma generacje AI',
          '3. Przewiń w dół do sekcji "Metafields"',
          '4. Powinieneś zobaczyć: "AI Generations" z JSON zawierającym listę generacji',
          '5. W JSON znajdziesz "imageUrl" dla każdej generacji - możesz skopiować URL i otworzyć w przeglądarce',
          '',
          '⚠️ UWAGA: Metafield typu JSON wyświetla tylko tekst JSON, nie obrazki wizualnie.',
          '💡 Aby zobaczyć obrazki, skopiuj URL z pola "imageUrl" i otwórz w przeglądarce.',
          '💡 Alternatywnie, użyj panelu admin: https://customify-s56o.vercel.app/admin-generations.html'
        ]
      });
    }

    return res.status(500).json({ 
      error: 'Unexpected response format',
      response: createData
    });

  } catch (error) {
    console.error('❌ [SETUP-CUSTOMER-GENERATIONS-METAFIELD] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

