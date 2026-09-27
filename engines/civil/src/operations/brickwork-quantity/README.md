# civil.brickwork.quantity@1

Estimated brick count and brickwork volume for a rectangular wall, in cubic metres (m³) and cubic feet
(ft³), from wall dimensions, brick dimensions, an opening deduction, a mortar joint thickness, and a
wastage %.

| Output | Formula |
|---|---|
| `grossWallAreaM2` | wall length × wall height × (unit → m)² × number of walls |
| `openingDeductionAreaM2` | opening area (in the wall unit's own squared area) × number of walls |
| `netWallAreaM2` | gross wall area − opening deduction area |
| `brickworkVolumeM3` | net wall area × wall thickness |
| `effectiveBrickVolumeM3` | (brick length + mortar) × (brick width + mortar) × (brick height + mortar), each converted to metres |
| `estimatedBrickCount` | brickwork volume ÷ effective brick volume |
| `wastageBricks` | estimated brick count × wastage % |
| `totalBricks` | estimated brick count + wastage bricks |

Wall dimensions and brick dimensions each pick their own unit (`unit` and `brickUnit`), since a wall is
commonly measured in metres while a brick is commonly measured in millimetres. Units (with exact metre
factors): `mm` 0.001, `cm` 0.01, `m` 1, `in` 0.0254 (international inch, 1959), `ft` 0.3048 (international
foot, 1959).

**Opening area** is entered in the wall unit's own squared area (for example, m² if `unit` is `m`, or ft²
if `unit` is `ft`) and is deducted once per wall, before the wall count multiplies it — matching how the
wall's own length and height are also per-wall figures. An opening area larger than one wall's own gross
area is rejected with `CIVIL_OPENING_EXCEEDS_WALL_AREA`, since it cannot describe a real wall.

**Mortar joint thickness** is entered directly in millimetres (`mortarJointMm`, default 10, may be 0 for a
dry/no-mortar calculation) and is added to all three brick dimensions before computing the effective brick
volume — the common simplified assumption most published brick-quantity calculators use, not a precise
model of coursing or bond pattern.

**Brick count is shown as an exact decimal, not rounded up to a whole brick** — matching this platform's
"exact math, rounded only for display" convention used everywhere else (e.g. `logistics.cbm.compute@1`).
In real-world use, round the total up to the next whole brick when ordering material; the content page
states this explicitly.

**Rounding:** everything stays exact until the end. Each output is rounded once, from its own exact value,
to `params.decimals` (default 3) with `params.rounding` (default half-up), matching every other operation
in this engine.

**Validation:**
- Wall and brick dimensions are required, greater than zero, with at most 3 decimal places.
- Wall count is a required whole number from 1 to 1,000,000.
- Mortar joint thickness and opening area are required but may be zero, with at most 3 decimal places
  (`CIVIL_NOT_NEGATIVE` if negative).
- Wastage % is required, from 0 to 50 (`CIVIL_WASTAGE_OUT_OF_RANGE` otherwise), reusing
  `civil.concrete.quantity@1`'s own wastage code and range, since it is the same concept.
- Opening area greater than one wall's own gross area is rejected with `CIVIL_OPENING_EXCEEDS_WALL_AREA`.
- If any wall dimension, converted to metres, exceeds 100 m, the result carries the warning
  `CIVIL_DIMENSION_UNREALISTIC` — a soft sanity check, not a hard error. This check is not applied to
  brick dimensions, which are always small.
- Every successful result carries five standing estimation-aid warnings (`CIVIL_ESTIMATION_AID_ONLY`,
  `CIVIL_VERIFY_BRICKWORK_BEFORE_CONSTRUCTION`, `CIVIL_BRICKWORK_CONDITIONS_VARY`,
  `CIVIL_NOT_PROFESSIONAL_REPLACEMENT_MASON`, `CIVIL_BRICKWORK_SCOPE_LIMIT`), unconditionally — distinct
  wording from `civil.concrete.quantity@1`'s and `civil.excavation.volume@1`'s own standing warnings.

Working step formula keys (templates are supplied by the preset): `brickwork.grossAreaPerWall`,
`brickwork.grossWallArea`, `brickwork.openingDeduction`, `brickwork.netWallArea`, `brickwork.volume`,
`brickwork.brickVolume`, `brickwork.brickCount`, `brickwork.wastageBricks`, `brickwork.totalBricks`.

**Out of scope for this operation** (see the TASK-006D brief): structural design, reinforcement, labour
cost, cement/sand mortar material breakup, BOQ export, PDF report, final billing quantity, multiple
distinct opening rows (v1 uses one total opening-area deduction field).
