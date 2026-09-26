# TASK-003C — Container Loading Calculator (plan only)

> **Planning document. No code has been written, no schema, preset, manifest or content file has been
> created, and no existing tool has been touched.** This document exists so the founder can decide the
> scope before any implementation branch is opened. It is the third Logistics tool, after the CBM
> Calculator (TASK-003A) and the Volumetric Weight Calculator (TASK-003B), and matches Phase 1 plan
> §4 tool 14 (`container-loading-calculator`, logistics, T2, archetype B, operation
> `logistics.container.estimate`, preset `logistics/container`) and the "Recommendation for the next
> task" in `tasks/TASK-003B-REPORT.md` §7.

## 1. Goal

Help a user estimate **how many cartons of one size can fit inside a shipping container**, from carton
dimensions, carton quantity and a container type (or custom container dimensions). The first version is:

- **deterministic** — same inputs always give the same output, computed in the browser with no network
  call and no AI;
- **volume-based, plus a simple axis-aligned grid check** — not a 3D bin-packing solver;
- **conservative in its claims** — see §2.

It reuses the existing `engines/logistics` engine (no new engine) and stays next to `logistics.cbm.compute`
and `logistics.weight.chargeable`, following the same operation → preset → tool → content pipeline as
TASK-003A and TASK-003B.

## 2. Product safety — no-overpromise rules

This tool must read as a **planning aid**, not as proof that a shipment will physically fit. The
Container Loading Calculator sits next to a CBM Calculator and a Volumetric Weight Calculator that both
already carry `disclaimer: professional`; this tool needs the same disclaimer plus stronger, more
specific wording because "how many cartons fit" is easier to misread as a guarantee than "what is the
volume."

**Never claim, state or imply:**
- a perfect or guaranteed loading plan
- a guaranteed fit for the stated quantity
- an exact real-world stuffing plan
- a professional cargo-engineering result
- a replacement for review by a freight forwarder or loading professional

**Approved language, used throughout the UI and content:**
- "estimate" / "estimated number of cartons"
- "planning aid"
- "basic loading estimate"
- "check before shipment"
- "verify with your freight forwarder or logistics professional before booking or loading"

**Standing warnings shown on every result** (exact wording drafted in §10, not final):
1. Volume fitting does not guarantee physical loading fit — pallets, packaging, door opening, load
   securing and handling are not modelled.
2. Container internal dimensions vary by carrier, manufacturer and container condition; the defaults
   here are commonly published approximate figures, not a specific carrier's certified dimensions.
3. This estimate does not check total shipment weight against the container's maximum payload — see
   the open question in §13 decision 9.

`disclaimer: professional` (manifest field, existing enum) is necessary but not sufficient here; the
content and result panel must carry the specific wording above, not just the generic disclaimer banner.

## 3. Tool name

| Option | Reads as | Risk |
|---|---|---|
| 1. **Container Loading Calculator** | A calculator that estimates a number | Low — "calculator" already sets expectations correctly, matches the CBM and Volumetric Weight naming pattern |
| 2. Container Loading Planner | A tool that produces a loading *plan* | **Higher** — "planner" implies a stuffing plan / sequence, which is explicitly out of scope (§9) |
| 3. Carton to Container Calculator | Accurate, but reads like a unit converter | Medium — undersells what it does, doesn't match "how many cartons in a container" search intent |
| 4. Container Capacity Calculator | Reasonable, close to Option 1 | Low, but weaker SEO match to "container loading calculator" search volume and to the Phase 1 plan's existing entry |

**Recommendation: Option 1, "Container Loading Calculator."** Reasons:
- It already appears as the committed name in `docs/phase-1/PHASE-1-BUILD-PLAN.md` §4 tool 14 and in
  `tasks/TASK-003B-REPORT.md` §7 — keeping it avoids a rename before the tool exists.
- "Calculator" (not "Planner") matches founder preference for professional, non-overhyped naming and
  avoids implying a stuffing sequence or 3D plan.
- Slug `container-loading-calculator` is already reserved in the Phase 1 plan and fits the existing
  `*-calculator` slug pattern used by all Logistics tools so far.

Founder confirmation requested anyway — see §13 decision 1.

## 4. Option A vs Option B

### Option A — Simple Capacity Calculator (volume only)

Inputs: carton L/W/H + unit, carton quantity, container type (or custom), optional usable-space
percentage.

Outputs: carton CBM, total CBM, container CBM, fill %, cartons-by-volume, over-capacity flag.

Does **not** check whether the carton's shape actually tiles the container — a carton that is long and
thin could pass the volume check while being physically awkward or impossible to stack efficiently.

### Option B — Basic Orientation Fit (adds a simple axis-aligned grid)

Everything in Option A, **plus**: for each of the 6 axis-aligned orientations of the carton
(L×W×H, L×H×W, W×L×H, W×H×L, H×L×W, H×W×L), compute
`floor(container length / carton length) × floor(container width / carton width) × floor(container
height / carton height)`, and report the orientation with the most cartons, its per-axis counts, and the
leftover space per axis.

Still **not** mixed-orientation packing, not pallet-aware, not a bin-packing solver — it assumes the
whole container is filled with one carton orientation in a uniform grid, which is a common first-pass
method freight planners use by hand.

### Comparison

| | Option A | Option B |
|---|---|---|
| Deterministic | Yes | Yes |
| New engine concepts | Volume, unit conversion (already exist from CBM) | + a fixed 6-permutation loop, `floor` division per axis |
| Value to user | Tells them if the volume fits at all | Also tells them roughly how the cartons could be arranged, and shows the real, usually-lower, achievable count |
| Risk of overclaiming | Lower (obviously "just volume") | Slightly higher — a specific carton count per orientation reads as more authoritative, so §2's wording carries more weight here |
| Engine complexity | Low | Low–medium, still O(1), no iteration over quantity, no recursion, no packing library |
| Fixture count (estimate) | ~10–12 | ~16–20 (6 orientations × several container/carton combinations + edge cases) |

## 5. Recommended first version: **Option B**

Founder's stated preference is Option B "if it can remain simple and deterministic," and it can be: the
orientation check is a fixed loop over exactly 6 permutations with three `floor` divisions and one
multiplication each — no search, no recursion, no per-carton iteration, so it stays O(1) regardless of
quantity, matches AGENTS.md limits (function ≤ 40 lines, complexity ≤ 10) easily, and needs no new
dependency. It gives real, additional value over a volume-only number (a volume check alone is
"technically it could fit," the grid check is "this specific arrangement gets you N") while still being
honestly labelled as a **simple estimate**, not a packing plan.

**Recommendation stands on one condition:** the UI must show the volume-based `cartonsByVolume` and the
grid-based `bestOrientation` count **side by side**, with the grid number described as "a simple,
single-orientation estimate — real loads often achieve less than this," so a large gap between the two
numbers doesn't look like a bug. §13 decision 2 asks the founder to confirm this framing.

## 6. Proposed operation design

**Operation:** `logistics.container.estimate@1`, in
`engines/logistics/src/operations/container-estimate/` (`schema.ts`, `operation.ts`, `units.ts` reused
from `cbm-compute`, `containers.ts` for the default container table, `README.md`,
`container-estimate.test.ts`, `fixtures/`). Runtimes `['worker', 'node']`, `cost: light`,
`exposure: internal`, `dataClass: public` — same profile as the other two operations. Pure, no throws on
user input, decimal strings through `@mangotools/engine-numeric`, each output rounded once from its own
full-precision value (same rule as CBM and Volumetric Weight).

No new engine, no new package. Engine version bumps from 0.2.0 → 0.3.0 (engine README changelog entry,
per Phase 1 notes — changesets are not set up yet).

### Container defaults (constants table, `containers.ts`)

Commonly published **approximate** internal dimensions (metric, converted to cm for the table; these are
widely repeated across carrier and freight-forwarder spec sheets, but **vary slightly by carrier,
manufacturer, and container age/condition** — this is disclosed in the tool, not hidden):

| Type | Internal length | Internal width | Internal height | Internal volume (computed) |
|---|---|---|---|---|
| 20 ft standard (20GP) | 589.8 cm | 235.2 cm | 239.3 cm | ≈ 33.20 m³ |
| 40 ft standard (40GP) | 1203.2 cm | 235.2 cm | 239.3 cm | ≈ 67.72 m³ |
| 40 ft high cube (40HC) | 1203.2 cm | 235.2 cm | 269.8 cm | ≈ 76.35 m³ |
| Custom | user-entered | user-entered | user-entered | computed |

**These figures are not yet cited to a specific source and must not be treated as final.** Before any
fixture is written, AGENTS.md golden rule 4 requires a cited source (for example ISO 668:2020, or a
named carrier's published container specification sheet). §13 decision 3 asks the founder to approve
either these commonly-quoted figures (with a source added before fixtures are written) or a specific
carrier/standard to cite instead. The tool's content and result panel must say plainly: **"Container
dimensions vary by carrier, manufacturer and container condition — these are commonly used approximate
figures, not a certified specification."**

## 7. Inputs

**Carton:**

| Field | Type | Rule |
|---|---|---|
| `cartonUnit` | `cm` \| `m` \| `mm` \| `in` | Same enum as CBM and Volumetric Weight |
| `cartonLength`, `cartonWidth`, `cartonHeight` | decimal | Required, > 0, ≤ 3 decimal places (reuses `DIMENSION_DECIMALS`) |
| `quantity` | integer | Required, 1 to 1,000,000 (reuses existing `LOGISTICS_QUANTITY_*` codes and `MAX_QUANTITY`) |
| carton weight | — | **Not in first version** (founder's own instruction: "optional carton weight later, not first version unless easy" — see §13 decision 8; adding it changes nothing in §6's dimension logic but raises the container-payload question in §13 decision 9, so it is deferred rather than half-added) |

**Container:**

| Field | Type | Rule |
|---|---|---|
| `containerType` | `20gp` \| `40gp` \| `40hc` \| `custom` | Selects the row from §6's table, or switches to custom fields |
| `containerUnit` | `cm` \| `m` \| `mm` \| `in` | Only used with `custom`; shown only when `containerType = custom` (`visibleWhen`, existing preset mechanism) |
| `customLength`, `customWidth`, `customHeight` | decimal | Required only when `containerType = custom`; > 0 |
| `usablePercent` | decimal (percent) | Optional, one field, applies to both the volume and grid results per §13 decision 5. Range and default per §13 decision 4 |

**Kept out of the first version, per the founder's "keep options simple" instruction:**
- an "orientation allowed" toggle — the operation always evaluates all 6 axis-aligned orientations and
  reports the best one; there is nothing to toggle
- "stackable," "keep upright" and "allow rotation" toggles — the preset schema (`schemas/src/preset.ts`)
  has no boolean field kind today (kinds are `text`, `number`, `money`, `percent`, `enum`,
  `enum-or-number`); modelling a yes/no choice would need either a two-option `enum` field or a new
  boolean kind (a schema change, which per AGENTS.md needs its own issue if the second lane is touched).
  Since "keep upright" and "no rotation" would only *remove* orientations from the 6 already computed —
  a strict subset of what the operation already does — they add UI and validation surface without
  changing the core algorithm, so the plan proposes deferring them. §13 decision 6 asks the founder to
  confirm.

## 8. Outputs

**Volume estimate (Option A layer):**

| Field | Meaning |
|---|---|
| `cartonCbm` | Volume of one carton, m³ |
| `totalCbm` | `cartonCbm × quantity` |
| `containerCbm` | Internal volume of the selected/custom container, m³ |
| `usableCbm` | `containerCbm × usablePercent` (or equal to `containerCbm` if no percentage is set) |
| `volumeFillPercent` | `totalCbm ÷ usableCbm × 100` |
| `cartonsByVolume` | `floor(usableCbm ÷ cartonCbm)` |
| `remainingCbm` | `usableCbm − totalCbm` (can be negative; negative triggers the over-capacity warning) |

**Orientation/grid estimate (Option B layer):**

| Field | Meaning |
|---|---|
| `bestOrientation` | Which of the 6 permutations gave the most cartons (text output, e.g. "Length × Width × Height") |
| `cartonsAlongLength`, `cartonsAlongWidth`, `cartonsAlongHeight` | Per-axis counts for the best orientation |
| `maxCartonsByGrid` | Product of the three counts above — the headline Option B number |
| `leftoverLength`, `leftoverWidth`, `leftoverHeight` | Container dimension minus (count × carton dimension) for the best orientation, in the container's own unit |
| `gridUtilizationPercent` | `(maxCartonsByGrid × cartonCbm) ÷ usableCbm × 100` — how much of the *usable* volume the simple grid actually occupies, always ≤ `volumeFillPercent`'s ceiling and typically well below 100% |

**Warnings** (using the existing `OpWarning`/`code` mechanism in `packages/core/src/result.ts`, the same
pattern as `LOGISTICS_VOLUME_ROUNDS_TO_ZERO` — not booleans, since `outputSchema.format` has no boolean
kind either):

| Code | Meaning |
|---|---|
| `LOGISTICS_CONTAINER_OVER_CAPACITY_VOLUME` | `totalCbm > usableCbm` |
| `LOGISTICS_CONTAINER_OVER_CAPACITY_GRID` | `quantity > maxCartonsByGrid` |
| `LOGISTICS_CONTAINER_LOADING_ESTIMATE_ONLY` | **Always attached**, so the result panel always carries the "this is not a real loading plan" notice regardless of fit — see §2 |

## 9. Formulas

**Volume (m³, all lengths converted to metres first, same conversion table as CBM):**
```
cartonCbm      = cartonLength × cartonWidth × cartonHeight        (in m)
totalCbm       = cartonCbm × quantity
containerCbm   = containerLength × containerWidth × containerHeight (in m; from §6's table or custom input)
usableCbm      = containerCbm × (usablePercent / 100)             (usablePercent = 100 if not set)
cartonsByVolume = floor(usableCbm / cartonCbm)
remainingCbm   = usableCbm − totalCbm
volumeFillPercent = totalCbm / usableCbm × 100
```

**Orientation grid (evaluated in the container's own linear unit, e.g. cm, after converting the carton
into the same unit):**
```
for each of the 6 permutations (a, b, c) of (cartonLength, cartonWidth, cartonHeight):
  along_1 = floor(containerLength / a)
  along_2 = floor(containerWidth  / b)
  along_3 = floor(containerHeight / c)
  count   = along_1 × along_2 × along_3
best = the permutation with the highest count (ties broken by declaration order, i.e. L×W×H wins ties)
```

**Open question — does `usablePercent` apply to the grid result?** Two defensible readings:
- **(a) Volume only.** The grid is a physical count; a physical carton either fits in the grid or does
  not, so "90% usable" doesn't shrink a grid cell. `usableCbm` feeds `cartonsByVolume` and
  `volumeFillPercent` only; `maxCartonsByGrid` is computed against the full `containerCbm` dimensions.
- **(b) Both.** Apply `usablePercent` to each container dimension before the grid division (e.g.
  effective length = `containerLength × usablePercent^(1/3)`, or more simply, dedicate a margin only
  along one axis such as height for the "top space for lashing/ventilation" case) — this is
  **harder to define without an arbitrary rule** for which axis absorbs the loss.

**Recommendation: (a), volume only.** It is unambiguous, it matches how `usablePercent` already behaves
conceptually as "leave X% of the volume as slack," and it avoids inventing an axis-distribution rule that
would need its own justification and citation. §13 decision 5 asks the founder to confirm.

## 10. Validation

| Case | Code | New/existing | `path` |
|---|---|---|---|
| Missing carton dimension, quantity, or (when custom) container dimension | `LOGISTICS_MISSING_INPUT` | existing | field |
| Not a number | `LOGISTICS_INVALID_NUMBER` | existing | field |
| Dimension ≤ 0 | `LOGISTICS_NOT_POSITIVE` | existing | field |
| More than 3 decimal places | `LOGISTICS_TOO_MANY_DECIMALS` | existing | field |
| Quantity not a positive whole number / too large | `LOGISTICS_QUANTITY_*` | existing | `quantity` |
| `usablePercent` outside the approved range (§13 decision 4) | `LOGISTICS_USABLE_PERCENT_OUT_OF_RANGE` | new | `usablePercent` |
| `containerType = custom` but a custom dimension is missing | `LOGISTICS_MISSING_INPUT` | existing (reused) | `customLength`/`customWidth`/`customHeight` |
| Carton does not fit the container in **any** of the 6 orientations (i.e. `maxCartonsByGrid = 0` because at least one axis floors to 0 in every permutation) | `LOGISTICS_CARTON_EXCEEDS_CONTAINER` | new | `cartonLength` (first offending field) |
| `quantity` requested is greater than `maxCartonsByGrid` (and/or `cartonsByVolume`) | `LOGISTICS_CONTAINER_OVER_CAPACITY_GRID` / `_VOLUME` | new, **warning not error** — the calculator still computes and shows the numbers; it warns rather than blocking, since "how many containers would I need" is itself a valid reason to run the tool with a large quantity | `quantity` |

Errors are shown next to the field (`aria-invalid`), exactly as in CBM and Volumetric Weight. Warnings
are shown in the result panel, not as field errors.

## 11. Content requirements

Tool page (T2 sections, same shape as the Volumetric Weight content):
- **What this estimate means**, in the first paragraph, using only the approved language from §2.
- **CBM estimate vs physical fit** — explicitly says why a volume number is not a loading plan.
- **Why exact loading depends on**: packaging and pallets, carton weight and stacking limits, the
  container door opening, the loading method, and load securing/lashing — named individually, not just
  "many factors."
- **How to use the calculator** — carton size, quantity, container choice, optional usable-space %.
- **Method and formulas** — §9, in plain language, with the "volume only" note for `usablePercent`.
- **Orientation explanation** — what "best orientation" means and that only axis-aligned, single-
  orientation grids are checked.
- **Worked example** (hand-computed for this plan, to be re-verified once §6's container source is
  confirmed): a 60 × 40 × 40 cm carton, quantity 500, in a 40 ft standard container, 90% usable space.
  - `cartonCbm` = 0.6 × 0.4 × 0.4 = **0.096 m³**
  - `totalCbm` = 0.096 × 500 = **48.000 m³**
  - `containerCbm` (40GP, §6) = 12.032 × 2.352 × 2.393 ≈ **67.720 m³**
  - `usableCbm` = 67.720 × 0.90 ≈ **60.948 m³**
  - `cartonsByVolume` = floor(60.948 / 0.096) = **634**
  - Best orientation: carton length (60 cm) along the container length, 40 cm along width, 40 cm along
    height → `floor(1203.2/60)=20`, `floor(235.2/40)=5`, `floor(239.3/40)=5` → **20 × 5 × 5 = 500
    cartons**, leftover 3.2 cm (length), 35.2 cm (width), 39.3 cm (height).
  - The two other orientations give 450 each, so 500 is the best — and happens to exactly match the
    requested quantity, a useful example of "the grid estimate, not just the volume estimate, is what
    tells you it's tight."
- **Warnings/disclaimer** — the three standing warnings from §2, verbatim.
- **FAQs** (at least 6): what this estimate does and does not do; why the grid number is usually lower
  than the volume number; container dimension variation by carrier; what "usable space %" means; whether
  weight is considered (not yet — link forward, §13 decision 9); the difference from the CBM Calculator
  (link).
- **References**: the container dimension source once §6's decision is made; the CBM/orientation
  formulas (self-referential, as CBM's own content already documents cubic conversion).
- The professional disclaimer, plus the specific loading-estimate wording from §2.

**SEO metadata:** title 30–60 characters containing "container loading calculator"; description 120–160
characters using approved language only (no "guaranteed," no "exact").

**Search synonyms** (from the task brief): container loading calculator, container capacity calculator,
carton container calculator, how many cartons in container, 20ft container calculator, 40ft container
calculator, shipping container calculator, logistics calculator. ("logistics calculator" is already a
synonym on both CBM and Volumetric Weight — the search relevance tests in TASK-003B already check that
shared synonyms rank sensibly across tools; a third tool sharing it needs the same check extended.)

**Logistics category text** update: once this tool exists, the category summary should name all three
tools (CBM, Volumetric Weight, Container Loading), matching the pattern set when Volumetric Weight was
added in TASK-003B §8.

## 12. Related links

- **Existing, both directions:** CBM Calculator ↔ Container Loading Calculator, Volumetric Weight
  Calculator ↔ Container Loading Calculator (`graph.related`, metadata-only additions to the two
  existing manifests, no version bump — same approach as the CBM ↔ Volumetric Weight link added in
  TASK-003B).
- **Future, not linked yet** (tools do not exist; the pipeline rejects links to non-existent tools, and
  TASK-003B's own plan reached the same conclusion for its forward links): Shipping Cost Calculator,
  Pallet Loading Calculator, Freight Cost Calculator. Mentioned in body text only if the founder wants
  a "coming later" note (§13 decision, mirrors TASK-003B §13 decision 11).

## 13. Out of scope (first version)

Advanced 3D bin packing · mixed carton sizes in one calculation · pallets · weight distribution / axle or
load safety · door clearance checks · fragile-cargo constraints · loading sequence animation · 3D
rendering · PDF reports · CSV import · exports · carrier APIs · live freight rates · booking a shipment ·
AI suggestions · voice · an appointment engine · offline licensing · subscription · analytics · any
change to CBM, Volumetric Weight, other tools, or the homepage layout.

## 14. Implementation split

**Recommended: two PRs**, matching TASK-003A and TASK-003B and AGENTS.md golden rule 1 (one lane per
PR):

| PR | Lane | Content | Visible to users? |
|---|---|---|---|
| **PR 1 — Operation** | `engine-logistics` | `logistics.container.estimate@1` in `engines/logistics`, the container defaults table with its cited source, fixtures, unit tests, README/changelog entry (0.2.0 → 0.3.0) | No |
| **PR 2 — Tool** | `tools` | Preset `logistics/container`, tool `container-loading-calculator` (manifest, content, fixtures), Logistics category text update, related links, tests, screenshots | Yes |

Neither CBM nor Volumetric Weight's operations, fixtures or output change. Their fixtures remain a
regression guard, unaffected by this task, as in TASK-003B.

**Proposed operation name:** `logistics.container.estimate@1` — matches the name already committed in
`docs/phase-1/PHASE-1-BUILD-PLAN.md` §4 and `tasks/TASK-003B-REPORT.md` §7, so this plan does not
introduce a new name (rejecting the task brief's own suggestion of `logistics.container.fit@1` in favour
of consistency with what is already documented elsewhere in the repo). Founder can override in §13 below
if `container.fit` is preferred instead.

## 15. Founder decisions needed

No code will be written until these are answered. Recommendations are marked ★.

1. **Tool name:** ☐ Container Loading Calculator ★ ☐ Container Loading Planner ☐ Carton to Container
   Calculator ☐ Container Capacity Calculator
2. **First-version scope:** ☐ Option A (volume only) ☐ **Option B** (volume + basic orientation grid) ★,
   with the volume and grid numbers shown side by side and the grid described as "a simple estimate,
   real loads often achieve less"
3. **Container dimension source:** ☐ approve the commonly-quoted §6 figures, to be backed by a specific
   citation (ISO 668:2020 or a named carrier sheet) before fixtures are written ★ ☐ found gives a
   specific source/carrier to use instead ☐ founder will supply the exact figures directly
4. **`usablePercent` default and range:** ☐ 90% ★ ☐ 95% ☐ 100% (i.e. no reduction, field still shown so
   users can lower it) ☐ no such field at all in v1. If included: allowed range, e.g. 50–100%
5. **Does `usablePercent` affect the grid result too, or volume only?** ☐ **volume only** ★ (§9) ☐ both,
   founder to specify how the reduction is distributed across axes
6. **Stackable / keep-upright / allow-rotation toggles:** ☐ **omit all three in v1** ★ (the operation
   already tries all 6 axis-aligned orientations; removing user-facing toggles avoids a preset schema
   change) ☐ add one or more now (state which, and whether a boolean field kind should be added to
   `schemas/src/preset.ts` — a second-lane change needing its own issue)
7. **Carton weight in v1:** ☐ **no, defer** ★ (per the founder's own brief) ☐ yes, include a simple
   optional weight field with no container-payload check yet
8. **Multiple carton sizes:** ☐ **postponed** ★ (single carton type per calculation, as CBM and
   Volumetric Weight both do today) ☐ needed now
9. **Container maximum payload weight check:** the Phase 1 plan's one-line description calls this tool a
   "volume **and weight** estimate." This plan's scope (from the detailed brief) is volume/orientation
   only, with carton weight deferred (decision 7). ☐ **volume/orientation only in v1, weight capacity is
   a later task** ★ ☐ add a simple "does total shipment weight exceed container X payload" check now
   (needs a cited payload-limit table per container type, similar to §6)
10. **Show only the estimate, or the simple grid result too:** ☐ **both** ★ (this is what Option B
    means) ☐ estimate only (falls back to Option A)
11. **Implementation split:** ☐ **two PRs, operation then tool** ★ (one lane per PR) ☐ one PR
12. **Operation name:** ☐ **`logistics.container.estimate@1`** ★ (already documented elsewhere in the
    repo) ☐ `logistics.container.fit@1` (from the task brief) ☐ another name
13. **Forward mentions of not-yet-built tools** (Shipping Cost, Pallet Loading, Freight Cost): ☐ **no
    mention until they exist** ★ ☐ a plain-text "coming later" note

## 16. Acceptance checklist (for the eventual PRs — nothing here is done yet)

**PR 1 — operation**
- [ ] `logistics.container.estimate@1` added to `engines/logistics`; architecture check green; only
      `@mangotools/engine-numeric`, `@mangotools/core` and `zod` imported
- [ ] Container default dimensions backed by a cited source (§13 decision 3 resolved first)
- [ ] All fixtures pass, each hand-verified and cited; CBM and Volumetric Weight fixtures unchanged and
      passing
- [ ] Every §10 case returns a typed error or warning with the right `path`/`code`; nothing throws for
      user input
- [ ] The 6-orientation loop is O(1) per call regardless of `quantity`; function size and complexity
      within AGENTS.md limits
- [ ] Engine README and changelog → 0.3.0
- [ ] No tool, preset or UI change
- [ ] CI green on Node 24 × Chromium / Firefox / WebKit

**PR 2 — tool**
- [ ] `/container-loading-calculator` works for all four container types (3 presets + custom) and all
      four length units
- [ ] Shows the volume estimate and the orientation/grid estimate side by side, with the "simple
      estimate, not a loading plan" wording from §2 always visible
- [ ] Over-capacity warnings (volume and/or grid) appear correctly when quantity exceeds the estimate
- [ ] Content includes every §11 section, the three standing warnings verbatim, and the worked example
- [ ] Related links to CBM and Volumetric Weight in both directions; Logistics category text names all
      three tools
- [ ] Search synonyms from §11 all resolve to this tool; "logistics calculator" still ranks all three
      tools sensibly
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility 100, SEO 100; JS budgets held
- [ ] CI green on Node 24 × Chromium / Firefox / WebKit, including determinism
- [ ] A TASK-003C report after both PRs merge

**Estimated effort:** PR 1 ≈ 1–1.5 days (more fixtures than CBM or Volumetric Weight, due to the 6
orientations); PR 2 ≈ 1 day.
