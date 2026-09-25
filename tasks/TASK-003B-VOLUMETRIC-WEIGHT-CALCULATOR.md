# TASK-003B — Volumetric Weight Calculator (plan)

> **Planning document. No code has been written.** Execution starts only after the founder answers §13.
> This is the second Logistics tool, after the CBM Calculator (TASK-003A).

## 1. Goal

Add a **Volumetric Weight Calculator** (`/volumetric-weight-calculator`) for courier, air-freight and
logistics use. It compares:

- **actual weight**: what the parcels weigh on a scale;
- **volumetric (dimensional) weight**: the space the parcels take up, turned into a weight with a
  carrier divisor;
- **chargeable weight**: the **higher** of the two, which carriers bill on.

It shows which weight is used for billing, and every step of the working. Phase 1 plan reference:
`docs/phase-1/PHASE-1-BUILD-PLAN.md` §4 tool 13 (`volumetric-weight-calculator`, logistics, T2,
archetype B, operation `logistics.weight.chargeable`, preset `logistics/volumetric`).

## 2. Split: operation PR and tool PR (recommended, §13 decision 8)

The logistics engine already exists (`engines/logistics`, from PR #13). **No new engine is needed.** This
task adds **one new operation** to it.

| PR | Lane | Content | Visible to users? |
|---|---|---|---|
| **PR 1 — Operation** | `engine-logistics` | `logistics.weight.chargeable@1` in `engines/logistics`, with fixtures, unit tests and a README/changelog entry (engine 0.1.0 → 0.2.0). A shared length-to-centimetre table in `engines/logistics/src/lib/` | **No.** No preset or tool uses it yet |
| **PR 2 — Tool** | `tools` | Preset `logistics/volumetric`, tool `volumetric-weight-calculator` (manifest, content, fixtures), Logistics category text, synonyms, related links, tests and screenshots | Yes |

`AGENTS.md` golden rule 1 (one lane per PR) is why the plan recommends two PRs. Doing it as one PR is
possible but would mix the engine and tools lanes.

**CBM stays untouched.** `logistics.cbm.compute@1`, its fixtures and its output do not change. Its
fixtures act as a regression guard.

## 3. Engine operation design (PR 1)

**Operation:** `logistics.weight.chargeable@1`, in
`engines/logistics/src/operations/weight-chargeable/` (`schema.ts`, `operation.ts`, `README.md`,
`weight-chargeable.test.ts`, `fixtures/`).

- Runtimes `['worker', 'node']`, `cost: light`, `exposure: internal`, `dataClass: public`.
- The operation is pure. Decimal strings go through `@mangotools/engine-numeric`, with no floating
  point, typed errors and no throws on user input. Like CBM, it is discovered automatically.
- **Precision:** multiplication is exact. Division by the divisor, or by 0.45359237 for pounds, keeps
  **20 decimal places** (`div` in `engines/numeric`). For example, 1 ÷ 6000 does not terminate. That is
  deterministic in every browser and far beyond the 3 displayed decimals. Each output is rounded
  **once**, from its own full-precision value (the same rule as CBM).

**Computation:**

1. `volumeCm3` = length × width × height × (unit → cm)³ (exact).
2. `volumetricPerPackage` (kg) = `volumeCm3 ÷ divisor`.
3. `actualPerPackage` (kg) = weight converted to kg (exact).
4. `volumetricTotal` = `volumetricPerPackage × quantity`; `actualTotal` = `actualPerPackage × quantity`.
5. `chargeablePerPackage` = max(actual, volumetric) per package; `chargeableTotal` =
   `chargeablePerPackage × quantity`.
6. `billedOn` = `volumetric` if volumetric > actual, `actual` if actual > volumetric, `equal` if they are
   the same.
7. Optional rounding increment for the chargeable weight (§13 decision 6), applied **only** to the
   chargeable outputs and shown as its own working step.

With a single package type, max(actual × n, volumetric × n) = n × max(actual, volumetric), so per-package
and total billing always agree. This changes if multiple carton rows are added later (§13 decision 5).

## 4. Inputs and outputs

**Input** (strict object):

| Field | Type | Rule |
|---|---|---|
| `unit` | `cm` \| `m` \| `mm` \| `in` | Dimension unit (same as CBM) |
| `length`, `width`, `height` | decimal | Required, > 0, ≤ 3 decimal places |
| `quantity` | integer | Required, 1 to 1,000,000 (same rule as CBM) |
| `weight` | decimal | Actual weight **per package**, > 0, ≤ 3 decimal places. **Required or optional: §13 decision 3** |
| `weightUnit` | `kg` \| `g` \| `lb` | Unit of `weight` |
| `divisor` | decimal | cm³ per kg. Preset quick options **5000** and **6000**, plus custom. Range: §7 |

**Params:** `decimals` (default 3, 0–6), `rounding` (`half-up`), `chargeableIncrement` (§13 decision 6:
`none` \| `0.5` \| `1`, default `none`).

**Output:**

| Field | Example (§6, 5000) | Notes |
|---|---|---|
| `volumetricPerPackage` | `12.000` kg | |
| `volumetricTotal` | `120.000` kg | |
| `actualPerPackage` | `8.000` kg | `null` if actual weight is optional and empty |
| `actualTotal` | `80.000` kg | `null` as above |
| `chargeablePerPackage` | `12.000` kg | Equals volumetric when there is no actual weight |
| `chargeableTotal` | `120.000` kg | **Primary** result in the tool |
| `billedOn` | `volumetric` | `actual` \| `volumetric` \| `equal` (or `volumetric` when there is no actual weight) |
| `volumeCm3PerPackage` | `60000` | Echo for the working steps |
| `working` | steps | See below |

**Working steps** (formula keys; the PR 2 preset supplies the templates):

1. `vw.volume`: `Volume = 50 cm × 40 cm × 30 cm = 60,000 cm³`
2. `vw.volumetric`: `Volumetric weight = 60,000 cm³ ÷ 5000 = 12.000 kg per package`
3. `vw.actual`: `Actual weight = 8 kg per package` (with conversion when g or lb is used, for example
   `22 lb × 0.45359237 = 9.979 kg`)
4. `vw.chargeable.volumetric` / `vw.chargeable.actual` / `vw.chargeable.equal`, for example
   `Chargeable weight = higher of 8.000 kg and 12.000 kg = 12.000 kg (volumetric weight is billed)`
5. `vw.total`: `Totals = per package × 10 packages`
6. (if rounding is chosen) `vw.roundUp`: `Rounded up to the next 0.5 kg = 12.500 kg`

**Showing "billed on" in the UI.** Preset outputs have no value-to-label mapping today, so a `text`
output would show the raw code `volumetric`. The plan uses **separate formula keys per case** (step 4
above), so the working step states the basis in plain words with **no schema change**. A "Billed on"
output row with a proper label needs a small `valueLabelKeys` addition to the output schema (platform
lane). See §13, extra decision 9.

## 5. Units and conversion rules

**Lengths → centimetres (exact):** m × 100, cm × 1, mm × 0.1, in × 2.54. So 1 in³ = 16.387064 cm³.

**Weights → kilograms (exact):** kg × 1, g × 0.001, lb × **0.45359237** (the international pound,
1959).

**Divisor unit:** the divisor is always **cm³ per kg**. That is what 5000 and 6000 mean, and it is how
most couriers and IATA state it.

- US carriers often quote **in³ per lb** instead (for example 139 or 166). Those are **not** the same
  numbers: 139 in³/lb ≈ 5021.7 cm³/kg and 166 in³/lb ≈ 5997.1 cm³/kg.
- The page will say this clearly. Accepting in³/lb divisors directly (a divisor-unit switch) is out of
  scope for now.

**Output unit:** kg by default. Pounds as an extra display are §13 decision 4. If chosen, they are
derived as kg ÷ 0.45359237, at 20 dp before display rounding.

## 6. Worked examples (checked with exact decimal arithmetic)

| Case | Inputs | Result |
|---|---|---|
| A — volumetric billed | 50 × 40 × 30 cm, 8 kg each, 10 packages, divisor 5000 | volume 60,000 cm³; volumetric **12.000** kg each / **120.000** total; actual 8.000 / 80.000; chargeable **12.000 / 120.000**, billed on **volumetric** |
| B — same carton at 6000 | as A, divisor 6000 | volumetric **10.000** kg each; chargeable 10.000 / 100.000, billed on volumetric |
| C — actual billed | 30 × 20 × 10 cm, 2.5 kg, 1 package, 5000 | volumetric 1.200 kg; chargeable **2.500** kg, billed on **actual** |
| D — inches and pounds | 20 × 16 × 12 in, 22 lb, 1 package, 5000 | volume 62,926.32576 cm³; volumetric **12.585** kg; actual 22 × 0.45359237 = **9.979** kg; chargeable 12.585 kg, billed on volumetric |
| E — equal | 50 × 40 × 30 cm, 12 kg, 5000 | both 12.000 kg; billed on **equal** (the working step says both are the same) |

Case A is the tool's sample (default divisor subject to §13 decision 1).

## 7. Validation rules

| Case | Code (new unless noted) | Message | `path` |
|---|---|---|---|
| Missing dimension, weight (if required), divisor or quantity | `LOGISTICS_MISSING_INPUT` (existing) | Enter a value here. | field |
| Not a number | `LOGISTICS_INVALID_NUMBER` (existing) | Enter a number such as 45 or 45.5. | field |
| Dimension or weight ≤ 0 | `LOGISTICS_NOT_POSITIVE` (existing) | This must be greater than zero. | field |
| More than 3 decimals (dimension, weight) | `LOGISTICS_TOO_MANY_DECIMALS` (existing) | Use at most {max} decimal places. | field |
| Quantity rules | existing `LOGISTICS_QUANTITY_*` codes | as in CBM | `quantity` |
| Divisor ≤ 0 | `LOGISTICS_NOT_POSITIVE` (existing) | This must be greater than zero. | `divisor` |
| Divisor outside **1000–10000** cm³/kg, or not a whole number | `LOGISTICS_DIVISOR_OUT_OF_RANGE` | Enter a divisor between 1,000 and 10,000 cm³ per kg. | `divisor` |
| Actual weight above **100,000 kg per package** (after conversion) | `LOGISTICS_WEIGHT_TOO_LARGE` | Enter at most 100,000 kg per package. | `weight` |

The ranges are proposals (§13, extra decision 10). The 1000–10000 range covers the common courier and
air values (4000, 5000, 6000, 7000) and road freight (3000), and rejects typos such as 50 or 500000.
Errors are shown next to the field (`aria-invalid`), as in the other calculators.

## 8. Tool page content requirements (PR 2)

**Preset `presets/logistics/volumetric.yaml`:**

- Fields:
  - `unit` (segmented, default **cm**)
  - `length`, `width` and `height` (help text)
  - `quantity` (default 1)
  - `weight` and `weightUnit` (segmented: kg · g · lb, default **kg**)
  - `divisor` (`enum-or-number`: **5000**, **6000**, custom; default from §13 decision 1; help text:
    "Carriers use different divisors; check yours.")
- Outputs: total chargeable weight (primary), chargeable per package, volumetric per package and total,
  actual per package and total. Labels carry units ("Total chargeable weight (kg)").
- Working-step templates as in §4.

**Manifest `tools/volumetric-weight-calculator/manifest.yaml`:**

- T2, archetype B, category `logistics`, `disclaimer: professional`.
- SEO: the title is 30–60 characters and contains "volumetric weight calculator"; the description is
  120–160 characters.
- **Search synonyms:** volumetric weight, dimensional weight, courier weight, chargeable weight, shipping
  weight, air freight weight, logistics calculator. Also a synonym group
  `[volumetric weight, dimensional weight, dim weight, volume weight]`.
- "logistics calculator" is also a CBM synonym. The search tests confirm both tools rank sensibly.

**Content `content.md`** (T2 sections):

- **What volumetric weight means**, and **why couriers use it**: light but bulky parcels take up space
  in vans and aircraft.
- **Actual vs volumetric vs chargeable weight**, with a short table.
- **How to use.**
- **Method and formula:** L × W × H in cm ÷ divisor; the unit conversions; the higher of actual and
  volumetric; the rounding rule.
- **Worked example:** the table from fixture 001 (case A).
- **Carrier-divisor disclaimer:** "Carriers and services use different divisors (for example 5000 or
  6000 cm³/kg) and may round chargeable weight up. Use the divisor your carrier states, and confirm the
  final chargeable weight with them."
- **FAQs** (at least 6):
  - what volumetric weight is
  - 5000 vs 6000
  - why my chargeable weight is higher than the scale weight
  - inches and pounds (and in³/lb divisors)
  - does rounding up apply
  - the difference from CBM (link to the CBM Calculator)
- **References:** IATA's dimensional weight guidance (plain-text citation); the international inch and
  pound (1959).
- The professional disclaimer.

**Logistics category (taxonomy):** now that two tools exist, update the summary and SEO text to name
both, for example "Carton volume (CBM) and volumetric weight for freight and shipping."
Container loading and pallet planning are **still not mentioned**.

## 9. Related links

- **Volumetric Weight → CBM Calculator** (`graph.related`), and **CBM Calculator → Volumetric Weight**.
  This is a metadata-only change to CBM with no version bump, as decided in the TASK-002B report.
- **Future Shipping Cost Calculator and Container Loading Calculator:** **not linked now.** The pipeline
  rejects links to tools that do not exist. The content may mention them in plain text only if the
  founder wants that. Recommendation: do not mention them until they exist (trust rules).

## 10. Tests required

**PR 1 (operation):**
- **Engine fixtures, each cited and hand-verified:**
  - cases A–E (§6)
  - g input (8000 g = 8 kg)
  - the actual-weight-missing case (if optional)
  - rounding increment 0.5 and 1 (if chosen)
  - errors: every code in §7, including the divisor at 999, 10001 and 5000.5
- **Unit tests:**
  - the length and weight factors are exact
  - numbers and strings give the same output
  - `billedOn` for all three cases
  - the 20-dp division with a 6000 divisor gives deterministic output
  - the working-step keys per case
  - every code has a message
- **CBM fixtures unchanged and passing.**

**PR 2 (tool):**
- 5 or more tool fixtures.
- **e2e:**
  - the sample
  - switching to 6000 and to a custom divisor
  - inch and lb input
  - the actual-billed case showing "actual" in the working
  - field errors (divisor 50, weight 0, quantity 2.5)
  - the disclaimer
- The shared suites (Try sample, network, axe light and dark, screenshots) pick the tool up through
  `tests/support/tool-page.ts`.
- **Search relevance:** each synonym; "cbm" still finds CBM.
- **Pipeline:** 8 tools and 8 presets; Logistics has 2 tools.
- **Determinism:** the new fixtures hash identically in Node, Chromium, Firefox and WebKit.
- **Screenshots:** the new tool; `logistics-*` and `home-*` (the Logistics card shows "2 tools").

## 11. Out of scope

- Shipping cost, carrier APIs, live courier rates
- Container loading, pallet planning
- Divisors in in³/lb (a divisor-unit switch)
- Multiple carton rows (unless §13 decision 5 says "now")
- Exports, PDF reports, login, subscription, analytics, AI, voice, the appointment engine, offline
  licensing
- Any change to CBM behaviour, other tools or the homepage layout

## 12. Acceptance checklist

**PR 1 — operation**
- [ ] `logistics.weight.chargeable@1` in `engines/logistics`; the architecture check is green; only
      `@mangotools/engine-numeric`, `@mangotools/core` and `zod` are imported
- [ ] All fixtures pass, each with a cited source; CBM fixtures unchanged and passing
- [ ] Every §7 case returns a typed error with the right `path`; nothing throws for user input
- [ ] Factors are exact; division uses 20 dp; each output is rounded once
- [ ] Engine README and changelog → 0.2.0
- [ ] No tool, preset or UI change
- [ ] CI green on Node 24 × Chromium / Firefox / WebKit

**PR 2 — tool**
- [ ] `/volumetric-weight-calculator` works in all units and weight units, with 5000, 6000 and a custom
      divisor
- [ ] It shows volumetric, actual and chargeable weight per package and in total, and which weight is
      billed
- [ ] kg with 3 dp by default; working steps show every step, including the "billed on" basis
- [ ] Content includes all §8 sections, the carrier-divisor note and the professional disclaimer; the
      synonyms work in search
- [ ] Clear field-level errors
- [ ] Related link CBM ↔ Volumetric; the Logistics text names only the two existing tools
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility 100, SEO 100; JS budgets held
- [ ] CI green on Node 24 × Chromium / Firefox / WebKit, including determinism
- [ ] A TASK-003B report after both PRs merge

**Estimated effort:** PR 1 ≈ 0.5–1 day; PR 2 ≈ 1 day.

## 13. Founder decisions required before coding

No code will be written until these are answered. Recommendations are marked ★.

1. **Default divisor:** ☐ 5000 ★ (common for international courier) ☐ 6000 (common for air freight and
   some express services)
2. **Quick options:** ☐ both 5000 and 6000 as one-tap options, plus custom ★ ☐ one default plus custom
   only
3. **Actual weight:**
   - ☐ **optional** ★ Without it, the tool shows volumetric weight, sets chargeable = volumetric, and
     says "enter the actual weight to compare".
   - ☐ required
4. **Output units:** ☐ kg only ★ (simpler; lb input is still accepted) ☐ kg plus lb as secondary
   outputs
5. **Multiple carton rows:** ☐ later ★ (needs a multi-row input archetype; single carton type now) ☐ now
6. **Chargeable weight rounding:**
   - ☐ **exact decimal only by default** ★, with an optional "round up to 0.5 kg / 1 kg" selector
     (carriers differ)
   - ☐ always round up to 0.5 kg
   - ☐ always round up to 1 kg
   - ☐ exact only, with no selector
7. **Search placeholder:** ☐ keep "Search tools — try GST, JSON, CBM, Base64" ★ ☐ change it to include
   volumetric weight
8. **PR split:** ☐ two PRs, operation then tool ★ (one lane per PR) ☐ one PR

Extra decisions raised by the plan:

9. **"Billed on" display:** ☐ in the working step only (no schema change) ★ ☐ also as a labelled output
   row (a small output-schema addition, platform lane)
10. **Limits:** divisor a whole number from 1,000 to 10,000 cm³/kg; actual weight ≤ 100,000 kg per
    package; dimensions and weight ≤ 3 dp; quantity 1 to 1,000,000. ☐ approve ★ ☐ change
11. **Future-tool mentions:** ☐ no mention of the Shipping Cost or Container Loading calculators until
    they exist ★ ☐ mention them as "coming later" in plain text
