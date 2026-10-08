# engines/estimate

Pricing, tax and profitability calculations. All money is decimal strings via `engines/numeric`.

| Operation | Purpose |
|---|---|
| `estimate.tax.gst@1` | Add or remove GST; CGST + SGST (intra-state) or IGST (inter-state) |
| `estimate.pricing.margin@1` | Solve cost, price, profit, margin % and markup % from two known values |
| `estimate.seller.profitability@1` | Calculate seller economic profit, cash settlement, margin and markup from resolved costs |

## Changelog
- 0.2.0 — added deterministic seller profitability calculations (TASK-008B).
- 0.1.0 — first two operations (TASK-001). `ESTIMATE_MARKUP_OUT_OF_RANGE` added for markups of −100 % or less.
