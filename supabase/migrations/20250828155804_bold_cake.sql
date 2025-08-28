/*
  # Insert Initial Data

  1. Demo Users
    - Creates users with different roles for testing
  2. Sample Surveys
    - Creates sample surveys for the application
  3. Admin Knowledge Base
    - Pre-populated knowledge base entries
*/

-- Insert demo users
INSERT INTO users (id, email, name, role, status, raw_user_meta_data) VALUES
(
  gen_random_uuid(),
  'admin@example.com',
  'Admin User',
  'admin',
  'active',
  '{"role": "admin"}'::jsonb
),
(
  gen_random_uuid(),
  'enum@example.com',
  'John Enumerator',
  'enumerator',
  'active',
  '{"role": "enumerator"}'::jsonb
),
(
  gen_random_uuid(),
  'super@example.com',
  'Jane Supervisor',
  'supervisor',
  'active',
  '{"role": "supervisor"}'::jsonb
),
(
  gen_random_uuid(),
  'zo@example.com',
  'ZO User',
  'zo',
  'active',
  '{"role": "zo"}'::jsonb
),
(
  gen_random_uuid(),
  'ro@example.com',
  'RO User',
  'ro',
  'active',
  '{"role": "ro"}'::jsonb
);

-- Insert sample surveys
INSERT INTO surveys (id, name, description, status) VALUES
('survey-1', 'Population Census Survey', 'National population census data collection', 'active'),
('survey-2', 'Economic Household Survey', 'Household economic status survey', 'active'),
('survey-3', 'Health and Nutrition Survey', 'Health and nutrition assessment', 'active'),
('survey-4', 'Education Access Survey', 'Educational access and quality survey', 'active'),
('survey-5', 'ASUSE Industry Survey', 'Industry and business survey', 'active');

-- Insert admin knowledge base entries using dollar-quoted strings
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
  admin_answer_rich,
  feedback_score,
  times_used,
  correct_feedback_count,
  incorrect_feedback_count
) VALUES
(
  'CAPI stands for Computer Assisted Personal Interview. It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents.',
  'Survey Terminology',
  ARRAY['capi', 'computer', 'assisted', 'personal', 'interview', 'data', 'collection'],
  ARRAY['CAPI', 'Computer Assisted Personal Interview'],
  35,
  200,
  'definition',
  2.0,
  true,
  'What is CAPI?',
  'CAPI stands for Computer Assisted Personal Interview. It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents. The system guides interviewers through the questionnaire, validates responses in real-time, and reduces data entry errors.',
  $html$<p><strong>CAPI</strong> stands for <strong>Computer Assisted Personal Interview</strong>.</p>
<p>It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents.</p>
<h3>Key benefits of CAPI:</h3>
<ul>
<li><strong>Real-time validation</strong> - Catches errors immediately</li>
<li><strong>Skip patterns</strong> - Automatically navigates through questionnaire</li>
<li><strong>Data quality</strong> - Reduces transcription errors</li>
<li><strong>Efficiency</strong> - Faster data collection and processing</li>
</ul>$html$,
  5,
  12,
  10,
  2
),
(
  'CATI stands for Computer Assisted Telephone Interview. It is a survey data collection method where interviewers conduct telephone interviews using specialized computer software.',
  'Survey Terminology',
  ARRAY['cati', 'computer', 'assisted', 'telephone', 'interview', 'survey'],
  ARRAY['CATI', 'Computer Assisted Telephone Interview'],
  28,
  180,
  'definition',
  2.0,
  true,
  'What is CATI?',
  'CATI stands for Computer Assisted Telephone Interview. It is a survey data collection method where interviewers conduct telephone interviews using specialized computer software. The system automatically dials phone numbers, presents questions to interviewers, and records responses directly into a database.',
  $html$<p><strong>CATI</strong> stands for <strong>Computer Assisted Telephone Interview</strong>.</p>
<p>It is a survey data collection method where interviewers conduct telephone interviews using specialized computer software.</p>
<h3>CATI features:</h3>
<ul>
<li><strong>Automatic dialing</strong> - System dials phone numbers automatically</li>
<li><strong>Question presentation</strong> - Shows questions to interviewers in sequence</li>
<li><strong>Direct recording</strong> - Responses recorded directly into database</li>
<li><strong>Call management</strong> - Tracks call attempts and outcomes</li>
</ul>$html$,
  4,
  8,
  7,
  1
),
(
  'Non-response occurs when selected sample units do not participate in the survey. This can be due to refusal, inability to contact, or other reasons.',
  'Data Quality',
  ARRAY['non-response', 'survey', 'participation', 'refusal', 'contact'],
  ARRAY['Non-response'],
  25,
  150,
  'explanation',
  1.8,
  true,
  'How do I handle non-response in surveys?',
  'Non-response occurs when selected sample units do not participate in the survey. This can be due to refusal, inability to contact, or other reasons. High non-response rates can introduce bias into survey results.',
  $html$<p><strong>Non-response</strong> occurs when selected sample units do not participate in the survey.</p>
<h3>How to handle non-response:</h3>
<ol>
<li><strong>Follow up</strong> with non-respondents multiple times</li>
<li><strong>Use different contact methods</strong> (phone, email, in-person)</li>
<li><strong>Offer incentives</strong> if appropriate and allowed</li>
<li><strong>Document reasons</strong> for non-response</li>
<li><strong>Calculate and report</strong> response rates accurately</li>
</ol>
<p>High non-response rates can introduce bias into survey results, so it is important to minimize them through proper survey design and fieldwork procedures.</p>$html$,
  3,
  6,
  5,
  1
),
(
  'Data quality refers to the accuracy, completeness, consistency, and reliability of collected survey data. It is ensured through proper training, standardized procedures, validation checks, and quality control measures.',
  'Data Quality',
  ARRAY['data', 'quality', 'accuracy', 'completeness', 'consistency', 'reliability'],
  ARRAY['Data Quality'],
  30,
  190,
  'definition',
  2.2,
  true,
  'What is data quality in surveys?',
  'Data quality refers to the accuracy, completeness, consistency, and reliability of collected survey data. It is ensured through proper training, standardized procedures, validation checks, and quality control measures.',
  $html$<p><strong>Data quality</strong> refers to the accuracy, completeness, consistency, and reliability of collected survey data.</p>
<h3>Key dimensions of data quality:</h3>
<ul>
<li><strong>Accuracy</strong> - Data correctly represents reality</li>
<li><strong>Completeness</strong> - All required data is collected</li>
<li><strong>Consistency</strong> - Data is uniform across the dataset</li>
<li><strong>Reliability</strong> - Data can be trusted and reproduced</li>
</ul>
<h3>How to ensure data quality:</h3>
<ol>
<li>Proper interviewer training</li>
<li>Standardized procedures</li>
<li>Real-time validation checks</li>
<li>Quality control measures</li>
<li>Regular supervision and monitoring</li>
</ol>$html$,
  6,
  15,
  13,
  2
);