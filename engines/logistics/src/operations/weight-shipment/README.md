# logistics.weight.shipment@1

Volumetric (dimensional), actual and chargeable weight for a shipment of up to 50 package rows, in kg.
Used by the Volumetric Weight Calculator, which lists several package types in one shipment.

| Output | Formula |
|---|---|
| `rows[i].volumeCm3PerPiece` | length × width × height × (unit → cm)³, exact |
| `rows[i].volumetricTotal` | volume ÷ divisor × quantity |
| `rows[i].actualTotal` | weight per piece × (unit → kg) × quantity |
| `rows[i].chargeableTotal` | the higher of the row's two totals (shown for reference only) |
| `volumetricTotal`, `actualTotal` | sums of the rows, at full precision |
| `chargeableTotal` | the higher of the two **shipment** totals |
| `billedOn` | `volumetric`, `actual`, or `equal` |

**Shipment basis.** The whole consignment is billed on the higher of its total volumetric and total
actual weight (the air-cargo consignment rule). This is usually lower than adding each row's own
chargeable weight; fixture 005 shows the difference. Some couriers charge per piece instead. For
that case, use the row values.

Units, divisor (whole cm³ per kg, 1,000–10,000) and input limits are the same as
`logistics.weight.chargeable@1` and come from its `units.ts`. Every row needs a size, a whole
quantity and a weight above zero. The first invalid value stops the run with a typed error whose
path names the row, for example `packages.1.width`.

**Precision:** multiplication is exact, and division keeps 20 decimal places. Totals are summed
from full-precision row values. Every output is rounded once, to `decimalPlaces` (2, 3 or 4), or
otherwise to `params.decimals` (default 3), with `params.rounding`. `totalVolumeCm3` is exact.
