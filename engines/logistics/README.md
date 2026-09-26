# engines/logistics

Freight and shipping calculations. Phase 1 starts with carton and cargo volume. All measurements are
decimal strings via `engines/numeric`.

| Operation | Purpose |
|---|---|
| `logistics.cbm.compute@1` | CBM per carton, total CBM and cubic feet from carton dimensions (cm, m, mm or inch) and quantity |
| `logistics.weight.chargeable@1` | Volumetric, actual and chargeable weight (kg) per package and in total, and which one is billed |
| `logistics.container.fit@1` | Volume estimate and a simple axis-aligned loading grid for one carton type inside a 20 ft, 40 ft, 40 ft high-cube or custom container |

Error messages for every code are in `src/errors.ts`. Golden fixtures live next to each operation in
`src/operations/<operation>/fixtures/` and run through `tests/unit/engine-fixtures.test.ts`.

## Changelog
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
