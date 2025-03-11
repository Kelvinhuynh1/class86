-- Fix login issues by ensuring users table has proper structure
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID;

-- Fix class_messages table to ensure it exists and has proper structure
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

-- Enable RLS with public policies for class_messages
ALTER TABLE class_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to class_messages" ON class_messages;
CREATE POLICY "Public access to class_messages"
ON class_messages FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert class_messages" ON class_messages;
CREATE POLICY "Users can insert class_messages"
ON class_messages FOR INSERT
WITH CHECK (true);

-- Enable realtime for class_messages
alter publication supabase_realtime add table class_messages;

-- Fix duplicate resources issue by adding unique constraints
ALTER TABLE important_resources DROP CONSTRAINT IF EXISTS important_resources_title_key;
ALTER TABLE important_resources ADD CONSTRAINT important_resources_title_key UNIQUE (title);

ALTER TABLE study_links DROP CONSTRAINT IF EXISTS study_links_url_key;
ALTER TABLE study_links ADD CONSTRAINT study_links_url_key UNIQUE (url);
