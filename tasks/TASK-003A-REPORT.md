# TASK-003A Report — CBM Calculator

Plan: `tasks/TASK-003A-CBM-CALCULATOR.md` · report date 2026-09-25 · coding agent: Claude (Claude Code,
cloud session)

> **Status: complete and accepted.** TASK-003A added the CBM Calculator in two PRs, each merged after CI
> passed on **Node 24.21.0** with **Chromium, Firefox and WebKit**.

## 1. Summary

- TASK-003A added the **CBM Calculator** (`/cbm-calculator`), the first tool in the Logistics category.
- It was completed in two PRs:
  - [info93rajeev-cell/mangotools#13](https://github.com/info93rajeev-cell/mangotools/pull/13), the
    logistics engine (commit `f3c1b85`)
  - [info93rajeev-cell/mangotools#14](https://github.com/info93rajeev-cell/mangotools/pull/14), the CBM
    Calculator tool (commit `fdefb31`)
- CI passed on Node 24 with Chromium, Firefox and WebKit for both PRs: **192/192** on #13 and
  **214/214** on #14 (§5).
- The founder approved all 8 plan decisions (§12 of the plan) before coding, using the defaults.

## 2. PR #13 — Logistics engine

- Added the logistics engine foundation: `engines/logistics` (`@mangotools/engine-logistics` 0.1.0),
  with a README, changelog and lane `AGENTS.md`.
- Added the operation **`logistics.cbm.compute@1`**.
- **Supported units:** cm, m, mm and inch, with one unit for all three dimensions.
- **Exact, decimal-safe unit conversion:** the cubed factors are decimal strings (cm 0.000001 m³, mm
  0.000000001 m³, inch 0.000016387064 m³, from 1 in = 0.0254 m exactly). All maths goes through
  `@mangotools/engine-numeric`, so no floating point is used; a unit test checks that
  0.1 × 0.2 × 0.3 m = 0.006 exactly.
- **Cubic feet factor:** 35.3146667 ft³ per m³, as decided.
- **Validation** returns typed errors with field paths:
  - dimensions required, greater than zero, at most 3 decimal places;
  - quantity a required whole number from 1 to 1,000,000 ("12.0" is accepted as 12);
  - a warning when the per-carton volume rounds to zero.
- **Fixtures and tests:** 16 cited, hand-verified engine fixtures (results in all four units, total from
  exact volume, maximum quantity, 8 error cases, the rounds-to-zero warning, 6-dp params) and 7 unit
  tests.
- **Registration:** the engine is discovered automatically. One `ENGINE_IMPORTS` line in
  `scripts/validate/rules.ts` and the lockfile entry were the only changes outside the engine.
- **Not exposed until PR #14.** With no preset using it, `pnpm gen` still reported 6 tools and 2
  categories, and the engine was not in the worker loader map. Page count, JS sizes and the e2e count
  were unchanged.

## 3. PR #14 — CBM Calculator tool

- Added the **CBM Calculator page** (`/cbm-calculator`: T2, archetype B, Logistics, version 0.1.0).
- Added:
  - preset `presets/logistics/cbm.yaml`
  - manifest (SEO title 51 chars, description 158 chars, primary keyword "cbm calculator")
  - content (what CBM means, how to use, method and formula, worked example, 6 FAQs, references)
  - the professional disclaimer
  - 5 hand-verified tool fixtures
- **Search synonyms:** CBM, cubic meter, cubic metre, carton volume, cargo volume, shipping volume,
  logistics calculator and CBM to cubic feet, plus the synonym group `[cbm, cubic meter, cubic metre,
  m3]` and new tags `volume` and `shipping`.
- **Made the Logistics category visible.** It has 1 tool, and `minToolsPerCategory` is 1.
- **Rewrote the Logistics category text to mention only CBM:** summary "Carton and cargo volume (CBM)
  for freight and shipping.", new SEO title and description, and new `about` and `faq` entries. There is
  no mention of volumetric weight, container loading or pallet planning.
- **Updated the search placeholder** to "Search tools — try GST, JSON, CBM, Base64" (shared by the home,
  header, `/tools` and 404 searches).
- **Added the `/logistics` page.** It is generated from the category, and it also appears in the header
  Tools menu, the footer, `/tools` and the sitemap.
- **Added screenshots and tests:**
  - `cbm-calculator-*` and `logistics-*` screenshots are new, and `/logistics` was added to the
    screenshot suite
  - `home-*` screenshots were updated
  - tests are listed in §5

## 4. Calculation behaviour

| | |
|---|---|
| Inputs | unit (cm default, m, mm, inch), length, width, height, number of cartons (default 1) |
| Outputs | total CBM (primary), CBM per carton, total cubic feet, cubic feet per carton |
| Sample | 50 × 40 × 30 cm × 100 cartons → **6.000** m³, 0.060 per carton, 211.888 ft³, 2.119 ft³ per carton |

- **Total CBM is calculated from the exact internal volume**, not from the rounded per-carton value.
  For example, 25 × 25 × 20 cm is 0.0125 m³, shown as **0.013**, and 100 cartons give **1.250** m³, not
  1.300. Cubic feet are also calculated from the exact volumes.
- **Display rounding:** 3 decimal places (half-up) for CBM and cubic feet, with international grouping
  and no currency. Each output is rounded once, from its own exact value.
- **Working steps explain the exact-total rule**, for example:
  - `CBM per carton = 25 cm × 25 cm × 20 cm × 0.000001 m³ per cm³ = 0.0125 m³ (exact)`
  - `Total CBM = 0.0125 m³ × 100 cartons = 1.25 m³ (from the exact volume, rounded only for display)`
  - `Cubic feet per carton = 0.0125 m³ × 35.3146667 = 0.44143333375 ft³ (exact)`
- **Errors appear next to the field**, for example "This must be greater than zero.", "The number of
  cartons must be a whole number." and "Enter at most 1,000,000 cartons.".

## 5. Tests and checks

| Check | PR #13 (engine) | PR #14 (tool) |
|---|---|---|
| `pnpm verify` (local, Node 24.21.0) | ✅ Vitest **229/229** (+16 engine fixtures, +7 unit tests); architecture 159 files | ✅ Vitest **242/242** (+5 tool fixtures, +8 search cases); gen 7 tools, 7 presets, 3 categories |
| `pnpm build` (local) | ✅ 13 pages (unchanged) | ✅ **15 pages** (+`/cbm-calculator`, +`/logistics`) |
| `pnpm test:e2e` (local, Chromium only) | ✅ **112** passed (unchanged) | ✅ **126** passed |
| CI (Node 24.21.0; Chromium, Firefox, WebKit) | ✅ **192 passed, 0 failed** | ✅ **214 passed, 0 failed** |

Home JS stayed at 14.5 KB and the largest page at 24.7 KB gzip through both PRs.

CI breakdown:

| Suite | After TASK-002B / PR #13 | After PR #14 |
|---|---|---|
| e2e, per browser (× 3) | 39 | **43** (2 CBM tests, plus CBM in "Try sample" and the network suite) |
| determinism (× 3) | 1 | 1. It now also hashes the 16 logistics fixtures, because the site loads the engine |
| a11y (Chromium) | 43 | **47** (CBM in axe, light and dark, empty and result states) |
| seo / screenshots (Chromium) | 13 / 16 | **15 / 20** |
| **Total** | **192** | **214** |

New tests in PR #14:
- **CBM e2e:**
  - default cartons = 1
  - the exact-volume total (1.250), with per-carton and cubic-feet values and both working-step sentences
  - the inch unit
  - the disclaimer
  - field errors for zero width, 2.5 cartons and 1,000,001 cartons
- **Search relevance:** 8 queries find the CBM Calculator.
- **Pipeline:** 7 tools and 7 presets; visible categories `logistics, business, developer`; engines
  loaded `data, estimate, logistics`; category thresholds 1 to 4.
- **Homepage:** the new placeholder and the Logistics card.

**Lighthouse 12.8.2, mobile preset** (local production build, run ad hoc with `npx`):

| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| `/cbm-calculator` | 97 | 100 | 100 | 100 | 2.3 s | 0 |
| `/logistics` | 97 | 100 | 100 | 100 | 2.3 s | 0 |

**Review for defects:** none found, and the CBM Calculator was not changed after merge. The
calculator layout shows engine warnings (`CalculatorLayout.tsx`), so the rounds-to-zero warning reaches
the user. That warning has engine-fixture coverage but no e2e test (see §7).

## 6. Deviations and notes

1. **CBM required a new engine**, unlike the Markup Calculator, which reused an existing operation.
   So the task was split into an engine PR and a tool PR, as the plan set out.
2. **Logistics now appears on the homepage** because it has one visible tool
   (`navigation.minToolsPerCategory: 1`).
3. **Logistics appears first** (before Business & Finance and Developer & Data) because of its taxonomy
   sort order (`order: 30`, against 50 and 60). This is existing behaviour; the homepage layout was not
   changed.
4. **No related links on the CBM Calculator.** No existing tool is a logistics neighbour, and future
   logistics tools (volumetric weight, container loading) do not exist yet.
5. **Not added:** volumetric weight, container loading, pallet planning, exports and PDF reports.
6. **Working step wording.** The first step was reworded during PR #14 to repeat the unit on
   each dimension ("25 cm × 25 cm × 20 cm …"). The earlier "25 × 25 × 20 cm³" wording put the cubed
   unit on the last number only.
7. **The placeholder is cut off in the desktop header.** The header search box (340 px) cuts the
   placeholder at "…CBM, Base6". This was already true of earlier placeholders; the homepage, `/tools`
   and mobile searches show it in full.
8. **Local e2e ran on Chromium only.** Firefox and WebKit are not installed in the cloud build
   environment; CI covered all three browsers.
9. **Branch:** both PRs came from the session's designated branch `claude/serene-turing-b4w1dr`.

## 7. Open questions

1. **Homepage category order:** should it be controlled manually later (for example Business first),
   instead of following the taxonomy sort order that puts Logistics first today?
2. **Per-carton rounding mode:** should CBM later support a freight-forwarder mode (round per carton,
   then multiply) as an option? It would be a new engine param with its own fixtures; the current default
   stays exact.
3. **Next logistics tool:** Volumetric Weight or Container Loading?
4. **Bulk rows:** should CBM eventually support several carton types (rows of dimensions and quantity)
   with a grand total?
5. **Copy, share and export:** should CBM output copy, share or export be added in a professional
   workflow later? Today the tool has the platform's copy-result and print actions; there is no export
   file.
6. **Rounds-to-zero warning:** add an e2e test for it on the tool page (it is fixture-tested in the
   engine)?

## 8. Recommendation for the next task

- **The founder should approve the final choice for TASK-003B.**
- **Recommended next small tool: the Volumetric Weight Calculator.**

Reasons:
- It follows naturally from CBM: the same carton dimensions, turned into the weight carriers charge for.
- It is common in courier and logistics work (courier divisor 5000, IATA air divisor 6000, per the Phase
  1 plan).
- It uses the same Logistics category and the `engines/logistics` area. That is a new operation
  (`logistics.weight.chargeable` in the plan) in the existing engine, not a new engine.
- It can later connect to shipping-cost and container workflows.

Points to plan (from the Phase 1 plan; not started):
- the divisor presets (5000 courier, 6000 IATA air) and whether a custom divisor is allowed
- chargeable weight = max(actual, volumetric), with an optional round-up step
- the weight units (kg, and possibly lb)
- related links between CBM and Volumetric Weight once both exist
- updating the Logistics category text to include the new tool
