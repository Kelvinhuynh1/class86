-- Create the happy_time_tasks table
CREATE TABLE IF NOT EXISTS happy_time_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES users(id),
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to create the happy_time_tasks table
CREATE OR REPLACE FUNCTION create_happy_time_tasks_table()
RETURNS VOID AS $$
BEGIN
  -- Check if the table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'happy_time_tasks') THEN
    -- Create the table
    CREATE TABLE public.happy_time_tasks (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      description TEXT,
      assigned_to UUID REFERENCES users(id),
      start_date DATE NOT NULL,
      expiry_date DATE NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Enable row-level security
    ALTER TABLE public.happy_time_tasks ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Users can view their own tasks"
      ON public.happy_time_tasks
      FOR SELECT
      USING (assigned_to = auth.uid());

    CREATE POLICY "Users can insert their own tasks"
      ON public.happy_time_tasks
      FOR INSERT
      WITH CHECK (assigned_to = auth.uid());

    CREATE POLICY "Users can update their own tasks"
      ON public.happy_time_tasks
      FOR UPDATE
      USING (assigned_to = auth.uid());

    CREATE POLICY "Users can delete their own tasks"
      ON public.happy_time_tasks
      FOR DELETE
      USING (assigned_to = auth.uid());
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE happy_time_tasks;
