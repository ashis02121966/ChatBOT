import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'https://localhost:5173'
];

// Add WebContainer origins dynamically
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push(/webcontainer-api\.io$/);
  allowedOrigins.push(/local-credentialless\.webcontainer-api\.io$/);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or matches pattern
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
await fs.ensureDir(uploadsDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Process single document endpoint
app.post('/api/process-document', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { surveyId } = req.body;
    if (!surveyId) {
      return res.status(400).json({
        success: false,
        error: 'Survey ID is required'
      });
    }

    console.log(`Processing document: ${req.file.originalname} for survey: ${surveyId}`);

    // Mock successful processing response
    const mockProcessedDocument = {
      id: uuidv4(),
      fileName: req.file.originalname,
      surveyId: surveyId,
      content: `Mock extracted text content from ${req.file.originalname}. This would contain the actual document text in a real implementation.`,
      chunks: [
        {
          id: `chunk-1-${uuidv4()}`,
          content: `Sample chunk 1 from ${req.file.originalname}`,
          metadata: {
            section: 'Section 1',
            keywords: ['sample', 'document', 'text'],
            entities: ['Document', 'Sample'],
            wordCount: 50,
            characterCount: 250,
            contentType: 'general'
          }
        }
      ],
      images: [],
      metadata: {
        fileType: req.file.mimetype,
        uploadDate: new Date(),
        processedDate: new Date(),
        wordCount: 150,
        characterCount: 800,
        chunkCount: 1,
        imageCount: 0,
        processingMethod: 'server-side'
      }
    };

    // Clean up uploaded file
    try {
      await fs.remove(req.file.path);
    } catch (cleanupError) {
      console.error('Error cleaning up file:', cleanupError);
    }

    res.json({
      success: true,
      data: mockProcessedDocument
    });

  } catch (error) {
    console.error('Document processing error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        await fs.remove(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process document'
    });
  }
});

// Process multiple documents endpoint
app.post('/api/process-documents', upload.array('documents', 10), async (req, res) => {
  try {
    const files = req.files;
    const { surveyId } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    if (!surveyId) {
      return res.status(400).json({
        success: false,
        error: 'Survey ID is required'
      });
    }

    console.log(`Processing ${files.length} documents for survey: ${surveyId}`);

    // Mock batch processing response
    const processedDocuments = files.map(file => ({
      id: uuidv4(),
      fileName: file.originalname,
      surveyId: surveyId,
      content: `Mock extracted text from ${file.originalname}`,
      chunks: [{
        id: `chunk-${uuidv4()}`,
        content: `Sample content from ${file.originalname}`,
        metadata: {
          section: 'Section 1',
          keywords: ['sample'],
          entities: [],
          wordCount: 25,
          characterCount: 150
        }
      }],
      images: [],
      metadata: {
        fileType: file.mimetype,
        uploadDate: new Date(),
        processedDate: new Date(),
        wordCount: 100,
        characterCount: 500,
        chunkCount: 1,
        imageCount: 0,
        processingMethod: 'server-side'
      }
    }));

    // Clean up uploaded files
    files.forEach(file => {
      try {
        fs.remove(file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    });

    res.json({
      success: true,
      data: {
        documents: processedDocuments,
        summary: {
          total: files.length,
          successful: files.length,
          failed: 0
        }
      }
    });

  } catch (error) {
    console.error('Batch processing error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.remove(file.path);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process documents'
    });
  }
});

// Extract images endpoint
app.post('/api/extract-images', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    console.log(`Image extraction requested for: ${req.file.originalname}`);

    // Mock image extraction response
    const mockImages = [
      {
        id: uuidv4(),
        fileName: `${req.file.originalname} - Preview`,
        description: `Document preview showing content structure`,
        dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        type: 'document'
      }
    ];

    // Clean up uploaded file
    try {
      await fs.remove(req.file.path);
    } catch (cleanupError) {
      console.error('Error cleaning up file:', cleanupError);
    }

    res.json({
      success: true,
      data: {
        images: mockImages
      }
    });

  } catch (error) {
    console.error('Image extraction error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        await fs.remove(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to extract images'
    });
  }
});

// Chat endpoint
app.post('/api/chat', (req, res) => {
  try {
    const { message, surveyId, userId } = req.body;
    
    if (!message || !surveyId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: message, surveyId, userId'
      });
    }

    // Mock response - in a real implementation, this would process the message
    res.json({
      success: true,
      data: {
        response: 'This is a mock response from the server. The client-side SLM will handle actual chat processing.',
        confidence: 0.8,
        isAnswered: true
      }
    });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message'
    });
  }
});

// Get surveys endpoint
app.get('/api/surveys', (req, res) => {
  try {
    const surveys = [
      { id: 'survey-1', name: 'Population Census Survey', description: 'National population census data collection' },
      { id: 'survey-2', name: 'Economic Household Survey', description: 'Household economic status survey' },
      { id: 'survey-3', name: 'Health and Nutrition Survey', description: 'Health and nutrition assessment' },
      { id: 'survey-4', name: 'Education Access Survey', description: 'Educational access and quality survey' },
      { id: 'survey-5', name: 'ASUSE Industry Survey', description: 'Industry and business survey' }
    ];

    res.json({
      success: true,
      data: { surveys }
    });
  } catch (error) {
    console.error('Surveys endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch surveys'
    });
  }
});

// Upload files for survey endpoint
app.post('/api/surveys/:id/files', upload.array('files', 10), (req, res) => {
  try {
    const surveyId = req.params.id;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    console.log(`Received ${files.length} files for survey: ${surveyId}`);

    // Clean up uploaded files
    files.forEach(file => {
      try {
        fs.remove(file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    });

    res.json({
      success: true,
      data: {
        uploadedFiles: files.map(file => ({
          filename: file.originalname,
          size: file.size,
          type: file.mimetype
        }))
      }
    });
  } catch (error) {
    console.error('File upload endpoint error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.remove(file.path);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload files'
    });
  }
});

// Get chat history endpoint
app.get('/api/chat/history', (req, res) => {
  try {
    const { userId, surveyId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    // Mock response - in a real implementation, this would fetch from database
    res.json({
      success: true,
      data: {
        sessions: []
      }
    });
  } catch (error) {
    console.error('Chat history endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat history'
    });
  }
});

// Text extraction endpoint
app.post('/api/extract-text', upload.single('document'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    console.log(`Text extraction requested for: ${req.file.originalname}`);

    // Clean up uploaded file
    fs.remove(req.file.path);

    res.json({
      success: true,
      data: {
        text: 'Mock extracted text from the document. In a real implementation, this would contain the actual extracted text.',
        wordCount: 150,
        characterCount: 800
      }
    });
  } catch (error) {
    console.error('Text extraction error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.remove(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to extract text'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 50MB.'
      });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Survey ChatBot Server is running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      processDocument: '/api/process-document',
      processDocuments: '/api/process-documents',
      extractText: '/api/extract-text',
      extractImages: '/api/extract-images',
      chat: '/api/chat',
      surveys: '/api/surveys',
      chatHistory: '/api/chat/history'
    }
  });
});

// 404 handler for all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Survey ChatBot Server running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`🌐 CORS enabled for multiple origins including WebContainer`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});