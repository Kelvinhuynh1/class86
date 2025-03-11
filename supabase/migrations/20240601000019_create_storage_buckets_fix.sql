-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
('profile_images', 'Profile Images', true),
('study_files', 'Study Files', true),
('chat_images', 'Chat Images', true),
('chat_files', 'Chat Files', true)
ON CONFLICT (id) DO NOTHING;
