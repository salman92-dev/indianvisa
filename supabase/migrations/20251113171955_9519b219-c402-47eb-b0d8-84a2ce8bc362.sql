-- Fix search_path for security functions
ALTER FUNCTION public.validate_visa_application_dates() SET search_path = public, pg_temp;