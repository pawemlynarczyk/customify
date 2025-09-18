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

    // Use Replicate for AI image transformation
    const output = await replicate.run(
      "stability-ai/stable-diffusion:db21e45d3f7023abc2e46a38e7e5df2717954a28",
      {
        input: {
          image: imageUrl,
          prompt: prompt,
          num_inference_steps: 20,
          guidance_scale: 7.5,
          strength: 0.8
        }
      }
    );

    res.json({ 
      success: true, 
      transformedImage: output[0] 
    });
  } catch (error) {
    console.error('AI transformation error:', error);
    res.status(500).json({ error: 'AI transformation failed' });
  }
};
