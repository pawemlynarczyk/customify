const Replicate = require('replicate');
const { checkRateLimit, getClientIP } = require('../utils/vercelRateLimiter');

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

// Function to compress and resize images for SDXL models
async function compressImage(imageData, maxWidth = 1024, maxHeight = 1024, quality = 80) {
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
    
    // Calculate optimal SDXL resolution based on aspect ratio
    let targetWidth, targetHeight;
    const aspectRatio = width / height;
    
    if (aspectRatio > 1.2) {
      // Landscape - use 1152x896 (SDXL recommended)
      targetWidth = 1152;
      targetHeight = 896;
    } else if (aspectRatio < 0.8) {
      // Portrait - use 896x1152 (SDXL recommended)
      targetWidth = 896;
      targetHeight = 1152;
    } else {
      // Square-ish - use 1024x1024 (SDXL standard)
      targetWidth = 1024;
      targetHeight = 1024;
    }
    
    console.log(`SDXL optimal resolution: ${targetWidth}x${targetHeight} (aspect ratio: ${aspectRatio.toFixed(2)})`);
    
    const compressedBuffer = await sharp(buffer)
      .resize(targetWidth, targetHeight, {
        fit: 'inside',
        withoutEnlargement: true,
        background: { r: 255, g: 255, b: 255, alpha: 1 } // White background for padding
      })
      .png({ 
        quality: quality,
        compressionLevel: 9,
        progressive: true
      })
      .withMetadata(false) // Usuń metadane EXIF
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
  console.log(`🚀 [TRANSFORM] API called - Method: ${req.method}, Headers:`, req.headers);
  
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
    const { imageData, prompt } = req.body;

    if (!imageData || !prompt) {
      return res.status(400).json({ error: 'Image data and prompt are required' });
    }

    if (!replicate) {
      return res.status(400).json({ error: 'Replicate API token not configured' });
    }

    // Test authentication (simplified - just check if replicate is initialized)
    console.log(`🔐 [REPLICATE] Ready to process with token: ${process.env.REPLICATE_API_TOKEN ? 'configured' : 'missing'}`);

    // Compress image before sending to Replicate to avoid memory issues
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
        prompt: `Pixar style 3D animation portrait, smooth plastic-like skin, big expressive eyes, rounded soft facial features, vibrant colors, warm cinematic lighting, stylized like Pixar movies (Toy Story, Soul, The Incredibles, Inside Out), exaggerated expressions, cartoon look, wholesome family atmosphere, ultra clean render, cinematic contrast, high quality, looks like a Pixar movie frame, ${prompt}`,
        negative_prompt: "realistic, photo, muted colors, dull, gritty, textured skin, pores, wrinkles, grainy, lowres, blurry, deformed, bad anatomy, bad proportions, creepy, asymmetrical, extra fingers, extra limbs, duplicate face, duplicate body, watermark, logo, text",
        task: "img2img",
        scheduler: "KarrasDPM",
        guidance_scale: 7.5,
        prompt_strength: 0.6,
        num_inference_steps: 25,
        width: 768,
        height: 768,
        refine: "no_refiner",
        high_noise_frac: 0.7,
        output_format: "png"
      },
      // Style kotów - używają nano-banana z 2 obrazkami
      'krolewski': {
        model: "google/nano-banana",
        prompt: "wygeneruj obraz dokładnie jak na pierwszym obrazku tylko z pyskiem i glowa kota z drugiego obrazka. zachowaj kolor siersci jej dlugosc, kolor ksztalt oczu, kształt wielkość zrenic; ksztalt uszu i inne cechy identyfikujace kota z drugiego obrazka. zwroc uwage na glowe by kot mial tylko dwoje uszu i zeby ladnie komponowaly sie z akcesoriami ze zdjecia i mialy taki kolor jak uszy kota z drugiego obrazka. by pozycja glowy kota byla jak w pierwszym zdjeciu. jako wynik mam miec fotorealistyczne zdjecie dokladnie w stylu pierwszego zdjecia.",
        apiType: "nano-banana",
        parameters: {
          image_input: ["https://customify-s56o.vercel.app/koty/krolewski.png", "USER_IMAGE"],
          aspect_ratio: "match_input_image",
          output_format: "jpg"
        }
      },
      'na-tronie': {
        model: "google/nano-banana", 
        prompt: "wygeneruj obraz dokładnie jak na pierwszym obrazku tylko z pyskiem i glowa kota z drugiego obrazka. zachowaj kolor siersci jej dlugosc, kolor ksztalt oczu, kształt wielkość zrenic; ksztalt uszu i inne cechy identyfikujace kota z drugiego obrazka. zwroc uwage na glowe by kot mial tylko dwoje uszu i zeby ladnie komponowaly sie z akcesoriami ze zdjecia i mialy taki kolor jak uszy kota z drugiego obrazka. by pozycja glowy kota byla jak w pierwszym zdjeciu. jako wynik mam miec fotorealistyczne zdjecie dokladnie w stylu pierwszego zdjecia.",
        apiType: "nano-banana",
        parameters: {
          image_input: ["https://customify-s56o.vercel.app/koty/na_tronie.png", "USER_IMAGE"],
          aspect_ratio: "match_input_image",
          output_format: "jpg"
        }
      },
      'wojenny': {
        model: "google/nano-banana",
        prompt: "wygeneruj obraz dokładnie jak na pierwszym obrazku tylko z pyskiem i glowa kota z drugiego obrazka. zachowaj kolor siersci jej dlugosc, kolor ksztalt oczu, kształt wielkość zrenic; ksztalt uszu i inne cechy identyfikujace kota z drugiego obrazka. zwroc uwage na glowe by kot mial tylko dwoje uszu i zeby ladnie komponowaly sie z akcesoriami ze zdjecia i mialy taki kolor jak uszy kota z drugiego obrazka. by pozycja glowy kota byla jak w pierwszym zdjeciu. jako wynik mam miec fotorealistyczne zdjecie dokladnie w stylu pierwszego zdjecia.",
        apiType: "nano-banana",
        parameters: {
          image_input: ["https://customify-s56o.vercel.app/koty/wojenny.png", "USER_IMAGE"],
          aspect_ratio: "match_input_image",
          output_format: "jpg"
        }
      },
      'barokowy': {
        model: "google/nano-banana",
        prompt: "wygeneruj obraz dokładnie jak na pierwszym obrazku tylko z pyskiem i glowa kota z drugiego obrazka. zachowaj kolor siersci jej dlugosc, kolor ksztalt oczu, kształt wielkość zrenic; ksztalt uszu i inne cechy identyfikujace kota z drugiego obrazka. zwroc uwage na glowe by kot mial tylko dwoje uszu i zeby ladnie komponowaly sie z akcesoriami ze zdjecia i mialy taki kolor jak uszy kota z drugiego obrazka. by pozycja glowy kota byla jak w pierwszym zdjeciu. jako wynik mam miec fotorealistyczne zdjecie dokladnie w stylu pierwszego zdjecia.",
        apiType: "nano-banana",
        parameters: {
          image_input: ["https://customify-s56o.vercel.app/koty/barokowy.png", "USER_IMAGE"],
          aspect_ratio: "match_input_image",
          output_format: "jpg"
        }
      },
      'wiktorianski': {
        model: "google/nano-banana",
        prompt: "wygeneruj obraz dokładnie jak na pierwszym obrazku tylko z pyskiem i glowa kota z drugiego obrazka. zachowaj kolor siersci jej dlugosc, kolor ksztalt oczu, kształt wielkość zrenic; ksztalt uszu i inne cechy identyfikujace kota z drugiego obrazka. zwroc uwage na glowe by kot mial tylko dwoje uszu i zeby ladnie komponowaly sie z akcesoriami ze zdjecia i mialy taki kolor jak uszy kota z drugiego obrazka. by pozycja glowy kota byla jak w pierwszym zdjeciu. jako wynik mam miec fotorealistyczne zdjecie dokladnie w stylu pierwszego zdjecia.",
        apiType: "nano-banana",
        parameters: {
          image_input: ["https://customify-s56o.vercel.app/koty/wiktorianski.png", "USER_IMAGE"],
          aspect_ratio: "match_input_image",
          output_format: "jpg"
        }
      },
      'renesansowy': {
        model: "google/nano-banana",
        prompt: "wygeneruj obraz dokładnie jak na pierwszym obrazku tylko z pyskiem i glowa kota z drugiego obrazka. zachowaj kolor siersci jej dlugosc, kolor ksztalt oczu, kształt wielkość zrenic; ksztalt uszu i inne cechy identyfikujace kota z drugiego obrazka. zwroc uwage na glowe by kot mial tylko dwoje uszu i zeby ladnie komponowaly sie z akcesoriami ze zdjecia i mialy taki kolor jak uszy kota z drugiego obrazka. by pozycja glowy kota byla jak w pierwszym zdjeciu. jako wynik mam miec fotorealistyczne zdjecie dokladnie w stylu pierwszego zdjecia.",
        apiType: "nano-banana",
        parameters: {
          image_input: ["https://customify-s56o.vercel.app/koty/renesansowy.png", "USER_IMAGE"],
          aspect_ratio: "match_input_image",
          output_format: "jpg"
        }
      }
    };

    // Get style from prompt or use default
    const style = Object.keys(styleConfig).find(s => prompt.toLowerCase().includes(s)) || 'anime';
    const config = styleConfig[style] || styleConfig['anime'];

    console.log(`Using style: ${style}, model: ${config.model}`);

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
        output_format: config.output_format
      };
    } else if (config.apiType === 'nano-banana') {
      // Nano-banana model parameters - 2 obrazki
      inputParams = {
        prompt: config.prompt,
        image_input: [
          config.parameters.image_input[0], // Miniaturka stylu z parameters
          imageDataUri // Obrazek użytkownika
        ],
        aspect_ratio: config.parameters.aspect_ratio,
        output_format: config.parameters.output_format
      };
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

    // Add timeout and better error handling (following Replicate docs)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout - model took too long')), 300000); // 5 minutes
    });

    console.log(`🚀 [REPLICATE] Starting prediction with model: ${config.model}`);
    const replicatePromise = replicate.run(config.model, {
      input: inputParams
    });

    const output = await Promise.race([replicatePromise, timeoutPromise]);
    console.log(`✅ [REPLICATE] Prediction completed successfully`);

    res.json({ 
      success: true, 
      transformedImage: output[0] 
    });
  } catch (error) {
    console.error('AI transformation error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'AI transformation failed';
    if (error.message.includes('CUDA out of memory')) {
      errorMessage = 'Model is currently overloaded. Please try again in a few minutes or try a different style.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timed out. The model is taking longer than expected. Please try again.';
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'Too many requests. Please wait a moment before trying again.';
    }
    
    res.status(500).json({ error: errorMessage });
  }
};
