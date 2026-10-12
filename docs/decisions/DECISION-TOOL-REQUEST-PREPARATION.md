# Decision: atomic request preparation and bounded Amazon UI adapter

| | |
|---|---|
| **Status** | Proposed (ADR-lite). Becomes the accepted decision when the founder merges it. |
| **Date** | 2026-10-13 |
| **Decided by** | Founder (on merge) |
| **Required by** | TASK-008L / PR 6A0; implementation PRs 6A1 and 6A2 |
| **Contract** | [Amazon tool contract](../../tasks/TASK-008L-AMAZON-MANUAL-FEE-CALCULATOR.md), merged in PR #125 |
| **Affects** | Future platform runtime API and one bounded UI integration; this PR changes documentation only |

Implementation may begin only after this ADR is merged. Approval does not combine the
platform, UI and tools lanes into one implementation PR.

## Context and repository evidence

The current request path is flat `FieldValues` → `buildRequest(preset, values)` →
canonical `ToolRequest` → one operation. `packages/runtime/src/tool-input.ts` handles
engine-backed fields, conditional visibility, options, number normalization and row
serialization, and strips `uiOnly` fields. It does not compose arbitrary nested objects.

`packages/runtime/src/tool-state.ts` owns computation and cancellation. Its `RunFn`
receives an already-shaped request, not a form snapshot; wrapping that runner and reading
the mutable store later would make request composition race with edits.

The Amazon contract needs flat form values composed into `feeLines[]`, nested
`priceSlabs[]` / `weightSlabs[]`, `chargeableWeight`, seller cost objects, tax/settlement
objects and `scenarioAdjustments[]`. The canonical operation remains
`estimate.marketplace.manual-profitability@1`, as defined in the
[engine contract](../../tasks/TASK-008L-MANUAL-PROFITABILITY-ENGINE.md).
Neither that operation nor the preset schema should be redesigned for this form.

Current bounded UI precedents are exact invoice/packing preset checks in
`packages/ui/src/toolkit/ToolIsland.tsx`, row shaping in `invoiceItems.ts` / `packingItems.ts`,
and packing-transfer shaping. They establish UI ownership of limited form integration,
not an existing general nested-request adapter framework or financial-composition API.

## Decision 1: optional runtime preparation callback

Approve this additive member of `ToolStoreOptions` in
`packages/runtime/src/tool-state.ts`, using the existing repository types:

```ts
prepareRequest?: (
  preset: ResolvedPreset,
  values: Readonly<FieldValues>
) => Result<ToolRequest>
```

`ResolvedPreset` is the existing schema type; `FieldValues` and `ToolRequest` come from
runtime's `tool-input.ts`; `Result` / `OpError` come from core. No parallel request,
error or field-value contract is introduced. The existing canonical request is:

```ts
interface ToolRequest {
  input: Record<string, unknown>;
  params: Record<string, unknown>;
  missing: string[];
}
```

The callback is caller-owned, optional, synchronous and pure from runtime's perspective.
It runs exactly once per compute, before operation execution. Its only inputs are the
resolved preset and the current immutable form snapshot. No Promise, asynchronous
preprocessing, storage, network, clock or worker roundtrip is part of this contract.

When absent, use existing `buildRequest(preset, values)` without changing its behavior.
An internal `ok(buildRequest(...))` wrapper may unify handling; it must not change the
request, params, visibility, missing fields, sample loading or default-tool behavior.
Existing tools require no migration and do not opt in implicitly.

### Atomicity and lifecycle

At the beginning of each compute, after existing pending-work cancellation, capture one
independent immutable copy of current `FieldValues`. Supply that copy to the callback,
not the mutable store's object. Readonly TypeScript annotation alone is insufficient:
freeze the copy or enforce equivalent runtime immutability. Current values are flat
strings/booleans, including rows encoded as JSON strings; a frozen shallow copy suffices.
Do not freeze the live store or change its editable-state contract.

The callback must not read the store later, close over stale store values, mutate the
preset, await anything, or derive its request after worker execution starts. It returns
one complete request for that snapshot; it must not subsequently mutate that request.
Thus fee modes, slab rows, scenarios and costs cannot come from different edit generations.

`runNow`, debounced live compute and `loadSample` all use the same compute/preparation
path. Sample application completes before the snapshot is taken. Existing `sample.input`
and `sample.uiState` loading rules remain unchanged; UI-only keys never become direct
engine keys. The adapter may shape explicitly authorized UI-only values into canonical
engine objects, but strips all presentation/context fields.

Keep existing abort-controller, generation and disposal guards: an edit, reset or newer
compute invalidates old work; late responses cannot publish a stale result. Preparation
is not a second scheduler or worker. Reset cancels pending work, clears result/error and
restores normal defaults exactly as today; it neither runs preparation nor deletes saved presets.

### Success, missing fields and failure

Choose **`Result<ToolRequest>`**, as proposed in PR #125, not a bare request or another
return type. Success contains the existing full `input`, `params`, `missing` shape.
`missing[]` retains required-field identifiers from the preset/form, including declared
adapter-owned fields when applicable; it is not an array of arbitrary error objects.

Successful preparation with missing fields follows today's required-input path:
`phase: idle`, `result: null`, `error: null`, expose `missing`, and do not call `run`.
A complete successful request proceeds to the existing runner with the same operation id.

Preparation failure is the existing `{ ok: false, error: OpError }` result, constructed
with core's `err(code, { path, details })` convention: do not call the runner, expose the
typed error in `phase: error`, clear `result` to `null` and clear obsolete `missing`.
This prevents a previous successful result from appearing to describe the invalid form.
Do not fall back to `buildRequest` after failure and do not partially merge generic and
custom request shapes. The adapter returns user-validation errors rather than throwing;
error metadata must not contain financial values or row JSON. This decision creates no
new error catalogue or warning framework; financial warnings remain engine-owned.

### Runtime boundary

The hook and its preparation path introduce **no engine or UI imports** and no Amazon
names, mappings, registry, identity checks or conditionals in runtime. Existing dynamic
engine loading in the worker host remains unchanged: the blueprint already allows it.
This approval does not relocate engine execution into request preparation.

## Decision 2: one bounded Amazon UI adapter

Approve UI-lane ownership at
`packages/ui/src/toolkit/amazonManualProfitabilityInput.ts`. Split into purpose-named
modules only if repository code-size limits require it; do not create `utils/`, a new
package or Phase-1-deferred `packages/adapters`.

The adapter composes one canonical request from the provided snapshot. It may:

- Parse/validate strings and row JSON using existing row helpers; preserve decimal-string
  money and row order. Malformed/partial rows must not disappear as an empty list.
- Compose the contract's `feeLines`, price/weight slabs, resolved `chargeableWeight`,
  seller costs, TCS/TDS, settlement lines and scenario adjustments.
- Omit Off fees and unused mode fields; reject enabled but incomplete configuration
  deterministically. Closing a disclosure does not switch off configured charges.
- Strip UI-only/context keys; set only contract-locked structural ids, bases and booleans.
- Return existing typed preparation errors and map canonical paths to the corresponding
  form field/row without copying or relaxing the engine schema.

It must not calculate fees, GST, profit, settlement, weight, slab charges or other
financial formulas; perform money arithmetic; invent numeric fee defaults; read fee
tables/reference data/localStorage; fetch data; use clock/time; mutate global state;
or change engine semantics. Numerical validation/calculation remains in the existing
operation. Structural parsing is not a licence to duplicate financial logic.

### Ownership and activation

UI owns the tool-specific form shape, JSON rows and contextual controls. The engine
remains marketplace-neutral and UI-independent; runtime remains generic; schemas remain
declarative; `apps/web` remains tool-independent templates/routes. A form-to-operation
adapter belongs in that bounded UI integration, not in those other layers.

Select the adapter **only for exact preset id `estimate/amazon.manual-profitability`**
in the UI integration layer. The contract's tool id is
`amazon-india-seller-fee-profit-estimator`; it is not a heuristic selector.
Do not activate by operation id alone, marketplace strings, category, slug prefixes or
runtime branches. No generic adapter registry is authorized.

UI code and UI tests must not import engines directly. Later cross-cutting platform
tests in `tests/` may validate the adapter request against the real operation schema
and execute it through the existing contract. Do not copy that schema into UI or
create a new public schema API just for testing.

## Governance and blueprint relationship

Blueprint §2.3 requires an ADR for this exported runtime API addition. This record is
the founder-review vehicle. It also explicitly grants one bounded exception to the
no-tool-specific-glue/only-data-grows principles (§0.2 law 5 and §4.15), supported by
the actual invoice/packing patterns. It does not relax those principles generally.

No new dependency edge, engine whitelist entry, schema language, lane owner or folder
is needed. The blueprint does not require every additive API ADR to rewrite its frozen
text. Therefore **no blueprint amendment is required in this PR**. `docs/architecture/`
and accepted ADRs are human-only; do not edit them. Any optional founder cross-reference
in frozen architecture is human-owned and is not an implementation prerequisite.

Keep the approved sequence: PR 6A0 docs decision → PR 6A1 platform callback → PR 6A2 UI
adapter/integration → PR 6B tool data → PR 6C cross-cutting platform evidence. Each is
one issue, branch, PR and lane, size S/M. Hook reuse by a different tool needs its own
justified task/approval; this ADR does not authorize additional adapters automatically.

## Alternatives

| Alternative | Decision and reason |
|---|---|
| A. Keep generic `buildRequest` only | Rejected: current flat mapping cannot safely express the approved nested input; mutable runner closures are not atomic. |
| B. Recursive preset mapping DSL | Rejected: only one proven consumer; recursive mappings, expressions, arbitrary JSON transforms and executable preset mappings add disproportionate complexity. |
| C. Amazon logic in runtime | Rejected: breaks marketplace neutrality and generic default behavior. |
| D. Amazon logic in engine | Rejected: engine receives canonical input, not a marketplace form; UI-independent semantics must not change. |
| E. Synchronous adapter selected in UI | Chosen: smallest atomic, testable form-to-contract composition with one optional generic runtime hook. |

No generic nested-field expression language or operation-composition framework is
approved. Generalize only after multiple independent tools prove the same need, under
a separate decision/task.

## Security, privacy and performance

The hook creates no network path. The adapter is local-only: no financial values in
logs/errors/analytics, no new analytics payload, URL serialization, server processing,
credentials or storage. Existing tool/preset data-class metadata remains authoritative;
this ADR does not downgrade it or alter privacy guards/CSP. Existing explicit local
saved-preset handling remains outside the adapter, with its current limits and consent.

Preparation is lightweight synchronous form shaping bounded by PR #125's controlled
groups and row limits. No expensive computation, blocking network, worker roundtrip or
clock-dependent behavior. The existing worker operation still performs financial computation.

## Required evidence for implementation PRs

### PR 6A1 — platform runtime

- Absent callback: exact old request/default behavior; existing tools regression green.
- Callback called once per compute with the current independent immutable snapshot;
  attempted mutation cannot change the store or another generation's values.
- Live compute, `runNow` and `loadSample` use that same path.
- Preparation failure prevents `run`, surfaces the typed error and clears stale result;
  no fallback or partial generic merge.
- Missing identifiers preserved and surfaced; incomplete requests do not run.
- Rapid edits cannot publish a stale prepared request/result; cancellation, generation,
  reset and disposal behavior preserved, including reset during in-flight execution.

### PR 6A2 — UI adapter

- Exact form snapshot → exact canonical request, with no unknown or UI/context keys.
- Off fee omitted, enabled incomplete fee rejected with a deterministic field error.
- Nested price slabs and weight slabs preserve strings, order and declared weight unit;
  malformed/partial JSON rows do not silently disappear.
- Explicit scenario applicability, GST treatment, TCS/TDS, seller costs, settlement and
  adjustments map correctly without financial arithmetic or numeric fee defaults.
- Exact-preset activation only; unrelated tools unchanged; no network/storage/clock access.
- Canonical-path-to-field/row error mapping preserves correction access.

Later PR 6C must validate mapped requests against the **real** operation schema and
execute representative basic/advanced cases; prove sample/state parity, reset, saved-state
restoration, privacy/network blocking and accessibility. UI tests cannot bypass import
boundaries. Run repository-required verification and architecture checks in each lane;
do not change existing fixture expectations or tolerances.

## Consequences and non-goals

Positive: minimal additive API, unchanged generic defaults, neutral engine, no schema
DSL, atomic mapping tests, and a reusable hook for future independently justified cases.
Trade-offs: exported runtime surface expands; one bounded UI special case must be
maintained; adapter/engine synchronization needs integration tests; multiple future
adapters might justify a registry or generalization under a new decision.

This ADR does **not** implement the callback, adapter or Amazon tool; change engines,
presets, tools, content or reference data; publish fee data; add cloud storage/export
features or dependencies; authorize a generic mapping language; or authorize multiple
operations, worker chaining, async preprocessing or `logistics.weight.chargeable@1`
composition. Chargeable weight remains user-entered/resolved externally in v1.

No Amazon API, scraping, fee synchronization, reference-data autofill, Seller Central
login, network calls or public fee database is approved. Fees remain manually configured.
PR #99, existing Seller Profitability, other tools, Civil, Logistics and Rebar are untouched.
No unresolved financial/product decision is introduced: founder acceptance of this
architecture decision is the remaining gate before PR 6A1 implementation.
