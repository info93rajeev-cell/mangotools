# civil.concrete.quantity@1

Concrete volume for a rectangular slab, beam, column or footing, in cubic metres (m³) and cubic feet
(ft³).

| Output | Formula |
|---|---|
| `baseVolumeM3` | length × width × depth/thickness/height × (unit → m)³ × number of members, before wastage |
| `wastageVolumeM3` | base volume × wastage % |
| `totalVolumeM3` | base volume + wastage volume |
| `totalVolumeFt3` | exact total volume × 35.3146667 |

Units (`unit` input, one unit for all three dimensions), with exact factors:

| Unit | 1 unit in metres | 1 cubed unit in m³ |
|---|---|---|
| `mm` | 0.001 | 0.000000001 |
| `cm` | 0.01 | 0.000001 |
| `m` | 1 | 1 |
| `in` | 0.0254 (international inch, 1959) | 0.000016387064 |
| `ft` | 0.3048 (international foot, 1959) | 0.028316846592 |

**Member type** (`general`, `slab`, `beam`, `column`, `footing`) does not change the formula — every
type is the same rectangular-prism volume, length × width × depth/thickness/height. It is carried
through to the output and the preset's field labels only, so the working steps and content can refer to
the member type the user actually selected.

**Rounding:** everything stays exact until the end. Each output is rounded once, from its own exact
value, to `params.decimals` (default 3) with `params.rounding` (default half-up), matching
`logistics.cbm.compute@1`'s own "exact first, round once" rule exactly. The total is never calculated
from an already-rounded value.

**Wastage:** a percentage from 0 to 50 (0 by default — no wastage added unless the user sets one), with
at most 2 decimal places. A value above 50% is rejected with `CIVIL_WASTAGE_OUT_OF_RANGE`, since it
almost certainly signals a mistake rather than a real site wastage rate.

**Validation:**
- Dimensions are required, greater than zero, with at most 3 decimal places.
- Member count is a required whole number from 1 to 1,000,000 ("12.0" is accepted as 12).
- Wastage % is required, from 0 to 50, with at most 2 decimal places.
- If any dimension, converted to metres, exceeds 100 m, the result carries the warning
  `CIVIL_DIMENSION_UNREALISTIC` — a soft sanity check for a likely unit-confusion mistake (for example,
  typing metres when centimetres were meant), not a hard error, since a real member this large is
  implausible but not impossible to describe.
- Every successful result carries five standing estimation-aid warnings (`CIVIL_ESTIMATION_AID_ONLY`,
  `CIVIL_VERIFY_BEFORE_CONSTRUCTION`, `CIVIL_LOCAL_PRACTICE_VARIES`, `CIVIL_NOT_PROFESSIONAL_REPLACEMENT`,
  `CIVIL_VOLUME_ONLY`), unconditionally, matching `logistics.container.fit@1`'s own standing-warning
  precedent.

Working step formula keys (templates are supplied by the preset): `concrete.memberVolume`,
`concrete.baseVolume`, `concrete.wastageVolume`, `concrete.totalVolume`, `concrete.totalVolumeFt3`.

**Out of scope for this operation** (see `tasks/TASK-006A-QUANTITY-SURVEY-CIVIL-TOOLS-PLANNER.md`):
structural design, reinforcement design, mix design, cement/sand/aggregate material split, cost
estimation, BOQ export, PDF report, multi-row project schedule, saved projects.
