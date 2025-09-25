import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DocumentService } from '../services/DocumentService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';
import mammoth from 'mammoth';

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
  processDocument: (file: File, surveyId: string) => Promise<void>;
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
    loadDocuments();
  }, [user?.id]);

  const loadDocuments = async () => {
    if (!user) return;

    if (isSupabaseConfigured()) {
      try {
        console.log('🔄 Loading documents from Supabase...');
        const { data: documentsData, error: docsError } = await supabase!
          .from('documents')
          .select('*')
          .eq('user_id', user.id);

        if (docsError) {
          console.error('❌ Error loading documents from Supabase:', docsError);
          loadDocumentsFromLocalStorage();
          return;
        }

        // Load chunks
        const { data: chunksData, error: chunksError } = await supabase!
          .from('document_chunks')
          .select('*')
          .in('document_id', documentsData?.map(d => d.id) || []);

        if (chunksError) {
          console.error('❌ Error loading document chunks from Supabase:', chunksError);
        }

        // Load images
        const { data: imagesData, error: imagesError } = await supabase!
          .from('document_images')
          .select('*')
          .in('document_id', documentsData?.map(d => d.id) || []);

        if (imagesError) {
          console.error('❌ Error loading document images from Supabase:', imagesError);
        }

        if (documentsData) {
          const docs = documentsData.map(d => {
            const docChunks = chunksData?.filter(c => c.document_id === d.id) || [];
            const docImages = imagesData?.filter(i => i.document_id === d.id) || [];
            
            return {
              id: d.id,
              fileName: d.file_name,
              surveyId: d.survey_id,
              category: d.category,
              content: d.content,
              chunks: docChunks.map(chunk => ({
                id: chunk.id,
                content: chunk.content,
                metadata: {
                  section: chunk.section,
                  keywords: chunk.keywords,
                  entities: chunk.entities,
                  wordCount: chunk.word_count,
                  characterCount: chunk.character_count,
                  contentType: chunk.content_type,
                  importance: chunk.importance,
                  isAdminAnswer: chunk.is_admin_answer,
                  originalQuestion: chunk.original_question,
                  adminAnswer: chunk.admin_answer,
                  adminAnswerRich: chunk.admin_answer_rich,
                  feedbackScore: chunk.feedback_score,
                  timesUsed: chunk.times_used,
                  correctFeedbackCount: chunk.correct_feedback_count,
                  incorrectFeedbackCount: chunk.incorrect_feedback_count,
                  lastUsed: chunk.last_used ? new Date(chunk.last_used) : null,
                  dateAnswered: chunk.date_answered ? new Date(chunk.date_answered) : null
                }
              })),
              images: docImages.map(image => ({
                id: image.id,
                fileName: image.file_name,
                description: image.description,
                type: image.image_type,
                dataUrl: image.data_url
              })),
              metadata: {
                fileType: d.file_type,
                uploadDate: new Date(d.upload_date),
                processedDate: new Date(d.processed_date),
                wordCount: d.word_count,
                characterCount: d.character_count,
                chunkCount: d.chunk_count,
                imageCount: d.image_count,
                processingMethod: d.processing_method,
                isAdminGenerated: d.is_admin_generated
              }
            };
          });
          setDocuments(docs);
          console.log(`📚 Loaded ${docs.length} documents from Supabase`);
        }
      } catch (error) {
        console.error('❌ Supabase connection error:', error);
        loadDocumentsFromLocalStorage();
      }
    } else {
      loadDocumentsFromLocalStorage();
    }
  };

  const loadDocumentsFromLocalStorage = () => {
    if (!user) return;
    
    const savedDocs = localStorage.getItem(`documents_${user.id}`);
    if (savedDocs) {
      try {
        const docs = JSON.parse(savedDocs).map((doc: any) => ({
          ...doc,
          metadata: {
            ...doc.metadata,
            uploadDate: new Date(doc.metadata.uploadDate),
            processedDate: new Date(doc.metadata.processedDate)
          }
        }));
        setDocuments(docs);
      } catch (error) {
        console.error('Error loading documents:', error);
      }
    }
  };

  // Save client-side documents to localStorage whenever they change
  useEffect(() => {
    if (isSupabaseConfigured() && user) {
      saveDocumentsToSupabase();
    } else {
      saveDocumentsToLocalStorage();
    }
  }, [documents, user?.id]);

  const saveDocumentsToSupabase = async () => {
    if (!user || documents.length === 0 || user.isMockUser) return;

    try {
      const documentsToSave = documents.map(doc => ({
        id: doc.id,
        file_name: doc.fileName,
        survey_id: doc.surveyId,
        category: doc.category,
        content: doc.content,
        file_type: doc.metadata.fileType,
        upload_date: doc.metadata.uploadDate.toISOString(),
        processed_date: doc.metadata.processedDate.toISOString(),
        word_count: doc.metadata.wordCount,
        character_count: doc.metadata.characterCount,
        chunk_count: doc.metadata.chunkCount,
        image_count: doc.metadata.imageCount,
        processing_method: doc.metadata.processingMethod,
        is_admin_generated: doc.metadata.isAdminGenerated || false,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase!
        .from('documents')
        .upsert(documentsToSave, { onConflict: 'id' });

      if (error) {
        console.error('❌ Error saving documents to Supabase:', error);
        return;
      }

      // Save chunks separately
      const chunksToSave = documents.flatMap(doc => 
        doc.chunks.map(chunk => ({
          id: chunk.id,
          document_id: doc.id,
          content: chunk.content,
          section: chunk.metadata.section,
          keywords: chunk.metadata.keywords,
          entities: chunk.metadata.entities,
          word_count: chunk.metadata.wordCount,
          character_count: chunk.metadata.characterCount,
          content_type: chunk.metadata.contentType,
          importance: chunk.metadata.importance,
          is_admin_answer: chunk.metadata.isAdminAnswer || false,
          original_question: chunk.metadata.originalQuestion,
          admin_answer: chunk.metadata.adminAnswer,
          admin_answer_rich: chunk.metadata.adminAnswerRich,
          feedback_score: chunk.metadata.feedbackScore || 0,
          times_used: chunk.metadata.timesUsed || 0,
          correct_feedback_count: chunk.metadata.correctFeedbackCount || 0,
          incorrect_feedback_count: chunk.metadata.incorrectFeedbackCount || 0,
          last_used: chunk.metadata.lastUsed ? new Date(chunk.metadata.lastUsed).toISOString() : null,
          date_answered: chunk.metadata.dateAnswered ? new Date(chunk.metadata.dateAnswered).toISOString() : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
      );

      if (chunksToSave.length > 0) {
        const { error: chunksError } = await supabase!
          .from('document_chunks')
          .upsert(chunksToSave, { onConflict: 'id' });

        if (chunksError) {
          console.error('❌ Error saving document chunks to Supabase:', chunksError);
        }
      }

      // Save images separately
      const imagesToSave = documents.flatMap(doc => 
        doc.images.map(image => ({
          id: image.id,
          document_id: doc.id,
          chunk_id: null, // Will be updated if image belongs to specific chunk
          file_name: image.fileName,
          description: image.description,
          image_type: image.type,
          data_url: image.dataUrl,
          created_at: new Date().toISOString()
        }))
      );

      if (imagesToSave.length > 0) {
        const { error: imagesError } = await supabase!
          .from('document_images')
          .upsert(imagesToSave, { onConflict: 'id' });

        if (imagesError) {
          console.error('❌ Error saving document images to Supabase:', imagesError);
        }
      }

      console.log('✅ Documents saved to Supabase successfully');
    } catch (error) {
      console.error('❌ Supabase documents save error:', error);
      // Fallback to localStorage
      localStorage.setItem(`documents_${user.id}`, JSON.stringify(documents));
    }
  };

  const saveDocumentsToLocalStorage = () => {
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
  };

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
    // Hybrid approach: Client-side for SLM learning + Server-side for enhanced context
    console.log('Processing document with hybrid approach: client-side for SLM + server-side for enhanced context');
    
    // Always process client-side for SLM learning
    const clientDoc = await processDocumentClientSide(file, surveyId, category);
    
    // Also try server-side processing for enhanced context (non-blocking)
    try {
      // Check if server is available first
      const isServerHealthy = await documentService.checkServerHealth();
      if (isServerHealthy) {
        const serverResult = await documentService.processDocument(file, surveyId);
        if (serverResult) {
          console.log('Server-side processing successful - enhanced context available');
          
          // Add category to server result
          serverResult.category = category;
          
          // Merge server results with client results, prioritizing server images
          if (serverResult.images && serverResult.images.length > 0) {
            console.log(`Server extracted ${serverResult.images.length} images`);
            // Update the client document with server images
            setDocuments(prev => prev.map(doc => 
              doc.fileName === clientDoc.fileName && doc.surveyId === clientDoc.surveyId
                ? { ...doc, images: serverResult.images, metadata: { ...doc.metadata, imageCount: serverResult.images.length } }
                : doc
            ));
          }
          
          setServerProcessedDocuments(prev => [...prev, serverResult]);
        }
      } else {
        console.log('Server not available, using client-side processing only');
      }
    } catch (error) {
      console.log('Server-side processing failed, using client-side only:', error?.message || 'Unknown error');
      // Silently continue with client-side processing - this is expected behavior
    }
    
    return clientDoc;
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
        id: uuidv4(),
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
    updateAdminKnowledgeInSupabase(question, answer, surveyId, images);
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
        id: uuidv4(),
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
        return updatedDocuments;
      } else {
        // Create new admin knowledge document
        const newAdminDoc: ProcessedDocument = {
          id: uuidv4(),
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
        return [...prev, newAdminDoc];
      }
    });
    
    console.log(`✅ Admin knowledge updated and will be automatically persisted to localStorage`);
  };

  const updateAdminKnowledgeInSupabase = async (question: string, answer: string, surveyId: string, images: any[]) => {
    if (!isSupabaseConfigured() || !user) return;

    try {
      const { error } = await supabase!
        .from('admin_knowledge')
        .insert({
          original_question: question,
          admin_answer: answer,
          admin_answer_rich: answer,
          survey_id: surveyId,
          images: JSON.stringify(images),
          created_by: user.id
        });

      if (error) {
        console.error('❌ Error saving admin knowledge to Supabase:', error);
      } else {
        console.log('✅ Admin knowledge saved to Supabase');
      }
    } catch (error) {
      console.error('❌ Supabase admin knowledge save error:', error);
    }
  };

  const updateChunkFeedback = (chunkId: string, feedbackType: 'correct' | 'incorrect') => {
    updateChunkFeedbackInSupabase(chunkId, feedbackType);
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

  const updateChunkFeedbackInSupabase = async (chunkId: string, feedbackType: 'correct' | 'incorrect') => {
    if (!isSupabaseConfigured()) return;

    try {
      // Find the document containing this chunk
      const doc = documents.find(d => d.chunks.some(c => c.id === chunkId));
      if (!doc) return;

      const chunk = doc.chunks.find(c => c.id === chunkId);
      if (!chunk) return;

      const feedbackDelta = feedbackType === 'correct' ? 1 : -1;
      const newFeedbackScore = (chunk.metadata.feedbackScore || 0) + feedbackDelta;

      // Update the document in Supabase with the new chunk feedback
      const updatedChunks = doc.chunks.map(c => 
        c.id === chunkId 
          ? { ...c, metadata: { ...c.metadata, feedbackScore: newFeedbackScore } }
          : c
      );

      const { error } = await supabase!
        .from('documents')
        .update({ chunks: JSON.stringify(updatedChunks) })
        .eq('id', doc.id);

      if (error) {
        console.error('❌ Error updating chunk feedback in Supabase:', error);
      }
    } catch (error) {
      console.error('❌ Supabase chunk feedback update error:', error);
    }
  };

  const deleteDocument = (documentId: string) => {
    deleteDocumentFromSupabase(documentId);
    console.log(`🗑️ Deleting document with ID: ${documentId}`);
    
    // Remove from client-side documents
    setDocuments(prev => {
      const filtered = prev.filter(doc => doc.id !== documentId);
      console.log(`📚 Removed from client-side documents: ${prev.length} -> ${filtered.length}`);
      return filtered;
    });
    
    // Remove from server-side documents
    setServerProcessedDocuments(prev => {
      const filtered = prev.filter(doc => doc.id !== documentId);
      if (filtered.length !== prev.length) {
        console.log(`🖥️ Removed from server-side documents: ${prev.length} -> ${filtered.length}`);
      }
      return filtered;
    });
    
    console.log(`✅ Document ${documentId} deleted successfully`);
  };

  const deleteDocumentFromSupabase = async (documentId: string) => {
    if (!isSupabaseConfigured()) return;

    try {
      const { error } = await supabase!
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) {
        console.error('❌ Error deleting document from Supabase:', error);
      } else {
        console.log(`✅ Document ${documentId} deleted from Supabase`);
      }
    } catch (error) {
      console.error('❌ Supabase document deletion error:', error);
    }
  };

  const searchDocuments = (query: string, surveyId?: string, category?: string): DocumentChunk[] => {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
    
    console.log(`🔍 Searching documents: Survey="${surveyId || 'All'}", Category="${category || 'All'}"`);
    
    // Filter documents by survey and category if specified
    const clientDocuments = surveyId 
      ? documents.filter(doc => {
          const matchesSurvey = doc.surveyId === surveyId || (doc.metadata.isAdminGenerated && doc.surveyId === 'general');
          const matchesCategory = !category || doc.category === category || (doc.metadata.isAdminGenerated);
          return matchesSurvey && matchesCategory;
        })
      : documents;
    
    const serverDocuments = surveyId 
      ? serverProcessedDocuments.filter(doc => {
          const matchesSurvey = doc.surveyId === surveyId;
          const matchesCategory = !category || doc.category === category;
          return matchesSurvey && matchesCategory;
        })
      : serverProcessedDocuments;
    
    // Combine client and server documents (server takes priority for better extraction quality)
    const relevantDocuments = [...serverDocuments];
    
    // Add client documents that don't duplicate server documents
    clientDocuments.forEach(clientDoc => {
      const isDuplicate = clientDocuments.some(clientDoc => 
        serverDocuments.some(serverDoc => 
          serverDoc.fileName === clientDoc.fileName && serverDoc.surveyId === clientDoc.surveyId
        )
      );
      if (!isDuplicate) {
        relevantDocuments.push(clientDoc);
      }
    });
    
    // Also include admin answers that might be relevant to any survey
    const adminAnswers = documents.filter(doc => 
      doc.metadata.isAdminGenerated && 
      !relevantDocuments.some(existing => existing.id === doc.id)
    );
    
    // Add admin answers but don't let them dominate the results
    const limitedAdminAnswers = adminAnswers.slice(0, 2);
    relevantDocuments.push(...limitedAdminAnswers);
    
    console.log(`📊 Found ${relevantDocuments.length} relevant documents (${clientDocuments.length} client, ${serverDocuments.length} server, ${limitedAdminAnswers.length} admin)`);
    
    // Get all chunks from relevant documents
    const allChunks = relevantDocuments.flatMap(doc => doc.chunks);
    
    // Score and sort chunks by relevance
    const scoredChunks = allChunks.map(chunk => ({
      chunk,
      score: calculateEnhancedChunkRelevance(chunk, queryWords, queryLower, relevantDocuments, category)
    })).filter(item => item.score > 0);
    
    // Sort by score and return top matches
    return scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
      .map(item => item.chunk);
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
    const clientDocs = documents.filter(doc => {
      const matchesSurvey = doc.surveyId === surveyId;
      const matchesCategory = !category || doc.category === category;
      return matchesSurvey && matchesCategory;
    });
    
    const serverDocs = serverProcessedDocuments.filter(doc => {
      const matchesSurvey = doc.surveyId === surveyId;
      const matchesCategory = !category || doc.category === category;
      return matchesSurvey && matchesCategory;
    });
    
    // Combine and deduplicate
    const combined = [...clientDocs];
    serverDocs.forEach(serverDoc => {
      const isDuplicate = clientDocs.some(clientDoc => 
        clientDoc.fileName === serverDoc.fileName
      );
      if (!isDuplicate) {
        combined.push({
          ...serverDoc,
          metadata: {
            ...serverDoc.metadata,
            processingMethod: 'server-side-enhanced'
          }
        });
      }
    });
    
    return combined;
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
      id: uuidv4(),
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
    console.log(`📄 Starting Word document extraction for: ${file.name}`);
    console.log(`📊 File details: ${file.size} bytes, type: ${file.type}`);
    
    try {
      console.log('✅ Using statically imported Mammoth library');
      
      // Convert file to array buffer
      const arrayBuffer = await file.arrayBuffer();
      console.log(`📄 ArrayBuffer created successfully: ${arrayBuffer.byteLength} bytes`);
      
      // Extract text using mammoth
      const result = await mammoth.extractRawText({ arrayBuffer });
      console.log(`📝 Text extraction completed: ${result.value.length} characters extracted`);
      
      // Log any warnings from mammoth
      if (result.messages && result.messages.length > 0) {
        console.warn('📄 Mammoth extraction warnings:', result.messages);
      }
      
      const extractedText = result.value.trim();
      
      if (!extractedText || extractedText.length < 10) {
        throw new Error(`Insufficient text extracted from Word document. Only ${extractedText.length} characters found. The document may be empty, corrupted, or contain only images/tables.`);
      }
      
      console.log(`✅ Word document extraction successful: ${extractedText.length} characters`);
      return extractedText;
    } catch (error) {
      console.error('❌ Word document extraction failed:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        error: error.message,
        stack: error.stack
      });
      
      // Provide more specific error messages
      if (error.message.includes('zip')) {
        throw new Error(`Failed to extract text from Word document "${file.name}": The file appears to be corrupted or is not a valid Word document. Please try saving the document again or use a different file format.`);
      } else if (error.message.includes('password') || error.message.includes('encrypted')) {
        throw new Error(`Failed to extract text from Word document "${file.name}": The document appears to be password-protected or encrypted. Please remove the password protection and try again.`);
      } else if (error.message.includes('Insufficient text')) {
        throw new Error(error.message);
      } else {
        throw new Error(`Failed to extract text from Word document "${file.name}": ${error.message}. Please ensure the file is a valid Word document (.docx format is recommended).`);
      }
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
        type: classifyDocumentType(file.name)
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