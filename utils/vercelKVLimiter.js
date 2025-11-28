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
 * Sprawdza Device Token limit (TOTAL - 3 generacje dla wszystkich stylów)
 * @param {string} deviceToken - Device token
 * @returns {Promise<{allowed: boolean, count: number, limit: number}>}
 */
async function checkDeviceTokenLimit(deviceToken) {
  if (!deviceToken) {
    console.warn('⚠️ [KV-LIMITER] No device token provided');
    return { allowed: false, count: 0, limit: 3, reason: 'No device token' };
  }

  try {
    const key = `device:${deviceToken}:generations`;
    const count = await kv.get(key) || 0;
    const limit = 3; // 3 generacje TOTAL dla niezalogowanych
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
    return { allowed: false, count: 0, limit: 3, reason: 'KV error', error: error.message };
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
    return { allowed: false, count: 0, limit: 2, reason: 'KV error', error: error.message };
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

// ============================================================================
// DEVICE-TOKEN-CROSS-ACCOUNT-FEATURE: START
// Wykrywa abuse: ten sam device token używany przez wiele kont
// Limit: 1 device token = max 2 różne customerIds (rodziny/współlokatorzy)
// ============================================================================

/**
 * Sprawdza Device Token Cross-Account (max 2 różne customerIds per device token)
 * @param {string} deviceToken - Device token
 * @param {string} customerId - Shopify Customer ID (np. "25930613817669")
 * @returns {Promise<{allowed: boolean, customerIds: string[], limit: number, reason?: string}>}
 */
async function checkDeviceTokenCrossAccount(deviceToken, customerId) {
  if (!deviceToken || !customerId) {
    console.warn('⚠️ [KV-LIMITER-CROSS] Missing deviceToken or customerId');
    return { allowed: true, customerIds: [], limit: 2, reason: 'Missing data' };
  }

  try {
    const key = `device:${deviceToken}:customers`;
    const customerIdsJson = await kv.get(key);
    
    // Parsuj JSON i upewnij się, że to jest tablica
    let customerIds = [];
    if (customerIdsJson) {
      try {
        const parsed = JSON.parse(customerIdsJson);
        // Walidacja: upewnij się, że to jest tablica
        customerIds = Array.isArray(parsed) ? parsed : [];
        if (!Array.isArray(parsed)) {
          console.warn(`⚠️ [KV-LIMITER-CROSS] Invalid data format in KV - expected array, got:`, typeof parsed);
        }
      } catch (parseError) {
        console.error(`❌ [KV-LIMITER-CROSS] Failed to parse customerIds JSON:`, parseError.message);
        customerIds = [];
      }
    }
    
    const limit = 2; // Max 2 różne customerIds per device token

    console.log(`🔍 [KV-LIMITER-CROSS] Device token cross-account check:`, {
      deviceToken: deviceToken.substring(0, 8) + '...',
      customerId: customerId.substring(0, 10) + '...',
      existingCustomers: customerIds.length,
      customerIds: customerIds.map(id => id.substring(0, 10) + '...'),
      limit
    });

    // Jeśli customerId już jest na liście - OK
    if (customerIds.includes(customerId)) {
      console.log(`✅ [KV-LIMITER-CROSS] CustomerId już na liście - allowed`);
      return { allowed: true, customerIds, limit };
    }

    // Jeśli lista ma < limit różnych customerIds - można dodać nowy
    if (customerIds.length < limit) {
      console.log(`✅ [KV-LIMITER-CROSS] Lista ma ${customerIds.length}/${limit} - można dodać`);
      return { allowed: true, customerIds, limit };
    }

    // Lista pełna (2+ różnych customerIds) i obecny nie jest na liście = BLOKADA
    console.warn(`❌ [KV-LIMITER-CROSS] BLOKADA - device token ma już ${customerIds.length} różnych kont`);
    return { 
      allowed: false, 
      customerIds, 
      limit,
      reason: `Device token already used by ${customerIds.length} different accounts`
    };
  } catch (error) {
    console.error('❌ [KV-LIMITER-CROSS] Error checking cross-account:', error);
    // ⚠️ W razie błędu KV - pozwól (aby nie blokować użytkowników)
    return { allowed: true, customerIds: [], limit: 2, reason: 'KV error', error: error.message };
  }
}

/**
 * Dodaje customerId do device token (atomic operation)
 * @param {string} deviceToken - Device token
 * @param {string} customerId - Shopify Customer ID
 * @returns {Promise<{success: boolean, customerIds: string[]}>}
 */
async function addCustomerToDeviceToken(deviceToken, customerId) {
  if (!deviceToken || !customerId) {
    console.warn('⚠️ [KV-LIMITER-CROSS] Invalid deviceToken or customerId for add');
    return { success: false, customerIds: [] };
  }

  try {
    const key = `device:${deviceToken}:customers`;
    const customerIdsJson = await kv.get(key);
    
    // Parsuj JSON i upewnij się, że to jest tablica
    let customerIds = [];
    if (customerIdsJson) {
      try {
        const parsed = JSON.parse(customerIdsJson);
        // Walidacja: upewnij się, że to jest tablica
        customerIds = Array.isArray(parsed) ? parsed : [];
        if (!Array.isArray(parsed)) {
          console.warn(`⚠️ [KV-LIMITER-CROSS] Invalid data format in KV for add - expected array, got:`, typeof parsed);
        }
      } catch (parseError) {
        console.error(`❌ [KV-LIMITER-CROSS] Failed to parse customerIds JSON for add:`, parseError.message);
        customerIds = [];
      }
    }

    // Jeśli customerId już jest na liście - nie dodawaj ponownie
    if (customerIds.includes(customerId)) {
      console.log(`ℹ️ [KV-LIMITER-CROSS] CustomerId już jest na liście - pomijam`);
      return { success: true, customerIds };
    }

    // Dodaj customerId do listy
    customerIds.push(customerId);
    await kv.set(key, JSON.stringify(customerIds));
    // Brak TTL - permanentne przechowywanie

    console.log(`➕ [KV-LIMITER-CROSS] CustomerId dodany do device token:`, {
      deviceToken: deviceToken.substring(0, 8) + '...',
      customerId: customerId.substring(0, 10) + '...',
      totalCustomers: customerIds.length,
      customerIds: customerIds.map(id => id.substring(0, 10) + '...')
    });

    return { success: true, customerIds };
  } catch (error) {
    console.error('❌ [KV-LIMITER-CROSS] Error adding customer to device token:', error);
    return { success: false, customerIds: [], error: error.message };
  }
}

// DEVICE-TOKEN-CROSS-ACCOUNT-FEATURE: END
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
  incrementImageHashLimit,
  // DEVICE-TOKEN-CROSS-ACCOUNT-FEATURE exports:
  checkDeviceTokenCrossAccount,
  addCustomerToDeviceToken
};

