# @mangotools/ui

Shared UI primitives, discovery/layout components and tool archetypes. UI reaches operations
through runtime; UI code and tests do not import engines directly.

## Manual-profitability fee adapter core

`src/toolkit/amazonManualProfitabilityInput.ts` exports
`amazonManualProfitabilityInput(preset, values): Result<ToolRequest>` using the existing
resolved-preset and readonly runtime form-value types. It reuses `buildRequest` for scalar
inputs, params and missing fields, then creates new fee/weight objects. No shared result
or form object is modified. Money/rates/weights remain strings; no calculations or conversions.

Only the five contract-selected fee groups are composed, in referral/closing/weight-handling/
pick-pack/other-service order. Off groups and inactive fields are omitted. GST treatment and
scenario applicability are explicit; there are no numeric marketplace defaults.

Empty required controls, unselected enums, empty active slab lists and no selected scenarios
produce `missing[]` (no scenarios points to the group's `ApplySale` field). Unsupported enums,
invalid flag types, malformed JSON/non-object rows, wrong cell types and incomplete row cells
produce `INVALID_INPUT` with a form-field/row path and no financial values in details.
Strict row decoding is local: the shared codec's fallback/defaulting would conceal invalid
input. Unknown row keys are stripped; no rows are dropped/truncated. Bounds, numeric limits,
precision, overlap and fee calculation remain engine-owned.

Seller costs, TCS/TDS, settlement deductions/credits and the five controlled adjustments
are also shaped from explicit form values. Blank amounts are omitted; explicit zero is
preserved. Withholding bases and adjustment effects/applicability are never inferred.
Ordinary items keep sale/return/RTO/cancellation order; adjustments exclude sale and keep
return/RTO/cancellation order. Empty required controls use `missing[]`; unsupported controls
use `INVALID_INPUT`. Financial validation and unsigned amount rules remain engine-owned.

ToolIsland supplies this adapter to the existing runtime `prepareRequest` hook only for
exact preset id `estimate/amazon.manual-profitability`. Other ids, including those using
the same operation, retain generic preparation. Grouped/result presentation awaits 6A2c;
real-operation/browser integration remains later platform evidence. No production preset,
tool or page is added here.

## Changelog

- TASK-008L PR 6A2b2: added exact-id ToolIsland activation through the existing runtime
  preparation hook and focused wiring/lifecycle tests; no result presentation or public tool.
- TASK-008L PR 6A2b1: added seller costs, withholding, settlement and scenario-adjustment
  shaping with pure tests and an advanced fixture; no activation or result presentation.
- TASK-008L PR 6A2a: added pure fee/slab/resolved-weight adapter core and focused tests.
  Phase-1 private packages use documentation records; changesets are not configured.
