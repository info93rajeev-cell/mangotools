# logistics.cost.estimate@1

The **shared Logistics freight-cost model**. A planning estimate from the user's **own** rate — not a
freight quote, not a carrier price and not a live rate. No currency conversion takes place: the currency
is accounting context only and never changes a value.

Every Logistics tool that offers a cost estimate uses the same formula, implemented once in
`src/lib/freight-cost.ts`:

| Line | Formula |
|---|---|
| `baseCharge` | `quantity × rate` |
| `freightCharge` | `max(baseCharge, minimumCharge)` when a minimum charge is given, otherwise `baseCharge` |
| `estimatedTotal` | `freightCharge + otherCharges` |

## Rate bases (this version)

| `rateBasis` | `quantity` | Consumer |
|---|---|---|
| `per-cbm` | shipment volume in m³ — positive, at most 12 decimal places, at most 1,000,000 | CBM Calculator (exact shipment CBM) |
| `per-container` | whole number of containers, 1–10,000 | Container Loading Calculator — **always the placement-derived container count** from `logistics.container.load@1`, never CBM ÷ nominal container volume |

Per-kg (chargeable weight) and per-pallet bases are deliberately **out of scope** for this version.

## Inputs

- `rate` — required, greater than zero, at most 2 decimal places, at most 1,000,000,000,000.
- `minimumCharge`, `otherCharges` — optional, zero or more, same decimal and size limits.
- `currency` — exactly one of `INR`, `USD`, `EUR`, `GBP`, `AED` for Phase 1 (an identifier and
  formatting context only; no FX conversion). Other currencies need a separate contract extension.

## Precision

All arithmetic is exact decimal arithmetic through `@mangotools/engine-numeric`. Each money output is
rounded **once**, from its exact value, to `params.decimals` (default 2, half-up). The total is never
computed from rounded parts. `working` steps carry the exact values.

## Notices

- `LOGISTICS_COST_USER_RATE` (info, always): "This estimate uses the rate you entered. Actual freight
  charges may depend on carrier, route, surcharges, taxes and other terms."
- `LOGISTICS_COST_MINIMUM_APPLIED`: when the minimum charge replaced `quantity × rate`.

## Errors

`LOGISTICS_MISSING_INPUT`, `LOGISTICS_INVALID_NUMBER`, `LOGISTICS_TOO_MANY_DECIMALS`,
`LOGISTICS_NOT_POSITIVE` (rate ≤ 0), `LOGISTICS_AMOUNT_NEGATIVE` (minimum or other charges < 0),
`LOGISTICS_AMOUNT_TOO_LARGE`, `LOGISTICS_RATE_QUANTITY_NOT_POSITIVE`,
`LOGISTICS_CONTAINER_COUNT_NOT_WHOLE`, `LOGISTICS_RATE_QUANTITY_TOO_LARGE`.
