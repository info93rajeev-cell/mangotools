# TASK-003A — CBM Calculator (plan)

> **Planning document. No code has been written.** Execution starts only after the founder approves
> §12. This task starts the **Logistics** category.

## 1. Goal

Add a **CBM Calculator** (`/cbm-calculator`) as the first Logistics tool. It is a practical calculator for
carton, cargo and shipping volume, for importers, exporters, freight quotes and warehouse work.

- It calculates **CBM per carton**, **total CBM** and **cubic feet** from carton dimensions and quantity.
- It uses exact decimal arithmetic, and shows the working and a professional disclaimer.
- It makes the Logistics category visible for the first time (1 tool, `minToolsPerCategory: 1`).

Phase 1 plan reference: `docs/phase-1/PHASE-1-BUILD-PLAN.md` §4 tool 12
(`cbm-calculator`, logistics, T2, archetype B, operation `logistics.cbm.compute`, preset `logistics/cbm`).

## 2. Split: two implementation PRs

There is no logistics engine today (`engines/` holds `data`, `estimate`, `numeric` and `search`).
`AGENTS.md` golden rule 1 requires one lane per PR, so the work is split:

| PR | Lane | Content | Visible to users? |
|---|---|---|---|
| **PR 1 — Logistics engine foundation** | `engine-logistics` | New `engines/logistics` package with one operation, `logistics.cbm.compute@1`, its fixtures and unit tests. Also one line in `scripts/validate/rules.ts` (`ENGINE_IMPORTS`) so the engine may import `@mangotools/engine-numeric`, plus the lockfile update from `pnpm install` | **No.** There is no preset or tool yet; the engine is only built, validated and fixture-tested |
| **PR 2 — CBM Calculator tool** | `tools` | Preset `logistics/cbm`, tool `cbm-calculator` (manifest, content, fixtures), taxonomy (synonyms; Logistics category text), homepage placeholder string, tests and screenshots | Yes |

PR 2 starts only after PR 1 is merged and green.

**Lane note for PR 2:** the placeholder is one string in `packages/ui/src/strings/en.ts` (the ui lane).
The founder asked for it to change once CBM ships, so it is proposed **inside PR 2** as a named one-line
exception. The alternative is a tiny PR 3 (§12, decision 5).

## 3. Engine operation design (PR 1)

**Package:** `engines/logistics` (`@mangotools/engine-logistics`, version 0.1.0). It uses the same layout
as `engines/estimate`:

```
engines/logistics/
├── AGENTS.md            # lane rules: decimals via engine-numeric, no floats, units as inputs
├── README.md            # operation table + changelog
├── package.json         # deps: @mangotools/core, @mangotools/engine-numeric, zod
├── tsconfig.json
└── src/
    ├── index.ts         # export const engine: EngineModule = { engineId: 'logistics', operations: [cbmCompute], messages }
    ├── errors.ts        # English messages for every code (§7)
    ├── lib/read-input.ts        # dimension and quantity parsing into decimal strings or typed errors
    └── operations/cbm-compute/
        ├── README.md
        ├── schema.ts    # zod input / params / output
        ├── units.ts     # exact unit → metre factors (§5)
        ├── operation.ts # defineOperation({ id: 'logistics.cbm.compute', major: 1, ... })
        ├── cbm-compute.test.ts
        └── fixtures/    # golden fixtures, each with a cited source
```

**Operation:** `logistics.cbm.compute@1`

- Runtimes `['worker', 'node']`, `cost: light`, `exposure: internal`, `dataClass: public`.
- The engine is pure. It uses no floating point: every value is a decimal string through
  `@mangotools/engine-numeric` (`mul`, `toFixedString`, `parseDecimal`, `compare`). It returns typed
  errors and never throws on user input.
- The generator picks up new engines automatically: `scripts/lib/engines.ts` finds every engine that has
  `src/operations`, and `pnpm gen` writes the worker loader map. No runtime or web change is needed.

**Computation (all exact, rounding only at the end):**

1. `f` = the unit's factor to metres (§5).
2. `cbmPerCartonExact` = `length × width × height × f³`.
3. `totalCbmExact` = `cbmPerCartonExact × quantity`.
4. `totalCftExact` = `totalCbmExact × 35.3146667` (the founder's constant; see §12, decision 3).
5. `cftPerCartonExact` = `cbmPerCartonExact × 35.3146667`.
6. Each output is rounded **once, from its exact value**, to `params.decimals` (default 3) with
   `params.rounding` (default `half-up`).

## 4. Inputs and outputs

**Input** (`schema.ts`, strict object):

| Field | Type | Notes |
|---|---|---|
| `unit` | enum `cm` \| `m` \| `mm` \| `in` | Unit of all three dimensions |
| `length` | decimal (string or number) | Required, > 0 |
| `width` | decimal | Required, > 0 |
| `height` | decimal | Required, > 0 |
| `quantity` | integer (string or number) | Required, ≥ 1, whole number; number of cartons |

**Params:**

| Param | Default | Notes |
|---|---|---|
| `decimals` | `3` | Display precision for CBM and CFT (allowed 0–6) |
| `rounding` | `half-up` | `half-up` \| `half-even`, as in the estimate engine |

**Output:**

| Field | Example (50 × 40 × 30 cm, 100 cartons) | Role in the tool |
|---|---|---|
| `cbmPerCarton` | `"0.060"` | Secondary |
| `totalCbm` | `"6.000"` | **Primary** |
| `cftPerCarton` | `"2.119"` | Secondary |
| `totalCft` | `"211.888"` | Secondary (the "cubic feet" output) |
| `quantity` | `"100"` | Echo, for working steps |
| `working` | step list | Same `workingStep` shape as the estimate engine |

**Working steps** (`formulaKey` → preset template):

1. `cbm.perCarton`: `CBM per carton = {length} × {width} × {height} {unit} ÷ {divisor} = {result} m³`
   (divisor: cm 1,000,000; mm 1,000,000,000; m 1; for inch the step shows × 0.000016387064)
2. `cbm.total`: `Total CBM = {cbm} × {quantity} = {result} m³`
3. `cbm.cft`: `Cubic feet = {cbm} × 35.3146667 = {result} ft³`

Units in labels: preset outputs have no unit field, so the labels carry it. For example "Total CBM (m³)"
and "Total cubic feet (ft³)". **No schema change.**

## 5. Units and conversion rules

| Unit | Factor to metres (exact) | Factor to m³ (exact, = f³) | Source |
|---|---|---|---|
| `m` | 1 | 1 | SI |
| `cm` | 0.01 | 0.000001 | SI |
| `mm` | 0.001 | 0.000000001 | SI |
| `in` | 0.0254 | 0.000016387064 | International inch (1959): 1 in = 25.4 mm exactly |

- All three dimensions use **one unit**; there is no mixing of units per dimension.
- Factors are exact decimal strings in `units.ts`. Nothing comes from floating point.
- **Cubic feet:** `CFT = CBM × 35.3146667`, as the founder decided. The exact factor is
  1 ÷ 0.028316846592 = 35.31466672148859…; §12 decision 3 covers the difference.

## 6. Rounding and display rules

- **Internal:** exact decimal strings until the final step. There are no intermediate roundings.
- **Display:** CBM and CFT to **3 decimal places** by default (`params.decimals`), `half-up`. The engine
  returns fixed-point strings (`"0.060"`), and the UI's `number` format keeps the trailing zeros
  (`formatDecimal` pads and never rounds).
- **Grouping:** international (`1,234.567`). There is no currency and no ₹ (`format: number`).
- **Total from exact, not from rounded per-carton:** `totalCbm = round(exact per carton × quantity)`.
  So the displayed per-carton × quantity can differ from the displayed total. For example,
  25 × 25 × 20 cm gives 0.0125 m³ exact and **0.013** displayed; for 100 cartons the total is
  **1.250** m³, not 1.300. The page explains this in the Method section and an FAQ.
  **Founder to confirm (§12, decision 2)**; some forwarders round per carton first.
- **Tiny volumes:** if a result rounds to `0.000`, the engine adds the warning
  `LOGISTICS_VOLUME_ROUNDS_TO_ZERO` ("The volume is smaller than 0.001 m³ at this precision.").

## 7. Validation rules

| Case | Code | Message (English, `errors.ts`) | `path` |
|---|---|---|---|
| Dimension or quantity missing or empty | `LOGISTICS_MISSING_INPUT` | Enter a value here. | field |
| Not a number (`abc`, `1,2.3`) | `LOGISTICS_INVALID_NUMBER` | Enter a number such as 45 or 45.5. | field |
| Dimension ≤ 0 | `LOGISTICS_NOT_POSITIVE` | This must be greater than zero. | field |
| Dimension with more than 3 decimals | `LOGISTICS_TOO_MANY_DECIMALS` | Use at most {max} decimal places. | field |
| Quantity ≤ 0 | `LOGISTICS_QUANTITY_NOT_POSITIVE` | Enter at least 1 carton. | `quantity` |
| Quantity not a whole number (`2.5`) | `LOGISTICS_QUANTITY_NOT_WHOLE` | The number of cartons must be a whole number. | `quantity` |
| Quantity above 1,000,000 | `LOGISTICS_QUANTITY_TOO_LARGE` | Enter at most {max} cartons. | `quantity` |
| Result rounds to 0 at the chosen precision | `LOGISTICS_VOLUME_ROUNDS_TO_ZERO` (warning) | The volume is smaller than 0.001 m³ at this precision. | — |

- Errors are shown next to the field, as for the other calculators. The UI already maps `path` to the
  field.
- Unknown `unit` values are rejected by the zod input schema. The preset offers only the four units.
- The limits (3 dimension decimals; 1,000,000 cartons) are proposals: §12, decision 4.

## 8. Tool page content requirements (PR 2)

**Preset `presets/logistics/cbm.yaml`** (0.1.0):
- Fields: `unit` (segmented: cm · m · mm · inch; default **cm**), `length`, `width`, `height`
  (`kind: number`), `quantity` (`kind: number`, default `1`).
- Outputs: `totalCbm` (primary), `cbmPerCarton`, `totalCft`, `cftPerCarton`.
- Sample: 50 × 40 × 30 cm × 100 cartons → **6.000 m³**. All strings go in `strings.en`.

**Manifest `tools/cbm-calculator/manifest.yaml`** (0.1.0):
- Category `logistics`, tier T2, archetype B, `disclaimer: professional`.
- SEO: the title is 30–60 characters and contains "CBM calculator"; the description is 120–160 characters.
- Primary keyword "cbm calculator". Secondary: "cubic meter calculator", "carton volume calculator".
- **Search synonyms:** CBM, cubic meter, carton volume, cargo volume, shipping volume, logistics
  calculator. Also a synonym group in `taxonomy/synonyms.yaml`: `[cbm, cubic meter, cubic metre, m3]`.
- Related links: none today. Volumetric and container tools come later; §10.
- A `quality` block with the verification sources.

**Content `tools/cbm-calculator/content.md`** (T2 sections):
- **What CBM means:** cubic metre, the unit freight forwarders use to price and plan sea and air cargo.
- **How to use:** choose the unit, enter length, width and height of one carton, enter the number of
  cartons, then read and copy the result.
- **Method:** the formula, the unit factors, the 35.3146667 CFT factor, and the rounding rule (§6),
  including "total is calculated from the exact volume".
- **Worked example:** the table rendered from fixture 001.
- **FAQ** (at least 5):
  - what is CBM
  - CBM vs cubic feet
  - why the total can differ from rounded per-carton × cartons
  - how to measure a carton (outer dimensions)
  - is CBM the same as chargeable weight (no; that is a future Volumetric Weight tool, so mention it
    without a link)
  - inches vs cm
- **References:** SI definition of the metre; the international inch (1959); the cubic foot. Plain-text
  citations only, no outbound links.
- **Professional disclaimer:** the standard professional disclaimer. Freight is charged by the
  carrier's own rules (chargeable weight, rounding, minimums).

**Tool fixtures** (T2 needs ≥ 2; plan 5): cm example (§4); mm (same carton); m; inch
(20 × 16 × 12 in × 10 → 0.629 m³, 22.222 ft³); and the rounding case (§6).

**Taxonomy `categories.yaml`, Logistics entry:** today's summary and SEO text promise volumetric weight
and container loading, which will not exist yet. Per the trust rules
(`docs/phase-1/TRUST-PROMISES-AND-POLICY-RULES.md` §3), PR 2 rewrites them to describe CBM only (for
example "Carton and cargo volume calculators for freight and shipping."). It also adds `about` and `faq`
entries like the other visible categories.

**Homepage and navigation (no redesign):**
- A **Logistics** category card appears on the homepage. Its order is 30, so it is **first**, before
  Business (50) and Developer (60). It also appears in the header Tools menu, the footer categories,
  `/tools`, and a new `/logistics` page and sitemap entry.
- Search placeholder → **"Search tools — try GST, JSON, CBM, Base64"** (`search.placeholder`). The same
  text shows in the header, `/tools` and 404 searches. It is shorter than today's, so it fits at 360 px.

## 9. Tests required

**PR 1 (engine):**
- **Golden fixtures** in `engines/logistics/src/operations/cbm-compute/fixtures/`, each hand-verified
  with a citation:
  - 001 cm (50 × 40 × 30 cm × 100 → 0.060 / 6.000 / 2.119 / 211.888)
  - 002 mm (same carton in mm → same result)
  - 003 m (0.5 × 0.4 × 0.3 m)
  - 004 inch (20 × 16 × 12 in × 10 → 0.063 / 0.629 / 2.222 / 22.222)
  - 005 rounding reconciles from exact (25 × 25 × 20 cm × 100 → 0.013 / 1.250)
  - 006 large quantity (1,000,000 cartons)
  - errors: 007 missing length, 008 zero width, 009 negative height, 010 quantity 2.5, 011 quantity 0,
    012 non-number, 013 too many decimals, 014 quantity above the limit
  - 015 warning: rounds to zero (1 × 1 × 1 mm)
- **Unit tests** (`cbm-compute.test.ts`):
  - the unit factor table is exact
  - no floating point: inputs as number and as string give identical output
  - `decimals` and `rounding` params behave as documented
  - working steps are present
- **Existing suites cover the rest automatically:**
  - the engine fixture runner (`tests/unit/engine-fixtures.test.ts`)
  - the architecture checks (banned APIs, allowed imports)
  - the determinism suite, once PR 2 makes the site load the engine: Node = Chromium = Firefox = WebKit

**PR 2 (tool):**
- **Tool fixtures** (5, §8) through `pnpm gen` and `tests/unit/tool-fixtures.test.ts`.
- **e2e `tests/e2e/tools.spec.ts`, "CBM Calculator":**
  - the sample gives 6.000
  - switching the unit to inch recalculates
  - invalid quantity (2.5) shows the field error
  - zero dimension shows the field error
  - the disclaimer is visible
  - the working steps text
- **`tests/support/tool-page.ts`:** add the CBM sample. The shared suites then cover it: Try sample,
  network, axe light and dark, and screenshots.
- **Search relevance:** "cbm", "cubic meter", "carton volume", "cargo volume", "shipping volume" →
  `cbm-calculator`. The existing cases keep passing.
- **Pipeline tests** (`scripts/generate/pipeline.test.ts`): the tool list goes to 7, and the visible
  categories become business, developer and **logistics**. The threshold test gains the logistics case.
- **Homepage e2e:** the category links now include "Logistics". The "no tool cards on home" check stays.
- **SEO suite:** `/logistics` gets BreadcrumbList and ItemList. The sitemap includes `/logistics` and
  `/cbm-calculator`. These are generated from the registry; the existing loops cover them.
- **Placeholder:** update the exact-placeholder assertion in `tests/e2e/navigation.spec.ts`.
- **Screenshots:** regenerate `home-*` (Logistics card), add `cbm-calculator-{mobile,desktop}`, and
  optionally add `/logistics`.

## 10. Out of scope

- Container loading, volumetric or chargeable weight, and pallet planning (later TASK-003 parts)
- Exports, PDF reports, share-as-file
- Login, subscription, entitlements, analytics, AI, voice, the appointment engine, offline licensing
- Mixed units per dimension, weight inputs, freight cost estimation
- Homepage redesign (only the automatic Logistics card and the placeholder change)
- Any change to GST, Profit Margin, Markup or the JSON/Base64/URL tools
- Brand rename or domain change

## 11. Acceptance checklist

**PR 1 — engine**
- [ ] `engines/logistics` exists with `logistics.cbm.compute@1`. The engine is pure (architecture check
      green) and uses only `@mangotools/engine-numeric`, `@mangotools/core` and `zod`
- [ ] All engine fixtures (§9) pass. Each has a cited, hand-verified source
- [ ] Every error and warning in §7 is returned as a typed result with the right `path`. Nothing throws
      for user input
- [ ] Unit factors are exact (inch = 0.0254 m), there is no floating point, and rounding happens only at
      the end
- [ ] README and changelog written; lane `AGENTS.md` added
- [ ] No tool, preset, UI or web change. Page count and JS sizes unchanged
- [ ] `pnpm verify`, `pnpm build` and `pnpm test:e2e` are green in CI on Node 24 × Chromium / Firefox /
      WebKit

**PR 2 — tool**
- [ ] `/cbm-calculator` works in all four units. Outputs: CBM per carton, total CBM, cubic feet (and
      per-carton cubic feet), 3 dp by default, international grouping, no currency
- [ ] Working steps and the professional disclaimer are shown
- [ ] The content has what CBM means, how to use, method and formula, worked example, ≥ 5 FAQs and
      references. SEO title and description are within limits. Synonyms work in search
- [ ] Invalid or missing inputs show clear field errors (e2e)
- [ ] Logistics shows on the homepage, in the header menu, the footer, `/tools` and `/logistics`, with
      no homepage redesign. The Logistics category text only describes tools that exist
- [ ] Placeholder reads "Search tools — try GST, JSON, CBM, Base64" and fits at 360 px
- [ ] Determinism suite: the logistics fixtures give identical hashes in Node, Chromium, Firefox and
      WebKit
- [ ] Home JS ≤ 30 KB and tool JS ≤ 60 KB. Lighthouse mobile on `/cbm-calculator`: Performance ≥ 90,
      Accessibility 100, SEO 100
- [ ] `pnpm verify`, `pnpm build` and `pnpm test:e2e` are green in CI on Node 24 × Chromium / Firefox /
      WebKit
- [ ] A TASK-003A report after both PRs merge

**Estimated effort:** PR 1 ≈ 0.5–1 day; PR 2 ≈ 1 day. Founder review after PR 2 screenshots.

## 12. Founder approval required before coding

No code will be written until the founder approves. Please confirm or change:

1. [ ] **Split and scope:** PR 1 (engine only) and then PR 2 (tool), as in §2.
2. [ ] **Total from exact volume** (§6): total CBM = round(exact per-carton × cartons), so 0.013 × 100
       can display as 1.250. *(Alternative: round per carton first, then multiply.)*
3. [ ] **Cubic-feet factor:** use **35.3146667** as decided. The exact factor is 35.31466672148…;
       the difference is about 6 × 10⁻⁸ %, so it cannot change a 3-dp cubic-feet value below roughly
       23,000 m³ total. *(Alternative:
       divide by the exact 0.028316846592.)*
4. [ ] **Input limits:** dimensions ≤ 3 decimal places; quantity a whole number from 1 to 1,000,000.
5. [ ] **Placeholder change inside PR 2** as a one-line lane exception. *(Alternative: a separate tiny
       PR 3.)*
6. [ ] **Default unit cm** and **default quantity 1**; sample 50 × 40 × 30 cm × 100 cartons.
7. [ ] **Logistics category text** rewritten to describe CBM only until more logistics tools exist.
8. [ ] **Outputs:** also show **cubic feet per carton** as a secondary value, in addition to total cubic
       feet.
