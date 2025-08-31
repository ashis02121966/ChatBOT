import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Create client with no storage to prevent tracking prevention errors
let supabaseClient;
try {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      flowType: 'implicit',
      storage: {
        getItem: () => Promise.resolve(null),
        setItem: () => Promise.resolve(),
        removeItem: () => Promise.resolve()
      }
    },
    global: {
      headers: {
        'X-Client-Info': 'survey-chatbot-client'
      }
    }
  });
} catch (error) {
  console.warn('Supabase client creation failed, using mock client');
  supabaseClient = {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      eq: function() { return this; },
      order: function() { return this; },
      limit: function() { return this; },
      single: function() { return this; },
      maybeSingle: function() { return this; }
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null }, error: { message: 'Mock auth' } }),
      signOut: () => Promise.resolve({ error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null })
    }
  };
}

export const supabase = supabaseClient;

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'enumerator' | 'supervisor' | 'zo' | 'ro';
          status: 'active' | 'inactive';
          password_hash: string | null;
          salt: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role: 'admin' | 'enumerator' | 'supervisor' | 'zo' | 'ro';
          status?: 'active' | 'inactive';
          password_hash?: string | null;
          salt?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'enumerator' | 'supervisor' | 'zo' | 'ro';
          status?: 'active' | 'inactive';
          password_hash?: string | null;
          salt?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      surveys: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          file_name: string;
          survey_id: string | null;
          category: string | null;
          content: string;
          metadata: any;
          uploaded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          file_name: string;
          survey_id?: string | null;
          category?: string | null;
          content: string;
          metadata?: any;
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          file_name?: string;
          survey_id?: string | null;
          category?: string | null;
          content?: string;
          metadata?: any;
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      document_chunks: {
        Row: {
          id: string;
          document_id: string | null;
          content: string;
          metadata: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id?: string | null;
          content: string;
          metadata?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string | null;
          content?: string;
          metadata?: any;
          created_at?: string;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string | null;
          survey_id: string | null;
          category: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          survey_id?: string | null;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          survey_id?: string | null;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string | null;
          content: string;
          rich_content: string | null;
          sender: 'user' | 'bot' | 'admin';
          images: any;
          feedback_provided: boolean | null;
          feedback_type: 'positive' | 'negative' | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          content: string;
          rich_content?: string | null;
          sender: 'user' | 'bot' | 'admin';
          images?: any;
          feedback_provided?: boolean | null;
          feedback_type?: 'positive' | 'negative' | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          content?: string;
          rich_content?: string | null;
          sender?: 'user' | 'bot' | 'admin';
          images?: any;
          feedback_provided?: boolean | null;
          feedback_type?: 'positive' | 'negative' | null;
          created_at?: string;
        };
      };
      unanswered_queries: {
        Row: {
          id: string;
          content: string;
          survey_id: string | null;
          user_id: string | null;
          status: 'pending' | 'answered' | 'dismissed';
          admin_response: string | null;
          admin_response_rich: string | null;
          admin_images: any;
          answered_by: string | null;
          answered_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          survey_id?: string | null;
          user_id?: string | null;
          status?: 'pending' | 'answered' | 'dismissed';
          admin_response?: string | null;
          admin_response_rich?: string | null;
          admin_images?: any;
          answered_by?: string | null;
          answered_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          survey_id?: string | null;
          user_id?: string | null;
          status?: 'pending' | 'answered' | 'dismissed';
          admin_response?: string | null;
          admin_response_rich?: string | null;
          admin_images?: any;
          answered_by?: string | null;
          answered_at?: string | null;
          created_at?: string;
        };
      };
      admin_knowledge: {
        Row: {
          id: string;
          original_question: string;
          admin_answer: string;
          admin_answer_rich: string | null;
          survey_id: string | null;
          images: any;
          created_by: string | null;
          feedback_score: number | null;
          times_used: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          original_question: string;
          admin_answer: string;
          admin_answer_rich?: string | null;
          survey_id?: string | null;
          images?: any;
          created_by?: string | null;
          feedback_score?: number | null;
          times_used?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          original_question?: string;
          admin_answer?: string;
          admin_answer_rich?: string | null;
          survey_id?: string | null;
          images?: any;
          created_by?: string | null;
          feedback_score?: number | null;
          times_used?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}