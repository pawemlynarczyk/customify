module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Shopify-Hmac-Sha256');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const order = req.body;
    console.log('📦 [ORDERS WEBHOOK] Order created:', order.id);
    
    // Znajdź line items z AI obrazkami
    for (const item of order.line_items) {
      if (item.properties) {
        const aiImageUrl = item.properties.find(p => p.name === '_AI_Image_URL')?.value;
        
        if (aiImageUrl) {
          console.log('🖼️ [ORDERS WEBHOOK] Found AI image for item:', item.name, aiImageUrl);
          
          // Dodaj note do zamówienia z linkiem do obrazka
          const noteAttributes = order.note_attributes || [];
          noteAttributes.push({
            name: `AI Image for ${item.name}`,
            value: aiImageUrl
          });
          
          // Update order z notatką zawierającą obrazek
          const updateResponse = await fetch(`https://${process.env.SHOP_DOMAIN}/admin/api/2023-10/orders/${order.id}.json`, {
            method: 'PUT',
            headers: {
              'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              order: {
                id: order.id,
                note_attributes: noteAttributes
              }
            })
          });
          
          if (updateResponse.ok) {
            console.log('✅ [ORDERS WEBHOOK] Updated order with AI image note');
          } else {
            console.error('❌ [ORDERS WEBHOOK] Failed to update order:', updateResponse.status);
          }
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ [ORDERS WEBHOOK] Order webhook error:', error);
    res.status(500).json({ error: error.message });
  }
};
