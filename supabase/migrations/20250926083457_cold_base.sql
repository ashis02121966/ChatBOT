/*
  # Complete Database Setup with Mock Data
  
  This script will:
  1. Drop all existing tables (complete reset)
  2. Create the complete database schema
  3. Insert comprehensive mock data
  
  ## Prerequisites
  Before running this script, create these users in Supabase Authentication:
  - admin@example.com (password: password123)
  - enum@example.com (password: password123)
  - super@example.com (password: password123)
  - zo@example.com (password: password123)
  - ro@example.com (password: password123)
*/

-- =============================================
-- SECTION 1: DROP EXISTING TABLES
-- =============================================

DROP TABLE IF EXISTS public.document_images CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_sessions CASCADE;
DROP TABLE IF EXISTS public.unanswered_queries CASCADE;
DROP TABLE IF EXISTS public.user_analytics CASCADE;
DROP TABLE IF EXISTS public.document_chunks CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.system_analytics CASCADE;
DROP TABLE IF EXISTS public.admin_knowledge CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.surveys CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.user_status CASCADE;
DROP TYPE IF EXISTS public.query_status CASCADE;
DROP TYPE IF EXISTS public.message_sender CASCADE;
DROP TYPE IF EXISTS public.feedback_type CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- =============================================
-- SECTION 2: CREATE CUSTOM TYPES
-- =============================================

CREATE TYPE public.user_role AS ENUM ('admin', 'enumerator', 'supervisor', 'zo', 'ro');
CREATE TYPE public.user_status AS ENUM ('active', 'inactive');
CREATE TYPE public.query_status AS ENUM ('pending', 'answered', 'dismissed');
CREATE TYPE public.message_sender AS ENUM ('user', 'bot', 'admin');
CREATE TYPE public.feedback_type AS ENUM ('positive', 'negative');

-- =============================================
-- SECTION 3: CREATE UTILITY FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- SECTION 4: CREATE TABLES
-- =============================================

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role public.user_role NOT NULL DEFAULT 'enumerator',
  status public.user_status NOT NULL DEFAULT 'active',
  last_login timestamptz,
  raw_user_meta_data jsonb DEFAULT '{}',
  password_hash text,
  salt text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Surveys table
CREATE TABLE IF NOT EXISTS public.surveys (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  status text DEFAULT 'active',
  created_by uuid REFERENCES public.users(id),
  total_documents integer DEFAULT 0,
  total_queries integer DEFAULT 0,
  avg_satisfaction numeric(3,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Documents table
CREATE TABLE IF NOT EXISTS public.documents (
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
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS public.document_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  chunk_id uuid REFERENCES public.document_chunks(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  description text,
  image_type text DEFAULT 'document',
  data_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Admin knowledge table
CREATE TABLE IF NOT EXISTS public.admin_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_question text NOT NULL,
  admin_answer text NOT NULL,
  admin_answer_rich text,
  survey_id text REFERENCES public.surveys(id),
  images jsonb DEFAULT '[]',
  created_by uuid REFERENCES auth.users(id),
  feedback_score integer DEFAULT 0,
  times_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', original_question || ' ' || admin_answer)) STORED
);

-- Chat sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  content text NOT NULL,
  rich_content text,
  sender public.message_sender NOT NULL,
  feedback_type public.feedback_type,
  feedback_provided boolean DEFAULT false,
  alternative_attempts integer DEFAULT 0,
  original_query text,
  images jsonb DEFAULT '[]',
  processing_time interval,
  confidence_score numeric(3,2),
  created_at timestamptz DEFAULT now()
);

-- Unanswered queries table
CREATE TABLE IF NOT EXISTS public.unanswered_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  survey_id text,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  status public.query_status DEFAULT 'pending',
  priority integer DEFAULT 1,
  category text,
  tags text[] DEFAULT '{}',
  context jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  answered_at timestamptz,
  answered_by uuid REFERENCES public.users(id),
  answer_content text,
  answer_rich_content text,
  answer_images jsonb DEFAULT '[]'
);

-- User analytics table
CREATE TABLE IF NOT EXISTS public.user_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  survey_id text,
  date date DEFAULT CURRENT_DATE,
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
CREATE TABLE IF NOT EXISTS public.system_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date DEFAULT CURRENT_DATE UNIQUE,
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
-- SECTION 5: CREATE INDEXES
-- =============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login);
CREATE INDEX IF NOT EXISTS idx_users_email_password ON public.users(email, password_hash);

-- Surveys indexes
CREATE INDEX IF NOT EXISTS idx_surveys_status ON public.surveys(status);
CREATE INDEX IF NOT EXISTS idx_surveys_created_by ON public.surveys(created_by);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_survey_id ON public.documents(survey_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_is_admin_generated ON public.documents(is_admin_generated);

-- Document chunks indexes
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_is_admin_answer ON public.document_chunks(is_admin_answer);

-- Document images indexes
CREATE INDEX IF NOT EXISTS idx_document_images_document_id ON public.document_images(document_id);
CREATE INDEX IF NOT EXISTS idx_document_images_chunk_id ON public.document_images(chunk_id);

-- Admin knowledge indexes
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_survey_id ON public.admin_knowledge(survey_id);
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_created_by ON public.admin_knowledge(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_feedback_score ON public.admin_knowledge(feedback_score DESC);
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_times_used ON public.admin_knowledge(times_used DESC);
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_tsv ON public.admin_knowledge USING gin(tsv);

-- Chat sessions indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_survey_id ON public.chat_sessions(survey_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON public.chat_sessions(created_at);

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender);
CREATE INDEX IF NOT EXISTS idx_chat_messages_feedback_type ON public.chat_messages(feedback_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Unanswered queries indexes
CREATE INDEX IF NOT EXISTS idx_unanswered_queries_user_id ON public.unanswered_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_unanswered_queries_survey_id ON public.unanswered_queries(survey_id);
CREATE INDEX IF NOT EXISTS idx_unanswered_queries_status ON public.unanswered_queries(status);
CREATE INDEX IF NOT EXISTS idx_unanswered_queries_priority ON public.unanswered_queries(priority DESC);
CREATE INDEX IF NOT EXISTS idx_unanswered_queries_created_at ON public.unanswered_queries(created_at);

-- User analytics indexes
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON public.user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_survey_id ON public.user_analytics(survey_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_date ON public.user_analytics(date);

-- System analytics indexes
CREATE INDEX IF NOT EXISTS idx_system_analytics_date ON public.system_analytics(date);

-- =============================================
-- SECTION 6: CREATE TRIGGERS
-- =============================================

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON public.surveys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_chunks_updated_at BEFORE UPDATE ON public.document_chunks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_knowledge_updated_at BEFORE UPDATE ON public.admin_knowledge FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON public.chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_analytics_updated_at BEFORE UPDATE ON public.user_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_analytics_updated_at BEFORE UPDATE ON public.system_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SECTION 7: ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unanswered_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_analytics ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECTION 8: CREATE RLS POLICIES
-- =============================================

-- Allow all operations for anonymous and authenticated users (for demo purposes)
CREATE POLICY "Allow all operations for anonymous users" ON public.users FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.users FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON public.surveys FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.surveys FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON public.documents FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON public.document_chunks FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.document_chunks FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON public.document_images FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.document_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON public.admin_knowledge FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.admin_knowledge FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON public.chat_sessions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.chat_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON public.chat_messages FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.chat_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON public.unanswered_queries FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.unanswered_queries FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON public.user_analytics FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.user_analytics FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON public.system_analytics FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.system_analytics FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- SECTION 9: INSERT MOCK DATA
-- =============================================

-- Insert users (linking to auth.users by email)
INSERT INTO public.users (id, email, name, role, status, last_login, created_at, updated_at)
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
    WHEN au.email = 'admin@example.com' THEN 'admin'::public.user_role
    WHEN au.email = 'enum@example.com' THEN 'enumerator'::public.user_role
    WHEN au.email = 'super@example.com' THEN 'supervisor'::public.user_role
    WHEN au.email = 'zo@example.com' THEN 'zo'::public.user_role
    WHEN au.email = 'ro@example.com' THEN 'ro'::public.user_role
    ELSE 'enumerator'::public.user_role
  END as role,
  'active'::public.user_status,
  now() - interval '1 day',
  now() - interval '7 days',
  now()
FROM auth.users au
WHERE au.email IN ('admin@example.com', 'enum@example.com', 'super@example.com', 'zo@example.com', 'ro@example.com')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = now();

-- Insert surveys
INSERT INTO public.surveys (id, name, description, status, created_by, total_documents, total_queries, avg_satisfaction, created_at, updated_at) VALUES
('survey-1', 'Population Census Survey', 'National population census data collection', 'active', (SELECT id FROM public.users WHERE email = 'admin@example.com'), 15, 245, 4.2, now() - interval '30 days', now()),
('survey-2', 'Economic Household Survey', 'Household economic status survey', 'active', (SELECT id FROM public.users WHERE email = 'admin@example.com'), 12, 189, 4.1, now() - interval '25 days', now()),
('survey-3', 'Health and Nutrition Survey', 'Health and nutrition assessment', 'active', (SELECT id FROM public.users WHERE email = 'admin@example.com'), 8, 156, 4.3, now() - interval '20 days', now()),
('survey-4', 'Education Access Survey', 'Educational access and quality survey', 'active', (SELECT id FROM public.users WHERE email = 'admin@example.com'), 6, 98, 4.0, now() - interval '15 days', now()),
('survey-5', 'ASUSE Industry Survey', 'Industry and business survey', 'active', (SELECT id FROM public.users WHERE email = 'admin@example.com'), 10, 134, 4.2, now() - interval '10 days', now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = now();

-- Insert documents
INSERT INTO public.documents (id, file_name, survey_id, category, content, file_type, upload_date, processed_date, word_count, character_count, chunk_count, image_count, processing_method, is_admin_generated, user_id, created_at, updated_at) VALUES
('doc-1', 'Census Procedures Manual.pdf', 'survey-1', 'General Questions', 'CENSUS PROCEDURES MANUAL

=== INTRODUCTION ===
This manual provides comprehensive guidelines for conducting population census surveys. It covers all aspects of data collection, from initial planning to final reporting.

=== ENUMERATION PROCEDURES ===
Enumerators must follow these key steps:
1. Identify the household head
2. Complete the household roster
3. Ask questions in the prescribed order
4. Verify responses for consistency
5. Thank the respondent

=== DATA QUALITY ASSURANCE ===
Quality control measures include:
- Supervisor spot checks
- Real-time data validation
- Consistency checks across forms
- Follow-up interviews when needed

=== CAPI SYSTEM USAGE ===
The Computer Assisted Personal Interview (CAPI) system helps ensure data quality through:
- Automatic skip patterns
- Range checks for numeric fields
- Consistency validations
- GPS coordinate capture

=== COMMON ISSUES AND SOLUTIONS ===
Q: What if a respondent refuses to answer?
A: Explain the importance of the census and assure confidentiality. If they still refuse, mark as "refused" and move to the next household.

Q: How to handle incomplete households?
A: Make at least 3 attempts at different times. Document each attempt and reason for non-response.', 'application/pdf', now() - interval '5 days', now() - interval '5 days', 245, 1456, 3, 2, 'server-side-enhanced', false, (SELECT id FROM public.users WHERE email = 'admin@example.com'), now() - interval '5 days', now()),

('doc-2', 'Data Collection Guidelines.docx', 'survey-2', 'Detail Schedule', 'DATA COLLECTION GUIDELINES

=== HOUSEHOLD ECONOMIC SURVEY ===
This document outlines the procedures for collecting household economic data.

=== INCOME QUESTIONS ===
When asking about household income:
- Start with employment status of all members
- Ask about primary and secondary income sources
- Include government transfers and benefits
- Verify amounts and frequency

=== EXPENDITURE TRACKING ===
Record all household expenditures:
- Food and beverages
- Housing costs (rent, utilities)
- Transportation
- Healthcare
- Education
- Other goods and services

=== ASSET INVENTORY ===
Document household assets:
- Real estate properties
- Vehicles
- Financial assets (savings, investments)
- Durable goods (appliances, electronics)
- Livestock and agricultural equipment

=== VALIDATION PROCEDURES ===
Cross-check responses for consistency:
- Income should align with expenditure patterns
- Asset ownership should match reported wealth
- Employment status should match income sources', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', now() - interval '4 days', now() - interval '4 days', 189, 1123, 2, 1, 'client-side', false, (SELECT id FROM public.users WHERE email = 'enum@example.com'), now() - interval '4 days', now()),

('doc-3', 'Sample Forms.xlsx', 'survey-3', 'Listing', 'HEALTH AND NUTRITION SURVEY FORMS

=== SHEET: Demographic Information ===
Row 1: Household ID, Member ID, Name, Age, Gender, Relationship to Head
Row 2: HH001, M01, John Smith, 45, Male, Head
Row 3: HH001, M02, Mary Smith, 42, Female, Spouse
Row 4: HH001, M03, Tom Smith, 16, Male, Son

=== SHEET: Health Status ===
Row 1: Member ID, General Health, Chronic Conditions, Disability Status, Healthcare Access
Row 2: M01, Good, Diabetes, None, Yes
Row 3: M02, Excellent, None, None, Yes
Row 4: M03, Good, None, None, Yes

=== SHEET: Nutrition Data ===
Row 1: Member ID, Height (cm), Weight (kg), BMI, Dietary Restrictions, Food Security
Row 2: M01, 175, 80, 26.1, None, Secure
Row 3: M02, 165, 60, 22.0, Vegetarian, Secure
Row 4: M03, 170, 65, 22.5, None, Secure

=== SHEET: Immunization Records ===
Row 1: Member ID, Vaccination Status, Last Checkup, Preventive Care
Row 2: M01, Complete, 2023-06-15, Annual
Row 3: M02, Complete, 2023-08-20, Annual
Row 4: M03, Complete, 2023-09-10, Annual', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', now() - interval '3 days', now() - interval '3 days', 156, 934, 2, 0, 'server-side', false, (SELECT id FROM public.users WHERE email = 'super@example.com'), now() - interval '3 days', now()),

('doc-4', 'Training Manual.txt', 'survey-4', 'Additional Schedule', 'EDUCATION ACCESS SURVEY TRAINING MANUAL

=== SURVEY OBJECTIVES ===
The Education Access Survey aims to:
- Assess enrollment rates across different education levels
- Identify barriers to educational access
- Evaluate quality of educational services
- Measure learning outcomes

=== TARGET POPULATION ===
The survey covers:
- Children aged 3-18 years
- Parents and guardians
- School administrators
- Teachers and education staff

=== KEY INDICATORS ===
Primary indicators include:
- Net enrollment rates by level
- Dropout rates and reasons
- Distance to nearest school
- School infrastructure quality
- Teacher qualifications
- Learning achievement scores

=== INTERVIEW TECHNIQUES ===
Best practices for education surveys:
- Use age-appropriate language for children
- Ensure privacy for sensitive questions
- Verify school records when possible
- Ask about both formal and informal education

=== QUALITY CONTROL ===
Supervisors should:
- Observe at least 10% of interviews
- Check completed forms for consistency
- Verify GPS coordinates of schools
- Conduct callback interviews for 5% of households', 'text/plain', now() - interval '2 days', now() - interval '2 days', 198, 1187, 2, 0, 'client-side', false, (SELECT id FROM public.users WHERE email = 'zo@example.com'), now() - interval '2 days', now())
ON CONFLICT (id) DO NOTHING;

-- Insert document chunks
INSERT INTO public.document_chunks (id, document_id, content, section, keywords, entities, word_count, character_count, content_type, importance, is_admin_answer, feedback_score, times_used, created_at, updated_at) VALUES
('chunk-1', 'doc-1', 'ENUMERATION PROCEDURES: Enumerators must follow these key steps: 1. Identify the household head 2. Complete the household roster 3. Ask questions in the prescribed order 4. Verify responses for consistency 5. Thank the respondent', 'Enumeration Procedures', ARRAY['enumeration', 'procedures', 'household', 'roster', 'questions'], ARRAY['Enumerators', 'Steps'], 32, 245, 'procedure', 2.0, false, 5, 12, now() - interval '5 days', now()),

('chunk-2', 'doc-1', 'CAPI SYSTEM USAGE: The Computer Assisted Personal Interview (CAPI) system helps ensure data quality through: - Automatic skip patterns - Range checks for numeric fields - Consistency validations - GPS coordinate capture', 'CAPI System', ARRAY['capi', 'computer', 'interview', 'data', 'quality', 'validation'], ARRAY['CAPI', 'GPS'], 28, 198, 'definition', 2.5, false, 8, 18, now() - interval '5 days', now()),

('chunk-3', 'doc-2', 'INCOME QUESTIONS: When asking about household income: - Start with employment status of all members - Ask about primary and secondary income sources - Include government transfers and benefits - Verify amounts and frequency', 'Income Questions', ARRAY['income', 'employment', 'household', 'benefits', 'transfers'], ARRAY['Government'], 26, 187, 'procedure', 1.8, false, 3, 8, now() - interval '4 days', now()),

('chunk-4', 'doc-3', 'HEALTH STATUS DATA: Member ID, General Health, Chronic Conditions, Disability Status, Healthcare Access. Example: M01, Good, Diabetes, None, Yes', 'Health Status', ARRAY['health', 'chronic', 'conditions', 'disability', 'healthcare'], ARRAY['Diabetes'], 18, 134, 'data', 1.5, false, 2, 5, now() - interval '3 days', now()),

('chunk-5', 'doc-4', 'SURVEY OBJECTIVES: The Education Access Survey aims to: - Assess enrollment rates across different education levels - Identify barriers to educational access - Evaluate quality of educational services - Measure learning outcomes', 'Survey Objectives', ARRAY['education', 'enrollment', 'access', 'quality', 'learning'], ARRAY['Education Access Survey'], 24, 178, 'definition', 2.2, false, 6, 14, now() - interval '2 days', now()),

('chunk-6', 'doc-4', 'INTERVIEW TECHNIQUES: Best practices for education surveys: - Use age-appropriate language for children - Ensure privacy for sensitive questions - Verify school records when possible - Ask about both formal and informal education', 'Interview Techniques', ARRAY['interview', 'techniques', 'children', 'privacy', 'education'], ARRAY['School'], 22, 165, 'procedure', 1.9, false, 4, 9, now() - interval '2 days', now()),

('chunk-7', 'doc-1', 'COMMON ISSUES: Q: What if a respondent refuses to answer? A: Explain the importance of the census and assure confidentiality. If they still refuse, mark as "refused" and move to the next household.', 'Common Issues', ARRAY['respondent', 'refuses', 'confidentiality', 'census'], ARRAY['Census'], 28, 189, 'qa', 2.1, false, 7, 16, now() - interval '5 days', now())
ON CONFLICT (id) DO NOTHING;

-- Insert document images
INSERT INTO public.document_images (id, document_id, chunk_id, file_name, description, image_type, data_url, created_at) VALUES
('img-1', 'doc-1', 'chunk-1', 'Census Form Example', 'Sample census form showing household roster layout', 'form', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', now() - interval '5 days'),

('img-2', 'doc-1', 'chunk-2', 'CAPI System Interface', 'Screenshot of CAPI system showing data validation features', 'screenshot', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', now() - interval '5 days'),

('img-3', 'doc-2', 'chunk-3', 'Income Categories Chart', 'Visual breakdown of household income categories', 'chart', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', now() - interval '4 days')
ON CONFLICT (id) DO NOTHING;

-- Insert admin knowledge
INSERT INTO public.admin_knowledge (id, original_question, admin_answer, admin_answer_rich, survey_id, images, created_by, feedback_score, times_used, created_at, updated_at) VALUES
('admin-1', 'What is CAPI and how does it work?', 'CAPI stands for Computer Assisted Personal Interview. It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents. The system guides interviewers through the questionnaire, validates responses in real-time, and reduces data entry errors.', '<p><strong>CAPI</strong> stands for <em>Computer Assisted Personal Interview</em>.</p><p>It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents.</p><p>Key benefits include:</p><ul><li>Real-time data validation</li><li>Automatic skip patterns</li><li>Reduced data entry errors</li><li>GPS coordinate capture</li></ul>', 'survey-1', '[]', (SELECT id FROM auth.users WHERE email = 'admin@example.com'), 15, 25, now() - interval '10 days', now()),

('admin-2', 'How do I handle non-response in surveys?', 'Non-response should be handled systematically: 1) Make at least 3 attempts at different times of day, 2) Document each attempt with date, time, and reason, 3) Try different days of the week, 4) If still no response, classify as "not at home" or "refused" and move to replacement household if applicable.', '<div><h4>Handling Non-Response</h4><p>Follow these systematic steps:</p><ol><li><strong>Multiple Attempts:</strong> Make at least 3 attempts at different times of day</li><li><strong>Documentation:</strong> Record each attempt with date, time, and reason</li><li><strong>Timing Variation:</strong> Try different days of the week</li><li><strong>Final Classification:</strong> Mark as "not at home" or "refused"</li><li><strong>Replacement:</strong> Move to replacement household if applicable</li></ol><p><em>Remember:</em> Persistence is key, but respect respondent wishes.</p></div>', 'survey-1', '[]', (SELECT id FROM auth.users WHERE email = 'admin@example.com'), 12, 18, now() - interval '8 days', now()),

('admin-3', 'What are the key quality control measures?', 'Quality control measures include: Supervisor spot checks (minimum 10% of interviews), real-time data validation through CAPI system, consistency checks across related questions, callback interviews for verification (5% sample), GPS verification of interview locations, and daily data review meetings.', '<div><h4>Quality Control Measures</h4><table border="1" style="border-collapse: collapse; width: 100%;"><tr><th>Measure</th><th>Frequency</th><th>Purpose</th></tr><tr><td>Supervisor Spot Checks</td><td>10% minimum</td><td>Interview quality</td></tr><tr><td>Real-time Validation</td><td>Every interview</td><td>Data accuracy</td></tr><tr><td>Consistency Checks</td><td>Daily</td><td>Logical validation</td></tr><tr><td>Callback Interviews</td><td>5% sample</td><td>Verification</td></tr><tr><td>GPS Verification</td><td>All interviews</td><td>Location accuracy</td></tr></table></div>', 'survey-1', '[]', (SELECT id FROM auth.users WHERE email = 'admin@example.com'), 20, 32, now() - interval '6 days', now())
ON CONFLICT (id) DO NOTHING;

-- Insert chat sessions
INSERT INTO public.chat_sessions (id, user_id, survey_id, category, message_count, total_feedback_positive, total_feedback_negative, session_duration, created_at, updated_at) VALUES
('session-1', (SELECT id FROM public.users WHERE email = 'enum@example.com'), 'survey-1', 'General Questions', 4, 3, 1, '00:15:30', now() - interval '2 days', now()),
('session-2', (SELECT id FROM public.users WHERE email = 'super@example.com'), 'survey-2', 'Detail Schedule', 3, 2, 0, '00:08:45', now() - interval '1 day', now()),
('session-3', (SELECT id FROM public.users WHERE email = 'zo@example.com'), 'survey-3', 'Listing', 5, 4, 1, '00:12:20', now() - interval '6 hours', now()),
('session-4', (SELECT id FROM public.users WHERE email = 'ro@example.com'), 'survey-1', 'General Questions', 2, 1, 0, '00:05:15', now() - interval '2 hours', now())
ON CONFLICT (id) DO NOTHING;

-- Insert chat messages
INSERT INTO public.chat_messages (id, session_id, content, rich_content, sender, feedback_type, feedback_provided, alternative_attempts, original_query, images, processing_time, confidence_score, created_at) VALUES
('msg-1', 'session-1', 'What is CAPI?', NULL, 'user', NULL, false, 0, NULL, '[]', NULL, NULL, now() - interval '2 days'),
('msg-2', 'session-1', 'CAPI stands for Computer Assisted Personal Interview. It is a data collection method where trained interviewers use electronic devices to conduct face-to-face interviews.', '<p><strong>CAPI</strong> stands for <em>Computer Assisted Personal Interview</em>. It is a data collection method where trained interviewers use electronic devices to conduct face-to-face interviews.</p>', 'admin', 'positive', true, 0, 'What is CAPI?', '[]', '00:00:02', 0.95, now() - interval '2 days'),
('msg-3', 'session-1', 'How do I handle refusals?', NULL, 'user', NULL, false, 0, NULL, '[]', NULL, NULL, now() - interval '2 days'),
('msg-4', 'session-1', 'When handling refusals, explain the importance of the survey and assure confidentiality. If they still refuse, mark as "refused" and move to the next household.', '<p>When handling refusals:</p><ol><li>Explain the importance of the survey</li><li>Assure confidentiality</li><li>If they still refuse, mark as "refused"</li><li>Move to the next household</li></ol>', 'bot', 'positive', true, 0, 'How do I handle refusals?', '[]', '00:00:03', 0.88, now() - interval '2 days'),
('msg-5', 'session-2', 'What income sources should I ask about?', NULL, 'user', NULL, false, 0, NULL, '[]', NULL, NULL, now() - interval '1 day'),
('msg-6', 'session-2', 'Ask about primary and secondary income sources, including employment, government transfers, benefits, and any other regular income.', '<p>Ask about these income sources:</p><ul><li>Primary employment income</li><li>Secondary income sources</li><li>Government transfers and benefits</li><li>Any other regular income</li></ul>', 'bot', 'positive', true, 0, 'What income sources should I ask about?', '[]', '00:00:02', 0.92, now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

-- Insert unanswered queries
INSERT INTO public.unanswered_queries (id, content, survey_id, user_id, status, priority, category, tags, context, created_at) VALUES
('query-1', 'How do I handle households with multiple families?', 'survey-1', (SELECT id FROM public.users WHERE email = 'enum@example.com'), 'pending', 2, 'General Questions', ARRAY['household', 'multiple', 'families'], '{"survey_type": "census", "difficulty": "medium"}', now() - interval '3 days'),
('query-2', 'What if the GPS coordinates are not accurate?', 'survey-1', (SELECT id FROM public.users WHERE email = 'super@example.com'), 'pending', 1, 'General Questions', ARRAY['gps', 'coordinates', 'accuracy'], '{"survey_type": "census", "difficulty": "low"}', now() - interval '2 days'),
('query-3', 'How to calculate household expenditure totals?', 'survey-2', (SELECT id FROM public.users WHERE email = 'zo@example.com'), 'pending', 3, 'Detail Schedule', ARRAY['expenditure', 'calculation', 'totals'], '{"survey_type": "economic", "difficulty": "high"}', now() - interval '1 day'),
('query-4', 'What age groups are considered for immunization records?', 'survey-3', (SELECT id FROM public.users WHERE email = 'ro@example.com'), 'pending', 2, 'Listing', ARRAY['immunization', 'age', 'groups'], '{"survey_type": "health", "difficulty": "medium"}', now() - interval '6 hours')
ON CONFLICT (id) DO NOTHING;

-- Insert user analytics
INSERT INTO public.user_analytics (id, user_id, survey_id, date, queries_asked, queries_answered, positive_feedback, negative_feedback, session_duration, documents_uploaded, avg_response_time, unique_sessions, created_at, updated_at) VALUES
('analytics-1', (SELECT id FROM public.users WHERE email = 'enum@example.com'), 'survey-1', CURRENT_DATE - 2, 8, 7, 6, 1, '00:25:30', 1, '00:00:03', 2, now() - interval '2 days', now()),
('analytics-2', (SELECT id FROM public.users WHERE email = 'super@example.com'), 'survey-2', CURRENT_DATE - 1, 5, 5, 4, 0, '00:15:20', 1, '00:00:02', 1, now() - interval '1 day', now()),
('analytics-3', (SELECT id FROM public.users WHERE email = 'zo@example.com'), 'survey-3', CURRENT_DATE, 12, 10, 8, 2, '00:35:45', 2, '00:00:04', 3, now(), now()),
('analytics-4', (SELECT id FROM public.users WHERE email = 'ro@example.com'), 'survey-1', CURRENT_DATE, 3, 3, 2, 0, '00:08:15', 0, '00:00:02', 1, now(), now()),
('analytics-5', (SELECT id FROM public.users WHERE email = 'enum@example.com'), 'survey-2', CURRENT_DATE - 1, 6, 5, 4, 1, '00:18:30', 0, '00:00:03', 1, now() - interval '1 day', now()),
('analytics-6', (SELECT id FROM public.users WHERE email = 'admin@example.com'), 'survey-1', CURRENT_DATE, 15, 15, 12, 0, '01:05:20', 3, '00:00:01', 4, now(), now())
ON CONFLICT (user_id, survey_id, date) DO UPDATE SET
  queries_asked = EXCLUDED.queries_asked,
  queries_answered = EXCLUDED.queries_answered,
  updated_at = now();

-- Insert system analytics
INSERT INTO public.system_analytics (id, date, total_users, active_users, new_users, total_queries, answered_queries, unanswered_queries, avg_response_time, bot_efficiency, documents_processed, storage_used, top_surveys, user_satisfaction, created_at, updated_at) VALUES
('sys-1', CURRENT_DATE - 7, 5, 3, 1, 45, 42, 3, '00:00:03', 93.33, 8, 2048576, '[{"id": "survey-1", "queries": 25}, {"id": "survey-2", "queries": 12}]', 4.2, now() - interval '7 days', now()),
('sys-2', CURRENT_DATE - 6, 5, 4, 0, 52, 48, 4, '00:00:03', 92.31, 10, 2359296, '[{"id": "survey-1", "queries": 28}, {"id": "survey-3", "queries": 15}]', 4.1, now() - interval '6 days', now()),
('sys-3', CURRENT_DATE - 5, 5, 5, 0, 38, 35, 3, '00:00:02', 92.11, 12, 2621440, '[{"id": "survey-2", "queries": 20}, {"id": "survey-1", "queries": 18}]', 4.3, now() - interval '5 days', now()),
('sys-4', CURRENT_DATE - 4, 5, 3, 0, 41, 39, 2, '00:00:03', 95.12, 14, 2883584, '[{"id": "survey-1", "queries": 22}, {"id": "survey-4", "queries": 10}]', 4.0, now() - interval '4 days', now()),
('sys-5', CURRENT_DATE - 3, 5, 4, 0, 47, 44, 3, '00:00:02', 93.62, 15, 3145728, '[{"id": "survey-3", "queries": 25}, {"id": "survey-1", "queries": 15}]', 4.2, now() - interval '3 days', now()),
('sys-6', CURRENT_DATE - 2, 5, 5, 0, 55, 52, 3, '00:00:03', 94.55, 16, 3407872, '[{"id": "survey-1", "queries": 30}, {"id": "survey-2", "queries": 18}]', 4.4, now() - interval '2 days', now()),
('sys-7', CURRENT_DATE - 1, 5, 4, 0, 43, 41, 2, '00:00:02', 95.35, 17, 3670016, '[{"id": "survey-2", "queries": 22}, {"id": "survey-5", "queries": 12}]', 4.1, now() - interval '1 day', now()),
('sys-8', CURRENT_DATE, 5, 5, 0, 49, 45, 4, '00:00:03', 91.84, 18, 3932160, '[{"id": "survey-1", "queries": 25}, {"id": "survey-3", "queries": 16}]', 4.3, now(), now())
ON CONFLICT (date) DO UPDATE SET
  total_users = EXCLUDED.total_users,
  active_users = EXCLUDED.active_users,
  total_queries = EXCLUDED.total_queries,
  answered_queries = EXCLUDED.answered_queries,
  unanswered_queries = EXCLUDED.unanswered_queries,
  updated_at = now();

-- =============================================
-- SECTION 10: SUMMARY
-- =============================================

DO $$
DECLARE
    user_count INTEGER;
    survey_count INTEGER;
    document_count INTEGER;
    chunk_count INTEGER;
    image_count INTEGER;
    admin_count INTEGER;
    session_count INTEGER;
    message_count INTEGER;
    query_count INTEGER;
    user_analytics_count INTEGER;
    system_analytics_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.users;
    SELECT COUNT(*) INTO survey_count FROM public.surveys;
    SELECT COUNT(*) INTO document_count FROM public.documents;
    SELECT COUNT(*) INTO chunk_count FROM public.document_chunks;
    SELECT COUNT(*) INTO image_count FROM public.document_images;
    SELECT COUNT(*) INTO admin_count FROM public.admin_knowledge;
    SELECT COUNT(*) INTO session_count FROM public.chat_sessions;
    SELECT COUNT(*) INTO message_count FROM public.chat_messages;
    SELECT COUNT(*) INTO query_count FROM public.unanswered_queries;
    SELECT COUNT(*) INTO user_analytics_count FROM public.user_analytics;
    SELECT COUNT(*) INTO system_analytics_count FROM public.system_analytics;
    
    RAISE NOTICE '=== DATABASE SETUP COMPLETE ===';
    RAISE NOTICE 'Users: %', user_count;
    RAISE NOTICE 'Surveys: %', survey_count;
    RAISE NOTICE 'Documents: %', document_count;
    RAISE NOTICE 'Document Chunks: %', chunk_count;
    RAISE NOTICE 'Document Images: %', image_count;
    RAISE NOTICE 'Admin Knowledge: %', admin_count;
    RAISE NOTICE 'Chat Sessions: %', session_count;
    RAISE NOTICE 'Chat Messages: %', message_count;
    RAISE NOTICE 'Unanswered Queries: %', query_count;
    RAISE NOTICE 'User Analytics: %', user_analytics_count;
    RAISE NOTICE 'System Analytics: %', system_analytics_count;
    RAISE NOTICE '=== READY TO USE ===';
END $$;