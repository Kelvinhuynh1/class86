-- Create subjects table if it doesn't exist
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Anyone can view subjects" ON subjects;
CREATE POLICY "Anyone can view subjects"
  ON subjects FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Leaders and Co-Leaders can insert subjects" ON subjects;
CREATE POLICY "Leaders and Co-Leaders can insert subjects"
  ON subjects FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Leaders and Co-Leaders can update subjects" ON subjects;
CREATE POLICY "Leaders and Co-Leaders can update subjects"
  ON subjects FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Leaders and Co-Leaders can delete subjects" ON subjects;
CREATE POLICY "Leaders and Co-Leaders can delete subjects"
  ON subjects FOR DELETE
  USING (true);

-- Skip adding to realtime since it's already a member
-- alter publication supabase_realtime add table subjects;
