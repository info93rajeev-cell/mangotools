# logistics.weight.chargeable@1

Volumetric (dimensional) weight, actual weight and chargeable weight for one package type, in kg.

| Output | Formula |
|---|---|
| `volumeCm3PerPackage` | length × width × height × (unit → cm)³ |
| `volumetricPerPackage` | volume in cm³ ÷ divisor (cm³ per kg) |
| `actualPerPackage` | weight × (unit → kg) |
| `chargeablePerPackage` | the higher of actual and volumetric |
| `…Total` | the per-package value × quantity |
| `billedOn` | `volumetric`, `actual`, or `equal` when both are the same |

Units, with exact factors:

| Length | 1 cubed unit in cm³ | Weight | 1 unit in kg |
|---|---|---|---|
| `m` | 1,000,000 | `kg` | 1 |
| `cm` | 1 | `g` | 0.001 |
| `mm` | 0.001 | `lb` | 0.45359237 (international pound, 1959) |
| `in` | 16.387064 (1 in = 2.54 cm) | | |

**Divisor:** always cm³ per kg (5000 and 6000 are common). It must be a whole number from 1,000 to
10,000. US divisors in in³ per lb (for example 139 or 166) are different numbers and are not accepted
here.

**Precision:** multiplication is exact, and division keeps 20 decimal places. Every output is rounded
once, from its own full-precision value, to `params.decimals` (default 3) with `params.rounding`
(default half-up). Totals use the full-precision per-package value, never the rounded one. For
example, 1,000 cm³ ÷ 6000 is shown as 0.167 kg, and 3 packages give 0.500 kg, not 0.501. There is no
round-up to 0.5 kg or 1 kg in this version.

**Validation:**
- Dimensions and actual weight are required, greater than zero, with at most 3 decimal places.
- Actual weight is at most 100,000 kg per package after conversion.
- Quantity follows the CBM rule: a whole number from 1 to 1,000,000.

**Working step formula keys** (the preset supplies the templates):
- `vw.volume`
- `vw.volumetric`
- `vw.actual` (kg) or `vw.actual.convert` (g, lb)
- `vw.chargeable.volumetric`, `vw.chargeable.actual` or `vw.chargeable.equal`. The key tells the preset
  which sentence to show, for example "volumetric weight is used for billing".
- `vw.total.volumetric`, `vw.total.actual`, `vw.total.chargeable`

Step values carry full precision.
