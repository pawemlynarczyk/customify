// api/get-collection-products.js
/**
 * Endpoint do pobierania produktów z kolekcji Shopify
 * GET: /api/get-collection-products?handle=walentynki
 */

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(500).json({ error: 'SHOPIFY_ACCESS_TOKEN not configured' });
    }

    // Obsługa zarówno handle jak i ID kolekcji
    const collectionHandle = req.query.handle;
    const collectionId = req.query.id;
    
    if (!collectionHandle && !collectionId) {
      return res.status(400).json({
        error: 'Missing collection identifier',
        message: 'Podaj parametr ?handle=walentynki lub ?id=672196395333'
      });
    }

    console.log(`🛍️ [GET-COLLECTION-PRODUCTS] Pobieranie produktów z kolekcji: ${collectionHandle || collectionId}`);

    // GraphQL query - znajdź kolekcję po handle LUB ID i pobierz produkty
    let query, variables;
    
    if (collectionId) {
      // Użyj ID (np. 672196395333)
      const gid = `gid://shopify/Collection/${collectionId}`;
      query = `
        query getCollectionProducts($id: ID!) {
          collection(id: $id) {
            id
            title
            handle
            products(first: 50) {
              edges {
                node {
                  id
                  title
                  handle
                  onlineStoreUrl
                  featuredImage {
                    url(transform: { maxWidth: 600, maxHeight: 600 })
                  }
                }
              }
            }
          }
        }
      `;
      variables = { id: gid };
    } else {
      // Użyj handle (np. "walentynki")
      query = `
        query getCollectionProducts($handle: String!) {
          collectionByHandle(handle: $handle) {
            id
            title
            handle
            products(first: 50) {
              edges {
                node {
                  id
                  title
                  handle
                  onlineStoreUrl
                  featuredImage {
                    url(transform: { maxWidth: 600, maxHeight: 600 })
                  }
                }
              }
            }
          }
        }
      `;
      variables = { handle: collectionHandle };
    }

    const response = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [GET-COLLECTION-PRODUCTS] Shopify API error: ${response.status}`);
      return res.status(500).json({
        error: 'Failed to fetch collection',
        details: errorText.substring(0, 500)
      });
    }

    const data = await response.json();

    if (data.errors) {
      console.error('❌ [GET-COLLECTION-PRODUCTS] GraphQL errors:', data.errors);
      return res.status(500).json({
        error: 'GraphQL errors',
        details: data.errors
      });
    }

    // Obsługa zarówno collectionByHandle jak i collection (ID)
    const collection = data?.data?.collectionByHandle || data?.data?.collection;

    if (!collection) {
      return res.status(404).json({
        error: 'Collection not found',
        identifier: collectionHandle || collectionId,
        message: `Kolekcja nie została znaleziona. Sprawdź czy handle lub ID jest poprawne.`
      });
    }

    // Przekształć produkty do formatu używanego w emailu
    const products = collection.products.edges
      .map(edge => {
        const product = edge.node;
        return {
          title: product.title,
          handle: product.handle,
          href: product.onlineStoreUrl || `https://lumly.pl/products/${product.handle}`,
          img: product.featuredImage?.url || null
        };
      })
      .filter(product => product.img); // Tylko produkty z obrazkiem

    console.log(`✅ [GET-COLLECTION-PRODUCTS] Znaleziono ${products.length} produktów w kolekcji "${collection.title}"`);

    return res.status(200).json({
      success: true,
      collection: {
        id: collection.id,
        title: collection.title,
        handle: collection.handle
      },
      products: products,
      count: products.length
    });

  } catch (error) {
    console.error('❌ [GET-COLLECTION-PRODUCTS] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
