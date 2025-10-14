const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed - use POST' });
    return;
  }

  try {
    const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(500).json({ error: 'Shopify access token not configured' });
    }

    console.log('🎨 [CREATE-KING-PRODUCT] Tworzę produkt "Obraz króla"...');

    // KROK 1: Utwórz produkt BEZ obrazka
    const productData = {
      product: {
        title: 'Obraz króla',
        body_html: `
          <p><strong>Obraz króla - Portret w stylu królewskim</strong></p>
          <p>Przekształć swoje zdjęcie w majestatyczny portret króla za pomocą AI!</p>
          <p><strong>Dostępne style:</strong></p>
          <ul>
            <li>Król Królewski - klasyczny portret monarchy</li>
            <li>Król Majestatyczny - elegancki i dostojny wizerunek</li>
            <li>Król Triumfalny - potężny i zwycięski</li>
          </ul>
          <p><strong>Rozmiary:</strong></p>
          <ul>
            <li>A4 (21x30cm) - 54.99 zł</li>
            <li>A3 (30x42cm) - 84.99 zł</li>
            <li>A2 (42x59cm) - 189 zł</li>
          </ul>
          <p>Wysokiej jakości druk na płótnie premium. Wgraj swoje zdjęcie, wybierz styl AI, a my wydrukujemy je jako obraz na prezent.</p>
        `,
        vendor: 'Customify',
        product_type: 'Custom AI Portrait',
        tags: ['custom', 'ai', 'king', 'portrait', 'personalized'],
        published: true,
        published_scope: 'web',
        variants: [{
          title: 'A4 (21x30cm)',
          price: '54.99',
          inventory_quantity: 1000,
          inventory_management: 'shopify',
          fulfillment_service: 'manual'
        }]
      }
    };

    // Utwórz produkt
    const createResponse = await fetch(`https://${shop}/admin/api/2023-10/products.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ [CREATE-KING-PRODUCT] Błąd tworzenia produktu:', errorText);
      return res.status(500).json({ 
        error: 'Failed to create product',
        details: errorText
      });
    }

    const createdProduct = await createResponse.json();
    const product = createdProduct.product;
    
    console.log('✅ [CREATE-KING-PRODUCT] Produkt utworzony:', {
      id: product.id,
      title: product.title,
      handle: product.handle
    });

    // KROK 2: Dodaj główny obrazek krol_ok.png
    console.log('📸 [CREATE-KING-PRODUCT] Dodaję główny obrazek...');
    
    const imageData = {
      image: {
        src: 'https://customify-s56o.vercel.app/krol/krol_ok.png',
        alt: 'Obraz króla - przykład',
        position: 1
      }
    };

    const imageResponse = await fetch(`https://${shop}/admin/api/2023-10/products/${product.id}/images.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(imageData)
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('❌ [CREATE-KING-PRODUCT] Błąd dodawania obrazka:', errorText);
      // Kontynuuj mimo błędu - produkt jest utworzony
    } else {
      console.log('✅ [CREATE-KING-PRODUCT] Obrazek dodany pomyślnie!');
    }

    return res.json({
      success: true,
      product: {
        id: product.id,
        title: product.title,
        handle: product.handle,
        url: `https://lumly.pl/products/${product.handle}`
      },
      message: 'Produkt "Obraz króla" utworzony pomyślnie!'
    });

  } catch (error) {
    console.error('❌ [CREATE-KING-PRODUCT] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
};

