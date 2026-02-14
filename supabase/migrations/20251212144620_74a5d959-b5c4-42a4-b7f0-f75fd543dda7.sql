-- Add new fields to visa_applications table based on official Indian eVisa form

-- Applicant Details (additional)
ALTER TABLE public.visa_applications 
ADD COLUMN IF NOT EXISTS surname text,
ADD COLUMN IF NOT EXISTS given_name text,
ADD COLUMN IF NOT EXISTS changed_name boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS changed_name_details text,
ADD COLUMN IF NOT EXISTS citizenship_id text,
ADD COLUMN IF NOT EXISTS religion text,
ADD COLUMN IF NOT EXISTS visible_identification_marks text,
ADD COLUMN IF NOT EXISTS educational_qualification text,
ADD COLUMN IF NOT EXISTS nationality_by_birth boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS lived_in_applying_country_2_years boolean DEFAULT true;

-- Passport Details (additional)
ALTER TABLE public.visa_applications
ADD COLUMN IF NOT EXISTS passport_place_of_issue text,
ADD COLUMN IF NOT EXISTS other_passport_held boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS other_passport_country text,
ADD COLUMN IF NOT EXISTS other_passport_number text,
ADD COLUMN IF NOT EXISTS other_passport_issue_date date,
ADD COLUMN IF NOT EXISTS other_passport_place_of_issue text,
ADD COLUMN IF NOT EXISTS other_passport_nationality text;

-- Present Address (structured)
ALTER TABLE public.visa_applications
ADD COLUMN IF NOT EXISTS present_address_house_street text,
ADD COLUMN IF NOT EXISTS present_address_village_town text,
ADD COLUMN IF NOT EXISTS present_address_state text,
ADD COLUMN IF NOT EXISTS present_address_postal_code text,
ADD COLUMN IF NOT EXISTS present_address_country text,
ADD COLUMN IF NOT EXISTS present_address_phone text;

-- Permanent Address
ALTER TABLE public.visa_applications
ADD COLUMN IF NOT EXISTS permanent_address_same_as_present boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS permanent_address_house_street text,
ADD COLUMN IF NOT EXISTS permanent_address_village_town text,
ADD COLUMN IF NOT EXISTS permanent_address_state text;

-- Family Details - Father
ALTER TABLE public.visa_applications
ADD COLUMN IF NOT EXISTS father_name text,
ADD COLUMN IF NOT EXISTS father_nationality text,
ADD COLUMN IF NOT EXISTS father_prev_nationality text,
ADD COLUMN IF NOT EXISTS father_place_of_birth text,
ADD COLUMN IF NOT EXISTS father_country_of_birth text;

-- Family Details - Mother
ALTER TABLE public.visa_applications
ADD COLUMN IF NOT EXISTS mother_name text,
ADD COLUMN IF NOT EXISTS mother_nationality text,
ADD COLUMN IF NOT EXISTS mother_prev_nationality text,
ADD COLUMN IF NOT EXISTS mother_place_of_birth text,
ADD COLUMN IF NOT EXISTS mother_country_of_birth text;

-- Marital and Heritage
ALTER TABLE public.visa_applications
ADD COLUMN IF NOT EXISTS marital_status text,
ADD COLUMN IF NOT EXISTS spouse_name text,
ADD COLUMN IF NOT EXISTS spouse_nationality text,
ADD COLUMN IF NOT EXISTS spouse_prev_nationality text,
ADD COLUMN IF NOT EXISTS spouse_place_of_birth text,
ADD COLUMN IF NOT EXISTS spouse_country_of_birth text,
ADD COLUMN IF NOT EXISTS pakistan_heritage boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pakistan_heritage_details text;

-- Visa Details (additional)
ALTER TABLE public.visa_applications
ADD COLUMN IF NOT EXISTS places_to_visit_1 text,
ADD COLUMN IF NOT EXISTS places_to_visit_2 text,
ADD COLUMN IF NOT EXISTS hotel_booked_through_operator boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hotel_name text,
ADD COLUMN IF NOT EXISTS hotel_address text,
ADD COLUMN IF NOT EXISTS expected_port_of_exit text;

-- Previous India Visit
ALTER TABLE public.visa_applications
ADD COLUMN IF NOT EXISTS visited_india_before boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS previous_india_address text,
ADD COLUMN IF NOT EXISTS previous_india_cities text,
ADD COLUMN IF NOT EXISTS previous_visa_number text,
ADD COLUMN IF NOT EXISTS previous_visa_type text,
ADD COLUMN IF NOT EXISTS previous_visa_place_of_issue text,
ADD COLUMN IF NOT EXISTS previous_visa_issue_date date,
ADD COLUMN IF NOT EXISTS permission_refused_before boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS permission_refused_details text;

-- Other Information
ALTER TABLE public.visa_applications
ADD COLUMN IF NOT EXISTS countries_visited_last_10_years text[],
ADD COLUMN IF NOT EXISTS visited_saarc_countries boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS saarc_countries_details text;

-- Reference in India
ALTER TABLE public.visa_applications
ADD COLUMN IF NOT EXISTS reference_india_name text,
ADD COLUMN IF NOT EXISTS reference_india_address text,
ADD COLUMN IF NOT EXISTS reference_india_phone text;

-- Reference in Home Country
ALTER TABLE public.visa_applications
ADD COLUMN IF NOT EXISTS reference_home_name text,
ADD COLUMN IF NOT EXISTS reference_home_address text,
ADD COLUMN IF NOT EXISTS reference_home_phone text;

-- Security Questions (6 questions)
ALTER TABLE public.visa_applications
ADD COLUMN IF NOT EXISTS security_arrested_convicted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS security_arrested_details text,
ADD COLUMN IF NOT EXISTS security_refused_entry_deported boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS security_refused_entry_details text,
ADD COLUMN IF NOT EXISTS security_criminal_activities boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS security_criminal_details text,
ADD COLUMN IF NOT EXISTS security_terrorist_activities boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS security_terrorist_details text,
ADD COLUMN IF NOT EXISTS security_terrorist_views boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS security_terrorist_views_details text,
ADD COLUMN IF NOT EXISTS security_asylum_sought boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS security_asylum_details text;

-- Declaration
ALTER TABLE public.visa_applications
ADD COLUMN IF NOT EXISTS declaration_accepted boolean DEFAULT false;