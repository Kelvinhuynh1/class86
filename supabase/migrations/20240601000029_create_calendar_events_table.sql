-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Enable row level security
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policy for select
DROP POLICY IF EXISTS "Allow select access to all users" ON calendar_events;
CREATE POLICY "Allow select access to all users"
  ON calendar_events FOR SELECT
  USING (true);

-- Create policy for insert
DROP POLICY IF EXISTS "Allow insert access to all users" ON calendar_events;
CREATE POLICY "Allow insert access to all users"
  ON calendar_events FOR INSERT
  WITH CHECK (true);

-- Create policy for update
DROP POLICY IF EXISTS "Allow update access to all users" ON calendar_events;
CREATE POLICY "Allow update access to all users"
  ON calendar_events FOR UPDATE
  USING (true);

-- Create policy for delete
DROP POLICY IF EXISTS "Allow delete access to all users" ON calendar_events;
CREATE POLICY "Allow delete access to all users"
  ON calendar_events FOR DELETE
  USING (true);

-- Create function to create calendar_events table
CREATE OR REPLACE FUNCTION create_calendar_events_table()
RETURNS VOID AS $$
BEGIN
  -- Check if the table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'calendar_events') THEN
    -- Create the table
    CREATE TABLE public.calendar_events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      created_by TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE
    );

    -- Enable row level security
    ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Allow select access to all users"
      ON public.calendar_events FOR SELECT
      USING (true);

    CREATE POLICY "Allow insert access to all users"
      ON public.calendar_events FOR INSERT
      WITH CHECK (true);

    CREATE POLICY "Allow update access to all users"
      ON public.calendar_events FOR UPDATE
      USING (true);

    CREATE POLICY "Allow delete access to all users"
      ON public.calendar_events FOR DELETE
      USING (true);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for calendar_events
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;
