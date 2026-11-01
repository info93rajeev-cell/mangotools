# DECISION — Food Planner data foundation and shared-menu publication

| | |
|---|---|
| **Status** | Proposed (ADR-lite). Becomes the accepted decision when the founder merges it. |
| **Date** | 2026-11-02 |
| **Decided by** | Founder (on merge) |
| **Contract** | `tasks/TASK-FP-001-FOOD-DATA-FOUNDATION.md` |
| **Audit** | Project doc `qa/AUDIT-food-planner-business-memory-readiness.md` (2 Nov 2026) |
| **Affects** | Adds Food Planner schemas (`schemas/src/food.ts`, `food-menu.ts`), reference data (`reference/food/`) and one data test. Proposes, but does not create, the engine `engines/food`. Changes no navigation, page, preset, tool, CSP, privacy text, workflow or deployment. |

## 1. Context

The founder approved one Food Planner module with five connected sections (Recipes & Menu,
Ingredients, Shopping List, Cost Estimation, Cooking Schedule) for four event categories
(Small Party, Wedding, Corporate, Festivals). Its menus are shared and versioned, are reviewed
every 30 days using event, season, region and available trend signals, and are published
automatically after validation. Business Memory is a separate future module and is not covered
here.

The repository today is a fully static site with no backend, no database and no scheduled
jobs. Its CSP blocks runtime calls to outside hosts, and production deploys only from an
approved commit pushed to the `production` branch (`docs/phase-1/DEPLOYMENT-RUNBOOK.md` §3).

## 2. Decision

### 2.1 Data model (this PR)
- **Units.** Quantities are plain decimal strings in `g`, `kg`, `ml`, `l`, `tsp` (5 ml), `tbsp`
  (15 ml), `cup` (250 ml) or `piece`. There are three dimensions: mass, volume and count.
  Quantities are added only within one dimension, and there is no density conversion. Each
  ingredient declares its dimension, and a recipe line must use a unit of that dimension.
- **Ingredients** carry aliases, a shopping aisle, allergens (FSSAI label groups; peanut and tree
  nut kept apart), diets they are *not* suitable for (e.g. onion and garlic for Jain), and a
  `pieceNote` for count items.
- **Recipes** are versioned (semver), list servings, use **original instructions**, cite **at least
  two** published sources stating what each source was used to check, and record a verification
  status: `draft → source-checked → kitchen-tested → approved`. Only a person can set
  `kitchen-tested` or `approved`, and a test enforces this for the agent-written data.
- **Menu versions** have immutable ids `<category>-<YYYY-MM-DD>-<n>` and pin each recipe *version*.
  Each item states why it is there, using exactly one of three evidence kinds (§2.3). A version
  also records the next review date, the validation checks, and whether it fell back to the
  previous selection.
- **Saved plans** (stored on the visitor's device) pin a menu version id and their own copy of
  the recipe versions, guest count, diet, budget and prices.
- **Price references** are labelled `wholesale-reference`, `retail-reference` or `user-entered`,
  with source, market and date. They are never shown as a live store price.

### 2.2 Shared-menu publication model
1. **One published version per category at a time.** Every visitor sees the same version, and
   nothing is fetched per visitor.
2. **Immutable.** A version file is never edited after it is published. A change creates a new id
   with `supersedes` pointing at the old one, and the old one becomes `superseded`. A wrong version
   is set to `withdrawn` but **never deleted**.
3. **Saved-plan protection.** A plan resolves through its pinned version and recipe versions, which
   always remain in the repository, so a new menu never changes an existing plan. The planner
   offers "update to the current menu" only as an explicit choice.
4. **Validation before publication.** All of these must hold:
   - schema valid;
   - every recipe exists at the pinned version and is at least `source-checked`, later `approved`;
   - every `observed-trend` reason points at a recorded observation;
   - the category minimums for courses are met;
   - diet and allergen summary computed;
   - no menu-version id reused.
5. **Fallback.** If trend collection fails or yields nothing usable, the review still produces a
   new version, which keeps the previous selection, sets `fellBackToPrevious: true`, and is
   published if valid. Missing data never blanks a menu.
6. **30-day review.** Each version carries `reviewBy` = creation + 30 days.

### 2.3 Three kinds of evidence (never mixed up)

| Kind | Meaning | May be generated automatically? |
|---|---|---|
| `verified-foundation` | A checked recipe chosen as a dependable item for the category | No. Recipes are curated and checked by people |
| `seasonal` | Chosen by a stated season, occasion or region rule (e.g. cauliflower in winter) | Yes, from a written rule table, never invented |
| `observed-trend` | Linked to a collected Google Trends observation (feed URL, geo, term, traffic label, time) | Only the collector writes these; they are copied exactly, never fabricated |

Google Trends RSS is a **supporting signal**. Its "Trending now" feed lists about 10–20 current
searches; on 2 Nov 2026 the India feed had 10 items and none were about food (audit §F). A trend
can therefore only *raise* an already-verified recipe or a seasonal choice for review. It
cannot add an unverified dish or count as proof of popularity. Non-food terms are filtered out
before matching.

### 2.4 Automatic publication: the blocker, and an achievable free-first path
The approved final requirement is **automatic publication after validation**. On the current
infrastructure, three facts stand in the way:
1. There is no server. A scheduled job can run only in GitHub Actions, which is free for this
   public repository's standard runners. GitHub's docs say scheduled workflows in a public
   repository are **disabled automatically after 60 days without repository activity**.
2. The runbook allows production deploys only from a founder-approved commit pushed to
   `production`. A bot publishing by itself would contradict that rule, so it needs an explicit
   amendment.
3. CI currently cannot act as a gate (runs are cancelled at 35 minutes; PR #232 is pending).

Proposed path. Each stage is free and needs no payment details.

| Stage | How a validated menu reaches visitors | Human step |
|---|---|---|
| Prototype (now) | The scheduled collector + validator opens a PR with the new version; the founder merges | Founder merge (temporary, stated openly) |
| Final (after approval of a runbook amendment) | After validation passes, the workflow commits **only** `reference/food/menus/**` to `main`, then runs the deploy build and pushes to `production` under a narrow, documented rule: menu data paths only, all checks green, otherwise no deploy | None for routine menu updates; anything outside those paths still needs approval |

The final stage is the approved requirement. The PR stage is a prototype step and must not
quietly become permanent. The 60-day disable risk is handled because the monthly menu commit is
itself repository activity. A failed run notifies the founder and leaves the current version
live.

### 2.5 Engine (proposed, not created here)
- A pure engine `engines/food` (package `@mangotools/engine-food`, error prefix `FOOD_`), with first
  operation `food.shopping.consolidate@1`. It scales recipes by guests × servings per guest ×
  portion factor ÷ servings, adds lines per ingredient in base units, and rounds count items up
  only after adding.
- **Allowed imports: `zod` and `@mangotools/core` only.** Amended 2 Nov 2026: scaling divides by
  recipe servings (e.g. ÷ 3), which `@mangotools/engine-numeric` decimal division cannot hold
  exactly. The engine therefore keeps quantities as exact BigInt fractions, and writes a value
  rounded to 3 decimals only when it has no finite decimal, reporting it as rounded. No JavaScript
  numbers are used for quantities.
- It must reproduce `reference/food/fixtures/001-three-recipes-50-guests.yaml` unchanged. That file
  is checked today by `tests/unit/food-reference.test.ts` with an exact rational calculator, so it
  is a golden fixture from day one.
- A diet check may list conflicts or leave whole recipes out. It never removes an ingredient from
  a recipe that is still listed.
- Later operations (cost estimate, cooking schedule, menu validation) need their own task contracts.

## 3. Governance consequences
- **Import whitelist.** With only `zod` and `@mangotools/core`, no `scripts/validate/rules.ts`
  change is required (an engine missing from `ENGINE_IMPORTS` gets exactly those). An explicit
  `food: []` entry plus a rules test is proposed for clarity (platform lane, separate PR).
- **CODEOWNERS.** No change is required. The existing patterns
  `/engines/*/src/operations/*/schema.ts`, `/engines/*/src/operations/*/fixtures/` and `/reference/`
  already cover the engine's schema and fixtures and `reference/food/` (including its golden fixture).
- **Blueprint (human-only, founder).** Add `food | core` to the §2.4 engine-edge table, and `food`
  to the list of portable engines.
- **Module page.** A multi-section page conflicts with "`apps/web` contains no tool-specific code";
  it needs its own short decision before any UI task.
- **Outbound links.** Maps and YouTube links in page HTML need `ALLOWED_HOSTS` approval.
  Saved-plan storage on the device needs privacy-text review. Both are founder decisions, and not
  part of this task.

## 4. Alternatives considered

| Alternative | Why not |
|---|---|
| Fetch trends in the browser per visitor | CSP blocks it; every visitor would see a different menu; no validation step |
| Fixed party menus | Rejected by the founder: the foundation of recipes is fixed, the menus are not |
| Volume→mass density table for spices | No reliable free source per spice; volume totals are honest and still useful for shopping |
| Store menus only in a database | No backend exists; static versioned files are free, reviewable and keep old versions readable |
| Trends as the main selector | The feed is general news and sports; using it as proof would mislead visitors |
