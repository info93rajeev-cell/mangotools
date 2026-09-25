# MangoTools — Phase 1 Public Beta Build Plan

**Status:** Ready for implementation · **Date:** 25 September 2026
**Follows (approved, not changed):** `docs/architecture/product-architecture.md`, `repository-blueprint.md`, `platform-security-architecture.md` (v1.1)
**First task file:** `tasks/TASK-001.md`

---

## 1. Phase 1 objective

Launch a fast, clean, ad-free public beta of **30 free tools** that run entirely in the browser, with no sign-up.

**Phase 1 is done when:**

| # | Exit criterion |
|---|---|
| 1 | 30 tools live, each passing its fixtures and end-to-end test |
| 2 | Homepage, All Tools, 7 category pages, About/Trust, Pricing teaser, Privacy, Disclaimer live |
| 3 | Zero third-party network requests anywhere on the site |
| 4 | Engine fixtures produce identical output hashes in Node, Chromium, Firefox and WebKit |
| 5 | Lighthouse (mobile) on home, one category and one tool per archetype: Performance ≥ 90, Accessibility 100, SEO 100 |
| 6 | Sitemap submitted; every tool page indexable with unique title and description |
| 7 | Founder has reviewed every tool page and its content |

**What Phase 1 proves:** the category structure, the UI quality, and the pattern *manifest → preset → deterministic engine operation → archetype UI*. The future Professional plan will be built on top of this pattern.

---

## 2. What to build first

A **vertical slice** before anything else (TASK-001):

1. Monorepo scaffold, CI, design tokens, core operation contract.
2. Registry pipeline: taxonomy + presets + manifests + content + fixtures → validated `generated/registry.json`.
3. Templates: Home, All Tools, Category, Tool page.
4. Archetype A (instant transform) and Archetype B (calculator).
5. Five tools across two categories: JSON Formatter, Base64, URL Encode/Decode, GST Calculator, Profit Margin Calculator.

**Why first:** if the pattern works end-to-end for five tools, the other 25 are mostly data plus operations. If it doesn't, you find out in week 1, not week 6.

---

## 3. What not to build yet

| Not in Phase 1 | When |
|---|---|
| Login, accounts, sessions, devices | Professional launch (M2) |
| Subscriptions, payments, entitlements, gating code | M2 |
| User dashboard, projects, sync, revisions | M3 |
| Teams, organisations, roles, audit | M4 |
| Enterprise, Hybrid, Private, Air-Gapped | M5–M7 |
| Browser extension | M3 |
| AI features of any kind | Later, optional |
| Tokens / cloud operations | Later |
| Private or licensed datasets; dataset service | M3 |
| Engineering workspaces (profiles, BOQ, estimates) | M3+ |
| Imports (CSV/XLSX into tools), branded PDF reports | M2 |
| Large-file streaming engine (1–5 GB) | M3 (Phase 1 uses honest in-memory limits) |
| Profession pages (`/for/…`), guides (`/learn/…`), workflows, compare pages | Phase 1.1+ |
| Changelog page and RSS | Phase 1.1 (manifests already carry changelogs) |
| Per-tool generated OG images | Phase 1.1 (Phase 1 uses one OG image per category) |
| Waitlist form with a backend | Phase 1 uses an email link only |
| Analytics provider | Placeholder `track()` only (no network) |
| Regex Tester, Text Diff, Barcode Generator, Flatten PDF, Color Picker from Image, JPG to PNG, Discount Calculator | Phase 1.1 backlog |

---

## 4. The final 30 tools

**Selection rules used:** real search demand · low build cost · reuse of a small number of engine operations · every archetype exercised · every visible category has ≥ 3 tools · professional differentiators included.

| # | Tool | Slug | Category | Tier | Archetype | Engine operation / preset | Task |
|---|---|---|---|---|---|---|---|
| 1 | JSON Formatter & Validator | `json-formatter` | developer | T3 | A | `data.json.format` / `data/json.format` | 001 |
| 2 | Base64 Encode & Decode | `base64-encode-decode` | developer | T3 | A | `data.base64.transform` / `data/base64` | 001 |
| 3 | URL Encode & Decode | `url-encode-decode` | developer | T3 | A | `data.url.transform` / `data/url` | 001 |
| 4 | GST Calculator | `gst-calculator` | business | T2 | B | `estimate.tax.gst` / `estimate/gst.india` | 001 |
| 5 | Profit Margin Calculator | `profit-margin-calculator` | business | T2 | B | `estimate.pricing.margin` / `estimate/pricing.margin` | 001 |
| 6 | Markup Calculator | `markup-calculator` | business | T2 | B | `estimate.pricing.margin` / `estimate/pricing.markup` | 002 |
| 7 | QR Code Generator | `qr-code-generator` | business | T3 | B | `data.qr.generate` / `data/qr` | 002 |
| 8 | CSV to JSON Converter | `csv-to-json-converter` | developer | T3 | A | `data.csv.convert` / `data/csv` | 002 |
| 9 | UUID Generator | `uuid-generator` | developer | T3 | B | `data.uuid.generate` / `data/uuid` | 002 |
| 10 | Unix Timestamp Converter | `unix-timestamp-converter` | developer | T3 | B | `data.time.convert` / `data/timestamp` | 002 |
| 11 | Hash Generator (MD5, SHA) | `hash-generator` | developer | T3 | A | `data.hash.compute` / `data/hash` | 002 |
| 12 | CBM Calculator | `cbm-calculator` | logistics | T2 | B | `logistics.cbm.compute` / `logistics/cbm` | 003 |
| 13 | Volumetric Weight Calculator | `volumetric-weight-calculator` | logistics | T2 | B | `logistics.weight.chargeable` / `logistics/volumetric` | 003 |
| 14 | Container Loading Calculator | `container-loading-calculator` | logistics | T2 | B | `logistics.container.estimate` / `logistics/container` | 003 |
| 15 | Merge PDF | `merge-pdf` | pdf | T3 | D | `pdf.merge` / `pdf/merge` | 004 |
| 16 | Split PDF | `split-pdf` | pdf | T3 | D | `pdf.split` / `pdf/split` | 004 |
| 17 | JPG to PDF | `jpg-to-pdf` | pdf | T3 | D | `pdf.fromImages` / `pdf/from-images` | 004 |
| 18 | Add Page Numbers to PDF | `add-page-numbers-to-pdf` | pdf | T3 | D | `pdf.stamp.text` / `pdf/stamp.page-numbers` | 004 |
| 19 | Bates Numbering for PDF | `bates-numbering-pdf` | pdf | T3 | D | `pdf.stamp.text` / `pdf/stamp.bates` | 004 |
| 20 | Watermark PDF | `watermark-pdf` | pdf | T3 | D | `pdf.stamp.text` / `pdf/stamp.watermark` | 004 |
| 21 | PDF Metadata Remover | `pdf-metadata-remover` | privacy-tools | T3 | D | `pdf.metadata.strip` / `pdf/metadata.strip` | 004 |
| 22 | Image Resizer | `image-resizer` | media | T3 | D | `image.resize` / `image/resize` | 005 |
| 23 | Crop Image | `crop-image` | media | T3 | E | `image.crop` / `image/crop` | 005 |
| 24 | Compress Image | `compress-image` | media | T3 | D | `image.compress` / `image/compress` | 005 |
| 25 | PNG to JPG | `png-to-jpg` | media | T3 | D | `image.convert` / `image/convert.png-to-jpg` | 005 |
| 26 | EXIF Metadata Remover | `exif-metadata-remover` | privacy-tools | T3 | D | `image.metadata.strip` / `image/metadata.strip` | 005 |
| 27 | Rise and Fall Leveling Calculator | `rise-and-fall-calculator` | surveying | T1 | C | `survey.leveling.reduce` / `survey/leveling.rise-fall` | 006 |
| 28 | Height of Instrument Calculator | `height-of-instrument-calculator` | surveying | T4 (variant of 27) | C | `survey.leveling.reduce` / `survey/leveling.hi` | 006 |
| 29 | Bowditch Traverse Calculator | `bowditch-traverse-calculator` | surveying | T1 | C | `survey.traverse.adjust` / `survey/traverse.bowditch` | 006 |
| 30 | PII & PHI Text Redaction Tool | `pii-redaction-tool` | privacy-tools | T1 | A | `privacy.text.detect` + `privacy.text.transform` / `privacy/text.pii-phi` | 007 |

**Visible categories at launch (7):** Developer (7) · Business (4) · Logistics (3) · Documents & PDF (6) · Media & Images (4) · Privacy & Compliance (3) · Surveying (3). *Construction* and *Everyday Utilities* exist in taxonomy but stay hidden until they have tools.

**Notes on specific tools**

- **GST Calculator:** rate choices 0 %, 0.25 %, 3 %, 5 %, 18 %, 40 % plus a custom rate, reflecting the GST rate structure effective 22 September 2025; rates live in a small effective-dated preset, not in code. Intra-state (CGST + SGST) and inter-state (IGST); add GST or remove GST.
- **Volumetric Weight:** divisor presets 5000 (courier) and 6000 (IATA air); shows chargeable weight = max(actual, volumetric) with optional round-up step.
- **Container Loading:** typical 20′ GP, 40′ GP and 40′ HC capacities as **editable assumptions** plus a fill-factor input; clearly labelled "volume and weight estimate, not a 3D packing plan".
- **PII & PHI Redaction:** pattern + checksum detectors (email, phone, Aadhaar with Verhoeff check, PAN, card numbers with Luhn, dates, IDs with labels, IP, URLs, ages over 89) and **labelled** names ("Patient:", "Name:", "Dr."), plus a user-supplied list of terms to redact. No machine learning in Phase 1 — the page says clearly that unlabelled names must be added by the user.
- **Height of Instrument:** a T4 variant sharing the Rise & Fall engine — distinct search intent, same code.
- **Hash Generator:** MD5 and SHA-1 are labelled "not for security".

---

## 5. Folder structure (Phase 1 subset of the approved blueprint)

```
mangotools/
├── AGENTS.md · CLAUDE.md · README.md
├── site.config.yaml                 # site URL per environment, brand names, nav threshold
├── package.json · pnpm-workspace.yaml · tsconfig.base.json · biome.json · .node-version · lefthook.yml
├── .github/
│   ├── workflows/ci.yml             # TASK-001
│   ├── workflows/deploy.yml         # TASK-008 (preview + production)
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   ├── architecture/                # 3 approved documents (moved here in TASK-001)
│   ├── phase-1/PHASE-1-BUILD-PLAN.md
│   ├── playbooks/add-tool.md
│   └── glossary.md
├── tasks/                           # TASK-001.md … TASK-008.md (one per coding-agent task)
├── schemas/src/                     # Zod: site-config, taxonomy, preset, manifest, content front matter, fixture
├── engines/
│   ├── numeric/   data/   estimate/   search/          # TASK-001
│   ├── logistics/                                      # TASK-003
│   ├── pdf/                                            # TASK-004
│   ├── image/                                          # TASK-005
│   ├── units/   grid/   survey/                        # TASK-006
│   └── privacy/                                        # TASK-007
├── packages/
│   ├── core/                        # operation contract, Result, errors, IR types
│   ├── runtime/                     # worker host, tool state, preferences, analytics placeholder
│   └── ui/                          # tokens, primitives, tool-kit components, archetypes A–E
├── presets/<engine>/<name>.yaml
├── tools/<slug>/manifest.yaml · content.md · fixtures/
├── taxonomy/                        # categories, professions, tags, synonyms, reserved-slugs
├── content/pages/                   # about, privacy, disclaimer, pricing (TASK-008)
├── apps/web/                        # Astro site
├── scripts/                         # validate/, generate/, new/
├── tests/                           # e2e/, a11y/, determinism/, seo/
├── assets/                          # brand/, fonts/, icons/, og/
├── legacy/prototype/                # the earlier HTML prototype, moved here untouched
└── generated/                       # gitignored build output
```

**Deferred folders (do not create in Phase 1):** `apps/api`, `apps/extension`, `apps/mcp`, `packages/adapters`, `packages/workspace`, `packages/io`, `packages/client-platform`, `modules/`, `deploy/`, `entitlements.yaml`, `egress-registry.yaml`, `content/learn`, `content/for`.

---

## 6. Page structure

| Route | Page | Contents | Task |
|---|---|---|---|
| `/` | Home | Hero with search · popular tool chips · "Continue" (recent tools, local only) · category grid with counts · featured professional tools · "Processed on your device" strip · footer | 001 (featured pro tools filled in 006) |
| `/tools` | All tools | Search box · category filter chips · tool cards grouped by category | 001 |
| `/{category}` | Category hub | Header · "Start here" (3 tools) · all tools in category · short intro · FAQ | 001 |
| `/{tool-slug}` | Tool page | See §11 | 001 |
| `/about` | About & Trust | Who builds MangoTools · how processing works on your device · what the site never does (no uploads, no ads, no trackers) · deterministic engines · contact | 008 |
| `/pricing` | Pricing teaser | "Every calculation is free" · what Professional will add (import, branded reports, projects) · email link to be notified | 008 |
| `/privacy` | Privacy policy | Plain-language policy for a site that processes files locally and uses no trackers | 008 |
| `/disclaimer` | Disclaimer | Professional-tool disclaimer, no warranty, verify before use | 008 |
| `/404` | Not found | Search + popular tools | 001 |
| `/robots.txt`, `/sitemap-index.xml` | SEO files | Generated | 001 |

Header nav (Phase 1): Logo · **Tools** (link to `/tools` with a simple category dropdown) · **Pricing** (from TASK-008) · search. Footer: category links, About, Privacy, Disclaimer — links render only for pages that exist, so no broken links at any stage.

---

## 7. Component list

| Layer | Components | Task |
|---|---|---|
| Tokens | Colours (light/dark), typography, spacing, radius, shadows, motion, z-index, breakpoints | 001 |
| Primitives | Button · IconButton · Link · Input · Textarea · NumberField · Select · SegmentedControl · Checkbox · Switch · Badge · Kbd · Tooltip (CSS only) · Toast · InlineAlert · Divider · Skeleton | 001 |
| Layout | SiteHeader · SiteFooter · PageContainer · Breadcrumbs · ThemeToggle · SkipLink | 001 |
| Discovery | SearchBox (with results list) · ToolCard · CategoryCard · CategoryChips · RecentTools | 001 |
| Tool kit | ToolHeader · PrivacyBadge · ActionBar (Copy, Download, Print, Reset, Try sample) · ResultPanel · WorkingSteps · CheckPanel · ErrorMessage · ContentSections · FAQ (details/summary) · RelatedTools · Disclaimer · ProTeaser | 001 (ProTeaser 006) |
| Archetype A | TransformLayout (input pane, options bar from `userOptions`, output pane, swap, live compute) | 001 |
| Archetype B | CalculatorLayout (fields from preset `fields`, results from `outputs`, working steps) | 001 |
| Archetype D | FilePipelineLayout (DropZone, FileQueue with per-file status and reorder, options, Process, DownloadAll) | 004 |
| Archetype E | CanvasLayout (image canvas with crop box, aspect presets, side options) | 005 |
| Archetype C | WorkbenchLayout (editable table with keyboard navigation and paste from Excel, RowCardEditor on mobile, CheckPanel, SVG Plot) | 006 |

Accessibility is part of every component: keyboard operation, visible focus, labels, `aria-live` for results.

---

## 8. Tool manifest format for Phase 1

Phase 1 uses a **strict subset** of the approved manifest spec — same field names, fewer fields. Later phases only add fields.

| Field | Phase 1 | Notes |
|---|---|---|
| `manifestVersion` | Required (`1`) | |
| `id`, `slug` | Required | Kebab-case; `id` = `slug` in Phase 1 |
| `status` | Required | `beta` for all launch tools |
| `tier` | Required | T1–T4 |
| `variantOf` | Required for T4 | Height of Instrument → `rise-and-fall-calculator` |
| `version`, `changelog` | Required | Starts at `0.1.0` |
| `name`, `shortName`, `summary` | Required (`shortName` optional) | |
| `archetype` | Required | A–E |
| `preset`, `sample` | Required (`sample` optional) | |
| `taxonomy.category`, `.tags`, `.synonyms` | Required category; others optional | `professions` optional |
| `capabilities.export`, `.print`, `.share` | Optional | `import`, `projects`, `batch`, `embed` **not in Phase 1** |
| `privacy.dataClass`, `privacy.network` | Required | All Phase 1 tools: `network: none` |
| `disclaimer` | Required | |
| `seo.title`, `.description`, `.primaryKeyword`, `.secondaryKeywords` | Required (secondary optional) | |
| `graph.related`, `graph.next` | Optional | Auto-filled when empty |
| `quality.verifiedAgainst`, `quality.lastVerified` | Required for T1/T2 | |
| `gating`, `previousSlugs`, `deprecation`, `locales`, `icon` | Not used in Phase 1 | |

**Phase 1 validation relaxations (tightened again in M2):** the rule "T1 requires `capabilities.projects: true`" is disabled; T3/T4 content needs only *How to use* and *FAQ* sections (T1/T2 need all five); category visibility threshold comes from `site.config.yaml` (`navigation.minToolsPerCategory`, 1 during development, **3 at launch**) and counts `beta` and `stable` tools.

**Example — `tools/gst-calculator/manifest.yaml`**

```yaml
manifestVersion: 1
id: gst-calculator
slug: gst-calculator
status: beta
tier: T2
version: 0.1.0
changelog:
  - { version: 0.1.0, date: 2026-10-05, type: added, summary: First beta with add/remove GST, CGST/SGST and IGST split. }
name: GST Calculator
shortName: GST
summary: Add or remove GST and split it into CGST and SGST or IGST, with every step shown.
archetype: B
preset: estimate/gst.india
sample: invoice-18
taxonomy:
  category: business
  tags: [tax, invoicing]
  synonyms: [gst calculation, cgst sgst calculator, igst calculator, reverse gst calculator, gst inclusive calculator]
capabilities: { print: true, share: true }
privacy: { dataClass: public, network: none }
disclaimer: professional
seo:
  title: GST Calculator – Add or Remove GST, CGST SGST IGST
  description: Calculate GST on any amount. Add or remove GST at 5%, 18%, 40% or a custom rate and see the CGST, SGST or IGST split. Free, no sign-up, runs in your browser.
  primaryKeyword: gst calculator
  secondaryKeywords: [reverse gst calculator, cgst sgst calculator]
graph:
  related: [profit-margin-calculator, markup-calculator]
quality:
  verifiedAgainst:
    - { citation: "CBIC GST rate structure effective 22 September 2025", locator: "Rate slabs used by the rate selector" }
    - { citation: "Hand-verified arithmetic", locator: "Fixtures 001–003" }
  lastVerified: 2026-10-05
```

**Preset example — `presets/estimate/gst.india.yaml`**

```yaml
presetVersion: 1
id: estimate/gst.india
version: 0.1.0
operation: estimate.tax.gst@1
params:
  rounding: { mode: half-up, decimals: 2 }
  splitMethod: per-component       # CGST and SGST each rounded, total = CGST + SGST
fields:
  mode:   { labelKey: gst.field.mode, kind: enum, control: segmented, options: [add, remove], order: 10 }
  supply: { labelKey: gst.field.supply, kind: enum, control: segmented, options: [intra, inter], order: 20 }
  amount: { labelKey: gst.field.amount, kind: money, currency: INR, required: true, order: 30 }
  rate:   { labelKey: gst.field.rate, kind: enum-or-number, options: [0, 0.25, 3, 5, 18, 40],
            allowCustom: true, unit: percent, order: 40 }
outputs:
  taxableValue: { labelKey: gst.out.taxable, format: money, order: 10 }
  cgst:         { labelKey: gst.out.cgst, format: money, order: 20 }
  sgst:         { labelKey: gst.out.sgst, format: money, order: 30 }
  igst:         { labelKey: gst.out.igst, format: money, order: 40 }
  totalTax:     { labelKey: gst.out.totalTax, format: money, order: 50 }
  grossAmount:  { labelKey: gst.out.gross, format: money, order: 60, primary: true }
samples:
  invoice-18: { titleKey: gst.sample.invoice18, input: { amount: "1000.00", rate: 18, mode: add, supply: intra } }
ui: { archetypes: [B], density: comfortable, compute: live }
strings:
  en:
    gst.field.amount: Amount (₹)
    gst.field.rate: GST rate
    gst.field.mode: Calculation
    gst.field.supply: Supply type
    gst.out.taxable: Taxable value
    gst.out.cgst: CGST
    gst.out.sgst: SGST
    gst.out.igst: IGST
    gst.out.totalTax: Total GST
    gst.out.gross: Amount including GST
    gst.sample.invoice18: ₹1,000 at 18% (intra-state)
```

**Tool fixture example — `tools/gst-calculator/fixtures/001-add-18-intra.yaml`**

```yaml
id: 001-add-18-intra
preset: estimate/gst.india
source: { type: hand-verified, citation: "1000.00 × 9% = 90.00 CGST; 90.00 SGST" }
input: { amount: "1000.00", rate: 18, mode: add, supply: intra }
expected:
  taxableValue: "1000.00"
  cgst: "90.00"
  sgst: "90.00"
  igst: "0.00"
  totalTax: "180.00"
  grossAmount: "1180.00"
```

Money values are **decimal strings**, never floating-point numbers, in inputs, outputs and fixtures.

**`content.md` contract (Phase 1):** front matter `lastReviewed`, optional `example` (fixture id rendered as the worked-example table). Sections: `## How to use`, `## Method`, `## Worked example`, `## FAQ` (H3 questions), `## References` — all five for T1/T2; *How to use* and *FAQ* for T3/T4.

---

## 9. Shared engine pattern

### 9.1 How one tool works

```
tools/gst-calculator/manifest.yaml ──▶ preset estimate/gst.india ──▶ operation estimate.tax.gst@1
          │                                  │ (fields, outputs, samples)        │ (pure function in engines/estimate)
          ▼                                  ▼                                   ▼
   Tool page (Astro, static)  ──▶  Archetype B island  ──▶  runtime worker host ──▶ ok(output) | err(code)
```

### 9.2 The operation contract (from `packages/core`)

Every operation exports one descriptor: `id`, `major`, `title`, `summary`, `input` schema, `params` schema, `output` schema, `errors` (codes), `runtimes`, `cost.weight`, `exposure` (`internal` in Phase 1), `dataClass`, `run(input, params, ctx)`.

- `run` is **pure**: returns `ok(output)` or `err({ code, path, messageKey, details })`; never throws for user input.
- `ctx` supplies `clock`, `random`, `signal`, `progress`, `log` — engines never read time, randomness or the network directly.
- Outputs are **data** (values, `Check`, `WorkingStep`, `PlotSpec`), never prose or HTML.

### 9.3 Engine folder layout (identical for every engine)

```
engines/estimate/
├── AGENTS.md · README.md · package.json · tsconfig.json
└── src/
    ├── index.ts                     # exports descriptors only
    ├── errors.ts                    # error-code catalogue
    └── operations/
        └── tax-gst/
            ├── operation.ts  schema.ts  run.ts  working.ts  README.md
            └── fixtures/001-….yaml  002-….yaml  003-….yaml
```

### 9.4 Determinism rules that apply in Phase 1

| Rule | Enforced by |
|---|---|
| No `Date.now`, `new Date()` for current time, `Math.random`, `crypto.getRandomValues` inside engines — use `ctx` | Lint rule on `engines/` |
| No `Intl`, `toLocaleString`, `localeCompare` inside engines — formatting happens in the UI | Lint rule |
| Money and percentages in decimal arithmetic via `engines/numeric` (decimal strings in and out) | Code review + fixtures |
| Trigonometry (traverse) via `engines/numeric` deterministic functions, not `Math.sin`/`cos`/`atan2` | Lint rule (TASK-006) |
| No network APIs in engines | Lint rule + TypeScript `lib` without DOM |
| Same fixture ⇒ identical output hash in Node, Chromium, Firefox, WebKit | `tests/determinism` |
| Generators (UUID, QR from text) are deterministic given their inputs; UUID randomness comes only from `ctx.random` | Fixtures with a seeded `ctx.random` |

### 9.5 Runtime

- `packages/runtime` owns one **worker host**: a module worker per engine, created on first use, with a small promise-based message protocol.
- Tool state machine: `idle → editing → running → result | error`. Archetypes A/B compute live (debounced 150 ms); C/D/E compute on "Run".
- Preferences (theme, recent tools) in `localStorage`, wrapped in try/catch with an in-memory fallback.
- Analytics placeholder: `track(event, props)` validates against a small event catalogue and logs to the console in development; **no network** in Phase 1.

---

## 10. SEO URL structure

| Page | URL | Indexed |
|---|---|---|
| Home | `/` | Yes |
| All tools | `/tools` | Yes |
| Category | `/developer`, `/business`, `/logistics`, `/pdf`, `/media`, `/privacy-tools`, `/surveying` | Yes (only visible categories) |
| Tool | `/{tool-slug}` (flat, e.g. `/gst-calculator`) | Yes |
| About, Pricing, Privacy, Disclaimer | `/about`, `/pricing`, `/privacy`, `/disclaimer` | Yes (Privacy/Disclaimer may be `noindex` at founder's choice) |
| Robots, sitemap | `/robots.txt`, `/sitemap-index.xml` | — |

Rules: lowercase kebab-case, no trailing slash, no query-string pages, absolute self-canonical on every page, build fails on slug collisions with categories or reserved words (`app`, `api`, `for`, `learn`, `tools`, `pricing`, `about`, `privacy`, `disclaimer`, `security`, `embed`, `search`, `assets`). Production URL comes from `site.config.yaml` (currently `https://tools.mangopie.in`, changeable in one line).

---

## 11. Tool page template

```
Header
Home › Business › GST Calculator
GST Calculator                                            [🔒 Runs on your device]
Add or remove GST and split it into CGST and SGST or IGST, with every step shown.
[Try sample]                                                              [? How to use]
┌──────────────────────────────── TOOL (archetype) ─────────────────────────────────┐
│ Inputs / options                         │ Result (primary value large)            │
│                                          │ Secondary values · Working steps        │
└───────────────────────────────────────────────────────────────────────────────────┘
[Copy result] [Download] [Print] [Reset]
Disclaimer (T1/T2: "Verify results before professional use")
── below the fold ──
How to use · Method · Worked example (table from fixture) · FAQ · Related tools · References
(T1 only) Professional teaser: "Coming with Professional: import, branded reports, projects"
Footer
```

| Rule | Detail |
|---|---|
| Above the tool | Only breadcrumb, H1, one-line summary, privacy badge |
| Visibility | Tool usable without scrolling at 360 px wide and at 1366 × 768 |
| Results | Announced via `aria-live="polite"`; numbers use tabular figures |
| Errors | Inline, specific ("Unexpected character at line 3, column 14"), never an alert dialog |
| No | Pop-ups, timers, interstitials, ads, cookie banners (no cookies are set) |
| Structured data | `WebApplication` (free offer), `BreadcrumbList`, `FAQPage` from the FAQ section |
| Performance | Island JS for archetypes A/B ≤ 60 KB compressed (engines load in the worker, lazily) |

---

## 12. Category page template

```
Home › Business
Business & Finance                                                        4 tools
Tax, pricing and business calculators that run on your device.
Start here: [GST Calculator] [Profit Margin] [Markup]
All tools (cards: name, one-line summary, tier badge for professional tools)
About these tools (2–3 short paragraphs from taxonomy summary)
FAQ (2–4 questions)
```

Structured data: `BreadcrumbList`, `ItemList` of tools. Title pattern: `{Category name} Tools – Free Online {Category} Calculators | MangoTools` (≤ 60 characters, adjusted per category in `taxonomy/categories.yaml`).

---

## 13. Design system summary

| Area | Phase 1 values (from the approved architecture §8) |
|---|---|
| Neutrals (light) | bg `#FFFFFF` · surface-subtle `#FAFAF9` · border `#E7E5E4` · input border `#948D87` · text `#1C1917` · muted `#57534E` · subtle `#78716C` |
| Neutrals (dark) | bg `#0C0A09` · surface-subtle `#1C1917` · border `#292524` · input border `#6B645E` · text `#FAFAF9` · muted `#D6D3D1` · subtle `#A8A29E` |
| Brand | Mango `#FFB000` for **fills only** (primary button, logo mark) with text `#1C1917`; Mango as text `#B45309` (light) / `#FFB000` (dark); focus ring `#D97706` (light) / `#FFB000` (dark) |
| Semantic | success `#15803D`/`#4ADE80` · warning `#C2410C`/`#FB923C` · danger `#B91C1C`/`#F87171` · info `#1D4ED8`/`#60A5FA` — always with icon + text |
| Type | Inter (self-hosted) for UI; JetBrains Mono for code/data; weights 400/500/600; tabular numerals for numbers |
| Scale | Display 48/52 · H1 30/36 · H2 24/32 · H3 18/26 · Body 16/26 · UI 14/20 · Caption 12/16 |
| Spacing | 4 px base: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96 |
| Radius | 4 · 6 (buttons, inputs) · 8 (cards) · 12 (dialogs); pills only for small badges |
| Elevation | Borders first; two shadows (popover, dialog) |
| Layout | Max width 1200 px (marketing), 1280 px (tools); 12 columns; breakpoints 640/768/1024/1280; 16 px mobile gutter |
| Density | Comfortable (40 px rows) default; compact (32 px) for tables |
| Icons | Lucide, 1.5 px stroke, inlined as SVG at build time |
| Motion | 120–200 ms ease-out; respects reduced motion |
| Theme | Light, dark, system; stored locally |
| Voice | Plain and precise; no hype; errors say what happened and how to fix it |

---

## 14. Development sequence

| Task | Scope | Tools delivered | Depends on | Estimate* |
|---|---|---|---|---|
| **TASK-001** | Foundation, design system, registry pipeline, Home, All Tools, Category, Tool template, archetypes A and B, numeric (decimal), data, estimate and search engines, CI | 5 (JSON, Base64, URL, GST, Profit Margin) | — | 5–7 days |
| **TASK-002** | Remaining developer and business tools; header search dropdown on all pages | 6 (Markup, QR, CSV↔JSON, UUID, Timestamp, Hash) | 001 | 3–4 days |
| **TASK-003** | Logistics engine and tools | 3 (CBM, Volumetric, Container) | 001 | 2–3 days |
| **TASK-004** | PDF engine (pdf-lib), archetype D, file validation and limits | 7 (Merge, Split, JPG→PDF, Page numbers, Bates, Watermark, PDF metadata) | 001 | 5–6 days |
| **TASK-005** | Image engine (WASM codecs), archetype E | 5 (Resize, Crop, Compress, PNG→JPG, EXIF) | 004 (archetype D) | 4–5 days |
| **TASK-006** | Numeric trig, units (angles), grid (paste/validate), survey engine, archetype C, SVG plot, ProTeaser | 3 (Rise & Fall, HI, Bowditch) | 001 | 6–8 days |
| **TASK-007** | Privacy engine (patterns, validators, transforms) and redaction UI with review | 1 (PII & PHI) | 001 | 3–4 days |
| **TASK-008** | About/Trust, Pricing teaser, Privacy, Disclaimer; category OG images; SEO audit; Lighthouse CI; deploy workflows; launch checklist | — | 001–007 | 3–4 days |

\*Elapsed days for an AI coding agent with daily founder review. TASK-003, 006 and 007 can run in parallel with 004/005 once TASK-001 is merged. Realistic public beta: **5–7 weeks**.

---

## 15. GitHub issue list (Milestone: `M1 Public beta`)

| ID | Issue | Lane | Size | Task |
|---|---|---|---|---|
| P1-01 | Move prototype to `legacy/prototype/`, move architecture docs to `docs/architecture/`, init repo | platform | S | 001 |
| P1-02 | Workspace scaffold: pnpm, Node 24, TypeScript, Biome, lefthook, commitlint | platform | S | 001 |
| P1-03 | `AGENTS.md`, `CLAUDE.md`, `docs/playbooks/add-tool.md`, glossary | docs | S | 001 |
| P1-04 | CI workflow: lint, typecheck, unit, gen, build, e2e | ci | S | 001 |
| P1-05 | `packages/core`: operation contract, Result, errors, IR types | platform | M | 001 |
| P1-06 | `schemas/`: site-config, taxonomy, preset, manifest, content, fixture | platform | M | 001 |
| P1-07 | Registry pipeline: validate + resolve presets + generate registry, search index, sitemap, robots | platform | M | 001 |
| P1-08 | Fixture runner (engine and tool fixtures) | platform | S | 001 |
| P1-09 | `engines/numeric`: decimal arithmetic and rounding | engine-numeric | S | 001 |
| P1-10 | `engines/data`: json.format, base64.transform, url.transform | engine-data | M | 001 |
| P1-11 | `engines/estimate`: tax.gst, pricing.margin | engine-estimate | M | 001 |
| P1-12 | `engines/search`: index build + query | engine-search | S | 001 |
| P1-13 | `packages/runtime`: worker host, tool state, preferences, analytics placeholder | platform | M | 001 |
| P1-14 | `packages/ui`: tokens, fonts, primitives, layout components | ui | M | 001 |
| P1-15 | `packages/ui`: tool kit + archetypes A and B | ui | M | 001 |
| P1-16 | `apps/web`: Home, All Tools, Category, Tool, 404 templates | platform | M | 001 |
| P1-17 | Taxonomy files (9 categories, professions, tags, synonyms, reserved slugs) | tools | S | 001 |
| P1-18 | Tools: JSON Formatter, Base64, URL Encode/Decode (manifest, preset, content, fixtures) | tools | M | 001 |
| P1-19 | Tools: GST Calculator, Profit Margin Calculator | tools | M | 001 |
| P1-20 | Tests: e2e, axe, determinism across browsers, network recorder | platform | M | 001 |
| P1-21 | `pnpm new:tool` scaffolder | platform | S | 001 |
| P1-22 | data: csv.convert, uuid.generate, time.convert, hash.compute, qr.generate | engine-data | M | 002 |
| P1-23 | Tools: CSV↔JSON, UUID, Timestamp, Hash, QR, Markup | tools | M | 002 |
| P1-24 | Header search dropdown on every page | ui | S | 002 |
| P1-25 | `engines/logistics` + 3 logistics tools | engine-logistics / tools | M | 003 |
| P1-26 | `engines/pdf`: merge, split, fromImages, stamp.text, metadata.strip | engine-pdf | M | 004 |
| P1-27 | Archetype D (DropZone, FileQueue, limits, downloads) | ui | M | 004 |
| P1-28 | 7 PDF/privacy tools | tools | M | 004 |
| P1-29 | `engines/image`: decode/encode, resize, crop, compress, convert, metadata.strip | engine-image | M | 005 |
| P1-30 | Archetype E (crop canvas) | ui | M | 005 |
| P1-31 | 5 image tools | tools | M | 005 |
| P1-32 | `engines/numeric`: deterministic sin/cos/atan2 with reference vectors | engine-numeric | S | 006 |
| P1-33 | `engines/units`: angle parse/format (DMS, WCB, quadrant) | engine-units | S | 006 |
| P1-34 | `engines/grid`: paste parse + validate | engine-grid | S | 006 |
| P1-35 | `engines/survey`: leveling.reduce (rise & fall, HI) with textbook fixtures | engine-survey | M | 006 |
| P1-36 | `engines/survey`: traverse.adjust (Bowditch) with textbook fixtures | engine-survey | M | 006 |
| P1-37 | Archetype C (workbench table, row cards, CheckPanel, SVG plot) | ui | M | 006 |
| P1-38 | 3 surveying tools + ProTeaser | tools | M | 006 |
| P1-39 | `engines/privacy`: detectors, validators, transforms, synthetic corpus | engine-privacy | M | 007 |
| P1-40 | PII & PHI Redaction tool with review highlights | tools / ui | M | 007 |
| P1-41 | Static pages: About/Trust, Pricing, Privacy, Disclaimer (founder reviews text) | content | S | 008 |
| P1-42 | Category OG images, SEO audit script, Lighthouse CI | platform | M | 008 |
| P1-43 | Deploy workflows (Cloudflare Pages preview + production), security headers | ci | S | 008 |
| P1-44 | Launch checklist run and fixes | platform | M | 008 |

Labels: `type:*`, `lane:*`, `size:*`, `tier:*`, `category:*`, `status:*` as defined in the blueprint.

---

## 16. Acceptance checklist (public beta launch)

**Site**
- [ ] Home, All Tools, 7 category pages, 30 tool pages, About, Pricing, Privacy, Disclaimer, 404 render at 360, 768, 1366 and 1920 px
- [ ] Light and dark themes correct on every page
- [ ] Header search finds every tool by name and by at least one synonym
- [ ] No broken internal links; every footer link resolves
- [ ] No page shows content for tools that don't exist

**Every tool**
- [ ] "Try sample" produces the expected result
- [ ] Fixtures pass (T1 ≥ 3, T2 ≥ 2, T3/T4 ≥ 1)
- [ ] Usable by keyboard alone; focus always visible
- [ ] Errors are specific and recoverable
- [ ] Copy/Download/Print work where declared
- [ ] Content sections present per tier; FAQ renders and appears in JSON-LD
- [ ] Disclaimer shown on T1/T2 tools
- [ ] File tools state their size limit honestly and fail gracefully above it

**Privacy & trust**
- [ ] Zero third-party requests (network recorder test)
- [ ] No cookies set; no analytics network calls
- [ ] Fonts and icons self-hosted
- [ ] Security headers and CSP present in production

**SEO**
- [ ] Unique `<title>` (≤ 60 chars) and meta description (120–160 chars) on every indexable page
- [ ] Exactly one H1 per page; absolute self-canonical
- [ ] Sitemap lists exactly the indexable pages; robots allows production, blocks previews
- [ ] JSON-LD validates (WebApplication, BreadcrumbList, FAQPage, ItemList)

**Quality gates**
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility 100, SEO 100, Best Practices ≥ 95 (home, one category, one tool per archetype)
- [ ] Determinism suite identical in Node, Chromium, Firefox, WebKit
- [ ] CI green on `main`; production deploy from a tagged release
- [ ] Founder sign-off on every tool page and on legal/trust text

---

## 17. Testing checklist

| Level | What | Tool |
|---|---|---|
| Unit — engines | Every operation: golden fixtures, edge cases, error codes | Vitest |
| Unit — pipeline | Schema validation (valid + invalid examples), preset resolution, slug collisions, category threshold | Vitest |
| Tool fixtures | Preset + input → expected output for every tool | Vitest |
| Determinism | All engine fixtures run in Node and in Chromium, Firefox, WebKit; SHA-256 of canonical output JSON must match | Vitest + Playwright |
| End-to-end | Home search → tool; category → tool; sample → result; copy; reset; theme toggle; recent tools | Playwright |
| Accessibility | axe on home, all tools list, each category, each tool (light and dark, empty and result states); keyboard path per archetype | Playwright + axe-core |
| Privacy | Network recorder: only same-origin GETs for static assets; no request bodies; no third-party hosts | Playwright |
| SEO | Built HTML: titles, descriptions, H1 count, canonical, JSON-LD parse, sitemap contents | Script on `dist/` |
| Performance | Lighthouse budgets; island size budgets | Lighthouse CI, size-limit |
| Files (PDF/image) | Encrypted PDF, corrupt PDF, 0-byte file, wrong extension, very large image (pixel limit), PNG with transparency → JPG background | Vitest + Playwright |
| Manual (founder) | 10-minute script per category on a real Android phone and a laptop | Checklist in `docs/phase-1/manual-test.md` (TASK-008) |

---

## 18. First coding-agent prompt

```text
You are the coding agent for MangoTools, a browser-based professional tools platform.

Read tasks/TASK-001.md first and complete its Step 0 (it moves the architecture documents
into docs/architecture/). Then read, in this order:
1. tasks/TASK-001.md                       ← your task; follow it exactly
2. docs/phase-1/PHASE-1-BUILD-PLAN.md      ← Phase 1 scope and decisions
3. docs/architecture/repository-blueprint.md (sections 0, 2, 3, 5, 6, 9 and Appendix A)
4. docs/architecture/product-architecture.md (sections 6, 7, 8) for UI and design rules

Rules:
- Build only what TASK-001 lists. Anything in "Out of scope" is forbidden in this task.
- Engines are pure TypeScript: no DOM, no network, no Date.now/Math.random, no Intl.
- Money is decimal strings via engines/numeric. Never use floating point for money.
- Fixtures are truth. Never change an expected value to make a test pass; stop and report instead.
- Commit after each step with Conventional Commits (feat(ui): …, feat(engine-data): …).
- Run `pnpm verify` and `pnpm build` and `pnpm test:e2e` before declaring any step complete.

When finished, write tasks/TASK-001-REPORT.md with: what was built, commands run and results,
screenshots (desktop 1366 and mobile 360) of Home, a category page and each of the 5 tools,
deviations from the task (with reasons), and open questions.
```
