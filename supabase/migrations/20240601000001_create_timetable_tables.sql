-- Create timetable_slots table
CREATE TABLE IF NOT EXISTS timetable_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day TEXT NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  subject TEXT NOT NULL,
  teacher TEXT,
  room TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create breaks table
CREATE TABLE IF NOT EXISTS breaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE breaks ENABLE ROW LEVEL SECURITY;

-- Create policies for timetable_slots
DROP POLICY IF EXISTS "Allow read access to all users" ON timetable_slots;
CREATE POLICY "Allow read access to all users"
  ON timetable_slots FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow insert/update/delete for admins" ON timetable_slots;
CREATE POLICY "Allow insert/update/delete for admins"
  ON timetable_slots FOR ALL
  USING (auth.jwt() ->> 'role' = 'Admin');

-- Create policies for breaks
DROP POLICY IF EXISTS "Allow read access to all users" ON breaks;
CREATE POLICY "Allow read access to all users"
  ON breaks FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow insert/update/delete for admins" ON breaks;
CREATE POLICY "Allow insert/update/delete for admins"
  ON breaks FOR ALL
  USING (auth.jwt() ->> 'role' = 'Admin');

-- Enable realtime
alter publication supabase_realtime add table timetable_slots;
alter publication supabase_realtime add table breaks;

-- Insert demo data for timetable_slots
INSERT INTO timetable_slots (day, start_time, end_time, subject, room)
VALUES
  -- Monday
  ('Monday', '07:30', '08:15', 'French', 'Room 101'),
  ('Monday', '08:15', '09:00', 'PE', 'Gym'),
  ('Monday', '09:00', '09:45', 'PE', 'Gym'),
  ('Monday', '10:00', '10:45', 'English', 'Room 203'),
  ('Monday', '10:45', '11:30', 'English', 'Room 203'),
  ('Monday', '13:00', '13:45', 'Computing', 'Lab 1'),
  ('Monday', '13:45', '14:30', 'Computing', 'Lab 1'),
  ('Monday', '15:00', '15:45', 'Technology', 'Tech Room'),
  ('Monday', '15:45', '16:30', 'Well-being', 'Room 105'),
  
  -- Tuesday
  ('Tuesday', '07:30', '08:15', 'Music', 'Music Room'),
  ('Tuesday', '08:15', '09:00', 'Science', 'Lab 2'),
  ('Tuesday', '09:00', '09:45', 'Science', 'Lab 2'),
  ('Tuesday', '10:00', '10:45', 'PE', 'Gym'),
  ('Tuesday', '10:45', '11:30', 'PE', 'Gym'),
  ('Tuesday', '13:00', '13:45', 'Maths', 'Room 301'),
  ('Tuesday', '13:45', '14:30', 'Local Community', 'Room 102'),
  ('Tuesday', '15:00', '15:45', 'English', 'Room 203'),
  ('Tuesday', '15:45', '16:30', 'English', 'Room 203'),
  
  -- Wednesday
  ('Wednesday', '07:30', '08:15', 'Global Perspectives', 'Room 205'),
  ('Wednesday', '08:15', '09:00', 'French', 'Room 101'),
  ('Wednesday', '09:00', '09:45', 'French', 'Room 101'),
  ('Wednesday', '10:00', '10:45', 'Maths', 'Room 301'),
  ('Wednesday', '10:45', '11:30', 'Maths', 'Room 301'),
  ('Wednesday', '13:00', '13:45', 'Art', 'Art Studio'),
  ('Wednesday', '13:45', '14:30', 'Civics', 'Room 104'),
  ('Wednesday', '15:00', '15:45', 'Geography', 'Room 202'),
  ('Wednesday', '15:45', '16:30', 'History', 'Room 204'),
  
  -- Thursday
  ('Thursday', '07:30', '08:15', 'English', 'Room 203'),
  ('Thursday', '08:15', '09:00', 'History', 'Room 204'),
  ('Thursday', '09:00', '09:45', 'Geography', 'Room 202'),
  ('Thursday', '10:00', '10:45', 'Literature', 'Room 206'),
  ('Thursday', '10:45', '11:30', 'Literature', 'Room 206'),
  ('Thursday', '13:00', '13:45', 'Science', 'Lab 2'),
  ('Thursday', '13:45', '14:30', 'Science', 'Lab 2'),
  ('Thursday', '15:00', '15:45', 'Advanced Maths', 'Room 302'),
  ('Thursday', '15:45', '16:30', 'Career Learning', 'Room 103'),
  
  -- Friday
  ('Friday', '07:30', '08:15', 'MOET Science', 'Lab 3'),
  ('Friday', '08:15', '09:00', 'Literature', 'Room 206'),
  ('Friday', '09:00', '09:45', 'Literature', 'Room 206'),
  ('Friday', '10:00', '10:45', 'Career Learning', 'Room 103'),
  ('Friday', '10:45', '11:30', 'Homeroom', 'Room 100'),
  ('Friday', '13:00', '13:45', 'Science', 'Lab 2'),
  ('Friday', '13:45', '14:30', 'Science', 'Lab 2'),
  ('Friday', '15:00', '15:45', 'Maths', 'Room 301'),
  ('Friday', '15:45', '16:30', 'Maths', 'Room 301');

-- Insert demo data for breaks
INSERT INTO breaks (name, start_time, end_time)
VALUES
  ('Morning Break', '09:45', '10:00'),
  ('Lunch Break', '11:30', '13:00'),
  ('Afternoon Snack & Break', '14:30', '15:00');
