/**
 * Analytics & Error Logger
 * Centralized logging system for tracking errors, usage, and statistics
 */

const fs = require('fs');
const path = require('path');

// Path to logs file (in /tmp for Vercel serverless)
const LOGS_FILE = '/tmp/customify-logs.json';
const MAX_LOGS = 1000; // Keep last 1000 entries

/**
 * Log types
 */
const LOG_TYPES = {
  ERROR: 'error',
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning'
};

/**
 * Read logs from file
 */
function readLogs() {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      const data = fs.readFileSync(LOGS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[ANALYTICS-LOGGER] Error reading logs:', error);
  }
  return [];
}

/**
 * Write logs to file
 */
function writeLogs(logs) {
  try {
    // Keep only last MAX_LOGS entries
    const trimmedLogs = logs.slice(-MAX_LOGS);
    fs.writeFileSync(LOGS_FILE, JSON.stringify(trimmedLogs, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('[ANALYTICS-LOGGER] Error writing logs:', error);
    return false;
  }
}

/**
 * Log an event
 * @param {string} type - Log type (error, success, info, warning)
 * @param {string} endpoint - API endpoint (e.g. '/api/transform')
 * @param {object} data - Additional data to log
 */
function logEvent(type, endpoint, data = {}) {
  const logs = readLogs();
  
  const logEntry = {
    id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    type: type,
    endpoint: endpoint,
    ...data
  };
  
  logs.push(logEntry);
  writeLogs(logs);
  
  // Also log to console for Vercel logs
  const prefix = `[ANALYTICS] [${type.toUpperCase()}] [${endpoint}]`;
  if (type === LOG_TYPES.ERROR) {
    console.error(prefix, data);
  } else {
    console.log(prefix, data);
  }
  
  return logEntry;
}

/**
 * Log error
 */
function logError(endpoint, error, additionalData = {}) {
  return logEvent(LOG_TYPES.ERROR, endpoint, {
    error: error.message || error,
    stack: error.stack,
    statusCode: additionalData.statusCode || 500,
    ...additionalData
  });
}

/**
 * Log success
 */
function logSuccess(endpoint, additionalData = {}) {
  return logEvent(LOG_TYPES.SUCCESS, endpoint, {
    statusCode: additionalData.statusCode || 200,
    ...additionalData
  });
}

/**
 * Log info
 */
function logInfo(endpoint, message, additionalData = {}) {
  return logEvent(LOG_TYPES.INFO, endpoint, {
    message: message,
    ...additionalData
  });
}

/**
 * Log warning
 */
function logWarning(endpoint, message, additionalData = {}) {
  return logEvent(LOG_TYPES.WARNING, endpoint, {
    message: message,
    ...additionalData
  });
}

/**
 * Get all logs
 */
function getAllLogs() {
  return readLogs();
}

/**
 * Get logs filtered by criteria
 */
function getFilteredLogs(filters = {}) {
  let logs = readLogs();
  
  // Filter by type
  if (filters.type) {
    logs = logs.filter(log => log.type === filters.type);
  }
  
  // Filter by endpoint
  if (filters.endpoint) {
    logs = logs.filter(log => log.endpoint === filters.endpoint);
  }
  
  // Filter by date range
  if (filters.startDate) {
    const startDate = new Date(filters.startDate);
    logs = logs.filter(log => new Date(log.timestamp) >= startDate);
  }
  
  if (filters.endDate) {
    const endDate = new Date(filters.endDate);
    logs = logs.filter(log => new Date(log.timestamp) <= endDate);
  }
  
  // Filter by status code
  if (filters.statusCode) {
    logs = logs.filter(log => log.statusCode === filters.statusCode);
  }
  
  return logs;
}

/**
 * Get statistics
 */
function getStatistics(days = 7) {
  const logs = readLogs();
  const now = new Date();
  const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  
  // Filter logs by date range
  const recentLogs = logs.filter(log => new Date(log.timestamp) >= startDate);
  
  // Calculate statistics
  const stats = {
    total: recentLogs.length,
    errors: recentLogs.filter(log => log.type === LOG_TYPES.ERROR).length,
    successes: recentLogs.filter(log => log.type === LOG_TYPES.SUCCESS).length,
    warnings: recentLogs.filter(log => log.type === LOG_TYPES.WARNING).length,
    info: recentLogs.filter(log => log.type === LOG_TYPES.INFO).length,
    
    // By endpoint
    byEndpoint: {},
    
    // By status code
    byStatusCode: {},
    
    // By hour (last 24h)
    byHour: {},
    
    // Error rate
    errorRate: 0,
    
    // Most common errors
    topErrors: {}
  };
  
  // Count by endpoint
  recentLogs.forEach(log => {
    const endpoint = log.endpoint || 'unknown';
    stats.byEndpoint[endpoint] = (stats.byEndpoint[endpoint] || 0) + 1;
    
    // Count by status code
    if (log.statusCode) {
      stats.byStatusCode[log.statusCode] = (stats.byStatusCode[log.statusCode] || 0) + 1;
    }
    
    // Count by hour (last 24h)
    const hour = new Date(log.timestamp).getHours();
    stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
    
    // Count errors
    if (log.type === LOG_TYPES.ERROR && log.error) {
      stats.topErrors[log.error] = (stats.topErrors[log.error] || 0) + 1;
    }
  });
  
  // Calculate error rate
  if (stats.total > 0) {
    stats.errorRate = ((stats.errors / stats.total) * 100).toFixed(2);
  }
  
  // Convert topErrors to array and sort
  stats.topErrors = Object.entries(stats.topErrors)
    .map(([error, count]) => ({ error, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return stats;
}

/**
 * Clear old logs (older than X days)
 */
function clearOldLogs(days = 30) {
  const logs = readLogs();
  const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
  
  const recentLogs = logs.filter(log => new Date(log.timestamp) >= cutoffDate);
  writeLogs(recentLogs);
  
  return {
    removed: logs.length - recentLogs.length,
    remaining: recentLogs.length
  };
}

module.exports = {
  LOG_TYPES,
  logEvent,
  logError,
  logSuccess,
  logInfo,
  logWarning,
  getAllLogs,
  getFilteredLogs,
  getStatistics,
  clearOldLogs
};

