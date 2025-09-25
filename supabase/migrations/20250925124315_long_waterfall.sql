```sql
-- Disable foreign key checks temporarily if needed (usually not required with CASCADE)
-- SET session_replication_role = 'replica';

TRUNCATE TABLE public.chat_messages CASCADE;
TRUNCATE TABLE public.chat_sessions CASCADE;
TRUNCATE TABLE public.document_images CASCADE;
TRUNCATE TABLE public.document_chunks CASCADE;
TRUNCATE TABLE public.admin_knowledge CASCADE;
TRUNCATE TABLE public.documents CASCADE;
TRUNCATE TABLE public.unanswered_queries CASCADE;
TRUNCATE TABLE public.user_analytics CASCADE;
TRUNCATE TABLE public.system_analytics CASCADE;
TRUNCATE TABLE public.surveys CASCADE;
TRUNCATE TABLE public.users CASCADE;

-- Re-enable foreign key checks
-- SET session_replication_role = 'origin';

-- Reset sequences for tables with auto-incrementing IDs (if any, though UUIDs are used here)
-- SELECT setval(pg_get_serial_sequence('public.your_table_name', 'id'), 1, false);

-- Note: The auth.users table cannot be truncated via SQL.
-- Manage auth.users via the Supabase Dashboard or Admin API.
```