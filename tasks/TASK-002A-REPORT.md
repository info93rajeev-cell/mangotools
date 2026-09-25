# TASK-002A Report — Clean homepage, mobile search, ₹ margin, plain JSON errors

Plan: `tasks/TASK-002A.md` · report date 2026-09-25 · coding agent: Claude (Claude Code, cloud session)

> **Status: complete and accepted.** All four parts were merged into `main` one at a time. Each merged
> after CI passed on **Node 24.21.0** with **Chromium, Firefox and WebKit**, and the founder accepted each
> one. No Markup Calculator, no new tools, no rename, and no AI, voice, appointment, licensing or analytics
> work.

## 1. Summary

| Part | PR | Lane | Result |
|---|---|---|---|
| A1 Clean homepage | [info93rajeev-cell/mangotools#4](https://github.com/info93rajeev-cell/mangotools/pull/4) | ui | The homepage shows only the hero, large search, category cards, trust line and footer. Recent Tools moved to `/tools` |
| A2 Mobile search | [info93rajeev-cell/mangotools#5](https://github.com/info93rajeev-cell/mangotools/pull/5) | ui | Below 768 px, a header search button opens a modal search sheet that uses the existing search |
| A3 ₹ Profit Margin | [info93rajeev-cell/mangotools#6](https://github.com/info93rajeev-cell/mangotools/pull/6) | tools | Money is shown in ₹ with Indian digit grouping. Display only; engine and fixtures unchanged |
| A4 JSON errors | [info93rajeev-cell/mangotools#7](https://github.com/info93rajeev-cell/mangotools/pull/7) | engine-data | Syntax errors use plain phrases. Codes, line/column and fixtures unchanged |

Related planning PRs, documentation only: [info93rajeev-cell/mangotools#2](https://github.com/info93rajeev-cell/mangotools/pull/2)
(alignment docs and the TASK-002 proposal) and [info93rajeev-cell/mangotools#3](https://github.com/info93rajeev-cell/mangotools/pull/3)
(this task's plan).

## 2. Acceptance checklist (plan §6)

Legend: ✅ done and verified · ⏳ needs another environment · ❌ not done

**A1 — Homepage**
- ✅ The homepage shows only the hero (exact H1 and subheadline), large search, category cards, trust line
  (exact text) and footer. This is asserted by a new e2e test
- ✅ No tool chips or tool cards on the homepage. All tools are still reachable via `/tools`, the
  categories, the footer and search
- ✅ Recent Tools appear on `/tools` after visiting tools, not on `/` (e2e)
- ✅ Home title is 56 chars (≤ 60) and the description is 147 chars (120–160). Organization and WebSite
  JSON-LD are still present (SEO suite)
- ✅ Home JS is **16.0 → 14.5 KB** gzip (budget 30 KB)
- ✅ Lighthouse mobile on `/`: Performance **98**, Accessibility **100**, SEO **100** (§4)

**A2 — Mobile search**
- ✅ At 360 px the header search button shows on non-home pages and opens a working search; searching
  "json" and pressing Enter opens the JSON Formatter (e2e, all 3 browsers)
- ✅ Keyboard: open with Tab and Enter, focus lands in the input, Tab and Shift+Tab wrap, Escape closes,
  focus returns. axe is clean with the sheet open, in light and dark
- ✅ Desktop is unchanged (e2e). CLS is 0 on `/tools` and `/json-formatter` (Lighthouse). Tool page JS
  is 24.7 KB (≤ 60 KB)

**A3 — ₹ margin**
- ✅ Money outputs, inputs and working steps show ₹ with Indian grouping (`₹5,00,000.00`). A loss shows
  `−₹20.00`
- ✅ Engine and tool fixtures are unchanged and passing. The preset and tool are bumped to 0.2.0 with a
  changelog entry

**A4 — JSON errors**
- ✅ Every syntax error message uses a plain phrase (all 10 `expected` codes)
- ✅ The error code and `details.expected` are unchanged. Fixture 005 (and 011) pass **unedited**
- ✅ "Go to line/column" still moves the caret (e2e unchanged)

**Every PR**
- ✅ `pnpm verify`, `pnpm build` and `pnpm test:e2e` are green in CI on Node 24 × Chromium / Firefox /
  WebKit for #4, #5, #6 and #7 (PR runs and post-merge `main` runs)
- ✅ The PR template is complete, with the local `pnpm verify` summary and the CI results
- ✅ Screenshots were shared for A1 (home, 360 and 1366 px) and A2 (sheet closed and open, 360 px). The
  mobile screenshots in `tests/artifacts/screenshots/` show the new header button

## 3. Command results

Final state of `main` after #7 (`af0e409`).

| Command | Local (Node 24.21.0, Chromium only) | CI (Node 24.21.0, 3 browsers; #7 PR run) |
|---|---|---|
| `pnpm verify` | ✅ Biome: no errors, 1 warning (§7). gen: 5 tools, 5 presets. Architecture: 152 files, no violations. Vitest **197/197** | ✅ Vitest 197/197 |
| `pnpm build` | ✅ 12 pages, post-build checks passed | ✅ same |
| `pnpm test:e2e` | ✅ **102 passed, 0 failed** | ✅ **176 passed, 0 failed** |

The e2e runs grew during this task:

| Suite | Before (TASK-001 CI) | After (#7 CI) |
|---|---|---|
| e2e, per browser (× 3) | 30 | 36 (A1 +1 homepage, A2 +4 mobile search, A3 +1 lakh grouping) |
| determinism (× 3) | 1 | 1 |
| a11y (Chromium) | 36 | 39 (A2: keyboard +1, axe with the sheet open in light and dark +2) |
| seo, screenshots (Chromium) | 12, 14 | 12, 14 |
| **Total** | **155** | **176** |

Vitest went from 193 to 197: A3 added +1 (margin formatting) and A4 added +2 (message and phrases) plus
+1 (new engine fixture 013).

## 4. Sizes and Lighthouse

**JavaScript loaded up front** (gzip, from `pnpm build`):

| Page | TASK-001 | After TASK-002A | Budget |
|---|---|---|---|
| `/` (home) | 16.0 KB | **14.5 KB** | 30 KB |
| Largest tool page | 23.8 KB | **24.7 KB** (+0.8 KB for mobile search, +0.1 KB for placeholder text) | 60 KB |

**Lighthouse 12.8.2, mobile preset.** This is the local production build (`apps/web/dist-prod`) served by
`tests/support/serve.ts` without compression. It was run ad hoc with `npx` and is not a dependency.

| Page | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| `/` | 98 | 100 | 100 | 100 | 2.1 s | 0 ms | 0 |
| `/tools` | 97 | 100 | 100 | 100 | 2.1 s | 0 ms | 0 |
| `/json-formatter` | 95 | 100 | 100 | 100 | 2.4 s | 0 ms | 0 |

## 5. Screenshots

In `tests/artifacts/screenshots/` (regenerated by the suite; mobile 360 × 800, desktop 1366 × 768):

- `home-mobile.png`, `home-desktop.png`: the new homepage (A1)
- `*-mobile.png` for tool pages: the header search button (A2)
- `profit-margin-calculator-{mobile,desktop}.png`: the ₹ prefix on the inputs (A3)

The open mobile search sheet was captured ad hoc for PR #5 and is not stored in the repository.

## 6. What changed, by file

- **A1:** `apps/web/src/pages/index.astro`, `apps/web/src/pages/tools.astro`, `apps/web/src/lib/copy.ts`,
  `apps/web/src/lib/site.ts`, `packages/ui/src/strings/en.ts` (placeholder),
  `packages/ui/src/discovery/search.module.css` (narrow-screen placeholder size), tests
- **A2:** new `packages/ui/src/discovery/MobileSearch.tsx` and `mobile-search.module.css`, `SiteHeader.astro`,
  `SearchBox.tsx` (optional `onDismiss`), `strings/en.ts` (`search.open`, `search.close`), tests
- **A3:** `presets/estimate/pricing.margin.yaml` (`currency: INR`, 0.2.0),
  `tools/profit-margin-calculator/manifest.yaml` (0.2.0 + changelog), `content.md` (₹ in the examples),
  tests
- **A4:** new `engines/data/src/operations/json-format/expected-text.ts`, `operation.ts`
  (`details.expectedText`), `errors.ts` (template), new fixture `013-missing-colon-error.yaml`,
  `engines/data` 0.2.0 (README changelog), tests

## 7. Deviations from TASK-002A, each with its reason

1. **Branch names.** All four PRs came from the session's designated branch `claude/serene-turing-b4w1dr`,
   restarted from `main` after each merge, instead of `feat/002a-N-*`. The cloud session may only push to
   that branch. It was still one PR per part and one lane per PR.
2. **Search placeholder.** It reads "Search tools — try GST, JSON, Base64, URL", as the founder
   instructed at A1, instead of the plan's interim "… Base64, Margin". It is the shared
   `search.placeholder`, so header, `/tools` and 404 searches show it too.
3. **Smaller placeholder on narrow phones** (A1). At 360 px the full placeholder did not fit. The large
   search box's placeholder is now 14 px at ≤ 480 px and 12 px at ≤ 400 px, and the box has slightly less
   side padding there. Typed text stays 17 px, so iOS does not zoom in on focus.
4. **Home title and description wording** (A1) was written by the agent to match the approved positioning:
   "MangoTools — Tools for Work That Should Not Depend on AI".
5. **Mobile search is a native `<dialog>`** (A2). `showModal()` gives an inert page, the top layer and
   Escape handling in all three browsers. A small Tab/Shift+Tab wrap was added because Chromium otherwise
   lets focus leave to the browser toolbar. `SearchBox` gained an optional `onDismiss` so that Escape
   closes the list first and then the sheet. Other search boxes behave as before.
6. **Browser Back does not close the mobile search sheet** (A2). Supporting it needs history manipulation,
   which was left out to keep A2 small. Escape, the close button and tapping outside all work.
7. **The A4 phrase is a new detail, `expectedText`** (A4), instead of replacing `expected`. The fixture
   runner compares details as a subset, so no fixture needed editing, including the error-text exception
   the founder allowed. One new fixture (013) was added, citing RFC 8259.
8. **Left out of A4 for the one-lane rule:** the JSON Formatter tool manifest was not bumped (the message
   comes from the engine, so the tool stays 0.1.0), and the dev-only sample text on `/_dev/components`
   still shows the old wording. The plan's §3 table listed the latter.
9. **Local e2e ran on Chromium only.** Firefox and WebKit are not installed in the cloud build
   environment. CI covered all three browsers on every PR.
10. **Screenshot noise.** Regenerated desktop screenshots sometimes differ by a few bytes with no visible
    change. Unrelated ones were discarded from A3 and A4, and a few were committed in A2.
11. **Biome warning.** A2 left one unused lint-suppression comment in `MobileSearch.tsx` (a warning, not an
    error). It was not removed in A3 or A4, because those parts had to leave mobile search alone.

## 8. Open questions and suggested follow-ups (founder to decide; nothing started)

1. **Small tidy-up PR:** bump the JSON Formatter tool to 0.1.1 with a changelog line for the new messages,
   update the `/_dev/components` sample error text, and remove the unused suppression comment in
   `MobileSearch.tsx`. This is three tiny changes across two lanes, so it would be two small PRs.
2. **Mobile search and the Back button:** should Back close the sheet?
3. **Search placeholder:** switch to the approved "Search tools — try GST, JSON, CBM, Base64" when the CBM
   calculator ships in TASK-003.
4. **Footer tagline:** it still reads "Professional tools. Zero uploads." (`site.config.yaml`
   `brand.tagline`). Keep it until the brand decision, or align it with the new positioning now?
5. **Desktop category cards:** with only two categories, the cards sit left-aligned under a centred hero.
   Centre them, or leave them until more categories exist?
6. **`home.featuredProfessional`** in `site.config.yaml` is no longer read by any page. Remove it from the
   config and schema in a platform PR, or keep it for later?
7. **Still open from `tasks/TASK-002-PROPOSAL.md` §8:** confirm the GST rate list (question 7), and decide
   on Stage B (Markup Calculator, question 6). Markup was **not** started.
8. **Still open from TASK-001:** a Windows clean-clone run has not been done.
