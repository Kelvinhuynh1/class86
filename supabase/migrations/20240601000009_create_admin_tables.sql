-- Create users table if it doesn't exist already
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name TEXT NOT NULL,
  role TEXT NOT NULL,
  class_code TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teams table if it doesn't exist already
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  members TEXT[] DEFAULT '{}',
  notes TEXT,
  subjects TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert demo data for users
INSERT INTO users (id, display_name, role, class_code, password)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'John Doe', 'Student', 'JD42', '7Hj&9Kl2'),
  ('00000000-0000-0000-0000-000000000002', 'Jane Smith', 'Leader', 'JS85', '3Mn&7Pq9'),
  ('00000000-0000-0000-0000-000000000003', 'Alex Johnson', 'Co-Leader', 'AJ63', '5Rt&2Zx8'),
  ('00000000-0000-0000-0000-000000000004', 'Teacher Admin', 'Admin', 'TA01', '9Yb&4Vn1')
ON CONFLICT (id) DO NOTHING;

-- Insert demo data for teams
INSERT INTO teams (id, name, members, notes, subjects)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Science Team', '{"00000000-0000-0000-0000-000000000001","00000000-0000-0000-0000-000000000002"}', 'Focus on science projects and experiments', '{"Science","Computing"}'),
  ('00000000-0000-0000-0000-000000000002', 'Math Group', '{"00000000-0000-0000-0000-000000000003","00000000-0000-0000-0000-000000000004"}', 'Advanced mathematics study group', '{"Mathematics"}'),
  ('00000000-0000-0000-0000-000000000003', 'Language Arts', '{"00000000-0000-0000-0000-000000000001","00000000-0000-0000-0000-000000000003"}', 'English and literature focus', '{"English","French"}')
ON CONFLICT (id) DO NOTHING;

-- Enable realtime for these tables
alter publication supabase_realtime add table users;
alter publication supabase_realtime add table teams;
