# TASK-002B Report — Markup Calculator

Report date 2026-09-25 · coding agent: Claude (Claude Code, cloud session)

> **Status: complete and accepted.** TASK-002B added the Markup Calculator. It was merged into `main` via
> [info93rajeev-cell/mangotools#10](https://github.com/info93rajeev-cell/mangotools/pull/10) after CI
> passed on **Node 24.21.0** with **Chromium, Firefox and WebKit**.

## 1. Summary

- TASK-002B added the **Markup Calculator** (`/markup-calculator`) as a new Business & Finance tool.
- It is merged into `main` via PR #10 (commit `6e35504`).
- CI passed on Node 24 with Chromium, Firefox and WebKit: **192 passed, 0 failed** (§5).

## 2. Scope completed

- Added the Markup Calculator as a new business tool: tier T2, archetype B (calculator), category
  `business`.
- It uses the existing **`estimate.pricing.margin@1`** operation, which already supported the markup
  modes (`price-from-cost-and-markup`, `cost-from-price-and-markup`, and `from-cost-and-price`, which
  returns the markup %).
- **No new calculation engine was created, and no engine code changed.**
- Added:
  - Preset `presets/estimate/pricing.markup.yaml` (0.1.0): solve modes, fields, outputs, sample and
    strings.
  - Tool manifest `tools/markup-calculator/manifest.yaml` (0.1.0): SEO title (50 chars) and description
    (145 chars), primary keyword "markup calculator", secondary keywords, 5 synonyms, tags `pricing` and
    `profit`, and the quality block.
  - Content page `tools/markup-calculator/content.md`: how to use, method, worked example, 5 FAQs
    (markup vs margin, markup over 100%, negative markup, zero cost, GST) and references.
  - 4 hand-verified tool fixtures: price from markup, markup from cost and price, cost from price and
    markup, and a rounding case (₹99.99 at 33.33% gives ₹133.32, with 25.00% margin).
  - Search synonym group `[markup, mark up, mark-up]` in `taxonomy/synonyms.yaml`.
- Added the **GST → Markup** related link that had been waiting since TASK-001 (TASK-001 report §7.2
  item 4 and §9).
- Added related links between Markup and Profit Margin (both ways), and from Markup to GST.

## 3. Calculation modes

| Mode | Inputs | Primary result | Sample check |
|---|---|---|---|
| Selling price from cost and markup % (default) | Cost, Markup | Selling price | ₹200 at 25% → **₹250.00** |
| Markup % from cost and selling price | Cost, Selling price | Markup | ₹80 → ₹100 gives **25.00%** |
| Cost from selling price and markup % | Selling price, Markup | Cost | ₹250 at 25% → **₹200.00** |

Every mode follows the engine's rule of **money first, then percentages**: money is rounded half-up to
2 dp, profit comes from the rounded amounts, then the percentages are calculated. The engine returns a
typed warning when the cost is zero (markup undefined), and typed errors for a markup of −100% or lower
and for missing input.

## 4. Display behaviour

- **₹ currency**: both money fields are `currency: INR`, the same mechanism as GST and Profit Margin.
  The inputs show a ₹ prefix.
- **Indian digit grouping**, for example `₹15,00,000.00`.
- **Working steps**, for example `Selling price = ₹200.00 × (1 + 25%) = ₹250.00`, then profit and
  margin. They reuse the operation's step templates.
- **Professional disclaimer** (`disclaimer: professional`).
- **Secondary values**: profit (₹) and margin (%) are shown under the primary result. Losses use the
  project's negative format (`−₹20.00`, `−20.00%`).

## 5. Tests and checks

| Check | Result |
|---|---|
| `pnpm verify` (local, Node 24.21.0) | ✅ Biome clean (no warnings); gen: **6 tools, 6 presets**; typecheck; architecture 152 files, no violations; Vitest **206/206** |
| `pnpm build` (local) | ✅ **13 pages**, post-build checks passed. Home JS 14.5 KB, largest page 24.7 KB (unchanged) |
| `pnpm test:e2e` (local, Chromium only) | ✅ **112 passed, 0 failed** |
| CI on PR #10 (Node 24.21.0; Chromium, Firefox, WebKit) | ✅ **192 passed, 0 failed**, Vitest 206/206, build 13 pages |

Test counts compared with the end of TASK-002A:

| | After TASK-002A | After TASK-002B |
|---|---|---|
| Vitest (unit, fixtures, pipeline, search) | 197 | **206** |
| e2e, local Chromium | 102 | **112** |
| CI total | 176 | **192** |
| — e2e per browser (× 3) | 36 | 39 (the Markup test, plus Markup in "Try sample" and the network suite) |
| — a11y (Chromium) | 39 | 43 (Markup in axe, light and dark, empty and result states) |
| — seo / screenshots (Chromium) | 12 / 14 | 13 / 16 |
| — determinism (× 3) | 1 | 1 |

New and changed tests:
- **`tests/e2e/tools.spec.ts`, "Markup Calculator":**
  - ₹10,00,000 at 50% → `₹15,00,000.00`, profit `₹5,00,000.00`, margin `33.33%`, plus the working step
  - markup from ₹100 → ₹80 gives `−20.00%` and `−₹20.00`
  - cost from ₹250 at 25% gives `₹200.00`
  - the disclaimer is visible
- **`tests/support/tool-page.ts`:** the Markup sample (`₹250.00`) was added, so the shared suites cover
  the new tool.
- **`tests/unit/search-relevance.test.ts`:** "Markup Calculator", "markup", "mark up", "cost plus
  pricing" and "selling price from markup" → Markup; "selling price from margin" → Profit Margin.
- **`scripts/generate/pipeline.test.ts`:** updated for the new repository state (§6).

**Review for defects:** none found. The four tool fixtures pass through the real operation; the e2e
checks cover all three modes, ₹ formatting, the loss case and the disclaimer; and axe is clean. The
Markup Calculator was not changed after merge.

## 6. Deviations and notes

1. **No version bump for GST or Profit Margin.** Only their `graph.related` lists changed (each gained
   `markup-calculator`). Their calculation, preset and behaviour are unchanged, so their versions
   (GST 0.1.0, Profit Margin 0.2.0) were not bumped.
2. **Screenshots:** `business-*` and `home-*` changed because Business & Finance now has 3 tools.
   `markup-calculator-{mobile,desktop}.png` are new. Other regenerated screenshots showed only rendering
   noise and were not committed.
3. **Two pipeline tests changed because the repository went from 5 tools to 6:**
   - "builds six tools, six presets and both launch categories" (it previously listed five tools and
     five presets);
   - the category-visibility test previously expected Business to be hidden at a threshold of 3. It now
     checks both thresholds: at 3 both categories are visible (each has 3 tools), and at 4 both are
     hidden.
4. **Markup Calculator is no longer the "missing tool" example.** Two pipeline tests (unknown related
   tool, unknown homepage tool) used `markup-calculator` as an id that did not exist. They now use
   `no-such-tool`.
5. **Local e2e ran on Chromium only.** Firefox and WebKit are not installed in the cloud build
   environment; CI covered all three browsers.
6. **Branch:** as in TASK-002A, the PR came from the session's designated branch
   `claude/serene-turing-b4w1dr`.

## 7. Open questions

1. **Version bumps for related-link-only changes.** Should GST and Profit Margin ever bump their version
   when only `graph.related` changes? **Current decision: no.** Versions track calculation and behaviour
   changes; related links are navigation metadata.
2. **TASK-003 scope.** Confirm the next category or tool group (§8).

## 8. Recommendation for TASK-003

| Option | Group | Notes |
|---|---|---|
| A | Business group continuation | Few business tools are left in the Phase 1 plan; most need new operations |
| **B** | **Logistics starter group, starting with the CBM Calculator** | Phase 1 plan tools 12–14: CBM, Volumetric Weight, Container Loading |
| C | Developer/Data group continuation | UUID, Timestamp, Hash, CSV↔JSON and QR remain. QR needs a new dependency; UUID and Timestamp need randomness and time handled through `ctx` |

**Recommended: Option B — TASK-003A, CBM Calculator.**

Reasons:
- CBM is useful for logistics and business traffic, such as importers, exporters and freight quotes.
- It matches the founder's interest in practical business tools.
- It can later connect to carton, volumetric weight, container loading and shipping workflows (the
  rest of Phase 1 TASK-003).
- It lets the homepage search placeholder change from "GST, JSON, Base64, URL" to the approved wording
  that includes "CBM" (`docs/phase-1/HOMEPAGE-DIRECTION.md` §2).

Things to decide when TASK-003A is planned (facts from the repository, not blockers):
- **CBM needs a new engine.** There is no logistics engine yet (`engines/` has `data`, `estimate`,
  `numeric` and `search`). The Phase 1 plan names the operation `logistics.cbm.compute` with preset
  `logistics/cbm`. So TASK-003A is "new engine, operation and preset, then the tool", split into an
  engine-lane PR and a tools-lane PR, unlike TASK-002B. This is still small: plain decimal multiplication
  through `engines/numeric`, with unit conversion.
- **The Logistics category would appear on the homepage.** It is hidden today because it has 0 tools.
  With `navigation.minToolsPerCategory: 1`, the first logistics tool makes a third homepage category
  card appear. That is expected, but it changes the homepage screenshots and tests.
- **Units and rounding need founder confirmation:** cm, m, mm and inches; carton quantity; and the
  number of CBM decimal places.
