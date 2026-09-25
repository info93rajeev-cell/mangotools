# MangoTools — Repository & AI Development Blueprint v1.0

**Prepared for:** Rajeev (MangoPie) · **Date:** 25 September 2026
**Roles:** Technical Product Owner · Software Architect · Repository Planner · AI Coding Workflow Designer
**Depends on:** `docs/architecture/product-architecture.md` (frozen). This blueprint does not change the product; where the frozen architecture has technical gaps, they are listed in §13 *Technical Risks* with the smallest fix.
**Contains no application code.** File names, data formats, rules, templates and checklists only.

---

## 0. The blueprint on one page

### 0.1 The three ways to add a tool

| You want… | You create… | Everything else is automatic |
|---|---|---|
| A new page for behaviour that already exists (e.g. "Height of Instrument Calculator") | **1 tool manifest** (+ content + fixtures) | URL, page, nav, category listing, search, sitemap, JSON-LD, OG image, redirects, related links, changelog, RSS, API/MCP definition |
| A variation of existing behaviour (different defaults, columns, units, samples) | **1 preset** that `extends` an existing preset, then a manifest | Preset resolution, validation, UI fields, import mappings, report columns |
| Genuinely new behaviour (a new formula, file format, detector) | **1 engine operation** (or a new engine) with golden fixtures, then a preset, then a manifest | Registry entry, portable schemas, worker loading, adapter definitions |

### 0.2 The seven laws of this repository

1. **Engines are pure.** No DOM, no network, no clock, no randomness, no knowledge of plans or pricing. Input → output, deterministic.
2. **Data is not code.** Tools, presets, taxonomy and content are YAML/Markdown data, validated by schemas. They never contain formulas or scripts.
3. **One schema source.** Every data shape is defined once (Zod) and generates TypeScript types, JSON Schema (for editors and AI tools) and runtime validation.
4. **Fixtures are truth.** Expected values come from cited sources. Code changes to satisfy fixtures; fixtures never change to satisfy code without human approval.
5. **Only three folders grow with tool count:** `tools/`, `presets/`, `content/`. Everything else grows with *capabilities*. That is what makes 500 tools maintainable.
6. **One task, one lane, one branch, one PR.** An AI agent never edits two engines, or an engine and a tool, in the same change.
7. **Generated means generated.** Nothing in `generated/` is ever edited or committed.

---

## 1. Locked technical decisions

These convert the frozen architecture's Appendix A into exact choices, so no agent ever has to pick a stack.

| Area | Decision | Reason |
|---|---|---|
| Repository | Single monorepo, **pnpm workspaces** (pnpm 10) | One place for AI to read; atomic changes; no publishing overhead |
| Task runner | pnpm scripts only. Add a caching runner only if PR CI exceeds 12 minutes (ADR trigger) | Fewer tools to understand |
| Node | **Node 24 LTS**, pinned via `.node-version` and `package.json#engines` | Current LTS line |
| Language | TypeScript, `strict`, ESM only, no `any`, no default exports | Predictable for AI; catches errors early |
| Schemas | **Zod 4** as the single source → JSON Schema (native export) → TS types | One definition, three uses; JSON Schema feeds editors, MCP and APIs |
| Data files | **YAML 1.2 core schema** for manifests, presets, taxonomy, fixtures; **Markdown** for content | Human- and AI-friendly, supports comments; YAML 1.2 avoids the "NO → false" trap |
| Website | **Astro** (static output) with **Preact** islands via `preact/compat` | Zero JS by default; React-compatible API for AI coding tools |
| Workers | One worker host in `packages/runtime`; engines loaded by dynamic import inside workers; RPC via a tiny message library (Comlink-style, Apache-2.0) | UI never freezes; heavy code loads on demand |
| Lint + format | **Biome** (one tool) | Replaces ESLint + Prettier configs; fast |
| Architecture boundaries | **dependency-cruiser** rules + per-package `tsconfig` `lib` settings (engines compile without DOM types) | Makes law #1 a compiler error, not a review comment |
| Unit/fixture tests | **Vitest** | Fast, TS-native |
| E2E, accessibility | **Playwright** + **axe-core** | One browser harness for all UI checks |
| Performance | **Lighthouse CI** + **size-limit** | Budgets enforced per PR |
| Link checking | **lychee** | Fast; works on built HTML and Markdown |
| Git hooks | **lefthook** | Single binary, simple config |
| Commits | **Conventional Commits** + commitlint | Machine-readable history for release notes |
| Package versions | **Changesets** for `engines/*` and `packages/*` | Standard, well known to AI agents |
| Tool versions | `version` + `changelog` inside each manifest | Colocated; feeds `/changelog` and RSS |
| Site releases | **CalVer** `vYYYY.MM.N` | Continuous product, not a library |
| Hosting | Static `dist/` with `_headers` and `_redirects` files → **Cloudflare Pages** (preview, staging, production) | Near-zero cost; files are portable to any static host |
| API (Phase 2+) | Cloudflare Worker in `apps/api` | Same platform, edge-native |
| Auth, DB, billing | Decided by **ADR-0009 before Phase 2**. Default: one managed auth+DB service with a free tier; one merchant of record | Not needed for Phases 0–1 |
| Analytics | Cookieless, first-party endpoint. Provider chosen in **ADR-0010**; events defined in-repo regardless of provider | Event catalogue is provider-independent |

### 1.1 Initial ADRs (Architecture Decision Records) to write in Phase 0

| ADR | Title | Decision recorded |
|---|---|---|
| 0001 | Operation contract | §3 of this blueprint |
| 0002 | Data file formats | YAML 1.2 + Markdown; strict schemas; unknown keys rejected |
| 0003 | Numeric model | IEEE-754 float64 in SI base units; all comparisons use explicit tolerances; rounding only at presentation; money in integer minor units |
| 0004 | UI island framework | Preact + `preact/compat`; P0 spike must prove the headless-primitive library works; fallback is React (documented cost) |
| 0005 | Hosting & headers | Static output + `_headers`/`_redirects`; CSP generated at build |
| 0006 | Versioning | SemVer for packages and tools, CalVer for site, operation majors in IDs |
| 0007 | Fixture immutability | §9.6 |
| 0008 | Licence policy | Allow: MIT, Apache-2.0, BSD-2/3, ISC, 0BSD, MPL-2.0 (unmodified). Deny: GPL, AGPL, LGPL (unless ADR), SSPL, BUSL, "non-commercial" |
| 0009 | Auth, database, billing | Written before Phase 2 |
| 0010 | Analytics provider | Written before public beta |
| 0011 | Sync encryption & key recovery | Written before Phase 3 |

---

## 2. Repository structure

### 2.1 The tree

```
mangotools/
├── AGENTS.md                      # Canonical rules for every AI agent (full text in Appendix A)
├── CLAUDE.md                      # One line: imports AGENTS.md (Claude Code convention)
├── README.md                      # Human quick start
├── site.config.yaml               # Domain per environment, brand names, allowed network hosts, feature flags
├── entitlements.yaml              # Capability catalogue, free limits, plan bundles
├── package.json                   # Root scripts: dev, gen, verify, test, build, new:*
├── pnpm-workspace.yaml            # engines/*, packages/*, apps/*
├── tsconfig.base.json · biome.json · lefthook.yml · .node-version · commitlint config
├── .dependency-cruiser config · .size-limit config · lighthouserc config
│
├── .github/
│   ├── workflows/                 # 13 workflows (§11)
│   ├── ISSUE_TEMPLATE/            # bug, new-tool, feature, engine-change, content, tech-debt, config
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── CODEOWNERS
│   ├── labels.yml                 # Label catalogue, synced by a workflow
│   └── dependabot.yml
├── .changeset/                    # Pending package version notes
│
├── docs/
│   ├── 00-index.md                # Map of all docs; first file an agent reads after AGENTS.md
│   ├── architecture/              # product-architecture.md (frozen), repository-blueprint.md (this)
│   ├── adr/                       # NNNN-kebab-title.md
│   ├── playbooks/                 # add-tool, add-preset, add-operation, add-engine, fix-bug,
│   │                              # write-content, add-ui-component, release
│   ├── prompts/                   # Prompt templates (Appendix B)
│   ├── standards/                 # code-style, naming, testing, privacy-rules, seo-rules, accessibility
│   └── glossary.md                # Domain vocabulary (Appendix D)
│
├── schemas/                       # Zod sources for every data file + generated JSON Schemas
│   └── src/                       # manifest, preset, taxonomy, content-frontmatter, fixture,
│                                  # operation-meta, entitlements, site-config, analytics-events
│
├── engines/                       # 14 pure-logic workspace packages (§4)
│   ├── units/  grid/  survey/  data/  pdf/  image/  privacy/
│   └── import/  report/  storage/  ai/  search/  settings/  analytics/
│
├── packages/
│   ├── core/                      # Operation contract, Result/errors, BinaryRef, shared IR types
│   ├── runtime/                   # ToolRuntime state machine, worker host, entitlement client
│   ├── ui/                        # Tokens, primitives, tool-kit components, archetypes A–E, shells
│   └── adapters/                  # Registry → MCP / Anthropic / OpenAI / Gemini / OpenAPI definitions
│
├── presets/                       # <engine>/<name>[.<variant>].yaml
├── tools/                         # <slug>/manifest.yaml · content.md · fixtures/ · media/
├── taxonomy/                      # categories, professions, tags, workflows, synonyms, reserved-slugs
├── content/
│   ├── learn/  for/  workflows/  compare/     # SEO & teaching pages
│   ├── pages/                     # Legal & trust pages (human-only)
│   └── releases/                  # Release notes written at release time
│
├── apps/
│   ├── web/                       # Astro site: layouts, templates P1–P14, route generators
│   ├── api/                       # Phase 2: edge worker (auth callbacks, entitlements, sync, verify)
│   └── mcp/                       # Phase 5: MCP server shell over packages/adapters
│
├── scripts/
│   ├── validate/                  # taxonomy, presets, manifests, content, fixtures, licences
│   ├── generate/                  # registry, routes, nav, search, sitemap, robots, jsonld, og, rss,
│   │                              # redirects, headers, adapters, changelog
│   ├── check/                     # lanes, fixture-guard, versions, code-size, seo-audit, privacy-scan
│   ├── new/                       # Scaffolders: tool, preset, operation, engine, component, adr
│   ├── migrate/                   # Codemods for manifestVersion / presetVersion upgrades
│   └── release/                   # CalVer, notes, post-deploy smoke
│
├── tests/
│   ├── e2e/                       # Archetype flows, T1 tool flows, workspace flows
│   ├── a11y/                      # axe scans per template and archetype state
│   ├── seo/                       # Built-site assertions beyond the audit script
│   ├── privacy/                   # Network-blocked runs, analytics payload inspection
│   ├── perf/                      # Lighthouse page list and budgets
│   └── visual/                    # Screenshot baselines for templates only (not per tool)
│
├── assets/
│   ├── brand/                     # Logo SVGs, favicon sources
│   ├── fonts/                     # Self-hosted font files (no third-party font CDNs)
│   ├── icons/                     # Category and UI icon set (one set)
│   └── og/                        # OpenGraph image templates
│
└── generated/                     # Build outputs — gitignored, never edited
```

### 2.2 What changed from your example structure, and why

| Your folder | Where it lives | Why |
|---|---|---|
| `engines/` | `engines/` (top level) | Kept top level: the heart of the system should be the most visible folder |
| `shared/` | `packages/core/` | "Shared" becomes a dumping ground; "core" has a strict charter (contract + IR types only) |
| `ui/` | `packages/ui/` | Grouped with other non-engine libraries |
| `tools/` | `tools/` | Unchanged |
| `categories/` | `taxonomy/` | Categories, professions, tags, workflows and synonyms are one graph; one folder |
| `presets/` | `presets/` | Unchanged — shared by tool pages, workspace sheets, API and MCP |
| `schemas/` | `schemas/` | Unchanged |
| `tests/` | `tests/` for cross-cutting tests only | Unit and fixture tests live **next to the code they test** so an agent sees them in the same folder |
| `fixtures/` | Inside each engine operation and each tool | Colocation: one folder holds everything about one thing |
| `examples/` | `samples` inside presets; worked examples rendered from fixtures | Removes a third copy of example data that would drift |
| `assets/` | `assets/` | Unchanged |
| `scripts/` + `build/` + `automation/` | `scripts/` (grouped by stage) + `.github/workflows/` | One place for build logic; CI only calls scripts, so everything runs locally too |
| `website/` + `app/` | `apps/web/` | One Astro project, one deploy; `/app` routes are client-rendered inside it |
| `api/` | `apps/api/` | Deployable units live under `apps/` |
| `mcp/` | `apps/mcp/` (shell) + `packages/adapters/` (logic) | Adapters are testable now; the server is a thin shell later |
| `github/` + `.github/` | `.github/` only | GitHub reads only `.github/` |
| — | `generated/` | Makes "never edit" physically obvious |
| — | `content/` | Guides, profession pages and legal pages are not tools |

### 2.3 Folder governance

**Lanes (owners).** There is one human (the founder). Work is divided into *lanes*; an AI agent works in exactly one lane per task.

| Lane | Covers |
|---|---|
| `platform` | `schemas/`, `packages/core`, `packages/runtime`, `packages/adapters`, `scripts/`, `apps/*`, root configs |
| `engine-<name>` | One folder in `engines/` (14 lanes) |
| `ui` | `packages/ui`, `assets/` |
| `tools` | `tools/`, `presets/` (non-base presets), `taxonomy/` |
| `content` | `content/` (except `pages/`), `tools/*/content.md` |
| `ci` | `.github/` |
| `docs` | `docs/` |

**AI edit levels.**

| Level | Meaning |
|---|---|
| **A — Autonomous** | Agent may open a PR that auto-merges when every check is green |
| **S — Supervised** | Agent may edit; founder reviews the diff before merge |
| **R — Restricted** | Agent may propose; founder reviews deeply; public API changes need an ADR |
| **H — Human-only** | Agent must not edit; may draft text in an issue comment |
| **G — Generated** | Nobody edits; regenerate instead |

| Folder | Purpose | Owner lane | Depends on | AI edit | Human review | Size at 500 tools |
|---|---|---|---|---|---|---|
| `AGENTS.md`, `CLAUDE.md` | Rules every agent loads first | docs | — | H | Always | 2 files |
| `site.config.yaml` | Domains, brand, allowed hosts, flags | platform | `schemas/` | R | Always | 1 file |
| `entitlements.yaml` | Capabilities, free limits, plans | platform | `schemas/` | H | Always (pricing) | 1 file |
| `.github/workflows/` | CI/CD automation | ci | `scripts/` | R | Always | ~13 files |
| `.github/ISSUE_TEMPLATE`, PR template, labels | Work intake & review | ci | — | S | Yes | ~10 files |
| `.changeset/` | Pending version notes | any lane | — | A | With PR | transient |
| `docs/architecture/` | Frozen product + repo design | docs | — | H | Always | 2–4 files |
| `docs/adr/` | Decisions | docs | — | S (drafts) | Always (acceptance) | 40–80 files |
| `docs/playbooks`, `prompts`, `standards` | How agents work | docs | — | S | Yes | ~25 files |
| `docs/glossary.md` | Domain vocabulary | docs | — | S | Yes | 1 file, grows |
| `schemas/` | Single source of data shapes | platform | Zod | R | Always | ~12 schema modules, stable |
| `engines/<name>/` | Pure domain logic | engine-<name> | `packages/core`, whitelisted engines (§2.4) | S; **R** for public API changes | Yes | 14 engines, ~150–220 operations, ~1,800–2,600 files |
| `engines/*/…/fixtures/` | Golden truth | engine-<name> | — | Add: S · **Change expected values: H** | Always for changes | ~1,000–1,500 fixture files; binary fixtures ≤ 200 KB each |
| `packages/core/` | Contract + IR types | platform | Zod | R | Always | ~40–60 files, stable |
| `packages/runtime/` | Runs tools in the browser | platform | core, engines (dynamic), settings/storage/analytics engines | R | Always | ~60–90 files |
| `packages/ui/` | Design system + archetypes | ui | core, runtime | S | Yes (visual) | ~140–180 components, ~700 files |
| `packages/adapters/` | Provider tool definitions | platform | core, generated registry | R | Always | ~20–30 files |
| `presets/` | Behaviour configuration | tools (base presets: engine lane) | engines (schemas) | S (variants) · R (base presets) | Yes | ~550–700 files |
| `tools/<slug>/` | One tool's page, content, fixtures | tools | presets, taxonomy | **A** for T3/T4 · S for T1/T2 | T1/T2 always | 500 folders, ~2,500–3,500 files |
| `taxonomy/` | Categories, professions, tags, workflows | tools | `schemas/` | S | Yes | 6 files |
| `content/learn`, `for`, `workflows`, `compare` | Teaching & landing pages | content | taxonomy, tools | A (edits) · S (new pages) | Sampled | 300–600 files |
| `content/pages/` | Privacy, terms, security | docs | — | **H** | Always | ~8 files |
| `content/releases/` | Release notes | ci (generated draft) | — | S | Yes | 1 per release |
| `apps/web/` | Templates and routes | platform | ui, runtime, generated registry | R | Always | **~150–250 files — does not grow with tools** |
| `apps/api/` | Server endpoints (P2+) | platform | core, adapters | R | Always, security-sensitive | ~60–120 files |
| `apps/mcp/` | MCP server shell (P5) | platform | adapters, engines | R | Always | ~15–30 files |
| `scripts/` | Build, validate, generate, check | platform | schemas, core, engines | R | Always | ~80–120 files |
| `tests/` | Cross-cutting tests | platform | built site | S | Yes | ~120–200 specs (grows with archetypes, not tools) |
| `assets/` | Brand, fonts, icons, OG templates | ui | — | S | Yes | ~200–400 files |
| `generated/` | Build outputs | — | everything | **G** | Never | ~1,200–1,500 pages; not in git |

### 2.4 Dependency rules (enforced by dependency-cruiser in CI)

```
schemas ◀── packages/core ◀── engines/* ◀── packages/runtime ◀── packages/ui ◀── apps/web
                   ▲                ▲
                   └── packages/adapters ◀── apps/api, apps/mcp
scripts/ may import: schemas, core, engines, adapters (never ui, never apps)
Data folders (tools, presets, taxonomy, content) are never imported by code — only read by scripts/generate.
```

**Allowed engine → engine edges (whitelist; everything else fails CI):**

| Engine | May import |
|---|---|
| units, data, search, settings, storage, ai | core only |
| grid, survey, import | core, units |
| privacy | core, ai (lazy, optional NER) |
| report | core, units |
| pdf, image | core |
| analytics | core, settings |

Additional hard rules:
- Portable engines (units, grid, survey, data, pdf, image, privacy, import, report, search) compile with `lib: ["ES2023"]` only — no DOM, no WebWorker types. The two browser-bound engines (storage, ai) add only the `WebWorker` lib (IndexedDB, OPFS, WebGPU are available in workers) and declare `runtimes: [worker]`. Settings and analytics are pure logic that talk to the outside world through **ports** (a key-value store port, a transport port); `packages/runtime` injects the browser adapters (localStorage, `sendBeacon`). **No engine ever compiles with DOM types.** Engines use `types: []`; the few cross-runtime globals they may touch (Web Crypto digest, `TextEncoder`/`TextDecoder`, `WebAssembly` instantiation, `structuredClone`) are declared in one audited file, `packages/core/platform-globals.d.ts`. Network globals (`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`) are banned in `engines/` by a lint rule; model and WASM downloads go through `ctx.assets`, which the runtime implements.
- `packages/ui` and `apps/web` never import an engine directly — only through `packages/runtime`.
- No package imports from another package's internal paths; only from its public entry.

---

## 3. The operation contract (shared by every engine)

An **engine** is a workspace package. Its public surface is a list of **operations**. Everything the platform does with engines — run them in workers, test them, render their results, expose them to Claude/ChatGPT/Gemini/REST — goes through this one contract, defined in `packages/core` (ADR-0001).

### 3.1 Operation descriptor fields

| Field | Required | Meaning | Rules |
|---|---|---|---|
| `id` | ✅ | Stable identifier | `engine.domain.verb`, lowercase dot-case, e.g. `survey.leveling.reduce`. Never renamed |
| `major` | ✅ | Contract major version | Integer ≥ 1. Referenced as `survey.leveling.reduce@1`. Breaking change ⇒ new major, old major kept until deprecation window ends |
| `title` | ✅ | Human title | ≤ 60 chars |
| `summary` | ✅ | One sentence | ≤ 160 chars |
| `llm.description` | ✅ if exposure ≠ internal | What it does, written for an AI model | 1–4 sentences; states units and assumptions |
| `llm.whenToUse` / `llm.notFor` | ✅ if exposure ≠ internal | Routing hints for AI clients | One sentence each |
| `input` | ✅ | The user's data (observations, text, file) | Zod schema in the **portable profile** (§12.3) |
| `params` | ✅ | Behaviour configuration (method, tolerances, modes) — what presets set | Portable profile; every field has a default |
| `output` | ✅ | Result | Portable profile |
| `errors` | ✅ | Error codes this operation may return | Codes from the engine's error catalogue |
| `runtimes` | ✅ | Where it can run | Subset of `worker`, `node`, `edge` |
| `cost.weight` | ✅ | `light` / `medium` / `heavy` | Heavy ⇒ runtime shows progress and supports cancel |
| `cost.assets` | Optional | Lazy WASM/model assets with byte sizes | Sizes shown to users before download |
| `exposure` | ✅ | `internal` / `api` / `mcp` | `mcp` implies `api` |
| `dataClass` | ✅ | `public` / `personal` / `sensitive` | `sensitive` ⇒ never exposed on remote API/MCP; local MCP only |
| `acceptsBinary` / `returnsBinary` | ✅ | Uses `BinaryRef` | Adapters exclude binary ops from providers that cannot carry files |
| `annotations` | ✅ | `readOnly`, `idempotent`, `destructive`, `openWorld` | Engines are always read-only, idempotent, non-destructive, closed-world |
| `run` | ✅ | The implementation entry | Pure: `(input, params, ctx) → Result<output, OpError>` |

### 3.2 Execution context (`ctx`) — the only way an engine touches the outside world

| Member | Purpose |
|---|---|
| `clock` | Injected time source (fixtures freeze it) |
| `random` | Seeded generator (pseudonyms, UUIDs are generated through this) |
| `locale` | Number/date formatting locale |
| `signal` | Abort signal for cancellation |
| `progress` | Callback for heavy operations (0–1 + stage key) |
| `assets` | Loader for declared lazy assets (WASM, models) with integrity check |
| `limits` | Max input sizes (bytes, rows, pages) set by runtime/entitlements |
| `log` | Structured logger that **only accepts codes and numbers** — never user content |

### 3.3 Results, errors, warnings

- Engines **never throw for user input**. They return `ok(output)` or `err(OpError)`.
- `OpError` = `code` (e.g. `SURVEY_LEVELING_NO_BACKSIGHT`), `path` (input path, e.g. `observations[3].bs`), `messageKey` (i18n), `details` (numbers/enums only).
- Non-fatal issues go in `output.warnings[]` with the same shape.
- Thrown exceptions are treated as bugs: runtime reports `INTERNAL_ERROR` and the error-tracking scrubber strips inputs.

### 3.4 Shared intermediate representations (IR) in `packages/core`

Engines return **data about results**, never prose or pixels. The UI, report engine and AI adapters all render the same IR.

| IR type | Shape (fields) | Used by |
|---|---|---|
| `Quantity` | value (SI base), unit, quantityKind, displayPrecision | Every numeric field |
| `Angle` | radians, sourceNotation (`dms`, `decimal`, `gon`, `wcb`, `quadrant`) | Survey, construction |
| `Table` | columns (id, kind, quantityKind, unit, precision), rows (cells keyed by column id; blank ≠ zero) | Grid, import, report, survey |
| `Check` | id, labelKey, status (`pass`/`fail`/`warn`/`na`), expected, actual, tolerance, explanationKey, refs (row/column pointers) | CheckPanel, reports, AI summaries |
| `WorkingStep` | ref (row/field), formulaId, variables (symbol → value), result, noteKey | "Show the work" UI, student mode, reports |
| `PlotSpec` | layers (polyline, points, labels, vectors), bounds, axis units, style tokens (no pixels) | UI plots, PDF reports, DXF export |
| `Detection` | start, end, type, detectorId, confidence | Privacy |
| `BinaryRef` | kind (`bytes`, `blob`, `opfs`, `base64`), mime, name, size | PDF, image, import, report |
| `ReportDocument` | metadata, brand, sections (tables, checks, working, plots, text blocks), template id | Report engine |

**Units rule for operations:** operation inputs and outputs carry **plain numbers in one declared base unit per field** (metres for lengths, decimal degrees for bearings), recorded as `unit` metadata in the schema and in the field description. Field names carry a unit suffix only where several units are plausible (`bearingDeg`, `distanceM`); leveling readings stay `bs`, `is`, `fs` (metres). `Quantity` and `Angle` are used at the UI/grid boundary, where the units engine parses "5' 3\"" or "N 45°30′ E" into those numbers. This keeps operations trivially callable by AI clients and APIs.

`PlotSpec` resolves the frozen architecture's separate "Plot engine" (E11) into a shared IR plus one UI component plus one report renderer — no extra engine to maintain (see §13).

### 3.5 Identical internal layout for every engine

```
engines/<name>/
├── AGENTS.md                  # Engine-specific rules, domain notes, known pitfalls
├── README.md                  # Operation list with one-line descriptions (generated table + human intro)
├── package.json               # @mangotools/engine-<name>, semver version
├── CHANGELOG.md               # Managed by Changesets
├── tsconfig.json              # lib restrictions (§2.4)
├── src/
│   ├── index.ts               # Exports the operation descriptors only
│   ├── errors.ts              # Error-code catalogue for this engine
│   ├── operations/
│   │   └── <operation-name>/  # e.g. leveling-reduce/
│   │       ├── operation.ts   # Descriptor (§3.1) wiring schema + run
│   │       ├── schema.ts      # input / params / output schemas
│   │       ├── run.ts         # Orchestration only
│   │       ├── strategies/    # One file per method (rise-fall, height-of-instrument…)
│   │       ├── checks.ts      # Check builders
│   │       ├── working.ts     # WorkingStep builders
│   │       ├── README.md      # Method, formulas, references, edge cases
│   │       └── fixtures/      # NNN-kebab-description.yaml (+ files/ for binaries)
│   └── lib/                   # Private helpers shared inside this engine only
└── test/                      # Property tests and cross-operation tests
```

**Why identical:** an agent that has worked on one engine can work on any engine. Scaffolded by `pnpm new:operation <engine> <name>` and `pnpm new:engine <name>`.

### 3.6 Golden fixture format (engine level)

| Field | Required | Meaning |
|---|---|---|
| `id` | ✅ | `NNN-kebab-description`, matches file name |
| `operation` | ✅ | `id@major` |
| `source.type` | ✅ | `textbook` · `standard` · `hand-verified` · `regression` · `synthetic` |
| `source.citation` | ✅ unless regression/synthetic | Author, title, edition, example/page |
| `synthetic` | ✅ for privacy data | Must be `true` for any text resembling personal data |
| `params` | Optional | Overrides of defaults |
| `input` | ✅ | Validated against the input schema |
| `input.files` | Optional | Paths under `fixtures/files/` for binaries |
| `expected` | ✅ | Subset of the output that must match |
| `match` | Optional | `subset` (default) or `exact` |
| `tolerance` | Optional | `default` absolute tolerance + per-path overrides (e.g. levels 0.0005 m) |
| `expectedError` | Instead of `expected` | Error code + path for negative cases |
| `tags` | Optional | e.g. `edge-case`, `student`, `imperial` |

For binary engines, `expected` holds **properties** (page count, dimensions, extracted text, metadata absent), never raw bytes. For the privacy engine, `expected` can hold **metrics gates** (recall/precision per entity type) over an annotated corpus.

---

## 4. Engine specifications

Fourteen engines. The thirteen you listed plus **Data** (required by the frozen architecture's generic tools — it merges the old E5 "text & data" and E6 "generators" into one engine; see §13).

Notation: operations are listed as `id@major`. "MCP" states the future exposure level.

### 4.1 Units engine — `engines/units`

| Aspect | Specification |
|---|---|
| **Responsibilities** | Quantity kinds registry (length, area, volume, mass, density, angle, temperature, time, pressure, data size); parse text to quantities by locale; convert; format; rounding policy; angle notations (DMS, decimal degrees, gon, whole-circle bearing, quadrant bearing); feet-and-inches; international foot vs the retired US survey foot (explicitly labelled); Indian lakh/crore grouping |
| **Public API** | `units.quantity.parse@1` · `units.quantity.convert@1` · `units.quantity.format@1` · `units.angle.parse@1` · `units.angle.convert@1` · `units.angle.format@1` · `units.number.round@1` |
| **Input** | Text + quantity kind + allowed units + locale; or `Quantity`/`Angle` + target unit/notation; or number + rounding policy |
| **Output** | `Quantity` / `Angle` / formatted string; errors `UNITS_UNPARSEABLE`, `UNITS_NOT_ALLOWED`, `UNITS_AMBIGUOUS_SEPARATOR`, `UNITS_OUT_OF_RANGE` |
| **Dependencies** | `core` only. Conversion factors maintained in-engine with a source note per factor |
| **Tests** | Round-trip property tests (`parse(format(x)) ≈ x`); locale separator matrix (`1,5` / `1.5` / `1 234,5`); angle normalisation to [0, 360); all four quadrants ↔ WCB; blank input returns "empty", never zero |
| **Golden fixtures** | Conversion factors from NIST SP 811; DMS/gon tables; quadrant-bearing examples from surveying textbooks |
| **Future MCP** | `units_convert`, `angle_convert` — exposure `mcp`, `public`, portable, light |

### 4.2 Grid engine — `engines/grid`

| Aspect | Specification |
|---|---|
| **Responsibilities** | Headless model for spreadsheet-like entry: columns from presets, cell parsing via units, row/cell validation, edit commands as data, undo/redo, paste parsing (Excel/Sheets TSV, CSV, decimal commas), fill-down, insert/delete rows, export/import canonical `Table`. Computed columns are *declared* here but *filled* by the domain engine's output |
| **Public API** | `grid.model.create@1` · `grid.edit.apply@1` (commands: setCell, insertRows, deleteRows, paste, fillDown, clear) · `grid.edit.undo@1` · `grid.edit.redo@1` · `grid.paste.parse@1` · `grid.validate@1` · `grid.table.export@1` · `grid.table.import@1` |
| **Input** | Column definitions (from resolved preset), model snapshot, command |
| **Output** | New immutable model snapshot + diff + cell issues; `Table` |
| **Dependencies** | `core`, `units` |
| **Tests** | Property: apply → undo returns identical snapshot; paste matrix (quoted CSV, trailing newlines, blank cells remain blank, decimal-comma locales, extra columns ignored with warning); large model performance (5,000 rows edit < 16 ms) |
| **Golden fixtures** | Captured clipboard text from Excel, Google Sheets and LibreOffice for real level-book layouts |
| **Future MCP** | Internal. (An AI client sends structured rows directly; it never needs grid commands.) |

### 4.3 Survey engine — `engines/survey`

| Aspect | Specification |
|---|---|
| **Responsibilities** | Leveling reduction (rise & fall, height of instrument), arithmetic checks, misclosure and allowable misclosure, closing-error distribution; traverse closure and adjustment (Bowditch, Transit), coordinates, relative precision, area by coordinates; COGO inverse/forward; later curves, profiles, cut/fill. Produces `Check`, `WorkingStep` and `PlotSpec` IR |
| **Public API** | Phase 1: `survey.leveling.reduce@1` · `survey.traverse.adjust@1` · `survey.traverse.closure@1` · `survey.cogo.inverse@1` · `survey.cogo.forward@1` · `survey.area.coordinates@1`. Phase 3+: `survey.curve.horizontal@1` · `survey.profile.build@1` · `survey.volume.cutfill@1` |
| **Input** (leveling) | Observations: station, BS?, IS?, FS?, distance?, remarks (blank ≠ zero) |
| **Params** (leveling) | `method` (`rise-fall` \| `height-of-instrument`), `startRL`, `closingRL?`, `misclosure` (`none` \| `constant-root-k` \| `constant-root-n`, constant in mm), `distribution` (`none` \| `equal-per-setup` \| `proportional-distance`), `showWorking` |
| **Output** (leveling) | Rows (rise, fall, HI, RL, correction, adjusted RL), checks (method-specific arithmetic checks), misclosure (value, allowable, pass), working steps, profile `PlotSpec`, warnings |
| **Input / params** (traverse) | Legs (from, to, `bearingDeg` as decimal whole-circle bearing, `distanceM`), start coordinates (E, N); params `type` (`closed-loop` \| `link`), `method` (`bowditch` \| `transit`), end coordinates (link), precision target 1:N |
| **Output** (traverse) | Latitudes/departures, corrections, adjusted values, coordinates, linear misclosure, misclosure bearing, relative precision, area (closed loop), checks, working, traverse `PlotSpec` |
| **Dependencies** | `core`, `units` |
| **Tests** | Property: zero-misclosure input ⇒ zero corrections; rotating a traverse leaves misclosure magnitude unchanged; reversing loop direction preserves area magnitude; for any valid level book, ΣBS − ΣFS = ΣRise − ΣFall = Last RL − First RL within tolerance |
| **Golden fixtures** | ≥ 3 per operation from recognised textbooks (e.g. Indian and international university surveying texts), cited with edition and example number; plus hand-verified spreadsheet cases for edge cases (change points, IS on first row, missing closing BM) |
| **Future MCP** | All Phase 1 operations: exposure `mcp`, `public`, portable, light. Highest-value tools for AI clients |

### 4.4 Data engine — `engines/data` (added; see §13)

| Aspect | Specification |
|---|---|
| **Responsibilities** | Text and structured-data transforms and generators for generic tools |
| **Public API** | `data.json.format@1` · `data.json.validate@1` · `data.csv.toJson@1` · `data.json.toCsv@1` · `data.base64.encode@1` · `data.base64.decode@1` · `data.url.encode@1` · `data.url.decode@1` · `data.text.stats@1` · `data.text.case@1` · `data.text.diff@1` · `data.regex.test@1` · `data.time.convert@1` · `data.uuid.generate@1` · `data.hash.compute@1` · `data.qr.generate@1` |
| **Input / output** | Text or structured values in; text, structured results, or QR as vector path data (`PlotSpec`-like module grid) out |
| **Dependencies** | `core`; CSV parser (MIT), QR encoder (MIT), text diff (BSD) |
| **Tests** | Per-operation fixtures; regex runs with a timeout guard (catastrophic backtracking returns `DATA_REGEX_TIMEOUT`); UUID/hash determinism via `ctx.random`/Web Crypto |
| **Golden fixtures** | RFC test vectors (Base64 RFC 4648, UUID RFC 9562 format, SHA test vectors), JSON edge cases (big numbers, unicode escapes) |
| **Future MCP** | Internal by default — AI models already do these; exposing them adds noise to tool lists |

### 4.5 PDF engine — `engines/pdf`

| Aspect | Specification |
|---|---|
| **Responsibilities** | Assemble, split, reorder, rotate, delete pages; stamp text (page numbers, Bates numbers, watermarks) from token templates; images → PDF; render pages to images; extract text; flatten forms; strip metadata. Later: region redaction with verification |
| **Public API** | `pdf.inspect@1` · `pdf.merge@1` · `pdf.split@1` · `pdf.pages.rotate@1` · `pdf.pages.reorder@1` · `pdf.pages.delete@1` · `pdf.stamp.text@1` · `pdf.fromImages@1` · `pdf.render.pages@1` · `pdf.text.extract@1` · `pdf.forms.flatten@1` · `pdf.metadata.strip@1` · (P3) `pdf.redact.regions@1` |
| **Input** | `BinaryRef`(s) + page ranges / stamp template (`{n}`, `{total}`, `{prefix}`, position, font size) |
| **Output** | `BinaryRef` + summary (pages, bytes); render returns image `BinaryRef`s; extract returns text per page |
| **Dependencies** | `core`; pdf-lib (MIT); pdf.js (Apache-2.0) for render/extract. **No AGPL PDF engines** |
| **Tests** | Structural assertions (page count, sizes, rotation, stamped text present via extraction); encrypted input returns `PDF_ENCRYPTED`; memory ceiling test (200-page file) |
| **Golden fixtures** | Small committed PDFs (≤ 200 KB each): mixed page sizes, forms, encrypted, scanned-image PDF, damaged cross-reference table |
| **Future MCP** | `pdf_merge`, `pdf_split`, `pdf_stamp_text` — exposure `api`/`mcp`, binary via resources |

### 4.6 Image engine — `engines/image`

| Aspect | Specification |
|---|---|
| **Responsibilities** | Inspect, resize, convert (JPEG/PNG/WebP/AVIF), compress (quality or target size), crop (rectangle or aspect ratio), read and strip metadata (EXIF/GPS) |
| **Public API** | `image.inspect@1` · `image.resize@1` · `image.convert@1` · `image.compress@1` · `image.crop@1` · `image.metadata.read@1` · `image.metadata.strip@1` |
| **Input / output** | `BinaryRef` + dimensions/format/quality params → `BinaryRef` + summary |
| **Dependencies** | `core`; WASM codecs and WASM resize (Apache-2.0 codec set) — chosen over canvas so the engine also runs in Node; EXIF reader (MIT) |
| **Tests** | Output dimension/format assertions; metadata-strip verification (re-read ⇒ no GPS); compression quality gate (structural similarity ≥ threshold vs reference) |
| **Golden fixtures** | Small images with GPS EXIF, orientation tags, CMYK JPEG, transparent PNG, animated input (expect `IMAGE_ANIMATED_UNSUPPORTED`) |
| **Future MCP** | Internal initially; `image_metadata_strip` is a candidate |

### 4.7 Privacy engine — `engines/privacy`

| Aspect | Specification |
|---|---|
| **Responsibilities** | Detect identifiers in text and tables through a detector pipeline — pattern detectors with validators (Luhn, Verhoeff for Aadhaar, format rules for PAN/SSN/NPI, emails, phones, dates, ages > 89, postal codes, IPs, URLs), dictionary detectors (custom lists), optional on-device NER (via AI engine); resolve overlaps; transform (redact, mask, consistent pseudonyms, reversible mapping); re-identify; sanitise HAR files; build audit summaries that contain counts, never the identifiers |
| **Public API** | `privacy.text.detect@1` · `privacy.text.transform@1` · `privacy.text.reidentify@1` · `privacy.table.detect@1` · `privacy.table.transform@1` · `privacy.har.sanitize@1` · `privacy.summary.build@1` |
| **Input** | Text or `Table` or HAR JSON |
| **Params** | Profile's detector set (set by presets: `hipaa-safe-harbor`, `pii-general`, `india-personal`, `dev-secrets`), custom dictionaries, mode (`redact` \| `mask` \| `pseudonymize` \| `reversible`), pseudonym style, seed, NER on/off |
| **Output** | `Detection[]`; transformed text/table; `mapping` (reversible mode only, flagged sensitive, never logged); summary counts per type |
| **Dependencies** | `core`; `ai` (lazy, optional); phone-number library with minimal metadata (MIT) |
| **Tests** | Corpus evaluation with CI gates (per-type recall and precision thresholds); false-positive traps ("1000 mg", "2024", eponymous diseases, lab values); property: `reidentify(transform(x)) = x`; determinism with seed |
| **Golden fixtures** | **Synthetic only**: clinical notes, legal letters, HR emails, HAR files with tokens, each with gold spans. A CI check rejects any privacy fixture without `synthetic: true` |
| **Runtimes** | `worker` and `node`. NER needs the AI engine (worker); in Node the pipeline runs pattern + dictionary detectors only and the output reports `nerUsed: false`, so callers always know which detectors ran |
| **Future MCP** | `privacy_text_detect`, `privacy_text_transform`, `privacy_text_reidentify` — `dataClass: sensitive` ⇒ **local MCP only** (runs on the user's machine), never on the remote API |

### 4.8 Import engine — `engines/import`

| Aspect | Specification |
|---|---|
| **Responsibilities** | Detect file format/encoding/delimiter; read CSV/TSV/XLSX into `Table`s; propose column mapping to a preset's columns using alias dictionaries; coerce to typed rows via units; parse instrument raw files through a format-parser registry |
| **Public API** | `import.sniff@1` · `import.tabular.read@1` · `import.columns.map@1` · `import.rows.coerce@1` · (P3) `import.instrument.read@1` with parsers registered by format id |
| **Input** | `BinaryRef`; target column definitions + aliases (from preset); user mapping overrides |
| **Output** | Format guess with confidence; `Table[]` (one per sheet); mapping proposal with confidence; typed rows + issues |
| **Dependencies** | `core`, `units`; CSV parser (MIT); XLSX reader/writer library (MIT) loaded lazily |
| **Tests** | UTF-8 BOM, Windows-1252, semicolon delimiters, Excel serial dates, merged cells, hidden rows, formula cells (values read), 10,000-row performance |
| **Golden fixtures** | Real-world-shaped sample files per format (anonymised/synthetic) with expected `Table` JSON |
| **Future MCP** | Internal (AI clients send structured data). `import_instrument_read` is an API candidate later |

### 4.9 Report engine — `engines/report`

| Aspect | Specification |
|---|---|
| **Responsibilities** | Compose a `ReportDocument` IR from tables, checks, working, plots and metadata using a **template** (data file) and a **brand kit** (input); render IR to PDF, XLSX (with formula hints where provided), CSV, DXF; compute a canonical content hash for the verification QR. **Branding mode is a parameter (`attributed` \| `custom`) — the engine knows nothing about plans** |
| **Public API** | `report.document.compose@1` · `report.render.pdf@1` · `report.render.xlsx@1` · `report.render.csv@1` · `report.render.dxf@1` · `report.hash.canonical@1` |
| **Input** | `Table`, `Check`, `WorkingStep` and `PlotSpec` IR from one or more sheets; report metadata (job, client, operator, date, tool/preset/engine versions); template id; brand kit (logo `BinaryRef`, colours, letterhead text, signature block); branding mode |
| **Output** | `ReportDocument` IR; rendered `BinaryRef` (PDF, XLSX, CSV or DXF); canonical content hash |
| **Templates** | `engines/report/templates/*.yaml`: page size, margins, header/footer blocks, typography tokens, section styles. Adding a template = data only |
| **Dependencies** | `core`, `units`; pdf-lib + font embedding (MIT); XLSX writer (shared with import); **in-house minimal DXF writer** (ASCII subset: LINE, POINT, TEXT, LWPOLYLINE) instead of a dependency |
| **Tests** | IR snapshot tests; PDF text extraction contains required strings; fonts embedded; XLSX round-trip via import engine equals source table; DXF re-parse (dev-only parser) yields expected entity counts; hash stable across runs |
| **Golden fixtures** | One compose fixture per T1 preset × template × branding mode |
| **Future MCP** | `report_render_pdf` via API (binary). Exposure `api` |

### 4.10 Storage engine — `engines/storage`

| Aspect | Specification |
|---|---|
| **Responsibilities** | Local-first persistence: workspace → projects → sheets (saved tool runs: preset id, input, params, output hash, tool/engine versions) → reports/files; draft autosave; versioned local schema with forward-only migrations; export/import all data as an archive; end-to-end encryption for sync (Web Crypto AES-GCM; data key wrapped by a recovery key); sync client that pushes/pulls opaque encrypted blobs |
| **Public API** | `storage.project.list/get/save/delete@1` · `storage.sheet.save/get/history@1` · `storage.draft.save/restore/clear@1` · `storage.file.put/get/delete@1` · `storage.archive.export@1` · `storage.archive.import@1` · `storage.sync.push/pull/status@1` · `storage.keys.create/unlock/exportRecovery@1` |
| **Input / output** | Entities validated by storage schemas; `BinaryRef` for files; sync status objects |
| **Dependencies** | `core`; IndexedDB wrapper with migrations (Apache-2.0); zip library (MIT). OPFS for large files |
| **Tests** | Migration tests from a snapshot of **every** previous local schema version; crypto round-trip; conflict scenarios (same sheet edited on two devices ⇒ conflict copy, never silent loss); quota-exceeded handling; in-memory adapter for Node tests |
| **Golden fixtures** | `fixtures/db-v1.json`, `db-v2.json`… exported snapshots |
| **Future MCP** | **Never.** User data stays on the device |

### 4.11 AI engine — `engines/ai`

| Aspect | Specification |
|---|---|
| **Responsibilities** | On-device inference only (v1): capability detection (WebGPU, WASM SIMD/threads); model registry (id, task, licence, bytes, SHA-256, source path on MangoTools' own asset host, minimum capability); download with progress, integrity check and caching; NER and (Phase 5) OCR inference; unload. Cloud AI requires a new ADR and a separate privacy badge |
| **Public API** | `ai.capabilities.detect@1` · `ai.model.status@1` · `ai.model.load@1` · `ai.model.unload@1` · `ai.ner.run@1` · (P5) `ai.ocr.run@1` |
| **Input / output** | Text → entity spans with confidence; image `BinaryRef` → lines/words with boxes; status/progress objects |
| **Dependencies** | `core`; an on-device transformer runtime (Apache-2.0) / ONNX web runtime (MIT); OCR library (Apache-2.0) in Phase 5 |
| **Tests** | Registry validation (licence on allow-list, hash present, size declared); tiny test model smoke inference; pinned model version ⇒ deterministic spans on fixture texts |
| **Golden fixtures** | NER spans shared with the privacy corpus; OCR page images (Phase 5) |
| **Future MCP** | **Never** — the AI client is already the model; the privacy engine exposes results instead |

### 4.12 Search engine — `engines/search`

| Aspect | Specification |
|---|---|
| **Responsibilities** | Build a static index at build time from the registry (tools, guides, actions); load it in the browser; query with synonyms, typo tolerance, filters and boosts (recent, pinned, popularity); merge in local projects at runtime (never in the static index) |
| **Public API** | `search.index.build@1` (build time, Node) · `search.index.load@1` · `search.query@1` |
| **Input / output** | Registry documents → serialized index; query + filters + context → ranked results (kind `tool` \| `guide` \| `action` \| `project`, id, score, highlights) |
| **Dependencies** | `core`; a small client-side full-text library (MIT). One library for the whole site |
| **Tests** | Relevance suite with CI gate (≥ 95% of queries return the expected id in top 3); index size budget (≤ 150 KB compressed at 500 tools) |
| **Golden fixtures** | `fixtures/relevance.yaml` — hand-written cases ("rl calculator", "compass rule", typo "levling") **plus one case auto-generated per tool** from its primary keyword and synonyms |
| **Future MCP** | `search_tools` — exposure `mcp`. Lets an AI client discover which MangoTools operation or preset fits a request |

### 4.13 Settings engine — `engines/settings`

| Aspect | Specification |
|---|---|
| **Responsibilities** | Typed user preferences with schema, defaults, migrations and change subscriptions; storage through an injected key-value port (runtime supplies localStorage with an in-memory fallback; synced via storage engine for Pro) |
| **Keys** | `theme`, `density`, `locale`, `numberGrouping` (`international` \| `indian`), `unitSystem`, `precisionOverrides` (per quantity kind), `recentTools` (≤ 20), `pinnedTools` (≤ 30), `onboarding` (profession, task), `analyticsOptOut`, `lastSeenChangelog` |
| **Public API** | `settings.get@1` · `settings.set@1` · `settings.reset@1` · `settings.subscribe@1` · `settings.migrate@1` |
| **Input** | Key + value (validated against that key's schema), or a stored snapshot for migration |
| **Output** | Typed value; change events to subscribers; migrated snapshot; `SETTINGS_INVALID_VALUE` error |
| **Dependencies** | `core` |
| **Tests** | Schema and migration tests; storage-failure fallback (private mode, blocked storage) keeps the app working |
| **Golden fixtures** | Stored settings snapshots from each previous version |
| **Future MCP** | Never |

### 4.14 Analytics engine — `engines/analytics`

| Aspect | Specification |
|---|---|
| **Responsibilities** | Privacy-safe product analytics: an event catalogue (every event has a schema; properties are enums, booleans or numbers only — **no free text**); opt-out; `dataClass` guard (sensitive tools may send only allow-listed events with no content-derived properties); batching; injected transport port (first-party endpoint), console transport in dev, memory transport in tests |
| **Catalogue (initial)** | `tool_view`, `tool_run`, `tool_complete` (method: export/print/copy/save), `sample_load`, `import_start`, `import_success`, `export_click` (format), `gate_view` (capability), `gate_convert` (plan), `error` (code only), `search_query` (result count only, never the query text), `palette_open` |
| **Public API** | `analytics.track@1` · `analytics.page@1` · `analytics.flush@1` · `analytics.setOptOut@1` |
| **Input** | Event name + properties (validated against the catalogue), page-view descriptor (template id, tool id — never URL query strings) |
| **Output** | Nothing returned to callers (fire-and-forget); batched payloads handed to the transport port; `ANALYTICS_EVENT_INVALID` raised in dev/test so mistakes surface before release |
| **Dependencies** | `core`, `settings` |
| **Tests** | Every emitted event validated against the catalogue; non-catalogue events or string properties fail tests; sensitive-tool guard test |
| **Golden fixtures** | Expected payloads for each archetype's happy path |
| **Future MCP** | Never |

### 4.15 Not an engine, but essential: `packages/runtime`

The runtime binds **resolved preset + engine operation + UI archetype + entitlements** so that no tool ever needs custom glue code.

| Responsibility | Detail |
|---|---|
| Tool state machine | `idle → editing → running → result \| error`, with `cancelled`; live compute (debounced) for archetypes A/B, explicit run for C/D/E |
| Worker host | Lazy worker per engine bundle; dynamic import of the operation; transferables for binaries; cancellation via abort |
| Entitlements client | Verifies a signed, short-lived entitlement token with a public key; exposes `can(capability)` and free limits from `entitlements.yaml` |
| Drafts | Autosave through storage engine; restore prompt |
| Analytics hooks | Emits catalogue events at state transitions |
| Ports | Supplies browser adapters (localStorage, sendBeacon, share sheet, clipboard, print) to engines and UI |

---

## 5. Tool manifest specification

### 5.1 A tool folder

```
tools/rise-and-fall-calculator/
├── manifest.yaml        # This specification
├── content.md           # Below-the-fold content (§5.6)
├── fixtures/            # Tool-level fixtures: preset + input → expected (§5.7)
│   ├── 001-textbook-closed-loop.yaml
│   ├── 002-change-points.yaml
│   └── 003-misclosure-fail.yaml
└── media/               # Optional diagrams used by content.md (SVG preferred)
```

Scaffold with `pnpm new:tool <slug> --preset <preset-id> --category <category-id> --tier <T1|T2|T3|T4>`. The scaffold passes validation immediately except for fields that need real content.

### 5.2 Field reference

Legend: **R** required · **O** optional · **G** generated into the registry (never written in the manifest).

#### Identity & lifecycle

| Field | Type | R/O | Validation | Purpose |
|---|---|---|---|---|
| `manifestVersion` | integer | R | Equals the current schema version (starts at `1`) | Lets codemods migrate all manifests safely |
| `id` | string | R | Kebab-case, 3–60 chars, globally unique, **immutable once status ≠ alpha** (CI compares with `main`) | Stable identity for fixtures, analytics, saved sheets, reports, API |
| `slug` | string | R | Kebab-case, 3–60 chars, unique across tools, categories, content pages and `reserved-slugs.yaml` | URL path `/<slug>` |
| `previousSlugs` | string[] | O | Each globally unique, never reused | Generates 301 redirects |
| `status` | enum | R | `alpha` · `beta` · `stable` · `deprecated` | Lifecycle; alpha is hidden and noindex |
| `deprecation` | object | R if deprecated | `successor` (stable tool id), `reason`, `date` | Redirect target, notices |
| `tier` | enum | R | `T1` · `T2` · `T3` · `T4` | Quality bar, gating defaults, fixture minimums |
| `variantOf` | tool id | R if T4 | Target exists, is not T4, uses a preset from the same engine | Variant tabs, internal linking |
| `version` | semver | R | Bumped on any change to the tool folder (§5.8) | Traceability in reports |
| `changelog` | list | R | ≥ 1 entry; newest first; first entry's `version` = `version`; each: `version`, `date`, `type` (`added` · `changed` · `fixed` · `removed`), `summary` (≤ 140 chars) | `/changelog`, RSS, release notes |

#### Presentation

| Field | Type | R/O | Validation | Purpose |
|---|---|---|---|---|
| `name` | string | R | 3–60 chars, Title Case, unique | Default H1, cards |
| `shortName` | string | O | ≤ 24 chars | Tabs, compact nav |
| `summary` | string | R | 50–140 chars, one sentence | Cards, subtitle under H1 |
| `archetype` | enum | R | `A` · `B` · `C` · `D` · `E`; must be listed in the resolved preset's `ui.archetypes` | Layout |
| `preset` | preset id | R | Exists, not `abstract` | Behaviour |
| `sample` | sample id | O | Exists in resolved preset `samples`; defaults to the first sample | "Try sample" |
| `icon` | icon id | O | Exists in `assets/icons`; defaults to category icon | Cards |

#### Taxonomy

| Field | Type | R/O | Validation | Purpose |
|---|---|---|---|---|
| `taxonomy.category` | category id | R | Exists in `taxonomy/categories.yaml` | Breadcrumb, hub |
| `taxonomy.subcategory` | subcategory id | O (R once the category enables subcategories) | Belongs to the category | Hub sections |
| `taxonomy.professions` | id[] | O | 0–6, exist | `/for/…` pages |
| `taxonomy.tags` | id[] | O | 0–8, exist in controlled vocabulary | Filters |
| `taxonomy.synonyms` | string[] | O | 0–15, lowercase, ≤ 40 chars each, not equal to another tool's primary keyword | Search only (never new pages) |

#### Capabilities & gating

| Field | Type | R/O | Validation | Purpose |
|---|---|---|---|---|
| `capabilities.import` | format id[] | O | Each supported by the import engine **and** the resolved preset has column aliases | Import button |
| `capabilities.export` | format id[] | O | Each supported by the report engine for this preset's output kind | Export menu |
| `capabilities.batch` | boolean | O (false) | Requires archetype D | Multi-file queue |
| `capabilities.projects` | boolean | O (T1 true, else false) | T1 must be true | "Save to project" |
| `capabilities.print` | boolean | O (true) | — | Print |
| `capabilities.share` | boolean | O (true) | — | Share sheet (WhatsApp etc.) |
| `capabilities.embed` | boolean | O (false) | Only `dataClass: public` tools | `/embed/<slug>` |
| `gating` | map | O | Keys are capability keys from `entitlements.yaml`; values are policy ids from the same file | Overrides tier defaults (rarely used) |

#### Privacy & safety

| Field | Type | R/O | Validation | Purpose |
|---|---|---|---|---|
| `privacy.dataClass` | enum | R | `public` · `personal` · `sensitive`; must be ≥ the preset operation's `dataClass` | Badges, analytics guard, CSP, exposure |
| `privacy.network` | enum | R | `none` · `declared`; `sensitive` requires `none` unless label `privacy-exception` approved by founder | Badge, CSP `connect-src` |
| `privacy.networkUses` | list | R if declared | Each: `purpose`, `host` (in `site.config.yaml` allow-list), `dataSent` (`none` · `metadata` · `content`), `when` (`on-load` · `on-action`) | Honest disclosure |
| `disclaimer` | enum | R | `none` · `standard` · `professional` · `sensitive`; T1/T2 ≥ professional; sensitive data ⇒ sensitive | Disclaimer block |

#### SEO

| Field | Type | R/O | Validation | Purpose |
|---|---|---|---|---|
| `seo.title` | string | R | 30–60 chars; contains `primaryKeyword` (case-insensitive); unique | `<title>` |
| `seo.description` | string | R | 120–160 chars; unique | Meta description |
| `seo.primaryKeyword` | string | R | Unique across all tools (prevents keyword cannibalisation) | Title/H1 checks, relevance fixture |
| `seo.secondaryKeywords` | string[] | O | ≤ 8 | Content checks |
| `seo.h1` | string | O | Defaults to `name` | H1 |
| `seo.noindexReason` | string | O | Only field allowed to force `noindex` on a non-alpha tool; requires founder review | Rare exceptions |

#### Graph & quality

| Field | Type | R/O | Validation | Purpose |
|---|---|---|---|---|
| `graph.related` | tool id[] | O | ≤ 6, exist, not self; if empty, 4 are auto-selected (same engine, then same workflow, then same category) | Internal links |
| `graph.next` | tool id[] | O | ≤ 3, exist | "Next step" |
| `quality.verifiedAgainst` | list | R for T1/T2 | Each: `citation`, `locator` (example/page); every fixture citation must appear here | "Verified" panel |
| `quality.lastVerified` | date | R for T1/T2 | Not in the future; warning when older than 18 months | Freshness, trust |
| `locales` | string[] | O (`[en]`) | Each locale needs `content.<locale>.md` and preset strings | Future i18n |

### 5.3 Cross-field validation rules (all enforced by `scripts/validate/manifests`)

1. `slug`/`id` uniqueness across the whole registry; no collision with category slugs, content slugs or reserved words (`app`, `api`, `for`, `learn`, `workflows`, `compare`, `pricing`, `privacy`, `security`, `how-it-works`, `changelog`, `embed`, `search`, `static`, `assets`).
2. `status: stable` requires: content complete (§5.6), fixture minimum met (T1 3 · T2 2 · T3 1 · T4 1), all fixtures pass, `quality` fields present for T1/T2.
3. `tier: T4` requires `variantOf`, a distinct `seo.primaryKeyword`, and content whose text similarity with the parent's content is below 60% (shingle comparison) — guards against near-duplicate pages.
4. `archetype` ∈ resolved preset `ui.archetypes`.
5. Every `capabilities.import` format has a column mapping in the resolved preset; every `capabilities.export` format is supported for the preset's output kind.
6. `dataClass: sensitive` ⇒ `network: none`, `embed: false`, analytics guard enabled, disclaimer `sensitive`.
7. `deprecated` ⇒ successor exists and is `stable`; the deprecated slug becomes a redirect.
8. `graph.related`/`graph.next` never point to alpha or deprecated tools.
9. A category is shown in navigation only when it has ≥ 3 stable tools (computed).
10. Unknown keys fail validation (strict schema).

### 5.4 Generated registry fields (never authored)

`url` · `canonicalUrl` · `breadcrumbs` · `engineId` · `operationId@major` · `inputJsonSchema` · `paramsJsonSchema` · `outputJsonSchema` · `resolvedPresetHash` · `offline` (true when network is none) · `processingBadge` · `workflows` (from `taxonomy/workflows.yaml`) · `guides` (from `content/learn` front matter) · `relatedResolved` · `ogImage` · `jsonLd` · `searchDocument` · `sitemap.lastmod` (from git history of the tool folder and its preset chain) · `gatingMatrix` (capability → free limit / required entitlement) · `adapterNames` (MCP/provider tool names) · `contentHash` · `fixtureCount` · `performanceClass` (by archetype) · `completionEvent` (by archetype) · `noindex` (from status).

### 5.5 Complete example manifest

```yaml
manifestVersion: 1
id: rise-and-fall-calculator
slug: rise-and-fall-calculator
status: beta
tier: T1
version: 1.0.0
changelog:
  - version: 1.0.0
    date: 2026-11-02
    type: added
    summary: First public release with rise & fall reduction, arithmetic checks and misclosure test.

name: Rise and Fall Leveling Calculator
shortName: Rise & Fall
summary: Reduce levels by the rise and fall method with all arithmetic checks and a misclosure test.
archetype: C
preset: survey/leveling.rise-fall
sample: closed-loop-demo

taxonomy:
  category: surveying
  subcategory: leveling
  professions: [land-surveyors, civil-engineers, civil-engineering-students]
  tags: [leveling, field-book]
  synonyms: [rl calculator, reduced level calculator, level book calculator, rise fall method]

capabilities:
  import: [csv, xlsx]
  export: [pdf, xlsx, csv]
  projects: true
  share: true

privacy:
  dataClass: public
  network: none

disclaimer: professional

seo:
  title: Rise and Fall Leveling Calculator – Free Level Book
  description: Enter BS, IS and FS readings to reduce levels by the rise and fall method, run all three arithmetic checks and test misclosure. Free, no upload.
  primaryKeyword: rise and fall leveling calculator
  secondaryKeywords: [rise and fall method, reduced level calculation, leveling arithmetic check]

graph:
  related: [height-of-instrument-calculator, traverse-adjustment-calculator]
  next: [level-profile-plotter]

quality:
  verifiedAgainst:
    - citation: Standard university surveying textbook (author, title, edition recorded in fixture 001)
      locator: Worked example used in fixture 001
  lastVerified: 2026-10-28
```

(`level-profile-plotter` must exist before this manifest can reach `stable`; validation enforces it.)

### 5.6 `content.md` contract

- Front matter: `lastReviewed` (date), `example` (fixture id rendered as the worked-example table — **the table is generated from the fixture, so the page can never disagree with the engine**).
- Required H2 sections, in this order: `How to use` (ordered list, 3–7 steps) · `Method` (formulas in display math) · `Worked example` (narrative; table injected) · `FAQ` (3–8 H3 questions) · `References`.
- Optional H2 sections: `Understanding the results` · `Common mistakes` · `Standards and tolerances`.
- Length guidance enforced as warnings: T1 800–2,500 words · T2 500–1,800 · T3/T4 300–1,200.
- Links to other tools use `tool:<id>` references, resolved at build (broken references fail the build).

### 5.7 Tool-level fixture contract

Same format as engine fixtures (§3.6) with one difference: they reference the **preset** (`preset: survey/leveling.rise-fall`) instead of raw params. Engine fixtures prove the maths; tool fixtures prove the **preset configuration** produces the right visible result (e.g. rise/fall columns present, IS column hidden in fly-leveling).

### 5.8 Versioning

| Thing | Scheme | Bump rules |
|---|---|---|
| Tool (`version`) | SemVer | **MAJOR:** accepted input format breaks, capability removed, or URL changes · **MINOR:** new capability/variant/content section, or a correction that changes results (changelog type `fixed`, note "results may differ") · **PATCH:** copy, SEO, content fixes that cannot change results |
| Preset (`version`) | SemVer | Same rules applied to its resolved behaviour. A base-preset change does **not** force version bumps on every descendant tool; reports record the preset id + version + resolved hash instead |
| Operation | `@major` in id | New major for any breaking input/params/output change; previous major kept ≥ 6 months after the successor ships when exposed via API/MCP |
| Engine package | SemVer via Changesets | Mirrors the highest operation change |
| Manifest schema | `manifestVersion` integer | Platform lane only; ships with a codemod that migrates every manifest in the same PR |
| Site | CalVer `vYYYY.MM.N` | Per production release |

Every exported Pro report embeds: tool id@version, preset id@version + hash, operation id@major, engine version, site release. A professional can always answer "what computed this?".

### 5.9 Future compatibility

- **Strict schemas:** unknown keys fail (catches AI typos instead of silently ignoring them).
- **Deprecating a field:** mark deprecated in schema (warning) for one `manifestVersion`, remove in the next with a codemod.
- **Adding a required field:** add as optional with a generated default, run a codemod that writes explicit values, then make it required.
- **Locales:** content and strings already live in locale-suffixed files, so i18n is additive.

---

## 6. Preset system

### 6.1 What a preset is

A preset is **pure data** that configures one engine operation for a specific use: parameter defaults, which inputs and columns appear, units and precision, which checks and outputs show, samples, import aliases and report defaults. Tool pages, workspace sheets, the future API and MCP all run presets — that is why presets live in their own top-level folder.

**Rule of one:** one preset → exactly one primary operation. Multi-step jobs are workspace workflows (Phase 3), not presets.

### 6.2 Preset fields

| Field | R/O | Meaning | Validation |
|---|---|---|---|
| `presetVersion` | R | Schema version | Current value |
| `id` | R | `<engine>/<name>[.<variant>…]` | Must match file path `presets/<engine>/<name>[.<variant>].yaml` |
| `version` | R | SemVer | §5.8 |
| `extends` | O | Parent preset id | Same engine; no cycles; **max chain depth 3** |
| `abstract` | O (false) | Base-only; tools cannot reference it | — |
| `operation` | R on roots (inherited) | `id@major` | Children cannot change it |
| `params` | O | Defaults for the operation's `params` | Resolved result validated against the operation params schema |
| `locked` | O | Param paths the UI must not expose | Paths exist |
| `userOptions` | O | Map: param path → control hint (`toggle`, `select`, `number`) + label key | Paths exist, not locked |
| `fields` | O | Archetype A/B inputs, **keyed map** fieldId → `labelKey`, `kind`, `quantityKind`, `unit`, `precision`, `required`, `order`, `visible`, `helpKey` | Kinds match operation input schema |
| `columns` | O | Archetype C grid columns, **keyed map** columnId → `labelKey`, `kind`, `quantityKind`, `unit`, `precision`, `role` (`input` \| `computed`), `order`, `visible`, `width` (`s`/`m`/`l`), `importAliases` | Computed columns must map to output fields |
| `outputs` | O | Keyed map outputId → `labelKey`, `format`, `precision`, `order`, `visible`, `primary` | Exist in operation output |
| `checks` | O | Keyed map checkId → `visible`, `order` | Exist in the operation's check catalogue |
| `plots` | O | Keyed map plotId → `visible` | Exist in output |
| `samples` | O | Keyed map sampleId → `titleKey`, `input`, optional `params` | Validated against operation input schema; must run without error |
| `report` | O | `templateId`, section order, CSV/XLSX column list | Template exists |
| `ui` | R on roots | `archetypes` (list), `density` default, `compute` (`live` \| `explicit`), `mobileEditor` (`rowcard` \| `grid`) | — |
| `strings.en` | O | Label/help texts for keys introduced by this preset | Every referenced key resolves |

### 6.3 Inheritance semantics (deliberately simple)

1. Resolve the chain root → leaf.
2. **Scalars:** child replaces parent.
3. **Objects and keyed maps:** deep-merged by key. This is why columns, fields, outputs, checks and samples are *keyed maps with `order`*, not arrays — merging stays predictable.
4. **Arrays** (only simple lists such as `ui.archetypes`, `locked`, `importAliases`): child replaces the whole array.
5. **Hiding** an inherited entry: set `visible: false`. There is no "delete" — inheritance stays traceable.
6. **Never inherited:** `id`, `version`, `abstract`.
7. **Never changed by a child:** `operation`.
8. Resolution happens **at build time only**; output goes to `generated/presets/<id>.json` with `resolvedFrom` (the chain) and a content `hash`. The browser only ever sees resolved presets.

### 6.4 The boundary: preset change or engine change?

| The variant needs… | It is… |
|---|---|
| Different defaults, tolerances, method selection among existing strategies | **Preset only** |
| Different visible columns/fields/outputs/checks, labels, units, precision, order | **Preset only** |
| Different samples, import aliases, report template or columns | **Preset only** |
| A new formula, method, check, detector, file format or input type | **Engine change first** (new strategy/param + fixtures), then a preset |
| Any expression or calculation inside YAML | **Forbidden.** Presets never contain formulas, so no hidden mini-language ever appears |

### 6.5 Worked inheritance chain

```
survey/leveling.base              (abstract — operation survey.leveling.reduce@1)
├── survey/leveling.rise-fall     (method: rise-fall; shows Rise, Fall columns)
│   ├── survey/leveling.rise-fall.fly      (hides IS column; no intermediate sights)
│   └── survey/leveling.rise-fall.imperial (feet, 2 decimals, allowable misclosure in ft)
└── survey/leveling.hi            (method: height-of-instrument; shows HI column)
```

**`presets/survey/leveling.base.yaml`**
```yaml
presetVersion: 1
id: survey/leveling.base
version: 1.0.0
abstract: true
operation: survey.leveling.reduce@1
params:
  misclosure: { mode: constant-root-k, constantMm: 12 }
  distribution: none
  showWorking: true
userOptions:
  misclosure.constantMm: { control: number, labelKey: leveling.option.misclosureConstant }
  distribution: { control: select, labelKey: leveling.option.distribution }
columns:
  station: { labelKey: leveling.col.station, kind: text, role: input, order: 10, width: m,
             importAliases: [station, stn, point, pt] }
  bs:      { labelKey: leveling.col.bs, kind: quantity, quantityKind: length, unit: m, precision: 3,
             role: input, order: 20, width: s, importAliases: [bs, b.s, backsight, back sight] }
  is:      { labelKey: leveling.col.is, kind: quantity, quantityKind: length, unit: m, precision: 3,
             role: input, order: 30, width: s, importAliases: [is, i.s, intermediate] }
  fs:      { labelKey: leveling.col.fs, kind: quantity, quantityKind: length, unit: m, precision: 3,
             role: input, order: 40, width: s, importAliases: [fs, f.s, foresight, fore sight] }
  rl:      { labelKey: leveling.col.rl, kind: quantity, quantityKind: length, unit: m, precision: 3,
             role: computed, order: 80, width: m }
  remarks: { labelKey: leveling.col.remarks, kind: text, role: input, order: 90, width: l }
report: { templateId: survey-level-book }
ui: { archetypes: [C], density: compact, compute: live, mobileEditor: rowcard }
```

**`presets/survey/leveling.rise-fall.yaml`**
```yaml
presetVersion: 1
id: survey/leveling.rise-fall
version: 1.0.0
extends: survey/leveling.base
params: { method: rise-fall }
locked: [method]
columns:
  rise: { labelKey: leveling.col.rise, kind: quantity, quantityKind: length, unit: m, precision: 3,
          role: computed, order: 50, width: s }
  fall: { labelKey: leveling.col.fall, kind: quantity, quantityKind: length, unit: m, precision: 3,
          role: computed, order: 60, width: s }
checks:
  arithmetic-bs-fs:     { visible: true, order: 10 }
  arithmetic-rise-fall: { visible: true, order: 20 }
  arithmetic-first-last:{ visible: true, order: 30 }
  misclosure:           { visible: true, order: 40 }
samples:
  closed-loop-demo:
    titleKey: leveling.sample.closedLoop
    params: { startRL: 100.000, closingRL: 100.000 }
    input:
      observations:
        - { station: BM1, bs: 1.585 }
        - { station: A,   is: 1.925 }
        - { station: CP1, fs: 2.100, bs: 1.450 }
        - { station: C,   is: 0.985 }
        - { station: BM1, fs: 0.955, remarks: closing }
```

**`presets/survey/leveling.hi.yaml`**
```yaml
presetVersion: 1
id: survey/leveling.hi
version: 1.0.0
extends: survey/leveling.base
params: { method: height-of-instrument }
locked: [method]
columns:
  hi: { labelKey: leveling.col.hi, kind: quantity, quantityKind: length, unit: m, precision: 3,
        role: computed, order: 70, width: m }
checks:
  arithmetic-bs-fs:      { visible: true, order: 10 }
  arithmetic-first-last: { visible: true, order: 20 }
  misclosure:            { visible: true, order: 30 }
```

**`presets/survey/leveling.rise-fall.fly.yaml`** — a future variant with zero code:
```yaml
presetVersion: 1
id: survey/leveling.rise-fall.fly
version: 1.0.0
extends: survey/leveling.rise-fall
columns:
  is: { visible: false }
```

The sample reduces to a closing RL of 99.980 m: ΣBS − ΣFS = ΣRise − ΣFall = Last RL − First RL = −0.020 m, i.e. a 20 mm misclosure that the check panel then tests against the allowable value. The validator runs every sample through the engine and rejects any sample that errors.

The same pattern gives the privacy engine its profiles:

```
privacy/text.base                    (abstract — privacy.text.detect@1 + transform settings)
├── privacy/text.hipaa-safe-harbor   (18 identifier categories, mode: redact)
├── privacy/text.pii-general         (email, phone, address, IDs)
├── privacy/text.india-personal      (Aadhaar with Verhoeff check, PAN, +91 phones, PIN codes)
├── privacy/text.dev-secrets         (API keys, tokens, JWTs, connection strings)
└── privacy/text.safe-paste-ai       (pii-general detectors, mode: reversible, pseudonym style: role labels)
```

---

## 7. Taxonomy and content data contracts

| File | Contents | Validation |
|---|---|---|
| `taxonomy/categories.yaml` | id, slug, name, summary, icon, order, `subcategoriesEnabled`, subcategories (id, slug, name, order) | Slugs unique globally; 9 categories from the frozen architecture |
| `taxonomy/professions.yaml` | id, slug, name, summary, featured tool ids, workflow ids | Tool/workflow ids exist |
| `taxonomy/tags.yaml` | id, label, description | Controlled vocabulary; unused tags warn |
| `taxonomy/workflows.yaml` | id, slug, name, summary, ordered steps (tool id + label key), professions | Tools exist and are ≥ beta |
| `taxonomy/synonyms.yaml` | Global synonym groups (e.g. `rl` ↔ `reduced level`) | Used by search index only |
| `taxonomy/reserved-slugs.yaml` | Words no tool/category/content may use | — |
| `content/learn/*.md` | Front matter: title, description, tools (ids), updated, reviewed | Title 30–60, description 120–160, tools exist |
| `content/for/*.md` | Front matter: profession id, title, description | Profession exists |
| `content/workflows/*.md` | Front matter: workflow id, title, description | Workflow exists |
| `content/compare/*.md` | Front matter: title, description, tools | Phase 4+ |
| `content/pages/*.md` | Legal/trust pages | Human-only lane |
| `site.config.yaml` | Per environment: base URL, indexable (bool), analytics endpoint; brand name, parent brand, support email; `allowedNetworkHosts`; feature flags | The domain decision (frozen architecture §13) lives here — changing it is a one-line edit |
| `entitlements.yaml` | Capability keys (`export.pdf.branded`, `import.tabular`, `import.instrument`, `projects.unlimited`, `sync.encrypted`, `batch.large`, `report.composer`, `brand.kit`), free-limit policies (e.g. import ≤ 50 rows, batch ≤ 3 files, 1 local project), tier defaults, plan bundles (free, pro, pass-24h, team, education) | Human-only; code checks capabilities, never plan names |

---

## 8. Build pipeline

Every step is a script in `scripts/` that runs identically on a laptop and in CI. CI only orchestrates.

### 8.1 Root commands

| Command | Does | Who runs it |
|---|---|---|
| `pnpm dev` | Generate (watch mode) + Astro dev server | Humans, agents for UI work |
| `pnpm gen` | Stages 5–16 → `generated/` | Automatically by other commands |
| `pnpm verify` | Stages 1–13 (no site build) — **the command every agent runs before opening a PR** | Agents, pre-push hook |
| `pnpm build` | `gen` + Astro build + post-build checks (stages 17–18) | CI, humans |
| `pnpm test:e2e` · `test:a11y` · `test:perf` | Playwright suites, Lighthouse | CI, humans |
| `pnpm new:<tool\|preset\|operation\|engine\|component\|adr>` | Scaffolders that produce valid skeletons | Agents, humans |

### 8.2 Stages

| # | Stage | Reads | Writes | Fails when |
|---|---|---|---|---|
| 1 | Environment check | `.node-version`, lockfile | — | Wrong Node/pnpm; lockfile out of sync |
| 2 | Format & lint (Biome) | All source and data | — | Any lint error or unformatted file |
| 3 | Typecheck | TypeScript project references | — | Any type error |
| 4 | Architecture checks | Source | — | Forbidden import (§2.4); file > 400 lines; function > 60 lines; cyclomatic complexity > 10 |
| 5 | Schema build | `schemas/src` | `generated/schemas/*.json` | Invalid schema definitions |
| 6 | Taxonomy validation | `taxonomy/` | — | Duplicate slugs, missing references |
| 7 | Preset resolution & validation | `presets/`, operation schemas | `generated/presets/*.json` | Cycles, depth > 3, invalid params, unknown columns/checks, **any sample that fails to run** |
| 8 | Manifest validation | `tools/*/manifest.yaml`, resolved presets, taxonomy, entitlements, git history (id immutability) | — | Schema error or any rule in §5.3 |
| 9 | Content validation | `tools/*/content.md`, `content/**` | — | Missing required sections, invalid front matter, unresolved `tool:` references, T4 similarity > 60% |
| 10 | Licence validation | Lockfile + package metadata | — | Any licence outside the ADR-0008 allow-list |
| 11 | Engine tests | `engines/*` | Coverage report | Failing unit/property/fixture test; engine line coverage < 90% |
| 12 | Tool fixture tests | `tools/*/fixtures`, resolved presets | — | Any mismatch beyond tolerance |
| 13 | Quality gates | Privacy corpus, search relevance suite | Metrics report | Privacy recall/precision below thresholds; relevance < 95% |
| 14 | Registry | Everything above | `generated/registry.json` | — |
| 15 | Derived artefacts | Registry | See §8.3 | Generator error |
| 16 | Adapter snapshots | `generated/adapters/*` | — | Provider constraint violated; unapproved snapshot diff |
| 17 | Static build (Astro) | `apps/web` + `generated/` | `dist/` | Build error |
| 18 | Post-build checks | `dist/` | Reports | SEO audit, privacy scan, internal broken links, bundle-size budgets (§11.3) |
| 19 | E2E + accessibility | Local server on `dist/` | Traces | Any failure |
| 20 | Performance | Preview deployment | Lighthouse reports | Budget breach |
| 21 | Deploy | `dist/` | Environment | — |

### 8.3 Generated artefacts

| Artefact | Built from | Rules |
|---|---|---|
| **Routes** | Registry | One static page per stable/beta tool, category, subcategory, profession, workflow, guide; alpha tools get no route in production builds |
| **Navigation** | Taxonomy + registry | Mega menu (top 4 tools per category by manifest order, then a committed popularity file), footer index, breadcrumbs |
| **Category & profession pages** | Registry + taxonomy + `content/for` | Only categories with ≥ 3 stable tools render |
| **Related / next links** | Manifest graph + auto-fill | Never link to alpha/deprecated |
| **Search index** | Registry + guides + synonyms | Budget ≤ 150 KB compressed |
| **Sitemaps** | Registry | `sitemap-index.xml` → `sitemap-tools.xml`, `-categories.xml`, `-learn.xml`, `-pages.xml`; indexable pages only; `lastmod` from git |
| **robots.txt** | `site.config.yaml` | Production: allow + sitemap URL. All other environments: disallow all |
| **Redirects** (`_redirects`) | `previousSlugs`, deprecations | 301s; trailing-slash normalisation |
| **Headers** (`_headers`) | Registry privacy fields + site config | Per-page CSP (`default-src 'self'`; `connect-src 'self'` + declared hosts only; no third-party scripts; `frame-ancestors` open only on `/embed/*`), HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Robots-Tag: noindex` outside production; immutable caching for hashed assets |
| **OpenGraph images** | Template in `assets/og` + name/category | 1200×630 PNG per indexable page; cached by content hash |
| **JSON-LD** | Registry + content | `Organization` + `WebSite` (home), `BreadcrumbList` (all pages), `WebApplication` (tools: free offer, browser-based), `Article` (guides), `ItemList` (hubs), `FAQPage` from tool FAQ (kept for users and answer engines; not relied on for rich results) |
| **RSS/Atom** | Manifest changelogs, releases, guides | `/changelog.xml`, `/new-tools.xml`, `/learn.xml` |
| **Changelog page data** | Same as RSS | Grouped by date, filterable by category |
| **Adapter definitions** | Operation descriptors + presets | `mcp-tools.json`, `anthropic-tools.json`, `openai-tools.json`, `gemini-tools.json`, `openapi.json` |
| **Engine API tables** | Operation descriptors | Inserted between markers in each engine `README.md` |

### 8.4 Environments

| Environment | Trigger | Indexable | Analytics | Robots |
|---|---|---|---|---|
| Local | `pnpm dev` | No | Console transport | Disallow |
| Preview (per PR) | PR build | No (`X-Robots-Tag: noindex`) | Off | Disallow |
| Staging | Merge to `main` | No | Test endpoint | Disallow |
| Production | Release workflow | Yes | On (cookieless) | Allow + sitemap |

### 8.5 Scale budgets (500 tools, ~1,300 pages)

`pnpm gen` ≤ 90 s · Astro build ≤ 5 min · PR CI end-to-end ≤ 12 min · nightly ≤ 45 min. Validation and fixture tests always run in full (pure functions are fast); E2E runs archetype smoke + changed tools + all T1 tools on PRs, and everything nightly; OG images are regenerated only when their content hash changes.

---

## 9. AI coding workflow

### 9.1 Principles

1. **Scaffold first.** Agents start every new thing with `pnpm new:*` so structure is correct before logic exists.
2. **Test first for bugs.** Reproduce with a failing fixture or test, then fix.
3. **Fixtures are truth** (§9.6).
4. **One lane per change** (§2.3).
5. **Verify locally.** `pnpm verify` must pass before a PR is opened; the summary goes in the PR.
6. **Stop and ask** when a stop condition is hit (§9.10) instead of improvising.
7. **Read little, precisely.** Agents use `generated/registry.json` and lane `AGENTS.md` files to find things instead of reading the whole repository.

### 9.2 Context-loading order for any agent

1. `AGENTS.md` (root)
2. `docs/00-index.md`
3. The lane's `AGENTS.md` (`engines/<name>/AGENTS.md`, `tools/AGENTS.md`, `packages/ui/AGENTS.md`, `apps/web/AGENTS.md`)
4. The playbook for the task type (`docs/playbooks/…`)
5. `docs/glossary.md` sections for the domain
6. Only then, the specific files named in the issue

### 9.3 Task sizing

| Size | Code diff (excluding fixtures, content, snapshots) | Rule |
|---|---|---|
| S | ≤ 150 changed lines, ≤ 5 code files | Ideal agent task |
| M | ≤ 400 changed lines, ≤ 12 code files | Acceptable |
| L | Larger | **Must be split** before it can be labelled `status:ready-for-agent` |

### 9.4 Code rules (enforced by lint and `scripts/check/code-size`)

| Rule | Limit |
|---|---|
| Source file length | Warn 300 lines · fail 400 |
| Test file length | Fail 600 lines |
| Function length | Warn 40 lines · fail 60 |
| Cyclomatic complexity | ≤ 10 |
| Nesting depth | ≤ 3 |
| Positional parameters | ≤ 3 (otherwise one options object) |
| Exports per file | One primary concept; no default exports |
| Types | No `any`; no non-null assertions outside tests |
| Engines | No classes (plain functions + data), no module-level mutable state, no `console`, no `Date`/`Math.random` (use `ctx`), no network APIs |
| Errors | Engines return typed errors; never throw for user input |
| YAML data files | Manifest ≤ 200 lines; preset ≤ 250 lines |
| Comments | Explain *why*, not *what*; every operation README cites formula sources |

### 9.5 Folder and naming rules

| Thing | Convention | Example |
|---|---|---|
| Folders & files | kebab-case | `leveling-reduce/`, `rise-fall.ts` |
| Types | PascalCase | `LevelingObservation` |
| Functions & variables | camelCase, verb-first functions | `computeRiseFall` |
| Operation ids | `engine.domain.verb` | `survey.traverse.adjust` |
| Preset ids | `engine/name.variant` | `survey/leveling.rise-fall.fly` |
| Tool slugs | The search phrase, kebab-case | `bowditch-traverse-calculator` |
| Fixtures | `NNN-kebab-description.yaml` | `004-link-traverse-transit.yaml` |
| Error codes | `ENGINE_DOMAIN_REASON` | `SURVEY_LEVELING_NO_BACKSIGHT` |
| i18n keys | `area.object.name` | `leveling.col.bs` |
| Analytics events | snake_case | `tool_complete` |
| Test files | `*.test.ts` beside the code; property tests `*.prop.test.ts` | `run.test.ts` |
| Branches | §10.6 | `tool/42-rise-and-fall-calculator` |

Folder rules: one operation per folder; strategies in `strategies/` (one file each); no `utils/` or `helpers/` folders anywhere (use a named module in `lib/` with a specific purpose); every folder with more than 3 files has a `README.md` stating its purpose.

### 9.6 Fixture immutability (ADR-0007)

- Agents may **add** fixtures freely (with a source).
- Agents may **not change `expected` values or tolerances** in existing fixtures. The `fixture-guard` check fails any PR that does, unless the PR carries the label `risk:fixture-change`, which only the founder applies after checking the cited source.
- If code disagrees with a fixture, the agent must assume the **code** is wrong. If it believes the fixture is wrong, it stops and writes the evidence in the issue.

**Why:** the most common AI coding failure is "making tests pass" by editing the tests. For professional calculators, that would silently ship wrong numbers.

### 9.7 Commit and PR rules

- **Conventional Commits**, scope = lane: `feat(engine-survey): add transit rule strategy` · `feat(tools): add height-of-instrument-calculator` · `fix(preset): hide IS column in fly leveling` · `docs(content): add traverse FAQ` · `ci: cache OG images`.
- **Squash merge only**; the PR title becomes the commit message (validated).
- One PR closes exactly one issue (`Closes #<n>`).
- Engine or package changes include a changeset; tool changes include a version bump + changelog entry.
- PR body uses the template (Appendix C.1), including the `pnpm verify` summary.

### 9.8 Autonomy and auto-merge

| Change type | Auto-merge eligible? |
|---|---|
| New T3/T4 tool on an existing, stable preset | ✅ when all checks pass |
| Content edits on T3/T4 tools and guides | ✅ |
| New fixtures (additions only) with sources | ✅ |
| Docs typo/format fixes | ✅ |
| New preset variant | ❌ founder review |
| T1/T2 tools, any engine change, UI components | ❌ founder review |
| Platform, schemas, apps, CI, entitlements, legal content | ❌ deep review |

Eligibility is computed by `pr-policy` from changed paths — an agent cannot self-declare it.

### 9.9 Playbooks (summary; full versions in `docs/playbooks/`)

| Playbook | Steps |
|---|---|
| **Add tool (existing preset)** | 1. `pnpm new:tool` · 2. fill manifest fields · 3. write `content.md` · 4. add fixtures to tier minimum · 5. `pnpm verify` · 6. `pnpm dev` and run the sample · 7. PR |
| **Add preset variant** | 1. `pnpm new:preset <engine>/<name> --extends <parent>` · 2. set params/visibility/samples · 3. add ≥ 1 tool-level fixture exercising it · 4. verify · 5. PR |
| **Add engine operation** | 1. Issue with ADR-lite (inputs, params, outputs, errors, sources) approved · 2. `pnpm new:operation` · 3. write schemas · 4. add golden fixtures from sources (failing) · 5. implement strategies until fixtures pass · 6. property tests · 7. README with formulas and citations · 8. changeset · 9. verify · 10. PR |
| **Add engine** | ADR required → `pnpm new:engine` → add to boundary whitelist (platform PR) → first operation via the playbook above |
| **Fix bug** | 1. Reproduce · 2. add failing fixture/test · 3. fix in the smallest scope · 4. version bump (tool) or changeset (engine) · 5. PR linking both |
| **Write content** | Follow the §5.6 contract; worked example references a fixture; cite sources; no invented statistics |
| **Add UI component** | Entry in the component reference page, all states (empty, filled, error, disabled, loading), keyboard and axe tests, light/dark/compact |
| **Release** | Founder triggers the release workflow; checks generated notes; verifies production smoke |

### 9.10 Stop conditions (agent must stop and comment on the issue)

1. The change needs a schema, contract or public API change not described in the issue.
2. The change would touch a second lane.
3. A fixture appears wrong, or sources disagree.
4. A new dependency seems necessary.
5. Anything touching auth, payments, entitlements, CSP, privacy guards or legal text.
6. `pnpm verify` fails for reasons outside the task's scope.
7. The task is larger than size M once understood.

### 9.11 Acceptance tests by task type

| Task type | Accepted when |
|---|---|
| New tool | `pnpm verify` green · page renders in preview at `/<slug>` · sample loads and completes · fixtures ≥ tier minimum pass · Lighthouse on the page meets budgets · appears in category, search, sitemap · no network requests during processing (privacy test) |
| New preset | Resolves without warnings · all samples run · at least one fixture exercises it · no formula-like content |
| New operation | All golden fixtures pass (≥ 3 cited for survey-class operations) · property tests pass · descriptor complete (incl. `llm` fields if exposed) · adapter snapshots updated and valid · README cites sources |
| Bug fix | New failing test/fixture now passes · no fixture expected values changed · version/changeset added |
| Content | Required sections present · links resolve · SEO audit passes · word-count warnings addressed |
| UI component | All states documented · axe passes · keyboard path test passes · size budget unchanged or approved |
| Platform/CI | Documented in the relevant playbook/ADR · dry-run output attached to PR |

### 9.12 Review checklist (founder and AI reviewer)

- [ ] Stays within one lane; closes one issue
- [ ] No fixture `expected`/`tolerance` changes (or `risk:fixture-change` approved with source)
- [ ] No new dependencies (or approved `risk:dependency` with licence check)
- [ ] Engines: pure (no DOM/network/clock/random), typed errors, operation README updated
- [ ] File/function limits respected; no `utils` dumping
- [ ] Privacy: no user content in logs or analytics; `dataClass` correct; CSP unaffected or approved
- [ ] Accessibility: keyboard, labels, focus, contrast tokens only
- [ ] i18n: no hard-coded user-facing strings outside string files
- [ ] SEO: title/description/keyword rules met (tools and content)
- [ ] Versions: tool version + changelog or changeset present
- [ ] Docs: playbook/ADR/glossary updated if behaviour or vocabulary changed
- [ ] `pnpm verify` summary in PR matches CI

### 9.13 The AI reviewer

A second agent reviews every agent PR with the prompt in Appendix B.7 and posts the checklist with findings. It is advisory: it never approves or merges. Its value is catching lane violations, missing fixtures and privacy slips before the founder spends time.

### 9.14 Founder operating rhythm (≈ 30–45 minutes a day)

1. **Triage** new issues: add type/lane/size/priority; split L issues; mark `status:ready-for-agent` + `agent:ok`.
2. **Review queue**: PRs labelled `status:needs-review`, oldest first; the AI-review comment is already present.
3. **Approve fixture changes and ADRs** only with sources.
4. **Release** (weekly, or when a milestone item lands) via the release workflow.

---

## 10. GitHub strategy

### 10.1 Repository settings

- One repository, `mangotools`, private until you decide otherwise. Hosting it under a free GitHub **organization** keeps the bot identity, CODEOWNERS and future collaborators clean.
- Default branch `main`. **Squash merge only**; auto-delete head branches; allow auto-merge; linear history.
- **Ruleset on `main`:** pull request required; required checks = `quality`, `validate`, `test`, `build`, `e2e`, `pr-policy`; conversations resolved; no force pushes; no direct pushes (including the founder — use PRs).
- **Approvals:** the ruleset requires 0 generic approvals so auto-merge lanes work; `pr-policy` enforces a founder approval for every change that is not auto-merge eligible (it reads the PR's reviews), and CODEOWNERS adds mandatory review on restricted paths.
- Agents open PRs through the Claude GitHub App (or one dedicated machine account). The founder's account is never used by automation.
- Dependabot alerts on. Secret scanning and push protection on where the GitHub plan includes them; otherwise the `gitleaks` scans in `pr-policy` and `housekeeping` cover it.

### 10.2 Issues

Blank issues are disabled; every issue comes from a form (full field lists in Appendix C). An issue is **agent-ready** only when it has: type, lane, size (S/M), acceptance criteria, and the files/ids involved.

| Template | Used for | Default labels |
|---|---|---|
| Bug report | Wrong result, broken UI, failed export | `type:bug`, `status:needs-triage` |
| New tool | A tool on an existing or planned preset | `type:tool`, `status:needs-spec` |
| Feature / enhancement | Capability for existing tools or platform | `type:feature`, `status:needs-spec` |
| Engine change | New operation, strategy, error code, or breaking change | `type:engine`, `status:needs-spec`, `risk:schema-change` if contract changes |
| Content | Guides, tool content, profession pages | `type:content` |
| Tech debt | Refactors, test gaps, performance | `type:debt` |

### 10.3 Labels (catalogue in `.github/labels.yml`, one colour per prefix)

| Prefix | Labels |
|---|---|
| `type:` | `bug` · `tool` · `preset` · `engine` · `feature` · `content` · `ui` · `platform` · `ci` · `docs` · `debt` · `release` |
| `lane:` | `platform` · `ui` · `tools` · `content` · `ci` · `docs` · `engine-units` · `engine-grid` · `engine-survey` · `engine-data` · `engine-pdf` · `engine-image` · `engine-privacy` · `engine-import` · `engine-report` · `engine-storage` · `engine-ai` · `engine-search` · `engine-settings` · `engine-analytics` |
| `status:` | `needs-triage` · `needs-spec` · `ready-for-agent` · `in-progress` · `needs-review` · `changes-requested` · `blocked` |
| `priority:` | `p0` (production broken) · `p1` (this milestone) · `p2` (next) · `p3` (someday) |
| `size:` | `s` · `m` · `l` (L = must split) |
| `tier:` | `t1` · `t2` · `t3` · `t4` |
| `category:` | `surveying` · `construction` · `logistics` · `privacy` · `business` · `developer` · `pdf` · `media` · `utilities` |
| `risk:` | `fixture-change` · `schema-change` · `breaking` · `dependency` · `security` · `privacy` · `cross-lane` · `seo` |
| `agent:` | `ok` (agent may take it) · `human-only` |
| Single | `auto-merge` (applied by `pr-policy` only) · `good-first-agent-task` |

### 10.4 Milestones = roadmap phases

| Milestone | Exit criteria (from the frozen architecture) |
|---|---|
| `M0 Foundations` | A calculator can be added with preset + manifest only; CI, deploy, CSP, analytics catalogue live |
| `M1 Public beta` | Rise & Fall, HI, Bowditch/Transit, PII/PHI text scrubber + ~12 generic tools stable; Core Web Vitals green; pages indexed |
| `M2 Pro launch` | Accounts, payments, entitlements, import, branded reports, local projects, day pass |
| `M3 Workspace` | Encrypted sync, workspace, report composer, instrument import, DXF, offline Field Mode, Safe Paste extension |
| `M4 Expansion` | Construction and logistics suites, Team plan, Education, embeds, legal PDF tools |
| `M5 AI & platform` | On-device OCR/NER features, API, remote and local MCP |

### 10.5 GitHub Project ("MangoTools Delivery")

- **Fields:** Status (Backlog · Spec'd · Ready for agent · In progress · In review · Done), Lane, Milestone, Size, Tier, Priority, Owner type (Agent · Founder).
- **Views:** *Board* by Status · *Agent queue* (Ready for agent + `agent:ok`, sorted by priority) · *Roadmap* by Milestone · *Tool catalogue* (`type:tool`, grouped by category) · *Review queue* (In review, oldest first).
- **Built-in automations:** item added → Backlog; PR opened → In review; PR merged → Done; issue closed → Done.

### 10.6 Branch naming

`<type>/<issue-number>-<short-kebab-summary>`, where type ∈ `tool`, `preset`, `engine`, `feat`, `fix`, `content`, `ui`, `platform`, `ci`, `docs`, `debt`.
Examples: `tool/42-rise-and-fall-calculator` · `engine/57-survey-traverse-transit` · `fix/88-leveling-blank-cells`. Branches without an issue number are rejected by `pr-policy`.

### 10.7 Releases and tags

| Item | Scheme | Example |
|---|---|---|
| Site release tag | `vYYYY.MM.N` (N restarts each month) | `v2026.11.2` |
| GitHub Release title | `MangoTools vYYYY.MM.N — <headline>` | `MangoTools v2026.11.2 — Transit rule for traverse adjustment` |
| Release notes | Generated from merged PR titles grouped by `type:` label + new/changed tools from manifest changelogs; founder edits the headline | `content/releases/v2026.11.2.md` |
| Package versions | SemVer via Changesets, recorded in each `CHANGELOG.md` | `@mangotools/engine-survey 1.3.0` |
| Package tags | Only when packages are published (Phase 5 local MCP/API SDK): `@mangotools/engine-survey@1.3.0` | — |

### 10.8 CODEOWNERS (single human; marks restricted paths)

The founder owns: `/AGENTS.md`, `/CLAUDE.md`, `/site.config.yaml`, `/entitlements.yaml`, `/schemas/`, `/packages/core/`, `/packages/runtime/`, `/packages/adapters/`, `/apps/`, `/scripts/`, `/.github/`, `/content/pages/`, `/docs/architecture/`, `/docs/adr/`, `/engines/*/src/operations/*/schema.ts`, `/engines/*/src/operations/*/fixtures/`, `/presets/*/*.base.yaml`.

---

## 11. Automation

### 11.1 Workflow catalogue (`.github/workflows/`)

| # | Workflow | Trigger | Jobs | Required on PR |
|---|---|---|---|---|
| 1 | `ci` | PR, push to `main` | `quality` (Biome, typecheck, architecture checks) → `validate` (schemas, taxonomy, presets, manifests, content, licences) → `test` (engines, tool fixtures, quality gates, adapter snapshots) → `build` (gen, Astro build, post-build checks, upload `dist` artefact) → `e2e` (Playwright smoke per archetype + changed tools + all T1 tools, axe scans, network-blocked privacy runs) | ✅ all five |
| 2 | `pr-policy` | PR opened/edited/synchronised/labelled, review submitted | Conventional PR title · branch name · linked issue · **lane check** (changed paths ⇒ one lane) · **fixture guard** · version/changelog/changeset check · PR size check · protected-path check (bot changed human-only path ⇒ fail) · dependency/licence diff · secret scan of the diff (gitleaks) · founder-approval requirement · computes and applies `auto-merge` eligibility | ✅ |
| 3 | `preview` | After `ci/build` succeeds on a PR | Deploy `dist` to a per-PR preview URL; comment the URL; run Lighthouse CI on the fixed page sample + changed tool pages; comment results | Lighthouse budgets ✅ |
| 4 | `staging` | Push to `main` | Deploy to staging; live smoke (key pages 200, headers present, robots disallow) | — |
| 5 | `release` | Manual (`workflow_dispatch`) by founder, optional `ref` input | Compute CalVer; draft notes; tag; GitHub Release; deploy production; post-deploy smoke (sitemap reachable, robots allow, canonical host, CSP present, 20 sampled tool pages run their sample in a headless browser); open rollback issue automatically on failure | — |
| 6 | `rollback` | Manual with `tag` input | Rebuild and deploy the given tag to production; smoke | — |
| 7 | `changesets` | Push to `main` | Open/refresh the "Version packages" PR (engine/package versions + changelogs) | — |
| 8 | `nightly` | Daily 20:30 UTC (02:00 IST) | Full E2E over every tool; full axe over every page type and state; external links (content references) with lychee; Lighthouse on production (fixed sample + 20 rotating tools); production SEO checks; dependency audit; bundle-size trend; opens/updates one issue per regression | — |
| 9 | `agent` | Issue labelled `status:ready-for-agent` **and** `agent:ok`, or an `@claude` comment by the founder | Runs the Claude Code GitHub Action with the playbook prompt for the issue type (Appendix B); scoped token (contents + PRs + issues on this repo only); concurrency limit 2; opens a PR and moves the issue to In review | — |
| 10 | `ai-review` | PR marked ready for review (bot-authored) | Runs the reviewer prompt (B.7); posts checklist comment; adds `status:needs-review` | — (advisory) |
| 11 | `auto-merge` | `pr-policy` applied `auto-merge` and all checks green | Enables GitHub auto-merge (squash) | — |
| 12 | `labels` | Push changing `.github/labels.yml` | Syncs the label catalogue | — |
| 13 | `housekeeping` | Weekly | Marks stale agent PRs (14 days) and closes them after 7 more; security audit; full-history secret scan (gitleaks) | — |

Dependabot (config file, not a workflow): weekly, grouped by ecosystem; dev-dependency patch updates are auto-merge eligible; everything else is reviewed.

### 11.2 Checks in detail

| Area | What is checked | Where | Failure policy |
|---|---|---|---|
| **Testing** | Unit, property, golden fixtures (engines + tools), privacy corpus gates, search relevance | `ci/test` | Hard fail |
| **Linting** | Biome rules, architecture boundaries, file/function size, complexity | `ci/quality`, lefthook pre-commit on staged files | Hard fail |
| **Versioning** | Tool folder changed ⇒ `version` bumped + changelog entry; preset changed ⇒ preset `version` bumped; engine/package changed ⇒ changeset present; `manifestVersion` change only with codemod | `pr-policy` | Hard fail |
| **Manifest validation** | Schema + all §5.3 rules + id immutability | lefthook pre-commit (changed files) + `ci/validate` (all) | Hard fail |
| **Broken links** | Internal links, anchors, `tool:` references, redirects in `dist` | `ci/build` | Hard fail |
| | External reference links | `nightly` | Opens issue |
| **Performance** | Bundle budgets: archetype A/B island ≤ 60 KB, C ≤ 120 KB, D/E ≤ 90 KB (compressed, excluding lazy WASM); each engine chunk declared in `cost`; Lighthouse mobile: Performance ≥ 90, LCP ≤ 1.8 s, TBT ≤ 200 ms, CLS ≤ 0.05 | `ci/build` (size), `preview` (Lighthouse), `nightly` (production) | Hard fail on PR; issue at night |
| **Accessibility** | axe on every template and every archetype state (empty, filled, error, result, upgrade sheet open, dark mode); keyboard path tests for grid, dialogs, command palette; Lighthouse Accessibility = 100 | `ci/e2e`, `nightly` | Hard fail |
| **SEO** | Each indexable page: unique title (≤ 60) and description (120–160), exactly one H1, absolute self-canonical, OG tags, valid JSON-LD types, breadcrumb = taxonomy, ≥ 3 internal links, no orphan pages, sitemap = indexable set exactly, robots per environment, 301s for every `previousSlugs`, `noindex` only where allowed, Lighthouse SEO = 100 | `ci/build` (`seo-audit`), `nightly` (production) | Hard fail |
| **Privacy** | `dist` contains no third-party origins outside the allow-list; CSP present and strict on every tool page; every `network: none` tool completes its sample with the network blocked after load and makes zero requests during processing; analytics payloads contain only catalogue events/properties; no session-replay or ad scripts | `ci/build`, `ci/e2e` | Hard fail |
| **Licences** | Every dependency on the ADR-0008 allow-list; model registry licences | `ci/validate`, `pr-policy` diff | Hard fail |
| **Security** | Dependency audit, dependency review on lockfile changes, secret scanning | `pr-policy`, `housekeeping` | Hard fail on high severity |

### 11.3 Deployment

- **Build once, deploy the artefact:** the `dist` produced by `ci/build` is what preview, staging and production receive (production rebuilds only in `rollback`).
- Deploy tool: Cloudflare's CLI with an API token scoped to the Pages project.
- **Secrets:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `ANTHROPIC_API_KEY` (agent + reviewer workflows only). Phase 2 adds API secrets in the Worker environment, never in the repo.
- **Environments** in GitHub: `preview`, `staging`, `production`; `production` requires the founder as reviewer.

---

## 12. Future MCP, Claude, ChatGPT, Gemini and REST exposure

Nothing below is built as a product before Phase 5. What is built **now** is the part that makes it free later: the operation contract, the portable schema profile, the adapters and their snapshot tests.

### 12.1 One registry, five outputs

```
engines/*  ──descriptors──▶  generated/registry (operations + presets)
                                   │
                         packages/adapters
        ┌───────────┬──────────┬──────────┬───────────┬────────────┐
        ▼           ▼          ▼          ▼           ▼            
   MCP tools   Claude tools  OpenAI     Gemini      OpenAPI 3.1
   (tools/list) (input_schema) functions  function    (REST)
                                          declarations
```

Every adapter output is generated at build time and snapshot-tested, so a schema change that would break any provider fails CI today — years before the server exists.

### 12.2 Mapping rules

| Concern | Rule |
|---|---|
| **Tool names** | Canonical `survey.leveling.reduce@1` ⇒ `survey_leveling_reduce`; majors ≥ 2 get a suffix (`_v2`). Names use only letters, digits and underscores, ≤ 64 chars — the common subset accepted by MCP clients and the Claude, OpenAI and Gemini APIs. A uniqueness test runs in CI |
| **Arguments** | One object: `{ data: <operation input>, options: <exposed params>, preset?: <preset id enum> }`. Presets become named configurations an AI can choose ("use `survey/leveling.hi`") |
| **Descriptions** | Built from `llm.description`, `llm.whenToUse`, `llm.notFor`, plus units stated per field |
| **Examples** | 1–2 generated from golden fixtures (for providers/specs that accept examples) |
| **Results** | Structured output (MCP structured content / JSON) + a short text summary generated from `Check` results + an **"Open in MangoTools" link whose state lives in the URL fragment** (fragments are never sent to a server) |
| **Errors** | `OpError` ⇒ MCP tool error result with code and path; REST `422` with problem-details JSON |
| **Annotations** | Read-only, idempotent, non-destructive, closed-world — true for every engine operation |
| **Binaries** | MCP: embedded resources with a size cap; REST: multipart upload; providers without file support: binary operations are excluded (`acceptsBinary`) |

### 12.3 Portable schema profile (lint rule on every operation schema)

Allowed: objects with explicit properties; strings (with `enum`, `pattern`, `minLength`/`maxLength`, `format` from a short allow-list); numbers/integers with `minimum`/`maximum`; booleans; arrays with `items`, `minItems`/`maxItems`; nullable fields; discriminated unions on a literal `kind` field.
Forbidden: recursive types; transforms/preprocessing; refinements that cannot be expressed in JSON Schema (move them into the operation's validation step, which returns typed errors); open maps without value schemas; `oneOf` without a discriminator; depth > 5.
Required: a `description` on every field (AI clients depend on them) and the unit for every numeric field.
The OpenAI adapter additionally emits a strict-mode variant (all properties listed as required, optional ones made nullable, no additional properties); the Gemini adapter down-converts to the subset it accepts. Both are covered by snapshot tests.

### 12.4 Exposure policy

| `exposure` / `dataClass` | Local MCP (runs on user's machine) | Remote MCP / REST / provider tools |
|---|---|---|
| `internal` | No | No |
| `api` + public/personal | Yes | REST only |
| `mcp` + public/personal | Yes | Yes |
| any + `sensitive` | Yes | **Never** |

### 12.5 Hosting modes (Phase 5)

1. **Local MCP server** (`apps/mcp`, stdio): runs portable engines in Node on the user's machine — the privacy-consistent option and the only one allowed for sensitive operations.
2. **Remote MCP server** (Streamable HTTP on an edge worker): public/personal operations; OAuth; rate limits; entitlements from `entitlements.yaml` (`api.calls`).
3. **REST API** (`apps/api`): same handlers, OpenAPI document, API keys, metering.

### 12.6 What must be true from day one (checked by CI)

- Every operation descriptor is complete (§3.1) and passes the portable profile.
- Every `exposure ≠ internal` operation has `llm` fields.
- Every portable operation's fixtures also run in **Node**, not only in a browser worker — proving the `runtimes` claim.
- Adapter snapshots are valid against each provider's constraints.

---

## 13. Technical risks

Weaknesses found in the frozen architecture and in the plan, each with the smallest solution. None changes the product.

| # | Risk | Impact | Smallest solution |
|---|---|---|---|
| 1 | The architecture's generic tools need a text/data engine and generators, but the engine list omitted them | JSON formatter, Base64, UUID, QR would have no home and end up as one-off code | **Data engine** (§4.4) merging E5 + E6 into one package |
| 2 | "Plot engine" (E11) listed separately | A 15th engine for what is mostly rendering | `PlotSpec` IR in core + one UI component + one report renderer (§3.4) |
| 3 | Floating-point arithmetic in survey checks | Checks "fail" by 1e-13 | ADR-0003: float64, explicit tolerances everywhere, rounding only at display |
| 4 | Engines that depend on browser-only APIs cannot run on a server later | API/MCP would need rewrites | `runtimes` field + WASM codecs instead of canvas + Node fixture runs in CI (§12.6) |
| 5 | AI agents "fix" tests to match buggy code | Wrong professional results ship | Fixture immutability guard (§9.6) |
| 6 | One human reviewer is a bottleneck | Agents idle; founder burns out | Autonomy levels + path-computed auto-merge + AI pre-review (§9.8, §9.13) |
| 7 | Near-duplicate T4 variant pages | Search-quality risk from scaled content | Distinct primary keyword + content similarity < 60% check (§5.3) |
| 8 | Keyword cannibalisation between tools | Tools compete in search | `seo.primaryKeyword` must be unique (§5.2) |
| 9 | Preset inheritance becoming a hidden programming language | Unreadable behaviour, AI confusion | Depth ≤ 3, keyed maps, no formulas in YAML, build-time resolution only (§6.3–6.4) |
| 10 | Preact + headless primitive library compatibility | Accessibility bugs or rewrites | P0 spike (ADR-0004) with explicit fallback to React; decided before any UI component work |
| 11 | CSP vs framework inline scripts/styles | Either a weak CSP or broken pages | Use the framework's built-in CSP hashing if the chosen Astro version supports it; otherwise ship no inline scripts and hash any inline styles at build; CSP tested in CI |
| 12 | Licence contamination (AGPL PDF engines, LGPL image decoders, "non-commercial" data grids, libraries distributed outside npm) | Legal exposure or forced open-sourcing | ADR-0008 allow-list + CI licence check + model registry licence check |
| 13 | True PDF redaction is hard (text left under black boxes) | Privacy failure with legal consequences | No PDF-redaction claim until `pdf.redact.regions` passes a verification test: extracted text after redaction must not contain any redacted string |
| 14 | Client-side PDF "compression" is weak without heavy engines | Disappointing results on a traffic tool | Scope the tool as image re-compression inside PDFs; state expected savings in content; do not promise more |
| 15 | On-device model downloads from third-party hosts break the CSP and the privacy promise | Broken promise; slow first use in India | Self-host models on MangoTools' own asset host with SHA-256 integrity; declare the download in `networkUses` (`dataSent: none`); show size before download |
| 16 | Service-worker caching serves stale engines | Results from an old engine after a fix | Versioned precache keyed to the release; "Update available" banner; HTML never cached long; reports record versions |
| 17 | Local IndexedDB schema changes lose user data | Trust destroyed | Forward-only migrations tested against snapshots of every previous version (§4.10) |
| 18 | Encrypted sync with lost keys | Unrecoverable projects | Recovery key file at setup; local copy stays primary; sync is a backup, not the source of truth (ADR-0011) |
| 19 | Client-side entitlement bypass | Some lost revenue | Accept (as the architecture already does); signed short-lived token verified with a public key — nothing heavier |
| 20 | Binary fixtures bloating the repository | Slow clones for agents | ≤ 200 KB per binary fixture, generated fixtures preferred; move to Git LFS only if total binary fixtures exceed 50 MB |
| 21 | The domain and brand are still undecided | Blocks SEO, OG images, canonical URLs | All of them read `site.config.yaml`; changing the domain is a one-line edit plus a redirect plan |
| 22 | Payment and auth providers undecided | Blocks Phase 2 | Capabilities abstraction (`entitlements.yaml`) + ADR-0009 before M2; nothing in M0–M1 depends on it |
| 23 | Analytics could leak sensitive content | Privacy breach on PHI tools | Event catalogue with enum/number-only properties + `dataClass` guard + payload inspection in E2E |
| 24 | Static-hosting platform changes (e.g. a provider shifting from one static product to another) | Forced migration | `dist` is plain files + `_headers`/`_redirects`, which several static hosts understand; no provider-specific runtime in the static site |
| 25 | Provider tool-name and schema differences | Future adapters break | Name normalisation + portable profile + per-provider snapshots (§12.2–12.3) |

---

## 14. Bootstrap backlog (M0 → first live tool)

These issues can be created on day one, in this order. Every one is size S or M. "Human" means the founder does it or reviews it deeply.

| # | Issue | Lane | Size | Depends on | Accepted when |
|---|---|---|---|---|---|
| B01 | Workspace scaffold: pnpm workspaces, Node/pnpm pinning, Biome, TS base config, lefthook, commitlint, empty packages | platform | S | — | `pnpm verify` runs green on the empty repo |
| B02 | Add `AGENTS.md`, `CLAUDE.md`, `docs/00-index.md`, standards, glossary, playbooks, prompts from this blueprint | docs (human) | S | B01 | Files present; links resolve |
| B03 | GitHub setup: labels, issue forms, PR template, CODEOWNERS, ruleset, project board | ci (human) | S | B01 | A test issue flows Backlog → Done |
| B04 | `ci` and `pr-policy` workflows (skeleton checks) | ci | M | B01, B03 | A deliberately bad PR fails each check |
| B05 | ADRs 0001–0008 | docs (human) | S | B02 | Accepted |
| B06 | `schemas/`: site-config, taxonomy, entitlements, analytics events + JSON Schema generation + editor association | platform | M | B05 | Editors validate YAML live |
| B07 | `packages/core`: operation contract, Result/errors, context, `BinaryRef`, IR types | platform | M | B06 | Types compile; contract doc generated |
| B08 | Fixture schema + fixture runner with tolerance matching (Vitest) | platform | M | B07 | Sample fixtures pass/fail as expected |
| B09 | Registry + portable-schema lint + adapter snapshot generators | platform | M | B07 | Snapshots for a dummy operation are valid for all five targets |
| B10 | `engines/units`: quantity parse/convert/format | engine-units | M | B08 | NIST fixtures pass |
| B11 | `engines/units`: angle parse/convert/format (DMS, gon, WCB, quadrant) | engine-units | M | B10 | Textbook bearing fixtures pass |
| B12 | `engines/survey`: leveling strategies (rise & fall, HI) + arithmetic checks | engine-survey | M | B11 | ≥ 3 cited fixtures per method pass |
| B13 | `engines/survey`: misclosure, allowable misclosure, distribution | engine-survey | M | B12 | Fixtures pass incl. failing-misclosure case |
| B14 | `engines/survey`: working steps + profile `PlotSpec` | engine-survey | S | B13 | Working fixtures pass |
| B15 | Preset + manifest + content + tool-fixture schemas | platform | M | B06 | JSON Schemas generated |
| B16 | Validators and preset resolver (`scripts/validate/*`) | platform | M | B15 | Every rule in §5.3/§6.3 has a failing test case |
| B17 | Scaffolders `pnpm new:*` | platform | M | B16 | Each scaffold passes `pnpm verify` untouched (except content warnings) |
| B18 | Taxonomy files (9 categories, professions, tags, reserved slugs, synonyms) | tools (human) | S | B15 | Validation green |
| B19 | `engines/grid`: model, commands, undo/redo | engine-grid | M | B11 | Property tests pass |
| B20 | `engines/grid`: paste parsing + validation | engine-grid | M | B19 | Clipboard fixtures pass |
| B21 | UI spike: tokens + headless primitives on Preact (ADR-0004 decision) | ui | M | B01 | Dialog, menu, tabs pass axe + keyboard tests, or fallback decided |
| B22 | `packages/runtime`: state machine + worker host | platform | M | B07 | Operation runs in a worker from a test page; cancel works |
| B23 | `packages/ui`: ToolShell + archetype B | ui | M | B21, B22 | Renders a units-conversion preset end-to-end |
| B24 | `packages/ui`: archetype C (grid) with row-card mobile editor | ui | M | B20, B23 | Leveling preset usable by keyboard and on 360 px |
| B25 | `apps/web`: Astro setup, layouts, tool template, category template, home template from registry | platform | M | B23 | Pages render from generated data |
| B26 | Generators: sitemap, robots, redirects, headers/CSP, JSON-LD, OG, search index, nav, RSS | platform | M ×2 | B25 | Post-build SEO + privacy checks pass |
| B27 | Playwright: archetype smoke, axe, network-blocked run | platform | M | B25 | Suites green |
| B28 | Presets `survey/leveling.base`, `.rise-fall`, `.hi` | tools | S | B14, B16 | Samples run |
| B29 | Tools `rise-and-fall-calculator`, `height-of-instrument-calculator` (manifest, content, fixtures) | tools + content | M | B28, B26 | Acceptance for "New tool" (§9.11) |
| B30 | Deploy workflows (preview, staging, release, rollback) + Cloudflare project | ci (human secrets) | M | B26 | Preview URL comment appears; staging live |

After B30 the pattern repeats with no new infrastructure: `survey.traverse.*` operations → traverse presets and tools; `engines/data` → generic tools; `engines/privacy` → PII/PHI and Safe Paste presets and tools.

---

## Appendix A — `AGENTS.md` (root, full text)

````markdown
# AGENTS.md — MangoTools

You are working in the MangoTools monorepo: professional, privacy-first browser tools.
Read this file fully before any change. Then read docs/00-index.md and the AGENTS.md of your lane.

## What this repository is
- engines/      Pure logic packages. One engine = one lane. Public surface = operations.
- packages/     core (contract + IR types), runtime (runs tools), ui (design system), adapters (AI/API defs)
- presets/      YAML configurations of one engine operation. No formulas, no code.
- tools/        One folder per tool: manifest.yaml, content.md, fixtures/.
- taxonomy/     Categories, professions, tags, workflows, synonyms.
- content/      Guides and landing pages. content/pages/ is human-only.
- apps/web/     Astro site. Contains NO tool-specific code.
- scripts/      Validate, generate, check, scaffold, migrate, release.
- generated/    Build output. NEVER edit. NEVER commit.

## The three ways to add a tool
1. Manifest only (existing preset)      → pnpm new:tool
2. Preset + manifest (a variant)          → pnpm new:preset, then pnpm new:tool
3. Engine operation + preset + manifest   → pnpm new:operation (issue must describe the contract)

## Golden rules
1. One task = one issue = one branch = one PR = ONE LANE. Never edit two engines, or an engine and a tool, together.
2. Engines are pure: no DOM, no network, no Date/Math.random (use ctx), no console, no knowledge of plans or prices.
3. Engines return typed errors. They never throw for user input.
4. Fixtures are truth. You may ADD fixtures with a cited source. You may NEVER change expected values or tolerances in existing fixtures. If code disagrees with a fixture, the code is wrong. If you believe the fixture is wrong, STOP and explain in the issue.
5. Data files (YAML/Markdown) never contain formulas, expressions or scripts.
6. Every data shape comes from schemas/. Do not invent fields; unknown keys fail validation.
7. No new dependencies without an approved issue labelled risk:dependency. Licences: MIT, Apache-2.0, BSD, ISC, 0BSD, MPL-2.0 only.
8. Never log, store, or send user content in analytics or errors. Analytics events must exist in the catalogue.
9. Limits: file ≤ 300 lines (hard 400), function ≤ 40 lines (hard 60), complexity ≤ 10, nesting ≤ 3, no default exports, no any.
10. No utils/ or helpers/ folders. Name modules by purpose.
11. User-facing text lives in string files, never hard-coded in components.

## Commands
- pnpm verify     Run before every PR. Must be green. Paste its summary in the PR.
- pnpm dev        Local site with live generation.
- pnpm build      Full static build + post-build checks.
- pnpm new:tool | new:preset | new:operation | new:engine | new:component | new:adr

## Workflow
1. Read the issue. Confirm: type, lane, size (S or M), acceptance criteria.
2. Load: this file → docs/00-index.md → lane AGENTS.md → playbook for the task type → glossary section.
3. Branch: <type>/<issue-number>-<short-kebab-summary>
4. Scaffold with pnpm new:* when creating anything new.
5. Bugs: write the failing fixture/test FIRST, then fix.
6. Run pnpm verify. Fix everything in your scope.
7. Version: tool change → bump manifest version + changelog entry. Engine/package change → add a changeset.
8. Commit using Conventional Commits with the lane as scope: feat(engine-survey): …
9. Open the PR with the template. One PR closes exactly one issue.

## Stop and comment on the issue instead of continuing when:
- a schema, contract or public API change is needed that the issue does not describe
- the change would touch a second lane
- a fixture looks wrong or sources disagree
- a new dependency seems necessary
- the task touches auth, payments, entitlements, CSP, privacy guards or legal text
- pnpm verify fails outside your scope
- the task is bigger than size M

## Human-only paths (never edit)
AGENTS.md, CLAUDE.md, entitlements.yaml, content/pages/, docs/architecture/, accepted ADRs, .github/CODEOWNERS

## Definition of done
Acceptance criteria met · pnpm verify green · fixtures pass · docs/README updated when behaviour changes ·
version or changeset added · PR template complete.
````

**Lane `AGENTS.md` files** add: the lane's purpose; its allowed imports (§2.4); domain notes and pitfalls (e.g. for `engines/survey`: "blank ≠ zero", "change points carry both FS and BS", "angles are decimal degrees WCB at the operation boundary"); the lane's playbook links; and its specific acceptance criteria.

---

## Appendix B — Prompt templates (`docs/prompts/`)

Angle-bracket values are filled from the issue by the `agent` workflow or by the founder.

### B.1 New tool from an existing preset

````text
Role: MangoTools tools-lane agent.
Issue: #<issue-number> — <issue-title>
Goal: add the tool "<tool-name>" at /<tool-slug> using preset <preset-id>, tier <tier>, category <category-id>.

Load, in order: AGENTS.md, docs/00-index.md, tools/AGENTS.md, docs/playbooks/add-tool.md,
the resolved preset generated/presets/<preset-id>.json, and one existing tool of the same tier as a reference.

Do:
1. Branch tool/<issue-number>-<tool-slug>.
2. Run pnpm new:tool <tool-slug> --preset <preset-id> --category <category-id> --tier <tier>.
3. Complete manifest.yaml. Primary keyword: "<primary-keyword>". Respect every SEO length rule.
4. Write content.md following the §5.6 contract. The worked example must reference fixture <fixture-id>.
5. Add fixtures to the tier minimum. Each needs a real, cited source. Do not invent sources.
6. Run pnpm verify, then pnpm dev, and confirm the sample runs to completion.
7. Open a PR with the template. Closes #<issue-number>.

Do not: edit presets, engines, UI, or other tools. If the preset cannot express what the issue needs, stop and comment.
````

### B.2 New preset variant

````text
Role: MangoTools tools-lane agent.
Issue: #<issue-number>. Create preset <new-preset-id> extending <parent-preset-id>.
Required differences: <differences-from-issue> (params, visibility, units, precision, samples, import aliases).

Load: AGENTS.md, docs/playbooks/add-preset.md, the parent's resolved preset, the operation README.
Rules: keyed maps only; hide with visible:false; no formulas; depth ≤ 3; operation cannot change.
Deliver: the preset file, at least one sample that runs, at least one fixture exercising the variant,
pnpm verify green, PR. If a difference needs new behaviour, stop and describe the engine change needed.
````

### B.3 New engine operation

````text
Role: MangoTools engine-<engine> agent.
Issue: #<issue-number>. Add operation <operation-id>@<major>.
Contract from the issue: input <input-fields>, params <param-fields>, output <output-fields>, errors <error-codes>, sources <citations>.

Load: AGENTS.md, engines/<engine>/AGENTS.md, docs/playbooks/add-operation.md, packages/core contract docs,
one existing operation in this engine as a reference.

Do:
1. Branch engine/<issue-number>-<short-summary>.
2. pnpm new:operation <engine> <operation-name>.
3. Write schema.ts in the portable profile; every field has a description and unit.
4. Add golden fixtures from the cited sources FIRST (≥ 3 for survey-class operations). They must fail.
5. Implement run.ts + strategies/ + checks.ts + working.ts until all fixtures pass. Functions ≤ 40 lines.
6. Add property tests for the invariants listed in the issue.
7. Write the operation README: method, formulas, references, edge cases.
8. Add a changeset. Run pnpm verify. Confirm adapter snapshots are valid.
9. PR. Closes #<issue-number>.

Never touch another engine, a preset, or a tool in this PR.
````

### B.4 Bug fix (test-first)

````text
Role: agent for lane <lane>.
Bug: #<issue-number> — <summary>. Reproduction: <steps or input>. Expected: <expected>. Actual: <actual>.

1. Branch fix/<issue-number>-<short-summary>.
2. Add a failing fixture or test that reproduces the bug. Commit it first.
3. Fix with the smallest change in this lane only.
4. Confirm the new test passes and no existing fixture expected values changed.
5. Tool: bump version (MINOR if results change, PATCH otherwise) + changelog. Engine: add a changeset.
6. pnpm verify, PR, Closes #<issue-number>.
If the bug lives in a different lane than the issue says, stop and comment.
````

### B.5 Tool content

````text
Role: MangoTools content agent.
Tool: <tool-id>. Task: write or improve content.md.

Load: AGENTS.md, docs/standards/seo-rules.md, the tool manifest, the resolved preset, the engine operation README,
and the tool fixtures.
Follow the §5.6 contract exactly: How to use · Method · Worked example · FAQ · References.
Facts come only from the operation README, cited sources and fixtures. No invented statistics, no claims of
compliance or certification, no competitor names. Plain, precise language. Use tool:<id> references for links.
Run pnpm verify. PR.
````

### B.6 UI component

````text
Role: MangoTools ui-lane agent.
Issue: #<issue-number>. Component: <component-name> (<primitive | form & data | tool-kit | pattern | shell>).

Load: AGENTS.md, packages/ui/AGENTS.md, docs/playbooks/add-ui-component.md, design tokens, the frozen
architecture §7–§8 for this component.
Build with existing tokens and headless primitives only. Document every state (empty, filled, error,
disabled, loading) in light, dark and compact density. Add keyboard-path and axe tests.
No hard-coded strings or colours. Stay within size budgets. pnpm verify, PR.
````

### B.7 AI reviewer

````text
Role: MangoTools reviewer. You do not approve or merge. You report.
PR: #<pr-number>. Linked issue: #<issue-number>.

Check, and report each item as PASS / FAIL / N/A with file:line evidence:
1. One lane only; branch and title conventions.
2. Fixture expected values or tolerances changed? (FAIL unless risk:fixture-change is present.)
3. New dependencies or licence changes?
4. Engine purity: DOM, network, Date, Math.random, console, thrown errors for user input.
5. File/function limits, naming, no utils/helpers folders.
6. Privacy: user content in logs/analytics/errors; dataClass; CSP or network declarations.
7. Accessibility and i18n for UI changes.
8. SEO rules for tool/content changes.
9. Version bump + changelog, or changeset.
10. Acceptance criteria from the issue — each one met?
Finish with: "Blocking issues: <n>" and a short list. Be specific; do not restate the diff.
````

---

## Appendix C — GitHub templates

### C.1 `PULL_REQUEST_TEMPLATE.md` (full text)

````markdown
## What
<!-- One or two sentences. -->

Closes #

## Lane
- [ ] platform  - [ ] ui  - [ ] tools  - [ ] content  - [ ] ci  - [ ] docs  - [ ] engine-____

## Type of change
- [ ] New tool  - [ ] New preset  - [ ] Engine operation  - [ ] Bug fix  - [ ] Content  - [ ] UI  - [ ] Platform/CI

## Evidence
- `pnpm verify` summary:
- Preview URL / screenshots (UI or tool changes):
- Fixtures added (with sources):

## Checklist
- [ ] One lane only; one issue
- [ ] No fixture expected values or tolerances changed
- [ ] No new dependencies (or approved `risk:dependency`)
- [ ] Engines stay pure; typed errors
- [ ] No user content in logs/analytics; `dataClass` correct
- [ ] Tool version + changelog, or changeset added
- [ ] Docs/README/glossary updated if behaviour or vocabulary changed
- [ ] Acceptance criteria from the issue are all met
````

### C.2 Bug report form — fields

| Field | Type | Required |
|---|---|---|
| Tool or area (tool id / page URL) | text | ✅ |
| What happened | textarea | ✅ |
| What you expected (with source if it's a calculation) | textarea | ✅ |
| Input to reproduce (sample data, never real personal data) | textarea | ✅ |
| Browser and device | dropdown + text | ✅ |
| Severity | dropdown: wrong result · broken feature · cosmetic | ✅ |
| Confirmation: "I did not paste real personal or patient data" | checkbox | ✅ |

### C.3 Feature / enhancement form — fields

| Field | Type | Required |
|---|---|---|
| Problem (who, what job, what's painful) | textarea | ✅ |
| Proposed capability | textarea | ✅ |
| Affected tools or area | text | ✅ |
| Free or Pro capability (capability key if known) | dropdown | ✅ |
| Acceptance criteria | textarea (list) | ✅ |
| Lane(s) — if more than one, it will be split | checkboxes | ✅ |

### C.4 New tool form — fields

| Field | Type | Required |
|---|---|---|
| Tool name and slug | text | ✅ |
| Tier | dropdown T1–T4 | ✅ |
| Category / subcategory | dropdown | ✅ |
| Existing preset id, or "needs preset" / "needs engine operation" | text + dropdown | ✅ |
| Primary keyword (+ evidence of search demand) | text | ✅ |
| Professions | checkboxes | — |
| Sources for fixtures (citations) | textarea | ✅ for T1/T2 |
| Import/export capabilities | checkboxes | — |
| Data class | dropdown public/personal/sensitive | ✅ |

### C.5 Engine change form — fields

| Field | Type | Required |
|---|---|---|
| Engine | dropdown | ✅ |
| Operation id and major | text | ✅ |
| Kind | dropdown: new operation · new strategy/param · new error code · breaking change | ✅ |
| Input / params / output (fields, units, descriptions) | textarea | ✅ |
| Errors | textarea | ✅ |
| Sources and formulas | textarea | ✅ |
| Invariants for property tests | textarea | ✅ |
| Exposure and data class | dropdowns | ✅ |
| Presets/tools that will use it | text | ✅ |

---

## Appendix D — Glossary seed (`docs/glossary.md`)

| Term | Meaning in this repository |
|---|---|
| **Engine** | Pure-logic workspace package exposing operations |
| **Operation** | One versioned engine function with input/params/output schemas (`id@major`) |
| **Preset** | YAML configuration of one operation for one use; inherits via `extends` |
| **Manifest** | YAML description of one tool page |
| **Archetype** | One of five tool layouts: A instant transform · B calculator · C workbench grid · D file pipeline · E visual canvas |
| **Tier** | T1 workflow tool · T2 professional calculator · T3 utility · T4 variant |
| **Lane** | The single area an agent may change in one PR |
| **Fixture** | A cited input → expected output case that defines correctness |
| **Registry** | Generated JSON of all tools, presets and operations |
| **Capability / entitlement** | A permission key (e.g. `export.pdf.branded`) granted by a plan or pass |
| **Data class** | public · personal · sensitive — drives privacy rules and exposure |
| **BS / IS / FS** | Back sight / intermediate sight / fore sight staff readings (metres) |
| **BM** | Bench mark — point of known reduced level |
| **CP / TP** | Change point / turning point — a row with both FS and BS |
| **RL** | Reduced level — elevation relative to datum |
| **HI (HC)** | Height of instrument (height of collimation) = RL + BS |
| **Rise / Fall** | Positive / negative difference between consecutive staff readings |
| **Misclosure** | Difference between computed and known closing RL (leveling) or coordinates (traverse) |
| **Allowable misclosure** | Tolerance, e.g. C·√K mm where K is route length in km |
| **WCB / QB** | Whole-circle bearing (0–360°) / quadrant bearing (N 45° E) |
| **Latitude / departure** | North–south / east–west components of a traverse leg |
| **Bowditch (compass) rule** | Distributes misclosure in proportion to leg length |
| **Transit rule** | Distributes misclosure in proportion to latitude/departure magnitudes |
| **Relative precision** | Linear misclosure ÷ perimeter, written 1 : N |
| **PHI / PII** | Protected health information / personally identifiable information |
| **Safe Harbor** | HIPAA de-identification method removing 18 identifier categories |
| **Pseudonymisation** | Replacing identifiers with consistent placeholders |
| **Reversible mode** | Pseudonymisation with a local mapping so an AI reply can be re-identified on the device |
| **DPDP** | India's Digital Personal Data Protection Act 2023 and Rules 2025 |
