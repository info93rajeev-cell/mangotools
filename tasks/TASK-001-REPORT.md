# TASK-001 Report — Foundation, Design System, Category System and First 5 Tools

Branch `task/001-foundation` · report date 2026-09-25 · coding agent: Claude (Cowork)

> **Status: complete in this environment, full acceptance pending CI.** Everything below was built and
> checked on Linux with **Node 22.22.2** and **Chromium only**, because Node 24 and the Firefox/WebKit
> browser builds could not be installed in the build environment (see §7.1). The repository itself still
> requires Node 24 (`.node-version`, `engines.node`), and CI (`.github/workflows/ci.yml`) runs Node 24 with
> Chromium, Firefox and WebKit. **Do not treat TASK-001 as fully accepted until that CI run (or another
> Node 24 + three-browser run) is green.**

## 1. Summary

The prototype now lives in `legacy/prototype/` and the architecture documents in `docs/architecture/`. In
their place is a pnpm monorepo with the operation contract (`packages/core`), Zod schemas (`schemas`) and
four engines: `numeric` (big.js decimals), `data` (JSON format, Base64, URL), `estimate` (GST, profit margin)
and `search` (MiniSearch). Every engine is pure and has golden fixtures: 60 of them, all passing. `pnpm gen`
validates taxonomy, presets, manifests, Markdown content and fixtures, runs every preset sample and tool
fixture through the real operations, and writes the registry, resolved presets, search index, engine loader
map and editor JSON schemas. `packages/runtime` runs operations in one module worker per engine and adds
the tool-state store, preferences and an analytics catalogue with no network calls. `packages/ui` holds the
§13 tokens, self-hosted fonts, accessible Preact primitives, layout, discovery components, the tool kit and
archetypes A (transform) and B (calculator). `apps/web` is a static Astro 7 site with the home page,
`/tools`, the Developer and Business category hubs, five tool pages and a 404 page. It has full SEO
metadata and JSON-LD, robots and sitemaps that depend on the environment, and a CSP made of per-page hashes
plus `_headers`. Post-build checks, Vitest suites and five Playwright suites cover the work, and CI is
configured.

## 2. Acceptance checklist (§20)

Legend: ✅ done and verified here · ⏳ done, but it needs CI or another environment to verify · ❌ not done

**Foundation**
- ✅ Prototype moved to `legacy/prototype/`; architecture docs in `docs/architecture/`
- ⏳ `pnpm verify`, `pnpm build` and `pnpm test:e2e` pass on a clean clone. **Linux ✅** (fresh `git clone` → `pnpm install --frozen-lockfile` → verify → build all passed; e2e passed in the working copy). **Windows not tested** (no Windows machine available here). Node 22 and Chromium only; see §7.1.
- ⏳ CI green: the workflow is configured (Node 24, all three browsers) but has not run yet. This environment has no GitHub remote or push access.
- ✅ `AGENTS.md`, `CLAUDE.md`, playbook and glossary are present
- ✅ No folders from §2's "do not create" list exist (enforced by `scripts/validate/architecture.ts`)

**Engines**
- ✅ All §11 fixtures pass (60 engine fixtures, plus 8 tool fixtures); the numeric rounding table passes
- ✅ Architecture checks pass: no forbidden APIs in engines, big.js only in `engines/numeric`, ui/web never import engines, file-length limits
- ⏳ Determinism suite: **Node = Chromium for all 60 worker-engine fixtures** (identical SHA-256 of each outcome). Firefox and WebKit run in CI.
- ✅ The JSON formatter preserves big numbers and escapes exactly; the 5 MB benchmark is in §4

**Registry**
- ✅ An invalid manifest, preset, content file or fixture fails `pnpm gen` with the file and data path (29 pipeline tests)
- ✅ The output of `pnpm new:tool` fails validation only on the TODO text left for the author (tested in `scripts/new/scaffold.test.ts`)

**Design system**
- ✅ Tokens match plan §13 exactly, in light and dark (`packages/ui/src/tokens/tokens.css`)
- ✅ `/_dev/components` shows every component and is built only when `MANGOTOOLS_ENV=development` (it is absent from the production build)
- ✅ Focus is visible on every interactive element (a global 2 px `--color-focus` ring, custom controls included); reduced motion is respected
- ✅ Fonts and icons are served from the site itself (Fontsource files bundled; lucide SVG inlined; the network test shows only same-origin requests)

**Pages**
- ✅ Home, `/tools`, `/developer`, `/business`, the 5 tool pages and 404 render correctly at 360 and 1366 px (screenshots in §6). 768 and 1920 px were spot-checked with no horizontal overflow.
- ✅ Search finds all five tools by name and by synonym, and the typo "jsn formatter" works (unit relevance test and e2e)
- ✅ Recent tools appear on home after visiting a tool, and the theme persists after reload (e2e)
- ✅ Footer and header contain no links to pages that don't exist (the e2e test requests every link)

**Tools**
- ✅ Each tool's "Try sample" gives the fixture result, and live updates work
- ✅ GST add/remove, intra/inter and custom rate all work; ₹ amounts use Indian digit grouping (₹1,18,000.00)
- ✅ Profit Margin handles all three solve modes and the loss case (−25.00%)
- ✅ Base64 and URL Swap works; the JSON error "Go to line 3, column 1" moves the caret
- ✅ Working steps are shown for GST and Profit Margin
- ✅ The disclaimer is shown on GST and Profit Margin

**SEO, privacy, performance**
- ✅ Post-build SEO checks pass; JSON-LD is present for each page type; sitemaps exist only in production builds
- ⏳ Network test: no third-party requests and no request bodies (all 5 tools pass in Chromium; Firefox/WebKit in CI)
- ✅ `_headers` is present with the CSP, and the site works under it with no CSP console errors (Chromium, production build)
- ✅ JS budgets: the heaviest tool page loads 23.8 KB compressed (budget 60 KB, worker chunk excluded); home loads 16.0 KB (budget 30 KB)
- ✅ Local Lighthouse (mobile) on home and `/gst-calculator`: Performance ≥ 90, Accessibility 100, SEO 100 (details in §4)

## 3. Command results

Run on 2026-09-25 in the build environment (Linux, Node 22.22.2, pnpm 10.28.0).

| Command | Result |
|---|---|
| `pnpm verify` | ✅ 15.3 s. Biome clean (187 files) · `pnpm gen`: 5 tools, 5 presets, 2 visible categories → 19 files · typecheck clean (root + 9 workspace packages) · architecture: 149 source files, no violations · Vitest: **15 files, 193 tests passed** |
| `pnpm build` | ✅ 5.4 s. 12 pages (development build, including `/_dev/*`) · post-build checks passed · `_headers` written |
| `pnpm test:e2e` (`PW_BROWSERS=chromium`) | ✅ 1 m 46 s. Builds `dist-prod` (production) and `dist-dev` (development); both pass post-build checks. **93 passed, 0 failed**: e2e 30 · a11y 36 · seo 12 · screenshots 14 · determinism 1 (60 fixtures) |
| Clean clone (Linux) | ✅ `git clone` → `pnpm install --frozen-lockfile` → `pnpm verify` → `pnpm build`, all green |

The Vitest suites cover: engine fixtures (60), decimal arithmetic, JSON edge cases and the benchmark,
search, tool fixtures (8, run through each tool's preset), search relevance (15 queries), the registry
pipeline (valid repository and every invalid case §17 lists), architecture rules, scaffolder, post-build
rules, runtime (worker protocol, tool store, preferences, analytics) and UI formatting and presentation.

## 4. Benchmark, bundle sizes, Lighthouse

**JSON formatter, 5 MB:** 5.15 MB formatted in **520 ms** (Node 22, Vitest benchmark in `json-format.test.ts`).

**JavaScript loaded up front** (gzip level 9, static import graph from each page's islands and module scripts; the worker and the lazily loaded search engine are excluded):

| Page | JS (gzip) | Budget |
|---|---|---|
| `/` (home) | 16.0 KB | 30 KB |
| `/tools` | 15.1 KB | — |
| `/business`, `/developer`, `/404` | 14.5 KB | — |
| Each tool page | 23.8–23.9 KB | 60 KB |

**Lighthouse 12.8.2, mobile preset**, production build served locally without compression. Lighthouse
was run ad hoc with `npx`; it is not added as a dependency.

| Page | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| `/` | 98 | 100 | 100 | 100 | 1.8 s | 0 ms | 0.009 |
| `/gst-calculator` | 95 | 100 | 100 | 100 | 2.4 s | 0 ms | 0 |
| `/json-formatter` | 98 | 100 | 100 | 100 | 1.9 s | 0 ms | 0 |

## 5. CSP approach for inline scripts

- The installed Astro (7.3.5) has built-in CSP support (`security.csp`, stable since Astro 6), so it is used: Astro computes SHA-256 hashes of its own inline hydration scripts and emits a per-page `<meta http-equiv="content-security-policy">` with `script-src 'self' 'sha256-…'`, the fixed directives from §15.6, and `style-src 'self' 'unsafe-inline'` as §15.6 requires. Setting `'unsafe-inline'` on styles tells Astro not to emit style hashes, which would otherwise disable `'unsafe-inline'`.
- A `<meta>` policy cannot carry `frame-ancestors`, so the post-build step (`scripts/check/postbuild.ts`) collects the union of every page's script hashes and writes `_headers` with the complete §15.6 policy (`… script-src 'self' <hashes> … frame-ancestors 'none'`) plus `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, long-lived caching for `/assets/*`, and `X-Robots-Tag: noindex` outside production. Header and meta therefore allow exactly the same scripts.
- There are no hand-written inline scripts. The theme bootstrap that prevents a flash of the wrong theme is an external same-origin file (`/theme-init.js`). JSON-LD blocks are data, not executable scripts.
- Post-build checks fail the build if any inline script's hash is missing from its page policy, or if `script-src` contains `'unsafe-inline'`. The SEO suite asserts the header policy is served and that pages produce no CSP console errors.
- No `'unsafe-inline'` or `'unsafe-eval'` is used for scripts, so the stop condition did not apply.

## 6. Screenshots

In `tests/artifacts/screenshots/`, taken by `tests/e2e/screenshots.spec.ts` against the production build
after "Try sample":

- `home-mobile.png`, `home-desktop.png`
- `business-mobile.png`, `business-desktop.png`
- `gst-calculator-mobile.png`, `gst-calculator-desktop.png`
- `profit-margin-calculator-mobile.png`, `profit-margin-calculator-desktop.png`
- `json-formatter-mobile.png`, `json-formatter-desktop.png`
- `base64-encode-decode-mobile.png`, `base64-encode-decode-desktop.png`
- `url-encode-decode-mobile.png`, `url-encode-decode-desktop.png`

Mobile is 360 × 800; desktop is 1366 × 768. CI uploads the same folder as the `screenshots` artifact.

## 7. Deviations from TASK-001

### 7.1 Environment limitations (as instructed)

- **Node 22 instead of Node 24 in this environment.** Node 24 could not be installed (nodejs.org is not reachable from the build sandbox). Everything was run on Node 22.22.2. The project standard is unchanged: `.node-version` is `24`, `engines.node` is `>=24` (pnpm prints an "Unsupported engine" warning locally), and CI uses Node 24.
- **Chromium only in this environment.** The Firefox and WebKit engines were unavailable. Playwright is pinned to **1.56.1**, the version that matches the preinstalled Chromium build (chromium-1194), and local runs use `PW_BROWSERS=chromium` and `PW_CHROMIUM_PATH`. `playwright.config.ts` defaults to all three browsers, and CI installs `chromium firefox webkit`.
- **Full acceptance is not claimed.** The ⏳ items in §2 need a green CI run on Node 24 with all three browsers, and a Windows clean-clone run.

### 7.2 Other deviations, each with its reason

1. **Category SEO descriptions.** The TASK §8 descriptions for `developer` (119 chars), `pdf` (118), `media` (110) and `utilities` (84) break the 120–160 rule the same task sets, so each was lengthened minimally (for example, `developer` now ends "…runs locally, in your browser.", 120 chars). Titles are unchanged.
2. **Primary-keyword check ignores punctuation.** "Base64 Encode & Decode" should satisfy the keyword "base64 encode decode", so the manifest rule compares normalised words.
3. **Preset schema additions (Phase 1 subset extended, nothing removed):** field `default` (GST starts at Add GST · intra-state · 18%); working-step templates may declare `{name:money}`, and `pnpm gen` checks every placeholder against the step's variables; the Base64 preset gained a `hexPreview` output for non-text decodes. The GST primary result uses the existing `primaryWhen` instead of two duplicate outputs.
4. **GST `graph.related` omits `markup-calculator`.** That tool does not exist until TASK-002, and the pipeline rejects references to unknown tools.
5. **References are plain-text citations with the domain** (for example "RFC 8259 … (rfc-editor.org)"). The playbook rule is no outbound links, and the content parser enforces it; tool-to-tool links use `tool:<id>`.
6. **One engine fixture was added:** `estimate/tax-gst/012-remove-18-inter` (hand-verified). No existing fixture reached the `gst.remove.igst` working step, so its template couldn't be validated. No existing expected value was changed.
7. **Complexity rule.** Biome has no cyclomatic-complexity rule, so cognitive complexity ≤ 15 is enforced as the closest equivalent to "complexity ≤ 10", along with function length ≤ 60 lines. There is no separate 40-line warning level. The Base64 and URL codecs were refactored (behaviour unchanged, all fixtures pass) to meet the limit.
8. **The architecture checks are a small custom script**, not dependency-cruiser. TASK-001 §6 specifies `scripts/validate/architecture.ts`, and the blueprint's dependency-cruiser would add a dependency outside §4.
9. **Search boxes hydrate with `client:load`.** With `client:idle`, anything typed before hydration was lost. The other islands stay idle.
10. **In the error state the tool shows the error instead of the previous result.** A dimmed stale result was ambiguous and failed axe colour contrast.
11. **Copy is tested with an in-page clipboard stub.** Clipboard permissions differ across Chromium, Firefox and WebKit. The test asserts the exact text passed to `navigator.clipboard.writeText`.
12. **Copy written by me where TASK-001 gave none:** the `/tools` title and description, 404 text, the home "promises" strip, and the Profit Margin / JSON / Base64 / URL tool copy. Page text lives in `apps/web/src/lib/copy.ts` and `packages/ui/src/strings/en.ts`, not in components.
13. **Tool titles.** With " | MangoTools" all five SEO titles would exceed 60 characters, so per §15.6 none of them carries the suffix.
14. **Description-length check** also covers `/tools`, in addition to home, categories and tools.
15. **`pnpm build` builds the `development` environment by default** (the §7 default), so `apps/web/dist` includes `/_dev/*` and is noindex. A deployable build needs `MANGOTOOLS_ENV=production` (or `pnpm build --env production`). `pnpm test:e2e` builds both variants into `apps/web/dist-prod` and `apps/web/dist-dev`.
16. **Output format** is `build.format: 'file'` (`/gst-calculator.html` served at `/gst-calculator`, as Cloudflare Pages does). Hashed assets go to `/assets/`, which is a reserved slug. `tests/support/serve.ts` mirrors this behaviour and applies `_headers`.
17. **Determinism harness input** is generated: `pnpm gen` writes `generated/determinism-fixtures.json` (engine fixtures of the engines the site loads). The browser page gets its hashes from the real module workers; the test computes the reference hashes in Node.
18. **Astro telemetry is disabled** for every build run by the repository scripts (`ASTRO_TELEMETRY_DISABLED=1`), so builds make no analytics calls.

## 8. Open questions for the founder

1. **JSON error wording.** Syntax errors currently read "Invalid JSON at line 3, column 1: expected property-name." Should the engine messages turn the expected-token names into plain phrases ("a property name in double quotes")? That is an engine-lane change.
2. **Search on mobile.** The header search is hidden below 768 px; mobile visitors search from the home page or `/tools`. Should the header get a search icon on mobile?
3. **Currency in the Profit Margin Calculator.** It is currency-neutral (international grouping, no ₹). Should it default to ₹ with Indian grouping like the GST Calculator?
4. **Default build environment.** Should `pnpm build` default to `production` once deployment is set up (TASK-008), with development builds opting in?
5. **GST rate list.** Please confirm that 0, 0.25, 3, 5, 18 and 40% (plus Custom), from the 22 September 2025 structure, is the list you want. The FAQ tells users to check official notifications for the rate of a specific item.

## 9. Suggested adjustments for TASK-002

- **Markup Calculator** can ship as a preset only: `estimate.pricing.margin@1` already supports `price-from-cost-and-markup` and `cost-from-price-and-markup`, and the working-step templates exist. Add `estimate/pricing.markup`, then restore `markup-calculator` in GST's `graph.related`.
- Settle open question 1 (JSON error wording) in the data engine lane before adding more data tools.
- Add a small mobile search entry point (open question 2) and a "results copied" affordance on archetype A.
- Once the first CI run confirms the Node 24 and three-browser baseline, upgrade Playwright from the 1.56.1 pin.
- Consider a Lighthouse CI config (the blueprint mentions `lighthouserc`) and component tests in a DOM environment. Both need approved dev dependencies.
- Raise `navigation.minToolsPerCategory` to 3 before public launch, as the site config comment notes (TASK-008).
