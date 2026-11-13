export type CountryCode = 'IN' | 'US';
export type CurrencyCode = 'INR' | 'USD';
export type UnitSystem = 'metric' | 'us-customary';

export type SupportedCountry = CountryCode;
export type SupportedLocation = LocationMetadata;

export interface LocationMetadata {
  id: string;
  name: string;
  country: CountryCode;
  countryName: string;
  city: string;
  currency: CurrencyCode;
  currencySymbol: string;
  unitSystem: UnitSystem;
  defaultBudget: string;
}

export const SUPPORTED_LOCATIONS: LocationMetadata[] = [
  {
    id: 'delhi-in',
    name: 'Delhi, India',
    country: 'IN',
    countryName: 'India',
    city: 'Delhi',
    currency: 'INR',
    currencySymbol: '₹',
    unitSystem: 'metric',
    defaultBudget: '2500',
  },
  {
    id: 'mumbai-in',
    name: 'Mumbai, India',
    country: 'IN',
    countryName: 'India',
    city: 'Mumbai',
    currency: 'INR',
    currencySymbol: '₹',
    unitSystem: 'metric',
    defaultBudget: '2800',
  },
  {
    id: 'bengaluru-in',
    name: 'Bengaluru, India',
    country: 'IN',
    countryName: 'India',
    city: 'Bengaluru',
    currency: 'INR',
    currencySymbol: '₹',
    unitSystem: 'metric',
    defaultBudget: '2600',
  },
  {
    id: 'kolkata-in',
    name: 'Kolkata, India',
    country: 'IN',
    countryName: 'India',
    city: 'Kolkata',
    currency: 'INR',
    currencySymbol: '₹',
    unitSystem: 'metric',
    defaultBudget: '2400',
  },
  {
    id: 'chennai-in',
    name: 'Chennai, India',
    country: 'IN',
    countryName: 'India',
    city: 'Chennai',
    currency: 'INR',
    currencySymbol: '₹',
    unitSystem: 'metric',
    defaultBudget: '2500',
  },
  {
    id: 'jaipur-in',
    name: 'Jaipur, India',
    country: 'IN',
    countryName: 'India',
    city: 'Jaipur',
    currency: 'INR',
    currencySymbol: '₹',
    unitSystem: 'metric',
    defaultBudget: '2300',
  },
  {
    id: 'hyderabad-in',
    name: 'Hyderabad, India',
    country: 'IN',
    countryName: 'India',
    city: 'Hyderabad',
    currency: 'INR',
    currencySymbol: '₹',
    unitSystem: 'metric',
    defaultBudget: '2500',
  },
  {
    id: 'lucknow-in',
    name: 'Lucknow, India',
    country: 'IN',
    countryName: 'India',
    city: 'Lucknow',
    currency: 'INR',
    currencySymbol: '₹',
    unitSystem: 'metric',
    defaultBudget: '2200',
  },
  {
    id: 'new-york-us',
    name: 'New York, United States',
    country: 'US',
    countryName: 'United States',
    city: 'New York',
    currency: 'USD',
    currencySymbol: '$',
    unitSystem: 'us-customary',
    defaultBudget: '350',
  },
  {
    id: 'los-angeles-us',
    name: 'Los Angeles, United States',
    country: 'US',
    countryName: 'United States',
    city: 'Los Angeles',
    currency: 'USD',
    currencySymbol: '$',
    unitSystem: 'us-customary',
    defaultBudget: '325',
  },
];

export const COUNTRIES = [
  { code: 'IN' as const, name: 'India', currency: 'INR' as const, symbol: '₹' },
  { code: 'US' as const, name: 'United States', currency: 'USD' as const, symbol: '$' },
];

export const GLOBAL_OCCASIONS = [
  'Birthday Party',
  'Wedding',
  'Corporate Event',
  'Festival / Celebration',
  'Family Gathering',
  'Small Party',
  'Puja / Religious Ceremony',
  'Other / Custom Event',
];

export const GLOBAL_MEAL_TYPES = ['Dinner', 'Lunch', 'Breakfast', 'Snacks & Refreshments'];

export const GLOBAL_PLANNING_TYPES = [
  'Buffet Service',
  'Sit-down Meal',
  'Festival Preparation',
  'Snack & High Tea',
  'Corporate Lunch',
  'Family Style',
];

export function getLocationMetadata(locationName: string): LocationMetadata {
  const match = SUPPORTED_LOCATIONS.find(
    (loc) =>
      loc.name.toLowerCase() === locationName.toLowerCase() ||
      loc.city.toLowerCase() === locationName.toLowerCase(),
  );
  if (match) return match;

  if (
    locationName.toLowerCase().includes('united states') ||
    locationName.toLowerCase().includes('usa') ||
    locationName.toLowerCase().includes('us') ||
    locationName.toLowerCase().includes('new york') ||
    locationName.toLowerCase().includes('los angeles')
  ) {
    return SUPPORTED_LOCATIONS.find((loc) => loc.country === 'US') ?? SUPPORTED_LOCATIONS[0];
  }

  return SUPPORTED_LOCATIONS[0]; // Default India (Delhi)
}

export function getCitiesForCountry(countryCode: CountryCode): LocationMetadata[] {
  return SUPPORTED_LOCATIONS.filter((loc) => loc.country === countryCode);
}
