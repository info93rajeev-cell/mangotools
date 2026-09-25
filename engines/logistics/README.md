# engines/logistics

Freight and shipping calculations. Phase 1 starts with carton and cargo volume. All measurements are
decimal strings via `engines/numeric`.

| Operation | Purpose |
|---|---|
| `logistics.cbm.compute@1` | CBM per carton, total CBM and cubic feet from carton dimensions (cm, m, mm or inch) and quantity |
| `logistics.weight.chargeable@1` | Volumetric, actual and chargeable weight (kg) per package and in total, and which one is billed |

Error messages for every code are in `src/errors.ts`. Golden fixtures live next to each operation in
`src/operations/<operation>/fixtures/` and run through `tests/unit/engine-fixtures.test.ts`.

## Changelog
- 0.2.0 — `logistics.weight.chargeable@1` (TASK-003B PR 1). New codes `LOGISTICS_DIVISOR_OUT_OF_RANGE` and
  `LOGISTICS_WEIGHT_TOO_LARGE`. `logistics.cbm.compute@1` is unchanged.
- 0.1.0 — first operation, `logistics.cbm.compute@1` (TASK-003A PR 1).
