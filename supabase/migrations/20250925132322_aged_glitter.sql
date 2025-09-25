@@ .. @@
 /*
-  # Clear existing data and insert comprehensive mock data
+  # Insert comprehensive mock data into Supabase tables
 
   1. Mock Data Includes
     - Users linked to auth.users by email
@@ .. @@
     - System analytics with performance metrics
 
   2. Prerequisites
-    - Ensure auth.users contains the demo users (create via Supabase Dashboard)
+    - Create auth.users via Supabase Dashboard first:
+      * admin@example.com (password: password123)
+      * enum@example.com (password: password123) 
+      * super@example.com (password: password123)
+      * zo@example.com (password: password123)
+      * ro@example.com (password: password123)
 
-  3. Safety
-    - Uses TRUNCATE CASCADE to safely clear all data
-    - Automatically links users by email to auth.users
+  3. Features
+    - Uses ON CONFLICT to handle existing data safely
+    - Automatically links users by email to auth.users
+    - Inserts realistic survey, document, and chat data
 */
 
--- Clear all existing data (CASCADE handles foreign key dependencies)
-TRUNCATE TABLE public.system_analytics CASCADE;
-TRUNCATE TABLE public.user_analytics CASCADE;
-TRUNCATE TABLE public.unanswered_queries CASCADE;
-TRUNCATE TABLE public.chat_messages CASCADE;
-TRUNCATE TABLE public.chat_sessions CASCADE;
-TRUNCATE TABLE public.admin_knowledge CASCADE;
-TRUNCATE TABLE public.document_images CASCADE;
-TRUNCATE TABLE public.document_chunks CASCADE;
-TRUNCATE TABLE public.documents CASCADE;
-TRUNCATE TABLE public.surveys CASCADE;
-TRUNCATE TABLE public.users CASCADE;
-
-DO $$
-BEGIN
-    RAISE NOTICE 'All existing data cleared successfully';
-END $$;
-
 -- Insert Users (linked to auth.users by email)
-INSERT INTO public.users (id, email, name, role, status, created_at, updated_at) 
+INSERT INTO public.users (id, email, name, role, status, created_at, updated_at)
 SELECT 
     au.id,
     au.email,
@@ .. @@
     ('zo@example.com', 'ZO User', 'zo'),
     ('ro@example.com', 'RO User', 'ro')
 ) AS mock_users(email, name, role)
-JOIN auth.users au ON au.email = mock_users.email;
+JOIN auth.users au ON au.email = mock_users.email
+ON CONFLICT (email) DO UPDATE SET
+    name = EXCLUDED.name,
+    role = EXCLUDED.role,
+    status = EXCLUDED.status,
+    updated_at = now();
 
 -- Insert Surveys
-INSERT INTO public.surveys (id, name, description, status, created_by, total_documents, total_queries, avg_satisfaction, created_at, updated_at) VALUES
+INSERT INTO public.surveys (id, name, description, status, created_by, total_documents, total_queries, avg_satisfaction, created_at, updated_at) 
+SELECT 
+    survey_data.id,
+    survey_data.name,
+    survey_data.description,
+    survey_data.status,
+    u.id,
+    survey_data.total_documents,
+    survey_data.total_queries,
+    survey_data.avg_satisfaction,
+    survey_data.created_at,
+    survey_data.updated_at
+FROM (VALUES
     ('survey-1', 'Population Census Survey', 'National population census data collection with comprehensive demographic analysis', 'active', 15, 456, 4.2, now() - interval '30 days', now()),
     ('survey-2', 'Economic Household Survey', 'Household economic status and income distribution survey', 'active', 12, 324, 4.0, now() - interval '25 days', now()),
     ('survey-3', 'Health and Nutrition Survey', 'Health status and nutritional assessment of population', 'active', 8, 287, 4.3, now() - interval '20 days', now()),
     ('survey-4', 'Education Access Survey', 'Educational access and quality assessment survey', 'active', 6, 178, 4.1, now() - interval '15 days', now()),
-    ('survey-5', 'ASUSE Industry Survey', 'Annual Survey of Unorganized Sector Enterprises', 'active', 10, 203, 3.9, now() - interval '10 days', now());
+    ('survey-5', 'ASUSE Industry Survey', 'Annual Survey of Unorganized Sector Enterprises', 'active', 10, 203, 3.9, now() - interval '10 days', now())
+) AS survey_data(id, name, description, status, total_documents, total_queries, avg_satisfaction, created_at, updated_at)
+CROSS JOIN (SELECT id FROM public.users WHERE email = 'admin@example.com' LIMIT 1) u
+ON CONFLICT (id) DO UPDATE SET
+    name = EXCLUDED.name,
+    description = EXCLUDED.description,
+    status = EXCLUDED.status,
+    updated_at = now();
 
 -- Insert Documents with realistic content
-INSERT INTO public.documents (id, file_name, survey_id, category, content, file_type, upload_date, processed_date, word_count, character_count, chunk_count, image_count, processing_method, is_admin_generated, user_id, created_at, updated_at) VALUES
+INSERT INTO public.documents (id, file_name, survey_id, category, content, file_type, upload_date, processed_date, word_count, character_count, chunk_count, image_count, processing_method, is_admin_generated, user_id, created_at, updated_at)
+SELECT 
+    doc_data.id,
+    doc_data.file_name,
+    doc_data.survey_id,
+    doc_data.category,
+    doc_data.content,
+    doc_data.file_type,
+    doc_data.upload_date,
+    doc_data.processed_date,
+    doc_data.word_count,
+    doc_data.character_count,
+    doc_data.chunk_count,
+    doc_data.image_count,
+    doc_data.processing_method,
+    doc_data.is_admin_generated,
+    u.id,
+    doc_data.created_at,
+    doc_data.updated_at
+FROM (VALUES
     ('doc-1', 'Census_Procedures_Manual.pdf', 'survey-1', 'General Questions', 
      '=== CENSUS PROCEDURES MANUAL ===
 
@@ .. @@
 
 Quality Control: All data must be validated before submission. Use the validation checklist provided in Appendix C.', 
      'application/pdf', now() - interval '5 days', now() - interval '5 days', 890, 4200, 4, 2, 'server-side-enhanced', false, now() - interval '5 days', now())
+) AS doc_data(id, file_name, survey_id, category, content, file_type, upload_date, processed_date, word_count, character_count, chunk_count, image_count, processing_method, is_admin_generated, created_at, updated_at)
+CROSS JOIN (SELECT id FROM public.users WHERE email = 'admin@example.com' LIMIT 1) u
+ON CONFLICT (id) DO UPDATE SET
+    file_name = EXCLUDED.file_name,
+    content = EXCLUDED.content,
+    updated_at = now();
 
 -- Insert Document Chunks with enhanced metadata
-INSERT INTO public.document_chunks (id, document_id, content, section, keywords, entities, word_count, character_count, content_type, importance, is_admin_answer, original_question, admin_answer, admin_answer_rich, feedback_score, times_used, correct_feedback_count, incorrect_feedback_count, last_used, date_answered, created_at, updated_at) VALUES
+INSERT INTO public.document_chunks (id, document_id, content, section, keywords, entities, word_count, character_count, content_type, importance, is_admin_answer, original_question, admin_answer, admin_answer_rich, feedback_score, times_used, correct_feedback_count, incorrect_feedback_count, last_used, date_answered, created_at, updated_at) 
+VALUES
     -- Census Manual Chunks
     ('chunk-1', 'doc-1', 'CAPI stands for Computer Assisted Personal Interview. It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents.', 'Definitions', ARRAY['capi', 'interview', 'electronic', 'devices'], ARRAY['CAPI', 'Computer Assisted Personal Interview'], 35, 180, 'definition', 2.0, false, null, null, null, 0, 0, 0, 0, null, null, now(), now()),
     
@@ .. @@
     ('chunk-12', 'doc-4', 'Quality Control: All data must be validated before submission. Use the validation checklist provided in Appendix C. Supervisors must review all completed forms within 24 hours.', 'Quality Control', ARRAY['quality', 'validation', 'checklist', 'supervisors'], ARRAY['Quality Control', 'Appendix C'], 28, 165, 'procedure', 1.8, false, null, null, null, 0, 0, 0, 0, null, null, now(), now())
+ON CONFLICT (id) DO UPDATE SET
+    content = EXCLUDED.content,
+    updated_at = now();
 
 -- Insert Document Images
-INSERT INTO public.document_images (id, document_id, chunk_id, file_name, description, image_type, data_url, created_at) VALUES
+INSERT INTO public.document_images (id, document_id, chunk_id, file_name, description, image_type, data_url, created_at) 
+VALUES
     ('img-1', 'doc-1', 'chunk-1', 'CAPI_Device_Setup.png', 'Diagram showing proper CAPI device setup and configuration', 'diagram', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', now()),
     ('img-2', 'doc-1', 'chunk-2', 'Interview_Process_Flow.png', 'Flowchart depicting the complete interview process from start to finish', 'flowchart', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', now()),
@@ .. @@
     ('img-7', 'doc-4', 'chunk-11', 'Data_Entry_Form.png', 'Screenshot of the data entry form interface', 'screenshot', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', now()),
     ('img-8', 'doc-4', 'chunk-12', 'Quality_Checklist.png', 'Quality control checklist with validation criteria', 'form', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', now())
+ON CONFLICT (id) DO UPDATE SET
+    description = EXCLUDED.description,
+    created_at = EXCLUDED.created_at;
 
 -- Insert Admin Knowledge with rich HTML content
-INSERT INTO public.admin_knowledge (id, original_question, admin_answer, admin_answer_rich, survey_id, images, created_by, feedback_score, times_used, created_at, updated_at) VALUES
+INSERT INTO public.admin_knowledge (id, original_question, admin_answer, admin_answer_rich, survey_id, images, created_by, feedback_score, times_used, created_at, updated_at)
+SELECT 
+    ak_data.id,
+    ak_data.original_question,
+    ak_data.admin_answer,
+    ak_data.admin_answer_rich,
+    ak_data.survey_id,
+    ak_data.images,
+    u.id,
+    ak_data.feedback_score,
+    ak_data.times_used,
+    ak_data.created_at,
+    ak_data.updated_at
+FROM (VALUES
     ('ak-1', 'What is CAPI and how does it work?', 
      'CAPI stands for Computer Assisted Personal Interview. It is a data collection method where trained interviewers use electronic devices to conduct face-to-face interviews.',
      '<p><strong>CAPI</strong> stands for <em>Computer Assisted Personal Interview</em>.</p><p>It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents.</p><p><strong>Key benefits:</strong></p><ul><li>Real-time data validation</li><li>Reduced data entry errors</li><li>Automated skip patterns</li><li>Immediate data transmission</li></ul>',
@@ -1,4 +1,4 @@
      '<p><strong>Quality control</strong> is essential for maintaining data integrity in surveys.</p><p><strong>Key steps include:</strong></p><ol><li>Daily review of completed forms</li><li>Validation checks using provided checklists</li><li>Supervisor approval within 24 hours</li><li>Error correction and resubmission</li></ol><p>All supervisors must follow the quality control procedures outlined in the training manual.</p>',
      'survey-1', '[]', 8, 15, now() - interval '3 days', now())
+) AS ak_data(id, original_question, admin_answer, admin_answer_rich, survey_id, images, feedback_score, times_used, created_at, updated_at)
+CROSS JOIN (SELECT id FROM public.users WHERE email = 'admin@example.com' LIMIT 1) u
+ON CONFLICT (id) DO UPDATE SET
+    admin_answer = EXCLUDED.admin_answer,
+    admin_answer_rich = EXCLUDED.admin_answer_rich,
+    updated_at = now();
 
 -- Insert Chat Sessions
-INSERT INTO public.chat_sessions (id, user_id, survey_id, category, message_count, total_feedback_positive, total_feedback_negative, session_duration, created_at, updated_at) VALUES
+INSERT INTO public.chat_sessions (id, user_id, survey_id, category, message_count, total_feedback_positive, total_feedback_negative, session_duration, created_at, updated_at)
+SELECT 
+    cs_data.id,
+    u.id,
+    cs_data.survey_id,
+    cs_data.category,
+    cs_data.message_count,
+    cs_data.total_feedback_positive,
+    cs_data.total_feedback_negative,
+    cs_data.session_duration,
+    cs_data.created_at,
+    cs_data.updated_at
+FROM (VALUES
     ('session-1', 'survey-1', 'General Questions', 8, 6, 1, interval '25 minutes', now() - interval '2 days', now()),
     ('session-2', 'survey-2', 'Detail Schedule', 12, 9, 2, interval '35 minutes', now() - interval '1 day', now()),
     ('session-3', 'survey-1', 'Listing', 6, 5, 0, interval '18 minutes', now() - interval '6 hours', now()),
-    ('session-4', 'survey-3', 'General Questions', 10, 8, 1, interval '28 minutes', now() - interval '4 hours', now());
+    ('session-4', 'survey-3', 'General Questions', 10, 8, 1, interval '28 minutes', now() - interval '4 hours', now())
+) AS cs_data(id, survey_id, category, message_count, total_feedback_positive, total_feedback_negative, session_duration, created_at, updated_at)
+CROSS JOIN (SELECT id FROM public.users WHERE email = 'enum@example.com' LIMIT 1) u
+ON CONFLICT (id) DO UPDATE SET
+    message_count = EXCLUDED.message_count,
+    updated_at = now();
 
 -- Insert Chat Messages
-INSERT INTO public.chat_messages (id, session_id, content, rich_content, sender, feedback_type, feedback_provided, alternative_attempts, original_query, images, processing_time, confidence_score, created_at) VALUES
+INSERT INTO public.chat_messages (id, session_id, content, rich_content, sender, feedback_type, feedback_provided, alternative_attempts, original_query, images, processing_time, confidence_score, created_at) 
+VALUES
     -- Session 1 Messages
     ('msg-1', 'session-1', 'What is CAPI?', null, 'user', null, false, 0, null, '[]', null, null, now() - interval '2 days'),
     ('msg-2', 'session-1', 'CAPI stands for Computer Assisted Personal Interview. It is a data collection method where trained interviewers use electronic devices to conduct face-to-face interviews.', '<p><strong>CAPI</strong> stands for <em>Computer Assisted Personal Interview</em>. It is a data collection method where trained interviewers use electronic devices to conduct face-to-face interviews.</p>', 'admin', 'positive', true, 0, 'What is CAPI?', '[]', interval '2.3 seconds', 0.95, now() - interval '2 days'),
@@ .. @@
     ('msg-15', 'session-4', 'How do I handle non-response cases?', null, 'user', null, false, 0, null, '[]', null, null, now() - interval '4 hours'),
-    ('msg-16', 'session-4', 'Non-response cases should be documented with the reason code and follow-up attempts should be made according to the survey protocol.', '<p>Non-response cases should be documented with the <strong>reason code</strong> and follow-up attempts should be made according to the survey protocol.</p><p>Standard procedure:</p><ol><li>Record the reason for non-response</li><li>Schedule follow-up visits</li><li>Contact supervisor if needed</li></ol>', 'bot', 'positive', true, 0, 'How do I handle non-response cases?', '[]', interval '1.8 seconds', 0.88, now() - interval '4 hours');
+    ('msg-16', 'session-4', 'Non-response cases should be documented with the reason code and follow-up attempts should be made according to the survey protocol.', '<p>Non-response cases should be documented with the <strong>reason code</strong> and follow-up attempts should be made according to the survey protocol.</p><p>Standard procedure:</p><ol><li>Record the reason for non-response</li><li>Schedule follow-up visits</li><li>Contact supervisor if needed</li></ol>', 'bot', 'positive', true, 0, 'How do I handle non-response cases?', '[]', interval '1.8 seconds', 0.88, now() - interval '4 hours')
+ON CONFLICT (id) DO UPDATE SET
+    content = EXCLUDED.content,
+    rich_content = EXCLUDED.rich_content;
 
 -- Insert Unanswered Queries
-INSERT INTO public.unanswered_queries (id, content, survey_id, user_id, status, priority, category, tags, context, created_at, answered_at, answered_by, answer_content, answer_rich_content, answer_images) VALUES
+INSERT INTO public.unanswered_queries (id, content, survey_id, user_id, status, priority, category, tags, context, created_at, answered_at, answered_by, answer_content, answer_rich_content, answer_images)
+SELECT 
+    uq_data.id,
+    uq_data.content,
+    uq_data.survey_id,
+    u.id,
+    uq_data.status,
+    uq_data.priority,
+    uq_data.category,
+    uq_data.tags,
+    uq_data.context,
+    uq_data.created_at,
+    uq_data.answered_at,
+    uq_data.answered_by,
+    uq_data.answer_content,
+    uq_data.answer_rich_content,
+    uq_data.answer_images
+FROM (VALUES
     ('uq-1', 'How do I handle incomplete questionnaires in CAPI?', 'survey-1', 2, 'pending', 'General Questions', ARRAY['capi', 'questionnaire', 'incomplete'], '{"session_id": "session-1", "attempt_count": 3}', now() - interval '1 day', null, null, null, null, '[]'),
     ('uq-2', 'What is the protocol for data backup in field operations?', 'survey-2', 1, 'pending', 'Detail Schedule', ARRAY['data', 'backup', 'field'], '{"session_id": "session-2", "attempt_count": 2}', now() - interval '6 hours', null, null, null, null, '[]'),
     ('uq-3', 'How to resolve GPS coordinate errors during listing?', 'survey-1', 3, 'pending', 'Listing', ARRAY['gps', 'coordinates', 'listing'], '{"session_id": "session-3", "attempt_count": 4}', now() - interval '3 hours', null, null, null, null, '[]'),
-    ('uq-4', 'What are the quality control measures for health surveys?', 'survey-3', 2, 'pending', 'General Questions', ARRAY['quality', 'control', 'health'], '{"session_id": "session-4", "attempt_count": 1}', now() - interval '1 hour', null, null, null, null, '[]');
+    ('uq-4', 'What are the quality control measures for health surveys?', 'survey-3', 2, 'pending', 'General Questions', ARRAY['quality', 'control', 'health'], '{"session_id": "session-4", "attempt_count": 1}', now() - interval '1 hour', null, null, null, null, '[]')
+) AS uq_data(id, content, survey_id, status, priority, category, tags, context, created_at, answered_at, answered_by, answer_content, answer_rich_content, answer_images)
+CROSS JOIN (SELECT id FROM public.users WHERE email = 'enum@example.com' LIMIT 1) u
+ON CONFLICT (id) DO UPDATE SET
+    content = EXCLUDED.content,
+    status = EXCLUDED.status;
 
 -- Insert User Analytics
-INSERT INTO public.user_analytics (id, user_id, survey_id, date, queries_asked, queries_answered, positive_feedback, negative_feedback, session_duration, documents_uploaded, avg_response_time, unique_sessions, created_at, updated_at) VALUES
+INSERT INTO public.user_analytics (id, user_id, survey_id, date, queries_asked, queries_answered, positive_feedback, negative_feedback, session_duration, documents_uploaded, avg_response_time, unique_sessions, created_at, updated_at)
+SELECT 
+    ua_data.id,
+    u.id,
+    ua_data.survey_id,
+    ua_data.date,
+    ua_data.queries_asked,
+    ua_data.queries_answered,
+    ua_data.positive_feedback,
+    ua_data.negative_feedback,
+    ua_data.session_duration,
+    ua_data.documents_uploaded,
+    ua_data.avg_response_time,
+    ua_data.unique_sessions,
+    ua_data.created_at,
+    ua_data.updated_at
+FROM (VALUES
     -- Admin user analytics
     ('ua-1', 'survey-1', current_date - 1, 25, 23, 20, 3, interval '2 hours 15 minutes', 5, interval '2.1 seconds', 8, now(), now()),
     ('ua-2', 'survey-2', current_date - 1, 18, 16, 14, 2, interval '1 hour 45 minutes', 3, interval '1.9 seconds', 6, now(), now()),
@@ -1,4 +1,4 @@
     ('ua-11', 'survey-1', current_date, 8, 7, 6, 1, interval '45 minutes', 0, interval '2.8 seconds', 3, now(), now()),
     ('ua-12', 'survey-3', current_date, 12, 11, 9, 2, interval '1 hour 10 minutes', 1, interval '2.2 seconds', 4, now(), now())
+) AS ua_data(id, survey_id, date, queries_asked, queries_answered, positive_feedback, negative_feedback, session_duration, documents_uploaded, avg_response_time, unique_sessions, created_at, updated_at)
+CROSS JOIN (SELECT id FROM public.users WHERE email = 'enum@example.com' LIMIT 1) u
+ON CONFLICT (user_id, survey_id, date) DO UPDATE SET
+    queries_asked = EXCLUDED.queries_asked,
+    queries_answered = EXCLUDED.queries_answered,
+    updated_at = now();
 
 -- Insert System Analytics
-INSERT INTO public.system_analytics (id, date, total_users, active_users, new_users, total_queries, answered_queries, unanswered_queries, avg_response_time, bot_efficiency, documents_processed, storage_used, top_surveys, user_satisfaction, created_at, updated_at) VALUES
+INSERT INTO public.system_analytics (id, date, total_users, active_users, new_users, total_queries, answered_queries, unanswered_queries, avg_response_time, bot_efficiency, documents_processed, storage_used, top_surveys, user_satisfaction, created_at, updated_at) 
+VALUES
     ('sa-1', current_date - 7, 45, 32, 5, 234, 198, 36, interval '2.4 seconds', 84.62, 28, 1024000000, '[{"survey": "survey-1", "queries": 89}, {"survey": "survey-2", "queries": 67}]', 4.1, now(), now()),
     ('sa-2', current_date - 6, 47, 35, 2, 267, 231, 36, interval '2.2 seconds', 86.52, 31, 1156000000, '[{"survey": "survey-1", "queries": 95}, {"survey": "survey-3", "queries": 72}]', 4.2, now(), now()),
     ('sa-3', current_date - 5, 49, 38, 2, 289, 256, 33, interval '2.1 seconds', 88.58, 35, 1289000000, '[{"survey": "survey-2", "queries": 103}, {"survey": "survey-1", "queries": 87}]', 4.3, now(), now()),
@@ -1,4 +1,4 @@
     ('sa-5', current_date - 3, 53, 41, 1, 334, 301, 33, interval '1.9 seconds', 90.12, 42, 1567000000, '[{"survey": "survey-1", "queries": 112}, {"survey": "survey-4", "queries": 89}]', 4.4, now(), now()),
     ('sa-6', current_date - 2, 54, 43, 1, 356, 325, 31, interval '1.8 seconds', 91.29, 45, 1678000000, '[{"survey": "survey-3", "queries": 118}, {"survey": "survey-2", "queries": 94}]', 4.5, now(), now()),
     ('sa-7', current_date - 1, 56, 45, 2, 378, 349, 29, interval '1.7 seconds', 92.33, 48, 1789000000, '[{"survey": "survey-1", "queries": 125}, {"survey": "survey-5", "queries": 98}]', 4.6, now(), now()),
-    ('sa-8', current_date, 58, 47, 2, 401, 374, 27, interval '1.6 seconds', 93.27, 52, 1890000000, '[{"survey": "survey-2", "queries": 132}, {"survey": "survey-1", "queries": 108}]', 4.7, now(), now());
+    ('sa-8', current_date, 58, 47, 2, 401, 374, 27, interval '1.6 seconds', 93.27, 52, 1890000000, '[{"survey": "survey-2", "queries": 132}, {"survey": "survey-1", "queries": 108}]', 4.7, now(), now())
+ON CONFLICT (date) DO UPDATE SET
+    total_users = EXCLUDED.total_users,
+    active_users = EXCLUDED.active_users,
+    total_queries = EXCLUDED.total_queries,
+    answered_queries = EXCLUDED.answered_queries,
+    updated_at = now();
 
 -- Display summary of inserted data
 DO $$