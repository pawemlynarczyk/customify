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
        model: "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        prompt: `in the style of Vincent van Gogh, ${prompt}, oil painting, thick brushstrokes, vibrant colors, post-impressionist`,
        strength: 0.8
      },
      'picasso': {
        model: "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        prompt: `in the style of Pablo Picasso, ${prompt}, cubist, abstract, geometric shapes, bold colors`,
        strength: 0.8
      },
      'monet': {
        model: "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        prompt: `in the style of Claude Monet, ${prompt}, impressionist, soft brushstrokes, light and color, water lilies style`,
        strength: 0.8
      },
      'anime': {
        model: "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        prompt: `anime style, ${prompt}, manga, japanese animation, cel shading, vibrant colors, detailed eyes`,
        strength: 0.7
      },
      'cyberpunk': {
        model: "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        prompt: `cyberpunk style, ${prompt}, neon lights, futuristic, high tech, dark atmosphere, glowing effects`,
        strength: 0.8
      },
      'watercolor': {
        model: "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        prompt: `watercolor painting, ${prompt}, soft colors, flowing brushstrokes, artistic, delicate`,
        strength: 0.7
      }
    };

    // Get style from prompt or use default
    const style = Object.keys(styleConfig).find(s => prompt.toLowerCase().includes(s)) || 'anime';
    const config = styleConfig[style] || styleConfig['anime'];

    console.log(`Using style: ${style}, model: ${config.model}`);

    const output = await replicate.run(config.model, {
      input: {
        image: imageUrl,
        prompt: config.prompt,
        num_inference_steps: 20,
        guidance_scale: 7.5,
        strength: config.strength
      }
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
