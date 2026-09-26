# TASK-006A — Quantity Survey / Civil Tools Wave Foundation (plan only)

> **Planning document. No code has been written, no schema, engine, preset, manifest or content file has
> been created, no dependency added, and no existing tool has been touched.** This plans the first wave of
> Quantity Survey / Civil tools, the platform's sixth tool category and the first that is not a scaffolded
> slot waiting to be filled — unlike `pdf` and `media`, no `civil`/`construction`/`quantity-survey` entry
> exists anywhere in `taxonomy/categories.yaml` yet, so this wave's foundation work includes adding the
> category itself, not just its first tool.

## Context

- **Current platform:** 14 live tools across 5 visible categories — Developer & Data (3), Business &
  Finance (3), Logistics (4), PDF & Documents (2), Image & Media (2). TASK-005 is closed; its checkpoint
  report (`tasks/TASK-005-IMAGE-WAVE-CHECKPOINT-REPORT.md`) recommended Quantity Survey / Civil calculators
  as the next wave specifically because every live category today is either a generic public utility
  (Developer & Data, Everyday Utilities — scaffolded, still empty) or document/image processing, and none
  serves a distinct professional trade the way a construction-quantities category would.
- **No existing taxonomy scaffold.** `pdf` and `media` both existed in `taxonomy/categories.yaml` before
  their waves started (empty, awaiting tools); this wave adds a genuinely new category entry from scratch.
- **Target public direction:** MangoTools / "Beyond the AI Tools" — professional tools for work that should
  not depend on AI, with every check and step shown. This wave's audience (BOQ preparation, site quantity
  checks, contractor estimates, civil engineering students, construction professionals, small builders,
  material planning) is closer to this platform's original Logistics category (a real professional trade)
  than to its Developer/PDF/Image categories (general-purpose utilities).

## Why this planning task exists

Unlike the PDF and Image waves, this wave's *engineering* risk is low — the actual math is closer to
`logistics.cbm.compute@1` (length × width × height × unit, exact decimal arithmetic, rounded once) than to
anything requiring a DOM exception or a redefined determinism bar. **This wave's real risks are different in
kind, not degree:**

- **Liability-adjacent domain.** A wrong CBM or a wrong resized image is inconvenient; a wrong concrete
  volume, rebar weight, or brickwork quantity can cost real money (over/under-ordering material) or, if a
  user mistakes an estimation aid for a certified figure, worse. Wording discipline matters more here than
  in any prior wave — see the dedicated privacy/trust section (§5).
- **Reference-data risk.** Several candidate tools (Rebar Weight, Cement Sand Aggregate, Brickwork) depend
  on a published standard figure (a bar-weight-per-metre table, a dry-volume conversion factor, a brick
  size) rather than pure geometry. Each such figure needs a cited source and a stated "may vary by
  region/standard" caveat, the same discipline TASK-003D already established for pallet/container default
  dimensions.
- **Regional convention risk.** Construction units, material names, and standard sizes (a "brick," a
  "bag of cement," a rebar diameter) are not universal the way a PDF page or a resized image is. The
  founder's own brief names Indian construction context as a specific consideration (§3 Q5) — this must be
  a stated default, not a silent assumption baked into the arithmetic.
- **Scope-creep risk toward genuinely different tool shapes.** Bar Bending Schedule and BOQ export are not
  harder versions of a single-shot calculator — they are multi-row, project-level datasets, a UI/output
  shape this platform has never built (every existing tool produces one result from one set of inputs).
  This plan classifies both as Complex and keeps them explicitly out of scope (§1 item 10, §7), matching the
  discipline TASK-005A used for Background Remover and Image Crop.
- **No new engine-purity exception needed — a genuine relief.** Every candidate tool in this wave is pure
  arithmetic on numbers the user types in. Unlike `engines/image` (`runtimes: ['worker']` only, DOM-adjacent
  canvas APIs, a redefined determinism bar), a `civil` engine can be fully Node-native, `runtimes: ['worker',
  'node']`, and rejoin the full byte-identical cross-browser determinism suite from day one — no founder
  sign-off needed on that front, unlike TASK-004A's and TASK-005A's own load-bearing findings.

## 1. Candidate tools, classified

| # | Tool | Class | Why |
|---|---|---|---|
| 1 | **Concrete Quantity Calculator** | **Simple–Medium** | Pure geometry (volume of a rectangular slab/beam/column/footing) × member count, plus a wastage %. Reuses `logistics.cbm.compute@1`'s exact shape and exact-decimal discipline almost directly. The one real design question is supporting multiple member types (slab/beam/column/footing) cleanly in one tool without it becoming a mini-BOQ — see §6. |
| 2 | **Excavation Calculator** | **Simple** | Also straight volume (length × width × depth); fewer natural "member type" variants than concrete. Becomes Medium only if sloped-side (batter) excavation is included, since that needs a trapezoidal cross-section formula instead of a plain rectangular prism. |
| 3 | **Brickwork Calculator** | **Medium** | Needs a real material-quantity formula, not just geometry: wall volume, minus openings (doors/windows), divided by (brick size + mortar joint thickness), with a standard wastage %. Carries genuine reference-data risk — brick size and joint thickness are regional conventions (§3 Q5), not universal constants — and a secondary mortar-volume output. |
| 4 | **Plaster Calculator** | **Simple–Medium** | Area × thickness = volume, plus an optional cement:sand mix-ratio split. Similar shape to Brickwork's mortar side without the brick-count complexity, but is the first tool in this list to need a *ratio* input (not just a dimension), which the concrete/excavation tools do not. |
| 5 | **Tile / Flooring Calculator** | **Simple** | Area ÷ tile area × wastage %. One of the simplest formulas in this list and very high search volume, but the **lowest professional differentiation** of the group — floor-tile calculators are already common on generic converter/utility sites, which is exactly the kind of tool this wave exists to move beyond as a *first* tool (though it remains a good later, high-traffic addition). |
| 6 | **Paint Calculator** | **Simple** | Area × coats ÷ coverage-per-litre. The simplest formula in this list; also the lowest professional differentiation — this shape is essentially a paint-brand marketing calculator everywhere it already exists. |
| 7 | **Rebar Weight Calculator** | **Simple–Medium** | The formula itself (length × count × standard weight-per-metre for a given bar diameter) is simple, but the **standard bar-weight table is a cited-reference question**, not an arithmetic one — the same "default figures need a verifiable source" flag TASK-003D raised for pallet/container dimensions, here for something closer to a safety-adjacent number (rebar is structural). |
| 8 | **Formwork / Shuttering Area Calculator** | **Simple–Medium** | Surface area of the formwork contact faces for a slab/beam/column — geometrically simple, but requires care about *which* faces are actually formed for each member type (for example, a slab typically needs soffit + edge formwork but not a "top" face), so the member-type logic carries more nuance than its arithmetic does. |
| 9 | **Cement Sand Aggregate Calculator** | **Medium** | Splits a *wet* concrete volume into *dry* material quantities (cement bags, sand, aggregate) via a mix ratio and a dry-volume conversion factor (commonly cited as roughly 1.54–1.57×, itself a figure that varies by source). A genuinely separate calculation from Concrete Quantity's volume-only output, with its own disclosable, citation-needed assumption. |
| 10 | **Bar Bending Schedule Calculator** | **Complex** | A real BBS is a multi-row, per-bar-shape schedule (straight length, bend deductions, hook allowances, typically per IS 2502 or an equivalent standard) — a structured, project-level *dataset*, not a single-shot calculator. This is the same "multi-row project schedule" shape the founder's own brief already flags as out of scope for this wave (§7), and the same *kind* of complexity Bar Bending Schedule and BOQ export share: neither is a harder version of what this platform's calculators already do, both need a genuinely new output/UI shape this wave does not build. |

## 2. First tool recommendation

The founder's expected first tool is **Concrete Quantity Calculator**. This plan checks that against
Excavation, Brickwork, Rebar Weight, and Tile/Flooring, on the axes that mattered for PDF Merge's and Image
Resize's own selection: **engineering/reference-data risk**, **infrastructure/pattern value** (does building
it prove the shape every later tool in this category needs), and **professional differentiation**.

| Tool | Reference-data risk | Introduces the "multiple member types" pattern? | Professional differentiation | Search demand |
|---|---|---|---|---|
| **Concrete Quantity** | None — pure geometry, no cited external figure needed for the core volume calc | **Yes** — slab/beam/column/footing, the shape Excavation, Formwork, and (loosely) Brickwork will all need some version of | High — a genuine QS/site task, not a generic utility | Very high ("concrete calculator", "concrete quantity for slab") |
| Excavation | None | Only if batter/sloped-side is included | Medium | High, but a simpler, less "QS-specific" task |
| Brickwork | **Real** — brick size and mortar joint are regional conventions, not constants | Partial — wall "runs" more than distinct member types | High | High |
| Rebar Weight | **Real** — standard bar-weight table needs a cited source (structural-adjacent) | No | High, but narrower audience | Medium–High |
| Tile / Flooring | None | No | **Low** — common on generic utility sites already | Very high |

**Honest finding, matching TASK-004A's and TASK-005A's own pattern:** Excavation is arguably even simpler
to build than Concrete Quantity, and Tile/Flooring has comparable or higher search volume — but neither
teaches the platform the one structural pattern every later tool in this list needs in some form: **a single
calculator that supports several distinct member/use-case types cleanly**, each with its own dimension set,
sharing one wastage/output/warning shape. Brickwork and Rebar Weight both carry real, citation-needed
reference-data risk that is better tackled once this wave's content/disclaimer pattern is proven on a
zero-external-reference tool first. Tile/Flooring, while simple and high-search, is the tool in this list
**least differentiated from generic converter sites** — a poor choice to *lead* a wave whose whole purpose is
to build a more professional category than those sites already offer, though it remains a strong candidate
for a later, simple addition once Concrete Quantity's pattern exists.

**Recommendation: confirm Concrete Quantity Calculator as the first tool.** It has the best combination of
professional relevance and search demand among the zero-reference-risk candidates, it directly reuses
`logistics.cbm.compute@1`'s exact decimal-volume precedent (the lowest engineering risk of any candidate in
this list), and it is the correct tool to first establish the multi-member-type pattern, since it needs that
pattern in its simplest possible form (four rectangular-prism variants, no trapezoids, no openings to
deduct, no ratio inputs) — closing that shape now, deliberately and with tests, rather than discovering it
piecemeal inside Excavation, Brickwork, or Formwork later. **Bar Bending Schedule must not be first** — see
§7 for the full justification, treated as a hard requirement per the founder's own instruction, not a
preference.

## 3. Architecture questions

**1. Should we create a new civil/QS engine package?**
Yes — **`engines/civil`**. A distinct domain from `estimate` (pricing/tax) and `logistics` (freight/cargo),
matching this platform's one-engine-per-domain convention. Unlike `engines/image`, this engine needs **no**
exception to AGENTS.md's engine-purity rule: every candidate formula in §1 is plain arithmetic on numbers
the user provides, with no DOM, no canvas, no file I/O. It should declare `runtimes: ['worker', 'node']`
like every other non-image engine and be fully covered by the existing byte-identical cross-browser
determinism suite from its first operation — a genuine simplification versus the last two waves.

**2. What should the category name be?**
Of the four options offered:
- *Quantity Survey* — precise and professional, but a term primarily known to QS professionals; a small
  builder or student searching for "concrete calculator" is unlikely to search "quantity survey."
- *Civil Engineering* — accurately names the field, but sounds academic and may undersell the practical,
  site-level audience (contractors, small builders) the founder's own brief names first.
- *Construction Calculators* — the most SEO-natural phrase (matches how people actually search: "concrete
  calculator," "brick calculator"), but generic-sounding — it undersells the "more professional than a
  generic converter site" positioning this wave exists to build (§ intro), and reads similarly to
  "Everyday Utilities," this platform's already-scaffolded catch-all category.
- ★ **Civil & Construction** — names the professional field first (distinguishing this category from a
  generic utility/converter list) while staying immediately understandable to every audience the founder
  lists (QS professionals, civil engineering students, contractors, small builders). This plan recommends
  **id/slug `civil`**, name **"Civil & Construction,"** consistent with how existing categories already pair
  a professional name with practical tools (`estimate` engine → "Business & Finance," `logistics` engine →
  "Logistics").

**3. Should the first tools use SI units first?**
Yes. Millimetres, centimetres, and metres, matching this platform's existing metric-first convention
(`logistics.cbm.compute@1`'s own default unit set) and the stated Indian construction context (Q5), where
metric is near-universal in practice.

**4. Should imperial units be supported immediately or later?**
**Recommend later**, as a disclosed, explicit v1 scope reduction — not silently assumed. This differs from
`logistics.cbm.compute@1`, which shipped inches alongside metric units from its first version because
freight/cargo customers routinely expect both; construction quantity work in the platform's stated primary
context (India, Q5) does not carry the same day-one expectation for feet/inches. Recommend SI-only (mm, cm,
m) for the first tool, with imperial added as a fast-follow using the same units-module shape once the
pattern is proven — flagged as Founder Decision 3 (§10) rather than picked unilaterally, since this is a
scope call, not an engineering constraint.

**5. How should we handle Indian construction context?**
Default assumptions, standard references, and terminology should be framed for Indian practice where a
tool needs *some* concrete default — for example, a 50 kg cement bag, and (when Brickwork/Rebar/Cement-Sand-
Aggregate are eventually built) whichever brick size or IS-code bar-weight table is most common in Indian
practice — while keeping the underlying arithmetic unit-agnostic so a non-Indian user can still enter their
own figures. Content must state plainly which convention is assumed and that local codes and practices
vary, mirroring the founder's own required wording (§5) rather than presenting an Indian default as a
universal standard.

**6. Should cost estimation be included in v1 or kept separate?**
**Kept separate, not in v1**, matching the founder's own roadmap note (§7) and out-of-scope list (§6). Cost
estimation needs price data — regional, volatile, and requiring either a user-entered unit rate (a
reasonable future option) or a maintained price database this platform does not have and should not take on
as a maintenance burden alongside a pure quantity calculator. Blending "quantity" with "cost" also risks the
tool being read as a punch-in quote, which is exactly the kind of overclaim risk §5's wording discipline
exists to avoid.

**7. Should wastage % be included in v1?**
Yes. A single, clearly labeled, user-adjustable wastage percentage (sensible default, for example 5%)
applied to the base quantity, shown as its own output line separate from the pre-wastage base quantity and
the wastage-inclusive total — exactly the output shape the founder's own Concrete Quantity brief lists
(§6/§ below).

**8. Should material conversion be separate from quantity calculation?**
Yes, kept as its own future tool (**Cement Sand Aggregate Calculator**, §1 item 9), not bundled into
Concrete Quantity v1. Converting a concrete *volume* into a *material split* needs an additional,
separately-sourced assumption (the mix ratio and the dry-volume conversion factor) that is a genuinely
different calculation with its own citation and disclosure needs — bundling it into the very first civil
tool would compound a second, unrelated reference-data risk before this wave has shipped even one tool's
content/disclaimer pattern.

**9. Should tools produce BOQ-style output later?**
Yes, later, and explicitly out of scope for v1 (§7). A real BOQ needs multi-row, multi-item, likely
multi-tool aggregation — a "project" concept spanning more than one calculation, which this platform has
never built (every existing tool produces one result from one set of inputs in one sitting). This is a new
data/UI shape question for a future planning document, not a v1 feature of any single calculator.

**10. Should PDF/export reports be paid later?**
Recommend **yes, keep as a future, possibly paid/pro-tier feature**, matching the founder's own roadmap note
and the same paid-tier precedent TASK-005A set aside for Background Remover: a feature that costs
meaningfully more to build and maintain than a plain calculator result (report layout, PDF generation, likely
persistence) is a reasonable place to eventually introduce a paid tier, without changing this platform's
core free/no-login positioning for the calculators themselves.

**11. What disclaimers are required?**
See §5 for full wording. In manifest terms: `disclaimer: professional` on every tool in this category,
identical to the field every existing Logistics and Business & Finance tool already sets — no new
disclaimer variant or component is needed.

**12. What validation rules are required?**
- Every dimension: required, a positive real number, with a stated maximum decimal-place precision
  (matching `logistics.cbm.compute@1`'s `DIMENSION_DECIMALS` precedent).
- Member count: a required positive whole number within a sane cap (matching that operation's own
  `MAX_QUANTITY` precedent).
- Wastage %: within a sane range — recommend 0–50%; a value above that almost certainly signals a user
  mistake, not a real wastage rate, and should be rejected with a specific message rather than silently
  accepted.
- A **soft sanity ceiling per dimension** (per the founder's own "unrealistic dimensions if applicable"),
  to catch unit-confusion mistakes (typing metres when centimetres were meant) — for example, flagging a
  slab length far outside any plausible single-member range. Whether this is a hard error or a warning is a
  tool-level design choice, not an architecture question, and should be settled when Concrete Quantity's own
  detailed plan (§6) is implemented.

**13. What tests are required?**
Mirror `logistics.cbm.compute@1`/`logistics.pallet.fit@1` exactly, with **no image-style exception**:
- **Engine (Vitest, Node)**: exact-decimal-string fixtures, one per member type plus every validation/error
  case, matching this platform's standard fixture discipline in full.
- **Cross-browser determinism suite**: full membership from the first operation, since this engine is
  Node-native — unlike the Image wave, no operation here needs excluding.
- **e2e (Playwright)**: the real tool page — field entry, live/explicit result, warnings, error messages —
  using the existing archetype-B calculator pattern already proven by every Logistics and Business & Finance
  tool. No new UI archetype is needed.
- **Accessibility**: the same keyboard-only bar every calculator already meets.

**14. What formulas should be versioned/documented?**
Every formula lives in its operation's own README with a table of formulas (matching
`logistics.cbm.compute@1`'s README precedent exactly), and any formula that depends on a published external
figure (a bar-weight table, a dry-volume factor, a standard brick size — relevant to later tools in this
list, not Concrete Quantity itself) must cite its source and be flagged, per TASK-003D's own precedent, as
needing verification against a specific standard before public launch if the figure was not sourced from one
during planning.

**15. Should professional assumptions be visible in output?**
Yes. Every non-obvious assumption (the wastage %, any mix ratio, any conversion factor, any standard-table
version used) must appear either as an explicit input the user can see and change, or as a stated line in
the working steps or warnings — never a silent constant. This matches this platform's existing "every check
and step is shown" positioning, already proven by every Logistics and Business & Finance calculator's
worked-steps display.

## 4. Foundation design

- **Package location:** `engines/civil/` — `package.json`, `src/index.ts`, `src/errors.ts`,
  `src/operations/concrete-quantity/` (`schema.ts`, `operation.ts`, `README.md`, `*.test.ts`, `fixtures/`),
  mirroring `engines/logistics`'s own layout exactly. A `src/lib/` folder for any helper shared across more
  than one civil operation (for example a units module, once a second operation needs one) follows
  `engines/logistics/src/lib/orientation-grid.ts`'s own precedent for sharing code *within* one engine.
- **Operation naming:** `civil.concrete.quantity@1` — matches this codebase's `<engine>.<subject>.<verb>
  @<major>` convention (`logistics.cbm.compute@1`, `pdf.jpg-to-pdf@1`). Must stay lowercase-kebab per
  `schemas/src/common.ts`'s `operationRef` pattern.
- **Preset naming:** `presets/civil/concrete-quantity.yaml`, one folder per engine, matching
  `presets/logistics/`.
- **Manifest category:** a **new** `civil` category (§3 Q2) — this is the one genuinely new taxonomy entry
  this wave needs, unlike `pdf`/`media`, which existed empty beforehand. Tool slug
  `concrete-quantity-calculator`, matching this platform's existing `-calculator` naming convention
  (`cbm-calculator`, `gst-calculator`).
- **Content structure:** the same five whitelisted headings every tool already uses (`## How to use`,
  `## Method`, `## Worked example`, `## FAQ`, `## References`). `## Worked example` is genuinely useful here
  — more so than for the PDF/Image waves — since "show a real numbers-in, numbers-out example" is exactly
  the professional-transparency positioning this category exists to demonstrate.
- **Fixture strategy:** exact-decimal input/output pairs, one per member type (slab, beam, column, footing)
  plus at least one fixture per validation/error rule, matching `logistics.cbm.compute@1`'s fixture shape
  precisely. **No image-style relaxation** — fixtures assert exact expected decimal strings, as this
  platform's fixtures do everywhere except the disclosed Image exception.
- **Test strategy:** full Node Vitest coverage of the operation (as any non-image engine), full membership
  in the cross-browser determinism suite, e2e coverage via the existing archetype-B calculator pattern — no
  new UI archetype, no new test-harness concept.
- **Output format:** decimal-string volume outputs (m³), formatted through the preset's own
  `format: number` output type exactly like `cbm-calculator`'s preset — **not** `engines/numeric`'s
  money-specific formatting, since these are physical quantities, not currency.
- **Working steps format:** reuse the existing `workingStep` shape (`ref`, `formulaKey`, `variables`,
  `result`, `noteKey?`) from `schemas/src/`/the logistics operations' own schemas, unchanged. **No schema
  change is needed for this wave** — a genuine efficiency versus the PDF and Image waves, both of which
  needed new platform capability (archetype D, a new field kind) before their first tool could ship.
- **Formula explanation format:** preset-level `strings.en` formula-key templates, exactly like
  `presets/logistics/cbm.yaml`'s own `cbm.perCarton`-style keys; the engine README carries the authoritative,
  cited version of each formula.
- **Assumptions/warnings format:** a standing warning on every successful result (the estimation-aid
  wording, §5) plus conditional warnings where relevant (for example, the dimension sanity-ceiling flag from
  §3 Q12), using the existing `OpWarning`/`messageFor` mechanism unchanged — no new warning plumbing needed.
- **Professional disclaimer pattern:** `disclaimer: professional` in the manifest, identical to every
  existing Logistics/Business & Finance tool; the platform's `Disclaimer` component needs no changes.

## 5. Privacy / trust / safety wording

**Safe wording** (the founder's own examples, plus specifics this plan can name):
- "This is an estimation aid."
- "Verify quantities before purchase or construction."
- "Local codes, site conditions, mix design, wastage, and measurement rules may vary."
- "This tool does not replace a licensed engineer, architect, or professional quantity surveyor."
- "Wastage is an adjustable estimate — actual site wastage depends on material handling, cutting, and site
  conditions."
- "Figures assume [a stated convention, e.g. Indian standard brick size / IS-code bar weights] — confirm
  against your own project specification."
- "Rounding is applied only for display; the underlying calculation stays exact." (grounded in
  `logistics.cbm.compute@1`'s own "stays exact until the end" precedent, honestly extended)

**Wording to avoid** (the founder's list, plus specifics this plan can name):
- "guaranteed accurate"
- "approved for construction"
- "structural design" (this category calculates *quantities*, never structural adequacy — a rebar weight
  tool, if built later, must never be read as validating that a design's reinforcement is sufficient)
- "code compliant"
- "certified BOQ"
- "legal estimate"
- "professional-grade" / "engineer-approved" (implies a review this platform cannot provide)
- "exact" used to describe the *real-world* result (the arithmetic is exact; the real quantity a site
  actually needs is not, and content must not blur that distinction)

## 6. Concrete Quantity Calculator tool plan

**Inputs:**
- member type: rectangular slab · beam · column · footing (four variants of the same rectangular-prism
  volume formula, differing only in which dimension labels are shown — length/width/thickness for a slab,
  length/width/depth for a footing, and so on)
- dimensions for the selected member type, in mm/cm/m (§3 Q3/Q4)
- number of members (a positive whole number)
- wastage % (adjustable, default 5%, range 0–50%, §3 Q7/Q12)

**Outputs:**
- concrete volume in m³ — primary result
- volume in ft³, only if imperial is approved for v1 (§3 Q4); otherwise deferred with the rest of imperial
  support
- volume before wastage
- wastage quantity (the difference wastage % adds)
- total quantity (volume before wastage + wastage quantity)
- working steps (per-member and total, per §3 Q15)
- assumptions shown in output (wastage % used, unit conversion applied)
- warnings (standing estimation-aid wording, §5; conditional dimension-sanity warning, §3 Q12)

**Errors** (typed, specific, matching this platform's `<DOMAIN>_<CONDITION>` naming exactly):
| Code | Meaning |
|---|---|
| `CIVIL_CONCRETE_DIMENSIONS_MISSING` | one or more required dimensions were not provided |
| `CIVIL_CONCRETE_DIMENSION_INVALID` | a dimension is zero, negative, non-numeric, or exceeds the allowed decimal precision |
| `CIVIL_CONCRETE_QUANTITY_INVALID` | member count is not a positive whole number, or exceeds the sane cap |
| `CIVIL_CONCRETE_UNIT_UNSUPPORTED` | an unrecognized unit was supplied |
| `CIVIL_CONCRETE_WASTAGE_INVALID` | wastage % is negative or exceeds the sane maximum (§3 Q12) |
| `CIVIL_CONCRETE_DIMENSION_UNREALISTIC` | a dimension is implausibly large/small for the selected member type — a soft sanity check, error vs. warning to be finalized in implementation |

(Exact codes to be finalized during implementation planning; listed here to show the validation surface is
fully typed from the start, matching every existing engine's pattern.)

**Out of scope for v1** (verbatim from the founder's brief):
structural design · reinforcement design · mix design · cement/sand/aggregate split (unless separately
approved, §3 Q8) · cost estimation · BOQ export · PDF report · multi-row schedule · saved projects ·
subscription · AI of any kind.

## 7. Roadmap note

Kept for future, **not implemented now**, per the founder's explicit instruction:

- **Bar Bending Schedule Calculator** — Complex (§1 item 10); needs a multi-row, per-bar-shape schedule
  output this platform has never built, and depends on a cited bend/hook-allowance standard. A future
  planning document, not a slot in this wave.
- **Cement Sand Aggregate Calculator** — a real, separately-sourced calculation (§3 Q8), planned once
  Concrete Quantity's own content/disclaimer pattern is proven.
- **BOQ export** — needs a "project" concept spanning more than one calculation (§3 Q9), not a feature of
  any single tool.
- **PDF report / cost estimate** — future, possibly paid/pro-tier features (§3 Q6/Q10), kept separate from
  the free calculator experience this wave ships.
- **Multi-row project schedule / saved projects** — both depend on the same not-yet-built "project" concept
  as BOQ export.
- **Paid professional reports** — a business-model decision this platform has not needed to make for any
  tool yet, and should not back into by building the feature first and deciding monetization after (the
  same discipline TASK-005A applied to Background Remover).

## 8. PR speed rule

The founder's rule allows one implementation PR for Concrete Quantity "if simple enough," with more complex
tools needing an engine PR + visible-tool PR split, and no report PR after every small tool.

**Finding: Concrete Quantity Calculator is simple enough for one PR.** Unlike PDF Merge (which needed a new
UI archetype) and Image Resize (which needed both a DOM-purity exception and a new archetype-D field type),
this tool needs **no new platform capability at all** — it reuses `logistics.cbm.compute@1`'s exact
decimal-volume shape, the existing `workingStep` schema unchanged, the existing archetype-B calculator UI
unchanged, and the existing `disclaimer: professional` manifest field unchanged. The only genuinely new
things this wave adds are the `civil` engine package itself and the `civil` taxonomy category entry — both
small, mechanical additions, not new architecture.

**Recommendation: one implementation PR** for the `civil` engine, `civil.concrete.quantity@1`, the
`concrete-quantity` preset, the visible Concrete Quantity Calculator tool, and the new `civil` category
entry, together. Any **later** tool in this list that also needs no new platform capability (Excavation,
Tile/Flooring, Paint) can follow the same one-PR pattern; a tool that introduces a real new capability (for
example, Brickwork's opening-deduction logic, or a ratio-input field type Plaster/Cement-Sand-Aggregate might
need) should be evaluated for a 2-PR foundation split at that time, on its own merits — not assumed from this
recommendation. **No report PR after every small tool** — one wave checkpoint report is written once several
civil/QS tools are complete, matching the PDF and Image waves' own precedent exactly.

## 9. Deliverable and PR speed for this planning task

This PR adds **only** `tasks/TASK-006A-QUANTITY-SURVEY-CIVIL-TOOLS-PLANNER.md`. No engine, no dependency, no
preset, manifest, content, or code of any kind. `pnpm verify` is expected to pass unchanged (no tools,
presets, or fixtures added or modified). One PR, opened after `pnpm verify` passes.

## 10. Founder decisions needed

No code will be written until these are answered. Recommendations are marked ★.

1. **First tool and sequencing:** ☐ **Concrete Quantity Calculator first** ★ (§2) ☐ a different first tool
2. **Category name and slug:** ☐ **"Civil & Construction," id/slug `civil`** ★ (§3 Q2) ☐ one of the other
   three options offered ☐ a different name entirely
3. **Imperial units for v1:** ☐ **SI only (mm/cm/m) for v1; imperial (ft/in) as a disclosed later addition**
   ★ (§3 Q4) ☐ founder wants imperial included from day one, matching `logistics.cbm.compute@1`
4. **Cost estimation:** ☐ **kept separate/future, not in v1** ★ (§3 Q6) ☐ founder wants a basic cost input
   scoped now regardless
5. **Wastage %:** ☐ **included in v1, adjustable, default 5%, range 0–50%** ★ (§3 Q7/Q12) ☐ a different
   default or range
6. **Material conversion (cement/sand/aggregate split):** ☐ **kept as a separate future tool, not bundled
   into Concrete Quantity v1** ★ (§3 Q8) ☐ founder wants it bundled now
7. **BOQ-style output and PDF/export reports:** ☐ **both deferred to future, PDF/export as a possible
   paid/pro-tier feature** ★ (§3 Q9/Q10) ☐ founder wants one of these scoped now
8. **New `civil` engine package:** ☐ **approve `engines/civil`, fully Node-native, no purity exception
   needed, full determinism-suite membership from day one** ★ (§3 Q1) ☐ founder wants a different engine
   boundary (for example, folding this into `engines/estimate`)
9. **PR split for Concrete Quantity Calculator:** ☐ **one implementation PR (engine + preset + tool +
   category together)** ★ (§8) ☐ founder wants a 2-PR foundation split anyway
10. **Dimension sanity-ceiling behavior:** ☐ **implement as a warning, not a hard error, for v1** ★ (a
    conservative default that does not block a real edge-case input) ☐ founder wants it as a hard error
11. **Indian-context defaults:** ☐ **default assumptions framed for Indian practice, stated explicitly in
    content, with unit-agnostic arithmetic underneath** ★ (§3 Q5) ☐ founder wants a different default
    market/convention

## 11. Acceptance checklist (for the eventual PR, nothing here is done yet)

- [ ] `civil.concrete.quantity@1` added to a new `engines/civil`, `runtimes: ['worker', 'node']`; full
      cross-browser determinism suite membership; architecture check green
- [ ] Missing dimensions, invalid/unrealistic dimensions, invalid member count, invalid wastage %, and
      unsupported unit each return their own specific typed error (§6's table) — nothing throws for bad
      user input
- [ ] Slab, beam, column, and footing each covered by at least one exact-decimal fixture; every error case
      covered by at least one fixture
- [ ] Working steps show the per-member and total calculation, matching this platform's existing "every
      check and step is shown" bar
- [ ] The standing estimation-aid warning (§5) appears on every result; the conditional dimension-sanity
      warning (§3 Q12) appears only when triggered
- [ ] Content includes every §4 section, a real worked example, and the exact safe wording from §5 (none of
      the listed avoid-phrases anywhere in copy)
- [ ] The new `civil` category becomes visible with copy naming exactly Concrete Quantity Calculator and no
      other tool
- [ ] `disclaimer: professional` set on the manifest; no other privacy/disclaimer change needed
- [ ] e2e coverage matches every existing archetype-B calculator's bar (field entry, result, warnings,
      accessibility)
- [ ] CI green on Node 24 × Chromium / Firefox / WebKit
- [ ] No separate report after this one tool — a wave checkpoint report is written once several civil/QS
      tools are complete, per §8/the founder's instruction
