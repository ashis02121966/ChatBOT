-- Delete all existing sample data first
DELETE FROM public.admin_knowledge;
DELETE FROM public.unanswered_queries;
DELETE FROM public.chat_messages;
DELETE FROM public.chat_sessions;
DELETE FROM public.document_chunks;
DELETE FROM public.document_images;
DELETE FROM public.documents;
DELETE FROM public.surveys;
DELETE FROM public.users;

-- Reset sequences if they exist
SELECT setval(pg_get_serial_sequence('users', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('surveys', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('documents', 'id'), 1, false);

-- Insert fresh sample data
INSERT INTO public.users (id, email, name, role, status, last_login, raw_user_meta_data)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@example.com', 'Admin User', 'admin', 'active', '2024-01-20 10:00:00+00', '{"role": "admin"}'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'enum@example.com', 'John Enumerator', 'enumerator', 'active', '2024-01-19 11:00:00+00', '{"role": "enumerator"}'),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'super@example.com', 'Jane Supervisor', 'supervisor', 'active', '2024-01-18 12:00:00+00', '{"role": "supervisor"}'),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'zo@example.com', 'ZO User', 'zo', 'inactive', '2024-01-15 13:00:00+00', '{"role": "zo"}'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'ro@example.com', 'RO User', 'ro', 'active', '2024-01-17 14:00:00+00', '{"role": "ro"}');

INSERT INTO public.surveys (id, name, description, status, created_by)
VALUES
    ('survey-1', 'Population Census Survey', 'National population census data collection', 'active', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('survey-2', 'Economic Household Survey', 'Household economic status survey', 'active', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('survey-3', 'Health and Nutrition Survey', 'Health and nutrition assessment', 'active', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('survey-4', 'Education Access Survey', 'Educational access and quality survey', 'active', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('survey-5', 'ASUSE Industry Survey', 'Industry and business survey', 'active', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

INSERT INTO public.admin_knowledge (id, original_question, admin_answer, admin_answer_rich, survey_id, images, created_by, feedback_score, times_used)
VALUES
    ('capi-definition', 'What is CAPI?', 'CAPI stands for Computer Assisted Personal Interview. It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents. The system guides interviewers through the questionnaire, validates responses in real-time, and reduces data entry errors.',
    $html$<p><strong>CAPI</strong> stands for <strong>Computer Assisted Personal Interview</strong>.</p>
    <p>It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents.</p>
    <h3>Key Features:</h3>
    <ul>
        <li><strong>Real-time validation:</strong> Reduces data entry errors.</li>
        <li><strong>Automated skip patterns:</strong> Ensures correct question flow.</li>
        <li><strong>Multimedia integration:</strong> Can include images, audio, video.</li>
        <li><strong>GPS tracking:</strong> For interviewer monitoring and location verification.</li>
    </ul>
    <p>CAPI significantly improves data quality and efficiency compared to traditional paper-based methods.</p>$html$,
    'survey-1', '[]', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 5, 10),

    ('non-response-handling', 'How do I handle non-response in surveys?', 'Non-response occurs when selected sample units do not participate in the survey. High non-response rates can introduce bias into survey results, so it is important to minimize them through proper survey design and fieldwork procedures.',
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
    'survey-1', '[]', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 4, 8),

    ('data-quality-checks', 'What are the best practices for data quality checks?', 'Data quality refers to the accuracy, completeness, consistency, and reliability of collected survey data. It is ensured through proper training, standardized procedures, validation checks, and quality control measures.',
    $html$<p><strong>Data quality</strong> refers to the accuracy, completeness, consistency, and reliability of collected survey data.</p>
    <h3>Best Practices for Data Quality Checks:</h3>
    <ul>
        <li><strong>Pre-testing questionnaires:</strong> Identify ambiguities before fieldwork.</li>
        <li><strong>Interviewer training:</strong> Ensure consistent application of methods.</li>
        <li><strong>Real-time validation:</strong> Implement checks during data collection (e.g., CAPI).</li>
        <li><strong>Supervision and back-checks:</strong> Verify collected data in the field.</li>
        <li><strong>Data cleaning:</strong> Identify and correct errors post-collection.</li>
        <li><strong>Consistency checks:</strong> Ensure logical flow and relationships between data points.</li>
    </ul>
    <p>High-quality data is crucial for reliable and valid survey results.</p>$html$,
    'survey-1', '[]', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 5, 12),

    ('cati-advantages', 'What are the advantages of CATI?', 'CATI stands for Computer Assisted Telephone Interview. It offers several advantages including centralized control, real-time data collection, and efficient sampling.',
    $html$<p><strong>CATI</strong> stands for <strong>Computer Assisted Telephone Interview</strong>.</p>
    <h3>Advantages of CATI:</h3>
    <ul>
        <li><strong>Centralized control:</strong> Supervisors can monitor interviews in real-time.</li>
        <li><strong>Real-time data:</strong> Data is immediately available for analysis.</li>
        <li><strong>Cost-effective:</strong> Reduces travel time and paper costs.</li>
        <li><strong>Efficient sampling:</strong> Automated dialing and callback management.</li>
        <li><strong>Quality control:</strong> Interviewers can be coached and errors corrected instantly.</li>
    </ul>
    <p>CATI is particularly useful for large-scale surveys requiring quick turnaround times.</p>$html$,
    'survey-2', '[]', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 4, 7),

    ('sampling-frame', 'What is a sampling frame?', 'A sampling frame is a complete list of all units in the target population from which a sample can be drawn. It serves as the basis for selecting survey respondents and should ideally cover the entire population of interest.',
    $html$<p>A <strong>sampling frame</strong> is a complete list of all units in the target population from which a sample can be drawn.</p>
    <h3>Characteristics of a Good Sampling Frame:</h3>
    <ul>
        <li><strong>Completeness:</strong> Should include all eligible units.</li>
        <li><strong>Accuracy:</strong> Information about units should be correct.</li>
        <li><strong>Up-to-dateness:</strong> Should be current and reflect recent changes.</li>
        <li><strong>No duplicates:</strong> Each unit should appear only once.</li>
    </ul>
    <p>A well-constructed sampling frame is essential for drawing a representative sample and ensuring the validity of survey results.</p>$html$,
    'survey-2', '[]', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 3, 5);