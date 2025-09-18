# Survey ChatBot Server

Server-side text extraction and document processing service for the Survey ChatBot application.

## Features

- **Robust Text Extraction**: Server-side processing for PDF, Word, Excel, and text files
- **Image Extraction**: Extract and process images from documents with OCR capabilities
- **Intelligent Chunking**: Smart content segmentation for better AI processing
- **Batch Processing**: Handle multiple documents simultaneously
- **Error Handling**: Comprehensive error handling and recovery
- **Security**: Rate limiting, file validation, and secure uploads

## Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Document Processing

#### Process Single Document
```
POST /api/process-document
Content-Type: multipart/form-data

Body:
- document: File (PDF, Word, Excel, or Text)
- surveyId: String (required)
```

#### Process Multiple Documents
```
POST /api/process-documents
Content-Type: multipart/form-data

Body:
- documents: File[] (up to 10 files)
- surveyId: String (required)
```

#### Extract Text Only
```
POST /api/extract-text
Content-Type: multipart/form-data

Body:
- document: File
```

#### Extract Images Only
```
POST /api/extract-images
Content-Type: multipart/form-data

Body:
- document: File
```

### Health Check
```
GET /api/health
```

## Supported File Types

- **PDF**: `.pdf` - Portable Document Format
- **Word**: `.doc`, `.docx` - Microsoft Word documents
- **Excel**: `.xls`, `.xlsx` - Microsoft Excel spreadsheets
- **Text**: `.txt` - Plain text files

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3001)
- `CLIENT_URL`: Frontend URL for CORS (default: http://localhost:5173)
- `MAX_FILE_SIZE`: Maximum file size in bytes (default: 50MB)
- `UPLOAD_DIR`: Directory for temporary file uploads
- `TEMP_DIR`: Directory for temporary processing files

### File Size Limits

- Maximum file size: 50MB per file
- Maximum files per batch: 10 files
- Supported total batch size: 500MB

## Text Extraction Methods

### PDF Processing
- Primary: `pdf-parse` for text extraction
- Fallback: OCR with Tesseract.js for scanned PDFs
- Image extraction: Document preview generation

### Word Document Processing
- Uses `mammoth` for reliable text extraction
- Handles both `.doc` and `.docx` formats
- Preserves document structure and formatting

### Excel Processing
- Uses `xlsx` library for spreadsheet processing
- Extracts text from all worksheets
- Maintains sheet structure and relationships

### OCR Capabilities
- Tesseract.js integration for image-based documents
- Automatic fallback for scanned PDFs
- Configurable language support

## Error Handling

The server implements comprehensive error handling:

- **File Validation**: Type and size checking
- **Processing Errors**: Graceful degradation with meaningful messages
- **Resource Cleanup**: Automatic cleanup of temporary files
- **Rate Limiting**: Protection against abuse
- **Logging**: Detailed logging for debugging

## Security Features

- **File Type Validation**: Only allowed file types accepted
- **Size Limits**: Prevents oversized uploads
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configurable origin restrictions
- **Helmet Security**: Standard security headers
- **Input Sanitization**: Clean and validate all inputs

## Performance Optimization

- **Streaming**: Large file processing with streams
- **Memory Management**: Efficient buffer handling
- **Concurrent Processing**: Parallel document processing
- **Caching**: Intelligent caching of processed results
- **Cleanup**: Automatic resource cleanup

## Monitoring and Logging

- Health check endpoint for monitoring
- Detailed processing logs
- Error tracking and reporting
- Performance metrics
- Resource usage monitoring

## Development

### Running in Development Mode
```bash
npm run dev
```

### Testing
```bash
# Test single document processing
curl -X POST http://localhost:3001/api/process-document \
  -F "document=@test.pdf" \
  -F "surveyId=survey-1"

# Health check
curl http://localhost:3001/api/health
```

### Adding New File Types

1. Add MIME type to allowed types in `index.js`
2. Implement extraction method in `TextExtractor.js`
3. Add image extraction support in `ImageExtractor.js`
4. Update documentation

## Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Configure proper `CLIENT_URL`
3. Set up process manager (PM2, systemd)
4. Configure reverse proxy (nginx)
5. Set up SSL/TLS certificates
6. Configure monitoring and logging

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

1. **PDF Text Extraction Fails**
   - Check if PDF is password protected
   - Verify PDF is not corrupted
   - Try OCR fallback for scanned documents

2. **Memory Issues**
   - Reduce batch size
   - Check available system memory
   - Monitor memory usage during processing

3. **File Upload Errors**
   - Verify file size limits
   - Check file type restrictions
   - Ensure proper form encoding

### Logs and Debugging

- Check server logs for detailed error messages
- Enable debug logging with `LOG_LEVEL=debug`
- Monitor resource usage during processing
- Use health check endpoint for status monitoring