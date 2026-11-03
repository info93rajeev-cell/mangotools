# @mangotools/engine-food

Pure Food Planner logic. Decision: `docs/decisions/DECISION-FOOD-PLANNER-DATA.md`.
Contract: `tasks/TASK-FP-002-FOOD-SHOPPING-CONSOLIDATE.md`.

| Operation | Purpose |
|---|---|
| `food.shopping.consolidate@1` | Scales selected recipes to the guest count, adds identical ingredients in base units (g, ml, piece), rounds count items up after adding, reports allergens, the common diet, each recipe's verification status, and an optional diet check |
| `food.schedule.generate@1` | Generates a deterministic cooking schedule from selected recipes, target meal time, and burner capacity using backward topological scheduling |

## Inputs
### `food.shopping.consolidate@1`
- `ingredients`, `recipes`: the shapes of `reference/food` (extra fields are ignored).
- `selection`: recipe id + version, with an optional per-dish `portionFactor`.
- `guests`, `servingsPerGuest`.

Params: `diet` (`none` | `vegetarian` | `vegan` | `jain`); `dietPolicy` (`flag` keeps every recipe
and lists conflicts, `exclude-recipes` leaves whole recipes out).

Scale factor = guests × servingsPerGuest × portionFactor ÷ recipe servings.

### `food.schedule.generate@1`
- `recipes`: recipe list with `prepMinutes`, `cookMinutes`, `steps`.
- `selection`: recipe selection.
- `guests`: guest count for prep scaling.
- `mealTime`: target serving time (`"13:00"` or ISO).
- `burnersAvailable`: number of burners.
- `prepStations`: number of prep stations.

Params: `restMinutes` (default 10); `prepScaleFactor` (`none`, `logarithmic`, `linear-capped`).

## Golden fixtures
- `reference/food/fixtures/001-three-recipes-50-guests.yaml`, checked by
  `tests/unit/food-engine.test.ts` against the real reference data.
- `src/operations/shopping-consolidate/fixtures/001–009`: one guest, portion factors, the Jain
  flag and exclude policies, unknown unit, missing ingredient, dimension mismatch, and rounding
  of a scale that has no finite decimal, and 009 proving that totals add exact fractions, never
  rounded display values.
- `src/operations/schedule-generate/fixtures/001–004`: three-recipe schedule, burner bottleneck,
  single recipe, and error handling.

## Changelog
- 0.2.0 — `food.schedule.generate@1` added (TASK-FP-004).
- 0.1.0 — `food.shopping.consolidate@1` added (TASK-FP-002).
