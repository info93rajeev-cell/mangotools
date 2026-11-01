# TASK-FP-002 — `food.shopping.consolidate@1`

| | |
|---|---|
| Type | new engine + first operation (lane `engine-food`) |
| Size | M |
| Status | Proposed; implemented on branch `feat/fp-002-food-engine` (stacked on FP-001) for review |
| Decision | `docs/decisions/DECISION-FOOD-PLANNER-DATA.md` §2.5 (as amended 2 Nov 2026) |
| Depends on | FP-001 (`feat/fp-001-food-data-foundation`): schemas, reference data, golden fixture 001 |

## Goal
A pure, deterministic operation that turns selected recipes and a guest count into one
consolidated shopping list. It is used later by the Shopping List and Cost Estimation sections.

## Contract
**Input**
- `ingredients[]`: `{ id, dimension (mass | volume | count), allergens[], notFor[] }` plus any
  extra fields, which are ignored.
- `recipes[]`: `{ id, version, servings, diet, ingredients[{ ingredient, quantity, unit }], verification.status? }`
  plus extra fields.
- `selection[]`: `{ recipe, recipeVersion, portionFactor? }`, 1–50 items, each recipe once.
- `guests`: 1–100 000.
- `servingsPerGuest`: decimal string, default `"1"`.

**Params**
- `diet`: `none` | `vegetarian` | `vegan` | `jain` (default `none`).
- `dietPolicy`: `flag` | `exclude-recipes` (default `flag`).

**Output**
- `scale[]`: `{ recipe, factor }`, where factor = guests × servingsPerGuest × portionFactor ÷ servings.
- `lines[]`: `{ ingredient, total, unit (g | ml | piece), buy, usedIn[] }`, sorted by ingredient id.
- `allergens[]`: the union over included recipes, sorted.
- `diet`: the least restrictive of the included recipes.
- `recipes[]`: `{ recipe, version, verification, included, allergens[], dietConflicts[] }`.
- `rounded[]`: the values that could not be written exactly.

**Rules**
1. All validation happens before any arithmetic, and the first problem is returned as a typed
   error:
   - `FOOD_DUPLICATE_INGREDIENT`, `FOOD_DUPLICATE_RECIPE`, `FOOD_DUPLICATE_SELECTION`;
   - `FOOD_UNKNOWN_RECIPE`, `FOOD_UNKNOWN_INGREDIENT`, `FOOD_UNKNOWN_UNIT`;
   - `FOOD_DIMENSION_MISMATCH`;
   - `FOOD_INVALID_QUANTITY`, which also covers a zero or negative portion and servings per guest.
2. Arithmetic is exact (BigInt fractions). A value is written exactly when it has a finite
   decimal. Otherwise it is rounded half-up to 3 decimals, listed in `rounded`, and the warning
   `FOOD_VALUES_ROUNDED` is raised.
3. Identical ingredients are added across dishes in base units. Spoons and cups become ml. There
   is no conversion between mass, volume and count.
4. Count items are rounded up (`buy`) only after all recipes are added.
5. Allergen labels and recipe verification status are passed through unchanged.
6. Diet check:
   - `flag` keeps every recipe and line, and lists the conflicting ingredients
     (`FOOD_DIET_CONFLICT`).
   - `exclude-recipes` leaves whole recipes out (`FOOD_RECIPES_EXCLUDED_FOR_DIET`).
   - An ingredient is **never** removed from a recipe that is still listed, so no recipe is
     presented as equivalent after a change.
7. Imports are `zod` and `@mangotools/core` only. There is no `@mangotools/engine-numeric`: its
   decimal division is not exact for ÷ 3 servings, so the engine uses fractions.

## Acceptance
- `reference/food/fixtures/001-three-recipes-50-guests.yaml` is reproduced exactly, with every
  expected field equal, by `tests/unit/food-engine.test.ts` using the real reference data.
- Engine fixtures 001–008 pass through `tests/unit/engine-fixtures.test.ts`:
  - one guest;
  - portion factors;
  - Jain flag and Jain exclude;
  - unknown unit;
  - missing ingredient;
  - dimension mismatch;
  - a non-terminating scale.
- The real-data tests pass:
  - one guest;
  - per-dish portion plus servings per guest;
  - verification and allergen pass-through;
  - Jain conflicts for onion, garlic, potato and ginger-garlic paste;
  - Jain exclude keeps only jeera rice;
  - unknown version, duplicate selection, invalid portions and duplicate catalogue entries are
    rejected;
  - the result does not depend on catalogue order.
- `pnpm verify` is green apart from the known network-only background-remover test.
- No existing fixture or unrelated test is changed.

## Out of scope
Cost estimation, the cooking schedule, menu validation, UI, the scheduled trend workflow, and any
deployment.
