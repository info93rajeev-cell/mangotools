# TASK-003D — Pallet Loading Calculator (plan only)

> **Planning document. No code has been written, no schema, preset, manifest or content file has been
> created, and no existing tool has been touched.** This is the fourth Logistics tool, after the CBM
> Calculator (TASK-003A), the Volumetric Weight Calculator (TASK-003B) and the Container Loading
> Calculator (TASK-003C). It draws directly on what TASK-003C's two PRs and its final report established
> — the same engine, several of the same conventions, and two concrete lessons carried forward (§5).

## 1. Goal

Help a user estimate **how many cartons of one size fit on a pallet, in how many layers, and how many
pallets a given quantity needs**, from carton dimensions, a pallet type (or custom pallet), and a maximum
stack height. The first version is:

- **deterministic** — same inputs always give the same output, computed in the browser, no network call,
  no AI;
- **footprint- and grid-based** — a simple 2D base-orientation fit per layer, stacked to a height limit,
  not pallet-load optimisation, not a stability or weight calculation;
- **conservative in its claims** — see §2.

It reuses the existing `engines/logistics` engine (no new engine), following the same
operation → preset → tool → content pipeline, and the same two-PR split, as TASK-003A, TASK-003B and
TASK-003C.

## 2. Product safety — no-overpromise rules

This tool sits next to a Container Loading Calculator that already carries the same caution, and needs
it more, not less: a pallet load fails in the real world (crushed cartons, a tipped stack, a rejected
shipment) more easily and more visibly than a container load does, so the wording has to be at least as
careful.

**Never claim, state or imply:**
- perfect or optimised palletising
- a guaranteed real-world fit
- load-safety approval, or that the result is safe to ship or stack as shown
- a warehouse-engineered result
- a replacement for review by a logistics, warehouse or packaging professional

**Approved language, used throughout the UI and content:**
- "estimate" / "estimated cartons per pallet"
- "planning aid"
- "simple grid fit"
- "check before shipment"
- "verify with your logistics or warehouse professional before shipment"
- "not advanced pallet optimisation"

**Standing warnings on every successful result** (final wording drafted in §10, not fixed):
1. A footprint and layer fit does not guarantee a safe, stable real-world stack.
2. This is not a load-safety, weight-distribution or stability calculation.
3. Verify the final pallet load with your logistics or warehouse professional, and against your
   carrier's requirements, before shipment.

`disclaimer: professional` is necessary but not sufficient, exactly as TASK-003C's report concluded for
the Container Loading Calculator (§2 there) — the content and result panel carry the specific wording
above, not only the generic disclaimer banner.

## 3. Tool name

| Option | Reads as | Risk |
|---|---|---|
| 1. **Pallet Loading Calculator** | A calculator that estimates a number | Low — matches the "Container Loading Calculator" naming pattern exactly, and "calculator" sets the right expectation |
| 2. Pallet Capacity Calculator | Reasonable, close to Option 1 | Low, but breaks the naming parallel with the Container Loading Calculator and matches "container capacity calculator" less as a paired concept |
| 3. Carton to Pallet Calculator | Accurate but undersells the tool | Medium — reads like a unit converter, weaker match to "how many cartons on a pallet" search intent |
| 4. Pallet Planner | Implies an actual load plan | **Higher** — "planner" suggests a stacking sequence or a real plan, which is explicitly out of scope; the same reasoning ruled out "Container Loading Planner" in TASK-003C §3 |

**Recommendation: Option 1, "Pallet Loading Calculator."** It mirrors the Container Loading Calculator's
name and slug pattern (`pallet-loading-calculator`, `container-loading-calculator`), keeps "calculator"
rather than "planner" for the same overpromise reason already applied twice in this Logistics group, and
matches the plain-language search terms in §11. Founder confirmation requested in §15, decision 1.

## 4. Option A vs Option B

### Option A — Simple Pallet Capacity Calculator

Carton footprint and pallet footprint compared with a fixed orientation (carton length along pallet
length, carton width along pallet width); layers from stack height; no orientation search.

### Option B — Basic Orientation Fit

Adds a small, safe orientation search on top of Option A:

- **Base rotation** (on by default): try the carton's footprint both ways — length along the pallet's
  length, or width along the pallet's length — and keep whichever gives more cartons per layer.
- **Keep upright** (on by default): the carton's own height stays the vertical (stacking) axis. Only the
  two base-rotation orientations above are tried.
- **If "keep upright" is turned off**: the carton may also lie on its side, so up to 6 axis-aligned
  orientations are tried (the carton's length, width or height could each be the vertical axis) —
  structurally the exact same search `logistics.container.fit@1` already does for a container's three
  axes (§5). The founder's own brief calls this the higher-risk case ("carton height rotation may not be
  allowed in real logistics"), so it is opt-in only, off by default, and the content must say plainly
  that turning it off assumes the carton is safe to lay on its side.

### Comparison

| | Option A | Option B |
|---|---|---|
| Deterministic | Yes | Yes |
| New engine concepts | Floor division on two axes, layers from height | + up to a 6-permutation orientation search (reusable from `container-fit`, see §5) |
| Value to user | A single, fixed-orientation footprint count | The orientation that actually fits the most cartons — often meaningfully higher than the fixed orientation, since which side faces which way matters a great deal on a pallet |
| Risk of overclaiming | Lower | Slightly higher when "keep upright" is off — mitigated by keeping it off by default and stating the assumption plainly |
| Engine complexity | Very low | Low, and most of it (the orientation search) already exists and is proven in `container-fit` |

## 5. Recommended first version: **Option B**

The founder's stated preference is Option B "if it stays simple and deterministic," and it can be, for
the same reason TASK-003C's Container Loading Calculator could: **a pallet is, mathematically, a
container with a length, a width and a stack-height limit in place of a container's three fixed
dimensions.** With "keep upright" on (the default), only 2 orientations are tried — no more complex than
Option A plus one comparison. With "keep upright" off, it is exactly `container-fit`'s existing 6-way
search, already built, fixture-tested and shipped.

**Two concrete lessons from TASK-003C carry forward into this plan (from its PR 1/PR 2 and final
report):**

1. **`stackable`, `allowBaseRotation` and `keepUpright` must be designed as operation *params* from the
   start, not input.** TASK-003C's `logistics.container.fit@1` originally put its three equivalent
   booleans on the operation's input in PR 1, then had to move them to params in PR 2, because this
   codebase's only mechanism for a genuine boolean toggle in a tool's UI is a preset `userOptions` entry
   with `control: switch`, and the runtime always sends that as params, never input. `logistics.pallet.fit@1`
   should put these three booleans on **params** in PR 1 itself, avoiding a repeat of that rework.
2. **An enum output with no display-label mapping (like `bestOrientation` or `billedOn`) is described in
   the working panel, not as a dedicated labelled output row**, because this codebase's output schema has
   no value-to-label mechanism yet (raised as an open question in both the Container Loading and
   Volumetric Weight reports). The same applies here to whichever orientation code is chosen.

**Recommendation stands on one condition, as it did for Container Loading:** the tool must show
**"total cartons per pallet"** and **"pallets required"** together and clearly labelled, so a large
`pallets required` number for a large `quantity` reads as "you need N pallets," not as a malfunction.

## 6. Proposed operation design

**Operation:** `logistics.pallet.fit@1` (the founder's own suggested name — kept, for the same reason
TASK-003C kept the name already documented in the Phase 1 plan rather than inventing a new one), in
`engines/logistics/src/operations/pallet-fit/` (`schema.ts`, `pallets.ts` for the default table, a
`grid.ts` or a shared import, `operation.ts`, `README.md`, `pallet-fit.test.ts`, `fixtures/`). Runtimes
`['worker', 'node']`, `cost: light`, `exposure: internal`, `dataClass: public` — the same profile as the
other three operations. Pure, no throws on user input, decimal strings through `@mangotools/engine-numeric`,
each output rounded once from its own full-precision value.

No new engine, no new package. Engine version bumps from 0.3.2 → 0.4.0 (an engine README changelog
entry; changesets are still not set up in Phase 1).

**Implementation note for PR 1 (not a decision the founder needs to make, just a recommendation):**
because the orientation search in §4/§5 is structurally identical to `container-fit`'s, PR 1 should
extract `floorCount`, `ORIENTATIONS`, `orientationsToTry`, `bestOrientation` and `leftovers` from
`engines/logistics/src/operations/container-fit/grid.ts` into a shared
`engines/logistics/src/lib/orientation-grid.ts`, and have both operations import it. This is a
same-lane, behaviour-preserving refactor (`container-fit`'s own fixtures and tests would need to keep
passing unchanged), not a second lane — it only touches `engines/logistics`. If this refactor is judged
too large for a "PR 1 is engine-only, otherwise unchanged" scope, duplicating the ~70 lines instead is
also acceptable; either way, the two operations' orientation logic must stay behaviourally identical.

### Pallet defaults (constants table)

Commonly published **approximate** pallet base dimensions, in centimetres, for the two named standards
(ISO 6780 lists six pallet sizes worldwide; these are the two most common in general freight):

| Type | Length | Width | Footprint |
|---|---|---|---|
| Euro pallet (EUR/EPAL, ISO 6780) | 120 cm | 80 cm | 0.96 m² |
| US pallet (GMA, "48×40") | 121.9 cm (48 in) | 101.6 cm (40 in) | 1.239 m² |
| Custom | user-entered | user-entered | computed |

**Not yet cited to a specific dated source** — the same caveat TASK-003C applied to its container
dimensions (its plan §6, its PR 1 README, and its report §5 point 3). Per founder decision 15, these are
proposed as reference defaults only, to be verified against a specific citable source (for example the
ISO 6780 standard itself, or EPAL's own published pallet specification) before fixtures are written or
the tool is treated as authoritative. The tool's content must say plainly that pallet dimensions, safe
stack height and load capacity vary by pallet type, condition, packaging, warehouse practice and carrier
requirements.

**Maximum stack height has no proposed default.** Unlike a shipping container, which has one fixed
internal height per type, a safe or permitted pallet stack height depends on the carton, the transport
mode, the warehouse racking and the carrier — there is no single defensible default to pre-fill. The
plan recommends **leaving it required, with no default value**, so the user must state their own limit
rather than the tool suggesting one it cannot stand behind. Founder decision 5 asks whether to confirm
this or supply a specific default anyway.

**The pallet's own deck height is not modelled.** "Maximum stack height" is defined as the load height
above the pallet deck (matching what a user would read off a warehouse or trailer height limit), not the
combined pallet-plus-load height. This is a modelling simplification worth the founder's explicit
sign-off, not a silent assumption — see §15, and it is stated in the content.

## 7. Inputs

**Carton:**

| Field | Type | Rule |
|---|---|---|
| `unit` | `cm` \| `m` \| `mm` \| `in` | Same enum as the other three logistics tools |
| `length`, `width`, `height` | decimal | Required, > 0, ≤ 3 decimal places |
| `quantity` | integer | Required, 1 to 1,000,000 (same rule as the other three tools) |

**Pallet:**

| Field | Type | Rule |
|---|---|---|
| `palletType` | `euro` \| `us` \| `custom` | Selects the row from §6's table, or switches to custom fields |
| `palletUnit` | `cm` \| `m` \| `mm` \| `in` | Only used with `custom`; shown only when `palletType = custom` |
| `palletLength`, `palletWidth` | decimal | Required only when `palletType = custom`; > 0 |
| `maxStackHeight` | decimal | Required always (own unit, §6); > 0. No pre-filled default (§6) |

**Params** (booleans — designed as params from the start, per §5's first lesson):

| Param | Default | Effect |
|---|---|---|
| `stackable` | `true` | `false` caps layers to 1 |
| `allowBaseRotation` | `true` | `false` tries only the carton's given length-along-length, width-along-width footprint |
| `keepUpright` | `true` | `false` allows the carton's height to become the footprint axis too (up to 6 orientations, §4) |

**Kept out of the first version:**
- an "overhang allowed" toggle. Floor-division counting can never place a carton partly off the pallet,
  so overhang is already impossible by construction — there is nothing to toggle, and no separate
  calculation is needed (this resolves founder decision 11: overhang is not modelled, not because it was
  turned off, but because the arithmetic cannot produce it).
- a usable-area percentage. Unlike the Container Loading Calculator, this tool has no separate
  volume/usable-volume estimate for a percentage to apply to (§9's "why no usable-area field" explains
  this in full) — recommendation: omit it, subject to founder decision 6/7.
- carton or pallet weight, and pallet load-capacity — postponed per the founder's own brief and the
  matching decision already made for Container Loading (its plan §13 decision 9, its report §6
  question 3).

## 8. Outputs

| Field | Meaning |
|---|---|
| `bestOrientation` | which orientation gave the most cartons per layer (not a dedicated labelled row — stated in the working panel, §5's second lesson) |
| `cartonsAlongPalletLength`, `cartonsAlongPalletWidth` | per-axis counts for the best orientation |
| `cartonsPerLayer` | the two counts multiplied together |
| `layers` | `floor(maxStackHeight ÷ carton height on the vertical axis)`, capped to 1 if `stackable: false` |
| `cartonsPerPallet` | `cartonsPerLayer × layers` — one pallet's capacity |
| `palletsRequired` | `ceil(quantity ÷ cartonsPerPallet)` |
| `cartonsOnLastPallet` | `quantity mod cartonsPerPallet` (or `cartonsPerPallet` itself when the quantity divides exactly, so the figure always reads as "cartons on the last pallet," never a confusing zero) |
| `usedAreaPercent` | `(carton footprint × cartonsPerLayer) ÷ pallet footprint × 100` |
| `unusedAreaPercent` | `100 − usedAreaPercent` |
| `estimatedStackHeight` | `layers × carton height on the vertical axis` (can be less than `maxStackHeight` when it does not divide evenly) |
| `leftoverPalletLength`, `leftoverPalletWidth` | pallet axis minus cartons × carton dimension, for the best orientation |

**Warnings** (the `OpWarning` mechanism already used by all three existing operations):

| Code | Meaning |
|---|---|
| `LOGISTICS_PALLET_NOT_STABILITY_CHECKED` | always — footprint and layer fit is not a load-safety or stability calculation |
| `LOGISTICS_PALLET_VERIFY_PROFESSIONAL` | always — verify with a logistics/warehouse professional and the carrier before shipment |
| `LOGISTICS_PALLET_MULTIPLE_PALLETS_REQUIRED` | when `palletsRequired > 1` |

**Errors**, more specific than Container Loading's single combined error, because the footprint and the
height are different physical constraints and a user benefits from knowing which one failed:

| Code | Meaning |
|---|---|
| `LOGISTICS_CARTON_EXCEEDS_PALLET_BASE` | the carton's footprint does not fit the pallet base in any orientation tried |
| `LOGISTICS_CARTON_TALLER_THAN_STACK_LIMIT` | the carton's height (on the vertical axis) is taller than `maxStackHeight`, so `layers` would be 0 |

## 9. Formulas

```
cartonsAlongPalletLength = floor(palletLength / cartonDimensionOnThatAxis)
cartonsAlongPalletWidth  = floor(palletWidth  / cartonDimensionOnThatAxis)
cartonsPerLayer          = cartonsAlongPalletLength × cartonsAlongPalletWidth
                            (best of 2 orientations with keepUpright, up to 6 without — §4)
layers                   = floor(maxStackHeight / cartonHeightOnVerticalAxis)
                            (capped to 1 if not stackable)
cartonsPerPallet         = cartonsPerLayer × layers
palletsRequired          = ceil(quantity / cartonsPerPallet)
cartonsOnLastPallet      = quantity mod cartonsPerPallet, or cartonsPerPallet if that is 0
usedAreaPercent          = (cartonLength × cartonWidth × cartonsPerLayer) / (palletLength × palletWidth) × 100
unusedAreaPercent        = 100 − usedAreaPercent
estimatedStackHeight     = layers × cartonHeightOnVerticalAxis
leftoverPalletLength     = palletLength − cartonsAlongPalletLength × cartonDimensionOnThatAxis
leftoverPalletWidth      = palletWidth  − cartonsAlongPalletWidth  × cartonDimensionOnThatAxis
```

**Why there is no usable-area-percentage field, unlike Container Loading's usable-volume-percentage.**
Container Loading has two independent estimates — a volume estimate (which usable % reduces) and a grid
estimate (which it does not). Pallet Loading, per the founder's own output list, has only the one,
grid-based estimate; there is no separate "usable footprint" figure for a percentage to reduce before
the grid runs, and applying it to the grid itself would repeat the same "a carton either fits a cell or
it does not" reasoning that made Container Loading's usable % apply to volume only. Recommendation:
leave it out of v1 (founder decision 6/7 can override this).

## 10. Validation

| Case | Code | New/existing | `path` |
|---|---|---|---|
| Missing/invalid/zero/negative carton dimension | `LOGISTICS_MISSING_INPUT` / `LOGISTICS_INVALID_NUMBER` / `LOGISTICS_NOT_POSITIVE` / `LOGISTICS_TOO_MANY_DECIMALS` | existing | field |
| Quantity not a positive whole number, or too large | `LOGISTICS_QUANTITY_*` | existing | `quantity` |
| Custom pallet: missing/invalid/non-positive `palletUnit`/`palletLength`/`palletWidth` | same codes as above | existing (reused) | field |
| `maxStackHeight` missing, invalid, or ≤ 0 | `LOGISTICS_MISSING_INPUT` / `LOGISTICS_INVALID_NUMBER` / `LOGISTICS_NOT_POSITIVE` | existing (reused) | `maxStackHeight` |
| Carton footprint does not fit the pallet base in any orientation tried | `LOGISTICS_CARTON_EXCEEDS_PALLET_BASE` | new | — |
| Carton height taller than `maxStackHeight` on the vertical axis | `LOGISTICS_CARTON_TALLER_THAN_STACK_LIMIT` | new | `maxStackHeight` |
| `quantity` more than one pallet holds | `LOGISTICS_PALLET_MULTIPLE_PALLETS_REQUIRED` | new, **warning, not error** — the tool still computes `palletsRequired` and shows it; it is expected behaviour, not a blocking problem | — |

Field errors are shown next to the field, as in the other three logistics tools; warnings are shown in
the result panel.

## 11. Content requirements

Tool page (T2 sections this codebase's content pipeline accepts: `## How to use`, `## Method`,
`## Worked example`, `## FAQ`, `## References` — TASK-003C's report §3 found that a custom heading is
rejected at `pnpm gen`, so every other topic below is prose inside `## Method`, matching how Container
Loading's content is structured):

- what a pallet loading estimate means, and the difference between a footprint/layer fit and a real,
  safe pallet load
- why exact pallet loading depends on carton strength, weight, centre of gravity, pallet type and
  condition, stretch-wrap or strapping, overhang, warehouse method and carrier rules — named
  individually, not just "many factors" (matching how Container Loading's content named its own list)
- the base-orientation and layer-fit explanation, including what "keep upright" and "allow base
  rotation" change, and an explicit caution that turning "keep upright" off assumes the carton can
  safely be laid on its side
- how to use; the formulas from §9
- a worked example (§ below)
- the three standing warnings from §2, verbatim
- **at least 6 FAQs**, covering: what the estimate does and does not do; why the footprint orientation
  matters so much (the worked example's 6-vs-8-per-layer difference is a good illustration); pallet
  dimension accuracy and the founder-decision-15 caveat; what happens when the quantity needs more than
  one pallet; whether stacking height includes the pallet's own height (it does not, §6); and the
  difference from the Container Loading Calculator
- references: the pallet dimension source once §15 decision 4 is resolved; ISO 6780 by name

**Worked example** (hand-computed for this plan, exact decimal arithmetic, to be re-verified once §6's
pallet-dimension source is confirmed): a 40 × 30 × 20 cm carton, quantity 100, on a Euro pallet
(120 × 80 cm), maximum stack height 150 cm, all defaults (stackable, base rotation and keep-upright all
on):

- Orientation "length along pallet length" (40 cm along 120 cm, 30 cm along 80 cm):
  `floor(120/40)=3 × floor(80/30)=2 = 6` cartons per layer.
- Orientation "width along pallet length" (30 cm along 120 cm, 40 cm along 80 cm):
  `floor(120/30)=4 × floor(80/40)=2 = 8` cartons per layer — the better orientation, and an **exact**
  fit with no leftover space on either axis.
- `layers = floor(150/20) = 7`; `cartonsPerPallet = 8 × 7 = 56`.
- `palletsRequired = ceil(100/56) = 2`; `cartonsOnLastPallet = 100 mod 56 = 44`.
- `usedAreaPercent = (0.4 × 0.3 × 8) / (1.2 × 0.8) × 100 = 100%`; `unusedAreaPercent = 0%`.
- `estimatedStackHeight = 7 × 20 = 140 cm` of the 150 cm allowed (10 cm unused height).

**SEO metadata:** title 30–60 characters containing "pallet loading calculator"; description 120–160
characters, approved language only (no "guaranteed," no "safe to ship").

**Search synonyms** (from the founder's brief): pallet loading calculator, pallet capacity calculator,
carton pallet calculator, how many cartons on a pallet, euro pallet calculator, pallet planner, logistics
calculator. ("logistics calculator" and the general pattern already need to rank sensibly across four
tools now — TASK-003C's own search-relevance test already had to move from checking the top 2 to the top
3 results when it became the third tool sharing that synonym; adding a fourth tool needs the same test
extended again, to the top 4.)

## 12. Related links

- **Existing, both directions:** CBM Calculator, Volumetric Weight Calculator and Container Loading
  Calculator ↔ Pallet Loading Calculator (`graph.related`, metadata-only additions to three existing
  manifests, no version bump — the same approach used each time a new Logistics tool was added).
- **Future, not linked yet:** Shipping Cost Calculator, Freight Cost Calculator, Warehouse Space
  Calculator. The pipeline rejects links to tools that do not exist; mentioned in body text only if the
  founder wants a "coming later" note (declined every previous time this question was asked — TASK-003B
  §13 decision 11, TASK-003C §15 decision 13 — so the same default recommendation applies here).

## 13. Out of scope (first version)

Advanced pallet-load optimisation · mixed carton sizes in one calculation · weight distribution · pallet
load-safety approval · crush-strength calculation · overhang optimisation (overhang itself cannot occur,
§7) · centre-of-gravity calculation · stretch-wrap or strapping planning · forklift handling rules · 3D
rendering · loading-sequence animation · PDF reports · CSV import/export · carrier APIs · live freight
rates · AI suggestions · voice · an appointment engine · offline licensing · subscription · analytics ·
any change to CBM, Volumetric Weight, Container Loading, other tools, or the homepage layout.

## 14. Implementation split

**Recommended: two PRs**, matching every previous Logistics tool and AGENTS.md golden rule 1:

| PR | Lane | Content | Visible to users? |
|---|---|---|---|
| **PR 1 — Operation** | `engine-logistics` | `logistics.pallet.fit@1` in `engines/logistics`, the pallet defaults table with its cited-pending source, fixtures, unit tests, README/changelog entry (0.3.2 → 0.4.0); optionally the shared `orientation-grid.ts` extraction from §6 | No |
| **PR 2 — Tool** | `tools` | Preset `logistics/pallet`, tool `pallet-loading-calculator` (manifest, content, fixtures), Logistics category text update, related links, tests, screenshots | Yes |

CBM, Volumetric Weight and Container Loading are unaffected: their operations, fixtures and output do
not change (if the §6 shared-library refactor is done, `container-fit`'s own fixtures must still pass
byte-for-byte unchanged — that is the acceptance bar for doing it at all).

## 15. Founder decisions needed

No code will be written until these are answered. Recommendations are marked ★.

1. **Tool name:** ☐ Pallet Loading Calculator ★ ☐ Pallet Capacity Calculator ☐ Carton to Pallet
   Calculator ☐ Pallet Planner
2. **First-version scope:** ☐ Option A (fixed orientation) ☐ **Option B** (base-rotation and
   keep-upright orientation search) ★
3. **Pallet dimension source:** ☐ approve the commonly-quoted §6 figures (Euro 120×80 cm, US 121.9×101.6
   cm), to be backed by a specific citation (ISO 6780, or EPAL's own specification) before fixtures are
   written ★ ☐ founder supplies a specific source or different figures
4. **Default pallet type:** ☐ Euro ★ (more common outside North America and already the smaller,
   more conservative footprint) ☐ US ☐ no default, require an explicit choice
5. **Maximum stack height default:** ☐ **no default, always required** ★ (§6 explains why) ☐ founder
   supplies a specific default value (for example 150 cm or 180 cm) to pre-fill
6. **Usable area percentage in v1:** ☐ **omit it** ★ (§9 explains why there is nothing for it to apply
   to without a separate volume estimate) ☐ include it anyway — founder to specify what it should affect
7. *(Only if decision 6 includes it)* **Does usable area affect the calculation or only a warning?**
   ☐ warning/reference only ★ ☐ reduces the effective pallet footprint before the grid runs
8. **Stackable by default:** ☐ **yes** ★ (matches Container Loading's default) ☐ no
9. **Base rotation by default:** ☐ **yes** ★ (matches the founder's own stated preference) ☐ no
10. **Keep upright by default:** ☐ **yes** ★ (matches the founder's own stated preference, and is the
    safer default per the founder's own caution about height rotation) ☐ no
11. **Overhang in v1:** ☐ **not modelled — impossible by construction, no toggle needed** ★ (§7) ☐
    founder wants a different treatment
12. **Weight in v1:** ☐ **postponed** ★ (matches the founder's own brief and the precedent set for
    Container Loading) ☐ include a simple carton-weight field now
13. **Multiple carton sizes:** ☐ **postponed** ★ (single carton type per calculation, matching every
    other Logistics tool) ☐ needed now
14. **Implementation split:** ☐ **two PRs, operation then tool** ★ (one lane per PR) ☐ one PR
15. **Reference-data verification:** ☐ **confirmed — pallet dimensions are reference values needing
    verification against a cited source before public launch, exactly as Container Loading's container
    dimensions were treated** ★ ☐ founder wants this resolved before PR 1 instead of after

## 16. Acceptance checklist (for the eventual PRs — nothing here is done yet)

**PR 1 — operation**
- [ ] `logistics.pallet.fit@1` added to `engines/logistics`; architecture check green; only
      `@mangotools/engine-numeric`, `@mangotools/core` and `zod` imported
- [ ] `stackable`, `allowBaseRotation` and `keepUpright` are **params**, not input, from the start
      (§5's first lesson) — verified by a preset-free unit test that passes them as params
- [ ] Pallet default dimensions backed by a cited source (§15 decision 3 resolved first), or clearly
      flagged pending if the founder proceeds without one now
- [ ] All fixtures pass, each hand-verified and cited; CBM, Volumetric Weight and Container Loading
      fixtures unchanged and passing (including `container-fit`'s own fixtures, unchanged byte-for-byte,
      if the §6 shared-library refactor is done)
- [ ] Every §10 case returns a typed error or warning with the right `path`/`code`; nothing throws for
      user input
- [ ] `palletsRequired`/`cartonsOnLastPallet` are correct for exact multiples, non-multiples, and a
      quantity smaller than one pallet's capacity
- [ ] Engine README and changelog → 0.4.0
- [ ] No tool, preset or UI change
- [ ] CI green on Node 24 × Chromium / Firefox / WebKit

**PR 2 — tool**
- [ ] `/pallet-loading-calculator` works for both named pallet types, custom, and all four length units
- [ ] Shows total cartons per pallet and pallets required together and clearly (§5's condition)
- [ ] The multiple-pallets warning and the two new errors all show correctly worded, field-appropriate
      messages
- [ ] Content includes every §11 section, the three standing warnings verbatim, and the worked example
- [ ] Related links to CBM, Volumetric Weight and Container Loading in both directions; the Logistics
      category text names all four tools and no others
- [ ] Search synonyms from §11 all resolve to this tool; the "logistics calculator" search-relevance
      test is extended to the top 4 results, matching TASK-003C's own precedent for extending it to 3
- [ ] `tests/support/tool-page.ts`'s shared `SAMPLES` map includes the new tool (this was a real gap
      caught mid-way through TASK-003C PR 2 — do it from the first commit this time)
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility 100, SEO 100; JS budgets held
- [ ] CI green on Node 24 × Chromium / Firefox / WebKit, including determinism
- [ ] A TASK-003D report after both PRs merge

**Estimated effort:** PR 1 ≈ 1–1.5 days (less if the orientation-grid code is shared rather than
rewritten); PR 2 ≈ 1 day.
