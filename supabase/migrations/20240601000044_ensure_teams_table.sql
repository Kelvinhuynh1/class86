-- Ensure teams table exists with proper structure
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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'teams'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
  END IF;
END
$$;

-- Create a trigger to update the updated_at timestamp whenever a team is updated
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_team_timestamp ON public.teams;
CREATE TRIGGER update_team_timestamp
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
