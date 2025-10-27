const fetch = require('node-fetch');

// Skonfiguruj te wartości
const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

async function createCaricatureProduct() {
  console.log('🛍️ [CREATE-CARICATURE] Tworzenie produktu z karykaturami...');

  const productData = {
    product: {
      title: 'Karykatura ze zdjęcia',
      body_html: `
        <p><strong>Karykatura ze zdjęcia - Zabawne portrety!</strong></p>
        <p>Przekształć swoje zdjęcie w zabawną karykaturę! Wyolbrzymiamy cechy charakterystyczne, tworząc humorystyczny portret w stylu karykatur.</p>
        
        <p><strong>Jak to działa:</strong></p>
        <ol>
          <li>Wgraj swoje zdjęcie</li>
          <li>Wybierz styl karykatury</li>
          <li>Otrzymaj zabawny, wyolbrzymiony portret</li>
          <li>Otrzymamy gotowy wydruk na płótnie</li>
        </ol>

        <p><strong>Rozmiary i ceny:</strong></p>
        <ul>
          <li>A4 (21x30 cm) - 49 zł</li>
          <li>A3 (30x42 cm) - 79 zł</li>
          <li>A2 (42x60 cm) - 129 zł</li>
          <li>A1 (60x84 cm) - 249 zł</li>
        </ul>

        <p><strong>Jakość:</strong></p>
        <ul>
          <li>Wysokiej jakości druk na płótnie</li>
          <li>Trwałe kolory na lata</li>
          <li>Gotowe do powieszenia</li>
        </ul>

        <p>Idealny prezent dla bliskich! Karykatura to zabawny sposób na uwiecznienie wspomnień.</p>
      `,
      vendor: 'Customify',
      product_type: 'Custom AI Caricature',
      tags: ['custom', 'ai', 'caricature', 'funny', 'portrait', 'personalized'],
      published: true,
      published_scope: 'web',
      variants: [
        {
          title: 'A4 (21x30 cm)',
          price: '49.00',
          inventory_quantity: 1000,
          inventory_management: 'shopify',
          fulfillment_service: 'manual'
        },
        {
          title: 'A3 (30x42 cm)',
          price: '79.00',
          inventory_quantity: 1000,
          inventory_management: 'shopify',
          fulfillment_service: 'manual'
        },
        {
          title: 'A2 (42x60 cm)',
          price: '129.00',
          inventory_quantity: 1000,
          inventory_management: 'shopify',
          fulfillment_service: 'manual'
        },
        {
          title: 'A1 (60x84 cm)',
          price: '249.00',
          inventory_quantity: 1000,
          inventory_management: 'shopify',
          fulfillment_service: 'manual'
        }
      ]
    }
  };

  try {
    const response = await fetch(`https://${shop}/admin/api/2023-10/products.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [CREATE-CARICATURE] Błąd:', errorText);
      return;
    }

    const result = await response.json();
    const product = result.product;

    console.log('✅ [CREATE-CARICATURE] Produkt utworzony!');
    console.log(`📦 ID: ${product.id}`);
    console.log(`📝 Tytuł: ${product.title}`);
    console.log(`🔗 Handle: ${product.handle}`);
    console.log(`🌐 URL: https://${shop}/products/${product.handle}`);
    console.log(`💰 Wariantów: ${product.variants.length}`);

    return product;

  } catch (error) {
    console.error('❌ [CREATE-CARICATURE] Błąd:', error);
  }
}

// Uruchom
createCaricatureProduct();
