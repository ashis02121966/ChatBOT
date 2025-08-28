@@ .. @@
 -- Insert demo users into auth.users if they don't exist
-INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
-VALUES 
-  ('550e8400-e29b-41d4-a716-446655440000', 'admin@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated'),
-  ('550e8400-e29b-41d4-a716-446655440001', 'enum@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated'),
-  ('550e8400-e29b-41d4-a716-446655440002', 'super@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated'),
-  ('550e8400-e29b-41d4-a716-446655440003', 'zo@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated'),
-  ('550e8400-e29b-41d4-a716-446655440004', 'ro@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated')
-ON CONFLICT (id) DO NOTHING;
+-- Check and insert demo users into auth.users only if they don't exist
+DO $$
+BEGIN
+  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '550e8400-e29b-41d4-a716-446655440000') THEN
+    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
+    VALUES ('550e8400-e29b-41d4-a716-446655440000', 'admin@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated');
+  END IF;
+  
+  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '550e8400-e29b-41d4-a716-446655440001') THEN
+    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
+    VALUES ('550e8400-e29b-41d4-a716-446655440001', 'enum@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated');
+  END IF;
+  
+  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '550e8400-e29b-41d4-a716-446655440002') THEN
+    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
+    VALUES ('550e8400-e29b-41d4-a716-446655440002', 'super@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated');
+  END IF;
+  
+  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '550e8400-e29b-41d4-a716-446655440003') THEN
+    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
+    VALUES ('550e8400-e29b-41d4-a716-446655440003', 'zo@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated');
+  END IF;
+  
+  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '550e8400-e29b-41d4-a716-446655440004') THEN
+    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
+    VALUES ('550e8400-e29b-41d4-a716-446655440004', 'ro@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated');
+  END IF;
+END $$;
 
 -- Insert demo users into public.users if they don't exist
-INSERT INTO public.users (id, email, name, role, status, password_hash, salt)
-VALUES 
-  ('550e8400-e29b-41d4-a716-446655440000', 'admin@example.com', 'Admin User', 'admin', 'active', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'salt123'),
-  ('550e8400-e29b-41d4-a716-446655440001', 'enum@example.com', 'John Enumerator', 'enumerator', 'active', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'salt123'),
-  ('550e8400-e29b-41d4-a716-446655440002', 'super@example.com', 'Jane Supervisor', 'supervisor', 'active', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'salt123'),
-  ('550e8400-e29b-41d4-a716-446655440003', 'zo@example.com', 'ZO User', 'zo', 'active', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'salt123'),
-  ('550e8400-e29b-41d4-a716-446655440004', 'ro@example.com', 'RO User', 'ro', 'active', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'salt123')
-ON CONFLICT (id) DO NOTHING;
+DO $$
+BEGIN
+  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = '550e8400-e29b-41d4-a716-446655440000') THEN
+    INSERT INTO public.users (id, email, name, role, status, password_hash, salt)
+    VALUES ('550e8400-e29b-41d4-a716-446655440000', 'admin@example.com', 'Admin User', 'admin', 'active', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'salt123');
+  END IF;
+  
+  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = '550e8400-e29b-41d4-a716-446655440001') THEN
+    INSERT INTO public.users (id, email, name, role, status, password_hash, salt)
+    VALUES ('550e8400-e29b-41d4-a716-446655440001', 'enum@example.com', 'John Enumerator', 'enumerator', 'active', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'salt123');
+  END IF;
+  
+  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = '550e8400-e29b-41d4-a716-446655440002') THEN
+    INSERT INTO public.users (id, email, name, role, status, password_hash, salt)
+    VALUES ('550e8400-e29b-41d4-a716-446655440002', 'super@example.com', 'Jane Supervisor', 'supervisor', 'active', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'salt123');
+  END IF;
+  
+  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = '550e8400-e29b-41d4-a716-446655440003') THEN
+    INSERT INTO public.users (id, email, name, role, status, password_hash, salt)
+    VALUES ('550e8400-e29b-41d4-a716-446655440003', 'zo@example.com', 'ZO User', 'zo', 'active', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'salt123');
+  END IF;
+  
+  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = '550e8400-e29b-41d4-a716-446655440004') THEN
+    INSERT INTO public.users (id, email, name, role, status, password_hash, salt)
+    VALUES ('550e8400-e29b-41d4-a716-446655440004', 'ro@example.com', 'RO User', 'ro', 'active', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'salt123');
+  END IF;
+END $$;