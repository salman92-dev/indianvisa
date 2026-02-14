-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all documents" ON storage.objects;

-- Allow users to upload only to their own folder
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'visa-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read only their own documents
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'visa-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete only their own documents
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'visa-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admin access for document review
CREATE POLICY "Admins can manage all documents"
ON storage.objects FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));