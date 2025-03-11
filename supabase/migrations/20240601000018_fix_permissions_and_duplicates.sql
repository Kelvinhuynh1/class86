-- Fix permissions for important_resources table
ALTER TABLE important_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to important_resources" ON important_resources;
CREATE POLICY "Public access to important_resources"
ON important_resources FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert important_resources" ON important_resources;
CREATE POLICY "Users can insert important_resources"
ON important_resources FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update important_resources" ON important_resources;
CREATE POLICY "Users can update important_resources"
ON important_resources FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Users can delete important_resources" ON important_resources;
CREATE POLICY "Users can delete important_resources"
ON important_resources FOR DELETE
USING (true);

-- Remove unique constraints to prevent duplicate errors
ALTER TABLE important_resources DROP CONSTRAINT IF EXISTS important_resources_title_key;
ALTER TABLE study_links DROP CONSTRAINT IF EXISTS study_links_url_key;

-- Fix permissions for study_links table
ALTER TABLE study_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to study_links" ON study_links;
CREATE POLICY "Public access to study_links"
ON study_links FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert study_links" ON study_links;
CREATE POLICY "Users can insert study_links"
ON study_links FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update study_links" ON study_links;
CREATE POLICY "Users can update study_links"
ON study_links FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Users can delete study_links" ON study_links;
CREATE POLICY "Users can delete study_links"
ON study_links FOR DELETE
USING (true);
