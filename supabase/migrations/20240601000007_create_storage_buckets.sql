-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('class_files', 'Class Files', true)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('class_images', 'Class Images', true)
ON CONFLICT DO NOTHING;

-- Set up security policies for the buckets
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own files" ON storage.objects
  FOR UPDATE USING (auth.uid() = owner);

CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (auth.uid() = owner);
