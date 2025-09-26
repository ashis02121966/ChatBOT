@@ .. @@
-- =============================================
-- SECTION 9: INSERT MOCK DATA
-- =============================================

-- Insert users with generated UUIDs (not dependent on auth.users)
-INSERT INTO public.users (id, email, name, role, status, last_login, created_at, updated_at)
-SELECT 
-  au.id,
-  au.email,
-  CASE 
-    WHEN au.email = 'admin@example.com' THEN 'Admin User'
-    WHEN au.email = 'enum@example.com' THEN 'John Enumerator'
-    WHEN au.email = 'super@example.com' THEN 'Jane Supervisor'
-    WHEN au.email = 'zo@example.com' THEN 'ZO User'
-    WHEN au.email = 'ro@example.com' THEN 'RO User'
-    ELSE 'Unknown User'
-  END as name,
-  CASE 
-    WHEN au.email = 'admin@example.com' THEN 'admin'::public.user_role
-    WHEN au.email = 'enum@example.com' THEN 'enumerator'::public.user_role
-    WHEN au.email = 'super@example.com' THEN 'supervisor'::public.user_role
-    WHEN au.email = 'zo@example.com' THEN 'zo'::public.user_role
-    WHEN au.email = 'ro@example.com' THEN 'ro'::public.user_role
-    ELSE 'enumerator'::public.user_role
-  END as role,
-  'active'::public.user_status,
-  now() - interval '1 day',
-  now() - interval '7 days',
-  now()
-FROM auth.users au
-WHERE au.email IN ('admin@example.com', 'enum@example.com', 'super@example.com', 'zo@example.com', 'ro@example.com')
-ON CONFLICT (email) DO UPDATE SET
-  name = EXCLUDED.name,
-  role = EXCLUDED.role,
-  updated_at = now();
+-- Insert users with generated UUIDs (independent of auth.users)
+DO $$
+DECLARE
+    admin_user_id uuid := gen_random_uuid();
+    enum_user_id uuid := gen_random_uuid();
+    super_user_id uuid := gen_random_uuid();
+    zo_user_id uuid := gen_random_uuid();
+    ro_user_id uuid := gen_random_uuid();
+BEGIN
+    -- Insert users with specific UUIDs
+    INSERT INTO public.users (id, email, name, role, status, last_login, created_at, updated_at) VALUES
+    (admin_user_id, 'admin@example.com', 'Admin User', 'admin', 'active', now() - interval '1 day', now() - interval '7 days', now()),
+    (enum_user_id, 'enum@example.com', 'John Enumerator', 'enumerator', 'active', now() - interval '2 hours', now() - interval '5 days', now()),
+    (super_user_id, 'super@example.com', 'Jane Supervisor', 'supervisor', 'active', now() - interval '6 hours', now() - interval '6 days', now()),
+    (zo_user_id, 'zo@example.com', 'ZO User', 'zo', 'active', now() - interval '1 day', now() - interval '4 days', now()),
+    (ro_user_id, 'ro@example.com', 'RO User', 'ro', 'active', now() - interval '3 hours', now() - interval '3 days', now())
+    ON CONFLICT (email) DO UPDATE SET
+      name = EXCLUDED.name,
+      role = EXCLUDED.role,
+      updated_at = now();
+
+    -- Store user IDs for later use
+    PERFORM set_config('app.admin_user_id', admin_user_id::text, true);
+    PERFORM set_config('app.enum_user_id', enum_user_id::text, true);
+    PERFORM set_config('app.super_user_id', super_user_id::text, true);
+    PERFORM set_config('app.zo_user_id', zo_user_id::text, true);
+    PERFORM set_config('app.ro_user_id', ro_user_id::text, true);
+END $$;