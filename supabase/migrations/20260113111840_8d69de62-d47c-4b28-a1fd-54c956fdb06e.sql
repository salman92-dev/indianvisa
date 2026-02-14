-- Add admin policy to delete any application documents
CREATE POLICY "Admins can delete any documents"
ON public.application_documents
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policy to update any application documents (for metadata corrections)
CREATE POLICY "Admins can update any documents"
ON public.application_documents
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policy to insert documents on behalf of users (edge case for manual uploads)
CREATE POLICY "Admins can insert documents"
ON public.application_documents
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));