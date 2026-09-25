# TASK-002 — PROPOSAL (not approved, do not execute)

> **Founder approval is required before any TASK-002 code is written.** This file is a proposal only.
> Once it is approved, it becomes `tasks/TASK-002.md` with the founder's changes applied.

## 1. TASK-001 status: accepted

| Item | Result |
|---|---|
| PR | [info93rajeev-cell/mangotools#1](https://github.com/info93rajeev-cell/mangotools/pull/1), merged into `main` on 2026-09-25 |
| CI | Green on **Node 24.21.0**, `ubuntu-latest` |
| `pnpm verify` | ✅ Biome, gen, typecheck, architecture checks, Vitest **193/193** |
| `pnpm build` | ✅ 12 pages, post-build checks passed |
| `pnpm test:e2e` | ✅ **155 passed, 0 failed, 0 flaky**: e2e 30 × Chromium / Firefox / WebKit, determinism × 3 browsers, a11y 36, seo 12, screenshots 14 |
| Browsers | ✅ Chromium, Firefox and WebKit |
| Still open from the TASK-001 report | Windows clean-clone run not done. Five founder questions (§8 of `tasks/TASK-001-REPORT.md`) |

## 2. Recommended next task

**Polish the accepted foundation and implement the founder-approved adjustments** (homepage
simplification, mobile search, currency, error wording). **Then** add the next small tool set, **only if
it is safe**: no new dependencies, no new engine, fixtures available.

The work is split into **two stages**. Stage B starts only after Stage A is merged and the founder has
reviewed the screenshots.

`AGENTS.md` golden rule 1 requires one lane per PR, so each item below is its own PR:

| PR | Lane | Content |
|---|---|---|
| A1 | `ui` / web | Homepage simplification per `docs/phase-1/HOMEPAGE-DIRECTION.md` |
| A2 | `ui` | Mobile search entry point in the header (a search icon below 768 px that opens the existing search) |
| A3 | `tools` | Currency decision for the Profit Margin Calculator (see §3) |
| A4 | `engine-data` | Plain-language JSON error wording |
| B1 | `tools` (preset + manifest) | Markup Calculator (preset of the existing `estimate.pricing.margin@1`) |
| B2+ | per tool | Further small tools, only if they meet the safety test in §3 |

## 3. Scope

### Stage A — polish (required)

1. **Homepage simplification (A1).** Hero with the approved headline and subheadline, a large search, the
   category cards, a one-line trust line and a simple footer. Remove the popular chips, the featured tool
   cards and the promise block. Move `RecentTools` to `/tools` (pending founder confirmation). Update
   `HOME.title` and `HOME.description`. The brand name stays **MangoTools**.
2. **Mobile search (A2).** Answers TASK-001 open question 2. The header gets a search button below 768 px
   that opens the existing `SearchBox`. Keyboard and screen-reader accessible, with focus trapped while
   open.
3. **Currency (A3).** Answers TASK-001 open question 3. **Recommended default:** the Profit Margin
   Calculator shows ₹ with Indian grouping, like the GST Calculator. Presentation only; engine values are
   unchanged. *(Founder to choose: ₹ default / currency-neutral / a selector.)*
4. **JSON error wording (A4).** Answers TASK-001 open question 1. Example: "Invalid JSON at line 3,
   column 1: expected a property name in double quotes." Engine-lane change. Existing fixtures'
   **expected values** must not change without founder approval. If a fixture asserts the old message,
   stop and ask.
5. **Housekeeping allowed in Stage A:** regenerate the screenshots, and update the tests that assert the
   removed homepage sections (for example "recent tools appear on home").

### Stage B — next small tools (only if safe)

A tool is **safe** for TASK-002 only if it needs **no new dependency, no new engine, and no change to an
existing fixture's expected values**.

| Tool (from the Phase 1 plan) | Safe now? | Reason |
|---|---|---|
| Markup Calculator | ✅ Yes | Preset only. The operation and working-step templates exist (TASK-001 report §9). Also restores `markup-calculator` in GST `graph.related` |
| UUID Generator | 🟡 Check | Needs randomness. Engines ban `Math.random`, so it must use `ctx` and be fixture-tested with a seeded context |
| Timestamp Converter | 🟡 Check | Needs "now" via `ctx`. Time-zone data must come from the platform `Intl`, which differs between browsers, so the determinism risk must be assessed |
| Hash Generator | 🟡 Check | Web Crypto is async and not available in every engine context. It must pass the determinism suite |
| CSV ↔ JSON | 🟡 Check | New `engine-data` operation plus RFC 4180 fixtures. Medium size |
| QR Code Generator | ❌ Defer | Needs a QR encoder dependency (`risk:dependency` approval) |

**Proposal:** Stage B = **Markup Calculator only**. Each 🟡 tool is added only after the founder approves
it individually. QR is deferred.

## 4. Out of scope

- Any TASK-003+ work (logistics/CBM, PDF, image, survey, privacy engines)
- Brand rename or domain change (`docs/decisions/DECISION-BRAND-BEYOND-THE-AI-TOOLS.md`)
- Auto-Lock Offline Mode, accounts, payments, entitlements
- The Guided Reply & Appointment Engine and voice
- About, Trust, Privacy and Pricing pages, analytics, deployment (TASK-008)
- New dependencies, including the Playwright upgrade from the 1.56.1 pin (can be proposed separately)
- Changing `pnpm build`'s default environment (TASK-001 open question 4, left for TASK-008)
- Changing the GST rate list (TASK-001 open question 5 needs founder confirmation only)

## 5. Acceptance checklist

**Stage A**
- [ ] The homepage contains only: hero, large search, category cards, trust line, footer
- [ ] The headline, subheadline, placeholder and trust line match `HOMEPAGE-DIRECTION.md` exactly (or
      the founder-approved placeholder variant)
- [ ] No individual tool cards or chips on the homepage. All tools are still reachable from `/tools`, the
      category pages and search
- [ ] Mobile (360 px): the header search button opens search, works by keyboard, and passes axe
- [ ] Profit Margin currency follows the founder's choice. Its fixtures pass unchanged
- [ ] The JSON error messages use plain phrases. The "Go to line/column" action still works
- [ ] Home JS stays ≤ 30 KB gzip (it should drop). Lighthouse mobile on home: Performance ≥ 90,
      Accessibility 100, SEO 100
- [ ] Screenshots regenerated and reviewed by the founder

**Stage B (if approved)**
- [ ] The Markup Calculator shows the fixture result on "Try sample", and shows working and the disclaimer
- [ ] `markup-calculator` is restored in GST `graph.related`
- [ ] No new dependencies. No existing fixture expected values changed

**Every PR**
- [ ] One lane per PR, with the PR template complete
- [ ] `pnpm verify`, `pnpm build` and `pnpm test:e2e` are green in CI on **Node 24 × Chromium / Firefox /
      WebKit**
- [ ] Every trust wording change maps to a row in `docs/phase-1/TRUST-PROMISES-AND-POLICY-RULES.md`

## 6. Estimated effort

Elapsed days for an AI coding agent with daily founder review:

| Part | Estimate |
|---|---|
| A1 Homepage simplification | 0.5–1 day |
| A2 Mobile search | 0.5 day |
| A3 Currency | 0.25 day |
| A4 JSON error wording | 0.5 day |
| B1 Markup Calculator | 0.5 day |
| Each extra 🟡 tool, if approved | 0.5–1 day each |
| **Total (Stage A + Markup)** | **≈ 2.5–3 days** |

## 7. Risks

| Risk | Mitigation |
|---|---|
| Removing homepage sections breaks the existing e2e, SEO and screenshot tests | Update the tests in the same PR as the change. Never skip or disable a test |
| Fewer homepage links weaken internal linking for SEO | Category cards and the footer still link to every hub. `/tools` lists everything. The sitemap is unchanged |
| JSON wording change collides with the fixture rule | Engine error *codes* stay the same. If a fixture pins the message text, stop and ask the founder |
| The CBM placeholder shows no results before TASK-003 | Use an interim placeholder until TASK-003 merges (see `HOMEPAGE-DIRECTION.md` §2) |
| Scope creep into more tools | The Stage B safety test in §3. Each 🟡 tool needs individual approval |
| Mobile search overlay hurts a11y (focus trap, Escape) | Keyboard spec plus axe in all three browsers |
| The trust line overclaims | Only ✅ rows of the trust map may appear in public wording |

## 8. Founder approval required before execution

Please confirm or change:

1. [ ] Stage A scope (A1–A4) is approved
2. [ ] `RecentTools` moves from the homepage to `/tools` (or: removed entirely / kept on home)
3. [ ] Search placeholder: the interim "try GST, JSON, Base64, Margin" until CBM ships (or: use the
       approved CBM wording now)
4. [ ] Profit Margin currency: ₹ + Indian grouping (or: neutral / selector)
5. [ ] JSON error wording: plain phrases as in §3.4
6. [ ] Stage B: Markup Calculator only (or: also UUID / Timestamp / Hash / CSV↔JSON)
7. [ ] The GST rate list (0, 0.25, 3, 5, 18, 40% + Custom) is confirmed as-is

**No TASK-002 code will be written until these are answered.**
