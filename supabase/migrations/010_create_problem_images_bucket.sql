-- Create a public storage bucket for problem images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'problem-images',
  'problem-images',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'problem-images');

-- Allow public read access to images
CREATE POLICY "Public read access for problem images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'problem-images');

-- Allow admins to delete images
CREATE POLICY "Admins can delete problem images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'problem-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);
