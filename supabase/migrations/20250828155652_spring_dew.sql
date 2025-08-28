/*
  # Insert Initial Data

  1. Sample Data
    - Demo users with different roles
    - Sample surveys
    - Admin knowledge base entries
  
  2. Security
    - All inserts respect RLS policies
    - Proper user role assignments
*/

-- Insert demo users
INSERT INTO users (id, email, name, role, status, raw_user_meta_data) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@example.com', 'Admin User', 'admin', 'active', '{"role": "admin"}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'enum@example.com', 'John Enumerator', 'enumerator', 'active', '{"role": "enumerator"}'),
  ('550e8400-e29b-41d4-a716-446655440003', 'super@example.com', 'Jane Supervisor', 'supervisor', 'active', '{"role": "supervisor"}'),
  ('550e8400-e29b-41d4-a716-446655440004', 'zo@example.com', 'ZO User', 'zo', 'active', '{"role": "zo"}'),
  ('550e8400-e29b-41d4-a716-446655440005', 'ro@example.com', 'RO User', 'ro', 'active', '{"role": "ro"}');

-- Insert sample surveys
INSERT INTO surveys (id, name, description, status, created_by) VALUES
  ('survey-1', 'Population Census Survey', 'National population census data collection', 'active', '550e8400-e29b-41d4-a716-446655440001'),
  ('survey-2', 'Economic Household Survey', 'Household economic status survey', 'active', '550e8400-e29b-41d4-a716-446655440001'),
  ('survey-3', 'Health and Nutrition Survey', 'Health and nutrition assessment', 'active', '550e8400-e29b-41d4-a716-446655440001'),
  ('survey-4', 'Education Access Survey', 'Educational access and quality survey', 'active', '550e8400-e29b-41d4-a716-446655440001'),
  ('survey-5', 'ASUSE Industry Survey', 'Industry and business survey', 'active', '550e8400-e29b-41d4-a716-446655440001');

-- Insert admin knowledge base entries
INSERT INTO document_chunks (
  content, 
  section, 
  keywords, 
  entities, 
  word_count, 
  character_count, 
  content_type, 
  importance, 
  is_admin_answer, 
  original_question, 
  admin_answer, 
  admin_answer_rich
) VALUES
(
  'CAPI stands for Computer Assisted Personal Interview. It is a data collection method where trained interviewers use electronic devices to conduct face-to-face interviews.',
  'Survey Terminology',
  ARRAY['capi', 'computer', 'assisted', 'personal', 'interview', 'data', 'collection', 'electronic', 'devices'],
  ARRAY['CAPI', 'Computer Assisted Personal Interview'],
  25,
  150,
  'definition',
  2.0,
  true,
  'What is CAPI?',
  'CAPI stands for Computer Assisted Personal Interview. It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents.',
  '<p><strong>CAPI</strong> stands for <strong>Computer Assisted Personal Interview</strong>.</p><p>It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents.</p><h3>Key benefits of CAPI:</h3><ul><li><strong>Real-time validation</strong> - Reduces data entry errors</li><li><strong>Skip patterns</strong> - Automatic question routing</li><li><strong>Multimedia support</strong> - Can include images, audio, video</li><li><strong>Offline capability</strong> - Works without internet connection</li><li><strong>Data security</strong> - Encrypted data storage and transmission</li></ul>'
),
(
  'Non-response occurs when selected sample units do not participate in the survey. This can introduce bias into survey results.',
  'Data Quality',
  ARRAY['non-response', 'bias', 'survey', 'participation', 'sample', 'units'],
  ARRAY['Non-response'],
  18,
  120,
  'explanation',
  2.5,
  true,
  'How do I handle non-response in surveys?',
  'Non-response occurs when selected sample units do not participate in the survey. High non-response rates can introduce bias, so follow up multiple times, use different contact methods, offer appropriate incentives, document reasons, and calculate response rates accurately.',
  '<p><strong>Non-response</strong> occurs when selected sample units do not participate in the survey.</p><h3>How to handle non-response:</h3><ol><li><strong>Follow up</strong> with non-respondents multiple times</li><li><strong>Use different contact methods</strong> (phone, email, in-person)</li><li><strong>Offer incentives</strong> if appropriate and allowed</li><li><strong>Document reasons</strong> for non-response</li><li><strong>Calculate and report</strong> response rates accurately</li></ol><p>High non-response rates can introduce bias into survey results, so it is important to minimize them through proper survey design and fieldwork procedures.</p>'
),
(
  'Data validation ensures the accuracy and consistency of collected survey data through various checks and procedures.',
  'Data Quality',
  ARRAY['data', 'validation', 'accuracy', 'consistency', 'checks', 'procedures', 'quality'],
  ARRAY['Data Validation'],
  15,
  100,
  'procedure',
  2.0,
  true,
  'What is data validation in surveys?',
  'Data validation ensures accuracy and consistency of survey data through range checks, consistency checks, completeness checks, and logical validation rules applied during collection and processing.',
  '<p><strong>Data validation</strong> ensures the accuracy and consistency of collected survey data.</p><h3>Types of validation checks:</h3><ul><li><strong>Range checks</strong> - Values within acceptable limits</li><li><strong>Consistency checks</strong> - Related fields are logically consistent</li><li><strong>Completeness checks</strong> - Required fields are filled</li><li><strong>Format checks</strong> - Data follows correct format (dates, phone numbers)</li><li><strong>Logic checks</strong> - Skip patterns and conditional logic work correctly</li></ul><p>Validation should occur both during data collection (real-time) and during data processing (batch validation).</p>'
);