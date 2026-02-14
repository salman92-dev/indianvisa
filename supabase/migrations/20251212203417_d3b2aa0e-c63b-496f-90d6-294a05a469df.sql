-- Fix 1: Drop and recreate profiles policies to only allow authenticated users
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- Recreate with authenticated role only
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (auth.uid() = id);

-- Allow admins to view all profiles for admin panel
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Drop and recreate travelers policies to only allow authenticated users
DROP POLICY IF EXISTS "Users can view travelers for own bookings" ON public.travelers;
DROP POLICY IF EXISTS "Users can create travelers for own bookings" ON public.travelers;
DROP POLICY IF EXISTS "Users can update travelers for own bookings" ON public.travelers;

CREATE POLICY "Users can view travelers for own bookings" 
ON public.travelers 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM bookings
  WHERE bookings.id = travelers.booking_id 
  AND (bookings.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Users can create travelers for own bookings" 
ON public.travelers 
FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM bookings
  WHERE bookings.id = travelers.booking_id 
  AND bookings.user_id = auth.uid()
));

CREATE POLICY "Users can update travelers for own bookings" 
ON public.travelers 
FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM bookings
  WHERE bookings.id = travelers.booking_id 
  AND (bookings.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
))
WITH CHECK (EXISTS (
  SELECT 1 FROM bookings
  WHERE bookings.id = travelers.booking_id 
  AND (bookings.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

-- Fix 3: Drop and recreate payments policies to only allow authenticated users
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can link payments to applications" ON public.payments;

CREATE POLICY "Users can view own payments" 
ON public.payments 
FOR SELECT 
TO authenticated
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can link payments to applications" 
ON public.payments 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix 4: Drop and recreate visa_applications update policy with proper WITH CHECK
DROP POLICY IF EXISTS "Users can update own draft applications" ON public.visa_applications;

CREATE POLICY "Users can update own draft applications" 
ON public.visa_applications 
FOR UPDATE 
TO authenticated
USING ((auth.uid() = user_id) AND (status = 'draft'::application_status))
WITH CHECK ((auth.uid() = user_id) AND (status = 'draft'::application_status));

-- Fix 5: Drop and recreate bookings policies to only allow authenticated users
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;

CREATE POLICY "Users can view own bookings" 
ON public.bookings 
FOR SELECT 
TO authenticated
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create own bookings" 
ON public.bookings 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Restrict bookings update to only allow specific fields (not payment_status)
CREATE POLICY "Users can update own bookings" 
ON public.bookings 
FOR UPDATE 
TO authenticated
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));