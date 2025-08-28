/*
  # Create chat tables

  1. New Tables
    - `chat_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `survey_id` (text, foreign key to surveys)
      - `category` (text, nullable)
      - `message_count` (integer, default 0)
      - `total_feedback_positive` (integer, default 0)
      - `total_feedback_negative` (integer, default 0)
      - `session_duration` (interval, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `chat_messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to chat_sessions)
      - `content` (text)
      - `rich_content` (text, nullable)
      - `sender` (enum: user, bot, admin)
      - `feedback_type` (enum: positive, negative, nullable)
      - `feedback_provided` (boolean, default false)
      - `alternative_attempts` (integer, default 0)
      - `original_query` (text, nullable)
      - `images` (jsonb, default '[]')
      - `processing_time` (interval, nullable)
      - `confidence_score` (numeric, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own sessions and messages
    - Add policies for admins to read all sessions and messages
</sql>

-- Create enum types for message sender and feedback
DO $$ BEGIN
    CREATE TYPE message_sender AS ENUM ('user', 'bot', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE feedback_type AS ENUM ('positive', 'negative');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    survey_id text NOT NULL,
    category text,
    message_count integer DEFAULT 0,
    total_feedback_positive integer DEFAULT 0,
    total_feedback_negative integer DEFAULT 0,
    session_duration interval,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    content text NOT NULL,
    rich_content text,
    sender message_sender NOT NULL,
    feedback_type feedback_type,
    feedback_provided boolean DEFAULT false,
    alternative_attempts integer DEFAULT 0,
    original_query text,
    images jsonb DEFAULT '[]'::jsonb,
    processing_time interval,
    confidence_score numeric(3,2),
    created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_survey_id ON public.chat_sessions (survey_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON public.chat_sessions (created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages (session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages (sender);
CREATE INDEX IF NOT EXISTS idx_chat_messages_feedback_type ON public.chat_messages (feedback_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages (created_at);

-- Enable Row Level Security
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_sessions
DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.chat_sessions;
CREATE POLICY "Users can manage their own sessions" ON public.chat_sessions
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all sessions" ON public.chat_sessions;
CREATE POLICY "Admins can read all sessions" ON public.chat_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE users.id = auth.uid() 
            AND (users.raw_user_meta_data->>'role') = 'admin'
        )
    );

-- RLS Policies for chat_messages
DROP POLICY IF EXISTS "Users can manage messages in their sessions" ON public.chat_messages;
CREATE POLICY "Users can manage messages in their sessions" ON public.chat_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions 
            WHERE chat_sessions.id = chat_messages.session_id 
            AND chat_sessions.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can read all messages" ON public.chat_messages;
CREATE POLICY "Admins can read all messages" ON public.chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE users.id = auth.uid() 
            AND (users.raw_user_meta_data->>'role') = 'admin'
        )
    );

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to chat_sessions
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();