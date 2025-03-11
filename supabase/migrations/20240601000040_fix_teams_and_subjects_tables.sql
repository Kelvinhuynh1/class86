-- Fix teams table to ensure proper storage
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

-- Fix subjects table to ensure proper storage
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

-- Add realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subjects;
