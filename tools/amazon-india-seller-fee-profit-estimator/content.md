---
lastReviewed: 2026-10-14
example: 001-sample
---

## How to use

Estimate Amazon India seller profit, settlement and effective fees using your own fee rates and costs.

This is a manually configured estimate. Actual Amazon charges and settlement may differ.
This calculator does not automatically load Amazon fee rates. Enter the fees that apply to your product and fulfillment setup.

1. Enter selling price per unit, product cost per unit and quantity. Choose Successful sale, Customer return, RTO or Cancellation.
2. Open Product Details for whole-order seller-funded discounts and a category label. Open Taxes to set product GST and whether the selling price includes GST.
3. Open Amazon Fees and configure only the referral, closing, weight-handling, pick & pack or other service fees you need. Select each fee's GST treatment and applicable scenarios explicitly.
4. Open Shipping & Fulfillment for manual context, externally resolved chargeable weight and whole-order seller costs. Changing g/kg does not convert weight or slab bounds: review them yourself.
5. Configure return/RTO/cancellation adjustments, withholding or settlement lines where applicable. Compare estimated profit with estimated Amazon settlement; they are different measures.

Processed locally in your browser. Nothing is uploaded.
Saved in this browser only. Use the existing saved-preset control to save a named form explicitly; Reset restores defaults without deleting your saved list.

## Method

The calculation uses only your entered amounts, not a marketplace fee schedule. Referral percentages use whole-order customer value after discounts, before GST-exclusive additions. Referral and closing price slabs match the entered unit selling price before discounts. Slab intervals exclude the lower bound and include the upper bound.

Economic profit subtracts recognized product cost, applicable Amazon fees, non-recoverable fee GST, seller costs and scenario economic charges from recognized tax-exclusive revenue, then adds economic credits. Recoverable fee GST and TCS/TDS are not economic costs.

Estimated settlement starts with the scenario's settled invoice value, subtracts applicable Amazon fees, all fee GST, withholding and settlement charges, then adds settlement credits. Seller costs outside Amazon settlement do not automatically reduce this payout estimate. Do not count the same shipping charge twice.

For return, RTO and cancellation, base revenue, base product cost and recognized product GST are reversed. Enter inventory loss explicitly; no stock write-off, return charge or reimbursement is inferred. Inventory write-off is economic only.

Money uses decimal-string arithmetic with half-up rounding to two places at each produced monetary line. Totals sum rounded lines. Margin, ROI and effective fee are ratios, not guarantees. Break-even holds other values fixed; it is unavailable for non-success scenarios and applicable price-slab fees. Line rounding can leave a few paise at the displayed break-even price.

Fee schedules can vary by category, fulfillment method, weight, zone, programme and date. Enter the rates applicable to your own account and product. This tool does not automatically verify current Amazon fees. Category, zone and fulfillment fields are context labels only, including FBA; no rates are selected for you.

## Worked example

Illustrative manual example, not an Amazon fee recommendation: a ₹1,000 sale with ₹400 product cost and quantity 1 produces ₹600 estimated profit and ₹1,000 estimated settlement when fees and product GST are not modelled. Those omissions are shown near the result; they do not mean Amazon charges or GST are actually zero.

## FAQ

### Does this calculator automatically fetch Amazon India fees?

No. This Amazon India seller fee calculator uses manually entered values only. It has no Amazon API, scraping, live refresh or automatic rate lookup.

### Can I enter my own referral and closing fees?

Yes. The Amazon referral fee calculator supports percentage or price-slab inputs, and the Amazon closing fee calculator supports whole-order fixed or price-slab inputs. Every rate and amount comes from you.

### Does it calculate returns or RTO impact?

Yes, from the selected scenario and your explicitly configured costs, charges, reimbursements, inventory write-offs and settlement adjustments. Cancellation is also supported.

### Is the calculation uploaded?

No. Processing is local in your browser. Named presets are saved only in this browser when you choose to save them.

### Is the estimated settlement guaranteed?

No. This is an Amazon seller settlement estimate, not an actual payout statement. Actual charges, taxes and settlement may differ.

### Does it support GST, TCS and TDS?

Yes, when manually configured. No product GST, fee GST or withholding rate is prefilled. TCS/TDS reduce settlement only, not economic profit. Blank product GST means it is not modelled; an explicitly entered zero is a separate choice.

### Can FBA sellers use it?

Yes. For an Amazon FBA profit calculator India workflow, select FBA as context and enter your applicable fees and costs yourself. It does not determine chargeable weight or official FBA charges.

## References

- Amazon India — Fees and pricing, the existing official public source recorded in project provenance. Background only: no numeric rates imported or verified by this tool.
- TASK-008L approved manual marketplace profitability formulas and hand-verified tool examples.

For a general seller profit calculator without Amazon-specific fee controls, use the [Seller Profitability Calculator](tool:profit-margin-calculator). The [GST Calculator](tool:gst-calculator) and [Markup Calculator](tool:markup-calculator) remain independent tools.
