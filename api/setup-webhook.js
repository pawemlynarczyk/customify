module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(500).json({ error: 'Shopify access token not configured' });
    }

    console.log('🔗 [SETUP-WEBHOOK] Setting up order paid webhook...');

    // Sprawdź czy webhook już istnieje
    const existingWebhooks = await fetch(`https://${shop}/admin/api/2023-10/webhooks.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    const webhooks = await existingWebhooks.json();
    const existingWebhook = webhooks.webhooks?.find(w => 
      w.topic === 'orders/paid' && 
      w.address.includes('orders/paid')
    );

    if (existingWebhook) {
      console.log('✅ [SETUP-WEBHOOK] Webhook already exists:', existingWebhook.id);
      return res.json({
        success: true,
        message: 'Webhook already exists',
        webhook: existingWebhook
      });
    }

    // Utwórz nowy webhook
    const webhookData = {
      webhook: {
        topic: 'orders/paid',
        address: `https://customify-s56o.vercel.app/api/webhooks/orders/paid`,
        format: 'json'
      }
    };

    const createResponse = await fetch(`https://${shop}/admin/api/2023-10/webhooks.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookData)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ [SETUP-WEBHOOK] Webhook creation error:', errorText);
      return res.status(500).json({ 
        error: 'Failed to create webhook',
        details: errorText
      });
    }

    const newWebhook = await createResponse.json();

    console.log('✅ [SETUP-WEBHOOK] Webhook created successfully:', newWebhook.webhook.id);

    res.json({ 
      success: true, 
      message: 'Order paid webhook created successfully',
      webhook: newWebhook.webhook
    });

  } catch (error) {
    console.error('❌ [SETUP-WEBHOOK] Error:', error);
    res.status(500).json({ 
      error: 'Webhook setup failed',
      details: error.message 
    });
  }
};
