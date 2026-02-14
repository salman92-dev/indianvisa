-- Allow users to update the application_id on their own payments (for linking credits)
CREATE POLICY "Users can link payments to applications"
ON public.payments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);