@@ .. @@
-- Insert documents with generated UUIDs
+DO $$
+DECLARE
+    doc1_id uuid := gen_random_uuid();
+    doc2_id uuid := gen_random_uuid();
+    doc3_id uuid := gen_random_uuid();
+    doc4_id uuid := gen_random_uuid();
+BEGIN
+    -- Store document IDs for later use
+    PERFORM set_config('app.doc1_id', doc1_id::text, true);
+    PERFORM set_config('app.doc2_id', doc2_id::text, true);
+    PERFORM set_config('app.doc3_id', doc3_id::text, true);
+    PERFORM set_config('app.doc4_id', doc4_id::text, true);
+
 INSERT INTO public.documents (id, file_name, survey_id, category, content, file_type, upload_date, processed_date, word_count, character_count, chunk_count, image_count, processing_method, is_admin_generated, user_id, created_at, updated_at) VALUES
-(doc1_id, 'Census Procedures Manual.pdf', 'survey-1', 'General Questions', 'CENSUS PROCEDURES MANUAL
+(doc1_id, 'Census Procedures Manual.pdf', 'survey-1', 'General Questions', 'CENSUS PROCEDURES MANUAL

=== INTRODUCTION ===
This manual provides comprehensive guidelines for conducting population census surveys. It covers all aspects of data collection, from initial planning to final reporting.

=== ENUMERATION PROCEDURES ===
Enumerators must follow these key steps:
1. Identify the household head
2. Complete the household roster
3. Ask questions in the prescribed order
4. Verify responses for consistency
5. Thank the respondent

=== DATA QUALITY ASSURANCE ===
Quality control measures include:
- Supervisor spot checks
- Real-time data validation
- Consistency checks across forms
- Follow-up interviews when needed

=== CAPI SYSTEM USAGE ===
The Computer Assisted Personal Interview (CAPI) system helps ensure data quality through:
- Automatic skip patterns
- Range checks for numeric fields
- Consistency validations
- GPS coordinate capture

=== COMMON ISSUES AND SOLUTIONS ===
Q: What if a respondent refuses to answer?
A: Explain the importance of the census and assure confidentiality. If they still refuse, mark as "refused" and move to the next household.

Q: How to handle incomplete households?
A: Make at least 3 attempts at different times. Document each attempt and reason for non-response.', 'application/pdf', now() - interval '5 days', now() - interval '5 days', 245, 1456, 3, 2, 'server-side-enhanced', false, current_setting('app.admin_user_id')::uuid, now() - interval '5 days', now()),

+(doc2_id, 'Data Collection Guidelines.docx', 'survey-2', 'Detail Schedule', 'DATA COLLECTION GUIDELINES

=== HOUSEHOLD ECONOMIC SURVEY ===
This document outlines the procedures for collecting household economic data.

=== INCOME QUESTIONS ===
When asking about household income:
- Start with employment status of all members
- Ask about primary and secondary income sources
- Include government transfers and benefits
- Verify amounts and frequency

=== EXPENDITURE TRACKING ===
Record all household expenditures:
- Food and beverages
- Housing costs (rent, utilities)
- Transportation
- Healthcare
- Education
- Other goods and services

=== ASSET INVENTORY ===
Document household assets:
- Real estate properties
- Vehicles
- Financial assets (savings, investments)
- Durable goods (appliances, electronics)
- Livestock and agricultural equipment

=== VALIDATION PROCEDURES ===
Cross-check responses for consistency:
- Income should align with expenditure patterns
- Asset ownership should match reported wealth
- Employment status should match income sources', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', now() - interval '4 days', now() - interval '4 days', 189, 1123, 2, 1, 'client-side', false, current_setting('app.enum_user_id')::uuid, now() - interval '4 days', now()),

+(doc3_id, 'Sample Forms.xlsx', 'survey-3', 'Listing', 'HEALTH AND NUTRITION SURVEY FORMS

=== SHEET: Demographic Information ===
Row 1: Household ID, Member ID, Name, Age, Gender, Relationship to Head
Row 2: HH001, M01, John Smith, 45, Male, Head
Row 3: HH001, M02, Mary Smith, 42, Female, Spouse
Row 4: HH001, M03, Tom Smith, 16, Male, Son

=== SHEET: Health Status ===
Row 1: Member ID, General Health, Chronic Conditions, Disability Status, Healthcare Access
Row 2: M01, Good, Diabetes, None, Yes
Row 3: M02, Excellent, None, None, Yes
Row 4: M03, Good, None, None, Yes

=== SHEET: Nutrition Data ===
Row 1: Member ID, Height (cm), Weight (kg), BMI, Dietary Restrictions, Food Security
Row 2: M01, 175, 80, 26.1, None, Secure
Row 3: M02, 165, 60, 22.0, Vegetarian, Secure
Row 4: M03, 170, 65, 22.5, None, Secure

=== SHEET: Immunization Records ===
Row 1: Member ID, Vaccination Status, Last Checkup, Preventive Care
Row 2: M01, Complete, 2023-06-15, Annual
Row 3: M02, Complete, 2023-08-20, Annual
Row 4: M03, Complete, 2023-09-10, Annual', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', now() - interval '3 days', now() - interval '3 days', 156, 934, 2, 0, 'server-side', false, current_setting('app.super_user_id')::uuid, now() - interval '3 days', now()),

+(doc4_id, 'Training Manual.txt', 'survey-4', 'Additional Schedule', 'EDUCATION ACCESS SURVEY TRAINING MANUAL

=== SURVEY OBJECTIVES ===
The Education Access Survey aims to:
- Assess enrollment rates across different education levels
- Identify barriers to educational access
- Evaluate quality of educational services
- Measure learning outcomes

=== TARGET POPULATION ===
The survey covers:
- Children aged 3-18 years
- Parents and guardians
- School administrators
- Teachers and education staff

=== KEY INDICATORS ===
Primary indicators include:
- Net enrollment rates by level
- Dropout rates and reasons
- Distance to nearest school
- School infrastructure quality
- Teacher qualifications
- Learning achievement scores

=== INTERVIEW TECHNIQUES ===
Best practices for education surveys:
- Use age-appropriate language for children
- Ensure privacy for sensitive questions
- Verify school records when possible
- Ask about both formal and informal education

=== QUALITY CONTROL ===
Supervisors should:
- Observe at least 10% of interviews
- Check completed forms for consistency
- Verify GPS coordinates of schools
- Conduct callback interviews for 5% of households', 'text/plain', now() - interval '2 days', now() - interval '2 days', 198, 1187, 2, 0, 'client-side', false, current_setting('app.zo_user_id')::uuid, now() - interval '2 days', now())
+    ON CONFLICT (id) DO NOTHING;
+END $$;