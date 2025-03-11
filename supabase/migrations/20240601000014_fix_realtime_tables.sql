-- Enable realtime for tables that need it (excluding users which is already enabled)
alter publication supabase_realtime add table study_links;
alter publication supabase_realtime add table important_resources;
alter publication supabase_realtime add table notes;

-- Fix permissions for important_resources table
DROP POLICY IF EXISTS "Public access to important_resources" ON important_resources;
CREATE POLICY "Public access to important_resources"
ON important_resources FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert important_resources" ON important_resources;
CREATE POLICY "Users can insert important_resources"
ON important_resources FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own important_resources" ON important_resources;
CREATE POLICY "Users can update their own important_resources"
ON important_resources FOR UPDATE
USING (added_by = auth.uid() OR auth.role() IN ('service_role', 'supabase_admin'));

DROP POLICY IF EXISTS "Users can delete their own important_resources" ON important_resources;
CREATE POLICY "Users can delete their own important_resources"
ON important_resources FOR DELETE
USING (added_by = auth.uid() OR auth.role() IN ('service_role', 'supabase_admin'));

-- Fix permissions for study_links table
DROP POLICY IF EXISTS "Public access to study_links" ON study_links;
CREATE POLICY "Public access to study_links"
ON study_links FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert study_links" ON study_links;
CREATE POLICY "Users can insert study_links"
ON study_links FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own study_links" ON study_links;
CREATE POLICY "Users can update their own study_links"
ON study_links FOR UPDATE
USING (added_by = auth.uid() OR auth.role() IN ('service_role', 'supabase_admin'));

DROP POLICY IF EXISTS "Users can delete their own study_links" ON study_links;
CREATE POLICY "Users can delete their own study_links"
ON study_links FOR DELETE
USING (added_by = auth.uid() OR auth.role() IN ('service_role', 'supabase_admin'));

-- Create study_links table if it doesn't exist
CREATE TABLE IF NOT EXISTS study_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  added_by TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fix class chat messages table
CREATE TABLE IF NOT EXISTS class_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  sender TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_type TEXT,
  attachment_size INTEGER
);

-- Enable RLS but with a policy that allows all access for now
ALTER TABLE class_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to class_messages" ON class_messages;
CREATE POLICY "Public access to class_messages"
ON class_messages FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert class_messages" ON class_messages;
CREATE POLICY "Users can insert class_messages"
ON class_messages FOR INSERT
WITH CHECK (true);

-- Enable realtime for class_messages table
alter publication supabase_realtime add table class_messages;
