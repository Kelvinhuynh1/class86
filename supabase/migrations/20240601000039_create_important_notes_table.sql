-- Create important_notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS important_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL REFERENCES daily_notes(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  subject TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE important_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Anyone can view important_notes" ON important_notes;
CREATE POLICY "Anyone can view important_notes"
  ON important_notes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert important_notes" ON important_notes;
CREATE POLICY "Anyone can insert important_notes"
  ON important_notes FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update important_notes" ON important_notes;
CREATE POLICY "Anyone can update important_notes"
  ON important_notes FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Anyone can delete important_notes" ON important_notes;
CREATE POLICY "Anyone can delete important_notes"
  ON important_notes FOR DELETE
  USING (true);

-- Enable realtime
alter publication supabase_realtime add table important_notes;
