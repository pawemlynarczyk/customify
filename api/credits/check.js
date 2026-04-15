// api/credits/check.js
// Sprawdza saldo kredytów dla zalogowanego użytkownika
// Kredyty przechowywane w Shopify Customer Metafield: namespace=customify, key=credits

const { SHOPIFY_API_VERSION } = require('../../utils/shopifyConfig');

const CORS_ORIGINS = [
  'https://lumly.pl',
  'https://customify-s56o.vercel.app',
  'http://localhost:3000'
];

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (CORS_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function getCustomerCredits(customerId) {
  const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  const query = `
    query getCredits($id: ID!) {
      customer(id: $id) {
        id
        email
        metafield(namespace: "customify", key: "credits") {
          id
          value
          type
        }
      }
    }
  `;

  const response = await fetch(`https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({
      query,
      variables: { id: String(customerId).startsWith('gid://') ? customerId : `gid://shopify/Customer/${customerId}` }
    })
  });

  const data = await response.json();

  if (data.errors) {
    console.error('❌ [CREDITS/CHECK] GraphQL errors:', data.errors);
    throw new Error('Failed to fetch customer credits');
  }

  const customer = data.data?.customer;
  if (!customer) {
    throw new Error('Customer not found');
  }

  const rawValue = customer.metafield?.value || '0';
  const credits = parseInt(rawValue, 10) || 0;

  return { credits, email: customer.email };
}

module.exports = async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { customerId } = req.body;

    console.log(`🔍 [CREDITS/CHECK] Otrzymane customerId: "${customerId}" (typ: ${typeof customerId})`);

    if (!customerId) {
      return res.status(400).json({
        error: 'customerId required',
        credits: 0,
        isLoggedIn: false
      });
    }

    if (!process.env.SHOPIFY_ACCESS_TOKEN) {
      return res.status(500).json({ error: 'Shopify not configured' });
    }

    const { credits, email } = await getCustomerCredits(customerId);

    console.log(`💳 [CREDITS/CHECK] Customer ${customerId} has ${credits} credits`);

    return res.json({
      isLoggedIn: true,
      credits,
      email,
      message: credits > 0 ? `Masz ${credits} kredytów` : 'Brak kredytów'
    });

  } catch (error) {
    console.error('❌ [CREDITS/CHECK] Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
