# estimate.seller.profitability@1

Calculates seller economics from already-resolved monetary inputs. The operation contains no
marketplace, fee-table, tax-table or seller-tier knowledge.

Money inputs accept at most two decimal places and are rounded to two decimals using the selected
`half-up` (default) or `half-even` mode. Percentages are calculated from the rounded money values so
the displayed results reconcile.

```text
totalEconomicCost = productCost + marketplaceFees + shippingLogistics + sellerExpenses
  + expectedReturnRtoCost + nonRecoverableTaxCost
economicProfit = grossSellingPrice - totalEconomicCost
totalSettlementDeductions = marketplaceFees + shippingLogistics + settlementOnlyDeductions
cashSettlement = grossSellingPrice - totalSettlementDeductions
profitMarginPercent = economicProfit / grossSellingPrice * 100
markupPercent = economicProfit / productCost * 100
```

`settlementOnlyDeductions` affect cash settlement only; they do not reduce economic profit. When
product cost is zero, all other outputs remain available, `markupPercent` is `null`, and the result
includes `ESTIMATE_MARKUP_UNDEFINED`.
