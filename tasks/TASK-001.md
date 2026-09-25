# TASK-001 — Foundation, Design System, Category System and First 5 Tools

**Milestone:** M1 Public beta · **Issues:** P1-01 … P1-21 · **Estimated effort:** 5–7 working days
**Plan:** `docs/phase-1/PHASE-1-BUILD-PLAN.md` · **Architecture (approved, read-only):** `docs/architecture/`

---

## 0. Goal and definition of done

Build the MangoTools foundation and prove the full pattern end-to-end:

**manifest → preset → deterministic engine operation → archetype UI → static SEO page**

with five working tools:

| # | Tool | URL | Category | Archetype |
|---|---|---|---|---|
| 1 | JSON Formatter & Validator | `/json-formatter` | Developer & Data | A — instant transform |
| 2 | Base64 Encode & Decode | `/base64-encode-decode` | Developer & Data | A |
| 3 | URL Encode & Decode | `/url-encode-decode` | Developer & Data | A |
| 4 | GST Calculator | `/gst-calculator` | Business & Finance | B — calculator |
| 5 | Profit Margin Calculator | `/profit-margin-calculator` | Business & Finance | B |

**Done means:** every item in §20 (Acceptance checklist) is ticked, `pnpm verify`, `pnpm build` and `pnpm test:e2e` pass locally and in CI, and `tasks/TASK-001-REPORT.md` is written (§21).

---

## 1. Read before starting

Until Step 0 (§3) runs, the three architecture documents sit in `docs/` with a `MangoTools-` prefix; Step 0 moves them to the paths below.

1. `docs/phase-1/PHASE-1-BUILD-PLAN.md` — scope, tool list, manifest format, design summary.
2. `docs/architecture/repository-blueprint.md` — §0, §2, §3, §5, §6, §9 and Appendix A (AGENTS.md text).
3. `docs/architecture/product-architecture.md` — §6 (page templates), §7 (components), §8 (design system).
4. `docs/architecture/platform-security-architecture.md` — §2.1 (determinism rules) only.

If any instruction here conflicts with those documents, **this task file wins for Phase 1**; note the conflict in the report.

---

## 2. Out of scope (do not build, do not scaffold)

Login, accounts, payments, pricing logic, gating, dashboards, projects, sync, teams, enterprise features, browser extension, AI, cloud operations, file-processing tools (PDF/image), surveying tools, privacy tool, About/Pricing/Privacy/Disclaimer pages (TASK-008), header search on every page (TASK-002), deploy workflows (TASK-008), analytics provider, cookie banner, any third-party script, font or CDN.

Do **not** create: `apps/api`, `apps/extension`, `apps/mcp`, `packages/adapters`, `packages/workspace`, `packages/io`, `packages/client-platform`, `modules/`, `deploy/`, `entitlements.yaml`.

---

## 3. Step 0 — Starting state and housekeeping

The folder already contains an old prototype and three architecture documents:

```
index.html · project-planner.html · Pasted text.txt · assets/ · tools/*.html
docs/MangoTools-Product-Architecture.md
docs/MangoTools-Repository-Blueprint.md
docs/MangoTools-Platform-Security-Architecture.md
docs/phase-1/PHASE-1-BUILD-PLAN.md · tasks/TASK-001.md
```

Do this first:

1. If the folder is not a git repository: `git init`, set default branch `main`, commit everything as-is: `chore: snapshot existing prototype and docs`.
2. Create branch `task/001-foundation`.
3. `git mv` the prototype into `legacy/prototype/` (index.html, project-planner.html, Pasted text.txt, assets/, tools/). **Do not reuse its code** — its Rise & Fall logic is known to be wrong.
4. `git mv` the three architecture documents to:
   - `docs/architecture/product-architecture.md`
   - `docs/architecture/repository-blueprint.md`
   - `docs/architecture/platform-security-architecture.md`
5. Add `.gitignore` (node_modules, dist, generated, .astro, test-results, playwright-report, coverage, .DS_Store) and `.gitattributes` (`* text=auto eol=lf`).
6. Commit: `chore: move prototype to legacy and docs to docs/architecture`.

**The founder develops on Windows.** Every script must be cross-platform: Node scripts only, no bash-only commands, no hard-coded path separators.

---

## 4. Tech stack (exact choices)

| Area | Choice |
|---|---|
| Runtime | Node 24 LTS (`.node-version` = `24`), pnpm 10 (`packageManager` field) |
| Language | TypeScript, `strict: true`, ESM only, no `any`, no default exports (except where Astro requires) |
| Site | Astro (latest stable), static output, `@astrojs/preact` for islands |
| Islands | Preact (no `preact/compat` needed in this task) |
| Styling | Plain CSS with custom properties; component-scoped CSS (Astro `<style>`, CSS Modules for Preact). **No CSS framework** |
| Schemas | Zod 4; JSON Schema generated with `z.toJSONSchema` |
| Data files | YAML 1.2 via the `yaml` package; Markdown via `unified` + `remark-parse` + `remark-gfm` + `remark-rehype` + `rehype-stringify` |
| Decimal maths | `big.js` (MIT), wrapped by `engines/numeric` — never imported elsewhere |
| Search | `minisearch` (MIT) |
| Icons | `lucide-static` (ISC), SVG inlined at build time |
| Fonts | `@fontsource-variable/inter`, `@fontsource/jetbrains-mono` (OFL-1.1), self-hosted from the build |
| Tests | Vitest; Playwright (Chromium, Firefox, WebKit); `@axe-core/playwright` |
| Lint/format | Biome |
| Git hooks | lefthook (pre-commit: Biome on staged files) |
| Script runner | `tsx` for Node scripts |

Internal packages export **TypeScript source** (`"exports": { ".": "./src/index.ts" }`); there is no per-package build step. Licences allowed: MIT, Apache-2.0, BSD-2/3, ISC, 0BSD, MPL-2.0, and OFL-1.1 for fonts only.

---

## 5. Repository layout created by this task

```
mangotools/
├── AGENTS.md · CLAUDE.md · README.md
├── site.config.yaml
├── package.json · pnpm-workspace.yaml · tsconfig.base.json · biome.json · lefthook.yml · .node-version
├── .github/workflows/ci.yml · .github/PULL_REQUEST_TEMPLATE.md
├── docs/architecture/ (moved) · docs/phase-1/ · docs/playbooks/add-tool.md · docs/glossary.md
├── tasks/TASK-001.md · tasks/TASK-001-REPORT.md (at the end)
├── schemas/src/            site-config.ts · taxonomy.ts · preset.ts · manifest.ts · content.ts · fixture.ts · index.ts
├── engines/
│   ├── numeric/            decimal wrapper
│   ├── data/               json.format · base64.transform · url.transform
│   ├── estimate/           tax.gst · pricing.margin
│   └── search/             index.build · query
├── packages/
│   ├── core/               contract, Result, errors, IR types
│   ├── runtime/            worker host, tool state, preferences, analytics placeholder
│   └── ui/                 tokens, fonts, primitives, layout, tool kit, archetypes A and B
├── presets/data/           json.format.yaml · base64.yaml · url.yaml
├── presets/estimate/       gst.india.yaml · pricing.margin.yaml
├── tools/<slug>/           manifest.yaml · content.md · fixtures/*.yaml   (5 tools)
├── taxonomy/               categories.yaml · professions.yaml · tags.yaml · synonyms.yaml · reserved-slugs.yaml
├── apps/web/               Astro app
├── scripts/                validate/ · generate/ · new/
├── tests/                  e2e/ · a11y/ · determinism/ · seo/
├── assets/                 brand/ · og/
├── legacy/prototype/       (moved, untouched)
└── generated/              (gitignored)
```

---

## 6. Root commands

| Command | Does |
|---|---|
| `pnpm dev` | `pnpm gen` then Astro dev server |
| `pnpm gen` | Validate data + resolve presets + write `generated/` (registry, search index, engine loaders) |
| `pnpm verify` | Biome check · typecheck · architecture checks · `pnpm gen` · Vitest (engines, fixtures, pipeline) |
| `pnpm build` | `pnpm gen` · Astro build · post-build checks (§15.6) |
| `pnpm preview` | Serve `apps/web/dist` |
| `pnpm test:e2e` | Playwright against the built site (`e2e`, `a11y`, `determinism`, `seo` projects) |
| `pnpm new:tool <slug> --preset <id> --category <id> --tier <T1-T4> --archetype <A-E>` | Scaffold a tool folder that validates |

**Architecture checks** (in `scripts/validate/architecture.ts`, part of `verify`):
- No file under `engines/` references `document`, `window`, `fetch`, `XMLHttpRequest`, `WebSocket`, `localStorage`, `Date.now`, `new Date(` (without arguments), `Math.random`, `crypto.getRandomValues`, `Intl.`, `toLocaleString`, `localeCompare`.
- `big.js` imported only inside `engines/numeric`.
- `packages/ui` and `apps/web` never import `engines/*` directly (only through `packages/runtime`).
- Source files ≤ 400 lines; functions ≤ 60 lines (warn at 300/40).

---

## 7. `site.config.yaml`

```yaml
brand:
  name: MangoTools
  parent: MangoPie
  tagline: Professional tools. Zero uploads.
environments:
  development: { url: "http://localhost:4321", indexable: false }
  production:  { url: "https://tools.mangopie.in", indexable: true }
navigation:
  minToolsPerCategory: 1          # set to 3 before public launch (TASK-008)
home:
  popular: [gst-calculator, json-formatter, profit-margin-calculator, base64-encode-decode, url-encode-decode]
  featuredProfessional: [gst-calculator, profit-margin-calculator]
```

The active environment comes from the `MANGOTOOLS_ENV` variable (default `development`). Only `production` is indexable. TASK-008 adds the preview environment and contact details.

---

## 8. Taxonomy — `taxonomy/categories.yaml`

All nine approved categories are defined now; only categories with ≥ `minToolsPerCategory` beta/stable tools appear in navigation, home and sitemap.

| id / slug | name | icon (lucide) | order | summary | SEO title | SEO description |
|---|---|---|---|---|---|---|
| `surveying` | Surveying | `ruler` | 10 | Leveling, traverse and coordinate calculations with every check shown. | Surveying Calculators – Leveling & Traverse Tools | Free surveying calculators for leveling and traverse adjustment. Every check and step is shown, and everything runs in your browser. |
| `construction` | Construction | `hard-hat` | 20 | Quantity and material calculators for site and estimating work. | Construction Calculators – Quantities & Materials | Free construction calculators for quantities and materials, built for site engineers and estimators. Runs in your browser. |
| `logistics` | Logistics | `container` | 30 | Freight volume, chargeable weight and container loading calculators. | Logistics Calculators – CBM, Volumetric Weight | Free logistics calculators for CBM, volumetric and chargeable weight, and container loading. No sign-up, runs in your browser. |
| `privacy-tools` | Privacy & Compliance | `shield-check` | 40 | Remove personal data and hidden metadata before you share files. | Privacy Tools – Redact Data & Remove Metadata | Free privacy tools to redact personal data and remove hidden metadata from files. Nothing is uploaded — everything runs on your device. |
| `business` | Business & Finance | `briefcase` | 50 | GST, margin, markup and everyday business calculations. | Business Calculators – GST, Margin & Markup | Free business calculators for GST, profit margin and markup with every step shown. No sign-up, no ads, runs in your browser. |
| `developer` | Developer & Data | `braces` | 60 | Format, encode, convert and generate data — instantly, in your browser. | Developer Tools – JSON, Base64, URL Encoding | Free developer tools to format JSON, encode Base64 and URLs, and convert data. Everything runs locally in your browser. |
| `pdf` | Documents & PDF | `file-text` | 70 | Merge, split, number and watermark PDFs without uploading them. | PDF Tools – Merge, Split, Number & Watermark | Free PDF tools that run in your browser: merge, split, add page numbers and watermarks. Your files are never uploaded. |
| `media` | Media & Images | `image` | 80 | Resize, crop, compress and convert images on your device. | Image Tools – Resize, Crop, Compress & Convert | Free image tools to resize, crop, compress and convert images. Processed on your device — nothing is uploaded. |
| `utilities` | Everyday Utilities | `wrench` | 90 | Quick converters and generators for daily tasks. | Everyday Utilities – Quick Online Converters | Free everyday utilities and converters that run in your browser. No sign-up, no ads. |

Each category also carries 2–3 FAQ entries (question + answer) written for its page; write them for `developer` and `business` in this task (the others when their tools arrive).

Other taxonomy files:
- `professions.yaml`: the 13 professions from product architecture §4.3 (id, name). Not rendered in Phase 1.
- `tags.yaml`: `json`, `encoding`, `url`, `data-format`, `tax`, `invoicing`, `pricing`, `profit`.
- `synonyms.yaml`: groups such as `[base64, base 64, b64]`, `[gst, goods and services tax]`, `[margin, profit margin, gross margin]`, `[url encode, percent encode, urlencode]`.
- `reserved-slugs.yaml`: `app, api, for, learn, tools, pricing, about, privacy, disclaimer, security, embed, search, assets, workflows, compare, changelog, 404`.

---

## 9. Schemas (`schemas/src`)

Define with Zod 4, export TypeScript types, and generate JSON Schema into `generated/schemas/` (also add `# yaml-language-server: $schema=` comments in the YAML files so editors validate).

| Schema | Validates | Key rules |
|---|---|---|
| `site-config` | `site.config.yaml` | URLs absolute; `minToolsPerCategory` ≥ 1 |
| `taxonomy` | categories, professions, tags, synonyms, reserved slugs | Unique ids/slugs; SEO title 30–60 chars; description 120–160 chars |
| `preset` | `presets/**/*.yaml` | Fields as in plan §8; `id` matches file path; `extends` same engine, depth ≤ 3, no cycles; keyed maps (not arrays) for `fields`, `outputs`, `userOptions`, `samples`; `strings.en` covers every `labelKey`/`titleKey` |
| `manifest` | `tools/*/manifest.yaml` | Phase 1 subset (plan §8), strict (unknown keys fail); `slug` = `id` = folder name; T4 requires `variantOf`; T1/T2 require `quality` |
| `content` | `tools/*/content.md` front matter + headings | Required sections per tier (T1/T2: How to use, Method, Worked example, FAQ, References; T3/T4: How to use, FAQ); FAQ items are `###` headings |
| `fixture` | engine and tool fixtures | `id` matches file name; `source.type` ∈ textbook, standard, hand-verified, regression, synthetic; `expected` or `expectedError` |

**Phase 1 additive preset fields** (compatible with the blueprint spec): `fields.*.options`, `fields.*.allowCustom`, `fields.*.currency`, `fields.*.control` (`segmented` \| `select`, for enum fields), `fields.*.visibleWhen` (map of another field or option → allowed values), `userOptions.*.control` (`segmented` \| `select` \| `switch`) and `userOptions.*.values` (allowed values with label keys).

**Inputs vs options:** values the user *calculates with* (amount, rate, add/remove, supply type, what to solve for) are operation **inputs** and appear under `fields`. Settings that change *how* the operation behaves (indent, variant, direction, mode of encoding) are operation **params** and appear under `userOptions`.

**Cross-file rules (in `scripts/validate`):** slug uniqueness across tools, categories and reserved slugs; manifest `preset` exists and is not abstract; `archetype` ∈ preset `ui.archetypes`; `sample` exists; `graph.related` ids exist; fixture counts meet tier minimum (T1 3, T2 2, T3/T4 1); every sample runs without error through its operation.

---

## 10. Core contract (`packages/core`)

| Export | Shape |
|---|---|
| `OperationDescriptor<I, P, O>` | `id`, `major`, `title`, `summary`, `input` (Zod), `params` (Zod), `output` (Zod), `errors` (string codes), `runtimes` (`worker` \| `node`)[], `cost` `{ weight: 'light' \| 'medium' \| 'heavy' }`, `exposure: 'internal'`, `dataClass`, `run(input, params, ctx)` |
| `Result<T>` | `{ ok: true, value: T, warnings: OpWarning[] }` or `{ ok: false, error: OpError }` |
| `OpError` / `OpWarning` | `code`, `path?`, `messageKey`, `details?` (numbers, booleans, short enums only) |
| `OperationContext` | `clock(): number` (ms), `random(bytes: number): Uint8Array`, `signal: AbortSignal`, `log(code, details?)` |
| IR types | `WorkingStep` `{ ref, formulaKey, variables: Record<string,string>, result: string, noteKey? }` · `Check` `{ id, labelKey, status, expected?, actual?, explanationKey? }` |
| `canonicalHash(value)` | SHA-256 of canonical JSON (sorted keys, no whitespace) — used by determinism tests |
| `createTestContext({ now, seed })` | Deterministic context for fixtures |

Engines never throw for user input; thrown exceptions are treated as bugs and surface as `INTERNAL_ERROR`.

---

## 11. Engines

Each engine follows the blueprint §3.5 layout: `AGENTS.md`, `README.md`, `package.json`, `tsconfig.json` (lib `ES2023` only, no DOM), `src/index.ts`, `src/errors.ts`, `src/operations/<name>/{operation.ts, schema.ts, run.ts, README.md, fixtures/}`. The few cross-runtime globals engines may use (`TextEncoder`, `TextDecoder`, `crypto.subtle.digest`) are declared in `packages/core/src/platform-globals.d.ts`, which engines include; nothing else from the browser is typed for them.

### 11.1 `engines/numeric` (library engine, no operations)

Functions: `parseDecimal(text, { maxDecimals })` (rejects exponents, commas, spaces; returns error code), `add`, `sub`, `mul`, `div(a, b, scale = 20)`, `round(value, decimals, 'half-up' | 'half-even')`, `compare`, `isZero`, `toFixedString(value, decimals)`.
- **half-up = half away from zero** (commercial rounding): `2.345 → 2.35`, `-2.345 → -2.35`.
- Values cross the boundary as **decimal strings**; `big.js` objects never leave this package.
- Tests: `0.1 + 0.2 = 0.3`; rounding table (2.344, 2.345, 2.355, −2.345, 0.005, 0.004); division `1 / 3` at scale 20; `parseDecimal` rejects `1e3`, `1,000`, `""`, `"."`, `"-"`.

### 11.2 `engines/data`

#### `data.json.format@1`

| | |
|---|---|
| Input | `{ text: string }` |
| Params | `action: 'format' \| 'minify' \| 'validate'` (default `format`) · `indent: '2' \| '4' \| 'tab'` (default `'2'`) · `sortKeys: boolean` (default `false`) |
| Output | `{ text: string, valid: true, stats: { inputBytes, outputBytes, maxDepth, objectCount, arrayCount } }` |
| Errors | `DATA_JSON_EMPTY` · `DATA_JSON_SYNTAX_ERROR` (details: `line`, `column`, `offset`, `expected` enum) · `DATA_INPUT_TOO_LARGE` (> 50 MB) |
| Warnings | `DATA_JSON_DUPLICATE_KEY` (details: line, column) · `DATA_JSON_BOM_REMOVED` |

Requirements:
- **Lossless.** Implement a tokenizer + printer following RFC 8259. **Do not use `JSON.parse`/`JSON.stringify` for formatting.** Number literals and string escapes are copied exactly as written (`12345678901234567890`, `1.0e+10`, `"é"` stay unchanged).
- Any JSON value is valid at top level (RFC 8259).
- `sortKeys` sorts object members by key code points, recursively, stable; duplicate keys keep their relative order.
- Line/column are 1-based; tabs count as one column.
- Performance: 5 MB input formats in under 1 second on a mid-range laptop (measure in a Vitest benchmark; report the number).

Fixtures (engine level, `source.type: standard` citing RFC 8259 where relevant):

| id | Case | Expected |
|---|---|---|
| 001-nested-indent-2 | `{"a":1,"b":[true,null,{"c":"x"}]}` | 2-space formatted output (exact text in fixture) |
| 002-big-numbers-preserved | `{"id":12345678901234567890,"v":1.0e+10}` | Numbers unchanged in output |
| 003-minify | Formatted multi-line input | Single-line output without insignificant whitespace |
| 004-escapes-preserved | `{"name":"Café"}` | `é` unchanged |
| 005-trailing-comma-error | `{"a":1,}` | `DATA_JSON_SYNTAX_ERROR` at line 1, column 8 |
| 006-sort-keys | `{"b":1,"a":{"d":1,"c":2}}` with `sortKeys: true` | Keys ordered a, b and c, d |
| 007-duplicate-key-warning | `{"a":1,"a":2}` | Valid; warning with line/column |
| 008-top-level-string | `"text"` | Valid |

#### `data.base64.transform@1`

| | |
|---|---|
| Input | `{ text: string }` |
| Params | `direction: 'encode' \| 'decode'` · `variant: 'standard' \| 'url-safe'` (decode also accepts `'auto'`, default for decode) · `padding: boolean` (encode; default `true`) · `lineLength: 0 \| 76` (encode; default `0`) |
| Output | `{ text: string, byteLength: number, isUtf8: boolean, hexPreview?: string }` |
| Errors | `DATA_BASE64_INVALID_CHARACTER` (details: offset) · `DATA_BASE64_INVALID_LENGTH` · `DATA_INPUT_TOO_LARGE` |
| Warnings | `DATA_BASE64_NOT_UTF8` (decoded bytes are not valid UTF-8; output `text` empty and `hexPreview` holds the first 64 bytes as hex) |

Rules: text ⇄ bytes via UTF-8 (`TextEncoder`/`TextDecoder` with `fatal: true` — both are allowed in engines); decode ignores ASCII whitespace; implement the codec yourself (RFC 4648) — no `btoa`/`atob`.

Fixtures: RFC 4648 §10 vectors (`""`, `f → Zg==`, `fo → Zm8=`, `foo → Zm9v`, `foob → Zm9vYg==`, `fooba → Zm9vYmE=`, `foobar → Zm9vYmFy`) · `₹ → 4oK5` · bytes `FB FF` as URL-safe without padding → `-_8` · decode `Zm9v YmFy` (with space) → `foobar` · decode `Zm9v!` → invalid character at offset 4 · decode of `/w==` → not UTF-8 warning with hexPreview `ff`.

#### `data.url.transform@1`

| | |
|---|---|
| Input | `{ text: string }` |
| Params | `direction: 'encode' \| 'decode'` · `mode: 'component' \| 'full-url' \| 'form'` (default `component`) |
| Output | `{ text: string, changedCount: number }` |
| Errors | `DATA_URL_MALFORMED_ESCAPE` (details: offset) · `DATA_URL_INVALID_UTF8` · `DATA_INPUT_TOO_LARGE` |

Rules (implement explicitly; do not rely on `encodeURIComponent` quirks):
- `component`: percent-encode every byte of the UTF-8 encoding except RFC 3986 unreserved characters `A–Z a–z 0–9 - . _ ~`. Hex digits uppercase.
- `full-url`: additionally keep reserved characters `: / ? # [ ] @ ! $ & ' ( ) * + , ; =` and existing valid `%XX` sequences.
- `form`: like `component`, but space → `+` (application/x-www-form-urlencoded); decoding turns `+` into space.

Fixtures: `a b&c=d/é` → component `a%20b%26c%3Dd%2F%C3%A9` · form `a+b%26c%3Dd%2F%C3%A9` · full-url `https://example.com/a b?q=é` → `https://example.com/a%20b?q=%C3%A9` · `!'()*` component → `%21%27%28%29%2A` · decode `%E2%82%B9` → `₹` · decode `%ZZ` → malformed escape at offset 0 · decode `%E2%82` → invalid UTF-8.

### 11.3 `engines/estimate`

#### `estimate.tax.gst@1`

| | |
|---|---|
| Input | `{ amount: decimal string (≥ 0, ≤ 2 decimals), rate: decimal string or number (0–100, ≤ 4 decimals), mode: 'add' \| 'remove', supply: 'intra' \| 'inter' }` |
| Params | `rounding: { mode: 'half-up', decimals: 2 }` · `splitMethod: 'per-component'` |
| Output | `{ taxableValue, cgst, sgst, igst, totalTax, grossAmount, effectiveRate }` (decimal strings, 2 dp; `effectiveRate` 4 dp) + `working: WorkingStep[]` |
| Errors | `ESTIMATE_INVALID_NUMBER` · `ESTIMATE_NEGATIVE_AMOUNT` · `ESTIMATE_TOO_MANY_DECIMALS` · `ESTIMATE_GST_RATE_OUT_OF_RANGE` |

Formulas (R = round to 2 dp, half-up):
- **Add GST:** `taxable = amount`. Intra: `cgst = R(taxable × rate/2 ÷ 100)`, `sgst = cgst`, `igst = 0`. Inter: `igst = R(taxable × rate ÷ 100)`. `totalTax = cgst + sgst + igst`; `gross = taxable + totalTax`.
- **Remove GST:** `gross = amount`; `taxable = R(gross × 100 ÷ (100 + rate))`; `totalTax = gross − taxable`. Intra: `cgst = R(totalTax ÷ 2)`, `sgst = totalTax − cgst` (may differ by ₹0.01). Inter: `igst = totalTax`.
- `effectiveRate = totalTax ÷ taxable × 100` (4 dp; `0` when taxable is 0).
- Working steps record each line with the actual numbers.

Fixtures (hand-verified; values exact):

| id | Input | Expected |
|---|---|---|
| 001-add-18-intra | 1000.00, 18, add, intra | taxable 1000.00 · CGST 90.00 · SGST 90.00 · IGST 0.00 · total 180.00 · gross 1180.00 |
| 002-add-18-inter | 1000.00, 18, add, inter | IGST 180.00 · total 180.00 · gross 1180.00 |
| 003-remove-18-intra | 1180.00, 18, remove, intra | taxable 1000.00 · total 180.00 · CGST 90.00 · SGST 90.00 |
| 004-add-5-rounding | 999.99, 5, add, intra | CGST 25.00 · SGST 25.00 · total 50.00 · gross 1049.99 |
| 005-remove-18-odd-paisa | 100.00, 18, remove, intra | taxable 84.75 · total 15.25 · CGST 7.63 · SGST 7.62 · gross 100.00 |
| 006-add-0.25-inter | 250.00, 0.25, add, inter | IGST 0.63 · gross 250.63 |
| 007-add-3-intra | 10000.00, 3, add, intra | CGST 150.00 · SGST 150.00 · gross 10300.00 |
| 008-zero-amount | 0.00, 18, add, intra | all 0.00 |
| 009-rate-out-of-range | 100.00, 101, add, intra | `ESTIMATE_GST_RATE_OUT_OF_RANGE` |
| 010-negative-amount | -5, 18, add, intra | `ESTIMATE_NEGATIVE_AMOUNT` |

#### `estimate.pricing.margin@1`

| | |
|---|---|
| Input | `{ solve, cost?, price?, marginPercent?, markupPercent? }` — `solve` ∈ `from-cost-and-price`, `price-from-cost-and-margin`, `cost-from-price-and-margin`, `price-from-cost-and-markup`, `cost-from-price-and-markup` |
| Params | money rounding 2 dp half-up; percent rounding 2 dp half-up |
| Output | `{ cost, price, profit, marginPercent, markupPercent \| null }` + `working` |
| Errors | `ESTIMATE_INVALID_NUMBER` · `ESTIMATE_NEGATIVE_VALUE` · `ESTIMATE_PRICE_ZERO` · `ESTIMATE_MARGIN_OUT_OF_RANGE` (margin ≥ 100 when solving for price) · `ESTIMATE_MISSING_INPUT` |
| Warnings | `ESTIMATE_MARKUP_UNDEFINED` (cost is 0) |

Formulas: `profit = price − cost`; `margin% = profit ÷ price × 100`; `markup% = profit ÷ cost × 100`; `price = cost ÷ (1 − m/100)`; `cost = price × (1 − m/100)`; `price = cost × (1 + k/100)`; `cost = price ÷ (1 + k/100)`. **After solving, round the money values first, then compute profit and both percentages from the rounded values** so every displayed number reconciles. Losses (price < cost) are valid and give negative percentages.

Fixtures:

| id | Input | Expected |
|---|---|---|
| 001-cost-and-price | cost 80, price 100 | profit 20.00 · margin 20.00 · markup 25.00 |
| 002-price-from-margin | cost 80, margin 20 | price 100.00 · profit 20.00 · markup 25.00 |
| 003-cost-from-margin | price 100, margin 20 | cost 80.00 · profit 20.00 |
| 004-loss | cost 100, price 80 | profit −20.00 · margin −25.00 · markup −20.00 |
| 005-price-from-margin-30 | cost 70, margin 30 | price 100.00 |
| 006-rounding-reconciles | cost 1, margin 33.33 | price 1.50 · profit 0.50 · margin 33.33 · markup 50.00 |
| 007-price-from-markup | cost 200, markup 25 | price 250.00 · margin 20.00 |
| 008-margin-100-error | cost 50, margin 100 | `ESTIMATE_MARGIN_OUT_OF_RANGE` |
| 009-zero-price-error | cost 10, price 0 | `ESTIMATE_PRICE_ZERO` |

### 11.4 `engines/search`

- `search.index.build@1` (runs in Node at build time): documents `{ id, kind: 'tool', name, shortName, summary, synonyms, categoryName, tags }` → serialized MiniSearch index. Field boosts: name 3, synonyms 2, shortName 2, summary 1; prefix search on; fuzzy 0.2.
- `search.query@1`: `{ q, limit }` → `[{ id, score }]`.
- Relevance fixtures (top-1 must match): `json` → json-formatter · `gst` → gst-calculator · `cgst` → gst-calculator · `base 64` → base64-encode-decode · `percent encode` → url-encode-decode · `margin` → profit-margin-calculator · `jsn formatter` (typo) → json-formatter.

---

## 12. Runtime (`packages/runtime`)

| Module | Specification |
|---|---|
| `worker-host` | One module worker per engine, created on first use via `new Worker(new URL(…), { type: 'module' })`. Messages: `{ id, type: 'run', operationId, input, params }` → `{ id, ok: true, value, warnings }` or `{ id, ok: false, error }`; `{ id, type: 'abort' }`. Engine modules are loaded in the worker through `generated/engine-loaders.ts` (a generated map from engine id to dynamic import) |
| `context` | Production `OperationContext`: `clock` = current time, `random` = Web Crypto random bytes, abort signal per request |
| `tool-state` | Small store per tool island: `idle → editing → running → result \| error`; live compute debounced 150 ms; a new input aborts the in-flight run |
| `preferences` | `theme` (`light` \| `dark` \| `system`) and `recentTools` (max 6 ids) in `localStorage`, every access wrapped in try/catch with in-memory fallback |
| `analytics` | `track(event, props)` validates against a catalogue — `page_view {template}`, `tool_view {toolId}`, `tool_run {toolId}`, `tool_complete {toolId, method: copy \| download \| print}`, `sample_load {toolId}`, `search_query {resultCount}`, `theme_change {theme}` — props are enums/numbers/ids only. Development: `console.debug`. Production: no-op. **No network calls** |
| `search` | Loads the generated index and calls `search.query` on the main thread (it is light) |

---

## 13. Registry pipeline (`scripts/`)

`pnpm gen` runs, in order: schema build → taxonomy validation → preset resolution (single-level and multi-level `extends`, deep merge of keyed maps, arrays replaced, `visible: false` hides) → manifest validation → content parsing (remark: sections, FAQ items, HTML) → fixture validation → sample execution through the real operations → writes:

| Output | Used by |
|---|---|
| `generated/registry.json` | Tools (manifest + resolved preset + content HTML + FAQ + worked example rows), categories with visible counts, home config |
| `generated/presets/<id>.json` | Islands (resolved presets) |
| `generated/search-index.json` | Search |
| `generated/engine-loaders.ts` | Runtime worker |
| `generated/schemas/*.json` | Editors |

Validation errors print file, path and a fix hint, and exit non-zero.

`scripts/new/tool.ts` scaffolds `tools/<slug>/` with a manifest skeleton (all required fields present, SEO text left as clear instructions that fail validation until written), `content.md` with the required headings for the tier, and one fixture file.

---

## 14. Design system and components (`packages/ui`)

### 14.1 Tokens (`src/tokens/tokens.css`)

Implement exactly the values in plan §13 as CSS custom properties, with dark values under `@media (prefers-color-scheme: dark)` for `:root:not([data-theme="light"])` and under `:root[data-theme="dark"]`. Token names: `--color-bg`, `--color-surface-subtle`, `--color-border`, `--color-border-input`, `--color-text`, `--color-text-muted`, `--color-text-subtle`, `--color-accent`, `--color-on-accent`, `--color-accent-text`, `--color-focus`, `--color-success`, `--color-warning`, `--color-danger`, `--color-info`; `--font-sans`, `--font-mono`; `--text-*` (display, h1, h2, h3, body, ui, caption with line-heights); `--space-1…--space-24` (4 px steps as listed); `--radius-sm/md/lg/xl` (4/6/8/12); `--shadow-popover`, `--shadow-dialog`; `--duration-fast` 120 ms, `--duration-base` 200 ms; breakpoints documented as comments (640/768/1024/1280).

Global CSS: `body` background and text from tokens; `font-variant-numeric: tabular-nums` on numeric outputs and inputs; `:focus-visible` uses a 2 px `--color-focus` outline with 2 px offset; reduced-motion media query disables transitions.

Brand assets: `assets/brand/logo.svg` — a rounded square in `--color-accent` with a dark "M", followed by the wordmark "MangoTools" in Inter 600; `favicon.svg` = the square mark. `assets/og/default.png` (1200 × 630): wordmark + tagline on white, generated once from `assets/og/default.svg` with a small script and committed.

### 14.2 Components to build (all accessible, light/dark, with a demo page at `/_dev/components`, built only in development)

| Group | Components |
|---|---|
| Primitives | Button (primary = mango fill, secondary = border, ghost; sizes sm/md/lg; loading state) · IconButton (requires label) · Input · Textarea (mono option) · NumberField (decimal text input, `inputmode="decimal"`, prefix/suffix e.g. ₹ and %) · Select · SegmentedControl (radio group semantics, arrow-key navigation) · Switch · Badge · Kbd · Toast (polite live region) · InlineAlert (info/success/warning/danger with icon) |
| Layout | SiteHeader (logo, "Tools" link with category menu built from visible categories, theme toggle) · SiteFooter (visible categories, existing pages only, "A MangoPie product") · PageContainer · Breadcrumbs · SkipLink · ThemeToggle |
| Discovery | SearchBox (combobox pattern: input + listbox, `aria-activedescendant`, Enter opens tool) · ToolCard · CategoryCard (icon, name, summary, count) · CategoryChips (filter) · RecentTools |
| Tool kit | ToolHeader · PrivacyBadge ("Runs on your device") · ActionBar (Copy, Download, Print, Reset; each only if meaningful for the archetype) · ResultPanel · WorkingSteps (collapsible "Show calculation") · ErrorMessage (with "Go to line 3, column 14" that moves the caret) · ContentSections · FAQ (`<details>`/`<summary>`) · RelatedTools · Disclaimer |
| Archetype A | TransformLayout: options bar from `userOptions`; input pane (mono textarea, Paste, Clear, Open text file ≤ 50 MB read locally, character and byte count); output pane (read-only, Copy, Download); status line (valid / error); **Swap** button shown when the preset has a `direction` user option (moves output to input and flips direction). Side-by-side ≥ 1024 px, stacked below |
| Archetype B | CalculatorLayout: fields from `fields` in `order` (enum fields with `control: segmented` render as segmented controls; respect `visibleWhen`), `userOptions` above the fields, results card with the `primary` output large, others as a definition list, WorkingSteps below; money formatted in the UI with Indian digit grouping for INR (₹1,18,000.00); inputs validate as the user types with inline messages |

Disclaimer text:
- `professional` (T1/T2): "Results are provided for guidance. Check them against the applicable rules and your professional judgement before relying on them."
- `standard` (T3): not shown in Phase 1.

---

## 15. Pages (`apps/web`)

### 15.1 Home — `/`

| Section | Content |
|---|---|
| Hero | H1 **"Professional tools. Zero uploads."** · subtitle "Free calculators, converters and document tools for engineers, businesses and developers. Everything runs on your device — no sign-up, no ads." · SearchBox (placeholder "Search tools — try “GST” or “JSON”") · popular chips from `home.popular` (only tools that exist) |
| Continue | RecentTools, rendered only when the visitor has recent tools stored locally |
| Browse by category | CategoryCards for visible categories, with tool counts |
| Built for professional work | Tools from `home.featuredProfessional`; subtitle "Every result shows its working, so you can check it." |
| Processed on your device | "Your files and numbers are processed in your browser. Nothing is uploaded to our servers." with three points: No uploads · No sign-up · No ads or trackers |

### 15.2 All tools — `/tools`

H1 "All tools", SearchBox, CategoryChips (All + visible categories), tool cards grouped by category (filtering is client-side; the full list is present in the HTML for SEO).

### 15.3 Category — `/{category}`

Breadcrumb · H1 category name · tool count · summary · "Start here" (first 3 tools by manifest order) · all tools grid · "About these tools" (2–3 paragraphs you write for developer and business) · FAQ from taxonomy.

### 15.4 Tool page — `/{tool-slug}`

Exactly the template in plan §11: breadcrumb, H1, summary, PrivacyBadge, "Try sample", the archetype island, ActionBar, Disclaimer (T1/T2), then content sections (How to use, Method, Worked example table from the fixture named in front matter, FAQ, Related tools, References). On view, add the tool to recent tools and send `tool_view`.

### 15.5 404

"Page not found", SearchBox, popular tools.

### 15.6 SEO and headers

| Item | Rule |
|---|---|
| `<title>` | Tools: `seo.title` + " | MangoTools" only if total ≤ 60 characters, otherwise `seo.title` alone. Categories: taxonomy SEO title. Home: "MangoTools — Professional Tools That Run in Your Browser" |
| Meta description | From manifest/taxonomy; home: "Free professional tools that run in your browser: GST and margin calculators, JSON formatter, Base64 and URL encoding. No uploads, no sign-up, no ads." |
| Canonical | Absolute URL from the environment's `url`, no trailing slash |
| Open Graph / Twitter | title, description, url, `assets/og/default.png` |
| JSON-LD | Home: `Organization` + `WebSite`. Category: `BreadcrumbList` + `ItemList`. Tool: `WebApplication` (`applicationCategory` from category, `operatingSystem: "Any (web browser)"`, `offers` price 0 INR), `BreadcrumbList`, `FAQPage` from the FAQ section |
| Sitemap | `sitemap-index.xml` + `sitemap-pages.xml` containing only indexable pages (home, `/tools`, visible categories, tools with status beta/stable). Not generated when the environment is not indexable |
| robots.txt | Production: allow all + sitemap URL. Other environments: `Disallow: /` |
| `_headers` | `Content-Security-Policy: default-src 'self'; script-src 'self' <hashes>; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'` · `X-Content-Type-Options: nosniff` · `Referrer-Policy: strict-origin-when-cross-origin` · `Permissions-Policy: camera=(), microphone=(), geolocation=()` · `X-Robots-Tag: noindex` outside production |
| Inline scripts | Use Astro's built-in CSP support if the installed version provides it; otherwise a post-build script computes SHA-256 hashes of every inline `<script>` in `dist` and writes them into `script-src`. Report which approach was used |
| Post-build checks | Every HTML page: one `<h1>`; title length ≤ 60 and description 120–160 (home, categories, tools); canonical present and absolute; JSON-LD parses; no `http(s)://` references to hosts other than the site's own URL, `schema.org` context strings and `w3.org` namespaces; sitemap URLs = indexable pages exactly |

---

## 16. The five tools

For each tool create `tools/<slug>/manifest.yaml`, `content.md` and fixtures, plus the preset. Follow plan §8 for format. `version: 0.1.0`, `status: beta`, `privacy: { dataClass: public, network: none }`.

### 16.1 JSON Formatter & Validator — `json-formatter`

- Preset `data/json.format`: userOptions `action` (segmented: Format · Minify · Validate), `indent` (select: 2 spaces · 4 spaces · Tab), `sortKeys` (switch "Sort keys"). Sample: a small nested object with a big integer.
- SEO: title "JSON Formatter & Validator – Beautify and Minify JSON" · primary keyword "json formatter" · description of 120–160 characters mentioning validate, beautify, minify, big numbers preserved, runs in browser.
- Synonyms: json beautifier, json validator, json pretty print, json minify, format json online.
- Content: How to use (4 steps) · FAQ: "Does this change my numbers?", "Is my JSON uploaded anywhere?", "What is the difference between Format and Minify?", "Why is my JSON invalid?" · References: RFC 8259.
- Tool fixture: 001 (sample input → formatted output).

### 16.2 Base64 Encode & Decode — `base64-encode-decode`

- Preset `data/base64`: userOptions `direction` (Encode · Decode), `variant` (Standard · URL-safe; plus Auto for decode), `padding` (switch, encode only), `lineLength` (select: none · 76 for MIME). Swap button active.
- SEO primary keyword "base64 encode decode"; synonyms: base64 encoder, base64 decoder, b64, base64 converter.
- FAQ: "Is Base64 encryption?" (no — anyone can decode it), "What is URL-safe Base64?", "Why does my decoded text show as unreadable?" · References: RFC 4648.
- Tool fixture: `Hello, ₹` round-trip.

### 16.3 URL Encode & Decode — `url-encode-decode`

- Preset `data/url`: userOptions `direction`, `mode` (Component · Full URL · Form). Swap active.
- SEO primary keyword "url encode decode"; synonyms: url encoder, url decoder, percent encoding, urlencode, encode uri component.
- FAQ: "When should I encode a component vs a full URL?", "Why do spaces become %20 or +?", "Why does decoding fail?" · References: RFC 3986; WHATWG URL Standard (application/x-www-form-urlencoded).
- Tool fixture: query value with spaces and non-ASCII characters.

### 16.4 GST Calculator — `gst-calculator`

- Manifest and preset exactly as in plan §8 (tier T2, archetype B).
- UI (all are `fields`, i.e. operation inputs): mode segmented (Add GST · Remove GST), supply segmented (Intra-state: CGST + SGST · Inter-state: IGST), amount (₹), rate (select 0 %, 0.25 %, 3 %, 5 %, 18 %, 40 %, Custom → number field). Results: primary "Amount including GST" (add) or "Taxable value" (remove) — set `primary` per mode via two outputs visible by `visibleWhen`; show CGST/SGST only for intra, IGST only for inter; working steps.
- Content (T2 — all five sections):
  - How to use (4 steps).
  - Method: the formulas from §11.3, including the rounding rule and why CGST and SGST can differ by ₹0.01 when removing GST.
  - Worked example: fixture 001 (table injected).
  - FAQ: "What GST rates can I choose?" (explain the structure effective 22 September 2025 — main slabs 5 % and 18 %, 40 % for specified goods, special rates such as 0.25 % and 3 % — and that the correct rate for an item must be checked in the official rate notifications), "What is the difference between CGST + SGST and IGST?", "How do I remove GST from a price that already includes it?", "Why can CGST and SGST differ by one paisa?", "Is this tax advice?" (no).
  - References: Central Board of Indirect Taxes and Customs — GST rates (cbic-gst.gov.in); Central Goods and Services Tax Act, 2017; Integrated Goods and Services Tax Act, 2017.
- Tool fixtures: 001 (add 18 % intra) and 005 (remove 18 % with the odd paisa).

### 16.5 Profit Margin Calculator — `profit-margin-calculator`

- Preset `estimate/pricing.margin`: field `solve` (enum, `control: segmented`: Margin from cost & price · Price from cost & margin · Cost from price & margin) — the markup modes are reserved for the Markup Calculator preset in TASK-002. Fields `cost`, `price`, `marginPercent` with `visibleWhen` on `solve`. Outputs: profit, margin %, markup %, and the solved value as primary.
- SEO primary keyword "profit margin calculator"; synonyms: margin calculator, gross margin calculator, selling price from margin, margin vs markup.
- Content (T2): How to use · Method (formulas and the "round money first, then percentages" rule) · Worked example (fixture 001) · FAQ: "What is the difference between margin and markup?", "Why can't the margin be 100 % or more?", "What does a negative margin mean?", "Does this include GST?" (no — link to GST Calculator) · References: "Standard definitions: margin = profit ÷ selling price; markup = profit ÷ cost."
- Tool fixtures: 001 and 006.

---

## 17. Tests

| Suite | Location | Must cover |
|---|---|---|
| Engine unit + fixtures | `engines/*/src/**` (Vitest) | Every fixture in §11; numeric rounding table; JSON 5 MB benchmark |
| Pipeline | `scripts/**/*.test.ts` | Valid and invalid examples for every schema; preset `extends` merge (including `visible: false`); slug collision; category threshold; sample execution failure is reported |
| Tool fixtures | Generated Vitest suite over `tools/*/fixtures` | All five tools |
| Determinism | `tests/determinism` (Playwright) | Run every engine fixture in Chromium, Firefox and WebKit (through a test page that loads the engines) and in Node; `canonicalHash` of each output must be identical everywhere |
| End-to-end | `tests/e2e` | Home → search "gst" → GST page; home category card → category → tool; each tool: Try sample → expected result text; typing updates live; JSON error shows line/column and "Go to" moves the caret; Swap on Base64 and URL; Copy puts the result on the clipboard; theme toggle persists after reload; recent tools appear on home after visiting a tool; 404 page |
| Accessibility | `tests/a11y` | axe (no serious/critical violations) on home, `/tools`, both categories, all five tools, in light and dark, in empty and result states; keyboard-only completion of each tool |
| Privacy | `tests/e2e/network.spec.ts` | Record every request while loading and using each tool: only same-origin GET requests for static assets; no request bodies; no third-party hosts |
| SEO | `tests/seo` | Runs against `dist`: the post-build checks in §15.6 plus sitemap content |
| Visual smoke | `tests/e2e/screenshots.spec.ts` | Screenshots at 360 × 800 and 1366 × 768 for home, one category and each tool, saved to `tests/artifacts/` for the report |

---

## 18. CI (`.github/workflows/ci.yml`)

Trigger: push and pull request. Ubuntu, Node 24, pnpm with cache. Steps: `pnpm install --frozen-lockfile` → `pnpm verify` → `pnpm build` → `pnpm exec playwright install --with-deps chromium firefox webkit` → `pnpm test:e2e` → upload Playwright report and screenshots as artifacts on failure. Target duration ≤ 12 minutes.

Also add `.github/PULL_REQUEST_TEMPLATE.md` (the template from blueprint Appendix C.1).

---

## 19. Step order and commits

TASK-001 is the bootstrap, so it touches several lanes. **Keep one lane per commit.**

| Step | Work | Commit message |
|---|---|---|
| 0 | Housekeeping (§3) | `chore: move prototype to legacy and docs to docs/architecture` |
| 1 | Workspace, tooling, `site.config.yaml` | `chore(platform): scaffold pnpm workspace and tooling` |
| 2 | `AGENTS.md` (blueprint Appendix A, with a "Phase 1" note listing deferred folders), `CLAUDE.md` (`@AGENTS.md`), `docs/playbooks/add-tool.md`, `docs/glossary.md` | `docs: add agent rules, playbook and glossary` |
| 3 | `packages/core`, `schemas` | `feat(platform): add operation contract and schemas` |
| 4 | `engines/numeric` | `feat(engine-numeric): add decimal arithmetic` |
| 5 | `engines/data` | `feat(engine-data): add json format, base64 and url transforms` |
| 6 | `engines/estimate` | `feat(engine-estimate): add gst and margin operations` |
| 7 | `engines/search` | `feat(engine-search): add index build and query` |
| 8 | Taxonomy, presets, 5 tool folders, registry pipeline, scaffolder | `feat(tools): add first five tools and registry pipeline` |
| 9 | `packages/runtime` | `feat(platform): add runtime worker host and preferences` |
| 10 | Tokens, fonts, brand assets, primitives, layout | `feat(ui): add design tokens, primitives and layout` |
| 11 | Tool kit, archetypes A and B | `feat(ui): add tool kit and archetypes A and B` |
| 12 | Astro pages, SEO outputs, headers | `feat(web): add home, tools, category and tool pages` |
| 13 | Tests and CI | `test: add e2e, a11y, determinism, privacy and seo suites` |
| 14 | Fixes, screenshots, report | `docs: add TASK-001 report` |

**Stop and ask (write the question in the report and stop that step) if:** a fixture seems wrong; a new dependency beyond §4 seems necessary; the CSP cannot be made to work without `unsafe-inline` for scripts; any requirement here conflicts with another.

---

## 20. Acceptance checklist

**Foundation**
- [ ] Prototype moved to `legacy/prototype/`; architecture docs in `docs/architecture/`
- [ ] `pnpm verify`, `pnpm build`, `pnpm test:e2e` pass on a clean clone (Windows and Linux)
- [ ] CI green
- [ ] `AGENTS.md`, `CLAUDE.md`, playbook and glossary present
- [ ] No folders from §2's "do not create" list exist

**Engines**
- [ ] All fixtures in §11 pass; numeric rounding table passes
- [ ] Architecture checks pass (no forbidden APIs in engines, no `big.js` outside numeric)
- [ ] Determinism suite: identical hashes in Node, Chromium, Firefox, WebKit
- [ ] JSON formatter preserves big numbers and escapes exactly; 5 MB benchmark reported

**Registry**
- [ ] Invalid manifest, preset, content or fixture fails `pnpm gen` with file and path in the message
- [ ] `pnpm new:tool` output fails validation only on the SEO/content text left for the author

**Design system**
- [ ] Tokens match plan §13 exactly, light and dark
- [ ] `/_dev/components` shows every component in every state and is built only when `MANGOTOOLS_ENV=development`
- [ ] Focus visible on every interactive element; reduced motion respected
- [ ] Fonts and icons are served from the site itself

**Pages**
- [ ] Home, `/tools`, `/developer`, `/business`, 5 tool pages, 404 render correctly at 360, 768, 1366 and 1920 px
- [ ] Search finds all five tools by name and by a synonym; typo "jsn formatter" works
- [ ] Recent tools appear on home after visiting a tool; theme persists
- [ ] Footer and header contain no links to pages that don't exist

**Tools**
- [ ] Each tool's "Try sample" gives the fixture result; live updates work
- [ ] GST add/remove, intra/inter and custom rate all work; ₹ amounts use Indian digit grouping
- [ ] Profit margin handles all three solve modes and the loss case
- [ ] Base64 and URL swap works; JSON error "Go to" moves the caret
- [ ] Working steps shown for GST and Profit Margin
- [ ] Disclaimer shown on GST and Profit Margin

**SEO, privacy, performance**
- [ ] Post-build SEO checks pass; JSON-LD present per page type; sitemap only in production builds
- [ ] Network test: no third-party requests, no request bodies
- [ ] `_headers` present with CSP; the site works under it (no CSP console errors)
- [ ] Tool page island + runtime JS ≤ 60 KB compressed (excluding the worker chunk); home JS ≤ 30 KB compressed
- [ ] Local Lighthouse (mobile) on home and `/gst-calculator`: Performance ≥ 90, Accessibility 100, SEO 100 (scores in the report)

---

## 21. Report — `tasks/TASK-001-REPORT.md`

Write this file at the end, containing:

1. Summary of what was built (one paragraph).
2. Checklist from §20 with ✅/❌ for every line; for ❌, what is missing and why.
3. Command outputs (summaries) for `pnpm verify`, `pnpm build`, `pnpm test:e2e`.
4. JSON formatter 5 MB benchmark time; bundle sizes; Lighthouse scores.
5. CSP approach used for inline scripts.
6. Screenshots list (paths in `tests/artifacts/`).
7. Deviations from this task, each with the reason.
8. Open questions for the founder.
9. Suggested adjustments for TASK-002.
