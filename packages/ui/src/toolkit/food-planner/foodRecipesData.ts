import { CATALOG_AWAITING_RECIPES } from './foodRecipesCatalogAwaiting.ts';
import { FESTIVAL_SWEET_RECIPES } from './foodRecipesFestivalSweets.ts';
import { MAINS_AND_SIDES_RECIPES } from './foodRecipesMainsAndSides.ts';
import { SNACK_RECIPES } from './foodRecipesSnacks.ts';
import { STAPLE_RECIPES } from './foodRecipesStaples.ts';
import type {
  ExtendedFoodRecipe,
  ImageProvenance,
  RecipeVerificationInfo,
} from './foodRecipesTypes.ts';
import { US_RECIPES } from './foodRecipesUS.ts';

export type { ExtendedFoodRecipe, ImageProvenance, RecipeVerificationInfo };
export { CATALOG_AWAITING_RECIPES, STAPLE_RECIPES, US_RECIPES };

export function getRecipeVerificationInfo(recipe: ExtendedFoodRecipe): RecipeVerificationInfo {
  if (recipe.awaitingData) {
    return {
      label: 'Awaiting Data',
      badgeClass: 'badgePrototype',
      title: 'Recipe awaiting documented cooking trials',
    };
  }
  const status = recipe.verification?.status;
  if (status === 'approved') {
    return {
      label: '✓ Approved',
      badgeClass: 'badgeVerified',
      title: 'Founder approved recipe',
    };
  }
  if (status === 'kitchen-tested') {
    return {
      label: '✓ Kitchen Tested',
      badgeClass: 'badgeVerified',
      title: 'Validated by documented actual cooking trial',
    };
  }
  if (status === 'source-checked' || recipe.verified) {
    return {
      label: '✓ Source Checked',
      badgeClass: 'badgeVerified',
      title: 'Compared against published recipe references',
    };
  }
  return {
    label: 'Prototype',
    badgeClass: 'badgePrototype',
    title: 'Illustrative recipe not yet validated through kitchen trials',
  };
}

const ALL_RECIPE_LIST = [
  ...STAPLE_RECIPES,
  ...SNACK_RECIPES,
  ...MAINS_AND_SIDES_RECIPES,
  ...FESTIVAL_SWEET_RECIPES,
];

const ORDERED_IDS = [
  'jeera-rice',
  'dal-tadka',
  'aloo-gobi',
  'besan-ladoo',
  'mathri',
  'shahi-paneer',
  'raita',
  'mixed-veg-salad',
  'gulab-jamun',
  'kaju-katli',
  'kheer',
  'jalebi',
  'rasgulla',
  'samosa',
  'paneer-tikka',
  'pakoda',
  'chana-masala',
  'masala-chai',
];

export const RECIPES: ExtendedFoodRecipe[] = ORDERED_IDS.map((id) => {
  const found = ALL_RECIPE_LIST.find((r) => r.id === id);
  if (!found) throw new Error(`Missing recipe: ${id}`);
  return found;
});

export const GLOBAL_RECIPES: ExtendedFoodRecipe[] = [...RECIPES, ...US_RECIPES];

export const CATALOG_GALLERY_RECIPES: ExtendedFoodRecipe[] = [
  ...GLOBAL_RECIPES,
  ...CATALOG_AWAITING_RECIPES,
];
