@@ -45,7 +45,7 @@
 -- Enable RLS
 ALTER TABLE admin_knowledge ENABLE ROW LEVEL SECURITY;
 
--- Create RLS policies
+-- Create RLS policies 
 CREATE POLICY "Admins can manage all admin knowledge"
   ON admin_knowledge
   FOR ALL
@@ -65,12 +65,6 @@
   TO authenticated
   USING (survey_id IS NULL OR survey_id IN (SELECT id FROM surveys));
 
--- Clear existing sample data to avoid duplicates
-DELETE FROM admin_knowledge;
-DELETE FROM surveys;
-DELETE FROM users;
-
--- Insert sample users first
-INSERT INTO public.users (id, email, name, role, status, last_login, raw_user_meta_data)
-VALUES
-    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@example.com', 'Admin User', 'admin', 'active', '2024-01-20 10:00:00+00', '{"role": "admin"}'),
-    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'enum@example.com', 'John Enumerator', 'enumerator', 'active', '2024-01-19 11:00:00+00', '{"role": "enumerator"}'),
-    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'super@example.com', 'Jane Supervisor', 'supervisor', 'active', '2024-01-18 12:00:00+00', '{"role": "supervisor"}'),
-    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'zo@example.com', 'ZO User', 'zo', 'inactive', '2024-01-15 13:00:00+00', '{"role": "zo"}'),
-    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'ro@example.com', 'RO User', 'ro', 'active', '2024-01-17 14:00:00+00', '{"role": "ro"}');
-
--- Insert sample surveys
-INSERT INTO public.surveys (id, name, description, status, created_by)
-VALUES
-    ('survey-1', 'Population Census Survey', 'National population census data collection', 'active', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
-    ('survey-2', 'Economic Household Survey', 'Household economic status survey', 'active', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
-    ('survey-3', 'Health and Nutrition Survey', 'Health and nutrition assessment', 'active', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
-    ('survey-4', 'Education Access Survey', 'Educational access and quality survey', 'active', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
-    ('survey-5', 'ASUSE Industry Survey', 'Industry and business survey', 'active', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
+-- Clear existing admin knowledge data to avoid duplicates
+DELETE FROM admin_knowledge;
 
 -- Insert comprehensive admin knowledge with rich HTML content
-INSERT INTO public.admin_knowledge (id, original_question, admin_answer, admin_answer_rich, survey_id, images, created_by, feedback_score, times_used)
+-- Note: Using auth.uid() for created_by to reference the current authenticated user
+-- If no user is authenticated, we'll use NULL which is allowed
+INSERT INTO public.admin_knowledge (id, original_question, admin_answer, admin_answer_rich, survey_id, images, created_by, feedback_score, times_used)
 VALUES
-    ('capi-definition', 'What is CAPI?', 'CAPI stands for Computer Assisted Personal Interview. It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents. The system guides interviewers through the questionnaire, validates responses in real-time, and reduces data entry errors.',
+    ('capi-definition', 'What is CAPI?', 'CAPI stands for Computer Assisted Personal Interview. It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents. The system guides interviewers through the questionnaire, validates responses in real-time, and reduces data entry errors.',
     $html$<p><strong>CAPI</strong> stands for <strong>Computer Assisted Personal Interview</strong>.</p>
     <p>It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents.</p>
     <h3>Key Features:</h3>
@@ -82,7 +76,7 @@
         <li><strong>GPS tracking:</strong> For interviewer monitoring and location verification.</li>
     </ul>
     <p>CAPI significantly improves data quality and efficiency compared to traditional paper-based methods.</p>$html$,
-    'survey-1', '[]', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 5, 10),
+    'survey-1', '[]', NULL, 5, 10),
 
     ('non-response-handling', 'How do I handle non-response in surveys?', 'Non-response occurs when selected sample units do not participate in the survey. High non-response rates can introduce bias into survey results, so it is important to minimize them through proper survey design and fieldwork procedures.',
     $html$<p><strong>Non-response</strong> occurs when selected sample units do not participate in the survey.</p>
@@ -95,7 +89,7 @@
         <li><strong>Calculate and report</strong> response rates accurately</li>
     </ol>
     <p>High non-response rates can introduce bias into survey results, so it is important to minimize them through proper survey design and fieldwork procedures.</p>$html$,
-    'survey-1', '[]', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 4, 8),
+    'survey-1', '[]', NULL, 4, 8),
 
     ('data-quality-checks', 'What are the best practices for data quality checks?', 'Data quality refers to the accuracy, completeness, consistency, and reliability of collected survey data. It is ensured through proper training, standardized procedures, validation checks, and quality control measures.',
     $html$<p><strong>Data quality</strong> refers to the accuracy, completeness, consistency, and reliability of collected survey data.</p>
@@ -109,7 +103,7 @@
         <li><strong>Consistency checks:</strong> Ensure logical flow and relationships between data points.</li>
     </ul>
     <p>High-quality data is crucial for reliable and valid survey results.</p>$html$,
-    'survey-1', '[]', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 5, 12),
+    'survey-1', '[]', NULL, 5, 12),
 
     ('cati-advantages', 'What are the advantages of CATI?', 'CATI stands for Computer Assisted Telephone Interview. It offers several advantages including centralized control, real-time data collection, and efficient sampling.',
     $html$<p><strong>CATI</strong> stands for <strong>Computer Assisted Telephone Interview</strong>.</p>
@@ -122,7 +116,7 @@
         <li><strong>Quality control:</strong> Interviewers can be coached and errors corrected instantly.</li>
     </ul>
     <p>CATI is particularly useful for large-scale surveys requiring quick turnaround times.</p>$html$,
-    'survey-2', '[]', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 4, 7),
+    'survey-2', '[]', NULL, 4, 7),
 
     ('sampling-frame', 'What is a sampling frame?', 'A sampling frame is a complete list of all units in the target population from which a sample can be drawn. It serves as the basis for selecting survey respondents and should ideally cover the entire population of interest.',
     $html$<p>A <strong>sampling frame</strong> is a complete list of all units in the target population from which a sample can be drawn.</p>
@@ -134,7 +128,7 @@
         <li><strong>No duplicates:</strong> Each unit should appear only once.</li>
     </ul>
     <p>A well-constructed sampling frame is essential for drawing a representative sample and ensuring the validity of survey results.</p>$html$,
-    'survey-2', '[]', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 3, 5),
+    'survey-2', '[]', NULL, 3, 5),
 
     ('enumeration-process', 'What is the enumeration process?', 'Enumeration is the systematic process of collecting data from all units in a survey sample. It involves visiting households or establishments, conducting interviews, and recording information according to survey protocols and procedures.',
     $html$<p><strong>Enumeration</strong> is the systematic process of collecting data from all units in a survey sample.</p>
@@ -147,7 +141,7 @@
         <li><strong>Quality assurance:</strong> Follow standardized procedures and protocols.</li>
     </ul>
     <p>Proper enumeration is crucial for obtaining accurate and reliable survey data.</p>$html$,
-    'survey-1', '[]', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 4, 9),
+    'survey-1', '[]', NULL, 4, 9),
 
     ('validation-rules', 'How do validation rules work in surveys?', 'Validation refers to checks performed on survey data to ensure accuracy and consistency. This includes range checks, consistency checks, and logical validation rules applied during data collection or processing.',
     $html$<p><strong>Validation</strong> refers to checks performed on survey data to ensure accuracy and consistency.</p>
@@ -160,7 +154,7 @@
         <li><strong>Cross-field validation:</strong> Check relationships between different fields.</li>
     </ul>
     <p>Proper validation helps maintain data quality and reduces the need for extensive data cleaning later.</p>$html$,
-    'survey-3', '[]', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 5, 11),
+    'survey-3', '[]', NULL, 5, 11),
 
     ('fieldwork-procedures', 'What are the key fieldwork procedures?', 'Field work refers to the data collection phase of a survey where enumerators visit respondents to conduct interviews. It includes activities like locating households, conducting interviews, and completing survey forms.',
     $html$<p><strong>Field work</strong> refers to the data collection phase of a survey where enumerators visit respondents to conduct interviews.</p>
@@ -173,7 +167,7 @@
         <li><strong>Data transmission:</strong> Submit completed forms promptly and securely.</li>
     </ul>
     <p>Well-organized fieldwork is essential for successful survey implementation and high-quality data collection.</p>$html$,
-    'survey-4', '[]', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 4, 6);
+    'survey-4', '[]', NULL, 4, 6);
 
 -- Create indexes for better performance
 CREATE INDEX IF NOT EXISTS idx_admin_knowledge_survey_id ON admin_knowledge(survey_id);