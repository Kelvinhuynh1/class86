-- Create daily notes table
CREATE OR REPLACE FUNCTION create_daily_notes_table() RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS daily_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    subject TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by TEXT NOT NULL,
    is_important BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Enable RLS
  ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;

  -- Create policies
  CREATE POLICY "Allow all users to view daily notes"
    ON daily_notes FOR SELECT
    USING (true);

  CREATE POLICY "Allow leaders and admins to insert daily notes"
    ON daily_notes FOR INSERT
    USING (true);

  CREATE POLICY "Allow leaders and admins to update daily notes"
    ON daily_notes FOR UPDATE
    USING (true);

  CREATE POLICY "Allow leaders and admins to delete daily notes"
    ON daily_notes FOR DELETE
    USING (true);

  -- Enable realtime
  ALTER PUBLICATION supabase_realtime ADD TABLE daily_notes;
END;
$$ LANGUAGE plpgsql;

-- Create important notes table
CREATE OR REPLACE FUNCTION create_important_notes_table() RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS important_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID REFERENCES daily_notes(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    subject TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Enable RLS
  ALTER TABLE important_notes ENABLE ROW LEVEL SECURITY;

  -- Create policies
  CREATE POLICY "Allow all users to view important notes"
    ON important_notes FOR SELECT
    USING (true);

  CREATE POLICY "Allow leaders and admins to insert important notes"
    ON important_notes FOR INSERT
    USING (true);

  CREATE POLICY "Allow leaders and admins to update important notes"
    ON important_notes FOR UPDATE
    USING (true);

  CREATE POLICY "Allow leaders and admins to delete important notes"
    ON important_notes FOR DELETE
    USING (true);

  -- Enable realtime
  ALTER PUBLICATION supabase_realtime ADD TABLE important_notes;
END;
$$ LANGUAGE plpgsql;
