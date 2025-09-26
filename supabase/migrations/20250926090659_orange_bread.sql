@@ .. @@
-- Insert user analytics
INSERT INTO public.user_analytics (id, user_id, survey_id, date, queries_asked, queries_answered, positive_feedback, negative_feedback, session_duration, documents_uploaded, avg_response_time, unique_sessions, created_at, updated_at) VALUES
-(gen_random_uuid(), (SELECT id FROM public.users WHERE email = 'enum@example.com'), 'survey-1', CURRENT_DATE - 2, 8, 7, 6, 1, '00:25:30', 1, '00:00:03', 2, now() - interval '2 days', now()),
-(gen_random_uuid(), (SELECT id FROM public.users WHERE email = 'super@example.com'), 'survey-2', CURRENT_DATE - 1, 5, 5, 4, 0, '00:15:20', 1, '00:00:02', 1, now() - interval '1 day', now()),
-(gen_random_uuid(), (SELECT id FROM public.users WHERE email = 'zo@example.com'), 'survey-3', CURRENT_DATE, 12, 10, 8, 2, '00:35:45', 2, '00:00:04', 3, now(), now()),
-(gen_random_uuid(), (SELECT id FROM public.users WHERE email = 'ro@example.com'), 'survey-1', CURRENT_DATE, 3, 3, 2, 0, '00:08:15', 0, '00:00:02', 1, now(), now()),
-(gen_random_uuid(), (SELECT id FROM public.users WHERE email = 'enum@example.com'), 'survey-2', CURRENT_DATE - 1, 6, 5, 4, 1, '00:18:30', 0, '00:00:03', 1, now() - interval '1 day', now()),
-(gen_random_uuid(), (SELECT id FROM public.users WHERE email = 'admin@example.com'), 'survey-1', CURRENT_DATE, 15, 15, 12, 0, '01:05:20', 3, '00:00:01', 4, now(), now())
+(gen_random_uuid(), current_setting('app.enum_user_id')::uuid, 'survey-1', CURRENT_DATE - 2, 8, 7, 6, 1, '00:25:30', 1, '00:00:03', 2, now() - interval '2 days', now()),
+(gen_random_uuid(), current_setting('app.super_user_id')::uuid, 'survey-2', CURRENT_DATE - 1, 5, 5, 4, 0, '00:15:20', 1, '00:00:02', 1, now() - interval '1 day', now()),
+(gen_random_uuid(), current_setting('app.zo_user_id')::uuid, 'survey-3', CURRENT_DATE, 12, 10, 8, 2, '00:35:45', 2, '00:00:04', 3, now(), now()),
+(gen_random_uuid(), current_setting('app.ro_user_id')::uuid, 'survey-1', CURRENT_DATE, 3, 3, 2, 0, '00:08:15', 0, '00:00:02', 1, now(), now()),
+(gen_random_uuid(), current_setting('app.enum_user_id')::uuid, 'survey-2', CURRENT_DATE - 1, 6, 5, 4, 1, '00:18:30', 0, '00:00:03', 1, now() - interval '1 day', now()),
+(gen_random_uuid(), current_setting('app.admin_user_id')::uuid, 'survey-1', CURRENT_DATE, 15, 15, 12, 0, '01:05:20', 3, '00:00:01', 4, now(), now())
 ON CONFLICT (user_id, survey_id, date) DO UPDATE SET
   queries_asked = EXCLUDED.queries_asked,
   queries_answered = EXCLUDED.queries_answered,
-  updated_at = now();
+  updated_at = now();
+END $$;