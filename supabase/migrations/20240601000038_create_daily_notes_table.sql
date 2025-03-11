-- Create daily_notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS daily_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  subject TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by TEXT NOT NULL,
  is_important BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Anyone can view daily_notes" ON daily_notes;
CREATE POLICY "Anyone can view daily_notes"
  ON daily_notes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert daily_notes" ON daily_notes;
CREATE POLICY "Anyone can insert daily_notes"
  ON daily_notes FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update daily_notes" ON daily_notes;
CREATE POLICY "Anyone can update daily_notes"
  ON daily_notes FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Anyone can delete daily_notes" ON daily_notes;
CREATE POLICY "Anyone can delete daily_notes"
  ON daily_notes FOR DELETE
  USING (true);

-- Enable realtime
alter publication supabase_realtime add table daily_notes;
