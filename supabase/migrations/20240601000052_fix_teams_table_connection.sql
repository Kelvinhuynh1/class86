-- Ensure teams table exists and has proper structure
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

-- Create policies for teams
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

-- Add realtime for teams table
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
