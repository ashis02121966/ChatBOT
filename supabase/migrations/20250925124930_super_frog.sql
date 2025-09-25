/*
  # Truncate All Database Tables

  This migration will delete all existing data from the application tables.
  
  ## Warning
  This operation is irreversible and will permanently delete all data.
  Make sure you have a backup if needed.
  
  ## Tables Affected
  - All application tables in the public schema
  - Does NOT affect auth.users (managed by Supabase)
*/

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Truncate all tables in dependency order
TRUNCATE TABLE public.document_images CASCADE;
TRUNCATE TABLE public.document_chunks CASCADE;
TRUNCATE TABLE public.documents CASCADE;
TRUNCATE TABLE public.chat_messages CASCADE;
TRUNCATE TABLE public.chat_sessions CASCADE;
TRUNCATE TABLE public.unanswered_queries CASCADE;
TRUNCATE TABLE public.user_analytics CASCADE;
TRUNCATE TABLE public.system_analytics CASCADE;
TRUNCATE TABLE public.admin_knowledge CASCADE;
TRUNCATE TABLE public.users CASCADE;
TRUNCATE TABLE public.surveys CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Reset sequences (if any)
-- This ensures auto-incrementing fields start from 1 again
-- Note: Most tables use UUIDs, so this may not be necessary
-- but included for completeness

SELECT setval(pg_get_serial_sequence('public.system_analytics', 'id'), 1, false);

-- Confirmation message
DO $$
BEGIN
    RAISE NOTICE 'All application data has been successfully truncated.';
    RAISE NOTICE 'You can now run the insert_mock_data.sql script to populate with mock data.';
END $$;