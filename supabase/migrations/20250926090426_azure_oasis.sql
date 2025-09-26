@@ .. @@
-- Insert surveys
INSERT INTO public.surveys (id, name, description, status, created_by, total_documents, total_queries, avg_satisfaction, created_at, updated_at) VALUES
-('survey-1', 'Population Census Survey', 'National population census data collection', 'active', (SELECT id FROM public.users WHERE email = 'admin@example.com'), 15, 245, 4.2, now() - interval '30 days', now()),
-('survey-2', 'Economic Household Survey', 'Household economic status survey', 'active', (SELECT id FROM public.users WHERE email = 'admin@example.com'), 12, 189, 4.1, now() - interval '25 days', now()),
-('survey-3', 'Health and Nutrition Survey', 'Health and nutrition assessment', 'active', (SELECT id FROM public.users WHERE email = 'admin@example.com'), 8, 156, 4.3, now() - interval '20 days', now()),
-('survey-4', 'Education Access Survey', 'Educational access and quality survey', 'active', (SELECT id FROM public.users WHERE email = 'admin@example.com'), 6, 98, 4.0, now() - interval '15 days', now()),
-('survey-5', 'ASUSE Industry Survey', 'Industry and business survey', 'active', (SELECT id FROM public.users WHERE email = 'admin@example.com'), 10, 134, 4.2, now() - interval '10 days', now())
+('survey-1', 'Population Census Survey', 'National population census data collection', 'active', current_setting('app.admin_user_id')::uuid, 15, 245, 4.2, now() - interval '30 days', now()),
+('survey-2', 'Economic Household Survey', 'Household economic status survey', 'active', current_setting('app.admin_user_id')::uuid, 12, 189, 4.1, now() - interval '25 days', now()),
+('survey-3', 'Health and Nutrition Survey', 'Health and nutrition assessment', 'active', current_setting('app.admin_user_id')::uuid, 8, 156, 4.3, now() - interval '20 days', now()),
+('survey-4', 'Education Access Survey', 'Educational access and quality survey', 'active', current_setting('app.admin_user_id')::uuid, 6, 98, 4.0, now() - interval '15 days', now()),
+('survey-5', 'ASUSE Industry Survey', 'Industry and business survey', 'active', current_setting('app.admin_user_id')::uuid, 10, 134, 4.2, now() - interval '10 days', now())
 ON CONFLICT (id) DO UPDATE SET
   name = EXCLUDED.name,
   description = EXCLUDED.description,
   updated_at = now();