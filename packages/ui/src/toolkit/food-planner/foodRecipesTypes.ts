export interface ExtendedFoodRecipe {
  id: string;
  version: string;
  name: string;
  localName?: string;
  course: 'main' | 'rice' | 'bread' | 'dal' | 'side' | 'snack' | 'dessert' | 'drink';
  cuisine: string;
  diet: 'vegetarian' | 'vegan' | 'jain' | 'eggetarian' | 'non-vegetarian';
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  ingredients: Array<{
    ingredient: string;
    quantity: string;
    unit: 'g' | 'kg' | 'ml' | 'l' | 'tsp' | 'tbsp' | 'cup' | 'piece';
    note?: string;
  }>;
  steps: string[];
  sources?: Array<{
    title: string;
    publisher: string;
    url: string;
    accessed: string;
    checks: string;
  }>;
  verification?: {
    status: 'draft' | 'source-checked' | 'kitchen-tested' | 'approved';
    by: string;
    date: string;
    notes: string;
  };
  verified: boolean;
  thumbnailUrl?: string;
  imageProvenance?: ImageProvenance;
  operational?: boolean;
  awaitingData?: boolean;
}

export interface ImageProvenance {
  type: 'ai-generated' | 'free-source' | 'placeholder';
  notes: string;
  license?: string;
}

export interface RecipeVerificationInfo {
  label: string;
  badgeClass: 'badgeVerified' | 'badgePrototype';
  title: string;
}
