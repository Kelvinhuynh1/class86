-- Create team_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.team_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  sender TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  team_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable row level security
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Team messages are viewable by team members" ON public.team_messages;
CREATE POLICY "Team messages are viewable by team members"
  ON public.team_messages FOR SELECT
  USING (true);
  
DROP POLICY IF EXISTS "Team messages can be inserted by team members" ON public.team_messages;
CREATE POLICY "Team messages can be inserted by team members"
  ON public.team_messages FOR INSERT
  WITH CHECK (true);
  
-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;
