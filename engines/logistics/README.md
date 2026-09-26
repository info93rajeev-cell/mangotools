# engines/logistics

Freight and shipping calculations. Phase 1 starts with carton and cargo volume. All measurements are
decimal strings via `engines/numeric`.

| Operation | Purpose |
|---|---|
| `logistics.cbm.compute@1` | CBM per carton, total CBM and cubic feet from carton dimensions (cm, m, mm or inch) and quantity |
| `logistics.weight.chargeable@1` | Volumetric, actual and chargeable weight (kg) per package and in total, and which one is billed |
| `logistics.container.fit@1` | Volume estimate and a simple axis-aligned loading grid for one carton type inside a 20 ft, 40 ft, 40 ft high-cube or custom container |
| `logistics.pallet.fit@1` | Cartons per layer, layers, cartons per pallet and pallets required, from a simple axis-aligned footprint fit on a Euro, US or custom pallet |

Error messages for every code are in `src/errors.ts`. Golden fixtures live next to each operation in
`src/operations/<operation>/fixtures/` and run through `tests/unit/engine-fixtures.test.ts`. The
axis-aligned orientation search shared by `container-fit` and `pallet-fit` lives in
`src/lib/orientation-grid.ts`.

## Changelog
- 0.4.0 — `logistics.pallet.fit@1` (TASK-003D PR 1). New codes `LOGISTICS_CARTON_EXCEEDS_PALLET_BASE`,
  `LOGISTICS_CARTON_TALLER_THAN_STACK_LIMIT`, `LOGISTICS_PALLET_NOT_LOAD_SAFETY`,
  `LOGISTICS_PALLET_VERIFY_BEFORE_SHIPMENT`, `LOGISTICS_PALLET_DIMENSIONS_VARY` and
  `LOGISTICS_PALLET_MULTIPLE_PALLETS_REQUIRED`. `stackable`, `allowBaseRotation` and `keepUpright` are
  params from this operation's first version (the lesson TASK-003C's `container-fit` learned the hard
  way — see its own changelog entries below). The orientation search itself was extracted from
  `container-fit`'s `grid.ts` into the shared `src/lib/orientation-grid.ts`, with `container-fit`'s own
  fixtures and tests passing unchanged. The default pallet dimensions are commonly published approximate
  figures, not yet verified against a specific source — see `src/operations/pallet-fit/README.md`.
  `logistics.cbm.compute@1`, `logistics.weight.chargeable@1` and `logistics.container.fit@1`'s behaviour
  are unchanged.
- 0.3.2 — addition (TASK-003C PR 2): `logistics.container.fit@1` gains a new output,
  `gridUtilizationPercent` (how much of the usable volume the simple grid occupies), needed to show the
  tool's "estimated utilization" figure. Purely additive — no existing output changes.
- 0.3.1 — fix (TASK-003C PR 2): `logistics.container.fit@1`'s `stackable`, `allowRotation` and
  `keepUpright` moved from input to params. As input fields they could not be driven from any tool's UI
  — this codebase's only mechanism for a boolean toggle is a preset `userOptions` switch, which the
  runtime always sends as params (the same pattern `data.base64.transform@1` uses for `padding`). No
  output changes for any given combination of values. `logistics.cbm.compute@1` and
  `logistics.weight.chargeable@1` are unchanged.
- 0.3.0 — `logistics.container.fit@1` (TASK-003C PR 1). New codes `LOGISTICS_USABLE_PERCENT_OUT_OF_RANGE`,
  `LOGISTICS_CARTON_EXCEEDS_CONTAINER`, `LOGISTICS_CONTAINER_VOLUME_NOT_GUARANTEED`,
  `LOGISTICS_CONTAINER_GRID_NOT_ADVANCED_PLANNING`, `LOGISTICS_CONTAINER_VERIFY_PROFESSIONAL`,
  `LOGISTICS_CONTAINER_OVER_CAPACITY_VOLUME` and `LOGISTICS_CONTAINER_OVER_CAPACITY_GRID`. The default
  container dimensions are commonly published approximate figures, not yet verified against a specific
  source — see `src/operations/container-fit/README.md`. `logistics.cbm.compute@1` and
  `logistics.weight.chargeable@1` are unchanged.
- 0.2.0 — `logistics.weight.chargeable@1` (TASK-003B PR 1). New codes `LOGISTICS_DIVISOR_OUT_OF_RANGE` and
  `LOGISTICS_WEIGHT_TOO_LARGE`. `logistics.cbm.compute@1` is unchanged.
- 0.1.0 — first operation, `logistics.cbm.compute@1` (TASK-003A PR 1).
