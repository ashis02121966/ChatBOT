import { supabase } from '../lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';

export class DatabaseService {
  constructor() {
    this.supabase = supabase;
  }

  // Document operations
  async createDocument(documentData) {
    try {
      // Ensure all required fields are present with proper defaults
      const cleanDocumentData = {
        id: this.validateAndGenerateUUID(documentData.id),
        file_name: documentData.file_name,
        survey_id: documentData.survey_id,
        category: documentData.category || 'General Questions',
        content: documentData.content,
        file_type: documentData.file_type || 'unknown',
        upload_date: new Date().toISOString(),
        processed_date: new Date().toISOString(),
        word_count: documentData.word_count || 0,
        character_count: documentData.character_count || 0,
        chunk_count: documentData.chunk_count || 0,
        image_count: documentData.image_count || 0,
        processing_method: documentData.processing_method || 'server-side',
        is_admin_generated: documentData.is_admin_generated || false,
        user_id: documentData.user_id || null
      };

      console.log('Creating document in database:', {
        fileName: cleanDocumentData.file_name,
        surveyId: cleanDocumentData.survey_id,
        category: cleanDocumentData.category,
        contentLength: cleanDocumentData.content?.length || 0,
        id: cleanDocumentData.id
      });

      const { data, error } = await this.supabase
        .from('documents')
        .insert(cleanDocumentData)
        .select()
        .single();

      if (error) {
        console.error('Error creating document:', error);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('Error message:', error.message);
        console.error('Document data that failed:', cleanDocumentData);
        throw error;
      }

      console.log('✅ Document created successfully:', data.id);
      return data;
    } catch (error) {
      console.error('Database error creating document:', error);
      throw error;
    }
  }

  async createDocumentChunks(chunksData) {
    try {
      // Clean and validate chunks data
      const cleanChunksData = chunksData.map(chunk => ({
        id: this.validateAndGenerateUUID(chunk.id),
        document_id: chunk.document_id,
        content: chunk.content,
        section: chunk.section || 'Section',
        keywords: Array.isArray(chunk.keywords) ? chunk.keywords : [],
        entities: Array.isArray(chunk.entities) ? chunk.entities : [],
        word_count: chunk.word_count || 0,
        character_count: chunk.character_count || 0,
        content_type: chunk.content_type || 'general',
        importance: chunk.importance || 1.0,
        is_admin_answer: chunk.is_admin_answer || false,
        original_question: chunk.original_question || null,
        admin_answer: chunk.admin_answer || null,
        admin_answer_rich: chunk.admin_answer_rich || null,
        feedback_score: chunk.feedback_score || 0,
        times_used: chunk.times_used || 0,
        correct_feedback_count: chunk.correct_feedback_count || 0,
        incorrect_feedback_count: chunk.incorrect_feedback_count || 0,
        last_used: chunk.last_used || null,
        date_answered: chunk.date_answered || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      console.log(`Creating ${chunksData.length} document chunks in database`);
      console.log('Chunk data sample:', cleanChunksData[0]);

      const { data, error } = await this.supabase
        .from('document_chunks')
        .insert(cleanChunksData)
        .select();

      if (error) {
        console.error('Error creating document chunks:', error);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('Error message:', error.message);
        console.error('Chunks data that failed:', cleanChunksData);
        throw error;
      }

      console.log(`✅ ${data.length} document chunks created successfully`);
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

      // Clean and validate image data
      const cleanImagesData = imagesData.map(image => ({
        id: this.validateAndGenerateUUID(image.id),
        document_id: image.document_id,
        chunk_id: image.chunk_id || null,
        file_name: image.file_name,
        description: image.description || 'Document image',
        image_type: image.image_type || 'document',
        data_url: image.data_url,
        created_at: new Date().toISOString()
      }));

      console.log(`Creating ${imagesData.length} document images in database`);
      console.log('Image data sample:', cleanImagesData[0]);

      const { data, error } = await this.supabase
        .from('document_images')
        .insert(cleanImagesData)
        .select();

      if (error) {
        console.error('Error creating document images:', error);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('Error message:', error.message);
        console.error('Images data that failed:', cleanImagesData);
        throw error;
      }

      console.log(`✅ ${data.length} document images created successfully`);
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

  // Test database connection with detailed logging
  async testConnection() {
    try {
      console.log('🔍 Testing database connection...');
      
      // Test basic connection
      const { data: connectionTest, error: connectionError } = await this.supabase
        .from('surveys')
        .select('count')
        .limit(1);

      if (connectionError) {
        console.error('❌ Database connection failed:', connectionError);
        return false;
      }

      console.log('✅ Database connection successful');
      
      // Test table access
      const tables = ['documents', 'document_chunks', 'document_images'];
      for (const table of tables) {
        try {
          const { data, error } = await this.supabase
            .from(table)
            .select('count')
            .limit(1);
            
          if (error) {
            console.error(`❌ Table ${table} access failed:`, error);
          } else {
            console.log(`✅ Table ${table} accessible`);
          }
        } catch (tableError) {
          console.error(`❌ Table ${table} test failed:`, tableError);
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      return false;
    }
  }
}

export const databaseService = new DatabaseService();