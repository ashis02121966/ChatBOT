/*
  # Initial Database Schema for Survey ChatBot

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `role` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `surveys`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `documents`
      - `id` (uuid, primary key)
      - `file_name` (text)
      - `survey_id` (uuid, foreign key to surveys)
      - `category` (text)
      - `content` (text)
      - `metadata` (jsonb)
      - `uploaded_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `document_chunks`
      - `id` (uuid, primary key)
      - `document_id` (uuid, foreign key to documents)
      - `content` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamp)
    
    - `chat_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `survey_id` (uuid, foreign key to surveys)
      - `category` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `chat_messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to chat_sessions)
      - `content` (text)
      - `rich_content` (text)
      - `sender` (text)
      - `images` (jsonb)
      - `feedback_provided` (boolean)
      - `feedback_type` (text)
      - `created_at` (timestamp)
    
    - `unanswered_queries`
      - `id` (uuid, primary key)
      - `content` (text)
      - `survey_id` (uuid, foreign key to surveys)
      - `user_id` (uuid, foreign key to users)
      - `status` (text, default 'pending')
      - `admin_response` (text)
      - `admin_response_rich` (text)
      - `admin_images` (jsonb)
      - `answered_by` (uuid, foreign key to users)
      - `answered_at` (timestamp)
      - `created_at` (timestamp)
    
    - `admin_knowledge`
      - `id` (uuid, primary key)
      - `original_question` (text)
      - `admin_answer` (text)
      - `admin_answer_rich` (text)
      - `survey_id` (uuid, foreign key to surveys)
      - `images` (jsonb)
      - `created_by` (uuid, foreign key to users)
      - `feedback_score` (integer, default 0)
      - `times_used` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add admin-specific policies for management operations

  3. Indexes
    - Add indexes for frequently queried columns
    - Full-text search indexes for content
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'enumerator', 'supervisor', 'zo', 'ro')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create surveys table
CREATE TABLE IF NOT EXISTS surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  survey_id uuid REFERENCES surveys(id) ON DELETE CASCADE,
  category text DEFAULT 'General Questions',
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create document_chunks table
CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  survey_id uuid REFERENCES surveys(id) ON DELETE CASCADE,
  category text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  content text NOT NULL,
  rich_content text,
  sender text NOT NULL CHECK (sender IN ('user', 'bot', 'admin')),
  images jsonb DEFAULT '[]',
  feedback_provided boolean DEFAULT false,
  feedback_type text CHECK (feedback_type IN ('positive', 'negative')),
  created_at timestamptz DEFAULT now()
);

-- Create unanswered_queries table
CREATE TABLE IF NOT EXISTS unanswered_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  survey_id uuid REFERENCES surveys(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'dismissed')),
  admin_response text,
  admin_response_rich text,
  admin_images jsonb DEFAULT '[]',
  answered_by uuid REFERENCES users(id) ON DELETE SET NULL,
  answered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create admin_knowledge table
CREATE TABLE IF NOT EXISTS admin_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_question text NOT NULL,
  admin_answer text NOT NULL,
  admin_answer_rich text,
  survey_id uuid REFERENCES surveys(id) ON DELETE SET NULL,
  images jsonb DEFAULT '[]',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  feedback_score integer DEFAULT 0,
  times_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE unanswered_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_knowledge ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage users" ON users
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Surveys policies
CREATE POLICY "All authenticated users can read surveys" ON surveys
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage surveys" ON surveys
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Documents policies
CREATE POLICY "Users can read documents" ON documents
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can create documents" ON documents
  FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Admins can manage all documents" ON documents
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can manage own documents" ON documents
  FOR ALL TO authenticated
  USING (uploaded_by = auth.uid());

-- Document chunks policies
CREATE POLICY "Users can read document chunks" ON document_chunks
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can create document chunks" ON document_chunks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE id = document_id AND uploaded_by = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all document chunks" ON document_chunks
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Chat sessions policies
CREATE POLICY "Users can read own chat sessions" ON chat_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own chat sessions" ON chat_sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all chat sessions" ON chat_sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Chat messages policies
CREATE POLICY "Users can read messages from own sessions" ON chat_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own sessions" ON chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in own sessions" ON chat_messages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all chat messages" ON chat_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Unanswered queries policies
CREATE POLICY "Users can read own unanswered queries" ON unanswered_queries
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create unanswered queries" ON unanswered_queries
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all unanswered queries" ON unanswered_queries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage unanswered queries" ON unanswered_queries
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin knowledge policies
CREATE POLICY "Users can read admin knowledge" ON admin_knowledge
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage admin knowledge" ON admin_knowledge
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_survey_id ON documents(survey_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_survey_id ON chat_sessions(survey_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_unanswered_queries_status ON unanswered_queries(status);
CREATE INDEX IF NOT EXISTS idx_unanswered_queries_survey_id ON unanswered_queries(survey_id);
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_survey_id ON admin_knowledge(survey_id);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_documents_content_fts ON documents USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_document_chunks_content_fts ON document_chunks USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_question_fts ON admin_knowledge USING gin(to_tsvector('english', original_question));
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_answer_fts ON admin_knowledge USING gin(to_tsvector('english', admin_answer));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON surveys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_knowledge_updated_at BEFORE UPDATE ON admin_knowledge
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();