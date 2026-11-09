# TASK-FP-003 — `food.cost.estimate@1`

| | |
|---|---|
| Type | new operation in existing engine (lane `engine-food`) |
| Size | M |
| Status | Proposed; implemented on branch `feat/fp-003-food-cost` (stacked on FP-002) for review |
| Decision | `docs/decisions/DECISION-FOOD-PLANNER-DATA.md` §2.5 |
| Depends on | FP-002 (`feat/fp-002-food-engine`): exact fractions, units, shopping consolidation |

## Goal
A pure, deterministic operation that estimates ingredient costs, total event cost, cost per guest,
and budget variance from consolidated shopping lines and price references or user-entered prices.
It is used by the Cost Estimation and Shopping List sections of the Food Planner.

## Contract
**Input**
- `lines[]`: `{ ingredient, buy, unit (g | ml | piece), total? }`, 1–500 items.
- `prices[]`: `{ ingredient, kind (wholesale-reference | retail-reference | user-entered), priceInr, per, unit, source?, observedOn }`, 0–500 items.
- `guests`: 1–100 000.
- `budgetInr`: optional plain decimal string.

**Params**
- `pricePriority`: `user-then-retail` | `user-then-wholesale` | `retail-only` | `wholesale-only` (default `user-then-retail`).
- `quantityBasis`: `buy` | `total` (default `buy`, which reflects rounded count items to purchase).

**Output**
- `items[]`:
  - `ingredient`: string (id)
  - `quantity`: plain decimal string
  - `unit`: `g` | `ml` | `piece`
  - `isPriced`: boolean
  - `priceKind`: `user-entered` | `retail-reference` | `wholesale-reference` | `unpriced`
  - `ratePerBaseUnitInr`: decimal string (for priced items)
  - `costInr`: decimal string rounded half-up to 2 decimal places (paise)
  - `exactCost`: exact decimal or rational string
- `totalCostInr`: decimal string (sum of priced items rounded half-up to 2 decimals)
  - `exactTotalCost`: exact decimal or rational string
- `costPerGuestInr`: decimal string (totalCost ÷ guests rounded half-up to 2 decimals)
- `budgetInr`: optional decimal string (passed through if valid)
- `budgetVarianceInr`: optional decimal string (budgetInr - totalCostInr, positive = under budget)
- `budgetStatus`: `under-budget` | `on-budget` | `over-budget` | `no-budget`
- `pricedCount`: integer
- `unpricedCount`: integer
- `unpricedIngredients`: string[] (sorted ingredient ids)

**Rules**
1. All validation occurs before arithmetic:
   - `FOOD_PRICE_DIMENSION_MISMATCH`: price unit dimension must match ingredient line dimension.
   - `FOOD_INVALID_PRICE`: price amounts, `per`, and `budgetInr` must be valid non-negative decimals.
   - `FOOD_DUPLICATE_PRICE`: at most one price per ingredient per price kind.
2. Prices are resolved per ingredient according to `pricePriority`. A user-entered price takes
   precedence when priority is `user-then-*`.
3. Unpriced ingredients do not fail the calculation: they are reported with `isPriced: false`,
   `priceKind: 'unpriced'`, cost `"0.00"`, listed in `unpricedIngredients`, and trigger warning
   `FOOD_MISSING_PRICE`.
4. Arithmetic is exact using BigInt rational fractions:
   - Rate per base unit = `priceInr ÷ (per × unitToBase)`.
   - Line cost = `quantity × rate`.
   - Total cost = sum of line costs (accumulated as exact fractions, rounded half-up to 2 decimals
     only for display).
   - Cost per guest = `totalCost ÷ guests` (exact fraction, formatted to 2 decimals).
   - Never uses JavaScript floating-point numbers for money.
5. If budget is set and `totalCost > budget`, warning `FOOD_BUDGET_EXCEEDED` is raised.

## Acceptance
- Unit tests cover:
  - Exact cost scaling with wholesale and retail reference prices.
  - User-entered price overriding reference prices.
  - Multi-unit price normalization (e.g. ₹120 per 1 kg for 2500 g).
  - Missing price warnings and unpriced ingredient accounting.
  - Dimension mismatch rejection (e.g. litre price for mass ingredient).
  - Budget comparison: under-budget, on-budget, over-budget.
  - Per-guest cost calculations across single-guest and large event scales.
  - Exact fraction sum without intermediate floating point error.
- Monorepo typecheck, architecture checks, and biome pass cleanly.
