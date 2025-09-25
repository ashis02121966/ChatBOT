/*
  # Insert Mock Data

  This migration populates the database with mock data for development and testing.
  
  ## Important Notes
  1. Before running this script, create users in Supabase Authentication dashboard:
     - admin@example.com (password: password123)
     - enum@example.com (password: password123)
     - super@example.com (password: password123)
     - zo@example.com (password: password123)
     - ro@example.com (password: password123)
  
  2. After creating auth users, update the UUIDs below with actual auth.users IDs
  
  ## Tables Populated
  - surveys
  - users (public.users - profiles)
  - documents
  - document_chunks
  - admin_knowledge
  - system_analytics
*/

-- Insert Surveys
INSERT INTO public.surveys (id, name, description, status, created_by, total_documents, total_queries, avg_satisfaction, created_at, updated_at) VALUES
('survey-1', 'Population Census Survey', 'National population census data collection', 'active', NULL, 0, 0, 0.00, now(), now()),
('survey-2', 'Economic Household Survey', 'Household economic status survey', 'active', NULL, 0, 0, 0.00, now(), now()),
('survey-3', 'Health and Nutrition Survey', 'Health and nutrition assessment', 'active', NULL, 0, 0, 0.00, now(), now()),
('survey-4', 'Education Access Survey', 'Educational access and quality survey', 'active', NULL, 0, 0, 0.00, now(), now()),
('survey-5', 'ASUSE Industry Survey', 'Industry and business survey', 'active', NULL, 0, 0, 0.00, now(), now());

-- Insert User Profiles (public.users)
-- IMPORTANT: Replace these UUIDs with actual auth.users IDs after creating users in Supabase Auth dashboard
INSERT INTO public.users (id, email, name, role, status, last_login, raw_user_meta_data, created_at, updated_at) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@example.com', 'Admin User', 'admin', 'active', now(), '{}', now(), now()),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'enum@example.com', 'John Enumerator', 'enumerator', 'active', now(), '{}', now(), now()),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'super@example.com', 'Jane Supervisor', 'supervisor', 'active', now(), '{}', now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'zo@example.com', 'ZO User', 'zo', 'active', now(), '{}', now(), now()),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'ro@example.com', 'RO User', 'ro', 'active', now(), '{}', now(), now())
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = now();

-- Insert Sample Documents
INSERT INTO public.documents (id, file_name, survey_id, category, content, file_type, upload_date, processed_date, word_count, character_count, chunk_count, image_count, processing_method, is_admin_generated, user_id, created_at, updated_at) VALUES
(gen_random_uuid(), 'Census Procedures Manual.pdf', 'survey-1', 'General Questions', 'This is a comprehensive guide for census procedures. It covers enumeration methods, data collection protocols, and quality assurance measures. The manual provides step-by-step instructions for enumerators conducting household interviews and completing census forms.', 'application/pdf', now(), now(), 150, 800, 3, 0, 'mock-data', false, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', now(), now()),
(gen_random_uuid(), 'Data Collection Guidelines.docx', 'survey-2', 'Detail Schedule', 'Guidelines for economic data collection including household income surveys, expenditure tracking, and employment status documentation. This document outlines the proper procedures for collecting sensitive financial information while maintaining respondent privacy.', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', now(), now(), 120, 650, 2, 0, 'mock-data', false, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', now(), now()),
(gen_random_uuid(), 'Health Survey Forms.xlsx', 'survey-3', 'Listing', 'Sample forms and templates for health and nutrition surveys. Includes anthropometric measurement procedures, dietary assessment questionnaires, and health status evaluation forms for different age groups.', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', now(), now(), 200, 1000, 4, 0, 'mock-data', false, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', now(), now());

-- Insert Sample Document Chunks
-- Note: These will be linked to the documents above via document_id
WITH doc_ids AS (
    SELECT id, file_name FROM public.documents WHERE processing_method = 'mock-data'
)
INSERT INTO public.document_chunks (id, document_id, content, section, keywords, entities, word_count, character_count, content_type, importance, is_admin_answer, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    d.id,
    CASE 
        WHEN d.file_name LIKE '%Census%' THEN 'Census enumeration involves systematic data collection from all households in designated areas. Enumerators must follow standardized procedures to ensure data quality and completeness.'
        WHEN d.file_name LIKE '%Data Collection%' THEN 'Economic surveys require careful attention to income and expenditure categories. Respondents should be assured of data confidentiality and proper use of collected information.'
        WHEN d.file_name LIKE '%Health%' THEN 'Health surveys include anthropometric measurements, dietary assessments, and health status evaluations. Proper training is essential for accurate data collection.'
        ELSE 'General survey procedures and guidelines for data collection activities.'
    END,
    'Section 1',
    CASE 
        WHEN d.file_name LIKE '%Census%' THEN ARRAY['census', 'enumeration', 'household', 'data', 'collection']
        WHEN d.file_name LIKE '%Data Collection%' THEN ARRAY['economic', 'income', 'expenditure', 'survey', 'financial']
        WHEN d.file_name LIKE '%Health%' THEN ARRAY['health', 'nutrition', 'anthropometric', 'dietary', 'assessment']
        ELSE ARRAY['survey', 'data', 'collection', 'procedures']
    END,
    ARRAY['Survey', 'Data', 'Collection'],
    50,
    250,
    'procedure',
    1.5,
    false,
    now(),
    now()
FROM doc_ids d;

-- Insert Sample Admin Knowledge
INSERT INTO public.admin_knowledge (id, original_question, admin_answer, admin_answer_rich, survey_id, images, created_by, feedback_score, times_used, created_at, updated_at) VALUES
(gen_random_uuid(), 'What is CAPI and how is it used in surveys?', 'CAPI stands for Computer Assisted Personal Interview. It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents. The system guides interviewers through the questionnaire, validates responses in real-time, and reduces data entry errors.', '<p>CAPI stands for <strong>Computer Assisted Personal Interview</strong>. It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents.</p><p>Key benefits include:</p><ul><li>Real-time data validation</li><li>Reduced data entry errors</li><li>Automated skip patterns</li><li>Improved data quality</li></ul>', 'survey-1', '[]', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 0, 0, now(), now()),
(gen_random_uuid(), 'How do I handle non-response in household surveys?', 'Non-response in household surveys should be handled systematically. First, make multiple contact attempts at different times of day. Document all contact attempts and reasons for non-response. For refusals, try to understand concerns and provide reassurance about data confidentiality. If household is temporarily absent, schedule return visits. Always follow your survey protocol for maximum number of attempts before classifying as non-response.', '<p>Non-response in household surveys should be handled systematically:</p><ol><li><strong>Multiple Contact Attempts</strong>: Make attempts at different times of day and days of the week</li><li><strong>Documentation</strong>: Record all contact attempts and reasons for non-response</li><li><strong>Handle Refusals</strong>: Address concerns and provide reassurance about data confidentiality</li><li><strong>Temporary Absence</strong>: Schedule return visits for households that are temporarily away</li><li><strong>Follow Protocol</strong>: Adhere to survey guidelines for maximum attempts before final classification</li></ol>', 'survey-2', '[]', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 0, 0, now(), now());

-- Insert Sample System Analytics
INSERT INTO public.system_analytics (id, date, total_users, active_users, new_users, total_queries, answered_queries, unanswered_queries, avg_response_time, bot_efficiency, documents_processed, storage_used, top_surveys, user_satisfaction, created_at, updated_at) VALUES
(gen_random_uuid(), CURRENT_DATE, 5, 3, 2, 25, 22, 3, '00:02:30', 88.00, 3, 1024000, '[{"survey_id": "survey-1", "name": "Population Census Survey", "queries": 10}, {"survey_id": "survey-2", "name": "Economic Household Survey", "queries": 8}]', 4.2, now(), now()),
(gen_random_uuid(), CURRENT_DATE - INTERVAL '1 day', 5, 4, 1, 18, 16, 2, '00:02:15', 89.00, 2, 512000, '[{"survey_id": "survey-1", "name": "Population Census Survey", "queries": 8}, {"survey_id": "survey-3", "name": "Health and Nutrition Survey", "queries": 6}]', 4.1, now(), now());

-- Update survey statistics
UPDATE public.surveys SET 
    total_documents = (SELECT COUNT(*) FROM public.documents WHERE survey_id = surveys.id),
    total_queries = CASE 
        WHEN id = 'survey-1' THEN 18
        WHEN id = 'survey-2' THEN 8
        WHEN id = 'survey-3' THEN 6
        ELSE 0
    END,
    avg_satisfaction = CASE 
        WHEN id = 'survey-1' THEN 4.2
        WHEN id = 'survey-2' THEN 4.0
        WHEN id = 'survey-3' THEN 4.3
        ELSE 0.0
    END,
    updated_at = now();

-- Confirmation message
DO $$
BEGIN
    RAISE NOTICE 'Mock data has been successfully inserted into the database.';
    RAISE NOTICE 'Remember to:';
    RAISE NOTICE '1. Create corresponding users in Supabase Authentication dashboard';
    RAISE NOTICE '2. Update the UUIDs in public.users with actual auth.users IDs';
    RAISE NOTICE '3. Test authentication with the demo credentials';
END $$;