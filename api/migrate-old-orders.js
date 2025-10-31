const { checkRateLimit, getClientIP } = require('../utils/vercelRateLimiter');
const { put } = require('@vercel/blob');

module.exports = async (req, res) => {
  // Set CORS headers
  const origin = req.headers.origin;
  if (origin && (origin.includes('lumly.pl') || origin.includes('customify-s56o.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Rate limiting
  const ip = getClientIP(req);
  if (!checkRateLimit(ip, 10, 60 * 1000)) { // 10 requestów/minutę
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  try {
    const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(500).json({ error: 'Shopify access token not configured' });
    }

    // Pobierz parametry
    const { orderId, limit = 50, dryRun = false } = req.body || {};

    console.log('🔄 [MIGRATE] Starting migration of old orders...');
    console.log('🔄 [MIGRATE] Order ID:', orderId || 'all');
    console.log('🔄 [MIGRATE] Limit:', limit);
    console.log('🔄 [MIGRATE] Dry run:', dryRun);

    let orders = [];

    if (orderId) {
      // Pojedyncze zamówienie
      const orderResponse = await fetch(`https://${shop}/admin/api/2023-10/orders/${orderId}.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });

      if (!orderResponse.ok) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const orderData = await orderResponse.json();
      orders = [orderData.order];
    } else {
      // Wszystkie zamówienia z limitem
      const ordersResponse = await fetch(`https://${shop}/admin/api/2023-10/orders.json?limit=${limit}&status=any`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });

      if (!ordersResponse.ok) {
        throw new Error(`Failed to fetch orders: ${ordersResponse.status}`);
      }

      const ordersData = await ordersResponse.json();
      orders = ordersData.orders || [];
    }

    const results = {
      total: orders.length,
      migrated: 0,
      skipped: 0,
      failed: 0,
      details: []
    };

    for (const order of orders) {
      try {
        // Znajdź produkty Customify w zamówieniu
        const customifyItems = order.line_items.filter(item => {
          const props = item.properties || [];
          return props.some(p => p.name === '_AI_Image_URL' || p.name === '_Order_ID');
        });

        if (customifyItems.length === 0) {
          results.skipped++;
          continue;
        }

        let orderNeedsUpdate = false;
        const updatedItems = [];

        for (const item of customifyItems) {
          const props = item.properties || [];
          const imageUrlProp = props.find(p => p.name === '_AI_Image_URL');
          const shopifyImageProp = props.find(p => p.name === '_AI_Image_Shopify');
          const orderIdProp = props.find(p => p.name === '_Order_ID');

          if (!imageUrlProp || !imageUrlProp.value) {
            continue;
          }

          const imageUrl = imageUrlProp.value;
          const orderUniqueId = orderIdProp?.value || `order-${order.id}-${item.id}`;

          // Sprawdź czy to Shopify CDN URL
          if (!imageUrl.includes('cdn.shopify.com')) {
            // Już nie jest Shopify CDN - prawdopodobnie już zaktualizowane
            continue;
          }

          // Sprawdź czy obraz działa
          try {
            const imageCheck = await fetch(imageUrl, { method: 'HEAD' });
            if (imageCheck.ok) {
              // Obraz działa - nie trzeba migrować
              continue;
            }
          } catch (e) {
            // Obraz nie działa - trzeba zmigrować
            console.log(`⚠️ [MIGRATE] Order ${order.id}: Image not accessible: ${imageUrl}`);
          }

          // Pobierz obraz z backupu (Shopify Image lub z produktu)
          let imageBuffer = null;
          let newImageUrl = null;

          // Metoda 1: Sprawdź _AI_Image_Shopify (backup)
          if (shopifyImageProp?.value) {
            try {
              const backupResponse = await fetch(shopifyImageProp.value);
              if (backupResponse.ok) {
                imageBuffer = Buffer.from(await backupResponse.arrayBuffer());
                console.log(`✅ [MIGRATE] Order ${order.id}: Found backup image`);
              }
            } catch (e) {
              console.warn(`⚠️ [MIGRATE] Order ${order.id}: Backup image failed: ${e.message}`);
            }
          }

          // Metoda 2: Pobierz z produktu
          if (!imageBuffer && item.product_id) {
            try {
              const productResponse = await fetch(`https://${shop}/admin/api/2023-10/products/${item.product_id}.json`, {
                headers: {
                  'X-Shopify-Access-Token': accessToken,
                  'Content-Type': 'application/json'
                }
              });

              if (productResponse.ok) {
                const productData = await productResponse.json();
                const productImages = productData.product.images || [];
                
                if (productImages.length > 0) {
                  const productImageUrl = productImages[0].src;
                  const imgResponse = await fetch(productImageUrl);
                  if (imgResponse.ok) {
                    imageBuffer = Buffer.from(await imgResponse.arrayBuffer());
                    console.log(`✅ [MIGRATE] Order ${order.id}: Found image from product`);
                  }
                }
              }
            } catch (e) {
              console.warn(`⚠️ [MIGRATE] Order ${order.id}: Product image failed: ${e.message}`);
            }
          }

          if (!imageBuffer) {
            console.error(`❌ [MIGRATE] Order ${order.id}: Could not retrieve image from any source`);
            results.failed++;
            results.details.push({
              orderId: order.id,
              itemId: item.id,
              status: 'failed',
              reason: 'Image not found in any backup source'
            });
            continue;
          }

          // Upload na Vercel Blob
          if (!dryRun && process.env.customify_READ_WRITE_TOKEN) {
            try {
              const blobFilename = `customify/orders/${orderUniqueId}.jpg`;
              const blob = await put(blobFilename, imageBuffer, {
                access: 'public',
                contentType: 'image/jpeg',
                token: process.env.customify_READ_WRITE_TOKEN,
              });
              newImageUrl = blob.url;
              console.log(`✅ [MIGRATE] Order ${order.id}: Uploaded to Vercel Blob: ${newImageUrl}`);

              // Zaktualizuj properties (tylko w pamięci - później zaktualizujemy zamówienie)
              const updatedProps = item.properties.map(p => {
                if (p.name === '_AI_Image_URL') {
                  return { ...p, value: newImageUrl };
                }
                return p;
              });

              // Dodaj backup property jeśli nie ma
              if (!updatedProps.find(p => p.name === '_AI_Image_Shopify')) {
                updatedProps.push({
                  name: '_AI_Image_Shopify',
                  value: imageUrl // Stary Shopify URL jako backup
                });
              }

              updatedItems.push({
                id: item.id,
                properties: updatedProps
              });

              orderNeedsUpdate = true;
            } catch (e) {
              console.error(`❌ [MIGRATE] Order ${order.id}: Vercel Blob upload failed: ${e.message}`);
              results.failed++;
            }
          } else {
            // Dry run - tylko symulacja
            newImageUrl = `https://[migrated].public.blob.vercel-storage.com/customify/orders/${orderUniqueId}.jpg`;
            orderNeedsUpdate = true;
            results.details.push({
              orderId: order.id,
              itemId: item.id,
              status: 'would_migrate',
              oldUrl: imageUrl,
              newUrl: newImageUrl
            });
          }
        }

        // Zaktualizuj zamówienie (tylko jeśli nie dry run)
        if (orderNeedsUpdate && !dryRun) {
          // ⚠️ UWAGA: Shopify nie pozwala na aktualizację properties zamówień po utworzeniu
          // Możemy tylko zaktualizować metafields lub dodać notatki
          // Properties są tylko do odczytu dla zamówień

          // Dodaj metafield z nowym URL (jako backup info)
          const metafieldResponse = await fetch(`https://${shop}/admin/api/2023-10/orders/${order.id}/metafields.json`, {
            method: 'POST',
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              metafield: {
                namespace: 'customify',
                key: 'migrated_image_url',
                value: newImageUrl,
                type: 'single_line_text_field'
              }
            })
          });

          if (metafieldResponse.ok) {
            console.log(`✅ [MIGRATE] Order ${order.id}: Added metafield with migrated URL`);
            results.migrated++;
            results.details.push({
              orderId: order.id,
              status: 'migrated',
              metafield: 'migrated_image_url',
              newUrl: newImageUrl
            });
          } else {
            console.error(`❌ [MIGRATE] Order ${order.id}: Failed to add metafield`);
            results.failed++;
          }
        } else if (orderNeedsUpdate && dryRun) {
          results.migrated++;
        }

      } catch (error) {
        console.error(`❌ [MIGRATE] Order ${order?.id || 'unknown'}: Error:`, error);
        results.failed++;
        results.details.push({
          orderId: order?.id || 'unknown',
          status: 'error',
          error: error.message
        });
      }
    }

    console.log('✅ [MIGRATE] Migration completed:', results);

    res.json({
      success: true,
      dryRun,
      results
    });

  } catch (error) {
    console.error('❌ [MIGRATE] Migration error:', error);
    res.status(500).json({
      error: 'Migration failed',
      details: error.message
    });
  }
};

