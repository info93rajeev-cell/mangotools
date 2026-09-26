# TASK-003D Report — Pallet Loading Calculator

Plan: `tasks/TASK-003D-PALLET-LOADING-PLANNER.md` · report date 2026-09-26 · coding agent: Claude
(Claude Code, cloud session)

> **Status: complete and accepted.** TASK-003D added the Pallet Loading Calculator in three PRs, each
> merged after CI passed on **Node 24** with **Chromium, Firefox and WebKit**.

## 1. Summary

- TASK-003D added the **Pallet Loading Calculator** (`/pallet-loading-calculator`), the fourth tool in
  the Logistics category, after the CBM Calculator, the Volumetric Weight Calculator and the Container
  Loading Calculator.
- Completed in three PRs, exactly as the founder scoped them:
  - [info93rajeev-cell/mangotools#24](https://github.com/info93rajeev-cell/mangotools/pull/24) — the
    planning document `tasks/TASK-003D-PALLET-LOADING-PLANNER.md` (commit `5810af9`, merged as `d57db4b`),
    documentation only, no code
  - [info93rajeev-cell/mangotools#25](https://github.com/info93rajeev-cell/mangotools/pull/25) — the
    engine operation `logistics.pallet.fit@1` (commit `dfb6e32`, merged as `11cdee0`)
  - [info93rajeev-cell/mangotools#26](https://github.com/info93rajeev-cell/mangotools/pull/26) — the
    visible tool (commit `d1cab9a`, merged as `7e7d433`)
- **No new engine.** The operation was added to the existing `engines/logistics`, now at **0.4.1**
  (0.3.2 → 0.4.0 in PR #25, → 0.4.1 in PR #26 — see §4 for the one small, additive change in PR #26).
- **CBM, Volumetric Weight and Container Loading are unchanged.** `logistics.cbm.compute@1`,
  `logistics.weight.chargeable@1` and `logistics.container.fit@1`, their fixtures and their output were
  not touched. The only changes to those three tools are one related link each, and the shared Logistics
  category text.
- CI passed on Node 24 with Chromium, Firefox and WebKit for every PR, and post-merge on `main` for both
  code PRs (§5).
- The founder approved every plan decision (§15 of the plan) before PR #25, then gave PR #26 its own
  detailed brief (tool name, inputs, outputs, working steps, content, SEO and related-link instructions)
  before coding started.

## 2. PR #25 engine summary

**Operation `logistics.pallet.fit@1`** in `engines/logistics/src/operations/pallet-fit/`. Engine version
0.3.2 → **0.4.0**, with a README changelog entry and an operation README.

- **Shared search extracted.** The 6-orientation, axis-aligned search moved out of `container-fit`'s own
  `grid.ts` into `engines/logistics/src/lib/orientation-grid.ts`, since a pallet is mathematically a
  "container" whose three axes are its length, width and stack-height limit. `container-fit`'s own 31
  fixtures and 14 unit tests passed **unchanged** after the move (git recognized it as a rename).
- **Footprint and layer fit:** cartons along the pallet's length and width (best of up to 6 orientations),
  `cartonsPerLayer` (the two multiplied), `layers` = `floor(maxStackHeight ÷ carton height on the
  vertical axis)`, `cartonsPerPallet` = `cartonsPerLayer × layers`.
- **Multi-pallet math**, new territory `container-fit` never needed since a container calculation only
  ever considers one container: `palletsRequired` = `ceil(quantity ÷ cartonsPerPallet)`; `cartonsOnLastPallet`
  = the exact remainder, or a full pallet when the quantity divides evenly.
- **Area and height stats:** `usedAreaPercent` = `(carton footprint × cartonsPerLayer) ÷ pallet footprint
  × 100`; `unusedAreaPercent` = `100 − usedAreaPercent`; `estimatedStackHeight` = `layers × carton height
  on the vertical axis`; `leftoverPalletLength`/`leftoverPalletWidth` = pallet axis minus cartons × carton
  dimension.
- **`bestOrientation`** is one of 6 codes (`lwh`, `lhw`, `wlh`, `whl`, `hlw`, `hwl`); no separate volume
  estimate and no usable-area-percentage input, since this operation has one estimate only.
- **Options, params from this operation's first version** (not input — the lesson `container-fit` learned
  the hard way in its own PR 1 → PR 2, see TASK-003C's report): `stackable` (default true),
  `allowBaseRotation` (default true), `keepUpright` (default **true**, the opposite default from
  `container-fit`'s `keepUpright`).
- **Pallet types:** `euro` (120 × 80 cm), `us` (121.9 × 101.6 cm) — commonly published approximate
  dimensions, flagged as unverified, see §7 — plus `custom` (any positive length/width). Maximum stack
  height has no default and is always required, in `palletUnit`.
- **Overhang is impossible by construction**, not merely disallowed by a setting: floor division can
  never place a carton partly off the pallet.
- **Two specific new validation errors**, not one combined one:
  - `LOGISTICS_CARTON_EXCEEDS_PALLET_BASE` — the carton's footprint does not fit the pallet base in any
    orientation tried (checked first).
  - `LOGISTICS_CARTON_TALLER_THAN_STACK_LIMIT` — the carton is taller than `maxStackHeight` on the
    vertical axis (checked second, only reached once the footprint fits).
  - A pallet's footprint and its stack-height limit are two different, independently useful things for a
    user to know they got wrong.
- **Warnings**, using the existing `OpWarning` mechanism: three standing notices on every successful
  result (`LOGISTICS_PALLET_NOT_LOAD_SAFETY`, `LOGISTICS_PALLET_VERIFY_BEFORE_SHIPMENT`,
  `LOGISTICS_PALLET_DIMENSIONS_VARY`), plus `LOGISTICS_PALLET_MULTIPLE_PALLETS_REQUIRED` when
  `palletsRequired > 1`.
- **Precision:** multiplication is exact; division keeps 20 decimal places; percentages, stack height and
  leftovers are rounded once to `params.decimals` (default 3) with `params.rounding` (default half-up);
  every carton/pallet count is an exact whole number, never rounded for display.
- **Fixtures and tests:**
  - **30 cited, hand-verified engine fixtures**, including the canonical worked example (40×30×20 cm
    carton, qty 100, Euro pallet, 150 cm stack limit → 8 cartons/layer, 7 layers, 56 per pallet, 2 pallets
    needed, 44 on the last one, 100% area utilisation); a paired case where turning `keepUpright` off
    rescues a fit that fails with it on; an exact-multiple-quantity case; both new error codes; and 16
    validation-only cases.
  - **17 unit tests**, including unit-factor checks, all-defaults-true, the worked example, both new
    errors, the height-rotation-rescue pair, a custom pallet in a different unit, and message-exists
    coverage for every new error and warning code.
- **Not exposed until PR #26:** no preset used the operation, so the site stayed at 9 tools/17 pages and
  the same 147-test local e2e count, with no mention of `pallet-loading-calculator` anywhere in the run.

## 3. PR #26 tool summary

**Page:** `/pallet-loading-calculator` (T2, archetype B, Logistics, tool version 0.1.0). Added:

- the preset `presets/logistics/pallet.yaml`
- the manifest and content
- 5 hand-verified tool fixtures: the Euro pallet basic case (the worked example), a US pallet, a custom
  pallet, `stackable: false`, and `allowBaseRotation: false`

**Inputs:** carton dimension unit (cm default, m, mm, inch), length, width, height, quantity (default 1);
pallet type — **Euro** (default), US, or Custom (reveals its own length/width fields); pallet unit
(always visible, cm default); maximum stack height (default 150); three switches — cartons can be
stacked, allow base rotation, keep upright (all default **on**).

**Results:**
- **Total cartons per pallet** — primary result
- **Pallets required** — secondary result
- cartons on the last pallet, cartons per layer, layers, cartons along the pallet's length/width, used
  and unused area %, estimated stack height, leftover pallet length/width

`bestOrientation` is not a dedicated output row, for the same reason `billedOn` (TASK-003B) and
`bestOrientation` (TASK-003C) were not: the output schema has no mechanism yet to map an enum code to a
display label. It is described in the always-open working-steps panel instead, via a per-orientation
formula key.

**Working steps:** the chosen orientation and its per-axis counts (per-orientation formula key), layers
(now naming the carton height used on the vertical axis), cartons per pallet, pallets required, cartons
on the last pallet, used area (now naming the cartons-per-layer figure it is built from), and estimated
stack height. Each orientation step ends with "This is a simple grid estimate, not advanced pallet
optimisation."

**Warnings and disclaimer:** the three standing notices from PR #25 render on every result (not a
load-safety calculation, verify before shipment, pallet dimensions and stacking rules vary), plus the
multiple-pallets notice when more than one pallet is needed, alongside the standard professional
disclaimer.

**Page content** (`## How to use`, `## Method`, `## Worked example`, `## FAQ`, `## References` — the five
section headings this codebase's content pipeline accepts; other requested topics were folded into
`## Method` as prose): what the estimate means and how it differs from a load-safety calculation; how the
grid fit works, including what each of the three switches changes (with an explicit note that turning
`keepUpright` off assumes the carton is safe to lay on its side); why real pallet loading depends on more
— carton strength, weight and its distribution, centre of gravity, pallet type and condition,
stretch-wrap/strapping, overhang, warehouse method, and carrier rules; the formulas; a worked example
(fixture 001); 7 FAQs; and references, including the pallet-dimension caveat.

**SEO and search:** title "Pallet Loading Calculator – Cartons per Pallet" (46 characters); description
146 characters; 7 synonyms (pallet loading calculator, pallet capacity calculator, carton pallet
calculator, how many cartons on a pallet, euro pallet calculator, pallet planner, logistics calculator).

**Logistics category update:** summary, SEO title/description, `about` and FAQ now name **all four**
tools (CBM, Weight, Container & Pallet) and no others; the homepage Logistics card's tool count updates
naturally from the new tool existing — no redesign.

**Related links:** Pallet Loading ↔ CBM, Pallet Loading ↔ Volumetric Weight, Pallet Loading ↔ Container
Loading, all reciprocal, metadata-only (no version bump on the other three manifests, following the
TASK-002B/003B/003C precedent). No links to tools that do not exist yet.

## 4. Important implementation note

- **Boolean options were wired as params/`userOptions` from the start**, not input. This codebase's only
  mechanism for a genuine boolean toggle in a tool's UI is a preset `userOptions` entry with
  `control: switch`, which the runtime always routes to operation params, never input — the defect
  `container-fit` discovered only in its own PR 2 (TASK-003C). `pallet-fit`'s `stackable`,
  `allowBaseRotation` and `keepUpright` were params from PR #25 onward, so no rework was needed in PR #26.
- **One small, additive engine bump, 0.4.0 → 0.4.1, in PR #26.** Two working-step `variables` maps
  (`pf.layers`, `pf.usedArea`) gained `cartonHeightOnAxis` and `cartonsPerLayer` respectively, so their
  templates could name the figures they use. This does not touch the output schema, the `run` logic, or
  any fixture's expected values — a template-clarity change only, not a defect fix and not a calculation
  change. It was the only engine touch in PR #26, consistent with the founder's instruction not to change
  engine behavior absent an actual defect.
- **No calculation or schema change occurred anywhere in TASK-003D after PR #25.** Every output value in
  every existing fixture is unchanged from PR #25 through PR #26.

## 5. Tests and checks

| Check | PR #25 (engine) | PR #26 (tool) |
|---|---|---|
| `pnpm verify` (local) | ✅ Vitest **391/391** (+30 engine fixtures, +17 unit tests); gen still 9 tools/9 presets (operation not exposed) | ✅ Vitest **403/403** (+5 tool fixtures, +7 search cases); 10 tools/10 presets; architecture 180 files, no violations |
| `pnpm build` (local) | ✅ 17 pages (unchanged) | ✅ **18 pages** (+`/pallet-loading-calculator`) |
| `pnpm test:e2e` (local, Chromium only) | ✅ 147 passed (unchanged; no mention of the new tool anywhere in the run) | ✅ **156 passed**; `pallet-loading-calculator` present in all 9 expected shared-suite entries (network privacy, "Try sample," 4× axe light/dark, SEO structured data, 2× screenshot) |
| CI, PR branch (Node 24; Chromium, Firefox, WebKit, single combined run) | ✅ [run 36231124771](https://github.com/info93rajeev-cell/mangotools/actions/runs/36231124771): Playwright **249 passed**, 1.9 min, 0 flaky | ✅ [run 36232489893](https://github.com/info93rajeev-cell/mangotools/actions/runs/36232489893): Playwright **261 passed**, 3.1 min, **1 flaky** (`mobile-search.spec.ts`, WebKit, passed on retry #1 — not a new or repeat failure) |
| CI, post-merge on `main` | ✅ commit `11cdee0`: [run 36231330025](https://github.com/info93rajeev-cell/mangotools/actions/runs/36231330025), success | ✅ commit `7e7d433`: [run 36232800395](https://github.com/info93rajeev-cell/mangotools/actions/runs/36232800395), success — confirmed green before this report was written, per instruction |

No unresolved failures appeared in any CI run for this task. The one flaky WebKit test on PR #26's branch
run passed on its automatic retry and did not recur on the post-merge `main` run.

New and changed tests in PR #26:
- **`tests/support/tool-page.ts`:** the sample (`56`, the worked example's `cartonsPerPallet`) was added
  to the shared `SAMPLES` map proactively — a gap only discovered after TASK-003C was fixed here from the
  start, and confirmed present in the CI log across all 9 expected shared-suite entries.
- **Search relevance:** 7 new queries find the Pallet Loading Calculator; the "logistics calculator" test
  was extended from checking the top 3 results to checking the **top 4**, since all four logistics tools
  now share that synonym.
- **Pipeline:** 10 tools and 10 presets; at a threshold of 4, Logistics (now the largest category) stays
  visible on its own, changing that boundary test's expectation.
- **Screenshots:** `pallet-loading-calculator-*` are new; `logistics-*` and `home-*` were updated for 4
  tools; other, unrelated tool screenshots showed only rendering noise between runs and were not
  committed, matching the TASK-003C precedent.

**Manual browser verification** (headless Chromium): "Try sample" gives the worked example above;
switching pallet type to Custom reveals its own length/width fields; with the default Euro pallet, a
200 cm carton length correctly shows "This carton does not fit the pallet base," and a 300 cm carton
height correctly shows "This carton is taller than the maximum stack height"; the three standing warnings
and the professional disclaimer render on every successful result; no console or page errors were
observed.

**Review for defects:** none found. Neither the engine nor the tool was changed after merge.

## 6. Product safety / limitations

The tool and its content are explicit that this is a simple planning aid, not a substitute for
professional or physical verification:

- **Not advanced pallet optimization** — a simple axis-aligned grid fit, not a bin-packing solver.
- **One carton size only** — no support for mixed carton sizes in a single calculation.
- **No pallet weight capacity** — the pallet's own maximum load weight is not modelled.
- **No weight distribution** — centre of gravity and load balance are not checked.
- **No overhang** — impossible by construction (floor division), not a configurable option.
- **No load safety approval** — this is not a stability, safety or engineering calculation.
- **No 3D rendering** — results are numeric and described in text/working-steps only, no visual layout.
- **Must verify before shipment** — every result carries a standing warning to verify the physical load
  against carrier, warehouse and freight-forwarder requirements before shipping.

## 7. Deviations / notes

1. **Reciprocal related links were added to all three existing logistics tools**, not just one:
   CBM Calculator, Volumetric Weight Calculator and Container Loading Calculator each gained a
   `graph.related` entry pointing to Pallet Loading Calculator, and it links back to all three —
   metadata-only, no version bump on the other three manifests.
2. **Logistics now has four visible tools** (CBM, Volumetric Weight, Container Loading, Pallet Loading),
   completing the category as scoped in the Phase 1 build plan's logistics list plus this founder-directed
   addition; category copy, SEO text and the FAQ were rewritten to name all four and no others.
3. **Pallet dimensions are approximate reference values and should be source-verified before public
   launch.** The Euro (120 × 80 cm) and US (121.9 × 101.6 cm) pallet defaults are commonly published
   approximate figures, not yet checked against a specific citable source (ISO 6780 or EPAL's own
   specification) — flagged in the engine README, the operation README, the tool content, and the
   manifest's `quality.verifiedAgainst` citation. This mirrors the same, explicitly-approved deviation for
   `container-fit`'s container dimensions in TASK-003C (founder decision 15 approved proceeding now and
   verifying before public launch).
4. **The shared orientation-search extraction (§2) is a same-lane, behaviour-preserving refactor** of
   `container-fit`'s own code, not a new dependency or a design change to that operation; all of its 31
   fixtures and 14 unit tests passed unchanged after the move.
5. **No new dependency, no schema change, no change to CBM, Volumetric Weight or Container Loading's
   calculations, fixtures or wording.** The only edits to those three tools' manifests are one
   `graph.related` entry each.
6. **Local e2e ran on Chromium only**, per the environment's pre-installed browser; CI covered Chromium,
   Firefox and WebKit for every PR.
7. **Branch:** all three PRs came from the session's designated branch `claude/gifted-cerf-w6qxhm`. Since
   the branch's prior tip was already merged before each new PR started, it was reset to the
   then-current `main` and pushed with `--force-with-lease` before new work began, per this session's
   branch-reuse instructions — no unmerged work was ever discarded.

## 8. Open questions

1. **Next Logistics tool.** Should it be a **Shipping Cost Calculator** or a **Warehouse Space
   Calculator**? A shipping-cost tool would need its own rate/pricing input model (new territory for this
   engine); a warehouse-space tool could likely reuse more of the existing area/volume machinery.
2. **Multiple carton sizes.** Should Pallet Loading later support several carton types in one
   calculation, with a combined layer/area estimate? This would need a new input archetype (a repeatable
   row), not a small change — the same open question TASK-003C raised for Container Loading.
3. **Pallet weight capacity.** Should a later version add a maximum-load-weight check, using carton
   weight (not currently collected by any logistics tool)?
4. **Overhang option.** Overhang is currently impossible by construction. Is there founder interest in a
   deliberately-allowed-overhang mode for edge loading, clearly labelled as a different, riskier estimate?
5. **Export/PDF report.** Should any Logistics tool gain a printable or exportable result summary (for
   attaching to a shipping or warehouse work order), and if so, is this a per-tool feature or a
   platform-lane capability?
6. **Pallet dimensions and reference-data versioning.** Should container and pallet default dimensions
   move to a shared, versioned reference-data file with per-figure citations, rather than living as
   constants in each operation's own `*.ts` file? This would resolve §7.3's open verification gap
   platform-wide, for both `container-fit` and `pallet-fit`, in one change.

## 9. Recommendation

**Pause Logistics after TASK-003D.** With four tools now covering CBM, chargeable weight, container
loading and pallet loading, the category matches (and exceeds) the Phase 1 build plan's original scope.
Rather than immediately adding a fifth Logistics tool, consider opening a new wave in a different
category, for example:

- **PDF / Document tools** — a large, distinct user base with no current coverage in this platform.
- **Image tools** — resizing, format conversion, or metadata stripping, all privacy-relevant and
  deterministic, matching this platform's positioning.
- **Audio / Video tools** — format or metadata utilities that fit the same client-side, privacy-first
  model.
- **Developer tools expansion** — building on the existing JSON/Base64/URL tools with a few more
  commonly-requested utilities.

Any of these would diversify the taxonomy beyond Logistics and Developer, which is currently the
platform's heaviest category. This is a recommendation only; per this session's instructions, no new tool
or task is started without explicit founder direction.
