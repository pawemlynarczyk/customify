// utils/vercelKVLimiter.js
/**
 * Vercel KV-based rate limiter z atomic operations
 * Używa Upstash Redis przez @vercel/kv
 */

const { kv } = require('@vercel/kv');
const crypto = require('crypto');

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

// ============================================================================
// IMAGE-HASH-FEATURE: START
// Feature flag: ENABLE_IMAGE_HASH_LIMIT (true/false)
// Aby wyłączyć: ustaw ENABLE_IMAGE_HASH_LIMIT=false w Vercel env
// ============================================================================

/**
 * Sprawdza czy Image Hash limit jest włączony
 * @returns {boolean}
 */
function isImageHashLimitEnabled() {
  // ⚠️ ZMIANA: Domyślnie WŁĄCZONE (nie wymaga env variable)
  // Aby wyłączyć: ustaw ENABLE_IMAGE_HASH_LIMIT=false w Vercel
  // Rollback: zmień 'true' na 'false' poniżej
  return process.env.ENABLE_IMAGE_HASH_LIMIT !== 'false'; // !== 'false' = domyślnie true
}

/**
 * Oblicza SHA-256 hash z obrazka
 * @param {Buffer|string} imageData - Buffer lub base64 string (bez lub z prefiksu data URI)
 * @returns {string} - SHA-256 hash (hex)
 */
function calculateImageHash(imageData) {
  let buffer;
  
  if (Buffer.isBuffer(imageData)) {
    buffer = imageData;
  } else if (typeof imageData === 'string') {
    // Jeśli to base64 string (może mieć lub nie mieć prefiks data URI)
    const base64Data = imageData.includes('base64,') 
      ? imageData.split('base64,')[1] 
      : imageData;
    buffer = Buffer.from(base64Data, 'base64');
  } else {
    throw new Error('Invalid image data format');
  }
  
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Sprawdza Image Hash limit (2 generacje per obrazek)
 * @param {string} imageHash - SHA-256 hash obrazka
 * @returns {Promise<{allowed: boolean, count: number, limit: number}>}
 */
async function checkImageHashLimit(imageHash) {
  if (!imageHash) {
    console.warn('⚠️ [KV-LIMITER] No image hash provided');
    return { allowed: false, count: 0, limit: 2, reason: 'No image hash' };
  }

  try {
    const key = `image:${imageHash}:generations`;
    const count = await kv.get(key) || 0;
    const limit = 2; // 2 generacje per obrazek (permanentne)
    const allowed = count < limit;

    console.log(`🔍 [KV-LIMITER] Image hash limit check:`, {
      imageHash: imageHash.substring(0, 16) + '...',
      count,
      limit,
      allowed
    });

    return { allowed, count, limit };
  } catch (error) {
    console.error('❌ [KV-LIMITER] Error checking image hash limit:', error);
    // ⚠️ KRYTYCZNE: Jeśli błąd KV, BLOKUJ dla bezpieczeństwa
    return { allowed: false, count: 0, limit: 4, reason: 'KV error', error: error.message };
  }
}

/**
 * Inkrementuje Image Hash limit (atomic operation, permanent)
 * @param {string} imageHash - SHA-256 hash obrazka
 * @returns {Promise<{success: boolean, newCount: number}>}
 */
async function incrementImageHashLimit(imageHash) {
  if (!imageHash) {
    console.warn('⚠️ [KV-LIMITER] Invalid image hash for increment');
    return { success: false, newCount: 0 };
  }

  try {
    const key = `image:${imageHash}:generations`;
    // Atomic increment (permanent - no TTL)
    const newCount = await kv.incr(key);

    console.log(`➕ [KV-LIMITER] Image hash limit incremented:`, {
      imageHash: imageHash.substring(0, 16) + '...',
      newCount
    });

    return { success: true, newCount };
  } catch (error) {
    console.error('❌ [KV-LIMITER] Error incrementing image hash limit:', error);
    return { success: false, newCount: 0, error: error.message };
  }
}

// IMAGE-HASH-FEATURE: END
// ============================================================================

module.exports = {
  checkIPLimit,
  incrementIPLimit,
  checkDeviceTokenLimit,
  incrementDeviceTokenLimit,
  isKVConfigured,
  // IMAGE-HASH-FEATURE exports:
  isImageHashLimitEnabled,
  calculateImageHash,
  checkImageHashLimit,
  incrementImageHashLimit
};

