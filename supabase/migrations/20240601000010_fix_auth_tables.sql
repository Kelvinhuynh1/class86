-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.users table for authentication
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  encrypted_password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for auth tables
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own data
DROP POLICY IF EXISTS "Users can read their own data" ON auth.users;
CREATE POLICY "Users can read their own data" 
  ON auth.users FOR SELECT 
  USING (auth.uid() = id);

-- Create policy for admins to read all data
DROP POLICY IF EXISTS "Admins can read all data" ON auth.users;
CREATE POLICY "Admins can read all data" 
  ON auth.users FOR SELECT 
  USING (auth.role() = 'admin');

-- Create function to authenticate users
CREATE OR REPLACE FUNCTION auth.authenticate(email TEXT, password TEXT) 
RETURNS auth.users AS $$
DECLARE
  user_record auth.users;
BEGIN
  SELECT * INTO user_record FROM auth.users 
  WHERE auth.users.email = authenticate.email 
  AND auth.users.encrypted_password = crypt(authenticate.password, auth.users.encrypted_password);
  
  RETURN user_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to register users
CREATE OR REPLACE FUNCTION auth.register(email TEXT, password TEXT, role TEXT, display_name TEXT, class_code TEXT) 
RETURNS auth.users AS $$
DECLARE
  user_record auth.users;
  public_user_id UUID;
BEGIN
  -- Create auth user
  INSERT INTO auth.users (email, encrypted_password) 
  VALUES (register.email, crypt(register.password, gen_salt('bf'))) 
  RETURNING * INTO user_record;
  
  -- Create public user profile
  INSERT INTO public.users (id, display_name, role, class_code, password) 
  VALUES (user_record.id, register.display_name, register.role, register.class_code, register.password);
  
  RETURN user_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create extension for password hashing if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert demo users into auth.users
INSERT INTO auth.users (id, email, encrypted_password)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'john@example.com', crypt('7Hj&9Kl2', gen_salt('bf'))),
  ('00000000-0000-0000-0000-000000000002', 'jane@example.com', crypt('3Mn&7Pq9', gen_salt('bf'))),
  ('00000000-0000-0000-0000-000000000003', 'alex@example.com', crypt('5Rt&2Zx8', gen_salt('bf'))),
  ('00000000-0000-0000-0000-000000000004', 'admin@example.com', crypt('9Yb&4Vn1', gen_salt('bf')))
ON CONFLICT (id) DO NOTHING;

-- Enable realtime for auth tables
alter publication supabase_realtime add table auth.users;
