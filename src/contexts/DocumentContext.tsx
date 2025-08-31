import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DocumentService } from '../services/DocumentService';
import { databaseService } from '../services/DatabaseService';
import { useAuth } from './AuthContext';

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    section: string;
    keywords: string[];
    entities: string[];
    wordCount: number;
    characterCount: number;
    contentType?: string;
    importance?: number;
    isAdminAnswer?: boolean;
    originalQuestion?: string;
    adminAnswer?: string;
    feedbackScore?: number; // Tracks positive vs negative feedback
    timesUsed?: number; // How many times this answer was provided
    correctFeedbackCount?: number; // Number of times marked as correct
    incorrectFeedbackCount?: number; // Number of times marked as incorrect
    lastUsed?: Date; // When this answer was last used
    dateAnswered?: string;
    category?: string;
  };
}

export interface ProcessedDocument {
  id: string;
  fileName: string;
  surveyId: string;
  category?: string;
  content: string;
  chunks: DocumentChunk[];
  images: Array<{
    id: string;
    fileName: string;
    description: string;
    dataUrl: string;
    type: string;
  }>;
  metadata: {
    fileType: string;
    uploadDate: Date;
    processedDate: Date;
    wordCount: number;
    characterCount: number;
    chunkCount: number;
    imageCount: number;
    processingMethod: string;
    isAdminGenerated?: boolean;
    category?: string;
  };
}

interface DocumentContextType {
  documents: ProcessedDocument[];
  processDocument: (file: File, surveyId: string, category?: string) => Promise<void>;
  addDocument: (document: ProcessedDocument) => void;
  updateAdminKnowledgeDocument: (question: string, answer: string, surveyId?: string) => void;
  updateChunkFeedback: (chunkId: string, feedbackType: 'correct' | 'incorrect') => void;
  deleteDocument: (documentId: string) => void;
  searchDocuments: (query: string, surveyId?: string, category?: string) => DocumentChunk[];
  searchImages: (query: string, surveyId?: string, category?: string) => Array<{
    id: string;
    fileName: string;
    description: string;
    dataUrl: string;
    type: string;
  }>;
  getDocumentsBySurvey: (surveyId: string, category?: string) => ProcessedDocument[];
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export function useDocuments() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
}

interface DocumentProviderProps {
  children: ReactNode;
}

// Utility functions for localStorage management
const STORAGE_KEYS = {
  CLIENT_DOCUMENTS: 'processedDocuments',
  SERVER_DOCUMENTS: 'serverProcessedDocuments'
};

// Check localStorage availability and quota
const checkStorageAvailability = (): { available: boolean; quota?: number; used?: number } => {
  try {
    if (typeof Storage === 'undefined') {
      return { available: false };
    }
    
    // Test if we can write to localStorage
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    
    // Try to get storage quota information (if available)
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        console.log(`📊 Storage quota: ${Math.round((estimate.quota || 0) / 1024 / 1024)}MB, used: ${Math.round((estimate.usage || 0) / 1024 / 1024)}MB`);
      });
    }
    
    return { available: true };
  } catch (error) {
    console.warn('⚠️ localStorage not available:', error);
    return { available: false };
  }
};

// Get storage size for debugging
const getStorageSize = (): number => {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return total;
};

export function DocumentProvider({ children }: DocumentProviderProps) {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [serverProcessedDocuments, setServerProcessedDocuments] = useState<ProcessedDocument[]>([]);
  const [documentService] = useState(() => new DocumentService());
  const { user } = useAuth();

  // Load documents from localStorage on component mount
  useEffect(() => {
    const storageCheck = checkStorageAvailability();
    if (!storageCheck.available) {
      console.warn('⚠️ localStorage not available - documents will not persist across sessions');
      return;
    }
    
    console.log(`📊 Current localStorage size: ${Math.round(getStorageSize() / 1024)}KB`);
    console.log('🔄 Loading documents from localStorage...');
    
    try {
      // Load client-side processed documents
      const savedDocuments = localStorage.getItem(STORAGE_KEYS.CLIENT_DOCUMENTS);
      if (savedDocuments) {
        const parsedDocuments = JSON.parse(savedDocuments);
        // Convert date strings back to Date objects
        const documentsWithDates = parsedDocuments.map((doc: any) => ({
          ...doc,
          metadata: {
            ...doc.metadata,
            uploadDate: new Date(doc.metadata.uploadDate),
            processedDate: new Date(doc.metadata.processedDate)
          }
        }));
        setDocuments(documentsWithDates);
        console.log(`📚 Loaded ${documentsWithDates.length} client-side documents from localStorage`);
      }
      
      // Load server-side processed documents
      const savedServerDocuments = localStorage.getItem(STORAGE_KEYS.SERVER_DOCUMENTS);
      if (savedServerDocuments) {
        const parsedServerDocuments = JSON.parse(savedServerDocuments);
        // Convert date strings back to Date objects
        const serverDocumentsWithDates = parsedServerDocuments.map((doc: any) => ({
          ...doc,
          metadata: {
            ...doc.metadata,
            uploadDate: new Date(doc.metadata.uploadDate),
            processedDate: new Date(doc.metadata.processedDate)
          }
        }));
        setServerProcessedDocuments(serverDocumentsWithDates);
        console.log(`🖥️ Loaded ${serverDocumentsWithDates.length} server-side documents from localStorage`);
      }
      
      const totalLoaded = (savedDocuments ? JSON.parse(savedDocuments).length : 0) + 
                         (savedServerDocuments ? JSON.parse(savedServerDocuments).length : 0);
      
      if (totalLoaded > 0) {
        console.log(`✅ Successfully loaded ${totalLoaded} total documents from localStorage`);
      } else {
        console.log('📝 No saved documents found in localStorage - starting fresh');
      }
      
    } catch (error) {
      console.error('❌ Error loading documents from localStorage:', error);
      // Reset to empty arrays if there's an error loading
      setDocuments([]);
      setServerProcessedDocuments([]);
      
      // Try to clear corrupted data
      try {
        localStorage.removeItem(STORAGE_KEYS.CLIENT_DOCUMENTS);
        localStorage.removeItem(STORAGE_KEYS.SERVER_DOCUMENTS);
        console.log('🧹 Cleared potentially corrupted localStorage data');
      } catch (clearError) {
        console.error('❌ Error clearing corrupted localStorage data:', clearError);
      }
    }
  }, []); // Empty dependency array - only run once on mount

  // Save client-side documents to localStorage whenever they change
  useEffect(() => {
    const storageCheck = checkStorageAvailability();
    if (!storageCheck.available) {
      return;
    }
    
    if (documents.length > 0) {
      try {
        const documentsJson = JSON.stringify(documents);
        const sizeKB = Math.round(documentsJson.length / 1024);
        
        localStorage.setItem(STORAGE_KEYS.CLIENT_DOCUMENTS, documentsJson);
        console.log(`💾 Saved ${documents.length} client-side documents to localStorage (${sizeKB}KB)`);
      } catch (error) {
        console.error('❌ Error saving client-side documents to localStorage:', error);
        // Handle localStorage quota exceeded or other errors
        if (error.name === 'QuotaExceededError') {
          console.warn('⚠️ localStorage quota exceeded - consider clearing old data or reducing document size');
          console.log(`📊 Current localStorage size: ${Math.round(getStorageSize() / 1024)}KB`);
        }
      }
    } else {
      // Clear localStorage if no documents
      localStorage.removeItem(STORAGE_KEYS.CLIENT_DOCUMENTS);
      console.log('🗑️ Cleared client-side documents from localStorage (no documents to save)');
    }
  }, [documents]);

  // Save server-side documents to localStorage whenever they change
  useEffect(() => {
    if (serverProcessedDocuments.length > 0) {
      try {
        localStorage.setItem('serverProcessedDocuments', JSON.stringify(serverProcessedDocuments));
        console.log(`💾 Saved ${serverProcessedDocuments.length} server-side documents to localStorage`);
      } catch (error) {
        console.error('❌ Error saving server-side documents to localStorage:', error);
        // Handle localStorage quota exceeded or other errors
        if (error.name === 'QuotaExceededError') {
          console.warn('⚠️ localStorage quota exceeded - consider clearing old data');
        }
      }
    } else {
      // Clear localStorage if no server documents
      localStorage.removeItem('serverProcessedDocuments');
      console.log('🗑️ Cleared server-side documents from localStorage (no documents to save)');
    }
  }, [serverProcessedDocuments]);

  const processDocument = async (file: File, surveyId: string, category: string = 'General Questions') => {
    if (!user) {
      throw new Error('User must be logged in to process documents');
    }

    console.log(`Processing document: ${file.name} for survey: ${surveyId}, category: ${category}`);
    
    try {
      // Try server-side processing first, fallback to client-side
      let processedDoc: ProcessedDocument;
      
      try {
        console.log('Attempting server-side document processing...');
        const serverProcessedDoc = await documentService.processDocument(file, surveyId);
        
        // Save document and chunks to database
        const savedDocument = await saveDocumentToDatabase(serverProcessedDoc, surveyId, category, user.id);
        
        if (!savedDocument) {
          throw new Error('Failed to save processed document to database');
        }
        
        // Create enhanced document for local state
        processedDoc = {
          id: savedDocument.id,
          fileName: savedDocument.file_name,
          surveyId: surveyId,
          category: category,
          content: savedDocument.content,
          chunks: serverProcessedDoc.chunks || [],
          images: serverProcessedDoc.images || [],
          metadata: {
            ...savedDocument.metadata,
            processingMethod: 'server-side'
          }
        };
        
        console.log('Server-side processing successful:', processedDoc.fileName);
      } catch (serverError) {
        console.warn('Server-side processing failed, falling back to client-side:', serverError);
        
        // Fallback to client-side processing
        processedDoc = await processDocumentClientSide(file, surveyId, category);
        
        // Save client-processed document to database
        try {
          const savedDocument = await saveDocumentToDatabase(processedDoc, surveyId, category, user.id);
          if (savedDocument) {
            processedDoc.id = savedDocument.id;
          }
        } catch (dbError) {
          console.warn('Failed to save client-processed document to database:', dbError);
          // Continue with local storage only
        }
        
        console.log('Client-side processing successful:', processedDoc.fileName);
      }
      
      // Add to local state
      setDocuments(prev => [...prev, processedDoc]);
      
      console.log('Document processed and saved successfully:', processedDoc.fileName);
    } catch (error) {
      console.error('Document processing failed:', error);
      throw error;
    }
  };

  const saveDocumentToDatabase = async (
    processedDoc: any, 
    surveyId: string, 
    category: string = 'General Questions',
    userId?: string,
    userId: string
  ) => {
    try {
      // Create document record
      const documentData = {
        id: processedDoc.id,
        file_name: processedDoc.fileName,
        survey_id: surveyId,
        category: category,
        content: processedDoc.content,
        file_type: processedDoc.metadata?.fileType || 'unknown',
        upload_date: new Date().toISOString(),
        processed_date: new Date().toISOString(),
        word_count: processedDoc.metadata?.wordCount || 0,
        character_count: processedDoc.metadata?.characterCount || 0,
        chunk_count: processedDoc.chunks?.length || 0,
        image_count: processedDoc.images?.length || 0,
        user_id: userId || null
        is_admin_generated: false,
        user_id: userId
      };
      
      console.log('Creating document in database:', documentData);
      const savedDocument = await databaseService.createDocument(documentData);
      
      if (!savedDocument) {
        throw new Error('Failed to create document record');
      }
      
      // Create document chunks
      if (processedDoc.chunks && processedDoc.chunks.length > 0) {
        const chunksData = processedDoc.chunks.map((chunk: any) => ({
          id: chunk.id,
          document_id: savedDocument.id,
          content: chunk.content,
          section: chunk.metadata?.section || 'Section',
          keywords: chunk.metadata?.keywords || [],
          entities: chunk.metadata?.entities || [],
          word_count: chunk.metadata?.wordCount || 0,
          character_count: chunk.metadata?.characterCount || 0,
          content_type: chunk.metadata?.contentType || 'general',
          importance: chunk.metadata?.importance || 1.0,
          is_admin_answer: false
        }));
        
        console.log(`Creating ${chunksData.length} document chunks`);
        await databaseService.createDocumentChunks(chunksData);
      }
      
      // Create document images if any
      if (processedDoc.images && processedDoc.images.length > 0) {
        const imagesData = processedDoc.images.map((image: any) => ({
          id: image.id,
          document_id: savedDocument.id,
          file_name: image.fileName,
          description: image.description,
          image_type: image.type || 'document',
          data_url: image.dataUrl
        }));
        
        console.log(`Creating ${imagesData.length} document images`);
        await databaseService.createDocumentImages(imagesData);
      }
      
      return savedDocument;
    } catch (error) {
      console.error('Error saving document to database:', error);
      throw error;
    }
  };

  const processDocumentClientSide = async (file: File, surveyId: string, category: string) => {
    try {
      let extractedText = '';
      let images: any[] = [];

      if (file.type === 'application/pdf') {
        extractedText = await extractPDFText(file);
        // Try to extract images from PDF
        try {
          images = await extractPDFImages(file);
          console.log(`Client-side extracted ${images.length} images from PDF`);
        } catch (imageError) {
          console.warn('Client-side PDF image extraction failed:', imageError);
        }
      } else if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        extractedText = await extractWordText(file);
        // Try to extract images from Word document
        try {
          images = await extractWordImages(file);
          console.log(`Client-side extracted ${images.length} images from Word document`);
        } catch (imageError) {
          console.warn('Client-side Word image extraction failed:', imageError);
        }
      } else if (file.type.includes('sheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        extractedText = await extractExcelText(file);
      } else if (file.type === 'text/plain') {
        extractedText = await file.text();
      } else {
        throw new Error(`Unsupported file type: ${file.type}`);
      }

      if (!extractedText || extractedText.length < 50) {
        throw new Error('Insufficient text content extracted from the document.');
      }

      const chunks = createChunks(extractedText, file.name);
      
      const processedDocument: ProcessedDocument = {
        id: Date.now().toString(),
        fileName: file.name,
        surveyId: surveyId,
        category: category,
        content: extractedText,
        chunks: chunks,
        images: images,
        metadata: {
          fileType: file.type,
          uploadDate: new Date(),
          processedDate: new Date(),
          wordCount: extractedText.split(/\s+/).filter(word => word.length > 0).length,
          characterCount: extractedText.length,
          chunkCount: chunks.length,
          imageCount: images.length,
          processingMethod: 'client-side',
          category: category
        }
      };

      setDocuments(prev => [...prev, processedDocument]);
      return processedDocument;
    } catch (error) {
      console.error('Client-side document processing failed:', error);
      throw error;
    }
  };

  const addDocument = (document: ProcessedDocument) => {
    setDocuments(prev => [...prev, document]);
  };

  const updateAdminKnowledgeDocument = (question: string, answer: string, surveyId: string = 'general', images: Array<{
    id: string;
    fileName: string;
    description: string;
    dataUrl: string;
    type: string;
  }> = []) => {
    if (!user) {
      console.error('User must be logged in to update admin knowledge');
      return;
    }

    console.log(`📝 Updating admin knowledge with question: "${question}" (will be persisted to localStorage)`);
    console.log(`🖼️ Received ${images.length} images for admin answer`);
    console.log(`📄 Admin answer contains HTML: ${answer.includes('<')}`);
    
    // Extract images from HTML content in the answer
    const extractedImages = extractImagesFromHTML(answer);
    const allImages = [...images, ...extractedImages];
    
    console.log(`🖼️ Extracted ${extractedImages.length} images from HTML`);
    console.log(`🖼️ Total images: ${allImages.length}`);
    
    const adminKnowledgeFileName = 'Admin Knowledge Base';
    
    setDocuments(prev => {
      // Find existing admin knowledge document
      const existingAdminDocIndex = prev.findIndex(doc => 
        doc.fileName === adminKnowledgeFileName && doc.metadata.isAdminGenerated
      );

      const newQAContent = `\n\nQ: ${question}\nA: ${answer}`;
      const newChunk: DocumentChunk = {
        id: `admin-chunk-${Date.now()}`,
        content: `Q: ${question}\nA: ${cleanHTMLForStorage(answer)}`,
        metadata: {
          section: 'Admin Q&A',
          keywords: extractKeywordsFromText(question + ' ' + answer),
          entities: extractEntitiesFromText(question + ' ' + answer),
          wordCount: (question + ' ' + answer).split(/\s+/).length,
          characterCount: (question + answer).length,
          contentType: 'qa',
          importance: 2.0,
          isAdminAnswer: true,
          originalQuestion: question,
          adminAnswer: answer, // Keep original HTML
          adminAnswerText: cleanHTMLForStorage(answer),
          adminAnswerRich: answer, // Store rich HTML version
          hasRichContent: answer.includes('<') && answer.includes('>'),
          dateAnswered: new Date().toISOString(),
          surveyId: surveyId,
          adminImages: allImages,
          hasImages: allImages.length > 0,
          feedbackScore: 0, // Initialize feedback score
          timesUsed: 0, // Initialize usage count
          correctFeedbackCount: 0, // Initialize correct feedback count
          incorrectFeedbackCount: 0, // Initialize incorrect feedback count
          lastUsed: new Date() // Set initial usage date
        }
      };

      if (existingAdminDocIndex !== -1) {
        // Update existing admin knowledge document
        const updatedDocuments = [...prev];
        const existingDoc = updatedDocuments[existingAdminDocIndex];
        
        updatedDocuments[existingAdminDocIndex] = {
          ...existingDoc,
          content: existingDoc.content + newQAContent,
          chunks: [...existingDoc.chunks, newChunk],
          images: [...existingDoc.images, ...allImages],
          metadata: {
            ...existingDoc.metadata,
            processedDate: new Date(),
            wordCount: existingDoc.metadata.wordCount + newChunk.metadata.wordCount,
            characterCount: existingDoc.metadata.characterCount + newChunk.metadata.characterCount,
            chunkCount: existingDoc.chunks.length + 1,
            imageCount: existingDoc.metadata.imageCount + allImages.length
          }
        };
        
        console.log(`📚 Updated existing admin knowledge document with new Q&A (will be saved to localStorage)`);
        
        // Save to database
        saveAdminKnowledgeToDatabase(question, answer, surveyId, allImages);
        
        return updatedDocuments;
      } else {
        // Create new admin knowledge document
        const newAdminDoc: ProcessedDocument = {
          id: `admin-knowledge-${Date.now()}`,
          fileName: adminKnowledgeFileName,
          surveyId: 'general',
          content: `Q: ${question}\nA: ${answer}`,
          chunks: [newChunk],
          images: allImages,
          metadata: {
            fileType: 'admin-qa',
            uploadDate: new Date(),
            processedDate: new Date(),
            wordCount: newChunk.metadata.wordCount,
            characterCount: newChunk.metadata.characterCount,
            chunkCount: 1,
            imageCount: allImages.length,
            processingMethod: 'admin-answer',
            isAdminGenerated: true
          }
        };
        
        console.log(`📚 Created new admin knowledge document (will be saved to localStorage)`);
        
        // Save to database
        saveAdminKnowledgeToDatabase(question, answer, surveyId, allImages);
        
        return [...prev, newAdminDoc];
      }
    });
    
    console.log(`✅ Admin knowledge updated and will be automatically persisted to localStorage`);
  };

  // Helper function to save admin knowledge to database
  const saveAdminKnowledgeToDatabase = async (question: string, answer: string, surveyId: string, images: any[]) => {
    try {
      await databaseService.createAdminKnowledge({
        original_question: question,
        admin_answer: cleanHTMLForStorage(answer),
        admin_answer_rich: answer,
        survey_id: surveyId === 'general' ? null : surveyId,
        images: images,
        created_by: user?.id,
        feedback_score: 0,
        times_used: 0
      });
      console.log('Admin knowledge saved to database successfully');
    } catch (dbError) {
      console.error('Failed to save admin knowledge to database:', dbError);
      // Continue with local storage as fallback
    }
  };

  const updateChunkFeedback = (chunkId: string, feedbackType: 'correct' | 'incorrect') => {
    setDocuments(prev => prev.map(doc => ({
      ...doc,
      chunks: doc.chunks.map(chunk => {
        if (chunk.id === chunkId) {
          const feedbackDelta = feedbackType === 'correct' ? 1 : -1;
          const correctCount = chunk.metadata.correctFeedbackCount || 0;
          const incorrectCount = chunk.metadata.incorrectFeedbackCount || 0;
          const timesUsed = chunk.metadata.timesUsed || 0;
          
          return {
            ...chunk,
            metadata: {
              ...chunk.metadata,
              feedbackScore: (chunk.metadata.feedbackScore || 0) + feedbackDelta,
              correctFeedbackCount: feedbackType === 'correct' ? correctCount + 1 : correctCount,
              incorrectFeedbackCount: feedbackType === 'incorrect' ? incorrectCount + 1 : incorrectCount,
              timesUsed: timesUsed + 1,
              lastUsed: new Date()
            }
          };
        }
        return chunk;
      })
    })));
  };

  const deleteDocument = (documentId: string) => {
    // Delete from database first
    databaseService.deleteDocument(documentId).then(() => {
      console.log('Document deleted from database:', documentId);
    }).catch(error => {
      console.error('Error deleting document from database:', error);
    });
    
    // Remove from local state
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const searchDocuments = (query: string, surveyId?: string, category?: string): DocumentChunk[] => {
    // Use local search for immediate results (database search is async)
    return searchDocumentsLocally(query, surveyId, category);
  };
  
  const searchDocumentsInDatabase = async (query: string, surveyId?: string, category?: string): Promise<any[]> => {
    try {
      // Search document chunks in database
      const chunks = await databaseService.searchDocumentChunks(query, surveyId, category);
      
      // Transform database chunks to expected format
      return chunks.map(chunk => ({
        id: chunk.id,
        content: chunk.content,
        metadata: {
          ...chunk.metadata,
          fileName: chunk.documents?.file_name || 'Unknown',
          category: chunk.documents?.category || 'General Questions',
          section: chunk.section || 'Section',
          keywords: chunk.keywords || [],
          entities: chunk.entities || [],
          wordCount: chunk.word_count || 0,
          characterCount: chunk.character_count || 0,
          contentType: chunk.content_type || 'general',
          importance: chunk.importance || 1.0,
          isAdminAnswer: chunk.is_admin_answer || false
        }
      }));
    } catch (error) {
      console.error('Error searching documents in database:', error);
      // Fallback to local search if database search fails
      return searchDocumentsLocally(query, surveyId, category);
    }
  };
  
  const searchDocumentsLocally = (query: string, surveyId?: string, category?: string): any[] => {
    // Fallback local search implementation
    let filteredDocs = documents.filter(doc => {
      const matchesSurvey = !surveyId || doc.surveyId === surveyId;
      const matchesCategory = !category || doc.category === category;
      return matchesSurvey && matchesCategory;
    });

    if (!query.trim()) {
      return filteredDocs.flatMap(doc => doc.chunks || []);
    }

    const queryLower = query.toLowerCase();
    const allChunks: any[] = [];

    filteredDocs.forEach(doc => {
      if (doc.chunks) {
        doc.chunks.forEach(chunk => {
          const score = calculateRelevanceScore(chunk, queryLower);
          if (score > 0) {
            allChunks.push({
              ...chunk,
              relevanceScore: score,
              metadata: {
                ...chunk.metadata,
                fileName: doc.fileName,
                category: doc.category
              }
            });
          }
        });
      }
    });

    return allChunks.sort((a, b) => b.relevanceScore - a.relevanceScore);
  };

  const searchImages = (query: string, surveyId?: string, category?: string) => {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
    
    const relevantDocuments = surveyId 
      ? documents.filter(doc => {
          const matchesSurvey = doc.surveyId === surveyId;
          const matchesCategory = !category || doc.category === category;
          return matchesSurvey && matchesCategory;
        })
      : documents;
    
    const allImages = relevantDocuments.flatMap(doc => doc.images);
    
    // Score images by relevance
    const scoredImages = allImages.map(image => {
      const searchText = `${image.fileName} ${image.description} ${image.type}`.toLowerCase();
      let score = 0;
      
      // Exact phrase match
      if (searchText.includes(queryLower)) {
        score += 100;
      }
      
      // Individual word matches
      queryWords.forEach(word => {
        if (searchText.includes(word)) {
          score += 20;
        }
      });
      
      // Content type relevance
      if (queryLower.includes('form') && image.type === 'form') score += 50;
      if (queryLower.includes('chart') && image.type === 'chart') score += 50;
      if (queryLower.includes('diagram') && image.type === 'diagram') score += 50;
      if (queryLower.includes('flow') && image.type === 'flowchart') score += 50;
      if (queryLower.includes('process') && (image.type === 'flowchart' || image.type === 'diagram')) score += 40;
      if (queryLower.includes('screen') && image.type === 'screenshot') score += 50;
      
      // General visual query terms
      const visualTerms = ['show', 'display', 'see', 'view', 'image', 'picture', 'visual'];
      if (visualTerms.some(term => queryLower.includes(term))) {
        score += 10;
      }
      
      return { image, score };
    }).filter(item => item.score > 0);
    
    // Return top 5 most relevant images
    return scoredImages
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.image);
  };

  const getDocumentsBySurvey = (surveyId: string, category?: string): ProcessedDocument[] => {
    // Return documents from local state (synchronous)
    return documents.filter(doc => {
      const matchesSurvey = doc.surveyId === surveyId;
      const matchesCategory = !category || doc.category === category;
      return matchesSurvey && matchesCategory;
    });
  };
  
  const loadDocumentsFromDatabase = async (surveyId: string, category?: string): Promise<ProcessedDocument[]> => {
    try {
      const dbDocuments = await databaseService.getDocumentsBySurvey(surveyId, category);
      
      // Transform database documents to ProcessedDocument format
      const processedDocs: ProcessedDocument[] = [];
      
      for (const dbDoc of dbDocuments) {
        // Get chunks for this document
        const chunks = await databaseService.getDocumentChunks(dbDoc.id);
        
        // Get images for this document
        const images = await databaseService.getDocumentImages(dbDoc.id);
        
        const processedDoc: ProcessedDocument = {
          id: dbDoc.id,
          fileName: dbDoc.file_name,
          surveyId: dbDoc.survey_id || surveyId,
          category: dbDoc.category || 'General Questions',
          content: dbDoc.content,
          chunks: chunks.map(chunk => ({
            id: chunk.id,
            content: chunk.content,
            metadata: {
              section: chunk.section || 'Section',
              keywords: chunk.keywords || [],
              entities: chunk.entities || [],
              wordCount: chunk.word_count || 0,
              characterCount: chunk.character_count || 0,
              contentType: chunk.content_type || 'general',
              importance: chunk.importance || 1.0,
              isAdminAnswer: chunk.is_admin_answer || false
            }
          })),
          images: images.map(image => ({
            id: image.id,
            fileName: image.file_name,
            description: image.description || '',
            dataUrl: image.data_url,
            type: image.image_type || 'document'
          })),
          metadata: dbDoc.metadata || {}
        };
        
        processedDocs.push(processedDoc);
      }
      
      return processedDocs;
    } catch (error) {
      console.error('Error loading documents from database:', error);
      // Fallback to local documents
      return documents.filter(doc => {
        const matchesSurvey = doc.surveyId === surveyId;
        const matchesCategory = !category || doc.category === category;
        return matchesSurvey && matchesCategory;
      });
    }
  };

  // Helper functions
  const calculateEnhancedChunkRelevance = (chunk: DocumentChunk, queryWords: string[], fullQuery: string, allDocuments: ProcessedDocument[], selectedCategory?: string): number => {
    let score = 0;
    const chunkText = chunk.content.toLowerCase();
    
    // Find the source document to determine processing method
    const sourceDoc = allDocuments.find(doc => doc.chunks.includes(chunk));
    const isServerProcessed = sourceDoc?.metadata.processingMethod?.includes('server');
    const chunkCategory = chunk.metadata.category || chunk.category || sourceDoc?.category || 'General Questions';
    
    // Category-based scoring
    if (selectedCategory) {
      if (chunkCategory === selectedCategory) {
        score += 100; // Strong bonus for same category
        console.log(`📂 Same category bonus: ${chunkCategory} (+100)`);
      } else {
        score += 20; // Small bonus for other categories (still searchable)
        console.log(`📂 Other category: ${chunkCategory} (+20)`);
      }
    }
    
    // Admin answer relevance scoring (reduced priority)
    if (chunk.metadata.isAdminAnswer) {
      let adminRelevanceScore = 0;
      
      // Check if query matches the original question
      if (chunk.metadata.originalQuestion) {
        const originalQ = chunk.metadata.originalQuestion.toLowerCase();
        
        // Exact phrase matching in original question (highest priority)
        if (originalQ.includes(fullQuery)) {
          adminRelevanceScore += 150; // Reduced from 300
        }
        
        // Enhanced semantic similarity calculation
        const originalWords = originalQ.split(/\s+/).filter(word => word.length > 2);
        const commonWords = queryWords.filter(word => originalWords.includes(word));
        const semanticSimilarity = commonWords.length / Math.max(queryWords.length, originalWords.length);
        
        // Question type similarity
        const queryType = getQuestionType(fullQuery);
        const originalType = getQuestionType(originalQ);
        const typeMatch = queryType === originalType && queryType !== 'general';
        
        // Combined scoring based on semantic similarity and type matching
        if (semanticSimilarity > 0.7) {
          adminRelevanceScore += typeMatch ? 125 : 100; // Reduced
        } else if (semanticSimilarity > 0.5) {
          adminRelevanceScore += typeMatch ? 90 : 75; // Reduced
        } else if (semanticSimilarity > 0.3) {
          adminRelevanceScore += typeMatch ? 60 : 50; // Reduced
        } else if (semanticSimilarity > 0.1) {
          adminRelevanceScore += typeMatch ? 40 : 25; // Reduced
        }
        
        // Individual word matches in original question with position weighting
        queryWords.forEach(word => {
          if (originalQ.includes(word)) {
            // Higher score for words at the beginning of the question
            const wordIndex = originalQ.indexOf(word);
            const positionBonus = wordIndex < originalQ.length * 0.3 ? 10 : 0;
            adminRelevanceScore += 20 + positionBonus; // Reduced
          }
        });
      }
      
      // Enhanced answer content relevance
      if (chunk.metadata.adminAnswer) {
        const adminAnswer = chunk.metadata.adminAnswer.toLowerCase();
        
        // Exact phrase in answer
        if (adminAnswer.includes(fullQuery)) {
          adminRelevanceScore += 75; // Reduced
        }
        
        // Multi-word phrases in answer
        if (queryWords.length > 1) {
          for (let i = 0; i < queryWords.length - 1; i++) {
            const phrase = queryWords.slice(i, i + 2).join(' ');
            if (adminAnswer.includes(phrase)) {
              adminRelevanceScore += 30; // Reduced
            }
          }
        }
        
        // Individual words in answer
        queryWords.forEach(word => {
          if (adminAnswer.includes(word)) {
            adminRelevanceScore += 15; // Reduced
          }
        });
        
        // Answer quality indicators
        if (adminAnswer.length > 50 && adminAnswer.length < 500) {
          adminRelevanceScore += 10; // Reduced bonus
        }
      }
      
      // Apply admin score with threshold
      if (adminRelevanceScore > 15) {
        score += adminRelevanceScore;
        console.log(`Admin answer score for "${chunk.metadata.originalQuestion}": ${adminRelevanceScore}`);
      }
    }
    
    // Strong bonus for server-processed content (better extraction quality)
    if (isServerProcessed && !chunk.metadata.isAdminAnswer) {
      score += 100; // Strong boost for server-processed content
      console.log(`Server-processed content bonus applied: +100`);
    }
    
    // Exact phrase matching
    if (chunkText.includes(fullQuery)) {
      score += isServerProcessed ? 150 : 100; // Higher for server content
    }
    
    // Multi-word phrase matching
    if (queryWords.length > 1) {
      for (let i = 0; i < queryWords.length - 1; i++) {
        const phrase = queryWords.slice(i, i + 2).join(' ');
        if (chunkText.includes(phrase)) {
          score += isServerProcessed ? 75 : 50; // Higher for server content
        }
      }
    }
    
    // Individual word matches
    queryWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = (chunkText.match(regex) || []).length;
      score += matches * (isServerProcessed ? 15 : 10); // Higher for server content
    });
    
    // Keyword matching
    if (chunk.metadata.keywords) {
      chunk.metadata.keywords.forEach(keyword => {
        if (queryWords.some(word => keyword.includes(word) || word.includes(keyword))) {
          score += isServerProcessed ? 30 : 20; // Higher for server content
        }
      });
    }
    
    // Content type and importance bonuses
    const queryType = getQuestionType(fullQuery);
    if (chunk.metadata.contentType === queryType) {
      score += isServerProcessed ? 45 : 30; // Higher for server content
    }
    
    if (chunk.metadata.importance && chunk.metadata.importance > 1.0) {
      score *= chunk.metadata.importance;
    }
    
    console.log(`Chunk relevance score: ${score} (server: ${isServerProcessed}, admin: ${chunk.metadata.isAdminAnswer})`);
    return score;
  };

  // Helper function to determine question type
  const getQuestionType = (question: string): string => {
    const q = question.toLowerCase();
    if (q.includes('what is') || q.includes('what are') || q.includes('define') || q.includes('meaning')) {
      return 'definition';
    } else if (q.includes('how to') || q.includes('how do') || q.includes('how can') || q.includes('procedure')) {
      return 'procedure';
    } else if (q.includes('when') || q.includes('what time') || q.includes('timing')) {
      return 'timing';
    } else if (q.includes('where') || q.includes('which location') || q.includes('location')) {
      return 'location';
    } else if (q.includes('why') || q.includes('what reason') || q.includes('reason')) {
      return 'explanation';
    } else if (q.includes('who') || q.includes('which person') || q.includes('responsible')) {
      return 'person';
    } else if (q.includes('can i') || q.includes('should i') || q.includes('may i')) {
      return 'permission';
    } else if (q.includes('list') || q.includes('types') || q.includes('categories')) {
      return 'list';
    }
    return 'general';
  };

  const extractKeywordsFromText = (text: string): string[] => {
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    ]);

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word));

    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .map(([word]) => word);
  };

  const extractEntitiesFromText = (text: string): string[] => {
    const entities = [];
    
    const numbers = text.match(/\b\d+(?:\.\d+)?\b/g) || [];
    entities.push(...numbers.slice(0, 5));
    
    const capitalizedTerms = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    entities.push(...capitalizedTerms.slice(0, 10));
    
    const acronyms = text.match(/\b[A-Z]{2,}\b/g) || [];
    entities.push(...acronyms);
    
    return [...new Set(entities)].slice(0, 15);
  };

  const createChunks = (content: string, fileName: string): DocumentChunk[] => {
    const maxChunkSize = 800;
    const chunks: DocumentChunk[] = [];
    
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 50);
    
    let currentChunk = '';
    let chunkIndex = 0;

    paragraphs.forEach(paragraph => {
      const trimmedParagraph = paragraph.trim();
      
      if (currentChunk.length + trimmedParagraph.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(createChunk(currentChunk, fileName, chunkIndex));
        currentChunk = trimmedParagraph;
        chunkIndex++;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + trimmedParagraph;
      }
    });

    if (currentChunk.trim()) {
      chunks.push(createChunk(currentChunk, fileName, chunkIndex));
    }

    return chunks.length > 0 ? chunks : [createChunk(content.substring(0, maxChunkSize), fileName, 0)];
  };

  const createChunk = (content: string, fileName: string, index: number): DocumentChunk => {
    const keywords = extractKeywordsFromText(content);
    const entities = extractEntitiesFromText(content);
    
    return {
      id: `${fileName}-chunk-${index}-${Date.now()}`,
      content: content.trim(),
      metadata: {
        section: `Section ${index}`,
        keywords: keywords,
        entities: entities,
        wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
        characterCount: content.length,
      }
    };
  };

  // Client-side text extraction functions
  const extractPDFText = async (file: File): Promise<string> => {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        text += pageText + '\n';
      }
      
      return text.trim();
    } catch (error) {
      console.error('PDF extraction failed:', error);
      throw new Error('Failed to extract text from PDF. The file may be corrupted or password-protected.');
    }
  };

  const extractWordText = async (file: File): Promise<string> => {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value.trim();
    } catch (error) {
      console.error('Word extraction failed:', error);
      throw new Error('Failed to extract text from Word document.');
    }
  };

  const extractExcelText = async (file: File): Promise<string> => {
    try {
      const XLSX = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      let text = '';
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_txt(worksheet);
        text += `Sheet: ${sheetName}\n${sheetData}\n\n`;
      });
      
      return text.trim();
    } catch (error) {
      console.error('Excel extraction failed:', error);
      throw new Error('Failed to extract text from Excel file.');
    }
  };

  // Client-side image extraction functions
  const extractPDFImages = async (file: File): Promise<any[]> => {
    try {
      console.log('Attempting comprehensive client-side PDF image extraction...');
      
      const images = [];
      
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // Extract images from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.5 });
          
          // Create canvas for page rendering
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          if (context) {
            // Render page to canvas
            await page.render({
              canvasContext: context,
              viewport: viewport
            }).promise;
            
            // Convert to image
            const dataUrl = canvas.toDataURL('image/png');
            
            images.push({
              id: `pdf-page-${pageNum}-${Date.now()}`,
              fileName: `${file.name} - Page ${pageNum}`,
              description: `Page ${pageNum} from ${file.name} showing document content, forms, diagrams, and visual elements`,
              dataUrl: dataUrl,
              type: classifyPageContent(pageNum, file.name)
            });
            
            console.log(`Extracted page ${pageNum} as image from PDF`);
          }
        } catch (pageError) {
          console.warn(`Failed to extract page ${pageNum}:`, pageError);
        }
      }
      
      console.log(`Successfully extracted ${images.length} page images from PDF`);
      return images;
    } catch (error) {
      console.error('Client-side PDF image extraction failed:', error);
      // Fallback to document preview
      const previewImage = await createDocumentPreview(file, 'PDF Document');
      return previewImage ? [previewImage] : [];
    }
  };

  const extractWordImages = async (file: File): Promise<any[]> => {
    try {
      console.log('Attempting comprehensive client-side Word image extraction...');
      
      const images = [];
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      
      try {
        // Extract images from Word document
        const result = await mammoth.convertToHtml({ 
          arrayBuffer,
          convertImage: mammoth.images.imgElement(function(image) {
            return image.read("base64").then(function(imageBuffer) {
              const dataUrl = `data:${image.contentType};base64,${imageBuffer}`;
              
              images.push({
                id: `word-img-${Date.now()}-${Math.random()}`,
                fileName: `${file.name} - Embedded Image ${images.length + 1}`,
                description: `Embedded image from ${file.name} showing diagrams, forms, charts, or visual content`,
                dataUrl: dataUrl,
                type: classifyImageContent(image.contentType, file.name)
              });
              
              return {
                src: dataUrl
              };
            });
          })
        });
        
        console.log(`Extracted ${images.length} embedded images from Word document`);
        
        // Also create document preview pages if no embedded images found
        if (images.length === 0) {
          const previewImage = await createDocumentPreview(file, 'Word Document');
          if (previewImage) {
            images.push(previewImage);
          }
        }
        
      } catch (mammothError) {
        console.warn('Mammoth image extraction failed, using preview:', mammothError);
        const previewImage = await createDocumentPreview(file, 'Word Document');
        if (previewImage) {
          images.push(previewImage);
        }
      }
      
      return images;
    } catch (error) {
      console.error('Client-side Word image extraction failed:', error);
      // Fallback to document preview
      const previewImage = await createDocumentPreview(file, 'Word Document');
      return previewImage ? [previewImage] : [];
    }
  };

  const createDocumentPreview = async (file: File, documentType: string): Promise<any> => {
    try {
      // Create a simple document preview representation
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return null;
      
      // Set canvas size
      canvas.width = 800;
      canvas.height = 600;
      
      // Create a simple document preview
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add border
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      
      // Add document icon and text
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(documentType, canvas.width / 2, 50);
      
      ctx.font = '18px Arial';
      ctx.fillText(file.name, canvas.width / 2, 80);
      
      // Add document representation
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(50, 120, canvas.width - 100, 400);
      
      // Add some lines to represent text
      ctx.fillStyle = '#9ca3af';
      for (let i = 0; i < 15; i++) {
        const y = 150 + (i * 25);
        const width = Math.random() * 300 + 200;
        ctx.fillRect(80, y, width, 3);
      }
      
      // Add file info
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`File Size: ${formatFileSize(file.size)}`, 50, 550);
      ctx.fillText(`Type: ${file.type}`, 50, 570);
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png');
      
      return {
        id: `preview-${Date.now()}`,
        fileName: `${file.name} - Preview`,
        description: `Document preview for ${file.name}`,
        dataUrl: dataUrl,
        type: 'preview'
      };
      
    } catch (error) {
      console.error('Error creating document preview:', error);
      return null;
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const classifyDocumentType = (filename: string): string => {
    const lowerName = filename.toLowerCase();
    
    if (lowerName.includes('form') || lowerName.includes('questionnaire')) {
      return 'form';
    } else if (lowerName.includes('flow') || lowerName.includes('process')) {
      return 'flowchart';
    } else if (lowerName.includes('chart') || lowerName.includes('graph')) {
      return 'chart';
    } else if (lowerName.includes('diagram')) {
      return 'diagram';
    } else if (lowerName.includes('screen') || lowerName.includes('interface')) {
      return 'screenshot';
    }
    
    return 'document';
  };

  const classifyPageContent = (pageNum: number, filename: string): string => {
    const lowerName = filename.toLowerCase();
    
    if (lowerName.includes('form') || lowerName.includes('questionnaire')) {
      return 'form';
    } else if (lowerName.includes('manual') || lowerName.includes('guide')) {
      return pageNum === 1 ? 'cover' : 'procedure';
    } else if (lowerName.includes('flow') || lowerName.includes('process')) {
      return 'flowchart';
    } else if (lowerName.includes('chart') || lowerName.includes('graph')) {
      return 'chart';
    } else if (lowerName.includes('screen') || lowerName.includes('interface')) {
      return 'screenshot';
    }
    
    return pageNum === 1 ? 'cover' : 'document';
  };

  const classifyImageContent = (contentType: string, filename: string): string => {
    const lowerName = filename.toLowerCase();
    
    if (lowerName.includes('form') || lowerName.includes('questionnaire')) {
      return 'form';
    } else if (lowerName.includes('flow') || lowerName.includes('process')) {
      return 'flowchart';
    } else if (lowerName.includes('chart') || lowerName.includes('graph')) {
      return 'chart';
    } else if (lowerName.includes('diagram')) {
      return 'diagram';
    } else if (contentType && contentType.includes('png')) {
      return 'screenshot';
    }
    
    return 'embedded';
  };

  // Helper function to extract images from HTML content
  const extractImagesFromHTML = (htmlContent: string): Array<{
    id: string;
    fileName: string;
    description: string;
    dataUrl: string;
    type: string;
  }> => {
    const images: any[] = [];
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*(?:alt="([^"]*)")?[^>]*>/g;
    let match;
    
    while ((match = imgRegex.exec(htmlContent)) !== null) {
      images.push({
        id: `extracted-${Date.now()}-${Math.random()}`,
        fileName: match[2] || 'Admin Response Image',
        description: match[2] || 'Image from admin response',
        dataUrl: match[1],
        type: 'admin-embedded'
      });
    }
    
    return images;
  };

  // Helper function to clean HTML for storage while preserving essential content
  const cleanHTMLForStorage = (htmlContent: string): string => {
    // Convert HTML to readable text while preserving structure
    return htmlContent
      .replace(/<img[^>]+src="([^"]+)"[^>]*(?:alt="([^"]*)")?[^>]*>/g, '[IMAGE: $2]')
      .replace(/<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/g, '$2 ($1)')
      .replace(/<p[^>]*>/g, '\n')
      .replace(/<\/p>/g, '\n')
      .replace(/<br[^>]*>/g, '\n')
      .replace(/<b[^>]*>([^<]+)<\/b>/g, '**$1**')
      .replace(/<strong[^>]*>([^<]+)<\/strong>/g, '**$1**')
      .replace(/<i[^>]*>([^<]+)<\/i>/g, '*$1*')
      .replace(/<em[^>]*>([^<]+)<\/em>/g, '*$1*')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  };
  
  return (
    <DocumentContext.Provider value={{
      documents,
      processDocument,
      addDocument,
      updateAdminKnowledgeDocument,
      updateChunkFeedback,
      deleteDocument,
      searchDocuments,
      searchImages,
      getDocumentsBySurvey,
    }}>
      {children}
    </DocumentContext.Provider>
  );
}
