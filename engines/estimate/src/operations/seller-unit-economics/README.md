# estimate.seller.unit-economics@1

One product's unit economics for a seller: profit, margin, markup, marketplace payout, monthly
totals, break-even price and the prices that reach a target profit or margin. Used by the Seller
Profitability Calculator.

Every amount and rate is input. The operation knows no marketplace, fee schedule or tax rate.

```text
netRevenue      = sellingPrice × 100 ÷ (100 + gstRate)   (GST-inclusive price)
                = sellingPrice                           (GST-exclusive price)
gstInPrice      = sellingPrice − netRevenue
marketplaceFees = sellingPrice × commission% + referralFee + closingFee + handlingFee
feeGst          = marketplaceFees × feeGstRate%
returnLoss      = returnRate% × (reverseShipping + productCost × damagedLoss%) + expectedReturnCost
totalCosts      = productCost + fulfilment (packaging, shipping, warehousing, labour, overhead)
                + marketplaceFees + feeGst + advertising + other + returnLoss
netProfit       = netRevenue − totalCosts
netMargin%      = netProfit ÷ netRevenue × 100
markup%         = netProfit ÷ productCost × 100           (null when cost is 0)
withholding     = netRevenue × withholding%
cashSettlement  = sellingPrice − marketplaceFees − feeGst − withholding − shippingCost
```

GST inside the price is never revenue. Fee GST is treated as a cost (no input-tax credit).

**Prices solved in closed form.** profit(p) = a·p − F, with a = revenue share − commission% × (1 +
feeGst%) and F every cost that does not move with the price:
break-even = F ÷ a; target profit T → (F + T) ÷ a; target margin m → F ÷ (a − m × revenue share).
Each is `null` when the slope is not positive (the price can never get there), and break-even
also adds `ESTIMATE_BREAK_EVEN_NOT_DETERMINABLE`.

Each money line is rounded to paise before it is added, so displayed lines add up to the totals.
Money accepts at most 2 decimals; rates at most 4 and at most 100 %; quantity is 1–10,000.
