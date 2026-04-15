// api/get-pricing-config.js
/**
 * API endpoint do pobierania globalnych cen Customify z Shop Metafield
 * Używane przez wszystkie produkty Customify
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

  // Akceptuj zarówno GET jak i POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const shop = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!accessToken) {
    console.error('❌ [PRICING-CONFIG] Brak SHOPIFY_ACCESS_TOKEN');
    return res.status(500).json({ error: 'Missing access token' });
  }

  try {
    console.log('🔍 [PRICING-CONFIG] Pobieranie globalnych cen Customify...');

    // GraphQL Query do pobrania Shop Metafield
    const query = `
      query {
        shop {
          metafield(namespace: "customify", key: "global_pricing") {
            id
            namespace
            key
            value
            type
          }
        }
      }
    `;

    const response = await fetch(`https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [PRICING-CONFIG] GraphQL error:', errorText);
      return res.status(500).json({ 
        error: 'Failed to fetch pricing config',
        details: errorText
      });
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ [PRICING-CONFIG] GraphQL errors:', result.errors);
      return res.status(500).json({ 
        error: 'GraphQL errors',
        details: result.errors
      });
    }

    const metafield = result.data.shop.metafield;
    
    if (!metafield) {
      console.error('❌ [PRICING-CONFIG] Metafield nie znaleziony');
      return res.status(404).json({ 
        error: 'Pricing config not found',
        message: 'Uruchom setup-pricing-data.js żeby ustawić domyślne ceny'
      });
    }

    // Parsuj JSON z metafield
    const pricingConfig = JSON.parse(metafield.value);
    
    console.log('✅ [PRICING-CONFIG] Ceny pobrane pomyślnie');
    console.log('📋 [PRICING-CONFIG] Dostępne typy:', Object.keys(pricingConfig.productTypes));
    
    return res.status(200).json({
      success: true,
      config: pricingConfig,
      metafieldId: metafield.id,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [PRICING-CONFIG] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
};
