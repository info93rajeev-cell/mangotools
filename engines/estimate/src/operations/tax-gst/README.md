# estimate.tax.gst@1

R = round to 2 decimals, half-up (halves away from zero).

**Add GST** — `taxable = amount`
- Intra-state: `CGST = R(taxable × rate/2 ÷ 100)`, `SGST = CGST`, `IGST = 0`
- Inter-state: `IGST = R(taxable × rate ÷ 100)`
- `total = CGST + SGST + IGST`, `gross = taxable + total`

**Remove GST** — `gross = amount`
- `taxable = R(gross × 100 ÷ (100 + rate))`, `total = gross − taxable`
- Intra-state: `CGST = R(total ÷ 2)`, `SGST = total − CGST` (the two can differ by ₹0.01)
- Inter-state: `IGST = total`

`effectiveRate = total ÷ taxable × 100` (4 decimals; 0 when taxable is 0).
Amount: at most 2 decimals, not negative. Rate: 0–100, at most 4 decimals.
