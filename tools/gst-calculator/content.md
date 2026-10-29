---
lastReviewed: 2026-10-30
example: 001-add-18-intra
---

## How to use

1. Select your target country (India, USA, UK, UAE, Australia, Canada, or Custom) from the top jurisdiction selector.
2. Choose **Exclusive Price** if your entered amount is pre-tax, or **Inclusive Price** to extract the embedded tax and determine the true pre-tax value.
3. Enter the amount, optional quantity, discounts (as a flat value or percentage), and shipping or freight charges.
4. Customize country-specific options such as supply type (Intra-state CGST + SGST vs Inter-state IGST), state/province jurisdictions, or custom progressive slabs.
5. Review the live **Results Summary** with the interactive Donut chart, KPI cards, and detailed component breakdown. Copy the summary to clipboard or download as a CSV.

## Method

All calculations are evaluated in real-time in your browser with high-precision arithmetic rounded to two decimal places:

- **Exclusive Price Mode (Adding Tax)**:
  $$\text{Taxable Base} = (\text{Amount} \times \text{Quantity}) - \text{Discount} + \text{Shipping}$$
  $$\text{Total Tax} = \text{Taxable Base} \times \left(\frac{\text{Tax Rate}}{100}\right)$$
  $$\text{Final Payable Amount} = \text{Taxable Base} + \text{Total Tax}$$

- **Inclusive Price Mode (Extracting Tax)**:
  $$\text{Total Amount} = (\text{Amount} \times \text{Quantity}) - \text{Discount} + \text{Shipping}$$
  $$\text{Taxable Base} = \frac{\text{Total Amount}}{1 + \left(\frac{\text{Tax Rate}}{100}\right)}$$
  $$\text{Total Tax} = \text{Total Amount} - \text{Taxable Base}$$

- **Indian GST Component Split**:
  - **Intra-state Supply**: Tax is split 50:50 into Central GST (CGST) and State GST (SGST/UTGST).
  - **Inter-state Supply**: 100% of the tax is attributed to Integrated GST (IGST).
  - **Compensation Cess**: Calculated directly on the taxable base and added to the total tax.

- **United States Sales Tax**:
  - Combines state-level statutory rates with county, municipal, and special district local sales taxes.

- **Progressive Tax Slabs**:
  - For custom multi-tier jurisdictions, taxable amounts are partitioned across configured bracket boundaries, calculating marginal tax per slab.

## Worked example

Adding 18% GST to ₹1,000.00 for an intra-state supply:

- Taxable amount: ₹1,000.00
- CGST (9%): ₹90.00
- SGST (9%): ₹90.00
- Total tax: ₹180.00
- Final amount payable: ₹1,180.00

## FAQ

### What tax systems are supported by this calculator?

The Universal Tax Calculator supports Indian GST (CGST, SGST, IGST, Cess, Composition Scheme), US State and Local Sales Tax across all 50 states, UK VAT, UAE VAT, Canadian Federal and Provincial Taxes (GST, HST, PST, QST), Australian GST, and user-defined custom progressive tax slabs.

### How does inclusive tax calculation differ from exclusive?

In exclusive mode, tax is added on top of your base price. In inclusive mode, the entered price already contains tax, so the calculator performs a reverse calculation: $\text{Base} = \text{Price} \div (1 + \text{Rate}/100)$. Subtracting the rate directly from an inclusive price produces an incorrect lower value.

### Can I calculate taxes for different US states and Canadian provinces?

Yes. Select USA or Canada to access state and provincial tax dropdowns with preset statutory rates (e.g., California 7.25%, Texas 6.25%, Ontario 13% HST, Quebec 14.975% combined), plus editable local municipal tax rates.

### Can I define custom progressive tax slabs?

Yes. Under Card 4 (Universal Tax Setup), you can add, edit, or delete any number of progressive tax slabs with custom minimums, maximums, and percentage rates for bracket-based calculations.

### Is my business data uploaded to any server?

No. 100% of the calculations, CSV generation, and summary copying take place entirely inside your web browser. No financial data or amounts are sent across the network.

## References

- Central Board of Indirect Taxes and Customs — GST Rates (cbic-gst.gov.in)
- US Federation of Tax Administrators — State Sales Tax Rates
- HM Revenue & Customs — VAT Rates and Exemptions (gov.uk)
- Canada Revenue Agency — GST/HST Rates by Province (canada.ca)
- UAE Federal Tax Authority — Value Added Tax Guide (tax.gov.ae)
