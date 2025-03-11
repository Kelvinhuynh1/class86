-- Create posts table for announcements and news
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create comments table for posts
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on posts table
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create policy for posts
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by everyone"
  ON public.posts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Posts can be created by leaders and admins" ON public.posts;
CREATE POLICY "Posts can be created by leaders and admins"
  ON public.posts FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Posts can be updated by author" ON public.posts;
CREATE POLICY "Posts can be updated by author"
  ON public.posts FOR UPDATE
  USING (auth.uid()::text = author_id);

DROP POLICY IF EXISTS "Posts can be deleted by author" ON public.posts;
CREATE POLICY "Posts can be deleted by author"
  ON public.posts FOR DELETE
  USING (auth.uid()::text = author_id);

-- Enable RLS on post_comments table
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Create policy for post_comments
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.post_comments;
CREATE POLICY "Comments are viewable by everyone"
  ON public.post_comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Comments can be created by authenticated users" ON public.post_comments;
CREATE POLICY "Comments can be created by authenticated users"
  ON public.post_comments FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Comments can be deleted by author" ON public.post_comments;
CREATE POLICY "Comments can be deleted by author"
  ON public.post_comments FOR DELETE
  USING (auth.uid()::text = author_id);

-- Add realtime for posts and comments tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;

-- Create a function to update timestamps
CREATE OR REPLACE FUNCTION update_post_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at timestamp whenever a post is updated
DROP TRIGGER IF EXISTS update_post_timestamp ON public.posts;
CREATE TRIGGER update_post_timestamp
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION update_post_timestamp();
