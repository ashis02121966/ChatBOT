/*
  # Fix SQL syntax error and create proper user setup

  1. New Tables
    - Ensure `users` table exists with proper structure
    - Add demo users for testing authentication
  
  2. Security
    - Enable RLS on `users` table
    - Add policies for user data access
  
  3. Demo Data
    - Insert demo users with proper authentication data
    - Set up role-based access for testing
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role user_role DEFAULT 'enumerator'::user_role NOT NULL,
  status user_status DEFAULT 'active'::user_status NOT NULL,
  last_login timestamptz,
  raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
  password_hash text,
  salt text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY IF NOT EXISTS "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Allow all operations for anonymous users"
  ON users
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all operations for authenticated users"
  ON users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert demo users for testing (using INSERT ... ON CONFLICT DO NOTHING to avoid duplicates)
INSERT INTO users (id, email, name, role, status, password_hash, salt, raw_user_meta_data)
VALUES 
  ('admin-user-id-123', 'admin@example.com', 'Admin User', 'admin', 'active', 'demo-hash-admin', 'demo-salt', '{"demo": true}'),
  ('enum-user-id-123', 'enum@example.com', 'John Enumerator', 'enumerator', 'active', 'demo-hash-enum', 'demo-salt', '{"demo": true}'),
  ('super-user-id-123', 'super@example.com', 'Jane Supervisor', 'supervisor', 'active', 'demo-hash-super', 'demo-salt', '{"demo": true}'),
  ('zo-user-id-123', 'zo@example.com', 'ZO User', 'zo', 'active', 'demo-hash-zo', 'demo-salt', '{"demo": true}'),
  ('ro-user-id-123', 'ro@example.com', 'RO User', 'ro', 'active', 'demo-hash-ro', 'demo-salt', '{"demo": true}')
ON CONFLICT (email) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users USING btree (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users USING btree (role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users USING btree (status);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users USING btree (last_login);
CREATE INDEX IF NOT EXISTS idx_users_email_password ON users USING btree (email, password_hash);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_users_updated_at'
  ) THEN
    CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;