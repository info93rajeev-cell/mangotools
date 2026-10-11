# TASK-008L — Manual Marketplace Profitability Engine

## Lane

engine-estimate

## Size

M (later implementation). This contract PR is documentation only.

## Operation

`estimate.marketplace.manual-profitability@1`

Naming follows the repository operation-reference format (`schemas/src/common.ts` `operationRef`:
lowercase dot segments, hyphens allowed inside a segment, `@major`) and the existing estimate naming
`estimate.<domain>.<subject>` used by `estimate.seller.profitability@1`. It lives in the existing
`engines/estimate` family; no new engine family and no ADR are required (the blueprint "Add engine"
playbook applies to new engines only).

## Runtime

- worker
- node

## Data class

public — seller-entered numbers only; no identifiers, accounts or files.

## Exposure, cost, annotations

`exposure: internal` · `cost.weight: light` · read-only, idempotent, non-destructive, closed-world.

## Context: TASK-008L sequence

TASK-008L is approved as six PRs, one lane each: (1) this engine contract, (2) engine
implementation, (3) platform support for repeatable slab rows and browser-local saved presets,
(4) shared UI components, (5) tool contract, (6) the **Amazon India Seller Fee & Profit
Estimator** tool. Amazon wording, fee names and help copy belong to the preset and tool (PRs 5–6),
never to this operation.

## Scope

One pure, deterministic, marketplace-neutral operation that estimates the economics of one order
from caller-supplied prices, manually configured marketplace fee lines, seller costs, taxes,
settlement deductions and an outcome scenario.

The engine does **not** know marketplace names or rates, fee schedules, reference datasets
(TASK-008E), Seller Central, APIs, network state, browser storage, UI sections or accounts. It never
prefills a value. Every fee amount or rate is input.

Out of scope: reference-data resolution, automatic fee prefill, volumetric/chargeable-weight
calculation (see **Weight boundary**), unit conversion, incremental "₹X per additional 500 g" formulas, multi-order or
settlement-file processing, schemas/platform/UI/preset/tool work, new dependencies.

`estimate.seller.profitability@1` stays unchanged, including all of its fixtures. This operation is
additive.

## Number conventions

- Money: decimal strings, at most 2 decimals, ≥ 0 unless stated.
- Percentages: decimal strings, at most 4 decimals, 0 ≤ value ≤ 100.
- Weights: decimal strings, at most 3 decimals, ≥ 0.
- `quantity`: a decimal-integer string, 1 to 10,000.
- All arithmetic through `@mangotools/engine-numeric` (`add`, `sub`, `mul`, `div`, `round`,
  `compare`); never JavaScript numbers for money, rates or weights.
- Rounding (estimate lane rule): every money amount is rounded to 2 decimals with `params.rounding`
  when it is produced; totals are sums of rounded lines; percentages are derived from rounded money
  and rounded to 2 decimals.

## Inputs

Scope column: **unit** = per unit (multiplied by `quantity` by the engine) · **order** = order
total, never multiplied · **line** = set per fee line by `quantityScope`.

### Order and product

| Field | Req | Scope | Meaning |
|---|---|---|---|
| `sellingPricePerUnit` | ✅ | unit | Listed selling price, > 0, in the convention of `sellingPriceTaxMode` |
| `quantity` | ✅ | — | Units in the order |
| `productCostPerUnit` | ✅ | unit | Seller's economic product cost, excluding recoverable input GST |
| `promotionalDiscount` | — | order | Seller-funded promotional discount, default `"0"` |
| `couponDiscount` | — | order | Seller-funded coupon, default `"0"` |
| `productGstRatePercent` | — | — | Product GST rate, default `"0"` |
| `sellingPriceTaxMode` | — | — | `gst-inclusive` (default) · `gst-exclusive` |
| `chargeableWeight` | cond. | — | `{ value, unit: g · kg }`, an already-resolved weight; required only when an applicable enabled fee line uses `weight-slabs` |

### Marketplace fee lines — `feeLines` (0–20)

Each line is a strict object:

- `id` — kebab-case, unique within `feeLines`
- `enabled` — boolean; disabled lines are validated for shape only and never charged
- `mode` — `fixed` · `percent` · `price-slabs` · `weight-slabs`
- `amount` — money; required for `fixed`
- `ratePercent` — percentage; required for `percent`
- `quantityScope` — `per-unit` · `per-order`; required for `fixed`, `weight-slabs`, and
  `price-slabs` lines containing any fixed slab. No default
- `percentageBase` — `realized-customer-value` · `tax-exclusive-revenue` · `customer-invoice-value`;
  required for `percent` lines and for `price-slabs` lines containing any percentage slab. No
  default: the engine never assumes whether a fee is charged before or after product GST
- `slabPriceBase` — `entered-unit-selling-price` · `realized-unit-selling-price`; required for
  `price-slabs`. No default
- `priceSlabs` — 1–20 slabs for `price-slabs`: `{ min?, max?, chargeMode: fixed · percent, value }`
- `weightSlabs` — 1–20 slabs for `weight-slabs`: `{ min?, max?, unit: g · kg, amount }`
- `gstTreatment` — `none` · `recoverable` · `non-recoverable`. Required, no default
- `scenarios` — non-empty list of scenario ids in which the line is charged; default
  `["successful-sale"]`

`marketplaceFeeGstRatePercent` (order-level, no default) is required when any enabled applicable
line has `gstTreatment` other than `none`.

### Seller-controlled economic costs

`packagingCost`, `sellerShippingCost`, `advertisingCost`, `otherTransactionCost` — each optional
`{ amount, scenarios }`: `amount` is an **order** total; `scenarios` is a non-empty list of scenario
ids in which the cost applies, default `["successful-sale"]`. A caller lists other scenarios
explicitly when the cost is already incurred there (for example packaging in an RTO).

These are economic costs paid by the seller outside the marketplace settlement. Discounts and
coupons are **not** cost fields.

### Settlement lines

- `tcs`, `tds` — each optional `{ mode: percent · fixed, value, percentageBase?, scenarios }`.
  `fixed` value is an **order** total. `percentageBase` is `tax-exclusive-revenue` ·
  `customer-invoice-value`, required for `percent`, no default; the engine holds no tax-law rule
- `otherSettlementDeductions`, `settlementCredits` — each optional `{ amount, scenarios }`, `amount`
  an **order** total

`scenarios` on every settlement line is a non-empty list, default `["successful-sale"]`. The engine
infers no marketplace or tax behaviour for other scenarios; a caller who enables a line for
`customer-return`, `rto` or `cancellation` does so explicitly.

### Scenario

- `scenario` — `successful-sale` (default) · `customer-return` · `rto` · `cancellation`
- `scenarioAdjustments` — 0–20 strict objects:
  `{ id, direction: charge · credit, amount, economic: boolean, settlement: boolean, scenarios }`.
  `amount` is a positive-or-zero order total; the sign comes from `direction`, never from a negative
  number. At least one of `economic`/`settlement` must be `true`. `scenarios` is a non-empty list
  that must not contain `successful-sale`. Example mappings (tool, not engine): reverse logistics →
  charge, economic + settlement; marketplace reimbursement → credit, economic + settlement; stock
  write-off → charge, economic only.

## Parameters

`rounding`: `half-up` (default) · `half-even`.

## Calculation

### 1. Order values (always computed from the order, whatever the scenario)

```text
grossCustomerValue    = sellingPricePerUnit × quantity
sellerFundedReduction = promotionalDiscount + couponDiscount        (error if > grossCustomerValue)
realizedCustomerValue = grossCustomerValue − sellerFundedReduction  (≥ 0)

g = productGstRatePercent / 100
gst-inclusive:  taxExclusiveRevenue = round(realizedCustomerValue / (1 + g))
                orderProductGstAmount = realizedCustomerValue − taxExclusiveRevenue
                customerInvoiceValue = realizedCustomerValue
gst-exclusive:  taxExclusiveRevenue = realizedCustomerValue
                orderProductGstAmount = round(realizedCustomerValue × g)
                customerInvoiceValue = realizedCustomerValue + orderProductGstAmount
productCostTotal = productCostPerUnit × quantity
```

Terminology is fixed: *gross customer value* = listed price × quantity; *realized customer value*
= after seller-funded reductions, still in the entered tax convention; *customer invoice value* =
what the customer pays including product GST; *tax-exclusive revenue* = the seller's economic
revenue. `orderProductGstAmount` is the product GST calculated from the original order values; it is
kept for audit and working and is not, by itself, the liability recognised for the selected
scenario (see step 2). Product GST is never revenue and never an economic cost in any scenario.

### 2. Recognised values (scenario-dependent)

```text
successful-sale:               revenueRecognised = taxExclusiveRevenue
                               invoiceValueSettled = customerInvoiceValue
                               productCostRecognised = productCostTotal
                               productGstLiabilityRecognised = orderProductGstAmount
customer-return · rto ·        all four = "0.00" (base sale revenue, base product GST liability
cancellation:                  and base product-cost recognition are reversed)
```

`productGstLiabilityRecognised` is the only product GST liability for the selected scenario. In a
successful sale it equals `orderProductGstAmount`, so successful-sale behaviour is unchanged; in a
return, RTO or cancellation it is `"0.00"`. A UI must show `productGstLiabilityRecognised` as the
active liability and may show `orderProductGstAmount` only as original-order working.

Product cost is **not** expensed automatically in a non-success scenario. Inventory that is lost,
damaged, non-recoverable or otherwise consumed is entered explicitly as a scenario adjustment
(`direction: charge`, `economic: true`), which flows into `scenarioEconomicCosts`.

### 3. Marketplace fee lines

A line is **applicable** when `enabled` and `scenario ∈ line.scenarios`. For each applicable line:

```text
base = realizedCustomerValue | taxExclusiveRevenue | customerInvoiceValue
       (percentageBase; always the order values from step 1)
fixed:        amount × (quantity if per-unit else 1)
percent:      round(base × ratePercent / 100)
price-slabs:  slabMatchValue = sellingPricePerUnit                      (entered-unit-selling-price)
                             | realizedCustomerValue / quantity         (realized-unit-selling-price)
              the single slab matching slabMatchValue;
              fixed slab → value × (quantity if per-unit else 1); percent slab → round(base × value / 100)
weight-slabs: the single slab matching chargeableWeight.value; amount × (quantity if per-unit else 1)
lineGst = round(lineAmount × marketplaceFeeGstRatePercent / 100) when gstTreatment ≠ none, else 0
```

```text
marketplaceFeesTotal            = Σ lineAmount
marketplaceFeeGstTotal          = Σ lineGst
recoverableMarketplaceFeeGst    = Σ lineGst where gstTreatment = recoverable
nonRecoverableMarketplaceFeeGst = Σ lineGst where gstTreatment = non-recoverable
```

All applicable fee amounts and all fee GST are deducted in settlement. Recoverable fee GST is a
recoverable tax credit (not an economic cost); non-recoverable fee GST is an economic cost.

### 4. Slab semantics (price and weight)

- Range rule `min < value ≤ max` (TASK-008E / TASK-008G convention). Absent `min` = no lower bound
  (includes 0); absent `max` = no upper bound. A slab with neither bound is malformed.
- `min ≥ max` → malformed (the interval would be empty).
- Two slabs in one line overlap when their intervals intersect → error. Gaps are allowed.
- No slab matches the value of an applicable line → error `ESTIMATE_NO_MATCHING_SLAB`; the engine
  never charges zero silently.
- Weight slabs: every slab in a line and `chargeableWeight` must use the same unit; otherwise
  `ESTIMATE_UNIT_MISMATCH`. No unit conversion in `@1`. Finite slabs only; no incremental formulas.
- Price slabs match the value chosen by the line's required `slabPriceBase`, in the entered tax
  convention:
  - `entered-unit-selling-price` — `sellingPricePerUnit` as entered, before seller-funded
    reductions;
  - `realized-unit-selling-price` — `realizedCustomerValue / quantity`. Seller-funded reductions are
    allocated equally across all units. The quotient is computed with the numeric engine's division
    at its default scale and compared unrounded, so matching is deterministic. It is reported as
    `slabMatchValue` (2 decimals) in the fee item.

### Weight boundary

This operation never calculates volumetric or chargeable weight and never receives package
dimensions. Weight-slab matching consumes the resolved `chargeableWeight` only. Package dimensions
and volumetric weight are a separate calculation (`logistics.weight.chargeable@1` exists). The UI
must not compute weight ad hoc. The later tool must either (A) compose that operation through an
approved platform mechanism, or (B) ask the user for a resolved chargeable weight. The runtime has no
in-page operation composition today (only the cross-tool `transferTo` handoff), so option A is a
platform decision for PR 3; option B needs no platform change.

### 5. Seller costs, scenario adjustments, settlement items

```text
sellerControlledCostsTotal   = Σ seller-cost amounts whose scenarios include the selected scenario
scenarioEconomicCosts        = Σ adjustments (scenario listed, charge, economic)
scenarioEconomicCredits      = Σ adjustments (scenario listed, credit, economic)
scenarioSettlementDeductions = Σ adjustments (scenario listed, charge, settlement)
scenarioSettlementCredits    = Σ adjustments (scenario listed, credit, settlement)
each settlement line, only when its scenarios include the selected scenario (else 0):
  tcsAmount, tdsAmount = fixed value, or round(base × value / 100)  (base from step 1 order values)
  otherSettlementDeductionsApplied, settlementCreditsApplied = the line amounts
```

TCS and TDS are settlement deductions only: never economic cost, never investment, never marketplace
fees.

### 6. Results

```text
totalSettlementDeductions = marketplaceFeesTotal + marketplaceFeeGstTotal + tcsAmount + tdsAmount
                            + otherSettlementDeductionsApplied + scenarioSettlementDeductions
estimatedSettlement       = invoiceValueSettled − totalSettlementDeductions
                            + settlementCreditsApplied + scenarioSettlementCredits      (may be < 0)

totalEconomicInvestment   = productCostRecognised + marketplaceFeesTotal
                            + nonRecoverableMarketplaceFeeGst + sellerControlledCostsTotal
                            + scenarioEconomicCosts
economicProfit            = revenueRecognised − totalEconomicInvestment + scenarioEconomicCredits

profitMarginPercent       = economicProfit / revenueRecognised × 100           (null if denominator 0)
roiPercent                = economicProfit / totalEconomicInvestment × 100     (null if denominator 0)
effectiveMarketplaceFeePercent = (marketplaceFeesTotal + nonRecoverableMarketplaceFeeGst)
                                 / taxExclusiveRevenue × 100                   (null if denominator 0)
```

No tax is counted twice. Product GST sits only in the settlement path: `invoiceValueSettled`
contains `productGstLiabilityRecognised` in a successful sale and is zero otherwise; product GST
never enters economic profit or investment. Recoverable fee GST is only in settlement;
non-recoverable fee GST is in both settlement and economic cost, exactly once each.
Credits never reduce `totalEconomicInvestment`. `estimatedSettlement` is an estimate, not an actual
marketplace payout.

### 7. Break-even selling price

`breakEvenSellingPrice` is the `sellingPricePerUnit` at which `economicProfit = 0`, holding every
other input fixed. Computed only when all hold:

- `scenario = successful-sale`;
- no applicable enabled `price-slabs` line, whatever its `slabPriceBase` (slab choice depends on
  price and is discontinuous).

Weight-slab, fixed and per-unit fees, applicable seller costs and discounts are constants; settlement
lines do not affect economic profit. Every allowed `percentageBase` is a fixed multiple of
`R = realizedCustomerValue`, so the equation stays linear. With `a = 1/(1+g)` (inclusive) or `1`
(exclusive), the base multiplier `b_i` is:

| `percentageBase` | gst-inclusive | gst-exclusive |
|---|---|---|
| `realized-customer-value` | 1 | 1 |
| `tax-exclusive-revenue` | 1/(1+g) | 1 |
| `customer-invoice-value` | 1 | 1+g |

and
`h = marketplaceFeeGstRatePercent / 100`, `m_i = 1 + h` for a non-recoverable line and `1` otherwise,
and `k_i = rate_i/100 × m_i` per applicable `percent` line:

```text
F = productCostTotal + Σ (applicable fixed and weight-slab line amounts × m_i)
    + sellerControlledCostsTotal
d = a − Σ k_i × b_i
R* = F / d          P* = (R* + sellerFundedReduction) / quantity
breakEvenSellingPrice = round(P*)  (division at numeric-engine scale, then 2 decimals)
```

If `d ≤ 0` or `P* ≤ 0`, or a condition above fails: `breakEvenSellingPrice = null` with warning
`ESTIMATE_BREAK_EVEN_NOT_DETERMINABLE` (detail `reason`: `scenario` · `price-slabs` ·
`no-positive-solution`). No iteration or search. Because each line is rounded, `economicProfit` at
the reported price may differ from zero by a few paise; the README must say so.

## Outputs

Strict object, all money as 2-decimal strings:

`scenario`, `grossCustomerValue`, `sellerFundedReduction`, `realizedCustomerValue`,
`customerInvoiceValue`, `orderProductGstAmount`, `taxExclusiveRevenue`, `productCostTotal`,
`revenueRecognised`, `invoiceValueSettled`, `productCostRecognised`,
`productGstLiabilityRecognised`,
`marketplaceFees` (array: `{ id, mode, applicable, percentageBase | null, base | null,
slabPriceBase | null, slabMatchValue | null, matchedSlabIndex | null, amount, gstAmount,
gstTreatment }`, disabled or non-applicable lines with `amount "0.00"` and
`applicable: false`), `marketplaceFeesTotal`, `marketplaceFeeGstTotal`,
`recoverableMarketplaceFeeGst`, `nonRecoverableMarketplaceFeeGst`, `sellerControlledCostsTotal`,
`scenarioEconomicCosts`, `scenarioEconomicCredits`, `scenarioSettlementDeductions`,
`scenarioSettlementCredits`, `tcsAmount`, `tdsAmount`, `otherSettlementDeductionsApplied`,
`settlementCreditsApplied`, `totalSettlementDeductions`, `estimatedSettlement`,
`totalEconomicInvestment`, `economicProfit`, `profitMarginPercent | null`, `roiPercent | null`,
`effectiveMarketplaceFeePercent | null`, `breakEvenSellingPrice | null`, `working`.

`working` uses the shared `WorkingStep` shape (`ref`, `formulaKey`, `variables`, `result`,
`noteKey?`) with at least one step per formula in **Calculation** and one per applicable fee line.
Values only; no UI copy.

## Errors (fatal) and warnings

Prefix `ESTIMATE_` (estimate-engine convention, `engines/estimate/src/errors.ts`). Reused codes:
`ESTIMATE_MISSING_INPUT`, `ESTIMATE_INVALID_NUMBER`, `ESTIMATE_TOO_MANY_DECIMALS`,
`ESTIMATE_NEGATIVE_AMOUNT`, `ESTIMATE_NEGATIVE_VALUE`, `ESTIMATE_PRICE_ZERO`,
`ESTIMATE_GST_RATE_OUT_OF_RANGE`. New codes, each with an English message, `path` to the field:

| Code | When |
|---|---|
| `ESTIMATE_INVALID_QUANTITY` | `quantity` is not an integer from 1 to 10,000 |
| `ESTIMATE_PERCENT_OUT_OF_RANGE` | A fee, slab, TCS or TDS percentage is outside 0–100 |
| `ESTIMATE_DISCOUNT_EXCEEDS_VALUE` | `sellerFundedReduction > grossCustomerValue` |
| `ESTIMATE_DUPLICATE_ID` | Duplicate fee-line or adjustment `id` |
| `ESTIMATE_TOO_MANY_ITEMS` | More than 20 fee lines, slabs per line or adjustments |
| `ESTIMATE_MISSING_FEE_VALUE` | A field required by a line's `mode` is absent, including `percentageBase`, `slabPriceBase`, `quantityScope`, the fee GST rate or a TCS/TDS base |
| `ESTIMATE_MALFORMED_SLAB` | A slab has neither bound, or `min ≥ max` |
| `ESTIMATE_OVERLAPPING_SLABS` | Two slabs in one line overlap |
| `ESTIMATE_NO_MATCHING_SLAB` | No slab of an applicable line matches the price or weight |
| `ESTIMATE_MISSING_WEIGHT` | An applicable `weight-slabs` line exists and `chargeableWeight` is absent |
| `ESTIMATE_UNIT_MISMATCH` | Weight-slab units differ within a line or from `chargeableWeight.unit` |
| `ESTIMATE_INVALID_SCENARIO_LIST` | An empty `scenarios` list anywhere, `successful-sale` in an adjustment, or an adjustment with neither `economic` nor `settlement` |

Warnings (result still returned): `ESTIMATE_BREAK_EVEN_NOT_DETERMINABLE`,
`ESTIMATE_MARGIN_UNDEFINED`, `ESTIMATE_ROI_UNDEFINED`, `ESTIMATE_EFFECTIVE_FEE_UNDEFINED`.
Validation covers the whole input (including disabled lines' shapes) before any calculation.

## Determinism

Pure function of input and params: no clock, network, randomness, storage, DOM, console, marketplace
lookups or reference data. Same input → byte-identical output in Node and every browser
(cross-browser determinism suite).

## Expected implementation files (PR 2)

- `engines/estimate/src/operations/marketplace-manual-profitability/` — `schema.ts`,
  `operation.ts`, focused modules (fee lines, slabs, break-even) each ≤ 300 lines with functions
  ≤ 60 lines, `README.md`, `fixtures/*.yaml`, colocated tests
- `engines/estimate/src/index.ts`, `engines/estimate/src/errors.ts` (new codes only),
  `engines/estimate/README.md` (table row + changelog)

Not touched: `seller-profitability/**` and its fixtures, other engines, `schemas/`, `packages/`,
`apps/`, `presets/`, `tools/`, `reference/`.

## Fixtures (hand-verified, minimum)

1 basic successful sale · 2 quantity > 1 · 3 percent fee · 4 fixed fee per-unit vs per-order ·
5 all optional fees zero · 6 price slab selected · 7 weight slab selected · 8 slab boundary
(`value = max` matches, `value = min` does not) · 8a realized-unit slab base with a discount moving the
match to a lower slab · 9 overlapping slabs error · 10 no matching slab
error · 11 GST-inclusive price · 12 GST-exclusive price · 13 fee GST recoverable vs non-recoverable ·
14 TCS settlement-only · 15 TDS settlement-only · 16 successful sale ignores scenario adjustments ·
17 customer return · 18 RTO · 19 cancellation (17–19 assert `productGstLiabilityRecognised = "0.00"`
while `orderProductGstAmount` keeps the original-order value) · 20 reimbursement credit · 21 negative profit ·
22 ROI · 23 ROI denominator zero · 24 break-even fixed fees · 25 break-even with percent fees in each
tax mode · 26 break-even not determinable (price slabs; non-success scenario) · 27 effective fee % ·
28 rounding half-up vs half-even · 29 negative input · 30 percent > 100 · 31 invalid quantity ·
32 missing selling price · 33 discount exceeding value · 34 discount counted once (not as cost) ·
35 seller shipping counted once · 36 unit mismatch · 37 each `percentageBase` in each tax mode,
including break-even · 38 seller cost and TCS enabled for `rto` explicitly · 39 return with an
explicit inventory write-off · 40 missing `percentageBase` / `slabPriceBase` errors.

## Founder decisions recorded (TASK-008L PR 1 correction)

1. Non-success scenarios reverse base revenue, base product GST and base product cost to zero;
   inventory loss is an explicit scenario adjustment. Seller costs follow their own `scenarios`.
2. TCS, TDS, other settlement deductions and settlement credits carry explicit `scenarios`,
   default `successful-sale`.
3. Price slabs require an explicit `slabPriceBase`; no engine default.
4. Percentage fees require an explicit `percentageBase` (three choices); no engine default.
5. Chargeable or volumetric weight is resolved outside this operation (see **Weight boundary**).

## Remaining decisions for later PRs

- PR 3 (platform): whether to add in-page operation composition so the tool can call
  `logistics.weight.chargeable@1`, or to ship the tool with a user-entered chargeable weight
  (option B).
- PR 5 (tool contract): which `percentageBase`, `slabPriceBase` and scenario lists the Amazon preset
  shows by default. These are tool choices, never engine defaults.

## Acceptance criteria

- One additive operation in `engines/estimate`; `estimate.seller.profitability@1` unchanged.
- Marketplace-neutral; no fee, rate, tax-law or marketplace constants.
- Discounts reduce revenue once; product GST, fee GST, TCS/TDS follow the conventions above.
- `orderProductGstAmount` (original order) and `productGstLiabilityRecognised` (scenario) are
  distinct outputs; the recognised liability is zero in every non-success scenario.
- Economic profit and estimated settlement stay distinct and fully itemised.
- Slabs finite, `min < value ≤ max`, overlaps and no-match are errors; every price-slab line and
  percentage fee names its base explicitly.
- Every seller cost and settlement line carries explicit scenario applicability.
- Break-even is closed-form or `null` with a typed warning; no search.
- Typed `ESTIMATE_` errors and warnings; no throws for user input.
- Decimal strings only; no dependency, network, storage or UI surface.
