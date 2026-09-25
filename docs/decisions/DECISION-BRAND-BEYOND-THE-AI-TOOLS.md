# DECISION — Public brand: "Beyond the AI Tools"

| | |
|---|---|
| **Status** | Direction recorded by the founder. The public brand and domain are **not final**. Nothing is renamed yet. |
| **Date** | 2026-09-25 (after TASK-001 was accepted) |
| **Decided by** | Founder |
| **Affects** | Public name, domain, homepage headline, positioning copy. It does **not** affect the repository, package names or code. |

## 1. Decision

1. The internal project name stays **MangoTools**. That covers the repository, the `@mangotools/*` packages,
   `site.config.yaml` `brand.name`, the docs and the task files.
2. The public brand under consideration is **Beyond the AI Tools**.
3. The positioning line is:

   > **Professional tools for work that should not depend on AI.**

4. Candidate domains, none chosen yet:

   | Candidate | Notes |
   |---|---|
   | `tools.beyondtheai.com` | Global; a subdomain leaves the apex free for a parent brand or blog |
   | `tools.beyondtheai.in` | India-first audience (GST, ₹); matches the India-hosted control plane in the security architecture |
   | `beyondtheai.com/tools` | One origin shares domain authority with the apex. The site must be served under a path prefix, which the build does not support yet (see §4) |

5. **Do not rename the repo or code yet.** The rename happens later, in its own task, once the brand and
   domain are final.

## 2. Reason

The platform is professional tools for work that has to be **exact, checkable and repeatable**: tax,
margins, engineering and survey calculations, data transforms, and document handling. The founder wants
the brand to make it plain that these results come from deterministic engines, not from a model's
best guess.

This matches principles the approved architecture already sets:

- Engines are pure and deterministic (`AGENTS.md` golden rule 2, determinism suite in CI).
- "AI never enters the calculation path; AI output is a proposal until a user accepts it"
  (`docs/architecture/platform-security-architecture.md` §18.8.4).
- Every report states engine version, reference-data version, standard, rate source and revision (same
  document, §0.1 and §2.4).

## 3. What the brand promises, and what it does not

| The brand promises | The brand does **not** promise |
|---|---|
| No AI in calculations. The same input gives the same output. | That the company never uses AI anywhere (for example in development tooling) |
| Results you can check: working, formula, data and version | That results are certified or legally sufficient (the disclaimers still apply) |
| No ads or trackers, and no unnecessary uploads | That every future feature runs offline or without an account |

Every public claim must map to an enforced rule. See `docs/phase-1/TRUST-PROMISES-AND-POLICY-RULES.md`.

## 4. Consequences and open questions (founder to decide before any rename)

1. **Conflicts with the future AI features in the approved architecture.**
   `product-architecture.md` §10 (Phase 5 "AI & platform") and §14 (for example "Safe Paste for AI" and
   engines as an MCP server), plus security §18.8.4 (on-device OCR/NER, cloud assist), describe optional AI
   *around* the calculations. The brand "Beyond the AI" is compatible with "no AI in calculations". It would
   look contradictory if the product later shipped visible AI features. **Decision needed:** drop, rename
   or re-scope those roadmap items under the new brand. The architecture documents are human-only and are
   not edited here.
2. **The current production URL is `https://tools.mangopie.in`** (`site.config.yaml`), and the parent
   brand is `MangoPie`. The product architecture already advises against tying professional tools to the
   MangoPie retail brand (§13 critique). Choosing a new domain settles that.
3. **Path-prefix hosting (`beyondtheai.com/tools`)** would need a base path in the Astro config, in the
   post-build link checks, in the `_headers` paths and in the sitemap. The build is not designed for this
   yet; it would be a platform task.
4. **Trademark and domain checks** (India and the main export markets) must be completed before anything
   public changes.
5. **Timing.** Rename before public launch (TASK-008) so search engines do not index two brands. Changing
   domain after launch costs rankings.

## 5. What changes now

Only documentation. The homepage direction (`docs/phase-1/HOMEPAGE-DIRECTION.md`) adopts the positioning
line as the headline. That headline does not name the brand, so it works under either name.

## 6. Rename checklist (for the future rename task, not now)

- `site.config.yaml`: `brand.name`, `brand.parent`, `brand.tagline`, production `url`
- `apps/web/src/lib/site.ts` (`HOME.title`, title suffix), `apps/web/src/lib/copy.ts`
- `apps/web/src/lib/structured-data.ts` (Organization / WebSite JSON-LD)
- `assets/brand/*` (logo, favicon), `assets/og/*`
- SEO tests and post-build checks that assert the brand name or the host
- `README.md`. Also `AGENTS.md` and `CLAUDE.md`, which are human-only and need a founder edit
- Redirects from the old host if anything was ever public on it
