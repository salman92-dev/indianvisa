/**
 * Visa Eligibility Validation
 * 
 * Business rule: Indian citizens cannot apply for an Indian visa.
 * This validation is based on the APPLICANT's details, not the logged-in user.
 */

export interface ApplicantEligibilityData {
  nationality: string;
  nationality_by_birth?: boolean;
  passport_place_of_issue?: string;
  country_of_birth?: string;
}

export interface EligibilityResult {
  eligible: boolean;
  error?: string;
}

// Common variations of "India" that might be used
const INDIA_IDENTIFIERS = [
  'india',
  'in',
  'ind',
  'indian',
  'republic of india',
  'bharat',
];

/**
 * Checks if a value represents India
 */
function isIndianValue(value: string | undefined | null): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase().trim();
  return INDIA_IDENTIFIERS.some(id => normalized === id || normalized.includes('india'));
}

/**
 * Validates if an applicant is eligible to apply for an Indian visa.
 * 
 * Block submission if ALL of the following are true:
 * - Applicant nationality = India
 * - Applicant nationality by birth = India (true with Indian nationality or explicitly Indian)
 * - Applicant passport issuing country = India
 * 
 * Allow submission when:
 * - Applicant nationality is NOT India, OR
 * - Applicant holds a non-Indian passport (foreign passport), OR
 * - Applicant is a former Indian citizen (foreign passport)
 */
export function validateApplicantEligibility(data: ApplicantEligibilityData): EligibilityResult {
  const nationalityIsIndia = isIndianValue(data.nationality);
  const passportIssuedInIndia = isIndianValue(data.passport_place_of_issue);
  const countryOfBirthIsIndia = isIndianValue(data.country_of_birth);
  
  // nationality_by_birth is a boolean in our schema
  // If true and nationality is India, consider it as Indian by birth
  const nationalityByBirthIsIndia = data.nationality_by_birth === true && nationalityIsIndia;

  // Block if ALL conditions are met:
  // 1. Nationality is India
  // 2. Nationality by birth indicates Indian origin (or defaulted to true with Indian nationality)
  // 3. Passport was issued in India
  const isIndianCitizen = 
    nationalityIsIndia && 
    (nationalityByBirthIsIndia || data.nationality_by_birth !== false) && 
    passportIssuedInIndia;

  if (isIndianCitizen) {
    return {
      eligible: false,
      error: "Indian citizens are not eligible to apply for an Indian visa. Please select the correct service.",
    };
  }

  // Applicant is eligible (non-Indian national, or has foreign passport)
  return { eligible: true };
}

/**
 * Error code for ineligible applicant
 */
export const INELIGIBLE_APPLICANT_ERROR_CODE = "INDIAN_CITIZEN_INELIGIBLE";
