/*
  # Fix Chat RLS Policies

  1. Security Updates
    - Drop existing restrictive policies on chat_messages
    - Add new policy allowing authenticated users to insert messages in their own sessions
    - Allow both user and bot/admin messages to be inserted
    - Ensure proper session ownership validation

  2. Policy Details
    - Users can insert messages (user, bot, admin types) into their own chat sessions
    - Validates session ownership through user_id matching
    - Maintains security while allowing bot responses
*/

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can manage messages in their sessions" ON chat_messages;

-- Create new policy that allows inserting messages into user's own sessions
CREATE POLICY "Allow authenticated users to insert messages in their sessions"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM chat_sessions
      WHERE (chat_sessions.id = chat_messages.session_id) 
        AND (chat_sessions.user_id = auth.uid())
    )
  );

-- Ensure users can read messages from their own sessions
CREATE POLICY "Users can read messages from their sessions"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM chat_sessions
      WHERE (chat_sessions.id = chat_messages.session_id) 
        AND (chat_sessions.user_id = auth.uid())
    )
  );

-- Allow users to update messages in their own sessions (for feedback)
CREATE POLICY "Users can update messages in their sessions"
  ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM chat_sessions
      WHERE (chat_sessions.id = chat_messages.session_id) 
        AND (chat_sessions.user_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM chat_sessions
      WHERE (chat_sessions.id = chat_messages.session_id) 
        AND (chat_sessions.user_id = auth.uid())
    )
  );