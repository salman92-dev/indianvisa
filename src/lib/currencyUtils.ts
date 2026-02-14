// Country to currency region mapping
const USA_COUNTRIES = ['US'];
const UK_COUNTRIES = ['GB'];
const EUROPE_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 
  'SI', 'ES', 'SE', 'NO', 'CH', 'IS'
];

export interface CurrencyInfo {
  code: string;
  symbol: string;
}

export type VisaDuration = '30_days' | '1_year' | '5_years';

export interface VisaTypeOption {
  id: VisaDuration;
  name: string;
  validity: string;
  description: string;
  processingTime: string;
  popular?: boolean;
}

export const VISA_TYPE_OPTIONS: VisaTypeOption[] = [
  {
    id: '30_days',
    name: '30-Day e-Tourist Visa',
    validity: '30 days',
    description: 'Single entry visa for short trips',
    processingTime: '2-3 business days',
    popular: true,
  },
  {
    id: '1_year',
    name: '1-Year e-Tourist Visa',
    validity: '1 year',
    description: 'Multiple entry visa for frequent travelers',
    processingTime: '2-3 business days',
  },
  {
    id: '5_years',
    name: '5-Year e-Tourist Visa',
    validity: '5 years',
    description: 'Long-term multiple entry visa',
    processingTime: '2-3 business days',
  },
];

// Pricing by visa duration and currency
const VISA_PRICES: Record<VisaDuration, Record<string, number>> = {
  '30_days': {
    USD: 49.90,
    GBP: 39.90,
    EUR: 39.90,
  },
  '1_year': {
    USD: 75.00,
    GBP: 65.00,
    EUR: 65.00,
  },
  '5_years': {
    USD: 125.00,
    GBP: 115.00,
    EUR: 115.00,
  },
};

export function getCurrencyByCountry(countryCode: string): CurrencyInfo {
  const code = countryCode.toUpperCase();
  
  // Handle regional selections
  if (code === 'US' || USA_COUNTRIES.includes(code)) {
    return { code: 'USD', symbol: '$' };
  }
  if (code === 'GB' || UK_COUNTRIES.includes(code)) {
    return { code: 'GBP', symbol: '£' };
  }
  if (code === 'EU' || EUROPE_COUNTRIES.includes(code)) {
    return { code: 'EUR', symbol: '€' };
  }
  
  // Rest of World (ROW) or any other code - use USD as default
  return { code: 'USD', symbol: '$' };
}

export function getVisaPrice(duration: VisaDuration, currency: string): number {
  const prices = VISA_PRICES[duration];
  return prices[currency] || prices.USD;
}

export function getRegionPricing(countryCode: string, duration: VisaDuration = '30_days'): { price: number; currency: string } {
  const { code } = getCurrencyByCountry(countryCode);
  const price = getVisaPrice(duration, code);
  return { price, currency: code };
}

// Map regional codes (EU/ROW) to valid ISO-3166-1 alpha-2 codes for PayPal.
// If the input is already a 2-letter country code (e.g. FR/DE/IN), return it as-is.
export function mapToISOCountryCode(regionalCode: string): string {
  const code = (regionalCode || "").trim().toUpperCase();

  const mapping: Record<string, string> = {
    US: "US",
    GB: "GB",
    EU: "DE", // Use Germany as representative EU country
    ROW: "RW", // Use Rwanda for Rest of World
  };

  if (mapping[code]) return mapping[code];
  if (/^[A-Z]{2}$/.test(code)) return code;
  return "US"; // safe fallback
}

export function getVisaDurationLabel(duration: VisaDuration): string {
  const option = VISA_TYPE_OPTIONS.find(v => v.id === duration);
  return option?.validity || '30 days';
}
