```sql
-- Mock UUIDs for users (REPLACE THESE WITH ACTUAL auth.users IDs AFTER MANUAL CREATION)
-- Admin: 00000000-0000-0000-0000-000000000001
-- Enumerator: 00000000-0000-0000-0000-000000000002
-- Supervisor: 00000000-0000-0000-0000-000000000003
-- ZO: 00000000-0000-0000-0000-000000000004
-- RO: 00000000-0000-0000-0000-000000000005

-- Insert mock users into public.users
INSERT INTO public.users (id, email, name, role, status, last_login, created_at, updated_at)
VALUES
('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'Admin User', 'admin', 'active', '2024-01-20 10:00:00+00', now(), now()),
('00000000-0000-0000-0000-000000000002', 'enum@example.com', 'John Enumerator', 'enumerator', 'active', '2024-01-19 11:00:00+00', now(), now()),
('00000000-0000-0000-0000-000000000003', 'super@example.com', 'Jane Supervisor', 'supervisor', 'active', '2024-01-18 12:00:00+00', now(), now()),
('00000000-0000-0000-0000-000000000004', 'zo@example.com', 'ZO User', 'zo', 'inactive', '2024-01-15 13:00:00+00', now(), now()),
('00000000-0000-0000-0000-000000000005', 'ro@example.com', 'RO User', 'ro', 'active', '2024-01-17 14:00:00+00', now(), now());

-- Insert mock surveys
INSERT INTO public.surveys (id, name, description, status, created_by, total_documents, total_queries, avg_satisfaction, created_at, updated_at)
VALUES
('survey-1', 'Population Census Survey', 'National population census data collection', 'active', '00000000-0000-0000-0000-000000000001', 2, 456, 0.95, now(), now()),
('survey-2', 'Economic Household Survey', 'Household economic status survey', 'active', '00000000-0000-0000-0000-000000000001', 1, 324, 0.92, now(), now()),
('survey-3', 'Health and Nutrition Survey', 'Health and nutrition assessment', 'active', '00000000-0000-0000-0000-000000000001', 0, 287, 0.88, now(), now()),
('survey-4', 'Education Access Survey', 'Educational access and quality survey', 'active', '00000000-0000-0000-0000-000000000001', 0, 178, 0.94, now(), now()),
('survey-5', 'ASUSE Industry Survey', 'Industry and business survey', 'active', '00000000-0000-0000-0000-000000000001', 0, 0, 0.00, now(), now());

-- Insert mock documents
INSERT INTO public.documents (id, file_name, survey_id, category, content, file_type, upload_date, processed_date, word_count, character_count, chunk_count, image_count, processing_method, is_admin_generated, user_id, created_at, updated_at)
VALUES
('10000000-0000-0000-0000-000000000001', 'Census Procedures Manual.pdf', 'survey-1', 'General Questions', 'This is mock content for the Census Procedures Manual. It outlines various steps and guidelines for data collection. This document is crucial for enumerators.', 'application/pdf', '2024-01-15 09:00:00+00', '2024-01-15 09:05:00+00', 50, 300, 1, 0, 'client-side', FALSE, '00000000-0000-0000-0000-000000000001', now(), now()),
('10000000-0000-0000-0000-000000000002', 'Data Collection Guidelines.docx', 'survey-1', 'Detail Schedule', 'Mock content for Data Collection Guidelines. This document details the process of collecting sensitive household data. It includes forms and examples.', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '2024-01-16 10:00:00+00', '2024-01-16 10:07:00+00', 70, 450, 2, 0, 'client-side', FALSE, '00000000-0000-0000-0000-000000000001', now(), now()),
('10000000-0000-0000-0000-000000000003', 'Sample Forms.xlsx', 'survey-2', 'Listing', 'Mock content for Sample Forms. This Excel file contains various sample forms used in the economic household survey. It has multiple sheets.', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '2024-01-17 11:00:00+00', '2024-01-17 11:08:00+00', 60, 400, 1, 0, 'client-side', FALSE, '00000000-0000-0000-0000-000000000001', now(), now());

-- Insert mock document chunks
INSERT INTO public.document_chunks (id, document_id, content, section, keywords, entities, word_count, character_count, content_type, importance, created_at, updated_at)
VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000001', 'This is mock content for the Census Procedures Manual. It outlines various steps and guidelines for data collection.', 'Section 1', '{"census", "manual", "data collection"}', '{"Census", "Manual"}', 20, 150, 'general', 1.0, now(), now()),
(gen_random_uuid(), '10000000-0000-0000-0000-000000000002', 'Mock content for Data Collection Guidelines. This document details the process of collecting sensitive household data.', 'Section 1', '{"data collection", "guidelines", "household data"}', '{"Data Collection", "Household"}', 25, 180, 'general', 1.0, now(), now()),
(gen_random_uuid(), '10000000-0000-0000-0000-000000000002', 'It includes forms and examples for proper data entry and validation.', 'Section 2', '{"forms", "examples", "data entry", "validation"}', '{"Forms", "Validation"}', 15, 100, 'general', 1.0, now(), now()),
(gen_random_uuid(), '10000000-0000-0000-0000-000000000003', 'Mock content for Sample Forms. This Excel file contains various sample forms used in the economic household survey.', 'Section 1', '{"excel", "sample forms", "household survey"}', '{"Excel", "Sample Forms"}', 30, 200, 'general', 1.0, now(), now());

-- Insert mock document images (example, using a tiny base64 image)
INSERT INTO public.document_images (id, document_id, chunk_id, file_name, description, image_type, data_url, created_at)
VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000002', NULL, 'SampleForm.png', 'Example of a data collection form', 'form', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', now());

-- Insert mock unanswered queries
INSERT INTO public.unanswered_queries (id, content, survey_id, user_id, status, priority, category, tags, context, created_at)
VALUES
('20000000-0000-0000-0000-000000000001', 'What is the procedure for CAPI data collection?', 'survey-1', '00000000-0000-0000-0000-000000000002', 'pending', 1, 'General Questions', '{"CAPI", "procedure"}', '{}', '2024-01-21 15:00:00+00');

-- Insert mock admin knowledge
INSERT INTO public.admin_knowledge (id, original_question, admin_answer, admin_answer_rich, survey_id, images, created_by, feedback_score, times_used, created_at, updated_at)
VALUES
('30000000-0000-0000-0000-000000000001', 'What is CAPI?', 'CAPI stands for Computer Assisted Personal Interview. It is a data collection method where trained interviewers use electronic devices to conduct face-to-face interviews.', 'CAPI stands for <strong>Computer Assisted Personal Interview</strong>. It is a data collection method where trained interviewers use electronic devices to conduct face-to-face interviews.', 'survey-1', '[]', '00000000-0000-0000-0000-000000000001', 5, 10, now(), now());

-- Insert mock chat sessions (minimal example)
INSERT INTO public.chat_sessions (id, user_id, survey_id, category, message_count, created_at, updated_at)
VALUES
('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'survey-1', 'General Questions', 2, '2024-01-22 09:00:00+00', now());

-- Insert mock chat messages
INSERT INTO public.chat_messages (id, session_id, content, rich_content, sender, created_at)
VALUES
('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Hello, what is the population census survey?', 'Hello, what is the population census survey?', 'user', '2024-01-22 09:01:00+00'),
('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'The Population Census Survey is a national data collection effort to count and gather information about the population.', 'The Population Census Survey is a national data collection effort to count and gather information about the population.', 'bot', '2024-01-22 09:02:00+00');

-- Insert mock user analytics
INSERT INTO public.user_analytics (id, user_id, survey_id, date, queries_asked, queries_answered, positive_feedback, negative_feedback, session_duration, documents_uploaded, created_at, updated_at)
VALUES
('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'survey-1', '2024-01-22', 5, 4, 3, 1, '00:15:00', 1, now(), now());

-- Insert mock system analytics
INSERT INTO public.system_analytics (id, date, total_users, active_users, new_users, total_queries, answered_queries, unanswered_queries, avg_response_time, bot_efficiency, documents_processed, storage_used, top_surveys, user_satisfaction, created_at, updated_at)
VALUES
('70000000-0000-0000-0000-000000000001', '2024-01-22', 5, 3, 1, 10, 8, 2, '00:00:05', 0.80, 3, 1024000, '[{"id": "survey-1", "queries": 5}, {"id": "survey-2", "queries": 3}]', 0.90, now(), now());
```