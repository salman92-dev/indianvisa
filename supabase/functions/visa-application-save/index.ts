import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to allow string, null, or undefined and transform null to undefined
const optionalString = (maxLen: number = 500) => 
  z.union([z.string().trim().max(maxLen), z.null()]).optional().transform(v => v === null ? undefined : v);

const optionalDate = () =>
  z.union([
    z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), "Invalid date format"),
    z.null()
  ]).optional().transform(v => v === null ? undefined : v);

const optionalUuid = () =>
  z.union([z.string().uuid(), z.null()]).optional().transform(v => v === null ? undefined : v);

const optionalBoolean = () =>
  z.union([z.boolean(), z.null()]).optional().transform(v => v === null ? undefined : v);

const optionalStringArray = () =>
  z.union([z.array(z.string()), z.null()]).optional().transform(v => v === null ? undefined : v);

// Comprehensive Zod schema for visa application validation - allows partial saves
const VisaApplicationSchema = z.object({
  id: optionalUuid(),
  // Applicant Details
  surname: optionalString(50),
  given_name: optionalString(100),
  full_name: z.string().trim().max(150).optional(),
  changed_name: optionalBoolean(),
  changed_name_details: optionalString(200),
  date_of_birth: optionalDate(),
  gender: z.union([z.enum(["male", "female", "other"]), z.null()]).optional().transform(v => v === null ? undefined : v),
  place_of_birth: optionalString(100),
  country_of_birth: optionalString(100),
  citizenship_id: optionalString(50),
  religion: optionalString(50),
  visible_identification_marks: optionalString(200),
  educational_qualification: optionalString(50),
  nationality: optionalString(100),
  nationality_by_birth: optionalBoolean(),
  lived_in_applying_country_2_years: optionalBoolean(),
  // Passport Details
  passport_number: optionalString(20),
  passport_place_of_issue: optionalString(100),
  passport_issue_date: optionalDate(),
  passport_expiry_date: optionalDate(),
  other_passport_held: optionalBoolean(),
  other_passport_country: optionalString(100),
  other_passport_number: optionalString(20),
  other_passport_issue_date: optionalDate(),
  other_passport_place_of_issue: optionalString(100),
  other_passport_nationality: optionalString(100),
  // Contact & Address
  email: z.string().trim().email("Invalid email format").max(255),
  mobile_isd: optionalString(10),
  mobile_number: optionalString(15),
  present_address_house_street: optionalString(200),
  present_address_village_town: optionalString(100),
  present_address_state: optionalString(100),
  present_address_postal_code: optionalString(20),
  present_address_country: optionalString(100),
  present_address_phone: optionalString(20),
  permanent_address_same_as_present: optionalBoolean(),
  permanent_address_house_street: optionalString(200),
  permanent_address_village_town: optionalString(100),
  permanent_address_state: optionalString(100),
  // Legacy fields
  residential_address: optionalString(500),
  city: optionalString(100),
  country: optionalString(100),
  // Family Details - Father
  father_name: optionalString(100),
  father_nationality: optionalString(100),
  father_prev_nationality: optionalString(100),
  father_place_of_birth: optionalString(100),
  father_country_of_birth: optionalString(100),
  // Family Details - Mother
  mother_name: optionalString(100),
  mother_nationality: optionalString(100),
  mother_prev_nationality: optionalString(100),
  mother_place_of_birth: optionalString(100),
  mother_country_of_birth: optionalString(100),
  // Marital Status
  marital_status: optionalString(20),
  spouse_name: optionalString(100),
  spouse_nationality: optionalString(100),
  spouse_prev_nationality: optionalString(100),
  spouse_place_of_birth: optionalString(100),
  spouse_country_of_birth: optionalString(100),
  pakistan_heritage: optionalBoolean(),
  pakistan_heritage_details: optionalString(500),
  // Visa Details
  visa_type: z.union([z.enum(["tourist", "business", "medical", "conference", "student", "other"]), z.null()]).optional().transform(v => v === null ? undefined : v),
  visa_type_other: optionalString(100),
  duration_of_stay: optionalString(50),
  intended_arrival_date: optionalDate(),
  arrival_point_id: optionalUuid(),
  expected_port_of_exit: optionalString(100),
  purpose_of_visit: optionalString(1000),
  places_to_visit_1: optionalString(100),
  places_to_visit_2: optionalString(100),
  hotel_booked_through_operator: optionalBoolean(),
  hotel_name: optionalString(200),
  hotel_address: optionalString(500),
  // Previous Visa
  visited_india_before: optionalBoolean(),
  previous_india_address: optionalString(500),
  previous_india_cities: optionalString(200),
  previous_visa_number: optionalString(50),
  previous_visa_type: optionalString(50),
  previous_visa_place_of_issue: optionalString(100),
  previous_visa_issue_date: optionalDate(),
  permission_refused_before: optionalBoolean(),
  permission_refused_details: optionalString(500),
  // Legacy
  indian_contact_address: optionalString(500),
  indian_contact_person: optionalString(100),
  indian_contact_phone: optionalString(20),
  previous_visa_details: optionalString(500),
  visa_refused_before: optionalBoolean(),
  visa_refusal_details: optionalString(500),
  // Other Info
  countries_visited_last_10_years: optionalStringArray(),
  visited_saarc_countries: optionalBoolean(),
  saarc_countries_details: optionalString(500),
  // References
  reference_india_name: optionalString(100),
  reference_india_address: optionalString(500),
  reference_india_phone: optionalString(20),
  reference_home_name: optionalString(100),
  reference_home_address: optionalString(500),
  reference_home_phone: optionalString(20),
  // Security Questions
  security_arrested_convicted: optionalBoolean(),
  security_arrested_details: optionalString(500),
  security_refused_entry_deported: optionalBoolean(),
  security_refused_entry_details: optionalString(500),
  security_criminal_activities: optionalBoolean(),
  security_criminal_details: optionalString(500),
  security_terrorist_activities: optionalBoolean(),
  security_terrorist_details: optionalString(500),
  security_terrorist_views: optionalBoolean(),
  security_terrorist_views_details: optionalString(500),
  security_asylum_sought: optionalBoolean(),
  security_asylum_details: optionalString(500),
  // Declaration
  declaration_accepted: optionalBoolean(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message || 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    console.log('Received save request for user:', user.id, 'application id:', body.id);
    
    const validationResult = VisaApplicationSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validatedData = validationResult.data;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (validatedData.id) {
      const { data: existing, error: existingError } = await supabaseAdmin
        .from('visa_applications')
        .select('user_id, status')
        .eq('id', validatedData.id)
        .single();

      if (existingError || !existing) {
        console.error('Application not found:', validatedData.id);
        return new Response(
          JSON.stringify({ error: 'Application not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (existing.user_id !== user.id) {
        console.error('Ownership mismatch:', existing.user_id, '!=', user.id);
        return new Response(
          JSON.stringify({ error: 'Forbidden - You can only edit your own applications' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (existing.status !== 'draft') {
        console.error('Cannot edit non-draft application:', existing.status);
        return new Response(
          JSON.stringify({ error: 'Cannot edit submitted application' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Prepare data for database
    const applicationData: Record<string, any> = {
      email: validatedData.email,
      user_id: user.id,
      status: 'draft',
      last_autosave_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Helper to add non-empty values
    const addIfPresent = (key: string, value: any) => {
      if (value !== undefined && value !== null && value !== '') {
        applicationData[key] = value;
      }
    };

    // Applicant Details
    addIfPresent('surname', validatedData.surname);
    addIfPresent('given_name', validatedData.given_name);
    addIfPresent('full_name', validatedData.full_name || `${validatedData.surname || ''} ${validatedData.given_name || ''}`.trim());
    if (typeof validatedData.changed_name === 'boolean') applicationData.changed_name = validatedData.changed_name;
    addIfPresent('changed_name_details', validatedData.changed_name_details);
    addIfPresent('date_of_birth', validatedData.date_of_birth);
    addIfPresent('gender', validatedData.gender);
    addIfPresent('place_of_birth', validatedData.place_of_birth);
    addIfPresent('country_of_birth', validatedData.country_of_birth);
    addIfPresent('citizenship_id', validatedData.citizenship_id);
    addIfPresent('religion', validatedData.religion);
    addIfPresent('visible_identification_marks', validatedData.visible_identification_marks);
    addIfPresent('educational_qualification', validatedData.educational_qualification);
    addIfPresent('nationality', validatedData.nationality);
    if (typeof validatedData.nationality_by_birth === 'boolean') applicationData.nationality_by_birth = validatedData.nationality_by_birth;
    if (typeof validatedData.lived_in_applying_country_2_years === 'boolean') applicationData.lived_in_applying_country_2_years = validatedData.lived_in_applying_country_2_years;
    
    // Passport Details
    addIfPresent('passport_number', validatedData.passport_number);
    addIfPresent('passport_place_of_issue', validatedData.passport_place_of_issue);
    addIfPresent('passport_issue_date', validatedData.passport_issue_date);
    addIfPresent('passport_expiry_date', validatedData.passport_expiry_date);
    if (typeof validatedData.other_passport_held === 'boolean') applicationData.other_passport_held = validatedData.other_passport_held;
    addIfPresent('other_passport_country', validatedData.other_passport_country);
    addIfPresent('other_passport_number', validatedData.other_passport_number);
    addIfPresent('other_passport_issue_date', validatedData.other_passport_issue_date);
    addIfPresent('other_passport_place_of_issue', validatedData.other_passport_place_of_issue);
    addIfPresent('other_passport_nationality', validatedData.other_passport_nationality);
    
    // Contact & Address
    addIfPresent('mobile_isd', validatedData.mobile_isd);
    addIfPresent('mobile_number', validatedData.mobile_number);
    addIfPresent('present_address_house_street', validatedData.present_address_house_street);
    addIfPresent('present_address_village_town', validatedData.present_address_village_town);
    addIfPresent('present_address_state', validatedData.present_address_state);
    addIfPresent('present_address_postal_code', validatedData.present_address_postal_code);
    addIfPresent('present_address_country', validatedData.present_address_country);
    addIfPresent('present_address_phone', validatedData.present_address_phone);
    if (typeof validatedData.permanent_address_same_as_present === 'boolean') applicationData.permanent_address_same_as_present = validatedData.permanent_address_same_as_present;
    addIfPresent('permanent_address_house_street', validatedData.permanent_address_house_street);
    addIfPresent('permanent_address_village_town', validatedData.permanent_address_village_town);
    addIfPresent('permanent_address_state', validatedData.permanent_address_state);
    // Legacy
    addIfPresent('residential_address', validatedData.residential_address);
    addIfPresent('city', validatedData.city);
    addIfPresent('country', validatedData.country);
    
    // Family Details - Father
    addIfPresent('father_name', validatedData.father_name);
    addIfPresent('father_nationality', validatedData.father_nationality);
    addIfPresent('father_prev_nationality', validatedData.father_prev_nationality);
    addIfPresent('father_place_of_birth', validatedData.father_place_of_birth);
    addIfPresent('father_country_of_birth', validatedData.father_country_of_birth);
    // Mother
    addIfPresent('mother_name', validatedData.mother_name);
    addIfPresent('mother_nationality', validatedData.mother_nationality);
    addIfPresent('mother_prev_nationality', validatedData.mother_prev_nationality);
    addIfPresent('mother_place_of_birth', validatedData.mother_place_of_birth);
    addIfPresent('mother_country_of_birth', validatedData.mother_country_of_birth);
    // Marital
    addIfPresent('marital_status', validatedData.marital_status);
    addIfPresent('spouse_name', validatedData.spouse_name);
    addIfPresent('spouse_nationality', validatedData.spouse_nationality);
    addIfPresent('spouse_prev_nationality', validatedData.spouse_prev_nationality);
    addIfPresent('spouse_place_of_birth', validatedData.spouse_place_of_birth);
    addIfPresent('spouse_country_of_birth', validatedData.spouse_country_of_birth);
    if (typeof validatedData.pakistan_heritage === 'boolean') applicationData.pakistan_heritage = validatedData.pakistan_heritage;
    addIfPresent('pakistan_heritage_details', validatedData.pakistan_heritage_details);
    
    // Visa Details
    addIfPresent('visa_type', validatedData.visa_type);
    addIfPresent('visa_type_other', validatedData.visa_type_other);
    addIfPresent('duration_of_stay', validatedData.duration_of_stay);
    addIfPresent('intended_arrival_date', validatedData.intended_arrival_date);
    addIfPresent('arrival_point_id', validatedData.arrival_point_id);
    addIfPresent('expected_port_of_exit', validatedData.expected_port_of_exit);
    addIfPresent('purpose_of_visit', validatedData.purpose_of_visit);
    addIfPresent('places_to_visit_1', validatedData.places_to_visit_1);
    addIfPresent('places_to_visit_2', validatedData.places_to_visit_2);
    if (typeof validatedData.hotel_booked_through_operator === 'boolean') applicationData.hotel_booked_through_operator = validatedData.hotel_booked_through_operator;
    addIfPresent('hotel_name', validatedData.hotel_name);
    addIfPresent('hotel_address', validatedData.hotel_address);
    
    // Previous Visa
    if (typeof validatedData.visited_india_before === 'boolean') applicationData.visited_india_before = validatedData.visited_india_before;
    addIfPresent('previous_india_address', validatedData.previous_india_address);
    addIfPresent('previous_india_cities', validatedData.previous_india_cities);
    addIfPresent('previous_visa_number', validatedData.previous_visa_number);
    addIfPresent('previous_visa_type', validatedData.previous_visa_type);
    addIfPresent('previous_visa_place_of_issue', validatedData.previous_visa_place_of_issue);
    addIfPresent('previous_visa_issue_date', validatedData.previous_visa_issue_date);
    if (typeof validatedData.permission_refused_before === 'boolean') applicationData.permission_refused_before = validatedData.permission_refused_before;
    addIfPresent('permission_refused_details', validatedData.permission_refused_details);
    // Legacy
    addIfPresent('indian_contact_address', validatedData.indian_contact_address);
    addIfPresent('indian_contact_person', validatedData.indian_contact_person);
    addIfPresent('indian_contact_phone', validatedData.indian_contact_phone);
    addIfPresent('previous_visa_details', validatedData.previous_visa_details);
    if (typeof validatedData.visa_refused_before === 'boolean') applicationData.visa_refused_before = validatedData.visa_refused_before;
    addIfPresent('visa_refusal_details', validatedData.visa_refusal_details);
    
    // Other Info
    if (validatedData.countries_visited_last_10_years && validatedData.countries_visited_last_10_years.length > 0) {
      applicationData.countries_visited_last_10_years = validatedData.countries_visited_last_10_years;
    }
    if (typeof validatedData.visited_saarc_countries === 'boolean') applicationData.visited_saarc_countries = validatedData.visited_saarc_countries;
    addIfPresent('saarc_countries_details', validatedData.saarc_countries_details);
    
    // References
    addIfPresent('reference_india_name', validatedData.reference_india_name);
    addIfPresent('reference_india_address', validatedData.reference_india_address);
    addIfPresent('reference_india_phone', validatedData.reference_india_phone);
    addIfPresent('reference_home_name', validatedData.reference_home_name);
    addIfPresent('reference_home_address', validatedData.reference_home_address);
    addIfPresent('reference_home_phone', validatedData.reference_home_phone);
    
    // Security Questions
    if (typeof validatedData.security_arrested_convicted === 'boolean') applicationData.security_arrested_convicted = validatedData.security_arrested_convicted;
    addIfPresent('security_arrested_details', validatedData.security_arrested_details);
    if (typeof validatedData.security_refused_entry_deported === 'boolean') applicationData.security_refused_entry_deported = validatedData.security_refused_entry_deported;
    addIfPresent('security_refused_entry_details', validatedData.security_refused_entry_details);
    if (typeof validatedData.security_criminal_activities === 'boolean') applicationData.security_criminal_activities = validatedData.security_criminal_activities;
    addIfPresent('security_criminal_details', validatedData.security_criminal_details);
    if (typeof validatedData.security_terrorist_activities === 'boolean') applicationData.security_terrorist_activities = validatedData.security_terrorist_activities;
    addIfPresent('security_terrorist_details', validatedData.security_terrorist_details);
    if (typeof validatedData.security_terrorist_views === 'boolean') applicationData.security_terrorist_views = validatedData.security_terrorist_views;
    addIfPresent('security_terrorist_views_details', validatedData.security_terrorist_views_details);
    if (typeof validatedData.security_asylum_sought === 'boolean') applicationData.security_asylum_sought = validatedData.security_asylum_sought;
    addIfPresent('security_asylum_details', validatedData.security_asylum_details);
    
    // Declaration
    if (typeof validatedData.declaration_accepted === 'boolean') applicationData.declaration_accepted = validatedData.declaration_accepted;

    let result;
    
    if (validatedData.id) {
      console.log('Updating existing application:', validatedData.id);
      const { data, error } = await supabaseAdmin
        .from('visa_applications')
        .update(applicationData)
        .eq('id', validatedData.id)
        .select()
        .single();
      
      if (error) {
        console.error('Update error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update application', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      result = data;
    } else {
      console.log('Creating new application');
      const { data, error } = await supabaseAdmin
        .from('visa_applications')
        .insert(applicationData)
        .select()
        .single();
      
      if (error) {
        console.error('Insert error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create application', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      result = data;
    }

    console.log('Save successful, application id:', result.id);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in visa-application-save:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
