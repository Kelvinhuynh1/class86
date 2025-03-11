-- Drop and recreate teams table completely
DROP TABLE IF EXISTS public.teams;

CREATE TABLE public.teams (
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

-- Add realtime for teams table
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;

-- Insert some sample data
INSERT INTO public.teams (name, members, notes, subjects, is_private, owner)
VALUES 
('Science Team', '{"1","2","3"}', 'Focus on science projects and experiments', '{"Science","Computing"}', false, '1'),
('Math Group', '{"1","2"}', 'Advanced mathematics study group', '{"Mathematics"}', false, '2'),
('Language Arts', '{"2","3"}', 'English and literature focus', '{"English","French"}', false, '3'),
('Study Group A', '{"1","2"}', 'Private study group for exams', '{"Mathematics","Science"}', true, '1'),
('Project Team B', '{"1","3"}', 'Working on the final project', '{"Computing"}', true, '3');
