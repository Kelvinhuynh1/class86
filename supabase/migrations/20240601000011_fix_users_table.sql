-- Ensure users table has the correct structure
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name TEXT NOT NULL,
  role TEXT NOT NULL,
  class_code TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert demo users if they don't exist
INSERT INTO users (id, display_name, role, class_code, password)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'John Doe', 'Student', 'JD42', '7Hj&9Kl2'),
  ('00000000-0000-0000-0000-000000000002', 'Jane Smith', 'Leader', 'JS85', '3Mn&7Pq9'),
  ('00000000-0000-0000-0000-000000000003', 'Alex Johnson', 'Co-Leader', 'AJ63', '5Rt&2Zx8'),
  ('00000000-0000-0000-0000-000000000004', 'Teacher Admin', 'Admin', 'TA01', '9Yb&4Vn1')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS but with a policy that allows all access for now
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access" ON users;
CREATE POLICY "Public access"
ON users FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Insert access" ON users;
CREATE POLICY "Insert access"
ON users FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Update access" ON users;
CREATE POLICY "Update access"
ON users FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Delete access" ON users;
CREATE POLICY "Delete access"
ON users FOR DELETE
USING (true);
