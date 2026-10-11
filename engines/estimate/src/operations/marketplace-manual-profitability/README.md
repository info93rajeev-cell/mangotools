# estimate.marketplace.manual-profitability@1

Estimates one order's economics from manually entered marketplace fee lines, seller costs, product
and fee GST, TCS/TDS, settlement lines and an outcome scenario. Contract:
`tasks/TASK-008L-MANUAL-PROFITABILITY-ENGINE.md`.

The operation is marketplace-neutral. It knows no marketplace names, official rates, fee schedules,
reference datasets or tax rules: every amount, rate, base and scenario list is input.

## Modules

| File | Purpose |
|---|---|
| `schema.ts` | Input, params and output schemas |
| `read-input.ts`, `read-fees.ts`, `read-values.ts` | Whole-input validation into a normalised model, with typed `ESTIMATE_` errors |
| `slabs.ts` | Slab bounds (`min < value ≤ max`), malformed/overlap checks and matching |
| `order.ts` | Order values and scenario-recognised values (contract steps 1–2) |
| `fees.ts` | Fee lines: fixed, percent, price slabs, weight slabs, fee GST (step 3) |
| `totals.ts` | Seller costs, adjustments, settlement lines, settlement and economic results (steps 5–6) |
| `break-even.ts` | Closed-form break-even selling price (step 7) |
| `working.ts` | `WorkingStep` output |

## Key rules

- Discounts and coupons reduce revenue once; they are never costs.
- `orderProductGstAmount` is the original-order product GST; `productGstLiabilityRecognised` is
  the liability for the selected scenario (zero for return, RTO and cancellation). Product GST is
  never economic cost.
- Recoverable fee GST is a settlement deduction only; non-recoverable fee GST is also an economic
  cost. TCS and TDS are settlement deductions only.
- Every percentage fee and price-slab line names its base explicitly; there are no engine defaults.
- Non-success scenarios reverse revenue, product GST and product cost; inventory loss is an explicit
  scenario adjustment.
- `estimatedSettlement` is an estimate, not an actual marketplace payout, and may be negative.

## Limitations

- No official marketplace rates, lookups or reference data.
- No volumetric or chargeable-weight calculation: weight slabs match the resolved
  `chargeableWeight` input.
- No unit conversion in `@1`: weight slabs and `chargeableWeight` must share one unit.
- Finite slabs only; no "₹X per additional 500 g" formulas.
- `breakEvenSellingPrice` is `null` (warning `ESTIMATE_BREAK_EVEN_NOT_DETERMINABLE`, detail
  `reason`) when the scenario is not `successful-sale`, an applicable price-slab line exists, or
  there is no positive solution.
- Each fee line is rounded to paise, so economic profit at the reported break-even price can differ
  from zero by a few paise.
