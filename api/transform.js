const Replicate = require('replicate');
const { checkRateLimit, getClientIP } = require('../utils/vercelRateLimiter');

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

  try {
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
        output_compression: 100, // PNG wymaga 100 (bez kompresji)
        output_format: "png" // Zgodnie z dokumentacją
      }),
    });

    if (response.ok) {
      // Segmind returns PNG image, not JSON
      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      const imageUrl = `data:image/png;base64,${base64Image}`;
      
      console.log('✅ [SEGMIND] Caricature generated successfully');
      return { image: imageUrl, output: imageUrl, url: imageUrl };
    } else {
      console.error('❌ [SEGMIND] API Error:', response.status);
      const errorText = await response.text();
      console.error('❌ [SEGMIND] Error details:', errorText);
      throw new Error(`Segmind API error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('❌ [SEGMIND] Caricature generation failed:', error);
    throw error;
  }
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
  console.log('🎭 [SEGMIND] Target image URL:', targetImageUrl);
  console.log('🎭 [SEGMIND] Swap image (base64):', swapImageBase64.substring(0, 50) + '...');

  // Convert target image URL to base64
  const targetImageBase64 = await urlToBase64(targetImageUrl);

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

  // Add timeout to prevent 504 errors
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('⏰ [SEGMIND] Request timeout after 240 seconds - aborting');
    controller.abort();
  }, 240000); // 240 second timeout (Vercel Pro limit is 300s)
  
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

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [SEGMIND] Face-swap failed:', response.status, errorText);
    throw new Error(`Segmind face-swap failed: ${response.status} - ${errorText}`);
  }

  // Segmind zwraca JSON z kluczem "image"
  const resultJson = await response.json();
  console.log('✅ [SEGMIND] Face-swap completed! Response:', Object.keys(resultJson));
  
  const resultBase64 = resultJson.image;
  if (!resultBase64) {
    console.error('❌ [SEGMIND] No image in response:', resultJson);
    throw new Error('Segmind response missing image field');
  }
  
  console.log('✅ [SEGMIND] Extracted base64, length:', resultBase64.length, 'chars');
  console.log('🔍 [SEGMIND] Base64 preview (first 50 chars):', resultBase64.substring(0, 50));
  
  // Return as data URI for consistency
  return `data:image/jpeg;base64,${resultBase64}`;
}

// Function to handle Segmind Become-Image (Watercolor style)
async function segmindBecomeImage(imageUrl, styleImageUrl) {
  const SEGMIND_API_KEY = process.env.SEGMIND_API_KEY;
  
  console.log('🔑 [SEGMIND] Checking API key...', SEGMIND_API_KEY ? `Key present (${SEGMIND_API_KEY.substring(0, 10)}...)` : 'KEY MISSING!');
  
  if (!SEGMIND_API_KEY) {
    console.error('❌ [SEGMIND] SEGMIND_API_KEY not found in environment variables!');
    throw new Error('SEGMIND_API_KEY not configured');
  }

  console.log('🎨 [SEGMIND] Starting become-image (watercolor)...');
  console.log('🎨 [SEGMIND] Person image URL:', imageUrl);
  console.log('🎨 [SEGMIND] Style image URL:', styleImageUrl);

  try {
    const response = await fetch('https://api.segmind.com/v1/become-image', {
      method: 'POST',
      headers: {
        'x-api-key': SEGMIND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageUrl,              // URL zdjęcia użytkownika
        image_to_become: styleImageUrl, // URL miniaturki stylu akwareli
        prompt: "a person",
        prompt_strength: 2,
        number_of_images: 1,          // Tylko 1 obraz (nie 2)
        denoising_strength: 1,
        instant_id_strength: 1,
        image_to_become_strength: 0.75, // Siła stylu akwareli
        image_to_become_noise: 0.3,
        control_depth_strength: 0.8,
        disable_safety_checker: true
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [SEGMIND] API Error:', response.status);
      console.error('❌ [SEGMIND] Error details:', errorText);
      throw new Error(`Segmind API error: ${response.status} - ${errorText}`);
    }

    // Segmind zwraca JSON (nie binary jak caricature-style)
    const result = await response.json();
    console.log('✅ [SEGMIND] Become-image completed successfully');
    console.log('📋 [SEGMIND] Response keys:', Object.keys(result));
    
    // Sprawdź format odpowiedzi (może być URL lub base64 lub array z obrazami)
    if (result.image) {
      // Pojedynczy obraz (URL lub base64)
      return result.image;
    } else if (result.images && Array.isArray(result.images) && result.images.length > 0) {
      // Array z obrazami - weź pierwszy
      return result.images[0];
    } else if (result.output) {
      // Może być w polu output
      return result.output;
    } else {
      console.error('❌ [SEGMIND] No image in response:', result);
      throw new Error('No image in Segmind response');
    }
    
  } catch (error) {
    console.error('❌ [SEGMIND] Become-image failed:', error);
    throw error;
  }
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
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // RATE LIMITING - Sprawdź limit dla kosztownych operacji AI
  const ip = getClientIP(req);
  console.log(`🔍 [TRANSFORM] Request from IP: ${ip}, Method: ${req.method}`);
  
  if (!checkRateLimit(ip, 20, 15 * 60 * 1000)) { // 20 requestów na 15 minut
    console.log(`❌ [TRANSFORM] Rate limit exceeded for IP: ${ip}`);
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many AI requests. Please try again in 15 minutes.',
      retryAfter: 900 // 15 minut w sekundach
    });
  }
  
  console.log(`✅ [TRANSFORM] Rate limit OK for IP: ${ip}`);

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

  try {
    const { imageData, prompt, productType, customerId, customerAccessToken, email } = req.body;

    if (!imageData || !prompt) {
      return res.status(400).json({ error: 'Image data and prompt are required' });
    }
    
    console.log(`🎯 [TRANSFORM] Product type: ${productType || 'not specified'}`);
    console.log(`🎯 [TRANSFORM] Style: ${prompt}`);
    console.log(`👤 [TRANSFORM] Customer ID: ${customerId || 'not logged in'}`);

    // ✅ SPRAWDZENIE LIMITÓW UŻYCIA PRZED TRANSFORMACJĄ
    const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || 'customify-ok.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (customerId && customerAccessToken && accessToken) {
      // Zalogowany użytkownik - sprawdź Shopify Metafields
      console.log(`🔍 [TRANSFORM] Sprawdzam limity dla zalogowanego użytkownika...`);
      
      try {
        const metafieldQuery = `
          query getCustomerUsage($id: ID!) {
            customer(id: $id) {
              id
              email
              metafield(namespace: "customify", key: "usage_count") {
                value
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
        const customer = metafieldData.data?.customer;
        const usedCount = parseInt(customer?.metafield?.value || '0', 10);
        const totalLimit = 13; // 3 darmowe + 10 po zalogowaniu

        console.log(`📊 [TRANSFORM] Użytkownik ${customer?.email}: ${usedCount}/${totalLimit} użyć`);

        if (usedCount >= totalLimit) {
          console.log(`❌ [TRANSFORM] Limit przekroczony dla użytkownika ${customer?.email}`);
          return res.status(403).json({
            error: 'Usage limit exceeded',
            message: 'Wykorzystałeś wszystkie dostępne transformacje (13). Skontaktuj się z nami dla więcej.',
            usedCount: usedCount,
            totalLimit: totalLimit
          });
        }

        console.log(`✅ [TRANSFORM] Limit OK - kontynuuję transformację`);
      } catch (limitError) {
        console.error('⚠️ [TRANSFORM] Błąd sprawdzania limitów:', limitError);
        // Kontynuuj mimo błędu (fallback do IP rate limiting)
      }
    } else {
      // Niezalogowany użytkownik - frontend sprawdza localStorage (3 użycia)
      console.log(`👤 [TRANSFORM] Niezalogowany użytkownik - frontend sprawdza localStorage`);
    }

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
    const imageDataUri = `data:image/png;base64,${compressedImageData}`;

    // Use Replicate for AI image transformation with different models based on style
    
    // Map styles to appropriate models and parameters
    const styleConfig = {
      'van gogh': {
        model: "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
        prompt: `in the style of Vincent van Gogh, ${prompt}, oil painting, thick brushstrokes, vibrant colors, post-impressionist`,
        guidance_scale: 7.5,
        num_inference_steps: 50,
        strength: 0.8
      },
      'picasso': {
        model: "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
        prompt: `in the style of Pablo Picasso, ${prompt}, cubist, abstract, geometric shapes, bold colors`,
        guidance_scale: 7.5,
        num_inference_steps: 50,
        strength: 0.8
      },
      'monet': {
        model: "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
        prompt: `in the style of Claude Monet, ${prompt}, impressionist, soft brushstrokes, light and color, water lilies style`,
        guidance_scale: 7.5,
        num_inference_steps: 50,
        strength: 0.8
      },
      'anime': {
        model: "aaronaftab/mirage-ghibli:166efd159b4138da932522bc5af40d39194033f587d9bdbab1e594119eae3e7f",
        prompt: `GHIBLI anime style, ${prompt}`,
        productType: "other", // Identyfikator typu produktu
        go_fast: true,
        guidance_scale: 10,
        prompt_strength: 0.4,
        num_inference_steps: 38
      },
      'cyberpunk': {
        model: "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
        prompt: `cyberpunk style, ${prompt}, neon lights, futuristic, high tech, dark atmosphere, glowing effects`,
        guidance_scale: 7.5,
        num_inference_steps: 50,
        strength: 0.8
      },
      'watercolor': {
        model: "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
        prompt: `watercolor painting, ${prompt}, soft colors, flowing brushstrokes, artistic, delicate`,
        guidance_scale: 7.5,
        num_inference_steps: 50,
        strength: 0.8
      },
      'pixar': {
        model: "swartype/sdxl-pixar:81f8bbd3463056c8521eb528feb10509cc1385e2fabef590747f159848589048",
        prompt: `Pixar-style 3D character, cinematic animation look, smooth glossy plastic-like skin, rounded soft facial features, expressive eyes, stylized proportions, vibrant color palette, warm cinematic lighting, subsurface scattering, cartoon realism, wholesome family atmosphere, detailed hair, ultra clean render, rendered in 3D, dynamic camera angle, looks like a frame from a Pixar movie, perfect anatomy, depth of field, bokeh background, high quality render. realistic Pixar cinematic render, detailed textures, global illumination`,
        negative_prompt: "logo, brand, noisy, sloppy, messy, grainy, extra arms, extra legs, extra hands, extra fingers, mutated hands, malformed limbs, deformed body, disfigured, missing fingers, too many fingers, long fingers, extra limb, extra body parts, bad anatomy, fused fingers, disconnected limbs, broken limbs, distorted limbs, cloned body, duplicate body, extra head, ugly hands, bad hands, incorrect limb proportions, unnatural pose, low quality, lowres, blurry",
        productType: "other", // Identyfikator typu produktu
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
      // Style karykatury - używają Segmind API
      'karykatura': {
        model: "segmind/caricature-style",
        prompt: "Create a caricature portrait based on the uploaded photo. Exaggerate facial features, make it humorous and cartoon-like while maintaining likeness. Use bold lines, vibrant colors, and comedic proportions typical of caricature art.",
        apiType: "segmind-caricature",
        productType: "caricature", // Identyfikator typu produktu
        parameters: {
          image: "USER_IMAGE", // URL do obrazu użytkownika
          size: "1024x1536", // PIONOWY PORTRET - NIE ZMIENIAJ! (2:3 format)
          quality: "medium", // Jakość średnia (nieużywane - wartość z funkcji segmindCaricature ma priorytet)
          background: "opaque", // Nieprzezroczyste tło
          output_compression: 100, // Maksymalna kompresja
          output_format: "png" // Format PNG
        }
      },
      // Style akwareli - używa Segmind Become-Image API
      'akwarela': {
        model: "segmind/become-image",
        prompt: "a person",
        apiType: "segmind-become-image",
        productType: "watercolor", // Identyfikator typu produktu
        parameters: {
          image: "USER_IMAGE", // URL zdjęcia użytkownika (będzie zamienione na URL z Vercel Blob)
          image_to_become: "https://customify-s56o.vercel.app/akwarela/watercolor-style.png", // URL miniaturki stylu akwareli
          prompt_strength: 2,
          number_of_images: 1,
          denoising_strength: 1,
          instant_id_strength: 1,
          image_to_become_strength: 0.75, // Siła stylu akwareli
          image_to_become_noise: 0.3,
          control_depth_strength: 0.8,
          disable_safety_checker: true
        }
      }
    };

    // Get style from prompt or use default
    const style = Object.keys(styleConfig).find(s => prompt.toLowerCase().includes(s)) || 'anime';
    const config = styleConfig[style] || styleConfig['anime'];

    console.log(`Using style: ${style}, model: ${config.model}`);
    console.log(`Config productType: ${config.productType}, Request productType: ${productType}`);

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
      
      // Domyślne parametry z config
      let aspectRatio = config.parameters.aspect_ratio;
      let outputFormat = config.parameters.output_format;
      let guidance = config.parameters.guidance;
      
      // ⚠️ KRYTYCZNE: Dla kotów aspect_ratio ZAWSZE "3:4" (pionowy)!
      // NIE ZMIENIAJ dynamicznie na podstawie obrazu użytkownika!
      // Model wycina twarz i nakłada na pionową miniaturkę.
      
      console.log(`🖼️ [NANO-BANANA] Using aspect_ratio: ${aspectRatio}, output_format: ${outputFormat}, guidance: ${guidance}`);
      
      // Sprawdź czy to styl boho (1 obrazek) czy koty (2 obrazki)
      if (productType === 'boho') {
        // Style boho - tylko obrazek użytkownika
        // ✅ FIX: Dodaj negative_prompt do głównego promptu
        let fullPrompt = config.prompt;
        if (config.negative_prompt) {
          fullPrompt += ` [NEGATIVE PROMPT: ${config.negative_prompt}]`;
          console.log(`✅ [NANO-BANANA] Added negative prompt to boho style`);
        }
        
        inputParams = {
          prompt: fullPrompt,
          image_input: [imageDataUri], // Tylko obrazek użytkownika
          aspect_ratio: aspectRatio,
          output_format: outputFormat,
          guidance: guidance
        };
        
        console.log(`📸 [NANO-BANANA] Boho style - 1 obrazek (user): ${imageDataUri.substring(0, 50)}...`);
        console.log(`📸 [NANO-BANANA] image_input array length: ${inputParams.image_input.length}`);
      } else {
        // Style kotów - 2 obrazki (miniaturka + użytkownik)
        inputParams = {
          prompt: config.prompt,
          image_input: [
            config.parameters.image_input[0], // Miniaturka stylu z parameters
            imageDataUri // Obrazek użytkownika
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
        const resultImage = await segmindBecomeImage(userImageUrl, styleImageUrl);
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

      // Add timeout and better error handling (following Replicate docs)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout - model took too long')), 300000); // 5 minutes
      });

      console.log(`🚀 [REPLICATE] Starting prediction with model: ${config.model}`);
      const replicatePromise = replicate.run(config.model, {
        input: inputParams
      });

      output = await Promise.race([replicatePromise, timeoutPromise]);
      console.log(`✅ [REPLICATE] Prediction completed successfully`);
      console.log(`📸 [REPLICATE] Output type:`, typeof output);
      console.log(`📸 [REPLICATE] Output:`, output);

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

    // ✅ WATERMARK DLA REPLICATE URL-I - USUNIĘTY (problemy z Sharp w Vercel)
    // TODO: Przywrócić po rozwiązaniu problemów z Sharp

    // ✅ ZMIENNA DO PRZECHOWYWANIA DEBUG INFO Z SAVE-GENERATION (PRZED BLOKIEM IF)
    let saveGenerationDebug = null;
    
    // ✅ ZAPIS GENERACJI W VERCEL BLOB STORAGE (przed inkrementacją licznika)
    // Zapisz generację z powiązaniem do klienta (nawet jeśli nie doda do koszyka)
    console.log(`🔍🔍🔍 [TRANSFORM] ===== SPRAWDZAM WARUNEK ZAPISU GENERACJI =====`);
    console.log(`🔍 [TRANSFORM] imageUrl exists: ${!!imageUrl}`);
    console.log(`🔍 [TRANSFORM] customerId: ${customerId}, type: ${typeof customerId}`);
    console.log(`🔍 [TRANSFORM] email: ${email}`);
    console.log(`🔍 [TRANSFORM] Warunek: imageUrl && (customerId || email) = ${!!imageUrl && !!(customerId || email)}`);
    
    if (imageUrl && (customerId || email)) {
      console.log(`✅ [TRANSFORM] WARUNEK SPEŁNIONY - zapisuję generację`);
      console.log(`💾 [TRANSFORM] Zapisuję generację w Vercel Blob Storage dla klienta...`);
      console.log(`🔍 [TRANSFORM] customerId type: ${typeof customerId}, value: ${customerId}`);
      console.log(`🔍 [TRANSFORM] email: ${email}`);
      
      try {
        // Sprawdź czy obraz jest już w Vercel Blob
        let finalImageUrl = imageUrl;
        
        // Jeśli to URL z Replicate (nie Vercel Blob), uploaduj do Vercel Blob
        if (imageUrl.includes('replicate.delivery') || imageUrl.includes('pbxt')) {
          console.log(`📤 [TRANSFORM] Uploaduję obraz z Replicate do Vercel Blob...`);
          
          try {
            // Pobierz obraz z Replicate
            const imageResponse = await fetch(imageUrl);
            if (imageResponse.ok) {
              const imageBuffer = await imageResponse.arrayBuffer();
              const base64 = Buffer.from(imageBuffer).toString('base64');
              const dataUri = `data:image/jpeg;base64,${base64}`;
              
              // Upload do Vercel Blob
              const uploadResponse = await fetch('https://customify-s56o.vercel.app/api/upload-temp-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  imageData: dataUri,
                  filename: `generation-${Date.now()}.jpg`
                })
              });
              
              if (uploadResponse.ok) {
                const uploadResult = await uploadResponse.json();
                finalImageUrl = uploadResult.imageUrl;
                console.log(`✅ [TRANSFORM] Obraz zapisany w Vercel Blob: ${finalImageUrl.substring(0, 50)}...`);
              }
            }
          } catch (uploadError) {
            console.error('⚠️ [TRANSFORM] Błąd uploadu do Vercel Blob:', uploadError);
            // Użyj oryginalnego URL
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
        const saveData = {
          customerId: shopifyCustomerId || (customerId !== undefined && customerId !== null ? String(customerId) : null),
          email: email || null,
          imageUrl: finalImageUrl,
          style: prompt || 'unknown',
          productType: productType || 'other',
          originalImageUrl: null // Opcjonalnie - można dodać później
        };
        
        console.log(`📤 [TRANSFORM] Wywołuję /api/save-generation-v2 z danymi:`, {
          customerId: saveData.customerId,
          customerIdType: typeof saveData.customerId,
          email: saveData.email,
          hasImageUrl: !!saveData.imageUrl,
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
            saveGenerationDebug = saveResult.debug;
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
            saveGenerationDebug = fallbackDebug;
          }
        } else {
          const errorText = await saveResponse.text();
          console.error('⚠️ [TRANSFORM] Błąd zapisu generacji:', errorText);
          console.error('⚠️ [TRANSFORM] Status:', saveResponse.status);
          saveGenerationDebug = { error: errorText, status: saveResponse.status };
        }
      } catch (saveError) {
        console.error('⚠️ [TRANSFORM] Błąd zapisu generacji (nie blokuję odpowiedzi):', saveError);
        console.error('⚠️ [TRANSFORM] Stack:', saveError.stack);
        saveGenerationDebug = { error: saveError.message, stack: saveError.stack };
        // Nie blokuj odpowiedzi - transformacja się udała
      }
    } else {
      console.warn(`⚠️⚠️⚠️ [TRANSFORM] ===== WARUNEK NIE SPEŁNIONY - POMIJAM ZAPIS =====`);
      console.warn('⚠️ [TRANSFORM] Pomijam zapis generacji - brak customerId lub email');
      console.warn(`⚠️ [TRANSFORM] customerId: ${customerId}, email: ${email}, imageUrl: ${!!imageUrl}`);
      saveGenerationDebug = { skipped: true, reason: 'brak customerId lub email', customerId: customerId || null, email: email || null, hasImageUrl: !!imageUrl };
      console.warn(`⚠️⚠️⚠️ [TRANSFORM] ===== KONIEC SPRAWDZANIA WARUNKU =====`);
    }

    // ✅ INKREMENTACJA LICZNIKA PO UDANEJ TRANSFORMACJI
    if (customerId && customerAccessToken && accessToken) {
      console.log(`➕ [TRANSFORM] Inkrementuję licznik dla użytkownika ${customerId}`);
      
      try {
        // Pobierz obecną wartość (namespace: customify, key: usage_count)
        const getQuery = `
          query getCustomerUsage($id: ID!) {
            customer(id: $id) {
              metafield(namespace: "customify", key: "usage_count") {
                value
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
        const currentUsage = parseInt(getData.data?.customer?.metafield?.value || '0', 10);
        const newUsage = currentUsage + 1;

        // Zaktualizuj metafield
        const updateMutation = `
          mutation updateCustomerUsage($input: CustomerInput!) {
            customerUpdate(input: $input) {
              customer {
                id
                metafield(namespace: "customify", key: "usage_count") {
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
                    value: newUsage.toString(),
                    type: 'number_integer'
                  }
                ]
              }
            }
          })
        });

        const updateData = await updateResponse.json();
        console.log(`✅ [TRANSFORM] Licznik zaktualizowany: ${currentUsage} → ${newUsage}`);
        
        if (updateData.data?.customerUpdate?.userErrors?.length > 0) {
          console.error('⚠️ [TRANSFORM] Błąd aktualizacji metafield:', updateData.data.customerUpdate.userErrors);
        }
      } catch (incrementError) {
        console.error('⚠️ [TRANSFORM] Błąd inkrementacji licznika:', incrementError);
        // Nie blokuj odpowiedzi - transformacja się udała
      }
    }

    // ✅ ZWRÓĆ DEBUG INFO Z SAVE-GENERATION (dla przeglądarki)
    const responseData = { 
      success: true, 
      transformedImage: imageUrl 
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
    console.log(`🔍🔍🔍 [TRANSFORM] ===== KONIEC SPRAWDZANIA saveGenerationDebug =====`);
    
    res.json(responseData);
  } catch (error) {
    console.error('AI transformation error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'AI transformation failed';
    let statusCode = 500;
    
    if (error.message.includes('NSFW') || error.message.includes('content detected')) {
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
    
    res.status(statusCode).json({ error: errorMessage });
  }
};
