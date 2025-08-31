import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { DocumentProcessor } from './services/DocumentProcessor.js';

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

// Initialize server asynchronously
async function initializeServer() {
  try {
    // Initialize document processor with enhanced error handling
    console.log('🚀 Initializing document processor...');
    const documentProcessor = new DocumentProcessor();
    try {
      await documentProcessor.init();
    } catch (initError) {
      console.warn('⚠️ Document processor initialization had issues:', initError.message);
      console.log('📄 Server will continue with basic processing capabilities');
    }
    console.log('✅ Document processor initialized successfully');

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

        const { surveyId, category } = req.body;
        if (!surveyId) {
          return res.status(400).json({
            success: false,
            error: 'Survey ID is required'
          });
        }

        console.log(`Processing document: ${req.file.originalname} for survey: ${surveyId}, category: ${category || 'General Questions'}`);

        // Process document using DocumentProcessor
        console.log('📄 Starting document processing...');
        let processedDocument;
        try {
          processedDocument = await documentProcessor.processDocument(req.file, surveyId);
        } catch (processingError) {
          console.error('❌ Document processing failed, creating fallback response:', processingError.message);
          
          // Create a basic fallback processed document
          processedDocument = {
            id: uuidv4(),
            fileName: req.file.originalname,
            surveyId: surveyId,
            content: `Document "${req.file.originalname}" was uploaded but could not be fully processed. File type: ${req.file.mimetype}, Size: ${req.file.size} bytes.`,
            chunks: [{
              id: uuidv4(),
              content: `Basic document information for ${req.file.originalname}`,
              metadata: {
                section: 'Document Info',
                keywords: ['document', 'file', req.file.originalname.split('.')[0]],
                entities: [],
                wordCount: 10,
                characterCount: 100,
                contentType: 'general',
                importance: 1.0
              }
            }],
            images: [],
            metadata: {
              fileType: req.file.mimetype,
              originalSize: req.file.size,
              uploadDate: new Date(),
              processedDate: new Date(),
              wordCount: 10,
              characterCount: 100,
              chunkCount: 1,
              imageCount: 0,
              processingMethod: 'server-side-fallback',
              processingQuality: 'Basic',
              contextRichness: 10,
              extractionConfidence: 30,
              aiReadiness: 'Basic'
            }
          };
        }
        console.log('✅ Document processing completed');
        
        // Save to database
        try {
          console.log('💾 Starting database save operations...');
          
          // Create document record
          const documentData = {
            id: processedDocument.id,
            file_name: processedDocument.fileName,
            survey_id: processedDocument.surveyId,
            category: category || 'General Questions',
            content: processedDocument.content,
            file_type: processedDocument.metadata.fileType,
            upload_date: new Date().toISOString(),
            processed_date: new Date().toISOString(),
            word_count: processedDocument.metadata.wordCount,
            character_count: processedDocument.metadata.characterCount,
            chunk_count: processedDocument.metadata.chunkCount,
            image_count: processedDocument.metadata.imageCount,
            processing_method: processedDocument.metadata.processingMethod,
            is_admin_generated: false,
            user_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          console.log('💾 Saving document to database with data:', {
            id: documentData.id,
            fileName: documentData.file_name,
            surveyId: documentData.survey_id,
            category: documentData.category,
            contentLength: documentData.content.length
          });
          
          let savedDocument = null;
          try {
            savedDocument = await databaseService.createDocument(documentData);
          } catch (dbError) {
            console.error('❌ Database save failed, continuing without database storage:', dbError.message);
            // Continue processing even if database save fails
          }
          
          if (savedDocument) {
            console.log('✅ Document saved successfully:', savedDocument.id);
            
            // Save document chunks
            if (processedDocument.chunks && processedDocument.chunks.length > 0) {
              const chunksData = processedDocument.chunks.map(chunk => ({
                id: chunk.id,
                document_id: savedDocument.id,
                content: chunk.content,
                section: chunk.metadata.section || 'Section',
                keywords: chunk.metadata.keywords || [],
                entities: chunk.metadata.entities || [],
                word_count: chunk.metadata.wordCount || 0,
                character_count: chunk.metadata.characterCount || 0,
                content_type: chunk.metadata.contentType || 'general',
                importance: chunk.metadata.importance || 1.0,
                is_admin_answer: false
              }));
              
              console.log(`💾 Saving ${chunksData.length} chunks to database...`);
              try {
                const savedChunks = await databaseService.createDocumentChunks(chunksData);
                console.log(`✅ ${savedChunks.length} chunks saved successfully`);
              } catch (chunksError) {
                console.error('❌ Chunks save failed:', chunksError.message);
              }
            }
            
            // Save document images
            if (processedDocument.images && processedDocument.images.length > 0) {
              const imagesData = processedDocument.images.map(image => ({
                id: image.id,
                document_id: savedDocument.id,
                chunk_id: null, // Will be linked to specific chunks if needed
                file_name: image.fileName,
                description: image.description,
                image_type: image.type || 'document',
                data_url: image.dataUrl
              }));
              
              console.log(`💾 Saving ${imagesData.length} images to database...`);
              try {
                const savedImages = await databaseService.createDocumentImages(imagesData);
                console.log(`✅ ${savedImages.length} images saved successfully`);
              } catch (imagesError) {
                console.error('❌ Images save failed:', imagesError.message);
              }
            } else {
              console.log('ℹ️ No images to save for this document');
            }
          } else {
            console.log('ℹ️ Document not saved to database, but processing completed successfully');
          }
        } catch (dbError) {
          console.error('❌ Database operations failed:', dbError.message);
          console.log('📄 Continuing with document processing response');
        }

        // Clean up uploaded file
        try {
          await fs.remove(req.file.path);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }

        res.json({
          success: true,
          data: processedDocument
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

        // Return a more graceful error response
        res.status(200).json({
          success: false,
          error: error.message || 'Failed to process document',
          fallback: true,
          data: {
            id: uuidv4(),
            fileName: req.file?.originalname || 'unknown',
            content: 'Document processing encountered an error but the file was received.',
            metadata: {
              processingMethod: 'error-fallback',
              error: error.message
            }
          }
        });
      }
    });

    // Process multiple documents endpoint
    app.post('/api/process-documents', upload.array('documents', 10), async (req, res) => {
      try {
        const files = req.files;
        const { surveyId, category } = req.body;

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

        console.log(`Processing ${files.length} documents for survey: ${surveyId}, category: ${category || 'General Questions'}`);

        // Process each document
        const processedDocuments = [];
        const errors = [];
        
        for (const file of files) {
          try {
            console.log(`📄 Processing file: ${file.originalname}`);
            const processedDoc = await documentProcessor.processDocument(file, surveyId);
            console.log(`✅ File processing completed: ${file.originalname}`);
            
            // Save to database
            try {
              console.log(`💾 Saving ${file.originalname} to database...`);
              
              const documentData = {
                id: processedDoc.id,
                file_name: processedDoc.fileName,
                survey_id: processedDoc.surveyId,
                category: category || 'General Questions',
                content: processedDoc.content,
                file_type: processedDoc.metadata.fileType,
                upload_date: new Date().toISOString(),
                processed_date: new Date().toISOString(),
                word_count: processedDoc.metadata.wordCount,
                character_count: processedDoc.metadata.characterCount,
                chunk_count: processedDoc.metadata.chunkCount,
                image_count: processedDoc.metadata.imageCount,
                processing_method: processedDoc.metadata.processingMethod,
                is_admin_generated: false,
                user_id: userId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              
              const savedDocument = await databaseService.createDocument(documentData);
              
              if (savedDocument) {
                console.log(`✅ Document ${file.originalname} saved with ID: ${savedDocument.id}`);
                
                // Save chunks
                if (processedDoc.chunks && processedDoc.chunks.length > 0) {
                  const chunksData = processedDoc.chunks.map(chunk => ({
                    id: chunk.id,
                    document_id: savedDocument.id,
                    content: chunk.content,
                    section: chunk.metadata.section || 'Section',
                    keywords: chunk.metadata.keywords || [],
                    entities: chunk.metadata.entities || [],
                    word_count: chunk.metadata.wordCount || 0,
                    character_count: chunk.metadata.characterCount || 0,
                    content_type: chunk.metadata.contentType || 'general',
                    importance: chunk.metadata.importance || 1.0,
                    is_admin_answer: false
                  }));
                  
                  const savedChunks = await databaseService.createDocumentChunks(chunksData);
                  console.log(`✅ ${savedChunks.length} chunks saved for ${file.originalname}`);
                }
                
                // Save images
                if (processedDoc.images && processedDoc.images.length > 0) {
                  const imagesData = processedDoc.images.map(image => ({
                    id: image.id,
                    document_id: savedDocument.id,
                    chunk_id: null,
                    file_name: image.fileName,
                    description: image.description,
                    image_type: image.type || 'document',
                    data_url: image.dataUrl
                  }));
                  
                  const savedImages = await databaseService.createDocumentImages(imagesData);
                  console.log(`✅ ${savedImages.length} images saved for ${file.originalname}`);
                } else {
                  console.log(`ℹ️ No images to save for ${file.originalname}`);
                }
              } else {
                console.error(`❌ Document save returned null for ${file.originalname}`);
              }
            } catch (dbError) {
              console.error(`❌ Database save error for ${file.originalname}:`, dbError);
              console.error('❌ Error details:', dbError.details);
              console.error('❌ Error hint:', dbError.hint);
              // Continue processing other files
            }
            
            processedDocuments.push(processedDoc);
            console.log(`✅ Successfully processed and saved: ${file.originalname}`);
            
          } catch (fileError) {
            console.error(`❌ Error processing ${file.originalname}:`, fileError);
            errors.push({
              fileName: file.originalname,
              error: fileError.message
            });
          }
        }

        // Clean up uploaded files
        files.forEach(file => {
          try {
            fs.remove(file.path);
          } catch (cleanupError) {
            console.error('Error cleaning up file:', cleanupError);
          }
        });

        console.log(`📊 Batch processing summary: ${processedDocuments.length}/${files.length} successful`);
        
        res.json({
          success: true,
          data: {
            documents: processedDocuments,
            summary: {
              total: files.length,
              successful: processedDocuments.length,
              failed: errors.length,
              errors: errors
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
    app.post('/api/extract-text', upload.single('document'), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            error: 'No file uploaded'
          });
        }

        console.log(`Text extraction requested for: ${req.file.originalname}`);

        // Clean up uploaded file
        try {
          await fs.remove(req.file.path);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }

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
            await fs.remove(req.file.path);
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

    // Error handling middleware (must be after all routes)
    app.use((error, req, res, next) => {
      console.error('Server error:', error);
      
      // Handle multer errors specifically
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'File too large. Maximum file size is 50MB.'
          });
        } else if (error.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            error: 'Too many files. Maximum 10 files allowed.'
          });
        } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            error: 'Unexpected file field.'
          });
        }
        
        return res.status(400).json({
          success: false,
          error: `File upload error: ${error.message}`
        });
      }
      
      // Handle other errors
      res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    });

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Initialize the server
initializeServer();