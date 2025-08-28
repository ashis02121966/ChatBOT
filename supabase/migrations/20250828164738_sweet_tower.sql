/*
  # Insert Mock Users for Development

  1. Users
    - Insert mock users with proper UUIDs for development/demo purposes
    - These users match the frontend mock authentication system
  
  2. Security
    - Users will have proper foreign key relationships for chat sessions
*/

-- Insert mock users (using INSERT ... ON CONFLICT to avoid duplicates)
INSERT INTO users (id, email, name, role, status, raw_user_meta_data) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@example.com', 'Admin User', 'admin', 'active', '{"role": "admin"}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'enum@example.com', 'John Enumerator', 'enumerator', 'active', '{"role": "enumerator"}'),
  ('550e8400-e29b-41d4-a716-446655440003', 'super@example.com', 'Jane Supervisor', 'supervisor', 'active', '{"role": "supervisor"}'),
  ('550e8400-e29b-41d4-a716-446655440004', 'zo@example.com', 'ZO User', 'zo', 'active', '{"role": "zo"}'),
  ('550e8400-e29b-41d4-a716-446655440005', 'ro@example.com', 'RO User', 'ro', 'active', '{"role": "ro"}')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = now();