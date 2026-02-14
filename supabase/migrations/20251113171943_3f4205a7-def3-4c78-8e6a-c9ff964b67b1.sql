-- Add database constraints for visa application data validation

-- Validate text field lengths
ALTER TABLE public.visa_applications
ADD CONSTRAINT full_name_length CHECK (LENGTH(TRIM(full_name)) BETWEEN 1 AND 100),
ADD CONSTRAINT passport_number_length CHECK (LENGTH(TRIM(passport_number)) BETWEEN 5 AND 20),
ADD CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
ADD CONSTRAINT mobile_number_length CHECK (LENGTH(TRIM(mobile_number)) BETWEEN 5 AND 15),
ADD CONSTRAINT city_length CHECK (LENGTH(TRIM(city)) BETWEEN 1 AND 100),
ADD CONSTRAINT residential_address_length CHECK (LENGTH(TRIM(residential_address)) BETWEEN 5 AND 500),
ADD CONSTRAINT indian_contact_address_length CHECK (LENGTH(TRIM(indian_contact_address)) BETWEEN 5 AND 500);

-- Create validation trigger function for date fields
CREATE OR REPLACE FUNCTION public.validate_visa_application_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate passport issue date is not in the future
  IF NEW.passport_issue_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Passport issue date cannot be in the future';
  END IF;

  -- Validate passport expiry is after issue date
  IF NEW.passport_expiry_date <= NEW.passport_issue_date THEN
    RAISE EXCEPTION 'Passport expiry date must be after issue date';
  END IF;

  -- Validate passport expiry is at least 6 months after intended arrival
  IF NEW.passport_expiry_date < (NEW.intended_arrival_date + INTERVAL '6 months') THEN
    RAISE EXCEPTION 'Passport must be valid for at least 6 months from intended arrival date';
  END IF;

  -- Validate date of birth is reasonable (between 1 and 120 years old)
  IF NEW.date_of_birth > CURRENT_DATE - INTERVAL '1 year' OR 
     NEW.date_of_birth < CURRENT_DATE - INTERVAL '120 years' THEN
    RAISE EXCEPTION 'Date of birth must be between 1 and 120 years ago';
  END IF;

  -- Validate intended arrival date is not too far in the past
  IF NEW.intended_arrival_date < CURRENT_DATE - INTERVAL '30 days' THEN
    RAISE EXCEPTION 'Intended arrival date cannot be more than 30 days in the past';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for date validation
DROP TRIGGER IF EXISTS validate_visa_dates_trigger ON public.visa_applications;
CREATE TRIGGER validate_visa_dates_trigger
  BEFORE INSERT OR UPDATE ON public.visa_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_visa_application_dates();

-- Add constraints for file uploads
ALTER TABLE public.application_documents
ADD CONSTRAINT file_name_length CHECK (LENGTH(TRIM(file_name)) BETWEEN 1 AND 255),
ADD CONSTRAINT file_size_max CHECK (file_size > 0 AND file_size <= 2097152); -- Max 2MB

COMMENT ON CONSTRAINT file_size_max ON public.application_documents IS 'Maximum file size is 2MB (2097152 bytes)';
COMMENT ON CONSTRAINT full_name_length ON public.visa_applications IS 'Full name must be between 1 and 100 characters';
COMMENT ON CONSTRAINT passport_number_length ON public.visa_applications IS 'Passport number must be between 5 and 20 characters';
COMMENT ON CONSTRAINT email_format ON public.visa_applications IS 'Email must be in valid format';
COMMENT ON CONSTRAINT mobile_number_length ON public.visa_applications IS 'Mobile number must be between 5 and 15 characters';