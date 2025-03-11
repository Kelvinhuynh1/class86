-- Create questions table if it doesn't exist
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  type TEXT NOT NULL,
  options TEXT[] NULL,
  correct_answer TEXT NOT NULL,
  subject TEXT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create question_bundles table
CREATE TABLE IF NOT EXISTS question_bundles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subject TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  question_count INTEGER NOT NULL DEFAULT 0
);

-- Add bundle_id and order_index to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS bundle_id UUID REFERENCES question_bundles(id);
ALTER TABLE questions ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Enable RLS with public policies
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_bundles ENABLE ROW LEVEL SECURITY;

-- Create policies for questions table
DROP POLICY IF EXISTS "Public access to questions" ON questions;
CREATE POLICY "Public access to questions"
ON questions FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert questions" ON questions;
CREATE POLICY "Users can insert questions"
ON questions FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update questions" ON questions;
CREATE POLICY "Users can update questions"
ON questions FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Users can delete questions" ON questions;
CREATE POLICY "Users can delete questions"
ON questions FOR DELETE
USING (true);

-- Create policies for question_bundles table
DROP POLICY IF EXISTS "Public access to question_bundles" ON question_bundles;
CREATE POLICY "Public access to question_bundles"
ON question_bundles FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert question_bundles" ON question_bundles;
CREATE POLICY "Users can insert question_bundles"
ON question_bundles FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update question_bundles" ON question_bundles;
CREATE POLICY "Users can update question_bundles"
ON question_bundles FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Users can delete question_bundles" ON question_bundles;
CREATE POLICY "Users can delete question_bundles"
ON question_bundles FOR DELETE
USING (true);

-- Enable realtime for question_bundles
alter publication supabase_realtime add table question_bundles;
alter publication supabase_realtime add table questions;
