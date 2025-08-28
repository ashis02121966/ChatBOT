/*
  # Insert Initial Data

  1. Initial Users
    - Create demo users for testing
  
  2. Initial Surveys
    - Create sample surveys
  
  3. Initial Admin Knowledge
    - Add some basic survey knowledge
*/

-- Insert demo users (these would normally be created through auth)
INSERT INTO users (id, email, name, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@example.com', 'Admin User', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'enum@example.com', 'John Enumerator', 'enumerator'),
  ('33333333-3333-3333-3333-333333333333', 'super@example.com', 'Jane Supervisor', 'supervisor'),
  ('44444444-4444-4444-4444-444444444444', 'zo@example.com', 'ZO User', 'zo'),
  ('55555555-5555-5555-5555-555555555555', 'ro@example.com', 'RO User', 'ro')
ON CONFLICT (email) DO NOTHING;

-- Insert initial surveys
INSERT INTO surveys (id, name, description, created_by) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Population Census Survey', 'National population census data collection', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Economic Household Survey', 'Household economic status survey', '11111111-1111-1111-1111-111111111111'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Health and Nutrition Survey', 'Health and nutrition assessment', '11111111-1111-1111-1111-111111111111'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Education Access Survey', 'Educational access and quality survey', '11111111-1111-1111-1111-111111111111'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ASUSE Industry Survey', 'Industry and business survey', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Insert initial admin knowledge
INSERT INTO admin_knowledge (original_question, admin_answer, admin_answer_rich, survey_id, created_by) VALUES
  (
    'What is CAPI?',
    'CAPI stands for Computer Assisted Personal Interview. It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents.',
    '<p><strong>CAPI</strong> stands for <em>Computer Assisted Personal Interview</em>.</p><p>It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents. The system guides interviewers through the questionnaire, validates responses in real-time, and reduces data entry errors.</p>',
    NULL,
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'What is CATI?',
    'CATI stands for Computer Assisted Telephone Interview. It is a survey data collection method where interviewers conduct telephone interviews using specialized computer software.',
    '<p><strong>CATI</strong> stands for <em>Computer Assisted Telephone Interview</em>.</p><p>It is a survey data collection method where interviewers conduct telephone interviews using specialized computer software. The system automatically dials phone numbers, presents questions to interviewers, and records responses directly into a database.</p>',
    NULL,
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'What is CAWI?',
    'CAWI stands for Computer Assisted Web Interview. It is a self-administered survey method where respondents complete questionnaires online through web browsers.',
    '<p><strong>CAWI</strong> stands for <em>Computer Assisted Web Interview</em>.</p><p>It is a self-administered survey method where respondents complete questionnaires online through web browsers. This method allows for automated skip patterns, real-time validation, and multimedia content integration.</p>',
    NULL,
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'How do I handle non-response in surveys?',
    'Non-response occurs when selected sample units do not participate in the survey. To handle it: 1) Follow up with non-respondents multiple times, 2) Use different contact methods, 3) Offer incentives if appropriate, 4) Document reasons for non-response, 5) Calculate and report response rates.',
    '<p><strong>Non-response</strong> occurs when selected sample units do not participate in the survey.</p><h3>How to handle non-response:</h3><ol><li><strong>Follow up</strong> with non-respondents multiple times</li><li><strong>Use different contact methods</strong> (phone, email, in-person)</li><li><strong>Offer incentives</strong> if appropriate and allowed</li><li><strong>Document reasons</strong> for non-response</li><li><strong>Calculate and report</strong> response rates accurately</li></ol><p>High non-response rates can introduce bias into survey results, so it\'s important to minimize them through proper survey design and fieldwork procedures.</p>',
    NULL,
    '11111111-1111-1111-1111-111111111111'
  )
ON CONFLICT DO NOTHING;