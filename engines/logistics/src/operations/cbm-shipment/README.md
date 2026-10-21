# logistics.cbm.shipment@1

Pure ordered shipment aggregation for 1–50 rectangular package types. No description, SKU,
filename or UI identity enters this operation. The legacy `logistics.cbm.compute@1` is unchanged.

## Input and validation

Strict input: `packages` (1–50 ordered strict rows), optional `decimalPlaces` (`2`, `3`, `4`).
Rows contain `length`, `width`, `height`, `unit`, `quantity`, optional `weightPerItem`, and
optional `weightUnit`. Measurements and quantities must be strings. Measurement/count fields are
structurally optional so missing input returns the specific logistics error with a row path.
Unsupported enums, wrong types and unknown keys return platform `INVALID_INPUT`.

- Dimensions: positive, units mm/cm/m/in/ft; all three axes of a row use its unit.
- Dimensions and supplied weight: less than 1,000,000,000,000, at most 12 fractional places.
- Every supplied nonblank numeric string: at most 64 characters before decimal parsing.
- Quantity: integer value from 1 through 1,000,000; integral decimal forms such as `12.0` accepted.
- Surrounding whitespace is trimmed; internal spaces, grouping, exponents and nonfinite values fail.
- Missing/whitespace-only weight is unknown, not zero. A supplied weight requires kg/g/lb.
- A weight-unit default without weight is permitted. No negative/zero supplied weight.
- Technical row ceiling only; no commercial quota.

Params: `decimals` integer 0–6 (default 3), `rounding` half-up/half-even (default half-up).
Input `decimalPlaces` overrides displayed precision, including weight. It never changes exact values.

## Exact arithmetic and output

Metre factors: mm 0.001, cm 0.01, m 1, in 0.0254, ft 0.3048.
Kilogram factors: kg 1, g 0.001, lb 0.45359237.
Sources: SI prefixes; international yard and pound agreement (1959). The CFT factor remains the
approved Phase 1 value 35.3146667 from the legacy operation, not the reciprocal rounded anew.

Normalize dimensions to metres, multiply to per-piece volume, multiply by quantity, then sum exact
row totals in input order. Convert exact shipment CBM to CFT. Each displayed value is rounded once;
never sum displayed rows. Arithmetic uses only `@mangotools/engine-numeric`.

Output:

- `rows`: ordered `index`, `quantity`, `cbmPerPieceExact`, `cbmPerPiece`, `totalCbmExact`,
  `totalCbm`, `totalWeightKgExact`, `totalWeightKg`.
- `totalCbmExact`, `totalCbm`, `totalCftExact`, `totalCft`, `totalPieces`.
- `knownPackedWeightKgExact`, `knownPackedWeightKg` (null when all weights unknown).
- `weightCoverage`: none/partial/complete; `weightedPieces`, `weightedRowCount`.
- `working`: row steps first, then shipment steps; numeric variables only.

Exact values are canonical plain decimal strings. Displayed volumes and weights are fixed-point.
Counts are integer strings; only bounded row indices/counts use JavaScript integers.
Partial weight sums only supplied weights and counts the pieces in those rows. Weight never changes
volume. Rows with no weight have null row weights.

## Errors and warnings

First semantic error in input order, then length/width/height/quantity/weight/unit order. Paths use
`packages.<zero-based-index>.<field>`. Existing logistics validation codes are reused; new codes:
`LOGISTICS_VALUE_TOO_LONG`, `LOGISTICS_MEASUREMENT_TOO_LARGE`, `LOGISTICS_WEIGHT_UNIT_REQUIRED`.
Platform `INVALID_PARAMS` handles invalid params. Nothing logs user values or throws for user input.

Rounded-zero per-piece warnings use `packages.<index>`, in row order. A rounded-zero shipment warning
follows at `totalCbm`. All carry `LOGISTICS_VOLUME_ROUNDS_TO_ZERO` and the smallest displayed step.

Working keys: `cbmShipment.perPiece`, `cbmShipment.rowTotal`, `cbmShipment.rowWeight`,
`cbmShipment.total`, `cbmShipment.cft`, `cbmShipment.pieces`, `cbmShipment.knownWeight`.
No templates/prose are embedded in engine outputs. No network, time, randomness or locale formatting.

## Validation evidence

Cited hand-verified fixtures and unit tests cover mixed shipments, all units, exact-before-rounding,
weight coverage, row/precision/count bounds, malformed payloads, stable ordering and warnings.
The generator automatically includes these fixtures in Node/browser-worker determinism checks.
