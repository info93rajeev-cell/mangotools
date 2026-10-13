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

This core is not activated in ToolIsland. Costs, withholding, settlement, adjustments and
activation await PR 6A2b; grouped/result presentation awaits 6A2c. Real-operation integration
is later platform evidence. No production preset, tool or page is added here.

## Changelog

- TASK-008L PR 6A2a: added pure fee/slab/resolved-weight adapter core and focused tests.
  Phase-1 private packages use documentation records; changesets are not configured.
