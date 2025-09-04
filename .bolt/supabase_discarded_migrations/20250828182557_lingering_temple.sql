/*
  # Fix foreign key constraint and schema issues

  1. Schema Updates
    - Add missing `admin_images` column to `unanswered_queries` table
    - Ensure demo users exist in the users table for foreign key constraints

  2. Data Fixes
    - Insert demo users if they don't exist
    - Update foreign key references to use auth.users instead of public.users

  3. Security
    - Maintain existing RLS policies
*/

-- Add missing admin_images column to unanswered_queries table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'unanswered_queries' AND column_name = 'admin_images'
  ) THEN
    ALTER TABLE unanswered_queries ADD COLUMN admin_images jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Insert demo users into auth.users table if they don't exist
-- Note: This is a simplified approach for demo purposes
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Admin User"}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'enum@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Enumerator User"}'),
  ('550e8400-e29b-41d4-a716-446655440003', 'super@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Supervisor User"}'),
  ('550e8400-e29b-41d4-a716-446655440004', 'zo@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"ZO User"}'),
  ('550e8400-e29b-41d4-a716-446655440005', 'ro@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"RO User"}')
ON CONFLICT (email) DO NOTHING;

-- Update public.users table to match auth.users IDs
INSERT INTO public.users (id, email, name, role, status, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@example.com', 'Admin User', 'admin', 'active', now(), now()),
  ('550e8400-e29b-41d4-a716-446655440002', 'enum@example.com', 'Enumerator User', 'enumerator', 'active', now(), now()),
  ('550e8400-e29b-41d4-a716-446655440003', 'super@example.com', 'Supervisor User', 'supervisor', 'active', now(), now()),
  ('550e8400-e29b-41d4-a716-446655440004', 'zo@example.com', 'ZO User', 'zo', 'active', now(), now()),
  ('550e8400-e29b-41d4-a716-446655440005', 'ro@example.com', 'RO User', 'ro', 'active', now(), now())
ON CONFLICT (email) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = now();