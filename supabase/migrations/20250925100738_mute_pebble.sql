/*
  # Survey ChatBot Database Schema

  1. New Tables
    - `users` - User accounts with roles and authentication
    - `surveys` - Survey definitions and metadata
    - `documents` - Uploaded survey documents
    - `document_chunks` - Processed document chunks for AI
    - `document_images` - Images extracted from documents
    - `unanswered_queries` - Questions that need admin attention
    - `chat_sessions` - User chat sessions
    - `chat_messages` - Individual messages in chat sessions
    - `user_analytics` - User activity tracking
    - `system_analytics` - System-wide analytics
    - `admin_knowledge` - Admin-provided Q&A knowledge base

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated and anonymous users
    - Create indexes for performance

  3. Functions
    - Auto-update timestamp triggers
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'enumerator', 'supervisor', 'zo', 'ro');
CREATE TYPE user_status AS ENUM ('active', 'inactive');
CREATE TYPE query_status AS ENUM ('pending', 'answered', 'dismissed');
CREATE TYPE message_sender AS ENUM ('user', 'bot', 'admin');
CREATE TYPE feedback_type AS ENUM ('positive', 'negative');

-- Create update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    role user_role NOT NULL DEFAULT 'enumerator',
    status user_status NOT NULL DEFAULT 'active',
    last_login timestamptz,
    raw_user_meta_data jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    password_hash text,
    salt text
);

-- Surveys table
CREATE TABLE IF NOT EXISTS surveys (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text,
    status text DEFAULT 'active',
    created_by uuid REFERENCES users(id),
    total_documents integer DEFAULT 0,
    total_queries integer DEFAULT 0,
    avg_satisfaction numeric(3,2) DEFAULT 0.00,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name text NOT NULL,
    survey_id text NOT NULL,
    category text DEFAULT 'General Questions',
    content text NOT NULL,
    file_type text NOT NULL,
    upload_date timestamptz DEFAULT now(),
    processed_date timestamptz DEFAULT now(),
    word_count integer DEFAULT 0,
    character_count integer DEFAULT 0,
    chunk_count integer DEFAULT 0,
    image_count integer DEFAULT 0,
    processing_method text DEFAULT 'client-side',
    is_admin_generated boolean DEFAULT false,
    user_id uuid DEFAULT uid(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Document chunks table
CREATE TABLE IF NOT EXISTS document_chunks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
    content text NOT NULL,
    section text DEFAULT 'Section',
    keywords text[] DEFAULT '{}',
    entities text[] DEFAULT '{}',
    word_count integer DEFAULT 0,
    character_count integer DEFAULT 0,
    content_type text DEFAULT 'general',
    importance numeric DEFAULT 1.0,
    is_admin_answer boolean DEFAULT false,
    original_question text,
    admin_answer text,
    admin_answer_rich text,
    feedback_score integer DEFAULT 0,
    times_used integer DEFAULT 0,
    correct_feedback_count integer DEFAULT 0,
    incorrect_feedback_count integer DEFAULT 0,
    last_used timestamptz,
    date_answered timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Document images table
CREATE TABLE IF NOT EXISTS document_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
    chunk_id uuid REFERENCES document_chunks(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    description text,
    image_type text DEFAULT 'document',
    data_url text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Unanswered queries table
CREATE TABLE IF NOT EXISTS unanswered_queries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content text NOT NULL,
    survey_id text,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    status query_status NOT NULL DEFAULT 'pending',
    priority integer DEFAULT 1,
    category text,
    tags text[] DEFAULT '{}',
    context jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    answered_at timestamptz,
    answered_by uuid REFERENCES users(id),
    answer_content text,
    answer_rich_content text,
    answer_images jsonb DEFAULT '[]'
);

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    survey_id text NOT NULL,
    category text,
    message_count integer DEFAULT 0,
    total_feedback_positive integer DEFAULT 0,
    total_feedback_negative integer DEFAULT 0,
    session_duration interval,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
    content text NOT NULL,
    rich_content text,
    sender message_sender NOT NULL,
    feedback_type feedback_type,
    feedback_provided boolean DEFAULT false,
    alternative_attempts integer DEFAULT 0,
    original_query text,
    images jsonb DEFAULT '[]',
    processing_time interval,
    confidence_score numeric(3,2),
    created_at timestamptz DEFAULT now()
);

-- User analytics table
CREATE TABLE IF NOT EXISTS user_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    survey_id text,
    date date NOT NULL DEFAULT CURRENT_DATE,
    queries_asked integer DEFAULT 0,
    queries_answered integer DEFAULT 0,
    positive_feedback integer DEFAULT 0,
    negative_feedback integer DEFAULT 0,
    session_duration interval DEFAULT '00:00:00',
    documents_uploaded integer DEFAULT 0,
    avg_response_time interval,
    unique_sessions integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, survey_id, date)
);

-- System analytics table
CREATE TABLE IF NOT EXISTS system_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL DEFAULT CURRENT_DATE UNIQUE,
    total_users integer DEFAULT 0,
    active_users integer DEFAULT 0,
    new_users integer DEFAULT 0,
    total_queries integer DEFAULT 0,
    answered_queries integer DEFAULT 0,
    unanswered_queries integer DEFAULT 0,
    avg_response_time interval,
    bot_efficiency numeric(5,2) DEFAULT 0.00,
    documents_processed integer DEFAULT 0,
    storage_used bigint DEFAULT 0,
    top_surveys jsonb DEFAULT '[]',
    user_satisfaction numeric(3,2) DEFAULT 0.00,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Admin knowledge table
CREATE TABLE IF NOT EXISTS admin_knowledge (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    original_question text NOT NULL,
    admin_answer text NOT NULL,
    admin_answer_rich text,
    survey_id text REFERENCES surveys(id),
    images jsonb DEFAULT '[]',
    created_by uuid REFERENCES auth.users(id),
    feedback_score integer DEFAULT 0,
    times_used integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', original_question || ' ' || admin_answer)) STORED
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
CREATE INDEX IF NOT EXISTS idx_users_email_password ON users(email, password_hash);

CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
CREATE INDEX IF NOT EXISTS idx_surveys_created_by ON surveys(created_by);

CREATE INDEX IF NOT EXISTS idx_documents_survey_id ON documents(survey_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_is_admin_generated ON documents(is_admin_generated);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_is_admin_answer ON document_chunks(is_admin_answer);

CREATE INDEX IF NOT EXISTS idx_document_images_document_id ON document_images(document_id);
CREATE INDEX IF NOT EXISTS idx_document_images_chunk_id ON document_images(chunk_id);

CREATE INDEX IF NOT EXISTS idx_unanswered_queries_status ON unanswered_queries(status);
CREATE INDEX IF NOT EXISTS idx_unanswered_queries_survey_id ON unanswered_queries(survey_id);
CREATE INDEX IF NOT EXISTS idx_unanswered_queries_user_id ON unanswered_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_unanswered_queries_created_at ON unanswered_queries(created_at);
CREATE INDEX IF NOT EXISTS idx_unanswered_queries_priority ON unanswered_queries(priority DESC);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_survey_id ON chat_sessions(survey_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender);
CREATE INDEX IF NOT EXISTS idx_chat_messages_feedback_type ON chat_messages(feedback_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_survey_id ON user_analytics(survey_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_date ON user_analytics(date);

CREATE INDEX IF NOT EXISTS idx_system_analytics_date ON system_analytics(date);

CREATE INDEX IF NOT EXISTS idx_admin_knowledge_survey_id ON admin_knowledge(survey_id);
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_created_by ON admin_knowledge(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_tsv ON admin_knowledge USING gin(tsv);
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_times_used ON admin_knowledge(times_used DESC);
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_feedback_score ON admin_knowledge(feedback_score DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE unanswered_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_knowledge ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for anonymous and authenticated users
CREATE POLICY "Allow all operations for anonymous users" ON users FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON surveys FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON surveys FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON documents FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON document_chunks FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON document_chunks FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON document_images FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON document_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON unanswered_queries FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON unanswered_queries FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON chat_sessions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON chat_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON chat_messages FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON chat_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON user_analytics FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON user_analytics FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON system_analytics FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON system_analytics FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON admin_knowledge FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON admin_knowledge FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON surveys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_chunks_updated_at BEFORE UPDATE ON document_chunks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_analytics_updated_at BEFORE UPDATE ON user_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_analytics_updated_at BEFORE UPDATE ON system_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_knowledge_updated_at BEFORE UPDATE ON admin_knowledge FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert demo users
INSERT INTO users (id, email, name, role, status, password_hash, salt) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@example.com', 'Admin User', 'admin', 'active', 'password123', 'salt'),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'enum@example.com', 'John Enumerator', 'enumerator', 'active', 'password123', 'salt'),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'super@example.com', 'Jane Supervisor', 'supervisor', 'active', 'password123', 'salt'),
('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'zo@example.com', 'ZO User', 'zo', 'active', 'password123', 'salt'),
('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'ro@example.com', 'RO User', 'ro', 'active', 'password123', 'salt')
ON CONFLICT (email) DO NOTHING;

-- Insert demo surveys
INSERT INTO surveys (id, name, description, created_by) VALUES
('survey-1', 'Population Census Survey', 'National population census data collection', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('survey-2', 'Economic Household Survey', 'Household economic status survey', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('survey-3', 'Health and Nutrition Survey', 'Health and nutrition assessment', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('survey-4', 'Education Access Survey', 'Educational access and quality survey', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('survey-5', 'ASUSE Industry Survey', 'Industry and business survey', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
ON CONFLICT (id) DO NOTHING;