/*
  # Fix RLS policies for admin_knowledge table

  1. Security Updates
    - Fix admin_knowledge RLS policies to work with auth.users
    - Allow admins to manage admin knowledge
    - Allow all authenticated users to read admin knowledge
    - Remove dependency on public.users table for RLS
*/

-- Drop existing policies that reference public.users
DROP POLICY IF EXISTS "Admins can manage all knowledge" ON public.admin_knowledge;
DROP POLICY IF EXISTS "Users can read admin knowledge" ON public.admin_knowledge;

-- Create new policies that work with auth.users directly
CREATE POLICY "Admins can manage all knowledge" ON public.admin_knowledge
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND (users.raw_user_meta_data->>'role') = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND (users.raw_user_meta_data->>'role') = 'admin'
  )
);

-- Allow all authenticated users to read admin knowledge
CREATE POLICY "Users can read admin knowledge" ON public.admin_knowledge
FOR SELECT 
TO authenticated
USING (true);

-- Allow public (anonymous) users to read admin knowledge for chatbot functionality
CREATE POLICY "Public can read admin knowledge" ON public.admin_knowledge
FOR SELECT 
TO public
USING (true);

-- Update the foreign key constraint to reference auth.users instead of public.users
ALTER TABLE public.admin_knowledge 
DROP CONSTRAINT IF EXISTS admin_knowledge_created_by_fkey;

ALTER TABLE public.admin_knowledge 
ADD CONSTRAINT admin_knowledge_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id);