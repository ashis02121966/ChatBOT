-- Create the admin_knowledge table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_knowledge (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    original_question text NOT NULL,
    admin_answer text NOT NULL,
    admin_answer_rich text,
    survey_id text REFERENCES public.surveys(id),
    images jsonb DEFAULT '[]'::jsonb,
    created_by uuid REFERENCES auth.users(id),
    feedback_score integer DEFAULT 0,
    times_used integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_survey_id ON public.admin_knowledge (survey_id);
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_created_by ON public.admin_knowledge (created_by);
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_feedback_score ON public.admin_knowledge (feedback_score DESC);
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_times_used ON public.admin_knowledge (times_used DESC);

-- Add full-text search index for original_question and admin_answer
ALTER TABLE public.admin_knowledge ADD COLUMN IF NOT EXISTS tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', original_question || ' ' || admin_answer)) STORED;
CREATE INDEX IF NOT EXISTS idx_admin_knowledge_tsv ON public.admin_knowledge USING GIN (tsv);

-- Enable Row Level Security
ALTER TABLE public.admin_knowledge ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Admins can manage all knowledge" ON public.admin_knowledge;
CREATE POLICY "Admins can manage all knowledge" ON public.admin_knowledge
FOR ALL USING (EXISTS (SELECT 1 FROM auth.users WHERE users.id = auth.uid() AND (users.raw_user_meta_data->>'role') = 'admin'));

DROP POLICY IF EXISTS "Users can read admin knowledge" ON public.admin_knowledge;
CREATE POLICY "Users can read admin knowledge" ON public.admin_knowledge
FOR SELECT USING (true);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at column
DROP TRIGGER IF EXISTS update_admin_knowledge_updated_at ON public.admin_knowledge;
CREATE TRIGGER update_admin_knowledge_updated_at
BEFORE UPDATE ON public.admin_knowledge
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();