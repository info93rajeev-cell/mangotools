# engines/civil

Civil and quantity-survey calculations. Phase 1 starts with concrete volume. All measurements are
decimal strings via `engines/numeric`, and — unlike `engines/image` — this engine needs no exception
to the platform's engine-purity or determinism rules: every operation is plain arithmetic, fully
Node-native (`runtimes: ['worker', 'node']`), and a full member of the cross-browser determinism suite
from its first version.

| Operation | Purpose |
|---|---|
| `civil.concrete.quantity@1` | Concrete volume (m³ and ft³) for a rectangular slab, beam, column or footing, from dimensions, member count and wastage % |
| `civil.excavation.volume@1` | Excavation bank volume, optional bulking and estimated truck loads from rectangular dimensions |
| `civil.brickwork.quantity@1` | Brickwork volume method with mortar allowance, wastage and whole-brick purchasing quantity |
| `civil.plaster.quantity@1` | Plaster area and application volume with the original density/bag-size estimating model |
| `civil.tile.quantity@1` | Tile count for a rectangular floor or wall, with wastage % and an optional boxes-required calculation |
| `civil.paint.quantity@1` | Paint litres for a rectangular wall, ceiling or surface, from dimensions, opening deduction, coats, coverage per litre and wastage % |
| `civil.concrete.quantity@2` | Net geometric volume (rectangular members or circular columns), editable overage → order volume (m³/ft³/yd³), optional bags from a stated yield |
| `civil.excavation.volume@2` | Rectangular or circular bank volume shown on its own, optional editable swell → loose volume, optional truck loads from a user-supplied usable truck volume |
| `civil.brickwork.quantity@2` | Face-area brick count: net wall area (repeatable openings) ÷ ((brick length + joint) × (brick height + joint)) × skins, + wastage, rounded up |
| `civil.plaster.quantity@2` | Net area (repeatable openings) × thickness = application volume, + wastage, optional bags only from the product's own yield or coverage |
| `civil.tile.quantity@2` | Net area (dimensions or direct area, repeatable deductions) ÷ tile face area, + wastage once, rounded up; boxes by pieces or coverage |
| `civil.paint.quantity@2` | Room walls (± ceiling) or a surface, repeatable openings, coats, coverage in m²/L or ft²/US gal, + wastage; optional whole containers |

The `@1` operations stay registered unchanged (their golden fixtures remain truth); every tool preset now
runs the `@2` operation. Shared `@2` building blocks live in `src/lib/`: `openings.ts` (repeatable
width × height × quantity rows with an optional semantic door/window/other type), `present.ts`
(per-result-type display precision and whole-unit `ceilWhole`), `quantities.ts` (exact unit
conversions and single-division allowance ratios),
`notices.ts` (notice severities) and `units-v2.ts` (exact constants).

Error messages for every code are in `src/errors.ts`. Golden fixtures live next to each operation in
`src/operations/<operation>/fixtures/` and run through `tests/unit/engine-fixtures.test.ts`.

This engine calculates **quantities only**. It never adds cost, price, currency, material-split
(cement/sand/aggregate), reinforcement, mix-design or structural-adequacy logic — see
`tasks/TASK-006A-QUANTITY-SURVEY-CIVIL-TOOLS-PLANNER.md` for the roadmap of what is deliberately kept
out of this wave.

**Naming note versus the TASK-006A plan:** the plan's own §6 error table used operation-scoped codes
(`CIVIL_CONCRETE_...`) as a placeholder, flagged there as "to be finalized during implementation... matching
every existing engine's pattern." Every existing engine (`LOGISTICS_`, `IMAGE_`, `PDF_`, `ESTIMATE_`) uses
one engine-wide prefix rather than a per-operation one, so this engine's codes are `CIVIL_...`, matching
that established convention exactly (this engine has one operation today; a future civil operation shares
the same prefix, exactly as `logistics.cbm.compute@1` and `logistics.pallet.fit@1` already do).

**Category note:** `taxonomy/categories.yaml` already had an empty `construction` category scaffolded
since the platform's first foundation commit (TASK-001) — the TASK-006A plan did not find it and assumed
a brand-new category was needed. This wave fills that pre-existing `construction` slot (matching exactly
how the `pdf` and `media` categories were filled by their own waves) and renames its display name to
"Civil & Construction," the name the founder approved, rather than creating a second, duplicate category.

## Changelog
- 0.11.0 — `civil.excavation.volume@2` adds Circular pit / shaft geometry using
  `π × (diameter² ÷ 4) × depth × quantity`. Existing rectangular pit, trench and footing inputs retain
  their original formula and outputs; swell, truck loads and decimal presentation share the same exact
  downstream calculation path.
- 0.10.0 — `civil.excavation.volume@2` accepts optional `decimalPlaces` metadata (`2`, `3` or `4`)
  from the Excavation preset. It controls the swell percentage's accepted input scale and decimal
  volume presentation only; exact bank/loose-volume arithmetic and whole truck-load calculation are
  unchanged. Omitting the field keeps the historical engine validation and presentation contract.
- 0.9.0 — `civil.concrete.quantity@2` accepts optional `decimalPlaces` metadata (`2`, `3` or `4`)
  from the Concrete preset. It controls the overage percentage's accepted input scale and decimal
  quantity presentation only; exact arithmetic and formulas are unchanged. Omitting the field keeps
  the historical engine validation and per-result presentation contract.
- 0.8.0 — Civil `@2` opening rows accept and preserve an optional semantic `type` of `door`,
  `window` or `other`. Untyped historical rows remain valid and generic. The metadata does not alter
  the existing width × height × quantity deduction, and no `@1` contract changes.
- 0.7.0 — `@2` of all six operations (civil reconciliation pass). Purchase quantities (bricks, tiles,
  bags, boxes, containers, truck loads) are whole numbers rounded up from one exact division, so an
  exactly whole quantity is never pushed up by intermediate rounding. Results use result-type precision
  (areas 2 dp, m³ 3 dp, ft³/yd³/litres/gallons 2 dp, calculated counts 2 dp) instead of one global
  `params.decimals`; `@2` operations take no display params. Imperial outputs use exact divisions by
  0.09290304 m²/ft², 0.028316846592 m³/ft³ and 0.764554857984 m³/yd³ instead of the rounded
  multipliers used in `@1`. Measurements accept up to 12 decimal places so UI unit conversions stay
  exact enough. Every notice carries a `severity` detail: `assumption` (editable estimating/product
  assumptions that shaped the result), `info` (the standing estimation-aid wording, still on every
  result) or none (a real warning). Brickwork switches from the volume method (which added the joint to
  the wall-thickness direction too and over-counted single-skin walls) to the face-area method with an
  explicit number of skins. Tile applies wastage once to the unrounded base count instead of rounding
  twice. Plaster never assumes a density or bag size. No new dependencies.
- 0.6.0 — `civil.paint.quantity@1` added (TASK-006G). Unlike every other operation in this engine,
  area/coverage/litres math stays entirely in the selected input unit's own squared form rather than
  normalizing to metres first, because coverage per litre is only meaningful in the unit it was entered
  in (a metric-only conversion would silently corrupt a feet-based coverage figure). The metre
  conversion table is kept solely for the soft unrealistic-dimension sanity check. Paint litres are
  displayed rounded to 2 decimal places, half-up — chosen over an upward-rounding scheme because paint,
  unlike whole tiles or boxes, is typically purchasable and measurable in fractional litre amounts.
- 0.5.0 — `civil.tile.quantity@1` added (TASK-006F). Base tile count is the surface-to-tile area
  ratio rounded up; total tiles is that already-rounded base count × (1 + wastage%), rounded up again
  — the platform's documented choice between the two possible rounding orders, picked so every number
  in the result is one a user could recompute by hand from the number before it. Tiles per box is
  genuinely optional: left blank, the boxes-required output is simply absent rather than defaulted.
- 0.1.0 — first operation, `civil.concrete.quantity@1` (TASK-006B).
