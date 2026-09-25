# estimate.pricing.margin@1

Definitions: `profit = price − cost`; `margin % = profit ÷ price × 100`; `markup % = profit ÷ cost × 100`.

| solve | Needs | Formula |
|---|---|---|
| from-cost-and-price | cost, price | — |
| price-from-cost-and-margin | cost, margin % | `price = cost ÷ (1 − m/100)` |
| cost-from-price-and-margin | price, margin % | `cost = price × (1 − m/100)` |
| price-from-cost-and-markup | cost, markup % | `price = cost × (1 + k/100)` |
| cost-from-price-and-markup | price, markup % | `cost = price ÷ (1 + k/100)` |

Money is rounded to 2 decimals first; profit and both percentages are then computed from the rounded
money, so every displayed value reconciles. Losses give negative percentages. Margin must be below
100 %; markup must be above −100 %. Markup is `null` (with a warning) when cost is zero.
