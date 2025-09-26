/*
  # Complete Database Reset and Setup

  This script will:
  1. Drop all existing tables and functions
  2. Recreate the complete database schema
  3. Insert comprehensive mock data
  4. Set up all necessary indexes, policies, and triggers

  IMPORTANT: This will permanently delete all existing data!
*/

-- =============================================
-- STEP 1: DROP ALL EXISTING TABLES AND FUNCTIONS
-- =============================================

-- Drop tables in correct order (respecting foreign key dependencies)
DROP TABLE IF EXISTS document_images CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS unanswered_queries CASCADE;
DROP TABLE IF EXISTS user_analytics CASCADE;
DROP TABLE IF EXISTS document_chunks CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS system_analytics CASCADE;
DROP TABLE IF EXISTS admin_knowledge CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS surveys CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS query_status CASCADE;
DROP TYPE IF EXISTS message_sender CASCADE;
DROP TYPE IF EXISTS feedback_type CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =============================================
-- STEP 2: CREATE CUSTOM TYPES
-- =============================================

CREATE TYPE user_role AS ENUM ('admin', 'enumerator', 'supervisor', 'zo', 'ro');
CREATE TYPE user_status AS ENUM ('active', 'inactive');
CREATE TYPE query_status AS ENUM ('pending', 'answered', 'dismissed');
CREATE TYPE message_sender AS ENUM ('user', 'bot', 'admin');
CREATE TYPE feedback_type AS ENUM ('positive', 'negative');

-- =============================================
-- STEP 3: CREATE UTILITY FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- STEP 4: CREATE ALL TABLES WITH COMPLETE SCHEMA
-- =============================================

-- Users table (links to auth.users)
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    role user_role NOT NULL DEFAULT 'enumerator',
    status user_status NOT NULL DEFAULT 'active',
    last_login timestamptz,
    raw_user_meta_data jsonb DEFAULT '{}',
    password_hash text,
    salt text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Surveys table
CREATE TABLE surveys (
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
CREATE TABLE documents (
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
    user_id uuid DEFAULT auth.uid(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Document chunks table
CREATE TABLE document_chunks (
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
CREATE TABLE document_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
    chunk_id uuid REFERENCES document_chunks(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    description text,
    image_type text DEFAULT 'document',
    data_url text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Admin knowledge table
CREATE TABLE admin_knowledge (
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

-- Chat sessions table
CREATE TABLE chat_sessions (
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
CREATE TABLE chat_messages (
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

-- Unanswered queries table
CREATE TABLE unanswered_queries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content text NOT NULL,
    survey_id text,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    status query_status DEFAULT 'pending' NOT NULL,
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

-- User analytics table
CREATE TABLE user_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    survey_id text,
    date date DEFAULT CURRENT_DATE NOT NULL,
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
CREATE TABLE system_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date DEFAULT CURRENT_DATE NOT NULL UNIQUE,
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

-- =============================================
-- STEP 5: CREATE INDEXES
-- =============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_last_login ON users(last_login);
CREATE INDEX idx_users_email_password ON users(email, password_hash);

-- Surveys indexes
CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_surveys_created_by ON surveys(created_by);

-- Documents indexes
CREATE INDEX idx_documents_survey_id ON documents(survey_id);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_is_admin_generated ON documents(is_admin_generated);

-- Document chunks indexes
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_is_admin_answer ON document_chunks(is_admin_answer);

-- Document images indexes
CREATE INDEX idx_document_images_document_id ON document_images(document_id);
CREATE INDEX idx_document_images_chunk_id ON document_images(chunk_id);

-- Admin knowledge indexes
CREATE INDEX idx_admin_knowledge_survey_id ON admin_knowledge(survey_id);
CREATE INDEX idx_admin_knowledge_created_by ON admin_knowledge(created_by);
CREATE INDEX idx_admin_knowledge_feedback_score ON admin_knowledge(feedback_score DESC);
CREATE INDEX idx_admin_knowledge_times_used ON admin_knowledge(times_used DESC);
CREATE INDEX idx_admin_knowledge_tsv ON admin_knowledge USING gin(tsv);

-- Chat sessions indexes
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_survey_id ON chat_sessions(survey_id);
CREATE INDEX idx_chat_sessions_created_at ON chat_sessions(created_at);

-- Chat messages indexes
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender);
CREATE INDEX idx_chat_messages_feedback_type ON chat_messages(feedback_type);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- Unanswered queries indexes
CREATE INDEX idx_unanswered_queries_status ON unanswered_queries(status);
CREATE INDEX idx_unanswered_queries_survey_id ON unanswered_queries(survey_id);
CREATE INDEX idx_unanswered_queries_user_id ON unanswered_queries(user_id);
CREATE INDEX idx_unanswered_queries_priority ON unanswered_queries(priority DESC);
CREATE INDEX idx_unanswered_queries_created_at ON unanswered_queries(created_at);

-- User analytics indexes
CREATE INDEX idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX idx_user_analytics_survey_id ON user_analytics(survey_id);
CREATE INDEX idx_user_analytics_date ON user_analytics(date);

-- System analytics indexes
CREATE INDEX idx_system_analytics_date ON system_analytics(date);

-- =============================================
-- STEP 6: CREATE TRIGGERS
-- =============================================

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON surveys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_chunks_updated_at BEFORE UPDATE ON document_chunks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_knowledge_updated_at BEFORE UPDATE ON admin_knowledge FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_analytics_updated_at BEFORE UPDATE ON user_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_analytics_updated_at BEFORE UPDATE ON system_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- STEP 7: ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE unanswered_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_analytics ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 8: CREATE RLS POLICIES
-- =============================================

-- Allow all operations for anonymous users (for demo purposes)
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

CREATE POLICY "Allow all operations for anonymous users" ON admin_knowledge FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON admin_knowledge FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON chat_sessions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON chat_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON chat_messages FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON chat_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON unanswered_queries FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON unanswered_queries FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON user_analytics FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON user_analytics FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON system_analytics FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON system_analytics FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- STEP 9: INSERT COMPREHENSIVE MOCK DATA
-- =============================================

-- Insert users (will be linked to auth.users by email)
INSERT INTO users (id, email, name, role, status, last_login, created_at) VALUES
(gen_random_uuid(), 'admin@example.com', 'Admin User', 'admin', 'active', now() - interval '1 hour', now() - interval '30 days'),
(gen_random_uuid(), 'enum@example.com', 'John Enumerator', 'enumerator', 'active', now() - interval '2 hours', now() - interval '25 days'),
(gen_random_uuid(), 'super@example.com', 'Jane Supervisor', 'supervisor', 'active', now() - interval '3 hours', now() - interval '20 days'),
(gen_random_uuid(), 'zo@example.com', 'ZO User', 'zo', 'active', now() - interval '1 day', now() - interval '15 days'),
(gen_random_uuid(), 'ro@example.com', 'RO User', 'ro', 'active', now() - interval '2 days', now() - interval '10 days');

-- Insert surveys
INSERT INTO surveys (id, name, description, status, created_by, total_documents, total_queries, avg_satisfaction, created_at) VALUES
('survey-1', 'Population Census Survey', 'National population census data collection', 'active', (SELECT id FROM users WHERE email = 'admin@example.com'), 15, 456, 4.2, now() - interval '60 days'),
('survey-2', 'Economic Household Survey', 'Household economic status survey', 'active', (SELECT id FROM users WHERE email = 'admin@example.com'), 12, 324, 4.1, now() - interval '50 days'),
('survey-3', 'Health and Nutrition Survey', 'Health and nutrition assessment', 'active', (SELECT id FROM users WHERE email = 'admin@example.com'), 8, 287, 3.9, now() - interval '40 days'),
('survey-4', 'Education Access Survey', 'Educational access and quality survey', 'active', (SELECT id FROM users WHERE email = 'admin@example.com'), 6, 178, 4.3, now() - interval '30 days'),
('survey-5', 'ASUSE Industry Survey', 'Industry and business survey', 'active', (SELECT id FROM users WHERE email = 'admin@example.com'), 4, 89, 4.0, now() - interval '20 days');

-- Insert documents with realistic content
INSERT INTO documents (id, file_name, survey_id, category, content, file_type, word_count, character_count, chunk_count, image_count, processing_method, user_id, created_at) VALUES
(gen_random_uuid(), 'Census_Procedures_Manual.pdf', 'survey-1', 'General Questions', 
'=== CENSUS PROCEDURES MANUAL ===

CHAPTER 1: INTRODUCTION TO CENSUS ENUMERATION

The Population Census is a comprehensive count of all persons residing in the country. This manual provides detailed procedures for enumerators conducting household interviews using CAPI (Computer Assisted Personal Interview) technology.

SECTION 1.1: ENUMERATION BASICS
Enumeration is the systematic process of visiting every household in your assigned enumeration area (EA) and collecting information about all household members. Each enumerator must follow standardized procedures to ensure data quality and consistency.

SECTION 1.2: CAPI SYSTEM OVERVIEW
The CAPI system guides you through the questionnaire with built-in validation checks. The tablet will automatically skip irrelevant questions and flag inconsistent responses for review.

CHAPTER 2: HOUSEHOLD IDENTIFICATION

SECTION 2.1: LOCATING HOUSEHOLDS
Use the provided maps and address lists to systematically visit every structure in your EA. Mark completed households on your listing sheet and in the CAPI system.

SECTION 2.2: HOUSEHOLD DEFINITION
A household consists of all persons who usually live together and share meals. Visitors staying temporarily (less than 6 months) should not be counted as household members.', 
'application/pdf', 185, 1247, 3, 2, 'server-side-enhanced', (SELECT id FROM users WHERE email = 'enum@example.com'), now() - interval '25 days'),

(gen_random_uuid(), 'Data_Collection_Guidelines.docx', 'survey-1', 'Detail Schedule', 
'=== DATA COLLECTION GUIDELINES ===

QUALITY CONTROL PROCEDURES

1. INTERVIEW PREPARATION
- Review the questionnaire before each interview
- Ensure your tablet is fully charged
- Carry backup forms in case of technical issues
- Verify household address and contact information

2. CONDUCTING THE INTERVIEW
- Introduce yourself and explain the purpose of the survey
- Obtain informed consent before beginning
- Ask questions exactly as written in the questionnaire
- Record responses accurately and completely
- Probe for complete answers when necessary

3. DATA VALIDATION
- Review all responses before ending the interview
- Check for missing or inconsistent information
- Use the CAPI validation features to identify errors
- Make corrections immediately while with the respondent

4. POST-INTERVIEW PROCEDURES
- Sync data to the server daily
- Report any issues to your supervisor
- Maintain confidentiality of all collected information
- Complete daily activity reports', 
'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 142, 956, 2, 1, 'client-side', (SELECT id FROM users WHERE email = 'super@example.com'), now() - interval '20 days'),

(gen_random_uuid(), 'Sample_Forms.xlsx', 'survey-2', 'Listing', 
'=== SAMPLE FORMS AND TEMPLATES ===

SHEET: Household Roster
Row 1: Person ID | Name | Relationship | Age | Sex | Education
Row 2: 001 | John Smith | Head | 45 | Male | University
Row 3: 002 | Mary Smith | Spouse | 42 | Female | High School
Row 4: 003 | Tom Smith | Son | 18 | Male | High School
Row 5: 004 | Lisa Smith | Daughter | 16 | Female | High School

SHEET: Economic Information
Row 1: Employment Status | Occupation | Industry | Income Range
Row 2: Employed | Manager | Finance | 50000-75000
Row 3: Employed | Teacher | Education | 25000-50000
Row 4: Student | N/A | N/A | 0
Row 5: Student | N/A | N/A | 0

SHEET: Housing Characteristics
Row 1: Dwelling Type | Ownership | Rooms | Water Source | Electricity
Row 2: House | Owned | 6 | Piped | Yes
Row 3: Apartment | Rented | 4 | Piped | Yes
Row 4: House | Owned | 8 | Well | Yes', 
'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 98, 678, 2, 0, 'server-side', (SELECT id FROM users WHERE email = 'enum@example.com'), now() - interval '15 days'),

(gen_random_uuid(), 'Training_Materials.txt', 'survey-3', 'Additional Schedule', 
'=== TRAINING MATERIALS FOR HEALTH SURVEY ===

INTERVIEWER TRAINING GUIDE

Module 1: Health Questions
- Ask about current health status
- Record any chronic conditions
- Document medications being taken
- Note any disabilities or limitations

Module 2: Nutrition Assessment
- Measure height and weight accurately
- Record dietary habits and restrictions
- Ask about food security issues
- Document any nutritional supplements

Module 3: Healthcare Access
- Identify nearest healthcare facilities
- Record insurance coverage information
- Ask about barriers to healthcare access
- Document recent healthcare visits

Quality Assurance:
- Double-check all measurements
- Verify responses with household members
- Maintain respondent privacy and dignity
- Follow all health and safety protocols', 
'text/plain', 89, 612, 2, 0, 'client-side', (SELECT id FROM users WHERE email = 'super@example.com'), now() - interval '10 days');

-- Insert document chunks with enhanced metadata
INSERT INTO document_chunks (id, document_id, content, section, keywords, entities, word_count, character_count, content_type, importance, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM documents WHERE file_name = 'Census_Procedures_Manual.pdf'), 
'The Population Census is a comprehensive count of all persons residing in the country. This manual provides detailed procedures for enumerators conducting household interviews using CAPI (Computer Assisted Personal Interview) technology.', 
'Introduction', 
ARRAY['census', 'population', 'enumeration', 'capi', 'interview', 'procedures'], 
ARRAY['Population Census', 'CAPI', 'Computer Assisted Personal Interview'], 
28, 189, 'definition', 2.0, now() - interval '25 days'),

(gen_random_uuid(), (SELECT id FROM documents WHERE file_name = 'Census_Procedures_Manual.pdf'), 
'Enumeration is the systematic process of visiting every household in your assigned enumeration area (EA) and collecting information about all household members. Each enumerator must follow standardized procedures to ensure data quality and consistency.', 
'Enumeration Basics', 
ARRAY['enumeration', 'household', 'systematic', 'procedures', 'quality', 'consistency'], 
ARRAY['EA', 'enumeration area'], 
32, 218, 'procedure', 2.5, now() - interval '25 days'),

(gen_random_uuid(), (SELECT id FROM documents WHERE file_name = 'Census_Procedures_Manual.pdf'), 
'A household consists of all persons who usually live together and share meals. Visitors staying temporarily (less than 6 months) should not be counted as household members.', 
'Household Definition', 
ARRAY['household', 'definition', 'members', 'visitors', 'temporary'], 
ARRAY['6 months'], 
25, 167, 'definition', 2.2, now() - interval '25 days'),

(gen_random_uuid(), (SELECT id FROM documents WHERE file_name = 'Data_Collection_Guidelines.docx'), 
'Review the questionnaire before each interview. Ensure your tablet is fully charged. Carry backup forms in case of technical issues. Verify household address and contact information.', 
'Interview Preparation', 
ARRAY['preparation', 'questionnaire', 'tablet', 'backup', 'verification'], 
ARRAY['tablet', 'backup forms'], 
22, 156, 'procedure', 1.8, now() - interval '20 days'),

(gen_random_uuid(), (SELECT id FROM documents WHERE file_name = 'Data_Collection_Guidelines.docx'), 
'Introduce yourself and explain the purpose of the survey. Obtain informed consent before beginning. Ask questions exactly as written in the questionnaire. Record responses accurately and completely.', 
'Conducting Interview', 
ARRAY['introduction', 'consent', 'questions', 'responses', 'accuracy'], 
ARRAY['informed consent'], 
26, 178, 'procedure', 2.1, now() - interval '20 days'),

(gen_random_uuid(), (SELECT id FROM documents WHERE file_name = 'Sample_Forms.xlsx'), 
'Person ID | Name | Relationship | Age | Sex | Education. Example: 001 | John Smith | Head | 45 | Male | University', 
'Household Roster', 
ARRAY['roster', 'person', 'relationship', 'education', 'demographics'], 
ARRAY['John Smith', 'University'], 
18, 124, 'form', 1.5, now() - interval '15 days'),

(gen_random_uuid(), (SELECT id FROM documents WHERE file_name = 'Training_Materials.txt'), 
'Ask about current health status. Record any chronic conditions. Document medications being taken. Note any disabilities or limitations.', 
'Health Questions', 
ARRAY['health', 'chronic', 'medications', 'disabilities', 'conditions'], 
ARRAY['chronic conditions'], 
18, 125, 'procedure', 1.9, now() - interval '10 days');

-- Insert document images with realistic descriptions
INSERT INTO document_images (id, document_id, file_name, description, image_type, data_url, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM documents WHERE file_name = 'Census_Procedures_Manual.pdf'), 
'Census_Enumeration_Flowchart.png', 'Flowchart showing the complete enumeration process from household identification to data submission', 'flowchart', 
'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 
now() - interval '25 days'),

(gen_random_uuid(), (SELECT id FROM documents WHERE file_name = 'Census_Procedures_Manual.pdf'), 
'CAPI_Screen_Example.png', 'Screenshot of the CAPI system showing the household roster entry screen with validation messages', 'screenshot', 
'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 
now() - interval '25 days'),

(gen_random_uuid(), (SELECT id FROM documents WHERE file_name = 'Data_Collection_Guidelines.docx'), 
'Interview_Setup_Diagram.png', 'Diagram showing proper interview setup including seating arrangement and equipment placement', 'diagram', 
'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 
now() - interval '20 days');

-- Insert admin knowledge with rich HTML content
INSERT INTO admin_knowledge (id, original_question, admin_answer, admin_answer_rich, survey_id, feedback_score, times_used, created_by, created_at) VALUES
(gen_random_uuid(), 'What is CAPI and how does it work?', 
'CAPI stands for Computer Assisted Personal Interview. It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents. The system guides interviewers through the questionnaire, validates responses in real-time, and reduces data entry errors.',
'<p><strong>CAPI stands for Computer Assisted Personal Interview.</strong></p>
<p>It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents.</p>
<h3>Key Features:</h3>
<ul>
<li>Real-time data validation</li>
<li>Automatic skip patterns</li>
<li>Reduced data entry errors</li>
<li>Immediate data synchronization</li>
</ul>
<p><em>CAPI systems significantly improve data quality and collection efficiency.</em></p>', 
'survey-1', 15, 23, (SELECT id FROM users WHERE email = 'admin@example.com'), now() - interval '30 days'),

(gen_random_uuid(), 'How do I handle non-response situations?', 
'Non-response occurs when selected respondents cannot or will not participate in the survey. Follow these steps: 1) Make at least 3 contact attempts at different times, 2) Leave a contact card with survey information, 3) Try to speak with other household members, 4) Document the reason for non-response, 5) Report to your supervisor for guidance.',
'<h3>Handling Non-Response Situations</h3>
<p>Non-response occurs when selected respondents cannot or will not participate in the survey.</p>
<h4>Step-by-Step Process:</h4>
<ol>
<li><strong>Make at least 3 contact attempts</strong> at different times of day</li>
<li><strong>Leave a contact card</strong> with survey information and your contact details</li>
<li><strong>Try to speak with other household members</strong> who might be available</li>
<li><strong>Document the reason for non-response</strong> in your system</li>
<li><strong>Report to your supervisor</strong> for additional guidance</li>
</ol>
<div style="background-color: #f0f8ff; padding: 10px; border-left: 4px solid #0066cc; margin: 10px 0;">
<p><strong>Important:</strong> Never force participation. Respect respondent decisions while following proper protocols.</p>
</div>', 
'survey-1', 12, 18, (SELECT id FROM users WHERE email = 'admin@example.com'), now() - interval '25 days'),

(gen_random_uuid(), 'What should I do if the CAPI system crashes during an interview?', 
'If the CAPI system crashes during an interview: 1) Stay calm and apologize to the respondent, 2) Try restarting the application first, 3) If that fails, restart the device, 4) Use backup paper forms to continue the interview, 5) Enter the data into CAPI once the system is working, 6) Report the technical issue to your supervisor immediately.',
'<h3>CAPI System Crash Protocol</h3>
<div style="background-color: #fff3cd; padding: 15px; border: 1px solid #ffeaa7; border-radius: 5px; margin-bottom: 15px;">
<p><strong>⚠️ Emergency Procedure</strong></p>
</div>
<h4>Immediate Steps:</h4>
<ol>
<li><strong>Stay calm</strong> and apologize to the respondent</li>
<li><strong>Try restarting the application</strong> first</li>
<li><strong>If that fails, restart the device</strong></li>
<li><strong>Use backup paper forms</strong> to continue the interview</li>
<li><strong>Enter the data into CAPI</strong> once the system is working</li>
<li><strong>Report the technical issue</strong> to your supervisor immediately</li>
</ol>
<div style="background-color: #d4edda; padding: 10px; border-left: 4px solid #28a745; margin: 10px 0;">
<p><strong>Pro Tip:</strong> Always carry backup paper forms and ensure your device is fully charged before starting interviews.</p>
</div>', 
'survey-1', 8, 12, (SELECT id FROM users WHERE email = 'admin@example.com'), now() - interval '20 days');

-- Insert chat sessions
INSERT INTO chat_sessions (id, user_id, survey_id, category, message_count, total_feedback_positive, total_feedback_negative, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM users WHERE email = 'enum@example.com'), 'survey-1', 'General Questions', 6, 4, 1, now() - interval '5 days'),
(gen_random_uuid(), (SELECT id FROM users WHERE email = 'super@example.com'), 'survey-1', 'Detail Schedule', 8, 6, 2, now() - interval '3 days'),
(gen_random_uuid(), (SELECT id FROM users WHERE email = 'enum@example.com'), 'survey-2', 'Listing', 4, 3, 0, now() - interval '2 days'),
(gen_random_uuid(), (SELECT id FROM users WHERE email = 'zo@example.com'), 'survey-3', 'General Questions', 5, 4, 1, now() - interval '1 day');

-- Insert chat messages with realistic conversations
INSERT INTO chat_messages (id, session_id, content, rich_content, sender, feedback_type, feedback_provided, created_at) VALUES
-- Session 1 messages
(gen_random_uuid(), (SELECT id FROM chat_sessions WHERE user_id = (SELECT id FROM users WHERE email = 'enum@example.com') AND survey_id = 'survey-1' LIMIT 1), 
'What is CAPI?', NULL, 'user', NULL, false, now() - interval '5 days'),

(gen_random_uuid(), (SELECT id FROM chat_sessions WHERE user_id = (SELECT id FROM users WHERE email = 'enum@example.com') AND survey_id = 'survey-1' LIMIT 1), 
'CAPI stands for Computer Assisted Personal Interview. It is a data collection method where trained interviewers use electronic devices to conduct face-to-face interviews.', 
'<p><strong>CAPI stands for Computer Assisted Personal Interview.</strong></p><p>It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents.</p>', 
'admin', 'positive', true, now() - interval '5 days'),

(gen_random_uuid(), (SELECT id FROM chat_sessions WHERE user_id = (SELECT id FROM users WHERE email = 'enum@example.com') AND survey_id = 'survey-1' LIMIT 1), 
'How do I handle non-response?', NULL, 'user', NULL, false, now() - interval '5 days'),

(gen_random_uuid(), (SELECT id FROM chat_sessions WHERE user_id = (SELECT id FROM users WHERE email = 'enum@example.com') AND survey_id = 'survey-1' LIMIT 1), 
'For non-response situations, make at least 3 contact attempts at different times, leave a contact card, try speaking with other household members, document the reason, and report to your supervisor.', 
'<h4>Handling Non-Response:</h4><ol><li>Make at least 3 contact attempts at different times</li><li>Leave a contact card with survey information</li><li>Try speaking with other household members</li><li>Document the reason for non-response</li><li>Report to your supervisor</li></ol>', 
'admin', 'positive', true, now() - interval '5 days'),

-- Session 2 messages
(gen_random_uuid(), (SELECT id FROM chat_sessions WHERE user_id = (SELECT id FROM users WHERE email = 'super@example.com') AND survey_id = 'survey-1' LIMIT 1), 
'What should I do if CAPI crashes?', NULL, 'user', NULL, false, now() - interval '3 days'),

(gen_random_uuid(), (SELECT id FROM chat_sessions WHERE user_id = (SELECT id FROM users WHERE email = 'super@example.com') AND survey_id = 'survey-1' LIMIT 1), 
'If CAPI crashes: stay calm, try restarting the app, then the device if needed, use backup paper forms to continue, enter data once system works, and report the issue to your supervisor.', 
'<h4>CAPI Crash Protocol:</h4><ol><li>Stay calm and apologize to respondent</li><li>Try restarting the application</li><li>If that fails, restart the device</li><li>Use backup paper forms to continue</li><li>Enter data once system is working</li><li>Report technical issue to supervisor</li></ol>', 
'admin', 'positive', true, now() - interval '3 days');

-- Insert unanswered queries
INSERT INTO unanswered_queries (id, content, survey_id, user_id, status, priority, category, created_at) VALUES
(gen_random_uuid(), 'How do I handle respondents who speak a different language?', 'survey-1', (SELECT id FROM users WHERE email = 'enum@example.com'), 'pending', 2, 'General Questions', now() - interval '2 days'),
(gen_random_uuid(), 'What is the protocol for interviewing minors?', 'survey-1', (SELECT id FROM users WHERE email = 'super@example.com'), 'pending', 3, 'Detail Schedule', now() - interval '1 day'),
(gen_random_uuid(), 'How do I verify income information that seems unrealistic?', 'survey-2', (SELECT id FROM users WHERE email = 'enum@example.com'), 'pending', 2, 'Detail Schedule', now() - interval '6 hours'),
(gen_random_uuid(), 'What should I do if I suspect data fabrication by an enumerator?', 'survey-1', (SELECT id FROM users WHERE email = 'zo@example.com'), 'pending', 3, 'General Questions', now() - interval '3 hours');

-- Insert user analytics
INSERT INTO user_analytics (id, user_id, survey_id, date, queries_asked, queries_answered, positive_feedback, negative_feedback, session_duration, documents_uploaded, unique_sessions, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM users WHERE email = 'enum@example.com'), 'survey-1', CURRENT_DATE - 7, 12, 10, 8, 2, '02:30:00', 2, 3, now() - interval '7 days'),
(gen_random_uuid(), (SELECT id FROM users WHERE email = 'enum@example.com'), 'survey-1', CURRENT_DATE - 6, 8, 7, 6, 1, '01:45:00', 1, 2, now() - interval '6 days'),
(gen_random_uuid(), (SELECT id FROM users WHERE email = 'super@example.com'), 'survey-1', CURRENT_DATE - 5, 15, 13, 11, 2, '03:15:00', 3, 4, now() - interval '5 days'),
(gen_random_uuid(), (SELECT id FROM users WHERE email = 'super@example.com'), 'survey-2', CURRENT_DATE - 4, 6, 5, 4, 1, '01:20:00', 1, 1, now() - interval '4 days'),
(gen_random_uuid(), (SELECT id FROM users WHERE email = 'zo@example.com'), 'survey-3', CURRENT_DATE - 3, 9, 8, 7, 1, '02:10:00', 0, 2, now() - interval '3 days'),
(gen_random_uuid(), (SELECT id FROM users WHERE email = 'ro@example.com'), 'survey-4', CURRENT_DATE - 2, 4, 4, 3, 1, '00:55:00', 1, 1, now() - interval '2 days');

-- Insert system analytics
INSERT INTO system_analytics (id, date, total_users, active_users, new_users, total_queries, answered_queries, unanswered_queries, bot_efficiency, documents_processed, user_satisfaction, created_at) VALUES
(gen_random_uuid(), CURRENT_DATE - 7, 5, 3, 0, 45, 40, 5, 88.89, 8, 4.2, now() - interval '7 days'),
(gen_random_uuid(), CURRENT_DATE - 6, 5, 2, 0, 32, 28, 4, 87.50, 3, 4.1, now() - interval '6 days'),
(gen_random_uuid(), CURRENT_DATE - 5, 5, 4, 0, 58, 52, 6, 89.66, 12, 4.3, now() - interval '5 days'),
(gen_random_uuid(), CURRENT_DATE - 4, 5, 2, 0, 28, 25, 3, 89.29, 5, 4.0, now() - interval '4 days'),
(gen_random_uuid(), CURRENT_DATE - 3, 5, 3, 0, 41, 37, 4, 90.24, 7, 4.2, now() - interval '3 days'),
(gen_random_uuid(), CURRENT_DATE - 2, 5, 2, 0, 22, 20, 2, 90.91, 3, 4.1, now() - interval '2 days'),
(gen_random_uuid(), CURRENT_DATE - 1, 5, 4, 0, 67, 61, 6, 91.04, 15, 4.4, now() - interval '1 day'),
(gen_random_uuid(), CURRENT_DATE, 5, 3, 0, 35, 32, 3, 91.43, 8, 4.3, now());

-- =============================================
-- STEP 10: DISPLAY SUMMARY
-- =============================================

DO $$
DECLARE
    user_count INTEGER;
    survey_count INTEGER;
    document_count INTEGER;
    chunk_count INTEGER;
    image_count INTEGER;
    knowledge_count INTEGER;
    session_count INTEGER;
    message_count INTEGER;
    query_count INTEGER;
    analytics_count INTEGER;
    system_analytics_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO survey_count FROM surveys;
    SELECT COUNT(*) INTO document_count FROM documents;
    SELECT COUNT(*) INTO chunk_count FROM document_chunks;
    SELECT COUNT(*) INTO image_count FROM document_images;
    SELECT COUNT(*) INTO knowledge_count FROM admin_knowledge;
    SELECT COUNT(*) INTO session_count FROM chat_sessions;
    SELECT COUNT(*) INTO message_count FROM chat_messages;
    SELECT COUNT(*) INTO query_count FROM unanswered_queries;
    SELECT COUNT(*) INTO analytics_count FROM user_analytics;
    SELECT COUNT(*) INTO system_analytics_count FROM system_analytics;
    
    RAISE NOTICE '=== DATABASE RESET AND SETUP COMPLETE ===';
    RAISE NOTICE 'Users: %', user_count;
    RAISE NOTICE 'Surveys: %', survey_count;
    RAISE NOTICE 'Documents: %', document_count;
    RAISE NOTICE 'Document Chunks: %', chunk_count;
    RAISE NOTICE 'Document Images: %', image_count;
    RAISE NOTICE 'Admin Knowledge: %', knowledge_count;
    RAISE NOTICE 'Chat Sessions: %', session_count;
    RAISE NOTICE 'Chat Messages: %', message_count;
    RAISE NOTICE 'Unanswered Queries: %', query_count;
    RAISE NOTICE 'User Analytics: %', analytics_count;
    RAISE NOTICE 'System Analytics: %', system_analytics_count;
    RAISE NOTICE '=== READY FOR USE ===';
END $$;