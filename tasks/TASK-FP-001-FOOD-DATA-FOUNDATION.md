# TASK-FP-001 — Food Planner data foundation

| | |
|---|---|
| Type | data + schema (no engine, no UI) |
| Size | M |
| Status | Proposed; implemented on branch `feat/fp-001-food-data-foundation` for review |
| Decision | `docs/decisions/DECISION-FOOD-PLANNER-DATA.md` (Proposed) |
| Requested by | Founder (Head Office task card FP-001, 2 Nov 2026) |

## Goal
Create the first independently testable data foundation for the Food Planner. It does not
change any page, navigation, tool, preset, CSP, privacy text, workflow or deployment.

## Scope
1. Schemas for units, ingredients, allergens, recipe sources, recipes, menu versions, saved plans
   and price references (`schemas/src/food.ts`, `schemas/src/food-menu.ts`, exported from the
   package index).
2. An ingredient catalogue (`reference/food/ingredients.yaml`).
3. Three Indian recipes with original instructions and at least two traceable published sources
   each (`reference/food/recipes/`), marked `source-checked`. The status is not `approved` or
   `kitchen-tested`, which only a person can set.
4. One golden fixture: the consolidated quantities for 50 guests
   (`reference/food/fixtures/001-three-recipes-50-guests.yaml`), with its assumptions.
5. A test (`tests/unit/food-reference.test.ts`) that:
   - validates all data;
   - checks references and dimensions;
   - reproduces the fixture with exact rational arithmetic;
   - covers menu-version and saved-plan rules.
6. The publication model, evidence kinds and the automatic-publication path, recorded in the ADR.

## Out of scope
- `engines/food` and its whitelist entry.
- UI, routes and navigation.
- Trend collection, price collection, scheduled workflows.
- Any module other than Food & Catering (Business Memory and the shared Planners menu are
  cancelled; Student Tools are future-only).

## Acceptance
- `pnpm verify` green, apart from the known network-only background-remover test.
- Every recipe line uses a known ingredient in that ingredient's dimension.
- The golden fixture matches the calculator exactly, and changing any expected value makes the
  test fail.
- No fabricated trend or price data is present.
