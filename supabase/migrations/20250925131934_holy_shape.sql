/*
  # Insert Comprehensive Mock Data for Survey ChatBot

  This script inserts realistic mock data into all application tables.
  
  Prerequisites:
  1. Database schema must be created first (run create_survey_chatbot_schema.sql)
  2. Authentication users must be created in Supabase Auth dashboard:
     - admin@example.com (password: password123)
     - enum@example.com (password: password123)
     - super@example.com (password: password123)
     - zo@example.com (password: password123)
     - ro@example.com (password: password123)

  This script will:
  1. Clear existing data from all tables
  2. Insert users linked to auth.users by email
  3. Insert surveys with realistic data
  4. Insert documents with processed content
  5. Insert document chunks with metadata
  6. Insert document images
  7. Insert admin knowledge base entries
  8. Insert chat sessions and messages
  9. Insert unanswered queries
  10. Insert analytics data
*/

-- Clear existing data (in correct order to handle foreign keys)
TRUNCATE TABLE document_images CASCADE;
TRUNCATE TABLE document_chunks CASCADE;
TRUNCATE TABLE documents CASCADE;
TRUNCATE TABLE chat_messages CASCADE;
TRUNCATE TABLE chat_sessions CASCADE;
TRUNCATE TABLE unanswered_queries CASCADE;
TRUNCATE TABLE user_analytics CASCADE;
TRUNCATE TABLE system_analytics CASCADE;
TRUNCATE TABLE admin_knowledge CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE surveys CASCADE;

-- Insert users (linking to auth.users by email)
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
  'active'::user_status as status,
  now() - interval '30 days' as created_at,
  now() as updated_at
FROM auth.users au
WHERE au.email IN ('admin@example.com', 'enum@example.com', 'super@example.com', 'zo@example.com', 'ro@example.com');

-- Insert surveys
INSERT INTO surveys (id, name, description, status, created_by, total_documents, total_queries, avg_satisfaction, created_at, updated_at)
SELECT 
  'survey-' || generate_random_uuid()::text,
  survey_name,
  survey_description,
  'active',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  survey_docs,
  survey_queries,
  survey_satisfaction,
  now() - interval '60 days',
  now()
FROM (VALUES
  ('Population Census Survey', 'National population census data collection and enumeration procedures', 15, 456, 4.2),
  ('Economic Household Survey', 'Household economic status and income assessment survey', 12, 324, 4.0),
  ('Health and Nutrition Survey', 'Health status and nutritional assessment of population', 8, 287, 4.1),
  ('Education Access Survey', 'Educational access and quality assessment survey', 6, 178, 3.9),
  ('ASUSE Industry Survey', 'Annual Survey of Unorganized Sector Enterprises', 10, 203, 4.3)
) AS survey_data(survey_name, survey_description, survey_docs, survey_queries, survey_satisfaction);

-- Get survey IDs for use in other inserts
CREATE TEMP TABLE temp_surveys AS 
SELECT id, name FROM surveys;

-- Insert documents with realistic content
INSERT INTO documents (id, file_name, survey_id, category, content, file_type, upload_date, processed_date, word_count, character_count, chunk_count, image_count, processing_method, is_admin_generated, user_id, created_at, updated_at)
SELECT 
  generate_random_uuid(),
  doc_name,
  ts.id,
  doc_category,
  doc_content,
  doc_type,
  now() - interval '20 days',
  now() - interval '20 days',
  array_length(string_to_array(doc_content, ' '), 1),
  length(doc_content),
  doc_chunks,
  doc_images,
  'server-side-enhanced',
  false,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  now() - interval '20 days',
  now() - interval '20 days'
FROM temp_surveys ts
CROSS JOIN (VALUES
  ('Census Procedures Manual.pdf', 'General Questions', 'application/pdf', 
   'This comprehensive manual outlines the procedures for conducting population census enumeration. It covers household identification, respondent selection, interview techniques, and data quality assurance. Enumerators must follow standardized protocols to ensure consistent data collection across all enumeration areas. The manual includes detailed instructions for handling non-response situations, proxy interviews, and special populations. Quality control measures include supervisor checks, re-interviews, and data validation procedures.', 3, 2),
  ('Data Collection Guidelines.docx', 'Detail Schedule', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
   'Data collection guidelines provide step-by-step instructions for field workers. The process begins with area mapping and household listing. Each household must be visited according to the prescribed schedule. Interview protocols specify question sequencing, skip patterns, and response validation. Special attention is required for sensitive questions about income, health status, and personal information. Confidentiality and privacy protection are paramount throughout the data collection process.', 4, 1),
  ('Sample Forms and Templates.xlsx', 'Listing', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
   'This workbook contains all standardized forms and templates used in the survey. Sheet 1: Household Listing Form with columns for address, head of household, family size, and contact information. Sheet 2: Individual Questionnaire covering demographics, education, employment, and health. Sheet 3: Economic Module for income, expenditure, and asset information. Sheet 4: Quality Control Checklist for supervisors. All forms include built-in validation rules and skip logic.', 2, 3)
) AS doc_data(doc_name, doc_category, doc_type, doc_content, doc_chunks, doc_images)
WHERE ts.name LIKE '%Census%' OR ts.name LIKE '%Economic%' OR ts.name LIKE '%Health%';

-- Insert document chunks with enhanced metadata
INSERT INTO document_chunks (id, document_id, content, section, keywords, entities, word_count, character_count, content_type, importance, is_admin_answer, original_question, admin_answer, admin_answer_rich, feedback_score, times_used, correct_feedback_count, incorrect_feedback_count, last_used, date_answered, created_at, updated_at)
SELECT 
  generate_random_uuid(),
  d.id,
  chunk_content,
  chunk_section,
  chunk_keywords,
  chunk_entities,
  array_length(string_to_array(chunk_content, ' '), 1),
  length(chunk_content),
  chunk_type,
  chunk_importance,
  false,
  null,
  null,
  null,
  0,
  0,
  0,
  0,
  null,
  null,
  now() - interval '20 days',
  now() - interval '20 days'
FROM documents d
CROSS JOIN (VALUES
  ('Household identification procedures require systematic approach. Each dwelling unit must be clearly marked and numbered according to the prescribed format. GPS coordinates should be recorded for verification purposes.', 'Household Identification', ARRAY['household', 'identification', 'GPS', 'dwelling'], ARRAY['GPS', 'coordinates'], 'procedure', 1.5),
  ('Interview techniques emphasize building rapport with respondents. Maintain professional demeanor while being approachable. Explain the purpose of the survey and ensure confidentiality. Use neutral language and avoid leading questions.', 'Interview Techniques', ARRAY['interview', 'rapport', 'confidentiality', 'neutral'], ARRAY['respondents'], 'procedure', 1.8),
  ('Data quality assurance involves multiple validation steps. Check for completeness, consistency, and logical relationships between responses. Flag unusual values for supervisor review. Conduct spot checks on 10% of completed interviews.', 'Quality Assurance', ARRAY['quality', 'validation', 'consistency', 'review'], ARRAY['supervisor'], 'procedure', 2.0),
  ('Non-response situations require specific protocols. Make at least three attempts at different times of day. Document reasons for non-response. Obtain proxy information when direct interview is not possible.', 'Non-Response Handling', ARRAY['non-response', 'proxy', 'attempts', 'protocol'], ARRAY['proxy'], 'procedure', 1.6)
) AS chunk_data(chunk_content, chunk_section, chunk_keywords, chunk_entities, chunk_type, chunk_importance)
LIMIT 20;

-- Insert document images
INSERT INTO document_images (id, document_id, chunk_id, file_name, description, image_type, data_url, created_at)
SELECT 
  generate_random_uuid(),
  d.id,
  dc.id,
  img_name,
  img_description,
  img_type,
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  now() - interval '20 days'
FROM documents d
JOIN document_chunks dc ON dc.document_id = d.id
CROSS JOIN (VALUES
  ('Household Listing Form Sample', 'Sample household listing form showing proper completion', 'form'),
  ('Interview Process Flowchart', 'Flowchart showing the complete interview process from start to finish', 'flowchart'),
  ('Data Validation Checklist', 'Visual checklist for data validation procedures', 'checklist'),
  ('GPS Coordinate Recording', 'Screenshot showing proper GPS coordinate recording in mobile device', 'screenshot')
) AS img_data(img_name, img_description, img_type)
LIMIT 15;

-- Insert admin knowledge base entries
INSERT INTO admin_knowledge (id, original_question, admin_answer, admin_answer_rich, survey_id, images, created_by, feedback_score, times_used, created_at, updated_at, tsv)
SELECT 
  generate_random_uuid(),
  qa_question,
  qa_answer,
  qa_rich_answer,
  (SELECT id FROM temp_surveys LIMIT 1),
  '[]'::jsonb,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  FLOOR(RANDOM() * 10)::integer,
  FLOOR(RANDOM() * 50)::integer,
  now() - interval '15 days',
  now() - interval '1 day',
  to_tsvector('english', qa_question || ' ' || qa_answer)
FROM (VALUES
  ('What is CAPI and how is it used in surveys?', 
   'CAPI stands for Computer Assisted Personal Interview. It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents.',
   '<p><strong>CAPI (Computer Assisted Personal Interview)</strong> is a modern data collection method that offers several advantages:</p><ul><li>Real-time data validation and skip logic</li><li>Reduced data entry errors</li><li>Automatic backup and synchronization</li><li>GPS location tracking</li><li>Multimedia support for complex questions</li></ul><p>CAPI systems guide interviewers through questionnaires, ensuring consistency and completeness.</p>'),
  
  ('How do I handle non-response situations during enumeration?', 
   'Non-response situations require systematic approach: Make at least 3 attempts at different times, document reasons for non-response, seek proxy information when appropriate, and follow up with supervisors for guidance.',
   '<p><strong>Non-Response Protocol:</strong></p><ol><li><strong>Multiple Attempts:</strong> Visit at least 3 times at different times of day</li><li><strong>Documentation:</strong> Record date, time, and reason for each attempt</li><li><strong>Proxy Interviews:</strong> When direct interview impossible, seek reliable proxy</li><li><strong>Supervisor Consultation:</strong> Report persistent non-response cases</li><li><strong>Final Classification:</strong> Categorize as refusal, not-at-home, or unable to respond</li></ol>'),
  
  ('What are the quality control measures for data collection?', 
   'Quality control includes supervisor spot checks on 10% of interviews, real-time data validation, consistency checks, re-interviews for verification, and regular training updates for field staff.',
   '<p><strong>Quality Control Framework:</strong></p><div style="background: #f0f8ff; padding: 15px; border-left: 4px solid #0066cc; margin: 10px 0;"><h4>Primary Measures:</h4><ul><li>Supervisor spot checks (10% of interviews)</li><li>Real-time validation during data entry</li><li>Consistency checks across related questions</li><li>Random re-interviews (5% sample)</li></ul></div><div style="background: #f0fff0; padding: 15px; border-left: 4px solid #00cc66; margin: 10px 0;"><h4>Secondary Measures:</h4><ul><li>Regular training refreshers</li><li>Performance monitoring dashboards</li><li>Error rate tracking by enumerator</li><li>Feedback sessions with field teams</li></ul></div>'),
  
  ('How do I properly complete the household listing form?', 
   'Complete household listing systematically: Record accurate address, list all household members, assign unique IDs, verify contact information, and ensure all mandatory fields are filled before submission.',
   '<p><strong>Household Listing Procedure:</strong></p><table style="border-collapse: collapse; width: 100%; margin: 10px 0;"><tr style="background: #f5f5f5;"><th style="border: 1px solid #ddd; padding: 8px;">Step</th><th style="border: 1px solid #ddd; padding: 8px;">Action</th><th style="border: 1px solid #ddd; padding: 8px;">Validation</th></tr><tr><td style="border: 1px solid #ddd; padding: 8px;">1</td><td style="border: 1px solid #ddd; padding: 8px;">Record complete address with landmarks</td><td style="border: 1px solid #ddd; padding: 8px;">GPS coordinates mandatory</td></tr><tr><td style="border: 1px solid #ddd; padding: 8px;">2</td><td style="border: 1px solid #ddd; padding: 8px;">List all usual residents</td><td style="border: 1px solid #ddd; padding: 8px;">Cross-check with neighbors</td></tr><tr><td style="border: 1px solid #ddd; padding: 8px;">3</td><td style="border: 1px solid #ddd; padding: 8px;">Assign household ID</td><td style="border: 1px solid #ddd; padding: 8px;">Follow numbering sequence</td></tr><tr><td style="border: 1px solid #ddd; padding: 8px;">4</td><td style="border: 1px solid #ddd; padding: 8px;">Verify contact details</td><td style="border: 1px solid #ddd; padding: 8px;">Test phone numbers</td></tr></table>')
) AS qa_data(qa_question, qa_answer, qa_rich_answer);

-- Insert chat sessions
INSERT INTO chat_sessions (id, user_id, survey_id, category, message_count, total_feedback_positive, total_feedback_negative, session_duration, created_at, updated_at)
SELECT 
  generate_random_uuid(),
  u.id,
  ts.id,
  session_category,
  session_msg_count,
  session_positive,
  session_negative,
  (session_msg_count * interval '2 minutes'),
  now() - interval '10 days' + (random() * interval '10 days'),
  now() - interval '1 day' + (random() * interval '1 day')
FROM users u
CROSS JOIN temp_surveys ts
CROSS JOIN (VALUES
  ('General Questions', 8, 6, 2),
  ('Detail Schedule', 12, 9, 3),
  ('Listing', 6, 5, 1),
  ('Additional Schedule', 4, 3, 1)
) AS session_data(session_category, session_msg_count, session_positive, session_negative)
WHERE u.role != 'admin'
LIMIT 15;

-- Insert chat messages
INSERT INTO chat_messages (id, session_id, content, rich_content, sender, feedback_type, feedback_provided, alternative_attempts, original_query, images, processing_time, confidence_score, created_at)
SELECT 
  generate_random_uuid(),
  cs.id,
  msg_content,
  msg_rich_content,
  msg_sender,
  CASE WHEN random() > 0.7 THEN (ARRAY['positive', 'negative'])[floor(random() * 2 + 1)]::feedback_type ELSE null END,
  random() > 0.3,
  CASE WHEN random() > 0.9 THEN floor(random() * 3)::integer ELSE 0 END,
  CASE WHEN msg_sender = 'user' THEN msg_content ELSE null END,
  CASE WHEN random() > 0.8 THEN '[{"id": "img1", "fileName": "sample.png", "description": "Sample image", "dataUrl": "data:image/png;base64,sample", "type": "diagram"}]'::jsonb ELSE '[]'::jsonb END,
  (random() * interval '5 seconds'),
  (random() * 0.5 + 0.5)::numeric(3,2),
  cs.created_at + (random() * interval '1 hour')
FROM chat_sessions cs
CROSS JOIN (VALUES
  ('What is the procedure for household enumeration?', null, 'user'),
  ('Household enumeration follows a systematic approach. First, identify the dwelling unit and record GPS coordinates. Then list all usual residents and assign unique household ID. Complete the listing form with accurate contact information.', '<p><strong>Household Enumeration Procedure:</strong></p><ol><li>Identify and mark dwelling unit</li><li>Record GPS coordinates</li><li>List all usual residents</li><li>Assign unique household ID</li><li>Complete listing form</li></ol>', 'bot'),
  ('How do I handle refusal cases?', null, 'user'),
  ('For refusal cases, document the reason and attempt to build rapport. Explain the survey importance and confidentiality measures. If refusal persists, inform your supervisor and follow the non-response protocol.', '<p><strong>Refusal Handling:</strong></p><ul><li>Document refusal reason</li><li>Attempt rapport building</li><li>Explain survey importance</li><li>Ensure confidentiality</li><li>Follow non-response protocol</li></ul>', 'admin')
) AS msg_data(msg_content, msg_rich_content, msg_sender)
LIMIT 50;

-- Insert unanswered queries
INSERT INTO unanswered_queries (id, content, survey_id, user_id, status, priority, category, tags, context, created_at, answered_at, answered_by, answer_content, answer_rich_content, answer_images)
SELECT 
  generate_random_uuid(),
  query_content,
  ts.id,
  u.id,
  'pending'::query_status,
  query_priority,
  query_category,
  query_tags,
  query_context,
  now() - interval '5 days' + (random() * interval '5 days'),
  null,
  null,
  null,
  null,
  '[]'::jsonb
FROM users u
CROSS JOIN temp_surveys ts
CROSS JOIN (VALUES
  ('How do I handle incomplete questionnaires in CAPI system?', 2, 'General Questions', ARRAY['capi', 'incomplete', 'questionnaire'], '{"device": "tablet", "survey_type": "household"}'),
  ('What is the protocol for interviewing elderly respondents?', 1, 'Detail Schedule', ARRAY['elderly', 'interview', 'protocol'], '{"age_group": "65+", "special_needs": true}'),
  ('How to resolve GPS coordinate errors in remote areas?', 3, 'Listing', ARRAY['gps', 'remote', 'coordinates'], '{"location": "rural", "connectivity": "poor"}'),
  ('What are the backup procedures if tablet battery dies during interview?', 2, 'General Questions', ARRAY['backup', 'tablet', 'battery'], '{"device_issue": "power", "interview_status": "ongoing"}')
) AS query_data(query_content, query_priority, query_category, query_tags, query_context)
WHERE u.role != 'admin'
LIMIT 10;

-- Insert user analytics
INSERT INTO user_analytics (id, user_id, survey_id, date, queries_asked, queries_answered, positive_feedback, negative_feedback, session_duration, documents_uploaded, avg_response_time, unique_sessions, created_at, updated_at)
SELECT 
  generate_random_uuid(),
  u.id,
  ts.id,
  current_date - (random() * 30)::integer,
  floor(random() * 20 + 5)::integer,
  floor(random() * 18 + 3)::integer,
  floor(random() * 15 + 2)::integer,
  floor(random() * 5)::integer,
  (random() * interval '2 hours' + interval '30 minutes'),
  floor(random() * 3)::integer,
  (random() * interval '30 seconds' + interval '1 minute'),
  floor(random() * 5 + 1)::integer,
  now() - interval '1 day',
  now()
FROM users u
CROSS JOIN temp_surveys ts
WHERE u.role != 'admin'
LIMIT 25;

-- Insert system analytics
INSERT INTO system_analytics (id, date, total_users, active_users, new_users, total_queries, answered_queries, unanswered_queries, avg_response_time, bot_efficiency, documents_processed, storage_used, top_surveys, user_satisfaction, created_at, updated_at)
SELECT 
  generate_random_uuid(),
  current_date - generate_series(0, 29),
  floor(random() * 50 + 100)::integer,
  floor(random() * 30 + 20)::integer,
  floor(random() * 5 + 1)::integer,
  floor(random() * 200 + 50)::integer,
  floor(random() * 180 + 40)::integer,
  floor(random() * 20 + 5)::integer,
  (random() * interval '2 minutes' + interval '30 seconds'),
  (random() * 20 + 75)::numeric(5,2),
  floor(random() * 10 + 5)::integer,
  floor(random() * 1000000 + 500000)::bigint,
  '[{"survey": "Population Census", "queries": 156}, {"survey": "Economic Household", "queries": 98}]'::jsonb,
  (random() * 1.5 + 3.5)::numeric(3,2),
  now() - interval '1 day',
  now();

-- Clean up temporary table
DROP TABLE temp_surveys;

-- Update sequences to avoid conflicts
SELECT setval('users_id_seq', (SELECT MAX(id::text)::bigint FROM users WHERE id::text ~ '^[0-9]+$') + 1, false);

-- Verify data insertion
DO $$
DECLARE
    table_counts TEXT := '';
BEGIN
    SELECT string_agg(format('%s: %s', table_name, row_count), E'\n')
    INTO table_counts
    FROM (
        SELECT 'users' as table_name, count(*) as row_count FROM users
        UNION ALL SELECT 'surveys', count(*) FROM surveys
        UNION ALL SELECT 'documents', count(*) FROM documents
        UNION ALL SELECT 'document_chunks', count(*) FROM document_chunks
        UNION ALL SELECT 'document_images', count(*) FROM document_images
        UNION ALL SELECT 'admin_knowledge', count(*) FROM admin_knowledge
        UNION ALL SELECT 'chat_sessions', count(*) FROM chat_sessions
        UNION ALL SELECT 'chat_messages', count(*) FROM chat_messages
        UNION ALL SELECT 'unanswered_queries', count(*) FROM unanswered_queries
        UNION ALL SELECT 'user_analytics', count(*) FROM user_analytics
        UNION ALL SELECT 'system_analytics', count(*) FROM system_analytics
    ) counts;
    
    RAISE NOTICE E'Mock data insertion completed successfully!\n\nTable row counts:\n%', table_counts;
END $$;