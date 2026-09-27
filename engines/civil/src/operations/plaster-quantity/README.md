# civil.plaster.quantity@1

Estimated plaster area and volume for a wall, ceiling, or general rectangular surface, in cubic metres
(m³) and cubic feet (ft³), from surface dimensions, plaster thickness, an opening deduction, and a
wastage %.

| Output | Formula |
|---|---|
| `grossAreaM2` | length × second dimension × (unit → m)² × number of surfaces |
| `openingDeductionAreaM2` | opening area (in the surface unit's own squared area) × number of surfaces |
| `netAreaM2` | gross area − opening deduction area |
| `plasterVolumeM3` | net area × plaster thickness |
| `wastageVolumeM3` | plaster volume × wastage % |
| `totalVolumeM3` | plaster volume + wastage volume |

**Surface type** (`wall`, `ceiling`, `general`) does not change the formula — every type is the same
length × second-dimension rectangle. It is carried through to the output and the preset's field labels
only; the second dimension is labelled generically ("second dimension") rather than switching between
"height" and "width" per type, since a wall's second dimension is its height and a ceiling's is its width.

Units (with exact metre factors): `mm` 0.001, `cm` 0.01, `m` 1, `in` 0.0254 (international inch, 1959),
`ft` 0.3048 (international foot, 1959). Opening area is entered in the surface unit's own squared area
(for example m² if `unit` is `m`), matching `civil.brickwork.quantity@1`'s own opening-deduction pattern.
An opening area larger than one surface's own gross area is rejected with
`CIVIL_OPENING_EXCEEDS_SURFACE_AREA`, since it cannot describe a real surface.

**Rounding:** everything stays exact until the end. Each output is rounded once, from its own exact
value, to `params.decimals` (default 3) with `params.rounding` (default half-up), matching every other
operation in this engine.

**Validation:**
- Surface dimensions and plaster thickness are required, greater than zero, with at most 3 decimal
  places.
- Surface count is a required whole number from 1 to 1,000,000.
- Opening area is required but may be zero, with at most 3 decimal places (`CIVIL_NOT_NEGATIVE` if
  negative).
- Wastage % is required, from 0 to 50 (`CIVIL_WASTAGE_OUT_OF_RANGE` otherwise), reusing the same code and
  range as `civil.concrete.quantity@1` and `civil.brickwork.quantity@1`, since it is the same concept.
- Opening area greater than one surface's own gross area is rejected with
  `CIVIL_OPENING_EXCEEDS_SURFACE_AREA`.
- If either surface dimension, converted to metres, exceeds 100 m, the result carries the warning
  `CIVIL_DIMENSION_UNREALISTIC` — a soft sanity check, not a hard error. This check is not applied to
  plaster thickness, which is always small.
- Every successful result carries five standing estimation-aid warnings (`CIVIL_ESTIMATION_AID_ONLY`,
  `CIVIL_VERIFY_PLASTER_BEFORE_CONSTRUCTION`, `CIVIL_PLASTER_CONDITIONS_VARY`,
  `CIVIL_NOT_PROFESSIONAL_REPLACEMENT_MASON`, `CIVIL_PLASTER_SCOPE_LIMIT`), unconditionally.
  `CIVIL_NOT_PROFESSIONAL_REPLACEMENT_MASON` is reused verbatim from `civil.brickwork.quantity@1`, since
  the founder's own required wording for both tools is identical.

Working step formula keys (templates are supplied by the preset): `plaster.grossAreaPerSurface`,
`plaster.grossArea`, `plaster.openingDeduction`, `plaster.netArea`, `plaster.netAreaFt2`,
`plaster.volume`, `plaster.wastageVolume`, `plaster.totalVolume`, `plaster.totalVolumeFt3`.

**Out of scope for this operation** (see the TASK-006E brief): cement/sand material breakup, plaster mix
ratio, labour cost, scaffolding, curing schedule, BOQ export, PDF report, final billing quantity.
