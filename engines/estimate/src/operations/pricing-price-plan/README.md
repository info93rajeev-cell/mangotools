# estimate.pricing.price-plan@1

A selling-price plan for one product, used by the Markup Calculator.

```text
totalCost     = productCost + additionalCost
sellingPrice  = totalCost × (1 + markup% ÷ 100)       (mode from-markup)
              = the given selling price               (mode from-price)
              = totalCost ÷ (1 − targetMargin% ÷ 100)  (mode from-margin)
profit        = sellingPrice − totalCost               (negative is a loss)
markup%       = profit ÷ totalCost × 100               (null when cost is 0)
margin%       = profit ÷ sellingPrice × 100
profitOnQty   = profit × quantity
priceWithGst  = sellingPrice + sellingPrice × gstRate% (GST added on top)
priceForTargetMargin = totalCost ÷ (1 − targetMargin%) (whenever a target margin is given)
```

Money is rounded to paise; markup must be above −100 % and margin below 100 %.
