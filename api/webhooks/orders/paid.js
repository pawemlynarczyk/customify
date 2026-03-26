// Poprawiona ścieżka: z api/webhooks/orders/ do utils/ trzeba 3 poziomy w górę (../../../)
const Sentry = require('../../../utils/sentry');
const { kv } = require('@vercel/kv');

const SHOP_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';

// Mapa: etykieta wariantu → liczba kredytów
const CREDITS_VARIANT_MAP = {
  '3': 3, '3 kredyty': 3, '3 kredyty - 89 zł': 3,
  '5': 5, '5 kredytów': 5, '5 kredytów - 149 zł': 5,
  '10': 10, '10 kredytów': 10, '10 kredytów - 199 zł': 10,
};

function parseCreditsFromVariant(variantTitle, quantity) {
  if (!variantTitle) return 0;
  const key = variantTitle.toLowerCase().trim();
  // Szukaj liczby w tytule (np. "3 kredyty", "5 kredytów", "10 kredytów")
  for (const [pattern, credits] of Object.entries(CREDITS_VARIANT_MAP)) {
    if (key.includes(pattern.toLowerCase())) return credits * (quantity || 1);
  }
  // Fallback: wyciągnij pierwszą liczbę z tytułu
  const match = variantTitle.match(/(\d+)/);
  return match ? parseInt(match[1], 10) * (quantity || 1) : 0;
}

async function addCreditsToCustomer(customerId, creditsToAdd) {
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  // Pobierz aktualne kredyty
  const query = `
    query getCredits($id: ID!) {
      customer(id: $id) {
        metafield(namespace: "customify", key: "credits") {
          id value type
        }
      }
    }
  `;

  const getRes = await fetch(`https://${SHOP_DOMAIN}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
    body: JSON.stringify({ query, variables: { id: `gid://shopify/Customer/${customerId}` } })
  });
  const getData = await getRes.json();
  const currentCredits = parseInt(getData.data?.customer?.metafield?.value || '0', 10) || 0;
  const newCredits = currentCredits + creditsToAdd;

  // Zapisz nowe kredyty
  const mutation = `
    mutation setCredits($input: MetafieldsSetInput!) {
      metafieldsSet(metafields: [$input]) {
        metafields { id value }
        userErrors { field message }
      }
    }
  `;

  const setRes = await fetch(`https://${SHOP_DOMAIN}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
    body: JSON.stringify({
      query: mutation,
      variables: {
        input: {
          ownerId: `gid://shopify/Customer/${customerId}`,
          namespace: 'customify',
          key: 'credits',
          value: String(newCredits),
          type: 'number_integer'
        }
      }
    })
  });
  const setData = await setRes.json();

  if (setData.errors || setData.data?.metafieldsSet?.userErrors?.length > 0) {
    throw new Error('Failed to set credits: ' + JSON.stringify(setData.errors || setData.data?.metafieldsSet?.userErrors));
  }

  console.log(`✅ [ORDER-PAID-WEBHOOK] Credits updated: customer ${customerId}: ${currentCredits} + ${creditsToAdd} = ${newCredits}`);
  return newCredits;
}

module.exports = async (req, res) => {
  console.log('🛒 [ORDER-PAID-WEBHOOK] Order paid webhook received');
  
  try {
    const order = req.body;
    console.log('🛒 [ORDER-PAID-WEBHOOK] Order ID:', order.id);
    console.log('🛒 [ORDER-PAID-WEBHOOK] Order line items:', order.line_items?.length || 0);
    
    // 🚨 ROLLBACK: START - Feature flag dla produktu cyfrowego
    const ENABLE_DIGITAL_PRODUCTS = process.env.ENABLE_DIGITAL_PRODUCTS !== 'false';
    // 🚨 ROLLBACK: END - Feature flag dla produktu cyfrowego

    // === KREDYTY: Sprawdź czy zamówienie zawiera pakiet kredytów ===
    const creditItems = order.line_items?.filter(item =>
      item.product_type === 'Credits Package' ||
      item.tags?.includes('credits-package') ||
      item.title?.toLowerCase().includes('pakiet kredytów') ||
      item.title?.toLowerCase().includes('pakiet kredytow')
    ) || [];

    if (creditItems.length > 0 && order.customer?.id) {
      const customerId = order.customer.id;
      let totalCreditsToAdd = 0;

      for (const item of creditItems) {
        const credits = parseCreditsFromVariant(item.variant_title || item.title, item.quantity);
        if (credits > 0) {
          totalCreditsToAdd += credits;
          console.log(`💳 [ORDER-PAID-WEBHOOK] Credit item: "${item.variant_title || item.title}" → +${credits} credits`);
        }
      }

      if (totalCreditsToAdd > 0) {
        try {
          const newBalance = await addCreditsToCustomer(customerId, totalCreditsToAdd);

          // Statystyki w KV
          const day = new Date().toISOString().slice(0, 10);
          await kv.incr(`credits:stats:purchased:${day}`).catch(() => {});
          await kv.incrby('credits:stats:purchased:total', totalCreditsToAdd).catch(() => {});

          console.log(`💳 [ORDER-PAID-WEBHOOK] Added ${totalCreditsToAdd} credits to customer ${customerId}. New balance: ${newBalance}`);

          // Jeśli tylko kredyty w zamówieniu (brak innych produktów Customify) – zwróć sukces
          const hasOnlyCredits = order.line_items?.every(item =>
            item.product_type === 'Credits Package' ||
            item.tags?.includes('credits-package') ||
            item.title?.toLowerCase().includes('pakiet kredytów') ||
            item.title?.toLowerCase().includes('pakiet kredytow')
          );
          if (hasOnlyCredits) {
            return res.status(200).json({
              success: true,
              message: `Added ${totalCreditsToAdd} credits to customer ${customerId}`,
              newBalance
            });
          }
        } catch (creditsError) {
          console.error('❌ [ORDER-PAID-WEBHOOK] Failed to add credits:', creditsError);
          Sentry.captureException(creditsError);
          // Nie przerywaj – spróbuj obsłużyć resztę zamówienia
        }
      }
    }

    // Znajdź produkty Customify w zamówieniu
    const customifyProducts = order.line_items?.filter(item => 
      item.vendor === 'Customify' || 
      item.product_type === 'Custom AI Product' ||
      item.product_type === 'Digital Product' ||
      item.title?.includes('Spersonalizowany')
    ) || [];
    
    console.log('🛒 [ORDER-PAID-WEBHOOK] Found Customify products:', customifyProducts.length);
    
    if (customifyProducts.length === 0) {
      console.log('🛒 [ORDER-PAID-WEBHOOK] No Customify products in this order');
      return res.status(200).json({ message: 'No Customify products to hide' });
    }

    // 📊 ATRYBUCJA EMAIL: sprawdź czy klient kliknął mail przed zakupem
    const customerId = order.customer?.id;
    if (customerId) {
      try {
        const raw = await kv.get(`email-click:${customerId}`);
        const clickData = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : raw;
        if (clickData?.type) {
          await kv.incr(`email-stats:${clickData.type}:purchases`);
          console.log(`📊 [ORDER-PAID-WEBHOOK] Zakup przypisany do maila: ${clickData.type} (customerId: ${customerId})`);
        }
      } catch (kvErr) {
        console.warn('⚠️ [ORDER-PAID-WEBHOOK] Błąd atrybucji emaila (non-fatal):', kvErr.message);
      }

      // 📊 Lejek limitu: zakup po wcześniejszym pokazaniu komunikatu o limicie (30 dni, raz per zamówienie)
      try {
        const rawLimit = await kv.get(`lf:user:last_limit:${customerId}`);
        if (rawLimit) {
          const lim = typeof rawLimit === 'string' ? (() => { try { return JSON.parse(rawLimit); } catch { return null; } })() : rawLimit;
          if (lim && lim.ts && Date.now() - lim.ts < 30 * 24 * 60 * 60 * 1000) {
            const pk = `lf:purchase_counted:${customerId}:${order.id}`;
            const done = await kv.get(pk);
            if (!done) {
              await kv.set(pk, '1', { ex: 60 * 60 * 24 * 90 });
              const day = new Date().toISOString().slice(0, 10);
              await kv.incr('lf:stats:all:purchase_after_limit');
              await kv.incr(`lf:stats:day:${day}:purchase_after_limit`);
              console.log(`📊 [ORDER-PAID-WEBHOOK] Lejek limitu: zakup po komunikacie (customerId: ${customerId}, order: ${order.id})`);
            }
          }
        }
      } catch (lfErr) {
        console.warn('⚠️ [ORDER-PAID-WEBHOOK] Błąd lejka limitu (non-fatal):', lfErr.message);
      }
    }
    
    const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    
    if (!accessToken) {
      console.error('❌ [ORDER-PAID-WEBHOOK] No access token');
      return res.status(500).json({ error: 'No access token' });
    }
    
    // Ukryj każdy produkt Customify w adminie (nie blokuj zamówień)
    // 🚨 ROLLBACK: START - Obsługa produktów cyfrowych i fizycznych
    for (const item of customifyProducts) {
      if (item.product_id) {
        console.log('🔒 [ORDER-PAID-WEBHOOK] Processing product:', item.product_id);
        
        // Najpierw pobierz aktualne tagi produktu i metafields
        const getProductResponse = await fetch(`https://${shop}/admin/api/2023-10/products/${item.product_id}.json`, {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        });
        
        if (!getProductResponse.ok) {
          console.error('❌ [ORDER-PAID-WEBHOOK] Failed to get product:', item.product_id);
          continue;
        }
        
        const productData = await getProductResponse.json();
        const product = productData.product;
        const currentTags = product.tags ? product.tags.split(', ') : [];
        
        // 🚨 ROLLBACK: START - Wykryj produkt cyfrowy i wyślij e-mail
        const isDigitalProduct = ENABLE_DIGITAL_PRODUCTS && (
          product.product_type === 'Digital Product' || 
          product.requires_shipping === false
        );

        if (isDigitalProduct) {
          console.log('📧 [ORDER-PAID-WEBHOOK] Digital product detected - sending download email');
          
          try {
            // Pobierz metafields produktu (URL do pobrania)
            const metafieldsResponse = await fetch(`https://${shop}/admin/api/2023-10/products/${item.product_id}/metafields.json`, {
              headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json'
              }
            });

            if (metafieldsResponse.ok) {
              const metafieldsData = await metafieldsResponse.json();
              const orderDetailsMetafield = metafieldsData.metafields?.find(
                m => m.namespace === 'customify' && m.key === 'order_details'
              );

              if (orderDetailsMetafield) {
                const orderDetails = JSON.parse(orderDetailsMetafield.value);
                const downloadUrl = orderDetails.digitalDownloadUrl || orderDetails.permanentImageUrl;

                if (downloadUrl && order.email) {
                  // Wyślij e-mail przez Shopify Customer Notification API
                  const emailData = {
                    notification: {
                      to: order.email,
                      subject: 'Twój produkt cyfrowy Customify jest gotowy! 🎨',
                      custom_message: `
Cześć ${order.customer?.first_name || 'Kliencie'},

Dziękujemy za zakup! Twój spersonalizowany obraz AI jest gotowy do pobrania.

📥 Pobierz swój obraz:
${downloadUrl}

Szczegóły zamówienia:
- Numer zamówienia: #${order.order_number || order.id}
- Styl: ${orderDetails.style || 'N/A'}
- Data: ${new Date().toLocaleDateString('pl-PL')}

Link jest ważny przez 30 dni.

Pozdrawiamy,
Zespół Customify
                      `.trim()
                    }
                  };

                  // Shopify Customer Notification API (wysyłka e-maila)
                  const emailResponse = await fetch(`https://${shop}/admin/api/2023-10/customers/${order.customer?.id}/send_invite.json`, {
                    method: 'POST',
                    headers: {
                      'X-Shopify-Access-Token': accessToken,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      customer_invite: {
                        to: order.email,
                        subject: emailData.notification.subject,
                        custom_message: emailData.notification.custom_message
                      }
                    })
                  });

                  // Alternatywnie: użyj Order Notification API
                  if (!emailResponse.ok) {
                    console.log('⚠️ [ORDER-PAID-WEBHOOK] Customer invite failed, trying order notification...');
                    
                    // Wysyłka przez Order Notification (backup)
                    const orderNotificationResponse = await fetch(`https://${shop}/admin/api/2023-10/orders/${order.id}/send_invoice.json`, {
                      method: 'POST',
                      headers: {
                        'X-Shopify-Access-Token': accessToken,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        notify_customer: true,
                        custom_message: emailData.notification.custom_message
                      })
                    });

                    if (orderNotificationResponse.ok) {
                      console.log('✅ [ORDER-PAID-WEBHOOK] Order notification sent (backup method)');
                    } else {
                      console.error('❌ [ORDER-PAID-WEBHOOK] Failed to send order notification');
                    }
                  } else {
                    console.log('✅ [ORDER-PAID-WEBHOOK] Digital product download email sent');
                  }

                  // Oznacz zamówienie jako zrealizowane (fulfillment)
                  const fulfillmentResponse = await fetch(`https://${shop}/admin/api/2023-10/orders/${order.id}/fulfillments.json`, {
                    method: 'POST',
                    headers: {
                      'X-Shopify-Access-Token': accessToken,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      fulfillment: {
                        location_id: null,
                        tracking_number: `DIGITAL-${order.id}`,
                        tracking_company: 'Digital Delivery',
                        notify_customer: false, // E-mail już wysłany
                        line_items: [{
                          id: item.id,
                          quantity: item.quantity
                        }]
                      }
                    })
                  });

                  if (fulfillmentResponse.ok) {
                    console.log('✅ [ORDER-PAID-WEBHOOK] Digital product marked as fulfilled');
                  } else {
                    console.error('⚠️ [ORDER-PAID-WEBHOOK] Failed to mark digital product as fulfilled');
                  }
                } else {
                  console.error('❌ [ORDER-PAID-WEBHOOK] Missing download URL or customer email');
                }
              } else {
                console.error('❌ [ORDER-PAID-WEBHOOK] Order details metafield not found');
              }
            } else {
              console.error('❌ [ORDER-PAID-WEBHOOK] Failed to fetch product metafields');
            }
          } catch (emailError) {
            console.error('❌ [ORDER-PAID-WEBHOOK] Error sending digital product email:', emailError);
            
            // ✅ SENTRY: Loguj błąd wysyłki maila
            Sentry.withScope((scope) => {
              scope.setTag('customify', 'true');
              scope.setTag('error_type', 'email_send_failed');
              scope.setTag('webhook', 'orders/paid');
              scope.setContext('email', {
                orderId: order.id,
                customerEmail: order.email,
                productId: item.product_id,
                variantId: item.variant_id
              });
              Sentry.captureException(emailError);
            });
            
            // Nie przerywaj procesu - kontynuuj ukrywanie produktu
          }
        }
        // 🚨 ROLLBACK: END - Wykryj produkt cyfrowy i wyślij e-mail
        
        // Dodaj nowe tagi (nie nadpisuj istniejących)
        const newTags = [...new Set([...currentTags, 'order-completed', 'hidden-from-admin'])];
        
        const hideData = {
          product: {
            id: parseInt(item.product_id),
            tags: newTags.join(', ')
          }
        };
        
        const hideResponse = await fetch(`https://${shop}/admin/api/2023-10/products/${item.product_id}.json`, {
          method: 'PUT',
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(hideData)
        });
        
        if (hideResponse.ok) {
          console.log('✅ [ORDER-PAID-WEBHOOK] Product hidden from admin:', item.product_id);
        } else {
          console.error('❌ [ORDER-PAID-WEBHOOK] Failed to hide product from admin:', item.product_id);
        }
      }
    }
    // 🚨 ROLLBACK: END - Obsługa produktów cyfrowych i fizycznych
    
    res.status(200).json({ 
      success: true, 
      message: 'Customify products hidden from admin after order payment (still available for reorders)',
      hiddenCount: customifyProducts.length
    });
    
  } catch (error) {
    console.error('❌ [ORDER-PAID-WEBHOOK] Error:', error);
    
    // ✅ SENTRY: Loguj błąd webhooka
    Sentry.withScope((scope) => {
      scope.setTag('customify', 'true');
      scope.setTag('error_type', 'webhook_failed');
      scope.setTag('webhook', 'orders/paid');
      scope.setContext('webhook', {
        orderId: req.body?.id || null,
        orderEmail: req.body?.email || null
      });
      Sentry.captureException(error);
    });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};
