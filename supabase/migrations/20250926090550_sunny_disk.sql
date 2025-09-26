@@ .. @@
-- Insert document images
INSERT INTO public.document_images (id, document_id, chunk_id, file_name, description, image_type, data_url, created_at) VALUES
-(gen_random_uuid(), doc1_id, NULL, 'Census Form Example', 'Sample census form showing household roster layout', 'form', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', now() - interval '5 days'),
+(gen_random_uuid(), current_setting('app.doc1_id')::uuid, NULL, 'Census Form Example', 'Sample census form showing household roster layout', 'form', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', now() - interval '5 days'),

-(gen_random_uuid(), doc1_id, NULL, 'CAPI System Interface', 'Screenshot of CAPI system showing data validation features', 'screenshot', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', now() - interval '5 days'),
+(gen_random_uuid(), current_setting('app.doc1_id')::uuid, NULL, 'CAPI System Interface', 'Screenshot of CAPI system showing data validation features', 'screenshot', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', now() - interval '5 days'),

-(gen_random_uuid(), doc2_id, NULL, 'Income Categories Chart', 'Visual breakdown of household income categories', 'chart', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', now() - interval '4 days')
+(gen_random_uuid(), current_setting('app.doc2_id')::uuid, NULL, 'Income Categories Chart', 'Visual breakdown of household income categories', 'chart', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', now() - interval '4 days')
 ON CONFLICT (id) DO NOTHING;