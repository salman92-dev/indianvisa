-- Fix leads table: change policies from public to authenticated role for admin access
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can update leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;

CREATE POLICY "Admins can view all leads" 
ON public.leads 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update leads" 
ON public.leads 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete leads" 
ON public.leads 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow users to view their own roles for security/transparency
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);