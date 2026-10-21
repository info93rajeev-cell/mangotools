# engines/logistics

Freight and shipping calculations. Phase 1 starts with carton and cargo volume. All measurements are
decimal strings via `engines/numeric`.

| Operation | Purpose |
|---|---|
| `logistics.cbm.shipment@1` | Ordered exact volume, pieces and optional weight coverage for 1-50 package types, including feet |
| `logistics.cbm.compute@1` | CBM per carton, total CBM and cubic feet from carton dimensions (cm, m, mm or inch) and quantity |
| `logistics.weight.chargeable@1` | Volumetric, actual and chargeable weight (kg) per package and in total, and which one is billed |
| `logistics.container.fit@1` | Volume estimate and a simple axis-aligned loading grid for one carton type inside a 20 ft, 40 ft, 40 ft high-cube or custom container |
| `logistics.container.load@1` | Actual axis-aligned placement of one or more package types into identical 20 ft, 40 ft, 40 ft high-cube or custom containers: loaded and unloaded pieces, containers required, utilization and the placement for a viewer |
| `logistics.cost.estimate@1` | Shared freight-cost estimate from the user's own rate: per m³ or per container, with an optional minimum and other charges |
| `logistics.pallet.fit@1` | Cartons per layer, layers, cartons per pallet and pallets required, from a simple axis-aligned footprint fit on a Euro, US or custom pallet |

Error messages for every code are in `src/errors.ts`. Golden fixtures live next to each operation in
`src/operations/<operation>/fixtures/` and run through `tests/unit/engine-fixtures.test.ts`. The
axis-aligned orientation search shared by `container-fit` and `pallet-fit` lives in
`src/lib/orientation-grid.ts`.

## Changelog
- 0.7.0 — `logistics.container.load@1`: deterministic block-building placement of up to 50 package
  types (mm, cm, m, in, ft; kg, g, lb) into as many identical containers as needed (up to 20), with
  payload, stack-height, rotation, keep-upright and stackable constraints. Geometry is exact bigint
  arithmetic; every piece is inside the container, never overlaps and is fully supported. Outputs
  per-package allocation, per-container utilization and the block coordinates a viewer can draw.
  No cost: the shared `logistics.cost.estimate@1` is a separate operation. New codes for the
  package, payload and planning notices. `logistics.container.fit@1` is unchanged.
- 0.5.1 — `logistics.cost.estimate@1`, the shared Logistics freight-cost model (founder-approved
  rate bases `per-cbm` and `per-container`; per-kg and per-pallet are out of scope; Phase 1
  currencies INR, USD, EUR, GBP and AED, never converted). The formula and its notices live once in
  `src/lib/freight-cost.ts` (`max(quantity × rate, minimum) + other charges`, exact decimals, each
  output rounded once) so other Logistics operations reuse it rather than re-implementing it.
  New codes `LOGISTICS_AMOUNT_NEGATIVE`, `LOGISTICS_AMOUNT_TOO_LARGE`,
  `LOGISTICS_RATE_QUANTITY_NOT_POSITIVE`, `LOGISTICS_CONTAINER_COUNT_NOT_WHOLE`,
  `LOGISTICS_RATE_QUANTITY_TOO_LARGE`, `LOGISTICS_COST_USER_RATE` and
  `LOGISTICS_COST_MINIMUM_APPLIED`. Existing operations are unchanged.
- 0.5.0 - add `logistics.cbm.shipment@1` with bounded ordered package rows, exact CBM/CFT
  aggregation, optional kg/g/lb packed weights, explicit weight coverage and typed row errors.
  Shipment feet support is isolated; legacy CBM, weight, container and pallet contracts are unchanged.
- 0.4.5 — `logistics.container.fit@1` accepts optional `decimalPlaces` metadata (`2`, `3` or `4`)
  for continuous result presentation while preserving exact integer counts and working values.
  Converted carton and custom-container dimensions may retain the shared converter's 12 decimal
  places and are normalized at that precision before floor-based fit calculations. Legacy calls
  without metadata retain the original three-place input and output behaviour. Standing planning
  notices retain their codes and are tagged as informational metadata for closed-notes presentation.
- 0.4.4 — `logistics.pallet.fit@1` accepts optional `decimalPlaces` metadata (`2`, `3` or `4`)
  for continuous result presentation while preserving exact integer counts and working values.
  Converted carton, custom-pallet and stack-height values may retain the shared converter's 12
  decimal places and are normalized at that precision before floor-based fit calculations, so
  recurring conversion residue cannot change a boundary count. Legacy calls without metadata retain
  the original three-place input and output behaviour. Existing pallet planning notices retain their
  codes and are tagged as informational metadata for the compact closed-notes presentation.
- 0.4.3 — `logistics.weight.chargeable@1` accepts optional `decimalPlaces` metadata (`2`, `3` or
  `4`) for decimal result presentation while preserving exact working values. Converted dimensions
  and weights may retain the shared form converter's 12 decimal places; legacy calls without
  metadata retain the original three-place input limit and output behaviour.
- 0.4.2 — `logistics.cbm.compute@1` accepts optional `decimalPlaces` metadata (`2`, `3` or `4`)
  for decimal result presentation while preserving exact working values. Converted dimensions may
  retain the shared form converter's 12 decimal places; legacy calls without metadata retain the
  original three-place input limit and output behaviour.
- 0.4.1 — addition (TASK-003D PR 2): `logistics.pallet.fit@1`'s `pf.layers` working step gains a
  `cartonHeightOnAxis` variable, and `pf.usedArea` gains a `cartonsPerLayer` variable, so the tool's
  preset can write a working-step sentence that actually explains the arithmetic. Working-step
  `variables` are a free-form map, not part of the output schema, so this changes no output field.
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
