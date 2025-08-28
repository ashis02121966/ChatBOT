import { TextExtractor } from './TextExtractor.js';
import { ImageExtractor } from './ImageExtractor.js';
import { ChunkProcessor } from './ChunkProcessor.js';
import { v4 as uuidv4 } from 'uuid';

export class DocumentProcessor {
  constructor() {
    this.textExtractor = new TextExtractor();
    this.imageExtractor = new ImageExtractor();
    this.chunkProcessor = new ChunkProcessor();
  }

  async processDocument(file, surveyId) {
    console.log(`Starting comprehensive document processing for: ${file.originalname}`);
    
    try {
      // Validate document first
      await this.validateDocument(file);

      // Extract text content with comprehensive processing
      console.log('Performing comprehensive text extraction...');
      const textContent = await this.textExtractor.extractText(file);
      
      if (!textContent || textContent.length < 100) {
        throw new Error(`Insufficient text content extracted from ${file.originalname}. The document may be image-based, corrupted, or password-protected. Extracted: ${textContent?.length || 0} characters.`);
      }

      console.log(`Text extraction successful: ${textContent.length} characters extracted`);

      // Extract images with comprehensive processing
      console.log('Performing comprehensive image extraction...');
      let images = [];
      try {
        images = await this.imageExtractor.extractImages(file);
        console.log(`Image extraction successful: ${images.length} visual representations created`);
      } catch (imageError) {
        console.warn('Image extraction encountered issues, continuing without images:', imageError.message);
        // Continue processing without images - this is acceptable
      }

      // Process text into comprehensive chunks
      console.log('Creating comprehensive content chunks...');
      const chunks = await this.chunkProcessor.createChunks(textContent, file.originalname);
      
      if (!chunks || chunks.length === 0) {
        throw new Error('Failed to create content chunks from extracted text');
      }

      console.log(`Chunk processing successful: ${chunks.length} high-quality chunks created`);

      // Create comprehensive processed document object
      const processedDocument = {
        id: uuidv4(),
        fileName: file.originalname,
        surveyId: surveyId,
        content: textContent,
        chunks: chunks,
        images: images,
        metadata: {
          fileType: file.mimetype,
          originalSize: file.size,
          uploadDate: new Date(),
          processedDate: new Date(),
          wordCount: textContent.split(/\s+/).filter(word => word.length > 0).length,
          characterCount: textContent.length,
          chunkCount: chunks.length,
          imageCount: images.length,
          processingMethod: 'server-side-enhanced',
          processingQuality: this.assessProcessingQuality(textContent, chunks, images),
          contextRichness: this.calculateContextRichness(chunks),
          extractionConfidence: this.calculateExtractionConfidence(textContent, file),
          aiReadiness: this.assessAIReadiness(chunks, images)
        }
      };

      // Log comprehensive processing results
      console.log(`Comprehensive document processing completed successfully for ${file.originalname}:`);
      console.log(`  - Text: ${processedDocument.metadata.wordCount} words (${processedDocument.metadata.characterCount} characters)`);
      console.log(`  - Chunks: ${processedDocument.metadata.chunkCount} high-quality segments`);
      console.log(`  - Images: ${processedDocument.metadata.imageCount} visual representations`);
      console.log(`  - Processing Quality: ${processedDocument.metadata.processingQuality}`);
      console.log(`  - Context Richness: ${processedDocument.metadata.contextRichness}`);
      console.log(`  - AI Readiness: ${processedDocument.metadata.aiReadiness}`);

      return processedDocument;

    } catch (error) {
      console.error(`Comprehensive document processing failed for ${file.originalname}:`, error);
      throw new Error(`Failed to process document "${file.originalname}": ${error.message}`);
    }
  }

  async validateDocument(file) {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`Unsupported file type: ${file.mimetype}. Supported types: ${allowedTypes.join(', ')}`);
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error(`File size (${this.formatFileSize(file.size)}) exceeds maximum limit of ${this.formatFileSize(maxSize)}`);
    }

    if (file.size < 100) {
      throw new Error('File appears to be empty or corrupted');
    }

    return true;
  }

  assessProcessingQuality(textContent, chunks, images) {
    let qualityScore = 0;
    
    // Text quality assessment
    if (textContent.length > 1000) qualityScore += 25;
    else if (textContent.length > 500) qualityScore += 15;
    else if (textContent.length > 200) qualityScore += 10;
    
    // Structure quality assessment
    const hasStructure = /=== .+? ===/.test(textContent) || 
                        /\n\s*[A-Z][A-Z\s]{5,50}\n/.test(textContent) ||
                        /\n\s*\d+\.\s+/.test(textContent);
    if (hasStructure) qualityScore += 20;
    
    // Chunk quality assessment
    if (chunks.length > 0) {
      const avgChunkQuality = chunks.reduce((sum, chunk) => 
        sum + (chunk.metadata.contextQuality || 0), 0) / chunks.length;
      qualityScore += Math.min(avgChunkQuality * 3, 25);
    }
    
    // Content richness assessment
    const hasKeywords = chunks.some(chunk => chunk.metadata.keywords && chunk.metadata.keywords.length > 5);
    const hasEntities = chunks.some(chunk => chunk.metadata.entities && chunk.metadata.entities.length > 3);
    if (hasKeywords) qualityScore += 10;
    if (hasEntities) qualityScore += 10;
    
    // Image enhancement bonus
    if (images.length > 0) qualityScore += 10;
    
    // Return quality rating
    if (qualityScore >= 80) return 'Excellent';
    if (qualityScore >= 60) return 'High';
    if (qualityScore >= 40) return 'Good';
    if (qualityScore >= 20) return 'Fair';
    return 'Basic';
  }

  calculateContextRichness(chunks) {
    if (!chunks || chunks.length === 0) return 0;
    
    let richnessScore = 0;
    
    // Diversity of content types
    const contentTypes = new Set(chunks.map(chunk => chunk.metadata.contentType));
    richnessScore += contentTypes.size * 10;
    
    // Keyword density
    const totalKeywords = chunks.reduce((sum, chunk) => 
      sum + (chunk.metadata.keywords ? chunk.metadata.keywords.length : 0), 0);
    richnessScore += Math.min(totalKeywords / chunks.length * 5, 25);
    
    // Entity richness
    const totalEntities = chunks.reduce((sum, chunk) => 
      sum + (chunk.metadata.entities ? chunk.metadata.entities.length : 0), 0);
    richnessScore += Math.min(totalEntities / chunks.length * 3, 20);
    
    // Structure variety
    const hasLists = chunks.some(chunk => chunk.metadata.hasLists);
    const hasTables = chunks.some(chunk => chunk.metadata.hasTables);
    const hasProcedures = chunks.some(chunk => chunk.metadata.hasProcedures);
    const hasDefinitions = chunks.some(chunk => chunk.metadata.hasDefinitions);
    
    if (hasLists) richnessScore += 5;
    if (hasTables) richnessScore += 5;
    if (hasProcedures) richnessScore += 10;
    if (hasDefinitions) richnessScore += 10;
    
    // Importance weighting
    const avgImportance = chunks.reduce((sum, chunk) => 
      sum + (chunk.metadata.importance || 1), 0) / chunks.length;
    richnessScore += (avgImportance - 1) * 15;
    
    return Math.min(Math.round(richnessScore), 100);
  }

  calculateExtractionConfidence(textContent, file) {
    let confidence = 50; // Base confidence
    
    // File type confidence
    if (file.mimetype === 'text/plain') confidence += 30;
    else if (file.mimetype.includes('word')) confidence += 25;
    else if (file.mimetype.includes('sheet')) confidence += 20;
    else if (file.mimetype === 'application/pdf') confidence += 15;
    
    // Content length confidence
    if (textContent.length > 5000) confidence += 15;
    else if (textContent.length > 2000) confidence += 10;
    else if (textContent.length > 1000) confidence += 5;
    
    // Content quality indicators
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 10) confidence += 10;
    
    const words = textContent.split(/\s+/).filter(word => word.length > 2);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    if (avgWordLength > 4 && avgWordLength < 8) confidence += 5;
    
    // Structure indicators
    if (/\n\s*[A-Z][A-Z\s]{5,50}\n/.test(textContent)) confidence += 5;
    if (/\n\s*\d+\.\s+/.test(textContent)) confidence += 5;
    if (/=== .+? ===/.test(textContent)) confidence += 10;
    
    return Math.min(confidence, 100);
  }

  assessAIReadiness(chunks, images) {
    let readinessScore = 0;
    
    // Chunk quality and quantity
    if (chunks.length >= 5) readinessScore += 20;
    else if (chunks.length >= 3) readinessScore += 15;
    else if (chunks.length >= 1) readinessScore += 10;
    
    // Content diversity
    const contentTypes = new Set(chunks.map(chunk => chunk.metadata.contentType));
    readinessScore += Math.min(contentTypes.size * 5, 20);
    
    // Keyword richness
    const hasRichKeywords = chunks.some(chunk => 
      chunk.metadata.keywords && chunk.metadata.keywords.length > 10);
    if (hasRichKeywords) readinessScore += 15;
    
    // Entity extraction
    const hasEntities = chunks.some(chunk => 
      chunk.metadata.entities && chunk.metadata.entities.length > 5);
    if (hasEntities) readinessScore += 10;
    
    // Structure preservation
    const hasStructure = chunks.some(chunk => 
      chunk.metadata.structures && chunk.metadata.structures.length > 0);
    if (hasStructure) readinessScore += 10;
    
    // Metadata richness
    const hasMetadata = chunks.some(chunk => chunk.metadata.hasMetadata);
    if (hasMetadata) readinessScore += 10;
    
    // Visual context
    if (images.length > 0) readinessScore += 10;
    if (images.length > 2) readinessScore += 5;
    
    // Context quality
    const avgContextQuality = chunks.reduce((sum, chunk) => 
      sum + (chunk.metadata.contextQuality || 0), 0) / chunks.length;
    readinessScore += Math.min(avgContextQuality * 2, 15);
    
    // Return readiness rating
    if (readinessScore >= 85) return 'Excellent';
    if (readinessScore >= 70) return 'High';
    if (readinessScore >= 55) return 'Good';
    if (readinessScore >= 40) return 'Fair';
    return 'Basic';
  }

  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  getSupportedFormats() {
    return [
      { 
        type: 'PDF', 
        extensions: ['.pdf'], 
        description: 'Portable Document Format with enhanced text and structure extraction',
        features: ['Text extraction', 'Structure preservation', 'Image generation', 'OCR fallback']
      },
      { 
        type: 'Word', 
        extensions: ['.doc', '.docx'], 
        description: 'Microsoft Word Document with comprehensive content analysis',
        features: ['Rich text extraction', 'Structure preservation', 'Style analysis', 'Content categorization']
      },
      { 
        type: 'Excel', 
        extensions: ['.xls', '.xlsx'], 
        description: 'Microsoft Excel Spreadsheet with data structure analysis',
        features: ['Multi-sheet processing', 'Data structure analysis', 'Header detection', 'Content summarization']
      },
      { 
        type: 'Text', 
        extensions: ['.txt'], 
        description: 'Plain Text File with structure detection and enhancement',
        features: ['Structure detection', 'Content analysis', 'Keyword extraction', 'Context enhancement']
      }
    ];
  }

  async cleanup() {
    try {
      await this.textExtractor.cleanup();
      await this.imageExtractor.cleanup();
      console.log('Document processor cleanup completed');
    } catch (error) {
      console.error('Document processor cleanup error:', error);
    }
  }
}