-- Create teams table function
CREATE OR REPLACE FUNCTION create_teams_table() RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    members TEXT[] DEFAULT '{}',
    subjects TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
  );

  -- Enable RLS
  ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

  -- Create policies
  CREATE POLICY "Allow all users to view teams"
    ON teams FOR SELECT
    USING (true);

  CREATE POLICY "Allow leaders and admins to insert teams"
    ON teams FOR INSERT
    USING (true);

  CREATE POLICY "Allow leaders and admins to update teams"
    ON teams FOR UPDATE
    USING (true);

  CREATE POLICY "Allow leaders and admins to delete teams"
    ON teams FOR DELETE
    USING (true);

  -- Enable realtime
  ALTER PUBLICATION supabase_realtime ADD TABLE teams;
END;
$$ LANGUAGE plpgsql;
