import { CENTRAL_BHOPAL_RECIPES } from './foodRecipesCentralBhopal.ts';
import { CENTRAL_MALWA_RECIPES } from './foodRecipesCentralMalwa.ts';
import { EAST_BENGAL_RECIPES } from './foodRecipesEastBengal.ts';
import { EAST_REGIONAL_RECIPES } from './foodRecipesEastRegional.ts';
import { NORTH_STREET_RECIPES } from './foodRecipesNorthStreet.ts';
import { NORTH_WEDDING_RECIPES } from './foodRecipesNorthWedding.ts';
import { SOUTH_MADURAI_RECIPES } from './foodRecipesSouthMadurai.ts';
import { SOUTH_SADYA_RECIPES } from './foodRecipesSouthSadya.ts';
import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';
import { WEST_MAINS_RECIPES } from './foodRecipesWestMains.ts';
import { WEST_STREET_RECIPES } from './foodRecipesWestStreet.ts';

export const INDIA_5_REGIONS_RECIPES: ExtendedFoodRecipe[] = [
  ...CENTRAL_MALWA_RECIPES,
  ...CENTRAL_BHOPAL_RECIPES,
  ...EAST_BENGAL_RECIPES,
  ...EAST_REGIONAL_RECIPES,
  ...WEST_STREET_RECIPES,
  ...WEST_MAINS_RECIPES,
  ...SOUTH_SADYA_RECIPES,
  ...SOUTH_MADURAI_RECIPES,
  ...NORTH_WEDDING_RECIPES,
  ...NORTH_STREET_RECIPES,
];
