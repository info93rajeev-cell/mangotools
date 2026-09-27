# civil.excavation.volume@1

Excavation/earthwork volume for a rectangular pit, trench or footing pit, in cubic metres (m³) and
cubic feet (ft³).

| Output | Formula |
|---|---|
| `neatVolumeM3` | length × width × depth × (unit → m)³ × number of pits/trenches, before bulking |
| `bulkingVolumeM3` | neat volume × bulking/swell % |
| `looseVolumeM3` | neat volume + bulking volume |
| `looseVolumeFt3` | exact loose volume × 35.3146667 |

Units (`unit` input, one unit for all three dimensions), with exact factors:

| Unit | 1 unit in metres | 1 cubed unit in m³ |
|---|---|---|
| `mm` | 0.001 | 0.000000001 |
| `cm` | 0.01 | 0.000001 |
| `m` | 1 | 1 |
| `in` | 0.0254 (international inch, 1959) | 0.000016387064 |
| `ft` | 0.3048 (international foot, 1959) | 0.028316846592 |

**Excavation type** (`general`, `trench`, `footing`) does not change the formula — every type is the same
rectangular-prism volume, length × width × depth. It is carried through to the output and the preset's
field labels only.

**Neat volume vs. loose volume:** "neat" is the volume of the excavation itself, before any allowance for
the excavated soil expanding once dug. "Loose" is the neat volume plus bulking/swell — the figure that
actually matters for estimating how much material (and how many truck loads, though this operation does
not calculate that) the dug soil will occupy once removed.

**Bulking/swell:** a percentage from 0 to 50 (0 by default — no bulking added unless the user sets one),
with at most 2 decimal places. Bulking varies by soil type and moisture content (loose sand bulks less
than dense clay); this is a user-adjustable estimate, not a looked-up soil-specific figure. A value above
50% is rejected with `CIVIL_BULKING_OUT_OF_RANGE`, since it almost certainly signals a mistake.

**Rounding:** everything stays exact until the end. Each output is rounded once, from its own exact value,
to `params.decimals` (default 3) with `params.rounding` (default half-up), matching
`civil.concrete.quantity@1`'s and `logistics.cbm.compute@1`'s own "exact first, round once" rule exactly.

**Validation:**
- Dimensions are required, greater than zero, with at most 3 decimal places.
- Pit/trench count is a required whole number from 1 to 1,000,000 ("12.0" is accepted as 12).
- Bulking % is required, from 0 to 50, with at most 2 decimal places.
- If any dimension, converted to metres, exceeds 100 m, the result carries the warning
  `CIVIL_DIMENSION_UNREALISTIC` — a soft sanity check, not a hard error.
- Every successful result carries six standing estimation-aid warnings (`CIVIL_ESTIMATION_AID_ONLY`,
  `CIVIL_VERIFY_BEFORE_EXCAVATION`, `CIVIL_EXCAVATION_CONDITIONS_VARY`, `CIVIL_BULKING_VARIES`,
  `CIVIL_NOT_PROFESSIONAL_REPLACEMENT_CONTRACTOR`, `CIVIL_EXCAVATION_SCOPE_LIMIT`), unconditionally —
  distinct wording from `civil.concrete.quantity@1`'s own standing warnings, since excavation carries
  different real-world caveats (soil type, side slopes, shoring) than concrete does.

Working step formula keys (templates are supplied by the preset): `excavation.oneVolume`,
`excavation.neatVolume`, `excavation.bulkingVolume`, `excavation.looseVolume`,
`excavation.looseVolumeFt3`.

**Out of scope for this operation** (see `tasks/TASK-006A-QUANTITY-SURVEY-CIVIL-TOOLS-PLANNER.md` and the
TASK-006C brief): side-slope/battered excavation, stepped excavation, irregular excavation shapes,
dewatering, shoring, disposal cost, truck trips, backfill or backfill compaction, cost estimation, BOQ
export, PDF report.
