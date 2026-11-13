import {
  CULINARY_REGIONS,
  type CulinaryRegion,
  type CulinaryRegionId,
  type CurrencyCode,
  getCulinaryRegion,
  getCulinaryRegionId,
  type UnitSystem,
} from './foodCulinaryRegions.ts';

export type CountryCode = 'IN' | 'US';
export type { CulinaryRegion, CulinaryRegionId, CurrencyCode, UnitSystem };
export { CULINARY_REGIONS, getCulinaryRegion, getCulinaryRegionId };

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

export const SUPPORTED_LOCATIONS: LocationMetadata[] = CULINARY_REGIONS.map((r) => ({
  id: r.id,
  name: r.name,
  country: r.countryCode,
  countryName: r.shortName,
  city: r.shortName,
  currency: r.currency,
  currencySymbol: r.currencySymbol,
  unitSystem: r.unitSystem,
  defaultBudget: r.defaultBudget,
}));

export const COUNTRIES = [
  { code: 'IN' as const, name: 'India & South Asia', currency: 'INR' as const, symbol: '₹' },
  {
    code: 'US' as const,
    name: 'Global / Americas / Europe',
    currency: 'USD' as const,
    symbol: '$',
  },
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
  const reg = getCulinaryRegion(locationName);
  return {
    id: reg.id,
    name: reg.name,
    country: reg.countryCode,
    countryName: reg.shortName,
    city: reg.shortName,
    currency: reg.currency,
    currencySymbol: reg.currencySymbol,
    unitSystem: reg.unitSystem,
    defaultBudget: reg.defaultBudget,
  };
}

export function getCitiesForCountry(countryCode: CountryCode): LocationMetadata[] {
  return SUPPORTED_LOCATIONS.filter((loc) => loc.country === countryCode);
}
