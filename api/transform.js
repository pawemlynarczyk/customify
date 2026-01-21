const Replicate = require('replicate');
const OpenAI = require('openai');
const { toFile } = require('openai');
const crypto = require('crypto');
const { kv } = require('@vercel/kv');
const { getClientIP } = require('../utils/vercelRateLimiter');
const { checkIPLimit, incrementIPLimit, checkDeviceTokenLimit, incrementDeviceTokenLimit, isKVConfigured, isImageHashLimitEnabled, calculateImageHash, checkImageHashLimit, incrementImageHashLimit, checkDeviceTokenCrossAccount, addCustomerToDeviceToken } = require('../utils/vercelKVLimiter');
const Sentry = require('../utils/sentry');
const { put } = require('@vercel/blob');
const { trackError, trackAction, getRecentError } = require('../utils/userFlowTracker');

// 🚫 Lista IP zablokowanych całkowicie (tymczasowe banowanie nadużyć)
const BLOCKED_IPS = new Set([
  '46.112.202.146', // Podejrzana aktywność - ręcznie zablokowane
]);

// ✅ Biała lista IP (pomijają IP limit 10/24h)
const WHITELISTED_IPS = new Set([
  '83.29.225.249', // Admin/Development IP - bez limitu
]);

// 🧪 Lista emaili testowych (pomijają WSZYSTKIE limity dla testowania)
const TEST_EMAILS = new Set([
  'pawel.mlynarczyk@internetcapital.pl', // Admin email - bypass wszystkich limitów
]);

/**
 * Sprawdza czy użytkownik jest na liście testowej (bypass wszystkich limitów)
 * @param {string} email - Email użytkownika
 * @param {string} ip - IP użytkownika
 * @returns {boolean} - true jeśli użytkownik jest na liście testowej
 */
function isTestUser(email, ip) {
  const isTestEmail = email && TEST_EMAILS.has(email.toLowerCase());
  const isTestIP = ip && WHITELISTED_IPS.has(ip);
  
  if (isTestEmail || isTestIP) {
    console.log(`🧪 [TEST-BYPASS] Test user detected:`, {
      email: email ? email.substring(0, 10) + '...' : 'brak',
      ip: ip ? ip.substring(0, 10) + '...' : 'brak',
      isTestEmail,
      isTestIP
    });
    return true;
  }
  return false;
}

const VERSION_TAG = 'transform@2025-11-13T13:10';

// Try to load sharp, but don't fail if it's not available
let sharp = null;
try {
  sharp = require('sharp');
  console.log('Sharp loaded successfully');
} catch (error) {
  console.error('Sharp not available:', error.message);
  console.log('Image compression will be disabled');
}

// Initialize Replicate (only if token is provided)
let replicate = null;
if (process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_API_TOKEN !== 'leave_empty_for_now') {
  replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });
}

// Initialize OpenAI (shared)
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'leave_empty_for_now') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Function to add watermark to image buffer using Sharp
async function addWatermarkToImage(imageBuffer) {
  if (!sharp) {
    console.warn('⚠️ [WATERMARK] Sharp not available, returning original image');
    return imageBuffer;
  }
  
  try {
    console.log('🎨 [WATERMARK] Adding watermark to image...');
    
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;
    console.log(`📐 [WATERMARK] Image dimensions: ${width}x${height}`);
    
    // Calculate font size based on image size - zgodnie z frontendem (mniejszy, subtelniejszy)
    const fontSize = Math.max(30, Math.min(width, height) * 0.06); // Min 30px, max 6% obrazu (zgodnie z frontendem)
    const spacing = Math.max(200, Math.min(width, height) * 0.3); // Min 200px, max 30% (zgodnie z frontendem)
    
    // Create SVG watermark with diagonal text pattern - INLINE STYLES (Sharp nie obsługuje CSS class)
    // ✅ ZMIANA: Tylko "Lumly.pl" (zgodnie z frontendem)
    const texts = ['Lumly.pl'];
    const textElements = [];
    
    // Obróć całą grupę o -30 stopni
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Generuj teksty w siatce diagonalnej
    for (let i = -2; i < Math.ceil(height / spacing) + 3; i++) {
      for (let j = -2; j < Math.ceil(width / spacing) + 3; j++) {
        const x = (j - 1) * spacing * 1.5;
        const y = (i - 1) * spacing;
        const text = texts[0]; // Tylko "Lumly.pl"
        
        // Inline styles dla każdego elementu text (Sharp wymaga inline styles)
        textElements.push(
          `<text x="${x}" y="${y}" ` +
          `font-family="Arial, sans-serif" ` +
          `font-weight="bold" ` +
          `font-size="${fontSize}" ` +
            `fill="rgba(255, 255, 255, 0.35)" ` +
            `stroke="rgba(0, 0, 0, 0.25)" ` +
            `stroke-width="1" ` +
            `text-anchor="middle" ` +
            `dominant-baseline="middle">${text}</text>`
        );
      }
    }
    
    const svgWatermark = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <g transform="rotate(-30 ${centerX} ${centerY})">
          ${textElements.join('\n')}
        </g>
      </svg>
    `;
    
    // Apply watermark using Sharp composite
    const watermarkedBuffer = await sharp(imageBuffer)
      .composite([
        {
          input: Buffer.from(svgWatermark),
          blend: 'over'
        }
      ])
      .jpeg({ quality: 92 })
      .toBuffer();
    
    console.log(`✅ [WATERMARK] Watermark added successfully (${watermarkedBuffer.length} bytes)`);
    return watermarkedBuffer;
    
  } catch (error) {
    console.error('❌ [WATERMARK] Error adding watermark:', error);
    console.warn('⚠️ [WATERMARK] Returning original image without watermark');
    return imageBuffer; // Return original if watermark fails
  }
}

// Function to add watermark to image using PNG watermark (REQUIRED - no fallback)
async function addWatermarkPNG(imageBuffer, options = {}) {
  if (!sharp) {
    throw new Error('Sharp not available - watermark is required');
  }
  
  try {
    console.log('🎨 [WATERMARK-PNG] Adding PNG watermark to image...');
    
    // Pobierz watermark PNG
    const watermarkUrl = 'https://customify-s56o.vercel.app/watermark_22.png';
    console.log('📥 [WATERMARK-PNG] Fetching watermark PNG:', watermarkUrl);
    
    const watermarkResponse = await fetch(watermarkUrl);
    if (!watermarkResponse.ok) {
      throw new Error(`Failed to fetch watermark PNG: ${watermarkResponse.status}`);
    }
    
    const watermarkBuffer = Buffer.from(await watermarkResponse.arrayBuffer());
    console.log('✅ [WATERMARK-PNG] Watermark PNG loaded:', watermarkBuffer.length, 'bytes');
    
    // Metadata obrazu
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;
    console.log(`📐 [WATERMARK-PNG] Image dimensions: ${width}x${height}`);
    
    // Rozmiar watermarku: 40% z mniejszego wymiaru
    const watermarkSize = Math.min(width, height) * 0.40;
    console.log(`📏 [WATERMARK-PNG] Watermark size: ${Math.round(watermarkSize)}px (40% of image)`);
    
    // Resize watermark
    const watermarkTile = await sharp(watermarkBuffer)
      .resize(Math.round(watermarkSize), Math.round(watermarkSize), {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
      })
      .toBuffer();
    
    console.log('✅ [WATERMARK-PNG] Watermark tile resized:', watermarkTile.length, 'bytes');
    
    // Zastosuj watermark w siatce
    const outputFormat = options.outputFormat || 'jpeg';
    const pipeline = sharp(imageBuffer)
      .composite([
        {
          input: watermarkTile,
          blend: 'over', // Sharp automatycznie użyje alpha channel z PNG (opacity z pliku)
          tile: true, // Sharp automatycznie powtarza watermark w siatce
          gravity: 'center'
        }
      ]);
    const watermarkedBuffer = outputFormat === 'png'
      ? await pipeline.png().toBuffer()
      : await pipeline.jpeg({ quality: 92 }).toBuffer();
    
    console.log(`✅ [WATERMARK-PNG] Watermark applied successfully: ${watermarkedBuffer.length} bytes`);
    return watermarkedBuffer;
    
  } catch (error) {
    // ❌ NIE MA FALLBACKU - watermark jest wymagany!
    console.error('❌ [WATERMARK-PNG] Error adding watermark:', error);
    throw new Error(`Watermark application failed: ${error.message}`);
  }
}

// Function to add watermark to base64 image - USUNIĘTA (problemy z Sharp w Vercel)
// TODO: Przywrócić po rozwiązaniu problemów z Sharp

// Function to convert URL to base64
async function urlToBase64(imageUrl) {
  try {
    console.log('📥 [SEGMIND] Fetching image from URL:', imageUrl);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    // Use arrayBuffer() instead of buffer() for modern fetch API
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    console.log('✅ [SEGMIND] Converted to base64:', base64.length, 'chars');
    return base64;
  } catch (error) {
    console.error('❌ [SEGMIND] URL to base64 conversion failed:', error);
    throw error;
  }
}

// Function to upload base64 image to Vercel and return URL
async function uploadImageToVercel(imageDataUri) {
  try {
    // Convert data URI to base64 string
    const base64Data = imageDataUri.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Create a simple upload endpoint call to our own API
    // Use hardcoded URL to avoid VERCEL_URL issues
    const baseUrl = 'https://customify-s56o.vercel.app';
    
    console.log(`🔗 [UPLOAD] Using baseUrl: ${baseUrl}`);
    const response = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Data,
        filename: `caricature-${Date.now()}.png`
      })
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    const result = await response.json();
    return result.url || result.imageUrl;
  } catch (error) {
    console.error('❌ [UPLOAD] Failed to upload image to Vercel:', error);
    throw error;
  }
}


// Function to upload image to Cloudinary and return URL
async function uploadToCloudinary(imageDataUri) {
  const cloudinary = require('cloudinary').v2;
  
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  try {
    const uploadResult = await cloudinary.uploader.upload(imageDataUri, {
      public_id: `customify-temp/${Date.now()}`,
      folder: 'customify-temp',
      resource_type: 'image',
      format: 'jpg',
      quality: 'auto'
    });
    
    return uploadResult.secure_url;
  } catch (error) {
    console.error('❌ [CLOUDINARY] Upload failed:', error);
    throw error;
  }
}

// Helper function to check if error is moderation blocked
function isModerationBlocked(errorText) {
  if (!errorText) return false;
  const errorLower = errorText.toLowerCase();
  return errorLower.includes('moderation_blocked') || 
         errorLower.includes('safety_violations') ||
         errorLower.includes('rejected by the safety system');
}

// Helper function to create user-friendly moderation error
function createModerationError(originalError) {
  const error = new Error('Zdjęcie zostało odrzucone przez system bezpieczeństwa. Spróbuj użyć innego zdjęcia portretowego.');
  error.code = 'MODERATION_BLOCKED';
  error.userMessage = 'Zdjęcie zostało odrzucone przez system bezpieczeństwa. Spróbuj użyć innego zdjęcia portretowego.';
  error.originalError = originalError;
  return error;
}

// Function to handle Segmind Caricature API
async function segmindCaricature(imageUrl) {
  const SEGMIND_API_KEY = process.env.SEGMIND_API_KEY;
  
  console.log('🔑 [SEGMIND] Checking API key...', SEGMIND_API_KEY ? `Key present (${SEGMIND_API_KEY.substring(0, 10)}...)` : 'KEY MISSING!');
  
  if (!SEGMIND_API_KEY) {
    console.error('❌ [SEGMIND] SEGMIND_API_KEY not found in environment variables!');
    console.error('❌ [SEGMIND] Available env vars:', Object.keys(process.env).filter(k => k.includes('SEGMIND')));
    throw new Error('SEGMIND_API_KEY not configured - please add it to Vercel environment variables');
  }

  console.log('🎭 [SEGMIND] Starting caricature generation...');
  console.log('🎭 [SEGMIND] Image URL:', imageUrl);

  const maxRetries = 3;
  const retryDelay = 2000; // 2 sekundy bazowego opóźnienia
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`⏰ [SEGMIND] Request timeout after 120 seconds (attempt ${attempt}/${maxRetries}) - aborting`);
        controller.abort();
      }, 120000); // 120 second timeout

      console.log(`🔄 [SEGMIND] Attempt ${attempt}/${maxRetries}...`);

      const response = await fetch('https://api.segmind.com/v1/caricature-style', {
        method: 'POST',
        headers: {
          'x-api-key': SEGMIND_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageUrl, // Używamy URL (zgodnie z dokumentacją)
          size: "1024x1536", // PIONOWY PORTRET (2:3 format) - NIE ZMIENIAJ!
          quality: "medium", // Jakość średnia dla szybszego renderowania
          background: "opaque", // Zgodnie z dokumentacją
          output_format: "jpeg", // JPEG zamiast PNG - 80-90% mniejszy rozmiar! (używaj "jpeg" nie "jpg")
          output_compression: 85 // Kompresja JPEG 85% - dobra jakość, mały rozmiar
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Segmind returns JPEG image (binary), not JSON
        const imageBuffer = await response.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const imageUrl = `data:image/jpeg;base64,${base64Image}`;
        
        const sizeMB = (imageBuffer.byteLength / 1024 / 1024).toFixed(2);
        console.log(`✅ [SEGMIND] Caricature generated successfully - size: ${sizeMB} MB (attempt ${attempt})`);
        return { image: imageUrl, output: imageUrl, url: imageUrl };
      } else {
        const errorText = await response.text();
        const status = response.status;
        
        // Check if error is moderation blocked
        if (isModerationBlocked(errorText)) {
          console.warn('⚠️ [SEGMIND] Moderation blocked - image rejected by safety system');
          console.warn('⚠️ [SEGMIND] Error details:', errorText.substring(0, 500));
          throw createModerationError(`Segmind API error: ${status} - ${errorText}`);
        }
        
        // Retry only for server errors (5xx) and 502 Bad Gateway
        const isRetryable = status >= 500 || status === 502;
        
        if (isRetryable && attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff: 2s, 4s, 8s
          console.warn(`⚠️ [SEGMIND] Server error ${status} (attempt ${attempt}/${maxRetries}) - retrying in ${delay}ms...`);
          console.warn(`⚠️ [SEGMIND] Error details:`, errorText.substring(0, 200));
          lastError = new Error(`Segmind API error: ${status} - ${errorText}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry
        } else {
          // Non-retryable error or max retries reached
          console.error('❌ [SEGMIND] API Error:', status);
          console.error('❌ [SEGMIND] Error details:', errorText);
          throw new Error(`Segmind API error: ${status} - ${errorText}`);
        }
      }
    } catch (error) {
      // Network errors or aborted requests - retry if not max attempts
      if (error.name === 'AbortError' || (error.message && error.message.includes('fetch'))) {
        if (attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt - 1);
          console.warn(`⚠️ [SEGMIND] Network error (attempt ${attempt}/${maxRetries}) - retrying in ${delay}ms...`);
          lastError = error;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry
        }
      }
      
      // If it's the last attempt or non-retryable error, throw
      if (attempt === maxRetries) {
        console.error('❌ [SEGMIND] Caricature generation failed after all retries:', error);
        throw lastError || error;
      }
      
      lastError = error;
    }
  }

  // Should never reach here, but just in case
  throw lastError || new Error('Segmind caricature generation failed after all retries');
}

// Function to handle Segmind Faceswap v4
async function segmindFaceswap(targetImageUrl, swapImageBase64) {
  const SEGMIND_API_KEY = process.env.SEGMIND_API_KEY;
  
  console.log('🔑 [SEGMIND] Checking API key...', SEGMIND_API_KEY ? `Key present (${SEGMIND_API_KEY.substring(0, 10)}...)` : 'KEY MISSING!');
  
  if (!SEGMIND_API_KEY) {
    console.error('❌ [SEGMIND] SEGMIND_API_KEY not found in environment variables!');
    throw new Error('SEGMIND_API_KEY not configured');
  }

  console.log('🎭 [SEGMIND] Starting face-swap (synchronous)...');
  console.log('🎭 [SEGMIND] ===== TARGET IMAGE DEBUG =====');
  console.log('🎭 [SEGMIND] Target image URL:', targetImageUrl);
  console.log('🎭 [SEGMIND] Target image URL type:', typeof targetImageUrl);
  console.log('🎭 [SEGMIND] Target image URL length:', targetImageUrl?.length);
  console.log('🎭 [SEGMIND] Swap image (base64):', swapImageBase64.substring(0, 50) + '...');
  console.log('🎭 [SEGMIND] ==============================');

  // Convert target image URL to base64
  console.log('📥 [SEGMIND] Konwertuję target image URL na base64...');
  const targetImageBase64 = await urlToBase64(targetImageUrl);
  console.log('✅ [SEGMIND] Target image skonwertowany na base64:', {
    base64Length: targetImageBase64?.length,
    base64Preview: targetImageBase64?.substring(0, 50) + '...',
    originalUrl: targetImageUrl
  });

  // Remove data URI prefix if present (keep only base64 string)
  let cleanSwapImage = swapImageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
  
  // Light compression for Segmind API (max 1024px as per rules)
  console.log('🗜️ [SEGMIND] Compressing image for Segmind API...');
  const compressedImage = await compressImage(cleanSwapImage, 1024, 1024, 80); // Max 1024px, 80% quality
  cleanSwapImage = compressedImage.replace(/^data:image\/[a-z]+;base64,/, '');
  console.log('🗜️ [SEGMIND] Image compressed for Segmind API');
  
  console.log('🚀 [SEGMIND] Sending request to Segmind API...');
  console.log('🔑 [SEGMIND] Using API key:', SEGMIND_API_KEY.substring(0, 15) + '...');
  console.log('📦 [SEGMIND] Request payload size - source:', cleanSwapImage.length, 'target:', targetImageBase64.length);
  console.log('⏰ [SEGMIND] Starting request at:', new Date().toISOString());
  console.log('⏰ [SEGMIND] Vercel Pro timeout limit: 60 seconds, our timeout: 60 seconds');
  console.log('🔍 [VERCEL] Environment:', process.env.VERCEL_ENV);
  console.log('🔍 [VERCEL] Region:', process.env.VERCEL_REGION);
  console.log('🔍 [VERCEL] All Vercel env vars:', Object.keys(process.env).filter(k => k.startsWith('VERCEL')));
  console.log('🔍 [VERCEL] Function timeout check - starting at:', Date.now());

  const requestBody = {
    source_image: cleanSwapImage,      // Twarz użytkownika (źródło twarzy)
    target_image: targetImageBase64,   // Obraz króla (na co nakładamy twarz)
    model_type: "speed",               // 8 steps - szybko
    swap_type: "head",                 // Zamień całą głowę
    style_type: "normal",              // Zachowaj styl source
    seed: 42,
    image_format: "jpeg",
    image_quality: 90,
    hardware: "fast",
    base64: true                       // Zwróć jako base64
  };

  console.log('📋 [SEGMIND] Request body keys:', Object.keys(requestBody));

  const maxRetries = 3;
  const retryDelay = 2000; // 2 sekundy bazowego opóźnienia
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout to prevent 504 errors
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`⏰ [SEGMIND] Request timeout after 240 seconds (attempt ${attempt}/${maxRetries}) - aborting`);
        controller.abort();
      }, 240000); // 240 second timeout (Vercel Pro limit is 300s)

      console.log(`🔄 [SEGMIND] Attempt ${attempt}/${maxRetries}...`);
      
      const response = await fetch('https://api.segmind.com/v1/faceswap-v4', {
        method: 'POST',
        headers: {
          'x-api-key': SEGMIND_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log('📡 [SEGMIND] Response status:', response.status);
      console.log('📡 [SEGMIND] Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        // Segmind zwraca JSON z kluczem "image"
        const resultJson = await response.json();
        console.log(`✅ [SEGMIND] Face-swap completed! Response:`, Object.keys(resultJson), `(attempt ${attempt})`);
        
        const resultBase64 = resultJson.image;
        if (!resultBase64) {
          console.error('❌ [SEGMIND] No image in response:', resultJson);
          throw new Error('Segmind response missing image field');
        }
        
        console.log('✅ [SEGMIND] Extracted base64, length:', resultBase64.length, 'chars');
        console.log('🔍 [SEGMIND] Base64 preview (first 50 chars):', resultBase64.substring(0, 50));
        
        // Return as data URI for consistency
        return `data:image/jpeg;base64,${resultBase64}`;
      } else {
        const errorText = await response.text();
        const status = response.status;
        
        // Check if error is moderation blocked
        if (isModerationBlocked(errorText)) {
          console.warn('⚠️ [SEGMIND] Moderation blocked - image rejected by safety system');
          console.warn('⚠️ [SEGMIND] Error details:', errorText.substring(0, 500));
          throw createModerationError(`Segmind face-swap failed: ${status} - ${errorText}`);
        }
        
        // Retry only for server errors (5xx) and 502 Bad Gateway
        const isRetryable = status >= 500 || status === 502;
        
        if (isRetryable && attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff: 2s, 4s, 8s
          console.warn(`⚠️ [SEGMIND] Server error ${status} (attempt ${attempt}/${maxRetries}) - retrying in ${delay}ms...`);
          console.warn(`⚠️ [SEGMIND] Error details:`, errorText.substring(0, 200));
          lastError = new Error(`Segmind face-swap failed: ${status} - ${errorText}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry
        } else {
          // Non-retryable error or max retries reached
          console.error('❌ [SEGMIND] Face-swap failed:', status, errorText);
          throw new Error(`Segmind face-swap failed: ${status} - ${errorText}`);
        }
      }
    } catch (error) {
      // Network errors or aborted requests - retry if not max attempts
      if (error.name === 'AbortError' || (error.message && error.message.includes('fetch'))) {
        if (attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt - 1);
          console.warn(`⚠️ [SEGMIND] Network error (attempt ${attempt}/${maxRetries}) - retrying in ${delay}ms...`);
          lastError = error;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry
        }
      }
      
      // If it's the last attempt or non-retryable error, throw
      if (attempt === maxRetries) {
        console.error('❌ [SEGMIND] Face-swap failed after all retries:', error);
        throw lastError || error;
      }
      
      lastError = error;
    }
  }

  // Should never reach here, but just in case
  throw lastError || new Error('Segmind face-swap failed after all retries');
}

// Function to handle Segmind Become-Image (Watercolor style)
async function segmindBecomeImage(imageUrl, styleImageUrl, styleParameters = {}) {
  const SEGMIND_API_KEY = process.env.SEGMIND_API_KEY;
  
  console.log('🔑 [SEGMIND] Checking API key...', SEGMIND_API_KEY ? `Key present (${SEGMIND_API_KEY.substring(0, 10)}...)` : 'KEY MISSING!');
  
  if (!SEGMIND_API_KEY) {
    console.error('❌ [SEGMIND] SEGMIND_API_KEY not found in environment variables!');
    throw new Error('SEGMIND_API_KEY not configured');
  }

  const {
    prompt = "modern watercolor painting",
    prompt_strength = 3,
    number_of_images = 1,
    denoising_strength = 0.45,
    instant_id_strength = 0.5,
    control_depth_strength = 0.93,
    image_to_become_strength = 0.45,
    image_to_become_noise = 0.3,
    disable_safety_checker = true
  } = styleParameters || {};

  console.log('🎨 [SEGMIND] Starting become-image (watercolor)...');
  console.log('🎨 [SEGMIND] Person image URL:', imageUrl);
  console.log('🎨 [SEGMIND] Style image URL:', styleImageUrl);
  console.log('🛠️ [SEGMIND] Parameters:', {
    prompt,
    prompt_strength,
    number_of_images,
    denoising_strength,
    instant_id_strength,
    control_depth_strength,
    image_to_become_strength,
    image_to_become_noise,
    disable_safety_checker
  });

  let styleImagePayload = styleImageUrl;
  if (styleImageUrl && typeof styleImageUrl === 'string' && styleImageUrl.startsWith('http')) {
    console.log('🎨 [SEGMIND] Using provided style image URL without modifications');
    styleImagePayload = styleImageUrl;
  } else {
    console.warn('⚠️ [SEGMIND] Style image URL is not an absolute URL - passing as-is');
  }

  const maxRetries = 3;
  const retryDelay = 2000; // 2 sekundy bazowego opóźnienia
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`⏰ [SEGMIND] Request timeout after 120 seconds (attempt ${attempt}/${maxRetries}) - aborting`);
        controller.abort();
      }, 120000); // 120 second timeout

      console.log(`🔄 [SEGMIND] Attempt ${attempt}/${maxRetries}...`);

      const response = await fetch('https://api.segmind.com/v1/become-image', {
        method: 'POST',
        headers: {
          'x-api-key': SEGMIND_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageUrl,              // URL zdjęcia użytkownika
          image_to_become: styleImagePayload, // Obraz stylu (base64 lub URL)
          prompt,
          prompt_strength,
          number_of_images,
          denoising_strength,
          instant_id_strength,
          image_to_become_strength,
          image_to_become_noise,
          control_depth_strength,
          disable_safety_checker
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        console.log('📦 [SEGMIND] Response content-type:', contentType);

        if (contentType.includes('application/json')) {
          const result = await response.json();
          console.log(`✅ [SEGMIND] Become-image completed successfully (JSON) (attempt ${attempt})`);
          console.log('📋 [SEGMIND] Response keys:', Object.keys(result));
          
          if (result.image) {
            return result.image;
          } else if (result.images && Array.isArray(result.images) && result.images.length > 0) {
            return result.images[0];
          } else if (result.output) {
            return result.output;
          } else {
            console.error('❌ [SEGMIND] No image in JSON response:', result);
            throw new Error('No image in Segmind JSON response');
          }
        }

        // Binary response (image/png, image/jpeg, etc.)
        console.log('🖼️ [SEGMIND] Binary response detected, converting to data URI');
        const imageBuffer = await response.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const mimeType = contentType || 'image/png';
        const dataUri = `data:${mimeType};base64,${base64Image}`;
        return dataUri;
      } else {
        const errorText = await response.text();
        const status = response.status;
        
        // Check if error is moderation blocked
        if (isModerationBlocked(errorText)) {
          console.warn('⚠️ [SEGMIND] Moderation blocked - image rejected by safety system');
          console.warn('⚠️ [SEGMIND] Error details:', errorText.substring(0, 500));
          throw createModerationError(`Segmind API error: ${status} - ${errorText}`);
        }
        
        // Retry only for server errors (5xx) and 502 Bad Gateway
        const isRetryable = status >= 500 || status === 502;
        
        if (isRetryable && attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff: 2s, 4s, 8s
          console.warn(`⚠️ [SEGMIND] Server error ${status} (attempt ${attempt}/${maxRetries}) - retrying in ${delay}ms...`);
          console.warn(`⚠️ [SEGMIND] Error details:`, errorText.substring(0, 200));
          lastError = new Error(`Segmind API error: ${status} - ${errorText}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry
        } else {
          // Non-retryable error or max retries reached
          console.error('❌ [SEGMIND] API Error:', status);
          console.error('❌ [SEGMIND] Error details:', errorText);
          throw new Error(`Segmind API error: ${status} - ${errorText}`);
        }
      }
    } catch (error) {
      // Network errors or aborted requests - retry if not max attempts
      if (error.name === 'AbortError' || (error.message && error.message.includes('fetch'))) {
        if (attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt - 1);
          console.warn(`⚠️ [SEGMIND] Network error (attempt ${attempt}/${maxRetries}) - retrying in ${delay}ms...`);
          lastError = error;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry
        }
      }
      
      // If it's the last attempt or non-retryable error, throw
      if (attempt === maxRetries) {
        console.error('❌ [SEGMIND] Become-image failed after all retries:', error);
        throw lastError || error;
      }
      
      lastError = error;
    }
  }

  // Should never reach here, but just in case
  throw lastError || new Error('Segmind become-image failed after all retries');
}

// Function to handle OpenAI DALL-E 3 API
async function openaiImageGeneration(prompt, parameters = {}) {
  if (!openai) {
    console.error('❌ [OPENAI] OpenAI not initialized - missing OPENAI_API_KEY');
    throw new Error('OPENAI_API_KEY not configured - please add it to Vercel environment variables');
  }

  const {
    model = 'gpt-image-1',
    size = '1024x1536', // Portrait (pionowy portret)
    quality = 'auto', // Auto quality
    style = 'vivid',
    output_format = 'jpg', // JPG format
    background = 'opaque', // Nieprzezroczyste tło
    fidelity = 'low', // Niska wierność (szybsze generowanie)
    n = 1
  } = parameters;

  console.log('🎨 [OPENAI] Starting GPT-Image-1 image generation...');
  console.log('🎨 [OPENAI] Prompt:', prompt.substring(0, 100) + '...');
      console.log('🛠️ [OPENAI] Parameters:', {
        model,
        size,
        quality,
        style,
        output_format,
        background,
        fidelity,
        n
      });

  const maxRetries = 3;
  const retryDelay = 2000; // 2 sekundy bazowego opóźnienia
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`⏰ [OPENAI] Request timeout after 60 seconds (attempt ${attempt}/${maxRetries}) - aborting`);
        controller.abort();
      }, 60000); // 60 second timeout

      console.log(`🔄 [OPENAI] Attempt ${attempt}/${maxRetries}...`);

      const response = await openai.images.generate({
        model: model,
        prompt: prompt,
        n: n,
        size: size,
        quality: quality,
        style: style,
        output_format: output_format, // JPG format
        background: background, // Opaque background
        fidelity: fidelity, // Low fidelity (faster generation)
        response_format: 'url' // Zwracamy URL, nie base64
      });

      clearTimeout(timeoutId);

      if (response && response.data && response.data.length > 0) {
        const imageUrl = response.data[0].url;
        console.log(`✅ [OPENAI] Image generated successfully (attempt ${attempt})`);
        console.log(`📸 [OPENAI] Image URL: ${imageUrl.substring(0, 50)}...`);
        return { image: imageUrl, output: imageUrl, url: imageUrl };
      } else {
        throw new Error('No image in OpenAI response');
      }
    } catch (error) {
      // Check if error is retryable (5xx server errors or rate limits)
      const isRetryable = 
        (error.status >= 500) ||
        (error.status === 429) || // Rate limit
        (error.message && (
          error.message.includes('500') ||
          error.message.includes('502') ||
          error.message.includes('503') ||
          error.message.includes('504') ||
          error.message.includes('rate limit') ||
          error.message.includes('timeout')
        ));

      if (isRetryable && attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff: 2s, 4s, 8s
        console.warn(`⚠️ [OPENAI] Server error (attempt ${attempt}/${maxRetries}) - retrying in ${delay}ms...`);
        console.warn(`⚠️ [OPENAI] Error details:`, error.message?.substring(0, 200) || error.toString());
        lastError = error;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue; // Retry
      } else {
        // Non-retryable error or max retries reached
        console.error('❌ [OPENAI] API Error:', error.status || error.code);
        console.error('❌ [OPENAI] Error details:', error.message);
        throw error;
      }
    }
  }

  // Should never reach here, but just in case
  throw lastError || new Error('OpenAI image generation failed after all retries');
}

// Function to compress and resize images for SDXL models
async function compressImage(imageData, maxWidth = 1152, maxHeight = 1152, quality = 85) {
  if (!sharp) {
    console.log('Sharp not available, returning original image');
    return imageData;
  }
  
  try {
    console.log('Starting image compression for SDXL...');
    const buffer = Buffer.from(imageData, 'base64');
    console.log(`Original image size: ${buffer.length} bytes (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
    
    // Get image metadata to determine optimal SDXL resolution
    const metadata = await sharp(buffer).metadata();
    const { width, height } = metadata;
    console.log(`Original dimensions: ${width}x${height}`);
    
    // Calculate optimal resolution based on aspect ratio (A4 format: 3:4 or 4:3)
    let targetWidth, targetHeight;
    const aspectRatio = width / height;
    
    if (aspectRatio >= 1.0) {
      // Landscape or square - use 4:3 format (1152x896)
      targetWidth = 1152;
      targetHeight = 896;
    } else {
      // Portrait - use 3:4 format (896x1152)
      targetWidth = 896;
      targetHeight = 1152;
    }
    
    console.log(`SDXL optimal resolution: ${targetWidth}x${targetHeight} (aspect ratio: ${aspectRatio.toFixed(2)})`);
    
    // Check if image is already compressed by frontend (avoid double compression)
    const isAlreadyCompressed = (metadata.width <= 1024 && metadata.height <= 1024);
    if (isAlreadyCompressed) {
      console.log('📱 [COMPRESSION] Image already compressed by frontend, using as-is');
      return imageData; // Return original without further compression
    }
    
    console.log('🔧 [COMPRESSION] Backend fine-tuning to SDXL dimensions');
    
    const compressedBuffer = await sharp(buffer)
      .resize(targetWidth, targetHeight, {
        fit: 'inside',
        withoutEnlargement: true, // Nie powiększaj jeśli już jest mniejszy (np. z frontend)
        background: { r: 255, g: 255, b: 255, alpha: 1 } // White background for padding
      })
      .jpeg({ 
        quality: quality,
        progressive: true,
        mozjpeg: true // Lepsza kompresja JPEG
      })
      .withMetadata(false) // Usuń metadane EXIF (prywatność + mniejszy plik)
      .toBuffer();
    
    console.log(`Compressed image size: ${compressedBuffer.length} bytes (${(compressedBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`Compression ratio: ${((1 - compressedBuffer.length / buffer.length) * 100).toFixed(1)}% reduction`);
    return compressedBuffer.toString('base64');
  } catch (error) {
    console.error('Image compression error:', error);
    console.log('Sharp compression failed, trying fallback method...');
    
    // Fallback: return original image without compression
    try {
      const buffer = Buffer.from(imageData, 'base64');
      console.log('Using original image without compression');
      return imageData;
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw new Error('Image processing failed completely');
    }
  }
}

module.exports = async (req, res) => {
  console.log(`🚀 [TRANSFORM] API called - Method: ${req.method}, Version: ${VERSION_TAG}, Headers:`, req.headers);
  
  // Set CORS headers - explicit origins for better security
  const allowedOrigins = [
    'https://lumly.pl',
    'https://customify-s56o.vercel.app',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Preflight dla CORS – zwróć 200 zanim wykonamy limity itp.
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Zmienna do identyfikacji użytkownika ustawiana później z body/GraphQL
  let customerId = null;
  // Device token z cookies (ustawiany niżej) – potrzebny też w early-returnach
  let deviceToken = null;

  // RATE LIMITING - Sprawdź limit dla kosztownych operacji AI
  const rawIp = getClientIP(req);
  const ip = rawIp ? rawIp.split(',')[0].trim() : '';
  console.log(`🔍 [TRANSFORM] Request from IP: ${ip || rawIp}, Method: ${req.method}`);

  if (ip && BLOCKED_IPS.has(ip)) {
    console.warn(`⛔ [TRANSFORM] IP ${ip} jest zablokowane - odrzucam żądanie`);
    return res.status(403).json({
      error: 'Access denied',
      message: 'Twoje IP zostało tymczasowo zablokowane.'
    });
  }
  
  // ✅ TWARDY LIMIT DZIENNY: 10 prób na IP w ciągu 24h (dla wszystkich - chroni przed wieloma kontami)
  // Używa Vercel KV z atomic operations (trwałe, nie resetuje się)
  // ⚠️ BIAŁA LISTA: Admin/Development IP pomijają limit
  if (ip && WHITELISTED_IPS.has(ip)) {
    console.log(`✅ [TRANSFORM] IP ${ip} na białej liście - pomijam IP limit`);
  } else if (isKVConfigured()) {
    const ipLimitCheck = await checkIPLimit(ip);
    if (!ipLimitCheck.allowed) {
      console.log(`❌ [TRANSFORM] Daily IP limit exceeded: ${ip} (${ipLimitCheck.count}/${ipLimitCheck.limit})`);
      
      // ✅ TRACKING: Zapisuj błąd (asynchronicznie, nie blokuje)
      const userStatus = customerId ? 'logged_in' : 'not_logged_in';
      trackError('ip_limit', userStatus, deviceToken, ip, {
        count: ipLimitCheck.count,
        limit: ipLimitCheck.limit
      });
      
      return res.status(403).json({
        error: 'Usage limit exceeded',
        message: `Wykorzystałeś limit generacji (${ipLimitCheck.count}/${ipLimitCheck.limit}). Spróbuj jutro.`,
        showLoginModal: false,
        count: ipLimitCheck.count,
        limit: ipLimitCheck.limit
      });
    }
    console.log(`✅ [TRANSFORM] IP limit OK: ${ipLimitCheck.count}/${ipLimitCheck.limit} for IP: ${ip}`);
  } else {
    console.warn('⚠️ [TRANSFORM] KV not configured - skipping IP limit check');
    // Fallback: jeśli KV nie jest skonfigurowany, pozwól (ale zalecamy konfigurację)
  }

  const parseCookies = (cookieHeader = '') => {
    return cookieHeader.split(';').reduce((acc, chunk) => {
      const trimmed = chunk.trim();
      if (!trimmed) return acc;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) return acc;
      const key = trimmed.substring(0, eqIndex).trim();
      const value = trimmed.substring(eqIndex + 1).trim();
      if (!key) return acc;
      acc[key] = decodeURIComponent(value || '');
      return acc;
    }, {});
  };

  const DEVICE_COOKIE_NAME = 'customify_device_token';
  const cookies = parseCookies(req.headers.cookie || '');
  deviceToken = cookies[DEVICE_COOKIE_NAME];
  
  console.log(`🍪 [TRANSFORM] Device token check:`, {
    hasCookie: !!deviceToken,
    cookieValue: deviceToken ? deviceToken.substring(0, 8) + '...' : null,
    cookieHeader: req.headers.cookie ? req.headers.cookie.substring(0, 100) + '...' : 'brak',
    userAgent: req.headers['user-agent']?.substring(0, 50) || 'brak'
  });
  
  if (!deviceToken) {
    deviceToken = crypto.randomBytes(16).toString('hex');
    const oneYearSeconds = 60 * 60 * 24 * 365;
    const cookieParts = [
      `${DEVICE_COOKIE_NAME}=${encodeURIComponent(deviceToken)}`,
      'Path=/',
      `Max-Age=${oneYearSeconds}`,
      'HttpOnly',
      'Secure',
      'SameSite=None'
    ];
    const newCookie = cookieParts.join('; ');
    const existingSetCookie = res.getHeader('Set-Cookie');
    if (existingSetCookie) {
      if (Array.isArray(existingSetCookie)) {
        res.setHeader('Set-Cookie', [...existingSetCookie, newCookie]);
      } else {
        res.setHeader('Set-Cookie', [existingSetCookie, newCookie]);
      }
    } else {
      res.setHeader('Set-Cookie', newCookie);
    }
    console.log(`🍪 [TRANSFORM] Generated NEW device token: ${deviceToken.substring(0, 8)}... (brak cookie w request)`);
  } else {
    console.log(`🍪 [TRANSFORM] Existing device token detected: ${deviceToken.substring(0, 8)}...`);
  }

  const hashIp = (rawIp, tokenValue) => {
    const ipToUse = rawIp || 'unknown';
    const salt = process.env.CUSTOMIFY_IP_HASH_SALT || 'customify_ip_salt_2025';
    return crypto.createHash('sha256').update(`${ipToUse}::${tokenValue || ''}::${salt}`).digest('hex');
  };

  const ipHash = hashIp(ip, deviceToken);
  console.log(`🔐 [TRANSFORM] IP hash preview: ${ipHash.substring(0, 12)}...`);

  if (req.method === 'OPTIONS') {
    console.log(`✅ [TRANSFORM] OPTIONS request handled for IP: ${ip}`);
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    console.log(`❌ [TRANSFORM] Invalid method: ${req.method} for IP: ${ip}`);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  console.log(`📝 [TRANSFORM] POST request processing for IP: ${ip}`);

  // ✅ ZMIENNA DO PRZECHOWYWANIA EMAIL Z GRAPHQL (NA SAMYM POCZĄTKU FUNKCJI)
  // customerEmailFromGraphQL będzie ustawiony w bloku if (customerId), ale potrzebujemy go zdefiniować wcześniej
  let customerEmailFromGraphQL = null;

  try {
    const { imageData, prompt, style, productType, customerId: bodyCustomerId, email, productHandle } = req.body;
    if (bodyCustomerId !== undefined && bodyCustomerId !== null) {
      customerId = bodyCustomerId;
    }
    // ✅ EMAIL: Tylko dla niezalogowanych - używany do powiązania generacji z użytkownikiem w save-generation
    // ❌ USUNIĘTO: customerAccessToken - nie jest używany, API używa SHOPIFY_ACCESS_TOKEN z env
    // ❌ USUNIĘTO: watermarkedImage - watermark jest generowany PO transformacji AI w frontendzie

    // ✅ DEBUG: Pokaż dokładnie co przyszło w request body
    console.log('📥 [API] ===== REQUEST BODY OTRZYMANY =====');
    console.log('📥 [API] hasImageData:', !!imageData);
    console.log('📥 [API] imageDataLength:', imageData?.length || 0);
    console.log('📥 [API] prompt:', prompt);
    console.log('📥 [API] style (z request body):', style, typeof style);
    console.log('📥 [API] style === undefined:', style === undefined);
    console.log('📥 [API] style === null:', style === null);
    console.log('📥 [API] productType:', productType);
    console.log('📥 [API] customerId:', customerId || 'niezalogowany');
    console.log('📥 [API] productHandle:', productHandle || 'not provided');
    console.log('📥 [API] ===================================');

    // 🔄 Prompt może być pusty w body – używamy promptu z konfiguracji stylu
    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }
    
    // 🧪 BYPASS: Sprawdź czy użytkownik jest na liście testowej (przed wszystkimi limitami)
    // ✅ Email używany tylko do test bypass (dla zalogowanych można sprawdzić przez customerId)
    // ⚠️ Zaktualizujemy isTest po pobraniu email z GraphQL (dla zalogowanych)
    let isTest = isTestUser(email || null, ip);
    
    console.log(`🎯 [TRANSFORM] Product type: ${productType || 'not specified'}`);
    console.log(`🎯 [TRANSFORM] Style: ${style || prompt || 'not specified'}`);
    console.log(`👤 [TRANSFORM] Customer ID: ${customerId || 'not logged in'}`);
    if (isTest) {
      console.log(`🧪 [TEST-BYPASS] Test user detected - wszystkie limity pomijane`);
    }

    // ✅ SPRAWDZENIE LIMITÓW UŻYCIA PRZED TRANSFORMACJĄ (przeniesione po finalProductType)

    if (!replicate) {
      return res.status(400).json({ error: 'Replicate API token not configured' });
    }

    // Test authentication (simplified - just check if replicate is initialized)
    console.log(`🔐 [REPLICATE] Ready to process with token: ${process.env.REPLICATE_API_TOKEN ? 'configured' : 'missing'}`);

    // Compress image before sending to Replicate (avoid double compression)
    console.log('Compressing image before AI processing...');
    const compressedImageData = await compressImage(imageData, 1024, 1024, 80);
    console.log(`Image compressed: ${imageData.length} -> ${compressedImageData.length} bytes`);
    
    // Convert compressed base64 to Data URI for Replicate (required format)
    // 🚨 FIX: Dynamicznie wykryj format - Sharp zwraca JPEG, oryginalny może być PNG/JPEG/etc
    let mimeType;
    if (compressedImageData === imageData) {
      // Sharp nie działał - użyj oryginalnego formatu (prawdopodobnie PNG z frontend)
      mimeType = 'image/png';
      console.log('🔍 [FORMAT] Using original format (PNG) - Sharp unavailable');
    } else {
      // Sharp zadziałał - użyj JPEG (format z kompresji Sharp)
      mimeType = 'image/jpeg';
      console.log('🔍 [FORMAT] Using JPEG format - Sharp compressed');
    }
    const imageDataUri = `data:${mimeType};base64,${compressedImageData}`;

    // Use Replicate for AI image transformation with different models based on style
    
    // Map styles to appropriate models and parameters
    const styleConfig = {
      'watercolor': {
        model: "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
        prompt: `watercolor painting, ${prompt}, soft colors, flowing brushstrokes, artistic, delicate`,
        productType: "watercolor_stable", // ✅ Unikalny productType dla stylu Watercolor (Stable Diffusion) - różny od "akwarela" (Segmind)
        guidance_scale: 7.5,
        num_inference_steps: 50,
        strength: 0.8
      },
      'zamkowy': {
        model: "google/nano-banana",
        prompt: "Dress the couple in refined royal attire inspired by European monarchy. The man wears an elegant royal ceremonial outfit with ornate gold embroidery, a dark tailored coat, a decorative sash and subtle regal details. The woman wears a luxurious royal ball gown with flowing fabric, pearl or gold embellishments, and delicate majestic accents. Their outfits must look high-class, tasteful and historically inspired, but clean and premium — not theatrical or cartoonish. Frame the couple in a tight waist-up portrait. This is a close, zoomed-in portrait composition. Show them ONLY from the waist upward. Do NOT show full bodies. Do NOT show legs, hips or anything below the waist. Lower body parts do NOT exist in this image. The framing must be tight around the upper body so the faces appear large and clearly visible. Place them outdoors on a green garden lawn on a sunny day, with a large European-style palace or castle visible in the background.",
        apiType: "nano-banana",
        productType: "para_krolewska",
        parameters: {
          image_input: ["USER_IMAGE"],
          prompt: "Dress the couple in refined royal attire inspired by European monarchy. The man wears an elegant royal ceremonial outfit with ornate gold embroidery, a dark tailored coat, a decorative sash and subtle regal details. The woman wears a luxurious royal ball gown with flowing fabric, pearl or gold embellishments, and delicate majestic accents. Their outfits must look high-class, tasteful and historically inspired, but clean and premium — not theatrical or cartoonish. Frame the couple in a tight waist-up portrait. This is a close, zoomed-in portrait composition. Show them ONLY from the waist upward. Do NOT show full bodies. Do NOT show legs, hips or anything below the waist. Lower body parts do NOT exist in this image. The framing must be tight around the upper body so the faces appear large and clearly visible. Place them outdoors on a green garden lawn on a sunny day, with a large European-style palace or castle visible in the background.",
          aspect_ratio: "2:3",
          output_format: "jpg",
          guidance: 3.5
        }
      },
      'krolewski-para': {
        model: "google/nano-banana",
        prompt: "Preserve the exact facial identity of the two people from the provided photo. Make a faceswap and keep the original hair style and colour. Faces must look exactly like the people in the input image, with realistic likeness. Dress the couple in full ceremonial royal attire inspired by European imperial royalty. The man wears a richly decorated royal ceremonial uniform with heavy gold embroidery, ornate patterns, medals, epaulettes, a dark tailored coat and a majestic golden crown. The woman wears an opulent royal gown in deep luxurious colours such as ruby or burgundy, with gold embellishments, velvet or fur-trimmed elements, elegant jewelry and a regal golden crown. Their outfits must look majestic, premium and noble — impressive, luxurious and ceremonial, but not theatrical or cartoonish. Both people should be holding elegant royal-style drinks, such as crystal goblets, premium cocktails or ceremonial glasses, in a celebratory pose. Frame the couple in a tight waist-up portrait. This is a close, zoomed-in portrait composition. Show them ONLY from the waist upward. Lower body parts do not exist. Do NOT show full bodies or anything below the waist. The framing must be tight so the faces appear large and clearly visible. Place them outdoors in front of a grand European ceremonial palace or castle on a sunny day. Use warm, golden sunlight to create an elegant, majestic royal atmosphere.",
        apiType: "nano-banana",
        productType: "para_krolewska",
        parameters: {
          image_input: ["USER_IMAGE"],
          prompt: "Preserve the exact facial identity of the two people from the provided photo. Make a faceswap and keep the original hair style and colour. Faces must look exactly like the people in the input image, with realistic likeness. Dress the couple in full ceremonial royal attire inspired by European imperial royalty. The man wears a richly decorated royal ceremonial uniform with heavy gold embroidery, ornate patterns, medals, epaulettes, a dark tailored coat and a majestic golden crown. The woman wears an opulent royal gown in deep luxurious colours such as ruby or burgundy, with gold embellishments, velvet or fur-trimmed elements, elegant jewelry and a regal golden crown. Their outfits must look majestic, premium and noble — impressive, luxurious and ceremonial, but not theatrical or cartoonish. Both people should be holding elegant royal-style drinks, such as crystal goblets, premium cocktails or ceremonial glasses, in a celebratory pose. Frame the couple in a tight waist-up portrait. This is a close, zoomed-in portrait composition. Show them ONLY from the waist upward. Lower body parts do not exist. Do NOT show full bodies or anything below the waist. The framing must be tight so the faces appear large and clearly visible. Place them outdoors in front of a grand European ceremonial palace or castle on a sunny day. Use warm, golden sunlight to create an elegant, majestic royal atmosphere.",
          aspect_ratio: "2:3",
          output_format: "jpg",
          guidance: 3.5
        }
      },
      'watercolor_ok': {
        model: "google/nano-banana",
        prompt: " Transform the uploaded photo into a vibrant watercolor illustration. Preserve dynamic poses and expressive gestures, but render them with visible watercolor splashes, paint stains, and flowing drips. Use a bright, harmonious color palette with soft blending and translucent layers. Create a background with larger, irregular watercolor blobs and patches, giving the composition a lively, fluid, and painterly feel. Keep characters recognizable but stylized with soft outlines and artistic splashes",
        apiType: "nano-banana",
        productType: "caricature-new",
        parameters: {
          image_input: ["USER_IMAGE"],
          prompt: " Transform the uploaded photo into a vibrant watercolor illustration. Preserve dynamic poses and expressive gestures, but render them with visible watercolor splashes, paint stains, and flowing drips. Use a bright, harmonious color palette with soft blending and translucent layers. Create a background with larger, irregular watercolor blobs and patches, giving the composition a lively, fluid, and painterly feel. Keep characters recognizable but stylized with soft outlines and artistic splashes",
          aspect_ratio: "2:3",
          output_format: "jpg",
          guidance: 3.5
        }
      },
      'swieta': {
        model: "google/nano-banana",
        prompt: "Create a soft, realistic illustration based on the people in the uploaded photo. Keep their faces highly accurate and recognizable — same facial features, proportions, hair, and expressions. The illustration should remain close to a real photo, with only gentle artistic softness — NOT cartoon-like.\n\nDress all people in cozy Christmas clothing: knitted holiday sweaters, warm winter scarves, and soft woolen hats in festive colors (red, white, beige, green). Clothing should look natural and textured.\n\nPlace the family inside a transparent glass Christmas bauble hanging visibly from a branch of a decorated Christmas tree. Ensure the hanging string and attachment at the top are clearly visible. The bauble should have realistic reflections, delicate golden glitter, and subtle snowflake decorations on the glass. Add some snow inside the ornament and a small layer of white snow under their feet.\n\nAdd the text “Wesołych Świąt” in an elegant, festive font, placed either on the bauble or gently above/below it, well-integrated into the composition.\n\nLighting: warm golden Christmas glow. Background: blurred tree lights (bokeh), cozy and festive.\n\nStyle: realistic illustration, natural colors, detailed textures, warm holiday atmosphere, strong likeness to the original faces. Avoid cartoon or Pixar stylization.\n\nHigh resolution, clean, elegant, detailed.",
        apiType: "nano-banana",
        productType: "caricature-new",
        parameters: {
          image_input: ["USER_IMAGE"],
          prompt: "Create a soft, realistic illustration based on the people in the uploaded photo. Keep their faces highly accurate and recognizable — same facial features, proportions, hair, and expressions. The illustration should remain close to a real photo, with only gentle artistic softness — NOT cartoon-like.\n\nDress all people in cozy Christmas clothing: knitted holiday sweaters, warm winter scarves, and soft woolen hats in festive colors (red, white, beige, green). Clothing should look natural and textured.\n\nPlace the family inside a transparent glass Christmas bauble hanging visibly from a branch of a decorated Christmas tree. Ensure the hanging string and attachment at the top are clearly visible. The bauble should have realistic reflections, delicate golden glitter, and subtle snowflake decorations on the glass. Add some snow inside the ornament and a small layer of white snow under their feet.\n\nAdd the text “Wesołych Świąt” in an elegant, festive font, placed either on the bauble or gently above/below it, well-integrated into the composition.\n\nLighting: warm golden Christmas glow. Background: blurred tree lights (bokeh), cozy and festive.\n\nStyle: realistic illustration, natural colors, detailed textures, warm holiday atmosphere, strong likeness to the original faces. Avoid cartoon or Pixar stylization.\n\nHigh resolution, clean, elegant, detailed.",
          aspect_ratio: "2:3",
          output_format: "jpg",
          guidance: 3.5
        }
      },
      'swieta_2': {
        model: "google/nano-banana",
        prompt: "christmass cheer. keep all person on photo, keep faces recognizable. add them christmas sweaters, scurfs, hats, snow on the ground nad everywhere and lights. Add the text “Wesołych Świąt” in an elegant, festive font, placed gently above/below it, well-integrated into the composition.\n\nLighting: warm golden Christmas glow. Background: blurred tree lights (bokeh), cozy and festive.",
        apiType: "nano-banana",
        productType: "caricature-new",
        parameters: {
          image_input: ["USER_IMAGE"],
          prompt: "christmass cheer. keep all person on photo, keep faces recognizable. add them christmas sweaters, scurfs, hats, snow on the ground nad everywhere and lights. Add the text “Wesołych Świąt” in an elegant, festive font, placed gently above/below it, well-integrated into the composition.\n\nLighting: warm golden Christmas glow. Background: blurred tree lights (bokeh), cozy and festive.",
          aspect_ratio: "2:3",
          output_format: "jpg",
          guidance: 3.5
        }
      },
      'pixar': {
        model: "swartype/sdxl-pixar:81f8bbd3463056c8521eb528feb10509cc1385e2fabef590747f159848589048",
        prompt: `Pixar-style 3D character, cinematic animation look, smooth glossy plastic-like skin, rounded soft facial features, expressive eyes, stylized proportions, vibrant color palette, warm cinematic lighting, subsurface scattering, cartoon realism, wholesome family atmosphere, detailed hair, ultra clean render, rendered in 3D, dynamic camera angle, looks like a frame from a Pixar movie, perfect anatomy, depth of field, bokeh background, high quality render. realistic Pixar cinematic render, detailed textures, global illumination`,
        negative_prompt: "logo, brand, noisy, sloppy, messy, grainy, extra arms, extra legs, extra hands, extra fingers, mutated hands, malformed limbs, deformed body, disfigured, missing fingers, too many fingers, long fingers, extra limb, extra body parts, bad anatomy, fused fingers, disconnected limbs, broken limbs, distorted limbs, cloned body, duplicate body, extra head, ugly hands, bad hands, incorrect limb proportions, unnatural pose, low quality, lowres, blurry",
        productType: "pixar", // ✅ Unikalny productType dla stylu Pixar (zamiast "other")
        task: "img2img",
        scheduler: "KarrasDPM",
        guidance_scale: 9.01,
        prompt_strength: 0.55,
        num_inference_steps: 50,
        width: 1024,
        height: 1536,
        refine: "no_refiner",
        high_noise_frac: 0.7,
        output_format: "png",
        disable_safety_checker: true
      },
      // Style kotów - używają nano-banana z 2 obrazkami
      'krolewski': {
        model: "google/nano-banana",
        prompt: "Analyze and identify the exact breed characteristics, face shape, eye setting, and cheek fur texture of the cat in the second image. Transform the entire scene into the style of the first image (e.g., highly detailed oil painting). Generate the new image using the cat's head and face from the second image. It is critical to absolutely preserve the unique, identified facial features of the cat (snout shape, eyes, ear set, cheek structure) while adapting to the new style. Ensure the headwear from the first image is perfectly integrated and complements the cat's head",
        apiType: "nano-banana",
        productType: "cats", // Identyfikator typu produktu
        parameters: {
          image_input: ["https://customify-s56o.vercel.app/koty/krolewski.png", "USER_IMAGE"],
          aspect_ratio: "3:4", // Portret pionowy dla druku A3/A2/A1
          output_format: "jpg",
          guidance: 10 // Testowa wartość
        }
      },
      'na-tronie': {
        model: "google/nano-banana", 
        prompt: "Analyze and identify the exact breed characteristics, face shape, eye setting, and cheek fur texture of the cat in the second image. Transform the entire scene into the style of the first image (e.g., highly detailed oil painting). Generate the new image using the cat's head and face from the second image. It is critical to absolutely preserve the unique, identified facial features of the cat (snout shape, eyes, ear set, cheek structure) while adapting to the new style. Ensure the headwear from the first image is perfectly integrated and complements the cat's head",
        apiType: "nano-banana",
        productType: "cats", // Identyfikator typu produktu
        parameters: {
          image_input: ["https://customify-s56o.vercel.app/koty/na_tronie.png", "USER_IMAGE"],
          aspect_ratio: "3:4", // Portret pionowy dla druku A3/A2/A1
          output_format: "jpg",
          guidance: 10 // Testowa wartość
        }
      },
      'wojenny': {
        model: "google/nano-banana",
        prompt: "Analyze and identify the exact breed characteristics, face shape, eye setting, and cheek fur texture of the cat in the second image. Transform the entire scene into the style of the first image (e.g., highly detailed oil painting). Generate the new image using the cat's head and face from the second image. It is critical to absolutely preserve the unique, identified facial features of the cat (snout shape, eyes, ear set, cheek structure) while adapting to the new style. Ensure the headwear from the first image is perfectly integrated and complements the cat's head",
        apiType: "nano-banana",
        productType: "cats", // Identyfikator typu produktu
        parameters: {
          image_input: ["https://customify-s56o.vercel.app/koty/wojenny.png", "USER_IMAGE"],
          aspect_ratio: "3:4", // Portret pionowy dla druku A3/A2/A1
          output_format: "jpg",
          guidance: 10 // Testowa wartość
        }
      },
      'wiktorianski': {
        model: "google/nano-banana",
        prompt: "Analyze and identify the exact breed characteristics, face shape, eye setting, and cheek fur texture of the cat in the second image. Transform the entire scene into the style of the first image (e.g., highly detailed oil painting). Generate the new image using the cat's head and face from the second image. It is critical to absolutely preserve the unique, identified facial features of the cat (snout shape, eyes, ear set, cheek structure) while adapting to the new style. Ensure the headwear from the first image is perfectly integrated and complements the cat's head",
        apiType: "nano-banana",
        productType: "cats", // Identyfikator typu produktu
        parameters: {
          image_input: ["https://customify-s56o.vercel.app/koty/wiktorianski.png", "USER_IMAGE"],
          aspect_ratio: "3:4", // Portret pionowy dla druku A3/A2/A1
          output_format: "jpg",
          guidance: 10 // Testowa wartość
        }
      },
      'renesansowy': {
        model: "google/nano-banana",
        prompt: "Analyze and identify the exact breed characteristics, face shape, eye setting, and cheek fur texture of the cat in the second image. Transform the entire scene into the style of the first image (e.g., highly detailed oil painting). Generate the new image using the cat's head and face from the second image. It is critical to absolutely preserve the unique, identified facial features of the cat (snout shape, eyes, ear set, cheek structure) while adapting to the new style. Ensure the headwear from the first image is perfectly integrated and complements the cat's head",
        apiType: "nano-banana",
        productType: "cats", // Identyfikator typu produktu
        parameters: {
          image_input: ["https://customify-s56o.vercel.app/koty/renesansowy.png", "USER_IMAGE"],
          aspect_ratio: "3:4", // Portret pionowy dla druku A3/A2/A1
          output_format: "jpg",
          guidance: 10 // Testowa wartość
        }
      },
      // Style boho - używają nano-banana z 1 obrazkiem (tylko użytkownika)
      'minimalistyczny': {
        model: "google/nano-banana",
        prompt: "Create a very minimalist portrait illustration based on the uploaded photo of people. Apply a style with smooth pastel tones, clean shapes, subtle flat shading, no outlines. For the faces of all individuals (for the faces of all individuals): Featureless mid-face (featureless mid-face) with omitted eyes and nose (eyes and nose omitted). Crucially, ensure every person has distinct and prominent eyebrows and a clearly defined mouth. Hair should be detailed hair. Background is bright warm beige background (#E9D6C6). The overall impression should be an elegant and warm emotional atmosphere, trendy Etsy-style portrait.",
        negative_prompt: "eyes, nose, naturalistic eyes, realistic nose, detailed eyes, detailed nose, pupils, nostrils, facial features, bridge of nose, tip of nose, septum, face inconsistency, face mismatch",
        apiType: "nano-banana",
        productType: "boho", // Identyfikator typu produktu
        parameters: {
          image_input: ["USER_IMAGE"],
          prompt: "Create a very minimalist portrait illustration based on the uploaded photo of people. Apply a style with smooth pastel tones, clean shapes, subtle flat shading, no outlines. For the faces of all individuals (for the faces of all individuals): Featureless mid-face (featureless mid-face) with omitted eyes and nose (eyes and nose omitted). Crucially, ensure every person has distinct and prominent eyebrows and a clearly defined mouth. Hair should be detailed hair. Background is bright warm beige background (#E9D6C6). The overall impression should be an elegant and warm emotional atmosphere, trendy Etsy-style portrait.",
          negative_prompt: "eyes, nose, naturalistic eyes, realistic nose, detailed eyes, detailed nose, pupils, nostrils, facial features, bridge of nose, tip of nose, septum, face inconsistency, face mismatch",
          aspect_ratio: "3:4",
          output_format: "jpg",
          guidance: 3.5
        }
      },
      'realistyczny': {
        model: "google/nano-banana",
        prompt: "Create a slightly detailed, minimalist portrait illustration based on the uploaded photo of people. Apply a style with smooth pastel tones, clean shapes, subtle flat shading, no outlines. For the characters' faces: ensure they have simple, stylized, and elegantly small eyes that are strictly proportional to the face (simple, stylized, and elegantly small eyes that are strictly proportional to the face), with clear whites, defined pupils, and subtle, minimalist eyelashes (subtle, minimalist eyelashes). They must also have distinct eyebrows and a clearly defined mouth with visible lips and teeth. They should also have a simple, light, minimalist nose. Hair should be detailed hair. Background is bright warm beige background (#E9D6C6). The overall impression should be an elegant and warm emotional atmosphere, trendy Etsy-style portrait.",
        negative_prompt: "bulging eyes, huge eyes, oversized eyes, no lips, thin line mouth, hyper-realistic eyes, hyper-detailed eyes, detailed nose, prominent nose, strong nose bridge, deep shadows on nose, photo-realistic details, thick eyelashes, exaggerated eyelashes",
        apiType: "nano-banana",
        productType: "boho", // Identyfikator typu produktu
        parameters: {
          image_input: ["USER_IMAGE"],
          prompt: "Create a slightly detailed, minimalist portrait illustration based on the uploaded photo of people. Apply a style with smooth pastel tones, clean shapes, subtle flat shading, no outlines. For the characters' faces: ensure they have simple, stylized, and elegantly small eyes that are strictly proportional to the face (simple, stylized, and elegantly small eyes that are strictly proportional to the face), with clear whites, defined pupils, and subtle, minimalist eyelashes (subtle, minimalist eyelashes). They must also have distinct eyebrows and a clearly defined mouth with visible lips and teeth. They should also have a simple, light, minimalist nose. Hair should be detailed hair. Background is bright warm beige background (#E9D6C6). The overall impression should be an elegant and warm emotional atmosphere, trendy Etsy-style portrait.",
          negative_prompt: "bulging eyes, huge eyes, oversized eyes, no lips, thin line mouth, hyper-realistic eyes, hyper-detailed eyes, detailed nose, prominent nose, strong nose bridge, deep shadows on nose, photo-realistic details, thick eyelashes, exaggerated eyelashes",
          aspect_ratio: "3:4",
          output_format: "jpg",
          guidance: 3.5
        }
      },
      // Style króla - używają Segmind Faceswap v4
      'krol-krolewski': {
        model: "segmind/faceswap-v4",
        apiType: "segmind-faceswap",
        productType: "king", // Identyfikator typu produktu
        parameters: {
          target_image: "https://customify-s56o.vercel.app/krol/krol-styl-1.jpg",
          swap_image: "USER_IMAGE"
        }
      },
      'krol-majestatyczny': {
        model: "segmind/faceswap-v4",
        apiType: "segmind-faceswap",
        productType: "king",
        parameters: {
          target_image: "https://customify-s56o.vercel.app/krol/krol-styl-2.jpg",
          swap_image: "USER_IMAGE"
        }
      },
      'krol-triumfalny': {
        model: "segmind/faceswap-v4",
        apiType: "segmind-faceswap",
        productType: "king",
        parameters: {
          target_image: "https://customify-s56o.vercel.app/krol/krol-styl-3.jpg",
          swap_image: "USER_IMAGE"
        }
      },
      'krol-imponujacy': {
        model: "segmind/faceswap-v4",
        apiType: "segmind-faceswap",
        productType: "king",
        parameters: {
          target_image: "https://customify-s56o.vercel.app/krol/krol_4.png",
          swap_image: "USER_IMAGE"
        }
      },
      // Style królowej - używają Segmind Faceswap v4
      'krolowa-styl-1': {
        model: "segmind/faceswap-v4",
        apiType: "segmind-faceswap",
        productType: "queen",
        parameters: {
          target_image: "https://customify-s56o.vercel.app/krolowa/krolowa-styl-1.jpg",
          swap_image: "USER_IMAGE"
        }
      },
      'krolowa-styl-2': {
        model: "segmind/faceswap-v4",
        apiType: "segmind-faceswap",
        productType: "queen",
        parameters: {
          target_image: "https://customify-s56o.vercel.app/krolowa/krolowa-styl-2.jpg",
          swap_image: "USER_IMAGE"
        }
      },
      'krolowa-styl-3': {
        model: "segmind/faceswap-v4",
        apiType: "segmind-faceswap",
        productType: "queen",
        parameters: {
          target_image: "https://customify-s56o.vercel.app/krolowa/krolowa-styl-3.jpg",
          swap_image: "USER_IMAGE"
        }
      },
      'krolowa-styl-4': {
        model: "segmind/faceswap-v4",
        apiType: "segmind-faceswap",
        productType: "queen",
        parameters: {
          target_image: "https://customify-s56o.vercel.app/krolowa/krolowa_sitting.png",
          swap_image: "USER_IMAGE"
        }
      },
      'superhero_kid': {
        model: "segmind/faceswap-v4",
        apiType: "segmind-faceswap",
        productType: "superhero",
        parameters: {
          target_image: "https://customify-s56o.vercel.app/superbohater/superhero_ok_1.jpg",
          swap_image: "USER_IMAGE"
        }
      },
      // Style karykatury - używają Segmind API
      'karykatura': {
        model: "segmind/caricature-style",
        prompt: "Create a caricature portrait based on the uploaded photo. Exaggerate facial features, make it humorous and cartoon-like while maintaining likeness. Use bold lines, vibrant colors, and comedic proportions typical of caricature art.",
        apiType: "segmind-caricature",
        productType: "caricature", // Identyfikator typu produktu
        parameters: {
          image: "USER_IMAGE", // URL do obrazu użytkownika
          size: "1024x1536", // PIONOWY PORTRET - NIE ZMIENIAJ! (2:3 format)
          quality: "medium", // Jakość średnia
          background: "opaque", // Nieprzezroczyste tło
          output_format: "jpeg", // JPEG zamiast PNG - 80-90% mniejszy rozmiar (rozwiązuje 413) - używaj "jpeg" nie "jpg"!
          output_compression: 85 // Kompresja JPEG 85% - dobra jakość, mały rozmiar
        }
      },
      // Style akwareli - używa Segmind Become-Image API
      'akwarela': {
        model: "segmind/become-image",
        prompt: "modern watercolor painting",
        apiType: "segmind-become-image",
        productType: "watercolor", // Identyfikator typu produktu
        parameters: {
          image: "USER_IMAGE", // URL zdjęcia użytkownika (będzie zamienione na URL z Vercel Blob)
          image_to_become: "https://customify-s56o.vercel.app/akwarela/become.png", // Docelowy obraz stylu akwareli (Vercel Blob)
          prompt_strength: 3,
          number_of_images: 1,
          denoising_strength: 0.45,
          instant_id_strength: 0.5,
          image_to_become_strength: 0.45,
          image_to_become_noise: 0.3,
          control_depth_strength: 0.93,
          disable_safety_checker: true
        }
      },
      // Nowy styl z OpenAI GPT-Image-1
      'openai-art': {
        model: "gpt-image-1",
        prompt: "Create a soft, flattering caricature while keeping the people clearly recognizable.\n\nSTYLE:\n\n• Smooth, clean colors with a soft marker-and-colored-pencil look.\n\n• Natural, balanced skin tones (no yellow or sepia filter).\n\n• Gentle outlines and soft shading with mild exaggeration of expressive features.\n\nFACE & BEAUTY:\n\n• Preserve facial structure and identity.\n\n• Slightly enhance beauty: smooth skin, reduce wrinkles or harsh details.\n\n• Keep eyes natural and expressive.\n\nBACKGROUND:\n\n• Keep the original background, but softly stylize it to match the caricature style.\n\n• Do NOT remove or replace the background.\n\nEXAGGERATION:\n\n• Larger heads and slightly smaller bodies, but still natural and flattering.\n\n• Exaggerate only smiles, eyebrows, and cheeks — no distortion of identity.\n\nRESULT:\n\nA natural-color, soft, flattering caricature with preserved background and strong likeness.",
        apiType: "openai",
        productType: "openai-art", // Identyfikator typu produktu
        parameters: {
          model: "gpt-image-1",
          size: "1024x1536", // Portrait (pionowy portret)
          quality: "auto", // Auto quality
          style: "vivid", // Żywe kolory
          output_format: "jpg", // JPG format
          background: "opaque", // Nieprzezroczyste tło
          fidelity: "low", // Niska wierność (szybsze generowanie)
          n: 1
        }
      },
      // Nowy styl IMG2IMG z OpenAI GPT-Image-1 (caricature from input photo)
      'caricature-new': {
        model: "gpt-image-1",
        prompt: "Create a soft, flattering caricature while keeping the people clearly recognizable.\n\nSTYLE:\n\n• Smooth, clean colors with a soft marker-and-colored-pencil look.\n\n• Natural, balanced skin tones (no yellow or sepia filter).\n\n• Gentle outlines and soft shading with mild exaggeration of expressive features.\n\nFACE & BEAUTY:\n\n• Preserve facial structure and identity.\n\n• Slightly enhance beauty: smooth skin, reduce wrinkles or harsh details.\n\n• Keep eyes natural and expressive.\n\nBACKGROUND:\n\n• Keep the original background, but softly stylize it to match the caricature style.\n\n• Do NOT remove or replace the background.\n\nEXAGGERATION:\n\n• Larger heads and slightly smaller bodies, but still natural and flattering.\n\n• Exaggerate only smiles, eyebrows, and cheeks — no distortion of identity.\n\nRESULT:\n\nA natural-color, soft, flattering caricature with preserved background and strong likeness.",
        apiType: "openai-caricature",
        productType: "caricature-new",
        parameters: {
          model: "gpt-image-1",
          size: "1024x1536", // pionowy portret 2:3
          output_format: "jpeg", // dozwolony format wyjściowy
          background: "opaque",
          n: 1
        }
      },
      'karykatura-olowek': {
        model: "gpt-image-1",
        prompt: "keep faces of the persons recognizable. Generate a premium caricature portrait with exaggerated proportions:\n\nlarge expressive head, small body, elegant ink illustration style.\n\nProportions should clearly look like caricature but still artistic and refined.\n\nKeep facial likeness high. Clean white background.",
        apiType: "openai-caricature",
        productType: "caricature-new",
        parameters: {
          model: "gpt-image-1",
          size: "1024x1536", // pionowy portret 2:3
          output_format: "jpeg", // dozwolony format wyjściowy
          background: "opaque",
          n: 1
        }
      },
      // 🎵 Spotify frame używa istniejących stylów (bez nowych slugów)
    };

    // ✅ KRYTYCZNE: Brak fallbacków - jeśli styl nie istnieje, zwróć błąd
    // Get style from request body (priority) or parse from prompt (fallback tylko jeśli brak style w body)
    let selectedStyle = style; // Styl z request body (frontend wysyła selectedStyle)
    
    if (!selectedStyle) {
      // ❌ BRAK STYLU W REQUEST BODY - parsuj z prompta jako ostatnia szansa
      console.log(`⚠️ [STYLE-DEBUG] Brak pola 'style' w request body, parsuję z prompta...`);
      console.log(`🔍 [STYLE-DEBUG] Prompt: "${prompt}"`);
      console.log(`🔍 [STYLE-DEBUG] Available styles:`, Object.keys(styleConfig));
      
      // Szukaj najdłuższego dopasowania (żeby "krol-krolewski" miało priorytet nad "krolewski")
      const matchingStyles = Object.keys(styleConfig).filter(s => prompt.toLowerCase().includes(s));
      console.log(`🔍 [STYLE-DEBUG] Matching styles:`, matchingStyles);
      
      if (matchingStyles.length > 0) {
        selectedStyle = matchingStyles.reduce((a, b) => a.length > b.length ? a : b);
        console.log(`⚠️ [STYLE-DEBUG] Parsed style from prompt: "${selectedStyle}" (from ${matchingStyles.length} matches)`);
      } else {
        // ❌ BRAK DOPASOWANIA - BŁĄD
        console.error(`❌ [STYLE-DEBUG] Nie znaleziono stylu w promptcie: "${prompt}"`);
        return res.status(400).json({
          error: 'Invalid style',
          message: `Nieznany styl: "${prompt}". Dostępne style: ${Object.keys(styleConfig).join(', ')}`,
          availableStyles: Object.keys(styleConfig)
        });
      }
    }
    
    // ✅ WALIDACJA: Sprawdź czy styl istnieje w config
    if (!styleConfig[selectedStyle]) {
      console.error(`❌ [STYLE-DEBUG] Styl "${selectedStyle}" nie istnieje w config!`);
      console.error(`❌ [STYLE-DEBUG] Dostępne style:`, Object.keys(styleConfig));
      return res.status(400).json({
        error: 'Invalid style',
        message: `Nieznany styl: "${selectedStyle}". Dostępne style: ${Object.keys(styleConfig).join(', ')}`,
        requestedStyle: selectedStyle,
        availableStyles: Object.keys(styleConfig)
      });
    }
    
    console.log(`✅ [STYLE-DEBUG] Using style: "${selectedStyle}"`);
    
    // ✅ DEBUG: Sprawdź config
    const selectedConfig = styleConfig[selectedStyle];
    const config = selectedConfig;
    console.log(`🔍 [STYLE-DEBUG] ===== CONFIG DLA STYLU "${selectedStyle}" =====`);
    console.log(`🔍 [STYLE-DEBUG] model:`, config.model);
    console.log(`🔍 [STYLE-DEBUG] apiType:`, config.apiType);
    console.log(`🔍 [STYLE-DEBUG] productType:`, selectedConfig.productType);
    if (config.apiType === 'segmind-faceswap' && config.parameters?.target_image) {
      console.log(`🔍 [STYLE-DEBUG] target_image URL:`, config.parameters.target_image);
    }
    console.log(`🔍 [STYLE-DEBUG] ==========================================`);
    // ✅ Użyj productType z config, ale pozwól na spotify_frame z requestu
    const finalProductType = productType === 'spotify_frame'
      ? 'spotify_frame'
      : (selectedConfig.productType || productType || 'other');

    console.log(`Using style: ${selectedStyle}, model: ${config.model}`);
    console.log(`🎯 [TRANSFORM] Final productType: ${finalProductType} (z config: ${config.productType}, z body: ${productType})`);
    
    // ✅ DEBUG: Sprawdź target_image dla stylów króla
    if (config.apiType === 'segmind-faceswap' && config.parameters?.target_image) {
      console.log(`🎭 [STYLE-DEBUG] ===== TARGET IMAGE INFO =====`);
      console.log(`🎭 [STYLE-DEBUG] Selected style: "${selectedStyle}"`);
      console.log(`🎭 [STYLE-DEBUG] Target image URL: ${config.parameters.target_image}`);
      console.log(`🎭 [STYLE-DEBUG] Config parameters:`, JSON.stringify(config.parameters, null, 2));
      console.log(`🎭 [STYLE-DEBUG] ============================`);
    }

    // ✅ DEVICE TOKEN LIMIT: 1 generacja PER PRODUCTTYPE dla niezalogowanych
    // Używa Vercel KV z atomic operations (trwałe, nie resetuje się)
    if (isTest) {
      console.log(`🧪 [TEST-BYPASS] Pomijam device token limit dla test user (niezalogowany)`);
    } else if (!customerId && deviceToken && isKVConfigured()) {
      console.log(`🔍 [DEVICE-TOKEN] START sprawdzanie limitu TOTAL (KV):`, {
        deviceToken: deviceToken.substring(0, 8) + '...',
        ip: ip
      });
      
      const deviceLimitCheck = await checkDeviceTokenLimit(deviceToken);
      
      if (!deviceLimitCheck.allowed) {
        console.warn(`❌ [DEVICE-TOKEN] LIMIT EXCEEDED (KV):`, {
          deviceToken: deviceToken.substring(0, 8) + '...',
          count: deviceLimitCheck.count,
          limit: deviceLimitCheck.limit,
          reason: deviceLimitCheck.reason
        });
        
        // ✅ TRACKING: Zapisuj błąd (asynchronicznie, nie blokuje)
        console.log(`🔍 [TRACKING] Przed wywołaniem trackError dla device_token_limit`);
        try {
          trackError('device_token_limit', 'not_logged_in', deviceToken, ip, {
            count: deviceLimitCheck.count,
            limit: deviceLimitCheck.limit
          });
          console.log(`✅ [TRACKING] trackError wywołane (asynchronicznie)`);
        } catch (trackErr) {
          console.error(`❌ [TRACKING] Błąd wywołania trackError:`, trackErr);
        }
        
        return res.status(403).json({
          error: 'Usage limit exceeded',
          message: `Wykorzystałeś wszystkie darmowe generacje (${deviceLimitCheck.count}/${deviceLimitCheck.limit}). Zaloguj się po więcej.`,
          showLoginModal: true,
          count: deviceLimitCheck.count,
          limit: deviceLimitCheck.limit
        });
      }
      
      console.log(`✅ [DEVICE-TOKEN] Limit OK (KV): ${deviceLimitCheck.count}/${deviceLimitCheck.limit}`);
    } else if (!customerId && deviceToken && !isKVConfigured()) {
      console.warn('⚠️ [DEVICE-TOKEN] KV not configured - skipping device token limit check');
      // Fallback: jeśli KV nie jest skonfigurowany, pozwól (ale zalecamy konfigurację)
    } else if (!customerId && !deviceToken) {
      console.log(`⚠️ [DEVICE-TOKEN] Brak device token dla niezalogowanego użytkownika - pomijam sprawdzanie`);
    }

    // ============================================================================
    // DEVICE-TOKEN-CROSS-ACCOUNT-FEATURE: START - Wykrywanie abuse z wieloma kontami
    // Sprawdza czy ten sam device token (cookie) nie jest używany przez zbyt wiele kont
    // Limit: 1 device token = max 2 różne customerIds (aby nie blokować rodzin)
    // ============================================================================
    
    if (isTest) {
      console.log(`🧪 [TEST-BYPASS] Pomijam cross-account check dla test user`);
    } else if (customerId && deviceToken && isKVConfigured()) {
      console.log(`🔍 [CROSS-ACCOUNT] START sprawdzanie cross-account detection:`, {
        customerId: customerId.substring(0, 10) + '...',
        deviceToken: deviceToken.substring(0, 8) + '...'
      });
      
      const crossAccountCheck = await checkDeviceTokenCrossAccount(deviceToken, customerId);
      
      if (!crossAccountCheck.allowed) {
        console.warn(`❌ [CROSS-ACCOUNT] BLOKADA - abuse wykryty:`, {
          deviceToken: deviceToken.substring(0, 8) + '...',
          customerId: customerId.substring(0, 10) + '...',
          existingCustomers: crossAccountCheck.customerIds.length,
          limit: crossAccountCheck.limit,
          reason: crossAccountCheck.reason
        });
        
        // ✅ TRACKING: Zapisuj błąd (asynchronicznie, nie blokuje)
        trackError('cross_account', 'logged_in', deviceToken, ip, {
          customer_id: customerId,
          existing_customers: crossAccountCheck.customerIds.length,
          limit: crossAccountCheck.limit
        });
        
        return res.status(403).json({
          error: 'Multiple accounts detected',
          message: `Wykryto nadużycie: to urządzenie jest już używane przez ${crossAccountCheck.limit} różne konta. Skontaktuj się z supportem jeśli to pomyłka.`,
          showLoginModal: false,
          count: crossAccountCheck.customerIds.length,
          limit: crossAccountCheck.limit
        });
      }
      
      console.log(`✅ [CROSS-ACCOUNT] Sprawdzenie OK: ${crossAccountCheck.customerIds.length}/${crossAccountCheck.limit} kont na tym urządzeniu`);
    } else if (customerId && deviceToken && !isKVConfigured()) {
      console.warn('⚠️ [CROSS-ACCOUNT] KV not configured - skipping cross-account check');
    } else if (customerId && !deviceToken) {
      console.log(`⚠️ [CROSS-ACCOUNT] Brak device token dla zalogowanego użytkownika - pomijam sprawdzanie`);
    }
    
    // DEVICE-TOKEN-CROSS-ACCOUNT-FEATURE: END
    // ============================================================================

    // ============================================================================
    // IMAGE-HASH-FEATURE: START - Sprawdzanie limitu per obrazek
    // Feature flag: ENABLE_IMAGE_HASH_LIMIT (true/false w Vercel env)
    // Aby wyłączyć: ustaw ENABLE_IMAGE_HASH_LIMIT=false w Vercel Dashboard
    // ============================================================================
    
    // 🧪 BYPASS: Test users pomijają limit obrazka (isTest już zdefiniowane wcześniej)
    if (isTest) {
      console.log(`🧪 [TEST-BYPASS] Pomijam image hash limit dla test user`);
    } else if (isImageHashLimitEnabled() && isKVConfigured() && imageData) {
      console.log(`🔍 [IMAGE-HASH] Feature enabled - sprawdzanie limitu per obrazek...`);
      
      try {
        // Oblicz hash obrazka (imageData to base64 string)
        const imageHash = calculateImageHash(imageData);
        console.log(`🔐 [IMAGE-HASH] Obliczony hash: ${imageHash.substring(0, 16)}...`);
        
        const imageHashCheck = await checkImageHashLimit(imageHash);
        
        // ✅ TRACKING: Sprawdź czy to retry po błędzie (asynchronicznie, tylko jeśli limit OK)
        if (imageHashCheck.allowed && deviceToken) {
          getRecentError(deviceToken, 2).then(recentError => {
            if (recentError) {
              const timeSinceError = Math.floor((Date.now() - new Date(recentError.timestamp).getTime()) / 1000);
              const userStatus = customerId ? 'logged_in' : 'not_logged_in';
              // Sprawdź czy używa tego samego obrazka (porównaj hash)
              const currentImageHash = imageHash.substring(0, 16) + '...';
              const isSameImage = recentError.details?.image_hash === currentImageHash;
              const action = isSameImage ? 'retry_same_image' : 'retry_different_image';
              
              trackAction(action, userStatus, deviceToken, ip, {
                error_type: recentError.error_type,
                time_since_error_seconds: timeSinceError,
                same_image: isSameImage
              });
            }
          }).catch(err => {
            // Ignoruj błędy - to nie może zepsuć flow
          });
        }
        
        if (!imageHashCheck.allowed) {
          console.warn(`❌ [IMAGE-HASH] LIMIT EXCEEDED:`, {
            imageHash: imageHash.substring(0, 16) + '...',
            count: imageHashCheck.count,
            limit: imageHashCheck.limit,
            reason: imageHashCheck.reason
          });
          
          // ✅ TRACKING: Zapisuj błąd (asynchronicznie, nie blokuje)
          const userStatus = customerId ? 'logged_in' : 'not_logged_in';
          console.log(`🔍 [TRACKING] Przed wywołaniem trackError dla image_hash_limit`);
          try {
            trackError('image_hash_limit', userStatus, deviceToken, ip, {
              count: imageHashCheck.count,
              limit: imageHashCheck.limit,
              image_hash: imageHash.substring(0, 16) + '...'
            });
            console.log(`✅ [TRACKING] trackError wywołane (asynchronicznie) dla image_hash_limit`);
          } catch (trackErr) {
            console.error(`❌ [TRACKING] Błąd wywołania trackError:`, trackErr);
          }
          
          return res.status(403).json({
            error: 'Image already used',
            message: `Dla tego zdjęcia wynik jest gotowy, zobacz poniżej. Spróbuj inne zdjęcie, albo inne produkty`,
            showLoginModal: false,
            count: imageHashCheck.count,
            limit: imageHashCheck.limit,
            imageBlocked: true
          });
        }
        
        console.log(`✅ [IMAGE-HASH] Limit OK: ${imageHashCheck.count}/${imageHashCheck.limit}`);
        
        // Zapisz hash w request do użycia przy inkrementacji (po udanej transformacji)
        req.imageHash = imageHash;
      } catch (hashError) {
        console.error('❌ [IMAGE-HASH] Błąd obliczania hash:', hashError);
        // Nie blokuj - kontynuuj bez sprawdzania obrazka (fail-safe)
      }
    } else if (isImageHashLimitEnabled() && !isKVConfigured()) {
      console.warn('⚠️ [IMAGE-HASH] Feature enabled but KV not configured - skipping');
    } else if (isImageHashLimitEnabled() && !imageData) {
      console.warn('⚠️ [IMAGE-HASH] Feature enabled but no imageData - skipping');
    } else {
      console.log(`ℹ️ [IMAGE-HASH] Feature disabled (ENABLE_IMAGE_HASH_LIMIT=${process.env.ENABLE_IMAGE_HASH_LIMIT})`);
    }
    
    // IMAGE-HASH-FEATURE: END
    // ============================================================================

    // ✅ SPRAWDZENIE LIMITÓW SHOPIFY METAFIELDS (Zalogowani) - PER PRODUCTTYPE
    const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (customerId && accessToken) {
      // Zalogowany użytkownik - sprawdź Shopify Metafields
      console.log(`🔍 [TRANSFORM] Sprawdzam limity dla zalogowanego użytkownika (${finalProductType})...`);
      
      // ✅ TRACKING: Sprawdź czy użytkownik zalogował się po błędzie (asynchronicznie)
      if (deviceToken) {
        getRecentError(deviceToken, 2).then(recentError => {
          if (recentError) {
            const timeSinceError = Math.floor((Date.now() - new Date(recentError.timestamp).getTime()) / 1000);
            trackAction('login_after_error', 'logged_in', deviceToken, ip, {
              error_type: recentError.error_type,
              time_since_error_seconds: timeSinceError,
              customer_id: customerId
            });
          }
        }).catch(err => {
          // Ignoruj błędy - to nie może zepsuć flow
        });
      }
      
      try {
        const metafieldQuery = `
          query getCustomerUsage($id: ID!) {
            customer(id: $id) {
              id
              email
              metafield(namespace: "customify", key: "usage_count") {
                id
                value
                type
              }
            }
          }
        `;

        const metafieldResponse = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken
          },
          body: JSON.stringify({
            query: metafieldQuery,
            variables: {
              id: `gid://shopify/Customer/${customerId}`
            }
          })
        });

        const metafieldData = await metafieldResponse.json();
        console.log(`📊 [METAFIELD-CHECK] GraphQL response:`, {
          hasData: !!metafieldData.data,
          hasCustomer: !!metafieldData.data?.customer,
          hasMetafield: !!metafieldData.data?.customer?.metafield,
          metafieldId: metafieldData.data?.customer?.metafield?.id || null,
          metafieldType: metafieldData.data?.customer?.metafield?.type || null,
          metafieldValue: metafieldData.data?.customer?.metafield?.value || null,
          errors: metafieldData.errors || null
        });
        
        const customer = metafieldData.data?.customer;
        
        // ✅ ZAPISZ EMAIL Z GRAPHQL (dla użycia w save-generation)
        // customerEmailFromGraphQL jest już zdefiniowany na wyższym poziomie scope
        customerEmailFromGraphQL = customer?.email || null;
        
        if (!customer) {
          console.error(`❌ [METAFIELD-CHECK] Brak customer w response:`, metafieldData);
        }
        
        // Parsuj JSON lub konwertuj stary format (liczba)
        let usageData;
        let isOldFormat = false;
        
        // helper to ensure definition is json
        const ensureDefinitionJson = async () => {
          console.log(`🔍 [METAFIELD-CHECK] Sprawdzam metafield definition (usage_count)`);
          const definitionQuery = `
            query {
              metafieldDefinitions(first: 100, ownerType: CUSTOMER, namespace: "customify", key: "usage_count") {
                edges {
                  node {
                    id
                    type {
                      name
                    }
                  }
                }
              }
            }
          `;

          const definitionResponse = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': accessToken
            },
            body: JSON.stringify({ query: definitionQuery })
          });

          const definitionData = await definitionResponse.json();
          const definitionNode = definitionData.data?.metafieldDefinitions?.edges?.[0]?.node;

          if (definitionNode) {
            if (definitionNode.type?.name === 'json') {
              console.log(`✅ [METAFIELD-CHECK] Definition już ma typ json`);
              return;
            }

            console.log(`🔄 [METAFIELD-CHECK] Definition ma typ ${definitionNode.type?.name} - aktualizuję na json...`);

            const updateDefinitionMutation = `
              mutation UpdateMetafieldDefinition($id: ID!, $definition: MetafieldDefinitionInput!) {
                metafieldDefinitionUpdate(id: $id, definition: $definition) {
                  metafieldDefinition {
                    id
                    type { name }
                  }
                  userErrors {
                    field
                    message
                  }
                }
              }
            `;

            const updateDefinitionResponse = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken
              },
              body: JSON.stringify({
                query: updateDefinitionMutation,
                variables: {
                  id: definitionNode.id,
                  definition: { type: 'json' }
                }
              })
            });

            const updateDefinitionData = await updateDefinitionResponse.json();
            if (updateDefinitionData.data?.metafieldDefinitionUpdate?.userErrors?.length > 0) {
              console.error(`❌ [METAFIELD-CHECK] Błąd aktualizacji definition:`, updateDefinitionData.data.metafieldDefinitionUpdate.userErrors);
              console.log(`⚠️ [METAFIELD-CHECK] Usuwam starą definition i tworzę nową jako json...`);

              const deleteDefinitionMutation = `
                mutation DeleteMetafieldDefinition($id: ID!) {
                  metafieldDefinitionDelete(id: $id) {
                    deletedId
                    userErrors { field message }
                  }
                }
              `;

              const deleteDefinitionResponse = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Shopify-Access-Token': accessToken
                },
                body: JSON.stringify({
                  query: deleteDefinitionMutation,
                  variables: { id: definitionNode.id }
                })
              });

              const deleteDefinitionData = await deleteDefinitionResponse.json();
              if (deleteDefinitionData.data?.metafieldDefinitionDelete?.deletedId) {
                console.log(`✅ [METAFIELD-CHECK] Stara definition usunięta`);
              } else if (deleteDefinitionData.data?.metafieldDefinitionDelete?.userErrors?.length > 0) {
                console.error(`❌ [METAFIELD-CHECK] Błąd usuwania definition:`, deleteDefinitionData.data.metafieldDefinitionDelete.userErrors);
              }

              const createDefinitionMutation = `
                mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
                  metafieldDefinitionCreate(definition: $definition) {
                    createdDefinition {
                      id
                      type { name }
                    }
                    userErrors {
                      field
                      message
                    }
                  }
                }
              `;

              const createDefinitionResponse = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Shopify-Access-Token': accessToken
                },
                body: JSON.stringify({
                  query: createDefinitionMutation,
                  variables: {
                    definition: {
                      name: 'Usage Count',
                      namespace: 'customify',
                      key: 'usage_count',
                      description: 'Liczba wykorzystanych transformacji AI przez użytkownika (per productType)',
                      type: 'json',
                      ownerType: 'CUSTOMER'
                    }
                  }
                })
              });

              const createDefinitionData = await createDefinitionResponse.json();
              if (createDefinitionData.data?.metafieldDefinitionCreate?.createdDefinition) {
                console.log(`✅ [METAFIELD-CHECK] Nowa definition utworzona jako json`);
              } else if (createDefinitionData.data?.metafieldDefinitionCreate?.userErrors?.length > 0) {
                console.error(`❌ [METAFIELD-CHECK] Błąd tworzenia nowej definition:`, createDefinitionData.data.metafieldDefinitionCreate.userErrors);
              }
            } else {
              console.log(`✅ [METAFIELD-CHECK] Definition zaktualizowana na json`);
            }
          } else {
            console.log(`⚠️ [METAFIELD-CHECK] Definition nie istnieje - tworzę nową jako json`);
            const createDefinitionMutation = `
              mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
                metafieldDefinitionCreate(definition: $definition) {
                  createdDefinition { id type { name } }
                  userErrors { field message }
                }
              }
            `;
            const createDefinitionResponse = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken
              },
              body: JSON.stringify({
                query: createDefinitionMutation,
                variables: {
                  definition: {
                    name: 'Usage Count',
                    namespace: 'customify',
                    key: 'usage_count',
                    description: 'Liczba wykorzystanych transformacji AI przez użytkownika (per productType)',
                    type: 'json',
                    ownerType: 'CUSTOMER'
                  }
                }
              })
            });
            const createDefinitionData = await createDefinitionResponse.json();
            if (createDefinitionData.data?.metafieldDefinitionCreate?.createdDefinition) {
              console.log(`✅ [METAFIELD-CHECK] Nowa definition utworzona jako json`);
            } else if (createDefinitionData.data?.metafieldDefinitionCreate?.userErrors?.length > 0) {
              console.error(`❌ [METAFIELD-CHECK] Błąd tworzenia definition:`, createDefinitionData.data.metafieldDefinitionCreate.userErrors);
            }
          }
        };

        // ⚠️ KRYTYCZNE: Sprawdź faktyczny typ definition (nie tylko metafield value)
        // Shopify NIE POZWALA na zmianę typu definition - musimy sprawdzić definition
        let actualDefinitionType = 'json'; // Default
        
        try {
          const definitionQuery = `
            query {
              metafieldDefinitions(first: 1, ownerType: CUSTOMER, namespace: "customify", key: "usage_count") {
                edges {
                  node {
                    id
                    type {
                      name
                    }
                  }
                }
              }
            }
          `;
          
          const definitionResponse = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': accessToken
            },
            body: JSON.stringify({ query: definitionQuery })
          });
          
          const definitionData = await definitionResponse.json();
          const definitionNode = definitionData.data?.metafieldDefinitions?.edges?.[0]?.node;
          
          if (definitionNode?.type?.name) {
            actualDefinitionType = definitionNode.type.name;
            console.log(`🔍 [METAFIELD-CHECK] Faktyczny typ definition: ${actualDefinitionType}`);
          }
        } catch (defError) {
          console.warn(`⚠️ [METAFIELD-CHECK] Nie można sprawdzić typu definition, używam typu z metafield:`, defError.message);
          // Fallback - użyj typu z metafield
          actualDefinitionType = customer?.metafield?.type || 'json';
        }
        
        if (!customer?.metafield) {
          console.log(`📊 [METAFIELD-CHECK] Brak metafield - pierwsza generacja dla użytkownika ${customer?.email || customerId}`);
          await ensureDefinitionJson();
          usageData = {};
          // ⚠️ KRYTYCZNE: Użyj faktycznego typu definition (nie domyślnego 'json')
          isOldFormat = (actualDefinitionType === 'number_integer');
          console.log(`📊 [METAFIELD-CHECK] Ustawiam usageData na pusty obiekt (0 użyć), isOldFormat: ${isOldFormat}`);
        } else {
          // ⚠️ KRYTYCZNE: Użyj faktycznego typu definition (nie typu metafield value)
          const metafieldType = customer?.metafield?.type || actualDefinitionType;
          const isOldFormatType = (actualDefinitionType === 'number_integer');
          
          try {
            const rawValue = customer?.metafield?.value;
            console.log(`🔍 [METAFIELD-CHECK] Parsing metafield value:`, {
              rawValue: rawValue,
              type: typeof rawValue,
              metafieldType: metafieldType,
              isOldFormatType: isOldFormatType
            });
            
            // Jeśli typ to number_integer, ZAWSZE traktuj jako stary format (niezależnie od wartości)
            if (isOldFormatType) {
              throw new Error('Metafield type is number_integer - treat as old format');
            }
            
            const parsed = JSON.parse(rawValue || '{}');
            // Sprawdź czy to prawdziwy JSON object (nie liczba jako string)
            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
              usageData = parsed;
              console.log(`✅ [METAFIELD-CHECK] Parsed JSON successfully:`, usageData);
            } else {
              throw new Error('Not a valid JSON object');
            }
          } catch (parseError) {
            // Stary format (liczba) → konwertuj
            isOldFormat = true;
            const rawValue = customer?.metafield?.value || '0';
            const oldTotal = parseInt(rawValue, 10);
            console.log(`⚠️ [METAFIELD-CHECK] Stary format metafield:`, {
              rawValue: rawValue,
              parsedTotal: oldTotal,
              metafieldType: metafieldType,
              isOldFormatType: isOldFormatType,
              parseError: parseError.message
            });
            
            // ⚠️ KRYTYCZNE: Jeśli stary format, sprawdź TOTAL (nie per productType)
            // Bo nie wiemy jak rozłożyć stare generacje na productType
            usageData = {
              total: oldTotal,
              other: oldTotal  // Wszystkie stare → "other"
            };
            console.log(`⚠️ [METAFIELD-CHECK] Konwertuję stary format: ${oldTotal} →`, usageData);
          }
        }

        const totalLimit = 4; // 4 darmowe generacje TOTAL dla zalogowanych
        
        // Sprawdź TOTAL (bez per productType)
        const totalUsed = usageData.total || 0;
        
        console.log(`📊 [METAFIELD-CHECK] Sprawdzam TOTAL usage:`, {
          totalUsed: totalUsed,
          limit: totalLimit,
          isOldFormat: isOldFormat,
          fullUsageData: usageData
        });

        console.log(`📊 [METAFIELD-CHECK] Limit check result:`, {
          customerEmail: customer?.email,
          customerId: customerId,
          totalUsed: totalUsed,
          totalLimit: totalLimit,
          isOldFormat: isOldFormat
        });

        // ✅ SPRAWDŹ WHITELIST Z EMAIL Z GRAPHQL (bardziej wiarygodne niż request body)
        // customerEmailFromGraphQL jest już zdefiniowany na wyższym poziomie scope (linia ~1497)
        const isTestUserFromGraphQL = isTestUser(customerEmailFromGraphQL || null, ip);
        
        // ✅ ZAKTUALIZUJ isTest żeby uwzględniać email z GraphQL (dostępne w sekcji inkrementacji)
        if (isTestUserFromGraphQL) {
          isTest = true;
        }
        
        if (isTest || isTestUserFromGraphQL) {
          console.log(`🧪 [TEST-BYPASS] Pomijam Shopify metafield limit dla test user (${totalUsed}/${totalLimit})`);
          console.log(`🧪 [TEST-BYPASS] Test check - original isTest: ${isTest}, GraphQL email test: ${isTestUserFromGraphQL}, email: ${customerEmailFromGraphQL}`);
        } else if (totalUsed >= totalLimit) {
          console.warn(`❌ [METAFIELD-CHECK] LIMIT EXCEEDED:`, {
            customerEmail: customer?.email,
            customerId: customerId,
            totalUsed: totalUsed,
            totalLimit: totalLimit
          });

          // 🕒 Zapisz do KV info o osiągniętym limicie (kolejka do automatycznego resetu/mailingu)
          if (customerId) {
            try {
              const key = `limit-reached:${customerId}`;
              const payload = {
                timestamp: new Date().toISOString(),
                totalUsed,
                totalLimit
              };
              // ✅ Nie nadpisuj istniejącego wpisu - inaczej kolejne próby resetują timestamp
              // i cron nigdy nie spełni warunku "minęła 1h".
              const existing = await kv.get(key);
              if (!existing) {
                await kv.set(key, JSON.stringify(payload), { ex: 60 * 60 * 48 }); // 48h TTL
                console.log('🕒 [LIMIT-QUEUE] Zapisano osiągnięty limit w KV (NEW):', { key, payload });
              } else {
                let existingPayload = null;
                try {
                  existingPayload = typeof existing === 'string' ? JSON.parse(existing) : existing;
                } catch {
                  existingPayload = existing;
                }
                console.log('🕒 [LIMIT-QUEUE] Wpis już istnieje - nie nadpisuję (KEEP TIMESTAMP):', {
                  key,
                  existingTimestamp: existingPayload?.timestamp || null
                });
              }
            } catch (kvErr) {
              console.error('⚠️ [LIMIT-QUEUE] Nie udało się zapisać do KV:', kvErr);
            }
          } else {
            console.warn('⚠️ [LIMIT-QUEUE] Pomijam zapis do KV (brak customerId lub KV nie skonfigurowany)');
          }
          
          // ✅ TRACKING: Zapisuj błąd (asynchronicznie, nie blokuje)
          trackError('shopify_metafield_limit', 'logged_in', deviceToken, ip, {
            customer_id: customerId,
            total_used: totalUsed,
            total_limit: totalLimit,
            product_type: finalProductType
          });
          
          return res.status(403).json({
            error: 'Usage limit exceeded',
            message: `Wykorzystałeś wszystkie dostępne transformacje (${totalUsed}/${totalLimit}). Skontaktuj się z nami dla więcej.`,
            usedCount: totalUsed,
            totalLimit: totalLimit
          });
        }

        console.log(`✅ [METAFIELD-CHECK] Limit OK - kontynuuję transformację`);
      } catch (limitError) {
        console.error('❌ [METAFIELD-CHECK] Błąd sprawdzania limitów:', {
          error: limitError.message,
          stack: limitError.stack,
          customerId: customerId,
          productType: finalProductType
        });
        // ⚠️ KRYTYCZNE: Jeśli błąd sprawdzania limitów dla zalogowanego użytkownika, BLOKUJ
        // Bezpieczniejsze niż pozwalanie - użytkownik może spróbować ponownie
        return res.status(500).json({
          error: 'Internal server error',
          message: 'Błąd sprawdzania limitu użycia. Spróbuj ponownie za chwilę.',
          productType: finalProductType
        });
      }
    } else {
      // Niezalogowany użytkownik - chwilowo brak limitu IP (kontroluje frontend)
      console.log(`👤 [TRANSFORM] Niezalogowany użytkownik - pomijam limit IP (tymczasowo wyłączony)`);
    }

    // Prepare input parameters based on model
    let inputParams = {
      prompt: config.prompt
    };

    // Add model-specific parameters
    if (config.model.includes('mirage-ghibli')) {
      // Ghibli anime model parameters
      inputParams = {
        ...inputParams,
        image: imageDataUri,
        go_fast: config.go_fast,
        guidance_scale: config.guidance_scale,
        prompt_strength: config.prompt_strength,
        num_inference_steps: config.num_inference_steps
      };
    } else if (config.model.includes('sdxl-pixar')) {
      // Pixar model parameters - img2img with detailed settings
      inputParams = {
        task: config.task,
        prompt: config.prompt,
        negative_prompt: config.negative_prompt,
        image: imageDataUri,
        scheduler: config.scheduler,
        guidance_scale: config.guidance_scale,
        prompt_strength: config.prompt_strength,
        num_inference_steps: config.num_inference_steps,
        width: config.width,
        height: config.height,
        refine: config.refine,
        high_noise_frac: config.high_noise_frac,
        output_format: config.output_format,
        disable_safety_checker: config.disable_safety_checker
      };
    } else if (config.apiType === 'nano-banana') {
      // Nano-banana model parameters - obsługuje 1 lub 2 obrazki
      // ⚠️ KRYTYCZNE: Nano-banana wymaga URL, nie base64! Musimy uploadować do Vercel Blob
      
      // Domyślne parametry z config
      let aspectRatio = config.parameters.aspect_ratio;
      let outputFormat = config.parameters.output_format;
      let guidance = config.parameters.guidance;
      
      // ⚠️ KRYTYCZNE: Dla kotów aspect_ratio ZAWSZE "3:4" (pionowy)!
      // NIE ZMIENIAJ dynamicznie na podstawie obrazu użytkownika!
      // Model wycina twarz i nakłada na pionową miniaturkę.
      
      console.log(`🖼️ [NANO-BANANA] Using aspect_ratio: ${aspectRatio}, output_format: ${outputFormat}, guidance: ${guidance}`);
      
      // Sprawdź czy to styl boho (1 obrazek) czy koty/zamkowy (2 obrazki lub 1 obrazek)
      if (finalProductType === 'boho') {
        // Style boho - tylko obrazek użytkownika (base64 - działa dla boho)
        // ✅ FIX: Dodaj negative_prompt do głównego promptu
        let fullPrompt = config.prompt;
        if (config.negative_prompt) {
          fullPrompt += ` [NEGATIVE PROMPT: ${config.negative_prompt}]`;
          console.log(`✅ [NANO-BANANA] Added negative prompt to boho style`);
        }
        
        inputParams = {
          prompt: fullPrompt,
          image_input: [imageDataUri], // Base64 dla boho (działa)
          aspect_ratio: aspectRatio,
          output_format: outputFormat,
          guidance: guidance
        };
        
        console.log(`📸 [NANO-BANANA] Boho style - 1 obrazek (user base64): ${imageDataUri.substring(0, 50)}...`);
        console.log(`📸 [NANO-BANANA] image_input array length: ${inputParams.image_input.length}`);
      } else if (finalProductType === 'other' || finalProductType === 'para_krolewska' || finalProductType === 'caricature-new' || (config.parameters?.image_input?.length === 1 && config.parameters.image_input[0] === "USER_IMAGE")) {
        // Style na 1 obrazek usera (zamkowy/krolewski-para/caricature-new i inne single-image)
        // ✅ UPLOAD BASE64 DO VERCEL BLOB (nano-banana wymaga URL)
        console.log('📤 [NANO-BANANA] Uploading user image to Vercel Blob Storage (single-image nano-banana requires URL, not base64)...');
        const baseUrl = 'https://customify-s56o.vercel.app';
        const uploadResponse = await fetch(`${baseUrl}/api/upload-temp-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: imageDataUri,
            filename: `${selectedStyle}-${Date.now()}.jpg`
          })
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('❌ [NANO-BANANA] Vercel Blob upload failed:', errorText);
          throw new Error(`Vercel Blob upload failed: ${uploadResponse.status} - ${errorText}`);
        }

        const uploadResult = await uploadResponse.json();
        const userImageUrl = uploadResult.imageUrl;
        console.log('✅ [NANO-BANANA] User image uploaded to Vercel Blob:', userImageUrl);
        
        inputParams = {
          prompt: config.prompt,
          image_input: [userImageUrl], // URL z Vercel Blob dla zamkowy
          aspect_ratio: aspectRatio,
          output_format: outputFormat,
          guidance: guidance
        };
        
        console.log(`📸 [NANO-BANANA] Single-image nano-banana style (${selectedStyle}) - 1 obrazek (user URL): ${userImageUrl}`);
        console.log(`📸 [NANO-BANANA] image_input array length: ${inputParams.image_input.length}`);
      } else {
        // Style kotów - 2 obrazki (miniaturka + użytkownik)
        inputParams = {
          prompt: config.prompt,
          image_input: [
            config.parameters.image_input[0], // Miniaturka stylu z parameters (już URL)
            imageDataUri // Obrazek użytkownika (base64 - działa dla kotów)
          ],
          aspect_ratio: aspectRatio,
          output_format: outputFormat
        };
        
        // Szczegółowe logowanie dla debugowania
        console.log(`📸 [NANO-BANANA] Cats style - Obraz 1 (miniaturka): ${config.parameters.image_input[0]}`);
        console.log(`📸 [NANO-BANANA] Cats style - Obraz 2 (user): ${imageDataUri.substring(0, 50)}...`);
        console.log(`📸 [NANO-BANANA] image_input array length: ${inputParams.image_input.length}`);
      }
    } else {
      // Stable Diffusion model parameters (default)
      inputParams = {
        ...inputParams,
        image: imageDataUri,
        num_inference_steps: config.num_inference_steps,
        guidance_scale: config.guidance_scale,
        strength: config.strength
      };
    }

    console.log(`Running model: ${config.model}`);
    console.log(`Input parameters:`, inputParams);

    let output;
    let imageUrl;

        // ✅ STYLE KARYKATURY - UŻYWAJ SEGMIND CARICATURE
    if (config.apiType === 'segmind-caricature') {
      console.log('🎭 [SEGMIND] Detected caricature style - using Segmind Caricature API');                                                                     
      
      try {
        // Upload obrazu do Vercel Blob Storage żeby uzyskać stały URL
        console.log('📤 [VERCEL-BLOB] Uploading image to Vercel Blob Storage...');                                                                              
        
        const baseUrl = 'https://customify-s56o.vercel.app';
        const uploadResponse = await fetch(`${baseUrl}/api/upload-temp-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: imageDataUri,
            filename: `caricature-${Date.now()}.jpg`
          })
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('❌ [VERCEL-BLOB] Upload failed:', errorText);
          throw new Error(`Vercel Blob upload failed: ${uploadResponse.status} - ${errorText}`);
        }

        const uploadResult = await uploadResponse.json();
        const blobImageUrl = uploadResult.imageUrl;
        console.log('✅ [VERCEL-BLOB] Image uploaded:', blobImageUrl);                                                                        

        // Wywołaj Segmind Caricature API z URL
        const result = await segmindCaricature(blobImageUrl);
        console.log('✅ [SEGMIND] Caricature generation completed successfully');                                                                               
        
        // Zwróć URL do wygenerowanej karykatury
        imageUrl = result.image || result.output || result.url;
        if (!imageUrl) {
          throw new Error('No image URL returned from Segmind API');
        }
        
      } catch (error) {
        console.error('❌ [SEGMIND] Caricature generation failed:', error);
        throw error;
      }
    }
    // ✅ STYLE KRÓLA - UŻYWAJ SEGMIND FACESWAP
    else if (config.apiType === 'segmind-faceswap') {
      console.log('🎭 [SEGMIND] Detected king style - using Segmind Faceswap v4');
      
      try {
        // Wywołaj Segmind z target_image (URL) i swap_image (base64)
        const targetImageUrl = config.parameters.target_image;
        const swapImageBase64 = imageDataUri; // Zdjęcie użytkownika (data URI)
        
        console.log('🎯 [TRANSFORM] ===== WYWOŁANIE SEGMIND FACESWAP =====');
        console.log('🎯 [TRANSFORM] Selected style:', selectedStyle);
        console.log('🎯 [TRANSFORM] Target image URL:', targetImageUrl);
        console.log('🎯 [TRANSFORM] Target image URL type:', typeof targetImageUrl);
        console.log('🎯 [TRANSFORM] Config parameters:', JSON.stringify(config.parameters, null, 2));
        console.log('🎯 [TRANSFORM] Swap image (base64) length:', swapImageBase64?.length);
        console.log('🎯 [TRANSFORM] ======================================');
        
        imageUrl = await segmindFaceswap(targetImageUrl, swapImageBase64);
        console.log('✅ [SEGMIND] Face-swap completed successfully');
        
      } catch (error) {
        console.error('❌ [SEGMIND] Face-swap failed:', error);
        
        if (error.name === 'AbortError') {
          return res.status(504).json({
            error: 'Request timeout - Segmind API took too long to respond',
            details: 'Please try again with a smaller image or different style'
          });
        }
        
        return res.status(500).json({
          error: 'Face-swap failed',
          details: error.message
        });
      }
      
    }
    // ✅ STYLE AKWARELE - UŻYWAJ SEGMIND BECOME-IMAGE
    else if (config.apiType === 'segmind-become-image') {
      console.log('🎨 [SEGMIND] Detected watercolor style - using Segmind Become-Image API');                                                                     
      
      try {
        // Upload obrazu użytkownika do Vercel Blob Storage żeby uzyskać stały URL
        console.log('📤 [VERCEL-BLOB] Uploading user image to Vercel Blob Storage...');                                                                              
        
        const baseUrl = 'https://customify-s56o.vercel.app';
        const uploadResponse = await fetch(`${baseUrl}/api/upload-temp-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: imageDataUri,
            filename: `watercolor-${Date.now()}.jpg`
          })
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('❌ [VERCEL-BLOB] Upload failed:', errorText);
          throw new Error(`Vercel Blob upload failed: ${uploadResponse.status} - ${errorText}`);
        }

        const uploadResult = await uploadResponse.json();
        const userImageUrl = uploadResult.imageUrl;
        console.log('✅ [VERCEL-BLOB] User image uploaded:', userImageUrl);

        // URL miniaturki stylu z konfiguracji
        const styleImageUrl = config.parameters.image_to_become;
        console.log('🎨 [SEGMIND] Style image URL:', styleImageUrl);
        
        // Wywołaj Segmind Become-Image API
        const resultImage = await segmindBecomeImage(userImageUrl, styleImageUrl, config.parameters || {});
        console.log('✅ [SEGMIND] Watercolor generation completed successfully');                                                                               
        
        // Sprawdź czy to URL czy base64 i obsłuż odpowiednio
        if (typeof resultImage === 'string') {
          if (resultImage.startsWith('http')) {
            imageUrl = resultImage; // URL
          } else if (resultImage.startsWith('data:')) {
            imageUrl = resultImage; // Data URI
          } else {
            // Może być base64 bez prefiksu - dodaj prefix
            imageUrl = `data:image/png;base64,${resultImage}`;
          }
        } else {
          throw new Error('Unexpected response format from Segmind Become-Image API');
        }
        
        if (!imageUrl) {
          throw new Error('No image URL returned from Segmind Become-Image API');
        }
        
      } catch (error) {
        console.error('❌ [SEGMIND] Watercolor generation failed:', error);
        throw error;
      }
    }
    // ✅ NOWY STYL OPENAI IMG2IMG (caricature-new) - UŻYWAJ GPT-IMAGE-1 EDITS
    else if (config.apiType === 'openai-caricature') {
      console.log('🤖 [OPENAI] Detected OpenAI caricature-new style - using GPT-Image-1 Edits API (img2img)');
      try {
        if (!imageDataUri) {
          throw new Error('Missing imageData for OpenAI caricature');
        }

        // Wyciągnij MIME z data URL (png/jpeg/webp) i zamień na plik z poprawnym typem
        const mimeMatch = imageDataUri.match(/^data:(image\/(png|jpeg|jpg|webp));base64,/i);
        const mimeType = mimeMatch ? mimeMatch[1].toLowerCase() : 'image/jpeg';
        const extension = mimeMatch && mimeMatch[2] ? mimeMatch[2].toLowerCase() : 'jpg';
        const base64Data = imageDataUri.split(',')[1] || imageDataUri;
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const imageFile = (typeof File !== 'undefined')
          ? new File([imageBuffer], `image.${extension}`, { type: mimeType })
          : await toFile(imageBuffer, `image.${extension}`, { type: mimeType });

        console.log('📤 [OPENAI] Image payload debug:', {
          mimeType,
          extension,
          bufferLength: imageBuffer.length,
          fileType: imageFile?.type,
          fileName: imageFile?.name,
          fileSize: imageFile?.size
        });

        const openaiPrompt = config.prompt;
        if (!openaiPrompt) {
          throw new Error('Missing prompt in style configuration');
        }

        console.log('📤 [OPENAI] Preparing images.edit payload (caricature-new)...');
        if (!openai) {
          throw new Error('OpenAI client not initialized');
        }
        const response = await openai.images.edit({
          model: config.parameters.model,
          image: imageFile,
          prompt: openaiPrompt,
          size: config.parameters.size || '1024x1536',
          output_format: config.parameters.output_format || 'jpeg',
          background: config.parameters.background || 'opaque',
          n: config.parameters.n || 1,
        });

        if (response && response.data && response.data.length > 0) {
          const base64Image = response.data[0].b64_json;
          if (!base64Image) {
            throw new Error('No base64 image in OpenAI response');
          }
          imageUrl = `data:image/jpeg;base64,${base64Image}`;
          console.log('✅ [OPENAI] Caricature-new generated successfully');
        } else {
          throw new Error('No image returned from OpenAI Edits API');
        }
      } catch (error) {
        console.error('❌ [OPENAI] Caricature-new generation failed:', error);
        if (error.name === 'AbortError') {
          return res.status(504).json({
            error: 'Request timeout - OpenAI API took too long to respond',
            details: 'Please try again with a different style'
          });
        }
        return res.status(500).json({
          error: 'OpenAI generation failed',
          details: error.message
        });
      }
    }
    // ✅ STYLE OPENAI - UŻYWAJ GPT-IMAGE-1
    else if (config.apiType === 'openai') {
      console.log('🤖 [OPENAI] Detected OpenAI style - using GPT-Image-1 API');
      
      try {
        // OpenAI GPT-Image-1 wymaga tylko prompta (nie przyjmuje obrazu jako input)
        // Musimy stworzyć prompt opisujący transformację na podstawie zdjęcia użytkownika
        const openaiPrompt = config.prompt || prompt;
        
        console.log('🎨 [OPENAI] Generating image with GPT-Image-1...');
        console.log('🎨 [OPENAI] Prompt:', openaiPrompt.substring(0, 100) + '...');
        
        // Wywołaj OpenAI API
        const result = await openaiImageGeneration(openaiPrompt, config.parameters || {});
        console.log('✅ [OPENAI] Image generation completed successfully');
        
        // Zwróć URL do wygenerowanego obrazu
        imageUrl = result.image || result.output || result.url;
        if (!imageUrl) {
          throw new Error('No image URL returned from OpenAI API');
        }
        
      } catch (error) {
        console.error('❌ [OPENAI] Image generation failed:', error);
        
        if (error.name === 'AbortError') {
          return res.status(504).json({
            error: 'Request timeout - OpenAI API took too long to respond',
            details: 'Please try again with a different style'
          });
        }
        
        return res.status(500).json({
          error: 'OpenAI generation failed',
          details: error.message
        });
      }
    } else {
      // ✅ INNE STYLE - UŻYWAJ REPLICATE
      console.log('🎨 [REPLICATE] Using Replicate for non-king styles');
      
      // Check if Replicate is available
      if (!replicate) {
        console.error('❌ [REPLICATE] Replicate not initialized - missing REPLICATE_API_TOKEN');
        return res.status(500).json({ 
          error: 'AI service not configured. Please contact support.' 
        });
      }

      // Retry logic for Replicate API (similar to Segmind)
      const maxRetries = 3;
      const retryDelay = 2000; // 2 sekundy bazowego opóźnienia
      let lastError;
      let output = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // Add timeout and better error handling (following Replicate docs)
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout - model took too long')), 300000); // 5 minutes
          });

          console.log(`🚀 [REPLICATE] Starting prediction with model: ${config.model} (attempt ${attempt}/${maxRetries})`);
          const replicatePromise = replicate.run(config.model, {
            input: inputParams
          });

          output = await Promise.race([replicatePromise, timeoutPromise]);
          console.log(`✅ [REPLICATE] Prediction completed successfully (attempt ${attempt})`);
          console.log(`📸 [REPLICATE] Output type:`, typeof output);
          console.log(`📸 [REPLICATE] Output:`, output);
          
          // Success - break out of retry loop
          break;
        } catch (error) {
          lastError = error;
          
          // Check if error is retryable (5xx server errors or timeout)
          // Replicate ApiError has response.status property
          const errorStatus = error.response?.status || error.status || 
            (error.message && error.message.match(/status (\d{3})/)?.[1]);
          const statusCode = errorStatus ? parseInt(errorStatus) : null;
          
          const isRetryable = 
            (statusCode >= 500) ||
            (error.message && (
              error.message.includes('500') ||
              error.message.includes('502') ||
              error.message.includes('503') ||
              error.message.includes('504') ||
              error.message.includes('timeout') ||
              error.message.includes('Internal Server Error') ||
              error.message.includes('Internal server error')
            ));
          
          if (isRetryable && attempt < maxRetries) {
            const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff: 2s, 4s, 8s
            console.warn(`⚠️ [REPLICATE] Server error (attempt ${attempt}/${maxRetries}) - retrying in ${delay}ms...`);
            console.warn(`⚠️ [REPLICATE] Error:`, error.message?.substring(0, 200) || error.toString());
            await new Promise(resolve => setTimeout(resolve, delay));
            continue; // Retry
          } else {
            // Non-retryable error or max retries reached
            console.error(`❌ [REPLICATE] Prediction failed after ${attempt} attempts:`, error);
            throw error;
          }
        }
      }

      if (!output) {
        throw lastError || new Error('Replicate prediction failed after all retries');
      }

      // Handle different output formats based on model
      if (config.model.includes('nano-banana')) {
        // Nano-banana returns direct string URL
        imageUrl = output;
      } else if (Array.isArray(output)) {
        // Standard Replicate models return array
        imageUrl = output[0];
      } else if (typeof output === 'string') {
        // Fallback for string output
        imageUrl = output;
      } else if (output && output.url) {
        // Some models return object with url() method
        imageUrl = output.url();
      } else {
        console.error('❌ [REPLICATE] Unknown output format:', output);
        return res.status(500).json({ error: 'Invalid response format from AI model' });
      }
    }

    // ✅ WSPÓLNA LOGIKA - imageUrl jest już ustawione (z PiAPI lub Replicate)
    if (finalProductType === 'spotify_frame') {
      console.log('🎵 [SPOTIFY] Kompozycja ramki jest po stronie frontendu (preview)');
    }

    // ✅ WATERMARK DLA REPLICATE URL-I - USUNIĘTY (problemy z Sharp w Vercel)
    // TODO: Przywrócić po rozwiązaniu problemów z Sharp

    // ✅ ZMIENNA DO PRZECHOWYWANIA DEBUG INFO Z SAVE-GENERATION (PRZED BLOKIEM IF)
    let saveGenerationDebug = null;
    
    // ✅ ZAPIS GENERACJI W VERCEL BLOB STORAGE (przed inkrementacją licznika)
    // ✅ ZAPISUJ DLA WSZYSTKICH - użyj IP jeśli brak customerId/email
    console.log(`🔍🔍🔍 [TRANSFORM] ===== SPRAWDZAM WARUNEK ZAPISU GENERACJI =====`);
    console.log(`🔍 [TRANSFORM] imageUrl exists: ${!!imageUrl}`);
    console.log(`🔍 [TRANSFORM] customerId: ${customerId}, type: ${typeof customerId}`);
    console.log(`🔍 [TRANSFORM] email: ${email}`);
    console.log(`🔍 [TRANSFORM] ip: ${ip}`);
    console.log(`🔍 [TRANSFORM] Warunek: imageUrl = ${!!imageUrl}`);
    console.log(`🔍 [TRANSFORM] productType: ${finalProductType}`);
    
    // ✅ Inicjalizuj finalImageUrl i watermarkedImageUrl - będą ustawione podczas przetwarzania obrazu
    let finalImageUrl = imageUrl; // Domyślnie użyj imageUrl (dla Replicate URLs)
    let watermarkedImageUrl = null; // ✅ Z watermarkem (backend PNG) - dla podglądu/koszyka
    let watermarkedImageBase64 = null; // ✅ NOWE: Base64 watermarku (dla /api/products - BEZ PONOWNEGO DOWNLOADU)
    
    if (imageUrl) {
      console.log(`✅ [TRANSFORM] WARUNEK SPEŁNIONY - zapisuję generację`);
      console.log(`💾 [TRANSFORM] Zapisuję generację w Vercel Blob Storage dla klienta...`);
      console.log(`🔍 [TRANSFORM] customerId type: ${typeof customerId}, value: ${customerId}`);
      console.log(`🔍 [TRANSFORM] email: ${email}`);
      
      try {
        // Sprawdź czy obraz jest już w Vercel Blob
        // finalImageUrl będzie ustawiony podczas przetwarzania (base64 → Vercel Blob URL)
        // watermarkedImageUrl będzie ustawiony podczas przetwarzania (z backend watermark PNG)
        
        // 🚨 FIX: Jeśli to base64 data URI (Segmind Caricature), uploaduj do Vercel Blob BEZPOŚREDNIO
        // Base64 przekracza limit Vercel 4.5MB w request body - użyj SDK zamiast API endpoint
        if (imageUrl && imageUrl.startsWith('data:')) {
          console.log(`📤 [TRANSFORM] Wykryto base64 data URI - uploaduję bezpośrednio do Vercel Blob (SDK)...`);
          
          try {
            // Sprawdź czy token jest skonfigurowany
            if (!process.env.customify_READ_WRITE_TOKEN) {
              console.error('❌ [TRANSFORM] customify_READ_WRITE_TOKEN not configured - cannot upload base64');
              throw new Error('Vercel Blob Storage not configured');
            }
            
            // Konwertuj data URI na buffer
            const mimeMatch = imageUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,/i);
            const contentType = mimeMatch ? mimeMatch[1].toLowerCase() : 'image/jpeg';
            const extension = contentType === 'image/png' ? 'png' : 'jpg';
            const base64Data = imageUrl.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, '');
            const imageBuffer = Buffer.from(base64Data, 'base64');
            console.log(`📦 [TRANSFORM] Base64 buffer size: ${imageBuffer.length} bytes (${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
            
            // ✅ ZAPISZ OBRAZEK BEZ WATERMARKU (do realizacji zamówienia)
            const timestamp = Date.now();
            const uniqueFilename = `customify/temp/generation-${timestamp}.${extension}`;
            
            const blob = await put(uniqueFilename, imageBuffer, {
              access: 'public',
              contentType: contentType,
              token: process.env.customify_READ_WRITE_TOKEN,
            });
            
                finalImageUrl = blob.url;
                console.log(`✅ [TRANSFORM] Obraz BEZ watermarku zapisany w Vercel Blob (SDK): ${finalImageUrl.substring(0, 50)}...`);
                
                // ✅ WATERMARK WYMAGANY - zastosuj backend watermark PNG
                try {
                  console.log('🎨 [TRANSFORM] Applying required PNG watermark to base64 image...');
                  const watermarkOutputFormat = finalProductType === 'spotify_frame' ? 'png' : 'jpeg';
                  const watermarkedBuffer = await addWatermarkPNG(imageBuffer, { outputFormat: watermarkOutputFormat });
                  
                  // ✅ ZAPISZ BASE64 WATERMARKU (dla /api/products - BEZ PONOWNEGO DOWNLOADU)
                  watermarkedImageBase64 = watermarkOutputFormat === 'png'
                    ? `data:image/png;base64,${watermarkedBuffer.toString('base64')}`
                    : watermarkedBuffer.toString('base64');
                  console.log(`✅ [TRANSFORM] Watermark base64 saved (${watermarkedImageBase64.length} chars) - no download needed in /api/products`);
                  
                  const watermarkedTimestamp = Date.now();
                  const watermarkExt = watermarkOutputFormat === 'png' ? 'png' : 'jpg';
                  const watermarkedFilename = `customify/temp/generation-watermarked-${watermarkedTimestamp}.${watermarkExt}`;
                  
                  const watermarkedBlob = await put(watermarkedFilename, watermarkedBuffer, {
                    access: 'public',
                    contentType: watermarkOutputFormat === 'png' ? 'image/png' : 'image/jpeg',
                    token: process.env.customify_READ_WRITE_TOKEN,
                  });
                  
                  watermarkedImageUrl = watermarkedBlob.url;
                  console.log(`✅ [TRANSFORM] Obraz Z watermarkem zapisany: ${watermarkedImageUrl.substring(0, 50)}...`);
                  
                } catch (watermarkError) {
                  // ❌ WATERMARK WYMAGANY - nie możemy kontynuować bez watermarku
                  console.error('❌ [TRANSFORM] Watermark application failed:', watermarkError);
                  throw new Error(`Watermark is required but failed: ${watermarkError.message}`);
                }
          } catch (uploadError) {
            console.error('⚠️ [TRANSFORM] Błąd uploadu base64 do Vercel Blob (SDK):', uploadError.message);
            // Jeśli upload się nie powiódł, nie możemy użyć base64 (przekroczy limit w save-generation-v2)
            // Ustaw finalImageUrl na null - pominie zapis w historii, ale zwróci base64 do frontendu
            finalImageUrl = null;
            console.warn('⚠️ [TRANSFORM] Obraz nie zostanie zapisany w historii - upload przez SDK nie powiódł się');
            console.warn('⚠️ [TRANSFORM] Transformacja się udała - zwrócę base64 do frontendu, ale bez zapisu w historii');
          }
        }
        // Jeśli to URL z Replicate (nie Vercel Blob), uploaduj do Vercel Blob przez SDK
        // Replicate URLs wygasają po 24h - musimy zapisać do Vercel Blob dla trwałości
        else if (imageUrl.includes('replicate.delivery') || imageUrl.includes('pbxt')) {
          console.log(`📤 [TRANSFORM] Wykryto URL z Replicate - uploaduję do Vercel Blob (SDK)...`);
          
          try {
            // Sprawdź czy token jest skonfigurowany
            if (!process.env.customify_READ_WRITE_TOKEN) {
              console.warn('⚠️ [TRANSFORM] customify_READ_WRITE_TOKEN not configured - używam URL z Replicate (wygaśnie po 24h)');
            } else {
              // Pobierz obraz z Replicate
              const imageResponse = await fetch(imageUrl);
              if (imageResponse.ok) {
                const imageBuffer = await imageResponse.arrayBuffer();
                const buffer = Buffer.from(imageBuffer);
                console.log(`📦 [TRANSFORM] Replicate image size: ${buffer.length} bytes (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
                
                // ✅ ZAPISZ OBRAZEK BEZ WATERMARKU (do realizacji zamówienia)
                const timestamp = Date.now();
                const uniqueFilename = `customify/temp/generation-${timestamp}.jpg`;
                
                const blob = await put(uniqueFilename, buffer, {
                  access: 'public',
                  contentType: 'image/jpeg',
                  token: process.env.customify_READ_WRITE_TOKEN,
                });
                
                finalImageUrl = blob.url;
                console.log(`✅ [TRANSFORM] Obraz BEZ watermarku zapisany w Vercel Blob (SDK): ${finalImageUrl.substring(0, 50)}...`);
                
                // ✅ WATERMARK WYMAGANY - zastosuj backend watermark PNG
                try {
                  console.log('🎨 [TRANSFORM] Applying required PNG watermark to Replicate image...');
                  const watermarkOutputFormat = finalProductType === 'spotify_frame' ? 'png' : 'jpeg';
                  const watermarkedBuffer = await addWatermarkPNG(buffer, { outputFormat: watermarkOutputFormat });
                  
                  // ✅ ZAPISZ BASE64 WATERMARKU (dla /api/products - BEZ PONOWNEGO DOWNLOADU)
                  watermarkedImageBase64 = watermarkOutputFormat === 'png'
                    ? `data:image/png;base64,${watermarkedBuffer.toString('base64')}`
                    : watermarkedBuffer.toString('base64');
                  console.log(`✅ [TRANSFORM] Watermark base64 saved (${watermarkedImageBase64.length} chars) - no download needed in /api/products`);
                  
                  const watermarkedTimestamp = Date.now();
                  const watermarkExt = watermarkOutputFormat === 'png' ? 'png' : 'jpg';
                  const watermarkedFilename = `customify/temp/generation-watermarked-${watermarkedTimestamp}.${watermarkExt}`;
                  
                  const watermarkedBlob = await put(watermarkedFilename, watermarkedBuffer, {
                    access: 'public',
                    contentType: watermarkOutputFormat === 'png' ? 'image/png' : 'image/jpeg',
                    token: process.env.customify_READ_WRITE_TOKEN,
                  });
                  
                  watermarkedImageUrl = watermarkedBlob.url;
                  console.log(`✅ [TRANSFORM] Obraz Z watermarkem zapisany: ${watermarkedImageUrl.substring(0, 50)}...`);
                  
                } catch (watermarkError) {
                  // ❌ WATERMARK WYMAGANY - nie możemy kontynuować bez watermarku
                  console.error('❌ [TRANSFORM] Watermark application failed:', watermarkError);
                  throw new Error(`Watermark is required but failed: ${watermarkError.message}`);
                }
              } else {
                console.warn('⚠️ [TRANSFORM] Nie udało się pobrać obrazu z Replicate - używam oryginalnego URL');
              }
            }
          } catch (uploadError) {
            console.error('⚠️ [TRANSFORM] Błąd uploadu do Vercel Blob (SDK):', uploadError.message);
            console.warn('⚠️ [TRANSFORM] Używam URL z Replicate (wygaśnie po 24h)');
            // Użyj oryginalnego URL z Replicate
          }
        }
        
        // ✅ SPRAWDŹ CZY customerId TO NUMERYCZNY ID (Shopify Customer ID)
        // Shopify Customer ID to numeryczny string (np. "123456789")
        let shopifyCustomerId = null;
        
        if (customerId !== undefined && customerId !== null) {
          const customerIdStr = String(customerId);
          shopifyCustomerId = customerIdStr;
          console.log(`🔍 [TRANSFORM] customerIdStr (po normalizacji): ${shopifyCustomerId}, type: ${typeof shopifyCustomerId}`);
          
          // Jeśli customerId zawiera "gid://shopify/Customer/", usuń prefix
          if (shopifyCustomerId.includes('gid://shopify/Customer/')) {
            shopifyCustomerId = shopifyCustomerId.replace('gid://shopify/Customer/', '');
            console.log(`🔧 [TRANSFORM] Usunięto prefix GID, customerId: ${shopifyCustomerId}`);
          }
          
          // Jeśli customerId nie jest numeryczny, loguj warning
          if (!/^\d+$/.test(shopifyCustomerId)) {
            console.warn(`⚠️ [TRANSFORM] customerId nie jest numeryczny: ${shopifyCustomerId}`);
            console.warn(`⚠️ [TRANSFORM] Shopify Customer ID musi być numeryczny (np. "123456789")`);
            // Użyj oryginalnego customerId - może działać
          } else {
            console.log(`✅ [TRANSFORM] customerId jest numeryczny: ${shopifyCustomerId}`);
          }
        }
        
        // ✅ SZCZEGÓŁOWE LOGOWANIE PRZED ZAPISEM
        console.log(`🔍 [TRANSFORM] Przed zapisem generacji:`);
        console.log(`🔍 [TRANSFORM] customerId z req.body:`, req.body.customerId, typeof req.body.customerId);
        console.log(`🔍 [TRANSFORM] customerId po destructuring:`, customerId, typeof customerId);
        console.log(`🔍 [TRANSFORM] shopifyCustomerId (po normalizacji):`, shopifyCustomerId || (customerId !== undefined && customerId !== null ? String(customerId) : null), typeof (shopifyCustomerId || (customerId !== undefined && customerId !== null ? String(customerId) : null)));
        console.log(`🔍 [TRANSFORM] email:`, email);
        console.log(`🔍 [TRANSFORM] imageUrl exists:`, !!imageUrl);
        console.log(`🔍 [TRANSFORM] finalImageUrl:`, finalImageUrl?.substring(0, 50) || 'null');
        
        // Wywołaj endpoint zapisu generacji
        // ✅ Dla niezalogowanych używamy IP jako identyfikatora
        // ✅ Użyj email z GraphQL (customerEmailFromGraphQL) jeśli dostępny, w przeciwnym razie z request body
        // customerEmailFromGraphQL jest zdefiniowany na wyższym poziomie scope (linia ~1497)
        const finalEmail = customerEmailFromGraphQL || email || null;
        
        console.log(`📧 [TRANSFORM] Email do zapisu generacji:`, {
          fromGraphQL: customerEmailFromGraphQL || null,
          fromRequestBody: email || null,
          final: finalEmail || null
        });
        
        const saveData = {
          customerId: shopifyCustomerId || (customerId !== undefined && customerId !== null ? String(customerId) : null),
          email: finalEmail, // ✅ Użyj email z GraphQL (dla zalogowanych) lub z request body (dla niezalogowanych)
          ip: ip || null, // ✅ Przekaż IP dla niezalogowanych
          ipHash,
          deviceToken,
          imageUrl: finalImageUrl, // ✅ BEZ watermarku (do realizacji zamówienia)
          watermarkedImageUrl: watermarkedImageUrl || null, // ✅ Z watermarkem (backend PNG) - dla podglądu/koszyka
          style: style || prompt || 'unknown', // ✅ UŻYJ CZYSTEGO STYLU (nie prompt) - dla emaili i wyświetlania
          size: 'a4', // ✅ Domyślny rozmiar A4 (30x40cm) - użytkownik może zmienić później
          productType: finalProductType,
        originalImageUrl: null, // Opcjonalnie - można dodać później
        productHandle: productHandle || null
        };
        
        // ✅ WALIDACJA: Upewnij się że finalImageUrl jest ustawiony przed zapisem
        if (!finalImageUrl) {
          console.error('❌ [TRANSFORM] ===== BRAK finalImageUrl - POMIJAM ZAPIS GENERACJI =====');
          console.error('❌ [TRANSFORM] finalImageUrl jest null/undefined - generacja NIE zostanie zapisana!');
          console.error('❌ [TRANSFORM] imageUrl (oryginał):', imageUrl?.substring(0, 100));
          console.error('❌ [TRANSFORM] finalImageUrl:', finalImageUrl);
          // Kontynuuj bez zapisu - zwróć wynik do frontendu
        } else {
          try {
            console.log(`📤 [TRANSFORM] Wywołuję /api/save-generation-v2 z danymi:`, {
              customerId: saveData.customerId,
              customerIdType: typeof saveData.customerId,
              email: saveData.email,
              ip: saveData.ip,
              ipHashPreview: ipHash ? ipHash.substring(0, 12) : null,
              deviceToken: saveData.deviceToken || 'null',
              hasImageUrl: !!saveData.imageUrl,
              imageUrlPreview: saveData.imageUrl?.substring(0, 100),
              style: saveData.style,
              productType: saveData.productType
            });
            
            const saveResponse = await fetch('https://customify-s56o.vercel.app/api/save-generation-v2', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(saveData)
            });
            
            console.log(`📥 [TRANSFORM] save-generation-v2 response status: ${saveResponse.status}`);
            
            if (saveResponse.ok) {
              const saveResult = await saveResponse.json();
              console.log(`✅ [TRANSFORM] Generacja zapisana w Vercel Blob Storage: ${saveResult.generationId}`);
              console.log(`📊 [TRANSFORM] Total generations: ${saveResult.totalGenerations || 'unknown'}`);
              console.log(`🔍 [TRANSFORM] Save-generation-v2 raw response:`, JSON.stringify(saveResult, null, 2));
              
              // ✅ LOGUJ SZCZEGÓŁY DLA DIAGNOSTYKI (dla Vercel Logs)
              if (saveResult.debug) {
                console.log(`🔍 [TRANSFORM] customerId w save-generation-v2: ${saveResult.debug.customerId || 'null'}`);
                console.log(`🔍 [TRANSFORM] customerIdType: ${saveResult.debug.customerIdType || 'null'}`);
                console.log(`🔍 [TRANSFORM] hasMetafieldUpdate: ${saveResult.debug.hasMetafieldUpdate || false}`);
                console.log(`🔍 [TRANSFORM] email: ${saveResult.debug.email || 'null'}`);
                console.log(`🔍 [TRANSFORM] metafieldUpdateAttempted: ${saveResult.debug.metafieldUpdateAttempted || false}`);
                console.log(`🔍 [TRANSFORM] metafieldUpdateSuccess: ${saveResult.debug.metafieldUpdateSuccess || false}`);
                console.log(`🔍 [TRANSFORM] metafieldUpdateError: ${saveResult.debug.metafieldUpdateError || 'none'}`);
                
                // ✅ ZWRÓĆ DEBUG INFO W RESPONSE (dla przeglądarki)
                saveGenerationDebug = {
                  ...saveResult.debug,
                  generationId: saveResult.generationId || null, // ✅ DODAJ generationId dla aktualizacji watermarku
                  deviceToken,
                  ipHash
                };
              } else {
                console.warn('⚠️ [TRANSFORM] save-generation-v2 response nie zawiera debug. Dodaję fallback info.');
                const fallbackDebug = {
                  missingDebug: true,
                  responseKeys: Object.keys(saveResult || {}),
                  warning: saveResult.warning || null,
                  message: saveResult.message || null,
                  generationId: saveResult.generationId || null
                };
                console.warn('⚠️ [TRANSFORM] Fallback debug info:', JSON.stringify(fallbackDebug, null, 2));
                saveGenerationDebug = {
                  ...fallbackDebug,
                  deviceToken,
                  ipHash
                };
              }
            } else {
              const errorText = await saveResponse.text();
              console.error('⚠️ [TRANSFORM] Błąd zapisu generacji:', errorText);
              console.error('⚠️ [TRANSFORM] Status:', saveResponse.status);
              saveGenerationDebug = { error: errorText, status: saveResponse.status, deviceToken, ipHash };
            }
          } catch (saveError) {
            console.error('⚠️ [TRANSFORM] Błąd zapisu generacji (nie blokuję odpowiedzi):', saveError);
            console.error('⚠️ [TRANSFORM] Stack:', saveError.stack);
            saveGenerationDebug = { error: saveError.message, stack: saveError.stack, deviceToken, ipHash };
            // Nie blokuj odpowiedzi - transformacja się udała
          }
        }
      } catch (uploadError) {
        console.error('⚠️ [TRANSFORM] Błąd uploadu/przetwarzania obrazu (nie blokuję odpowiedzi):', uploadError);
        console.error('⚠️ [TRANSFORM] Stack:', uploadError.stack);
        // Nie blokuj odpowiedzi - transformacja się udała
      }
    } else {
      // ✅ Brak imageUrl lub finalImageUrl = null (upload przez SDK nie powiódł się)
      const reason = !imageUrl ? 'brak imageUrl' : 'upload przez SDK nie powiódł się (za duży)';
      console.warn(`⚠️ [TRANSFORM] Pomijam zapis generacji - ${reason}`);
      saveGenerationDebug = { skipped: true, reason, hasImageUrl: !!imageUrl, finalImageUrl: finalImageUrl !== null, deviceToken, ipHash };
    }

    // ✅ INKREMENTACJA LICZNIKA PO UDANEJ TRANSFORMACJI
    console.log(`🔍 [TRANSFORM] Sprawdzam warunki inkrementacji:`, {
      hasCustomerId: !!customerId,
      hasAccessToken: !!accessToken,
      customerId: customerId,
      productType: finalProductType,
      isTest: isTest
    });
    
    // ✅ POMIŃ INKREMENTACJĘ DLA TEST USERS (whitelist - nieograniczone generacje)
    if (customerId && accessToken && !isTest) {
      console.log(`➕ [TRANSFORM] Inkrementuję licznik dla użytkownika ${customerId} (productType: ${finalProductType})`);
      
      try {
        // Pobierz obecną wartość (namespace: customify, key: usage_count)
        // ⚠️ Używam metafields (lista) zamiast metafield (pojedynczy) - bardziej niezawodne
        const getQuery = `
          query getCustomerUsage($id: ID!) {
            customer(id: $id) {
              id
              metafields(first: 10, namespace: "customify") {
                edges {
                  node {
                    id
                    key
                    value
                    type
                  }
                }
              }
            }
          }
        `;

        const getResponse = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken
          },
          body: JSON.stringify({
            query: getQuery,
            variables: {
              id: `gid://shopify/Customer/${customerId}`
            }
          })
        });

        const getData = await getResponse.json();
        
        // ⚠️ PARSOWANIE METAFIELDS Z LISTY
        const metafields = getData.data?.customer?.metafields?.edges || [];
        const usageCountMetafield = metafields.find(edge => edge.node.key === 'usage_count')?.node || null;
        
        console.log(`📊 [METAFIELD-INCREMENT] Get response:`, {
          hasData: !!getData.data,
          hasCustomer: !!getData.data?.customer,
          metafieldsCount: metafields.length,
          hasUsageCountMetafield: !!usageCountMetafield,
          errors: getData.errors || null
        });
        
        // ⚠️ DEBUG: Wszystkie metafields
        if (metafields.length > 0) {
          console.log(`🔍 [METAFIELD-INCREMENT] All metafields:`, metafields.map(e => ({ key: e.node.key, type: e.node.type, value: e.node.value?.substring(0, 50) })));
        }
        
        const existingMetafield = usageCountMetafield;
        
        // ⚠️ KRYTYCZNE: Jeśli metafield jest null, sprawdź czy to pierwsza generacja czy błąd query
        if (!existingMetafield) {
          console.warn(`⚠️ [METAFIELD-INCREMENT] Metafield usage_count nie znaleziony - to pierwsza generacja lub błąd query`);
          console.warn(`⚠️ [METAFIELD-INCREMENT] Customer ID: ${customerId}`);
        }
        
        // ⚠️ KRYTYCZNE: Sprawdź faktyczny typ definition (nie tylko metafield value)
        // Shopify NIE POZWALA na zmianę typu definition - musimy sprawdzić definition
        let actualDefinitionType = 'json'; // Default
        
        try {
          const definitionQuery = `
            query {
              metafieldDefinitions(first: 1, ownerType: CUSTOMER, namespace: "customify", key: "usage_count") {
                edges {
                  node {
                    id
                    type {
                      name
                    }
                  }
                }
              }
            }
          `;
          
          const definitionResponse = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': accessToken
            },
            body: JSON.stringify({ query: definitionQuery })
          });
          
          const definitionData = await definitionResponse.json();
          const definitionNode = definitionData.data?.metafieldDefinitions?.edges?.[0]?.node;
          
          if (definitionNode?.type?.name) {
            actualDefinitionType = definitionNode.type.name;
            console.log(`🔍 [METAFIELD-INCREMENT] Faktyczny typ definition: ${actualDefinitionType}`);
          }
        } catch (defError) {
          console.warn(`⚠️ [METAFIELD-INCREMENT] Nie można sprawdzić typu definition, używam typu z metafield:`, defError.message);
          // Fallback - użyj typu z metafield
          actualDefinitionType = existingMetafield?.type || 'json';
        }
        
        const metafieldType = existingMetafield?.type || actualDefinitionType;
        const metafieldId = existingMetafield?.id || null;
        
        console.log(`🔍 [METAFIELD-INCREMENT] Existing metafield:`, {
          id: metafieldId,
          type: metafieldType,
          value: existingMetafield?.value || null,
          hasValue: !!existingMetafield?.value,
          actualDefinitionType: actualDefinitionType
        });
        
        // ⚠️ KRYTYCZNE: Użyj faktycznego typu definition (nie typu metafield value)
        // Shopify NIE POZWALA na zmianę typu definition z number_integer na json
        const isOldFormatType = (actualDefinitionType === 'number_integer');
        
        let newValue;
        let updateType;
        
        if (isOldFormatType) {
          // STARY FORMAT: Użyj number_integer (liczba total)
          const oldTotal = parseInt(existingMetafield?.value || '0', 10);
          const newTotal = oldTotal + 1;
          newValue = newTotal.toString();
          updateType = 'number_integer';
          
          console.log(`📊 [METAFIELD-INCREMENT] Używam STARY FORMAT (number_integer):`, {
            oldTotal: oldTotal,
            newTotal: newTotal,
            note: 'Shopify nie pozwala na zmianę typu - używam starego formatu'
          });
        } else {
          // NOWY FORMAT: Użyj json (tylko total, bez per productType)
          let usageData;
          try {
            const rawValue = existingMetafield?.value || '{}';
            const parsed = JSON.parse(rawValue);
            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
              usageData = parsed;
            } else {
              throw new Error('Not a valid JSON object');
            }
          } catch (parseError) {
            // Jeśli nie można sparsować, zacznij od zera
            usageData = {};
          }
          
          const oldTotal = usageData.total || 0;
          const newTotal = oldTotal + 1;
          usageData.total = newTotal;
          
          newValue = JSON.stringify(usageData);
          updateType = 'json';
          
          console.log(`📊 [METAFIELD-INCREMENT] Używam NOWY FORMAT (json):`, {
            oldTotal: oldTotal,
            newTotal: newTotal,
            fullData: usageData
          });
        }

        // KROK: Utwórz/zaktualizuj metafield z odpowiednim typem
        const updateMutation = `
          mutation updateCustomerUsage($input: CustomerInput!) {
            customerUpdate(input: $input) {
              customer {
                id
                metafield(namespace: "customify", key: "usage_count") {
                  id
                  value
                  type
                }
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        const updateResponse = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken
          },
          body: JSON.stringify({
            query: updateMutation,
            variables: {
              input: {
                id: `gid://shopify/Customer/${customerId}`,
                metafields: [
                  {
                    namespace: 'customify',
                    key: 'usage_count',
                    value: newValue,
                    type: updateType // ✅ Użyj odpowiedniego typu (number_integer lub json)
                  }
                ]
              }
            }
          })
        });

        const updateData = await updateResponse.json();
        console.log(`📊 [METAFIELD-INCREMENT] Update response:`, {
          hasData: !!updateData.data,
          hasCustomer: !!updateData.data?.customerUpdate?.customer,
          hasMetafield: !!updateData.data?.customerUpdate?.customer?.metafield,
          metafieldId: updateData.data?.customerUpdate?.customer?.metafield?.id || null,
          metafieldType: updateData.data?.customerUpdate?.customer?.metafield?.type || null,
          metafieldValue: updateData.data?.customerUpdate?.customer?.metafield?.value || null,
          userErrors: updateData.data?.customerUpdate?.userErrors || null,
          errors: updateData.errors || null
        });
        
        if (updateData.data?.customerUpdate?.userErrors?.length > 0) {
          const userErrors = updateData.data.customerUpdate.userErrors;
          console.error(`❌ [METAFIELD-INCREMENT] Błąd aktualizacji metafield:`, {
            userErrors: userErrors,
            customerId: customerId,
            productType: finalProductType,
            newValue: newValue,
            updateType: updateType,
            isOldFormatType: isOldFormatType
          });
          throw new Error(`GraphQL userErrors: ${JSON.stringify(userErrors)}`);
        } else if (updateData.errors) {
          console.error(`❌ [METAFIELD-INCREMENT] GraphQL errors:`, {
            errors: updateData.errors,
            customerId: customerId,
            productType: finalProductType,
            newValue: newValue
          });
          throw new Error(`GraphQL errors: ${JSON.stringify(updateData.errors)}`);
        } else if (!updateData.data?.customerUpdate?.customer?.metafield) {
          console.error(`❌ [METAFIELD-INCREMENT] Brak metafield w response po aktualizacji:`, {
            customerId: customerId,
            productType: finalProductType,
            newValue: newValue,
            fullResponse: JSON.stringify(updateData, null, 2)
          });
          throw new Error('Brak metafield w response po aktualizacji');
        } else {
          const savedValue = updateData.data.customerUpdate.customer.metafield.value;
          const savedType = updateData.data.customerUpdate.customer.metafield.type;
          const savedTotal =
            updateType === 'number_integer'
              ? parseInt(savedValue, 10)
              : (() => {
                  try {
                    const parsed = JSON.parse(savedValue);
                    return parsed?.total || 0;
                  } catch {
                    return 0;
                  }
                })();
          
          console.log(`✅ [METAFIELD-INCREMENT] Licznik zaktualizowany pomyślnie:`, {
            productType: finalProductType,
            newValue: newValue,
            savedValue: savedValue,
            savedType: savedType,
            updateType: updateType,
            metafieldId: updateData.data.customerUpdate.customer.metafield.id || null
          });
          
          // ✅ Dodaj do kolejki limit-reached natychmiast po osiągnięciu limitu (bez czekania na 5. próbę)
          if (!isTest && customerId && savedTotal >= 4) {
            try {
              const totalLimit = 4; // 4 darmowe generacje TOTAL dla zalogowanych
              const key = `limit-reached:${customerId}`;
              const payload = {
                timestamp: new Date().toISOString(),
                totalUsed: savedTotal,
                totalLimit
              };
              // ✅ Idempotentnie: nie nadpisuj jeśli już jest w kolejce (żeby nie resetować timestamp)
              const existing = await kv.get(key);
              if (!existing) {
                await kv.set(key, JSON.stringify(payload), { ex: 60 * 60 * 48 }); // 48h TTL
                console.log('🕒 [LIMIT-QUEUE] Dodano po inkrementacji (NEW reached limit):', { key, payload });
              } else {
                let existingPayload = null;
                try {
                  existingPayload = typeof existing === 'string' ? JSON.parse(existing) : existing;
                } catch {
                  existingPayload = existing;
                }
                console.log('🕒 [LIMIT-QUEUE] Już w kolejce po inkrementacji - nie nadpisuję (KEEP TIMESTAMP):', {
                  key,
                  existingTimestamp: existingPayload?.timestamp || null
                });
              }
            } catch (kvErr) {
              console.error('⚠️ [LIMIT-QUEUE] Nie udało się zapisać do KV po inkrementacji:', kvErr);
            }
          }
          
          // Weryfikacja zapisanej wartości
          if (isOldFormatType) {
            const savedTotal = parseInt(savedValue, 10);
            const expectedTotal = parseInt(newValue, 10);
            if (savedTotal === expectedTotal) {
              console.log(`✅ [METAFIELD-INCREMENT] WERYFIKACJA OK: Zapisana wartość jest poprawna (${savedTotal})`);
            } else {
              console.error(`❌ [METAFIELD-INCREMENT] WERYFIKACJA FAILED: Zapisana wartość nie zgadza się!`, {
                expected: expectedTotal,
                saved: savedTotal
              });
            }
          } else {
            try {
              const savedData = JSON.parse(savedValue);
              const expectedData = JSON.parse(newValue);
              if (savedData[finalProductType] === expectedData[finalProductType]) {
                console.log(`✅ [METAFIELD-INCREMENT] WERYFIKACJA OK: Zapisana wartość jest poprawna (${savedData[finalProductType]})`);
              } else {
                console.error(`❌ [METAFIELD-INCREMENT] WERYFIKACJA FAILED: Zapisana wartość nie zgadza się!`, {
                  expected: expectedData[finalProductType],
                  saved: savedData[finalProductType],
                  fullSavedData: savedData
                });
              }
            } catch (verifyError) {
              console.error(`❌ [METAFIELD-INCREMENT] WERYFIKACJA FAILED: Nie można sparsować zapisanej wartości:`, {
                savedValue: savedValue,
                error: verifyError.message
              });
            }
          }
        }
      } catch (incrementError) {
        console.error('❌ [TRANSFORM] Błąd inkrementacji licznika:', {
          error: incrementError.message,
          stack: incrementError.stack,
          customerId: customerId,
          productType: finalProductType,
          hasAccessToken: !!accessToken
        });
        // ⚠️ KRYTYCZNE: Błąd inkrementacji - loguj szczegółowo, ale nie blokuj odpowiedzi
        // Transformacja się udała, ale limit nie został zaktualizowany
      }
    } else {
      if (isTest) {
        console.log(`🧪 [TEST-BYPASS] Pomijam inkrementację metafield dla test user (nieograniczone generacje)`);
      } else {
        console.warn(`⚠️ [TRANSFORM] Pomijam inkrementację - brak warunków:`, {
          hasCustomerId: !!customerId,
          hasAccessToken: !!accessToken,
          reason: !customerId ? 'brak customerId' : 'brak accessToken'
        });
      }
    }

    // ✅ ATOMIC INCREMENT IP I DEVICE TOKEN LIMITS (PO UDANEJ TRANSFORMACJI)
    // Używa Vercel KV z atomic operations (zapobiega race conditions)
    if (isKVConfigured()) {
      try {
        // 1. Atomic Increment IP Limit (dla wszystkich)
        if (isTest || (ip && WHITELISTED_IPS.has(ip))) {
          console.log(`🧪 [TEST-BYPASS] Pomijam inkrementację IP limit dla test user`);
        } else {
          const ipIncrementResult = await incrementIPLimit(ip);
          if (ipIncrementResult.success) {
            console.log(`➕ [TRANSFORM] IP limit incremented: ${ipIncrementResult.newCount}/10`);
          } else {
            console.warn(`⚠️ [TRANSFORM] Failed to increment IP limit:`, ipIncrementResult.error);
          }
        }

        // 2. Atomic Increment Device Token Limit (tylko dla niezalogowanych)
        if (isTest) {
          console.log(`🧪 [TEST-BYPASS] Pomijam inkrementację device token limit dla test user`);
        } else if (!customerId && deviceToken) {
          const deviceIncrementResult = await incrementDeviceTokenLimit(deviceToken);
          if (deviceIncrementResult.success) {
            console.log(`➕ [TRANSFORM] Device token limit incremented: ${deviceIncrementResult.newCount}/3`);
          } else {
            console.warn(`⚠️ [TRANSFORM] Failed to increment device token limit:`, deviceIncrementResult.error);
          }
        }

        // ============================================================================
        // DEVICE-TOKEN-CROSS-ACCOUNT-FEATURE: START - Dodaj customerId do device token
        // ============================================================================
        
        // 2b. Dodaj customerId do device token (tylko dla zalogowanych)
        if (customerId && deviceToken) {
          const addCustomerResult = await addCustomerToDeviceToken(deviceToken, customerId);
          if (addCustomerResult.success) {
            console.log(`➕ [TRANSFORM] CustomerId dodany do device token: ${addCustomerResult.customerIds.length}/2 kont`);
          } else {
            console.warn(`⚠️ [TRANSFORM] Failed to add customerId to device token:`, addCustomerResult.error);
          }
        }
        
        // DEVICE-TOKEN-CROSS-ACCOUNT-FEATURE: END
        // ============================================================================

        // ============================================================================
        // IMAGE-HASH-FEATURE: START - Inkrementacja limitu per obrazek
        // ============================================================================
        
        // 3. Atomic Increment Image Hash Limit (dla wszystkich - zalogowanych i niezalogowanych)
        if (isImageHashLimitEnabled() && req.imageHash) {
          const imageHashIncrementResult = await incrementImageHashLimit(req.imageHash);
          if (imageHashIncrementResult.success) {
            console.log(`➕ [TRANSFORM] Image hash limit incremented: ${imageHashIncrementResult.newCount}/2`);
          } else {
            console.warn(`⚠️ [TRANSFORM] Failed to increment image hash limit:`, imageHashIncrementResult.error);
          }
        } else if (isImageHashLimitEnabled() && !req.imageHash) {
          console.warn(`⚠️ [TRANSFORM] Image hash feature enabled but req.imageHash not set - skipping increment`);
        }
        
        // IMAGE-HASH-FEATURE: END
        // ============================================================================
      } catch (kvError) {
        console.error('❌ [TRANSFORM] Error incrementing KV limits:', kvError);
        // Nie blokuj odpowiedzi - transformacja się udała, tylko limit nie został zaktualizowany
        // Następna próba sprawdzi limit i zablokuje jeśli przekroczony
      }
    } else {
      console.warn('⚠️ [TRANSFORM] KV not configured - skipping limit increments');
    }

    // ✅ ZWRÓĆ DEBUG INFO Z SAVE-GENERATION (dla przeglądarki)
    const responseData = { 
      success: true, 
      transformedImage: finalImageUrl || imageUrl, // Preferuj zapisany URL z Vercel Blob
      transformedImageBase64: imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('data:') ? imageUrl : null,
      vercelBlobUrl: finalImageUrl || null, // ✅ BEZ WATERMARKU - URL z Vercel Blob (dla admina do realizacji zamówienia)
      permanentImageUrl: finalImageUrl || null, // ✅ BEZ WATERMARKU - alias dla vercelBlobUrl (backward compatibility)
      watermarkedImageUrl: watermarkedImageUrl || null, // Obraz Z watermarkem (backend PNG) - dla podglądu/koszyka
      watermarkedImageBase64: watermarkedImageBase64 || null, // ✅ NOWE: Base64 watermarku (dla /api/products - BEZ PONOWNEGO DOWNLOADU)
      deviceToken,
      ipHash,
      productHandle: productHandle || null
    };
    
    // ✅ BARDZO WIDOCZNE LOGOWANIE - SPRAWDŹ CZY saveGenerationDebug JEST USTAWIONE
    console.log(`🔍🔍🔍 [TRANSFORM] ===== SPRAWDZAM saveGenerationDebug PRZED RESPONSE =====`);
    console.log(`🔍 [TRANSFORM] saveGenerationDebug value:`, saveGenerationDebug);
    console.log(`🔍 [TRANSFORM] saveGenerationDebug type:`, typeof saveGenerationDebug);
    console.log(`🔍 [TRANSFORM] saveGenerationDebug !== null:`, saveGenerationDebug !== null);
    
    // ✅ ZAWSZE DODAJ DEBUG INFO - NAWET JEŚLI JEST NULL (dla debugowania)
    responseData.saveGenerationDebug = saveGenerationDebug;
    if (saveGenerationDebug !== null) {
      console.log(`✅ [TRANSFORM] Dodaję saveGenerationDebug do response`);
      console.log(`🔍 [TRANSFORM] Zwracam debug info do przeglądarki:`, JSON.stringify(saveGenerationDebug, null, 2));
    } else {
      console.warn(`⚠️ [TRANSFORM] saveGenerationDebug jest null - DODAJĘ null do response dla debugowania`);
      console.warn(`⚠️ [TRANSFORM] To może oznaczać, że save-generation-v2 nie został wywołany lub nie zwrócił debug info`);
    }
    
    console.log(`🔍 [TRANSFORM] Final responseData keys:`, Object.keys(responseData));
    console.log(`🔍 [TRANSFORM] Final responseData.saveGenerationDebug:`, responseData.saveGenerationDebug);
    
    // ✅ LOGOWANIE: Sprawdź czy watermarkedImageUrl jest null (błąd!)
    if (!watermarkedImageUrl) {
      console.error('❌ [TRANSFORM] ⚠️⚠️⚠️ WATERMARK URL IS NULL - USER WILL NOT BE ABLE TO ADD TO CART ⚠️⚠️⚠️');
      console.error('❌ [TRANSFORM] watermarkedImageUrl:', watermarkedImageUrl);
      console.error('❌ [TRANSFORM] finalImageUrl:', finalImageUrl);
      console.error('❌ [TRANSFORM] imageUrl:', imageUrl);
    } else {
      console.log(`✅ [TRANSFORM] watermarkedImageUrl OK: ${watermarkedImageUrl.substring(0, 100)}...`);
    }
    
    console.log(`🔍🔍🔍 [TRANSFORM] ===== KONIEC SPRAWDZANIA saveGenerationDebug =====`);
    
    res.json(responseData);
  } catch (error) {
    console.error('AI transformation error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'AI transformation failed';
    let statusCode = 500;
    
    // Check if error has user-friendly message (e.g., moderation blocked)
    if (error.code === 'MODERATION_BLOCKED' || error.userMessage) {
      errorMessage = error.userMessage || 'Zdjęcie zostało odrzucone przez system bezpieczeństwa. Spróbuj użyć innego zdjęcia portretowego.';
      statusCode = 400;
    } else if (error.message.includes('NSFW') || error.message.includes('content detected')) {
      errorMessage = 'Obraz został odrzucony przez filtr bezpieczeństwa. Spróbuj użyć innego zdjęcia lub stylu. Upewnij się, że zdjęcie jest odpowiednie dla wszystkich widzów.';
      statusCode = 400;
    } else if (error.message.includes('CUDA out of memory')) {
      errorMessage = 'Model is currently overloaded. Please try again in a few minutes or try a different style.';
      statusCode = 503;
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timed out. The model is taking longer than expected. Please try again.';
      statusCode = 504;
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'Too many requests. Please wait a moment before trying again.';
      statusCode = 429;
    } else if (error.message.includes('402') || error.message.includes('Payment Required') || error.message.includes('spend limit')) {
      errorMessage = 'AI service temporarily unavailable due to billing limits. Please try again later or contact support.';
      statusCode = 402;
    }
    
    // ✅ SENTRY: Loguj błąd transformacji
    Sentry.withScope((scope) => {
      scope.setTag('customify', 'true');
      scope.setTag('error_type', 'transform_failed');
      scope.setTag('endpoint', 'transform');
      scope.setContext('transform', {
        customerId: req.body?.customerId || null,
        style: req.body?.style || null,
        productType: req.body?.productType || null,
        statusCode: statusCode
      });
      Sentry.captureException(error);
    });
    
    res.status(statusCode).json({ error: errorMessage });
  }
};
