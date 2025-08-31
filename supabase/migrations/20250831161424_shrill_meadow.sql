/*
  # Populate auth.users table and fix authentication

  1. New Operations
    - Insert demo users into auth.users table
    - Update foreign key constraints to reference correct tables
    - Ensure proper authentication flow

  2. Security
    - Maintain RLS policies
    - Ensure proper user authentication

  3. Data Consistency
    - Sync public.users with auth.users
    - Fix foreign key references
*/

-- Insert demo users into auth.users table
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES 
(
  'admin-user-id',
  'admin@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Admin User", "role": "admin"}',
  false,
  'authenticated'
),
(
  'enum-user-id',
  'enum@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "John Enumerator", "role": "enumerator"}',
  false,
  'authenticated'
),
(
  'super-user-id',
  'super@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Jane Supervisor", "role": "supervisor"}',
  false,
  'authenticated'
),
(
  'zo-user-id',
  'zo@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "ZO User", "role": "zo"}',
  false,
  'authenticated'
),
(
  'ro-user-id',
  'ro@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "RO User", "role": "ro"}',
  false,
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Update public.users to match auth.users IDs
UPDATE public.users SET id = 'admin-user-id' WHERE email = 'admin@example.com';
UPDATE public.users SET id = 'enum-user-id' WHERE email = 'enum@example.com';
UPDATE public.users SET id = 'super-user-id' WHERE email = 'super@example.com';
UPDATE public.users SET id = 'zo-user-id' WHERE email = 'zo@example.com';
UPDATE public.users SET id = 'ro-user-id' WHERE email = 'ro@example.com';