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
the same operation, retain generic preparation. That exact id also selects a bounded result
view: profit is primary, estimated settlement prominent, ratios/break-even compact, and
the fee table and supporting totals closed initially. Values come only from engine output;
null metrics show unavailable/indeterminate text and break-even reasons use engine warnings.
The 20-row fee table uses responsive two-column rows with native table headers. Real-operation/
browser integration remains PR 6C evidence. No production preset, tool or page is added here.

## Changelog

- File tools enforce existing preset required-number rules before worker dispatch. A missing
  active numeric field returns `INVALID_INPUT` with its field path; optional blanks and explicit
  zero/false remain unchanged. Existing engine-specific text validation/messages are retained (#189).

- Shared header: below 360 px, place the full wordmark above navigation/actions and
  anchor the Tools dropdown within the viewport. Existing controls, focus space and
  wider layouts are retained without horizontal overflow clipping.
- TASK-008L saved-preset hydration: render an empty, storage-free initial list on server
  and client, then refresh through the existing preset store after mount so persisted
  options enable the native selector. Storage, load and reset semantics are unchanged.
- TASK-008L production prerequisites: exact-preset configuration notices near Amazon results;
  canonical errors resolve through emitted fee/adjustment ids to existing form/row controls,
  reopening only the owning disclosure and focusing correction without changing financial values.
- TASK-008L collapse fix: configured financial values survive section collapse/expand;
  the adapter projects only the five disclosure switches open for request building,
  without changing form state, financial defaults or generic runtime visibility rules.
- TASK-008L PR 6A2c: added bounded profit/settlement/metrics, nullable warning reasons,
  fee table and detailed breakdown; existing working disclosure reused, other presets unchanged.
- TASK-008L PR 6A2b2: added exact-id ToolIsland activation through the existing runtime
  preparation hook and focused wiring/lifecycle tests; no result presentation or public tool.
- TASK-008L PR 6A2b1: added seller costs, withholding, settlement and scenario-adjustment
  shaping with pure tests and an advanced fixture; no activation or result presentation.
- TASK-008L PR 6A2a: added pure fee/slab/resolved-weight adapter core and focused tests.
  Phase-1 private packages use documentation records; changesets are not configured.
