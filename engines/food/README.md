# @mangotools/engine-food

Pure Food Planner logic. Decision: `docs/decisions/DECISION-FOOD-PLANNER-DATA.md`.
Contract: `tasks/TASK-FP-002-FOOD-SHOPPING-CONSOLIDATE.md`.

| Operation | Purpose |
|---|---|
| `food.shopping.consolidate@1` | Scales selected recipes to the guest count, adds identical ingredients in base units (g, ml, piece), rounds count items up after adding, reports allergens, the common diet, each recipe's verification status, and an optional diet check |
| `food.cost.estimate@1` | Calculates ingredient costs, total event cost, cost per guest, and budget variance from consolidated shopping lines and price references or user prices using exact rational arithmetic |

## Inputs
### `food.shopping.consolidate@1`
- `ingredients`, `recipes`: the shapes of `reference/food` (extra fields are ignored).
- `selection`: recipe id + version, with an optional per-dish `portionFactor`.
- `guests`, `servingsPerGuest`.

Params: `diet` (`none` | `vegetarian` | `vegan` | `jain`); `dietPolicy` (`flag` keeps every recipe
and lists conflicts, `exclude-recipes` leaves whole recipes out).

Scale factor = guests × servingsPerGuest × portionFactor ÷ recipe servings.

### `food.cost.estimate@1`
- `lines`: consolidated shopping lines with `ingredient`, `buy`, `unit` (`g`, `ml`, `piece`).
- `prices`: reference and user prices with `ingredient`, `kind`, `priceInr`, `per`, `unit`, `observedOn`.
- `guests`: guest count.
- `budgetInr`: optional overall budget.

Params: `pricePriority` (`user-then-retail`, `user-then-wholesale`, `retail-only`, `wholesale-only`); `quantityBasis` (`buy` or `total`).

## Golden fixtures
- `reference/food/fixtures/001-three-recipes-50-guests.yaml`, checked by
  `tests/unit/food-engine.test.ts` against the real reference data.
- `src/operations/shopping-consolidate/fixtures/001–009`: one guest, portion factors, the Jain
  flag and exclude policies, unknown unit, missing ingredient, dimension mismatch, and rounding
  of a scale that has no finite decimal, and 009 proving that totals add exact fractions, never
  rounded display values.
- `src/operations/cost-estimate/fixtures/001–006`: standard reference prices, user price precedence,
  missing price warning, budget variance, dimension mismatch error, and fractional paise rounding.

## Changelog
- 0.2.0 — `food.cost.estimate@1` added (TASK-FP-003).
- 0.1.0 — `food.shopping.consolidate@1` added (TASK-FP-002).
