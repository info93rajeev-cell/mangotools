import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

export type CulinaryRegionId =
  | 'india-south-asia'
  | 'north-america'
  | 'europe-med'
  | 'east-pan-asian'
  | 'middle-east'
  | 'latin-america';

export type CurrencyCode = 'INR' | 'USD';
export type UnitSystem = 'metric' | 'us-customary';

export interface CulinaryRegion {
  id: CulinaryRegionId;
  name: string;
  shortName: string;
  flag: string;
  countryCode: 'IN' | 'US';
  currency: CurrencyCode;
  currencySymbol: string;
  unitSystem: UnitSystem;
  defaultBudget: string;
  defaultOccasion: string;
  description: string;
}

export const CULINARY_REGIONS: CulinaryRegion[] = [
  {
    id: 'india-south-asia',
    name: 'India & South Asia',
    shortName: 'South Asia',
    flag: '🇮🇳',
    countryCode: 'IN',
    currency: 'INR',
    currencySymbol: '₹',
    unitSystem: 'metric',
    defaultBudget: '2500',
    defaultOccasion: 'Diwali',
    description: 'North Indian gravies, South Indian tiffin, festive sweets & biryanis',
  },
  {
    id: 'north-america',
    name: 'North America',
    shortName: 'North America',
    flag: '🇺🇸',
    countryCode: 'US',
    currency: 'USD',
    currencySymbol: '$',
    unitSystem: 'us-customary',
    defaultBudget: '350',
    defaultOccasion: 'Birthday Party',
    description: 'American classic cookouts, BBQ, mac & cheese, burgers & pies',
  },
  {
    id: 'europe-med',
    name: 'Europe & Mediterranean',
    shortName: 'Europe & Med',
    flag: '🇪🇺',
    countryCode: 'US',
    currency: 'USD',
    currencySymbol: '$',
    unitSystem: 'metric',
    defaultBudget: '350',
    defaultOccasion: 'Family Gathering',
    description: 'Artisan pizzas, penne pastas, lasagna, minestrone & tiramisu',
  },
  {
    id: 'east-pan-asian',
    name: 'East & Pan-Asian',
    shortName: 'Pan-Asian',
    flag: '🥢',
    countryCode: 'US',
    currency: 'USD',
    currencySymbol: '$',
    unitSystem: 'metric',
    defaultBudget: '300',
    defaultOccasion: 'Small Party',
    description: 'Wok fried rice, hakka noodles, spring rolls, dim sum & green curry',
  },
  {
    id: 'middle-east',
    name: 'Middle East & Levantine',
    shortName: 'Middle East',
    flag: '🫓',
    countryCode: 'US',
    currency: 'USD',
    currencySymbol: '$',
    unitSystem: 'metric',
    defaultBudget: '320',
    defaultOccasion: 'Celebration',
    description: 'Falafel, creamy hummus, mandi spiced rice, shawarma & baklava',
  },
  {
    id: 'latin-america',
    name: 'Latin America & Mexican',
    shortName: 'Latin America',
    flag: '🌮',
    countryCode: 'US',
    currency: 'USD',
    currencySymbol: '$',
    unitSystem: 'us-customary',
    defaultBudget: '300',
    defaultOccasion: 'Birthday Party',
    description: 'Street tacos, cheesy quesadillas, sizzling fajitas & churros',
  },
];

export const CULINARY_REGION_NAMES = CULINARY_REGIONS.map((r) => r.name);

export function getCulinaryRegionId(locationName?: string, countryCode?: string): CulinaryRegionId {
  if (!locationName && !countryCode) return 'india-south-asia';
  const loc = (locationName || '').toLowerCase();
  if (loc.includes('europe') || loc.includes('mediterranean') || loc.includes('ital')) {
    return 'europe-med';
  }
  if (
    loc.includes('middle east') ||
    loc.includes('levantine') ||
    loc.includes('arabian') ||
    loc.includes('mandi')
  ) {
    return 'middle-east';
  }
  if (
    loc.includes('asian') ||
    loc.includes('east') ||
    loc.includes('chinese') ||
    loc.includes('thai')
  ) {
    return 'east-pan-asian';
  }
  if (loc.includes('latin') || loc.includes('mexic') || loc.includes('taco')) {
    return 'latin-america';
  }
  if (
    countryCode === 'US' ||
    loc.includes('north america') ||
    loc.includes('united states') ||
    loc.includes('usa') ||
    loc.includes('new york') ||
    loc.includes('los angeles')
  ) {
    return 'north-america';
  }
  return 'india-south-asia';
}

export function getCulinaryRegion(idOrName?: string): CulinaryRegion {
  const regId = getCulinaryRegionId(idOrName);
  return CULINARY_REGIONS.find((r) => r.id === regId) ?? CULINARY_REGIONS[0];
}

export function isUSLocation(loc?: string, country?: string): boolean {
  const regId = getCulinaryRegionId(loc, country);
  return regId !== 'india-south-asia';
}

export function isRecipeEligibleForLocation(
  r: ExtendedFoodRecipe,
  locationName?: string,
  countryCode?: string,
): boolean {
  const regId = getCulinaryRegionId(locationName, countryCode);
  if (regId === 'india-south-asia') {
    return (
      r.cuisine.toLowerCase().includes('india') ||
      r.cuisine.toLowerCase().includes('hyderabadi') ||
      r.cuisine.toLowerCase().includes('punjabi') ||
      r.cuisine.toLowerCase().includes('mughlai') ||
      (!r.countries && !r.cuisine.toLowerCase().includes('american'))
    );
  }
  if (regId === 'north-america') {
    return (
      (r.cuisine.toLowerCase().includes('american') &&
        !r.cuisine.toLowerCase().includes('latin')) ||
      Boolean(r.countries?.length === 1 && r.countries[0] === 'US')
    );
  }
  if (regId === 'europe-med') {
    return Boolean(r.countries?.includes('EU'));
  }
  if (regId === 'east-pan-asian') {
    return Boolean(r.countries?.includes('ASIA'));
  }
  if (regId === 'middle-east') {
    return Boolean(r.countries?.includes('ME'));
  }
  if (regId === 'latin-america') {
    return Boolean(r.countries?.includes('LA'));
  }
  return true;
}

export function isRecipeEligibleForCountry(r: ExtendedFoodRecipe, isUS: boolean): boolean {
  return isRecipeEligibleForLocation(r, isUS ? 'North America' : 'India & South Asia');
}
