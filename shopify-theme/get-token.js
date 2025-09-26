const fs = require('fs');
const path = require('path');

async function getAccessToken() {
  try {
    const shop = 'customify-ok.myshopify.com';
    const apiKey = 'b55e6ae3386a566f74df4db5d1d11ee6';
    const apiSecret = '40e832d641a2ac8c6a2acf1945a34436';
    
    console.log('🔑 Getting access token...');
    console.log('📋 You need to:');
    console.log('1. Go to your Shopify Admin');
    console.log('2. Go to Apps → App and sales channel settings');
    console.log('3. Find Customify app');
    console.log('4. Copy the access token');
    console.log('5. Set it in vercel-env.json');
    
    console.log('\n🔗 Or use this URL to get token:');
    console.log(`https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=read_themes,write_themes,read_products,write_products&redirect_uri=https://customify-s56o.vercel.app/auth/callback`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

getAccessToken();
