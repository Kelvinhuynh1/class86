-- Ensure subjects table exists with proper structure
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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'subjects'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subjects;
  END IF;
END
$$;

-- Create a function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at timestamp whenever a subject is updated
DROP TRIGGER IF EXISTS update_subject_timestamp ON public.subjects;
CREATE TRIGGER update_subject_timestamp
BEFORE UPDATE ON public.subjects
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
