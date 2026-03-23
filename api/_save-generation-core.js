// api/save-generation.js
/**
 * API endpoint do zapisywania generacji AI z powiązaniem do klienta
 * Zapisuje w Vercel Blob Storage: customerId/email → lista generacji (JSON)
 */

const { put, head, get } = require('@vercel/blob');
const { kv } = require('@vercel/kv');
const { checkRateLimit, getClientIP } = require('../utils/vercelRateLimiter');
const Sentry = require('../utils/sentry');

// ⏰ Helper: dowolna operacja z timeoutem (zapobiega 504 gdy Blob/Shopify API jest wolne)
async function withTimeout(promise, timeoutMs, operationName) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout: ${operationName} after ${timeoutMs}ms`)), timeoutMs)
  );
  return Promise.race([promise, timeoutPromise]);
}

const EMAIL_TRACKING_BASE = 'https://customify-s56o.vercel.app';
function emailTrackingUrl(type, customerId, target) {
  const cidPart = customerId ? `&cid=${encodeURIComponent(customerId)}` : '';
  return `${EMAIL_TRACKING_BASE}/api/email-click?type=${type}${cidPart}&url=${encodeURIComponent(target)}`;
}

const toSafeString = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  const valueType = typeof value;
  if (valueType === 'string') {
    return value;
  }
  if (valueType === 'number' || valueType === 'boolean' || valueType === 'bigint') {
    return String(value);
  }
  if (valueType === 'symbol') {
    try {
      return value.toString();
    } catch {
      return '';
    }
  }
  try {
    return JSON.stringify(value);
  } catch {
    try {
      return String(value);
    } catch {
      return '';
    }
  }
};

const sanitizeIdentifier = (rawValue) => {
  // ✅ DODATKOWA OCHRONA - upewnij się że rawValue jest konwertowane na string
  if (rawValue === null || rawValue === undefined) {
    return '';
  }
  
  // ✅ Konwertuj na string PRZED użyciem toSafeString (podwójna ochrona)
  const safe = toSafeString(rawValue);
  
  // ✅ WALIDACJA - upewnij się że safe jest stringiem
  if (!safe || typeof safe !== 'string') {
    console.warn('⚠️ [SANITIZE] toSafeString zwróciło nie-string:', safe, typeof safe);
    // Fallback - konwertuj bezpośrednio
    try {
      const fallback = String(rawValue);
      if (fallback && typeof fallback === 'string') {
        return sanitizeIdentifier(fallback); // Rekurencyjnie z stringiem
      }
    } catch (e) {
      console.error('❌ [SANITIZE] Błąd konwersji fallback:', e);
    }
    return '';
  }
  
  let result = '';
  let previousWasDash = false;
  for (const char of safe) {
    const isUpper = char >= 'A' && char <= 'Z';
    const isLower = char >= 'a' && char <= 'z';
    const isDigit = char >= '0' && char <= '9';
    if (isUpper || isLower || isDigit) {
      result += char;
      previousWasDash = false;
    } else if (!previousWasDash) {
      result += '-';
      previousWasDash = true;
    }
  }
  if (result.startsWith('-')) {
    result = result.slice(1);
  }
  if (result.endsWith('-')) {
    result = result.slice(0, -1);
  }
  return result;
};

const VERSION_TAG = 'save-generation-core@2025-11-13T13:10';

async function saveGenerationHandler(req, res) {
  console.log(`💾 [SAVE-GENERATION] API called - Method: ${req.method} - Version: ${VERSION_TAG}`);
  
  // CORS headers
  const allowedOrigins = [
    'https://lumly.pl',
    'https://customify-s56o.vercel.app',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🆕 [SAVE-GENERATION] Version tag: 2025-11-13T01-20');
    // IP-based rate limiting
    const ip = getClientIP(req);
    if (!checkRateLimit(ip, 50, 15 * 60 * 1000)) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests from this IP',
        retryAfter: 900
      });
    }

    const { customerId, email, ip: ipFromBody, ipHash: ipHashFromBody, deviceToken, imageUrl, watermarkedImageUrl, style, size, productType, originalImageUrl, productHandle } = req.body;
    
    // ✅ Użyj IP z body jeśli podane, w przeciwnym razie użyj IP z request
    const finalIp = ipFromBody || ip;

    // Walidacja wymaganych pól
    if (!imageUrl) {
      return res.status(400).json({ 
        error: 'Missing required field: imageUrl' 
      });
    }

    // ✅ ZAPISUJ DLA WSZYSTKICH - użyj IP jeśli brak customerId/email
    // (nie wymagamy customerId/email - IP jest zawsze dostępne)

    // Sprawdź czy Vercel Blob Storage jest skonfigurowany
    if (!process.env.customify_READ_WRITE_TOKEN) {
      console.error('❌ [SAVE-GENERATION] Vercel Blob Storage not configured');
      // Nie blokuj - zwróć sukces ale z warningiem
      return res.json({
        success: true,
        warning: 'Vercel Blob Storage not configured - generation not saved',
        message: 'Generation saved locally only',
        debug: {
          reason: 'missing_blob_token',
          customerId: customerId || null,
          email: email || null
        }
      });
    }

    // ✅ BARDZO WIDOCZNE LOGOWANIE - SPRAWDŹ WARTOŚCI PRZED KONWERSJĄ
    console.log(`🔍🔍🔍 [SAVE-GENERATION] ===== SPRAWDZAM IDENTIFIER PRZED KONWERSJĄ =====`);
    console.log(`🔍 [SAVE-GENERATION] customerId:`, customerId, typeof customerId);
    console.log(`🔍 [SAVE-GENERATION] email:`, email, typeof email);
    console.log(`🔍 [SAVE-GENERATION] ip (from body):`, ipFromBody, typeof ipFromBody);
    console.log(`🔍 [SAVE-GENERATION] ip (from request):`, ip, typeof ip);
    console.log(`🔍 [SAVE-GENERATION] finalIp:`, finalIp, typeof finalIp);
    console.log(`🔍 [SAVE-GENERATION] ipHash (from body):`, ipHashFromBody ? String(ipHashFromBody).substring(0, 16) + '...' : null);
    console.log(`🔍 [SAVE-GENERATION] deviceToken:`, deviceToken || null);
    
    // Określ identyfikator klienta (priorytet: customerId > email > IP)
    let keyPrefix = 'customer';
    let identifier = null;
    
    // ✅ KONWERSJA NA STRING - BARDZO DEFENSYWNA
    if (customerId) {
      identifier = String(customerId);
      console.log(`✅ [SAVE-GENERATION] Używam customerId jako identifier:`, identifier, typeof identifier);
    } else if (email) {
      keyPrefix = 'email';
      identifier = String(email).toLowerCase().trim();
      console.log(`✅ [SAVE-GENERATION] Używam email jako identifier:`, identifier, typeof identifier);
    } else {
      // ✅ Dla niezalogowanych używamy IP jako identyfikatora
      keyPrefix = 'ip';
      identifier = String(finalIp || 'unknown');
      console.log(`✅ [SAVE-GENERATION] Używam IP jako identifier (brak customerId/email):`, identifier, typeof identifier);
    }

    // ✅ WALIDACJA - upewnij się, że identifier jest stringiem
    console.log(`🔍 [SAVE-GENERATION] identifier przed walidacją:`, identifier, typeof identifier);
    if (!identifier || typeof identifier !== 'string') {
      console.error('❌ [SAVE-GENERATION] Invalid identifier:', identifier, typeof identifier);
      console.error('❌ [SAVE-GENERATION] customerId:', customerId, typeof customerId);
      console.error('❌ [SAVE-GENERATION] email:', email, typeof email);
      console.error('❌ [SAVE-GENERATION] ip:', ip, typeof ip);
      return res.status(400).json({ 
        error: 'Invalid identifier',
        message: 'customerId, email, or IP must be provided',
        debug: {
          customerId: customerId,
          customerIdType: typeof customerId,
          email: email,
          emailType: typeof email,
          ip: ip,
          ipType: typeof ip,
          identifier: identifier,
          identifierType: typeof identifier
        }
      });
    }

    // ✅ DODATKOWA KONWERSJA NA STRING (na wszelki wypadek)
    identifier = String(identifier);
    console.log(`✅ [SAVE-GENERATION] identifier po finalnej konwersji:`, identifier, typeof identifier);
    console.log(`🔍🔍🔍 [SAVE-GENERATION] ===== KONIEC SPRAWDZANIA IDENTIFIER =====`);

    const statsPrefix = 'customify/system/stats/generations';
    const legacyPrefix = 'customify/generations';

    let blobPath;
    let legacyBlobPath;
    
    // ✅ DODATKOWA OCHRONA - upewnij się że identifier jest stringiem przed sanitizeIdentifier
    if (typeof identifier !== 'string') {
      console.error('❌ [SAVE-GENERATION] identifier nie jest stringiem przed sanitizeIdentifier:', identifier, typeof identifier);
      identifier = String(identifier);
      console.log(`✅ [SAVE-GENERATION] Skonwertowano identifier na string:`, identifier, typeof identifier);
    }
    
    const sanitizedIdentifier = sanitizeIdentifier(identifier);
    if (sanitizedIdentifier) {
      blobPath = `${statsPrefix}/${keyPrefix}-${sanitizedIdentifier}.json`;
      legacyBlobPath = `${legacyPrefix}/${keyPrefix}-${sanitizedIdentifier}.json`;
      console.log(`✅ [SAVE-GENERATION] Blob path utworzony (sanitized): ${blobPath}`);
    } else {
      const fallbackId = String(Date.now());
      blobPath = `${statsPrefix}/${keyPrefix}-${fallbackId}.json`;
      legacyBlobPath = `${legacyPrefix}/${keyPrefix}-${fallbackId}.json`;
      console.warn(`⚠️ [SAVE-GENERATION] Identifier pusty po sanetyzacji - używam fallback: ${blobPath}`);
    }
    console.log(`📝 [SAVE-GENERATION] Blob Path: ${blobPath}`);

    // Generuj unikalny ID dla generacji
    const generationId = `gen-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Nowa generacja
    const newGeneration = {
      id: generationId,
      imageUrl: imageUrl, // ✅ BEZ watermarku (do realizacji zamówienia)
      watermarkedImageUrl: watermarkedImageUrl || null, // ✅ Z watermarkiem (do emaili) - tylko dla zalogowanych
      customerId: customerId ? String(customerId) : null,
      email: email || null,
      style: style || 'unknown',
      productType: productType || 'other',
      originalImageUrl: originalImageUrl || null,
      productHandle: productHandle || null,
      date: new Date().toISOString(),
      purchased: false,
      orderId: null,
      purchaseDate: null,
      ipHash: ipHashFromBody || null,
      deviceToken: deviceToken || null
    };

    // Pobierz istniejące generacje z Vercel Blob Storage
    let existingData = null;
    try {
      // Spróbuj sprawdzić czy plik istnieje używając head() z timeoutem
      let existingBlob = await withTimeout(
        head(blobPath, { token: process.env.customify_READ_WRITE_TOKEN }).catch(() => null),
        8000, 'head blobPath'
      ).catch(() => null);
      
      if (existingBlob && existingBlob.url) {
        // Plik istnieje - pobierz go z timeoutem
        const existingResponse = await withTimeout(fetch(existingBlob.url), 10000, 'fetch existing blob');
        if (existingResponse.ok) {
          existingData = await existingResponse.json();
          console.log(`📊 [SAVE-GENERATION] Existing data found: ${existingData.generations?.length || 0} generations`);
        }
      } else if (legacyBlobPath) {
        // Spróbuj odczytać z legacy ścieżki
        console.log('📂 [SAVE-GENERATION] Trying legacy blob path:', legacyBlobPath);
        existingBlob = await withTimeout(
          head(legacyBlobPath, { token: process.env.customify_READ_WRITE_TOKEN }).catch(() => null),
          8000, 'head legacyBlobPath'
        ).catch(() => null);

        if (existingBlob && existingBlob.url) {
          const legacyResponse = await withTimeout(fetch(existingBlob.url), 10000, 'fetch legacy blob');
          if (legacyResponse.ok) {
            existingData = await legacyResponse.json();
            console.log(`📊 [SAVE-GENERATION] Legacy data found: ${existingData.generations?.length || 0} generations`);
          }
        }
      } else {
        console.log(`📊 [SAVE-GENERATION] No existing file found - creating new`);
      }
    } catch (blobError) {
      console.error('❌ [SAVE-GENERATION] Error reading existing file (timeout or error):', blobError.message);
      // Kontynuuj - utworzymy nowy rekord
    }

    // Przygotuj dane do zapisu
    let dataToSave;
    
    if (existingData && Array.isArray(existingData.generations)) {
      // Dodaj nową generację do istniejącej tablicy
      existingData.generations.unshift(newGeneration); // Dodaj na początku
      // Zachowaj ostatnie 50 generacji (limit)
      if (existingData.generations.length > 50) {
        existingData.generations = existingData.generations.slice(0, 50);
      }
      dataToSave = {
        ...existingData,
        // Uzupełnij customer/email, jeśli rekord historyczny był zapisany bez tych danych
        customerId: existingData.customerId || customerId || null,
        email: existingData.email || email || null,
        // ✅ Aktualizuj IP jeśli nie było wcześniej (dla starych rekordów)
        ip: existingData.ip || finalIp,
        ipHash: existingData.ipHash || ipHashFromBody || null,
        deviceToken: deviceToken || existingData.deviceToken || null,
        deviceTokenHistory: Array.isArray(existingData.deviceTokenHistory)
          ? Array.from(new Set([deviceToken, ...existingData.deviceTokenHistory].filter(Boolean)))
          : (deviceToken ? [deviceToken] : (existingData.deviceTokenHistory || [])),
        lastGenerationDate: new Date().toISOString(),
        totalGenerations: existingData.generations.length
      };
    } else {
      // Utwórz nowy rekord
      dataToSave = {
        customerId: customerId || null,
        email: email || null,
        ip: finalIp || null, // ✅ Użyj finalIp (z body lub request)
        ipHash: ipHashFromBody || null,
        deviceToken: deviceToken || null,
        deviceTokenHistory: deviceToken ? [deviceToken] : [],
        generations: [newGeneration],
        lastGenerationDate: new Date().toISOString(),
        totalGenerations: 1,
        purchasedCount: 0,
        createdAt: new Date().toISOString()
      };
    }

    // Zapisz w Vercel Blob Storage jako JSON
    try {
      const jsonData = JSON.stringify(dataToSave, null, 2);
      const jsonBuffer = Buffer.from(jsonData, 'utf-8');
      
      const blob = await withTimeout(put(blobPath, jsonBuffer, {
        access: 'public',
        contentType: 'application/json',
        token: process.env.customify_READ_WRITE_TOKEN,
        allowOverwrite: true
      }), 15000, 'put main blob');
      
      console.log(`✅ [SAVE-GENERATION] Saved to Blob: ${blob.url}`);
      
      // ✅ DODATKOWY ZAPIS: dla niezalogowanych zapisz RÓWNIEŻ pod device token (do sprawdzania limitu 1 PER PRODUCTTYPE)
      if (!customerId && deviceToken) {
        try {
          const deviceBlobPath = `${statsPrefix}/device-${deviceToken}.json`;
          const productType = newGeneration.productType || 'other';
          
          // ✅ Pobierz istniejący plik (jeśli istnieje) z timeoutem
          let existingDeviceData = null;
          try {
            const existingBlob = await withTimeout(
              head(deviceBlobPath, { token: process.env.customify_READ_WRITE_TOKEN }).catch(() => null),
              8000, 'head deviceBlobPath'
            ).catch(() => null);
            
            if (existingBlob && existingBlob.url) {
              const existingResponse = await withTimeout(fetch(existingBlob.url), 10000, 'fetch device blob');
              if (existingResponse.ok) {
                existingDeviceData = await existingResponse.json();
                console.log(`📊 [SAVE-GENERATION] Existing device token data found`);
              }
            }
          } catch (headError) {
            // Blob not found = pierwsza generacja dla tego device token
            console.log(`✅ [SAVE-GENERATION] Device token ${deviceToken.substring(0, 8)}... - pierwsza generacja, zapisuję`);
          }
          
          // Przygotuj deviceData
          let deviceData;
          if (existingDeviceData) {
            // Backward compatibility: jeśli stary format (brak generationsByProductType)
            if (!existingDeviceData.generationsByProductType) {
              const oldTotal = existingDeviceData.totalGenerations || 0;
              existingDeviceData.generationsByProductType = {
                'other': oldTotal
              };
              console.log(`⚠️ [SAVE-GENERATION] Konwertuję stary format device token: ${oldTotal} → {"other": ${oldTotal}}`);
            }
            
            // Inkrementuj dla TEGO productType
            existingDeviceData.generationsByProductType = existingDeviceData.generationsByProductType || {};
            existingDeviceData.generationsByProductType[productType] = 
              (existingDeviceData.generationsByProductType[productType] || 0) + 1;
            
            // Zaktualizuj totalGenerations (suma wszystkich typów)
            existingDeviceData.totalGenerations = Object.values(existingDeviceData.generationsByProductType)
              .reduce((sum, count) => sum + count, 0);
            
            existingDeviceData.lastGenerationDate = new Date().toISOString();
            existingDeviceData.generations = existingDeviceData.generations || [];
            existingDeviceData.generations.unshift(newGeneration);
            if (existingDeviceData.generations.length > 50) {
              existingDeviceData.generations = existingDeviceData.generations.slice(0, 50);
            }
            
            deviceData = existingDeviceData;
          } else {
            // Utwórz nowy rekord
            deviceData = {
              deviceToken: deviceToken,
              ip: finalIp || null,
              ipHash: ipHashFromBody || null,
              customerId: null,
              email: null,
              totalGenerations: 1,
              generationsByProductType: {
                [productType]: 1
              },
              createdAt: new Date().toISOString(),
              lastGenerationDate: new Date().toISOString(),
              generations: [newGeneration]
            };
          }
          
          // Zapisz zaktualizowane dane
          const deviceJsonData = JSON.stringify(deviceData, null, 2);
          const deviceJsonBuffer = Buffer.from(deviceJsonData, 'utf-8');
          
          await withTimeout(put(deviceBlobPath, deviceJsonBuffer, {
            access: 'public',
            contentType: 'application/json',
            token: process.env.customify_READ_WRITE_TOKEN,
            allowOverwrite: true
          }), 15000, 'put device blob');
          console.log(`✅ [SAVE-GENERATION] Saved device token (${productType}): ${deviceBlobPath}, generationsByProductType:`, deviceData.generationsByProductType);
        } catch (deviceBlobError) {
          console.warn(`⚠️ [SAVE-GENERATION] Failed to save device token:`, deviceBlobError.message);
          // Nie blokuj - główny zapis się udał
        }
      }
    } catch (blobError) {
      console.error('❌ [SAVE-GENERATION] Error writing to Blob:', blobError);
      
      // ✅ SENTRY: Loguj błąd zapisu generacji
      Sentry.withScope((scope) => {
        scope.setTag('customify', 'true');
        scope.setTag('error_type', 'save_generation_failed');
        scope.setTag('endpoint', 'save-generation');
        scope.setContext('generation', {
          customerId: customerId || null,
          email: email || null,
          identifier: identifier || null
        });
        Sentry.captureException(blobError);
      });
      
      // Nie blokuj - zwróć sukces ale z warningiem
      return res.json({
        success: true,
        warning: 'Failed to save to Vercel Blob Storage',
        message: 'Generation saved locally only',
        generationId: generationId,
        debug: {
          reason: 'blob_write_error',
          error: blobError?.message || 'unknown',
          customerId: customerId || null,
          email: email || null
        }
      });
    }

    // ✅ USTAW METAFIELD I WYŚLIJ EMAIL PRZEZ SHOPIFY API
    // 1. Najpierw ustaw metafield (dla Shopify Email template)
    // 2. Potem wyślij email przez send_invite (fallback) lub Shopify Email API
    
    // ✅ DEBUG: Sprawdź wszystkie warunki przed wysłaniem emaila
    console.log('📧 [SAVE-GENERATION] ===== SPRAWDZAM WARUNKI WYSYŁANIA EMAILA =====');
    console.log('📧 [SAVE-GENERATION] customerId:', customerId, typeof customerId);
    console.log('📧 [SAVE-GENERATION] email:', email, typeof email);
    console.log('📧 [SAVE-GENERATION] watermarkedImageUrl:', watermarkedImageUrl ? watermarkedImageUrl.substring(0, 50) + '...' : 'NULL');
    console.log('📧 [SAVE-GENERATION] imageUrl (fallback):', imageUrl ? imageUrl.substring(0, 50) + '...' : 'NULL');
    
    // ✅ Użyj watermarkedImageUrl jeśli istnieje, w przeciwnym razie imageUrl (fallback)
    const imageUrlForEmail = watermarkedImageUrl || imageUrl;
    console.log('📧 [SAVE-GENERATION] imageUrlForEmail (dla emaila):', imageUrlForEmail ? imageUrlForEmail.substring(0, 50) + '...' : 'NULL');
    console.log('📧 [SAVE-GENERATION] Warunek (customerId && email && imageUrlForEmail):', 
      !!(customerId && email && imageUrlForEmail));
    
    if (customerId && email && imageUrlForEmail) {
      const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
      const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
      
      console.log('✅ [SAVE-GENERATION] Wszystkie warunki spełnione - wysyłam email:', {
        customerId,
        email: email.substring(0, 10) + '...',
        hasWatermarkedUrl: !!watermarkedImageUrl,
        shop
      });
      
      // ✅ KROK 1: Ustaw metafield generation_ready (dla Shopify Email template)
      try {
        // ✅ Użyj watermarkedImageUrl jeśli istnieje, w przeciwnym razie imageUrl (fallback)
        let finalImageUrlForEmail = watermarkedImageUrl || imageUrl;
        
        // 🚨 FIX: Jeśli imageUrl to base64 (data URI), nie zapisuj go do metafielda (przekracza limit 2MB)
        // Metafield ma limit 2,000,000 znaków, a base64 obrazka może mieć kilka MB
        if (finalImageUrlForEmail && finalImageUrlForEmail.startsWith('data:image')) {
          console.warn('⚠️ [SAVE-GENERATION] imageUrl to base64 - pomijam w metafield (przekracza limit)');
          console.warn(`⚠️ [SAVE-GENERATION] Base64 length: ${finalImageUrlForEmail.length} znaków`);
          finalImageUrlForEmail = null; // Nie zapisuj base64 do metafielda
        }
        
        // ✅ Sprawdź również długość URL (nawet jeśli nie jest base64, może być bardzo długi)
        if (finalImageUrlForEmail && finalImageUrlForEmail.length > 1000000) {
          console.warn(`⚠️ [SAVE-GENERATION] imageUrl jest bardzo długi (${finalImageUrlForEmail.length} znaków) - pomijam w metafield`);
          finalImageUrlForEmail = null;
        }
        
        // ✅ Sprawdź długość przed zapisem (limit 2,000,000 znaków)
        const metafieldData = {
          imageUrl: finalImageUrlForEmail, // Tylko URL, nie base64
          style: style,
          size: size || null,
          productType: productType || 'other',
          timestamp: new Date().toISOString(),
          galleryUrl: 'https://lumly.pl/pages/my-generations'
        };
        
        const metafieldValueString = JSON.stringify(metafieldData);
        const metafieldValueLength = metafieldValueString.length;
        
        if (metafieldValueLength > 2000000) {
          console.error(`❌ [SAVE-GENERATION] Metafield value przekracza limit (${metafieldValueLength} > 2,000,000 znaków)`);
          console.error(`❌ [SAVE-GENERATION] imageUrl length: ${finalImageUrlForEmail ? finalImageUrlForEmail.length : 0}`);
          // Usuń imageUrl jeśli przekracza limit
          metafieldData.imageUrl = null;
          console.warn('⚠️ [SAVE-GENERATION] Usunięto imageUrl z metafield (przekracza limit)');
        }
        
        // ✅ Najpierw sprawdź czy metafield już istnieje (z timeoutem 10s)
        const checkMetafieldResponse = await withTimeout(fetch(`https://${shop}/admin/api/2023-10/customers/${customerId}/metafields.json?namespace=customify&key=generation_ready`, {
          method: 'GET',
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        }), 10000, 'check shopify metafield');
        
        let metafieldResponse;
        let metafieldId = null;
        
        if (checkMetafieldResponse.ok) {
          const checkData = await checkMetafieldResponse.json();
          if (checkData.metafields && checkData.metafields.length > 0) {
            metafieldId = checkData.metafields[0].id;
            console.log('🔍 [SAVE-GENERATION] Metafield już istnieje, aktualizuję (PUT):', metafieldId);
          }
        }
        
        // ✅ Jeśli metafield istnieje - użyj PUT (aktualizacja), jeśli nie - użyj POST (tworzenie)
        if (metafieldId) {
          // Aktualizuj istniejący metafield (z timeoutem 10s)
          metafieldResponse = await withTimeout(fetch(`https://${shop}/admin/api/2023-10/customers/${customerId}/metafields/${metafieldId}.json`, {
            method: 'PUT',
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              metafield: {
                id: metafieldId,
                value: JSON.stringify(metafieldData)
              }
            })
          }), 10000, 'update shopify metafield PUT');
        } else {
          // Utwórz nowy metafield (z timeoutem 10s)
          metafieldResponse = await withTimeout(fetch(`https://${shop}/admin/api/2023-10/customers/${customerId}/metafields.json`, {
            method: 'POST',
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              metafield: {
                namespace: 'customify',
                key: 'generation_ready',
                value: JSON.stringify(metafieldData),
                type: 'json'
              }
            })
          }), 10000, 'create shopify metafield POST');
        }
        
        const metafieldResult = await metafieldResponse.json();
        console.log('📋 [SAVE-GENERATION] ===== SHOPIFY METAFIELD RESPONSE =====');
        console.log('📋 [SAVE-GENERATION] Status:', metafieldResponse.status);
        console.log('📋 [SAVE-GENERATION] OK:', metafieldResponse.ok);
        console.log('📋 [SAVE-GENERATION] Response body:', JSON.stringify(metafieldResult, null, 2));
        console.log('📋 [SAVE-GENERATION] ==========================================');
        
        if (metafieldResponse.ok) {
          console.log('✅ [SAVE-GENERATION] Metafield generation_ready ustawiony/aktualizowany');
          console.log('✅ [SAVE-GENERATION] Metafield ID:', metafieldResult.metafield?.id);
          console.log('✅ [SAVE-GENERATION] Metafield namespace:', metafieldResult.metafield?.namespace);
          console.log('✅ [SAVE-GENERATION] Metafield key:', metafieldResult.metafield?.key);
          console.log('✅ [SAVE-GENERATION] Metafield value preview:', JSON.stringify(metafieldResult.metafield?.value).substring(0, 100) + '...');
          
          // ✅ WYŚLIJ EMAIL przez Resend (bezpośrednio, bez dodatkowego endpointa)
          try {
            console.log('📧 [SAVE-GENERATION] Wysyłam email przez Resend...');
            
            if (!process.env.RESEND_API_KEY) {
              console.warn('⚠️ [SAVE-GENERATION] RESEND_API_KEY nie skonfigurowany - pomijam email');
            } else {
              const { Resend } = require('resend');
              const resend = new Resend(process.env.RESEND_API_KEY);
              
              // Przygotuj nazwę stylu (czytelną)
              const styleNames = {
                'pixar': 'Pixar',
                'minimalistyczny': 'Minimalistyczny',
                'realistyczny': 'Realistyczny',
                'akwarela': 'Akwarela',
                'karykatura': 'Karykatura',
                'krol-krolewski': 'Król - Królewski',
                'krolowa-prezent-1': 'Królowa - Prezent 1',
                'krolowa-prezent-2': 'Królowa - Prezent 2',
                'krolewski': 'Królewski',
                'barokowy': 'Barokowy',
                'renesansowy': 'Renesansowy',
                'wiktorianski': 'Wiktoriański',
                'wojenny': 'Wojenny',
                'na-tronie': 'Na tronie'
              };
              
              const styleName = styleNames[style] || style || 'unknown';
              
              // Rozmiary czytelne
              const sizeNames = {
                'a5': 'A5 (20×30 cm)',
                'a4': 'A4 (30×40 cm)',
                'a3': 'A3 (40×60 cm)',
                'a2': 'A2 (60×85 cm)'
              };
              const sizeName = sizeNames[size] || size || 'A4 (30×40 cm)';
              
              // HTML Email Template
              const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎨 Twój obraz jest gotowy</h1>
    </div>
    <div style="padding: 40px 30px; background-color: #ffffff;">
      <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Cześć! 👋</p>
      <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 30px;">Twój obraz został utworzony, zobacz efekt poniżej:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${emailTrackingUrl('generation', customerId, 'https://lumly.pl/pages/my-generations')}" style="text-decoration: none;">
          <img src="${finalImageUrlForEmail}" alt="Twoja generacja AI" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); cursor: pointer;" />
        </a>
      </div>
      <div style="text-align: center; margin: 40px 0;">
        <a href="${emailTrackingUrl('generation', customerId, 'https://lumly.pl/pages/my-generations')}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Zobacz swoje obrazy</a>
      </div>
      <p style="font-size: 14px; color: #666; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">Jeśli masz do nas jakieś pytania lub chcesz coś zmienić w obrazku, napisz do nas: <a href="mailto:biuro@lumly.pl" style="color: #667eea; text-decoration: none; font-weight: bold;">biuro@lumly.pl</a></p>
    </div>
    <div style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
      <p style="margin: 0; font-size: 12px; color: #999;">© 2025 Lumly.pl - Personalizowane portrety AI</p>
    </div>
  </div>
</body>
</html>
              `;
              
              const result = await resend.emails.send({
                from: 'Lumly <noreply@notification.lumly.pl>',
                reply_to: 'biuro@lumly.pl', // ✅ Reply trafia do biuro@lumly.pl
                to: email,
                subject: 'Twój projekt jest gotowy!',
                html: emailHtml
              });
              
              // ✅ SPRAWDŹ CZY JEST BŁĄD W RESPONSE (Resend nie rzuca exception!)
              console.log('🔍 [SAVE-GENERATION] Resend result (PEŁNY):', JSON.stringify(result, null, 2));
              
              if (result.error) {
                console.error('❌ [SAVE-GENERATION] Resend zwrócił błąd:', result.error);
                throw new Error(`Resend error: ${result.error.message || JSON.stringify(result.error)}`);
              }
              
              const resendId = result.data?.id || result.id;
              
              if (!resendId) {
                console.error('❌ [SAVE-GENERATION] Brak Resend ID w response! Result:', result);
                throw new Error('Resend nie zwrócił ID - email nie został wysłany');
              }
              
              console.log('✅ [SAVE-GENERATION] Email wysłany pomyślnie!');
              console.log('✅ [SAVE-GENERATION] Resend ID:', resendId);
              kv.incr('email-stats:generation:sent').catch(() => {});
            }
          } catch (emailError) {
            console.error('❌ [SAVE-GENERATION] Exception podczas wysyłania emaila:', emailError);
            console.error('❌ [SAVE-GENERATION] Error message:', emailError.message);
            
            // ✅ SENTRY: Loguj błąd wysyłki maila
            Sentry.withScope((scope) => {
              scope.setTag('customify', 'true');
              scope.setTag('error_type', 'email_send_failed');
              scope.setTag('endpoint', 'save-generation');
              scope.setContext('email', {
                customerId: customerId || null,
                email: email || null,
                hasImageUrl: !!imageUrlForEmail
              });
              Sentry.captureException(emailError);
            });
            // Nie blokuj - email to nice-to-have, nie critical
          }
        } else {
          const error = await metafieldResponse.text();
          console.error('❌ [SAVE-GENERATION] ===== BŁĄD SHOPIFY METAFIELD =====');
          console.error('❌ [SAVE-GENERATION] Status:', metafieldResponse.status);
          console.error('❌ [SAVE-GENERATION] Status text:', metafieldResponse.statusText);
          console.error('❌ [SAVE-GENERATION] Error body:', error);
          console.error('❌ [SAVE-GENERATION] Request data:', JSON.stringify(metafieldData, null, 2));
          console.error('❌ [SAVE-GENERATION] CustomerId:', customerId);
          console.error('❌ [SAVE-GENERATION] Shop:', shop);
          console.error('❌ [SAVE-GENERATION] Method:', metafieldId ? 'PUT (update)' : 'POST (create)');
          console.error('❌ [SAVE-GENERATION] ==========================================');
        }
      } catch (metafieldError) {
        console.error('❌ [SAVE-GENERATION] ===== EXCEPTION PODCZAS USTAWIANIA METAFIELD =====');
        console.error('❌ [SAVE-GENERATION] Error:', metafieldError);
        console.error('❌ [SAVE-GENERATION] Error message:', metafieldError.message);
        console.error('❌ [SAVE-GENERATION] Error stack:', metafieldError.stack);
        console.error('❌ [SAVE-GENERATION] ==========================================');
      }
      
      // ✅ KROK 2: Email będzie wysłany przez /api/send-generation-email (Resend)
      console.log('✅ [SAVE-GENERATION] Metafield ustawiony - gotowe do wysłania emaila');
      
      // ⚠️ WYŁĄCZONE: send_invite (tekstowy) - używamy Shopify Email template zamiast tego
      // Jeśli chcesz fallback do tekstowego emaila, odkomentuj poniższy kod:
      /*
      try {
        const styleNames = {
          'pixar': 'Pixar',
          'minimalistyczny': 'Minimalistyczny',
          'realistyczny': 'Realistyczny',
          'krol-krolewski': 'Król - Królewski',
          'krolowa-krolewska': 'Królowa - Królewska',
          'krolewski': 'Królewski',
          'barokowy': 'Barokowy',
          'renesansowy': 'Renesansowy',
          'wiktorianski': 'Wiktoriański',
          'wojenny': 'Wojenny',
          'na-tronie': 'Na tronie'
        };
        
        const styleName = styleNames[style] || style;
        const sizeText = size ? `Rozmiar: ${size}` : '';
        
        const emailMessage = `
Cześć!

Twoja generacja w stylu ${styleName} jest gotowa! 🎨

Obrazek: ${watermarkedImageUrl}

${sizeText ? sizeText + '\n' : ''}
Zobacz wszystkie generacje: https://lumly.pl/pages/my-generations

Pozdrawiamy,
Zespół Lumly
        `.trim();
        
        const emailResponse = await fetch(`https://${shop}/admin/api/2023-10/customers/${customerId}/send_invite.json`, {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            customer_invite: {
              to: email,
              subject: 'Twoja generacja AI jest gotowa! 🎨',
              custom_message: emailMessage
            }
          })
        });
        
        if (emailResponse.ok) {
          console.log('✅ [SAVE-GENERATION] Email wysłany przez send_invite (fallback)');
        }
      } catch (error) {
        console.error('❌ [SAVE-GENERATION] Błąd wysyłania emaila przez send_invite:', error);
      }
      */
    } else {
      // ✅ DEBUG: Pokaż dokładnie dlaczego email nie został wysłany
      console.log('⚠️ [SAVE-GENERATION] ===== EMAIL NIE ZOSTAŁ WYSŁANY - SPRAWDŹ WARUNKI =====');
      if (!customerId) {
        console.log('❌ [SAVE-GENERATION] Pomijam email - brak customerId (niezalogowany)');
      } else if (!email) {
        console.log('❌ [SAVE-GENERATION] Pomijam email - brak emaila (customerId:', customerId, 'ale email:', email);
      } else if (!imageUrlForEmail) {
        console.log('❌ [SAVE-GENERATION] Pomijam email - brak imageUrlForEmail (customerId:', customerId, 'email:', email);
      } else {
        console.log('❌ [SAVE-GENERATION] Pomijam email - nieznany powód (sprawdź warunki)');
      }
    }

    // ✅ AKTUALIZUJ CUSTOMER METAFIELD W SHOPIFY (jeśli customerId)
    // To pozwoli wyświetlić generacje w Shopify Admin na koncie klienta
    console.log(`🔍 [SAVE-GENERATION] Sprawdzam customerId:`, customerId, typeof customerId);
    console.log(`🔍 [SAVE-GENERATION] Email fallback:`, email);
    
    // ✅ ZMIENNE DO ŚLEDZENIA STATUSU METAFIELD UPDATE
    let metafieldUpdateAttempted = false;
    let metafieldUpdateSuccess = false;
    let metafieldUpdateError = null;
    
    if (customerId) {
      metafieldUpdateAttempted = true;
      try {
        console.log(`📝 [SAVE-GENERATION] Aktualizuję Customer Metafield w Shopify dla ${customerId}...`);
        console.log(`📊 [SAVE-GENERATION] Generacje do zapisania: ${dataToSave.generations.length}`);
        console.log(`📊 [SAVE-GENERATION] Przykładowa generacja:`, dataToSave.generations[0] ? {
          id: dataToSave.generations[0].id,
          imageUrl: dataToSave.generations[0].imageUrl?.substring(0, 50) + '...',
          style: dataToSave.generations[0].style
        } : 'brak');
        
        const shopDomain = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
        const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
        
        if (!accessToken) {
          console.warn('⚠️ [SAVE-GENERATION] SHOPIFY_ACCESS_TOKEN nie jest skonfigurowany - pomijam aktualizację metafielda');
        } else {
          // Przygotuj dane do zapisu (tylko podstawowe info - metafield ma limit)
          const generationsData = {
            totalGenerations: dataToSave.generations.length,
            purchasedCount: dataToSave.generations.filter(g => g.purchased).length,
            lastGenerationDate: dataToSave.generations[0]?.date || null,
            generations: dataToSave.generations.slice(0, 20).map(gen => ({
              id: gen.id,
              imageUrl: gen.imageUrl,
              style: gen.style,
              date: gen.date,
              purchased: gen.purchased || false,
              orderId: gen.orderId || null
            }))
          };
          
          // GraphQL mutation do aktualizacji Customer Metafield
          const mutation = `
            mutation updateCustomerGenerations($input: CustomerInput!) {
              customerUpdate(input: $input) {
                customer {
                  id
                  metafield(namespace: "customify", key: "ai_generations") {
                    id
                    value
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `;
          
          // ✅ SPRAWDŹ CZY customerId TO NUMERYCZNY ID (Shopify Customer ID)
          // Shopify Customer ID to numeryczny string (np. "123456789")
          const rawCustomerId = customerId;
          const customerIdStr = rawCustomerId === null || rawCustomerId === undefined ? '' : String(rawCustomerId);
          let shopifyCustomerId = customerIdStr;
          console.log(`🔍 [SAVE-GENERATION] customerIdStr (po normalizacji): ${shopifyCustomerId}, type: ${typeof shopifyCustomerId}`);
          
          // ✅ DODATKOWA OCHRONA - upewnij się że shopifyCustomerId jest stringiem przed użyciem .includes()/.replace()
          if (typeof shopifyCustomerId !== 'string') {
            console.warn(`⚠️ [SAVE-GENERATION] shopifyCustomerId nie jest stringiem, konwertuję:`, shopifyCustomerId, typeof shopifyCustomerId);
            shopifyCustomerId = String(shopifyCustomerId);
          }
          
          // Jeśli customerId zawiera "gid://shopify/Customer/", usuń prefix
          if (typeof shopifyCustomerId === 'string' && shopifyCustomerId.includes('gid://shopify/Customer/')) {
            shopifyCustomerId = shopifyCustomerId.replace('gid://shopify/Customer/', '');
            console.log(`🔧 [SAVE-GENERATION] Usunięto prefix GID, customerId: ${shopifyCustomerId}`);
          }
          
          // Jeśli customerId nie jest numeryczny, sprawdź czy to może być email
          if (!/^\d+$/.test(shopifyCustomerId)) {
            console.warn(`⚠️ [SAVE-GENERATION] customerId nie jest numeryczny: ${shopifyCustomerId}`);
            console.warn(`⚠️ [SAVE-GENERATION] Shopify Customer ID musi być numeryczny (np. "123456789")`);
            // Nie blokuj - spróbuj użyć jako jest (może działać)
          }
          
          console.log(`🔍 [SAVE-GENERATION] Używam shopifyCustomerId: ${shopifyCustomerId}`);
          console.log(`🔍 [SAVE-GENERATION] GID format: gid://shopify/Customer/${shopifyCustomerId}`);
          
          const variables = {
            input: {
              id: `gid://shopify/Customer/${shopifyCustomerId}`,
              metafields: [
                {
                  namespace: 'customify',
                  key: 'ai_generations',
                  value: JSON.stringify(generationsData),
                  type: 'json'
                }
              ]
            }
          };
          
          console.log(`🔍 [SAVE-GENERATION] GraphQL variables:`, JSON.stringify(variables, null, 2));
          
          const updateResponse = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': accessToken
            },
            body: JSON.stringify({
              query: mutation,
              variables: variables
            })
          });
          
          const updateData = await updateResponse.json();
          
          console.log(`🔍 [SAVE-GENERATION] GraphQL response status: ${updateResponse.status}`);
          console.log(`🔍 [SAVE-GENERATION] GraphQL response:`, JSON.stringify(updateData, null, 2));
          
          if (updateData.errors) {
            console.error('❌ [SAVE-GENERATION] GraphQL errors:', JSON.stringify(updateData.errors, null, 2));
            // Sprawdź czy to błąd "metafield definition not found"
            const metafieldNotFound = updateData.errors.some(err => 
              err.message?.toLowerCase().includes('metafield') || 
              err.message?.toLowerCase().includes('definition') ||
              err.message?.toLowerCase().includes('not found') ||
              err.message?.toLowerCase().includes('does not exist')
            );
            if (metafieldNotFound) {
              console.warn('⚠️ [SAVE-GENERATION] Metafield definition nie istnieje!');
              console.warn('⚠️ [SAVE-GENERATION] Uruchom: GET https://customify-s56o.vercel.app/api/setup-customer-generations-metafield');
            }
            
            // Sprawdź czy to błąd "Customer not found"
            const customerNotFound = updateData.errors.some(err => 
              err.message?.toLowerCase().includes('customer') && 
              (err.message?.toLowerCase().includes('not found') || err.message?.toLowerCase().includes('does not exist') || err.message?.toLowerCase().includes('invalid'))
            );
            if (customerNotFound) {
              console.error('❌ [SAVE-GENERATION] Customer nie został znaleziony w Shopify!');
              console.error('❌ [SAVE-GENERATION] Sprawdź czy customerId jest poprawny:', shopifyCustomerId);
              console.error('❌ [SAVE-GENERATION] customerId type:', typeof shopifyCustomerId);
              console.error('❌ [SAVE-GENERATION] customerId value:', shopifyCustomerId);
            }
          } else if (updateData.data?.customerUpdate?.userErrors?.length > 0) {
            console.error('❌ [SAVE-GENERATION] User errors:', JSON.stringify(updateData.data.customerUpdate.userErrors, null, 2));
            // Sprawdź czy to błąd "metafield definition not found"
            const metafieldNotFound = updateData.data.customerUpdate.userErrors.some(err => 
              err.message?.toLowerCase().includes('metafield') || 
              err.message?.toLowerCase().includes('definition') ||
              err.message?.toLowerCase().includes('not found')
            );
            if (metafieldNotFound) {
              console.warn('⚠️ [SAVE-GENERATION] Metafield definition nie istnieje!');
              console.warn('⚠️ [SAVE-GENERATION] Uruchom: GET https://customify-s56o.vercel.app/api/setup-customer-generations-metafield');
            }
            
            // Sprawdź czy to błąd "Customer not found"
            const customerNotFound = updateData.data.customerUpdate.userErrors.some(err => 
              err.message?.toLowerCase().includes('customer') && 
              (err.message?.toLowerCase().includes('not found') || err.message?.toLowerCase().includes('does not exist') || err.message?.toLowerCase().includes('invalid'))
            );
            if (customerNotFound) {
              console.error('❌ [SAVE-GENERATION] Customer nie został znaleziony w Shopify!');
              console.error('❌ [SAVE-GENERATION] Sprawdź czy customerId jest poprawny:', shopifyCustomerId);
            }
          } else if (updateData.data?.customerUpdate?.customer) {
            metafieldUpdateSuccess = true;
            console.log(`✅ [SAVE-GENERATION] Customer Metafield zaktualizowany: ${generationsData.totalGenerations} generacji`);
            console.log(`📊 [SAVE-GENERATION] Kupione: ${generationsData.purchasedCount}, Nie kupione: ${generationsData.totalGenerations - generationsData.purchasedCount}`);
            console.log(`📊 [SAVE-GENERATION] Customer ID: ${updateData.data.customerUpdate.customer.id}`);
            console.log(`📊 [SAVE-GENERATION] Metafield value length: ${updateData.data.customerUpdate.customer.metafield?.value?.length || 0} znaków`);
            console.log(`📊 [SAVE-GENERATION] Metafield value preview: ${updateData.data.customerUpdate.customer.metafield?.value?.substring(0, 200) || 'brak'}...`);
          } else {
            metafieldUpdateError = 'Nieoczekiwana odpowiedź z GraphQL - brak customer w response';
            console.warn('⚠️ [SAVE-GENERATION] Nieoczekiwana odpowiedź z GraphQL - brak customer w response');
            console.warn('⚠️ [SAVE-GENERATION] Response:', JSON.stringify(updateData, null, 2));
          }
          
          // ✅ ZAPISZ BŁĘDY DO METAFIELD UPDATE ERROR
          if (updateData.errors) {
            metafieldUpdateError = JSON.stringify(updateData.errors, null, 2);
          } else if (updateData.data?.customerUpdate?.userErrors?.length > 0) {
            metafieldUpdateError = JSON.stringify(updateData.data.customerUpdate.userErrors, null, 2);
          }
        }
      } catch (updateError) {
        metafieldUpdateError = updateError.message;
        console.error('❌ [SAVE-GENERATION] Błąd aktualizacji Customer Metafield:', updateError.message);
        console.error('❌ [SAVE-GENERATION] Stack:', updateError.stack);
        // Nie blokuj - zapis w Blob Storage się udał
      }
    }

    // ✅ ZWRÓĆ SZCZEGÓŁOWE INFO W RESPONSE (dla debugowania w przeglądarce)
    const debugInfo = {
      customerId: customerId || null,
      customerIdType: typeof customerId,
      email: email || null,
      hasMetafieldUpdate: !!customerId,
      blobPath: blobPath,
      generationsCount: dataToSave.generations.length,
      firstGeneration: dataToSave.generations[0] ? {
        id: dataToSave.generations[0].id,
        style: dataToSave.generations[0].style,
        imageUrlPreview: dataToSave.generations[0].imageUrl?.substring(0, 50) + '...'
      } : null,
      productHandle: productHandle || null,
      metafieldUpdateAttempted: metafieldUpdateAttempted,
      metafieldUpdateSuccess: metafieldUpdateSuccess,
      metafieldUpdateError: metafieldUpdateError,
      ip: dataToSave.ip || null,
      ipHashPreview: dataToSave.ipHash ? String(dataToSave.ipHash).substring(0, 16) + '...' : null,
      deviceToken: dataToSave.deviceToken || null,
      deviceTokenHistoryCount: Array.isArray(dataToSave.deviceTokenHistory) ? dataToSave.deviceTokenHistory.length : 0
    };
    
    // ✅ LOGUJ DEBUG INFO W BACKEND (dla Vercel Logs)
    console.log(`🔍 [SAVE-GENERATION] Debug info (backend):`, JSON.stringify(debugInfo, null, 2));
    
    return res.json({
      success: true,
      generationId: generationId,
      blobPath: blobPath,
      totalGenerations: dataToSave.totalGenerations,
      message: 'Generation saved successfully',
      // ✅ DEBUG INFO - pomoże zdiagnozować problem w przeglądarce
      debug: debugInfo
    });

  } catch (error) {
    console.error('❌ [SAVE-GENERATION] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

module.exports = saveGenerationHandler;
module.exports.config = { runtime: 'nodejs18.x' };

