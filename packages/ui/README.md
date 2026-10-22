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

- #198: add bounded result tables for the two merged Survey operations using ScrollableItemTable.
  Callers provide `survey.section.*` / `survey.column.*` strings and existing engine check labels.
  Quantities use three-place display, with exact raw values retained in cell titles; opaque labels,
  unavailable values and tiny nonzero closure remain distinct. Existing WorkingSteps stays separate.
  Test-only browser interception exercises actual public Survey exports, not a shipped tool/route.
  Archetype-C activation, request/error focus and publication are a separate bounded follow-up.

- #195: add bounded, unactivated Survey form bindings for existing Rise & Fall and raw Traverse.
  Preserve decimal strings, binary64 geometry, blank row indices and opaque labels; samples reuse
  existing UI-only state handling. No engine imports or arithmetic in UI. Workbench rendering,
  archetype C activation and tool publication are separate prerequisites, not shipped here.

- File tools now honor the existing `ui.collapseNotices: true` opt-in using the shared,
  closed Important notes disclosure. Notices are preserved; errors and default/false tools
  keep their existing visible alert behavior (#189).

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

## CBM shipment workspace (#212)

The lazy `logistics/cbm-shipment` UI supports ordered package rows, exact shipment/cost worker calls,
optional weight coverage, dimensional views, composition and current-only copy/print. It remains
inactive until tools issue #213 binds that preset. The legacy `logistics/cbm` renderer is unchanged.
Descriptions stay in browser memory and are stripped from numeric worker payloads. Shipment and cost
revisions reject late responses, including after disabling cost or disposing the controller.
No import, placement, persistence or new dependency. Support content remains in the page's existing
full-width collapsed area.

## CBM section ownership preparation (#220)

The #220 refactor changes section boundaries only; existing rendering, state, text, calculations,
copy and print behavior are preserved. It does not implement the #219 founder visual correction.

| Workstream | Components | Styles (desktop and mobile) |
| --- | --- | --- |
| A: shell | `CbmShipmentLayout.tsx` | `cbmWorkspace.module.css` |
| A: worksheet | `CbmPackageWorksheet.tsx` | `cbmWorksheet.module.css` |
| A: options, inputs, notes | `CbmOptionsPanel.tsx`, `CbmCostPanel.tsx`, `CbmNotesPanel.tsx` | `cbmInputs.module.css` |
| B: visualization and package selection | `CbmShipmentVisualization.tsx` | `cbmVisual.module.css` |
| B: summary, composition, cost result, copy/print | `CbmShipmentResults.tsx`, `CbmCostResult.tsx`, `CbmOutputActions.tsx` | `cbmResults.module.css` |

Stable shell integration: `CbmVisualizationPanel` accepts `packages`; results and cost result accept
`state`; output actions accept `summary` and `enabled`; `CbmPrintReport` accepts `summary` and remains
outside the screen workspace so the existing print visibility rules continue to work. Cost result
owns its always-present slot; output actions own copy feedback; visualization owns package/view selection.
These section roots preserve their prior DOM placement, mobile order and accessible names.

Keep `data-cbm-workspace`, `data-cbm-total`, `data-package-row`, labels, region names and control IDs
stable. Each section's module owns its responsive rules; do not style another section through its
module classes. The shell owns column structure and the screen-workspace print hide rule.

Both workstreams treat the controller, model, hook, composition/copy calculations, shared
`cbmStrings.ts`, lazy wrapper and ToolIsland routing as frozen. New section-specific strings should
live in separately owned string files; coordinate any necessary shared-contract change before editing.
The UI README ownership contract also remains fixed during parallel visual work.
