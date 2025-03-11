-- Create todo_tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS todo_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  created_by TEXT NOT NULL,
  assigned_to TEXT[] DEFAULT '{}',
  completed_by TEXT[] DEFAULT '{}',
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE todo_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Anyone can view todo_tasks" ON todo_tasks;
CREATE POLICY "Anyone can view todo_tasks"
  ON todo_tasks FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Leaders and Co-Leaders can insert todo_tasks" ON todo_tasks;
CREATE POLICY "Leaders and Co-Leaders can insert todo_tasks"
  ON todo_tasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('Leader', 'Co-Leader', 'Admin')
  ));

DROP POLICY IF EXISTS "Leaders and Co-Leaders can update todo_tasks" ON todo_tasks;
CREATE POLICY "Leaders and Co-Leaders can update todo_tasks"
  ON todo_tasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('Leader', 'Co-Leader', 'Admin')
  ));

DROP POLICY IF EXISTS "Students can mark their own tasks as completed" ON todo_tasks;
CREATE POLICY "Students can mark their own tasks as completed"
  ON todo_tasks FOR UPDATE
  USING (
    auth.uid()::text = ANY(assigned_to)
  );

DROP POLICY IF EXISTS "Leaders and Co-Leaders can delete todo_tasks" ON todo_tasks;
CREATE POLICY "Leaders and Co-Leaders can delete todo_tasks"
  ON todo_tasks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('Leader', 'Co-Leader', 'Admin')
  ));

-- Enable realtime
alter publication supabase_realtime add table todo_tasks;
