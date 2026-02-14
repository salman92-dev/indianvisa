-- =====================================================
-- VISA4LESS ARCHITECTURE OVERHAUL MIGRATION
-- Decouples payment, application, and booking statuses
-- =====================================================

-- 1. Update payment_status enum to include 'initiated'
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'initiated' BEFORE 'pending';

-- 2. Update application_status enum to include new statuses
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'under_review' AFTER 'submitted';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'approved' AFTER 'under_review';

-- 3. Create booking_state enum
DO $$ BEGIN
  CREATE TYPE booking_state AS ENUM (
    'paid_not_submitted',
    'paid_submitted', 
    'under_review',
    'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. Add booking_state column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS state booking_state DEFAULT 'paid_not_submitted';

-- 5. Create application_snapshots table for immutable submission records
CREATE TABLE IF NOT EXISTS public.application_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.visa_applications(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  snapshot_data jsonb NOT NULL,
  document_urls jsonb DEFAULT '[]'::jsonb,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  submitted_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_application_snapshot UNIQUE (application_id)
);

-- 6. Enable RLS on application_snapshots
ALTER TABLE public.application_snapshots ENABLE ROW LEVEL SECURITY;

-- 7. RLS policies for application_snapshots
CREATE POLICY "Users can view own snapshots"
ON public.application_snapshots
FOR SELECT
USING (
  submitted_by = auth.uid() OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can create own snapshots"
ON public.application_snapshots
FOR INSERT
WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Admins can view all snapshots"
ON public.application_snapshots
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_application_snapshots_application_id 
ON public.application_snapshots(application_id);

CREATE INDEX IF NOT EXISTS idx_application_snapshots_booking_id 
ON public.application_snapshots(booking_id);

CREATE INDEX IF NOT EXISTS idx_application_snapshots_submitted_at 
ON public.application_snapshots(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_state 
ON public.bookings(state);

-- 9. Add is_locked column to visa_applications to prevent edits after submission
ALTER TABLE public.visa_applications 
ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false;

-- 10. Create function to update booking state based on application status
CREATE OR REPLACE FUNCTION public.sync_booking_state()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_id uuid;
  v_booking_id uuid;
BEGIN
  -- Find the payment linked to this application
  SELECT id INTO v_payment_id 
  FROM public.payments 
  WHERE application_id = NEW.id 
  LIMIT 1;

  -- If there's a linked payment, we can determine booking state
  IF v_payment_id IS NOT NULL THEN
    -- For now, log the state change
    RAISE LOG 'Application % changed to status %, payment found: %', NEW.id, NEW.status, v_payment_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 11. Create trigger to sync booking state on application status change
DROP TRIGGER IF EXISTS trigger_sync_booking_state ON public.visa_applications;
CREATE TRIGGER trigger_sync_booking_state
AFTER UPDATE OF status ON public.visa_applications
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.sync_booking_state();

-- 12. Update RLS policy for locked applications (users cannot update locked applications)
DROP POLICY IF EXISTS "Users can update own draft applications" ON public.visa_applications;
CREATE POLICY "Users can update own draft applications"
ON public.visa_applications
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND status = 'draft'::application_status 
  AND (is_locked IS NULL OR is_locked = false)
)
WITH CHECK (
  auth.uid() = user_id 
  AND status = 'draft'::application_status
  AND (is_locked IS NULL OR is_locked = false)
);