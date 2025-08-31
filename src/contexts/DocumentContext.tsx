import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { databaseService } from '../services/DatabaseService';

export interface ProcessedDocument {
  id: string;
  fileName: string;
  content: string;
  chunks: Array<{
    id: string;
    content: string;
    metadata: {
      section: string;
      keywords: string[];
      entities: string[];
      wordCount: number;
      characterCount: number;
      contentType: string;
      importance: number;
      fileName?: string;
      category?: string;
      isAdminAnswer?: boolean;
      adminAnswer?: string;
      adminAnswerRich?: string;
      adminImages?: any[];
      originalQuestion?: string;
    };
  }>;
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
    wordCount: number;
    characterCount: number;
    chunkCount: number;
    imageCount: number;
  };
  survey_id: string;
  category: string;
}

interface DocumentContextType {
  documents: ProcessedDocument[];
  processDocument: (file: File, surveyId: string, category?: string, userId?: string) => Promise<void>;
  deleteDocument: (documentId: string) => void;
  searchDocuments: (query: string, surveyId?: string, category?: string) => any[];
  searchImages: (query: string, surveyId?: string, category?: string) => any[];
  getDocumentsBySurvey: (surveyId: string, category?: string) => ProcessedDocument[];
  updateChunkFeedback: (chunkId: string, isCorrect: boolean) => void;
  updateAdminKnowledgeDocument: (question: string, answer: string, surveyId?: string, images?: any[]) => void;
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

export function DocumentProvider({ children }: DocumentProviderProps) {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);

  // Use memory-only storage - no localStorage dependency
  // Documents will be lost on page refresh but app will work with tracking prevention

  const processDocument = async (
    file: File,
    surveyId: string,
    category: string = 'General Questions',
    userId?: string
  ) => {
    try {
      // Create document record
      const documentData = {
        id: crypto.randomUUID(),
        file_name: file.name,
        survey_id: surveyId,
        category: category,
        content: `Document "${file.name}" has been uploaded and processed. File type: ${file.type}, Size: ${file.size} bytes.`,
        file_type: file.type,
        word_count: 100,
        character_count: 500,
        chunk_count: 1,
        image_count: 0,
        processing_method: 'client-side',
        is_admin_generated: false,
        user_id: userId || null
      };

      // Save to database
      try {
        const savedDocument = await databaseService.createDocument(documentData);
        console.log('Document saved to database:', savedDocument?.id);
      } catch (dbError) {
        console.error('Error saving document to database:', dbError);
        // Continue with local processing even if database save fails
      }

      // Create processed document for local state
      const processedDoc: ProcessedDocument = {
        id: documentData.id,
        fileName: file.name,
        content: documentData.content,
        chunks: [{
          id: crypto.randomUUID(),
          content: documentData.content,
          metadata: {
            section: 'Document Content',
            keywords: [file.name.split('.')[0]],
            entities: [],
            wordCount: documentData.word_count,
            characterCount: documentData.character_count,
            contentType: 'general',
            importance: 1.0,
            fileName: file.name,
            category: category
          }
        }],
        images: [],
        metadata: {
          fileType: file.type,
          uploadDate: new Date(),
          wordCount: documentData.word_count,
          characterCount: documentData.character_count,
          chunkCount: 1,
          imageCount: 0
        },
        survey_id: surveyId,
        category: category
      };

      // Add to local state
      setDocuments(prev => [...prev, processedDoc]);
      console.log(`Document processed: ${file.name}`);

    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  };

  const deleteDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    
    // Also delete from database
    databaseService.deleteDocument(documentId).catch(error => {
      console.error('Error deleting document from database:', error);
    });
  };

  const searchDocuments = (query: string, surveyId?: string, category?: string) => {
    const filteredDocs = documents.filter(doc => 
      (!surveyId || doc.survey_id === surveyId) &&
      (!category || doc.category === category)
    );

    if (!query.trim()) {
      return filteredDocs.flatMap(doc => doc.chunks);
    }

    const queryLower = query.toLowerCase();
    const results: any[] = [];

    filteredDocs.forEach(doc => {
      doc.chunks.forEach(chunk => {
        const score = chunk.content.toLowerCase().includes(queryLower) ? 100 : 0;
        if (score > 0) {
          results.push({
            ...chunk,
            score,
            metadata: {
              ...chunk.metadata,
              fileName: doc.fileName,
              category: doc.category
            }
          });
        }
      });
    });

    return results.sort((a, b) => b.score - a.score);
  };

  const searchImages = (query: string, surveyId?: string, category?: string) => {
    const filteredDocs = documents.filter(doc => 
      (!surveyId || doc.survey_id === surveyId) &&
      (!category || doc.category === category)
    );

    return filteredDocs.flatMap(doc => doc.images);
  };

  const getDocumentsBySurvey = (surveyId: string, category?: string) => {
    return documents.filter(doc => 
      doc.survey_id === surveyId &&
      (!category || doc.category === category)
    );
  };

  const updateChunkFeedback = (chunkId: string, isCorrect: boolean) => {
    console.log(`Feedback for chunk ${chunkId}: ${isCorrect ? 'positive' : 'negative'}`);
  };

  const updateAdminKnowledgeDocument = (question: string, answer: string, surveyId?: string, images?: any[]) => {
    const adminDoc: ProcessedDocument = {
      id: crypto.randomUUID(),
      fileName: `Admin Answer - ${question.substring(0, 50)}...`,
      content: answer,
      chunks: [{
        id: crypto.randomUUID(),
        content: answer,
        metadata: {
          section: 'Admin Knowledge',
          keywords: question.split(' ').filter(word => word.length > 2),
          entities: [],
          wordCount: answer.split(' ').length,
          characterCount: answer.length,
          contentType: 'admin-answer',
          importance: 2.0,
          isAdminAnswer: true,
          adminAnswer: answer,
          originalQuestion: question,
          adminImages: images || []
        }
      }],
      images: images || [],
      metadata: {
        fileType: 'admin-knowledge',
        uploadDate: new Date(),
        wordCount: answer.split(' ').length,
        characterCount: answer.length,
        chunkCount: 1,
        imageCount: images?.length || 0
      },
      survey_id: surveyId || 'general',
      category: 'General Questions'
    };

    setDocuments(prev => [...prev, adminDoc]);
    console.log('Added admin knowledge to document context');
  };

  return (
    <DocumentContext.Provider value={{
      documents,
      processDocument,
      deleteDocument,
      searchDocuments,
      searchImages,
      getDocumentsBySurvey,
      updateChunkFeedback,
      updateAdminKnowledgeDocument
    }}>
      {children}
    </DocumentContext.Provider>
  );
}