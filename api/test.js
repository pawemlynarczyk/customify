module.exports = (req, res) => {
  console.log('🧪 Test function called - START');
  console.log('🧪 Request method:', req.method);
  console.log('🧪 Request URL:', req.url);
  console.log('🧪 Environment check:', {
    hasApiKey: !!process.env.SHOPIFY_API_KEY,
    hasAccessToken: !!process.env.SHOPIFY_ACCESS_TOKEN,
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('SHOPIFY'))
  });
  
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <h1>Test Function</h1>
    <p>This is a test function to check if Vercel functions work.</p>
    <p>Environment variables:</p>
    <ul>
      <li>SHOPIFY_API_KEY: ${process.env.SHOPIFY_API_KEY ? '✅ Set' : '❌ Missing'}</li>
      <li>SHOPIFY_ACCESS_TOKEN: ${process.env.SHOPIFY_ACCESS_TOKEN ? '✅ Set' : '❌ Missing'}</li>
      <li>SHOP_DOMAIN: ${process.env.SHOP_DOMAIN || 'Not set'}</li>
      <li>APP_URL: ${process.env.APP_URL || 'Not set'}</li>
    </ul>
    <p>All SHOPIFY env vars: ${Object.keys(process.env).filter(key => key.includes('SHOPIFY')).join(', ')}</p>
  `);
};
