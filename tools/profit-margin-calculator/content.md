---
lastReviewed: 2026-10-09
example: 007-seller-costs-and-settlement
---

## How to use

1. Enter the selling price and product cost for one sale.
2. Open **Seller / marketplace costs** to include fees, shipping, operating expenses, expected return/RTO cost or non-recoverable tax.
3. Open **Settlement deductions** to include recoverable cash-flow deductions such as TCS or TDS.
4. Compare economic profit with the expected cash settlement. Copy or print the result if needed.

All rates and amounts are entered manually. The calculator does not import products or fetch live marketplace fees.

## Method

- Total economic cost is product cost plus marketplace fees, shipping/logistics, seller expenses, expected return/RTO cost and non-recoverable tax cost.
- Economic profit is selling price minus total economic cost.
- Cash settlement is selling price minus marketplace fees, shipping/logistics and settlement-only deductions.
- Profit margin compares economic profit with selling price. Markup compares economic profit with product cost.

Settlement-only deductions reduce expected cash payout but do not reduce economic profit. TCS/TDS-style deductions are not automatically treated as business expenses.

## Worked example

A ₹1,000 sale has ₹500 product cost, ₹100 marketplace fees, ₹50 shipping, ₹25 seller expenses and a ₹20 settlement-only deduction. Economic profit is ₹325, while expected cash settlement is ₹830 because the settlement-only deduction affects payout, not profit.

## FAQ

### Why are economic profit and cash settlement different?

Economic profit subtracts economic costs. Cash settlement shows the expected payout after marketplace, logistics and settlement-only deductions. A recoverable deduction can reduce today’s payout without reducing profit.

### Does the calculator know marketplace fee rates?

No. Marketplace fees vary by platform, category, seller agreement and time. Enter the total fee amount you have already resolved.

### How should I enter return or RTO cost?

Enter a probability-adjusted expected amount for the sale. Do not enter a platform-wide return rate unless you have already converted it into an expected monetary cost.

### What happens when product cost is zero?

Profit, payout and margin are still calculated. Markup is omitted because dividing by a zero product cost is undefined.

### Does this include GST?

Enter selling price and costs on a consistent tax basis. Use the [GST Calculator](tool:gst-calculator) to add or remove GST before comparing the amounts.

### Is this accounting or tax advice?

No. The calculator applies the amounts you enter. Confirm fee, tax and accounting treatment with a qualified professional before relying on the result.

## References

- TASK-008B approved deterministic seller-profitability formulas.
- Hand-verified arithmetic in the linked worked-example fixture.
