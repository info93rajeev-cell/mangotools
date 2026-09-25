# Homepage direction (founder-approved, post-TASK-001)

**Status:** Direction approved by the founder. **Not implemented.** Implementation is proposed as part of
TASK-002 (`tasks/TASK-002-PROPOSAL.md`) and needs founder approval first.

## 1. Principle

The homepage is **clean, beautiful, premium and simple**. It is a front door, not a catalogue and not a
SaaS marketing page.

The homepage contains **only** these five parts:

1. Clean hero
2. Large tool search
3. Business-wise / category-wise cards
4. Small trust line
5. Simple footer

Do **not**:

- show many individual tools on the homepage
- turn the homepage into a long marketing page (feature grids, testimonials, pricing blocks, FAQs)
- turn the homepage into a full catalogue

Tools belong on **`/tools`**, the **category pages** and the **tool pages**.

## 2. Approved copy

| Element | Text |
|---|---|
| Headline (H1) | **Professional tools for work that should not depend on AI.** |
| Subheadline | Search calculators, converters and business tools with clear, checkable results. No ads, no unnecessary uploads, no AI in calculations. |
| Search placeholder | Search tools — try GST, JSON, CBM, Base64 |
| Trust line | No ads · No unnecessary uploads · Deterministic results · Built for professional workflows |

Copy rules:

- All text lives in `apps/web/src/lib/copy.ts` or `packages/ui/src/strings/en.ts`, never in components
  (`AGENTS.md` golden rule 11).
- Every trust-line claim must already be true and enforced. See
  `docs/phase-1/TRUST-PROMISES-AND-POLICY-RULES.md`.
- **Placeholder caveat:** the CBM calculator arrives in TASK-003. Until it ships, "CBM" in the placeholder
  suggests a search that returns nothing. Recommendation: use "Search tools — try GST, JSON, Base64,
  Margin" until TASK-003 merges, then switch to the approved wording. *(Founder to confirm.)*

## 3. Layout

```
┌──────────────────────────────────────────────────────────┐
│ Header: logo · Tools · (search icon on mobile)           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   Professional tools for work that                       │  H1, centred, max ~18ch
│   should not depend on AI.                               │
│                                                          │
│   Search calculators, converters and business tools …    │  subheadline, muted, max ~60ch
│                                                          │
│   ┌──────────────────────────────────────────────┐       │
│   │ 🔍  Search tools — try GST, JSON, CBM, Base64 │       │  large search, ≥ 56 px tall
│   └──────────────────────────────────────────────┘       │
│                                                          │
│   ┌────────────┐ ┌────────────┐ ┌────────────┐           │
│   │ Business   │ │ Developer  │ │ Logistics  │  …        │  category cards (visible categories only)
│   └────────────┘ └────────────┘ └────────────┘           │
│                                                          │
│   No ads · No unnecessary uploads · Deterministic …      │  one small line, muted
│                                                          │
├──────────────────────────────────────────────────────────┤
│ Footer: categories · About · Privacy · Disclaimer        │  links only to pages that exist
└──────────────────────────────────────────────────────────┘
```

- Mobile (360 px): the same order and one column. Search is full width. The cards stack. No horizontal
  scroll.
- Category cards show the name, a one-line summary, an icon and a tool count. Only categories that pass
  `navigation.minToolsPerCategory` appear, as today.
- Spacing and typography use the existing tokens (`packages/ui/src/tokens/tokens.css`). No new design
  system.

## 4. Gap against the current homepage (TASK-001)

The current `apps/web/src/pages/index.astro` has:

| Current section | Direction |
|---|---|
| Hero H1 "Professional tools. Zero uploads." + lede | **Replace** with the approved headline and subheadline |
| Hero search (`SearchBox`) | **Keep**. Make it larger and use the approved placeholder |
| "Popular:" tool chips under search | **Remove** (these are individual tools on the homepage) |
| `RecentTools` (after a visit) | **Remove from home.** Recommendation: show it on `/tools` instead. *(Founder to confirm; the e2e test "recent tools appear on home" must change with it.)* |
| "Browse by category" cards | **Keep** as the main body |
| "Built for professional work" featured tool cards | **Remove** (individual tools) |
| "Processed on your device" block with three promise cards | **Replace** with the single small trust line |
| Footer | **Keep**, simple |

Related config: `site.config.yaml` `home.popular` and `home.featuredProfessional` become unused by the
homepage. Whether to keep them (for the 404 page and `/tools`) or remove them from the schema is a
TASK-002 detail.

## 5. SEO and quality guard-rails

- Keep the Organization and WebSite JSON-LD, the canonical URL and the meta description (120–160 chars).
  Update `HOME.title` and `HOME.description` to match the new positioning while the brand name stays
  MangoTools.
- The home JS budget (30 KB gzip) still applies. The change should *reduce* JS, because fewer islands
  hydrate.
- Lighthouse mobile targets: Performance ≥ 90, Accessibility 100, SEO 100.
- Screenshots (`home-mobile.png`, `home-desktop.png`) are regenerated and reviewed by the founder.

## 6. Out of scope

- Brand rename or domain change (see `docs/decisions/DECISION-BRAND-BEYOND-THE-AI-TOOLS.md`)
- New illustrations, animations, video or hero imagery
- Pricing, sign-up or account prompts on the homepage
