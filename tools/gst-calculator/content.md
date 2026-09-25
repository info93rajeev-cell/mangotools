---
lastReviewed: 2026-09-25
example: 001-add-18-intra
---

## How to use

1. Choose **Add GST** if your amount is before tax, or **Remove GST** if it already includes GST.
2. Choose the supply type: **Intra-state** (CGST + SGST) when the supplier and the place of supply are in the same state, or **Inter-state** (IGST) when they are in different states.
3. Enter the amount in rupees and select the GST rate, or choose **Custom** to type any rate.
4. Read the result and the working steps, then copy or print them.

## Method

All amounts use exact decimal arithmetic and are rounded to two decimal places (the nearest paisa) with half-up rounding: an exact half rounds away from zero.

**Adding GST** to a taxable value:

- Intra-state: CGST = taxable value × (rate ÷ 2) ÷ 100, rounded. SGST is calculated the same way, so the two are always equal.
- Inter-state: IGST = taxable value × rate ÷ 100, rounded.
- Total GST = CGST + SGST, or IGST. Amount including GST = taxable value + total GST.

**Removing GST** from an amount that already includes it:

- Taxable value = amount × 100 ÷ (100 + rate), rounded.
- Total GST = amount − taxable value.
- Intra-state: CGST = total GST ÷ 2, rounded, and SGST = total GST − CGST. Inter-state: IGST = total GST.

When you remove GST, the total tax can be an odd number of paise, which can't be split into two equal halves. CGST takes the rounded half and SGST takes the rest, so the two can differ by ₹0.01 while still adding up exactly to the total.

## Worked example

Adding 18% GST to ₹1,000.00 for an intra-state supply:

## FAQ

### What GST rates can I choose?

The rate list follows the GST rate structure in effect from 22 September 2025. The main slabs are 5% and 18%, 40% applies to specified goods, special rates such as 0.25% and 3% apply to a few items, and 0% covers nil-rated supplies. Choose **Custom** for any other rate. The correct rate for a particular item or service depends on its classification, so always check it in the official rate notifications.

### What is the difference between CGST + SGST and IGST?

For a supply within one state (intra-state), GST is split equally between Central GST (CGST) and State GST (SGST, or UTGST in a union territory). For a supply between states (inter-state), the whole tax is charged as Integrated GST (IGST). The total tax is the same; only the split differs.

### How do I remove GST from a price that already includes it?

Choose **Remove GST** and enter the price including GST. The taxable value is price × 100 ÷ (100 + rate). For example, ₹118 including 18% GST has a taxable value of ₹100 and GST of ₹18. Subtracting 18% of ₹118 would give ₹96.76, which is wrong.

### Why can CGST and SGST differ by one paisa?

When you remove GST, the total tax is found first and can be an odd number of paise, such as ₹15.25 on ₹100.00 at 18%. It can't be halved exactly, so CGST is rounded to ₹7.63 and SGST takes the remaining ₹7.62. The two always add up to the total.

### Is this tax advice?

No. The calculator does the arithmetic only. It does not decide which rate, place of supply or exemption applies to your transaction. Check the official notifications or ask a qualified tax professional before you issue an invoice or file a return.

## References

- Central Board of Indirect Taxes and Customs — GST rates (cbic-gst.gov.in)
- Central Goods and Services Tax Act, 2017
- Integrated Goods and Services Tax Act, 2017
