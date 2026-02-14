-- Add visa_type column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS visa_type text NOT NULL DEFAULT '30_days';

-- Add price_per_traveler column to bookings for record-keeping
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS price_per_traveler numeric NOT NULL DEFAULT 0;

-- Add visa_type to payments table for admin visibility
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS visa_duration text;