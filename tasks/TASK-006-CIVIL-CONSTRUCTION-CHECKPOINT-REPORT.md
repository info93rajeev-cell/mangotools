# TASK-006 Civil & Construction Checkpoint Report

Report date 2026-09-27 · coding agent: Claude (Claude Code, cloud session)

> **Status: checkpoint, wave paused pending founder direction.** TASK-006 opened the Civil & Construction
> category in two PRs, each merged after `pnpm verify`/`pnpm build`/`pnpm test:e2e` passed locally and
> GitHub CI passed on Node 24 with Chromium, Firefox and WebKit. No further Civil/QS tool is started
> without explicit founder approval — see §10.

## 1. Summary

- **TASK-006A** planned the Quantity Survey / Civil Tools wave: 10 candidate tools classified by risk,
  Concrete Quantity Calculator recommended first over Excavation/Brickwork/Rebar Weight/Tile-Flooring, all
  15 architecture questions answered, and the finding that — unlike the PDF and Image waves — this domain
  needs no new engine-purity or determinism exception, since every candidate formula is pure decimal
  arithmetic.
- **TASK-006B** added the visible **Concrete Quantity Calculator**, backed by a new `engines/civil`
  package and its first operation, `civil.concrete.quantity@1`.
- **Civil & Construction is now a live category** — this platform's first category built around a
  distinct professional trade beyond Logistics, rather than a generic public utility or document/image
  processing task.

## 2. Current status

- **Visible tools: 15**
- **Visible categories: 6** — Logistics (4), Business & Finance (3), Developer & Data (3),
  PDF & Documents (2), Image & Media (2), Civil & Construction (1)
- **Civil & Construction tools:**
  - Concrete Quantity Calculator
- **No future Civil/QS tools are exposed.** Excavation Calculator, Brickwork Calculator, Plaster
  Calculator, Tile/Flooring Calculator, Paint Calculator, Rebar Weight Calculator, Formwork/Shuttering
  Calculator, Cement Sand Aggregate Calculator, Bar Bending Schedule, and BOQ export do not exist as
  manifests, presets, engine operations, or routes anywhere in the codebase.

## 3. PR sequence

| PR | Title | Lane(s) | Head → merged as |
|---|---|---|---|
| [#39](https://github.com/info93rajeev-cell/mangotools/pull/39) | docs(tasks): add TASK-006A Quantity Survey / Civil tools wave plan | docs (planning only, no code) | `db12469` → `4f97b13` |
| [#40](https://github.com/info93rajeev-cell/mangotools/pull/40) | TASK-006B: add civil.concrete.quantity@1 and visible Concrete Quantity Calculator | engine-civil (new engine), tools | `322acce` → `0cb4114` |

Both PRs were opened, reviewed and merged in this order with no reverts and no out-of-scope tool ever
added or exposed. PR #39's CI failed once on a pre-existing, unrelated WebKit test and passed clean on
re-run with no code change (see §7). PR #40 hit the identical flake on its own first CI run and was
resolved the same way (see §7).

## 4. Platform foundation added

This wave added a new engine domain and category, while deliberately reusing existing platform
capability wherever it already fit — no new UI archetype, schema, or determinism exception was needed:

- **New `engines/civil` package**, mirroring `engines/logistics`'s own layout exactly
  (`package.json`, `src/index.ts`, `src/errors.ts`, `src/lib/read-input.ts`,
  `src/operations/concrete-quantity/`). This is the platform's fifth engine package, alongside `numeric`,
  `data`, `estimate`, `logistics`, `pdf`, and `image`.
- **Pure arithmetic, fully deterministic operation.** `civil.concrete.quantity@1` declares
  `runtimes: ['worker', 'node']` and joins the full cross-browser byte-hash determinism suite from its
  first version — a genuine simplification versus the PDF and Image waves, both of which needed a
  disclosed platform exception (a new UI archetype for PDF; a DOM/canvas-only runtime exception for
  Image) before their first tool could ship.
- **No browser/file/AI exception needed.** Every input is a typed number or enum the user types in;
  nothing reads a file, touches the DOM, or calls a model.
- **Concrete Quantity Calculator visible tool** — the category's first live tool, built on the existing
  archetype-B calculator UI, unchanged.
- **Civil & Construction category launch** — `taxonomy/categories.yaml`'s `construction` category,
  scaffolded but empty since the platform's very first foundation commit, is now live as
  **Civil & Construction**, with copy naming exactly Concrete Quantity Calculator.
- **Estimation-aid warning pattern** — every successful result carries five standing warnings
  (`CIVIL_ESTIMATION_AID_ONLY`, `CIVIL_VERIFY_BEFORE_CONSTRUCTION`, `CIVIL_LOCAL_PRACTICE_VARIES`,
  `CIVIL_NOT_PROFESSIONAL_REPLACEMENT`, `CIVIL_VOLUME_ONLY`), unconditionally, using the existing
  `OpWarning`/`messageFor` mechanism unchanged — matching the standing-warning precedent
  `logistics.container.fit@1` already established.
- **Working-step formula explanation** — reuses the existing `workingStep` schema (`ref`, `formulaKey`,
  `variables`, `result`) and the preset-level `strings.en` `work.<formulaKey>` template mechanism
  unchanged, so every calculation shows its member-volume, base-volume, wastage, total, and cubic-feet
  conversion steps in plain language.
- **SI/imperial unit conversion** — mm, cm, m, in, and ft, all as exact decimal-string factors via
  `@mangotools/engine-numeric`, matching `logistics.cbm.compute@1`'s own "exact first, round once" rule.
- **Wastage calculation** — an adjustable, typed wastage percentage (0–50%, default 0%) applied to the
  pre-wastage volume, shown as its own output line separate from the base and total volumes.
- **m³ and ft³ outputs** — total volume including wastage as the primary result in cubic metres, with
  cubic feet shown as a secondary, always-populated output, matching the CBM Calculator's own dual-unit
  output pattern.

## 5. Concrete Quantity Calculator summary

- **Supported member types** (all four/five variants share one rectangular-prism volume formula, differing
  only in label): general/rectangular concrete, slab, beam, column, footing.
- **Inputs:** length, width, depth/thickness/height, unit (mm/cm/m/in/ft), quantity/number of members
  (default 1), wastage % (default 0, range 0–50).
- **Outputs:** base volume before wastage, wastage volume, total volume including wastage, total volume
  in m³ (primary result) and ft³ (secondary), plus the member type, unit, quantity and wastage % used —
  all shown so every input assumption is visible, not silent.
- **Deterministic same-input/same-output behavior:** `civil.concrete.quantity@1` is fully Node-native and
  a full member of the platform's byte-hash determinism suite — the same input produces byte-identical
  output in every browser and in Node, with no disclosed exception (unlike `image.resize@1`).
- **Estimation-only positioning:** wording throughout uses "estimate," "estimation aid," and "verify
  before purchase or construction" — never "guaranteed accurate," "approved for construction,"
  "structural design," "code compliant," "certified BOQ," or "legal estimate."

## 6. Safety / professional disclaimer

Every result and the tool's content page carry the same wording, consistently:

- This is an estimation aid only.
- Verify quantities before purchase or construction.
- Local measurement rules, site conditions, mix design, wastage, and construction practice may vary.
- This tool does not replace a licensed engineer, architect, or professional quantity surveyor.
- This tool calculates concrete volume only — it does not calculate reinforcement, structural design, mix
  design, material split, cost, a bill of quantities (BOQ), or a report.

`disclaimer: professional` is set on the tool's manifest, identical to every existing Logistics and
Business & Finance tool — no new disclaimer variant or component was needed.

## 7. Tests and CI

| Check | PR #39 (planning doc only) | PR #40 (visible Concrete Quantity Calculator) |
|---|---|---|
| `pnpm verify` (local) | ✅ 555 tests, unchanged; 14 tools/14 presets/5 visible categories, no violations — confirms the PR touched nothing but the planning file | ✅ **596 tests**; 15 tools/15 presets/6 visible categories; 231 architecture files, no violations |
| `pnpm build` (local) | N/A — no app code changed | ✅ **27 pages**, post-build checks passed |
| `pnpm test:e2e` (local, Chromium-based projects) | N/A — no app code changed | ✅ **229 passed** (e2e, dev, a11y, seo, screenshots, determinism-chromium), run via the proper `scripts/test/e2e.ts` build pipeline |
| GitHub CI (Node 24; Chromium, Firefox, WebKit) | First run failed on a single pre-existing, unrelated test — `tests/e2e/mobile-search.spec.ts` "closes with Escape, the close button and a tap outside," WebKit only, `Received: visible` after a tap-outside simulation. Confirmed unrelated (the PR's diff is one new markdown file) and confirmed transient: re-run passed clean with no code change; final run [36267858676](https://github.com/info93rajeev-cell/mangotools/actions/runs/36267858676) green | Hit the **identical** pre-existing WebKit `mobile-search.spec.ts` flake on its first run (plus a related flaky pass on Chromium), again unrelated to the PR's diff (`engines/civil`, `presets/civil`, `tools/concrete-quantity-calculator`, taxonomy, test counts). Re-run once, per the "confirm a flake, don't chase it" rule; final run [36270847956](https://github.com/info93rajeev-cell/mangotools/actions/runs/36270847956) green on all three browsers |

Firefox/WebKit were unavailable in this session's local sandbox throughout the wave (network policy
blocks the browser-binary CDN) — a disclosed, pre-existing environment limitation affecting every tool's
local test run equally, not specific to Civil & Construction. GitHub CI's own Chromium/Firefox/WebKit
matrix is what actually proved cross-browser and cross-runtime behavior in both PRs. The
`tests/e2e/mobile-search.spec.ts` WebKit flake appeared identically, with the identical error signature,
on two unrelated PRs' first CI runs (a docs-only PR and an engine/tool PR) and disappeared on re-run both
times with zero code changes — strong evidence of a pre-existing, intermittent timing issue in that test
file itself, unconnected to any Civil & Construction change, and not fixed or touched by either PR since
doing so was outside both PRs' scope.

Test coverage added in PR #40: 17 engine fixtures and 12 unit tests in `engines/civil` (one per member
type, unit, wastage edge case and validation/warning path), 2 tool fixtures, updated
`tests/support/tool-page.ts` sample expectations, `tests/unit/search-relevance.test.ts` synonym cases, and
`scripts/generate/pipeline.test.ts` tool/preset/category counts — plus full route, category-visibility,
search, a11y, SEO structured-data, sitemap, and screenshot e2e coverage for the new tool and category.

## 8. Deviations / implementation notes

Two small, disclosed deviations from the TASK-006A/006B text, both explained in `engines/civil/README.md`
and PR #40's own description:

- **Used the pre-existing empty `construction` taxonomy scaffold**, renamed to **Civil & Construction**,
  instead of creating a duplicate `civil` category. `taxonomy/categories.yaml` has carried an empty
  `construction` category since the platform's very first foundation commit (TASK-001) — the TASK-006A
  plan did not find this pre-existing slot and assumed a brand-new category was needed. Filling it matches
  exactly how the `pdf` and `media` categories were filled by their own waves.
- **Used the engine-wide `CIVIL_` error-code prefix** instead of the plan's placeholder
  `CIVIL_CONCRETE_` prefix. The plan's own §6 table flagged those exact codes as provisional, "to be
  finalized during implementation... matching every existing engine's pattern" — every existing engine
  (`LOGISTICS_`, `IMAGE_`, `PDF_`, `ESTIMATE_`) uses one engine-wide prefix rather than a per-operation
  one, so `civil.concrete.quantity@1`'s codes follow that same established convention.

Both were accepted because they match existing platform conventions exactly and avoid a duplicate
category structure or an inconsistent error-naming pattern — neither changes any public behavior,
formula, or output the founder specified.

## 9. Kept for future, not implemented

Per the founder's explicit instruction across TASK-006A and TASK-006B, these remain candidates only —
none were started, and none have a manifest, preset, engine operation, or route in the codebase:

- Excavation Calculator
- Brickwork Calculator
- Plaster Calculator
- Tile / Flooring Calculator
- Paint Calculator
- Rebar Weight Calculator
- Formwork / Shuttering Calculator
- Cement Sand Aggregate Calculator
- Bar Bending Schedule
- BOQ export
- PDF report
- Cost estimation
- Multi-row project schedule
- Saved projects
- Paid professional reports

## 10. Recommended next move

**Excavation Calculator** is recommended as the next Civil & Construction tool.

Reasons:
- **Simple formula** — length × width × depth, the same rectangular-volume shape
  `civil.concrete.quantity@1` already proved, with no new reference-data risk (unlike Brickwork's brick
  size or Rebar Weight's bar-weight table).
- **High professional use** — a genuine, everyday site-quantity task for contractors, site engineers and
  estimators, not a generic public utility.
- **Natural companion to Concrete Quantity** — the two tools are commonly used together in the same
  estimating workflow (excavation before foundation concrete), so pairing them next builds the category's
  professional coherence.
- **Can reuse the civil engine/category/archetype-B pattern directly** — no new engine package, category,
  UI archetype, or platform capability is needed, matching the same "one implementation PR" finding
  TASK-006A's own PR-speed rule established for Concrete Quantity Calculator.
- **Keeps the category professional but manageable** — adds real breadth to Civil & Construction without
  introducing a genuinely different tool shape (a multi-row schedule, a material-split calculation, or a
  cited external reference table) before the category's content/disclaimer pattern has been proven on a
  second tool.

**Cement Sand Aggregate Calculator should come later**, not next. It converts a concrete volume into a
material split via a mix ratio and a dry-volume conversion factor — a genuinely separate calculation with
its own citation and disclosure needs, not a variant of Concrete Quantity's volume-only output — and
should remain a distinct, separately-planned tool per TASK-006A §3 Q8's own finding, once the category's
pattern is proven on one or two more zero-reference-risk tools first.

This is a recommendation only. Per this session's standing instructions, no new tool, engine operation, or
task is started without explicit founder direction.
