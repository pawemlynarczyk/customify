// api/setup-metafield.js
/**
 * API endpoint do sprawdzenia i utworzenia Customer Metafield Definition
 * Dostępny publicznie przez Vercel (ma access do SHOPIFY_ACCESS_TOKEN)
 */

module.exports = async (req, res) => {
  console.log(`🔧 [SETUP-METAFIELD] API called - Method: ${req.method}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!accessToken) {
    return res.status(500).json({ 
      error: 'SHOPIFY_ACCESS_TOKEN not configured',
      message: 'Please configure environment variable in Vercel'
    });
  }

  try {
    // 1. Sprawdź czy metafield definition już istnieje
    console.log(`🔍 [SETUP-METAFIELD] Sprawdzam istniejące metafield definitions...`);
    
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

    const checkResponse = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({ query: checkQuery })
    });

    const checkData = await checkResponse.json();
    
    if (checkData.errors) {
      console.error('❌ [SETUP-METAFIELD] GraphQL errors:', checkData.errors);
      return res.status(500).json({ 
        error: 'Failed to check metafield definitions',
        details: checkData.errors
      });
    }

    const definitions = checkData.data?.metafieldDefinitions?.edges || [];
    console.log(`📊 [SETUP-METAFIELD] Znaleziono ${definitions.length} metafield definitions`);

    // Wyświetl wszystkie znalezione metafieldy
    const allMetafields = definitions.map(({ node }) => ({
      name: node.name,
      namespace: node.namespace,
      key: node.key,
      type: node.type.name,
      id: node.id
    }));

    console.log(`📋 [SETUP-METAFIELD] Wszystkie metafieldy:`, JSON.stringify(allMetafields, null, 2));

    // Sprawdź czy nasz metafield istnieje (namespace: "customify", key: "usage_count")
    const ourMetafield = definitions.find(({ node }) => 
      node.namespace === 'customify' && node.key === 'usage_count'
    );

    if (ourMetafield) {
      console.log('✅ [SETUP-METAFIELD] Metafield "customify.usage_count" JUŻ ISTNIEJE!');
      return res.json({
        success: true,
        exists: true,
        metafield: {
          id: ourMetafield.node.id,
          name: ourMetafield.node.name,
          namespace: ourMetafield.node.namespace,
          key: ourMetafield.node.key,
          type: ourMetafield.node.type.name
        },
        message: 'Metafield już istnieje - wszystko działa!',
        allMetafields: allMetafields
      });
    }

    // 2. Metafield nie istnieje - stwórz go
    console.log('🆕 [SETUP-METAFIELD] Tworzę nowy metafield definition...');

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

    const createResponse = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
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
    console.log(`📊 [SETUP-METAFIELD] Create response:`, JSON.stringify(createData, null, 2));

    if (createData.errors) {
      console.error('❌ [SETUP-METAFIELD] GraphQL errors:', createData.errors);
      return res.status(500).json({ 
        error: 'Failed to create metafield definition',
        details: createData.errors,
        allMetafields: allMetafields
      });
    }

    const result = createData.data?.metafieldDefinitionCreate;

    if (result?.userErrors && result.userErrors.length > 0) {
      console.error('❌ [SETUP-METAFIELD] User errors:', result.userErrors);
      
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
          allMetafields: allMetafields
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to create metafield definition',
        details: result.userErrors,
        allMetafields: allMetafields
      });
    }

    if (result?.createdDefinition) {
      console.log('✅ [SETUP-METAFIELD] Metafield definition utworzony pomyślnie!');
      return res.json({
        success: true,
        created: true,
        metafield: {
          id: result.createdDefinition.id,
          name: result.createdDefinition.name,
          namespace: result.createdDefinition.namespace,
          key: result.createdDefinition.key,
          type: result.createdDefinition.type.name
        },
        message: 'Metafield utworzony - teraz będzie widoczny w Customers!',
        instructions: [
          '1. Idź do: Shopify Admin → Customers',
          '2. Wybierz dowolnego klienta',
          '3. Przewiń w dół do sekcji "Metafields"',
          '4. Powinieneś zobaczyć: "Usage Count" = 0'
        ],
        allMetafields: allMetafields
      });
    }

    return res.status(500).json({ 
      error: 'Unexpected response format',
      response: createData,
      allMetafields: allMetafields
    });

  } catch (error) {
    console.error('❌ [SETUP-METAFIELD] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
