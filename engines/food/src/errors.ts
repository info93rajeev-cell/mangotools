/** English messages for every error and warning code this engine can return. */
export const messages: Readonly<Record<string, string>> = {
  FOOD_DUPLICATE_INGREDIENT: 'The ingredient "{ingredient}" is listed twice in the catalogue.',
  FOOD_DUPLICATE_RECIPE: 'Recipe "{recipe}" version {version} is listed twice.',
  FOOD_DUPLICATE_SELECTION: 'Recipe "{recipe}" is selected more than once.',
  FOOD_UNKNOWN_RECIPE: 'Recipe "{recipe}" version {version} was not found.',
  FOOD_UNKNOWN_INGREDIENT:
    'Recipe "{recipe}" uses "{ingredient}", which is not in the ingredient list.',
  FOOD_UNKNOWN_UNIT:
    'Recipe "{recipe}" measures "{ingredient}" in "{unit}", which is not a supported unit.',
  FOOD_DIMENSION_MISMATCH:
    'Recipe "{recipe}" measures "{ingredient}" in {unit}, but that ingredient is measured by {dimension}.',
  FOOD_INVALID_QUANTITY: 'The amount "{value}" is not a plain decimal number.',
  FOOD_DIET_CONFLICT:
    '{count} selected recipe(s) contain ingredients not suitable for a {diet} diet. They are listed, not changed.',
  FOOD_RECIPES_EXCLUDED_FOR_DIET:
    '{count} recipe(s) were left out because they are not suitable for a {diet} diet.',
  FOOD_VALUES_ROUNDED:
    '{count} value(s) could not be written exactly and were rounded to 3 decimals.',
  FOOD_PRICE_DIMENSION_MISMATCH:
    'Price for "{ingredient}" measures in "{priceUnit}", which does not match line unit "{lineUnit}".',
  FOOD_INVALID_PRICE:
    'The price amount "{value}" for "{ingredient}" is not a valid non-negative decimal.',
  FOOD_DUPLICATE_PRICE: 'Multiple prices of kind "{kind}" provided for "{ingredient}".',
  FOOD_MISSING_PRICE: 'No price reference or user price found for "{ingredient}".',
  FOOD_BUDGET_EXCEEDED:
    'Total estimated cost (Rs. {total}) exceeds the budget (Rs. {budget}) by Rs. {difference}.',
};
