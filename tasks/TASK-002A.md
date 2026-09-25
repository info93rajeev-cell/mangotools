# TASK-002A — Foundation polish: clean homepage, mobile search, ₹ margin, plain JSON errors

> **Execution prompt for a coding agent.** Do not start until the founder says "execute TASK-002A".
> Source: `tasks/TASK-002-PROPOSAL.md` Stage A (merged in PR #2), `docs/phase-1/HOMEPAGE-DIRECTION.md`,
> `docs/phase-1/TRUST-PROMISES-AND-POLICY-RULES.md`, and the founder decisions below.

## 0. Read first

1. `AGENTS.md` (all golden rules apply; Phase 1 notes override where they differ)
2. `docs/phase-1/HOMEPAGE-DIRECTION.md`
3. `docs/phase-1/TRUST-PROMISES-AND-POLICY-RULES.md` §2 and §3 (only ✅ rows may appear in public wording)
4. `tasks/TASK-001-REPORT.md` §7.2 and §8 (context for the open questions this task answers)
5. `docs/playbooks/add-tool.md` (tool version and changelog rules)

## 1. Founder decisions this task implements

| # | Decision |
|---|---|
| D1 | The homepage contains only: hero, large search, category cards, a small trust line, a simple footer |
| D2 | `RecentTools` moves from the homepage to `/tools` |
| D3 | The header gets a search button on mobile (below 768 px) |
| D4 | The Profit Margin Calculator shows ₹ with Indian digit grouping, like the GST Calculator |
| D5 | JSON syntax errors use plain phrases instead of token names |
| D6 | Brand name stays **MangoTools**. There is no rename, no domain change and no Markup Calculator |

**Search placeholder (interim, from the proposal):** `Search tools — try GST, JSON, Base64, Margin`.
The approved wording `Search tools — try GST, JSON, CBM, Base64` is switched in by TASK-003, when the CBM
tool exists. If the founder instructs otherwise before execution, use their wording.

## 2. Scope: four PRs, one lane each

`AGENTS.md` golden rule 1: one PR = one lane. Work in this order, each as its own branch and PR into
`main`. Each PR must be green in CI (Node 24 × Chromium / Firefox / WebKit) before the next is opened.

| PR | Lane | Branch | Title |
|---|---|---|---|
| A1 | `ui` | `feat/002a-1-clean-homepage` | feat(ui): clean homepage and move recent tools to /tools |
| A2 | `ui` | `feat/002a-2-mobile-search` | feat(ui): header search button on mobile |
| A3 | `tools` | `feat/002a-3-margin-inr` | feat(tools): Profit Margin in ₹ with Indian grouping |
| A4 | `engine-data` | `feat/002a-4-json-plain-errors` | feat(engine-data): plain-language JSON syntax errors |

### A1 — Clean homepage (`apps/web`, `packages/ui` strings only as needed)

Files: `apps/web/src/pages/index.astro`, `apps/web/src/lib/copy.ts`, `apps/web/src/lib/site.ts`,
`apps/web/src/pages/tools.astro`, `packages/ui/src/strings/en.ts`.

1. Hero:
   - H1: `Professional tools for work that should not depend on AI.`
   - Subheadline: `Search calculators, converters and business tools with clear, checkable results. No ads, no unnecessary uploads, no AI in calculations.`
2. Large search: keep `SearchBox client:load`. Make it visually larger (≥ 56 px control height on the
   home page only, using existing tokens). Placeholder as in §1. The placeholder is a string in
   `packages/ui/src/strings/en.ts`: add a home-specific key, or change `search.placeholder` if the header
   uses the same text. Never hard-code it in a component.
3. Category cards: keep the existing "Browse by category" `CardGrid` of `CategoryCard`.
4. Trust line, one small muted line under the cards:
   `No ads · No unnecessary uploads · Deterministic results · Built for professional workflows`
5. Remove from the homepage: the "Popular:" chips, the `RecentTools` island, the "Built for professional
   work" featured tool cards, and the "Processed on your device" promise block. Remove the unused copy
   keys from `COPY.home`.
6. Move `RecentTools` to `/tools`, above the full list, with the same `data-recent-tools` hook and the
   same hydration (`client:idle`).
7. Keep `site.config.yaml` `home.popular`: the 404 page still uses it. Leave `home.featuredProfessional`
   in the config and schema (removing it is a schema change, which is out of scope). Just stop reading it
   on the homepage.
8. Update `HOME.title` and `HOME.description` in `apps/web/src/lib/site.ts` to the new positioning. The
   brand stays MangoTools. The title must be ≤ 60 chars and the description 120–160 chars; the post-build
   checks enforce both.
9. No new components, tokens, icons or images. Remove the CSS for the deleted sections.

### A2 — Mobile search button (`packages/ui`)

Files: `packages/ui/src/layout/SiteHeader.astro`, a new small island in `packages/ui/src/discovery/`
if needed, `packages/ui/src/strings/en.ts`.

1. Below 768 px, where the header search is hidden today, show an icon button labelled `Search tools`
   (a string key, with an accessible name). Use the existing `Icon` set.
2. Activating it opens the existing `SearchBox` (compact) in a panel under the header or a full-width
   overlay. Focus moves to the input. `Escape` and a close button close it, and focus returns to the
   button. Tab order is trapped while it is open.
3. It works on every page that shows the header search. On the homepage (`showSearch={false}`) do not
   show the button, because the hero search is the search.
4. No layout shift on load (CLS stays about 0). The home JS budget (≤ 30 KB gzip) and the tool page
   budget (≤ 60 KB) still hold. Tool pages may grow by at most about 1 KB.
5. Desktop (≥ 768 px) behaviour is unchanged.

### A3 — Profit Margin in ₹ with Indian grouping (`tools` lane: preset + manifest)

Files: `presets/estimate/pricing.margin.yaml`, `tools/profit-margin-calculator/manifest.yaml`,
`tools/profit-margin-calculator/content.md` (only if it shows amounts without ₹).

1. Add `currency: INR` to the `cost` and `price` money fields. This is the same mechanism the GST preset
   uses; `presetCurrency()` in `packages/ui/src/toolkit/presentation.ts` then formats every money output
   and working step with ₹ and Indian grouping.
2. The engine does not change. Engine and tool fixtures stay **byte-identical**, because they hold decimal
   strings without currency.
3. Bump the preset version (0.1.0 → 0.2.0) and the tool version (0.1.0 → 0.2.0). Add a changelog entry:
   `{ version: 0.2.0, date: <today>, type: changed, summary: "Money shown in ₹ with Indian digit grouping." }`.
4. Check the sample and the working-step templates. Any `{name:money}` placeholder now renders with ₹.
   Nothing else changes.

### A4 — Plain JSON error wording (`engine-data` lane)

Files: `engines/data/src/errors.ts`, `engines/data/src/operations/json-format/operation.ts` (and a small
phrase map next to `parse.ts`), `engines/data/README.md` (changelog section).

1. Today: `Invalid JSON at line {line}, column {column}: expected {expected}.` with raw token names
   (`property-name`, `comma-or-object-end`, …).
2. Target: the same sentence with a plain phrase. Required phrases:

   | `expected` code | Phrase |
   |---|---|
   | `value` | a value (text in quotes, a number, true, false, null, an object or an array) |
   | `property-name` | a property name in double quotes |
   | `colon` | a colon (:) after the property name |
   | `comma-or-object-end` | a comma (,) or a closing brace (}) |
   | `comma-or-array-end` | a comma (,) or a closing bracket (]) |
   | `end-of-input` | the end of the input (there is extra text after the JSON) |
   | `valid-number` | a valid number |
   | `valid-escape` | a valid escape such as \n, \" or é |
   | `closing-quote` | a closing double quote (") |
   | `valid-string-character` | a valid character (control characters must be escaped) |

   Example: `Invalid JSON at line 1, column 8: expected a property name in double quotes.`
3. **Keep the error code `DATA_JSON_SYNTAX_ERROR` and the `details.expected` code value unchanged.** The
   phrase must be added without changing any existing fixture's expected values (golden rule 4). The
   preferred approach is a new detail field (for example `expectedText`) used by the message template.
   **First check how `expectedError.details` is compared in the fixture runner**
   (`tests/unit/engine-fixtures.test.ts` and the gen pipeline). If an added detail key would make fixture
   `005-trailing-comma-error` fail without editing it, **STOP and report to the founder** with the
   options. Do not edit the fixture.
4. You may add new fixtures (with a cited source: RFC 8259) that cover more `expected` codes.
5. The "Go to line/column" action must still work (it reads `line` and `column`, not the message).
6. Record the change in the engine README changelog. Changesets are not set up yet.

## 3. Tests to update (in the same PR as the change they cover)

Never skip, disable or quarantine a test. Update assertions to the new behaviour only.

| PR | Test | Change |
|---|---|---|
| A1 | `tests/e2e/preferences.spec.ts` "recent tools appear on home…" | Rename it to "…appear on /tools…". Assert that `[data-recent-tools]` is absent on `/` and shows 2 cards (GST first) on `/tools` |
| A1 | `tests/e2e/navigation.spec.ts` | Home search and home category → category → tool still pass. Add: the homepage has no `[data-tool-card]` elements |
| A1 | `tests/seo/seo.spec.ts` | Update any assertion on the home title or description |
| A1 | `tests/e2e/screenshots.spec.ts` | Regenerate `home-mobile.png` and `home-desktop.png` |
| A1 | `tests/a11y/*` | Must stay green: heading order (one H1), contrast of the trust line |
| A2 | `tests/a11y/keyboard.spec.ts` | Add: at 360 px the header search button opens search, focus lands in the input, Escape closes it, and focus returns to the button |
| A2 | `tests/e2e/navigation.spec.ts` | Add: at 360 px on a tool page, header search for "json" opens the JSON Formatter |
| A3 | `tests/e2e/tools.spec.ts` Profit Margin | `−20.00` → `−₹20.00`, `125.00` → `₹125.00`, `160.00` → `₹160.00`. The percent results are unchanged |
| A3 | `packages/ui` presentation or format tests | Add one case: margin money output renders `₹1,18,000.00` for `118000` |
| A4 | `tests/e2e/tools.spec.ts` JSON Formatter | Keep the `/Invalid JSON at line 3, column 1/` check. Add an assertion on the plain phrase for that case |
| A4 | `engines/data` unit tests | Every `Expected` code maps to a non-empty phrase. The message renders with the phrase |
| A4 | `apps/web/src/pages/[dev]/components.astro` | Update the sample error text to the new style (dev-only page) |

## 4. Out of scope (do not do)

- Markup Calculator or any new tool, preset or operation
- Brand or domain rename. `site.config.yaml` `brand.*`, the logo, the OG images and the JSON-LD
  organization name stay unchanged
- Schema changes (including removing `home.featuredProfessional`)
- New dependencies, including the Playwright upgrade
- Changes to CSP, `_headers`, the privacy guards, analytics or legal text
- Changes to `pnpm build`'s default environment, or to the GST rate list
- Auto-Lock, accounts, the Guided Reply engine and voice (future docs only)
- Human-only paths: `AGENTS.md`, `CLAUDE.md`, `docs/architecture/`

## 5. Stop conditions (comment and wait for the founder)

- Any existing fixture's expected value would need to change (see A4 §3)
- A change would touch a second lane inside one PR
- The trust line or any copy would claim something that is not a ✅ row in the trust map
- A JS budget, the Lighthouse targets or an a11y check cannot be met without a new dependency
- `pnpm verify` fails outside this task's scope

## 6. Acceptance checklist

**A1 — Homepage**
- [ ] The homepage shows only: hero (exact H1 and subheadline), large search, category cards, trust line
      (exact text), footer
- [ ] No tool chips or tool cards on the homepage. All tools are still reachable via `/tools`, the
      categories, the footer and search
- [ ] Recent tools appear on `/tools` after visiting tools, not on `/`
- [ ] The home title and description meet the length rules. Organization and WebSite JSON-LD are still
      present
- [ ] Home JS ≤ 30 KB gzip (expected to drop). Report the before and after sizes
- [ ] Lighthouse mobile on `/`: Performance ≥ 90, Accessibility 100, SEO 100

**A2 — Mobile search**
- [ ] At 360 px the header search button is visible on non-home pages and opens a working search
- [ ] Keyboard: open, type, choose a result, Escape closes it, focus returns. axe is clean
- [ ] Desktop is unchanged. No CLS regression. Tool page JS ≤ 60 KB

**A3 — ₹ margin**
- [ ] All money outputs and working steps show ₹ with Indian grouping (for example `₹1,18,000.00`). The
      loss case shows `−₹20.00`
- [ ] Engine and tool fixtures unchanged and passing. Preset and tool version bumped with a changelog

**A4 — JSON errors**
- [ ] Every syntax error message uses a plain phrase from the table
- [ ] The error code and `details.expected` are unchanged. Fixture 005 passes **unedited**
- [ ] "Go to line/column" still moves the caret

**Every PR**
- [ ] `pnpm verify`, `pnpm build` and `pnpm test:e2e` are green in CI on Node 24 × Chromium / Firefox /
      WebKit
- [ ] The PR template is complete, with the `pnpm verify` summary pasted
- [ ] Screenshots attached for A1 and A2 (360 px and 1366 px)

## 7. Report

When all four PRs are merged, write `tasks/TASK-002A-REPORT.md` in the same shape as
`tasks/TASK-001-REPORT.md`: acceptance checklist with ✅/⏳/❌, command results, JS sizes before and after,
Lighthouse for `/`, screenshots, deviations with reasons, and open questions.

## 8. Estimated effort

A1 0.5–1 day · A2 0.5 day · A3 0.25 day · A4 0.5 day → **≈ 2–2.5 days** elapsed, with founder review
after A1 (screenshots).
