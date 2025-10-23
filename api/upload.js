const multer = require('multer');
const { checkRateLimit, getClientIP } = require('../utils/vercelRateLimiter');

// Configure multer for file uploads (memory storage for serverless)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // RATE LIMITING - Sprawdź limit dla upload'ów
  const ip = getClientIP(req);
  if (!checkRateLimit(ip, 50, 60 * 60 * 1000)) { // 50 upload'ów na godzinę
    console.log(`Upload rate limit exceeded for IP: ${ip}`);
    return res.status(429).json({
      error: 'Upload rate limit exceeded',
      message: 'Too many uploads. Please try again in 1 hour.',
      retryAfter: 3600 // 1 godzina w sekundach
    });
  }

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Check if request has JSON body (for base64 uploads)
  if (req.headers['content-type'] === 'application/json') {
    try {
      const { image, filename } = req.body;
      
      if (!image) {
        return res.status(400).json({ error: 'No image data provided' });
      }

      // For base64 uploads, return a temporary URL
      // In production, you'd save this to a file storage service
      const imageUrl = `https://customify-s56o.vercel.app/temp/${filename || 'image.png'}`;
      
      res.json({ 
        success: true, 
        url: imageUrl,
        imageUrl: imageUrl,
        filename: filename || 'image.png'
      });
    } catch (error) {
      console.error('JSON upload processing error:', error);
      res.status(500).json({ error: 'JSON upload processing failed' });
    }
    return;
  }

  // Use multer middleware for multipart uploads
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large' });
        }
      }
      return res.status(500).json({ error: 'Upload failed' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // For serverless, we'll return the file data as base64
      const fileData = req.file.buffer.toString('base64');
      res.json({ 
        success: true, 
        fileData: fileData,
        filename: req.file.originalname,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      console.error('Upload processing error:', error);
      res.status(500).json({ error: 'Upload processing failed' });
    }
  });
};
