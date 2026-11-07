---
lastReviewed: 2026-11-03
example: 009-marketplace-seller-unit-economics
---

## How to use

1. Enter the selling price, whether GST is inside it, and your product cost.
2. Add packaging, shipping, warehousing, labour and overhead per order.
3. Add the marketplace commission, closing fee and the GST charged on those fees, plus advertising and other charges.
4. Enter your return rate, reverse-shipping cost and how much of a returned product is lost.
5. Read the net profit, margin, bank settlement and monthly profit. Set a target profit or margin to see the price that reaches it.

All rates and amounts are entered manually. The calculator does not fetch live marketplace fees.

## Method

- **Revenue without GST:** for a GST-inclusive price, revenue is price × 100 ÷ (100 + GST rate). The GST inside the price belongs to the government and is never profit.
- **Total costs:** product cost, fulfilment, marketplace fees, GST on those fees, advertising and other charges, and returns (return rate × (reverse shipping + damaged share of product cost)).
- **Net profit:** revenue without GST minus total costs. Margin divides it by revenue without GST; markup divides it by product cost.
- **Bank settlement:** price minus marketplace fees, their GST, shipping, and the TCS + TDS the marketplace withholds (default 0.6%: GST TCS 0.5% and income-tax TDS 0.1%).
- **Break-even and target prices:** solved exactly from the same formula, so profit at the break-even price is zero.

Every line is calculated in exact decimals and rounded to paise, so the cost table adds up to the total.

## Worked example

A ₹1,000 GST-inclusive sale (18%) has ₹847.46 revenue without GST. Costs are ₹400 product, ₹145 fulfilment, ₹125 commission and closing fee, ₹22.50 GST on fees, ₹60 advertising and other charges, and ₹13.60 returns. That is ₹766.10, leaving ₹81.36 profit (9.6% margin). The break-even price is ₹888.47.

## FAQ

### Why are net profit and bank settlement different?

Settlement is the cash the marketplace pays you for the order. It still contains your product cost and the GST you owe, and it is reduced by TCS/TDS, which you can later claim back. Profit is what you keep after every cost.

### Does the calculator know marketplace fee rates?

No. Fees vary by platform, category, seller agreement and time. Enter the commission and fees from your seller dashboard.

### Is GST on marketplace fees a cost?

The calculator treats it as a cost. If you are GST-registered and claim input-tax credit on these fees, set the fee GST rate to 0%.

### My price does not include GST. What do I choose?

Choose **No, GST is added on top**: the whole price is then your revenue. To add or remove GST from an amount first, use the [GST Calculator](tool:gst-calculator).

### What happens when product cost is zero?

Profit, payout and margin are still calculated. Markup is omitted because dividing by a zero product cost is undefined.

### Is this accounting or tax advice?

No. The calculator applies the amounts you enter. Confirm fee, tax and accounting treatment with a qualified professional before relying on the result.

## References

- GST TCS by e-commerce operators: section 52, CGST Act 2017 (0.5% since 10 July 2024).
- TDS by e-commerce operators: section 194-O, Income-tax Act (0.1%).
- Hand-verified arithmetic in the linked worked-example fixture.
