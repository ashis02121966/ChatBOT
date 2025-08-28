/*
# Create admin_knowledge table and insert sample data

1. New Tables
   - `admin_knowledge`
     - `id` (text, primary key)
     - `original_question` (text, not null)
     - `admin_answer` (text, not null)
     - `admin_answer_rich` (text, nullable for rich HTML content)
     - `survey_id` (text, nullable, references surveys)
     - `images` (jsonb, default empty array)
     - `created_by` (uuid, nullable, references users)
     - `feedback_score` (integer, default 0)
     - `times_used` (integer, default 0)
     - `correct_feedback_count` (integer, default 0)
     - `incorrect_feedback_count` (integer, default 0)
     - `created_at` (timestamptz, default now())
     - `updated_at` (timestamptz, default now())

2. Security
   - Enable RLS on `admin_knowledge` table
   - Add policies for admins to manage all knowledge
   - Add policies for users to read knowledge

3. Sample Data
   - Insert comprehensive admin knowledge entries
   - Include rich HTML content for better responses
   - Cover common survey topics and procedures
*/

-- Create admin_knowledge table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_knowledge (
    id text PRIMARY KEY,
    original_question text NOT NULL,
    admin_answer text NOT NULL,
    admin_answer_rich text,
    survey_id text,
    images jsonb DEFAULT '[]'::jsonb,
    created_by uuid,
    feedback_score integer DEFAULT 0,
    times_used integer DEFAULT 0,
    correct_feedback_count integer DEFAULT 0,
    incorrect_feedback_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'admin_knowledge_survey_id_fkey'
    ) THEN
        ALTER TABLE admin_knowledge 
        ADD CONSTRAINT admin_knowledge_survey_id_fkey 
        FOREIGN KEY (survey_id) REFERENCES surveys(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'admin_knowledge_created_by_fkey'
    ) THEN
        ALTER TABLE admin_knowledge 
        ADD CONSTRAINT admin_knowledge_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES users(id);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE admin_knowledge ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'admin_knowledge' AND policyname = 'Admins can manage all knowledge'
    ) THEN
        CREATE POLICY "Admins can manage all knowledge"
        ON admin_knowledge
        FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.raw_user_meta_data->>'role' = 'admin'
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.raw_user_meta_data->>'role' = 'admin'
            )
        );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'admin_knowledge' AND policyname = 'Users can read knowledge'
    ) THEN
        CREATE POLICY "Users can read knowledge"
        ON admin_knowledge
        FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END $$;

-- Create updated_at trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_admin_knowledge_updated_at'
    ) THEN
        CREATE TRIGGER update_admin_knowledge_updated_at
        BEFORE UPDATE ON admin_knowledge
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Clear existing sample data
DELETE FROM admin_knowledge WHERE id IN (
    'capi-definition',
    'cati-definition', 
    'cawi-definition',
    'non-response-handling',
    'data-quality-checks',
    'cati-advantages',
    'sampling-frame',
    'enumeration-process',
    'survey-validation',
    'fieldwork-procedures'
);

-- Insert fresh sample data
INSERT INTO admin_knowledge (
    id, 
    original_question, 
    admin_answer, 
    admin_answer_rich, 
    survey_id, 
    images, 
    created_by, 
    feedback_score, 
    times_used
) VALUES
    (
        'capi-definition',
        'What is CAPI?',
        'CAPI stands for Computer Assisted Personal Interview. It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents. The system guides interviewers through the questionnaire, validates responses in real-time, and reduces data entry errors.',
        $html$<p><strong>CAPI</strong> stands for <strong>Computer Assisted Personal Interview</strong>.</p>
<p>It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents.</p>
<h3>Key Features:</h3>
<ul>
    <li><strong>Real-time validation:</strong> Reduces data entry errors</li>
    <li><strong>Automated skip patterns:</strong> Ensures correct question flow</li>
    <li><strong>Multimedia integration:</strong> Can include images, audio, video</li>
    <li><strong>GPS tracking:</strong> For interviewer monitoring and location verification</li>
</ul>
<p>CAPI significantly improves data quality and efficiency compared to traditional paper-based methods.</p>$html$,
        'survey-1',
        '[]'::jsonb,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        5,
        15
    ),
    (
        'cati-definition',
        'What is CATI?',
        'CATI stands for Computer Assisted Telephone Interview. It is a survey data collection method where interviewers conduct telephone interviews using specialized computer software. The system automatically dials phone numbers, presents questions to interviewers, and records responses directly into a database.',
        $html$<p><strong>CATI</strong> stands for <strong>Computer Assisted Telephone Interview</strong>.</p>
<p>It is a survey data collection method where interviewers conduct telephone interviews using specialized computer software.</p>
<h3>Key Advantages:</h3>
<ul>
    <li><strong>Centralized control:</strong> Supervisors can monitor interviews in real-time</li>
    <li><strong>Automated dialing:</strong> System handles phone number management</li>
    <li><strong>Real-time data:</strong> Responses are immediately available</li>
    <li><strong>Cost-effective:</strong> Reduces travel time and paper costs</li>
    <li><strong>Quality control:</strong> Easy supervision and coaching</li>
</ul>
<p>CATI is particularly useful for large-scale surveys requiring quick turnaround times.</p>$html$,
        'survey-2',
        '[]'::jsonb,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        4,
        12
    ),
    (
        'cawi-definition',
        'What is CAWI?',
        'CAWI stands for Computer Assisted Web Interview. It is a self-administered survey method where respondents complete questionnaires online through web browsers. This method allows for automated skip patterns, real-time validation, and multimedia content integration.',
        $html$<p><strong>CAWI</strong> stands for <strong>Computer Assisted Web Interview</strong>.</p>
<p>It is a self-administered survey method where respondents complete questionnaires online through web browsers.</p>
<h3>Benefits:</h3>
<ul>
    <li><strong>Self-administered:</strong> Respondents complete at their own pace</li>
    <li><strong>24/7 availability:</strong> Can be completed anytime, anywhere</li>
    <li><strong>Automated skip patterns:</strong> Dynamic questionnaire flow</li>
    <li><strong>Multimedia support:</strong> Images, videos, and interactive elements</li>
    <li><strong>Real-time validation:</strong> Immediate error checking</li>
    <li><strong>Cost-effective:</strong> No interviewer costs</li>
</ul>
<p>CAWI is ideal for literate populations with good internet access.</p>$html$,
        'survey-3',
        '[]'::jsonb,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        4,
        10
    ),
    (
        'non-response-handling',
        'How do I handle non-response in surveys?',
        'Non-response occurs when selected sample units do not participate in the survey. High non-response rates can introduce bias into survey results, so it is important to minimize them through proper survey design and fieldwork procedures.',
        $html$<p><strong>Non-response</strong> occurs when selected sample units do not participate in the survey.</p>
<h3>Strategies to Handle Non-response:</h3>
<ol>
    <li><strong>Multiple contact attempts:</strong> Follow up with non-respondents several times</li>
    <li><strong>Vary contact methods:</strong> Use phone, email, in-person visits</li>
    <li><strong>Optimal timing:</strong> Contact at different times of day/week</li>
    <li><strong>Incentives:</strong> Offer appropriate compensation if allowed</li>
    <li><strong>Advance letters:</strong> Send notification before contact</li>
    <li><strong>Refusal conversion:</strong> Train interviewers to address concerns</li>
</ol>
<h3>Documentation:</h3>
<ul>
    <li>Record reasons for non-response</li>
    <li>Calculate and report response rates accurately</li>
    <li>Assess potential bias from non-response</li>
</ul>
<p>High non-response rates can introduce bias, so minimizing them is crucial for data quality.</p>$html$,
        'survey-1',
        '[]'::jsonb,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        5,
        18
    ),
    (
        'data-quality-checks',
        'What are the best practices for data quality checks?',
        'Data quality refers to the accuracy, completeness, consistency, and reliability of collected survey data. It is ensured through proper training, standardized procedures, validation checks, and quality control measures.',
        $html$<p><strong>Data quality</strong> refers to the accuracy, completeness, consistency, and reliability of collected survey data.</p>
<h3>Best Practices for Data Quality:</h3>
<h4>Pre-fieldwork:</h4>
<ul>
    <li><strong>Questionnaire pre-testing:</strong> Identify ambiguities before fieldwork</li>
    <li><strong>Interviewer training:</strong> Ensure consistent application of methods</li>
    <li><strong>System testing:</strong> Validate CAPI/CATI applications</li>
</ul>
<h4>During fieldwork:</h4>
<ul>
    <li><strong>Real-time validation:</strong> Implement checks during data collection</li>
    <li><strong>Supervision:</strong> Monitor interviewer performance</li>
    <li><strong>Back-checks:</strong> Re-contact respondents to verify data</li>
    <li><strong>Progress monitoring:</strong> Track completion rates and quality metrics</li>
</ul>
<h4>Post-fieldwork:</h4>
<ul>
    <li><strong>Data cleaning:</strong> Identify and correct errors</li>
    <li><strong>Consistency checks:</strong> Verify logical relationships</li>
    <li><strong>Outlier detection:</strong> Flag unusual values for review</li>
</ul>
<p>High-quality data is essential for reliable and valid survey results.</p>$html$,
        'survey-1',
        '[]'::jsonb,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        5,
        22
    ),
    (
        'sampling-frame',
        'What is a sampling frame?',
        'A sampling frame is a complete list of all units in the target population from which a sample can be drawn. It serves as the basis for selecting survey respondents and should ideally cover the entire population of interest.',
        $html$<p>A <strong>sampling frame</strong> is a complete list of all units in the target population from which a sample can be drawn.</p>
<h3>Characteristics of a Good Sampling Frame:</h3>
<ul>
    <li><strong>Completeness:</strong> Should include all eligible units in the target population</li>
    <li><strong>Accuracy:</strong> Information about units should be correct and up-to-date</li>
    <li><strong>Currency:</strong> Should reflect recent changes in the population</li>
    <li><strong>No duplicates:</strong> Each unit should appear only once</li>
    <li><strong>Adequate information:</strong> Sufficient detail for sampling and contact</li>
</ul>
<h3>Common Types:</h3>
<ul>
    <li><strong>Population registers:</strong> Official government lists</li>
    <li><strong>Electoral rolls:</strong> Voter registration lists</li>
    <li><strong>Telephone directories:</strong> For telephone surveys</li>
    <li><strong>Address lists:</strong> For household surveys</li>
    <li><strong>Business registers:</strong> For establishment surveys</li>
</ul>
<p>A well-constructed sampling frame is essential for drawing a representative sample and ensuring valid survey results.</p>$html$,
        'survey-2',
        '[]'::jsonb,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        4,
        14
    ),
    (
        'enumeration-process',
        'What is the enumeration process?',
        'Enumeration is the systematic process of collecting data from all units in a survey sample. It involves visiting households or establishments, conducting interviews, and recording information according to survey protocols and procedures.',
        $html$<p><strong>Enumeration</strong> is the systematic process of collecting data from all units in a survey sample.</p>
<h3>Key Steps in Enumeration:</h3>
<ol>
    <li><strong>Sample preparation:</strong> Organize and distribute sample units to enumerators</li>
    <li><strong>Household/unit identification:</strong> Locate and verify sample units</li>
    <li><strong>Contact and introduction:</strong> Approach respondents professionally</li>
    <li><strong>Interview conduct:</strong> Follow standardized procedures</li>
    <li><strong>Data recording:</strong> Accurately capture responses</li>
    <li><strong>Quality checks:</strong> Review completed questionnaires</li>
    <li><strong>Submission:</strong> Submit completed work to supervisors</li>
</ol>
<h3>Enumerator Responsibilities:</h3>
<ul>
    <li>Follow survey protocols exactly</li>
    <li>Maintain respondent confidentiality</li>
    <li>Complete all assigned units</li>
    <li>Report problems to supervisors</li>
    <li>Ensure data quality and completeness</li>
</ul>
<p>Proper enumeration is crucial for collecting high-quality, representative data.</p>$html$,
        'survey-1',
        '[]'::jsonb,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        4,
        16
    ),
    (
        'survey-validation',
        'How do validation rules work in surveys?',
        'Validation rules are automated checks built into survey instruments to ensure data quality and consistency. They help prevent errors during data collection by flagging inconsistent or impossible responses.',
        $html$<p><strong>Validation rules</strong> are automated checks built into survey instruments to ensure data quality and consistency.</p>
<h3>Types of Validation Rules:</h3>
<h4>Range Checks:</h4>
<ul>
    <li><strong>Minimum/Maximum values:</strong> Age cannot be negative or over 150</li>
    <li><strong>Valid categories:</strong> Gender must be Male, Female, or Other</li>
</ul>
<h4>Consistency Checks:</h4>
<ul>
    <li><strong>Logical relationships:</strong> Birth year must be consistent with age</li>
    <li><strong>Cross-question validation:</strong> Employment status vs. income</li>
</ul>
<h4>Completeness Checks:</h4>
<ul>
    <li><strong>Required fields:</strong> Essential questions must be answered</li>
    <li><strong>Skip pattern validation:</strong> Ensure proper question flow</li>
</ul>
<h3>Implementation:</h3>
<ul>
    <li><strong>Real-time validation:</strong> Check responses as they are entered</li>
    <li><strong>Soft vs. hard edits:</strong> Warnings vs. blocking errors</li>
    <li><strong>Custom messages:</strong> Clear explanations for interviewers</li>
</ul>
<p>Validation rules significantly improve data quality by catching errors during collection rather than after.</p>$html$,
        'survey-3',
        '[]'::jsonb,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        5,
        13
    ),
    (
        'fieldwork-procedures',
        'What are the standard fieldwork procedures?',
        'Fieldwork procedures are standardized protocols that guide data collection activities. They ensure consistency, quality, and efficiency across all survey operations.',
        $html$<p><strong>Fieldwork procedures</strong> are standardized protocols that guide data collection activities.</p>
<h3>Pre-fieldwork Procedures:</h3>
<ul>
    <li><strong>Staff recruitment and training:</strong> Select and train field staff</li>
    <li><strong>Material preparation:</strong> Prepare questionnaires, devices, supplies</li>
    <li><strong>Sample allocation:</strong> Distribute sample units to teams</li>
    <li><strong>Advance notification:</strong> Inform communities about the survey</li>
</ul>
<h3>During Fieldwork:</h3>
<ul>
    <li><strong>Daily briefings:</strong> Review procedures and address issues</li>
    <li><strong>Progress monitoring:</strong> Track completion rates and quality</li>
    <li><strong>Supervision:</strong> Regular field visits and back-checks</li>
    <li><strong>Problem resolution:</strong> Address fieldwork challenges promptly</li>
    <li><strong>Data transmission:</strong> Regular submission of completed work</li>
</ul>
<h3>Quality Control:</h3>
<ul>
    <li><strong>Spot checks:</strong> Random verification of interviews</li>
    <li><strong>Re-interviews:</strong> Partial re-enumeration for validation</li>
    <li><strong>Data review:</strong> Check completeness and consistency</li>
</ul>
<h3>Post-fieldwork:</h3>
<ul>
    <li><strong>Final data submission:</strong> Complete all outstanding work</li>
    <li><strong>Equipment return:</strong> Account for all materials</li>
    <li><strong>Debriefing:</strong> Document lessons learned</li>
</ul>
<p>Standardized procedures ensure consistent, high-quality data collection across all survey operations.</p>$html$,
        'survey-1',
        '[]'::jsonb,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        5,
        20
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_survey_id ON admin_knowledge(survey_id);
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_created_by ON admin_knowledge(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_feedback_score ON admin_knowledge(feedback_score DESC);
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_times_used ON admin_knowledge(times_used DESC);

-- Create full-text search index for questions and answers
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_search 
ON admin_knowledge USING gin(to_tsvector('english', original_question || ' ' || admin_answer));