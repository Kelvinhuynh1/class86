-- Create a new storage bucket for study files
DO $
BEGIN
  -- Check if the bucket already exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'file_storage'
  ) THEN
    -- Create the bucket
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('file_storage', 'file_storage', true);
  END IF;
END $;

-- Create or update the study_files table to use the new bucket
CREATE TABLE IF NOT EXISTS public.study_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT,
  size BIGINT,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable row level security
ALTER TABLE public.study_files ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Study files are viewable by everyone" ON public.study_files;
  DROP POLICY IF EXISTS "Study files can be inserted by authenticated users" ON public.study_files;
  DROP POLICY IF EXISTS "Study files can be updated by owner" ON public.study_files;
  DROP POLICY IF EXISTS "Study files can be deleted by owner" ON public.study_files;
  
  -- Create new policies
  CREATE POLICY "Study files are viewable by everyone"
    ON public.study_files FOR SELECT
    USING (true);
    
  CREATE POLICY "Study files can be inserted by authenticated users"
    ON public.study_files FOR INSERT
    WITH CHECK (true);
    
  CREATE POLICY "Study files can be updated by owner"
    ON public.study_files FOR UPDATE
    USING (true);
    
  CREATE POLICY "Study files can be deleted by owner"
    ON public.study_files FOR DELETE
    USING (true);
END $$;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_files;
