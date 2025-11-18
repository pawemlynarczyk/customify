// utils/vercelKVLimiter.js
/**
 * Vercel KV-based rate limiter z atomic operations
 * Używa Upstash Redis przez @vercel/kv
 */

const { kv } = require('@vercel/kv');

/**
 * Sprawdza IP limit (globalny - 10 generacji / 24h)
 * @param {string} ip - IP address
 * @returns {Promise<{allowed: boolean, count: number, limit: number}>}
 */
async function checkIPLimit(ip) {
  if (!ip || ip === 'unknown') {
    console.warn('⚠️ [KV-LIMITER] Invalid IP:', ip);
    return { allowed: false, count: 0, limit: 10, reason: 'Invalid IP' };
  }

  try {
    const key = `ip:${ip}:generations`;
    const count = await kv.get(key) || 0;
    const limit = 10;
    const allowed = count < limit;

    console.log(`🔍 [KV-LIMITER] IP limit check:`, {
      ip: ip.substring(0, 10) + '...',
      count,
      limit,
      allowed
    });

    return { allowed, count, limit };
  } catch (error) {
    console.error('❌ [KV-LIMITER] Error checking IP limit:', error);
    // ⚠️ KRYTYCZNE: Jeśli błąd KV, BLOKUJ dla bezpieczeństwa
    return { allowed: false, count: 0, limit: 10, reason: 'KV error', error: error.message };
  }
}

/**
 * Inkrementuje IP limit (atomic operation)
 * @param {string} ip - IP address
 * @returns {Promise<{success: boolean, newCount: number}>}
 */
async function incrementIPLimit(ip) {
  if (!ip || ip === 'unknown') {
    console.warn('⚠️ [KV-LIMITER] Invalid IP for increment:', ip);
    return { success: false, newCount: 0 };
  }

  try {
    const key = `ip:${ip}:generations`;
    // Atomic increment + set TTL 24h jeśli klucz nie istnieje
    const newCount = await kv.incr(key);
    
    // Ustaw TTL 24h (tylko jeśli klucz był nowy)
    const ttl = await kv.ttl(key);
    if (ttl === -1) {
      // Klucz nie miał TTL - ustaw 24h
      await kv.expire(key, 24 * 60 * 60);
    }

    console.log(`➕ [KV-LIMITER] IP limit incremented:`, {
      ip: ip.substring(0, 10) + '...',
      newCount,
      ttl: await kv.ttl(key)
    });

    return { success: true, newCount };
  } catch (error) {
    console.error('❌ [KV-LIMITER] Error incrementing IP limit:', error);
    return { success: false, newCount: 0, error: error.message };
  }
}

/**
 * Sprawdza Device Token limit (TOTAL - 2 generacje dla wszystkich stylów)
 * @param {string} deviceToken - Device token
 * @returns {Promise<{allowed: boolean, count: number, limit: number}>}
 */
async function checkDeviceTokenLimit(deviceToken) {
  if (!deviceToken) {
    console.warn('⚠️ [KV-LIMITER] No device token provided');
    return { allowed: false, count: 0, limit: 2, reason: 'No device token' };
  }

  try {
    const key = `device:${deviceToken}:generations`;
    const count = await kv.get(key) || 0;
    const limit = 2; // 2 generacje TOTAL dla niezalogowanych
    const allowed = count < limit;

    console.log(`🔍 [KV-LIMITER] Device token limit check:`, {
      deviceToken: deviceToken.substring(0, 8) + '...',
      count,
      limit,
      allowed
    });

    return { allowed, count, limit };
  } catch (error) {
    console.error('❌ [KV-LIMITER] Error checking device token limit:', error);
    // ⚠️ KRYTYCZNE: Jeśli błąd KV, BLOKUJ dla bezpieczeństwa
    return { allowed: false, count: 0, limit: 2, reason: 'KV error', error: error.message };
  }
}

/**
 * Inkrementuje Device Token limit (atomic operation, TOTAL)
 * @param {string} deviceToken - Device token
 * @returns {Promise<{success: boolean, newCount: number}>}
 */
async function incrementDeviceTokenLimit(deviceToken) {
  if (!deviceToken) {
    console.warn('⚠️ [KV-LIMITER] Invalid device token for increment');
    return { success: false, newCount: 0 };
  }

  try {
    const key = `device:${deviceToken}:generations`;
    // Atomic increment (permanent - no TTL)
    const newCount = await kv.incr(key);

    console.log(`➕ [KV-LIMITER] Device token limit incremented:`, {
      deviceToken: deviceToken.substring(0, 8) + '...',
      newCount
    });

    return { success: true, newCount };
  } catch (error) {
    console.error('❌ [KV-LIMITER] Error incrementing device token limit:', error);
    return { success: false, newCount: 0, error: error.message };
  }
}

/**
 * Sprawdza czy KV jest skonfigurowany
 * @returns {boolean}
 */
function isKVConfigured() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

module.exports = {
  checkIPLimit,
  incrementIPLimit,
  checkDeviceTokenLimit,
  incrementDeviceTokenLimit,
  isKVConfigured
};

