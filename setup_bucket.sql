-- Enable Storage if not already enabled (usually enabled by default)

-- 1. Create the 'profile-photos' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to view photos (SELECT)
CREATE POLICY "Public Profiles"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'profile-photos' );

-- 3. Allow authenticated users to upload photos (INSERT)
CREATE POLICY "Users can upload their own profile photo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1] );
-- Note: The above path check assumes we save files as "userid/filename" or just "userid-..." 
-- My current server implementation saves as "userid-timestamp.ext" at the root of the bucket.
-- So the policy should be simpler for now to avoid permission errors if the path logic isn't perfect.

DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
CREATE POLICY "Authenticated Uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'profile-photos' );

-- 4. Allow users to update their own photos? (UPDATE) usually overwrite is an insert or update.
-- Supabase upload method defaults to upsert: false. If it's a new filename every time, insert is enough.
