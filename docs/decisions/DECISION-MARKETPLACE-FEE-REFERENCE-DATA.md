# DECISION — Marketplace Fee Reference Data Architecture

| | |
|---|---|
| **Status** | Proposed (ADR-lite). Becomes the accepted decision when the founder merges it. |
| **Date** | 2026-10-09 |
| **Decided by** | Founder (on merge) |
| **Required by** | `tasks/TASK-008E-MARKETPLACE-FEE-DATA.md` § Governance (four decisions) |
| **Affects** | Where marketplace fee datasets live, how they ship in Phase 1, who resolves effective dates, and how sources are admitted. It does **not** change any code, schema, preset, tool or engine. |

Format note: the repository blueprint names `docs/adr/NNNN-title.md`, but that folder does not exist
yet; the only recorded decision follows `docs/decisions/DECISION-*.md`. This document follows the
existing pattern.

## 1. Context

TASK-008E defines the record contract for static, versioned marketplace fee data (Amazon India,
Flipkart, Meesho, Myntra) with per-record provenance and four evidence statuses. It deliberately left
four questions to an architecture decision before implementation.

What the repository already fixes:

- **Data folders are read only by `scripts/generate`; code never imports them**
  (`repository-blueprint.md` §2.4). Today's data folders are `tools/`, `presets/`, `taxonomy/` and
  `content/`; none is a reference-data home, and presets must not carry fee tables.
- **Engines are pure** (no DOM, network, clock or data-folder access) and `engines/estimate` must not
  hard-code rates (`engines/estimate/AGENTS.md`). `estimate.seller.profitability@1` receives
  already-resolved numbers and stays platform-agnostic (TASK-008B).
- **Reference data is a first-class, versioned, immutable product** with source, effective dates,
  licence and status (`platform-security-architecture.md` §3.1). Licensed data is published from a
  separate private repository (§3.4). Effective-dated lookups belong to a future `engines/reference`
  (§3.8). The Reference Data Service and private/licensed datasets are M3 (Phase-1 plan §3).
- **An existing Phase-1 pattern ships generated static data lazily:** `generated/search-index.json`
  is emitted at build time, served by `apps/web/src/pages/search-index.json.ts` as a same-origin static
  file, and fetched by `packages/runtime/src/search.ts` only when first needed. The production CSP
  allows `connect-src 'self'` only.
- **Adding an engine requires its own ADR** ("Add engine" playbook, blueprint §9) and a platform PR to
  extend the engine dependency whitelist (§2.4).

## 2. Decision

1. **Location:** a new top-level, data-only folder `reference/`, holding one sub-family per dataset
   line, starting with `reference/marketplace-fees/`.
2. **Bundling:** build-time validated YAML is emitted by `scripts/generate` as immutable, versioned JSON
   and served as same-origin static files, fetched lazily only when a user asks a tool to prefill fees —
   the existing search-index pattern.
3. **Effective-date resolution:** owned by the reference-data resolver the architecture already names,
   `engines/reference`, as a pure operation that receives the dataset as input. Creating that engine
   needs its own engine ADR; this decision does not authorize it.
4. **Source governance:** every dataset carries a source-review register; only sources the founder has
   approved may appear in a built dataset, only derived facts are stored, and licence-unclear or
   secondary-source values can never become `verified`.

Sections 3–6 give the rules.

## 3. Dataset location

```
reference/
└── marketplace-fees/
    ├── amazon-in/
    │   └── <dataset-version>.yaml     # one immutable file per published version
    ├── flipkart/
    ├── meesho/
    └── myntra/
```

- **Why a new top-level folder:** the blueprint's data folders (`tools/`, `presets/`, `taxonomy/`,
  `content/`) each have a different purpose and owner; fee tables in any of them would mix concerns
  that TASK-008E and this request forbid. The architecture already treats reference data as its own
  product, and the Phase-1 "do not create" list (`AGENTS.md` Phase 1 notes) does not include it.
  This folder is therefore a **deliberate new data family**, approved by this decision.
- **Name:** `reference/` matches the architecture's "reference data" vocabulary and the future
  `engines/reference`, so later dataset families (for example product HSN/GST tables) can sit beside
  `marketplace-fees/` without another top-level folder.
- **Rules for the folder:**
  - data only (YAML); no code, scripts, formulas or expressions (`AGENTS.md` golden rule 5);
  - never imported by code; read only by `scripts/generate` (blueprint §2.4);
  - every file validated against a schema in `schemas/` (golden rule 6);
  - one file per dataset version; published files are never edited or deleted. A rate change or
    correction is a new version file whose envelope names the version it `supersedes`
    (architecture §3.1 immutability), so historical snapshots are preserved by construction;
  - no seller-specific, account-specific or personal data, ever (TASK-008E).
- **Ownership:** schema and validation belong to the `platform` lane. Dataset content belongs to the
  `tools` lane (the existing owner of non-code data) at edit level **R — restricted**: an agent may
  propose a dataset, the founder always reviews it, and only the founder can approve a source (§6).
- **Human-only follow-up:** the blueprint's folder-governance table and `.github/CODEOWNERS` are
  human-only. The founder adds `reference/` to both (owner `tools`, level R, founder as code owner)
  before the first dataset PR. Agents must not edit those files.

## 4. Bundling strategy (Phase 1)

**Generated into a runtime-safe form and lazy-loaded from the site's own origin.**

1. `scripts/generate` loads `reference/marketplace-fees/**`, validates every file against its schema and
   the TASK-008E provenance rules plus §6 below, and fails the build on any violation.
2. It emits one JSON file per platform and dataset version, and a small index listing which versions
   are published, under `generated/` (never committed).
3. `apps/web` serves each file as a same-origin static route at a versioned path. A published
   version's URL and content never change, so it can be cached as immutable.
4. A tool that offers prefill fetches only the one platform/version file it needs, only when the user
   chooses to use marketplace fees. Nothing is fetched on page load, and a page that never uses fee
   prefill loads nothing.
5. The request URL is fixed by platform and version. It must never carry user input (price,
   category, weight, date or any seller value) in a path or query string; all matching happens in the
   browser.

What this preserves:

| Requirement | How |
|---|---|
| Local browser calculation | Resolution and profitability both run on the device; the server only serves files |
| No server dependency | Plain static files from the existing static host; no endpoint, no backend |
| Ordinary calculation needs no network | Manual entry never loads the dataset; prefill loads one same-origin static file, like any site asset, within the existing `connect-src 'self'` policy |
| Immutable versioned records | Version-per-file, never rewritten (§3) |
| Build-time validation | Generate step fails on any schema, provenance or licence-gate violation |
| Deterministic output | Same dataset version + same date + same conditions → same record |
| Small pages | Not bundled into tool JavaScript; only the platform file that is used is downloaded |

Not chosen: inlining data into tool bundles (every page pays for every platform), presets (forbidden),
and any third-party or cross-origin host (violates CSP and privacy promises).

## 5. Effective-date resolution ownership

**Owner: `engines/reference`** — a pure, deterministic engine operation that answers "which record
applies to these conditions on date D?" using the TASK-008E semantics (`effectiveFrom ≤ D ≤
effectiveTo`, inclusive; `min < value ≤ max` ranges; zero or several matches → no prefill).

Responsibility boundaries:

| Layer | Responsible for | Must not |
|---|---|---|
| `reference/` + `scripts/generate` | Holding and validating versioned records | Resolve dates at build time for a user |
| `packages/runtime` (platform) | Loading the static file and passing it, the resolution date (from the runtime clock) and the user's selected conditions to the resolver; tracking value origin (`dataset` · `user-override` · `user-entered`) | Contain matching or date logic |
| `engines/reference` | Pure resolution over a dataset passed as **input**, returning the matched record id, its numbers and provenance, or "no single match" | Read files, fetch, read the clock, or know about profitability |
| `engines/estimate` (`estimate.seller.profitability@1`) | Profit and settlement maths on already-resolved numbers | Receive or know any platform, record or date |
| Tool / UI layers | Showing source, dates, status and overrides; letting the user override | Duplicate fee tables or matching rules |

Why an engine and not the runtime: date and condition matching is calculation logic, and the platform
keeps calculation in pure engines (golden rule 2), where it is covered by golden fixtures and the
cross-browser determinism suite. The architecture already names `engines/reference` for exactly this
lookup (§3.8). Putting it in `engines/estimate` would break TASK-008B's platform-agnostic boundary.

**New engine required: YES, but not authorized here.** Before the resolver task starts, a separate
engine ADR must be accepted (playbook "Add engine"), and a platform PR must add `engines/reference` to
the engine dependency whitelist. If that ADR is declined, the fallback must be decided in that ADR,
not improvised during implementation.

Chaining a resolver result into the profitability calculation inside one tool may need a runtime or
preset capability that does not exist yet (tools currently run one operation). That is decided in the
integration task (§9 D) and may need its own platform contract.

## 6. Provenance and source governance

### 6.1 Source-review register

Each dataset version file contains a `sources` register. Every record names its source through that
register and still carries the TASK-008E per-record fields (`sourceTitle`, `sourceURL`,
`sourceAuthority`, `sourceOfficial`, `effectiveFrom`, `verifiedDate`, `status`). Each source entry
records:

- source id, title, URL or stable reference, authority, official / non-official;
- licence class from architecture §3.3: `public` · `government-open` · `licensed` ·
  `customer-provided`;
- terms review: `approved` · `pending` · `blocked`, with reviewer, date and a one-line basis
  (for example "publicly accessible official fee page; only numeric facts recorded").

### 6.2 Admission rules (enforced at build time where possible)

1. **Who approves:** only the founder may set a source's review to `approved`. Agents may add sources
   as `pending` and propose records; they may not approve. Enforcement: restricted folder with founder
   CODEOWNER review (§3), and the generate step fails if a published dataset uses a source that is not
   `approved`.
2. **What may enter the public repository and build:** only sources whose licence class is `public`
   or `government-open` and whose terms review is `approved`. `licensed` and `customer-provided` data
   never enter this repository; they wait for the M3 private publishing pipeline (architecture §3.4).
3. **What may be stored:** derived facts only — numeric rates and amounts, conditions, dates, the
   platform's official fee name, and a short source title and URL. Never copy source text, tables,
   documents, screenshots or PDFs into the repository.
4. **When uncertainty blocks inclusion:** if licence class or terms are unclear, or the source is only
   reachable behind a seller login whose terms have not been approved, the source is `pending` or
   `blocked` and **none** of its values ship — not even as `unverified`.
5. **Secondary sources** (blogs, aggregators, consultants, forums, any non-platform publisher):
   `sourceOfficial: false`. They can never support `verified` or `conditional` (TASK-008E rule 3).
   They may ship only as `unverified` reference values, and only if the source itself is `approved`
   under rules 1–4.
6. **No silent promotion:** a record moves from `unverified` to `conditional` or `verified` only in a
   new dataset version, with an official approved source and a `verifiedDate`, through a reviewed PR.
   A record whose source becomes `blocked` is removed in the next dataset version; old version files
   are kept unchanged for reproducibility but the index marks them `withdrawn`.
7. **Double entry before `verified`:** each numeric value is entered twice independently and compared
   before it may be marked `verified` (architecture §3.4). The comparison method is defined in the
   first dataset task.

This document defines the gate only. No legal or source review is performed here.

## 7. Consequences

- One new top-level data folder and one new schema family; both small and data-only.
- Profitability engine, preset and tool are untouched until the integration task.
- A small runtime fetch path is added later, reusing the search-index pattern and CSP.
- Fee data becomes reproducible: a result can name the dataset version and record it came from.
- Every dataset PR needs founder review, and every new source needs founder approval — deliberate
  friction in a liability-adjacent area.
- A second ADR (the `engines/reference` engine) is on the critical path before any prefill works.
- Phase-1 coverage depends on which official sources pass the gate; some fees will stay `user-input`.

## 8. Explicit non-goals

Not decided, designed or authorized here: actual Amazon, Flipkart, Meesho or Myntra rates; an HSN/GST
product tax database (a separate future contract under the same `reference/` family); product URL
import; live lookup; scraping; marketplace APIs; adapters; a server or backend; Firebase; authentication;
seller credentials or seller data; automatic or online refresh; Seller Profitability UI changes; the
M3 Reference Data Service, signing or encrypted caching.

## 9. Follow-up implementation tasks (none authorized by this document)

| Task | Lane | Size | Content | Depends on |
|---|---|---|---|---|
| 0 | human (founder) | S | Add `reference/` to the blueprint folder table and `.github/CODEOWNERS` | This decision |
| A | platform | M | `schemas/` dataset and record schemas with the source register; `scripts/generate` validation, TASK-008E rules and §6 gates; emitted JSON and index; versioned same-origin static route in `apps/web`; tests; an empty `reference/marketplace-fees/` structure with no rates | 0 |
| B0 | docs | S | Engine ADR for `engines/reference` (operation contract, inputs, outputs, fixtures, whitelist) | A |
| B | engine-reference (after B0 and a platform whitelist PR) | M | Pure resolver operation with golden fixtures for dates, ranges, ambiguity and no-match | B0 |
| C | tools (restricted) | S–M | First dataset for one platform, sources approved by the founder, double-entered values | A |
| D | tools / ui (and platform if chaining needs a contract) | M | Seller Profitability prefill, provenance display, user override; after TASK-008C | B, C |
| E | — | — | Optional user-authorized online refresh; needs its own ADR, much later | D |

## 10. Alternatives considered

| Alternative | Why not |
|---|---|
| Fee tables in presets | Presets configure one operation's fields; TASK-008E and this request forbid mixing fee data into them, and versioned history would be lost in preset edits |
| Under `taxonomy/` or `content/` | Wrong purpose and owner; taxonomy is categories, tags and synonyms; content is prose |
| Constants inside `engines/estimate` | Breaks the platform-agnostic engine (TASK-008B) and the "no hard-coded rates" rule |
| Data inside `engines/reference` source | Couples data releases to engine releases and violates "data folders are read only by scripts/generate" |
| Inline data in tool JavaScript bundles | Every tool page pays for every platform; no independent versioning |
| Resolver in `packages/runtime` | Puts calculation logic outside engines, outside golden fixtures and the determinism suite |
| Resolver in `engines/estimate` | Brings platform and date knowledge into the profitability engine |
| Separate private data repository now | Architecture reserves it for licensed data and the M3 pipeline; public, approved facts do not need it in Phase 1 |
| Server or API delivery | Violates Phase 1 (no backend, no server dependency) and the privacy promise |
