-- Create task_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES todo_tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Anyone can view task_comments" ON task_comments;
CREATE POLICY "Anyone can view task_comments"
  ON task_comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert task_comments" ON task_comments;
CREATE POLICY "Anyone can insert task_comments"
  ON task_comments FOR INSERT
  WITH CHECK (true);

-- Enable realtime
alter publication supabase_realtime add table task_comments;
