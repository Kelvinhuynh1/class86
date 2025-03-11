-- Create storage bucket for study files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('study_files', 'study_files', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the study_files bucket
DROP POLICY IF EXISTS "Anyone can view study files" ON storage.objects;
CREATE POLICY "Anyone can view study files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'study_files');

DROP POLICY IF EXISTS "Authenticated users can upload study files" ON storage.objects;
CREATE POLICY "Authenticated users can upload study files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'study_files' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own study files" ON storage.objects;
CREATE POLICY "Users can update their own study files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'study_files' AND owner = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own study files" ON storage.objects;
CREATE POLICY "Users can delete their own study files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'study_files' AND owner = auth.uid());
