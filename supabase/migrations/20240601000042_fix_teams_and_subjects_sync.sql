-- Create a function to ensure teams table exists and has proper structure
CREATE OR REPLACE FUNCTION create_teams_table()
RETURNS void AS $$
BEGIN
  -- Create teams table if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    members TEXT[] DEFAULT '{}',
    notes TEXT,
    subjects TEXT[] DEFAULT '{}',
    is_private BOOLEAN DEFAULT false,
    owner TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  );

  -- Enable RLS on teams table
  ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

  -- Create policy for teams
  DROP POLICY IF EXISTS "Teams are viewable by everyone" ON public.teams;
  CREATE POLICY "Teams are viewable by everyone"
    ON public.teams FOR SELECT
    USING (true);

  DROP POLICY IF EXISTS "Teams can be created by authenticated users" ON public.teams;
  CREATE POLICY "Teams can be created by authenticated users"
    ON public.teams FOR INSERT
    WITH CHECK (true);

  DROP POLICY IF EXISTS "Teams can be updated by owner or admin" ON public.teams;
  CREATE POLICY "Teams can be updated by owner or admin"
    ON public.teams FOR UPDATE
    USING (true);

  DROP POLICY IF EXISTS "Teams can be deleted by owner or admin" ON public.teams;
  CREATE POLICY "Teams can be deleted by owner or admin"
    ON public.teams FOR DELETE
    USING (true);

  -- Add realtime for teams table if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'teams'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to ensure subjects table exists and has proper structure
CREATE OR REPLACE FUNCTION create_subjects_table()
RETURNS void AS $$
BEGIN
  -- Create subjects table if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    color TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  );

  -- Enable RLS on subjects table
  ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

  -- Create policy for subjects
  DROP POLICY IF EXISTS "Subjects are viewable by everyone" ON public.subjects;
  CREATE POLICY "Subjects are viewable by everyone"
    ON public.subjects FOR SELECT
    USING (true);

  DROP POLICY IF EXISTS "Subjects can be created by authenticated users" ON public.subjects;
  CREATE POLICY "Subjects can be created by authenticated users"
    ON public.subjects FOR INSERT
    WITH CHECK (true);

  DROP POLICY IF EXISTS "Subjects can be updated by authenticated users" ON public.subjects;
  CREATE POLICY "Subjects can be updated by authenticated users"
    ON public.subjects FOR UPDATE
    USING (true);

  DROP POLICY IF EXISTS "Subjects can be deleted by authenticated users" ON public.subjects;
  CREATE POLICY "Subjects can be deleted by authenticated users"
    ON public.subjects FOR DELETE
    USING (true);

  -- Add realtime for subjects table if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'subjects'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subjects;
  END IF;

  -- Create a trigger to update the updated_at timestamp whenever a subject is updated
  DROP TRIGGER IF EXISTS update_subject_timestamp ON public.subjects;
  CREATE TRIGGER update_subject_timestamp
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

  -- Create a trigger to update the updated_at timestamp whenever a team is updated
  DROP TRIGGER IF EXISTS update_team_timestamp ON public.teams;
  CREATE TRIGGER update_team_timestamp
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();
END;
$$ LANGUAGE plpgsql;

-- Create a function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Execute the functions to ensure tables exist
SELECT create_teams_table();
SELECT create_subjects_table();
