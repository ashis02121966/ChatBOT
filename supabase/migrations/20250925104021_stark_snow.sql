/*
  # Create Mock Users for Authentication

  1. New Auth Users
    - Creates 5 demo users in auth.users table with proper authentication
    - Each user has email/password authentication enabled
    - Passwords are hashed using Supabase's auth system

  2. User Profiles
    - Creates corresponding profiles in public.users table
    - Links auth users to profile data via foreign keys
    - Sets appropriate roles for each user type

  3. Sample Data
    - Creates sample surveys for testing
    - Ensures referential integrity between tables

  Note: This migration creates actual Supabase auth users that can authenticate
*/

-- First, create the auth users with proper authentication
-- Note: In production, you would typically use Supabase's signup API
-- For development/demo purposes, we'll insert directly into auth.users

-- Insert auth users (this requires admin privileges)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  email_change_token_new,
  recovery_token,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  last_sign_in_at
) VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'admin@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'enum@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'super@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    now()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '00000000-0000-0000-0000-000000000000',
    'zo@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    now()
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '00000000-0000-0000-0000-000000000000',
    'ro@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    now()
  )
ON CONFLICT (email) DO NOTHING;

-- Insert corresponding user profiles
INSERT INTO public.users (
  id,
  email,
  name,
  role,
  status,
  created_at,
  updated_at
) VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    'admin@example.com',
    'Admin User',
    'admin',
    'active',
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'enum@example.com',
    'Enumerator User',
    'enumerator',
    'active',
    now(),
    now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'super@example.com',
    'Supervisor User',
    'supervisor',
    'active',
    now(),
    now()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'zo@example.com',
    'ZO User',
    'zo',
    'active',
    now(),
    now()
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'ro@example.com',
    'RO User',
    'ro',
    'active',
    now(),
    now()
  )
ON CONFLICT (email) DO NOTHING;

-- Insert sample surveys
INSERT INTO public.surveys (
  id,
  name,
  description,
  status,
  created_by,
  created_at,
  updated_at
) VALUES 
  (
    'survey-001',
    'Population Census 2024',
    'National population and housing census survey',
    'active',
    '11111111-1111-1111-1111-111111111111',
    now(),
    now()
  ),
  (
    'survey-002',
    'Economic Survey 2024',
    'Annual economic indicators and business survey',
    'active',
    '11111111-1111-1111-1111-111111111111',
    now(),
    now()
  ),
  (
    'survey-003',
    'Health Survey 2024',
    'Community health and wellness assessment',
    'active',
    '11111111-1111-1111-1111-111111111111',
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;