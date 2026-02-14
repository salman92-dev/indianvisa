-- Create a validation trigger function for leads table
CREATE OR REPLACE FUNCTION public.validate_lead_input()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate name: required, 1-100 characters
  IF NEW.name IS NULL OR length(trim(NEW.name)) < 1 THEN
    RAISE EXCEPTION 'Name is required';
  END IF;
  IF length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Name must be 100 characters or less';
  END IF;
  
  -- Validate email: required, 5-255 characters, valid format
  IF NEW.email IS NULL OR length(trim(NEW.email)) < 5 THEN
    RAISE EXCEPTION 'Valid email is required';
  END IF;
  IF length(NEW.email) > 255 THEN
    RAISE EXCEPTION 'Email must be 255 characters or less';
  END IF;
  IF NEW.email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate country: optional, max 100 characters
  IF NEW.country IS NOT NULL AND length(NEW.country) > 100 THEN
    RAISE EXCEPTION 'Country must be 100 characters or less';
  END IF;
  
  -- Validate notes: optional, max 1000 characters
  IF NEW.notes IS NOT NULL AND length(NEW.notes) > 1000 THEN
    RAISE EXCEPTION 'Notes must be 1000 characters or less';
  END IF;
  
  -- Validate page_url: optional, max 500 characters
  IF NEW.page_url IS NOT NULL AND length(NEW.page_url) > 500 THEN
    RAISE EXCEPTION 'Page URL must be 500 characters or less';
  END IF;
  
  -- Validate source: max 100 characters
  IF NEW.source IS NOT NULL AND length(NEW.source) > 100 THEN
    RAISE EXCEPTION 'Source must be 100 characters or less';
  END IF;
  
  -- Trim whitespace from text fields
  NEW.name := trim(NEW.name);
  NEW.email := lower(trim(NEW.email));
  IF NEW.country IS NOT NULL THEN
    NEW.country := trim(NEW.country);
  END IF;
  IF NEW.notes IS NOT NULL THEN
    NEW.notes := trim(NEW.notes);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for lead validation
DROP TRIGGER IF EXISTS validate_lead_input_trigger ON public.leads;
CREATE TRIGGER validate_lead_input_trigger
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_lead_input();