// api/setup-metafield.js
/**
 * API endpoint do utworzenia Customer Metafield Definition
 * Endpoint: https://customify-s56o.vercel.app/api/setup-metafield
 */

module.exports = async (req, res) => {
  console.log('🚀 [SETUP-METAFIELD] Creating Customer Metafield Definition...');
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!accessToken) {
    console.error('❌ [SETUP-METAFIELD] SHOPIFY_ACCESS_TOKEN not configured');
    return res.status(500).json({ error: 'Shopify not configured' });
  }

  // GraphQL Mutation
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
      description: "Liczba wykorzystanych transformacji AI (0-13)",
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

  try {
    console.log('📡 [SETUP-METAFIELD] Sending request to Shopify GraphQL...');
    
    const response = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
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

    const data = await response.json();
    console.log('📊 [SETUP-METAFIELD] Response:', JSON.stringify(data, null, 2));

    if (data.errors) {
      console.error('❌ [SETUP-METAFIELD] GraphQL Errors:', data.errors);
      return res.status(500).json({ 
        error: 'GraphQL error',
        details: data.errors
      });
    }

    const result = data.data?.metafieldDefinitionCreate;
    
    if (result?.userErrors && result.userErrors.length > 0) {
      console.error('❌ [SETUP-METAFIELD] User Errors:', result.userErrors);
      
      // Sprawdź czy to błąd "already exists"
      const alreadyExists = result.userErrors.some(err => 
        err.message.includes('already exists') || 
        err.message.includes('taken') ||
        err.code === 'TAKEN'
      );
      
      if (alreadyExists) {
        console.log('✅ [SETUP-METAFIELD] Metafield Definition już istnieje');
        return res.json({
          success: true,
          message: 'Metafield Definition już istnieje - OK!',
          alreadyExists: true
        });
      }
      
      return res.status(400).json({ 
        error: 'User errors',
        details: result.userErrors
      });
    }

    if (result?.createdDefinition) {
      console.log('✅ [SETUP-METAFIELD] Metafield Definition utworzony pomyślnie!');
      return res.json({
        success: true,
        message: 'Metafield Definition utworzony pomyślnie!',
        definition: {
          id: result.createdDefinition.id,
          name: result.createdDefinition.name,
          namespace: result.createdDefinition.namespace,
          key: result.createdDefinition.key,
          type: result.createdDefinition.type.name,
          ownerType: result.createdDefinition.ownerType
        },
        instructions: {
          step1: 'Shopify Admin → Settings → Custom Data',
          step2: 'Wybierz: Customers',
          step3: 'Znajdź: "Usage Count" (customify.usage_count)',
          alternative1: 'Shopify Admin → Customers',
          alternative2: 'Wybierz dowolnego klienta',
          alternative3: 'Przewiń w dół → Metafields'
        }
      });
    }

    console.error('❌ [SETUP-METAFIELD] Nieoczekiwany format odpowiedzi');
    return res.status(500).json({ 
      error: 'Unexpected response format',
      data: data
    });

  } catch (error) {
    console.error('❌ [SETUP-METAFIELD] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
};

