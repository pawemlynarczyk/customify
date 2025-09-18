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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
    let model, inputParams;
    
    // Map styles to appropriate models and parameters
    const styleConfig = {
      'van gogh': {
        model: "stability-ai/stable-diffusion:db21e45d3f7023abc2e46a38e7e5df2717954a28",
        prompt: `in the style of Vincent van Gogh, ${prompt}, oil painting, thick brushstrokes, vibrant colors, post-impressionist`,
        strength: 0.8,
        guidance_scale: 7.5,
        num_inference_steps: 20
      },
      'picasso': {
        model: "stability-ai/stable-diffusion:db21e45d3f7023abc2e46a38e7e5df2717954a28",
        prompt: `in the style of Pablo Picasso, ${prompt}, cubist, abstract, geometric shapes, bold colors`,
        strength: 0.8,
        guidance_scale: 7.5,
        num_inference_steps: 20
      },
      'monet': {
        model: "stability-ai/stable-diffusion:db21e45d3f7023abc2e46a38e7e5df2717954a28",
        prompt: `in the style of Claude Monet, ${prompt}, impressionist, soft brushstrokes, light and color, water lilies style`,
        strength: 0.8,
        guidance_scale: 7.5,
        num_inference_steps: 20
      },
      'anime': {
        model: "aaronaftab/mirage-ghibli:166efd159b4138da932522bc5af40d39194033f587d9bdbab1e594119eae3e7f",
        prompt: `GHIBLI anime style, ${prompt}`,
        go_fast: true,
        guidance_scale: 10,
        prompt_strength: 0.77,
        num_inference_steps: 38
      },
      'cyberpunk': {
        model: "stability-ai/stable-diffusion:db21e45d3f7023abc2e46a38e7e5df2717954a28",
        prompt: `cyberpunk style, ${prompt}, neon lights, futuristic, high tech, dark atmosphere, glowing effects`,
        strength: 0.8,
        guidance_scale: 7.5,
        num_inference_steps: 20
      },
      'watercolor': {
        model: "stability-ai/stable-diffusion:db21e45d3f7023abc2e46a38e7e5df2717954a28",
        prompt: `watercolor painting, ${prompt}, soft colors, flowing brushstrokes, artistic, delicate`,
        strength: 0.7,
        guidance_scale: 7.5,
        num_inference_steps: 20
      }
    };

    // Get style from prompt or use default
    const style = Object.keys(styleConfig).find(s => prompt.toLowerCase().includes(s)) || 'anime';
    const config = styleConfig[style] || styleConfig['anime'];

    console.log(`Using style: ${style}, model: ${config.model}`);

    // Prepare input parameters based on model
    let inputParams = {
      image: imageUrl,
      prompt: config.prompt
    };

    // Add model-specific parameters
    if (config.model.includes('mirage-ghibli')) {
      // Ghibli anime model parameters
      inputParams = {
        ...inputParams,
        go_fast: config.go_fast,
        guidance_scale: config.guidance_scale,
        prompt_strength: config.prompt_strength,
        num_inference_steps: config.num_inference_steps
      };
    } else {
      // Stable Diffusion model parameters
      inputParams = {
        ...inputParams,
        num_inference_steps: config.num_inference_steps,
        guidance_scale: config.guidance_scale,
        strength: config.strength
      };
    }

    console.log(`Running model: ${config.model}`);
    console.log(`Input parameters:`, inputParams);

    const output = await replicate.run(config.model, {
      input: inputParams
    });

    res.json({ 
      success: true, 
      transformedImage: output[0] 
    });
  } catch (error) {
    console.error('AI transformation error:', error);
    res.status(500).json({ error: 'AI transformation failed' });
  }
};
