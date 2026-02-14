-- Add thank_you_email_sent flag to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS thank_you_email_sent boolean DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.payments.thank_you_email_sent IS 'Flag to track if thank-you email with Indian e-Visa form link has been sent';