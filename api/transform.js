const Replicate = require('replicate');

// Initialize Replicate (only if token is provided)
let replicate = null;
if (process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_API_TOKEN !== 'leave_empty_for_now') {
  replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { imageData, prompt } = req.body;

    if (!imageData || !prompt) {
      return res.status(400).json({ error: 'Image data and prompt are required' });
    }

    if (!replicate) {
      return res.status(400).json({ error: 'Replicate API token not configured' });
    }

    // Convert base64 to data URL for Replicate
    const imageUrl = `data:image/jpeg;base64,${imageData}`;

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
        refine: "none",
        high_noise_frac: 0.7,
        output_format: "png"
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
        image: imageUrl,
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
        image: imageUrl,
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
    } else {
      // Stable Diffusion model parameters (default)
      inputParams = {
        ...inputParams,
        image: imageUrl,
        num_inference_steps: config.num_inference_steps,
        guidance_scale: config.guidance_scale,
        strength: config.strength
      };
    }

    console.log(`Running model: ${config.model}`);
    console.log(`Input parameters:`, inputParams);

    // Add timeout and better error handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout - model took too long')), 300000); // 5 minutes
    });

    const replicatePromise = replicate.run(config.model, {
      input: inputParams
    });

    const output = await Promise.race([replicatePromise, timeoutPromise]);

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
