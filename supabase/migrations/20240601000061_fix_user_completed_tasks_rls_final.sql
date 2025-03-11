-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Users can manage their own completed tasks" ON user_completed_tasks;

-- Enable RLS on the table
ALTER TABLE user_completed_tasks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now
CREATE POLICY "Allow all operations on user_completed_tasks"
ON user_completed_tasks
FOR ALL
USING (true)
WITH CHECK (true);

-- Grant access to authenticated users
GRANT ALL ON user_completed_tasks TO authenticated;
