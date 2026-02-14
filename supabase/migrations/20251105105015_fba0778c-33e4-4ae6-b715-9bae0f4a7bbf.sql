-- Add server-side validation to handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_country TEXT;
BEGIN
  -- Validate and sanitize full_name
  v_full_name := TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  IF LENGTH(v_full_name) > 100 THEN
    RAISE EXCEPTION 'Full name must be 100 characters or less';
  END IF;
  
  -- Validate country code (must be 2-letter code)
  v_country := UPPER(TRIM(COALESCE(NEW.raw_user_meta_data->>'country', 'US')));
  IF LENGTH(v_country) != 2 THEN
    RAISE EXCEPTION 'Country code must be exactly 2 characters';
  END IF;
  
  INSERT INTO public.profiles (id, email, full_name, country)
  VALUES (NEW.id, NEW.email, v_full_name, v_country);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add column constraints to profiles table for additional validation layer
ALTER TABLE public.profiles
  ADD CONSTRAINT full_name_length CHECK (LENGTH(full_name) <= 100),
  ADD CONSTRAINT country_format CHECK (LENGTH(country) = 2);

-- Add constraint for email format (basic validation)
ALTER TABLE public.profiles
  ADD CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');