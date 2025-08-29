import { supabase } from '../lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';

export class DatabaseService {
  constructor() {
    this.supabase = supabase;
  }

  // Document operations
  async createDocument(documentData) {
    try {
      console.log('Creating document in database:', {
        fileName: documentData.file_name,
        surveyId: documentData.survey_id,
        category: documentData.category,
        contentLength: documentData.content?.length || 0
      });

      const { data, error } = await this.supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single();

      if (error) {
        console.error('Error creating document:', error);
        throw error;
      }

      console.log('Document created successfully:', data.id);
      return data;
    } catch (error) {
      console.error('Database error creating document:', error);
      throw error;
    }
  }

  async createDocumentChunks(chunksData) {
    try {
      console.log(`Creating ${chunksData.length} document chunks in database`);

      const { data, error } = await this.supabase
        .from('document_chunks')
        .insert(chunksData)
        .select();

      if (error) {
        console.error('Error creating document chunks:', error);
        throw error;
      }

      console.log(`${data.length} document chunks created successfully`);
      return data;
    } catch (error) {
      console.error('Database error creating document chunks:', error);
      throw error;
    }
  }

  async createDocumentImages(imagesData) {
    try {
      if (!imagesData || imagesData.length === 0) {
        console.log('No images to create');
        return [];
      }

      console.log(`Creating ${imagesData.length} document images in database`);

      const { data, error } = await this.supabase
        .from('document_images')
        .insert(imagesData)
        .select();

      if (error) {
        console.error('Error creating document images:', error);
        throw error;
      }

      console.log(`${data.length} document images created successfully`);
      return data;
    } catch (error) {
      console.error('Database error creating document images:', error);
      throw error;
    }
  }

  async getDocumentsBySurvey(surveyId, category = null) {
    try {
      let query = this.supabase
        .from('documents')
        .select('*')
        .eq('survey_id', surveyId);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Database error fetching documents:', error);
      throw error;
    }
  }

  async getDocumentImages(documentId) {
    try {
      const { data, error } = await this.supabase
        .from('document_images')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching document images:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Database error fetching document images:', error);
      throw error;
    }
  }

  async getDocumentChunks(documentId) {
    try {
      const { data, error } = await this.supabase
        .from('document_chunks')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching document chunks:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Database error fetching document chunks:', error);
      throw error;
    }
  }

  // Health check
  async checkConnection() {
    try {
      const { data, error } = await this.supabase
        .from('surveys')
        .select('count')
        .limit(1);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Database connection check failed:', error);
      return false;
    }
  }

  // Utility method to validate UUID
  validateAndGenerateUUID(id) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (id && uuidRegex.test(id)) {
      return id;
    }
    
    return uuidv4();
  }
}

export const databaseService = new DatabaseService();