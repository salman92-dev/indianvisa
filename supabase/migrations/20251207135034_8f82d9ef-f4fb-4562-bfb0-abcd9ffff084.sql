-- Create bookings table for multi-traveler orders
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_travelers INTEGER NOT NULL DEFAULT 1,
  total_amount_paid NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  payment_transaction_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create travelers table linked to bookings
CREATE TABLE public.travelers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  passport_number TEXT NOT NULL,
  nationality TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  application_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travelers ENABLE ROW LEVEL SECURITY;

-- RLS policies for bookings
CREATE POLICY "Users can view own bookings" 
ON public.bookings 
FOR SELECT 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create own bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" 
ON public.bookings 
FOR UPDATE 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for travelers
CREATE POLICY "Users can view travelers for own bookings" 
ON public.travelers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = travelers.booking_id 
    AND (bookings.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Users can create travelers for own bookings" 
ON public.travelers 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = travelers.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update travelers for own bookings" 
ON public.travelers 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = travelers.booking_id 
    AND (bookings.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Add updated_at triggers
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_travelers_updated_at
BEFORE UPDATE ON public.travelers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_travelers_booking_id ON public.travelers(booking_id);