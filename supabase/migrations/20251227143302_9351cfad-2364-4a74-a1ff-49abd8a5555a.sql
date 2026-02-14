-- Drop check constraints that prevent saving draft applications with empty/placeholder values
-- Form validation will handle these requirements instead

ALTER TABLE public.visa_applications DROP CONSTRAINT IF EXISTS city_length;
ALTER TABLE public.visa_applications DROP CONSTRAINT IF EXISTS full_name_length;
ALTER TABLE public.visa_applications DROP CONSTRAINT IF EXISTS indian_contact_address_length;
ALTER TABLE public.visa_applications DROP CONSTRAINT IF EXISTS mobile_number_length;
ALTER TABLE public.visa_applications DROP CONSTRAINT IF EXISTS passport_number_length;
ALTER TABLE public.visa_applications DROP CONSTRAINT IF EXISTS residential_address_length;
ALTER TABLE public.visa_applications DROP CONSTRAINT IF EXISTS email_format;