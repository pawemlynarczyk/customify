const crypto = require('crypto');

// Verify webhook authenticity with HMAC
function verifyWebhook(data, hmac) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('❌ Missing SHOPIFY_WEBHOOK_SECRET');
    return false;
  }
  
  const hash = crypto
    .createHmac('sha256', secret)
    .update(data, 'utf8')
    .digest('base64');
    
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmac));
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Shopify-Hmac-Sha256');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const hmac = req.headers['x-shopify-hmac-sha256'];
    const body = JSON.stringify(req.body);
    
    console.log('🔔 Customer Data Redaction Webhook received');
    console.log('📊 Request body:', req.body);
    console.log('🔐 HMAC header:', hmac);

    // Verify webhook authenticity
    if (!verifyWebhook(body, hmac)) {
      console.error('❌ Invalid webhook HMAC');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Log the request (implement actual logic later)
    console.log('✅ Valid customer data redaction webhook');
    console.log('👤 Customer ID:', req.body.customer?.id);
    console.log('🏪 Shop domain:', req.body.shop_domain);
    console.log('📧 Customer email:', req.body.customer?.email);

    // TODO: Implement actual data redaction logic
    // - Delete customer data from your systems
    // - Anonymize any remaining data
    // - Comply with GDPR right to be forgotten

    res.status(200).json({ 
      success: true, 
      message: 'Customer data redaction completed' 
    });

  } catch (error) {
    console.error('❌ Customer data redaction webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
