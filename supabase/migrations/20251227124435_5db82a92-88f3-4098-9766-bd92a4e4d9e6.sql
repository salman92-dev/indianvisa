-- Allow authenticated users to transition their own visa application from draft -> submitted
-- This complements the existing "Users can update own draft applications" policy whose WITH CHECK blocks status changes.

CREATE POLICY "Users can submit own applications"
ON public.visa_applications
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND status = 'draft'::public.application_status
)
WITH CHECK (
  auth.uid() = user_id
  AND status = 'submitted'::public.application_status
);
