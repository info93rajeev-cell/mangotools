# engines/civil

Civil and quantity-survey calculations. Phase 1 starts with concrete volume. All measurements are
decimal strings via `engines/numeric`, and — unlike `engines/image` — this engine needs no exception
to the platform's engine-purity or determinism rules: every operation is plain arithmetic, fully
Node-native (`runtimes: ['worker', 'node']`), and a full member of the cross-browser determinism suite
from its first version.

| Operation | Purpose |
|---|---|
| `civil.concrete.quantity@1` | Concrete volume (m³ and ft³) for a rectangular slab, beam, column or footing, from dimensions, member count and wastage % |
| `civil.tile.quantity@1` | Tile count for a rectangular floor or wall, with wastage % and an optional boxes-required calculation |
| `civil.paint.quantity@1` | Paint litres for a rectangular wall, ceiling or surface, from dimensions, opening deduction, coats, coverage per litre and wastage % |

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
