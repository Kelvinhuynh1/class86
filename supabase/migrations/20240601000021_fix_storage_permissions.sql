-- Fix storage permissions
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

CREATE POLICY "Public Access Policy" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "Public Insert Policy" ON storage.objects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Policy" ON storage.objects FOR UPDATE USING (true);
CREATE POLICY "Public Delete Policy" ON storage.objects FOR DELETE USING (true);
