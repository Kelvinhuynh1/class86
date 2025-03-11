-- Fix unique constraint on users table to allow duplicate class codes
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_class_code_key;

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

-- Fix permissions for class_messages table
ALTER TABLE class_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to class_messages" ON class_messages;
CREATE POLICY "Public access to class_messages"
ON class_messages FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert class_messages" ON class_messages;
CREATE POLICY "Users can insert class_messages"
ON class_messages FOR INSERT
WITH CHECK (true);

-- Fix permissions for direct_messages table
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  content TEXT NOT NULL,
  attachment_url TEXT,
  attachment_type TEXT,
  attachment_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to direct_messages" ON direct_messages;
CREATE POLICY "Public access to direct_messages"
ON direct_messages FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert direct_messages" ON direct_messages;
CREATE POLICY "Users can insert direct_messages"
ON direct_messages FOR INSERT
WITH CHECK (true);

-- Enable realtime for direct_messages table
alter publication supabase_realtime add table direct_messages;
