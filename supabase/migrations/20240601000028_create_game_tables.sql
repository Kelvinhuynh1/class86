-- Create the game_rooms table
CREATE TABLE IF NOT EXISTS game_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  game TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  players TEXT[] DEFAULT '{}',
  max_players INTEGER DEFAULT 4
);

-- Create the game_messages table
CREATE TABLE IF NOT EXISTS game_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to create the game_rooms table
CREATE OR REPLACE FUNCTION create_game_rooms_table()
RETURNS VOID AS $$
BEGIN
  -- Check if the table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'game_rooms') THEN
    -- Create the table
    CREATE TABLE public.game_rooms (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      game TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      players TEXT[] DEFAULT '{}',
      max_players INTEGER DEFAULT 4
    );

    -- Enable row-level security
    ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Everyone can view game rooms"
      ON public.game_rooms
      FOR SELECT
      USING (true);

    CREATE POLICY "Everyone can insert game rooms"
      ON public.game_rooms
      FOR INSERT
      WITH CHECK (true);
      
    CREATE POLICY "Everyone can update game rooms"
      ON public.game_rooms
      FOR UPDATE
      USING (true);
      
    CREATE POLICY "Everyone can delete game rooms"
      ON public.game_rooms
      FOR DELETE
      USING (true);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to create the game_messages table
CREATE OR REPLACE FUNCTION create_game_messages_table()
RETURNS VOID AS $$
BEGIN
  -- Check if the table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'game_messages') THEN
    -- Create the table
    CREATE TABLE public.game_messages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      sender TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Enable row-level security
    ALTER TABLE public.game_messages ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Everyone can view game messages"
      ON public.game_messages
      FOR SELECT
      USING (true);

    CREATE POLICY "Everyone can insert game messages"
      ON public.game_messages
      FOR INSERT
      WITH CHECK (true);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for the tables
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE game_messages;
