/*
  # Quick Database Setup Script
  
  This script will:
  1. Create the complete database schema
  2. Insert mock data that automatically links to existing auth.users
  
  PREREQUISITE: Create these users in Supabase Authentication first:
  - admin@example.com (password: password123)
  - enum@example.com (password: password123)  
  - super@example.com (password: password123)
  - zo@example.com (password: password123)
  - ro@example.com (password: password123)
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'enumerator', 'supervisor', 'zo', 'ro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE query_status AS ENUM ('pending', 'answered', 'dismissed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_sender AS ENUM ('user', 'bot', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE feedback_type AS ENUM ('positive', 'negative');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create surveys table
CREATE TABLE IF NOT EXISTS surveys (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text,
    status text DEFAULT 'active',
    created_by uuid REFERENCES auth.users(id),
    total_documents integer DEFAULT 0,
    total_queries integer DEFAULT 0,
    avg_satisfaction numeric(3,2) DEFAULT 0.00,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create users table
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

-- Create documents table
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

-- Create document_chunks table
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

-- Create document_images table
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

-- Create chat_sessions table
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

-- Create chat_messages table
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

-- Create unanswered_queries table
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

-- Create admin_knowledge table
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

-- Create user_analytics table
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

-- Create system_analytics table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
CREATE INDEX IF NOT EXISTS idx_users_email_password ON users(email, password_hash);

CREATE INDEX IF NOT EXISTS idx_documents_survey_id ON documents(survey_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_is_admin_generated ON documents(is_admin_generated);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_is_admin_answer ON document_chunks(is_admin_answer);

CREATE INDEX IF NOT EXISTS idx_document_images_document_id ON document_images(document_id);
CREATE INDEX IF NOT EXISTS idx_document_images_chunk_id ON document_images(chunk_id);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_survey_id ON chat_sessions(survey_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender);
CREATE INDEX IF NOT EXISTS idx_chat_messages_feedback_type ON chat_messages(feedback_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_unanswered_queries_user_id ON unanswered_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_unanswered_queries_survey_id ON unanswered_queries(survey_id);
CREATE INDEX IF NOT EXISTS idx_unanswered_queries_status ON unanswered_queries(status);
CREATE INDEX IF NOT EXISTS idx_unanswered_queries_priority ON unanswered_queries(priority DESC);
CREATE INDEX IF NOT EXISTS idx_unanswered_queries_created_at ON unanswered_queries(created_at);

CREATE INDEX IF NOT EXISTS idx_admin_knowledge_survey_id ON admin_knowledge(survey_id);
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_created_by ON admin_knowledge(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_feedback_score ON admin_knowledge(feedback_score DESC);
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_times_used ON admin_knowledge(times_used DESC);
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_tsv ON admin_knowledge USING gin(tsv);

CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_survey_id ON user_analytics(survey_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_date ON user_analytics(date);

CREATE INDEX IF NOT EXISTS idx_system_analytics_date ON system_analytics(date);

-- Enable RLS on all tables
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE unanswered_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now - adjust as needed)
CREATE POLICY "Allow all operations for authenticated users" ON surveys FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anonymous users" ON surveys FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anonymous users" ON users FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anonymous users" ON documents FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON document_chunks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anonymous users" ON document_chunks FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON document_images FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anonymous users" ON document_images FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON chat_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anonymous users" ON chat_sessions FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON chat_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anonymous users" ON chat_messages FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON unanswered_queries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anonymous users" ON unanswered_queries FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON admin_knowledge FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anonymous users" ON admin_knowledge FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON user_analytics FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anonymous users" ON user_analytics FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON system_analytics FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anonymous users" ON system_analytics FOR ALL TO anon USING (true) WITH CHECK (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON surveys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_chunks_updated_at BEFORE UPDATE ON document_chunks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_knowledge_updated_at BEFORE UPDATE ON admin_knowledge FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_analytics_updated_at BEFORE UPDATE ON user_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_analytics_updated_at BEFORE UPDATE ON system_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert mock data that automatically links to existing auth.users
-- First, insert surveys
INSERT INTO surveys (id, name, description, status, created_at, updated_at) VALUES
('survey-1', 'Population Census Survey', 'National population census data collection', 'active', now(), now()),
('survey-2', 'Economic Household Survey', 'Household economic status survey', 'active', now(), now()),
('survey-3', 'Health and Nutrition Survey', 'Health and nutrition assessment', 'active', now(), now()),
('survey-4', 'Education Access Survey', 'Educational access and quality survey', 'active', now(), now()),
('survey-5', 'ASUSE Industry Survey', 'Industry and business survey', 'active', now(), now())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = now();

-- Insert users that link to existing auth.users by email
INSERT INTO users (id, email, name, role, status, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    CASE 
        WHEN au.email = 'admin@example.com' THEN 'Admin User'
        WHEN au.email = 'enum@example.com' THEN 'John Enumerator'
        WHEN au.email = 'super@example.com' THEN 'Jane Supervisor'
        WHEN au.email = 'zo@example.com' THEN 'ZO User'
        WHEN au.email = 'ro@example.com' THEN 'RO User'
        ELSE 'Unknown User'
    END as name,
    CASE 
        WHEN au.email = 'admin@example.com' THEN 'admin'::user_role
        WHEN au.email = 'enum@example.com' THEN 'enumerator'::user_role
        WHEN au.email = 'super@example.com' THEN 'supervisor'::user_role
        WHEN au.email = 'zo@example.com' THEN 'zo'::user_role
        WHEN au.email = 'ro@example.com' THEN 'ro'::user_role
        ELSE 'enumerator'::user_role
    END as role,
    'active'::user_status,
    now(),
    now()
FROM auth.users au
WHERE au.email IN ('admin@example.com', 'enum@example.com', 'super@example.com', 'zo@example.com', 'ro@example.com')
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = now();

-- Insert some sample admin knowledge
INSERT INTO admin_knowledge (original_question, admin_answer, admin_answer_rich, survey_id, created_by, created_at, updated_at)
SELECT 
    'What is CAPI?',
    'CAPI stands for Computer Assisted Personal Interview. It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents.',
    '<p><strong>CAPI</strong> stands for <em>Computer Assisted Personal Interview</em>.</p><p>It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents.</p>',
    'survey-1',
    au.id,
    now(),
    now()
FROM auth.users au
WHERE au.email = 'admin@example.com'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO admin_knowledge (original_question, admin_answer, admin_answer_rich, survey_id, created_by, created_at, updated_at)
SELECT 
    'How do I handle non-response cases?',
    'Non-response cases should be documented with the reason code and follow-up attempts should be made according to the survey protocol. Always record the date, time, and reason for non-response.',
    '<p><strong>Non-response cases</strong> should be handled as follows:</p><ul><li>Document with appropriate reason code</li><li>Make follow-up attempts per survey protocol</li><li>Record date, time, and reason for non-response</li><li>Consult supervisor if multiple attempts fail</li></ul>',
    'survey-1',
    au.id,
    now(),
    now()
FROM auth.users au
WHERE au.email = 'admin@example.com'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert sample system analytics
INSERT INTO system_analytics (date, total_users, active_users, new_users, total_queries, answered_queries, unanswered_queries, bot_efficiency, documents_processed, user_satisfaction, created_at, updated_at) VALUES
(CURRENT_DATE, 5, 3, 1, 25, 22, 3, 88.00, 8, 4.2, now(), now())
ON CONFLICT (date) DO UPDATE SET
    total_users = EXCLUDED.total_users,
    active_users = EXCLUDED.active_users,
    new_users = EXCLUDED.new_users,
    total_queries = EXCLUDED.total_queries,
    answered_queries = EXCLUDED.answered_queries,
    unanswered_queries = EXCLUDED.unanswered_queries,
    bot_efficiency = EXCLUDED.bot_efficiency,
    documents_processed = EXCLUDED.documents_processed,
    user_satisfaction = EXCLUDED.user_satisfaction,
    updated_at = now();