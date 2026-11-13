export {
  CULINARY_REGION_NAMES,
  CULINARY_REGIONS,
  type CulinaryRegion,
  type CulinaryRegionId,
  getCulinaryRegion,
  getCulinaryRegionId,
  getOccasionsForRegion,
  isRecipeEligibleForCountry,
  isRecipeEligibleForLocation,
  isUSLocation,
} from './foodCulinaryRegions.ts';
export {
  COUNTRIES,
  GLOBAL_MEAL_TYPES,
  GLOBAL_OCCASIONS,
  GLOBAL_PLANNING_TYPES,
  getLocationMetadata,
  SUPPORTED_LOCATIONS,
  type SupportedCountry,
  type SupportedLocation,
} from './foodGlobalLocations.ts';
export { CATALOG_INGREDIENTS } from './foodIngredientsData.ts';
export {
  CATALOG_GALLERY_RECIPES,
  EUROPE_RECIPES,
  type ExtendedFoodRecipe,
  GLOBAL_RECIPES,
  getRecipeVerificationInfo,
  type ImageProvenance,
  LATIN_AMERICA_RECIPES,
  MIDDLE_EAST_RECIPES,
  PAN_ASIAN_RECIPES,
  RECIPES,
  SOUTH_ASIA_RECIPES,
  US_RECIPES,
} from './foodRecipesData.ts';
export { type FoodPriceItem, REFERENCE_PRICES } from './foodReferencePrices.ts';
export { type FoodPriceItemUS, REFERENCE_PRICES_US } from './foodReferencePricesUS.ts';

export const INDIAN_LOCATIONS = ['India & South Asia'];
export const US_LOCATIONS = ['North America'];

export const LOCATIONS = [
  'India & South Asia',
  'North America',
  'Europe & Mediterranean',
  'East & Pan-Asian',
  'Middle East & Levantine',
  'Latin America & Mexican',
];

export const OCCASIONS = [
  'Diwali',
  'Small Party',
  'Wedding',
  'Corporate Lunch',
  'Festival Preparation',
  'Family Gathering',
  'Birthday Party',
  'Puja / Religious Ceremony',
];

export const PLANNING_TYPES = [
  'Festival Preparation',
  'Buffet Service',
  'Sit-down Meal',
  'Snack & High Tea',
  'Corporate Lunch',
];

export const AISLE_DISPLAY_MAP: Record<string, string> = {
  vegetables: 'Vegetables (Fresh)',
  pulses: 'Pulses & Dal',
  grains: 'Grains & Rice',
  spices: 'Spices & Condiments',
  dairy: 'Dairy & Paneer',
  'oils-fats': 'Oil & Ghee',
  herbs: 'Fresh Herbs',
  other: 'Dry Goods & Essentials',
};

export const SAMPLE_PLAN = {
  location: 'India & South Asia',
  occasion: 'Diwali',
  planningType: 'Festival Preparation',
  guests: 20,
  selectedDishes: ['jeera-rice', 'dal-tadka', 'aloo-gobi', 'besan-ladoo', 'shahi-paneer', 'mathri'],
};

export const DEFAULT_SCHEDULE_TASKS = [
  {
    id: 't-1',
    name: 'Wash, clean & chop vegetables and greens',
    phase: 'early-prep',
    startTime: '06:30 AM',
    durationMinutes: 30,
    recipeName: 'Vegetables & Salads',
    priority: 'High' as const,
  },
  {
    id: 't-2',
    name: 'Roast and grind dry spices and besan',
    phase: 'early-prep',
    startTime: '07:00 AM',
    durationMinutes: 30,
    recipeName: 'Sweets & Masalas',
    priority: 'High' as const,
  },
  {
    id: 't-3',
    name: 'Prepare besan roasted mixture with ghee',
    phase: 'dough-soak',
    startTime: '07:30 AM',
    durationMinutes: 45,
    recipeName: 'Besan Ladoo',
    priority: 'High' as const,
  },
  {
    id: 't-4',
    name: 'Knead snack dough and set aside to rest',
    phase: 'dough-soak',
    startTime: '08:30 AM',
    durationMinutes: 45,
    recipeName: 'Mathri',
    priority: 'Medium' as const,
  },
  {
    id: 't-5',
    name: 'Cook and simmer main gravies and curries',
    phase: 'cooking',
    startTime: '10:00 AM',
    durationMinutes: 60,
    recipeName: 'Shahi Paneer & Dal',
    priority: 'High' as const,
  },
  {
    id: 't-6',
    name: 'Cook aromatic Basmati rice with whole spices',
    phase: 'cooking',
    startTime: '11:00 AM',
    durationMinutes: 30,
    recipeName: 'Jeera Rice',
    priority: 'Medium' as const,
  },
  {
    id: 't-7',
    name: 'Roll, cut and fry savouries on controlled flame',
    phase: 'frying',
    startTime: '01:00 PM',
    durationMinutes: 60,
    recipeName: 'Mathri / Snacks',
    priority: 'High' as const,
  },
  {
    id: 't-8',
    name: 'Prepare fresh tempering and whisk chilled raita',
    phase: 'frying',
    startTime: '02:00 PM',
    durationMinutes: 30,
    recipeName: 'Dal Tadka & Raita',
    priority: 'Medium' as const,
  },
  {
    id: 't-9',
    name: 'Shape sweets and allow to set',
    phase: 'assembly',
    startTime: '04:00 PM',
    durationMinutes: 30,
    recipeName: 'Besan Ladoo',
    priority: 'Medium' as const,
  },
  {
    id: 't-10',
    name: 'Final hot assembly, garnish and buffet plating',
    phase: 'assembly',
    startTime: '04:30 PM',
    durationMinutes: 30,
    recipeName: 'All Dishes',
    priority: 'High' as const,
  },
];
