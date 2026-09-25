# engines/estimate

Pricing and tax calculations. In Phase 1 it contains the first two operations of the future
estimation engine. All money is decimal strings via `engines/numeric`.

| Operation | Purpose |
|---|---|
| `estimate.tax.gst@1` | Add or remove GST; CGST + SGST (intra-state) or IGST (inter-state) |
| `estimate.pricing.margin@1` | Solve cost, price, profit, margin % and markup % from two known values |

## Changelog
- 0.1.0 — first two operations (TASK-001). `ESTIMATE_MARKUP_OUT_OF_RANGE` added for markups of −100 % or less.
