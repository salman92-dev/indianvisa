// Complete Application Data interface matching official Indian eVisa form

export interface ApplicationData {
  id?: string;
  
  // Applicant Details
  surname: string;
  given_name: string;
  full_name: string;
  changed_name: boolean;
  changed_name_details?: string;
  date_of_birth: string;
  gender: "male" | "female" | "other" | "";
  place_of_birth: string;
  country_of_birth: string;
  citizenship_id: string;
  religion: string;
  visible_identification_marks: string;
  educational_qualification: string;
  nationality: string;
  nationality_by_birth: boolean;
  lived_in_applying_country_2_years: boolean;

  // Passport Details
  passport_number: string;
  passport_place_of_issue: string;
  passport_issue_date: string;
  passport_expiry_date: string;
  other_passport_held: boolean;
  other_passport_country?: string;
  other_passport_number?: string;
  other_passport_issue_date?: string;
  other_passport_place_of_issue?: string;
  other_passport_nationality?: string;

  // Contact - Present Address
  email: string;
  mobile_isd: string;
  mobile_number: string;
  present_address_house_street: string;
  present_address_village_town: string;
  present_address_state: string;
  present_address_postal_code: string;
  present_address_country: string;
  present_address_phone?: string;

  // Permanent Address
  permanent_address_same_as_present: boolean;
  permanent_address_house_street?: string;
  permanent_address_village_town?: string;
  permanent_address_state?: string;

  // Legacy fields (kept for compatibility)
  residential_address: string;
  city: string;
  country: string;

  // Family Details - Father
  father_name: string;
  father_nationality: string;
  father_prev_nationality?: string;
  father_place_of_birth: string;
  father_country_of_birth: string;

  // Family Details - Mother
  mother_name: string;
  mother_nationality: string;
  mother_prev_nationality?: string;
  mother_place_of_birth: string;
  mother_country_of_birth: string;

  // Marital Status
  marital_status: string;
  spouse_name?: string;
  spouse_nationality?: string;
  spouse_prev_nationality?: string;
  spouse_place_of_birth?: string;
  spouse_country_of_birth?: string;

  // Pakistan Heritage
  pakistan_heritage: boolean;
  pakistan_heritage_details?: string;

  // Visa Details
  visa_type: "tourist" | "business" | "medical" | "conference" | "student" | "other";
  visa_type_other?: string;
  duration_of_stay: string;
  intended_arrival_date: string;
  arrival_point_id: string;
  expected_port_of_exit?: string;
  purpose_of_visit?: string;
  places_to_visit_1?: string;
  places_to_visit_2?: string;
  hotel_booked_through_operator: boolean;
  hotel_name?: string;
  hotel_address?: string;

  // Previous India Visit
  visited_india_before: boolean;
  previous_india_address?: string;
  previous_india_cities?: string;
  previous_visa_number?: string;
  previous_visa_type?: string;
  previous_visa_place_of_issue?: string;
  previous_visa_issue_date?: string;
  permission_refused_before: boolean;
  permission_refused_details?: string;

  // Legacy fields
  indian_contact_address: string;
  indian_contact_person?: string;
  indian_contact_phone?: string;
  previous_visa_details?: string;
  visa_refused_before: boolean;
  visa_refusal_details?: string;

  // Other Information
  countries_visited_last_10_years: string[];
  visited_saarc_countries: boolean;
  saarc_countries_details?: string;

  // Reference in India
  reference_india_name: string;
  reference_india_address: string;
  reference_india_phone: string;

  // Reference in Home Country
  reference_home_name: string;
  reference_home_address: string;
  reference_home_phone: string;

  // Security Questions
  security_arrested_convicted: boolean;
  security_arrested_details?: string;
  security_refused_entry_deported: boolean;
  security_refused_entry_details?: string;
  security_criminal_activities: boolean;
  security_criminal_details?: string;
  security_terrorist_activities: boolean;
  security_terrorist_details?: string;
  security_terrorist_views: boolean;
  security_terrorist_views_details?: string;
  security_asylum_sought: boolean;
  security_asylum_details?: string;

  // Declaration
  declaration_accepted: boolean;

  // Status
  status?: string;
}

export const RELIGIONS = [
  "Buddhism",
  "Christianity",
  "Hinduism",
  "Islam",
  "Jainism",
  "Judaism",
  "Sikhism",
  "Zoroastrianism",
  "Other",
  "No Religion"
];

export const EDUCATION_QUALIFICATIONS = [
  "Below Matriculate",
  "Matriculate",
  "Graduate",
  "Post Graduate",
  "Doctorate",
  "Professional",
  "Others"
];

export const MARITAL_STATUSES = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
  "Separated"
];

export const VISA_TYPES_PREVIOUS = [
  "Tourist",
  "Business",
  "Employment",
  "Student",
  "Medical",
  "Conference",
  "Transit",
  "Other"
];

export const SAARC_COUNTRIES = [
  "Afghanistan",
  "Bangladesh",
  "Bhutan",
  "India",
  "Maldives",
  "Nepal",
  "Pakistan",
  "Sri Lanka"
];

export const getDefaultApplicationData = (email?: string): ApplicationData => ({
  surname: "",
  given_name: "",
  full_name: "",
  changed_name: false,
  date_of_birth: "",
  gender: "",
  place_of_birth: "",
  country_of_birth: "",
  citizenship_id: "",
  religion: "",
  visible_identification_marks: "",
  educational_qualification: "",
  nationality: "",
  nationality_by_birth: true,
  lived_in_applying_country_2_years: true,

  passport_number: "",
  passport_place_of_issue: "",
  passport_issue_date: "",
  passport_expiry_date: "",
  other_passport_held: false,

  email: email || "",
  mobile_isd: "+971",
  mobile_number: "",
  present_address_house_street: "",
  present_address_village_town: "",
  present_address_state: "",
  present_address_postal_code: "",
  present_address_country: "",
  permanent_address_same_as_present: true,

  residential_address: "",
  city: "",
  country: "",

  father_name: "",
  father_nationality: "",
  father_place_of_birth: "",
  father_country_of_birth: "",

  mother_name: "",
  mother_nationality: "",
  mother_place_of_birth: "",
  mother_country_of_birth: "",

  marital_status: "Single",
  pakistan_heritage: false,

  visa_type: "tourist",
  duration_of_stay: "30 days",
  intended_arrival_date: "",
  arrival_point_id: "",
  hotel_booked_through_operator: false,

  visited_india_before: false,
  permission_refused_before: false,

  indian_contact_address: "",
  visa_refused_before: false,

  countries_visited_last_10_years: [],
  visited_saarc_countries: false,

  reference_india_name: "",
  reference_india_address: "",
  reference_india_phone: "",

  reference_home_name: "",
  reference_home_address: "",
  reference_home_phone: "",

  security_arrested_convicted: false,
  security_refused_entry_deported: false,
  security_criminal_activities: false,
  security_terrorist_activities: false,
  security_terrorist_views: false,
  security_asylum_sought: false,

  declaration_accepted: false,
  status: "draft"
});
