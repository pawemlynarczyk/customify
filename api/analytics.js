/**
 * Analytics API Endpoint
 * Returns statistics and logs for admin dashboard
 */

const { getAllLogs, getFilteredLogs, getStatistics, clearOldLogs } = require('../utils/analytics-logger');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Simple authentication (check for admin password in header)
    const authHeader = req.headers.authorization;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'; // Set in Vercel env vars
    
    if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid or missing admin password' 
      });
    }
    
    const { action, ...filters } = req.query;
    
    switch (action) {
      case 'stats':
        // Get statistics
        const days = parseInt(filters.days) || 7;
        const stats = getStatistics(days);
        return res.status(200).json({ success: true, stats });
      
      case 'logs':
        // Get filtered logs
        const logs = filters.endpoint || filters.type || filters.startDate || filters.endDate 
          ? getFilteredLogs(filters)
          : getAllLogs();
        
        // Pagination
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 100;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        
        const paginatedLogs = logs.slice(startIndex, endIndex);
        
        return res.status(200).json({
          success: true,
          logs: paginatedLogs,
          pagination: {
            page,
            limit,
            total: logs.length,
            totalPages: Math.ceil(logs.length / limit)
          }
        });
      
      case 'clear':
        // Clear old logs
        const clearDays = parseInt(filters.days) || 30;
        const result = clearOldLogs(clearDays);
        return res.status(200).json({ 
          success: true, 
          message: `Cleared ${result.removed} old logs`,
          ...result
        });
      
      default:
        // Return both stats and recent logs
        const defaultStats = getStatistics(7);
        const recentLogs = getAllLogs().slice(-50).reverse(); // Last 50 logs
        
        return res.status(200).json({
          success: true,
          stats: defaultStats,
          recentLogs
        });
    }
    
  } catch (error) {
    console.error('[ANALYTICS.JS] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

