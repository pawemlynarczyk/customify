/**
 * Frontend Error Logging Endpoint
 * Allows frontend to log errors to backend analytics
 */

const { logError } = require('../utils/analytics-logger');
const { getClientIP } = require('../utils/vercelRateLimiter');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { 
      error, 
      action, 
      userAgent,
      url,
      additionalData 
    } = req.body;
    
    if (!error || !action) {
      return res.status(400).json({ error: 'Missing required fields: error, action' });
    }
    
    const ip = getClientIP(req);
    
    // Log frontend error
    logError('/frontend/' + action, new Error(error), {
      statusCode: 'frontend',
      ip,
      userAgent: userAgent || req.headers['user-agent'],
      url: url || 'unknown',
      ...additionalData
    });
    
    console.log('[FRONTEND ERROR]', action, error);
    
    res.json({ success: true, message: 'Error logged' });
    
  } catch (error) {
    console.error('Error logging frontend error:', error);
    res.status(500).json({ error: 'Failed to log error' });
  }
};

