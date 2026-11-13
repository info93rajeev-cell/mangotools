export interface FoodPriceItemUS {
  ingredient: string;
  kind: 'retail-reference' | 'wholesale-reference';
  priceInr: string; // Internal rate string compatible with cost estimate engine
  per: string;
  unit:
    | 'g'
    | 'kg'
    | 'ml'
    | 'l'
    | 'tsp'
    | 'tbsp'
    | 'cup'
    | 'piece'
    | 'oz'
    | 'lb'
    | 'fl-oz'
    | 'floz'
    | 'gal';
  source: {
    name: string;
    url?: string;
    market?: string;
  };
  observedOn: string;
}
