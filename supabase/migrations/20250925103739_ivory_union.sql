/*
  # Insert Mock Users for Development

  1. Mock Users
    - Insert demo users into the users table with proper authentication
    - Includes all role types: admin, enumerator, supervisor, zo, ro
    - Uses consistent UUIDs for reliable testing

  2. Security
    - Users table already has RLS enabled
    - Policies allow authenticated users to read their own data
*/

-- Insert mock users into the users table
INSERT INTO users (id, email, name, role, status, password_hash, salt, created_at, updated_at) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@example.com', 'Admin User', 'admin', 'active', '$2b$10$rOzJqQZ8kVxwGxHxQxQxQeJ8kVxwGxHxQxQxQeJ8kVxwGxHxQxQxQe', 'salt123', now(), now()),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'enum@example.com', 'John Enumerator', 'enumerator', 'active', '$2b$10$rOzJqQZ8kVxwGxHxQxQxQeJ8kVxwGxHxQxQxQeJ8kVxwGxHxQxQxQe', 'salt123', now(), now()),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'super@example.com', 'Jane Supervisor', 'supervisor', 'active', '$2b$10$rOzJqQZ8kVxwGxHxQxQxQeJ8kVxwGxHxQxQxQeJ8kVxwGxHxQxQxQe', 'salt123', now(), now()),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'zo@example.com', 'ZO User', 'zo', 'active', '$2b$10$rOzJqQZ8kVxwGxHxQxQxQeJ8kVxwGxHxQxQxQeJ8kVxwGxHxQxQxQe', 'salt123', now(), now()),
  ('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'ro@example.com', 'RO User', 'ro', 'active', '$2b$10$rOzJqQZ8kVxwGxHxQxQxQeJ8kVxwGxHxQxQxQeJ8kVxwGxHxQxQxQe', 'salt123', now(), now())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = now();

-- Insert corresponding auth.users entries (this would normally be handled by Supabase Auth)
-- Note: In a real scenario, you would create these users through Supabase Auth API
-- This is for development/testing purposes only

-- Create a function to safely insert auth users if they don't exist
CREATE OR REPLACE FUNCTION insert_auth_user_if_not_exists(
  user_id uuid,
  user_email text,
  encrypted_password text DEFAULT crypt('password123', gen_salt('bf'))
) RETURNS void AS $$
BEGIN
  -- Check if user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    -- Insert into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      user_id,
      '00000000-0000-0000-0000-000000000000',
      user_email,
      encrypted_password,
      now(),
      now(),
      now(),
      'authenticated',
      'authenticated'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert auth users for each mock user
SELECT insert_auth_user_if_not_exists('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@example.com');
SELECT insert_auth_user_if_not_exists('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'enum@example.com');
SELECT insert_auth_user_if_not_exists('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'super@example.com');
SELECT insert_auth_user_if_not_exists('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'zo@example.com');
SELECT insert_auth_user_if_not_exists('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'ro@example.com');

-- Clean up the function
DROP FUNCTION insert_auth_user_if_not_exists(uuid, text, text);

-- Insert some sample surveys
INSERT INTO surveys (id, name, description, status, created_by, created_at, updated_at) VALUES
  ('survey-1', 'Population Census Survey', 'National population census data collection', 'active', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', now(), now()),
  ('survey-2', 'Economic Household Survey', 'Household economic status survey', 'active', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', now(), now()),
  ('survey-3', 'Health and Nutrition Survey', 'Health and nutrition assessment', 'active', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', now(), now()),
  ('survey-4', 'Education Access Survey', 'Educational access and quality survey', 'active', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', now(), now()),
  ('survey-5', 'ASUSE Industry Survey', 'Industry and business survey', 'active', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = now();