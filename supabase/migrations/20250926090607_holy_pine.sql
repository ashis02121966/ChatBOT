@@ .. @@
-- Insert chat sessions
+DO $$
+DECLARE
+    session1_id uuid := gen_random_uuid();
+    session2_id uuid := gen_random_uuid();
+    session3_id uuid := gen_random_uuid();
+    session4_id uuid := gen_random_uuid();
+BEGIN
+    -- Store session IDs for later use
+    PERFORM set_config('app.session1_id', session1_id::text, true);
+    PERFORM set_config('app.session2_id', session2_id::text, true);
+    PERFORM set_config('app.session3_id', session3_id::text, true);
+    PERFORM set_config('app.session4_id', session4_id::text, true);
+
 INSERT INTO public.chat_sessions (id, user_id, survey_id, category, message_count, total_feedback_positive, total_feedback_negative, session_duration, created_at, updated_at) VALUES
-(session1_id, (SELECT id FROM public.users WHERE email = 'enum@example.com'), 'survey-1', 'General Questions', 4, 3, 1, '00:15:30', now() - interval '2 days', now()),
-(session2_id, (SELECT id FROM public.users WHERE email = 'super@example.com'), 'survey-2', 'Detail Schedule', 3, 2, 0, '00:08:45', now() - interval '1 day', now()),
-(session3_id, (SELECT id FROM public.users WHERE email = 'zo@example.com'), 'survey-3', 'Listing', 5, 4, 1, '00:12:20', now() - interval '6 hours', now()),
-(session4_id, (SELECT id FROM public.users WHERE email = 'ro@example.com'), 'survey-1', 'General Questions', 2, 1, 0, '00:05:15', now() - interval '2 hours', now())
-ON CONFLICT (id) DO NOTHING;
+(session1_id, current_setting('app.enum_user_id')::uuid, 'survey-1', 'General Questions', 4, 3, 1, '00:15:30', now() - interval '2 days', now()),
+(session2_id, current_setting('app.super_user_id')::uuid, 'survey-2', 'Detail Schedule', 3, 2, 0, '00:08:45', now() - interval '1 day', now()),
+(session3_id, current_setting('app.zo_user_id')::uuid, 'survey-3', 'Listing', 5, 4, 1, '00:12:20', now() - interval '6 hours', now()),
+(session4_id, current_setting('app.ro_user_id')::uuid, 'survey-1', 'General Questions', 2, 1, 0, '00:05:15', now() - interval '2 hours', now());
+END $$;