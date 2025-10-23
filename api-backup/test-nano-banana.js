// Test endpoint - sprawdza co jest wysyłane do Nano Banana
module.exports = async (req, res) => {
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
    const { imageData, prompt, productType } = req.body;

    // Symuluj config dla stylu krolewski
    const config = {
      model: "google/nano-banana",
      prompt: "Stwórz obraz w stylu jak na pierwszym obrazku, z pyskiem i głową kota z drugiego obrazka. Zachowaj kolor sierści, jej długość, kolor oczu, kształt uszu i inne cechy identyfikujące kota z drugiego obrazka. Zwróć uwagę na koronę, aby kot miał tylko dwoje uszu, które ładnie komponują się z koroną i mają taki kolor jak u kota z drugiego obrazka.",
      apiType: "nano-banana",
      productType: "cats",
      parameters: {
        image_input: ["https://customify-s56o.vercel.app/koty/krolewski.png", "USER_IMAGE"],
        aspect_ratio: "3:4",
        output_format: "jpg"
      }
    };

    // Symuluj imageDataUri
    const imageDataUri = `data:image/png;base64,${imageData.substring(0, 100)}...`;

    // Symuluj inputParams dla Nano Banana
    const inputParams = {
      prompt: config.prompt,
      image_input: [
        config.parameters.image_input[0], // Miniaturka stylu
        imageDataUri // Obrazek użytkownika
      ],
      aspect_ratio: config.parameters.aspect_ratio,
      output_format: config.parameters.output_format
    };

    // Zwróć szczegóły
    res.json({
      success: true,
      test: 'nano-banana-input-params',
      details: {
        model: config.model,
        prompt: config.prompt,
        productType: config.productType,
        image_input_count: inputParams.image_input.length,
        image_input: [
          {
            index: 0,
            type: 'URL (miniaturka)',
            value: inputParams.image_input[0]
          },
          {
            index: 1,
            type: 'Data URI (user)',
            valuePreview: inputParams.image_input[1].substring(0, 100) + '...',
            length: inputParams.image_input[1].length
          }
        ],
        aspect_ratio: inputParams.aspect_ratio,
        output_format: inputParams.output_format,
        full_params: inputParams
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
};

