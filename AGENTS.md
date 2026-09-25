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

## Phase 1 notes (current state of the repository)
These notes adapt the rules above to Phase 1 (public beta). Where they differ, these notes apply.
- Instead of docs/00-index.md, read docs/phase-1/PHASE-1-BUILD-PLAN.md and the current task file in tasks/.
- Only `pnpm new:tool` exists. Presets, operations and engines are created by hand following
  docs/playbooks/add-tool.md and the layout of an existing engine.
- Changesets are not set up yet: record engine changes in the engine README changelog section.
- Fonts licensed OFL-1.1 are allowed in addition to the licences listed above.
- Money and percentages are decimal strings handled by engines/numeric. Never use floating point for money.
- `pnpm verify` runs `pnpm gen` before typechecking, because the web app and runtime import generated files.
- These folders are deliberately NOT created in Phase 1: apps/api, apps/extension, apps/mcp,
  packages/adapters, packages/workspace, packages/io, packages/client-platform, modules/, deploy/,
  entitlements.yaml, egress-registry.yaml, content/learn, content/for.
- legacy/prototype/ holds the old HTML prototype. Do not reuse its code.
