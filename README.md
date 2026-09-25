# MangoTools

Professional browser tools that run entirely on your device. Phase 1 public beta.

## Requirements

- Node.js 24 (see `.node-version`)
- pnpm 10 (`corepack enable` activates the version pinned in `package.json`)

## Commands

| Command | What it does |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Generate the registry and start the Astro dev server on http://localhost:4321 |
| `pnpm gen` | Validate taxonomy, presets, manifests, content and fixtures; write `generated/` |
| `pnpm verify` | Lint, generate, typecheck, architecture checks and unit/fixture tests |
| `pnpm build` | Generate, build the static site into `apps/web/dist`, run post-build checks |
| `pnpm preview` | Serve `apps/web/dist` with the production headers |
| `pnpm test:e2e` | Build production + test sites and run Playwright suites |
| `pnpm new:tool <slug> --preset <id> --category <id> --tier <T1-T4> --archetype <A-E>` | Scaffold a tool |

Set `MANGOTOOLS_ENV=production` for an indexable production build (default: `development`).

## Where things live

Read `AGENTS.md` first. Architecture documents are in `docs/architecture/`, the Phase 1 plan in
`docs/phase-1/`, and task files in `tasks/`.
