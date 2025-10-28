/**
 * Analytics & Error Logger with Vercel KV (Redis)
 * Persistent logging system for tracking errors, usage, and statistics
 */

const { kv } = require('@vercel/kv');

const LOG_TYPES = {
  ERROR: 'error',
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning'
};

const KV_LOGS_KEY = 'customify:analytics:logs';
const MAX_LOGS = 1000;

/**
 * Read logs from Vercel KV
 */
async function readLogs() {
  try {
    const logs = await kv.get(KV_LOGS_KEY);
    return logs || [];
  } catch (error) {
    console.error('[ANALYTICS-KV] Error reading logs:', error);
    return [];
  }
}

/**
 * Write logs to Vercel KV
 */
async function writeLogs(logs) {
  try {
    const trimmedLogs = logs.slice(-MAX_LOGS);
    await kv.set(KV_LOGS_KEY, trimmedLogs);
    return true;
  } catch (error) {
    console.error('[ANALYTICS-KV] Error writing logs:', error);
    return false;
  }
}

/**
 * Log an event
 */
async function logEvent(type, endpoint, data = {}) {
  const logs = await readLogs();
  
  const logEntry = {
    id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    type: type,
    endpoint: endpoint,
    ...data
  };
  
  logs.push(logEntry);
  await writeLogs(logs);
  
  const prefix = `[ANALYTICS-KV] [${type.toUpperCase()}] [${endpoint}]`;
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
async function logError(endpoint, error, additionalData = {}) {
  return await logEvent(LOG_TYPES.ERROR, endpoint, {
    error: error.message || error,
    stack: error.stack,
    statusCode: additionalData.statusCode || 500,
    ...additionalData
  });
}

/**
 * Log success
 */
async function logSuccess(endpoint, additionalData = {}) {
  return await logEvent(LOG_TYPES.SUCCESS, endpoint, {
    statusCode: additionalData.statusCode || 200,
    ...additionalData
  });
}

/**
 * Log info
 */
async function logInfo(endpoint, message, additionalData = {}) {
  return await logEvent(LOG_TYPES.INFO, endpoint, {
    message: message,
    ...additionalData
  });
}

/**
 * Log warning
 */
async function logWarning(endpoint, message, additionalData = {}) {
  return await logEvent(LOG_TYPES.WARNING, endpoint, {
    message: message,
    ...additionalData
  });
}

/**
 * Get all logs
 */
async function getAllLogs() {
  return await readLogs();
}

/**
 * Get filtered logs
 */
async function getFilteredLogs(filters = {}) {
  let logs = await readLogs();
  
  if (filters.type) {
    logs = logs.filter(log => log.type === filters.type);
  }
  
  if (filters.endpoint) {
    logs = logs.filter(log => log.endpoint === filters.endpoint);
  }
  
  if (filters.startDate) {
    const startDate = new Date(filters.startDate);
    logs = logs.filter(log => new Date(log.timestamp) >= startDate);
  }
  
  if (filters.endDate) {
    const endDate = new Date(filters.endDate);
    logs = logs.filter(log => new Date(log.timestamp) <= endDate);
  }
  
  if (filters.statusCode) {
    logs = logs.filter(log => log.statusCode === filters.statusCode);
  }
  
  return logs;
}

/**
 * Get statistics
 */
async function getStatistics(days = 7) {
  const logs = await readLogs();
  const now = new Date();
  const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  
  const recentLogs = logs.filter(log => new Date(log.timestamp) >= startDate);
  
  const stats = {
    total: recentLogs.length,
    errors: recentLogs.filter(log => log.type === LOG_TYPES.ERROR).length,
    successes: recentLogs.filter(log => log.type === LOG_TYPES.SUCCESS).length,
    warnings: recentLogs.filter(log => log.type === LOG_TYPES.WARNING).length,
    info: recentLogs.filter(log => log.type === LOG_TYPES.INFO).length,
    byEndpoint: {},
    byStatusCode: {},
    byHour: {},
    errorRate: 0,
    topErrors: {}
  };
  
  recentLogs.forEach(log => {
    const endpoint = log.endpoint || 'unknown';
    stats.byEndpoint[endpoint] = (stats.byEndpoint[endpoint] || 0) + 1;
    
    if (log.statusCode) {
      stats.byStatusCode[log.statusCode] = (stats.byStatusCode[log.statusCode] || 0) + 1;
    }
    
    const hour = new Date(log.timestamp).getHours();
    stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
    
    if (log.type === LOG_TYPES.ERROR && log.error) {
      stats.topErrors[log.error] = (stats.topErrors[log.error] || 0) + 1;
    }
  });
  
  if (stats.total > 0) {
    stats.errorRate = ((stats.errors / stats.total) * 100).toFixed(2);
  }
  
  stats.topErrors = Object.entries(stats.topErrors)
    .map(([error, count]) => ({ error, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return stats;
}

/**
 * Clear old logs
 */
async function clearOldLogs(days = 30) {
  const logs = await readLogs();
  const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
  
  const recentLogs = logs.filter(log => new Date(log.timestamp) >= cutoffDate);
  await writeLogs(recentLogs);
  
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

