# logistics.cbm.compute@1

Carton and cargo volume in cubic metres (CBM) and cubic feet (CFT).

| Output | Formula |
|---|---|
| `cbmPerCarton` | length × width × height × (unit → m)³ |
| `totalCbm` | exact CBM per carton × quantity |
| `cftPerCarton` | exact CBM per carton × 35.3146667 |
| `totalCft` | exact total CBM × 35.3146667 |

Units (`unit` input, one unit for all three dimensions), with exact factors:

| Unit | 1 unit in metres | 1 cubed unit in m³ |
|---|---|---|
| `m` | 1 | 1 |
| `cm` | 0.01 | 0.000001 |
| `mm` | 0.001 | 0.000000001 |
| `in` | 0.0254 (international inch, 1959) | 0.000016387064 |

**Rounding:** everything stays exact until the end. Each output is rounded once, from its own exact
value, to `params.decimals` (default 3) with `params.rounding` (default half-up). The total is never
calculated from the rounded per-carton value. For example, 25 × 25 × 20 cm is 0.0125 m³, shown as 0.013,
and 100 cartons give 1.250 m³, not 1.300. The `working` steps carry the exact values.

**Cubic feet:** 35.3146667 ft³ per m³, as decided for Phase 1. The exact factor is 35.314666721…; the
difference is about 6 × 10⁻⁸ %.

**Validation:**
- Dimensions are required, greater than zero, with at most 3 decimal places.
- Quantity is a required whole number from 1 to 1,000,000 ("12.0" is accepted as 12).
- If the per-carton volume rounds to zero at the chosen precision, the result carries the warning
  `LOGISTICS_VOLUME_ROUNDS_TO_ZERO`.

Working step formula keys (templates are supplied by the preset): `cbm.perCarton`, `cbm.total`,
`cbm.cftPerCarton`, `cbm.cftTotal`.
