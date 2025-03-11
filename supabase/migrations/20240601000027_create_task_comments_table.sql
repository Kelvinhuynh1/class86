-- Create the task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES todo_tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to create the task_comments table
CREATE OR REPLACE FUNCTION create_task_comments_table()
RETURNS VOID AS $$
BEGIN
  -- Check if the table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'task_comments') THEN
    -- Create the table
    CREATE TABLE public.task_comments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      task_id UUID REFERENCES todo_tasks(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Enable row-level security
    ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Everyone can view task comments"
      ON public.task_comments
      FOR SELECT
      USING (true);

    CREATE POLICY "Everyone can insert task comments"
      ON public.task_comments
      FOR INSERT
      WITH CHECK (true);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;
