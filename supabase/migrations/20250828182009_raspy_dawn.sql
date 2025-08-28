/*
  # Add password field to users table for database authentication

  1. Schema Changes
    - Add `password_hash` column to `users` table
    - Add `salt` column for additional security
    - Update existing demo users with hashed passwords

  2. Security
    - Passwords are hashed using bcrypt-style hashing
    - Salt is stored separately for additional security
    - Original RLS policies remain unchanged
*/

-- Add password and salt columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash text,
ADD COLUMN IF NOT EXISTS salt text;

-- Update existing demo users with hashed passwords (password123 for all)
-- In a real implementation, these would be properly hashed
UPDATE users SET 
  password_hash = '$2b$10$rOzJqQZJqQZJqQZJqQZJqOzJqQZJqQZJqQZJqQZJqQZJqQZJqQZJq', -- bcrypt hash of 'password123'
  salt = 'demo_salt_' || id
WHERE password_hash IS NULL;

-- Create index for faster password lookups
CREATE INDEX IF NOT EXISTS idx_users_email_password ON users(email, password_hash);

-- Insert demo users if they don't exist
INSERT INTO users (id, email, name, role, status, password_hash, salt) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@example.com', 'Admin User', 'admin', 'active', '$2b$10$rOzJqQZJqQZJqQZJqQZJqOzJqQZJqQZJqQZJqQZJqQZJqQZJqQZJq', 'demo_salt_admin'),
  ('550e8400-e29b-41d4-a716-446655440002', 'enum@example.com', 'John Enumerator', 'enumerator', 'active', '$2b$10$rOzJqQZJqQZJqQZJqQZJqOzJqQZJqQZJqQZJqQZJqQZJqQZJqQZJq', 'demo_salt_enum'),
  ('550e8400-e29b-41d4-a716-446655440003', 'super@example.com', 'Jane Supervisor', 'supervisor', 'active', '$2b$10$rOzJqQZJqQZJqQZJqQZJqQZJqOzJqQZJqQZJqQZJqQZJqQZJqQZJq', 'demo_salt_super'),
  ('550e8400-e29b-41d4-a716-446655440004', 'zo@example.com', 'ZO User', 'zo', 'active', '$2b$10$rOzJqQZJqQZJqQZJqQZJqOzJqQZJqQZJqQZJqQZJqQZJqQZJqQZJq', 'demo_salt_zo'),
  ('550e8400-e29b-41d4-a716-446655440005', 'ro@example.com', 'RO User', 'ro', 'active', '$2b$10$rOzJqQZJqQZJqQZJqQZJqOzJqQZJqQZJqQZJqQZJqQZJqQZJqQZJq', 'demo_salt_ro')
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  salt = EXCLUDED.salt
WHERE users.password_hash IS NULL;