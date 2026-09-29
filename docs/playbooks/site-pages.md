# Playbook — site information pages (About, Privacy, Disclaimer)

These pages are **human-written**. `content/pages/` is a human-only path (`AGENTS.md`): agents may
propose text in an issue or PR description, but never create or edit files there.

## Files

| File | URL | Footer label |
|---|---|---|
| `content/pages/about.md` | `/about` | About |
| `content/pages/privacy.md` | `/privacy` | Privacy |
| `content/pages/disclaimer.md` | `/disclaimer` | Disclaimer |

Any other file name in `content/pages/` fails the build.

## Front matter

```yaml
---
title: Privacy – How BeyondTheAI Handles Your Data   # 30–60 characters
description: …                                       # 120–160 characters
heading: Privacy                                      # the page's <h1>
lastUpdated: 2026-09-30                               # YYYY-MM-DD, shown on the page
status: draft                                         # draft | approved
---
```

Write the body in Markdown, starting at `##` headings (the `<h1>` comes from `heading`).

## Publishing rules

- `status: draft` — rendered only in development and preview builds (`MANGOTOOLS_ENV=development`),
  with a "Draft for review" banner and `noindex`. Never in production.
- `status: approved` — published in production builds. The build fails if an approved page still
  contains a `[FOUNDER …]` or `[LEGAL REVIEW …]` note.
- The footer shows a link only for pages built in that environment, so a missing or draft page never
  produces a broken or premature link.
- Pages are not listed in the sitemap (the Round 1 sitemap is home, `/tools`, categories and tools).

Implementation: `schemas/src/page.ts` (front matter and selection rules, unit-tested),
`apps/web/src/lib/pages.ts`, `apps/web/src/components/SitePage.astro`.
