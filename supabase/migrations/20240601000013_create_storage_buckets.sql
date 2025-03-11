-- Create storage buckets for file uploads

-- Create bucket for chat images
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_images', 'Chat Images', true)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for chat files
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_files', 'Chat Files', true)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for study files
INSERT INTO storage.buckets (id, name, public)
VALUES ('study_files', 'Study Files', true)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_images', 'Profile Images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for chat_images
CREATE POLICY "Chat images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat_images');

CREATE POLICY "Users can upload chat images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat_images');

CREATE POLICY "Users can update their own chat images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'chat_images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own chat images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'chat_images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create storage policies for chat_files
CREATE POLICY "Chat files are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat_files');

CREATE POLICY "Users can upload chat files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat_files');

CREATE POLICY "Users can update their own chat files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'chat_files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own chat files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'chat_files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create storage policies for study_files
CREATE POLICY "Study files are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'study_files');

CREATE POLICY "Users can upload study files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'study_files');

CREATE POLICY "Users can update their own study files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'study_files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own study files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'study_files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create storage policies for profile_images
CREATE POLICY "Profile images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile_images');

CREATE POLICY "Users can upload their own profile images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile_images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own profile images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profile_images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own profile images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile_images' AND (storage.foldername(name))[1] = auth.uid()::text);
