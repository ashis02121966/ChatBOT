/*
  # Insert Initial Data

  1. Initial Surveys
    - Creates 5 sample surveys for different data collection scenarios
    - Each survey has proper metadata and descriptions

  2. Admin Knowledge Base
    - Pre-populated with common survey terminology and procedures
    - Rich HTML content with proper formatting
    - Covers CAPI, CATI, CAWI, and other survey concepts

  3. Sample Users
    - Creates users for each role type
    - Includes admin, enumerator, supervisor, ZO, and RO roles
*/

-- Insert initial surveys
INSERT INTO surveys (id, name, description, status, created_by) VALUES
('survey-1', 'Population Census Survey', 'National population census data collection with comprehensive demographic information', 'active', NULL),
('survey-2', 'Economic Household Survey', 'Household economic status and income assessment survey', 'active', NULL),
('survey-3', 'Health and Nutrition Survey', 'Health status and nutritional assessment of population groups', 'active', NULL),
('survey-4', 'Education Access Survey', 'Educational access, quality, and outcomes assessment', 'active', NULL),
('survey-5', 'ASUSE Industry Survey', 'Industry and business establishment survey for economic indicators', 'active', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert admin knowledge base with properly escaped quotes
INSERT INTO document_chunks (
  id, 
  document_id, 
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
  gen_random_uuid(),
  NULL,
  'CAPI stands for Computer Assisted Personal Interview. It is a data collection method where trained interviewers use electronic devices to conduct face-to-face interviews.',
  'Survey Terminology',
  ARRAY['capi', 'computer', 'assisted', 'personal', 'interview', 'data', 'collection'],
  ARRAY['CAPI', 'Computer Assisted Personal Interview'],
  25,
  150,
  'definition',
  2.0,
  true,
  'What is CAPI?',
  'CAPI stands for Computer Assisted Personal Interview. It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents.',
  '<p><strong>CAPI</strong> stands for <strong>Computer Assisted Personal Interview</strong>.</p><p>It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents.</p><h3>Key benefits:</h3><ul><li><strong>Real-time validation</strong> - Reduces data entry errors</li><li><strong>Skip patterns</strong> - Automatic question routing</li><li><strong>Multimedia support</strong> - Can include images, audio, video</li><li><strong>Immediate data upload</strong> - No manual data entry required</li></ul>'
),
(
  gen_random_uuid(),
  NULL,
  'CATI stands for Computer Assisted Telephone Interview. It is a survey data collection method where interviewers conduct telephone interviews using specialized computer software.',
  'Survey Terminology',
  ARRAY['cati', 'computer', 'assisted', 'telephone', 'interview', 'survey'],
  ARRAY['CATI', 'Computer Assisted Telephone Interview'],
  22,
  140,
  'definition',
  2.0,
  true,
  'What is CATI?',
  'CATI stands for Computer Assisted Telephone Interview. It is a survey data collection method where interviewers conduct telephone interviews using specialized computer software.',
  '<p><strong>CATI</strong> stands for <strong>Computer Assisted Telephone Interview</strong>.</p><p>It is a survey data collection method where interviewers conduct telephone interviews using specialized computer software.</p><h3>How it works:</h3><ol><li><strong>Automatic dialing</strong> - System dials phone numbers automatically</li><li><strong>Question presentation</strong> - Questions appear on interviewer screen</li><li><strong>Response recording</strong> - Answers recorded directly into database</li><li><strong>Quality control</strong> - Built-in validation and monitoring</li></ol>'
),
(
  gen_random_uuid(),
  NULL,
  'CAWI stands for Computer Assisted Web Interview. It is a self-administered survey method where respondents complete questionnaires online through web browsers.',
  'Survey Terminology',
  ARRAY['cawi', 'computer', 'assisted', 'web', 'interview', 'online', 'survey'],
  ARRAY['CAWI', 'Computer Assisted Web Interview'],
  20,
  130,
  'definition',
  2.0,
  true,
  'What is CAWI?',
  'CAWI stands for Computer Assisted Web Interview. It is a self-administered survey method where respondents complete questionnaires online through web browsers.',
  '<p><strong>CAWI</strong> stands for <strong>Computer Assisted Web Interview</strong>.</p><p>It is a self-administered survey method where respondents complete questionnaires online through web browsers.</p><h3>Advantages:</h3><ul><li><strong>Cost effective</strong> - Lower operational costs</li><li><strong>Flexible timing</strong> - Respondents can complete at their convenience</li><li><strong>Multimedia content</strong> - Support for images, videos, interactive elements</li><li><strong>Real-time validation</strong> - Immediate error checking</li><li><strong>Automatic skip patterns</strong> - Dynamic questionnaire flow</li></ul>'
),
(
  gen_random_uuid(),
  NULL,
  'An enumerator is a trained field worker responsible for collecting survey data by conducting interviews with respondents.',
  'Survey Roles',
  ARRAY['enumerator', 'field', 'worker', 'data', 'collection', 'interviews'],
  ARRAY['Enumerator', 'Field Worker'],
  18,
  120,
  'definition',
  2.0,
  true,
  'What is an enumerator?',
  'An enumerator is a trained field worker responsible for collecting survey data by conducting interviews with respondents.',
  '<p>An <strong>enumerator</strong> is a trained field worker responsible for collecting survey data by conducting interviews with respondents.</p><h3>Key responsibilities:</h3><ul><li><strong>Conduct interviews</strong> - Follow standardized procedures</li><li><strong>Use survey instruments</strong> - Properly operate data collection tools</li><li><strong>Ensure data quality</strong> - Verify accuracy and completeness</li><li><strong>Follow protocols</strong> - Adhere to survey methodology</li><li><strong>Maintain confidentiality</strong> - Protect respondent privacy</li></ul>'
),
(
  gen_random_uuid(),
  NULL,
  'Non-response occurs when selected sample units do not participate in the survey. This can be due to refusal, inability to contact, or other reasons.',
  'Survey Quality',
  ARRAY['non-response', 'sample', 'units', 'survey', 'participation', 'refusal'],
  ARRAY['Non-response', 'Sample Units'],
  25,
  160,
  'definition',
  2.0,
  true,
  'What is non-response?',
  'Non-response occurs when selected sample units do not participate in the survey. This can be due to refusal, inability to contact, or other reasons.',
  '<p><strong>Non-response</strong> occurs when selected sample units do not participate in the survey.</p><h3>How to handle non-response:</h3><ol><li><strong>Follow up</strong> with non-respondents multiple times</li><li><strong>Use different contact methods</strong> (phone, email, in-person)</li><li><strong>Offer incentives</strong> if appropriate and allowed</li><li><strong>Document reasons</strong> for non-response</li><li><strong>Calculate and report</strong> response rates accurately</li></ol><p>High non-response rates can introduce bias into survey results, so it''s important to minimize them through proper survey design and fieldwork procedures.</p>'
),
(
  gen_random_uuid(),
  NULL,
  'Data quality refers to the accuracy, completeness, consistency, and reliability of collected survey data.',
  'Survey Quality',
  ARRAY['data', 'quality', 'accuracy', 'completeness', 'consistency', 'reliability'],
  ARRAY['Data Quality', 'Survey Data'],
  16,
  100,
  'definition',
  2.0,
  true,
  'What is data quality?',
  'Data quality refers to the accuracy, completeness, consistency, and reliability of collected survey data.',
  '<p><strong>Data quality</strong> refers to the accuracy, completeness, consistency, and reliability of collected survey data.</p><h3>Quality dimensions:</h3><ul><li><strong>Accuracy</strong> - Data correctly represents reality</li><li><strong>Completeness</strong> - All required data is collected</li><li><strong>Consistency</strong> - Data is uniform across the dataset</li><li><strong>Reliability</strong> - Data can be trusted for analysis</li><li><strong>Timeliness</strong> - Data is collected within appropriate timeframes</li></ul><h3>Quality assurance methods:</h3><ol><li>Proper training of field staff</li><li>Standardized procedures and protocols</li><li>Real-time validation checks</li><li>Regular supervision and monitoring</li><li>Post-collection data cleaning and verification</li></ol>'
)
ON CONFLICT (id) DO NOTHING;

-- Insert sample users with proper authentication integration
INSERT INTO users (id, email, name, role, status, raw_user_meta_data) VALUES
(gen_random_uuid(), 'admin@example.com', 'System Administrator', 'admin', 'active', '{"role": "admin", "department": "IT"}'),
(gen_random_uuid(), 'supervisor@example.com', 'Field Supervisor', 'supervisor', 'active', '{"role": "supervisor", "region": "Central"}'),
(gen_random_uuid(), 'enumerator1@example.com', 'John Enumerator', 'enumerator', 'active', '{"role": "enumerator", "team": "Team A"}'),
(gen_random_uuid(), 'enumerator2@example.com', 'Jane Enumerator', 'enumerator', 'active', '{"role": "enumerator", "team": "Team B"}'),
(gen_random_uuid(), 'zo@example.com', 'Zonal Officer', 'zo', 'active', '{"role": "zo", "zone": "Zone 1"}'),
(gen_random_uuid(), 'ro@example.com', 'Regional Officer', 'ro', 'active', '{"role": "ro", "region": "North"}')
ON CONFLICT (email) DO NOTHING;