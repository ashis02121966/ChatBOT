import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type Tables = Database['public']['Tables'];
type User = Tables['users']['Row'];
type Survey = Tables['surveys']['Row'];
type Document = Tables['documents']['Row'];
type DocumentChunk = Tables['document_chunks']['Row'];
type ChatSession = Tables['chat_sessions']['Row'];
type ChatMessage = Tables['chat_messages']['Row'];
type UnansweredQuery = Tables['unanswered_queries']['Row'];
type AdminKnowledge = Tables['admin_knowledge']['Row'];

export class DatabaseService {
  // User CRUD operations
  async createUser(userData: Tables['users']['Insert']): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }

    return data;
  }

  async getUser(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }

    return data;
  }

  async updateUser(id: string, updates: Tables['users']['Update']): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }

    return data;
  }

  async deleteUser(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      throw error;
    }

    return true;
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    return data || [];
  }

  // Survey CRUD operations
  async createSurvey(surveyData: Tables['surveys']['Insert']): Promise<Survey | null> {
    const { data, error } = await supabase
      .from('surveys')
      .insert(surveyData)
      .select()
      .single();

    if (error) {
      console.error('Error creating survey:', error);
      throw error;
    }

    return data;
  }

  async getSurvey(id: string): Promise<Survey | null> {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching survey:', error);
      return null;
    }

    return data;
  }

  async getAllSurveys(): Promise<Survey[]> {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching surveys:', error);
      throw error;
    }

    return data || [];
  }

  async updateSurvey(id: string, updates: Tables['surveys']['Update']): Promise<Survey | null> {
    const { data, error } = await supabase
      .from('surveys')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating survey:', error);
      throw error;
    }

    return data;
  }

  async deleteSurvey(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('surveys')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting survey:', error);
      throw error;
    }

    return true;
  }

  // Document CRUD operations
  async createDocument(documentData: Tables['documents']['Insert']): Promise<Document | null> {
    const { data, error } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single();

    if (error) {
      console.error('Error creating document:', error);
      throw error;
    }

    return data;
  }

  async getDocument(id: string): Promise<Document | null> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching document:', error);
      return null;
    }

    return data;
  }

  async getDocumentsBySurvey(surveyId: string, category?: string): Promise<Document[]> {
    let query = supabase
      .from('documents')
      .select('*')
      .eq('survey_id', surveyId);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents by survey:', error);
      throw error;
    }

    return data || [];
  }

  async updateDocument(id: string, updates: Tables['documents']['Update']): Promise<Document | null> {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating document:', error);
      throw error;
    }

    return data;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting document:', error);
      throw error;
    }

    return true;
  }

  // Document Chunks CRUD operations
  async createDocumentChunk(chunkData: Tables['document_chunks']['Insert']): Promise<DocumentChunk | null> {
    const { data, error } = await supabase
      .from('document_chunks')
      .insert(chunkData)
      .select()
      .single();

    if (error) {
      console.error('Error creating document chunk:', error);
      throw error;
    }

    return data;
  }

  async createDocumentChunks(chunksData: Tables['document_chunks']['Insert'][]): Promise<DocumentChunk[]> {
    const { data, error } = await supabase
      .from('document_chunks')
      .insert(chunksData)
      .select();

    if (error) {
      console.error('Error creating document chunks:', error);
      throw error;
    }

    return data || [];
  }

  async getDocumentChunks(documentId: string): Promise<DocumentChunk[]> {
    const { data, error } = await supabase
      .from('document_chunks')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching document chunks:', error);
      throw error;
    }

    return data || [];
  }

  async searchDocumentChunks(query: string, surveyId?: string, category?: string): Promise<DocumentChunk[]> {
    let dbQuery = supabase
      .from('document_chunks')
      .select(`
        *,
        documents!inner(
          survey_id,
          category,
          file_name
        )
      `)
      .textSearch('content', query);

    if (surveyId) {
      dbQuery = dbQuery.eq('documents.survey_id', surveyId);
    }

    if (category) {
      dbQuery = dbQuery.eq('documents.category', category);
    }

    const { data, error } = await dbQuery.limit(20);

    if (error) {
      console.error('Error searching document chunks:', error);
      throw error;
    }

    return data || [];
  }

  // Chat Session CRUD operations
  async createChatSession(sessionData: Tables['chat_sessions']['Insert']): Promise<ChatSession | null> {
    // Clean the session data and ensure proper format
    const cleanSessionData = {
      ...sessionData,
      id: sessionData.id || crypto.randomUUID(),
      user_id: sessionData.user_id,
      survey_id: sessionData.survey_id,
      category: sessionData.category || null,
      message_count: 0,
      total_feedback_positive: 0,
      total_feedback_negative: 0
    };
    
    console.log('Inserting chat session:', cleanSessionData);
    
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert(cleanSessionData)
        .select()
        .single();

      if (error) {
        console.error('Error creating chat session:', error);
        throw error;
      }

      console.log('Chat session created successfully:', data);
      return data;
    } catch (error) {
      console.error('Database error creating chat session:', error);
      throw error;
    }
  }

  async getChatSession(id: string): Promise<ChatSession | null> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching chat session:', error);
      return null;
    }

    return data;
  }

  async getUserChatSessions(userId: string): Promise<ChatSession[]> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user chat sessions:', error);
      throw error;
    }

    return data || [];
  }

  async updateChatSession(id: string, updates: Tables['chat_sessions']['Update']): Promise<ChatSession | null> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating chat session:', error);
      throw error;
    }

    return data;
  }

  // Chat Message CRUD operations
  async createChatMessage(messageData: Tables['chat_messages']['Insert']): Promise<ChatMessage | null> {
    // Clean the message data and ensure proper format
    const cleanMessageData = {
      ...messageData,
      id: messageData.id || crypto.randomUUID(),
      session_id: messageData.session_id,
      content: messageData.content || '',
      rich_content: messageData.rich_content || null,
      sender: messageData.sender,
      images: messageData.images || null,
      feedback_provided: false,
      feedback_type: null,
      alternative_attempts: 0
    };
    
    console.log('Inserting chat message:', cleanMessageData);
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert(cleanMessageData)
        .select()
        .single();

      if (error) {
        console.error('Error creating chat message:', error);
        throw error;
      }

      console.log('Chat message created successfully:', data);
      return data;
    } catch (error) {
      console.error('Database error creating chat message:', error);
      throw error;
    }
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat messages:', error);
      throw error;
    }

    return data || [];
  }

  async updateChatMessage(id: string, updates: Tables['chat_messages']['Update']): Promise<ChatMessage | null> {
    const { data, error } = await supabase
      .from('chat_messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating chat message:', error);
      throw error;
    }

    return data;
  }

  // Unanswered Queries CRUD operations
  async createUnansweredQuery(queryData: Tables['unanswered_queries']['Insert']): Promise<UnansweredQuery | null> {
    // Ensure we have a valid UUID for the query ID
    if (queryData.id && typeof queryData.id === 'string' && !queryData.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      queryData.id = crypto.randomUUID();
    }
    
    const { data, error } = await supabase
      .from('unanswered_queries')
      .insert(queryData)
      .select()
      .single();

    if (error) {
      console.error('Error creating unanswered query:', error);
      throw error;
    }

    return data;
  }

  async getUnansweredQueries(status: 'pending' | 'answered' | 'dismissed' = 'pending'): Promise<UnansweredQuery[]> {
    const { data, error } = await supabase
      .from('unanswered_queries')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching unanswered queries:', error);
      throw error;
    }

    return data || [];
  }

  async updateUnansweredQuery(id: string, updates: Tables['unanswered_queries']['Update']): Promise<UnansweredQuery | null> {
    const { data, error } = await supabase
      .from('unanswered_queries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating unanswered query:', error);
      throw error;
    }

    return data;
  }

  async answerQuery(
    queryId: string, 
    adminResponse: string, 
    adminResponseRich?: string, 
    adminImages?: any[], 
    answeredBy?: string
  ): Promise<UnansweredQuery | null> {
    const updates: Tables['unanswered_queries']['Update'] = {
      status: 'answered',
      admin_response: adminResponse,
      admin_response_rich: adminResponseRich,
      admin_images: adminImages || [],
      answered_by: answeredBy,
      answered_at: new Date().toISOString()
    };

    return this.updateUnansweredQuery(queryId, updates);
  }

  // Admin Knowledge CRUD operations
  async createAdminKnowledge(knowledgeData: Tables['admin_knowledge']['Insert']): Promise<AdminKnowledge | null> {
    // Ensure we have a valid UUID for the knowledge ID
    if (knowledgeData.id && typeof knowledgeData.id === 'string' && !knowledgeData.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      knowledgeData.id = crypto.randomUUID();
    }
    
    const { data, error } = await supabase
      .from('admin_knowledge')
      .insert(knowledgeData)
      .select()
      .single();

    if (error) {
      console.error('Error creating admin knowledge:', error);
      throw error;
    }

    return data;
  }

  async getAdminKnowledge(surveyId?: string): Promise<AdminKnowledge[]> {
    let query = supabase
      .from('admin_knowledge')
      .select('*');

    if (surveyId) {
      query = query.or(`survey_id.eq.${surveyId},survey_id.is.null`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin knowledge:', error);
      throw error;
    }

    return data || [];
  }

  async searchAdminKnowledge(query: string, surveyId?: string): Promise<AdminKnowledge[]> {
    let dbQuery = supabase
      .from('admin_knowledge')
      .select('*')
      .or(`original_question.ilike.%${query}%,admin_answer.ilike.%${query}%`);

    if (surveyId) {
      dbQuery = dbQuery.or(`survey_id.eq.${surveyId},survey_id.is.null`);
    }

    const { data, error } = await dbQuery
      .order('feedback_score', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error searching admin knowledge:', error);
      throw error;
    }

    return data || [];
  }

  async updateAdminKnowledge(id: string, updates: Tables['admin_knowledge']['Update']): Promise<AdminKnowledge | null> {
    const { data, error } = await supabase
      .from('admin_knowledge')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating admin knowledge:', error);
      throw error;
    }

    return data;
  }

  async incrementAdminKnowledgeUsage(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_admin_knowledge_usage', {
      knowledge_id: id
    });

    if (error) {
      console.error('Error incrementing admin knowledge usage:', error);
    }
  }

  // Analytics and reporting
  async getChatAnalytics(startDate?: string, endDate?: string) {
    let query = supabase
      .from('chat_messages')
      .select(`
        id,
        sender,
        feedback_provided,
        feedback_type,
        created_at,
        chat_sessions!inner(
          survey_id,
          user_id
        )
      `);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching chat analytics:', error);
      throw error;
    }

    return data || [];
  }

  async getDocumentAnalytics() {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        id,
        survey_id,
        category,
        created_at,
        surveys(name)
      `);

    if (error) {
      console.error('Error fetching document analytics:', error);
      throw error;
    }

    return data || [];
  }

  // Utility functions
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Error signing in:', error);
      throw error;
    }

    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  async signUp(email: string, password: string, userData: { name: string; role: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });

    if (error) {
      console.error('Error signing up:', error);
      throw error;
    }

    return data;
  }
}

// Create a singleton instance
export const databaseService = new DatabaseService();