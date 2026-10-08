# TASK-008B — Seller Profitability Engine

## Lane

engine-estimate

## Size

S

## Operation

`estimate.seller.profitability@1`

## Runtime

- worker
- node

## Data class

public

## Scope

Add one pure deterministic estimate-engine operation for seller profitability.

This task covers only numeric calculation logic.

Explicitly out of scope:

- Amazon
- Flipkart
- Meesho
- Myntra
- marketplace fee tables
- seller tiers/programmes
- HSN/GST lookup tables
- product URLs
- product import
- network access
- scraping
- source/provenance records
- presets
- tool manifests
- web UI
- adapters
- authentication
- storage
- new dependencies

The operation receives already-resolved numeric values only.

## Inputs

All monetary inputs are decimal strings.

Required:

- `grossSellingPrice`
  - decimal string
  - greater than zero
- `productCost`
  - decimal string
  - non-negative

Optional, default `"0"`:

- `marketplaceFees`
- `shippingLogistics`
- `sellerExpenses`
- `expectedReturnRtoCost`
- `nonRecoverableTaxCost`
- `settlementOnlyDeductions`

All optional monetary inputs are non-negative decimal strings.

## Parameters

`rounding`:

- `half-up`
- `half-even`

Default: `half-up`.

Money precision: two decimals following existing estimate-engine conventions.

## Outputs

- `economicProfit`
- `cashSettlement`
- `profitMarginPercent`
- `markupPercent`
- `totalEconomicCost`
- `totalSettlementDeductions`
- `working`

## Approved formulas

```text
totalEconomicCost =
  productCost
  + marketplaceFees
  + shippingLogistics
  + sellerExpenses
  + expectedReturnRtoCost
  + nonRecoverableTaxCost

economicProfit =
  grossSellingPrice
  - totalEconomicCost

totalSettlementDeductions =
  marketplaceFees
  + shippingLogistics
  + settlementOnlyDeductions

cashSettlement =
  grossSellingPrice
  - totalSettlementDeductions

profitMarginPercent =
  economicProfit
  / grossSellingPrice
  × 100

markupPercent =
  economicProfit
  / productCost
  × 100
```

## Accounting distinction

`economicProfit` and `cashSettlement` are intentionally different.

`sellerExpenses`, `productCost`, `expectedReturnRtoCost`, and `nonRecoverableTaxCost` are
economic-cost inputs.

`settlementOnlyDeductions` are cash-flow deductions only.

TCS/TDS-style settlement deductions must not automatically reduce `economicProfit`.

## Zero product-cost rule

If `productCost = 0`:

- `economicProfit` and other valid outputs still calculate
- `markupPercent = null`
- return typed error/warning `ESTIMATE_MARKUP_UNDEFINED`

Use the existing estimate-engine convention for non-fatal undefined outputs if such a convention
already exists.

If adding `ESTIMATE_MARKUP_UNDEFINED` requires an error-contract change not authorized by existing
patterns, stop and report the smallest required contract change instead of inventing one.

## Validation

Follow existing estimate-engine conventions for:

- missing required inputs
- `grossSellingPrice <= 0`
- negative values
- invalid decimal strings
- excessive decimal places
- unsupported rounding value

Do not introduce new validation semantics where an existing typed error already applies.

## Required implementation files for the later engine PR

Expected:

- `engines/estimate/src/operations/seller-profitability/schema.ts`
- `engines/estimate/src/operations/seller-profitability/operation.ts`
- `engines/estimate/src/operations/seller-profitability/README.md`
- `engines/estimate/src/operations/seller-profitability/fixtures/*.yaml`
- `engines/estimate/src/index.ts`
- `engines/estimate/README.md`

`engines/estimate/src/errors.ts` only if an approved new error code is actually necessary.

## Fixture basis

Fixtures may use `source: hand-verified`.

Citation/reference: TASK-008B approved formulas.

Minimum later implementation coverage:

1. simple offline calculation
2. marketplace fee
3. shipping + seller expenses
4. expected return/RTO cost
5. settlement-only deduction separated from economic profit
6. margin
7. markup
8. zero product cost
9. invalid/zero selling price
10. negative input
11. excessive precision

## Acceptance criteria

- Task contract clearly defines inputs, params, outputs, errors, and formula source.
- One estimate-engine operation only.
- No platform-specific knowledge enters the engine.
- No network or DOM.
- No preset/tool/UI work.
- No dependency changes.
- Money remains decimal-string based.
- Economic profit and cash settlement remain distinct.
