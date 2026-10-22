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

## CBM founder reference composition (#219)

The approved founder image is the visual contract for the active CBM workbench, and the approved
Container Loading screenshot is its sibling-family reference. Import Excel / CSV, Download Template
and "Try sample" are not in the approved design and are not rendered; the worksheet opens with the
preset sample already filled in. The frozen controller and model are not edited: worksheet-wide
operations in `cbmWorksheetActions.ts` (one dimension or weight unit for all cartons, duplicate,
reorder, spreadsheet paste) use only its public, stale-safe methods.

- `cbmPage.module.css` + `useCbmPageChrome.ts`: CBM-only page presentation, scoped with
  `body:has([data-cbm-workspace])` so no other page changes: the reference palette (`--cbm-*`), a
  1320 px workspace, title scale and the "Runs on your device" badge moved into the site header
  (restored when the workspace unmounts).
- Below the workspace the page keeps the shared tool-page strip and the global `SiteFooter`,
  exactly as every tool page renders them. The approved common strip (`ToolContent.astro`, with the
  Image Studio section icons) shows five shortcuts on every tool page: Disclaimer, How to use,
  Method, FAQ and Related tools. Worked example and References, required for T1/T2 tools, are
  rendered in full inside Method (`section#worked-example`, `section#references`); a tool without a
  Method section keeps them as their own disclosures.
  `CbmSectionLinks.tsx` draws the workspace's FAQ and Related tools cards as links that open and
  scroll to those shared sections, so their content exists once.
- `CbmQuickActions.tsx`: 3D visualization, Unit conversion and Print / Save PDF beside the page
  title on desktop (rendered into the shared title row); an icon row with a More menu (Copy
  Summary) on phones.
- `CbmPackageWorksheet.tsx` / `CbmPackageRow.tsx`: "Shipment Cartons" table (handle and row
  number, Description / SKU, L / W / H in the worksheet unit, Qty, weight and unit, Total CBM,
  delete) and phone summary cards. The handle selects a row (`Select Carton N`, `aria-pressed`) and
  reorders it by drag or Alt + arrow keys; Duplicate selected copies the selection, else the active
  row. Pasting a tab-separated block (`cbmPaste.ts`) fills rows from the focused cell; nothing is
  uploaded and descriptions never reach the engine.
- `CbmOptionsPanel.tsx`: collapsible Units & Display Options. `CbmCostPanel.tsx`: the blue cost
  panel; amounts show grouped while not being edited, the controller keeps the raw text.
- `CbmShipmentVisualization.tsx` / `cbmVisualGeometry.ts` / `cbmVisualShapes.ts`: the active
  carton drawn as a fixed, decorative 2 × 2 × 2 stack on a pallet from the reference viewpoint; the
  stack's outer size follows that carton's L : W : H and the arrows carry its own dimensions. It
  never depends on quantity and never represents a container or a loading plan.
- Results: KPI row, load composition (hidden on phones, as in the reference), the yellow cost result
  with Estimated Total strongest, and Print / Save PDF beside Copy Summary. Money shows whole
  amounts without paise (`₹ 2,12,600`) and packed weight without trailing zeros (`8,340 kg`).
- Stable test hooks: `data-cbm-actions`, `data-cbm-views`, `data-cbm-total-row`, `data-cost-total`,
  `data-cbm-cards`, `data-cbm-section-link`.

## CBM section ownership preparation (#220)

The #220 refactor and ownership-hardening amendment change boundaries only. Existing rendering,
state, wording, calculations, copy and print remain unchanged. #219 visual work is not included.

| Owner | Components | Section-internal styles (desktop and mobile) |
| --- | --- | --- |
| A: shell | `CbmShipmentLayout.tsx` | `cbmWorkspace.module.css` |
| A: worksheet | `CbmPackageWorksheet.tsx` | `cbmWorksheet.module.css` |
| A: inputs/notes | `CbmOptionsPanel.tsx`, `CbmCostPanel.tsx`, `CbmNotesPanel.tsx` | `cbmInputs.module.css` |
| B: visualization | `CbmShipmentVisualization.tsx` / `CbmVisualizationPanel` | `cbmVisual.module.css` |
| B: outputs | `CbmShipmentResults.tsx`, `CbmCostResult.tsx`, `CbmOutputActions.tsx` / `CbmPrintReport` | `cbmResults.module.css` |

### Placement and width — Workstream A

`CbmShipmentLayout` passes shell-owned `className` placement classes to existing section roots.
`cbmWorkspace.module.css` alone owns cross-section order: `worksheetSlot`, `optionsSlot`,
`costInputsSlot`, `notesSlot`, `visualizationSlot`, `resultsSlot`, `costResultSlot`,
`outputActionsSlot` and `outputFeedbackSlot`. Results forwards its class to both existing summary
and composition roots; actions forwards `feedbackClassName` to the existing status paragraph.
No extra wrappers are needed. Keep forwarding these placement props without redefining their order
inside section CSS. Sections own internal layouts, responsive presentation and touch styling only.
Current order is preserved; founder mobile ordering belongs to #219, not #220.

A owns column structure, cross-section placement and the screen-workspace print hide rule.
`cbmWorkspace.module.css` is A-owned: B must not edit it. The future #219 right-column target is
approximately 420–440 px at a 1366 px viewport where compatible with the full page. #220 does not
change current widths; B requests width/placement adjustments from A.

### Stable integration and frozen/shared files

`CbmVisualizationPanel` accepts `packages`; summary and cost result accept `state`; output actions
accept `summary` and `enabled`. Each section also accepts the shell placement class. Cost result owns
its always-present slot; visualization owns package/view selection; output actions own copy feedback.
`CbmPrintReport` accepts `summary` and stays outside the screen workspace.

Preserve `data-cbm-workspace`, `data-cbm-total`, `data-package-row`, labels, region names and control
IDs. Both workstreams freeze `cbmShipmentController.ts`, `cbmShipmentModel.ts`, `useCbmShipment.ts`,
`cbmComposition.ts`, `cbmShipmentCopy.ts`, `DynamicCbmShipmentLayout.tsx` and `ToolIsland.tsx`.
Existing functional/activation/privacy tests and engine/preset/manifest/privacy contracts stay frozen.
Coordinate shared-contract changes before editing; the ownership rules in this README remain fixed.

### Strings

`cbmStrings.ts` is frozen/shared legacy wording. No wording changes in #220.
A may create `cbmWorksheetStrings.ts`; B may create `cbmResultStrings.ts` for later section-owned copy.
Neither future string file is created by this preparation.

### Tests

A owns existing `tests/e2e/cbm-compact.spec.ts`.
B owns new `tests/e2e/cbm-results.spec.ts` and new Workstream-B-specific unit tests.
B must not modify `cbm-compact.spec.ts`: report any B presentation change that invalidates an
assertion there, and A makes that adjustment on its own branch. Do not move or rewrite existing
tests in #220. Any later test-path edits must remain within their explicitly approved issue scope.

### Icons

`packages/ui/src/icons/icons.ts` is reserved for A if later CBM icons are needed.
B uses existing icons or requests an icon from A; B must not edit the registry concurrently.
No icons are added in #220.

### Screenshot artifacts

Parallel A/B PRs must not both regenerate committed CBM baseline screenshots. Both may capture
untracked/review screenshots for the founder. If standard tests regenerate tracked artifacts,
restore those generated changes before committing a parallel PR. The SECOND integration/
reconciliation PR regenerates canonical `tests/artifacts/screenshots/cbm-calculator-*.png` artifacts
only after both workstreams are combined.

### Print and copy — Workstream B

`CbmOutputActions.tsx` is B-owned, including `CbmPrintReport` presentation. Print functionality and
copy content remain frozen unless #219 explicitly requires presentation-only changes. The shell's
screen hide rule stays A-owned; preserve the report's placement outside that hidden workspace.

PR #225 sample-load fix: Resize and Format Converter reuse Crop’s user-interaction ref guard so delayed automatic Jaipur samples cannot replace uploads. Manual Try Sample and untouched initial demo loading remain available; browser regressions cover both studios.

PR #225 CI follow-up: Image Studio hints use the accessible accent-text token; green download actions retain white text on a contrast-safe green in both themes. Shared Crop decode tests target the source canvas image, retaining the live thumbnail. The generated catalog includes Background Remover (36 listed tools, 45 indexable sitemap pages). Axe rules remain unchanged.

The same CI follow-up refreshes the legacy Crop test flow (Crop Image, then download) without changing fixture values, includes Background Remover in Media/network coverage, and retains the percent unit on Compress’s accessible primary result.
