# TASK-003B Report — Volumetric Weight Calculator

Plan: `tasks/TASK-003B-VOLUMETRIC-WEIGHT-CALCULATOR.md` · report date 2026-09-25 · coding agent: Claude
(Claude Code, cloud session)

> **Status: complete and accepted.** TASK-003B added the Volumetric Weight Calculator in two PRs, each
> merged after CI passed on **Node 24.21.0** with **Chromium, Firefox and WebKit**.

## 1. Summary

- TASK-003B added the **Volumetric Weight Calculator** (`/volumetric-weight-calculator`), the second
  tool in the Logistics category after the CBM Calculator.
- It was completed in two PRs:
  - [info93rajeev-cell/mangotools#17](https://github.com/info93rajeev-cell/mangotools/pull/17), the
    engine operation `logistics.weight.chargeable@1` (commit `0bcd5eb`)
  - [info93rajeev-cell/mangotools#18](https://github.com/info93rajeev-cell/mangotools/pull/18), the
    visible tool (commit `ce7d557`)
- **No new engine.** The operation was added to the existing `engines/logistics`.
- **The CBM calculation is unchanged.** `logistics.cbm.compute@1`, its fixtures and its output were not
  touched. The only CBM change is one related link in its manifest.
- CI passed on Node 24 with Chromium, Firefox and WebKit for both PRs: **214** tests on #17 and
  **236/236** on #18. The post-merge CI on `main` (commit `ce7d557`) also passed, with **236** tests
  (§4).
- The founder approved the plan decisions (§13 of the plan) before coding, and gave the exact billing
  wording for PR 2.

## 2. Engine operation — PR #17

**Operation `logistics.weight.chargeable@1`** in
`engines/logistics/src/operations/weight-chargeable/`. Engine version 0.1.0 → **0.2.0**, with a README
changelog entry and an operation README.

| | |
|---|---|
| Inputs | dimension unit, length, width, height, quantity, actual weight per package, weight unit, divisor |
| Dimension units | cm, m, mm, inch (one unit for all three dimensions) |
| Weight units | kg, g, lb |
| Divisor | cm³ per kg; a **whole number from 1,000 to 10,000** |
| Outputs (kg) | volumetric, actual and chargeable weight, each per package and in total; `billedOn`; the volume, divisor and quantity used |
| Params | decimals 0–6 (default 3); rounding half-up (default) or half-even |

- **Exact unit conversion** with decimal strings through `@mangotools/engine-numeric`, and no floating
  point:
  - 1 in = 2.54 cm, so 1 in³ = 16.387064 cm³;
  - 1 lb = 0.45359237 kg;
  - 1 m³ = 1,000,000 cm³ and 1 mm³ = 0.001 cm³.
- **Division** (by the divisor) keeps 20 decimal places. Each output is rounded **once**, from its own
  full-precision value. Totals are calculated from the full-precision per-package value, not the rounded
  one. For example, 10 × 10 × 10 cm ÷ 6000 × 3 packages gives **0.500** kg, not 3 × 0.167 = 0.501.
- **Billed basis:**
  - chargeable = the higher of actual and volumetric weight;
  - `billedOn` is `volumetric`, `actual` or `equal`.
  - The `equal` case is kept separate, as the founder asked.
  - The chargeable working step uses a key per case (`vw.chargeable.volumetric|actual|equal`). That lets
    the tool state the basis in plain words without a schema change.
- **Validation** returns typed errors with field paths:
  - dimensions and weight are required, greater than zero, with at most 3 decimal places;
  - quantity follows the CBM rules: a whole number from 1 to 1,000,000;
  - weight is at most 100,000 kg per package after conversion, so 220,463 lb is too large. The new code
    is `LOGISTICS_WEIGHT_TOO_LARGE`: "Enter at most 100,000 kg per package."
  - the divisor must be whole and in range. The new code is `LOGISTICS_DIVISOR_OUT_OF_RANGE`: "Enter a
    divisor between 1,000 and 10,000 cm³ per kg." A new shared reader,
    `readWholeInRange`, was added in `engines/logistics/src/lib/read-input.ts`.
- **Fixtures and tests:**
  - **24 cited, hand-verified engine fixtures:**
    - billing and units: volumetric billed at 5000, the same carton at 6000, actual billed, inches and
      pounds, equal weights, grams, metres, millimetres;
    - totals and limits: the total from full precision, maximum quantity, maximum weight;
    - 13 error cases: missing, zero and too-precise weight; weight too large in kg and in lb; missing
      divisor; divisor 999, 10,001, 5000.5, 0 and "abc"; zero length; 2.5 packages.
  - **7 unit tests.**
- **Not exposed until PR #18:**
  - No preset used the operation, so the site did not change.
  - It stayed at 15 pages, with 214 CI tests.

## 3. Tool — PR #18

**Page:** `/volumetric-weight-calculator` (T2, archetype B, Logistics, version 0.1.0). Added:

- the preset `presets/logistics/volumetric.yaml`
- the manifest and content
- 5 hand-verified tool fixtures: volumetric billed, divisor 6000, actual billed, inches and pounds, equal
  weights

**Inputs:**
- dimension unit (**cm** default, m, mm, inch)
- length, width, height
- **Number of packages** (default **1**)
- weight unit (**kg** default, g, lb)
- **Actual weight per package** (required)
- **Divisor (cm³ per kg):** a select with **5000** (default), **6000** and **Custom**. Custom shows a
  "Custom divisor (cm³ per kg)" number input.

**Results, in kg to 3 decimal places:**
- **Total chargeable weight** (primary)
- chargeable weight per package
- volumetric weight per package and in total
- actual weight per package and in total

**Sample:** 50 × 40 × 30 cm, 8 kg, 10 packages, divisor 5000 gives:
- volumetric 12.000 kg and actual 8.000 kg per package
- chargeable **12.000** kg per package and **120.000** kg in total, billed on volumetric

**Working steps:**
- volume, then volumetric weight (÷ divisor)
- actual weight. There is a conversion step for g and lb, for example `22 lb × 0.45359237 = 9.97903214 kg`.
- the billing basis, in the founder's exact wording:
  - "Volumetric weight is higher, so volumetric weight is used for billing."
  - "Actual weight is higher, so actual weight is used for billing."
  - "Actual and volumetric weight are the same, so either value may be used for billing."
- totals. The total step says totals use the unrounded per-package value and are rounded to 3 decimal
  places only for display.

**Errors appear next to the field.** They are the engine messages listed in §2.

**Disclaimer:** professional (`disclaimer: professional`), the same as CBM.

**Page content:**
- what volumetric weight is and why couriers use it
- a table comparing actual, volumetric and chargeable weight
- how to use; the formula
- the divisors 5000, 6000 and custom, with a **carrier note**:
  - carriers differ;
  - divisors for inches and pounds (in³ per lb) are different numbers;
  - carriers may round up.
- a worked example (engine fixture 001)
- **6 FAQs:**
  - What is volumetric weight?
  - Should I use divisor 5000 or 6000?
  - Why is my chargeable weight higher than the scale weight?
  - Can I use inches and pounds?
  - Does the calculator round up to the next 0.5 kg or 1 kg?
  - What is the difference from CBM?
- references

**SEO:**
- title "Volumetric Weight Calculator – Chargeable Weight in kg" (54 characters)
- description 157 characters
- primary keyword "volumetric weight calculator"; secondary keywords "dimensional weight calculator" and
  "chargeable weight calculator"

**Search:**
- tool synonyms: volumetric weight, dimensional weight, courier weight, chargeable weight, shipping
  weight, air freight weight, logistics calculator, dim weight calculator
- the synonym group `[volumetric weight, dimensional weight, dim weight]` in `taxonomy/synonyms.yaml`

**Logistics category update:**
- summary "Carton volume (CBM) and volumetric weight for freight and shipping."
- new SEO title "Logistics Calculators – CBM and Volumetric Weight"
- rewritten `about` and FAQ that describe **only the two existing tools**. There is no mention of
  shipping cost, container loading, pallet planning or carrier APIs.
- The homepage Logistics card now shows "2 tools".

**Related links:**
- Volumetric → CBM, and CBM → Volumetric.
- No links to future tools.

**Homepage:** no redesign, and the search placeholder is unchanged.

## 4. Tests and checks

| Check | PR #17 (operation) | PR #18 (tool) |
|---|---|---|
| `pnpm verify` (local, Node 24.21.0) | ✅ Vitest **273/273** (+24 engine fixtures, +7 unit tests) | ✅ Vitest **286/286** (+5 tool fixtures, +8 search cases); Biome clean (204 files); gen 8 tools, 8 presets, 3 categories; architecture 163 files, no violations |
| `pnpm build` (local) | ✅ 15 pages (unchanged) | ✅ **16 pages** (+`/volumetric-weight-calculator`); home JS 14.5 KB, largest page 24.7 KB gzip (unchanged) |
| `pnpm test:e2e` (local, Chromium only) | ✅ 126 passed (unchanged) | ✅ **138 passed** |
| CI (Node 24.21.0; Chromium, Firefox, WebKit) | ✅ **214 tests: 213 passed, 1 flaky** (see below) | ✅ **236 passed, 0 failed, 0 flaky** |
| Post-merge CI on `main`, commit `ce7d557` ([run 54](https://github.com/info93rajeev-cell/mangotools/actions/runs/36198219290)) | — | ✅ **Success. 236 tests: 235 passed, 1 flaky** (see below); Vitest 286/286; build 16 pages |

**The same test was flaky twice.** `mobile-search.spec.ts` ("mobile header search › closes with
Escape, the close button and a tap outside") on WebKit:

| Run | First attempt | Automatic retry |
|---|---|---|
| PR #17 | failed after 13.9 s | passed in 2.1 s |
| Post-merge `main` | failed after 13.7 s | passed in 2.5 s |

- PR #18's own CI run had no flaky test.
- Both CI runs finished green. Playwright's configured retry counts a pass on retry as a pass.
- The test covers the mobile header search. Neither PR touched it:
  - PR #17 changed only `engines/logistics`;
  - PR #18 changed tools, presets, taxonomy and tests.
- It was **not fixed in TASK-003B**; that would be UI-lane work outside this task. See §6, question 7.

CI breakdown (Playwright suites):

| Suite | After TASK-003A / PR #17 | After PR #18 |
|---|---|---|
| e2e, per browser (× 3) | 43 | **48**: the 3 Volumetric tests, plus Volumetric in "Try sample" and the network suite |
| determinism (× 3) | 1 | 1. It now also hashes the 24 new engine fixtures |
| a11y (Chromium) | 47 | **51**: Volumetric in axe, light and dark, empty and result states |
| seo / screenshots (Chromium) | 15 / 20 | **16 / 22** |
| **Total** | **214** | **236** |

New and changed tests in PR #18:
- **`tests/e2e/tools.spec.ts`, 3 Volumetric Weight tests:**
  1. Defaults and billing basis:
     - defaults of 1 package and divisor 5000
     - the sample gives 120.000, 12.000 per package and 80.000 actual in total, with the volumetric
       sentence
     - divisor 6000 gives 100.000
     - an actual weight of 25 kg gives 250.000 and the actual sentence
     - a custom divisor of 2400 gives an equal 25.000 and the equal sentence
     - the disclaimer and the CBM related link are visible
  2. Inches and pounds: 20 × 16 × 12 in with 22 lb gives 12.585, actual 9.979, and the conversion
     step.
  3. Field errors: weight 0 and 100,001; 2.5 packages; divisors 999 and 5000.5.
- **`tests/support/tool-page.ts`:** the sample (120.000) was added, so the shared suites (Try sample,
  network, axe light and dark, screenshots) cover the tool.
- **Search relevance:** 8 queries find the Volumetric Weight Calculator. The "logistics calculator"
  test changed (§5).
- **Pipeline:**
  - 8 tools and 8 presets;
  - at a threshold of 2, Logistics (2 tools) is now visible.
- **Screenshots:**
  - `volumetric-weight-calculator-*` are new;
  - `logistics-*` and `home-*` were updated for 2 tools;
  - other screenshots showed only rendering noise and were not committed.

**Lighthouse 12.8.2, mobile preset** (local production build, run ad hoc with `npx`):

| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| `/volumetric-weight-calculator` | 95 | 100 | 100 | 100 | 2.4 s | 0 |
| `/logistics` | 98 | 100 | 100 | 100 | 2.0 s | 0 |

**Review for defects:** none found. The engine and the tool were not changed after merge.

## 5. Deviations and notes

1. **Actual weight is required.** The tool never shows a chargeable weight based on volumetric weight
   alone, as decided.
2. **Results are in kg only.** Pounds are accepted as input and converted exactly; there is no lb
   output.
3. **No round-up mode.** Results are rounded to 3 decimal places. The page content says carriers may
   round up to the next 0.5 kg or 1 kg, and one FAQ covers it.
4. **One package type only**, with a quantity. There are no rows of different packages.
5. **The homepage search placeholder is unchanged**
   ("Search tools — try GST, JSON, CBM, Base64").
6. **No links to future tools.** Related links are only between CBM and Volumetric. The page and the
   category text do not mention shipping cost, container loading or pallet planning.
7. **The search relevance test changed.**
   - "logistics calculator" is a synonym on both logistics tools, as the founder asked. So the old
     test "logistics calculator → CBM is the top result" became a tie.
   - It now checks that **both logistics tools are the top two results**.
8. **The CBM manifest gained a related link** (`graph.related: [volumetric-weight-calculator]`).
   - This is metadata only, so the CBM version was not bumped. This follows the related-link rule from
     TASK-002B.
   - The CBM calculation, preset and wording are unchanged.
9. **The quantity errors still say "cartons".**
   - The Volumetric tool uses the same quantity check and messages as CBM, for example "The number of
     cartons must be a whole number.".
   - The Volumetric field is labelled "Number of packages", with help text "Packages or cartons of this
     size…".
   - The founder agreed to keep the shared wording and not change the CBM messages.
10. **The unit tables were placed differently from the plan.**
    - The plan suggested a shared length-to-centimetre table in `engines/logistics/src/lib/`.
    - The operation instead reuses `lengthUnits` from the CBM operation and keeps its own
      cm³-per-unit table in `weight-chargeable/units.ts`.
    - This left the CBM files untouched.
11. **The preset had one fix during development.**
    - `pnpm gen` rejected numeric YAML labels for the divisor options ("expected string").
    - The labels are now quoted strings ("5000", "6000").
12. **Local e2e ran on Chromium only.** Firefox and WebKit are not installed in the cloud build
    environment; CI covered all three browsers.
13. **Branch:** both PRs came from the session's designated branch `claude/serene-turing-b4w1dr`.

## 6. Open questions

1. **Round-up mode:** should a later version offer optional rounding up of the chargeable weight, for
   example to the next 0.5 kg or 1 kg as many couriers do?
   - It would be a new engine param with its own fixtures.
   - The default would stay unrounded, at 3 decimal places.
2. **Multiple package rows:** should Volumetric (and CBM) support several package types with a grand
   total?
3. **lb output:** should results also be shown in pounds for US users? A divisor in in³ per lb would
   then also be needed.
4. **Carrier-specific presets:** should there be named divisor options per carrier or service? That
   would need cited, dated sources and upkeep when carriers change their rules.
5. **Shipping cost:** should it be a separate future tool that uses chargeable weight and a rate the
   user enters? It would not be part of this calculator.
6. **Shared "cartons" wording:** should the shared quantity messages be made neutral later, for example
   "packages"? That would change CBM's visible error text, so it needs the founder's decision.
7. **The WebKit mobile-search test:** it was flaky twice, on PR #17 and on the post-merge `main` run,
   and passed on retry both times. Should a small UI-lane task look at it before it becomes a real
   failure? The first attempt takes about 14 s before failing, which suggests a wait or timing issue
   in the test or the close behaviour on WebKit.

## 7. Recommendation for the next task

**The founder should approve the choice.** Recommended: **TASK-003C, the Container Loading
Calculator** (`container-loading-calculator`), planning only at first.

Reasons:
- It is the third tool in the Phase 1 logistics group, after CBM and Volumetric Weight (Phase 1 plan
  §4, tool 14).
- It builds directly on CBM: total cargo volume and weight compared with container capacities.
- It completes the Logistics category as the Phase 1 plan describes it.

Points to plan (from the Phase 1 plan; not started):
- the operation `logistics.container.estimate` and preset `logistics/container` in the existing
  `engines/logistics`, split into an operation PR and a tool PR, as in TASK-003A and TASK-003B;
- typical 20′ GP, 40′ GP and 40′ HC capacities as **editable assumptions**, with cited sources, plus a
  fill-factor input;
- clear labelling as a "volume and weight estimate, not a 3D packing plan";
- related links between the three logistics tools, and updating the Logistics category text.

Nothing in this recommendation has been started.
