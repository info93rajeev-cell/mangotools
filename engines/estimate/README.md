# engines/estimate

Pricing, tax and profitability calculations. All money is decimal strings via `engines/numeric`.

| Operation | Purpose |
|---|---|
| `estimate.tax.gst@1` | Add or remove GST; CGST + SGST (intra-state) or IGST (inter-state) |
| `estimate.pricing.margin@1` | Solve cost, price, profit, margin % and markup % from two known values |
| `estimate.seller.profitability@1` | Calculate seller economic profit, cash settlement, margin and markup from resolved costs |
| `estimate.seller.unit-economics@1` | Profit, margin, payout, monthly totals, break-even and target prices for one product from price, GST, costs, fees and returns |
| `estimate.marketplace.manual-profitability@1` | Estimate order profit, settlement, ROI and break-even from manually entered marketplace fee lines, slabs, taxes and scenarios |

## Changelog
- 0.4.0 — added `estimate.seller.unit-economics@1`: the Seller Profitability Calculator's maths in decimal strings, with closed-form break-even and target prices. Existing operations and fixtures unchanged.
- 0.3.1 — `estimate.pricing.margin@1` gains optional `extraCost`, `quantity` and `gstPercent` inputs and nullable `profitTotal` / `priceWithGst` outputs. Without them the output is unchanged; all existing fixtures pass unchanged.
- 0.3.2 — `estimate.marketplace.manual-profitability@1`: fixtures 023–024 (registered seller claiming fee GST as ITC, and not claiming it). No code change.
- 0.3.0 — added `estimate.marketplace.manual-profitability@1` (TASK-008L): manual fee lines, finite price/weight slabs, product and fee GST, TCS/TDS, outcome scenarios and closed-form break-even. Existing operations unchanged.
- 0.2.0 — added deterministic seller profitability calculations (TASK-008B).
- 0.1.0 — first two operations (TASK-001). `ESTIMATE_MARKUP_OUT_OF_RANGE` added for markups of −100 % or less.
